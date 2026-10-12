/**
 * Auto-generated API Routes for business_labels
 * Generated: 2026-02-04T06:50:03.293Z
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all business_labels records
// ============================================================
router.get('/business-labels', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('business_labels')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    // Filter by business if business_id present
    if (req.user.business_id) {
      query = query.eq('business_id', req.user.business_id);
    }
    
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('business_labels GET ALL error:', error);
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
    console.error('business_labels GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});



// ============================================================
// CREATE - Create new business_labels record
// ============================================================
router.post('/business-labels', authenticate, async (req, res) => {
  try {
    
  const requiredFields = ["business_id","label_key","custom_text","language_code"];
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
      .from('business_labels')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('business_labels CREATE error:', error);
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
    console.error('business_labels CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});



module.exports = router;
