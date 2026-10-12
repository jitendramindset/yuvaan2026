/**
 * AI Agent Rules Node API Routes
 * REST endpoints for managing AI agent rules as nodes
 */

const express = require('express');
const router = express.Router();
const AIAgentRulesNode = require('../core/ai-agent-rules');
const { authenticate } = require('../middleware/auth');

// ============================================================
// CREATE - Create new agent rule node
// ============================================================
router.post('/agent-rules', authenticate, async (req, res) => {
  try {
    const { nodeCode, rule_name, trigger_type, condition_json, action_json, description, priority, is_active, business_id } = req.body;

    if (!nodeCode || !rule_name || !trigger_type || !condition_json || !action_json) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nodeCode, rule_name, trigger_type, condition_json, action_json'
      });
    }

    const ruleData = {
      rule_name,
      trigger_type,
      condition_json,
      action_json,
      description,
      priority: priority || 1,
      is_active: is_active !== undefined ? is_active : true,
      last_run: null,
      business_id: business_id || req.user.business_id
    };

    const node = await AIAgentRulesNode.createAgentRuleNode(nodeCode, ruleData);

    res.status(201).json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('Agent rules CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET ALL - Query agent rule nodes
// ============================================================
router.get('/agent-rules', authenticate, async (req, res) => {
  try {
    const { nodeCode, rule_name, trigger_type, is_active, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (nodeCode) filters.node_code = nodeCode;
    if (rule_name) filters.rule_name = rule_name;
    if (trigger_type) filters.trigger_type = trigger_type;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (req.user.business_id) filters.business_id = req.user.business_id;

    const nodes = await AIAgentRulesNode.queryAgentRuleNodes(filters);

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
    console.error('Agent rules GET ALL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY TRIGGER TYPE - Get rules for specific trigger type
// ============================================================
router.get('/agent-rules/trigger/:triggerType', authenticate, async (req, res) => {
  try {
    const { triggerType } = req.params;

    const nodes = await AIAgentRulesNode.queryAgentRuleNodes({
      trigger_type: triggerType,
      business_id: req.user.business_id
    });

    res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    console.error('Agent rules GET BY TRIGGER TYPE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update agent rule node
// ============================================================
router.put('/agent-rules/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { rule_name, trigger_type, condition_json, action_json, description, priority, is_active } = req.body;

    const updates = {};
    if (rule_name !== undefined) updates['metadata.rule_name'] = rule_name;
    if (trigger_type !== undefined) updates['metadata.trigger_type'] = trigger_type;
    if (condition_json !== undefined) updates['metadata.condition_json'] = condition_json;
    if (action_json !== undefined) updates['metadata.action_json'] = action_json;
    if (description !== undefined) updates['metadata.description'] = description;
    if (priority !== undefined) updates['metadata.priority'] = priority;
    if (is_active !== undefined) updates['metadata.is_active'] = is_active;

    const node = await AIAgentRulesNode.updateAgentRuleNode(nodeCode, updates);

    res.json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('Agent rules UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// EVALUATE RULES - Evaluate rules for a trigger
// ============================================================
router.post('/agent-rules/evaluate', authenticate, async (req, res) => {
  try {
    const { trigger_type, trigger_data } = req.body;

    if (!trigger_type || !trigger_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: trigger_type, trigger_data'
      });
    }

    const matchingRules = await AIAgentRulesNode.evaluateRules(trigger_type, trigger_data);

    res.json({
      success: true,
      data: {
        trigger_type,
        matching_rules_count: matchingRules.length,
        rules: matchingRules
      }
    });
  } catch (error) {
    console.error('Agent rules EVALUATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATISTICS - Get rule statistics
// ============================================================
router.get('/agent-rules/stats', authenticate, async (req, res) => {
  try {
    const stats = await AIAgentRulesNode.getRuleStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Agent rules GET STATISTICS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// ACTIVATE/DEACTIVATE - Toggle rule active status
// ============================================================
router.patch('/agent-rules/:nodeCode/toggle', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: is_active'
      });
    }

    const updates = {
      'metadata.is_active': is_active
    };

    const node = await AIAgentRulesNode.updateAgentRuleNode(nodeCode, updates);

    res.json({
      success: true,
      data: node,
      message: `Rule ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Agent rules TOGGLE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;