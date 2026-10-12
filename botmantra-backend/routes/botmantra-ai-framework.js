/**
 * ═══════════════════════════════════════════════════════════════
 * BOTMANTRA AI FRAMEWORK - CHAT API
 * ═══════════════════════════════════════════════════════════════
 * 
 * Purpose: UI Building, Adjustment, Property Management
 * Features:
 * - Convert data/queries to UI components
 * - Retrieve modules, tables, and fields from backend
 * - Dynamic field creation via registry model
 * - UI framework generation for business/personal use
 * - Preview, validate, and adjust UI
 * - Editable mode with save/preview options
 * 
 * Auth: NO LOGIN REQUIRED (Public AI Framework)
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const { dbSchema } = require('../config/supabase');
const router = express.Router();

/**
 * ═══════════════════════════════════════════════════════════════
 * REGISTRY MODEL - Dynamic Field Creation
 * ═══════════════════════════════════════════════════════════════
 */
const FIELD_REGISTRY = {
  // Core field types
  text: { type: 'text', validation: 'string', widget: 'input' },
  number: { type: 'number', validation: 'numeric', widget: 'input' },
  email: { type: 'email', validation: 'email', widget: 'input' },
  phone: { type: 'phone', validation: 'phone', widget: 'input' },
  date: { type: 'date', validation: 'date', widget: 'datepicker' },
  boolean: { type: 'boolean', validation: 'boolean', widget: 'toggle' },
  select: { type: 'select', validation: 'enum', widget: 'dropdown' },
  multiselect: { type: 'array', validation: 'array', widget: 'multiselect' },
  image: { type: 'file', validation: 'url', widget: 'upload' },
  richtext: { type: 'text', validation: 'html', widget: 'editor' },
  json: { type: 'json', validation: 'json', widget: 'jsoneditor' },
  relation: { type: 'reference', validation: 'id', widget: 'relation' },
};

/**
 * ═══════════════════════════════════════════════════════════════
 * AI FIELD MAPPER - Intelligent Field Detection
 * ═══════════════════════════════════════════════════════════════
 */
function mapFieldsIntelligently(inputFields, tableSchema) {
  const mappedFields = [];
  const similarityThreshold = 0.6;

  for (const inputField of inputFields) {
    const fieldName = inputField.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    // Try exact match first
    if (tableSchema[fieldName]) {
      bestMatch = { name: fieldName, ...tableSchema[fieldName], confidence: 1.0 };
    } else {
      // Try fuzzy matching
      for (const [schemaField, schemaConfig] of Object.entries(tableSchema)) {
        const score = calculateSimilarity(fieldName, schemaField.toLowerCase());
        if (score > bestScore && score >= similarityThreshold) {
          bestScore = score;
          bestMatch = { 
            name: schemaField, 
            ...schemaConfig, 
            confidence: score,
            originalInput: inputField 
          };
        }
      }
    }

    // If no match, create new field based on registry
    if (!bestMatch) {
      const detectedType = detectFieldType(inputField);
      bestMatch = {
        name: inputField,
        ...FIELD_REGISTRY[detectedType],
        isNew: true,
        confidence: 0.8,
        suggestedCreation: true
      };
    }

    mappedFields.push(bestMatch);
  }

  return mappedFields;
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - (matrix[len1][len2] / maxLen);
}

/**
 * Detect field type from field name
 */
function detectFieldType(fieldName) {
  const lower = fieldName.toLowerCase();
  
  if (lower.includes('email')) return 'email';
  if (lower.includes('phone') || lower.includes('mobile')) return 'phone';
  if (lower.includes('date') || lower.includes('time')) return 'date';
  if (lower.includes('price') || lower.includes('amount') || lower.includes('cost')) return 'number';
  if (lower.includes('active') || lower.includes('enabled') || lower.includes('is_')) return 'boolean';
  if (lower.includes('image') || lower.includes('photo') || lower.includes('avatar')) return 'image';
  if (lower.includes('description') || lower.includes('bio') || lower.includes('content')) return 'richtext';
  if (lower.includes('tags') || lower.includes('categories')) return 'multiselect';
  if (lower.includes('status') || lower.includes('type') || lower.includes('category')) return 'select';
  
  return 'text';
}

