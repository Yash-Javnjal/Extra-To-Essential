const express = require('express');
const router = express.Router();
const {
  getTotalImpactMetrics,
  getImpactByPeriod,
  getDonorLeaderboard,
  getNGOPerformance,
  getDailyImpactTrend,
  getImpactByCity,
  getVolunteerPerformance,
  getFoodTypeDistribution,
  getDashboardSummary
} = require('../services/impactService');

/**
 * GET /api/impact/total
 * Get total impact metrics across all time
 */
router.get('/total', async (req, res) => {
  try {
    const result = await getTotalImpactMetrics();

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get impact metrics',
        message: result.error
      });
    }

    res.json({
      metrics: result.metrics
    });

  } catch (error) {
    console.error('Get total impact error:', error);
    res.status(500).json({
      error: 'Failed to get impact metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/period
 * Get impact metrics for specific time period
 */
router.get('/period', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['start_date', 'end_date']
      });
    }

    const result = await getImpactByPeriod(start_date, end_date);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get period impact',
        message: result.error
      });
    }

    res.json({
      metrics: result.metrics
    });

  } catch (error) {
    console.error('Get period impact error:', error);
    res.status(500).json({
      error: 'Failed to get period impact',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/leaderboard/donors
 * Get donor leaderboard
 */
router.get('/leaderboard/donors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await getDonorLeaderboard(limit);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get donor leaderboard',
        message: result.error
      });
    }

    res.json({
      leaderboard: result.leaderboard
    });

  } catch (error) {
    console.error('Get donor leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to get donor leaderboard',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/performance/ngos
 * Get NGO performance metrics
 */
router.get('/performance/ngos', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await getNGOPerformance(limit);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get NGO performance',
        message: result.error
      });
    }

    res.json({
      performance: result.performance
    });

  } catch (error) {
    console.error('Get NGO performance error:', error);
    res.status(500).json({
      error: 'Failed to get NGO performance',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/trend/daily
 * Get daily impact trend
 */
router.get('/trend/daily', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const result = await getDailyImpactTrend(days);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get daily trend',
        message: result.error
      });
    }

    res.json({
      trend: result.trend
    });

  } catch (error) {
    console.error('Get daily trend error:', error);
    res.status(500).json({
      error: 'Failed to get daily trend',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/city
 * Get impact breakdown by city
 */
router.get('/city', async (req, res) => {
  try {
    const result = await getImpactByCity();

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get city impact',
        message: result.error
      });
    }

    res.json({
      cityImpact: result.cityImpact
    });

  } catch (error) {
    console.error('Get city impact error:', error);
    res.status(500).json({
      error: 'Failed to get city impact',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/performance/volunteers
 * Get volunteer performance metrics
 */
router.get('/performance/volunteers', async (req, res) => {
  try {
    const ngoId = req.query.ngo_id || null;

    const result = await getVolunteerPerformance(ngoId);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get volunteer performance',
        message: result.error
      });
    }

    res.json({
      performance: result.performance
    });

  } catch (error) {
    console.error('Get volunteer performance error:', error);
    res.status(500).json({
      error: 'Failed to get volunteer performance',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/distribution/food-types
 * Get food type distribution
 */
router.get('/distribution/food-types', async (req, res) => {
  try {
    const result = await getFoodTypeDistribution();

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get food distribution',
        message: result.error
      });
    }

    res.json({
      distribution: result.distribution
    });

  } catch (error) {
    console.error('Get food distribution error:', error);
    res.status(500).json({
      error: 'Failed to get food distribution',
      message: error.message
    });
  }
});

/**
 * GET /api/impact/dashboard
 * Get comprehensive dashboard summary
 */
router.get('/dashboard', async (req, res) => {
  try {
    const result = await getDashboardSummary();

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to get dashboard summary',
        message: result.error
      });
    }

    res.json({
      summary: result.summary
    });

  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard summary',
      message: error.message
    });
  }
});

module.exports = router;