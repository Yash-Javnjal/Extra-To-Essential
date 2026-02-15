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
 * Get available listings for an NGO — returns ALL open listings, not radius-filtered.
 * Distance is still calculated so the NGO can see how far each donor is.
 */
const getAvailableListingsForNGO = async (ngoId) => {
  try {
    // 1. Get the NGO's own coordinates for distance calculation
    const { data: ngo, error: ngoError } = await supabaseAdmin
      .from('ngos')
      .select('latitude, longitude, service_radius_km')
      .eq('ngo_id', ngoId)
      .single();

    if (ngoError || !ngo) {
      throw new Error(ngoError?.message || 'NGO not found');
    }

    // 2. Fetch ALL open/in_discussion listings (no radius filter)
    const { data: listings, error: listError } = await supabaseAdmin
      .from('food_listings')
      .select(`
        listing_id,
        food_type,
        quantity_kg,
        meal_equivalent,
        expiry_time,
        pickup_address,
        latitude,
        longitude,
        status,
        is_locked,
        created_at,
        donors (
          donor_id,
          city,
          address,
          profile_id,
          profiles (
            full_name,
            phone,
            organization_name
          )
        )
      `)
      .in('status', ['open', 'in_discussion'])
      .eq('is_locked', false)
      .gt('expiry_time', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (listError) throw listError;

    // 3. Calculate distance from NGO to each listing (Haversine in JS)
    const toRad = (deg) => (deg * Math.PI) / 180;
    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const enriched = (listings || []).map((l) => {
      const dist =
        l.latitude && l.longitude && ngo.latitude && ngo.longitude
          ? haversine(ngo.latitude, ngo.longitude, l.latitude, l.longitude)
          : null;

      const donor = l.donors;
      return {
        listing_id: l.listing_id,
        food_type: l.food_type,
        quantity_kg: l.quantity_kg,
        meal_equivalent: l.meal_equivalent,
        expiry_time: l.expiry_time,
        pickup_address: l.pickup_address,
        donor_name: donor?.profiles?.full_name || donor?.profiles?.organization_name || null,
        organization_name: donor?.profiles?.organization_name || null,
        phone: donor?.profiles?.phone || null,
        distance_km: dist != null ? parseFloat(dist.toFixed(2)) : null,
        within_service_radius: dist != null ? dist <= (ngo.service_radius_km || 10) : null,
        time_until_expiry: l.expiry_time ? new Date(l.expiry_time) - new Date() : null,
      };
    });

    // Sort by distance (nearest first), nulls last
    enriched.sort((a, b) => {
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });

    return {
      success: true,
      listings: enriched,
      count: enriched.length
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