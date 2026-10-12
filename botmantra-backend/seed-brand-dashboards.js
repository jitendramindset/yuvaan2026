/**
 * Brand Dashboard Seeding - Schema-Aligned Version
 */
require('dotenv').config();
const { supabase } = require('./config/supabase');

async function seed() {
  console.log('🚀 Seeding brand dashboards...\n');

  // Step 1: Templates
  console.log('📝 Creating templates...');
  const templates = [
    { id: 'a1000000-0000-0000-0000-000000000001', template_code: 'ai_dashboard', template_name: 'BotMantra AI Dashboard', layout: { brand: 'BOTMANTRA', cols: 12, theme: { primary: '#6B5BFF' } }, business_type: 'ai', is_public: true },
    { id: 'a1000000-0000-0000-0000-000000000002', template_code: 'admin_dashboard', template_name: 'MantraVat Admin Dashboard', layout: { brand: 'MANTRAVAT', cols: 12, theme: { primary: '#2563EB' } }, business_type: 'admin', is_public: true },
    { id: 'a1000000-0000-0000-0000-000000000003', template_code: 'edu_dashboard', template_name: 'JeetMantra Education Dashboard', layout: { brand: 'JEETMANTRA', cols: 12, theme: { primary: '#F59E0B' } }, business_type: 'education', is_public: true },
    { id: 'a1000000-0000-0000-0000-000000000004', template_code: 'kids_dashboard', template_name: 'JuniorMantra Kids Dashboard', layout: { brand: 'JUNIORMANTRA', cols: 12, theme: { primary: '#8B5CF6' } }, business_type: 'education', is_public: true }
  ];

  for (const t of templates) {
    const { error } = await supabase.from('ui_templates').upsert(t, { onConflict: 'id' });
    console.log(error ? `❌ ${t.template_code}: ${error.message}` : `✅ ${t.template_code}`);
  }

  // Step 2: Check if brands table exists - skip if not
  console.log('\n📝 Checking brands table...');
  const { data: brandsCheck, error: brandsError } = await supabase
    .from('brands')
    .select('brand_code')
    .limit(1);

  if (brandsError) {
    console.log(`⚠️  Brands table not available: ${brandsError.message}`);
    console.log('ℹ️  Skipping brand bindings - table may not exist yet');
  } else {
    console.log('✅ Brands table exists');
    
    const bindings = [
      { brand_code: 'BOTMANTRA', default_template: 'ai_dashboard' },
      { brand_code: 'MANTRAVAT', default_template: 'admin_dashboard' },
      { brand_code: 'JEETMANTRA', default_template: 'edu_dashboard' },
      { brand_code: 'JUNIORMANTRA', default_template: 'kids_dashboard' }
    ];

    for (const b of bindings) {
      const { error } = await supabase
        .from('brands')
        .update({ default_template: b.default_template })
        .eq('brand_code', b.brand_code);
      
      console.log(error ? `❌ ${b.brand_code}` : `✅ ${b.brand_code} → ${b.default_template}`);
    }
  }

  // Validation
  console.log('\n📊 Validation:');
  const { data: t } = await supabase
    .from('ui_templates')
    .select('template_code, template_name')
    .in('template_code', ['ai_dashboard', 'admin_dashboard', 'edu_dashboard', 'kids_dashboard']);
  
  console.table(t);

  console.log('\n✅ Seeding complete!');
  console.log('\nℹ️  Note: dashboard_widgets and ui_widget_layouts require table definitions');
  console.log('   Run schema migrations first if tables are missing.');
}

seed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
