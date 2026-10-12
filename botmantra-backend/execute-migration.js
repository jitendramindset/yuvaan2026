/**
 * Execute AI Websites Table Migration
 * 
 * This script executes the SQL migration to create the ai_websites table
 * in Supabase. It uses the service role key for admin access.
 * 
 * Usage: node execute-migration.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
  console.log('\n🔧 Executing AI Websites Table Migration...\n');

  try {
    // Read SQL file
    const sqlPath = './migrations/20260203_create_ai_websites_table.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 SQL File loaded');
    console.log(`📊 SQL Size: ${sql.length} bytes\n`);

    // Step 1: Create table
    console.log('1️⃣ Creating ai_websites table...');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') ||
          statement.includes('ALTER TABLE') ||
          statement.includes('GRANT')) {
        try {
          // Use the rpc method with a raw query
          const { error } = await supabase.rpc('sql_execute', { 
            query: statement 
          }).catch(async (err) => {
            // Fallback: try direct approach via HTTP
            return new Promise((resolve) => {
              const body = JSON.stringify({ query: statement });
              const options = {
                hostname: new URL(supabaseUrl).hostname,
                path: '/rest/v1/rpc/sql_execute',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': body.length,
                  'Authorization': `Bearer ${serviceRoleKey}`
                }
              };

              const https = require('https');
              const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                  resolve({ data, status: res.statusCode, error: res.statusCode >= 400 ? true : null });
                });
              });

              req.on('error', (e) => {
                resolve({ error: e });
              });

              req.write(body);
              req.end();
            });
          });

          if (!error) {
            successCount++;
            console.log('   ✓ Statement executed');
          } else {
            if (error.message && error.message.includes('already exists')) {
              successCount++;
              console.log('   ✓ Already exists (OK)');
            } else {
              errorCount++;
              console.log(`   ⚠️  ${error.message}`);
            }
          }
        } catch (e) {
          if (e.message && e.message.includes('already exists')) {
            successCount++;
            console.log('   ✓ Already exists (OK)');
          } else {
            errorCount++;
            console.log(`   ⚠️  ${e.message}`);
          }
        }
      }
    }

    console.log(`\n   Executed: ${successCount} statements`);
    if (errorCount > 0) console.log(`   Warnings: ${errorCount}`);

    // Step 2: Verify table exists
    console.log('\n2️⃣ Verifying table creation...');
    try {
      const { data, error } = await supabase
        .from('ai_websites')
        .select('id')
        .limit(0);

      if (error && error.message.includes('does not exist')) {
        console.log('   ⚠️ Table not found');
        console.log('\n   💡 Try manual setup:');
        console.log('   1. Go to: https://app.supabase.com/');
        console.log('   2. Click "SQL Editor"');
        console.log('   3. Click "+ New Query"');
        console.log(`   4. Copy content from: ${sqlPath}`);
        console.log('   5. Click "Run"');
      } else if (!error) {
        console.log('   ✅ Table verified! Table is ready to use');
      } else {
        console.log('   ⚠️ ' + error.message);
      }
    } catch (e) {
      console.log('   ⚠️ Verification error: ' + e.message);
    }

    // Step 3: Test access
    console.log('\n3️⃣ Testing table access...');
    try {
      const { data, error, count } = await supabase
        .from('ai_websites')
        .select('*', { count: 'exact' })
        .limit(1);

      if (!error) {
        console.log(`   ✅ Table accessible`);
        console.log(`   📊 Current rows: ${count || 0}`);
      } else if (error.message.includes('does not exist')) {
        console.log('   ℹ️ Table needs manual SQL setup (see Step 2 above)');
      } else {
        console.log('   ⚠️ ' + error.message);
      }
    } catch (e) {
      console.log('   ⚠️ Access test failed: ' + e.message);
    }

    console.log('\n✅ Migration script completed!\n');
    console.log('━'.repeat(70));
    console.log('📝 MANUAL SETUP (if automatic failed):');
    console.log('━'.repeat(70));
    console.log('\n1. Go to: https://app.supabase.com/');
    console.log('2. Select your Botmantra project');
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log('4. Click the "+ New Query" button');
    console.log(`5. Copy all SQL from: migrations/20260203_create_ai_websites_table.sql`);
    console.log('6. Paste into the SQL editor');
    console.log('7. Click the "Run" button (or Ctrl+Enter)');
    console.log('8. You should see "Success" notification');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   • Check SUPABASE_URL in .env');
    console.log('   • Check SERVICE_ROLE_KEY in .env');
    console.log('   • Verify Supabase project is accessible');
    console.log('\n📝 Alternative: Use Supabase SQL Editor (see above)\n');
    process.exit(1);
  }
}

executeMigration();
