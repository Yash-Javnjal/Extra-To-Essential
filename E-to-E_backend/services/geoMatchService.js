const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Match listings to NGOs within service radius
 */
const matchListingToNGOs = async (listingId) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('match_listing_to_ngos', {
      p_listing_id: listingId
    });

    if (error) throw error;

    return {
      success: true,
      matches: data,
      count: data.length
    };
  } catch (error) {
    console.error('Error matching listing to NGOs:', error);
    return {
      success: false,
      error: error.message,
      matches: []
    };
  }
};

/**
 * Get available listings for an NGO
 */
const getAvailableListingsForNGO = async (ngoId) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_available_listings_for_ngo', {
      p_ngo_id: ngoId
    });

    if (error) throw error;

    return {
      success: true,
      listings: data,
      count: data.length
    };
  } catch (error) {
    console.error('Error getting available listings:', error);
    return {
      success: false,
      error: error.message,
      listings: []
    };
  }
};

/**
 * Find NGOs within radius of a location
 */
const getNGOsInRadius = async (latitude, longitude, maxRadiusKm = 50) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_ngos_in_radius', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_max_radius_km: maxRadiusKm
    });

    if (error) throw error;

    return {
      success: true,
      ngos: data,
      count: data.length
    };
  } catch (error) {
    console.error('Error finding NGOs in radius:', error);
    return {
      success: false,
      error: error.message,
      ngos: []
    };
  }
};

/**
 * Find nearest available volunteers
 */
const findNearestVolunteers = async (ngoId, pickupLatitude, pickupLongitude, maxDistanceKm = 20) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('find_nearest_volunteers', {
      p_ngo_id: ngoId,
      p_pickup_latitude: pickupLatitude,
      p_pickup_longitude: pickupLongitude,
      p_max_distance_km: maxDistanceKm
    });

    if (error) throw error;

    return {
      success: true,
      volunteers: data,
      count: data.length
    };
  } catch (error) {
    console.error('Error finding volunteers:', error);
    return {
      success: false,
      error: error.message,
      volunteers: []
    };
  }
};

/**
 * Calculate route distance
 */
const calculateRouteDistance = async (pickupLat, pickupLon, deliveryLat, deliveryLon, ngoLat, ngoLon) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('calculate_route_distance', {
      p_pickup_lat: pickupLat,
      p_pickup_lon: pickupLon,
      p_delivery_lat: deliveryLat,
      p_delivery_lon: deliveryLon,
      p_ngo_lat: ngoLat,
      p_ngo_lon: ngoLon
    });

    if (error) throw error;

    return {
      success: true,
      distance: data
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get listings by city
 */
const getListingsByCity = async (city) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_listings_by_city', {
      p_city: city
    });

    if (error) throw error;

    return {
      success: true,
      listings: data,
      count: data.length
    };
  } catch (error) {
    console.error('Error getting listings by city:', error);
    return {
      success: false,
      error: error.message,
      listings: []
    };
  }
};

/**
 * Auto-notify nearby NGOs when new listing is created
 */
const notifyNearbyNGOs = async (listingId) => {
  try {
    // Get matched NGOs
    const matchResult = await matchListingToNGOs(listingId);
    
    if (!matchResult.success || matchResult.matches.length === 0) {
      return {
        success: true,
        notified: 0,
        message: 'No NGOs found within service radius'
      };
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('food_listings')
      .select('food_type, quantity_kg')
      .eq('listing_id', listingId)
      .single();

    if (listingError) throw listingError;

    // Send notifications to matched NGOs
    const { sendNewListingAlert } = require('./notificationService');
    
    const notifications = matchResult.matches.map(match => ({
      phone: match.phone,
      type: 'claim_alert',
      message: `New donation available: ${listing.quantity_kg} kg of ${listing.food_type}, ${match.distance_km.toFixed(1)} km away. Claim it now!`,
      data: { listingId, distance: match.distance_km }
    }));

    const { sendBulkNotifications } = require('./notificationService');
    const result = await sendBulkNotifications(notifications);

    return {
      success: true,
      notified: result.successful,
      failed: result.failed,
      total: result.total
    };
  } catch (error) {
    console.error('Error notifying NGOs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  matchListingToNGOs,
  getAvailableListingsForNGO,
  getNGOsInRadius,
  findNearestVolunteers,
  calculateRouteDistance,
  getListingsByCity,
  notifyNearbyNGOs
};