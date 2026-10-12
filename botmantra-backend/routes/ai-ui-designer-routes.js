/**
 * AI UI Designer Routes
 * 
 * Endpoints:
 * POST /api/ai-ui/design - Design new UI from prompt
 * POST /api/ai-ui/preview - Preview without saving
 * POST /api/ai-ui/edit - Edit existing AI-generated UI
 * POST /api/ai-ui/save - Save previewed UI as template
 * GET /api/ai-ui/history - Get user's AI design history
 * POST /api/ai-ui/components - Get available components
 */

const express = require('express');
const router = express.Router();
const AIUIDesigner = require('./ai-ui-designer');
const { authenticate, authorize } = require('./middleware/auth');

// Initialize AI Designer
const aiDesigner = new AIUIDesigner(process.env.ANTHROPIC_API_KEY);

/**
 * POST /api/ai-ui/design
 * Design a new UI from natural language prompt
 */
router.post('/design', authenticate, async (req, res) => {
  try {
    const { prompt, platform = 'web', brand, theme = 'dark', save = false } = req.body;

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt must be 1000 characters or less' 
      });
    }

    // Check usage limits
    const designCount = await checkAIDesignLimit(req.user.id);
    if (designCount >= 50 && !isAdmin(req.user)) {
      return res.status(429).json({ 
        success: false, 
        error: 'Daily AI design limit reached (50). Upgrade to premium.' 
      });
    }

    // Generate UI schema
    const schema = await aiDesigner.designUI(prompt, {
      platform,
      brand: brand || req.user.brand || 'BOTMANTRA',
      theme,
      previewMode: !save
    });

    // Save if requested
    if (save) {
      await saveAIGeneratedTemplate(schema, req.user.id, req.user.business_id);
      
      return res.status(201).json({
        success: true,
        message: 'UI designed and saved successfully',
        data: {
          template_id: schema.template_code,
          template_name: schema.template_name,
          schema: schema,
          ready_to_publish: true
        }
      });
    }

    // Return preview
    res.status(200).json({
      success: true,
      message: 'UI designed successfully (preview mode)',
      data: {
        template_id: schema.template_code,
        template_name: schema.template_name,
        schema: schema,
        preview_mode: true,
        action_required: 'save'
      }
    });

  } catch (error) {
    console.error('❌ AI Design Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'AI design failed',
      code: 'AI_DESIGN_ERROR'
    });
  }
});

/**
 * POST /api/ai-ui/preview
 * Preview UI without saving to database
 */
router.post('/preview', authenticate, async (req, res) => {
  try {
    const { prompt, platform = 'web', brand, theme = 'dark' } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt required' });
    }

    const schema = await aiDesigner.designUI(prompt, {
      platform,
      brand: brand || req.user.brand || 'BOTMANTRA',
      theme,
      previewMode: true
    });

    res.json({
      success: true,
      data: {
        preview_id: schema.template_code,
        schema: schema,
        can_save: true,
        can_edit: true
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Preview generation failed' 
    });
  }
});

/**
 * POST /api/ai-ui/edit
 * Edit existing AI-generated UI with new instructions
 */
router.post('/edit', authenticate, async (req, res) => {
  try {
    const { template_id, edit_prompt, action } = req.body;

    if (!template_id || !edit_prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'template_id and edit_prompt required' 
      });
    }

    // Load existing template
    const { data: template, error } = await supabase
      .from('ui_templates')
      .select('*')
      .eq('template_code', template_id)
      .single();

    if (error || !template) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }

    // Check ownership
    if (template.created_by !== req.user.id && !isAdmin(req.user)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to edit this template' 
      });
    }

    // Generate modified schema
    const editSystemPrompt = `You are BotMantra AI UI Editor. User wants to modify existing UI.

Original template: ${JSON.stringify(template.schema_json, null, 2)}

Apply the edit instruction to the schema. Return complete modified schema as JSON only.`;

    // Apply edit via Claude
    const response = await aiDesigner.callClaude(editSystemPrompt, edit_prompt);
    const modifiedSchema = JSON.parse(response);

    // Save updated template
    const { error: updateError } = await supabase
      .from('ui_templates')
      .update({
        schema_json: modifiedSchema,
        updated_at: new Date().toISOString()
      })
      .eq('id', template.id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: {
        template_id: template.id,
        schema: modifiedSchema,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Template edit failed' 
    });
  }
});

/**
 * POST /api/ai-ui/save
 * Save previewed UI as permanent template
 */
