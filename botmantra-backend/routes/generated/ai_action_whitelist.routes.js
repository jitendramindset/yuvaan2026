/**
 * Auto-generated API Routes for ai_action_whitelist
 * Generated: 2026-02-04T06:50:01.654Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all ai_action_whitelist records
// ============================================================
router.get('/ai-action-whitelist', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('ai_action_whitelist')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    
    
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('ai_action_whitelist GET ALL error:', error);
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
    console.error('ai_action_whitelist GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});



// ============================================================
// CREATE - Create new ai_action_whitelist record
// ============================================================
router.post('/ai-action-whitelist', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["table_name","allowed_actions"];
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
      .from('ai_action_whitelist')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('ai_action_whitelist CREATE error:', error);
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
    console.error('ai_action_whitelist CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});



module.exports = router;
