-- ============================================
-- SMART SURPLUS FOOD REDISTRIBUTION SYSTEM
-- Database Schema for Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'admin');

CREATE TYPE listing_status AS ENUM (
    'open',
    'in_discussion',
    'claimed',
    'scheduled',
    'picked',
    'completed',
    'expired'
);

CREATE TYPE delivery_status AS ENUM (
    'assigned',
    'in_transit',
    'delivered',
    'failed'
);

CREATE TYPE message_type AS ENUM (
    'claim_alert',
    'pickup_alert',
    'delivery_alert',
    'expiry_warning',
    'completion_notice'
);

CREATE TYPE notification_delivery_status AS ENUM (
    'sent',
    'delivered',
    'failed',
    'pending'
);

CREATE TYPE vehicle_type AS ENUM (
    'bike',
    'scooter',
    'car',
    'van',
    'truck'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    role user_role NOT NULL,
    organization_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Donors Table
CREATE TABLE donors (
    donor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_type TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    csr_participant BOOLEAN DEFAULT FALSE,
    verification_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_donor_profile UNIQUE(profile_id)
);

-- NGOs Table
CREATE TABLE ngos (
    ngo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ngo_name TEXT NOT NULL,
    registration_number TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    service_radius_km DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
    contact_person TEXT NOT NULL,
    verification_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_ngo_profile UNIQUE(profile_id)
);

-- Volunteers Table (No login - managed by NGOs)
CREATE TABLE volunteers (
    volunteer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngo_id UUID NOT NULL REFERENCES ngos(ngo_id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    availability_status BOOLEAN DEFAULT TRUE,
    vehicle_type vehicle_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Food Listings Table
CREATE TABLE food_listings (
    listing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES donors(donor_id) ON DELETE CASCADE,
    food_type TEXT NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
    meal_equivalent INTEGER NOT NULL CHECK (meal_equivalent > 0),
    expiry_time TIMESTAMPTZ NOT NULL,
    pickup_address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status listing_status NOT NULL DEFAULT 'open',
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_expiry CHECK (expiry_time > created_at)
);

-- NGO Claims Table
CREATE TABLE ngo_claims (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES food_listings(listing_id) ON DELETE CASCADE,
    ngo_id UUID NOT NULL REFERENCES ngos(ngo_id) ON DELETE CASCADE,
    acceptance_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pickup_scheduled_time TIMESTAMPTZ,
    strategy_notes TEXT,
    status listing_status NOT NULL DEFAULT 'claimed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_listing_claim UNIQUE(listing_id)
);

-- Deliveries Table
CREATE TABLE deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES ngo_claims(claim_id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES volunteers(volunteer_id) ON DELETE SET NULL,
    pickup_time TIMESTAMPTZ,
    delivery_time TIMESTAMPTZ,
    delivery_status delivery_status NOT NULL DEFAULT 'assigned',
    proof_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_claim_delivery UNIQUE(claim_id)
);

-- Impact Metrics Table
CREATE TABLE impact_metrics (
    impact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES food_listings(listing_id) ON DELETE CASCADE,
    meals_served INTEGER NOT NULL DEFAULT 0,
    food_saved_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    co2_emissions_reduced_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monetary_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_listing_impact UNIQUE(listing_id)
);

-- Notification Logs Table
CREATE TABLE notification_logs (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    message_type message_type NOT NULL,
    message_body TEXT NOT NULL,
    firebase_message_id TEXT,
    delivery_status notification_delivery_status NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    error_message TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profile indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- Donor indexes
CREATE INDEX idx_donors_profile ON donors(profile_id);
CREATE INDEX idx_donors_city ON donors(city);
CREATE INDEX idx_donors_verification ON donors(verification_status);

-- NGO indexes
CREATE INDEX idx_ngos_profile ON ngos(profile_id);
CREATE INDEX idx_ngos_city ON ngos(city);
CREATE INDEX idx_ngos_verification ON ngos(verification_status);

-- Volunteer indexes
CREATE INDEX idx_volunteers_ngo ON volunteers(ngo_id);
CREATE INDEX idx_volunteers_availability ON volunteers(availability_status);

-- Food listing indexes
CREATE INDEX idx_listings_donor ON food_listings(donor_id);
CREATE INDEX idx_listings_status ON food_listings(status);
CREATE INDEX idx_listings_expiry ON food_listings(expiry_time);
CREATE INDEX idx_listings_locked ON food_listings(is_locked);
CREATE INDEX idx_listings_created ON food_listings(created_at DESC);

-- Geospatial indexes
CREATE INDEX idx_donors_location ON donors USING GIST(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

CREATE INDEX idx_ngos_location ON ngos USING GIST(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

CREATE INDEX idx_listings_location ON food_listings USING GIST(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Claim indexes
CREATE INDEX idx_claims_listing ON ngo_claims(listing_id);
CREATE INDEX idx_claims_ngo ON ngo_claims(ngo_id);
CREATE INDEX idx_claims_status ON ngo_claims(status);

-- Delivery indexes
CREATE INDEX idx_deliveries_claim ON deliveries(claim_id);
CREATE INDEX idx_deliveries_volunteer ON deliveries(volunteer_id);
CREATE INDEX idx_deliveries_status ON deliveries(delivery_status);

-- Impact indexes
CREATE INDEX idx_impact_listing ON impact_metrics(listing_id);
CREATE INDEX idx_impact_created ON impact_metrics(created_at DESC);

-- Notification indexes
CREATE INDEX idx_notifications_phone ON notification_logs(phone_number);
CREATE INDEX idx_notifications_type ON notification_logs(message_type);
CREATE INDEX idx_notifications_status ON notification_logs(delivery_status);
CREATE INDEX idx_notifications_sent ON notification_logs(sent_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Donors: Donors can view their own data
CREATE POLICY "Donors can view own data"
    ON donors FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Donors can update own data"
    ON donors FOR UPDATE
    USING (profile_id = auth.uid());

-- NGOs: NGOs can view their own data
CREATE POLICY "NGOs can view own data"
    ON ngos FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "NGOs can view all verified NGOs"
    ON ngos FOR SELECT
    USING (verification_status = TRUE);

-- Food Listings: Public read for open listings
CREATE POLICY "Anyone can view open listings"
    ON food_listings FOR SELECT
    USING (status IN ('open', 'in_discussion'));

CREATE POLICY "Donors can manage own listings"
    ON food_listings FOR ALL
    USING (donor_id IN (SELECT donor_id FROM donors WHERE profile_id = auth.uid()));

-- Claims: NGOs can view their own claims
CREATE POLICY "NGOs can view own claims"
    ON ngo_claims FOR SELECT
    USING (ngo_id IN (SELECT ngo_id FROM ngos WHERE profile_id = auth.uid()));

-- Deliveries: Volunteers can view assigned deliveries
CREATE POLICY "View assigned deliveries"
    ON deliveries FOR SELECT
    USING (TRUE);

-- Impact Metrics: Public read
CREATE POLICY "Anyone can view impact metrics"
    ON impact_metrics FOR SELECT
    USING (TRUE);

COMMENT ON TABLE profiles IS 'Extended user profiles linked to Supabase Auth';
COMMENT ON TABLE donors IS 'Donor organizations and businesses';
COMMENT ON TABLE ngos IS 'NGO organizations managing food distribution';
COMMENT ON TABLE volunteers IS 'Volunteers under NGO management (no login)';
COMMENT ON TABLE food_listings IS 'Food surplus listings with lifecycle management';
COMMENT ON TABLE ngo_claims IS 'NGO claims on food listings';
COMMENT ON TABLE deliveries IS 'Delivery logistics tracking';
COMMENT ON TABLE impact_metrics IS 'Environmental and social impact tracking';
COMMENT ON TABLE notification_logs IS 'Firebase notification audit trail';