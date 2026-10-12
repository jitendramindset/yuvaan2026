/**
 * API Rate Limit Node Routes
 * REST API for node-based API rate limiting
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { apiRateLimitNode } = require('../core/api-rate-limit');

// ============================================================
// CHECK - Check and update rate limit
// ============================================================
router.post('/rate-limit/check', async (req, res) => {
  try {
    const { ip, nid_hash, max_hits = 100, window_minutes = 60 } = req.body;

    if (!ip || !nid_hash) {
      return res.status(400).json({
        success: false,
        error: 'ip and nid_hash are required'
      });
    }

    const result = await apiRateLimitNode.checkRateLimit(ip, nid_hash, max_hits, window_minutes);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('API Rate Limit CHECK error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// STATUS - Get rate limit status
// ============================================================
router.get('/rate-limit/status', async (req, res) => {
  try {
    const { ip, nid_hash, window_minutes = 60 } = req.query;

    if (!ip || !nid_hash) {
      return res.status(400).json({
        success: false,
        error: 'ip and nid_hash query parameters are required'
      });
    }

    const status = await apiRateLimitNode.getRateLimitStatus(ip, nid_hash, window_minutes);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('API Rate Limit STATUS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// RESET - Reset rate limit for IP
// ============================================================
router.post('/rate-limit/reset', authenticate, async (req, res) => {
  try {
    // TODO: Add admin permission check
    const { ip, nid_hash } = req.body;

    if (!ip || !nid_hash) {
      return res.status(400).json({
        success: false,
        error: 'ip and nid_hash are required'
      });
    }

    const result = await apiRateLimitNode.resetRateLimit(ip, nid_hash);

    res.json({
      success: true,
      message: 'Rate limit reset successfully',
      data: result
    });
  } catch (error) {
    console.error('API Rate Limit RESET error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CLEANUP - Clean up expired rate limit records
// ============================================================
router.post('/rate-limit/cleanup', authenticate, async (req, res) => {
  try {
    // TODO: Add admin permission check
    const { window_minutes = 60 } = req.body;

    const result = await apiRateLimitNode.cleanupExpiredRecords(window_minutes);

    res.json({
      success: true,
      message: `Cleaned up ${result.cleaned} expired rate limit records`,
      data: result
    });
  } catch (error) {
    console.error('API Rate Limit CLEANUP error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// STATS - Get rate limit statistics
// ============================================================
router.get('/rate-limit/stats', authenticate, async (req, res) => {
  try {
    // TODO: Add admin permission check
    const { window_minutes = 60 } = req.query;

    const stats = await apiRateLimitNode.getRateLimitStats(window_minutes);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('API Rate Limit STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// IS BLOCKED - Check if IP is blocked
// ============================================================
router.get('/rate-limit/is-blocked', async (req, res) => {
  try {
    const { ip, nid_hash, max_hits = 100, window_minutes = 60 } = req.query;

    if (!ip || !nid_hash) {
      return res.status(400).json({
        success: false,
        error: 'ip and nid_hash query parameters are required'
      });
    }

    const isBlocked = await apiRateLimitNode.isBlocked(ip, nid_hash, max_hits, window_minutes);

    res.json({
      success: true,
      data: {
        ip,
        nid_hash,
        is_blocked: isBlocked,
        max_hits,
        window_minutes
      }
    });
  } catch (error) {
    console.error('API Rate Limit IS BLOCKED error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BLOCKED IPS - Get list of blocked IPs
// ============================================================
router.get('/rate-limit/blocked', authenticate, async (req, res) => {
  try {
    // TODO: Add admin permission check
    const { max_hits = 100, window_minutes = 60 } = req.query;

    const blockedIPs = await apiRateLimitNode.getBlockedIPs(max_hits, window_minutes);

    res.json({
      success: true,
      data: blockedIPs,
      total: blockedIPs.length
    });
  } catch (error) {
    console.error('API Rate Limit BLOCKED IPS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH RESET - Reset rate limits for multiple IPs
// ============================================================
router.post('/rate-limit/batch-reset', authenticate, async (req, res) => {
  try {
    // TODO: Add admin permission check
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
        const result = await apiRateLimitNode.resetRateLimit(entry.ip, entry.nid_hash);
        results.push({
          ip: entry.ip,
          nid_hash: entry.nid_hash,
          reset: true
        });
      } catch (entryError) {
        errors.push({
          entry,
          error: entryError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Reset ${results.length} rate limits${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        reset: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('API Rate Limit BATCH RESET error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;