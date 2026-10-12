/**
 * 🎯 DASHBOARD API ENDPOINTS
 * 
 * All endpoints for:
 * - Dashboard CRUD
 * - Widget management
 * - Dashboard sharing
 * - User preferences
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth, optionalAuth } = require('../middleware/auth-permission');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

// ═════════════════════════════════════════════════════════════════
// DASHBOARD CRUD OPERATIONS
// ═════════════════════════════════════════════════════════════════

/**
 * GET /api/dashboard/user/list
 * Get all dashboards for current user
 */
router.get('/user/list', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: dashboards, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: dashboards || []
    });
  } catch (error) {
    console.error('Error fetching user dashboards:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/:dashboardId/full
 * Get dashboard with all widgets and settings
 */
router.get('/:dashboardId/full', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    // Get dashboard
    const { data: dashboard, error: dashError } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', dashboardId)
      .eq('user_id', userId)
      .single();

    if (dashError) throw dashError;
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }

    // Get widgets
    const { data: widgets, error: widgetError } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .order('position', { ascending: true });

    if (widgetError) throw widgetError;

    res.json({
      success: true,
      data: {
        ...dashboard,
        widgets: widgets || []
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/dashboard/create
 * Create new dashboard
 */
router.post('/create', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type = 'custom', config = {} } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Dashboard name is required'
      });
    }

    const { data: dashboard, error } = await supabase
      .from('dashboards')
      .insert({
        user_id: userId,
        name: name.trim(),
        type,
        config,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/dashboard/:dashboardId/update
 * Update dashboard
 */
router.put('/:dashboardId/update', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;
    const { name, config, description } = req.body;

    // Verify ownership
    const { data: dashboard, error: getError } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', dashboardId)
      .eq('user_id', userId)
      .single();

    if (getError || !dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }

    // Update
    const { data: updated, error } = await supabase
      .from('dashboards')
      .update({
        ...(name && { name }),
        ...(config && { config }),
        ...(description && { description }),
        updated_at: new Date().toISOString()
      })
      .eq('id', dashboardId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/dashboard/:dashboardId/delete
 * Delete dashboard
 */
router.delete('/:dashboardId/delete', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const { data: dashboard, error: getError } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', dashboardId)
      .eq('user_id', userId)
      .single();

    if (getError || !dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }

    // Delete widgets first
    await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('dashboard_id', dashboardId);

    // Delete dashboard
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', dashboardId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Dashboard deleted'
    });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/dashboard/:dashboardId/set-default
 * Set as default dashboard for user
 */
router.post('/:dashboardId/set-default', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    // Update all user dashboards
    await supabase
      .from('dashboards')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set selected as default
    const { data: dashboard, error } = await supabase
      .from('dashboards')
      .update({ is_default: true })
      .eq('id', dashboardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error setting default dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/dashboard/:dashboardId/clone
 * Clone/duplicate dashboard
 */
router.post('/:dashboardId/clone', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    // Get original dashboard
    const { data: original, error: getError } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', dashboardId)
      .eq('user_id', userId)
      .single();

    if (getError || !original) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }

    // Create clone
    const { data: cloned, error: createError } = await supabase
      .from('dashboards')
      .insert({
        user_id: userId,
        name: name || `${original.name} (Copy)`,
        type: original.type,
        config: original.config,
        description: original.description,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;

    // Clone widgets
    const { data: originalWidgets } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('dashboard_id', dashboardId);

    if (originalWidgets && originalWidgets.length > 0) {
      const clonedWidgets = originalWidgets.map(w => ({
        ...w,
        id: undefined,
        dashboard_id: cloned.id,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('dashboard_widgets')
        .insert(clonedWidgets);
    }

    res.json({
      success: true,
      data: cloned
    });
  } catch (error) {
    console.error('Error cloning dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═════════════════════════════════════════════════════════════════
// WIDGET MANAGEMENT
// ═════════════════════════════════════════════════════════════════

/**
 * GET /api/dashboard/:dashboardId/widgets
 * Get all widgets in dashboard
 */
router.get('/:dashboardId/widgets', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const { data: widgets, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .order('position', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: widgets || []
    });
  } catch (error) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/dashboard/:dashboardId/widget/add
 * Add widget to dashboard
 */
router.post('/:dashboardId/widget/add', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { type, config, position, size } = req.body;

    const { data: widget, error } = await supabase
      .from('dashboard_widgets')
      .insert({
        dashboard_id: dashboardId,
        type,
        config,
        position: position || 0,
        size: size || { width: 1, height: 1 },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: widget
    });
  } catch (error) {
    console.error('Error adding widget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/dashboard/:dashboardId/widget/:widgetId
 * Remove widget from dashboard
 */
router.delete('/:dashboardId/widget/:widgetId', requireAuth, async (req, res) => {
  try {
    const { dashboardId, widgetId } = req.params;

    const { error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', widgetId)
      .eq('dashboard_id', dashboardId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Widget removed'
    });
  } catch (error) {
    console.error('Error removing widget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/dashboard/:dashboardId/layout/save
 * Save dashboard layout
 */
router.post('/:dashboardId/layout/save', requireAuth, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { layout } = req.body;

    const { data: dashboard, error } = await supabase
      .from('dashboards')
      .update({
        config: { layout },
        updated_at: new Date().toISOString()
      })
      .eq('id', dashboardId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error saving layout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
