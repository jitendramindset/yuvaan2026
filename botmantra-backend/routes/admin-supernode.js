/**
 * ADMIN SUPERNODE - Root Governance & Control
 * The Admin is not a user - it's a Node with supreme permissions
 * 
 * Admin can:
 * - Create/modify any brand
 * - Change layouts dynamically
 * - Override permissions
 * - Manage all nodes
 * - Generate reports on vector memory
 */

const express = require('express');
const { supabase } = require('../config/supabase');

module.exports = function setupAdminSuperNode(app) {
  const router = express.Router();

  // Middleware: Verify user is admin
  const requireAdmin = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Check if user owns admin node or has admin permissions
      const { data: adminNode } = await supabase
        .from('node_core')
        .select('node_id')
        .eq('node_code', 'admin_super')
        .single();

      if (!adminNode) {
        return res.status(403).json({ success: false, error: 'Admin node not found' });
      }

      // For now, simple check - in production, use proper admin roles
      const isAdmin = process.env.ADMIN_USER_ID === userId;
      
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      req.adminNodeId = adminNode.node_id;
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // 👑 BRAND MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /admin/brands/create
   * Create a new brand root node
   */
  router.post('/brands/create', requireAdmin, async (req, res) => {
    try {
      const {
        node_code,
        node_name,
        description,
        base_color,
        target_audience,
        initial_widgets = [],
        metadata = {}
      } = req.body;

      if (!node_code || !node_name) {
        return res.status(400).json({
          success: false,
          error: 'node_code and node_name are required'
        });
      }

      // Check if brand already exists
      const { data: existing } = await supabase
        .from('node_core')
        .select('node_id')
        .eq('node_code', node_code)
        .single();

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Brand code already exists'
        });
      }

      // Create brand node under admin
      const { data: brandNode, error } = await supabase
        .from('node_core')
        .insert([{
          node_type: 'brand',
          node_code,
          node_name,
          node_description: description,
          parent_node: req.adminNodeId,
          owner_node: req.adminNodeId,
          visibility: 'public',
          metadata: {
            ...metadata,
            base_color,
            target_audience,
            created_by_admin: true,
            created_at: new Date().toISOString()
          },
          ui_schema: {
            widgets: initial_widgets,
            theme: 'default',
            layout: 'feed'
          }
        }])
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await logAdminAction(req.adminNodeId, 'CREATE_BRAND', {
        brand_code: node_code,
        brand_id: brandNode.node_id
      }, supabase);

      res.json({
        success: true,
        data: brandNode,
        message: `Brand "${node_name}" created successfully`
      });
    } catch (error) {
      console.error('Brand creation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /admin/brands/:brandCode/layout
   * Modify brand layout dynamically
   */
  router.put('/brands/:brandCode/layout', requireAdmin, async (req, res) => {
    try {
      const { brandCode } = req.params;
      const { ui_schema } = req.body;

      if (!ui_schema) {
        return res.status(400).json({
          success: false,
          error: 'ui_schema is required'
        });
      }

      const { data: updated, error } = await supabase
        .from('node_core')
        .update({ ui_schema })
        .eq('node_code', brandCode)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(req.adminNodeId, 'MODIFY_BRAND_LAYOUT', {
        brand_code: brandCode,
        new_widgets: ui_schema.widgets
      }, supabase);

      res.json({
        success: true,
        data: updated,
        message: `Layout updated for brand "${brandCode}"`
      });
    } catch (error) {
      console.error('Layout update error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /admin/brands/:brandCode/metadata
   * Update brand metadata
   */
  router.put('/brands/:brandCode/metadata', requireAdmin, async (req, res) => {
    try {
      const { brandCode } = req.params;
      const { metadata } = req.body;

      const { data: brand } = await supabase
        .from('node_core')
        .select('metadata')
        .eq('node_code', brandCode)
        .single();

      const updated_metadata = { ...brand.metadata, ...metadata };

      const { data: updated, error } = await supabase
        .from('node_core')
        .update({ metadata: updated_metadata })
        .eq('node_code', brandCode)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(req.adminNodeId, 'UPDATE_BRAND_METADATA', {
        brand_code: brandCode,
        updated_fields: Object.keys(metadata)
      }, supabase);

      res.json({
        success: true,
        data: updated,
        message: 'Brand metadata updated'
      });
    } catch (error) {
      console.error('Metadata update error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 👥 USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * GET /admin/users
   * List all users
   */
  router.get('/users', requireAdmin, async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const { data, error, count } = await supabase
        .from('node_core')
        .select('*', { count: 'exact' })
        .eq('node_type', 'user')
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data,
        pagination: { limit, offset, total: count }
      });
    } catch (error) {
      console.error('User fetch error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /admin/users/:userId
   * Get user node with all relationships and vectors
   */
  router.get('/users/:userId', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;

      // Get user node
      const { data: userNode } = await supabase
        .from('node_core')
        .select('*')
        .eq('node_id', userId)
        .single();

      // Get relationships
      const { data: relationships } = await supabase
        .from('node_relationships')
        .select('*')
        .or(`parent_node.eq.${userId},child_node.eq.${userId}`);

      // Get vectors
      const { data: vectors } = await supabase
        .from('node_vector_memory')
        .select('*')
        .eq('node_id', userId);

      res.json({
        success: true,
        data: {
          node: userNode,
          relationships: relationships || [],
          vectors: vectors || []
        }
      });
    } catch (error) {
      console.error('User detail fetch error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /admin/users/:userId/permissions
   * Override user permissions
   */
  router.put('/users/:userId/permissions', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      if (!permissions) {
        return res.status(400).json({
          success: false,
          error: 'permissions object is required'
        });
      }

      const { data: updated, error } = await supabase
        .from('node_core')
        .update({ permissions })
        .eq('node_id', userId)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(req.adminNodeId, 'OVERRIDE_USER_PERMISSIONS', {
        user_id: userId,
        permissions
      }, supabase);

      res.json({
        success: true,
        data: updated,
        message: 'User permissions updated'
      });
    } catch (error) {
      console.error('Permission update error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /admin/users/:userId
   * Delete user and cascade their nodes
   */
  router.delete('/users/:userId', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;

      // Soft delete user node
      const { error } = await supabase
        .from('node_core')
        .update({ deleted_at: new Date().toISOString() })
        .eq('node_id', userId);

      if (error) throw error;

      await logAdminAction(req.adminNodeId, 'DELETE_USER', {
        user_id: userId
      }, supabase);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('User delete error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🔐 PERMISSION & POLICY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /admin/permissions/set
   * Set permissions for a node globally
   */
  router.post('/permissions/set', requireAdmin, async (req, res) => {
    try {
      const { node_id, permissions } = req.body;

      if (!node_id || !permissions) {
        return res.status(400).json({
          success: false,
          error: 'node_id and permissions are required'
        });
      }

      const { data: updated, error } = await supabase
        .from('node_core')
        .update({ permissions })
        .eq('node_id', node_id)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(req.adminNodeId, 'SET_NODE_PERMISSIONS', {
        node_id,
        permissions
      }, supabase);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Permission set error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /admin/visibility/set
   * Override visibility (private/family/public)
   */
  router.post('/visibility/set', requireAdmin, async (req, res) => {
    try {
      const { node_id, visibility } = req.body;

      if (!node_id || !['private', 'family', 'public'].includes(visibility)) {
        return res.status(400).json({
          success: false,
          error: 'Valid node_id and visibility required'
        });
      }

      const { data: updated, error } = await supabase
        .from('node_core')
        .update({ visibility })
        .eq('node_id', node_id)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(req.adminNodeId, 'OVERRIDE_VISIBILITY', {
        node_id,
        visibility
      }, supabase);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Visibility update error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 📊 ANALYTICS & REPORTING
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * GET /admin/analytics/nodes
   * Get node count by type
   */
  router.get('/analytics/nodes', requireAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .rpc('get_node_count_by_type');

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /admin/analytics/vector-storage
   * Get vector memory usage stats
   */
  router.get('/analytics/vector-storage', requireAdmin, async (req, res) => {
    try {
      const { data: vectorStats } = await supabase
        .from('node_vector_memory')
        .select('content_type', { count: 'exact' });

      const stats = {
        total_vectors: vectorStats?.length || 0,
        by_type: {}
      };

      // Group by content type
      const { data: byType } = await supabase
        .rpc('get_vector_count_by_type');

      res.json({
        success: true,
        data: { ...stats, by_type: byType }
      });
    } catch (error) {
      console.error('Vector stats error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /admin/audit-log
   * View admin actions
   */
  router.get('/audit-log', requireAdmin, async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;

      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Audit log fetch error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/admin', router);
};

/**
 * LOG ADMIN ACTION
 * Create audit trail for all admin operations
 */
async function logAdminAction(adminNodeId, action, details, supabase) {
  try {
    await supabase
      .from('admin_audit_log')
      .insert([{
        admin_node_id: adminNodeId,
        action,
        details,
        timestamp: new Date().toISOString()
      }]);
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - logging shouldn't block operations
  }
}

module.exports = setupAdminSuperNode;
