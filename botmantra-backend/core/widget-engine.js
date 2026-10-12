/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  WIDGET ENGINE — Full Widget JSON Template Structure        ║
 * ║  Every widget follows strict contract + maps to DB tables   ║
 * ║  DB: ui_template_widgets, dashboard_widgets, ui_schemas     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { v4: uuidv4 } = require('uuid');

// ─── WIDGET TYPE DEFINITIONS ─────────────────────────────────
const WIDGET_TYPES = {
  feed:     { label: 'Feed',     icon: 'list',         defaultSize: { w: 6, h: 4 } },
  tree:     { label: 'Tree',     icon: 'git-branch',   defaultSize: { w: 4, h: 6 } },
  table:    { label: 'Table',    icon: 'table',        defaultSize: { w: 8, h: 4 } },
  kanban:   { label: 'Kanban',   icon: 'columns',      defaultSize: { w: 12, h: 6 } },
  video:    { label: 'Video',    icon: 'play',         defaultSize: { w: 4, h: 3 } },
  form:     { label: 'Form',     icon: 'edit',         defaultSize: { w: 6, h: 5 } },
  card:     { label: 'Card',     icon: 'credit-card',  defaultSize: { w: 3, h: 3 } },
  chart:    { label: 'Chart',    icon: 'bar-chart',    defaultSize: { w: 6, h: 4 } },
  calendar: { label: 'Calendar', icon: 'calendar',     defaultSize: { w: 6, h: 5 } },
  chat:     { label: 'Chat',     icon: 'message-circle', defaultSize: { w: 4, h: 6 } },
  map:      { label: 'Map',      icon: 'map-pin',      defaultSize: { w: 6, h: 4 } },
  stats:    { label: 'Stats',    icon: 'trending-up',  defaultSize: { w: 3, h: 2 } }
};

// ─── MASTER WIDGET STRUCTURE ─────────────────────────────────
function createWidgetTemplate(config) {
  const widgetType = WIDGET_TYPES[config.widget_type];
  if (!widgetType) {
    throw new Error(`Invalid widget_type: ${config.widget_type}. Valid: ${Object.keys(WIDGET_TYPES).join(', ')}`);
  }

  return {
    widget_id: config.widget_id || uuidv4(),
    widget_type: config.widget_type,
    title: config.title || `${widgetType.label} Widget`,
    layout_position: {
      x: config.x ?? 0,
      y: config.y ?? 0,
      w: config.w ?? widgetType.defaultSize.w,
      h: config.h ?? widgetType.defaultSize.h
    },
    data_source: {
      node_type: config.node_type || null,
      filter_rules: config.filter_rules || {},
      sort_rules: config.sort_rules || { field: 'created_at', direction: 'desc' },
      limit: config.limit || 50
    },
    ui_schema: {
      title: config.title || widgetType.label,
      show_header: config.show_header !== false,
      display_fields: config.display_fields || [],
      actions: config.actions || [],
      icon: widgetType.icon,
      style: config.style || {}
    },
    permissions_required: config.permissions_required || [],
    event_bindings: {
      onClick: config.onClick || null,
      onSubmit: config.onSubmit || null,
      onLoad: config.onLoad || null,
      onRefresh: config.onRefresh || 'reload_data',
      onDelete: config.onDelete || null
    },
    brand_scope: config.brand_scope || null,
    version: config.version || 1
  };
}

