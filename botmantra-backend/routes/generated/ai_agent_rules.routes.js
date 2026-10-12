/**
 * Auto-generated API Routes for ai_agent_rules
 * Generated: 2026-02-04T06:50:01.730Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all ai_agent_rules records
// ============================================================
router.get('/ai-agent-rules', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('ai_agent_rules')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    // Filter by business if business_id present
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('ai_agent_rules GET ALL error:', error);
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
    console.error('ai_agent_rules GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET BY ID - Get single ai_agent_rules record
// ============================================================
router.get('/ai-agent-rules/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('ai_agent_rules')
      .select('*')
      .eq('id', id);
    
    // Security: Ensure user can only access their business data
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'ai_agent_rules record not found'
        });
      }
      console.error('ai_agent_rules GET BY ID error:', error);
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
    console.error('ai_agent_rules GET BY ID exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// CREATE - Create new ai_agent_rules record
// ============================================================
router.post('/ai-agent-rules', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["business_id","rule_name","trigger_type","condition_json","action_json","is_active","last_run"];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }
    
    const payload = {
      ...req.body,
      business_id: req.user.business_id
    };
    
    const { data, error } = await supabase
      .from('ai_agent_rules')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('ai_agent_rules CREATE error:', error);
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
    console.error('ai_agent_rules CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// UPDATE - Update existing ai_agent_rules record
// ============================================================
router.put('/ai-agent-rules/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = req.body;
    
    let query = supabase
      .from('ai_agent_rules')
      .update(updateData)
      .eq('id', id);
    
    // Security: Ensure user can only update their business data
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    const { data, error } = await query.select().single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'ai_agent_rules record not found or unauthorized'
        });
      }
      console.error('ai_agent_rules UPDATE error:', error);
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
    console.error('ai_agent_rules UPDATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// DELETE - Delete ai_agent_rules record
// ============================================================
router.delete('/ai-agent-rules/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('ai_agent_rules')
      .delete()
      .eq('id', id);
    
    // Security: Ensure user can only delete their business data
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('ai_agent_rules DELETE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'ai_agent_rules record deleted successfully'
    });
  } catch (error) {
    console.error('ai_agent_rules DELETE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
