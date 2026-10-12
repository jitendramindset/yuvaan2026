/**
 * Auto-generated API Routes for ai_session_memory
 * Generated: 2026-02-04T06:50:02.514Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all ai_session_memory records
// ============================================================
router.get('/ai-session-memory', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('ai_session_memory')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    
    // Filter by user if user_id present
    if (req.user.id) {
      query = query.eq('user_id', req.user.id);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('ai_session_memory GET ALL error:', error);
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
    console.error('ai_session_memory GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});



// ============================================================
// CREATE - Create new ai_session_memory record
// ============================================================
router.post('/ai-session-memory', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["session_id","user_id","context","last_action","expires_at"];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }
    
    const payload = {
      ...req.body,
      user_id: req.user.id
    };
    
    const { data, error } = await supabase
      .from('ai_session_memory')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('ai_session_memory CREATE error:', error);
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
    console.error('ai_session_memory CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});



module.exports = router;