router.post('/save', authenticate, async (req, res) => {
  try {
    const { preview_id, template_name, description } = req.body;

    if (!preview_id || !template_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'preview_id and template_name required' 
      });
    }

    // Load preview schema (from session or cache)
    const previewSchema = await getPreviewSchema(preview_id, req.user.id);
    if (!previewSchema) {
      return res.status(404).json({ 
        success: false, 
        error: 'Preview session expired' 
      });
    }

    // Create permanent template
    const templateId = `tpl_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase
      .from('ui_templates')
      .insert({
        id: templateId,
        business_id: req.user.business_id,
        user_id: req.user.id,
        name: template_name,
        template_code: `ai_${template_name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
        template_type: 'dashboard',
        description: description || previewSchema.metadata.original_prompt,
        schema_json: previewSchema,
        is_ai_generated: true,
        is_default: false,
        is_active: true
      });

    if (error) throw error;

    // Save widgets and layouts from schema
    await saveWidgetsFromSchema(templateId, previewSchema, req.user.id);
    await saveLayoutsFromSchema(templateId, previewSchema, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Template saved successfully',
      data: {
        template_id: templateId,
        template_name: template_name,
        ready_to_use: true,
        can_publish: true
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save template' 
    });
  }
});

/**
 * GET /api/ai-ui/history
 * Get user's AI design history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: templates, error } = await supabase
      .from('ui_templates')
      .select('id, name, template_code, is_ai_generated, created_at, description')
      .eq('user_id', req.user.id)
      .eq('is_ai_generated', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        templates: templates || [],
        count: (templates || []).length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch history' 
    });
  }
});

/**
 * GET /api/ai-ui/components
 * Get available widget components for AI reference
 */
router.get('/components', authenticate, async (req, res) => {
  try {
    const components = {
      layouts: ['grid', 'stack', 'flex', 'container', 'card'],
      display: ['text', 'heading', 'image', 'badge', 'divider'],
      forms: ['input', 'textarea', 'select', 'checkbox', 'radio', 'button', 'form'],
      data: ['table', 'list', 'gallery', 'card_grid'],
      charts: ['line', 'bar', 'pie', 'donut', 'area', 'scatter', 'kpi'],
      interactive: ['chat', 'ai_assistant', 'modal', 'drawer', 'tabs', 'accordion'],
      ecommerce: ['product_card', 'cart', 'checkout', 'product_gallery'],
      analytics: ['metric', 'gauge', 'heatmap', 'timeline', 'waterfall']
    };

    res.json({
      success: true,
      data: {
        components: components,
        total_types: Object.values(components).flat().length
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch components' 
    });
  }
});

/**
 * Helper Functions
 */

async function checkAIDesignLimit(userId) {
  // Check today's design count
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('ui_templates')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_ai_generated', true)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  return data?.length || 0;
}

async function saveAIGeneratedTemplate(schema, userId, businessId) {
  const templateId = `tpl_${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from('ui_templates')
    .insert({
      id: templateId,
      business_id: businessId,
      user_id: userId,
      name: schema.template_name,
      template_code: schema.template_code,
      template_type: 'dashboard',
      description: schema.template_description,
      schema_json: schema,
      is_ai_generated: true,
      is_active: true
    });

  if (error) throw error;

  await saveWidgetsFromSchema(templateId, schema, userId);
  await saveLayoutsFromSchema(templateId, schema, userId);

  return templateId;
}

async function saveWidgetsFromSchema(templateId, schema, userId) {
  const widgets = (schema.widgets || []).map((w, idx) => ({
    id: `w_${templateId}_${idx}`,
    business_id: null,
    widget_code: w.id || `widget_${idx}`,
    widget_name: w.name || w.type,
    widget_type: w.type,
    description: w.config?.title || '',
    data_source: w.data_source || 'api',
    config_json: w.config || {},
    is_active: true
  }));

  if (widgets.length > 0) {
    const { error } = await supabase
      .from('dashboard_widgets')
      .insert(widgets);
    
    if (error) console.error('Widget save error:', error);
  }
}

async function saveLayoutsFromSchema(templateId, schema, userId) {
  const layouts = (schema.widgets || []).map((w, idx) => ({
    id: `l_${templateId}_${idx}`,
    user_id: userId,
    business_id: null,
    template_id: templateId,
    widget_id: `w_${templateId}_${idx}`,
    x: w.position?.x || (idx % 3) * 4,
    y: w.position?.y || Math.floor(idx / 3) * 3,
    w: w.position?.w || 4,
    h: w.position?.h || 3,
    hidden: false
  }));

  if (layouts.length > 0) {
    const { error } = await supabase
      .from('ui_widget_layouts')
      .insert(layouts);
    
    if (error) console.error('Layout save error:', error);
  }
}

async function getPreviewSchema(previewId, userId) {
  // In production, store previews in Redis or temporary table
  // For now, returning null - implement caching layer
  return null;
}

function isAdmin(user) {
  return user.role === 'admin' || user.role === 'super_admin';
}

module.exports = router;
