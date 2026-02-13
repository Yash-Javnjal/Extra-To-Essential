-- ============================================
-- IMPACT DASHBOARD QUERIES & VIEWS
-- Smart Surplus Food Redistribution System
-- ============================================

-- ============================================
-- 1. TOTAL IMPACT METRICS AGGREGATION
-- ============================================

CREATE OR REPLACE FUNCTION get_total_impact_metrics()
RETURNS JSON AS $$
DECLARE
    v_total_meals INTEGER;
    v_total_food_kg DECIMAL;
    v_total_co2_kg DECIMAL;
    v_total_value DECIMAL;
    v_total_deliveries INTEGER;
    v_active_donors INTEGER;
    v_active_ngos INTEGER;
    v_active_volunteers INTEGER;
BEGIN
    -- Aggregate impact metrics
    SELECT 
        COALESCE(SUM(meals_served), 0),
        COALESCE(SUM(food_saved_kg), 0),
        COALESCE(SUM(co2_emissions_reduced_kg), 0),
        COALESCE(SUM(monetary_value), 0)
    INTO 
        v_total_meals,
        v_total_food_kg,
        v_total_co2_kg,
        v_total_value
    FROM impact_metrics;
    
    -- Count completed deliveries
    SELECT COUNT(*) INTO v_total_deliveries
    FROM deliveries
    WHERE delivery_status = 'delivered';
    
    -- Count active donors (at least one completed listing)
    SELECT COUNT(DISTINCT d.donor_id) INTO v_active_donors
    FROM donors d
    JOIN food_listings fl ON fl.donor_id = d.donor_id
    WHERE fl.status = 'completed';
    
    -- Count active NGOs (at least one completed delivery)
    SELECT COUNT(DISTINCT n.ngo_id) INTO v_active_ngos
    FROM ngos n
    JOIN ngo_claims nc ON nc.ngo_id = n.ngo_id
    JOIN deliveries dv ON dv.claim_id = nc.claim_id
    WHERE dv.delivery_status = 'delivered';
    
    -- Count active volunteers
    SELECT COUNT(*) INTO v_active_volunteers
    FROM volunteers
    WHERE availability_status = TRUE;
    
    RETURN json_build_object(
        'total_meals_served', v_total_meals,
        'total_food_saved_kg', ROUND(v_total_food_kg, 2),
        'total_co2_reduced_kg', ROUND(v_total_co2_kg, 2),
        'total_monetary_value', ROUND(v_total_value, 2),
        'total_completed_deliveries', v_total_deliveries,
        'active_donors', v_active_donors,
        'active_ngos', v_active_ngos,
        'active_volunteers', v_active_volunteers,
        'generated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 2. IMPACT METRICS BY TIME PERIOD
-- ============================================

CREATE OR REPLACE FUNCTION get_impact_by_period(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'period_start', p_start_date,
        'period_end', p_end_date,
        'total_meals', COALESCE(SUM(im.meals_served), 0),
        'total_food_kg', COALESCE(ROUND(SUM(im.food_saved_kg), 2), 0),
        'total_co2_kg', COALESCE(ROUND(SUM(im.co2_emissions_reduced_kg), 2), 0),
        'total_value', COALESCE(ROUND(SUM(im.monetary_value), 2), 0),
        'deliveries_count', COUNT(DISTINCT d.delivery_id)
    )
    INTO v_result
    FROM impact_metrics im
    JOIN food_listings fl ON fl.listing_id = im.listing_id
    JOIN ngo_claims nc ON nc.listing_id = fl.listing_id
    JOIN deliveries d ON d.claim_id = nc.claim_id
    WHERE im.created_at BETWEEN p_start_date AND p_end_date
      AND d.delivery_status = 'delivered';
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 3. DONOR LEADERBOARD
-- ============================================

CREATE OR REPLACE FUNCTION get_donor_leaderboard(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    rank INTEGER,
    donor_id UUID,
    donor_name TEXT,
    organization_name TEXT,
    total_listings INTEGER,
    total_meals INTEGER,
    total_food_kg DECIMAL,
    total_co2_kg DECIMAL,
    total_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(im.meals_served), 0) DESC)::INTEGER as rank,
        d.donor_id,
        p.full_name as donor_name,
        p.organization_name,
        COUNT(DISTINCT fl.listing_id)::INTEGER as total_listings,
        COALESCE(SUM(im.meals_served), 0)::INTEGER as total_meals,
        COALESCE(ROUND(SUM(im.food_saved_kg), 2), 0) as total_food_kg,
        COALESCE(ROUND(SUM(im.co2_emissions_reduced_kg), 2), 0) as total_co2_kg,
        COALESCE(ROUND(SUM(im.monetary_value), 2), 0) as total_value
    FROM donors d
    JOIN profiles p ON p.id = d.profile_id
    LEFT JOIN food_listings fl ON fl.donor_id = d.donor_id AND fl.status = 'completed'
    LEFT JOIN impact_metrics im ON im.listing_id = fl.listing_id
    GROUP BY d.donor_id, p.full_name, p.organization_name
    HAVING COUNT(DISTINCT fl.listing_id) > 0
    ORDER BY total_meals DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 4. NGO PERFORMANCE METRICS
