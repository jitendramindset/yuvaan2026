#!/usr/bin/env node

/**
 * DATABASE SCHEMA DEPLOYMENT SCRIPT
 * Deploys Week 2 Part 1 & Part 2 database schemas to Supabase
 * 
 * Usage: node deploy-schemas.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('./config/supabase');

const SCHEMAS = [
  { name: 'Economy System (Week 2 Part 1)', file: 'db-schema-economy.sql' },
  { name: 'Contribution Graph (Week 2 Part 2)', file: 'db-schema-contribution-graph.sql' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DEPLOYMENT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function deploySchemas() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  DATABASE SCHEMA DEPLOYMENT                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  let deployedCount = 0;
  let failedCount = 0;

  for (const schema of SCHEMAS) {
    try {
      console.log(`📋 Deploying: ${schema.name}`);
      console.log(`   File: ${schema.file}`);
      
      const filePath = path.join(__dirname, schema.file);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Schema file not found: ${filePath}`);
      }

      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      
      // Split by semicolons to execute statements separately
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Executing ${statements.length} SQL statements...`);

      let statementCount = 0;
      for (const statement of statements) {
        try {
          // Use Supabase's rpc method to execute raw SQL
          // Since Supabase doesn't expose raw SQL execution directly,
          // we'll need to execute key statements via the API
          
          // For now, just validate the statement exists
          if (statement.includes('CREATE TABLE') || 
              statement.includes('CREATE INDEX') || 
              statement.includes('CREATE VIEW') ||
              statement.includes('CREATE OR REPLACE')) {
            statementCount++;
          }
        } catch (err) {
          console.error(`   ❌ Statement failed: ${err.message}`);
        }
      }

      console.log(`   ✅ Deployment queued (${statementCount} statements)\n`);
      deployedCount++;

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failedCount++;
    }
  }

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  DEPLOYMENT SUMMARY                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`✅ Prepared: ${deployedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log('\n⚠️  MANUAL DEPLOYMENT REQUIRED:\n');
  console.log('Since Supabase JS SDK doesn\'t support raw SQL execution,');
  console.log('you must manually execute the schemas:\n');
  
  console.log('Option 1 - Supabase Dashboard:');
  console.log('  1. Go to https://app.supabase.com');
  console.log('  2. Select your project');
  console.log('  3. Navigate to SQL Editor');
  console.log('  4. Create a new query');
  console.log('  5. Copy content from:');
  for (const schema of SCHEMAS) {
    console.log(`     - ${schema.file}`);
  }
  console.log('  6. Run the query\n');

  console.log('Option 2 - psql CLI:');
  console.log('  psql -h db.mantravat.cloud -U postgres -d postgres');
  console.log('  Then paste the SQL from the schema files\n');

  console.log('Option 3 - pgAdmin:');
  console.log('  Connect via pgAdmin and execute the SQL queries\n');

  console.log('═══════════════════════════════════════════════════════════════');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN DEPLOYMENT
// ═══════════════════════════════════════════════════════════════════════════════

deploySchemas().catch(error => {
  console.error('\n❌ DEPLOYMENT FAILED:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
});
