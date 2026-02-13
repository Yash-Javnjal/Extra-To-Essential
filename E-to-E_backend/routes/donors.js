const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { donorOnly } = require('../middleware/roleGuards');
const { getDonorImpact } = require('../services/impactService');

/**
 * POST /api/donors
 * Create donor profile (requires authenticated donor user)
 */
router.post('/', authenticateUser, donorOnly, async (req, res) => {
  try {
    const {
      business_type,
      address,
      city,
      latitude,
      longitude,
      csr_participant
    } = req.body;

    // Validation
    if (!address || !city || !latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['address', 'city', 'latitude', 'longitude']
      });
    }

    // Check if donor profile already exists
    const { data: existing } = await supabaseAdmin
      .from('donors')
      .select('donor_id')
      .eq('profile_id', req.user.id)
      .single();

    if (existing) {
      return res.status(409).json({
        error: 'Donor profile already exists',
        donor_id: existing.donor_id
      });
    }

    // Create donor profile
    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .insert({
        profile_id: req.user.id,
        business_type,
        address,
        city,
        latitude,
        longitude,
        csr_participant: csr_participant || false,
        verification_status: false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create donor profile',
        message: error.message
      });
    }

    res.status(201).json({
      message: 'Donor profile created successfully',
      donor
    });

  } catch (error) {
    console.error('Create donor error:', error);
    res.status(500).json({
      error: 'Failed to create donor profile',
      message: error.message
    });
  }
});

/**
 * GET /api/donors/me
 * Get current donor's profile
 */
router.get('/me', authenticateUser, donorOnly, async (req, res) => {
  try {
    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone,
          organization_name
        )
      `)
      .eq('profile_id', req.user.id)
      .single();

    if (error || !donor) {
      return res.status(404).json({
        error: 'Donor profile not found'
      });
    }

    res.json({
      donor
    });

  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({
      error: 'Failed to get donor profile',
      message: error.message
    });
  }
});

/**
 * PUT /api/donors/me
 * Update current donor's profile
 */
router.put('/me', authenticateUser, donorOnly, async (req, res) => {
  try {
    const {
      business_type,
      address,
      city,
      latitude,
      longitude,
      csr_participant
    } = req.body;

    const updates = {};
    if (business_type !== undefined) updates.business_type = business_type;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (csr_participant !== undefined) updates.csr_participant = csr_participant;

    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .update(updates)
      .eq('profile_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update donor profile',
        message: error.message
      });
    }

    res.json({
      message: 'Donor profile updated successfully',
      donor
    });

  } catch (error) {
    console.error('Update donor error:', error);
    res.status(500).json({
      error: 'Failed to update donor profile',
      message: error.message
    });
  }
});

/**
 * GET /api/donors/me/impact
 * Get donor's impact metrics
 */
router.get('/me/impact', authenticateUser, donorOnly, async (req, res) => {
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

    const result = await getDonorImpact(donor.donor_id);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get impact metrics',
        message: result.error
      });
    }

    res.json({
      impact: result.impact
    });

  } catch (error) {
    console.error('Get donor impact error:', error);
    res.status(500).json({
      error: 'Failed to get impact metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/donors/:donor_id
 * Get specific donor (admin/public view)
 */
router.get('/:donor_id', async (req, res) => {
  try {
    const { donor_id } = req.params;

    const { data: donor, error } = await supabaseAdmin
      .from('donors')
      .select(`
        donor_id,
        business_type,
        city,
        verification_status,
        profiles (
          organization_name
        )
      `)
      .eq('donor_id', donor_id)
      .single();

    if (error || !donor) {
      return res.status(404).json({
        error: 'Donor not found'
      });
    }

    res.json({
      donor
    });

  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({
      error: 'Failed to get donor',
      message: error.message
    });
  }
});

/**
 * GET /api/donors
 * List all verified donors
 */
router.get('/', async (req, res) => {
  try {
    const { city, verified } = req.query;

    let query = supabaseAdmin
      .from('donors')
      .select(`
        donor_id,
        business_type,
        city,
        verification_status,
        created_at,
        profiles (
          organization_name
        )
      `);

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (verified !== undefined) {
      query = query.eq('verification_status', verified === 'true');
    }

    query = query.order('created_at', { ascending: false });

    const { data: donors, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch donors',
        message: error.message
      });
    }

    res.json({
      donors,
      count: donors.length
    });

  } catch (error) {
    console.error('List donors error:', error);
    res.status(500).json({
      error: 'Failed to list donors',
      message: error.message
    });
  }
});

module.exports = router;