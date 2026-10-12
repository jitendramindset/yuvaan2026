/**
 * Dashboard Setup Migration Runner
 * Safely adds brand-specific templates, widgets, and layouts
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required env vars: SUPABASE_URL, SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting dashboard setup migration...\n');
  
  const sqlFile = path.join(__dirname, 'db-migrations', '20260203_dashboard_setup.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements\n`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Skip comments and empty lines
    if (stmt.startsWith('SELECT') && stmt.includes("'Checking") || 
        stmt.startsWith('SELECT') && stmt.includes("'Current") ||
        stmt.startsWith('SELECT') && stmt.includes("step")) {
      console.log(`ℹ️  ${stmt.substring(0, 50)}...`);
      continue;
    }

    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: stmt + ';' 
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        errorCount++;
      } else {
        if (stmt.includes('INSERT') || stmt.includes('UPDATE')) {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      }
    } catch (err) {
      console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${successCount} statements`);
  console.log(`❌ Errors: ${errorCount} statements`);
  console.log('='.repeat(60));

  // Validation queries
  console.log('\n📊 Running validation queries...\n');

  const { data: templates, error: tError } = await supabase
    .from('ui_templates')
    .select('template_code, name, is_active')
    .in('template_code', ['ai_dashboard', 'admin_dashboard', 'edu_dashboard', 'kids_dashboard']);

  if (!tError) {
    console.log('Templates created:');
    console.table(templates);
  }

  const { data: widgets, error: wError } = await supabase
    .from('dashboard_widgets')
    .select('widget_code, widget_name, widget_type')
    .limit(20);

  if (!wError) {
    console.log('Widgets created:');
    console.table(widgets);
  }

  const { data: brands, error: bError } = await supabase
    .from('brands')
    .select('brand_code, brand_name, default_template')
    .in('brand_code', ['BOTMANTRA', 'MANTRAVAT', 'JEETMANTRA', 'JUNIORMANTRA']);

  if (!bError) {
    console.log('Brand template bindings:');
    console.table(brands);
  }

  console.log('\n✅ Dashboard setup complete!');
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
