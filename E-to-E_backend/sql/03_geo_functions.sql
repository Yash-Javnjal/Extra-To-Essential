-- ============================================
-- GEOSPATIAL MATCHING & DISTANCE FUNCTIONS
-- Smart Surplus Food Redistribution System
-- ============================================

-- ============================================
-- 1. HAVERSINE DISTANCE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION haversine_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371; -- Earth radius in kilometers
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    a := sin(dLat/2) * sin(dLat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dLon/2) * sin(dLon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 2. NGO RADIUS FILTERING QUERY
-- ============================================

-- Function to get NGOs within service radius of a location
CREATE OR REPLACE FUNCTION get_ngos_in_radius(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_max_radius_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
    ngo_id UUID,
    ngo_name TEXT,
    profile_id UUID,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    service_radius_km DECIMAL,
    distance_km DECIMAL,
    verification_status BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.ngo_id,
        n.ngo_name,
        n.profile_id,
        n.contact_person,
        p.phone,
        n.address,
        n.city,
        n.service_radius_km,
        haversine_distance(p_latitude, p_longitude, n.latitude, n.longitude) as distance_km,
        n.verification_status
    FROM ngos n
    JOIN profiles p ON p.id = n.profile_id
    WHERE n.verification_status = TRUE
      AND haversine_distance(p_latitude, p_longitude, n.latitude, n.longitude) <= LEAST(n.service_radius_km, p_max_radius_km)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 3. LISTING-TO-NGO MATCHING QUERY
-- ============================================

-- Function to find available NGOs for a specific listing
CREATE OR REPLACE FUNCTION match_listing_to_ngos(
    p_listing_id UUID
)
RETURNS TABLE (
    ngo_id UUID,
    ngo_name TEXT,
    contact_person TEXT,
    phone TEXT,
    distance_km DECIMAL,
    service_radius_km DECIMAL,
    is_within_radius BOOLEAN,
    priority_score DECIMAL
) AS $$
DECLARE
    v_listing_lat DECIMAL;
    v_listing_lon DECIMAL;
    v_listing_status listing_status;
BEGIN
    -- Get listing coordinates and status
    SELECT latitude, longitude, status
    INTO v_listing_lat, v_listing_lon, v_listing_status
    FROM food_listings
    WHERE listing_id = p_listing_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;
    
    IF v_listing_status NOT IN ('open', 'in_discussion') THEN
        RAISE EXCEPTION 'Listing is not available for matching';
    END IF;
    
    RETURN QUERY
    SELECT 
        n.ngo_id,
        n.ngo_name,
        n.contact_person,
        p.phone,
        haversine_distance(v_listing_lat, v_listing_lon, n.latitude, n.longitude) as distance_km,
        n.service_radius_km,
        CASE 
            WHEN haversine_distance(v_listing_lat, v_listing_lon, n.latitude, n.longitude) <= n.service_radius_km
            THEN TRUE
            ELSE FALSE
        END as is_within_radius,
        -- Priority score: lower is better (distance-based)
        haversine_distance(v_listing_lat, v_listing_lon, n.latitude, n.longitude) as priority_score
    FROM ngos n
    JOIN profiles p ON p.id = n.profile_id
    WHERE n.verification_status = TRUE
      AND haversine_distance(v_listing_lat, v_listing_lon, n.latitude, n.longitude) <= n.service_radius_km
    ORDER BY priority_score ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 4. GET AVAILABLE LISTINGS FOR NGO
-- ============================================

-- Function to get all available listings within NGO's service radius
CREATE OR REPLACE FUNCTION get_available_listings_for_ngo(
    p_ngo_id UUID
)
RETURNS TABLE (
    listing_id UUID,
    food_type TEXT,
    quantity_kg DECIMAL,
    meal_equivalent INTEGER,
    expiry_time TIMESTAMPTZ,
    pickup_address TEXT,
    donor_name TEXT,
    donor_phone TEXT,
    distance_km DECIMAL,
    time_until_expiry INTERVAL,
    urgency_score DECIMAL
) AS $$
DECLARE
    v_ngo_lat DECIMAL;
    v_ngo_lon DECIMAL;
    v_service_radius DECIMAL;
BEGIN
    -- Get NGO coordinates and service radius
    SELECT latitude, longitude, service_radius_km
    INTO v_ngo_lat, v_ngo_lon, v_service_radius
    FROM ngos
    WHERE ngo_id = p_ngo_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'NGO not found';
    END IF;
    
    RETURN QUERY
    SELECT 
        fl.listing_id,
        fl.food_type,
        fl.quantity_kg,
        fl.meal_equivalent,
        fl.expiry_time,
        fl.pickup_address,
        p.full_name as donor_name,
        p.phone as donor_phone,
        haversine_distance(v_ngo_lat, v_ngo_lon, fl.latitude, fl.longitude) as distance_km,
        (fl.expiry_time - NOW()) as time_until_expiry,
        -- Urgency score: combination of distance and time (lower is more urgent)
        (haversine_distance(v_ngo_lat, v_ngo_lon, fl.latitude, fl.longitude) / v_service_radius) +
        (EXTRACT(EPOCH FROM (fl.expiry_time - NOW())) / 3600 / 24) as urgency_score
    FROM food_listings fl
    JOIN donors d ON d.donor_id = fl.donor_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE fl.status IN ('open', 'in_discussion')
      AND fl.is_locked = FALSE
      AND fl.expiry_time > NOW()
      AND haversine_distance(v_ngo_lat, v_ngo_lon, fl.latitude, fl.longitude) <= v_service_radius
    ORDER BY urgency_score ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 5. FIND NEAREST VOLUNTEERS
-- ============================================

-- Function to find available volunteers for an NGO, sorted by proximity to pickup location
CREATE OR REPLACE FUNCTION find_nearest_volunteers(
    p_ngo_id UUID,
    p_pickup_latitude DECIMAL,
    p_pickup_longitude DECIMAL,
    p_max_distance_km DECIMAL DEFAULT 20
)
RETURNS TABLE (
    volunteer_id UUID,
    full_name TEXT,
    phone TEXT,
    vehicle_type vehicle_type,
    availability_status BOOLEAN,
    distance_from_pickup_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.volunteer_id,
        v.full_name,
        v.phone,
        v.vehicle_type,
        v.availability_status,
        -- Note: We don't store volunteer location, so using NGO location as proxy
        haversine_distance(
            p_pickup_latitude, 
            p_pickup_longitude,
            n.latitude,
            n.longitude
        ) as distance_from_pickup_km
    FROM volunteers v
    JOIN ngos n ON n.ngo_id = v.ngo_id
    WHERE v.ngo_id = p_ngo_id
      AND v.availability_status = TRUE
      AND haversine_distance(p_pickup_latitude, p_pickup_longitude, n.latitude, n.longitude) <= p_max_distance_km
    ORDER BY distance_from_pickup_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 6. GEOSPATIAL SEARCH BY CITY
-- ============================================

-- Function to get all open listings in a city
CREATE OR REPLACE FUNCTION get_listings_by_city(
    p_city TEXT
)
RETURNS TABLE (
    listing_id UUID,
    food_type TEXT,
    quantity_kg DECIMAL,
    meal_equivalent INTEGER,
    expiry_time TIMESTAMPTZ,
    pickup_address TEXT,
    donor_name TEXT,
    status listing_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fl.listing_id,
        fl.food_type,
        fl.quantity_kg,
        fl.meal_equivalent,
        fl.expiry_time,
        fl.pickup_address,
        p.full_name as donor_name,
        fl.status
    FROM food_listings fl
    JOIN donors d ON d.donor_id = fl.donor_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.city ILIKE p_city
      AND fl.status = 'open'
      AND fl.expiry_time > NOW()
    ORDER BY fl.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 7. CALCULATE ROUTE DISTANCE
-- ============================================

-- Function to calculate total route distance for delivery
CREATE OR REPLACE FUNCTION calculate_route_distance(
    p_pickup_lat DECIMAL,
    p_pickup_lon DECIMAL,
    p_delivery_lat DECIMAL,
    p_delivery_lon DECIMAL,
    p_ngo_lat DECIMAL,
    p_ngo_lon DECIMAL
)
RETURNS JSON AS $$
DECLARE
    v_ngo_to_pickup DECIMAL;
    v_pickup_to_delivery DECIMAL;
    v_total_distance DECIMAL;
BEGIN
    v_ngo_to_pickup := haversine_distance(p_ngo_lat, p_ngo_lon, p_pickup_lat, p_pickup_lon);
    v_pickup_to_delivery := haversine_distance(p_pickup_lat, p_pickup_lon, p_delivery_lat, p_delivery_lon);
    v_total_distance := v_ngo_to_pickup + v_pickup_to_delivery;
    
    RETURN json_build_object(
        'ngo_to_pickup_km', ROUND(v_ngo_to_pickup, 2),
        'pickup_to_delivery_km', ROUND(v_pickup_to_delivery, 2),
        'total_distance_km', ROUND(v_total_distance, 2)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 8. BULK DISTANCE CALCULATION
-- ============================================

-- View for pre-calculating distances between all NGOs and open listings
CREATE OR REPLACE VIEW ngo_listing_distances AS
SELECT 
    n.ngo_id,
    n.ngo_name,
    fl.listing_id,
    fl.food_type,
    fl.quantity_kg,
    haversine_distance(n.latitude, n.longitude, fl.latitude, fl.longitude) as distance_km,
    CASE 
        WHEN haversine_distance(n.latitude, n.longitude, fl.latitude, fl.longitude) <= n.service_radius_km
        THEN TRUE
        ELSE FALSE
    END as within_service_radius
FROM ngos n
CROSS JOIN food_listings fl
WHERE n.verification_status = TRUE
  AND fl.status = 'open'
  AND fl.is_locked = FALSE
  AND fl.expiry_time > NOW();

COMMENT ON FUNCTION haversine_distance IS 'Calculates great-circle distance between two coordinates in kilometers';
COMMENT ON FUNCTION get_ngos_in_radius IS 'Returns verified NGOs within specified radius of a location';
COMMENT ON FUNCTION match_listing_to_ngos IS 'Finds NGOs that can service a specific food listing';
COMMENT ON FUNCTION get_available_listings_for_ngo IS 'Returns all available listings within NGO service radius';
COMMENT ON FUNCTION find_nearest_volunteers IS 'Finds available volunteers for an NGO near a pickup location';
COMMENT ON FUNCTION get_listings_by_city IS 'Returns all open listings in a specific city';
COMMENT ON FUNCTION calculate_route_distance IS 'Calculates total delivery route distance';
COMMENT ON VIEW ngo_listing_distances IS 'Pre-calculated distances between NGOs and open listings';