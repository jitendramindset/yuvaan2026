/**
 * Execute Onboarding Tables Migration
 * Creates required tables for routes-onboarding-kernel
 * Usage: node execute-onboarding-migration.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
  const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260207_add_onboarding_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('\n🔧 Executing onboarding tables migration...');
  console.log(`📄 ${sqlPath}`);

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      let result;
      try {
        result = await supabase.rpc('sql_execute', { query: statement });
      } catch {
        result = await new Promise((resolve) => {
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
            res.on('end', () => resolve({ data, status: res.statusCode, error: res.statusCode >= 400 ? true : null }));
          });

          req.on('error', (e) => resolve({ error: e }));
          req.write(body);
          req.end();
        });
      }

      const { error } = result || {};

      if (!error) {
        successCount++;
      } else if (error.message && error.message.includes('already exists')) {
        successCount++;
      } else {
        errorCount++;
        console.log(`⚠️  ${error.message || 'Unknown error'}`);
      }
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        successCount++;
      } else {
        errorCount++;
        console.log(`⚠️  ${e.message}`);
      }
    }
  }

  console.log(`✅ Statements executed: ${successCount}`);
  if (errorCount > 0) console.log(`⚠️  Warnings: ${errorCount}`);
}

executeMigration().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