-- ============================================

CREATE OR REPLACE FUNCTION get_ngo_performance(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    rank INTEGER,
    ngo_id UUID,
    ngo_name TEXT,
    total_claims INTEGER,
    completed_deliveries INTEGER,
    total_meals_distributed INTEGER,
    total_food_kg DECIMAL,
    success_rate DECIMAL,
    avg_response_time_minutes DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT CASE WHEN d.delivery_status = 'delivered' THEN d.delivery_id END) DESC)::INTEGER as rank,
        n.ngo_id,
        n.ngo_name,
        COUNT(DISTINCT nc.claim_id)::INTEGER as total_claims,
        COUNT(DISTINCT CASE WHEN d.delivery_status = 'delivered' THEN d.delivery_id END)::INTEGER as completed_deliveries,
        COALESCE(SUM(im.meals_served), 0)::INTEGER as total_meals_distributed,
        COALESCE(ROUND(SUM(im.food_saved_kg), 2), 0) as total_food_kg,
        CASE 
            WHEN COUNT(DISTINCT nc.claim_id) > 0 
            THEN ROUND((COUNT(DISTINCT CASE WHEN d.delivery_status = 'delivered' THEN d.delivery_id END)::DECIMAL / COUNT(DISTINCT nc.claim_id)::DECIMAL) * 100, 2)
            ELSE 0
        END as success_rate,
        COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (nc.acceptance_time - fl.created_at)) / 60), 2), 0) as avg_response_time_minutes
    FROM ngos n
    LEFT JOIN ngo_claims nc ON nc.ngo_id = n.ngo_id
    LEFT JOIN deliveries d ON d.claim_id = nc.claim_id
    LEFT JOIN food_listings fl ON fl.listing_id = nc.listing_id
    LEFT JOIN impact_metrics im ON im.listing_id = fl.listing_id
    WHERE n.verification_status = TRUE
    GROUP BY n.ngo_id, n.ngo_name
    HAVING COUNT(DISTINCT nc.claim_id) > 0
    ORDER BY completed_deliveries DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 5. DAILY IMPACT TRENDS
-- ============================================

