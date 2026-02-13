const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { ngoOnly } = require('../middleware/roleGuards');
const { sendDeliveryAlert, sendCompletionNotice } = require('../services/notificationService');

/**
 * POST /api/deliveries
 * Assign volunteer to delivery (NGO only)
 */
router.post('/', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { claim_id, volunteer_id } = req.body;

    if (!claim_id) {
      return res.status(400).json({
        error: 'Missing required field: claim_id'
      });
    }

    // Get ngo_id
    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id, ngo_name')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    // Verify claim ownership
    const { data: claim } = await supabaseAdmin
      .from('ngo_claims')
      .select('*')
      .eq('claim_id', claim_id)
      .eq('ngo_id', ngo.ngo_id)
      .single();

    if (!claim) {
      return res.status(404).json({
        error: 'Claim not found or access denied'
      });
    }

    // Check if delivery already exists
    const { data: existing } = await supabaseAdmin
      .from('deliveries')
      .select('delivery_id')
      .eq('claim_id', claim_id)
      .single();

    if (existing) {
      return res.status(409).json({
        error: 'Delivery already assigned for this claim'
      });
    }

    // If volunteer_id provided, verify it belongs to the NGO
    if (volunteer_id) {
      const { data: volunteer } = await supabaseAdmin
        .from('volunteers')
        .select('volunteer_id, full_name')
        .eq('volunteer_id', volunteer_id)
        .eq('ngo_id', ngo.ngo_id)
        .single();

      if (!volunteer) {
        return res.status(404).json({
          error: 'Volunteer not found or does not belong to your NGO'
        });
      }
    }

    // Create delivery
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .insert({
        claim_id,
        volunteer_id: volunteer_id || null,
        delivery_status: 'assigned'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create delivery',
        message: error.message
      });
    }

    // Send notification
    if (volunteer_id) {
      const { data: volunteer } = await supabaseAdmin
        .from('volunteers')
        .select('full_name')
        .eq('volunteer_id', volunteer_id)
        .single();

      sendDeliveryAlert(req.user.phone, volunteer.full_name, 'assigned').catch(err => {
        console.error('Failed to send delivery alert:', err);
      });
    }

    res.status(201).json({
      message: 'Delivery assigned successfully',
      delivery
    });

  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({
      error: 'Failed to create delivery',
      message: error.message
    });
  }
});

/**
 * GET /api/deliveries/my
 * Get NGO's deliveries
 */
router.get('/my', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { status } = req.query;

    // Get ngo_id
    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    let query = supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        volunteers (
          full_name,
          phone,
          vehicle_type
        ),
        ngo_claims!inner (
          ngo_id,
          listing_id,
          food_listings (
            food_type,
            quantity_kg,
            pickup_address,
            latitude,
            longitude,
            donors (
              profiles (
                organization_name,
                phone
              )
            )
          )
        )
      `)
      .eq('ngo_claims.ngo_id', ngo.ngo_id);

    if (status) {
      query = query.eq('delivery_status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: deliveries, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch deliveries',
        message: error.message
      });
    }

    res.json({
      deliveries,
      count: deliveries.length
    });

  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: error.message
    });
  }
});

/**
 * GET /api/deliveries/:delivery_id
 * Get specific delivery details
 */
router.get('/:delivery_id', authenticateUser, async (req, res) => {
  try {
    const { delivery_id } = req.params;

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        volunteers (
          full_name,
          phone,
          vehicle_type
        ),
        ngo_claims (
          *,
          ngos (
            ngo_name,
            contact_person
          ),
          food_listings (
            *,
            donors (
              profiles (
                organization_name,
                phone
              )
            )
          )
        )
      `)
      .eq('delivery_id', delivery_id)
      .single();

    if (error || !delivery) {
      return res.status(404).json({
        error: 'Delivery not found'
      });
    }

    res.json({
      delivery
    });

  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      error: 'Failed to get delivery',
      message: error.message
    });
  }
});

/**
 * PUT /api/deliveries/:delivery_id/status
 * Update delivery status
 */
router.put('/:delivery_id/status', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { delivery_id } = req.params;
    const { status, pickup_time, delivery_time, proof_image_url } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Missing required field: status'
      });
    }

    // Validate status
    const validStatuses = ['assigned', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }

    // Get ngo_id
    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    // Verify ownership
    const { data: existingDelivery } = await supabaseAdmin
      .from('deliveries')
      .select(`
        delivery_id,
        ngo_claims!inner (
          ngo_id,
          food_listings (
            food_type,
            quantity_kg,
            meal_equivalent
          )
        )
      `)
      .eq('delivery_id', delivery_id)
      .eq('ngo_claims.ngo_id', ngo.ngo_id)
      .single();

    if (!existingDelivery) {
      return res.status(404).json({
        error: 'Delivery not found or access denied'
      });
    }

    const updates = {
      delivery_status: status
    };

    if (pickup_time) updates.pickup_time = pickup_time;
    if (delivery_time) updates.delivery_time = delivery_time;
    if (proof_image_url) updates.proof_image_url = proof_image_url;

    // Auto-set times based on status
    if (status === 'in_transit' && !pickup_time) {
      updates.pickup_time = new Date().toISOString();
    }
    if (status === 'delivered' && !delivery_time) {
      updates.delivery_time = new Date().toISOString();
    }

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update(updates)
      .eq('delivery_id', delivery_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update delivery status',
        message: error.message
      });
    }

    // Send notifications
    if (status === 'delivered') {
      const listing = existingDelivery.ngo_claims.food_listings;
      
      // Calculate CO2 for notification
      const co2Reduced = parseFloat(listing.quantity_kg) * 2.5;
      
      sendCompletionNotice(
        req.user.phone,
        listing.meal_equivalent,
        co2Reduced
      ).catch(err => {
        console.error('Failed to send completion notice:', err);
      });
    }

    res.json({
      message: 'Delivery status updated successfully',
      delivery
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      error: 'Failed to update delivery status',
      message: error.message
    });
  }
});

/**
 * PUT /api/deliveries/:delivery_id/assign
 * Reassign volunteer
 */
router.put('/:delivery_id/assign', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { delivery_id } = req.params;
    const { volunteer_id } = req.body;

    if (!volunteer_id) {
      return res.status(400).json({
        error: 'Missing required field: volunteer_id'
      });
    }

    // Get ngo_id
    const { data: ngo } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!ngo) {
      return res.status(404).json({
        error: 'NGO profile not found'
      });
    }

    // Verify volunteer belongs to NGO
    const { data: volunteer } = await supabaseAdmin
      .from('volunteers')
      .select('volunteer_id, full_name')
      .eq('volunteer_id', volunteer_id)
      .eq('ngo_id', ngo.ngo_id)
      .single();

    if (!volunteer) {
      return res.status(404).json({
        error: 'Volunteer not found or does not belong to your NGO'
      });
    }

    // Update delivery
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update({
        volunteer_id
      })
      .eq('delivery_id', delivery_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to reassign volunteer',
        message: error.message
      });
    }

    res.json({
      message: 'Volunteer reassigned successfully',
      delivery
    });

  } catch (error) {
    console.error('Reassign volunteer error:', error);
    res.status(500).json({
      error: 'Failed to reassign volunteer',
      message: error.message
    });
  }
});

module.exports = router;