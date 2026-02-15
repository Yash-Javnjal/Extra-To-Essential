-- Migration to add assigned_ngo_id to food_listings table
ALTER TABLE food_listings 
ADD COLUMN IF NOT EXISTS assigned_ngo_id UUID REFERENCES ngos(ngo_id);

-- Optional: Add index for performance if querying by assigned NGO becomes frequent
CREATE INDEX IF NOT EXISTS idx_food_listings_assigned_ngo_id ON food_listings(assigned_ngo_id);
