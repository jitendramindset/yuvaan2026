/**
 * 🎨 NODE OS UI RENDERER
 * Converts Node Core data into renderable UI schemas
 * Generates dynamic React component configurations
 * 
 * Features:
 * - Read from core_node (ui_template_json, ui_fields_json, model_fields_json)
 * - Generate schemas for dashboard, table, form, widget, card
 * - Session validation via kernel
 * - Integration with interaction classifier
 * 
 * Date: February 2, 2026
 */

const express = require("express");
const router = express.Router();
const KernelEngine = require("../kernel-engine");

// Initialize kernel engine
const kernel = new KernelEngine(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// ================================
// RENDER UI FROM CORE NODE
// ================================

router.post("/render", async (req, res) => {
  try {
    const { 
      component_type,      // dashboard, table, form, widget, card, chart
      target_component,    // wallet_card, revenue_dashboard, user_table
      properties,          // Additional properties from classifier
      session_token,
      node_id              // Optional: specific node to render from
    } = req.body;

    if (!component_type || !session_token) {
      return res.status(400).json({
        success: false,
        error: "component_type and session_token required"
      });
    }

    // Validate session
    const sessionResult = await kernel.validateSession(session_token);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session",
        reason: sessionResult.reason
      });
    }

    const userId = sessionResult.user_id;

    // Fetch node data
    const nodeData = await fetchNodeData(node_id, userId, target_component);

    if (!nodeData) {
      // Generate default schema if no node data found
      const defaultSchema = generateDefaultSchema(component_type, target_component, properties);
      
      return res.json({
        success: true,
        ui_schema: defaultSchema,
        source: 'generated',
        node_id: null
      });
    }

    // Generate UI schema from node data
    const uiSchema = await generateUISchema(
      component_type,
      nodeData,
      properties
    );

    return res.json({
      success: true,
      ui_schema: uiSchema,
      source: 'core_node',
      node_id: nodeData.id,
      node_type: nodeData.node_type
    });

  } catch (error) {
    console.error("UI Render Error:", error);
    return res.status(500).json({
      success: false,
      error: "UI rendering failed",
      details: error.message
    });
  }
});

// ================================
// GENERATE NEW UI SCHEMA
// ================================

router.post("/schema/generate", async (req, res) => {
  try {
    const {
      component_type,
      name,
      description,
      data_source,        // Table or API endpoint
      fields,             // Array of field definitions
      layout,             // grid, list, table, form
      theme,              // Color scheme
      session_token
    } = req.body;

    if (!component_type || !session_token) {
      return res.status(400).json({
        success: false,
        error: "component_type and session_token required"
      });
    }

    // Validate session
    const sessionResult = await kernel.validateSession(session_token);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session"
      });
    }

    // Generate schema
    const schema = buildUISchema({
      component_type,
      name: name || `New ${component_type}`,
      description,
      data_source,
      fields: fields || [],
      layout: layout || 'grid',
      theme: theme || { primary: '#6366f1', secondary: '#8b5cf6' }
    });

    // Optionally save to core_node
    const userId = sessionResult.user_id;
    const savedNode = await saveUITemplate(userId, schema, component_type);

    return res.json({
      success: true,
      ui_schema: schema,
      node_id: savedNode?.id,
      template_id: savedNode?.id
    });

  } catch (error) {
    console.error("Schema Generation Error:", error);
    return res.status(500).json({
      success: false,
      error: "Schema generation failed",
      details: error.message
    });
  }
});

// ================================
// GET EXISTING UI SCHEMA
// ================================

router.get("/schema/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { session_token } = req.query;

    if (!session_token) {
      return res.status(401).json({
        success: false,
        error: "session_token required"
      });
    }

    // Validate session
    const sessionResult = await kernel.validateSession(session_token);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session"
      });
    }

    // Fetch template
    const { data: node, error } = await kernel.client
      .from('core_node')
      .select('id, name, node_type, ui_template_json, ui_fields_json, model_fields_json')
      .eq('id', templateId)
      .single();

    if (error || !node) {
      return res.status(404).json({
        success: false,
        error: "Template not found"
      });
    }

    return res.json({
      success: true,
      template: {
        id: node.id,
        name: node.name,
        type: node.node_type,
        ui_template: node.ui_template_json,
        ui_fields: node.ui_fields_json,
        model_fields: node.model_fields_json
      }
    });

  } catch (error) {
    console.error("Template Fetch Error:", error);
    return res.status(500).json({
      success: false,
      error: "Template fetch failed",
      details: error.message
    });
  }
});

// ================================
// LIST AVAILABLE TEMPLATES
// ================================

