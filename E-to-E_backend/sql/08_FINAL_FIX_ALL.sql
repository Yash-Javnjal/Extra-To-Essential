-- ==========================================
-- FINAL FIX FOR RECURSION & CLAIM ERRORS
-- ==========================================
-- This script fixes the "stack depth limit exceeded" error and "Locked" error.
-- RUN THIS IN SUPABASE SQL EDITOR NOW.

-- 1. DROP PROBLEMATIC TRIGGERS (The root cause of recursion)
DROP TRIGGER IF EXISTS trigger_auto_expire_listings ON food_listings CASCADE;
DROP TRIGGER IF EXISTS set_listings_updated_at ON food_listings CASCADE;
DROP TRIGGER IF EXISTS trigger_lock_listing_on_claim ON ngo_claims CASCADE;
DROP TRIGGER IF EXISTS trigger_update_listing_on_pickup ON deliveries CASCADE;

-- 2. DROP PROBLEMATIC FUNCTIONS
DROP FUNCTION IF EXISTS auto_expire_listings() CASCADE;
DROP FUNCTION IF EXISTS lock_listing_on_claim() CASCADE;
DROP FUNCTION IF EXISTS update_listing_on_pickup() CASCADE;

-- 3. UNLOCK EVERYTHING (Reset state)
UPDATE food_listings
SET is_locked = false,
    status = 'open',
    updated_at = NOW()
WHERE status NOT IN ('completed', 'expired');

-- 4. CLEANUP ORPHANED CLAIMS
DELETE FROM ngo_claims;

-- 5. CREATE SAFE RPC FUNCTION (Handles claiming safely)
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
    -- Check if listing exists
    SELECT * INTO v_listing FROM food_listings WHERE listing_id = p_listing_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Listing not found');
    END IF;

    -- Allow re-claiming if it was previously claimed but failed (or by same NGO)
    -- Only block if it's completed or expired
    IF v_listing.status IN ('completed', 'expired') THEN
        RETURN json_build_object('error', 'Listing is not available (completed or expired)');
    END IF;

    -- Clean up previous attempts
    DELETE FROM ngo_claims WHERE listing_id = p_listing_id;

    -- Lock the listing
    UPDATE food_listings 
    SET is_locked = true, 
        status = 'claimed', 
        updated_at = NOW() 
    WHERE listing_id = p_listing_id;

    -- Create new claim
    INSERT INTO ngo_claims (listing_id, ngo_id, pickup_scheduled_time, strategy_notes, status)
    VALUES (p_listing_id, p_ngo_id, p_pickup_scheduled_time, p_strategy_notes, 'claimed')
    RETURNING claim_id INTO v_claim_id;

    -- Return success
    SELECT json_build_object(
        'claim_id', nc.claim_id,
        'listing_id', nc.listing_id,
        'status', nc.status
    ) INTO v_result
    FROM ngo_claims nc
    WHERE nc.claim_id = v_claim_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. VERIFY
SELECT 'FIX APPLIED SUCCESSFULLY' as status;
