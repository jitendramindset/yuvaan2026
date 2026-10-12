/**
 * AI Semantic Cache Node Routes
 * REST API for node-based AI semantic caching
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

// ============================================================
// CREATE - Create new semantic cache entry
// ============================================================
router.post('/ai-semantic-cache', authenticate, async (req, res) => {
  try {
    const cacheData = {
      business_id: req.user.business_id,
      user_id: req.user.id,
      query: req.body.query,
      query_embedding: req.body.query_embedding,
      answer: req.body.answer,
      similarity_threshold: req.body.similarity_threshold || 0.8,
      hit_count: req.body.hit_count || 0,
      last_accessed: req.body.last_accessed || new Date().toISOString(),
      cache_status: req.body.cache_status || 'active',
      embedding_model: req.body.embedding_model || 'text-embedding-ada-002',
      query_hash: req.body.query_hash,
      tags: req.body.tags || [],
      performance_metrics: req.body.performance_metrics || {
        avg_response_time: 0,
        total_hits: 0,
        cache_hit_rate: 0
      },
      is_active: req.body.is_active !== false
    };

    const result = await aiSemanticCacheNode.createCacheEntry(cacheData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'Semantic cache entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('AI semantic cache CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query semantic cache entries
// ============================================================
router.get('/ai-semantic-cache', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    if (req.query.business_id) criteria.business_id = req.query.business_id;
    if (req.query.user_id) criteria.user_id = req.query.user_id;
    if (req.query.cache_status) criteria.cache_status = req.query.cache_status;
    if (req.query.is_active !== undefined) criteria.is_active = req.query.is_active === 'true';
    if (req.query.query_hash) criteria.query_hash = req.query.query_hash;
    if (req.query.tags) criteria.tags = req.query.tags.split(',');

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'last_accessed';
    options.order = req.query.order || 'desc';

    // Security: Users can only query their business data
    if (!req.user.business_id) {
      return res.status(400).json({
        success: false,
        error: 'Business ID required'
      });
    }
    criteria.business_id = req.user.business_id;

    const result = await aiSemanticCacheNode.queryCacheEntries(criteria, options);

    res.json({
      success: true,
      data: result.entries,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('AI semantic cache QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// FIND SIMILAR - Find similar cache entries using vector similarity
// ============================================================
router.post('/ai-semantic-cache/similar', authenticate, async (req, res) => {
  try {
    const { query_embedding, similarity_threshold = 0.8, limit = 10 } = req.body;

    if (!query_embedding || !Array.isArray(query_embedding)) {
      return res.status(400).json({
        success: false,
        error: 'Valid query_embedding array is required'
      });
    }

    if (!req.user.business_id) {
      return res.status(400).json({
        success: false,
        error: 'Business ID required'
      });
    }

    const results = await aiSemanticCacheNode.findSimilarEntries(
      query_embedding,
      req.user.business_id,
      similarity_threshold,
      limit
    );

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('AI semantic cache FIND SIMILAR error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific cache entry
// ============================================================
router.get('/ai-semantic-cache/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const criteria = {
      node_code: nodeCode,
      business_id: req.user.business_id
    };

    const result = await aiSemanticCacheNode.queryCacheEntries(criteria, { limit: 1 });

    if (result.entries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cache entry not found'
      });
    }

    res.json({
      success: true,
      data: result.entries[0]
    });
  } catch (error) {
    console.error('AI semantic cache GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update cache entry
// ============================================================
router.put('/ai-semantic-cache/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.node_code;
    delete updateData.business_id;
    delete updateData.created_at;

    // Add last modified timestamp
    updateData.last_modified = new Date().toISOString();

    const result = await aiSemanticCacheNode.updateCacheEntry(nodeCode, updateData);

    res.json({
      success: true,
      message: 'Cache entry updated successfully',
      data: result
    });
  } catch (error) {
    console.error('AI semantic cache UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// INCREMENT HIT - Increment hit count for cache entry
// ============================================================
router.post('/ai-semantic-cache/:nodeCode/hit', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const result = await aiSemanticCacheNode.updateCacheEntry(nodeCode, {
      increment_hit: true
    });

    res.json({
      success: true,
      message: 'Cache hit recorded successfully',
      data: result
    });
  } catch (error) {
    console.error('AI semantic cache INCREMENT HIT error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATS - Get cache statistics
// ============================================================
router.get('/ai-semantic-cache/stats', authenticate, async (req, res) => {
  try {
    if (!req.user.business_id) {
      return res.status(400).json({
        success: false,
        error: 'Business ID required'
      });
    }

    const stats = await aiSemanticCacheNode.getCacheStats(req.user.business_id, req.query.user_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI semantic cache GET STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CLEANUP - Clean up old/inactive cache entries
// ============================================================
router.post('/ai-semantic-cache/cleanup', authenticate, async (req, res) => {
  try {
    if (!req.user.business_id) {
      return res.status(400).json({
        success: false,
        error: 'Business ID required'
      });
    }

    const { max_age_days = 30, min_hits = 0 } = req.body;

    const result = await aiSemanticCacheNode.cleanupCache(
      req.user.business_id,
      max_age_days,
      min_hits
    );

    res.json({
      success: true,
      message: `Cleaned up ${result.cleaned_entries} cache entries`,
      data: result
    });
  } catch (error) {
    console.error('AI semantic cache CLEANUP error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete cache entry
// ============================================================
router.delete('/ai-semantic-cache/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // First check if the entry belongs to the user's business
    const criteria = {
      node_code: nodeCode,
      business_id: req.user.business_id
    };

    const existing = await aiSemanticCacheNode.queryCacheEntries(criteria, { limit: 1 });

    if (existing.entries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cache entry not found or unauthorized'
      });
    }

    await aiSemanticCacheNode.deleteCacheEntry(nodeCode);

    res.json({
      success: true,
      message: 'Cache entry deleted successfully'
    });
  } catch (error) {
    console.error('AI semantic cache DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH CREATE - Create multiple cache entries
// ============================================================
router.post('/ai-semantic-cache/batch', authenticate, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid entries array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const entry of entries) {
      try {
        const cacheData = {
          business_id: req.user.business_id,
          user_id: req.user.id,
          ...entry
        };

        const result = await aiSemanticCacheNode.createCacheEntry(cacheData, entry.node_code);
        results.push(result);
      } catch (entryError) {
        errors.push({
          entry,
          error: entryError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.length} cache entries${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        created: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('AI semantic cache BATCH CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;