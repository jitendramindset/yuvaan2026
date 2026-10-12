/**
 * Dashboard Setup Using Existing Supabase Config
 */
require('dotenv').config();
const { supabase } = require('./config/supabase');

async function setupDashboards() {
  console.log('🚀 Starting dashboard setup using existing Supabase config...\n');

  // STEP 1: Create templates
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
      console.error(`❌ ${template.template_code}:`, error.message);
    } else {
      console.log(`✅ ${template.template_code}`);
    }
  }

  // STEP 2: Create widgets
  console.log('\n📝 Creating widgets...');
  
  const widgets = [
    // BOTMANTRA
    { id: 'w1000000-0000-0000-0000-000000000001', business_id: null, widget_code: 'ai_chat', widget_name: 'AI Chat', widget_type: 'chat', description: 'AI chat widget', data_source: null, chart_type: null, config_json: { brand: 'BOTMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000002', business_id: null, widget_code: 'usage_kpi', widget_name: 'API Usage', widget_type: 'kpi', description: 'API statistics', data_source: 'node_execution_log', chart_type: null, config_json: { brand: 'BOTMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000003', business_id: null, widget_code: 'recent_activity', widget_name: 'Recent Activity', widget_type: 'table', description: 'System activities', data_source: 'node_execution_log', chart_type: null, config_json: { brand: 'BOTMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000004', business_id: null, widget_code: 'system_health', widget_name: 'System Health', widget_type: 'kpi', description: 'Health indicator', data_source: 'node_trust_state', chart_type: null, config_json: { brand: 'BOTMANTRA' }, is_active: true },
    
    // MANTRAVAT
    { id: 'w1000000-0000-0000-0000-000000000011', business_id: null, widget_code: 'revenue_kpi', widget_name: 'Revenue', widget_type: 'kpi', description: 'Revenue stats', data_source: 'node_transaction', chart_type: 'currency', config_json: { brand: 'MANTRAVAT' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000012', business_id: null, widget_code: 'clients_table', widget_name: 'Clients', widget_type: 'table', description: 'Client list', data_source: 'core_node', chart_type: null, config_json: { brand: 'MANTRAVAT' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000013', business_id: null, widget_code: 'subscription_chart', widget_name: 'Subscriptions', widget_type: 'chart', description: 'Subscription analytics', data_source: 'business_subscriptions', chart_type: 'bar', config_json: { brand: 'MANTRAVAT' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000014', business_id: null, widget_code: 'admin_activity', widget_name: 'Admin Activity', widget_type: 'table', description: 'Admin actions', data_source: 'node_audit_log', chart_type: null, config_json: { brand: 'MANTRAVAT' }, is_active: true },
    
    // JEETMANTRA
    { id: 'w1000000-0000-0000-0000-000000000021', business_id: null, widget_code: 'courses_list', widget_name: 'Courses', widget_type: 'table', description: 'Course list', data_source: 'core_node', chart_type: null, config_json: { brand: 'JEETMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000022', business_id: null, widget_code: 'students_count', widget_name: 'Students', widget_type: 'kpi', description: 'Student count', data_source: 'users', chart_type: 'number', config_json: { brand: 'JEETMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000023', business_id: null, widget_code: 'attendance_chart', widget_name: 'Attendance', widget_type: 'chart', description: 'Attendance trends', data_source: 'node_execution_log', chart_type: 'line', config_json: { brand: 'JEETMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000024', business_id: null, widget_code: 'assignments', widget_name: 'Assignments', widget_type: 'table', description: 'Assignment list', data_source: 'core_node', chart_type: null, config_json: { brand: 'JEETMANTRA' }, is_active: true },
    
    // JUNIORMANTRA
    { id: 'w1000000-0000-0000-0000-000000000031', business_id: null, widget_code: 'kids_progress', widget_name: 'Progress', widget_type: 'kpi', description: 'Learning progress', data_source: 'node_karma_log', chart_type: 'percentage', config_json: { brand: 'JUNIORMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000032', business_id: null, widget_code: 'learning_cards', widget_name: 'Activities', widget_type: 'cards', description: 'Learning activities', data_source: 'core_node', chart_type: null, config_json: { brand: 'JUNIORMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000033', business_id: null, widget_code: 'daily_activity', widget_name: 'Daily Activity', widget_type: 'chart', description: 'Engagement chart', data_source: 'node_execution_log', chart_type: 'donut', config_json: { brand: 'JUNIORMANTRA' }, is_active: true },
    { id: 'w1000000-0000-0000-0000-000000000034', business_id: null, widget_code: 'parent_messages', widget_name: 'Messages', widget_type: 'table', description: 'Parent messages', data_source: 'ai_chat_messages', chart_type: null, config_json: { brand: 'JUNIORMANTRA' }, is_active: true }
  ];

  for (const widget of widgets) {
    const { error } = await supabase
      .from('dashboard_widgets')
      .upsert(widget, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ ${widget.widget_code}:`, error.message);
    } else {
      console.log(`✅ ${widget.widget_code}`);
    }
  }

  // STEP 3: Create layouts
  console.log('\n📝 Creating widget layouts...');
  
  const layouts = [
    // BOTMANTRA (3 widgets)
    { id: 'l1000000-0000-0000-0000-000000000001', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000001', widget_id: 'w1000000-0000-0000-0000-000000000002', x: 0, y: 0, w: 3, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000002', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000001', widget_id: 'w1000000-0000-0000-0000-000000000004', x: 3, y: 0, w: 3, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000003', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000001', widget_id: 'w1000000-0000-0000-0000-000000000003', x: 0, y: 2, w: 12, h: 4, hidden: false },
    
    // MANTRAVAT (4 widgets)
    { id: 'l1000000-0000-0000-0000-000000000011', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000011', x: 0, y: 0, w: 4, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000012', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000012', x: 4, y: 0, w: 8, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000013', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000013', x: 0, y: 2, w: 4, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000014', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000002', widget_id: 'w1000000-0000-0000-0000-000000000014', x: 0, y: 6, w: 12, h: 3, hidden: false },
    
    // JEETMANTRA (4 widgets)
    { id: 'l1000000-0000-0000-0000-000000000021', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000021', x: 0, y: 0, w: 6, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000022', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000022', x: 6, y: 0, w: 3, h: 2, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000023', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000023', x: 6, y: 2, w: 6, h: 4, hidden: false },
    { id: 'l1000000-0000-0000-0000-000000000024', user_id: null, business_id: null, template_id: 'a1000000-0000-0000-0000-000000000003', widget_id: 'w1000000-0000-0000-0000-000000000024', x: 0, y: 4, w: 6, h: 3, hidden: false },
    
    // JUNIORMANTRA (4 widgets)
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
      console.error(`❌ Layout for ${layout.template_id}:`, error.message);
    } else {
      console.log(`✅ Layout for ${layout.template_id.substring(0, 8)}`);
    }
  }

  // STEP 4: Update brands
  console.log('\n📝 Updating brand bindings...');
  
  const bindings = [
    { brand_code: 'BOTMANTRA', default_template: 'ai_dashboard' },
    { brand_code: 'MANTRAVAT', default_template: 'admin_dashboard' },
    { brand_code: 'JEETMANTRA', default_template: 'edu_dashboard' },
    { brand_code: 'JUNIORMANTRA', default_template: 'kids_dashboard' }
  ];

  for (const binding of bindings) {
    const { error } = await supabase
      .from('brands')
      .update({ default_template: binding.default_template })
      .eq('brand_code', binding.brand_code);
    
    if (error) {
      console.error(`❌ ${binding.brand_code}:`, error.message);
    } else {
      console.log(`✅ ${binding.brand_code} → ${binding.default_template}`);
    }
  }

  // Validation
  console.log('\n📊 VALIDATION\n');

  const { data: t, error: te } = await supabase
    .from('ui_templates')
    .select('template_code, name')
    .in('template_code', ['ai_dashboard', 'admin_dashboard', 'edu_dashboard', 'kids_dashboard']);
  
  if (te) console.error('Templates error:', te.message);
  else console.table(t);

  const { data: w, error: we } = await supabase
    .from('dashboard_widgets')
    .select('widget_code, widget_type')
    .limit(16);
  
  if (we) console.error('Widgets error:', we.message);
  else console.table(w);

  const { data: b, error: be } = await supabase
    .from('brands')
    .select('brand_code, default_template')
    .in('brand_code', ['BOTMANTRA', 'MANTRAVAT', 'JEETMANTRA', 'JUNIORMANTRA']);
  
  if (be) console.error('Brands error:', be.message);
  else console.table(b);

  console.log('\n✅ Dashboard setup complete!');
}

setupDashboards().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
