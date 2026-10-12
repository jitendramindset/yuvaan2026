/**
 * Auto-generated API Routes for ai_chat_messages
 * Generated: 2026-02-04T06:50:01.930Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all ai_chat_messages records
// ============================================================
router.get('/ai-chat-messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('ai_chat_messages')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    
    
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('ai_chat_messages GET ALL error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('ai_chat_messages GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET BY ID - Get single ai_chat_messages record
// ============================================================
router.get('/ai-chat-messages/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('id', id);
    
    
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'ai_chat_messages record not found'
        });
      }
      console.error('ai_chat_messages GET BY ID error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('ai_chat_messages GET BY ID exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// CREATE - Create new ai_chat_messages record
// ============================================================
router.post('/ai-chat-messages', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["session_id","role","content","metadata"];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }
    
    const payload = {
      ...req.body
    };
    
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('ai_chat_messages CREATE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('ai_chat_messages CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// UPDATE - Update existing ai_chat_messages record
// ============================================================
router.put('/ai-chat-messages/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = req.body;
    
    let query = supabase
      .from('ai_chat_messages')
      .update(updateData)
      .eq('id', id);
    
    
    
    const { data, error } = await query.select().single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'ai_chat_messages record not found or unauthorized'
        });
      }
      console.error('ai_chat_messages UPDATE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('ai_chat_messages UPDATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// DELETE - Delete ai_chat_messages record
// ============================================================
router.delete('/ai-chat-messages/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('ai_chat_messages')
      .delete()
      .eq('id', id);
    
    
    
    const { error } = await query;
    
    if (error) {
      console.error('ai_chat_messages DELETE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'ai_chat_messages record deleted successfully'
    });
  } catch (error) {
    console.error('ai_chat_messages DELETE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
