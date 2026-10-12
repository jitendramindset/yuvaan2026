/**
 * API Logs Node Routes
 * REST API for node-based API logging
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { apiLogsNode } = require('../core/api-logs');

// ============================================================
// CREATE - Create new API log entry
// ============================================================
router.post('/api-logs', authenticate, async (req, res) => {
  try {
    const logData = {
      user_id: req.user.id,
      endpoint: req.body.endpoint,
      request_data: req.body.request_data || {},
      response_data: req.body.response_data || {},
      status: req.body.status || 'success',
      timestamp: req.body.timestamp || new Date().toISOString(),
      ip_address: req.body.ip_address || req.ip,
      user_agent: req.body.user_agent || req.get('User-Agent')
    };

    const result = await apiLogsNode.createAPILog(logData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'API log entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('API Logs CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query API logs
// ============================================================
router.get('/api-logs', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    if (req.query.endpoint) criteria.endpoint = req.query.endpoint;
    if (req.query.status) criteria.status = req.query.status;

    // Security: Users can only query their own logs
    criteria.user_id = req.user.id;

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'timestamp';
    options.order = req.query.order || 'desc';

    const result = await apiLogsNode.queryAPILogs(criteria, options);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('API Logs QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ENDPOINT - Get logs for specific endpoint
// ============================================================
router.get('/api-logs/endpoint/:endpoint', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      sort: req.query.sort || 'timestamp',
      order: req.query.order || 'desc'
    };

    const result = await apiLogsNode.getLogsByEndpoint(decodeURIComponent(endpoint), req.user.id, options);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('API Logs GET BY ENDPOINT error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY USER - Get logs for specific user (admin only)
// ============================================================
router.get('/api-logs/user/:userId', authenticate, async (req, res) => {
  try {
    // TODO: Add admin permission check
    const { userId } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      sort: req.query.sort || 'timestamp',
      order: req.query.order || 'desc'
    };

    const result = await apiLogsNode.getLogsByUser(userId, options);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('API Logs GET BY USER error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY TIME RANGE - Get logs within time range
// ============================================================
router.get('/api-logs/time-range', authenticate, async (req, res) => {
  try {
    const { start_time, end_time } = req.query;

    if (!start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'start_time and end_time are required'
      });
    }

    const options = {
      limit: parseInt(req.query.limit) || 500
    };

    const result = await apiLogsNode.getLogsByTimeRange(start_time, end_time, req.user.id, options);

    res.json({
      success: true,
      data: result.logs,
      total: result.total
    });
  } catch (error) {
    console.error('API Logs GET BY TIME RANGE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific API log
// ============================================================
router.get('/api-logs/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const log = await apiLogsNode.getAPILog(nodeCode, req.user.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'API log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('API Logs GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// STATS - Get API usage statistics
// ============================================================
router.get('/api-logs/stats', authenticate, async (req, res) => {
  try {
    const timeRange = req.query.time_range ? {
      start: req.query.start_time,
      end: req.query.end_time
    } : null;

    const stats = await apiLogsNode.getAPIUsageStats(req.user.id, timeRange);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('API Logs STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CLEANUP - Clean up old logs
// ============================================================
router.post('/api-logs/cleanup', authenticate, async (req, res) => {
  try {
    // TODO: Add admin permission check
    const { days_old = 30 } = req.body;

    const result = await apiLogsNode.cleanupOldLogs(days_old);

    res.json({
      success: true,
      message: `Cleaned up ${result.deleted} old log entries`,
      data: result
    });
  } catch (error) {
    console.error('API Logs CLEANUP error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH CREATE - Create multiple log entries
// ============================================================
router.post('/api-logs/batch', authenticate, async (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid logs array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const logData of logs) {
      try {
        const data = {
          user_id: req.user.id,
          ...logData
        };

        const result = await apiLogsNode.createAPILog(data, logData.node_code);
        results.push(result);
      } catch (logError) {
        errors.push({
          log: logData,
          error: logError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.length} log entries${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        created: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('API Logs BATCH CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;