/**
 * ═══════════════════════════════════════════════════════════════
 * UI FRAMEWORK GENERATOR - AI-Powered Layout Builder
 * ═══════════════════════════════════════════════════════════════
 */
async function generateUIFramework(data, context, supabase) {
  const { 
    dataType, // 'table', 'json', 'query'
    businessType, // 'ecommerce', 'crm', 'dashboard', 'personal'
    preferredLayout, // 'grid', 'list', 'card', 'form'
    tableData = null,
    jsonData = null,
    queryText = null
  } = data;

  let fields = [];
  let tableSchema = {};

  // Step 1: Extract fields from input
  if (dataType === 'table' && tableData?.tableName) {
    const tableName = tableData.tableName;
    const schemaString = dbSchema?.[tableName];

    if (schemaString) {
      fields = schemaString
        .split(',')
        .map(field => field.trim())
        .filter(Boolean);

      fields.forEach(field => {
        tableSchema[field] = {
          type: detectFieldType(field),
          widget: detectFieldType(field)
        };
      });
    } else {
      const { data: sampleRows } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleRows && sampleRows[0]) {
        fields = Object.keys(sampleRows[0]);
        fields.forEach(field => {
          tableSchema[field] = {
            type: typeof sampleRows[0][field],
            widget: detectFieldType(field)
          };
        });
      }
    }
  } else if (dataType === 'json' && jsonData) {
    fields = Object.keys(jsonData[0] || jsonData);
    fields.forEach(field => {
      tableSchema[field] = {
        type: typeof jsonData[0]?.[field] || 'text',
        widget: detectFieldType(field)
      };
    });
  } else if (dataType === 'query' && queryText) {
    // AI Parse query to extract intent and fields
    const parsed = parseQueryForFields(queryText);
    fields = parsed.fields || parsed;
    
    // Store widget type for component generation
    if (parsed.widgetType) {
      context.widgetType = parsed.widgetType;
    }
  }

  // Step 2: Map fields intelligently
  const mappedFields = mapFieldsIntelligently(fields, tableSchema);

  // Step 3: Generate UI components based on business type and widget type
  const uiComponents = generateComponents(
    mappedFields, 
    businessType, 
    preferredLayout, 
    context.widgetType || 'form'
  );

  // Step 4: Return framework structure
  return {
    success: true,
    framework: {
      fields: mappedFields,
      components: uiComponents,
      layout: suggestLayout(mappedFields.length, businessType),
      theme: suggestTheme(businessType),
      editableMode: true,
      preview: true
    },
    metadata: {
      totalFields: mappedFields.length,
      newFieldsCreated: mappedFields.filter(f => f.isNew).length,
      confidence: calculateAverageConfidence(mappedFields),
      timestamp: new Date()
    }
  };
}

/**
 * Parse natural language query to extract fields and widget type
 */
