const express = require('express');
const router = express.Router();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * GET /api/geocode/reverse
 * Proxy for Nominatim reverse geocoding
 * Query params: lat, lon, format, addressdetails, etc.
 */
router.get('/reverse', async (req, res) => {
    try {
        const params = new URLSearchParams(req.query).toString();
        const url = `${NOMINATIM_BASE}/reverse?${params}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ExtraToEssential-FoodRedistribution/1.0',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Geocoding request failed',
                status: response.status,
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Reverse geocode proxy error:', error);
        res.status(500).json({
            error: 'Geocoding proxy error',
            message: error.message,
        });
    }
});

/**
 * GET /api/geocode/search
 * Proxy for Nominatim forward (search) geocoding
 * Query params: q, format, limit, addressdetails, countrycodes, etc.
 */
router.get('/search', async (req, res) => {
    try {
        const params = new URLSearchParams(req.query).toString();
        const url = `${NOMINATIM_BASE}/search?${params}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ExtraToEssential-FoodRedistribution/1.0',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Geocoding search failed',
                status: response.status,
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Search geocode proxy error:', error);
        res.status(500).json({
            error: 'Geocoding proxy error',
            message: error.message,
        });
    }
});

module.exports = router;
