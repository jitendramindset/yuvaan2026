/**
 * AI UI Designer Kernel Action Handler
 * 
 * Integrates AI UI Designer with Kernel API
 * Supports actions:
 * - ai_ui_design
 * - ai_ui_preview  
 * - ai_ui_edit
 * - ai_ui_publish
 */

const AIUIDesigner = require('./ai-ui-designer');
const UIGenerator = require('./ui-generator-utils');

class AIUIDesignerKernel {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.designer = new AIUIDesigner(process.env.ANTHROPIC_API_KEY);
  }

  /**
   * Handle AI UI Designer kernel actions
   */
  async handleAction(action, payload) {
    try {
      switch (action) {
        case 'ai_ui_design':
          return await this.designUI(payload);
        
        case 'ai_ui_preview':
          return await this.previewUI(payload);
        
        case 'ai_ui_edit':
          return await this.editUI(payload);
        
        case 'ai_ui_publish':
          return await this.publishUI(payload);
        
        case 'ai_ui_get_templates':
          return await this.getTemplates(payload);
        
        case 'ai_ui_delete_template':
          return await this.deleteTemplate(payload);
        
        default:
          throw new Error(`Unknown AI UI Designer action: ${action}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Design new UI from natural language prompt
   */
  async designUI(payload) {
    const {
      prompt,
      platform = 'web',
      brand = 'BOTMANTRA',
      theme = 'dark',
      user_id,
      business_id,
      save_template = false,
      template_name
    } = payload;

    // Validation
    if (!prompt) throw new Error('Prompt is required');
    if (prompt.length > 1000) throw new Error('Prompt too long (max 1000 chars)');

    try {
      // Generate UI schema from prompt
      const schema = await this.designer.designUI(prompt, {
        platform,
        brand,
        theme,
        previewMode: !save_template
      });

      // Add widgets and positions if saving
      if (save_template && template_name) {
        const templateId = `tpl_ai_${Date.now().toString(36)}`;

        // Save template
        const { error: tplError } = await this.supabase
          .from('ui_templates')
          .insert({
            id: templateId,
            business_id: business_id || null,
            user_id: user_id || null,
            name: template_name,
            template_code: `ai_${template_name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
            template_type: 'dashboard',
            description: schema.metadata.original_prompt,
            schema_json: schema,
            is_ai_generated: true,
            is_active: true,
            is_default: false
          });

        if (tplError) throw tplError;

        // Save widgets
        await this.saveWidgetsFromSchema(templateId, schema);

        // Save layouts
        await this.saveLayoutsFromSchema(templateId, schema, user_id);

        return {
          success: true,
          message: 'UI designed and saved successfully',
          template_id: templateId,
          template_name: template_name,
          schema: schema,
          mode: 'saved',
          ready_to_publish: true
        };
      }

      // Return preview
      return {
        success: true,
        message: 'UI designed successfully (preview mode)',
        preview_id: schema.template_code,
        schema: schema,
        mode: 'preview',
        action_required: 'save_or_edit'
      };

    } catch (error) {
      throw new Error(`AI UI design failed: ${error.message}`);
    }
  }

  /**
   * Preview UI without saving
   */
  async previewUI(payload) {
    const { prompt, platform = 'web', brand = 'BOTMANTRA', theme = 'dark' } = payload;

    if (!prompt) throw new Error('Prompt is required');

    const schema = await this.designer.designUI(prompt, {
      platform,
      brand,
      theme,
      previewMode: true
    });

    return {
      success: true,
      preview_id: schema.template_code,
      schema: schema,
      can_save: true,
      can_edit: true,
      expires_in: 3600 // 1 hour
    };
  }

  /**
   * Edit existing AI-generated template
   */
  async editUI(payload) {
    const { template_id, edit_prompt, user_id } = payload;

    if (!template_id || !edit_prompt) {
      throw new Error('template_id and edit_prompt required');
    }

    // Load existing template
    const { data: template, error } = await this.supabase
      .from('ui_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (error || !template) {
      throw new Error('Template not found');
    }

    // Check authorization
    if (template.user_id !== user_id && template.user_id !== null) {
      throw new Error('Unauthorized to edit this template');
    }

    try {
      // Apply edit via AI
      const editSystemPrompt = `You are BotMantra AI UI Editor. Modify the schema based on user instruction.

Original schema structure: grid layout with ${template.schema_json.widgets?.length || 0} widgets.

Apply the edit instruction to the schema. Return complete modified schema as JSON only (no markdown).`;

      const response = await this.designer.callClaude(editSystemPrompt, edit_prompt);
      const modifiedSchema = JSON.parse(response);

      // Update template
      const { error: updateError } = await this.supabase
        .from('ui_templates')
        .update({
          schema_json: modifiedSchema,
          updated_at: new Date().toISOString()
        })
        .eq('id', template_id);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Template edited successfully',
        template_id: template_id,
        schema: modifiedSchema,
        updated_at: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`UI edit failed: ${error.message}`);
    }
  }

  /**
   * Publish AI-generated template
   */
  async publishUI(payload) {
    const { template_id, user_id, public_url, white_label_branding } = payload;

    if (!template_id) throw new Error('template_id required');

    // Load template
    const { data: template, error } = await this.supabase
      .from('ui_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (error || !template) throw new Error('Template not found');

    // Check authorization
    if (template.user_id !== user_id) {
      throw new Error('Unauthorized to publish this template');
    }

    try {
      // Publish template
      const { error: pubError } = await this.supabase
        .from('ui_templates')
        .update({
          is_active: true,
          is_default: false,
          published_at: new Date().toISOString(),
          public_url: public_url || null,
          white_label_config: white_label_branding || null
        })
        .eq('id', template_id);

      if (pubError) throw pubError;

      return {
        success: true,
        message: 'Template published successfully',
        template_id: template_id,
        public_url: public_url || null,
        accessible_at: `https://app.botmantra.ai/template/${template_id}`
      };

    } catch (error) {
      throw new Error(`Publish failed: ${error.message}`);
    }
  }

  /**
   * Get user's AI templates
   */
  async getTemplates(payload) {
    const { user_id, limit = 20, offset = 0 } = payload;

    if (!user_id) throw new Error('user_id required');

    const { data: templates, error } = await this.supabase
      .from('ui_templates')
      .select('id, name, template_code, created_at, is_active, is_default, description')
      .eq('user_id', user_id)
      .eq('is_ai_generated', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      templates: templates || [],
      count: (templates || []).length,
      total_available: await this.getTemplateCount(user_id)
    };
  }

  /**
   * Delete AI template
   */
  async deleteTemplate(payload) {
    const { template_id, user_id } = payload;

    if (!template_id || !user_id) {
      throw new Error('template_id and user_id required');
    }

    // Load template
    const { data: template, error } = await this.supabase
      .from('ui_templates')
      .select('user_id')
      .eq('id', template_id)
      .single();

    if (error) throw error;

    // Check ownership
    if (template.user_id !== user_id) {
      throw new Error('Unauthorized to delete this template');
    }

    try {
      // Delete template
      const { error: delError } = await this.supabase
        .from('ui_templates')
        .delete()
        .eq('id', template_id);

      if (delError) throw delError;

      // Delete associated widgets and layouts
      await this.supabase
        .from('dashboard_widgets')
        .delete()
        .eq('template_id', template_id);

      await this.supabase
        .from('ui_widget_layouts')
        .delete()
        .eq('template_id', template_id);

      return {
        success: true,
        message: 'Template deleted successfully',
        template_id: template_id
      };

    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Save widgets from AI-generated schema
   */
  async saveWidgetsFromSchema(templateId, schema) {
    const widgets = (schema.widgets || []).map((w, idx) => ({
      id: `w_${templateId}_${idx}`,
      template_id: templateId,
      business_id: null,
      widget_code: w.id || `widget_${idx}`,
      widget_name: w.name || w.type,
      widget_type: w.type,
      description: w.config?.title || w.name || '',
      data_source: w.data_source || 'api',
      config_json: w.config || {},
      is_active: true
    }));

    if (widgets.length > 0) {
      const { error } = await this.supabase
        .from('dashboard_widgets')
        .insert(widgets);
      
      if (error) throw error;
    }

    return widgets;
  }

  /**
   * Save layouts from AI-generated schema
   */
  async saveLayoutsFromSchema(templateId, schema, userId) {
    const layouts = (schema.widgets || []).map((w, idx) => ({
      id: `l_${templateId}_${idx}`,
      user_id: userId || null,
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
      const { error } = await this.supabase
        .from('ui_widget_layouts')
        .insert(layouts);
      
      if (error) throw error;
    }

    return layouts;
  }

  /**
   * Get total template count for user
   */
  async getTemplateCount(userId) {
    const { count, error } = await this.supabase
      .from('ui_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_ai_generated', true);

    return count || 0;
  }
}

module.exports = AIUIDesignerKernel;
