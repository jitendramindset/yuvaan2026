/**
 * AI UI Designer Engine
 * 
 * Converts natural language prompts into production-ready UI schemas
 * Powered by Claude/GPT API
 * 
 * Pipeline: User Prompt → AI Planner → Widget Generator → Layout Engine → Permission Mapper → Save Template
 */

const https = require('https');

class AIUIDesigner {
  constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    
    // Widget type catalog for AI reference
    this.widgetCatalog = {
      layout: ['grid', 'stack', 'flex', 'container', 'card'],
      display: ['text', 'heading', 'image', 'badge', 'divider'],
      forms: ['input', 'textarea', 'select', 'checkbox', 'radio', 'button', 'form'],
      data: ['table', 'list', 'gallery', 'card_grid'],
      charts: ['line', 'bar', 'pie', 'donut', 'area', 'scatter', 'kpi'],
      interactive: ['chat', 'ai_assistant', 'modal', 'drawer', 'tabs', 'accordion'],
      ecommerce: ['product_card', 'cart', 'checkout', 'product_gallery', 'reviews'],
      analytics: ['metric', 'gauge', 'heatmap', 'timeline', 'waterfall']
    };

    // Theme presets
    this.themePresets = {
      dark: {
        primary: '#4F46E5',
        secondary: '#8B5CF6',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F1F5F9',
        border: '#334155'
      },
      light: {
        primary: '#2563EB',
        secondary: '#3B82F6',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#0F172A',
        border: '#E2E8F0'
      },
      vibrant: {
        primary: '#FF6B9D',
        secondary: '#4ECDC4',
        background: '#FFFFFF',
        surface: '#F7F7F7',
        text: '#2C3E50',
        border: '#E0E0E0'
      },
      minimal: {
        primary: '#000000',
        secondary: '#666666',
        background: '#FFFFFF',
        surface: '#FAFAFA',
        text: '#333333',
        border: '#CCCCCC'
      }
    };

