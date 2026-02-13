/**
 * Role-based access control middleware
 * Requires authenticateUser middleware to run first
 */

/**
 * Donor-only access
 */
const donorOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'donor') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Donor access required'
    });
  }

  next();
};

/**
 * NGO-only access
 */
const ngoOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'ngo') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'NGO access required'
    });
  }

  next();
};

/**
 * Admin-only access
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Allow multiple roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access restricted to: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Verify user owns the resource
 */
const ownsResource = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const resourceId = req.params[resourceIdParam];
    
    // For donors, check donor_id
    if (req.user.role === 'donor') {
      const { supabaseAdmin } = require('../config/supabaseClient');
      const { data: donor } = await supabaseAdmin
        .from('donors')
        .select('donor_id')
        .eq('profile_id', req.user.id)
        .single();
      
      if (!donor || donor.donor_id !== resourceId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own resources'
        });
      }
    }
    
    // For NGOs, check ngo_id
    if (req.user.role === 'ngo') {
      const { supabaseAdmin } = require('../config/supabaseClient');
      const { data: ngo } = await supabaseAdmin
        .from('ngos')
        .select('ngo_id')
        .eq('profile_id', req.user.id)
        .single();
      
      if (!ngo || ngo.ngo_id !== resourceId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own resources'
        });
      }
    }

    next();
  };
};

module.exports = {
  donorOnly,
  ngoOnly,
  adminOnly,
  requireRole,
  ownsResource
};