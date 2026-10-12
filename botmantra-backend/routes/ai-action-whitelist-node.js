/**
 * AI Action Whitelist Node API Routes
 * REST endpoints for managing AI action whitelists as nodes
 */

const express = require('express');
const router = express.Router();
const AIActionWhitelistNode = require('../core/ai-action-whitelist');
const { authenticate } = require('../middleware/auth');

// ============================================================
// CREATE - Create new action whitelist node
// ============================================================
router.post('/action-whitelist', authenticate, async (req, res) => {
  try {
    const { nodeCode, table_name, allowed_actions, description, is_active, business_id } = req.body;

    if (!nodeCode || !table_name || !allowed_actions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nodeCode, table_name, allowed_actions'
      });
    }

    const whitelistData = {
      table_name,
      allowed_actions,
      description,
      is_active: is_active !== undefined ? is_active : true,
      business_id: business_id || req.user.business_id
    };

    const node = await AIActionWhitelistNode.createActionWhitelistNode(nodeCode, whitelistData);

    res.status(201).json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('Action whitelist CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET ALL - Query action whitelist nodes
// ============================================================
router.get('/action-whitelist', authenticate, async (req, res) => {
  try {
    const { nodeCode, table_name, is_active, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (nodeCode) filters.node_code = nodeCode;
    if (table_name) filters.table_name = table_name;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (req.user.business_id) filters.business_id = req.user.business_id;

    const nodes = await AIActionWhitelistNode.queryActionWhitelistNodes(filters);

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
    console.error('Action whitelist GET ALL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY TABLE - Get whitelists for specific table
// ============================================================
router.get('/action-whitelist/table/:tableName', authenticate, async (req, res) => {
  try {
    const { tableName } = req.params;

    const nodes = await AIActionWhitelistNode.queryActionWhitelistNodes({
      table_name: tableName,
      business_id: req.user.business_id
    });

    res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    console.error('Action whitelist GET BY TABLE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update action whitelist node
// ============================================================
router.put('/action-whitelist/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { allowed_actions, description, is_active } = req.body;

    const updates = {};
    if (allowed_actions !== undefined) updates['metadata.allowed_actions'] = allowed_actions;
    if (description !== undefined) updates['metadata.description'] = description;
    if (is_active !== undefined) updates['metadata.is_active'] = is_active;

    const node = await AIActionWhitelistNode.updateActionWhitelistNode(nodeCode, updates);

    res.json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('Action whitelist UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CHECK ACTION - Check if action is allowed for table
// ============================================================
router.get('/action-whitelist/check/:tableName/:action', authenticate, async (req, res) => {
  try {
    const { tableName, action } = req.params;

    const isAllowed = await AIActionWhitelistNode.isActionAllowed(tableName, action);

    res.json({
      success: true,
      data: {
        table_name: tableName,
        action: action,
        allowed: isAllowed
      }
    });
  } catch (error) {
    console.error('Action whitelist CHECK ACTION error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATISTICS - Get whitelist statistics
// ============================================================
router.get('/action-whitelist/stats', authenticate, async (req, res) => {
  try {
    const stats = await AIActionWhitelistNode.getWhitelistStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Action whitelist GET STATISTICS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;