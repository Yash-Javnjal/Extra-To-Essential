const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Get total impact metrics
 */
const getTotalImpactMetrics = async () => {
  try {
    // Try the RPC first for impact stats
    let metrics = {};
    const { data, error } = await supabaseAdmin.rpc('get_total_impact_metrics');

    if (!error && data) {
      metrics = data;
    } else {
      console.warn('RPC get_total_impact_metrics failed, using fallback queries for impact:', error?.message);

      // Sum food kg from impact_metrics
      let totalFoodKg = 0;
      let totalCo2Kg = 0;

      const { data: impactData } = await supabaseAdmin
        .from('impact_metrics')
        .select('food_saved_kg, co2_emissions_reduced_kg');

      if (impactData && impactData.length > 0) {
        totalFoodKg = impactData.reduce((sum, row) => sum + (parseFloat(row.food_saved_kg) || 0), 0);
        totalCo2Kg = impactData.reduce((sum, row) => sum + (parseFloat(row.co2_emissions_reduced_kg) || 0), 0);
      } else {
        // Try food_listings as alternative
        const { data: listings } = await supabaseAdmin
          .from('food_listings')
          .select('quantity_kg');

        if (listings && listings.length > 0) {
          totalFoodKg = listings.reduce((sum, row) => sum + (parseFloat(row.quantity_kg) || 0), 0);
          totalCo2Kg = totalFoodKg * 2.5; // approximate
        }
      }

      metrics = {
        total_food_saved_kg: Math.round(totalFoodKg),
        total_co2_reduced_kg: Math.round(totalCo2Kg * 100) / 100,
      };
    }

    // ALWAYS fetch counts from profiles table as requested
    const { count: ngoCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ngo');

    const { count: donorCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'donor');

    return {
      success: true,
      metrics: {
        ...metrics,
        total_ngos: ngoCount || 0,
        total_donors: donorCount || 0,
        ngo_count: ngoCount || 0,
        donor_count: donorCount || 0,
      }
    };
  } catch (error) {
    console.error('Error getting total impact:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get impact by time period
 */
const getImpactByPeriod = async (startDate, endDate) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_impact_by_period', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) throw error;

    return {
      success: true,
      metrics: data
    };
  } catch (error) {
    console.error('Error getting period impact:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get donor leaderboard
 */
const getDonorLeaderboard = async (limit = 10) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_donor_leaderboard', {
      p_limit: limit
    });

    if (error) throw error;

    return {
      success: true,
      leaderboard: data
    };
  } catch (error) {
    console.error('Error getting donor leaderboard:', error);
    return {
      success: false,
      error: error.message,
      leaderboard: []
    };
  }
};

/**
 * Get NGO performance metrics
 */
const getNGOPerformance = async (limit = 10) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_ngo_performance', {
      p_limit: limit
    });

    if (error) throw error;

    return {
      success: true,
      performance: data
    };
  } catch (error) {
    console.error('Error getting NGO performance:', error);
    return {
      success: false,
      error: error.message,
      performance: []
    };
  }
};

/**
 * Get daily impact trend
 */
const getDailyImpactTrend = async (days = 30) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_daily_impact_trend', {
      p_days: days
    });

    if (error) throw error;

    return {
      success: true,
      trend: data
    };
  } catch (error) {
    console.error('Error getting daily trend:', error);
    return {
      success: false,
      error: error.message,
      trend: []
    };
  }
};

/**
 * Get impact by city
 */
const getImpactByCity = async () => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_impact_by_city');

    if (error) throw error;

    return {
      success: true,
      cityImpact: data
    };
  } catch (error) {
    console.error('Error getting city impact:', error);
    return {
      success: false,
      error: error.message,
      cityImpact: []
    };
  }
};

/**
 * Get volunteer performance
 */
const getVolunteerPerformance = async (ngoId = null) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_volunteer_performance', {
      p_ngo_id: ngoId
    });

    if (error) throw error;

    return {
      success: true,
      performance: data
    };
  } catch (error) {
    console.error('Error getting volunteer performance:', error);
    return {
      success: false,
      error: error.message,
      performance: []
    };
  }
};

/**
 * Get food type distribution
 */
