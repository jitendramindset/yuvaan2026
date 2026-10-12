// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE SHARING - API Routes
// ═══════════════════════════════════════════════════════════════════════════════
// Endpoints for revenue distribution, earnings reports, and distribution analytics

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const kernel = require('../kernel-engine');
const {
  distributeRevenue,
  getDistributionReport,
  getNodeEarnings,
  getTopEarners,
  getRecentDistributions,
  processPendingDistributions
} = require('../services/revenue-engine');

const { buildContributionGraph, getContributionGraph } = require('../services/contribution-graph');

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE: Session Validation
// ═══════════════════════════════════════════════════════════════════════════════

async function validateSession(req, res, next) {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(401).json({
      success: false,
      error: 'Session ID required'
    });
  }

  const validationResult = await kernel.validateSession(sessionId);

  if (!validationResult.valid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session'
    });
  }

  req.user = validationResult.user;
  req.session = validationResult.session;
  next();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE: Admin Authority Check
// ═══════════════════════════════════════════════════════════════════════════════

async function requireAdmin(req, res, next) {
  // Fetch user's node to check authority level
  const { data: node, error } = await supabase
    .from('core_node')
    .select('authority_level')
    .eq('user_id', req.user.id)
    .single();

  if (error || !node) {
    return res.status(403).json({
      success: false,
      error: 'Unable to verify authority'
    });
  }

  if (node.authority_level < 90) {
    return res.status(403).json({
      success: false,
      error: 'Admin authority required (level 90+)'
    });
  }

  next();
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/revenue/process/:transaction_id
// Manually trigger revenue distribution for a specific transaction
// Admin only
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/process/:transaction_id', validateSession, requireAdmin, async (req, res) => {
  const { transaction_id } = req.params;

  if (!transaction_id) {
    return res.status(400).json({
      success: false,
      error: 'Transaction ID required'
    });
  }

  console.log(`[REVENUE] Processing distribution for transaction: ${transaction_id}`);

  const result = await distributeRevenue(transaction_id);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/revenue/process-all
// Process all pending distributions
// Admin only
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/process-all', validateSession, requireAdmin, async (req, res) => {
  console.log(`[REVENUE] Processing all pending distributions`);

  const result = await processPendingDistributions();

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/revenue/report/:transaction_id
// Get detailed distribution report for a transaction
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/report/:transaction_id', validateSession, async (req, res) => {
  const { transaction_id } = req.params;

  if (!transaction_id) {
    return res.status(400).json({
      success: false,
      error: 'Transaction ID required'
    });
  }

  const result = await getDistributionReport(transaction_id);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/revenue/node/:node_id
// Get earnings summary and history for a specific node
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/node/:node_id', validateSession, async (req, res) => {
  const { node_id } = req.params;
  const { timeframe = '30d' } = req.query;

  if (!node_id) {
    return res.status(400).json({
      success: false,
      error: 'Node ID required'
    });
  }

  // Verify user has access to this node
  const { data: node, error: nodeError } = await supabase
    .from('core_node')
    .select('user_id')
    .eq('id', node_id)
    .single();

  if (nodeError || !node) {
    return res.status(404).json({
      success: false,
      error: 'Node not found'
    });
  }

  // Users can only view their own nodes unless they're admin
  const { data: userNode, error: userNodeError } = await supabase
    .from('core_node')
    .select('authority_level')
    .eq('user_id', req.user.id)
    .single();

  const isAdmin = userNode && userNode.authority_level >= 90;

  if (node.user_id !== req.user.id && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  const result = await getNodeEarnings(node_id, timeframe);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/revenue/top-earners
// Get leaderboard of top earning nodes
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/top-earners', validateSession, async (req, res) => {
  const { limit = 10 } = req.query;

  const result = await getTopEarners(parseInt(limit));

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/revenue/recent
// Get recent distribution executions
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/recent', validateSession, async (req, res) => {
  const { limit = 20 } = req.query;

  const result = await getRecentDistributions(parseInt(limit));

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/revenue/contribution-graph/:transaction_id
// Build contribution graph for a transaction
// (Usually called automatically by transaction creation, but available for manual use)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/contribution-graph/:transaction_id', validateSession, async (req, res) => {
  const { transaction_id } = req.params;
  const options = req.body || {};

  if (!transaction_id) {
    return res.status(400).json({
      success: false,
      error: 'Transaction ID required'
    });
  }

  console.log(`[REVENUE] Building contribution graph for transaction: ${transaction_id}`);

  const result = await buildContributionGraph(transaction_id, options);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/revenue/contribution-graph/:transaction_id
// Get contribution graph for a transaction
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/contribution-graph/:transaction_id', validateSession, async (req, res) => {
  const { transaction_id } = req.params;

  if (!transaction_id) {
    return res.status(400).json({
      success: false,
      error: 'Transaction ID required'
    });
  }

  const result = await getContributionGraph(transaction_id);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/revenue/stats
// Get overall revenue distribution statistics
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/stats', validateSession, async (req, res) => {
  try {
    // Total revenue distributed
    const { data: totalData, error: totalError } = await supabase
      .from('revenue_distribution_log')
      .select('distributed_amount')
      .eq('status', 'completed');

    if (totalError) throw totalError;

    const totalDistributed = totalData?.reduce((sum, row) => sum + (row.distributed_amount || 0), 0) || 0;

    // Distribution count
    const { count: distributionCount, error: countError } = await supabase
      .from('revenue_distribution_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (countError) throw countError;

    // Active earners (nodes with earnings)
    const { count: activeEarners, error: earnersError } = await supabase
      .from('node_earnings_summary')
      .select('*', { count: 'exact', head: true })
      .gt('total_earned', 0);

    if (earnersError) throw earnersError;

    // Pending distributions
    const { count: pendingCount, error: pendingError } = await supabase
      .from('revenue_share_pool')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    res.json({
      success: true,
      stats: {
        total_distributed: totalDistributed,
        distribution_count: distributionCount || 0,
        active_earners: activeEarners || 0,
        pending_distributions: pendingCount || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = router;
