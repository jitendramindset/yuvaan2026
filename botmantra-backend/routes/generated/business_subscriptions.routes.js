/**
 * Auto-generated API Routes for business_subscriptions
 * Generated: 2026-02-04T06:50:03.562Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all business_subscriptions records
// ============================================================
router.get('/business-subscriptions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('business_subscriptions')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    // Filter by business if business_id present
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('business_subscriptions GET ALL error:', error);
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
    console.error('business_subscriptions GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET BY ID - Get single business_subscriptions record
// ============================================================
router.get('/business-subscriptions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('business_subscriptions')
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
          error: 'business_subscriptions record not found'
        });
      }
      console.error('business_subscriptions GET BY ID error:', error);
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
    console.error('business_subscriptions GET BY ID exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// CREATE - Create new business_subscriptions record
// ============================================================
router.post('/business-subscriptions', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["business_id","plan_id","status","start_date","end_date","auto_renew"];
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
      .from('business_subscriptions')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('business_subscriptions CREATE error:', error);
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
    console.error('business_subscriptions CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// UPDATE - Update existing business_subscriptions record
// ============================================================
router.put('/business-subscriptions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = req.body;
    
    let query = supabase
      .from('business_subscriptions')
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
          error: 'business_subscriptions record not found or unauthorized'
        });
      }
      console.error('business_subscriptions UPDATE error:', error);
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
    console.error('business_subscriptions UPDATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// DELETE - Delete business_subscriptions record
// ============================================================
router.delete('/business-subscriptions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('business_subscriptions')
      .delete()
      .eq('id', id);
    
    // Security: Ensure user can only delete their business data
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('business_subscriptions DELETE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'business_subscriptions record deleted successfully'
    });
  } catch (error) {
    console.error('business_subscriptions DELETE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
