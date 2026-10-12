/**
 * Auto-generated API Routes for clients
 * Generated: 2026-02-04T06:50:03.744Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all clients records
// ============================================================
router.get('/clients', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    // Filter by business if business_id present
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('clients GET ALL error:', error);
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
    console.error('clients GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// GET BY ID - Get single clients record
// ============================================================
router.get('/clients/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('clients')
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
          error: 'clients record not found'
        });
      }
      console.error('clients GET BY ID error:', error);
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
    console.error('clients GET BY ID exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// CREATE - Create new clients record
// ============================================================
router.post('/clients', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["business_id","name","email","phone","company_name","status","created_by","website"];
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
      .from('clients')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('clients CREATE error:', error);
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
    console.error('clients CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// UPDATE - Update existing clients record
// ============================================================
router.put('/clients/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = req.body;
    
    let query = supabase
      .from('clients')
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
          error: 'clients record not found or unauthorized'
        });
      }
      console.error('clients UPDATE error:', error);
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
    console.error('clients UPDATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// DELETE - Delete clients record
// ============================================================
router.delete('/clients/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    // Security: Ensure user can only delete their business data
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('clients DELETE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'clients record deleted successfully'
    });
  } catch (error) {
    console.error('clients DELETE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