const getFoodTypeDistribution = async () => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_food_type_distribution');

    if (error) throw error;

    return {
      success: true,
      distribution: data
    };
  } catch (error) {
    console.error('Error getting food distribution:', error);
    return {
      success: false,
      error: error.message,
      distribution: []
    };
  }
};

/**
 * Get dashboard summary
 */
const getDashboardSummary = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('dashboard_summary')
      .select('*')
      .single();

    if (error) throw error;

    return {
      success: true,
      summary: data
    };
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get donor-specific impact
 */
const getDonorImpact = async (donorId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('impact_metrics')
      .select(`
        *,
        food_listings!inner (
          donor_id,
          food_type,
          quantity_kg,
          created_at
        )
      `)
      .eq('food_listings.donor_id', donorId);

    if (error) throw error;

    // Aggregate metrics
    const totalImpact = data.reduce((acc, metric) => ({
      total_meals: acc.total_meals + (metric.meals_served || 0),
      total_food_kg: acc.total_food_kg + (parseFloat(metric.food_saved_kg) || 0),
      total_co2_kg: acc.total_co2_kg + (parseFloat(metric.co2_emissions_reduced_kg) || 0),
      total_value: acc.total_value + (parseFloat(metric.monetary_value) || 0),
      listing_count: acc.listing_count + 1
    }), {
      total_meals: 0,
      total_food_kg: 0,
      total_co2_kg: 0,
      total_value: 0,
      listing_count: 0
    });

    return {
      success: true,
      impact: {
        ...totalImpact,
        details: data
      }
    };
  } catch (error) {
    console.error('Error getting donor impact:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get NGO-specific impact
 */
const getNGOImpact = async (ngoId) => {
  try {
    // Step 1: Get all listing IDs that this NGO has claimed
    const { data: claims, error: claimsError } = await supabaseAdmin
      .from('ngo_claims')
      .select('listing_id')
      .eq('ngo_id', ngoId);

    if (claimsError) throw claimsError;

    if (!claims || claims.length === 0) {
      return {
        success: true,
        impact: {
          total_meals: 0,
          total_food_kg: 0,
          total_co2_kg: 0,
          total_value: 0,
          delivery_count: 0,
          details: []
        }
      };
    }

    const listingIds = claims.map(c => c.listing_id);

    // Step 2: Get impact metrics for those listings
    const { data, error } = await supabaseAdmin
      .from('impact_metrics')
      .select(`
        *,
        food_listings (
          listing_id,
          food_type,
          quantity_kg
        )
      `)
      .in('listing_id', listingIds);

    if (error) throw error;

    // Aggregate metrics
    const totalImpact = (data || []).reduce((acc, metric) => ({
      total_meals: acc.total_meals + (metric.meals_served || 0),
      total_food_kg: acc.total_food_kg + (parseFloat(metric.food_saved_kg) || 0),
      total_co2_kg: acc.total_co2_kg + (parseFloat(metric.co2_emissions_reduced_kg) || 0),
      total_value: acc.total_value + (parseFloat(metric.monetary_value) || 0),
      delivery_count: acc.delivery_count + 1
    }), {
      total_meals: 0,
      total_food_kg: 0,
      total_co2_kg: 0,
      total_value: 0,
      delivery_count: 0
    });

    return {
      success: true,
      impact: {
        ...totalImpact,
        details: data || []
      }
    };
  } catch (error) {
    console.error('Error getting NGO impact:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Manual impact calculation (for debugging)
 */
const calculateImpactMetrics = (foodKg, mealEquivalent) => {
  const co2Reduced = parseFloat(foodKg) * 2.5; // 2.5 kg CO2 per kg food
  const monetaryValue = parseInt(mealEquivalent) * 3.0; // $3 per meal

  return {
    meals_served: mealEquivalent,
    food_saved_kg: parseFloat(foodKg),
    co2_emissions_reduced_kg: parseFloat(co2Reduced.toFixed(2)),
    monetary_value: parseFloat(monetaryValue.toFixed(2))
  };
};

module.exports = {
  getTotalImpactMetrics,
  getImpactByPeriod,
  getDonorLeaderboard,
  getNGOPerformance,
  getDailyImpactTrend,
  getImpactByCity,
  getVolunteerPerformance,
  getFoodTypeDistribution,
  getDashboardSummary,
  getDonorImpact,
  getNGOImpact,
  calculateImpactMetrics
};