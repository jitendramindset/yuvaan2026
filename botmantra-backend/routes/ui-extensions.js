/**
 * UI Extension Pack API Routes
 * Marketplace, Custom Dashboards, Themes, White Label
 */
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// ═══════════════════════════════════════════════════════════════
// PART 1: MARKETPLACE DASHBOARDS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/ui-extensions/marketplace/templates
 * Browse marketplace templates
 */
router.get('/marketplace/templates', async (req, res) => {
  try {
    const { category, brand_code, is_free } = req.query;

    const { data, error } = await supabase.rpc('get_marketplace_templates', {
      p_category: category || null,
      p_brand_code: brand_code || null,
      p_is_free: is_free === 'true' ? true : is_free === 'false' ? false : null
    });

    if (error) throw error;

    res.json({
      success: true,
      templates: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/marketplace/install
 * Install marketplace template
 */
router.post('/marketplace/install', async (req, res) => {
  try {
    const { template_id, user_id, business_id } = req.body;

    if (!template_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'template_id and user_id required'
      });
    }

    const { data, error } = await supabase.rpc('install_marketplace_template', {
      p_template_id: template_id,
      p_user_id: user_id,
      p_business_id: business_id || null
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// PART 2: USER CUSTOMIZABLE DASHBOARDS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/ui-extensions/templates/duplicate
 * Duplicate template for user customization
 */
router.post('/templates/duplicate', async (req, res) => {
  try {
    const { template_id, user_id, new_template_name } = req.body;

    if (!template_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'template_id and user_id required'
      });
    }

    const { data, error } = await supabase.rpc('duplicate_template_for_user', {
      p_template_id: template_id,
      p_user_id: user_id,
      p_new_template_name: new_template_name || null
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/templates/set-default
 * Set user's default template
 */
router.post('/templates/set-default', async (req, res) => {
  try {
    const { user_id, template_id, context } = req.body;

    if (!user_id || !template_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id and template_id required'
      });
    }

    const { data, error } = await supabase.rpc('set_user_default_template', {
      p_user_id: user_id,
      p_template_id: template_id,
      p_context: context || 'dashboard'
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-extensions/templates/user/:user_id
 * Get user's template
 */
router.get('/templates/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { context } = req.query;

    const { data, error } = await supabase.rpc('get_user_template', {
      p_user_id: user_id,
      p_context: context || 'dashboard'
    });

    if (error) throw error;

    res.json({
      success: true,
      template: data && data.length > 0 ? data[0] : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// PART 2B: ADMIN CUSTOMIZATION (ALL VIEWS)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_BREAKPOINTS = {
  desktop: 1200,
  tablet: 768,
  mobile: 480
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const buildAdminViewLayout = ({
  view_type,
  layout_pref,
  sections,
  widgets,
  theme,
  brand_code
}) => {
  const safeSections = normalizeArray(sections);
  const safeWidgets = normalizeArray(widgets);

  const baseLayout = {
    meta: {
      view_type: view_type || 'dashboard',
      layout_pref: layout_pref || 'grid',
      brand_code: brand_code || 'default',
      generated_at: new Date().toISOString()
    },
    breakpoints: DEFAULT_BREAKPOINTS,
    theme: theme || {
      mode: 'light',
      primary: '#4F46E5',
      secondary: '#22C55E',
      background: '#0F172A'
    },
    sections: safeSections.length > 0 ? safeSections : [
      {
        id: 'overview',
        title: 'Overview',
        layout: layout_pref || 'grid',
        columns: 4
      }
    ],
    widgets: safeWidgets.length > 0 ? safeWidgets : [
      {
        id: 'kpi_total',
        type: 'kpi',
        title: 'Total',
        size: { w: 1, h: 1 }
      },
      {
        id: 'chart_trend',
        type: 'chart',
        title: 'Trend',
        size: { w: 2, h: 2 }
      },
      {
        id: 'table_activity',
        type: 'table',
        title: 'Recent Activity',
        size: { w: 4, h: 2 }
      }
    ],
    responsive_rules: {
      desktop: { columns: 12, gap: 16 },
      tablet: { columns: 8, gap: 12 },
      mobile: { columns: 4, gap: 8 }
    }
  };

  return baseLayout;
};

const generateNodeCode = (prefix = 'NODE') => `${prefix}-${Date.now()}`;

/**
 * POST /api/ui-extensions/admin/views/preview
 * Generate a responsive view schema based on admin input
 */
router.post('/admin/views/preview', async (req, res) => {
  try {
    const { brand_code, view_type, layout_pref, sections, widgets, theme } = req.body || {};

    const layout = buildAdminViewLayout({
      brand_code,
      view_type,
      layout_pref,
      sections,
      widgets,
      theme
    });

    res.json({
      success: true,
      view_schema: layout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/admin/views/save
 * Save a responsive view schema for admin customization
 */
router.post('/admin/views/save', async (req, res) => {
  try {
    const {
      node_id,
      name,
      description,
      category,
      brand_code,
      view_type,
      layout_pref,
      sections,
      widgets,
      theme,
      is_default,
      is_public
    } = req.body || {};

    if (!node_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'node_id and name required'
      });
    }

    const layout = buildAdminViewLayout({
      brand_code,
      view_type,
      layout_pref,
      sections,
      widgets,
      theme
    });

    const { data, error } = await supabase
      .from('ui_templates')
      .insert({
        node_id,
        name,
        description: description || null,
        category: category || view_type || 'admin_view',
        layout,
        responsive: true,
        is_default: !!is_default,
        is_public: !!is_public
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      template: data,
      view_schema: layout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/admin/ui/create
 * Create UI template from admin input
 */
router.post('/admin/ui/create', async (req, res) => {
  try {
    const {
      node_id,
      name,
      description,
      category,
      brand_code,
      view_type,
      layout_pref,
      sections,
      widgets,
      theme,
      is_default,
      is_public
    } = req.body || {};

    if (!node_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'node_id and name required'
      });
    }

    const layout = buildAdminViewLayout({
      brand_code,
      view_type,
      layout_pref,
      sections,
      widgets,
      theme
    });

    const { data, error } = await supabase
      .from('ui_templates')
      .insert({
        node_id,
        name,
        description: description || null,
        category: category || view_type || 'admin_view',
        layout,
        responsive: true,
        is_default: !!is_default,
        is_public: !!is_public
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      template: data,
      view_schema: layout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/admin/node/create-with-ui
 * Create core node and attach UI template/schema
 */
router.post('/admin/node/create-with-ui', async (req, res) => {
  try {
    const {
      owner_id,
      created_by,
      name,
      node_type,
      node_category,
      status,
      is_default,
      metadata,
      ui_template_id,
      ui_schema,
      ui_fields,
      model_fields
    } = req.body || {};

    if (!owner_id || !name || !node_type) {
      return res.status(400).json({
        success: false,
        error: 'owner_id, name, and node_type required'
      });
    }

    let resolvedSchema = ui_schema || null;

    if (!resolvedSchema && ui_template_id) {
      const { data: template, error: templateError } = await supabase
        .from('ui_templates')
        .select('id, layout')
        .eq('id', ui_template_id)
        .single();

      if (templateError) throw templateError;
      resolvedSchema = template?.layout || null;
    }

    const nodePayload = {
      node_code: generateNodeCode('NODE'),
      node_type,
      node_category: node_category || 'custom',
      owner_id,
      created_by: created_by || owner_id,
      name,
      status: status || 'active',
      is_default: !!is_default,
      metadata: {
        ...(metadata || {}),
        ui_template_id: ui_template_id || null
      },
      ui_template_json: resolvedSchema || {},
      ui_fields_json: ui_fields || {},
      model_fields_json: model_fields || {}
    };

    const { data: coreNode, error } = await supabase
      .from('core_node')
      .insert([nodePayload])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      node: coreNode,
      ui_template_id: ui_template_id || null,
      ui_schema: resolvedSchema || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// PART 3: DRAG & DROP LAYOUT SAVING
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/ui-extensions/layouts/save
 * Save widget layout position
 */
router.post('/layouts/save', async (req, res) => {
  try {
    const { user_id, template_id, widget_id, x, y, w, h, hidden } = req.body;

    if (!user_id || !template_id || !widget_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id, template_id, and widget_id required'
      });
    }

    const { data, error } = await supabase.rpc('save_widget_layout', {
      p_user_id: user_id,
      p_template_id: template_id,
      p_widget_id: widget_id,
      p_x: x,
      p_y: y,
      p_w: w,
      p_h: h,
      p_hidden: hidden || false
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/layouts/save-bulk
 * Save multiple widget layouts
 */
router.post('/layouts/save-bulk', async (req, res) => {
  try {
    const { user_id, template_id, layouts } = req.body;

    if (!user_id || !template_id || !layouts || !Array.isArray(layouts)) {
      return res.status(400).json({
        success: false,
        error: 'user_id, template_id, and layouts array required'
      });
    }

    const { data, error } = await supabase.rpc('save_bulk_widget_layouts', {
      p_user_id: user_id,
      p_template_id: template_id,
      p_layouts: layouts
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-extensions/layouts/versions
 * Get layout version history
 */
router.get('/layouts/versions', async (req, res) => {
  try {
    const { user_id, template_id } = req.query;

    if (!user_id || !template_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id and template_id required'
      });
    }

    const { data, error } = await supabase.rpc('get_layout_versions', {
      p_user_id: user_id,
      p_template_id: template_id
    });

    if (error) throw error;

    res.json({
      success: true,
      versions: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/layouts/restore
 * Restore layout from version
 */
router.post('/layouts/restore', async (req, res) => {
  try {
    const { user_id, template_id, version } = req.body;

    if (!user_id || !template_id || !version) {
      return res.status(400).json({
        success: false,
        error: 'user_id, template_id, and version required'
      });
    }

    const { data, error } = await supabase.rpc('restore_layout_version', {
      p_user_id: user_id,
      p_template_id: template_id,
      p_version: version
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// PART 4: THEME EDITOR
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/ui-extensions/branding/:brand_code
 * Get brand theme
 */
router.get('/branding/:brand_code', async (req, res) => {
  try {
    const { brand_code } = req.params;

    const { data, error } = await supabase.rpc('get_branding', {
      p_brand_code: brand_code
    });

    if (error) throw error;

    res.json({
      success: true,
      theme: data && data.length > 0 ? data[0] : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/branding/save
 * Save brand theme
 */
router.post('/branding/save', async (req, res) => {
  try {
    const { brand_code, theme_config } = req.body;

    if (!brand_code || !theme_config) {
      return res.status(400).json({
        success: false,
        error: 'brand_code and theme_config required'
      });
    }

    const { data, error } = await supabase.rpc('save_branding', {
      p_brand_code: brand_code,
      p_theme_config: theme_config
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/branding/preview
 * Preview theme
 */
router.post('/branding/preview', async (req, res) => {
  try {
    const { theme_config } = req.body;

    if (!theme_config) {
      return res.status(400).json({
        success: false,
        error: 'theme_config required'
      });
    }

    const { data, error } = await supabase.rpc('preview_theme', {
      p_theme_config: theme_config
    });

    if (error) throw error;

    res.json({
      success: true,
      preview: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// PART 5: WHITE LABEL ONBOARDING
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/ui-extensions/white-label/create
 * Create white-label client
 */
router.post('/white-label/create', async (req, res) => {
  try {
    const {
      business_id,
      client_name,
      brand_code,
      subdomain,
      theme_config,
      base_template_id,
      created_by
    } = req.body;

    if (!business_id || !client_name || !brand_code || !subdomain) {
      return res.status(400).json({
        success: false,
        error: 'business_id, client_name, brand_code, and subdomain required'
      });
    }

    const { data, error } = await supabase.rpc('create_white_label_client', {
      p_business_id: business_id,
      p_client_name: client_name,
      p_brand_code: brand_code,
      p_subdomain: subdomain,
      p_theme_config: theme_config || null,
      p_base_template_id: base_template_id || null,
      p_created_by: created_by || null
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-extensions/white-label/resolve
 * Resolve white-label domain
 */
router.get('/white-label/resolve', async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'domain required'
      });
    }

    const { data, error } = await supabase.rpc('resolve_white_label_domain', {
      p_domain: domain
    });

    if (error) throw error;

    res.json({
      success: true,
      client: data && data.length > 0 ? data[0] : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-extensions/white-label/:client_id/permissions
 * Get white-label permissions
 */
router.get('/white-label/:client_id/permissions', async (req, res) => {
  try {
    const { client_id } = req.params;

    const { data, error } = await supabase.rpc('get_white_label_permissions', {
      p_client_id: client_id
    });

    if (error) throw error;

    res.json({
      success: true,
      permissions: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-extensions/white-label/onboard-user
 * Onboard user to white-label instance
 */
router.post('/white-label/onboard-user', async (req, res) => {
  try {
    const { client_id, user_id, role } = req.body;

    if (!client_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'client_id and user_id required'
      });
    }

    const { data, error } = await supabase.rpc('onboard_white_label_user', {
      p_client_id: client_id,
      p_user_id: user_id,
      p_role: role || 'user'
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