function parseQueryForFields(query) {
  const lower = query.toLowerCase();
  let fields = [];
  let widgetType = 'form'; // default
  
  // Detect profile-related queries
  if (lower.includes('profile') || lower.includes('instagram') || lower.includes('facebook') || lower.includes('linkedin')) {
    widgetType = 'profile';
    
    if (lower.includes('instagram')) {
      fields = ['avatar', 'username', 'full_name', 'bio', 'website', 'posts_count', 'followers', 'following'];
    } else if (lower.includes('facebook')) {
      fields = ['cover_photo', 'profile_photo', 'name', 'bio', 'work', 'education', 'location', 'friends'];
    } else if (lower.includes('linkedin')) {
      fields = ['profile_photo', 'name', 'headline', 'company', 'location', 'connections', 'about'];
    } else {
      fields = ['avatar', 'name', 'email', 'bio', 'location', 'phone'];
    }
    return { fields, widgetType };
  }
  
  // Detect dashboard queries
  if (lower.includes('dashboard') || lower.includes('stats') || lower.includes('analytics') || lower.includes('metrics')) {
    widgetType = 'dashboard';
    fields = ['total_users', 'revenue', 'orders', 'conversion_rate'];
    return { fields, widgetType };
  }
  
  // Detect table queries
  if (lower.includes('table') || lower.includes('list') || lower.includes('data')) {
    widgetType = 'table';
    fields = ['id', 'name', 'email', 'status', 'created_at'];
    return { fields, widgetType };
  }
  
  // Detect chart queries
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('visualization')) {
    widgetType = 'chart';
    fields = ['label', 'value'];
    return { fields, widgetType };
  }
  
  // Default keyword extraction
  const keywords = ['name', 'email', 'phone', 'address', 'date', 'amount', 'description', 
                   'title', 'message', 'avatar', 'bio', 'username', 'password', 'status'];
  const found = [];
  
  keywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      found.push(keyword);
    }
  });
  
  fields = found.length > 0 ? found : ['name', 'description', 'date'];
  return { fields, widgetType };
}

/**
 * Generate UI components from mapped fields
 */
function generateComponents(fields, businessType, layout, widgetType = 'form') {
  const components = [];

  // Handle profile widget specially
  if (widgetType === 'profile') {
    components.push({
      id: `profile_${Date.now()}`,
      type: 'profile',
      title: 'User Profile',
      name: 'User Name',
      role: 'Member',
      bio: 'Profile bio here...',
      fields: fields.map((field, idx) => ({
        id: idx,
        name: field.name || field,
        type: field.type || detectFieldType(field.name || field),
        label: formatLabel(field.name || field)
      })),
      stats: {
        posts: 0,
        followers: 0,
        following: 0
      }
    });
    return components;
  }
  
  // Handle dashboard widget
  if (widgetType === 'dashboard') {
    fields.forEach((field, index) => {
      components.push({
        id: `stat_${index}`,
        type: 'stats',
        label: formatLabel(field.name || field),
        value: Math.floor(Math.random() * 1000).toLocaleString(),
        trend: index % 2 === 0 ? 'up' : 'down'
      });
    });
    return components;
  }
  
  // Handle table widget
  if (widgetType === 'table') {
    components.push({
      id: `table_${Date.now()}`,
      type: 'table',
      title: 'Data Table',
      columns: fields.map(f => formatLabel(f.name || f))
    });
    return components;
  }
  
  // Handle chart widget
  if (widgetType === 'chart') {
    components.push({
      id: `chart_${Date.now()}`,
      type: 'chart',
      title: 'Data Chart',
      chartType: 'Bar',
      data: fields.map(f => ({
        label: formatLabel(f.name || f),
        value: Math.floor(Math.random() * 100)
      }))
    });
    return components;
  }

  // Default: create form components
  fields.forEach((field, index) => {
    components.push({
      id: `component_${index}`,
      fieldName: field.name || field,
      widget: field.widget || detectFieldType(field.name || field),
      type: field.type || 'input',
      label: formatLabel(field.name || field),
      placeholder: `Enter ${formatLabel(field.name || field)}`,
      validation: field.validation,
      required: index < 3, // First 3 fields are required
      editable: true,
      position: { row: Math.floor(index / 2), col: index % 2 }
    });
  });

  return components;
}

/**
 * Suggest layout based on field count
 */
function suggestLayout(fieldCount, businessType) {
  if (businessType === 'dashboard') {
    return { type: 'grid', columns: 3, responsive: true };
  }
  if (businessType === 'form' || fieldCount <= 5) {
    return { type: 'vertical', columns: 1, responsive: true };
  }
  if (fieldCount > 10) {
    return { type: 'grid', columns: 2, responsive: true };
  }
  return { type: 'card', columns: 2, responsive: true };
}

/**
 * Suggest theme based on business type
 */
