/**
 * Brand Dashboard Seeding - Minimal Schema Version
 * Using only confirmed existing columns
 */
require('dotenv').config();
const { supabase } = require('./config/supabase');

async function seed() {
  console.log('🚀 Seeding brand dashboards (minimal schema)...\n');

  console.log('📝 Creating templates...');
  
  const templates = [
    {
      id: 'a1000000-0000-0000-0000-000000000001',
      template_code: 'ai_dashboard',
      template_name: 'BotMantra AI Dashboard',
      layout: {
        brand: 'BOTMANTRA',
        cols: 12,
        theme: { primary: '#6B5BFF', secondary: '#FF6B9D' },
        sections: [
          { type: 'kpi', cols: 4 },
          { type: 'chart', cols: 8 },
          { type: 'table', cols: 12 }
        ]
      }
    },
    {
      id: 'a1000000-0000-0000-0000-000000000002',
      template_code: 'admin_dashboard',
      template_name: 'MantraVat Admin Dashboard',
      layout: {
        brand: 'MANTRAVAT',
        cols: 12,
        theme: { primary: '#2563EB', secondary: '#10B981' },
        sections: [
          { type: 'kpi', cols: 3 },
          { type: 'table', cols: 9 },
          { type: 'chart', cols: 12 }
        ]
      }
    },
    {
      id: 'a1000000-0000-0000-0000-000000000003',
      template_code: 'edu_dashboard',
      template_name: 'JeetMantra Education Dashboard',
      layout: {
        brand: 'JEETMANTRA',
        cols: 12,
        theme: { primary: '#F59E0B', secondary: '#EF4444' },
        sections: [
          { type: 'courses', cols: 6 },
          { type: 'kpi', cols: 6 },
          { type: 'chart', cols: 12 }
        ]
      }
    },
    {
      id: 'a1000000-0000-0000-0000-000000000004',
      template_code: 'kids_dashboard',
      template_name: 'JuniorMantra Kids Dashboard',
      layout: {
        brand: 'JUNIORMANTRA',
        cols: 12,
        theme: { primary: '#8B5CF6', secondary: '#EC4899' },
        sections: [
          { type: 'cards', cols: 12 },
          { type: 'progress', cols: 6 },
          { type: 'messages', cols: 6 }
        ]
      }
    }
  ];

  for (const t of templates) {
    const { error } = await supabase
      .from('ui_templates')
      .upsert(t, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ ${t.template_code}: ${error.message}`);
    } else {
      console.log(`✅ ${t.template_code}`);
    }
  }

  // Validation
  console.log('\n📊 Validation:');
  const { data, error } = await supabase
    .from('ui_templates')
    .select('template_code, template_name')
    .in('template_code', ['ai_dashboard', 'admin_dashboard', 'edu_dashboard', 'kids_dashboard']);
  
  if (error) {
    console.error('Validation error:', error.message);
  } else {
    console.table(data);
  }

  console.log('\n✅ Seeding complete!');
  console.log('\nℹ️  Created templates:');
  console.log('   - BOTMANTRA → ai_dashboard');
  console.log('   - MANTRAVAT → admin_dashboard');
  console.log('   - JEETMANTRA → edu_dashboard');
  console.log('   - JUNIORMANTRA → kids_dashboard');
}

seed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
