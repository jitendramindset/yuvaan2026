/**
 * Auto-generated API Routes for business_users
 * Generated: 2026-02-04T06:50:03.684Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all business_users records
// ============================================================
router.get('/business-users', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('business_users')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    // Filter by business if business_id present
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    // Filter by user if user_id present
    if (req.user.id) {
      query = query.eq('user_id', req.user.id);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('business_users GET ALL error:', error);
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
    console.error('business_users GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET BY ID - Get single business_users record
// ============================================================
router.get('/business-users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('business_users')
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
          error: 'business_users record not found'
        });
      }
      console.error('business_users GET BY ID error:', error);
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
    console.error('business_users GET BY ID exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// CREATE - Create new business_users record
// ============================================================
router.post('/business-users', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["user_id","business_id","role_id","is_owner"];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }
    
    const payload = {
      ...req.body,
      business_id: req.user.business_id,
      user_id: req.user.id
    };
    
    const { data, error } = await supabase
      .from('business_users')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('business_users CREATE error:', error);
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
    console.error('business_users CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// UPDATE - Update existing business_users record
// ============================================================
router.put('/business-users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = req.body;
    
    let query = supabase
      .from('business_users')
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
          error: 'business_users record not found or unauthorized'
        });
      }
      console.error('business_users UPDATE error:', error);
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
    console.error('business_users UPDATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// DELETE - Delete business_users record
// ============================================================
router.delete('/business-users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('business_users')
      .delete()
      .eq('id', id);
    
    // Security: Ensure user can only delete their business data
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('business_users DELETE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'business_users record deleted successfully'
    });
  } catch (error) {
    console.error('business_users DELETE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
