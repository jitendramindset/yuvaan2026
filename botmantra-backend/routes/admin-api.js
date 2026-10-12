/**
 * Admin API Routes - Complete admin customization and management
 * 
 * Routes:
 * - Admin status check
 * - UI theme management
 * - Widget CRUD operations
 * - Layout management
 * - Audit logging
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth-permission');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Helper: Get role info for a user via user_roles -> roles join
 * Returns { role_name, role_code } or null
 */
async function getUserRole(userId) {
  const { data } = await supabase
    .from('user_roles')
    .select('role_id, roles(id, role_name, role_code)')
    .eq('user_id', userId)
    .single();
  if (!data?.roles) return null;
  return { role_name: data.roles.role_name, role_code: data.roles.role_code };
}

/**
 * Helper: Check if role qualifies as admin-level access
 * Matches: Owner, Admin, SuperAdmin (case-insensitive)
 */
function isAdminRole(role) {
  if (!role) return false;
  const code = (role.role_code || '').toLowerCase();
  return ['owner', 'admin', 'superadmin', 'super_admin'].includes(code);
}

/**
 * Check if user is admin
 */
router.get('/check-status/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = req.user.id;

    // Verify requesting user is admin/owner
    const requesterRole = await getUserRole(authUserId);

    if (!isAdminRole(requesterRole)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    }

    // Get target user's role
    const targetRole = await getUserRole(userId);

    res.json({
      success: true,
      isAdmin: isAdminRole(targetRole),
      role: targetRole?.role_name || 'user',
      role_code: targetRole?.role_code || 'viewer',
      permissions: []
    });
  } catch (error) {
    console.error('Admin status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get UI theme configuration
 */
router.get('/ui-theme', requireAuth, async (req, res) => {
  try {
    const { data: theme } = await supabase
      .from('ui_customization')
      .select('*')
      .eq('organization_id', req.user.organization_id || req.user.id)
      .single();

    res.json({
      success: true,
      theme: theme || {},
      colors: theme?.colors || {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#fbbf24',
        background: '#0f0c29',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      layout: theme?.layout || {}
    });
  } catch (error) {
    console.error('Get UI theme error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update theme colors
 */
router.post('/theme/colors', requireAuth, async (req, res) => {
  try {
    // Verify admin/owner via user_roles -> roles join
    const userRole = await getUserRole(req.user.id);

    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    }

    const orgId = req.user.organization_id || req.user.id;

    // Update or insert customization
    const { data, error } = await supabase
      .from('ui_customization')
      .upsert({
        organization_id: orgId,
        colors: req.body,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: req.user.id,
      action: 'UPDATE_THEME_COLORS',
      details: { colors: req.body },
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      colors: req.body,
      message: 'Theme colors updated'
    });
  } catch (error) {
    console.error('Update theme colors error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get available widgets
 */
router.get('/widgets/available', requireAuth, async (req, res) => {
  try {
    const orgId = req.user.organization_id || req.user.id;

    const { data: widgets } = await supabase
      .from('custom_widgets')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      widgets: widgets || [],
      categories: ['custom', 'chart', 'stats', 'table', 'form']
    });
  } catch (error) {
    console.error('Get widgets error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      widgets: []
    });
  }
});

/**
 * Create new widget
 */
router.post('/widgets/create', requireAuth, async (req, res) => {
  try {
    // Verify admin/owner via user_roles -> roles join
    const userRole = await getUserRole(req.user.id);

    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    }

    const orgId = req.user.organization_id || req.user.id;

    const { data: widget, error } = await supabase
      .from('custom_widgets')
      .insert({
        organization_id: orgId,
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        icon: req.body.icon,
        config: req.body.config,
        default_size: req.body.defaultSize,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: req.user.id,
      action: 'CREATE_WIDGET',
      details: { widget_name: req.body.name, widget_type: req.body.type },
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      widget: widget[0],
      message: 'Widget created successfully'
    });
  } catch (error) {
    console.error('Create widget error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update widget
 */
router.put('/widgets/:widgetId/update', requireAuth, async (req, res) => {
  try {
    // Verify admin/owner via user_roles -> roles join
    const userRole = await getUserRole(req.user.id);

    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    }

    const orgId = req.user.organization_id || req.user.id;

    const { data: widget, error } = await supabase
      .from('custom_widgets')
      .update({
        name: req.body.name,
        description: req.body.description,
        config: req.body.config,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.widgetId)
      .eq('organization_id', orgId)
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: req.user.id,
      action: 'UPDATE_WIDGET',
      details: { widget_id: req.params.widgetId },
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      widget: widget[0],
      message: 'Widget updated successfully'
    });
  } catch (error) {
    console.error('Update widget error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete widget
 */
router.delete('/widgets/:widgetId/delete', requireAuth, async (req, res) => {
  try {
    // Verify admin/owner via user_roles -> roles join
    const userRole = await getUserRole(req.user.id);

    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    }

    const orgId = req.user.organization_id || req.user.id;

    await supabase
      .from('custom_widgets')
      .delete()
      .eq('id', req.params.widgetId)
      .eq('organization_id', orgId);

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: req.user.id,
      action: 'DELETE_WIDGET',
      details: { widget_id: req.params.widgetId },
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Widget deleted successfully'
    });
  } catch (error) {
    console.error('Delete widget error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save widget layout
 */
router.post('/layout/save', requireAuth, async (req, res) => {
  try {
    const orgId = req.user.organization_id || req.user.id;

    const { data: layout, error } = await supabase
      .from('ui_layouts')
      .insert({
        organization_id: orgId,
        name: req.body.name,
        description: req.body.description,
        widgets: req.body.widgets,
        grid_config: req.body.gridConfig,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: req.user.id,
      action: 'SAVE_LAYOUT',
      details: { layout_name: req.body.name },
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      layout: layout[0],
      message: 'Layout saved successfully'
    });
  } catch (error) {
    console.error('Save layout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all layouts
 */
router.get('/layouts/list', requireAuth, async (req, res) => {
  try {
    const orgId = req.user.organization_id || req.user.id;

    const { data: layouts } = await supabase
      .from('ui_layouts')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      layouts: layouts || []
    });
  } catch (error) {
    console.error('Get layouts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      layouts: []
    });
  }
});

/**
 * Apply layout
 */
router.post('/layout/apply/:layoutId', requireAuth, async (req, res) => {
  try {
    const orgId = req.user.organization_id || req.user.id;

    const { data: layout } = await supabase
      .from('ui_layouts')
      .select('*')
      .eq('id', req.params.layoutId)
      .eq('organization_id', orgId)
      .single();

    if (!layout) {
      return res.status(404).json({
        success: false,
        error: 'Layout not found'
      });
    }

    // Update as active layout
    await supabase
      .from('ui_customization')
      .upsert({
        organization_id: orgId,
        active_layout_id: req.params.layoutId,
        updated_at: new Date().toISOString()
      });

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: req.user.id,
      action: 'APPLY_LAYOUT',
      details: { layout_id: req.params.layoutId },
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      layout: layout,
      message: 'Layout applied successfully'
    });
  } catch (error) {
    console.error('Apply layout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reorder widgets
 */
router.post('/widgets/reorder', requireAuth, async (req, res) => {
  try {
    const orgId = req.user.organization_id || req.user.id;

    // Update all widget orders
    for (const item of req.body.arrangement) {
      await supabase
        .from('custom_widgets')
        .update({ order: item.order })
        .eq('id', item.widgetId)
        .eq('organization_id', orgId);
    }

    // Log audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: req.user.id,
      action: 'REORDER_WIDGETS',
      details: { count: req.body.arrangement.length },
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Widget order updated'
    });
  } catch (error) {
    console.error('Reorder widgets error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get audit logs
 */
router.get('/audit-logs', requireAuth, async (req, res) => {
  try {
    // Verify admin/owner via user_roles -> roles join
    const userRole = await getUserRole(req.user.id);

    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    }

    const limit = parseInt(req.query.limit) || 50;

    const { data: logs } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('admin_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    res.json({
      success: true,
      logs: logs || []
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      logs: []
    });
  }
});

module.exports = router;