// ─── PRESET WIDGET TEMPLATES ─────────────────────────────────
const WIDGET_PRESETS = {
  // Vanshawali
  family_tree: () => createWidgetTemplate({
    widget_type: 'tree', title: 'Family Tree',
    node_type: 'user_node', display_fields: ['name', 'age', 'relation'],
    actions: ['add_member', 'view_profile'], w: 8, h: 6,
    brand_scope: 'VANSHAWALI'
  }),
  family_feed: () => createWidgetTemplate({
    widget_type: 'feed', title: 'Family Updates',
    node_type: 'nonliving_node', filter_rules: { subtype: 'post' },
    display_fields: ['content', 'author', 'created_at'],
    actions: ['like', 'comment', 'share'], w: 6, h: 4,
    brand_scope: 'VANSHAWALI'
  }),

  // JeetMantra
  homework_board: () => createWidgetTemplate({
    widget_type: 'kanban', title: 'Homework Board',
    node_type: 'nonliving_node', filter_rules: { subtype: 'homework' },
    display_fields: ['name', 'due_date', 'status', 'subject'],
    actions: ['submit', 'view', 'mark_complete'], w: 12, h: 6,
    brand_scope: 'JEETMANTRA'
  }),
  course_list: () => createWidgetTemplate({
    widget_type: 'table', title: 'My Courses',
    node_type: 'nonliving_node', filter_rules: { subtype: 'course' },
    display_fields: ['name', 'progress', 'teacher', 'grade'],
    actions: ['open', 'view_details'], w: 8, h: 4,
    brand_scope: 'JEETMANTRA'
  }),

  // Mantravat
  task_kanban: () => createWidgetTemplate({
    widget_type: 'kanban', title: 'Task Board',
    node_type: 'nonliving_node', filter_rules: { subtype: 'task' },
    display_fields: ['name', 'assignee', 'priority', 'due_date'],
    actions: ['move', 'assign', 'complete'], w: 12, h: 6,
    brand_scope: 'MANTRAVAT'
  }),
  business_stats: () => createWidgetTemplate({
    widget_type: 'stats', title: 'Business KPIs',
    node_type: 'nonliving_node', filter_rules: { subtype: 'business' },
    display_fields: ['revenue', 'customers', 'orders', 'growth'],
    w: 12, h: 2, brand_scope: 'MANTRAVAT'
  }),

  // Junior
  video_gallery: () => createWidgetTemplate({
    widget_type: 'card', title: 'My Videos',
    node_type: 'nonliving_node', filter_rules: { subtype: 'video' },
    display_fields: ['name', 'thumbnail', 'duration'],
    actions: ['play', 'favorite'], w: 12, h: 4,
    brand_scope: 'JUNIOR'
  }),

  // Universal
  profile_card: () => createWidgetTemplate({
    widget_type: 'card', title: 'My Profile',
    node_type: 'user_node', display_fields: ['name', 'email', 'avatar_url'],
    actions: ['edit_profile'], w: 4, h: 3
  }),
  chat_widget: () => createWidgetTemplate({
    widget_type: 'chat', title: 'AI Assistant',
    actions: ['send_message', 'voice_input'],
    w: 4, h: 6
  }),
  notification_feed: () => createWidgetTemplate({
    widget_type: 'feed', title: 'Notifications',
    node_type: 'nonliving_node', filter_rules: { subtype: 'notification' },
    display_fields: ['message', 'type', 'time'],
    w: 4, h: 4
  })
};

