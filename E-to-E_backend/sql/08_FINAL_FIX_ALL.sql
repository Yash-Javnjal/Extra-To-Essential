-- Redefine validate_claim_eligibility to allow 'claimed' status if inserting a claim
-- This is necessary because the RPC function (and fallback logic) locks the listing BEFORE inserting the claim.
-- We rely on the UNIQUE constraint on ngo_claims(listing_id) to prevent double-claiming.

CREATE OR REPLACE FUNCTION validate_claim_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_listing_status listing_status;
    v_is_locked BOOLEAN;
BEGIN
    -- Check if listing exists
    SELECT status, is_locked
    INTO v_listing_status, v_is_locked
    FROM food_listings
    WHERE listing_id = NEW.listing_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing does not exist';
    END IF;
    
    -- RELAXED CHECK:
    -- We allow 'claimed' status and is_locked=TRUE because the claim process often sets these
    -- on the listing table BEFORE inserting the claim record (in the same transaction).
    -- Attempting to claim a TRULY already-claimed listing will fail due to the UNIQUE constraint on ngo_claims.
    
    -- Only fail if status is something completely wrong like 'completed' or 'expired'
    IF v_listing_status IN ('completed', 'expired') THEN
        RAISE EXCEPTION 'Listing is not available (status: %)', v_listing_status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
