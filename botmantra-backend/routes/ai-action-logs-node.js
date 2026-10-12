/**
 * AI Action Logs Node API Routes
 * Node-based API for AI action logs using the neural graph system
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const AIActionLogsNode = require('../core/ai-action-logs');

const actionLogsNode = new AIActionLogsNode(supabase);

// ============================================================
// CREATE - Log new AI action as node
// ============================================================
router.post('/action-logs', authenticate, async (req, res) => {
  try {
    const result = await actionLogsNode.createActionLogNode(req.user.node_code || req.user.id, req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.action_log_node,
      node_id: result.node_id
    });
  } catch (error) {
    console.error('Create action log node error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET ALL - List action log nodes with pagination
// ============================================================
router.get('/action-logs', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, action_type, table_name, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;

    const queryParams = {
      node_code: req.user.node_code || req.user.id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    if (action_type) queryParams.action_type = action_type;
    if (table_name) queryParams.table_name = table_name;
    if (date_from) queryParams.date_from = date_from;
    if (date_to) queryParams.date_to = date_to;

    // Filter by business if user has business context
    if (req.user.business_id) {
      queryParams.business_id = req.user.business_id;
    }

    const result = await actionLogsNode.queryActionLogNodes(queryParams);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.nodes,
      pagination: {
        total: result.total || result.nodes.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((result.total || result.nodes.length) / limit)
      }
    });
  } catch (error) {
    console.error('Get action logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET BY ID - Get single action log node
// ============================================================
router.get('/action-logs/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await actionLogsNode.getActionLogNode(id);

    if (!result.success) {
      const statusCode = result.error.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

    // Check if user owns this node
    if (result.action_log_node.owner_id !== req.user.id &&
        (!req.user.business_id || result.action_log_node.metadata.business_id !== req.user.business_id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: result.action_log_node
    });
  } catch (error) {
    console.error('Get action log by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// UPDATE - Update action log node (limited updates allowed)
// ============================================================
router.put('/action-logs/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow updating certain metadata fields
    const allowedUpdates = {};
    const allowedFields = ['notes', 'tags', 'reviewed_by', 'review_status'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        allowedUpdates[`metadata.${field}`] = req.body[field];
      }
    });

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add review timestamp if status changed
    if (req.body.review_status) {
      allowedUpdates['metadata.reviewed_at'] = new Date().toISOString();
    }

    const result = await actionLogsNode.updateActionLogNode(id, allowedUpdates);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.action_log_node
    });
  } catch (error) {
    console.error('Update action log error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// STATISTICS - Get action statistics
// ============================================================
router.get('/action-logs/stats', authenticate, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    const queryParams = {
      node_code: req.user.node_code || req.user.id
    };

    if (date_from) queryParams.date_from = date_from;
    if (date_to) queryParams.date_to = date_to;
    if (req.user.business_id) queryParams.business_id = req.user.business_id;

    const result = await actionLogsNode.getActionStatistics(queryParams);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      statistics: result.statistics,
      period: result.period
    });
  } catch (error) {
    console.error('Get action statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// AUDIT TRAIL - Get node audit trail
// ============================================================
router.get('/action-logs/audit/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { action_types, limit = 100, date_from, date_to } = req.query;

    // Check permissions - only admins or the node owner can view audit trails
    if ((req.user.node_code || req.user.id) !== nodeCode && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const options = {
      limit: parseInt(limit),
      action_types: action_types ? action_types.split(',') : []
    };

    if (date_from) options.date_from = date_from;
    if (date_to) options.date_to = date_to;

    const result = await actionLogsNode.getNodeAuditTrail(nodeCode, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      audit_trail: result.nodes,
      total: result.total || result.nodes.length
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// CLEANUP - Admin endpoint to cleanup old logs
// ============================================================
router.post('/action-logs/cleanup', authenticate, async (req, res) => {
  try {
    // Only admins can perform cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { retention_days = 90 } = req.body;

    const result = await actionLogsNode.cleanupOldLogs(retention_days);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      cleanup_result: result
    });
  } catch (error) {
    console.error('Cleanup action logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;