router.get("/templates", async (req, res) => {
  try {
    const { session_token, component_type } = req.query;

    if (!session_token) {
      return res.status(401).json({
        success: false,
        error: "session_token required"
      });
    }

    // Validate session
    const sessionResult = await kernel.validateSession(session_token);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session"
      });
    }

    const userId = sessionResult.user_id;

    // Build query
    let query = kernel.client
      .from('core_node')
      .select('id, name, node_type, description, ui_template_json, created_at')
      .eq('owner_id', userId)
      .eq('status', 'active')
      .not('ui_template_json', 'is', null);

    if (component_type) {
      query = query.eq('node_type', component_type);
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      templates: templates || [],
      count: templates?.length || 0
    });

  } catch (error) {
    console.error("Templates List Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch templates",
      details: error.message
    });
  }
});

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Fetch node data from core_node table
 */
async function fetchNodeData(nodeId, userId, targetComponent) {
  try {
    let query = kernel.client
      .from('core_node')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'active');

    if (nodeId) {
      query = query.eq('id', nodeId);
    } else if (targetComponent) {
      // Try to find by name or code
      query = query.or(`name.ilike.%${targetComponent}%,node_code.ilike.%${targetComponent}%`);
    }

    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Node fetch error:', error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('fetchNodeData error:', e);
    return null;
  }
}

/**
 * Generate UI schema from node data
 */
async function generateUISchema(componentType, nodeData, properties = {}) {
  const baseSchema = {
    id: nodeData.id,
    name: nodeData.name,
    description: nodeData.description,
    type: componentType,
    node_type: nodeData.node_type,
    
    // Use stored templates if available
    template: nodeData.ui_template_json || {},
    fields: nodeData.ui_fields_json || {},
    model: nodeData.model_fields_json || {},
    
    // Metadata
    icon: nodeData.icon,
    color: nodeData.color,
    metadata: nodeData.metadata,
    
    // Additional properties from classifier
    properties: properties
  };

  // Component-specific generation
  switch (componentType) {
    case 'dashboard':
      return generateDashboardSchema(baseSchema, nodeData);
    
    case 'table':
      return generateTableSchema(baseSchema, nodeData);
    
    case 'form':
      return generateFormSchema(baseSchema, nodeData);
    
    case 'widget':
    case 'card':
      return generateWidgetSchema(baseSchema, nodeData);
    
    case 'chart':
      return generateChartSchema(baseSchema, nodeData);
    
    default:
      return baseSchema;
  }
}

/**
 * Generate dashboard schema
 */
function generateDashboardSchema(base, nodeData) {
  return {
    ...base,
    layout: {
      type: 'grid',
      columns: 12,
      gap: 16,
      responsive: true
    },
    widgets: base.template.widgets || [
      {
        id: 'stats-1',
        type: 'stat_card',
        position: { x: 0, y: 0, w: 3, h: 2 },
        props: {
          title: 'Total Revenue',
          value: nodeData.total_revenue || 0,
          icon: 'dollar',
          color: base.color || '#10b981'
        }
      },
      {
        id: 'stats-2',
        type: 'stat_card',
        position: { x: 3, y: 0, w: 3, h: 2 },
        props: {
          title: 'Total Users',
          value: nodeData.total_users || 0,
          icon: 'users',
          color: '#3b82f6'
        }
      },
      {
        id: 'stats-3',
        type: 'stat_card',
        position: { x: 6, y: 0, w: 3, h: 2 },
        props: {
          title: 'Transactions',
          value: nodeData.total_transactions || 0,
          icon: 'activity',
          color: '#8b5cf6'
        }
      }
    ],
    theme: {
      primary: base.color || '#6366f1',
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb'
    }
  };
}

/**
 * Generate table schema
 */
function generateTableSchema(base, nodeData) {
  const fields = base.fields.columns || inferFieldsFromModel(base.model);
  
  return {
    ...base,
    columns: fields.map(field => ({
      id: field.name || field.id,
      header: field.label || field.name,
      accessor: field.name || field.id,
      type: field.type || 'text',
      sortable: field.sortable !== false,
      filterable: field.filterable !== false,
      width: field.width || 'auto'
    })),
    data_source: {
      type: 'api',
      endpoint: `/api/table/${nodeData.node_code || 'data'}`,
      method: 'GET'
    },
    features: {
      search: true,
      filter: true,
      sort: true,
      pagination: true,
      export: true
    },
    pagination: {
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100]
    }
  };
}

/**
 * Generate form schema
 */
