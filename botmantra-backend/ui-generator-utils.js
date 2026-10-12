/**
 * UI Generator Utilities
 * 
 * Helper functions for:
 * - Widget generation from AI output
 * - Layout calculations
 * - Theme application
 * - Responsive design generation
 * - Permission mapping
 */

class UIGenerator {
  /**
   * Generate responsive widget grid from component list
   */
  static generateGridLayout(components, platform = 'web') {
    const gridSize = platform === 'mobile' ? 4 : 12;
    const widgets = [];
    let row = 0;
    let col = 0;

    components.forEach((component, idx) => {
      const widgetSize = this.getComponentWidth(component.type, gridSize);
      
      if (col + widgetSize > gridSize) {
        row += this.getComponentHeight(component.type);
        col = 0;
      }

      widgets.push({
        id: `widget_${idx}`,
        type: component.type,
        name: component.name || component.type,
        position: {
          x: col,
          y: row,
          w: widgetSize,
          h: this.getComponentHeight(component.type)
        },
        config: component.config || {}
      });

      col += widgetSize;
    });

    return widgets;
  }

  /**
   * Get default width for component type
   */
  static getComponentWidth(type, gridSize = 12) {
    const widths = {
      // Full width components
      'table': gridSize,
      'form': gridSize,
      'gallery': gridSize,
      'list': gridSize,
      'chat': gridSize / 2,
      
      // Half width
      'chart': gridSize / 2,
      'card': gridSize / 3,
      'metric': gridSize / 3,
      
      // Quarter width
      'kpi': gridSize / 4,
      'badge': gridSize / 6,
      'button': gridSize / 12,
      
      // Default
      'container': gridSize,
      'grid': gridSize,
      'stack': gridSize / 2
    };

    return widths[type] || gridSize / 3;
  }

  /**
   * Get default height for component type
   */
  static getComponentHeight(type) {
    const heights = {
      'kpi': 2,
      'badge': 1,
      'button': 1,
      'input': 1,
      'card': 3,
      'chart': 4,
      'table': 5,
      'form': 6,
      'gallery': 4,
      'list': 5,
      'chat': 6,
      'metric': 2
    };

    return heights[type] || 3;
  }

  /**
   * Generate responsive breakpoints for widget
   */
  static generateResponsiveLayout(widget, breakpoints = ['mobile', 'tablet', 'desktop']) {
    const responsive = {
      desktop: widget.position,
      tablet: {
        ...widget.position,
        w: Math.min(widget.position.w, 8),
        h: widget.position.h + 1
      },
      mobile: {
        ...widget.position,
        w: 4,
        h: widget.position.h + 2
      }
    };

    return responsive;
  }

  /**
   * Generate widget config with data binding
   */
  static generateWidgetConfig(widget, intent = {}) {
    const baseConfig = {
      title: widget.name || 'Widget',
      description: '',
      refresh_interval: 30000,
      cache_ttl: 300,
      showLoader: true,
      showRefresh: true,
      ...widget.config
    };

    // Add data source specifics
    if (widget.data_source === 'api') {
      baseConfig.endpoint = `/api/data/${widget.id}`;
      baseConfig.method = 'GET';
      baseConfig.auth_required = true;
    } else if (widget.data_source === 'supabase') {
      baseConfig.table = widget.config?.table || 'data';
      baseConfig.select = '*';
      baseConfig.limit = widget.config?.limit || 20;
    } else if (widget.data_source === 'kernel') {
      baseConfig.action = widget.config?.action || widget.id;
      baseConfig.platform = 'web';
    }

    // Add chart specifics
    if (widget.type === 'chart') {
      baseConfig.chartType = widget.config?.chartType || 'line';
      baseConfig.xAxis = widget.config?.xAxis || 'date';
      baseConfig.yAxis = widget.config?.yAxis || 'value';
      baseConfig.showLegend = true;
      baseConfig.showGrid = true;
    }

    // Add table specifics
    if (widget.type === 'table') {
      baseConfig.columns = widget.config?.columns || [];
      baseConfig.sortable = true;
      baseConfig.filterable = true;
      baseConfig.paginate = true;
      baseConfig.pageSize = widget.config?.limit || 20;
    }

    // Add form specifics
    if (widget.type === 'form') {
      baseConfig.fields = widget.config?.fields || [];
      baseConfig.submitButton = 'Submit';
      baseConfig.validation = true;
      baseConfig.onSubmit = `${widget.id}_submit`;
    }

    return baseConfig;
  }

  /**
   * Generate style object for widget
   */
  static generateWidgetStyle(widget, theme) {
    return {
      padding: theme.spacing?.md || '16px',
      borderRadius: theme.radius?.md || '8px',
      border: `1px solid ${theme.colors.border || '#e0e0e0'}`,
      backgroundColor: theme.colors.surface || '#ffffff',
      boxShadow: theme.shadows?.sm || '0 1px 2px rgba(0,0,0,0.1)',
      ...widget.style
    };
  }

