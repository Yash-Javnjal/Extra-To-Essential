-- ============================================
-- TRIGGERS & AUTOMATION FUNCTIONS
-- Smart Surplus Food Redistribution System
-- ============================================

-- ============================================
-- 1. AUTO-EXPIRE LISTINGS
-- ============================================

CREATE OR REPLACE FUNCTION auto_expire_listings()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark expired listings
    UPDATE food_listings
    SET status = 'expired',
        updated_at = NOW()
    WHERE expiry_time < NOW()
      AND status IN ('open', 'in_discussion')
      AND is_locked = FALSE;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT/UPDATE
CREATE TRIGGER trigger_auto_expire_listings
    AFTER INSERT OR UPDATE ON food_listings
    FOR EACH STATEMENT
    EXECUTE FUNCTION auto_expire_listings();

-- Scheduled check (run via cron or app scheduler)
CREATE OR REPLACE FUNCTION check_expired_listings()
RETURNS void AS $$
BEGIN
    UPDATE food_listings
    SET status = 'expired',
        updated_at = NOW()
    WHERE expiry_time < NOW()
      AND status IN ('open', 'in_discussion')
      AND is_locked = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. LOCK LISTING ON CLAIM
-- ============================================

CREATE OR REPLACE FUNCTION lock_listing_on_claim()
RETURNS TRIGGER AS $$
BEGIN
    -- Lock the listing and update status
    UPDATE food_listings
    SET is_locked = TRUE,
        status = 'claimed',
        updated_at = NOW()
    WHERE listing_id = NEW.listing_id;
    
    -- Verify the listing was actually available
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found or already claimed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lock_listing_on_claim
    BEFORE INSERT ON ngo_claims
    FOR EACH ROW
    EXECUTE FUNCTION lock_listing_on_claim();

-- ============================================
-- 3. UNLOCK AFTER COMPLETION/CANCELLATION
-- ============================================

CREATE OR REPLACE FUNCTION unlock_listing_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If delivery is completed, update listing
    IF NEW.delivery_status = 'delivered' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'delivered') THEN
        UPDATE food_listings
        SET status = 'completed',
            is_locked = FALSE,
            updated_at = NOW()
        WHERE listing_id = (
            SELECT listing_id FROM ngo_claims WHERE claim_id = NEW.claim_id
        );
    END IF;
    
    -- If delivery failed, unlock for reclaim
    IF NEW.delivery_status = 'failed' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'failed') THEN
        UPDATE food_listings
        SET status = 'open',
            is_locked = FALSE,
            updated_at = NOW()
        WHERE listing_id = (
            SELECT listing_id FROM ngo_claims WHERE claim_id = NEW.claim_id
        );
        
        -- Delete the failed claim
        DELETE FROM ngo_claims WHERE claim_id = NEW.claim_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unlock_listing_on_completion
    AFTER UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION unlock_listing_on_completion();

-- ============================================
-- 4. AUTO-UPDATE VOLUNTEER AVAILABILITY
-- ============================================

CREATE OR REPLACE FUNCTION update_volunteer_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark volunteer as unavailable when assigned
    IF NEW.delivery_status = 'assigned' OR NEW.delivery_status = 'in_transit' THEN
        UPDATE volunteers
        SET availability_status = FALSE,
            updated_at = NOW()
        WHERE volunteer_id = NEW.volunteer_id;
    END IF;
    
    -- Mark volunteer as available when delivery completed or failed
    IF NEW.delivery_status IN ('delivered', 'failed') AND NEW.volunteer_id IS NOT NULL THEN
        UPDATE volunteers
        SET availability_status = TRUE,
            updated_at = NOW()
        WHERE volunteer_id = NEW.volunteer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_availability
    AFTER INSERT OR UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_volunteer_availability();

-- ============================================
-- 5. AUTO-CREATE IMPACT RECORD
-- ============================================

CREATE OR REPLACE FUNCTION create_impact_record()
RETURNS TRIGGER AS $$
DECLARE
    v_food_saved_kg DECIMAL(10,2);
    v_meals_served INTEGER;
    v_co2_reduced DECIMAL(10,2);
    v_monetary_value DECIMAL(10,2);
