/**
 * Admin Authentication & Authorization Middleware
 * 
 * Middleware functions for:
 * - Admin role verification
 * - Permission checking
 * - Audit logging
 * - Request validation
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Require authentication
 * Verifies JWT token from Authorization header
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Verify JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      organization_id: data.user.user_metadata?.organization_id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Require admin role
 * Checks if authenticated user has admin role
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', req.user.id)
      .single();

    if (error || !userRole || userRole.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    req.admin = {
      role: userRole.role,
      permissions: userRole.permissions || []
    };

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Require specific permission
 * Checks if admin has specific permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const hasPermission = req.admin.permissions.includes(permission) || 
                           req.admin.permissions.includes('*');

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Permission required: ${permission}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
};

/**
 * Log admin action
 * Logs all admin actions for audit trail
 */
const logAdminAction = (action) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;

    // Override res.json to log after response
    res.json = function(data) {
      if (req.user && data.success && action) {
        // Log asynchronously (don't block response)
        supabase.from('admin_audit_logs').insert({
          admin_id: req.user.id,
          action: action,
          details: {
            path: req.path,
            method: req.method,
            body: sanitizeData(req.body)
          },
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          created_at: new Date().toISOString()
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }

      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Sanitize sensitive data before logging
 */
const sanitizeData = (data) => {
  if (!data) return data;

  const sensitive = ['password', 'token', 'secret', 'key', 'api_key'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
};

/**
 * Validate admin request body
 * Ensures required fields are present
 */
const validateAdminRequest = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !(field in req.body));

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Rate limit for admin operations
 * Prevents abuse of admin endpoints
 */
const adminRateLimit = (() => {
  const limits = new Map();
  const LIMIT = 100; // 100 requests
  const WINDOW = 60 * 1000; // Per minute

  return (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return next();

    const now = Date.now();
    const userLimit = limits.get(userId) || { count: 0, resetTime: now + WINDOW };

    if (now > userLimit.resetTime) {
      limits.set(userId, { count: 1, resetTime: now + WINDOW });
    } else {
      userLimit.count++;
      if (userLimit.count > LIMIT) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Try again later.'
        });
      }
    }

    next();
  };
};

/**
 * Verify organization access
 * Ensures user can only access own organization data
 */
const verifyOrgAccess = async (req, res, next) => {
  try {
    const orgId = req.body.organization_id || req.query.org_id;
    
    if (!orgId) {
      return next(); // Skip if no org specified
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', req.user.id)
      .single();

    const userOrgId = userRole?.organization_id;

    if (userOrgId && userOrgId !== orgId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to organization'
      });
    }

    req.organizationId = orgId;
    next();
  } catch (error) {
    console.error('Org access verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Error handling middleware
 * Catches and logs all errors
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Log critical errors
  if (err.status >= 500) {
    supabase.from('admin_audit_logs').insert({
      admin_id: req.user?.id || 'unknown',
      action: 'ERROR',
      details: {
        message: err.message,
        stack: err.stack,
        path: req.path
      },
      ip_address: req.ip,
      created_at: new Date().toISOString()
    }).catch(() => {});
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message,
    status: status
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePermission,
  logAdminAction,
  sanitizeData,
  validateAdminRequest,
  adminRateLimit,
  verifyOrgAccess,
  errorHandler
};
