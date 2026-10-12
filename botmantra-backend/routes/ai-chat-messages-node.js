/**
 * AI Chat Messages Node Routes
 * REST API endpoints for AI Chat Messages management
 */

const express = require('express');
const router = express.Router();
const { aiChatMessagesNode } = require('../core/ai-chat-messages');
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all chat message nodes
// ============================================================
router.get('/ai-chat-messages-node', authenticate, async (req, res) => {
  try {
    const { session_id, role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const criteria = {};
    if (session_id) criteria.session_id = session_id;
    if (role) criteria.role = role;

    const messages = await aiChatMessagesNode.queryChatMessages(criteria, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('AI Chat Messages GET ALL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY NODE CODE - Get single chat message node
// ============================================================
router.get('/ai-chat-messages-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // Query the node
    const nodes = await aiChatMessagesNode.queryChatMessages();
    const message = nodes.find(node => node.node_code === nodeCode);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Chat message node not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('AI Chat Messages GET BY NODE CODE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CREATE - Create new chat message node
// ============================================================
router.post('/ai-chat-messages-node', authenticate, async (req, res) => {
  try {
    const { session_id, role, content, metadata, node_code } = req.body;

    // Validate required fields
    if (!session_id || !role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: session_id, role, content'
      });
    }

    // Validate role
    if (!['user', 'assistant', 'system'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: user, assistant, system'
      });
    }

    const messageData = {
      session_id,
      role,
      content,
      metadata: metadata || {}
    };

    const result = await aiChatMessagesNode.createChatMessage(messageData, node_code);

    res.status(201).json({
      success: true,
      data: result.node,
      database_record: result.database_record
    });
  } catch (error) {
    console.error('AI Chat Messages CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update existing chat message node
// ============================================================
router.put('/ai-chat-messages-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { content, metadata } = req.body;

    // Validate at least one field to update
    if (content === undefined && metadata === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update: content, metadata'
      });
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (metadata !== undefined) updateData.metadata = metadata;

    const result = await aiChatMessagesNode.updateChatMessage(nodeCode, updateData);

    res.json({
      success: true,
      data: result.node,
      database_record: result.database_record
    });
  } catch (error) {
    console.error('AI Chat Messages UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete chat message node
// ============================================================
router.delete('/ai-chat-messages-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const success = await aiChatMessagesNode.deleteChatMessage(nodeCode);

    res.json({
      success: true,
      message: 'Chat message deleted successfully'
    });
  } catch (error) {
    console.error('AI Chat Messages DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET CONVERSATION HISTORY - Get messages for a session
// ============================================================
router.get('/ai-chat-messages-node/conversation/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const messages = await aiChatMessagesNode.getConversationHistory(sessionId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: messages,
      session_id: sessionId
    });
  } catch (error) {
    console.error('AI Chat Messages CONVERSATION HISTORY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATS - Get chat messages statistics
// ============================================================
router.get('/ai-chat-messages-node/stats', authenticate, async (req, res) => {
  try {
    const { session_id } = req.query;

    let query = supabase
      .from('ai_chat_messages')
      .select('role, session_id', { count: 'exact' });

    if (session_id) {
      query = query.eq('session_id', session_id);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Calculate statistics
    const stats = {
      total_messages: count,
      messages_by_role: {},
      messages_by_session: {}
    };

    data.forEach(message => {
      // Count by role
      stats.messages_by_role[message.role] = (stats.messages_by_role[message.role] || 0) + 1;

      // Count by session
      stats.messages_by_session[message.session_id] = (stats.messages_by_session[message.session_id] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI Chat Messages STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;