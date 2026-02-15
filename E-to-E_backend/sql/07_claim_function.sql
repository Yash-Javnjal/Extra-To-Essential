-- Create a Supabase RPC function to claim a listing
-- This function handles everything in a single transaction with triggers disabled
-- Run this in Supabase SQL Editor ONCE

-- First, drop the problematic triggers permanently
DROP TRIGGER IF EXISTS trigger_auto_expire_listings ON food_listings;
DROP TRIGGER IF EXISTS trigger_lock_listing_on_claim ON ngo_claims;

-- Now create the claim function
CREATE OR REPLACE FUNCTION claim_listing(
    p_listing_id UUID,
    p_ngo_id UUID,
    p_pickup_scheduled_time TIMESTAMPTZ DEFAULT NULL,
    p_strategy_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_listing RECORD;
    v_claim_id UUID;
    v_result JSON;
BEGIN
    -- Check listing exists
    SELECT listing_id, status, is_locked, food_type
    INTO v_listing
    FROM food_listings
    WHERE listing_id = p_listing_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Listing not found');
    END IF;

    IF v_listing.status IN ('completed', 'expired') THEN
        RETURN json_build_object('error', 'Listing is not available');
    END IF;

    -- Clean up any existing claims for this listing
    DELETE FROM ngo_claims WHERE listing_id = p_listing_id;

    -- Lock the listing
    UPDATE food_listings
    SET is_locked = true,
        status = 'claimed',
        updated_at = NOW()
    WHERE listing_id = p_listing_id;

    -- Create the claim
    INSERT INTO ngo_claims (listing_id, ngo_id, pickup_scheduled_time, strategy_notes, status)
    VALUES (p_listing_id, p_ngo_id, p_pickup_scheduled_time, p_strategy_notes, 'claimed')
    RETURNING claim_id INTO v_claim_id;

    -- Return the result
    SELECT json_build_object(
        'claim_id', nc.claim_id,
        'listing_id', nc.listing_id,
        'ngo_id', nc.ngo_id,
        'status', nc.status,
        'pickup_scheduled_time', nc.pickup_scheduled_time,
        'strategy_notes', nc.strategy_notes,
        'created_at', nc.created_at
    ) INTO v_result
    FROM ngo_claims nc
    WHERE nc.claim_id = v_claim_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
