/**
 * 🤖 Widget Configuration API
 * - Validates field mappings
 * - Suggests optimal layouts using AI
 * - Initializes NodeCore
 */

const express = require('express');
const router = express.Router();

// Mock AI Layout Suggestion Engine
const suggestLayout = (fields, widgetType) => {
  const fieldCount = fields.length;
  
  // Recommendation logic
  if (widgetType.startsWith('form')) {
    if (fieldCount <= 3) {
      return {
        type: 'single-column',
        columns: 1,
        recommendation: 'Simple form with one column for easy mobile view'
      };
    } else if (fieldCount <= 6) {
      return {
        type: 'two-column',
        columns: 2,
        recommendation: 'Two-column form for balanced desktop layout'
      };
    } else {
      return {
        type: 'three-column',
        columns: 3,
        recommendation: 'Three-column layout for data-dense forms'
      };
    }
  }
  
  if (widgetType.startsWith('table')) {
    if (fieldCount <= 4) {
      return {
        type: 'compact',
        columns: 1,
        recommendation: 'Compact table layout with horizontal scroll'
      };
    } else if (fieldCount <= 8) {
      return {
        type: 'standard',
        columns: 1,
        recommendation: 'Standard table with column visibility options'
      };
    } else {
      return {
        type: 'expandable',
        columns: 1,
        recommendation: 'Expandable rows for detailed data view'
      };
    }
  }
  
  return {
    type: 'default',
    columns: 1,
    recommendation: 'Default layout'
  };
};

// Alternative layout suggestions
const getAlternativeLayouts = (fieldCount, widgetType) => {
  const alternatives = [];
  
  if (widgetType.startsWith('form')) {
    if (fieldCount > 2) alternatives.push({ type: 'two-column', columns: 2 });
    if (fieldCount > 4) alternatives.push({ type: 'three-column', columns: 3 });
    alternatives.push({ type: 'single-column', columns: 1 });
  } else if (widgetType.startsWith('table')) {
    alternatives.push(
      { type: 'expanded', columns: 1 },
      { type: 'compact', columns: 1 }
    );
  }
  
  return alternatives.slice(0, 3);
};

// Validate field mappings
router.post('/validate-fields', (req, res) => {
  try {
    const { widgetType, fields, jsonData, fieldCount } = req.body;

    console.log('🔍 Validating fields:', {
      widgetType,
      fieldCount: fields.length,
      hasJSON: !!jsonData
    });

    // Validate field data
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.json({
        success: false,
        error: 'No fields provided'
      });
    }

    // Check for required properties
    const validFields = fields.every(f => f.name && f.type);
    if (!validFields) {
      return res.json({
        success: false,
        error: 'Some fields are missing name or type'
      });
    }

    // Suggest layout
    const suggestedLayout = suggestLayout(fields, widgetType);
    const layoutOptions = getAlternativeLayouts(fields.length, widgetType);

    console.log('✅ Fields validated:', {
      fieldCount: fields.length,
      suggestedLayout: suggestedLayout.type
    });

    res.json({
      success: true,
      message: `✅ ${fields.length} fields validated`,
      suggestedLayout,
      layoutOptions,
      fieldValidation: {
        totalFields: fields.length,
        types: [...new Set(fields.map(f => f.type))],
        requiresValidation: fields.some(f => f.required)
      }
    });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Initialize NodeCore for widget
router.post('/nodecore/initialize', (req, res) => {
  try {
    const {
      widgetType,
      widgetLabel,
      fields,
      layout,
      jsonData,
      timestamp
    } = req.body;

    console.log('🚀 Initializing NodeCore for:', {
      widgetType,
      widgetLabel,
      fieldCount: fields.length,
      layoutType: layout?.type
    });

    // Generate NodeCore configuration
    const nodeCoreConfig = {
      id: `nc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      widgetType,
      widgetLabel,
      createdAt: timestamp,
      fields: fields.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        required: f.required || false,
        validation: f.validation || 'none'
      })),
      layout: {
        type: layout?.type || 'default',
        columns: layout?.columns || 1,
        recommendation: layout?.recommendation
      },
      dataSource: jsonData ? 'external' : 'manual',
      status: 'active',
      features: {
        realtime: true,
        filtering: true,
        sorting: layout?.type?.includes('table'),
        validation: fields.some(f => f.required)
      }
    };

    // Simulate NodeCore operations
    console.log('📋 NodeCore config:', {
      id: nodeCoreConfig.id,
      features: nodeCoreConfig.features
    });

    // Store in memory (in production, save to database)
    global.nodeCoreConfigs = global.nodeCoreConfigs || {};
    global.nodeCoreConfigs[nodeCoreConfig.id] = nodeCoreConfig;

    res.json({
      success: true,
      message: '✅ NodeCore initialized successfully',
      nodeCoreId: nodeCoreConfig.id,
      config: nodeCoreConfig,
      operations: {
        initialized: true,
        realtime: true,
        dataSync: !!jsonData,
        validation: fields.some(f => f.required)
      }
    });

    console.log('✅ NodeCore initialized:', nodeCoreConfig.id);
  } catch (error) {
    console.error('❌ NodeCore initialization error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Get NodeCore config by ID
router.get('/nodecore/:id', (req, res) => {
  try {
    const { id } = req.params;
    const config = (global.nodeCoreConfigs || {})[id];

    if (!config) {
      return res.json({
        success: false,
        error: 'NodeCore configuration not found'
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
