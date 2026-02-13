const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { donorOnly, ngoOnly } = require('../middleware/roleGuards');
const { getAvailableListingsForNGO } = require('../services/geoMatchService');
const { notifyNearbyNGOs } = require('../services/geoMatchService');

/**
 * POST /api/listings
 * Create food listing (donor only)
 */
router.post('/', authenticateUser, donorOnly, async (req, res) => {
  try {
    const {
      food_type,
      quantity_kg,
      meal_equivalent,
      expiry_time,
      pickup_address,
      latitude,
      longitude
    } = req.body;

    // Validation
    if (!food_type || !quantity_kg || !meal_equivalent || !expiry_time || !pickup_address || !latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['food_type', 'quantity_kg', 'meal_equivalent', 'expiry_time', 'pickup_address', 'latitude', 'longitude']
      });
    }

    // Get donor_id
    const { data: donor } = await supabaseAdmin
      .from('donors')
      .select('donor_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({
        error: 'Donor profile not found',
        message: 'Please create a donor profile first'
      });
    }

    // Create listing
    const { data: listing, error } = await supabaseAdmin
      .from('food_listings')
      .insert({
        donor_id: donor.donor_id,
        food_type,
        quantity_kg,
        meal_equivalent,
        expiry_time,
        pickup_address,
        latitude,
        longitude,
        status: 'open',
        is_locked: false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create listing',
        message: error.message
      });
    }

    // Notify nearby NGOs asynchronously
    notifyNearbyNGOs(listing.listing_id).catch(err => {
      console.error('Failed to notify NGOs:', err);
    });

    res.status(201).json({
      message: 'Food listing created successfully',
      listing
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      error: 'Failed to create listing',
      message: error.message
    });
  }
});

/**
 * GET /api/listings
 * Get all open listings or NGO-specific listings
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status, city } = req.query;

    // If NGO, get listings within service radius
    if (req.user.role === 'ngo') {
      const { data: ngo } = await supabaseAdmin
        .from('ngos')
        .select('ngo_id')
        .eq('profile_id', req.user.id)
        .single();

      if (ngo) {
        const result = await getAvailableListingsForNGO(ngo.ngo_id);
        
        if (!result.success) {
          return res.status(500).json({
            error: 'Failed to fetch listings',
            message: result.error
          });
        }

        return res.json({
          listings: result.listings,
          count: result.count
        });
      }
    }

    // For donors and general queries
    let query = supabaseAdmin
      .from('food_listings')
      .select(`
        *,
        donors!inner (
          donor_id,
          city,
          profiles (
            organization_name,
            phone
          )
        )
      `);

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['open', 'in_discussion']);
    }

    if (city) {
      query = query.eq('donors.city', city);
    }

    query = query.order('created_at', { ascending: false });

    const { data: listings, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch listings',
        message: error.message
      });
    }

    res.json({
      listings,
      count: listings.length
    });

  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      error: 'Failed to get listings',
      message: error.message
    });
  }
});

/**
 * GET /api/listings/my
 * Get donor's own listings
 */
router.get('/my', authenticateUser, donorOnly, async (req, res) => {
  try {
    // Get donor_id
    const { data: donor } = await supabaseAdmin
      .from('donors')
      .select('donor_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({
        error: 'Donor profile not found'
      });
    }

    const { data: listings, error } = await supabaseAdmin
      .from('food_listings')
      .select('*')
      .eq('donor_id', donor.donor_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch listings',
        message: error.message
      });
    }

    res.json({
      listings,
      count: listings.length
    });

  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      error: 'Failed to get listings',
      message: error.message
    });
  }
});

/**
 * GET /api/listings/:listing_id
 * Get specific listing details
 */
router.get('/:listing_id', async (req, res) => {
  try {
    const { listing_id } = req.params;

    const { data: listing, error } = await supabaseAdmin
      .from('food_listings')
      .select(`
        *,
        donors (
          donor_id,
          city,
          profiles (
            organization_name,
            phone
          )
        )
      `)
      .eq('listing_id', listing_id)
      .single();

    if (error || !listing) {
      return res.status(404).json({
        error: 'Listing not found'
      });
    }

    res.json({
      listing
    });

  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      error: 'Failed to get listing',
      message: error.message
    });
  }
});

/**
 * PUT /api/listings/:listing_id
 * Update listing (donor only, only if not claimed)
 */
router.put('/:listing_id', authenticateUser, donorOnly, async (req, res) => {
  try {
    const { listing_id } = req.params;
    const {
      food_type,
      quantity_kg,
      meal_equivalent,
      expiry_time,
      pickup_address,
      latitude,
      longitude
    } = req.body;

    // Get donor_id
    const { data: donor } = await supabaseAdmin
      .from('donors')
      .select('donor_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({
        error: 'Donor profile not found'
      });
    }

    // Check if listing exists and belongs to donor
    const { data: existing } = await supabaseAdmin
      .from('food_listings')
      .select('status, is_locked')
      .eq('listing_id', listing_id)
      .eq('donor_id', donor.donor_id)
      .single();

    if (!existing) {
      return res.status(404).json({
        error: 'Listing not found or access denied'
      });
    }

    if (existing.is_locked || !['open', 'in_discussion'].includes(existing.status)) {
      return res.status(403).json({
        error: 'Cannot update claimed or completed listing'
      });
    }

    const updates = {};
    if (food_type !== undefined) updates.food_type = food_type;
    if (quantity_kg !== undefined) updates.quantity_kg = quantity_kg;
    if (meal_equivalent !== undefined) updates.meal_equivalent = meal_equivalent;
    if (expiry_time !== undefined) updates.expiry_time = expiry_time;
    if (pickup_address !== undefined) updates.pickup_address = pickup_address;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;

    const { data: listing, error } = await supabaseAdmin
      .from('food_listings')
      .update(updates)
      .eq('listing_id', listing_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update listing',
        message: error.message
      });
    }

    res.json({
      message: 'Listing updated successfully',
      listing
    });

  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      error: 'Failed to update listing',
      message: error.message
    });
  }
});

/**
 * DELETE /api/listings/:listing_id
 * Delete listing (donor only, only if not claimed)
 */
router.delete('/:listing_id', authenticateUser, donorOnly, async (req, res) => {
  try {
    const { listing_id } = req.params;

    // Get donor_id
    const { data: donor } = await supabaseAdmin
      .from('donors')
      .select('donor_id')
      .eq('profile_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({
        error: 'Donor profile not found'
      });
    }

    // Check if listing can be deleted
    const { data: existing } = await supabaseAdmin
      .from('food_listings')
      .select('status, is_locked')
      .eq('listing_id', listing_id)
      .eq('donor_id', donor.donor_id)
      .single();

    if (!existing) {
      return res.status(404).json({
        error: 'Listing not found or access denied'
      });
    }

    if (existing.is_locked || !['open', 'in_discussion'].includes(existing.status)) {
      return res.status(403).json({
        error: 'Cannot delete claimed or completed listing'
      });
    }

    const { error } = await supabaseAdmin
      .from('food_listings')
      .delete()
      .eq('listing_id', listing_id);

    if (error) {
      return res.status(500).json({
        error: 'Failed to delete listing',
        message: error.message
      });
    }

    res.json({
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      error: 'Failed to delete listing',
      message: error.message
    });
  }
});

module.exports = router;