function suggestTheme(businessType) {
  const themes = {
    ecommerce: { primary: '#4F46E5', accent: '#10B981', style: 'modern' },
    crm: { primary: '#3B82F6', accent: '#8B5CF6', style: 'professional' },
    dashboard: { primary: '#0F172A', accent: '#06B6D4', style: 'minimal' },
    personal: { primary: '#EC4899', accent: '#F59E0B', style: 'friendly' }
  };
  return themes[businessType] || themes.personal;
}

/**
 * Format field name to label
 */
function formatLabel(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Calculate average confidence
 */
function calculateAverageConfidence(fields) {
  const total = fields.reduce((sum, f) => sum + (f.confidence || 0), 0);
  return (total / fields.length).toFixed(2);
}

/**
 * Generate context-aware suggestions based on component types
 */
function generateSuggestions(componentTypes, metadata) {
  const suggestions = [];
  
  // Profile suggestions
  if (componentTypes.includes('profile')) {
    suggestions.push('Customize your profile layout');
    suggestions.push('Add social media links');
    suggestions.push('Connect to database for live data');
  }
  
  // Suggest complementary widgets based on what was created
  if (componentTypes.includes('stats') || componentTypes.includes('stat')) {
    suggestions.push('Add a chart to visualize these metrics');
    suggestions.push('Create a table with detailed breakdown');
  }
  if (componentTypes.includes('chart') || componentTypes.includes('analytics')) {
    suggestions.push('Add stat cards for key numbers');
    suggestions.push('Include a date range filter');
  }
  if (componentTypes.includes('table') || componentTypes.includes('grid')) {
    suggestions.push('Add filters above the table');
    suggestions.push('Include export to CSV button');
  }
  if (componentTypes.includes('card') || componentTypes.includes('cards')) {
    suggestions.push('Add a grid layout for more cards');
    suggestions.push('Include a search bar');
  }
  if (componentTypes.includes('form') || componentTypes.includes('input')) {
    suggestions.push('Add form validation rules');
    suggestions.push('Include a styled submit button');
  }
  
  // Always include these helpful options
  if (suggestions.length === 0) {
    suggestions.push('Create a user profile like Instagram');
    suggestions.push('Use Widget Wizard for step-by-step creation');
    suggestions.push('Connect to your database tables');
  }
  suggestions.push('Save this dashboard');
  suggestions.push('Preview on mobile');
  
  // Return top 4 suggestions
  return suggestions.slice(0, 4);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * API ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * POST /api/botmantra-ai/chat
 * Main chat endpoint for UI building
 */
router.post('/chat', async (req, res) => {
  try {
    const { 
      message, 
      dataExample, 
      query, 
      context = {} 
    } = req.body;

    const supabase = req.supabase;

    // Determine input type
    let dataType = 'query';
    let inputData = {};

    if (dataExample) {
      if (Array.isArray(dataExample)) {
        dataType = 'json';
        inputData = { jsonData: dataExample };
      } else if (dataExample.tableName) {
        dataType = 'table';
        inputData = { tableData: dataExample };
      }
    }

    // Generate UI Framework
    const framework = await generateUIFramework({
      dataType,
      businessType: context.businessType || 'personal',
      preferredLayout: context.layout || 'auto',
      queryText: query || message,
      ...inputData
    }, context, supabase);

    // Log the request
    await supabase.from('api_logs').insert({
      endpoint: '/api/botmantra-ai/chat',
      request_data: { message, dataExample, query },
      response_data: framework,
      timestamp: new Date()
    });

    // Generate intelligent response message with suggestions
    const componentTypes = (framework.framework?.components || []).map(c => c.type).filter(Boolean);
    const uniqueTypes = [...new Set(componentTypes)];
    
    let responseMessage = '';
    let suggestions = [];
    
    if (framework.success) {
      responseMessage = `✅ UI Framework generated successfully!\n\n`;
      responseMessage += `**Created ${componentTypes.length} component(s):**\n`;
      uniqueTypes.forEach(type => {
        const count = componentTypes.filter(t => t === type).length;
        responseMessage += `• ${count}x ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
      });
      
      // Generate context-aware suggestions
      suggestions = generateSuggestions(uniqueTypes, framework.metadata);
      
      responseMessage += `\n**What's next?**\n`;
      suggestions.forEach((s, i) => {
        responseMessage += `${i + 1}. ${s}\n`;
      });
    } else {
      responseMessage = 'Failed to generate UI framework. Try being more specific about what you want to build.';
      suggestions = [
        'Create a dashboard with stats',
        'Build a data table',
        'Add analytics charts',
        'Create a contact form'
      ];
    }

    res.json({
      ...framework,
      message: responseMessage,
      response: responseMessage,
      suggestions
    });

  } catch (error) {
    console.error('❌ BotMantra AI Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: {
        message: 'AI framework generation failed. Using basic form layout.',
        components: [
          { type: 'input', label: 'Name', required: true },
          { type: 'input', label: 'Email', required: true },
          { type: 'textarea', label: 'Description', required: false }
        ]
      }
    });
  }
});

/**
 * POST /api/botmantra-ai/validate-ui
 * Validate and adjust UI configuration
 */
router.post('/validate-ui', async (req, res) => {
  try {
    const { components, layout } = req.body;

    // Validate components
    const validatedComponents = components.map(comp => ({
      ...comp,
      isValid: !!comp.fieldName && !!comp.widget,
      suggestions: comp.isValid ? [] : ['Field name and widget type are required']
    }));

    res.json({
      success: true,
      validated: validatedComponents,
      layoutValid: !!layout && !!layout.type,
      recommendations: generateRecommendations(validatedComponents)
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/botmantra-ai/save-ui
 * Save UI configuration (no auth required)
 */
router.post('/save-ui', async (req, res) => {
  try {
    const { framework, metadata } = req.body;
    const supabase = req.supabase;

    // Generate unique UI ID
    const uiId = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save to database
    const { data, error } = await supabase.from('ui_templates').insert({
      id: uiId,
      template_code: uiId,
      template_name: metadata?.name || 'Untitled UI',
      layout: framework,
      created_at: new Date()
    });

    if (error) throw error;

    res.json({
      success: true,
      uiId,
      message: 'UI saved successfully',
      previewUrl: `/preview/${uiId}`
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/botmantra-ai/tables
 * Get available tables and their schemas
 */
router.get('/tables', async (req, res) => {
  try {
    const supabase = req.supabase;
    const tables = Object.keys(dbSchema || {});

    const schemasPromises = tables.map(async (table) => {
      const schemaString = dbSchema?.[table] || '';
      let columns = schemaString.split(',').map(field => field.trim()).filter(Boolean);

      if (!columns.length) {
        const { data } = await supabase.from(table).select('*').limit(1);
        columns = data && data[0] ? Object.keys(data[0]) : [];
      }

      return { name: table, columns };
    });

    const schemas = await Promise.all(schemasPromises);

    // Add some default tables if none exist
    let finalTables = schemas;
    if (schemas.length === 0) {
      finalTables = [
        { name: 'users', columns: ['id', 'name', 'email', 'avatar', 'role', 'created_at'] },
        { name: 'posts', columns: ['id', 'title', 'content', 'author_id', 'created_at'] },
        { name: 'products', columns: ['id', 'name', 'price', 'description', 'image'] },
        { name: 'orders', columns: ['id', 'user_id', 'total', 'status', 'created_at'] },
        { name: 'profiles', columns: ['id', 'user_id', 'username', 'bio', 'avatar', 'followers', 'following'] },
      ];
    }

    res.json({
      success: true,
      tables: finalTables
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/table/:tableName
 * Get data from a specific table for testing
 */
router.get('/table/:tableName', async (req, res) => {
  try {
    const supabase = req.supabase;
    const { tableName } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message, data: [] });
  }
});

/**
 * Generate recommendations for UI improvements
 */
function generateRecommendations(components) {
  const recommendations = [];

  if (components.length > 10) {
    recommendations.push('Consider using tabs or sections to organize fields');
  }

  const hasRequired = components.some(c => c.required);
  if (!hasRequired) {
    recommendations.push('Add at least one required field for validation');
  }

  return recommendations;
}

module.exports = router;
