/**
 * AI Voice Logs Node Routes
 * REST API for node-based AI voice interaction logging
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

// ============================================================
// CREATE - Create new voice log entry
// ============================================================
router.post('/ai-voice-logs', authenticate, async (req, res) => {
  try {
    const voiceData = {
      business_id: req.user.business_id,
      user_id: req.user.id,
      audio_url: req.body.audio_url,
      transcript: req.body.transcript,
      detected_intent: req.body.detected_intent,
      confidence_score: req.body.confidence_score || 0.0,
      processing_duration: req.body.processing_duration || 0,
      audio_duration: req.body.audio_duration || 0,
      language: req.body.language || 'en',
      voice_provider: req.body.voice_provider || 'unknown',
      sentiment: req.body.sentiment || 'neutral',
      keywords: req.body.keywords || [],
      entities: req.body.entities || [],
      metadata: req.body.metadata || {},
      tags: req.body.tags || [],
      is_active: req.body.is_active !== false
    };

    const result = await aiVoiceLogsNode.createVoiceLog(voiceData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'Voice log entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('AI voice logs CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query voice log entries
// ============================================================
router.get('/ai-voice-logs', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    if (req.query.business_id) criteria.business_id = req.query.business_id;
    if (req.query.user_id) criteria.user_id = req.query.user_id;
    if (req.query.detected_intent) criteria.detected_intent = req.query.detected_intent;
    if (req.query.language) criteria.language = req.query.language;
    if (req.query.voice_provider) criteria.voice_provider = req.query.voice_provider;
    if (req.query.sentiment) criteria.sentiment = req.query.sentiment;
    if (req.query.confidence_score_min) {
      criteria.confidence_score = { $gte: parseFloat(req.query.confidence_score_min) };
    }
    if (req.query.date_from) {
      criteria.created_at = criteria.created_at || {};
      criteria.created_at.$gte = req.query.date_from;
    }
    if (req.query.date_to) {
      criteria.created_at = criteria.created_at || {};
      criteria.created_at.$lte = req.query.date_to;
    }

    // Security: Users can only query their own logs or their business logs
    if (!req.user.business_id) {
      criteria.user_id = req.user.id;
    } else {
      criteria.business_id = req.user.business_id;
    }

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'created_at';
    options.order = req.query.order || 'desc';

    const result = await aiVoiceLogsNode.queryVoiceLogs(criteria, options);

    res.json({
      success: true,
      data: result.logs,
      nodes: result.nodes,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('AI voice logs QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific voice log entry
// ============================================================
router.get('/ai-voice-logs/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const result = await aiVoiceLogsNode.getVoiceLog(nodeCode, req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Voice log entry not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI voice logs GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update voice log entry
// ============================================================
router.put('/ai-voice-logs/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.node_code;
    delete updateData.business_id;
    delete updateData.user_id;
    delete updateData.audio_url;
    delete updateData.transcript;
    delete updateData.created_at;

    // Add last modified timestamp
    updateData.last_modified = new Date().toISOString();

    const result = await aiVoiceLogsNode.updateVoiceLog(nodeCode, updateData);

    res.json({
      success: true,
      message: 'Voice log updated successfully',
      data: result
    });
  } catch (error) {
    console.error('AI voice logs UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// SEARCH - Search voice logs by transcript content
// ============================================================
router.get('/ai-voice-logs/search/:query', authenticate, async (req, res) => {
  try {
    const { query } = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await aiVoiceLogsNode.searchVoiceLogs(query, req.user.id, options);

    res.json({
      success: true,
      data: result,
      search_query: query
    });
  } catch (error) {
    console.error('AI voice logs SEARCH error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// ANALYTICS - Get voice analytics
// ============================================================
router.get('/ai-voice-logs/analytics', authenticate, async (req, res) => {
  try {
    const dateRange = {};
    if (req.query.date_from) dateRange.start = req.query.date_from;
    if (req.query.date_to) dateRange.end = req.query.date_to;

    const analytics = await aiVoiceLogsNode.getVoiceAnalytics(req.user.id, Object.keys(dateRange).length > 0 ? dateRange : null);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('AI voice logs ANALYTICS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete voice log entry
// ============================================================
router.delete('/ai-voice-logs/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // First check if the entry belongs to the user
    const existing = await aiVoiceLogsNode.getVoiceLog(nodeCode, req.user.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Voice log entry not found or unauthorized'
      });
    }

    await aiVoiceLogsNode.deleteVoiceLog(nodeCode);

    res.json({
      success: true,
      message: 'Voice log entry deleted successfully'
    });
  } catch (error) {
    console.error('AI voice logs DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH CREATE - Create multiple voice log entries
// ============================================================
router.post('/ai-voice-logs/batch', authenticate, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid entries array is required'
      });
    }

    // Prepare entries with user context
    const preparedEntries = entries.map(entry => ({
      voiceData: {
        business_id: req.user.business_id,
        user_id: req.user.id,
        ...entry
      },
      nodeCode: entry.node_code
    }));

    const results = await aiVoiceLogsNode.batchCreateVoiceLogs(preparedEntries);

    res.status(201).json({
      success: true,
      message: `Created ${results.total_created} voice log entries${results.total_errors > 0 ? `, ${results.total_errors} failed` : ''}`,
      data: {
        created: results.created,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('AI voice logs BATCH CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// INTENT ANALYSIS - Get intent distribution
// ============================================================
router.get('/ai-voice-logs/intents', authenticate, async (req, res) => {
  try {
    const criteria = {
      user_id: req.user.id
    };

    if (req.query.date_from) {
      criteria.created_at = criteria.created_at || {};
      criteria.created_at.$gte = req.query.date_from;
    }
    if (req.query.date_to) {
      criteria.created_at = criteria.created_at || {};
      criteria.created_at.$lte = req.query.date_to;
    }

    const result = await aiVoiceLogsNode.queryVoiceLogs(criteria, { limit: 1000 });

    // Group by intent
    const intentStats = {};
    result.logs.forEach(log => {
      const intent = log.detected_intent || 'unknown';
      intentStats[intent] = (intentStats[intent] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        intents: intentStats,
        total_logs: result.logs.length
      }
    });
  } catch (error) {
    console.error('AI voice logs INTENT ANALYSIS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;