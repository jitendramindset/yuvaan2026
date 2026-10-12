/**
 * AI Summary Cache Node Routes
 * REST API for node-based AI summary caching management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { AISummaryCacheNode } = require('../core/ai-summary-cache');

// ============================================================
// CREATE - Create new summary cache entry
// ============================================================
router.post('/ai-summary-cache', authenticate, async (req, res) => {
  try {
    const cacheData = {
      business_id: req.body.business_id,
      user_id: req.user.id,
      query_hash: req.body.query_hash,
      original_query: req.body.original_query,
      context_hash: req.body.context_hash,
      summary: req.body.summary,
      usage_count: req.body.usage_count || 1,
      cache_status: req.body.cache_status || 'active',
      performance_metrics: req.body.performance_metrics || {
        avg_generation_time: 0,
        total_requests: 0,
        cache_hit_rate: 0
      },
      tags: req.body.tags || [],
      is_active: req.body.is_active !== false
    };

    const result = await aiSummaryCacheNode.createSummaryCache(cacheData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'Summary cache entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('AI summary cache CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query summary cache entries
// ============================================================
router.get('/ai-summary-cache', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    if (req.query.business_id) criteria.business_id = req.query.business_id;
    if (req.query.query_hash) criteria.query_hash = req.query.query_hash;
    if (req.query.context_hash) criteria.context_hash = req.query.context_hash;
    if (req.query.usage_count_min) criteria.usage_count_min = parseInt(req.query.usage_count_min);
    if (req.query.usage_count_max) criteria.usage_count_max = parseInt(req.query.usage_count_max);
    if (req.query.created_after) criteria.created_after = req.query.created_after;
    if (req.query.created_before) criteria.created_before = req.query.created_before;
    if (req.query.updated_after) criteria.updated_after = req.query.updated_after;
    if (req.query.updated_before) criteria.updated_before = req.query.updated_before;

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'updated_at';
    options.order = req.query.order || 'desc';

    // Security: Users can only query their business's cache
    if (!req.user.business_id && !req.query.business_id) {
      return res.status(400).json({
        success: false,
        error: 'business_id is required'
      });
    }
    criteria.business_id = req.query.business_id || req.user.business_id;

    const result = await aiSummaryCacheNode.querySummaryCaches(criteria, options);

    res.json({
      success: true,
      data: result.caches,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('AI summary cache QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY QUERY HASH - Get cache entry by query hash
// ============================================================
router.get('/ai-summary-cache/hash/:queryHash', authenticate, async (req, res) => {
  try {
    const { queryHash } = req.params;
    const businessId = req.query.business_id || req.user.business_id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'business_id is required'
      });
    }

    const cache = await aiSummaryCacheNode.getSummaryCache(queryHash, businessId);

    if (!cache) {
      return res.status(404).json({
        success: false,
        error: 'Summary cache entry not found'
      });
    }

    res.json({
      success: true,
      data: cache
    });
  } catch (error) {
    console.error('AI summary cache GET BY HASH error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific cache entry
// ============================================================
router.get('/ai-summary-cache/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const criteria = {
      node_code: nodeCode,
      business_id: req.user.business_id
    };

    const result = await aiSummaryCacheNode.querySummaryCaches(criteria, { limit: 1 });

    if (result.caches.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Summary cache entry not found'
      });
    }

    res.json({
      success: true,
      data: result.caches[0]
    });
  } catch (error) {
    console.error('AI summary cache GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update cache entry
// ============================================================
router.put('/ai-summary-cache/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.node_code;
    delete updateData.business_id;
    delete updateData.query_hash;
    delete updateData.created_at;

    // Add last modified timestamp
    updateData.updated_at = new Date().toISOString();

    const result = await aiSummaryCacheNode.updateSummaryCache(nodeCode, updateData);

    res.json({
      success: true,
      message: 'Summary cache updated successfully',
      data: result
    });
  } catch (error) {
    console.error('AI summary cache UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// INCREMENT USAGE - Increment usage count for cache entry
// ============================================================
router.post('/ai-summary-cache/:nodeCode/increment', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const result = await aiSummaryCacheNode.incrementUsageCount(nodeCode);

    res.json({
      success: true,
      message: 'Usage count incremented successfully',
      data: result
    });
  } catch (error) {
    console.error('AI summary cache INCREMENT USAGE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATS - Get cache statistics
// ============================================================
router.get('/ai-summary-cache/stats', authenticate, async (req, res) => {
  try {
    const businessId = req.query.business_id || req.user.business_id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'business_id is required'
      });
    }

    const stats = await aiSummaryCacheNode.getCacheStats(businessId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI summary cache GET STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CLEANUP - Clean up old cache entries
// ============================================================
router.post('/ai-summary-cache/cleanup', authenticate, async (req, res) => {
  try {
    const businessId = req.query.business_id || req.user.business_id;
    const { days_old = 30, min_usage = 1 } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'business_id is required'
      });
    }

    const result = await aiSummaryCacheNode.cleanupOldCache(businessId, days_old, min_usage);

    res.json({
      success: true,
      message: `Cleaned up ${result.cleaned_entries} old cache entries`,
      data: result
    });
  } catch (error) {
    console.error('AI summary cache CLEANUP error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete cache entry
// ============================================================
router.delete('/ai-summary-cache/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // First check if the entry belongs to the user's business
    const criteria = {
      node_code: nodeCode,
      business_id: req.user.business_id
    };

    const existing = await aiSummaryCacheNode.querySummaryCaches(criteria, { limit: 1 });

    if (existing.caches.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Summary cache entry not found or unauthorized'
      });
    }

    await aiSummaryCacheNode.deleteSummaryCache(nodeCode);

    res.json({
      success: true,
      message: 'Summary cache entry deleted successfully'
    });
  } catch (error) {
    console.error('AI summary cache DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH CREATE - Create multiple cache entries
// ============================================================
router.post('/ai-summary-cache/batch', authenticate, async (req, res) => {
  try {
    const { entries } = req.body;
    const businessId = req.query.business_id || req.user.business_id;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid entries array is required'
      });
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'business_id is required'
      });
    }

    const results = await aiSummaryCacheNode.batchCreateSummaryCaches(entries, businessId);

    res.status(201).json({
      success: true,
      message: `Created ${results.total_created} summary cache entries${results.total_errors > 0 ? `, ${results.total_errors} failed` : ''}`,
      data: {
        created: results.created,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('AI summary cache BATCH CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;