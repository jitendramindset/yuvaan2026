/**
 * AI Chat Sessions Node Routes
 * REST API endpoints for AI Chat Sessions management
 */

const express = require('express');
const router = express.Router();
const { aiChatSessionsNode } = require('../core/ai-chat-sessions');
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all chat session nodes
// ============================================================
router.get('/ai-chat-sessions-node', authenticate, async (req, res) => {
  try {
    const { business_id, user_id, session_name, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const criteria = {};
    if (business_id) criteria.business_id = business_id;
    if (user_id) criteria.user_id = user_id;
    if (session_name) criteria.session_name = session_name;

    const sessions = await aiChatSessionsNode.queryChatSessions(criteria, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('AI Chat Sessions GET ALL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY NODE CODE - Get single chat session node
// ============================================================
router.get('/ai-chat-sessions-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // Query the node
    const sessions = await aiChatSessionsNode.queryChatSessions();
    const session = sessions.find(node => node.node_code === nodeCode);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session node not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('AI Chat Sessions GET BY NODE CODE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CREATE - Create new chat session node
// ============================================================
router.post('/ai-chat-sessions-node', authenticate, async (req, res) => {
  try {
    const { business_id, user_id, session_name, last_active, metadata, node_code } = req.body;

    // Validate required fields
    if (!business_id || !user_id || !session_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: business_id, user_id, session_name'
      });
    }

    const sessionData = {
      business_id,
      user_id,
      session_name,
      last_active: last_active || new Date().toISOString(),
      metadata: metadata || {}
    };

    const result = await aiChatSessionsNode.createChatSession(sessionData, node_code);

    res.status(201).json({
      success: true,
      data: result.node,
      database_record: result.database_record
    });
  } catch (error) {
    console.error('AI Chat Sessions CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update existing chat session node
// ============================================================
router.put('/ai-chat-sessions-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { session_name, last_active, metadata } = req.body;

    // Validate at least one field to update
    if (session_name === undefined && last_active === undefined && metadata === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update: session_name, last_active, metadata'
      });
    }

    const updateData = {};
    if (session_name !== undefined) updateData.session_name = session_name;
    if (last_active !== undefined) updateData.last_active = last_active;
    if (metadata !== undefined) updateData.metadata = metadata;

    const result = await aiChatSessionsNode.updateChatSession(nodeCode, updateData);

    res.json({
      success: true,
      data: result.node,
      database_record: result.database_record
    });
  } catch (error) {
    console.error('AI Chat Sessions UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE LAST ACTIVE - Update session's last active timestamp
// ============================================================
router.patch('/ai-chat-sessions-node/:nodeCode/active', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const result = await aiChatSessionsNode.updateLastActive(nodeCode);

    res.json({
      success: true,
      data: result.node,
      message: 'Session last active time updated'
    });
  } catch (error) {
    console.error('AI Chat Sessions UPDATE LAST ACTIVE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete chat session node
// ============================================================
router.delete('/ai-chat-sessions-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const success = await aiChatSessionsNode.deleteChatSession(nodeCode);

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('AI Chat Sessions DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET USER SESSIONS - Get sessions for a specific user
// ============================================================
router.get('/ai-chat-sessions-node/user/:userId/:businessId', authenticate, async (req, res) => {
  try {
    const { userId, businessId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const sessions = await aiChatSessionsNode.getUserSessions(userId, businessId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: sessions,
      user_id: userId,
      business_id: businessId
    });
  } catch (error) {
    console.error('AI Chat Sessions GET USER SESSIONS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATS - Get chat sessions statistics
// ============================================================
router.get('/ai-chat-sessions-node/stats', authenticate, async (req, res) => {
  try {
    const { business_id } = req.query;

    const stats = await aiChatSessionsNode.getSessionStats(business_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI Chat Sessions STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;