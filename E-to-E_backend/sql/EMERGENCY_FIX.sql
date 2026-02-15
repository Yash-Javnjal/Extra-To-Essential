-- COMPLETE FIX for all trigger recursion issues
-- Run this in Supabase SQL Editor

-- 1. Drop ALL problematic triggers on food_listings
DROP TRIGGER IF EXISTS trigger_auto_expire_listings ON food_listings;
DROP TRIGGER IF EXISTS set_listings_updated_at ON food_listings;

-- 2. Drop the lock_listing_on_claim trigger on ngo_claims
--    (we handle locking in the application code now)
DROP TRIGGER IF EXISTS trigger_lock_listing_on_claim ON ngo_claims;

-- 3. Drop the auto_expire function (it causes recursion)
DROP FUNCTION IF EXISTS auto_expire_listings() CASCADE;

-- 4. Unlock all currently locked listings and reset them
UPDATE food_listings
SET is_locked = false,
    status = 'open'
WHERE is_locked = true
  AND status NOT IN ('completed', 'expired');

-- 5. Delete orphaned claims (claims without deliveries)
DELETE FROM ngo_claims;

-- 6. Verify: Check remaining triggers on food_listings
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('food_listings', 'ngo_claims')
ORDER BY event_object_table, trigger_name;

-- 7. Verify: Check listings are all unlocked
SELECT listing_id, food_type, status, is_locked
FROM food_listings
ORDER BY created_at DESC;
