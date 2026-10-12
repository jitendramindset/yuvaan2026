/**
 * Authentication & Authorization Middleware
 * 
 * Handles JWT token verification and user authentication
 */

const { supabase } = require('../config/supabase');

/**
 * Authenticate middleware - Verifies JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.slice(7);

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata
    };

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Authorize middleware - Checks user permissions
 */
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Check user permissions from metadata
      const permissions = req.user.user_metadata?.permissions || [];

      if (!permissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          error: `Missing required permission: ${requiredPermission}`
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Authorization failed'
      });
    }
  };
};

/**
 * Optional authentication - Doesn't fail if no token, but sets req.user if valid
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data } = await supabase.auth.getUser(token);

      if (data.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        };
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
