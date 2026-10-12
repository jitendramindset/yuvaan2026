/**
 * Auto-generated API Routes for business_branding
 * Generated: 2026-02-04T06:50:02.777Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all business_branding records
// ============================================================
router.get('/business-branding', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('business_branding')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    // Filter by business if business_id present
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('business_branding GET ALL error:', error);
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
    console.error('business_branding GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET BY ID - Get single business_branding record
// ============================================================
router.get('/business-branding/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('business_branding')
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
          error: 'business_branding record not found'
        });
      }
      console.error('business_branding GET BY ID error:', error);
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
    console.error('business_branding GET BY ID exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// CREATE - Create new business_branding record
// ============================================================
router.post('/business-branding', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["business_id","app_name","logo_url","favicon_url","primary_color","secondary_color","accent_color","theme_mode","font_family","custom_css","email_sender_name","email_logo_url","email_footer"];
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
      .from('business_branding')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('business_branding CREATE error:', error);
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
    console.error('business_branding CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// UPDATE - Update existing business_branding record
// ============================================================
router.put('/business-branding/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = req.body;
    
    let query = supabase
      .from('business_branding')
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
          error: 'business_branding record not found or unauthorized'
        });
      }
      console.error('business_branding UPDATE error:', error);
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
    console.error('business_branding UPDATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// DELETE - Delete business_branding record
// ============================================================
router.delete('/business-branding/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('business_branding')
      .delete()
      .eq('id', id);
    
    // Security: Ensure user can only delete their business data
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('business_branding DELETE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'business_branding record deleted successfully'
    });
  } catch (error) {
    console.error('business_branding DELETE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