CREATE OR REPLACE FUNCTION get_daily_impact_trend(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    meals_served INTEGER,
    food_saved_kg DECIMAL,
    co2_reduced_kg DECIMAL,
    deliveries_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        im.created_at::DATE as date,
        COALESCE(SUM(im.meals_served), 0)::INTEGER as meals_served,
        COALESCE(ROUND(SUM(im.food_saved_kg), 2), 0) as food_saved_kg,
        COALESCE(ROUND(SUM(im.co2_emissions_reduced_kg), 2), 0) as co2_reduced_kg,
        COUNT(DISTINCT d.delivery_id)::INTEGER as deliveries_count
    FROM impact_metrics im
    JOIN food_listings fl ON fl.listing_id = im.listing_id
    JOIN ngo_claims nc ON nc.listing_id = fl.listing_id
    JOIN deliveries d ON d.claim_id = nc.claim_id
    WHERE im.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND d.delivery_status = 'delivered'
    GROUP BY im.created_at::DATE
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 6. CITY-WISE IMPACT BREAKDOWN
-- ============================================

CREATE OR REPLACE FUNCTION get_impact_by_city()
RETURNS TABLE (
    city TEXT,
    total_donors INTEGER,
    total_ngos INTEGER,
    total_listings INTEGER,
    total_meals INTEGER,
    total_food_kg DECIMAL,
    total_co2_kg DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.city,
        COUNT(DISTINCT d.donor_id)::INTEGER as total_donors,
        COUNT(DISTINCT n.ngo_id)::INTEGER as total_ngos,
        COUNT(DISTINCT fl.listing_id)::INTEGER as total_listings,
        COALESCE(SUM(im.meals_served), 0)::INTEGER as total_meals,
        COALESCE(ROUND(SUM(im.food_saved_kg), 2), 0) as total_food_kg,
        COALESCE(ROUND(SUM(im.co2_emissions_reduced_kg), 2), 0) as total_co2_kg
    FROM donors d
    LEFT JOIN food_listings fl ON fl.donor_id = d.donor_id AND fl.status = 'completed'
    LEFT JOIN impact_metrics im ON im.listing_id = fl.listing_id
    LEFT JOIN ngos n ON n.city = d.city
    GROUP BY d.city
    ORDER BY total_meals DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 7. REAL-TIME DASHBOARD VIEW
-- ============================================

CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    -- Overall Metrics
    (SELECT COUNT(*) FROM food_listings WHERE status = 'open') as open_listings,
    (SELECT COUNT(*) FROM food_listings WHERE status = 'in_discussion') as in_discussion_listings,
    (SELECT COUNT(*) FROM food_listings WHERE status = 'claimed') as claimed_listings,
    (SELECT COUNT(*) FROM deliveries WHERE delivery_status = 'in_transit') as active_deliveries,
    
    -- Impact Metrics
    (SELECT COALESCE(SUM(meals_served), 0) FROM impact_metrics) as total_meals_served,
    (SELECT COALESCE(ROUND(SUM(food_saved_kg), 2), 0) FROM impact_metrics) as total_food_saved_kg,
    (SELECT COALESCE(ROUND(SUM(co2_emissions_reduced_kg), 2), 0) FROM impact_metrics) as total_co2_reduced_kg,
    (SELECT COALESCE(ROUND(SUM(monetary_value), 2), 0) FROM impact_metrics) as total_monetary_value,
    
    -- Entity Counts
    (SELECT COUNT(*) FROM donors WHERE verification_status = TRUE) as verified_donors,
    (SELECT COUNT(*) FROM ngos WHERE verification_status = TRUE) as verified_ngos,
    (SELECT COUNT(*) FROM volunteers WHERE availability_status = TRUE) as available_volunteers,
    
    -- Today's Activity
    (SELECT COUNT(*) FROM food_listings WHERE created_at::DATE = CURRENT_DATE) as listings_today,
    (SELECT COUNT(*) FROM deliveries WHERE delivery_status = 'delivered' AND delivery_time::DATE = CURRENT_DATE) as deliveries_today,
    (SELECT COALESCE(SUM(meals_served), 0) FROM impact_metrics WHERE created_at::DATE = CURRENT_DATE) as meals_served_today,
    
    NOW() as generated_at;

-- ============================================
-- 8. VOLUNTEER PERFORMANCE METRICS
-- ============================================

CREATE OR REPLACE FUNCTION get_volunteer_performance(
    p_ngo_id UUID DEFAULT NULL
)
RETURNS TABLE (
    volunteer_id UUID,
    volunteer_name TEXT,
    ngo_name TEXT,
    total_deliveries INTEGER,
    completed_deliveries INTEGER,
    failed_deliveries INTEGER,
    total_meals_delivered INTEGER,
    avg_delivery_time_hours DECIMAL,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.volunteer_id,
        v.full_name as volunteer_name,
        n.ngo_name,
        COUNT(DISTINCT d.delivery_id)::INTEGER as total_deliveries,
        COUNT(DISTINCT CASE WHEN d.delivery_status = 'delivered' THEN d.delivery_id END)::INTEGER as completed_deliveries,
        COUNT(DISTINCT CASE WHEN d.delivery_status = 'failed' THEN d.delivery_id END)::INTEGER as failed_deliveries,
        COALESCE(SUM(CASE WHEN d.delivery_status = 'delivered' THEN im.meals_served ELSE 0 END), 0)::INTEGER as total_meals_delivered,
        COALESCE(ROUND(AVG(CASE 
            WHEN d.delivery_time IS NOT NULL AND d.pickup_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (d.delivery_time - d.pickup_time)) / 3600
            ELSE NULL 
        END), 2), 0) as avg_delivery_time_hours,
        CASE 
            WHEN COUNT(DISTINCT d.delivery_id) > 0
            THEN ROUND((COUNT(DISTINCT CASE WHEN d.delivery_status = 'delivered' THEN d.delivery_id END)::DECIMAL / COUNT(DISTINCT d.delivery_id)::DECIMAL) * 100, 2)
            ELSE 0
        END as success_rate
    FROM volunteers v
    JOIN ngos n ON n.ngo_id = v.ngo_id
    LEFT JOIN deliveries d ON d.volunteer_id = v.volunteer_id
    LEFT JOIN ngo_claims nc ON nc.claim_id = d.claim_id
    LEFT JOIN impact_metrics im ON im.listing_id = nc.listing_id
    WHERE (p_ngo_id IS NULL OR v.ngo_id = p_ngo_id)
    GROUP BY v.volunteer_id, v.full_name, n.ngo_name
    HAVING COUNT(DISTINCT d.delivery_id) > 0
    ORDER BY completed_deliveries DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 9. FOOD TYPE DISTRIBUTION
-- ============================================

CREATE OR REPLACE FUNCTION get_food_type_distribution()
RETURNS TABLE (
    food_type TEXT,
    total_listings INTEGER,
    total_quantity_kg DECIMAL,
    total_meals INTEGER,
    percentage_of_total DECIMAL
) AS $$
DECLARE
    v_total_listings INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_listings 
    FROM food_listings 
    WHERE status = 'completed';
    
    RETURN QUERY
    SELECT 
        fl.food_type,
        COUNT(DISTINCT fl.listing_id)::INTEGER as total_listings,
        COALESCE(ROUND(SUM(fl.quantity_kg), 2), 0) as total_quantity_kg,
        COALESCE(SUM(im.meals_served), 0)::INTEGER as total_meals,
        CASE 
            WHEN v_total_listings > 0 
            THEN ROUND((COUNT(DISTINCT fl.listing_id)::DECIMAL / v_total_listings::DECIMAL) * 100, 2)
            ELSE 0
        END as percentage_of_total
    FROM food_listings fl
    LEFT JOIN impact_metrics im ON im.listing_id = fl.listing_id
    WHERE fl.status = 'completed'
    GROUP BY fl.food_type
    ORDER BY total_listings DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_total_impact_metrics IS 'Returns comprehensive impact metrics across all time';
COMMENT ON FUNCTION get_impact_by_period IS 'Returns impact metrics for a specific time period';
COMMENT ON FUNCTION get_donor_leaderboard IS 'Returns top donors by meals served';
COMMENT ON FUNCTION get_ngo_performance IS 'Returns NGO performance metrics including success rate';
COMMENT ON FUNCTION get_daily_impact_trend IS 'Returns daily impact trends for the past N days';
COMMENT ON FUNCTION get_impact_by_city IS 'Returns impact breakdown by city';
COMMENT ON FUNCTION get_volunteer_performance IS 'Returns volunteer performance metrics';
COMMENT ON FUNCTION get_food_type_distribution IS 'Returns distribution of food types donated';
COMMENT ON VIEW dashboard_summary IS 'Real-time dashboard summary with key metrics';