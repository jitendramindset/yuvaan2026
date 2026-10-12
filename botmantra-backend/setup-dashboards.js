/**
 * Dashboard Setup Migration - Direct Approach
 * Creates brand-specific templates, widgets, and layouts
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars: SUPABASE_URL, SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDashboards() {
  console.log('🚀 Starting dashboard setup...\n');

  // STEP 1: Create dashboard templates
  console.log('📝 Creating dashboard templates...');
  
  const templates = [
    {
      id: 'a1000000-0000-0000-0000-000000000001',
      business_id: null,
      name: 'BotMantra AI Dashboard',
      template_code: 'ai_dashboard',
      template_type: 'dashboard',
      description: 'AI-powered dashboard for BotMantra brand',
      schema_json: {
        brand: 'BOTMANTRA',
        layout: 'grid',
        cols: 12,
        theme: { primary: '#6B5BFF', secondary: '#FF6B9D' },
        sections: [
          { type: 'kpi', layout: 'grid', cols: 4 },
          { type: 'chart', layout: 'grid', cols: 8 },
          { type: 'table', layout: 'grid', cols: 12 }
        ]
      },
      is_default: true,
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000002',
      business_id: null,
      name: 'MantraVat Admin Dashboard',
      template_code: 'admin_dashboard',
      template_type: 'dashboard',
      description: 'Administrative dashboard for MantraVat brand',
      schema_json: {
        brand: 'MANTRAVAT',
        layout: 'grid',
        cols: 12,
        theme: { primary: '#2563EB', secondary: '#10B981' },
        sections: [
          { type: 'kpi', layout: 'grid', cols: 3 },
          { type: 'table', layout: 'grid', cols: 9 },
          { type: 'chart', layout: 'grid', cols: 12 }
        ]
      },
      is_default: true,
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000003',
      business_id: null,
      name: 'JeetMantra Education Dashboard',
      template_code: 'edu_dashboard',
      template_type: 'dashboard',
      description: 'Learning management dashboard for JeetMantra',
      schema_json: {
        brand: 'JEETMANTRA',
        layout: 'grid',
        cols: 12,
        theme: { primary: '#F59E0B', secondary: '#EF4444' },
        sections: [
          { type: 'courses', layout: 'grid', cols: 6 },
          { type: 'kpi', layout: 'grid', cols: 6 },
          { type: 'chart', layout: 'grid', cols: 12 }
        ]
      },
      is_default: true,
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000004',
      business_id: null,
      name: 'JuniorMantra Kids Dashboard',
      template_code: 'kids_dashboard',
      template_type: 'dashboard',
      description: 'Child-friendly dashboard for JuniorMantra',
      schema_json: {
        brand: 'JUNIORMANTRA',
        layout: 'grid',
        cols: 12,
        theme: { primary: '#8B5CF6', secondary: '#EC4899' },
        sections: [
          { type: 'cards', layout: 'grid', cols: 12 },
          { type: 'progress', layout: 'grid', cols: 6 },
          { type: 'messages', layout: 'grid', cols: 6 }
        ]
      },
      is_default: true,
      is_active: true
    }
  ];

  for (const template of templates) {
    const { error } = await supabase
      .from('ui_templates')
      .upsert(template, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Error creating ${template.template_code}:`, error.message);
    } else {
      console.log(`✅ Created template: ${template.template_code}`);
    }
  }

  // STEP 2: Create widgets
  console.log('\n📝 Creating widgets...');
  
  const widgets = [
    // BOTMANTRA
    { id: 'w1000000-0000-0000-0000-000000000001', business_id: null, widget_code: 'ai_chat', widget_name: 'AI Chat Assistant', widget_type: 'chat', description: 'Real-time AI chat widget', data_source: null, chart_type: null, config_json: { brand: 'BOTMANTRA', position: 'bottom-right' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000002', business_id: null, widget_code: 'usage_kpi', widget_name: 'API Usage', widget_type: 'kpi', description: 'API call statistics', data_source: 'node_execution_log', chart_type: null, config_json: { brand: 'BOTMANTRA', metric: 'count', trend: true }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000003', business_id: null, widget_code: 'recent_activity', widget_name: 'Recent Activity', widget_type: 'table', description: 'Latest system activities', data_source: 'node_execution_log', chart_type: null, config_json: { brand: 'BOTMANTRA', limit: 10, sortBy: 'created_at' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000004', business_id: null, widget_code: 'system_health', widget_name: 'System Health', widget_type: 'kpi', description: 'System status indicator', data_source: 'node_trust_state', chart_type: null, config_json: { brand: 'BOTMANTRA', metric: 'trust_score' }, is_active: true },
    
    // MANTRAVAT
    { id: 'w1000000-0000-0000-0000-000000000011', business_id: null, widget_code: 'revenue_kpi', widget_name: 'Total Revenue', widget_type: 'kpi', description: 'Revenue statistics', data_source: 'node_transaction', chart_type: 'currency', config_json: { brand: 'MANTRAVAT', metric: 'sum', field: 'amount' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000012', business_id: null, widget_code: 'clients_table', widget_name: 'Client List', widget_type: 'table', description: 'Active clients', data_source: 'core_node', chart_type: null, config_json: { brand: 'MANTRAVAT', filter: { node_type: 'customer' } }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000013', business_id: null, widget_code: 'subscription_chart', widget_name: 'Subscriptions', widget_type: 'chart', description: 'Subscription analytics', data_source: 'business_subscriptions', chart_type: 'bar', config_json: { brand: 'MANTRAVAT', chartType: 'bar' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000014', business_id: null, widget_code: 'admin_activity', widget_name: 'Admin Activity', widget_type: 'table', description: 'Recent admin actions', data_source: 'node_audit_log', chart_type: null, config_json: { brand: 'MANTRAVAT', limit: 15 }, is_active: true },
    
    // JEETMANTRA
    { id: 'w1000000-0000-0000-0000-000000000021', business_id: null, widget_code: 'courses_list', widget_name: 'Courses', widget_type: 'table', description: 'Active courses', data_source: 'core_node', chart_type: null, config_json: { brand: 'JEETMANTRA', filter: { node_type: 'course' } }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000022', business_id: null, widget_code: 'students_count', widget_name: 'Students', widget_type: 'kpi', description: 'Total students enrolled', data_source: 'users', chart_type: 'number', config_json: { brand: 'JEETMANTRA', metric: 'count' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000023', business_id: null, widget_code: 'attendance_chart', widget_name: 'Attendance', widget_type: 'chart', description: 'Student attendance trends', data_source: 'node_execution_log', chart_type: 'line', config_json: { brand: 'JEETMANTRA', chartType: 'line' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000024', business_id: null, widget_code: 'assignments', widget_name: 'Assignments', widget_type: 'table', description: 'Pending assignments', data_source: 'core_node', chart_type: null, config_json: { brand: 'JEETMANTRA', filter: { node_type: 'assignment' } }, is_active: true },
    
    // JUNIORMANTRA
    { id: 'w1000000-0000-0000-0000-000000000031', business_id: null, widget_code: 'kids_progress', widget_name: 'Learning Progress', widget_type: 'kpi', description: 'Child learning progress', data_source: 'node_karma_log', chart_type: 'percentage', config_json: { brand: 'JUNIORMANTRA', metric: 'percentage' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000032', business_id: null, widget_code: 'learning_cards', widget_name: 'Activities', widget_type: 'cards', description: 'Learning activities', data_source: 'core_node', chart_type: null, config_json: { brand: 'JUNIORMANTRA', cardStyle: 'colorful' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000033', business_id: null, widget_code: 'daily_activity', widget_name: 'Daily Activity', widget_type: 'chart', description: 'Daily engagement chart', data_source: 'node_execution_log', chart_type: 'donut', config_json: { brand: 'JUNIORMANTRA', chartType: 'donut' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000034', business_id: null, widget_code: 'parent_messages', widget_name: 'Messages', widget_type: 'table', description: 'Parent communication', data_source: 'ai_chat_messages', chart_type: null, config_json: { brand: 'JUNIORMANTRA', limit: 5 }, is_active: true }
  ];

  for (const widget of widgets) {
    const { error } = await supabase
      .from('dashboard_widgets')
      .upsert(widget, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Error creating ${widget.widget_code}:`, error.message);
    } else {
      console.log(`✅ Created widget: ${widget.widget_code}`);
    }
  }

  // STEP 3: Create widget layouts
  console.log('\n📝 Creating widget layouts...');
  
  const layouts = [
    // BOTMANTRA layouts
    { id: 'l1000000-0000-0000-0000-000000000001', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000001', widget_id: 'w1000000-0000-0000-0000-000000000002', x: 0, y: 0, w: 3, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000002', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000001', widget_id: 'w1000000-0000-0000-0000-000000000004', x: 3, y: 0, w: 3, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000003', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000001', widget_id: 'w1000000-0000-0000-0000-000000000003', x: 0, y: 2, w: 12, h: 4, hidden: false },
    
    // MANTRAVAT layouts
    { id: 'l1000000-0000-0000-0000-000000000011', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000011', x: 0, y: 0, w: 4, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000012', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000012', x: 4, y: 0, w: 8, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000013', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000013', x: 0, y: 2, w: 4, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000014', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000014', x: 0, y: 6, w: 12, h: 3, hidden: false },
    
    // JEETMANTRA layouts
    { id: 'l1000000-0000-0000-0000-000000000021', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000021', x: 0, y: 0, w: 6, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000022', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000022', x: 6, y: 0, w: 3, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000023', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000023', x: 6, y: 2, w: 6, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000024', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000024', x: 0, y: 4, w: 6, h: 3, hidden: false },
    
    // JUNIORMANTRA layouts
    { id: 'l1000000-0000-0000-0000-000000000031', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000004', widget_id: 'w1000000-0000-0000-0000-000000000032', x: 0, y: 0, w: 12, h: 3, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000032', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000004', widget_id: 'w1000000-0000-0000-0000-000000000031', x: 0, y: 3, w: 6, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000033', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000004', widget_id: 'w1000000-0000-0000-0000-000000000033', x: 6, y: 3, w: 6, h: 3, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000034', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000004', widget_id: 'w1000000-0000-0000-0000-000000000034', x: 0, y: 5, w: 12, h: 3, hidden: false }
  ];

  for (const layout of layouts) {
    const { error } = await supabase
      .from('ui_widget_layouts')
      .upsert(layout, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Error creating layout ${layout.id}:`, error.message);
    } else {
      console.log(`✅ Created layout for template: ${layout.template_id}`);
    }
  }

  // STEP 4: Update brand bindings
  console.log('\n📝 Updating brand template bindings...');
  
  const brandBindings = [
    { brand_code: 'BOTMANTRA', default_template: 'ai_dashboard' },
    { brand_code: 'MANTRAVAT', default_template: 'admin_dashboard' },
    { brand_code: 'JEETMANTRA', default_template: 'edu_dashboard' },
    { brand_code: 'JUNIORMANTRA', default_template: 'kids_dashboard' }
  ];

  for (const binding of brandBindings) {
    const { error } = await supabase
      .from('brands')
      .update({ default_template: binding.default_template })
      .eq('brand_code', binding.brand_code);
    
    if (error) {
      console.error(`❌ Error updating ${binding.brand_code}:`, error.message);
    } else {
      console.log(`✅ Updated ${binding.brand_code} → ${binding.default_template}`);
    }
  }

  // Validation
  console.log('\n📊 VALIDATION\n');

  const { data: t } = await supabase
    .from('ui_templates')
    .select('template_code, name')
    .in('template_code', ['ai_dashboard', 'admin_dashboard', 'edu_dashboard', 'kids_dashboard']);
  console.log('Templates:', t);

  const { data: w } = await supabase
    .from('dashboard_widgets')
    .select('widget_code, widget_name, widget_type')
    .limit(16);
  console.log('\nWidgets:', w);

  const { data: b } = await supabase
    .from('brands')
    .select('brand_code, default_template')
    .in('brand_code', ['BOTMANTRA', 'MANTRAVAT', 'JEETMANTRA', 'JUNIORMANTRA']);
  console.log('\nBrand Bindings:', b);

  console.log('\n✅ Dashboard setup complete!');
}

setupDashboards().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
