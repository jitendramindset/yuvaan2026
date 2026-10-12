/**
 * 🔐 MIDDLEWARE - Authentication & Authorization
 * 
 * Global middleware for:
 *  ✅ JWT validation
 *  ✅ Permission checking
 *  ✅ Rate limiting
 *  ✅ Request validation
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

// ═════════════════════════════════════════════════════════════════
// 1. JWT AUTHENTICATION MIDDLEWARE
// ═════════════════════════════════════════════════════════════════

/**
 * Verify JWT token from Authorization header
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);

    // Verify with JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Attach user to request (support both id and userId for compat)
    req.user = {
      id: decoded.userId || decoded.sub || decoded.user_id,
      userId: decoded.userId || decoded.sub || decoded.user_id,
      email: decoded.email,
      userNodeId: decoded.node_id,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth - don't fail, just set req.user
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      req.user = {
        userId: decoded.sub || decoded.user_id,
        email: decoded.email,
        userNodeId: decoded.node_id,
      };
    }

    next();
  } catch (error) {
    // Silent fail - continue as anonymous
    next();
  }
}

// ═════════════════════════════════════════════════════════════════
// 2. PERMISSION CHECK MIDDLEWARE
// ═════════════════════════════════════════════════════════════════

/**
 * Check if user has permission to access a resource
 */
async function checkNodePermission(req, res, next) {
  try {
    const { nodeId } = req.params;

    if (!nodeId) {
      return res.status(400).json({ error: 'nodeId required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get node details
    const { data: node, error: nodeError } = await supabase
      .from('node_core')
      .select('node_id, visibility, permissions, owner_node')
      .eq('node_id', nodeId)
      .single();

    if (nodeError || !node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check visibility & permissions
    const canAccess =
      node.visibility === 'public' ||
      node.owner_node === req.user.userNodeId ||
      (node.permissions?.read?.includes(req.user.userId));

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Attach node to request
    req.node = node;
    next();
  } catch (error) {
    console.error('Permission check error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Check if user is admin
 */
async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin (has admin node or super permission)
    const { data: adminCheck } = await supabase
      .from('node_core')
      .select('node_id')
      .eq('node_type', 'admin')
      .eq('owner_node', req.user.userNodeId)
      .limit(1);

    if (!adminCheck || adminCheck.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Check if user can write to node
 */
async function checkWritePermission(req, res, next) {
  try {
    const { nodeId } = req.params || req.body;

    if (!nodeId) {
      return next(); // No specific node, allow
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: node } = await supabase
      .from('node_core')
      .select('permissions, owner_node')
      .eq('node_id', nodeId)
      .single();

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const canWrite =
      node.owner_node === req.user.userNodeId ||
      (node.permissions?.write?.includes(req.user.userId));

    if (!canWrite) {
      return res.status(403).json({ error: 'Write access denied' });
    }

    next();
  } catch (error) {
    console.error('Write permission error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// ═════════════════════════════════════════════════════════════════
// 3. RATE LIMITING
// ═════════════════════════════════════════════════════════════════

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests',
  skip: (req) => req.user?.role === 'admin', // Skip for admins
});

/**
 * Strict rate limiter for embedding/vector operations
 */
const embeddingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 embedding requests per minute
  message: 'Too many embedding requests',
});

/**
 * RAG endpoint limiter (expensive, restrict heavily)
 */
const ragLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 RAG requests per minute
  message: 'RAG endpoint rate limited',
});

/**
 * Recommendation endpoint limiter
 */
const recommendationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 recommendations per minute
  message: 'Recommendation endpoint rate limited',
});

// ═════════════════════════════════════════════════════════════════
// 4. BRAND ISOLATION MIDDLEWARE
// ═════════════════════════════════════════════════════════════════

/**
 * Ensure user can only access nodes within their brand
 */
async function enforceBrandIsolation(req, res, next) {
  try {
    const { nodeId } = req.params || req.body;

    if (!nodeId || !req.user) {
      return next();
    }

    // Get user's primary brand
    const { data: userNode } = await supabase
      .from('node_core')
      .select('node_id, parent_node')
      .eq('node_id', req.user.userNodeId)
      .single();

    if (!userNode) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get target node
    const { data: targetNode } = await supabase
      .from('node_core')
      .select('node_id, parent_node, visibility')
      .eq('node_id', nodeId)
      .single();

    if (!targetNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Allow if public or same brand
    const sameBrand =
      targetNode.parent_node === userNode.parent_node ||
      targetNode.visibility === 'public';

    if (!sameBrand && targetNode.visibility !== 'public') {
      return res.status(403).json({ error: 'Brand isolation violation' });
    }

    next();
  } catch (error) {
    console.error('Brand isolation error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

// ═════════════════════════════════════════════════════════════════
// 5. REQUEST VALIDATION MIDDLEWARE
// ═════════════════════════════════════════════════════════════════

/**
 * Validate required fields in request body
 */
function validateRequired(...fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.body[f]);

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Validate JSON structure
 */
function validateJSON(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      next();
    } else {
      res.status(400).json({ error: 'Invalid JSON body' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Malformed JSON' });
  }
}

/**
 * Sanitize input to prevent injection
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential injection patterns
      return obj
        .replace(/[<>\"']/g, '') // Remove HTML chars
        .substring(0, 10000); // Limit length
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitize(req.body);
  next();
}

// ═════════════════════════════════════════════════════════════════
// 6. ERROR HANDLING MIDDLEWARE
// ═════════════════════════════════════════════════════════════════

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Don't expose internal errors to client
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { debug: err.message }),
  });
}

// ═════════════════════════════════════════════════════════════════
// EXPORT ALL MIDDLEWARE
// ═════════════════════════════════════════════════════════════════

module.exports = {
  // Auth
  verifyToken,
  requireAuth: verifyToken,
  optionalAuth,

  // Permissions
  checkNodePermission,
  requireAdmin,
  checkWritePermission,
  enforceBrandIsolation,

  // Rate limiting
  apiLimiter,
  embeddingLimiter,
  ragLimiter,
  recommendationLimiter,

  // Validation
  validateRequired,
  validateJSON,
  sanitizeInput,

  // Error handling
  errorHandler,
};