BEGIN
    -- Only create impact when delivery is marked as delivered
    IF NEW.delivery_status = 'delivered' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'delivered') THEN
        
        -- Get listing data
        SELECT 
            fl.quantity_kg,
            fl.meal_equivalent
        INTO 
            v_food_saved_kg,
            v_meals_served
        FROM food_listings fl
        JOIN ngo_claims nc ON nc.listing_id = fl.listing_id
        WHERE nc.claim_id = NEW.claim_id;
        
        -- Calculate CO2 reduction (2.5 kg CO2 per kg of food saved - industry average)
        v_co2_reduced := v_food_saved_kg * 2.5;
        
        -- Calculate monetary value ($3 per meal - average)
        v_monetary_value := v_meals_served * 3.0;
        
        -- Insert impact record
        INSERT INTO impact_metrics (
            listing_id,
            meals_served,
            food_saved_kg,
            co2_emissions_reduced_kg,
            monetary_value
        )
        SELECT 
            nc.listing_id,
            v_meals_served,
            v_food_saved_kg,
            v_co2_reduced,
            v_monetary_value
        FROM ngo_claims nc
        WHERE nc.claim_id = NEW.claim_id
        ON CONFLICT (listing_id) DO UPDATE SET
            meals_served = EXCLUDED.meals_served,
            food_saved_kg = EXCLUDED.food_saved_kg,
            co2_emissions_reduced_kg = EXCLUDED.co2_emissions_reduced_kg,
            monetary_value = EXCLUDED.monetary_value;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_impact_record
    AFTER UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION create_impact_record();

-- ============================================
-- 6. AUTO-CALCULATE CO2 EMISSIONS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_co2_emissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate CO2 based on food quantity
    -- Formula: 2.5 kg CO2 per kg of food waste prevented
    NEW.co2_emissions_reduced_kg := NEW.food_saved_kg * 2.5;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_co2_emissions
    BEFORE INSERT OR UPDATE ON impact_metrics
    FOR EACH ROW
    EXECUTE FUNCTION calculate_co2_emissions();

-- ============================================
-- 7. UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_donors_updated_at
    BEFORE UPDATE ON donors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_ngos_updated_at
    BEFORE UPDATE ON ngos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_volunteers_updated_at
    BEFORE UPDATE ON volunteers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_listings_updated_at
    BEFORE UPDATE ON food_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_claims_updated_at
    BEFORE UPDATE ON ngo_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VALIDATE CLAIM ELIGIBILITY
-- ============================================

CREATE OR REPLACE FUNCTION validate_claim_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_listing_status listing_status;
    v_is_locked BOOLEAN;
BEGIN
    -- Check if listing exists and is available
    SELECT status, is_locked
    INTO v_listing_status, v_is_locked
    FROM food_listings
    WHERE listing_id = NEW.listing_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing does not exist';
    END IF;
    
    IF v_is_locked = TRUE THEN
        RAISE EXCEPTION 'Listing is already locked by another NGO';
    END IF;
    
    IF v_listing_status NOT IN ('open', 'in_discussion') THEN
        RAISE EXCEPTION 'Listing is not available for claiming (status: %)', v_listing_status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_claim_eligibility
    BEFORE INSERT ON ngo_claims
    FOR EACH ROW
    EXECUTE FUNCTION validate_claim_eligibility();

-- ============================================
-- 9. PREVENT DUPLICATE CLAIMS
-- ============================================

-- Already handled by UNIQUE constraint on ngo_claims(listing_id)
-- But we can add a more informative error

CREATE OR REPLACE FUNCTION prevent_duplicate_claims()
RETURNS TRIGGER AS $$
DECLARE
    v_existing_claim UUID;
BEGIN
    SELECT claim_id INTO v_existing_claim
    FROM ngo_claims
    WHERE listing_id = NEW.listing_id;
    
    IF FOUND THEN
        RAISE EXCEPTION 'This listing has already been claimed by another NGO';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This is redundant with UNIQUE constraint but provides better error message

-- ============================================
-- 10. UPDATE LISTING STATUS ON PICKUP
-- ============================================

CREATE OR REPLACE FUNCTION update_listing_on_pickup()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'in_transit' AND (OLD.delivery_status IS NULL OR OLD.delivery_status != 'in_transit') THEN
        UPDATE food_listings
        SET status = 'picked',
            updated_at = NOW()
        WHERE listing_id = (
            SELECT listing_id FROM ngo_claims WHERE claim_id = NEW.claim_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_listing_on_pickup
    AFTER UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_on_pickup();

COMMENT ON FUNCTION auto_expire_listings() IS 'Automatically marks listings as expired when expiry_time is reached';
COMMENT ON FUNCTION lock_listing_on_claim() IS 'Locks listing when NGO claims it';
COMMENT ON FUNCTION unlock_listing_on_completion() IS 'Unlocks listing after delivery completion or failure';
COMMENT ON FUNCTION update_volunteer_availability() IS 'Manages volunteer availability based on delivery status';
COMMENT ON FUNCTION create_impact_record() IS 'Auto-creates impact metrics when delivery is completed';
COMMENT ON FUNCTION calculate_co2_emissions() IS 'Calculates CO2 reduction based on food quantity';