// ─── BRAND DEFAULT LAYOUTS ───────────────────────────────────
function getBrandDefaultLayout(brandCode) {
  const layouts = {
    VANSHAWALI: {
      layout_type: 'grid',
      columns: 12,
      widgets: [
        WIDGET_PRESETS.family_tree(),
        { ...WIDGET_PRESETS.family_feed(), layout_position: { x: 8, y: 0, w: 4, h: 6 } },
        { ...WIDGET_PRESETS.profile_card(), layout_position: { x: 0, y: 6, w: 4, h: 3 } },
        { ...WIDGET_PRESETS.chat_widget(), layout_position: { x: 8, y: 6, w: 4, h: 6 } }
      ]
    },
    JEETMANTRA: {
      layout_type: 'grid',
      columns: 12,
      widgets: [
        WIDGET_PRESETS.homework_board(),
        { ...WIDGET_PRESETS.course_list(), layout_position: { x: 0, y: 6, w: 8, h: 4 } },
        { ...WIDGET_PRESETS.profile_card(), layout_position: { x: 8, y: 6, w: 4, h: 3 } },
        { ...WIDGET_PRESETS.chat_widget(), layout_position: { x: 8, y: 9, w: 4, h: 6 } }
      ]
    },
    MANTRAVAT: {
      layout_type: 'grid',
      columns: 12,
      widgets: [
        WIDGET_PRESETS.business_stats(),
        { ...WIDGET_PRESETS.task_kanban(), layout_position: { x: 0, y: 2, w: 12, h: 6 } },
        { ...WIDGET_PRESETS.chat_widget(), layout_position: { x: 8, y: 8, w: 4, h: 6 } }
      ]
    },
    JUNIOR: {
      layout_type: 'feed',
      columns: 12,
      widgets: [
        WIDGET_PRESETS.video_gallery(),
        { ...WIDGET_PRESETS.profile_card(), layout_position: { x: 0, y: 4, w: 4, h: 3 } },
        { ...WIDGET_PRESETS.chat_widget(), layout_position: { x: 8, y: 4, w: 4, h: 6 } }
      ]
    },
    BOTMANTRA: {
      layout_type: 'grid',
      columns: 12,
      widgets: [
        WIDGET_PRESETS.profile_card(),
        { ...WIDGET_PRESETS.notification_feed(), layout_position: { x: 4, y: 0, w: 4, h: 4 } },
        { ...WIDGET_PRESETS.chat_widget(), layout_position: { x: 8, y: 0, w: 4, h: 6 } }
      ]
    }
  };

  return layouts[brandCode] || layouts.BOTMANTRA;
}

// ─── WIDGET VALIDATOR ────────────────────────────────────────
function validateWidget(widgetJSON) {
  const errors = [];
  if (!widgetJSON.widget_type) errors.push('Missing widget_type');
  if (widgetJSON.widget_type && !WIDGET_TYPES[widgetJSON.widget_type]) {
    errors.push(`Invalid widget_type: ${widgetJSON.widget_type}`);
  }
  if (!widgetJSON.layout_position) errors.push('Missing layout_position');
  if (widgetJSON.layout_position) {
    const p = widgetJSON.layout_position;
    if (p.w < 1 || p.w > 12) errors.push('layout_position.w must be 1-12');
    if (p.h < 1 || p.h > 24) errors.push('layout_position.h must be 1-24');
    if (p.x < 0 || p.x > 11) errors.push('layout_position.x must be 0-11');
  }
  return { valid: errors.length === 0, errors };
}

// ─── DB PERSISTENCE HELPERS ──────────────────────────────────
/**
 * Save widget to ui_template_widgets table
 */
function widgetToDBRow(widget, templateId) {
  return {
    template_id: templateId,
    widget_type: widget.widget_type,
    title: widget.ui_schema?.title || widget.title,
    data_source_template: widget.data_source?.node_type || null,
    config: {
      layout_position: widget.layout_position,
      data_source: widget.data_source,
      ui_schema: widget.ui_schema,
      permissions_required: widget.permissions_required,
      event_bindings: widget.event_bindings,
      brand_scope: widget.brand_scope
    },
    position: widget.layout_position
  };
}

/**
 * Save layout to dashboard_layouts table
 */
function layoutToDBRow(layout, businessId, roleId) {
  return {
    business_id: businessId,
    role_id: roleId || null,
    layout_name: layout.layout_type + '_default',
    grid_json: {
      layout_type: layout.layout_type,
      columns: layout.columns,
      widgets: layout.widgets.map(w => ({
        widget_id: w.widget_id,
        widget_type: w.widget_type,
        position: w.layout_position,
        title: w.title || w.ui_schema?.title
      }))
    },
    is_default: true
  };
}

// ─── EXPORTS ─────────────────────────────────────────────────
module.exports = {
  WIDGET_TYPES,
  WIDGET_PRESETS,
  createWidgetTemplate,
  getBrandDefaultLayout,
  validateWidget,
  widgetToDBRow,
  layoutToDBRow
};