function generateFormSchema(base, nodeData) {
  const fields = base.fields.form_fields || inferFieldsFromModel(base.model);
  
  return {
    ...base,
    fields: fields.map(field => ({
      id: field.name || field.id,
      name: field.name || field.id,
      label: field.label || field.name,
      type: field.type || 'text',
      placeholder: field.placeholder || '',
      required: field.required || false,
      validation: field.validation || {},
      defaultValue: field.default || '',
      options: field.options || [],
      helpText: field.help || ''
    })),
    submit: {
      endpoint: `/api/table/${nodeData.node_code || 'data'}`,
      method: 'POST',
      successMessage: 'Saved successfully',
      errorMessage: 'Save failed'
    },
    layout: {
      columns: 2,
      gap: 16
    }
  };
}

/**
 * Generate widget/card schema
 */
function generateWidgetSchema(base, nodeData) {
  const widgetType = base.properties?.widget_type || 'stat_card';
  
  const widgetSchemas = {
    stat_card: {
      type: 'stat_card',
      title: base.name,
      value: nodeData.total_revenue || 0,
      icon: base.icon || 'trending-up',
      color: base.color || '#10b981',
      trend: {
        value: 12.5,
        direction: 'up'
      }
    },
    chart_card: {
      type: 'chart',
      title: base.name,
      chartType: 'line',
      data: [],
      xAxis: 'date',
      yAxis: 'value'
    },
    info_card: {
      type: 'info_card',
      title: base.name,
      description: base.description,
      icon: base.icon,
      actions: []
    }
  };

  return {
    ...base,
    widget: widgetSchemas[widgetType] || widgetSchemas.stat_card
  };
}

/**
 * Generate chart schema
 */
function generateChartSchema(base, nodeData) {
  return {
    ...base,
    chart: {
      type: base.properties?.chart_type || 'line',
      data: base.template.data || [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: base.name
          }
        }
      },
      axes: {
        x: base.fields.x_axis || { label: 'Date', field: 'date' },
        y: base.fields.y_axis || { label: 'Value', field: 'value' }
      }
    }
  };
}

/**
 * Generate default schema when no node data found
 */
function generateDefaultSchema(componentType, targetComponent, properties) {
  const templates = {
    dashboard: {
      type: 'dashboard',
      name: targetComponent || 'New Dashboard',
      layout: { type: 'grid', columns: 12 },
      widgets: []
    },
    table: {
      type: 'table',
      name: targetComponent || 'Data Table',
      columns: [],
      data_source: { type: 'api', endpoint: '/api/data' }
    },
    form: {
      type: 'form',
      name: targetComponent || 'New Form',
      fields: []
    },
    widget: {
      type: 'widget',
      name: targetComponent || 'New Widget',
      widget: { type: 'stat_card' }
    },
    card: {
      type: 'card',
      name: targetComponent || 'New Card',
      widget: { type: 'info_card' }
    }
  };

  return templates[componentType] || { type: componentType, name: 'Unknown Component' };
}

/**
 * Build UI schema from parameters
 */
function buildUISchema(params) {
  return {
    id: null, // Will be assigned when saved
    name: params.name,
    description: params.description,
    type: params.component_type,
    template: {
      layout: params.layout,
      theme: params.theme
    },
    fields: params.fields.reduce((acc, field) => {
      acc[field.name] = {
        label: field.label,
        type: field.type,
        required: field.required || false
      };
      return acc;
    }, {}),
    data_source: params.data_source,
    created_at: new Date().toISOString()
  };
}

/**
 * Save UI template to core_node
 */
async function saveUITemplate(userId, schema, componentType) {
  try {
    const { data, error } = await kernel.client
      .from('core_node')
      .insert({
        node_code: `ui_${componentType}_${Date.now()}`,
        node_type: componentType,
        node_category: 'transaction',
        owner_id: userId,
        created_by: userId,
        name: schema.name,
        description: schema.description,
        ui_template_json: schema.template,
        ui_fields_json: schema.fields,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Save template error:', error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('saveUITemplate error:', e);
    return null;
  }
}

/**
 * Infer fields from model_fields_json
 */
function inferFieldsFromModel(model) {
  if (!model || typeof model !== 'object') {
    return [];
  }

  return Object.keys(model).map(key => ({
    name: key,
    label: formatLabel(key),
    type: inferFieldType(model[key]),
    required: false
  }));
}

/**
 * Format field name to label
 */
function formatLabel(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Infer field type from value
 */
function inferFieldType(value) {
  if (value === null || value === undefined) return 'text';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'checkbox';
  if (value instanceof Date) return 'date';
  if (typeof value === 'string') {
    if (value.includes('@')) return 'email';
    if (value.match(/^\d{10}$/)) return 'phone';
    if (value.length > 100) return 'textarea';
  }
  return 'text';
}

module.exports = router;
