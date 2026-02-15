-- Migration: Make organization_name nullable for admin users
-- Run this in your Supabase SQL editor

ALTER TABLE profiles 
ALTER COLUMN organization_name DROP NOT NULL;

-- Update existing admin users to have NULL organization_name if needed
UPDATE profiles 
SET organization_name = NULL 
WHERE role = 'admin' AND organization_name = '';

COMMENT ON COLUMN profiles.organization_name IS 'Organization name (required for donor/ngo, optional for admin/volunteer)';
