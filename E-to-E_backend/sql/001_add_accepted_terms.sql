-- Migration to add accepted_terms field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_terms_timestamp TIMESTAMP WITH TIME ZONE;
