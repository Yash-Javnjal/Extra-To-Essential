const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');
const { authenticateUser } = require('../middleware/authMiddleware');
const { ngoOnly } = require('../middleware/roleGuards');
const { sendClaimAlert } = require('../services/notificationService');

/**
 * POST /api/claims
 * Claim a food listing (NGO only)
 */
router.post('/', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { listing_id, pickup_scheduled_time, strategy_notes } = req.body;
    console.log('[CLAIMS] POST /api/claims - Body:', JSON.stringify(req.body));

    if (!listing_id) {
      return res.status(400).json({ error: 'Missing required field: listing_id' });
    }

    // Get ngo_id
    const { data: ngo, error: ngoErr } = await supabaseAdmin
      .from('ngos')
      .select('ngo_id, ngo_name')
      .eq('profile_id', req.user.id)
      .single();

    if (ngoErr || !ngo) {
      console.error('[CLAIMS] NGO lookup error:', ngoErr);
      return res.status(404).json({ error: 'NGO profile not found' });
    }
    console.log('[CLAIMS] NGO found:', ngo.ngo_id, ngo.ngo_name);

    // Get listing info (for notification later)
    const { data: listing } = await supabaseAdmin
      .from('food_listings')
      .select(`
        listing_id, food_type, status, is_locked,
        donors!inner ( profile_id, profiles ( phone, organization_name ) )
      `)
      .eq('listing_id', listing_id)
      .single();

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    console.log('[CLAIMS] Listing:', listing.listing_id, 'status:', listing.status, 'locked:', listing.is_locked);

    if (['completed', 'expired'].includes(listing.status)) {
      return res.status(400).json({ error: 'Listing is not available', current_status: listing.status });
    }

    // ─── Try RPC function first (single DB call, no trigger issues) ───
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('claim_listing', {
      p_listing_id: listing_id,
      p_ngo_id: ngo.ngo_id,
      p_pickup_scheduled_time: pickup_scheduled_time || null,
      p_strategy_notes: strategy_notes || null
    });

    if (!rpcError && rpcResult && !rpcResult.error) {
      console.log('[CLAIMS] RPC success! Claim:', rpcResult.claim_id);

      // Send notification (non-blocking)
      try {
        const donorPhone = listing.donors?.profiles?.phone;
        if (donorPhone) {
          sendClaimAlert(donorPhone, ngo.ngo_name, listing.food_type).catch(() => { });
        }
      } catch (_) { }

      return res.status(201).json({ message: 'Listing claimed successfully', claim: rpcResult });
    }

    // ─── Fallback: direct operations ───
    const rpcMsg = rpcError?.message || rpcResult?.error || 'unknown';
    console.log('[CLAIMS] RPC unavailable or failed:', rpcMsg, '— using fallback');

    // Step 1: Delete existing claims
    const { error: delErr } = await supabaseAdmin.from('ngo_claims').delete().eq('listing_id', listing_id);
    if (delErr) console.error('[CLAIMS] Delete claims error:', delErr.message);
    else console.log('[CLAIMS] Old claims deleted');

    // Step 2: Lock the listing directly (skip unlock→lock since we deleted claims)
    const { error: lockErr } = await supabaseAdmin
      .from('food_listings')
      .update({ is_locked: true, status: 'claimed' })
      .eq('listing_id', listing_id);

    if (lockErr) {
      console.error('[CLAIMS] Lock error:', lockErr);
      return res.status(500).json({ error: 'Failed to lock listing', message: lockErr.message });
    }
    console.log('[CLAIMS] Listing locked');

    // Step 3: Insert claim
    const { data: claim, error: claimErr } = await supabaseAdmin
      .from('ngo_claims')
      .insert({
        listing_id,
        ngo_id: ngo.ngo_id,
        pickup_scheduled_time: pickup_scheduled_time || null,
        strategy_notes: strategy_notes || null,
        status: 'claimed'
      })
      .select()
      .single();

    if (claimErr) {
      console.error('[CLAIMS] Insert error:', claimErr);
      // Rollback lock
      await supabaseAdmin.from('food_listings').update({ is_locked: false, status: 'open' }).eq('listing_id', listing_id);
      return res.status(500).json({ error: 'Failed to create claim', message: claimErr.message });
    }
    console.log('[CLAIMS] Claim created:', claim.claim_id);

    // Notification (non-blocking)
    try {
      const donorPhone = listing.donors?.profiles?.phone;
      if (donorPhone) {
        sendClaimAlert(donorPhone, ngo.ngo_name, listing.food_type).catch(() => { });
      }
    } catch (_) { }

    return res.status(201).json({ message: 'Listing claimed successfully', claim });

  } catch (error) {
    console.error('[CLAIMS] Unhandled error:', error);
    res.status(500).json({ error: 'Failed to claim listing', message: error.message });
  }
});

