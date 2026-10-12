/**
 * AI Session Memory Node Routes
 * REST API for node-based AI session memory management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { aiSessionMemoryNode } = require('../core/ai-session-memory');

// ============================================================
// CREATE - Create new session memory entry
// ============================================================
router.post('/ai-session-memory', authenticate, async (req, res) => {
  try {
    const sessionData = {
      session_id: req.body.session_id,
      user_id: req.user.id,
      context: req.body.context,
      last_action: req.body.last_action,
      expires_at: req.body.expires_at,
      memory_type: req.body.memory_type || 'conversation',
      importance_score: req.body.importance_score || 0.5,
      access_count: req.body.access_count || 0,
      last_accessed: req.body.last_accessed || new Date().toISOString(),
      memory_status: req.body.memory_status || 'active',
      tags: req.body.tags || [],
      conversation_summary: req.body.conversation_summary || '',
      key_insights: req.body.key_insights || [],
      user_preferences: req.body.user_preferences || {},
      session_metadata: req.body.session_metadata || {},
      is_active: req.body.is_active !== false
    };

    const result = await aiSessionMemoryNode.createSessionMemory(sessionData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'Session memory entry created successfully',
      data: result
    });
  } catch (error) {
    console.error('AI session memory CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query session memory entries
// ============================================================
router.get('/ai-session-memory', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    if (req.query.session_id) criteria.session_id = req.query.session_id;
    if (req.query.user_id) criteria.user_id = req.query.user_id;
    if (req.query.memory_type) criteria.memory_type = req.query.memory_type;
    if (req.query.memory_status) criteria.memory_status = req.query.memory_status;
    if (req.query.is_active !== undefined) criteria.is_active = req.query.is_active === 'true';
    if (req.query.tags) criteria.tags = req.query.tags.split(',');
    if (req.query.exclude_expired !== undefined) criteria.exclude_expired = req.query.exclude_expired === 'true';

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'last_accessed';
    options.order = req.query.order || 'desc';

    // Security: Users can only query their own sessions
    criteria.user_id = req.user.id;

    const result = await aiSessionMemoryNode.querySessionMemories(criteria, options);

    res.json({
      success: true,
      data: result.memories,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('AI session memory QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY SESSION ID - Get session memory by session ID
// ============================================================
router.get('/ai-session-memory/session/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const memory = await aiSessionMemoryNode.getSessionMemory(sessionId, req.user.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Session memory not found'
      });
    }

    res.json({
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('AI session memory GET BY SESSION error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific session memory entry
// ============================================================
router.get('/ai-session-memory/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const criteria = {
      node_code: nodeCode,
      user_id: req.user.id
    };

    const result = await aiSessionMemoryNode.querySessionMemories(criteria, { limit: 1 });

    if (result.memories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session memory entry not found'
      });
    }

    res.json({
      success: true,
      data: result.memories[0]
    });
  } catch (error) {
    console.error('AI session memory GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update session memory entry
// ============================================================
router.put('/ai-session-memory/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.node_code;
    delete updateData.session_id;
    delete updateData.user_id;
    delete updateData.created_at;

    // Add last modified timestamp
    updateData.last_modified = new Date().toISOString();

    const result = await aiSessionMemoryNode.updateSessionMemory(nodeCode, updateData);

    res.json({
      success: true,
      message: 'Session memory updated successfully',
      data: result
    });
  } catch (error) {
    console.error('AI session memory UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// EXTEND EXPIRATION - Extend session expiration time
// ============================================================
router.post('/ai-session-memory/session/:sessionId/extend', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { additional_hours = 24 } = req.body;

    const result = await aiSessionMemoryNode.extendSessionExpiration(sessionId, req.user.id, additional_hours);

    res.json({
      success: true,
      message: `Session expiration extended by ${additional_hours} hours`,
      data: result
    });
  } catch (error) {
    console.error('AI session memory EXTEND EXPIRATION error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATS - Get user session statistics
// ============================================================
router.get('/ai-session-memory/stats', authenticate, async (req, res) => {
  try {
    const stats = await aiSessionMemoryNode.getUserSessionStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI session memory GET STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CLEANUP EXPIRED - Clean up expired sessions
// ============================================================
router.post('/ai-session-memory/cleanup', authenticate, async (req, res) => {
  try {
    const { force = false } = req.body;

    const result = await aiSessionMemoryNode.cleanupExpiredSessions(req.user.id, force);

    res.json({
      success: true,
      message: `Cleaned up ${result.cleaned_sessions} expired sessions`,
      data: result
    });
  } catch (error) {
    console.error('AI session memory CLEANUP error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// ARCHIVE OLD - Archive old sessions
// ============================================================
router.post('/ai-session-memory/archive', authenticate, async (req, res) => {
  try {
    const { days_old = 30 } = req.body;

    const result = await aiSessionMemoryNode.archiveOldSessions(req.user.id, days_old);

    res.json({
      success: true,
      message: `Archived ${result.archived_sessions} old sessions`,
      data: result
    });
  } catch (error) {
    console.error('AI session memory ARCHIVE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// MERGE SESSIONS - Merge multiple session contexts
// ============================================================
router.post('/ai-session-memory/merge', authenticate, async (req, res) => {
  try {
    const { session_ids, target_session_id } = req.body;

    if (!Array.isArray(session_ids) || session_ids.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 session_ids are required for merging'
      });
    }

    if (!target_session_id) {
      return res.status(400).json({
        success: false,
        error: 'target_session_id is required'
      });
    }

    const result = await aiSessionMemoryNode.mergeSessionContexts(session_ids, req.user.id, target_session_id);

    res.status(201).json({
      success: true,
      message: `Successfully merged ${session_ids.length} sessions`,
      data: result
    });
  } catch (error) {
    console.error('AI session memory MERGE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete session memory entry
// ============================================================
router.delete('/ai-session-memory/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // First check if the entry belongs to the user
    const criteria = {
      node_code: nodeCode,
      user_id: req.user.id
    };

    const existing = await aiSessionMemoryNode.querySessionMemories(criteria, { limit: 1 });

    if (existing.memories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session memory entry not found or unauthorized'
      });
    }

    await aiSessionMemoryNode.deleteSessionMemory(nodeCode);

    res.json({
      success: true,
      message: 'Session memory entry deleted successfully'
    });
  } catch (error) {
    console.error('AI session memory DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH CREATE - Create multiple session memory entries
// ============================================================
router.post('/ai-session-memory/batch', authenticate, async (req, res) => {
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
        const sessionData = {
          user_id: req.user.id,
          ...entry
        };

        const result = await aiSessionMemoryNode.createSessionMemory(sessionData, entry.node_code);
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
      message: `Created ${results.length} session memory entries${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        created: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('AI session memory BATCH CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;