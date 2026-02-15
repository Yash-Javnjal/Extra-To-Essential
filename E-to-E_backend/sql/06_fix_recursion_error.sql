-- Fix for "stack depth limit exceeded" error
-- Multiple triggers cause infinite recursion when updating food_listings
-- Run this in Supabase SQL Editor to fix

-- Drop the problematic triggers
DROP TRIGGER IF EXISTS trigger_auto_expire_listings ON food_listings;
DROP TRIGGER IF EXISTS set_listings_updated_at ON food_listings;

-- Recreate the updated_at trigger with a condition to prevent recursion
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if updated_at hasn't been set in this transaction
    IF NEW.updated_at = OLD.updated_at THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_listings_updated_at
    BEFORE UPDATE ON food_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listings_updated_at();

-- The auto-expire functionality should be handled by:
-- 1. A scheduled job/cron (call check_expired_listings() periodically)
-- 2. Or check expiry in the application layer when fetching listings

-- You can still manually expire listings by calling:
-- SELECT check_expired_listings();