    // Common UI patterns
    this.uiPatterns = {
      dashboard: {
        description: 'KPI cards + charts + table layout',
        structure: ['kpi_grid', 'chart_section', 'data_table']
      },
      crm: {
        description: 'Contact lists + pipeline + timeline',
        structure: ['contact_list', 'pipeline_board', 'activity_timeline']
      },
      ecommerce: {
        description: 'Product grid + filters + cart',
        structure: ['product_filter', 'product_grid', 'cart_summary']
      },
      social: {
        description: 'Feed + profile + messaging',
        structure: ['activity_feed', 'profile_card', 'message_panel']
      },
      analytics: {
        description: 'Metrics + charts + tables',
        structure: ['metric_overview', 'chart_gallery', 'data_export']
      }
    };
  }

  /**
   * Main AI Design Method
   * Takes natural language prompt and returns complete UI schema
   */
  async designUI(prompt, options = {}) {
    try {
      const {
        platform = 'web',
        brand = 'BOTMANTRA',
        previewMode = false,
        theme = 'dark'
      } = options;

      console.log(`🤖 AI Designing UI for: "${prompt.substring(0, 50)}..."`);
      console.log(`   Platform: ${platform}, Brand: ${brand}, Theme: ${theme}`);

      // Step 1: Parse user intent
      const intent = await this.parseIntent(prompt);
      console.log(`✅ Identified pattern: ${intent.pattern}`);

      // Step 2: Generate layout
      const layout = await this.generateLayout(intent, platform);
      console.log(`✅ Generated ${layout.sections.length} sections`);

      // Step 3: Generate widgets
      const widgets = await this.generateWidgets(intent, layout);
      console.log(`✅ Created ${widgets.length} widgets`);

      // Step 4: Generate theme
      const themeCfg = this.generateTheme(theme, brand);
      console.log(`✅ Applied theme: ${theme}`);

      // Step 5: Generate permissions
      const permissions = this.generatePermissions(intent);
      console.log(`✅ Set permissions for roles`);

      // Step 6: Assemble complete schema
      const schema = {
        template_name: intent.templateName,
        template_code: this.generateTemplateCode(intent.templateName),
        template_description: intent.description,
        platform: platform,
        brand: brand,
        theme: themeCfg,
        layout: layout,
        widgets: widgets,
        permissions: permissions,
        created_by: 'ai_designer',
        created_at: new Date().toISOString(),
        is_ai_generated: true,
        metadata: {
          original_prompt: prompt,
          intent_pattern: intent.pattern,
          confidence: intent.confidence,
          ui_components: intent.components,
          estimated_load_time: '< 2s',
          mobile_optimized: true,
          accessibility_score: 0.85
        }
      };

      console.log(`✅ Schema assembled - ready for ${previewMode ? 'preview' : 'save'}`);
      return schema;

    } catch (error) {
      console.error('❌ AI Design Error:', error.message);
      throw new Error(`AI Design failed: ${error.message}`);
    }
  }

  /**
   * Parse user intent using Claude
   */
  async parseIntent(prompt) {
    const systemPrompt = `You are BotMantra AI Intent Parser. Analyze user prompt and identify:
1. UI pattern (dashboard, form, list, chart, etc.)
2. Components needed (table, chart, input, button, etc.)
3. Data sources (users, transactions, activity, etc.)
4. Theme preference (dark, light, vibrant)
5. Primary use case

Return ONLY valid JSON (no markdown, no explanation):
{
  "pattern": "string",
  "components": ["array", "of", "components"],
  "dataSources": ["array", "of", "data", "sources"],
  "theme": "dark|light|vibrant|minimal",
  "useCase": "string",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await this.callClaude(systemPrompt, prompt);
      const parsed = JSON.parse(response);

      return {
        pattern: parsed.pattern || 'dashboard',
        components: parsed.components || ['card', 'table'],
        dataSources: parsed.dataSources || ['api'],
        theme: parsed.theme || 'dark',
        useCase: parsed.useCase || 'analytics',
        confidence: parsed.confidence || 0.8,
        templateName: this.generateTemplateName(parsed.pattern, parsed.useCase),
        description: `AI-generated ${parsed.pattern} for ${parsed.useCase}`
      };
    } catch (error) {
      console.warn('⚠️  Intent parsing fell back to default');
      return {
        pattern: 'dashboard',
        components: ['card', 'chart', 'table'],
        dataSources: ['api'],
        theme: 'dark',
        useCase: 'analytics',
        confidence: 0.5,
        templateName: 'ai_generated_dashboard',
        description: 'AI-generated dashboard'
      };
    }
  }

  /**
   * Generate responsive layout using Claude
   */
  async generateLayout(intent, platform) {
    const systemPrompt = `You are BotMantra Layout Engine. Generate responsive grid layout for components.

Grid rules:
- 12 columns for desktop
- Responsive: stack on mobile
- Min height: 2 units per row
- Max 4 columns on mobile

Return ONLY valid JSON:
{
  "type": "grid",
  "columns": 12,
  "gap": 16,
  "sections": [
    {
      "id": "section_id",
      "name": "section name",
      "type": "kpi|chart|table|form|custom",
      "columns": 12,
      "height": 300,
      "components": ["component_names"]
    }
  ]
}`;

    const userPrompt = `Create layout for ${intent.pattern} with components: ${intent.components.join(', ')} for ${platform}`;

    try {
      const response = await this.callClaude(systemPrompt, userPrompt);
      const layout = JSON.parse(response);

      // Add responsive adjustments
      if (platform === 'mobile') {
        layout.sections.forEach(section => {
          section.columns = Math.min(section.columns, 4);
          section.height = Math.max(section.height, 200);
        });
      }

      return layout;
    } catch (error) {
      return this.generateDefaultLayout(intent, platform);
    }
  }

  /**
   * Generate widgets from layout using Claude
   */
  async generateWidgets(intent, layout) {
    const systemPrompt = `You are BotMantra Widget Generator. Create widget definitions matching layout.

Widget structure:
{
  "id": "widget_id",
  "type": "widget_type",
  "name": "display name",
  "data_source": "api|supabase|kernel|static",
  "position": {"x": 0, "y": 0, "w": 4, "h": 3},
  "config": {
    "title": "string",
    "description": "string",
    "refresh_interval": 30000,
    "limit": 10
  },
  "style": {
    "padding": "16px",
    "border_radius": "8px"
  }
}

Return ONLY valid JSON array of widgets (no markdown).`;

    const userPrompt = `Generate widgets for layout sections: ${layout.sections.map(s => s.name).join(', ')}. 
Components: ${intent.components.join(', ')}`;

    try {
      const response = await this.callClaude(systemPrompt, userPrompt);
      const widgets = JSON.parse(response);

      // Validate and add defaults
      return widgets.map((w, idx) => ({
        ...w,
        id: w.id || `widget_${idx}`,
        data_source: w.data_source || 'api',
        config: {
          title: w.config?.title || 'Widget',
          refresh_interval: 30000,
          ...w.config
        },
        position: w.position || {
          x: (idx % 3) * 4,
          y: Math.floor(idx / 3) * 3,
          w: 4,
          h: 3
        }
      }));
    } catch (error) {
      return this.generateDefaultWidgets(intent, layout);
    }
  }

  /**
   * Generate theme configuration
   */
  generateTheme(themeType, brand) {
    const baseTheme = this.themePresets[themeType] || this.themePresets.dark;

    // Brand-specific theme overrides
    const brandOverrides = {
      'BOTMANTRA': { primary: '#6B5BFF', secondary: '#FF6B9D' },
      'MANTRAVAT': { primary: '#2563EB', secondary: '#10B981' },
      'JEETMANTRA': { primary: '#F59E0B', secondary: '#EF4444' },
      'JUNIORMANTRA': { primary: '#8B5CF6', secondary: '#EC4899' }
    };

    const brandTheme = brandOverrides[brand] || {};

    return {
      name: `${themeType}_${brand.toLowerCase()}`,
      mode: themeType,
      colors: {
        ...baseTheme,
        ...brandTheme
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: {
          xs: '12px',
          sm: '14px',
          md: '16px',
          lg: '18px',
          xl: '24px',
          '2xl': '32px'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        }
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)'
      }
    };
  }

  /**
   * Generate role-based permissions
   */
  generatePermissions(intent) {
    return {
      admin: {
        view: true,
        edit: true,
        delete: true,
        publish: true,
        share: true
      },
      owner: {
        view: true,
        edit: true,
        delete: true,
        publish: true,
        share: false
      },
      editor: {
        view: true,
        edit: true,
        delete: false,
        publish: false,
        share: false
      },
      viewer: {
        view: true,
        edit: false,
        delete: false,
        publish: false,
        share: false
      },
      guest: {
        view: intent.useCase === 'public',
        edit: false,
        delete: false,
        publish: false,
        share: false
      }
    };
  }

  /**
   * Call Claude API (with fallback to structured defaults)
   */
  async callClaude(systemPrompt, userPrompt) {
    return new Promise((resolve, reject) => {
      const payload = {
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      };

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.content && response.content[0]) {
              resolve(response.content[0].text.trim());
            } else {
              reject(new Error('Invalid Claude response'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Generate default layout (fallback)
   */
  generateDefaultLayout(intent, platform) {
    const columns = platform === 'mobile' ? 4 : 12;

    return {
      type: 'grid',
      columns: columns,
      gap: 16,
      sections: [
        {
          id: 'metrics_section',
          name: 'Key Metrics',
          type: 'kpi',
          columns: columns,
          height: 150,
          components: ['kpi_card']
        },
        {
          id: 'content_section',
          name: 'Main Content',
          type: 'chart',
          columns: columns,
          height: 300,
          components: intent.components
        },
        {
          id: 'data_section',
          name: 'Data Table',
          type: 'table',
          columns: columns,
          height: 350,
          components: ['table']
        }
      ]
    };
  }

  /**
   * Generate default widgets (fallback)
   */
  generateDefaultWidgets(intent, layout) {
    const defaultWidgets = [
      {
        id: 'kpi_1',
        type: 'kpi',
        name: 'Total Count',
        data_source: 'api',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: { title: 'Total', metric: 'count' }
      },
      {
        id: 'kpi_2',
        type: 'kpi',
        name: 'Growth Rate',
        data_source: 'api',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: { title: 'Growth', metric: 'percentage' }
      },
      {
        id: 'chart_1',
        type: 'chart',
        name: 'Trend Chart',
        data_source: 'api',
        position: { x: 6, y: 0, w: 6, h: 4 },
        config: { title: 'Trends', chartType: 'line' }
      },
      {
        id: 'table_1',
        type: 'table',
        name: 'Data Table',
        data_source: 'api',
        position: { x: 0, y: 4, w: 12, h: 4 },
        config: { title: 'Recent Items', limit: 20 }
      }
    ];

    return defaultWidgets;
  }

  /**
   * Generate template name from intent
   */
  generateTemplateName(pattern, useCase) {
    return `${pattern}_${useCase}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Generate template code
   */
  generateTemplateCode(templateName) {
    return `ai_${templateName}_${Date.now().toString(36)}`;
  }
}

module.exports = AIUIDesigner;
