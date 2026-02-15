const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Find the best available volunteer for an NGO.
 * Currently selects the first available one, but can be extended for smarter logic
 * (e.g., location-based, vehicle type, workload balancing).
 * 
 * @param {string} ngoId - The UUID of the NGO
 * @returns {Promise<object|null>} The volunteer object or null if none available
 */
async function findBestVolunteer(ngoId) {
    try {
        const { data: volunteer, error } = await supabaseAdmin
            .from('volunteers')
            .select('volunteer_id, full_name, phone, vehicle_type')
            .eq('ngo_id', ngoId)
            .eq('availability_status', true)
            .limit(1)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // PGRST116 is "Relation null" (no rows), which is expected if no volunteers
                console.error('[VolunteerService] Error finding volunteer:', error);
            }
            return null;
        }

        return volunteer;
    } catch (err) {
        console.error('[VolunteerService] Unexpected error:', err);
        return null;
    }
}

module.exports = {
    findBestVolunteer
};