  /**
   * Generate data source configuration
   */
  static generateDataSource(type, config = {}) {
    const sources = {
      api: {
        type: 'api',
        url: config.endpoint || '/api/data',
        method: config.method || 'GET',
        headers: {
          'Authorization': 'Bearer {{token}}',
          'Content-Type': 'application/json'
        },
        timeout: config.timeout || 30000,
        retry: config.retry || 3,
        cache: {
          enabled: true,
          ttl: config.cache_ttl || 300
        }
      },
      
      supabase: {
        type: 'supabase',
        table: config.table || 'data',
        select: config.select || '*',
        where: config.where || {},
        limit: config.limit || 20,
        offset: config.offset || 0,
        order: config.order || { column: 'created_at', ascending: false }
      },
      
      kernel: {
        type: 'kernel',
        action: config.action || 'get_data',
        platform: config.platform || 'web',
        cache: {
          enabled: true,
          ttl: 300
        }
      },
      
      firebase: {
        type: 'firebase',
        collection: config.collection || 'data',
        query: config.query || {},
        realtime: config.realtime || false
      },
      
      websocket: {
        type: 'websocket',
        url: config.url || 'ws://localhost:8080',
        event: config.event || 'data_update',
        reconnect: true
      },
      
      static: {
        type: 'static',
        data: config.data || []
      }
    };

    return sources[type] || sources.api;
  }

  /**
   * Generate event bindings for widget
   */
  static generateEventBindings(widget, intent = {}) {
    const events = [];

    // Button events
    if (widget.type === 'button') {
      events.push({
        event: 'click',
        action: widget.config?.action || `${widget.id}_click`,
        payload: widget.config?.payload || {}
      });
    }

    // Form events
    if (widget.type === 'form') {
      events.push({
        event: 'submit',
        action: `${widget.id}_submit`,
        payload: '{{formData}}'
      });
    }

    // Input events
    if (widget.type === 'input') {
      events.push({
        event: 'change',
        action: `${widget.id}_change`,
        debounce: 300
      });
    }

    // Row/Item selection events
    if (['table', 'list', 'gallery'].includes(widget.type)) {
      events.push({
        event: 'select',
        action: `${widget.id}_select`,
        payload: '{{selectedItem}}'
      });
    }

    // Chat events
    if (widget.type === 'chat') {
      events.push({
        event: 'message_sent',
        action: 'send_message',
        payload: '{{message}}'
      });
    }

    return events;
  }

  /**
   * Generate conditional render rules
   */
  static generateConditionalRenders(widget, intent = {}) {
    const conditions = [];

    // Hide/show based on user role
    if (intent.restrictToRole) {
      conditions.push({
        type: 'role',
        roles: intent.restrictToRole,
        action: 'show'
      });
    }

    // Hide/show based on data
    if (widget.config?.conditionalRender) {
      conditions.push(widget.config.conditionalRender);
    }

    return conditions;
  }

  /**
   * Generate permission map for widget
   */
  static generateWidgetPermissions(widget, intent = {}) {
    return {
      admin: {
        view: true,
        edit: true,
        configure: true,
        delete: true
      },
      owner: {
        view: true,
        edit: true,
        configure: true,
        delete: false
      },
      editor: {
        view: true,
        edit: widget.type !== 'table', // Tables read-only for editors
        configure: false,
        delete: false
      },
      viewer: {
        view: true,
        edit: false,
        configure: false,
        delete: false
      },
      guest: {
        view: intent.isPublic || false,
        edit: false,
        configure: false,
        delete: false
      }
    };
  }

  /**
   * Calculate widget dimensions for print
   */
  static calculatePrintLayout(widgets, pageSize = 'A4') {
    const pageDimensions = {
      'A4': { width: 210, height: 297 }, // mm
      'letter': { width: 215.9, height: 279.4 },
      'legal': { width: 215.9, height: 355.6 }
    };

    const page = pageDimensions[pageSize] || pageDimensions.A4;
    const margin = 10; // mm
    const contentWidth = page.width - (margin * 2);

    const widgetWidth = contentWidth / 3; // 3 columns
    const widgetHeight = (widgetWidth * 3) / 4; // aspect ratio

    return widgets.map(w => ({
      ...w,
      printWidth: widgetWidth,
      printHeight: widgetHeight,
      pageBreakAfter: (widgets.indexOf(w) + 1) % 3 === 0
    }));
  }

  /**
   * Optimize widget loading order (critical path)
   */
  static optimizeLoadingOrder(widgets) {
    const priority = {
      'kpi': 1,
      'metric': 1,
      'chart': 2,
      'table': 3,
      'gallery': 4,
      'chat': 5,
      'form': 2,
      'button': 1
    };

    return [...widgets].sort((a, b) => 
      (priority[a.type] || 10) - (priority[b.type] || 10)
    );
  }

  /**
   * Validate widget configuration
   */
  static validateWidget(widget) {
    const errors = [];

    if (!widget.id) errors.push('Widget must have id');
    if (!widget.type) errors.push('Widget must have type');
    if (!widget.position) errors.push('Widget must have position');
    
    if (widget.position) {
      if (widget.position.w < 1 || widget.position.w > 12) {
        errors.push('Widget width must be 1-12');
      }
      if (widget.position.h < 1) {
        errors.push('Widget height must be >= 1');
      }
    }

    if (widget.data_source && !['api', 'supabase', 'kernel', 'firebase', 'websocket', 'static'].includes(widget.data_source)) {
      errors.push('Invalid data_source');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Generate accessibility attributes
   */
  static generateA11yAttributes(widget) {
    return {
      role: this.getAriaRole(widget.type),
      ariaLabel: widget.name || widget.type,
      ariaDescribedBy: widget.config?.description ? `${widget.id}_desc` : null,
      tabIndex: widget.type === 'interactive' ? 0 : -1
    };
  }

  /**
   * Get ARIA role for widget type
   */
  static getAriaRole(widgetType) {
    const roles = {
      'button': 'button',
      'input': 'textbox',
      'table': 'table',
      'list': 'list',
      'form': 'form',
      'chart': 'img',
      'modal': 'dialog',
      'tabs': 'tablist',
      'carousel': 'region'
    };

    return roles[widgetType] || 'region';
  }
}

module.exports = UIGenerator;