/**
 * GET /api/claims/my
 * Get NGO's own claims
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
      .from('ngo_claims')
      .select(`
        *,
        food_listings (
          *,
          donors (
            profiles (
              organization_name,
              phone
            )
          )
        )
      `)
      .eq('ngo_id', ngo.ngo_id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('acceptance_time', { ascending: false });

    const { data: claims, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch claims',
        message: error.message
      });
    }

    res.json({
      claims,
      count: claims.length
    });

  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({
      error: 'Failed to get claims',
      message: error.message
    });
  }
});

/**
 * GET /api/claims/:claim_id
 * Get specific claim details
 */
router.get('/:claim_id', authenticateUser, async (req, res) => {
  try {
    const { claim_id } = req.params;

    const { data: claim, error } = await supabaseAdmin
      .from('ngo_claims')
      .select(`
        *,
        ngos (
          ngo_name,
          contact_person,
          profiles (
            phone
          )
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
      `)
      .eq('claim_id', claim_id)
      .single();

    if (error || !claim) {
      return res.status(404).json({
        error: 'Claim not found'
      });
    }

    // Check access (NGO owns claim or Donor owns listing)
    if (req.user.role === 'ngo') {
      const { data: ngo } = await supabaseAdmin
        .from('ngos')
        .select('ngo_id')
        .eq('profile_id', req.user.id)
        .single();

      if (ngo && claim.ngo_id !== ngo.ngo_id) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    if (req.user.role === 'donor') {
      const { data: donor } = await supabaseAdmin
        .from('donors')
        .select('donor_id')
        .eq('profile_id', req.user.id)
        .single();

      if (donor && claim.food_listings.donor_id !== donor.donor_id) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    res.json({
      claim
    });

  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({
      error: 'Failed to get claim',
      message: error.message
    });
  }
});

/**
 * PUT /api/claims/:claim_id
 * Update claim (NGO only)
 */
router.put('/:claim_id', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { claim_id } = req.params;
    const { pickup_scheduled_time, strategy_notes, status } = req.body;

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
    const { data: existing } = await supabaseAdmin
      .from('ngo_claims')
      .select('ngo_id')
      .eq('claim_id', claim_id)
      .single();

    if (!existing || existing.ngo_id !== ngo.ngo_id) {
      return res.status(404).json({
        error: 'Claim not found or access denied'
      });
    }

    const updates = {};
    if (pickup_scheduled_time !== undefined) updates.pickup_scheduled_time = pickup_scheduled_time;
    if (strategy_notes !== undefined) updates.strategy_notes = strategy_notes;
    if (status !== undefined) updates.status = status;

    const { data: claim, error } = await supabaseAdmin
      .from('ngo_claims')
      .update(updates)
      .eq('claim_id', claim_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update claim',
        message: error.message
      });
    }

    res.json({
      message: 'Claim updated successfully',
      claim
    });

  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({
      error: 'Failed to update claim',
      message: error.message
    });
  }
});

/**
 * DELETE /api/claims/:claim_id
 * Cancel claim (NGO only, before delivery assigned)
 */
router.delete('/:claim_id', authenticateUser, ngoOnly, async (req, res) => {
  try {
    const { claim_id } = req.params;

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

    // Check if delivery has been assigned
    const { data: delivery } = await supabaseAdmin
      .from('deliveries')
      .select('delivery_id')
      .eq('claim_id', claim_id)
      .single();

    if (delivery) {
      return res.status(403).json({
        error: 'Cannot cancel claim after delivery has been assigned'
      });
    }

    // Delete claim (will unlock listing via trigger)
    const { error } = await supabaseAdmin
      .from('ngo_claims')
      .delete()
      .eq('claim_id', claim_id)
      .eq('ngo_id', ngo.ngo_id);

    if (error) {
      return res.status(500).json({
        error: 'Failed to cancel claim',
        message: error.message
      });
    }

    // Unlock listing manually
    const { data: claim } = await supabaseAdmin
      .from('ngo_claims')
      .select('listing_id')
      .eq('claim_id', claim_id)
      .single();

    if (claim) {
      await supabaseAdmin
        .from('food_listings')
        .update({
          is_locked: false,
          status: 'open'
        })
        .eq('listing_id', claim.listing_id);
    }

    res.json({
      message: 'Claim cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel claim error:', error);
    res.status(500).json({
      error: 'Failed to cancel claim',
      message: error.message
    });
  }
});

module.exports = router;