#!/usr/bin/env node

/**
 * DATABASE SCHEMA CHECKER & INITIALIZER
 * 
 * 1. Checks what tables already exist
 * 2. Shows missing tables
 * 3. Creates only missing tables
 */

require('dotenv').config();
const { supabase } = require('./config/supabase');

// ═══════════════════════════════════════════════════════════════════════════════
// REQUIRED TABLES DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

const REQUIRED_TABLES = {
  // Week 2 Part 1: Economy System
  wallets: 'Wallet management and balances',
  transactions: 'Transaction history and records',
  revenue_share_pool: 'Fee pool management',
  revenue_share_recipients: 'Revenue distribution recipients',
  wallet_permissions: 'Wallet access control',
  wallet_balance_history: 'Balance change audit trail',
  wallet_settings: 'User wallet preferences',
  
  // Week 2 Part 2: Contribution Graph
  contribution_graph: 'Economic participation tracking',
  revenue_distribution_log: 'Payout execution audit',
  node_earnings_summary: 'Aggregated earnings per node',
  contribution_weights_template: 'Weight configuration templates'
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK EXISTING TABLES
// ═══════════════════════════════════════════════════════════════════════════════

async function checkExistingTables() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  DATABASE SCHEMA CHECKER                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    const existingTables = [];
    const missingTables = [];

    console.log('📋 Checking for existing tables...\n');

    for (const [tableName, description] of Object.entries(REQUIRED_TABLES)) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .limit(1);

        if (!error) {
          console.log(`  ✅ ${tableName.padEnd(35)} - EXISTS`);
          existingTables.push(tableName);
        } else {
          // Table doesn't exist or other error
          console.log(`  ❌ ${tableName.padEnd(35)} - MISSING`);
          missingTables.push(tableName);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName.padEnd(35)} - MISSING`);
        missingTables.push(tableName);
      }
    }

    console.log('\n' + '═'.repeat(65));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Existing tables: ${existingTables.length}`);
    console.log(`   ❌ Missing tables:  ${missingTables.length}`);
    console.log(`   📈 Total required: ${Object.keys(REQUIRED_TABLES).length}\n`);

    if (missingTables.length > 0) {
      console.log('Missing tables that need to be created:');
      missingTables.forEach((table, idx) => {
        console.log(`   ${idx + 1}. ${table}`);
      });
      console.log('\n');
    }

    return {
      existing: existingTables,
      missing: missingTables,
      all: Object.keys(REQUIRED_TABLES)
    };

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET SQL FILES
// ═══════════════════════════════════════════════════════════════════════════════

function getSQLFilesToExecute(missingTables) {
  const fs = require('fs');
  const path = require('path');

  const needed = {
    economy: [],
    contribution: []
  };

  // Week 2 Part 1 tables
  const economyTables = [
    'wallets',
    'transactions',
    'revenue_share_pool',
    'revenue_share_recipients',
    'wallet_permissions',
    'wallet_balance_history',
    'wallet_settings'
  ];

  // Week 2 Part 2 tables
  const contributionTables = [
    'contribution_graph',
    'revenue_distribution_log',
    'node_earnings_summary',
    'contribution_weights_template'
  ];

  // Check which files are needed
  const economyNeeded = missingTables.some(t => economyTables.includes(t));
  const contributionNeeded = missingTables.some(t => contributionTables.includes(t));

  const filesToExecute = [];

  if (economyNeeded) {
    const economyPath = path.join(__dirname, 'db-schema-economy.sql');
    if (fs.existsSync(economyPath)) {
      filesToExecute.push({
        file: 'db-schema-economy.sql',
        path: economyPath,
        type: 'economy',
        required: true
      });
    }
  }

  if (contributionNeeded) {
    const contributionPath = path.join(__dirname, 'db-schema-contribution-graph.sql');
    if (fs.existsSync(contributionPath)) {
      filesToExecute.push({
        file: 'db-schema-contribution-graph.sql',
        path: contributionPath,
        type: 'contribution',
        required: economyNeeded // contribution requires economy tables
      });
    }
  }

  return filesToExecute;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT NEXT STEPS
// ═══════════════════════════════════════════════════════════════════════════════

function printNextSteps(missingTables, filesToExecute) {
  if (missingTables.length === 0) {
    console.log('✅ All required tables already exist!');
    console.log('\nNo schema deployment needed.');
    return;
  }

  console.log('📋 FILES TO EXECUTE (in order):\n');

  filesToExecute.forEach((fileInfo, idx) => {
    console.log(`${idx + 1}. ${fileInfo.file}`);
    console.log(`   Type: ${fileInfo.type === 'economy' ? 'Week 2 Part 1 - Economy System' : 'Week 2 Part 2 - Contribution Graph'}`);
    if (fileInfo.required) {
      console.log(`   Status: REQUIRED FIRST`);
    }
    console.log('');
  });

  console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:\n');

  filesToExecute.forEach((fileInfo) => {
    console.log(`Step: Deploy ${fileInfo.file}`);
    console.log(`  1. Open Supabase SQL Editor: http://72.61.248.216:8000/project/default/database/schemas`);
    console.log(`  2. Create new query`);
    console.log(`  3. Copy entire content of: ${fileInfo.file}`);
    console.log(`  4. Paste into SQL Editor`);
    console.log(`  5. Click "Run"\n`);
  });

  console.log('═══════════════════════════════════════════════════════════════\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const result = await checkExistingTables();

  if (!result) {
    console.error('\n❌ Failed to check database. Make sure:');
    console.error('   1. Supabase credentials are set in .env');
    console.error('   2. DATABASE_URL is correct');
    process.exit(1);
  }

  if (result.missing.length === 0) {
    console.log('✅ DATABASE READY!\n');
    console.log('All required tables exist. You can start using the APIs.\n');
    console.log('To run tests:');
    console.log('  node test-all-apis.js\n');
    process.exit(0);
  }

  // Show next steps
  const filesToExecute = getSQLFilesToExecute(result.missing);
  printNextSteps(result.missing, filesToExecute);

  console.log('⏭️  After deploying the schemas above, run this script again to verify.\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
