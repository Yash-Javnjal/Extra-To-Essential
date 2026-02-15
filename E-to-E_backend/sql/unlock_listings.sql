-- Fix: Unlock all locked listings and reset their status
-- This happens when a claim fails but the listing remains locked
-- Run this in Supabase SQL Editor

-- 1. Check which listings are locked
SELECT listing_id, food_type, status, is_locked, created_at
FROM food_listings
WHERE is_locked = true
ORDER BY created_at DESC;

-- 2. Unlock all locked listings and reset to 'open' status
UPDATE food_listings
SET is_locked = false,
    status = 'open',
    updated_at = NOW()
WHERE is_locked = true
  AND status NOT IN ('completed', 'expired');

-- 3. Delete any failed/incomplete claims
DELETE FROM ngo_claims
WHERE claim_id IN (
    SELECT nc.claim_id
    FROM ngo_claims nc
    LEFT JOIN deliveries d ON d.claim_id = nc.claim_id
    WHERE d.delivery_id IS NULL
);

-- 4. Verify the fix
SELECT listing_id, food_type, status, is_locked
FROM food_listings
ORDER BY created_at DESC
LIMIT 5;
