/**
 * API Routes Node Routes
 * REST API for node-based API route configuration
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { apiRoutesNode } = require('../core/api-routes');

// ============================================================
// CREATE - Create new API route configuration
// ============================================================
router.post('/api-routes', authenticate, async (req, res) => {
  try {
    const routeData = {
      business_id: req.user.business_id || req.user.id,
      route_code: req.body.route_code,
      http_method: req.body.http_method,
      template_code: req.body.template_code,
      table_name: req.body.table_name,
      allow_read: req.body.allow_read !== false,
      allow_create: req.body.allow_create !== false,
      allow_update: req.body.allow_update !== false,
      allow_delete: req.body.allow_delete !== false,
      requires_auth: req.body.requires_auth !== false
    };

    const result = await apiRoutesNode.createAPIRoute(routeData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'API route created successfully',
      data: result
    });
  } catch (error) {
    console.error('API Routes CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query API routes
// ============================================================
router.get('/api-routes', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    if (req.query.http_method) criteria.http_method = req.query.http_method;
    if (req.query.table_name) criteria.table_name = req.query.table_name;

    // Security: Users can only query routes for their business
    criteria.business_id = req.user.business_id || req.user.id;

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'created_at';
    options.order = req.query.order || 'desc';

    const result = await apiRoutesNode.queryAPIRoutes(criteria, options);

    res.json({
      success: true,
      data: result.routes,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('API Routes QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY CODE - Get route by route code and method
// ============================================================
router.get('/api-routes/code/:routeCode/:httpMethod', authenticate, async (req, res) => {
  try {
    const { routeCode, httpMethod } = req.params;

    const route = await apiRoutesNode.getRouteByCode(
      decodeURIComponent(routeCode),
      httpMethod,
      req.user.business_id || req.user.id
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'API route not found'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('API Routes GET BY CODE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific API route
// ============================================================
router.get('/api-routes/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const route = await apiRoutesNode.getAPIRoute(nodeCode, req.user.business_id || req.user.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'API route not found'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('API Routes GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update API route
// ============================================================
router.put('/api-routes/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.node_code;
    delete updateData.business_id;
    delete updateData.created_at;

    // Add last modified timestamp
    updateData.last_modified = new Date().toISOString();

    const result = await apiRoutesNode.updateAPIRoute(nodeCode, updateData);

    res.json({
      success: true,
      message: 'API route updated successfully',
      data: result
    });
  } catch (error) {
    console.error('API Routes UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CHECK PERMISSION - Check if route allows operation
// ============================================================
router.post('/api-routes/check-permission', authenticate, async (req, res) => {
  try {
    const { route_code, http_method, operation } = req.body;

    if (!route_code || !http_method) {
      return res.status(400).json({
        success: false,
        error: 'route_code and http_method are required'
      });
    }

    const result = await apiRoutesNode.checkRoutePermission(
      route_code,
      http_method,
      operation,
      req.user.business_id || req.user.id
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('API Routes CHECK PERMISSION error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY BUSINESS - Get routes for business
// ============================================================
router.get('/api-routes/business/:businessId', authenticate, async (req, res) => {
  try {
    // TODO: Add business ownership check
    const { businessId } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc'
    };

    const result = await apiRoutesNode.getRoutesForBusiness(businessId, options);

    res.json({
      success: true,
      data: result.routes,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('API Routes GET BY BUSINESS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY TABLE - Get routes for table
// ============================================================
router.get('/api-routes/table/:tableName', authenticate, async (req, res) => {
  try {
    const { tableName } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc'
    };

    const result = await apiRoutesNode.getRoutesByTable(
      tableName,
      req.user.business_id || req.user.id,
      options
    );

    res.json({
      success: true,
      data: result.routes,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('API Routes GET BY TABLE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// STATS - Get API routes statistics
// ============================================================
router.get('/api-routes/stats', authenticate, async (req, res) => {
  try {
    const stats = await apiRoutesNode.getAPIRoutesStats(req.user.business_id || req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('API Routes STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete API route
// ============================================================
router.delete('/api-routes/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // First check if the route belongs to the user's business
    const existing = await apiRoutesNode.getAPIRoute(nodeCode, req.user.business_id || req.user.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'API route not found or unauthorized'
      });
    }

    await apiRoutesNode.deleteAPIRoute(nodeCode);

    res.json({
      success: true,
      message: 'API route deleted successfully'
    });
  } catch (error) {
    console.error('API Routes DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH CREATE - Create multiple API routes
// ============================================================
router.post('/api-routes/batch', authenticate, async (req, res) => {
  try {
    const { routes } = req.body;

    if (!Array.isArray(routes) || routes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid routes array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const routeData of routes) {
      try {
        const data = {
          business_id: req.user.business_id || req.user.id,
          ...routeData
        };

        const result = await apiRoutesNode.createAPIRoute(data, routeData.node_code);
        results.push(result);
      } catch (routeError) {
        errors.push({
          route: routeData,
          error: routeError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.length} API routes${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        created: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('API Routes BATCH CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;