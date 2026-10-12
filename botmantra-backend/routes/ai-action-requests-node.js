/**
 * AI Action Requests Node API Routes
 * REST endpoints for managing AI action requests as nodes
 */

const express = require('express');
const router = express.Router();
const AIActionRequestsNode = require('../core/ai-action-requests');
const { authenticate } = require('../middleware/auth');

// ============================================================
// CREATE - Create new action request node
// ============================================================
router.post('/action-requests', authenticate, async (req, res) => {
  try {
    const { nodeCode, action_type, target_table, input_payload, status, error_message, executed_at } = req.body;

    if (!nodeCode || !action_type || !target_table) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nodeCode, action_type, target_table'
      });
    }

    const requestData = {
      action_type,
      target_table,
      input_payload,
      status: status || 'pending',
      error_message,
      executed_at,
      business_id: req.user.business_id
    };

    const node = await AIActionRequestsNode.createActionRequestNode(nodeCode, requestData);

    res.status(201).json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('Action requests CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET ALL - Query action request nodes
// ============================================================
router.get('/action-requests', authenticate, async (req, res) => {
  try {
    const { nodeCode, action_type, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (nodeCode) filters.node_code = nodeCode;
    if (action_type) filters.action_type = action_type;
    if (status) filters.status = status;
    if (req.user.business_id) filters.business_id = req.user.business_id;

    const nodes = await AIActionRequestsNode.queryActionRequestNodes(filters);

    // Apply pagination
    const paginatedNodes = nodes.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedNodes,
      pagination: {
        total: nodes.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(nodes.length / limit)
      }
    });
  } catch (error) {
    console.error('Action requests GET ALL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY NODE CODE - Get action requests for specific node
// ============================================================
router.get('/action-requests/node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const nodes = await AIActionRequestsNode.queryActionRequestNodes({
      node_code: nodeCode,
      business_id: req.user.business_id
    });

    res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    console.error('Action requests GET BY NODE CODE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update action request node
// ============================================================
router.put('/action-requests/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { status, error_message, executed_at } = req.body;

    const updates = {};
    if (status !== undefined) updates['metadata.status'] = status;
    if (error_message !== undefined) updates['metadata.error_message'] = error_message;
    if (executed_at !== undefined) updates['metadata.executed_at'] = executed_at;

    const node = await AIActionRequestsNode.updateActionRequestNode(nodeCode, updates);

    res.json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('Action requests UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATISTICS - Get action request statistics
// ============================================================
router.get('/action-requests/stats/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const stats = await AIActionRequestsNode.getActionRequestStatistics(nodeCode);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Action requests GET STATISTICS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET AUDIT TRAIL - Get audit trail for node
// ============================================================
router.get('/action-requests/audit/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const auditTrail = await AIActionRequestsNode.getNodeActionRequestAuditTrail(nodeCode);

    res.json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    console.error('Action requests GET AUDIT TRAIL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;