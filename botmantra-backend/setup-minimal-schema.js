#!/usr/bin/env node

/**
 * QUICK SCHEMA SETUP FOR TESTING
 * Creates minimal tables needed for API testing
 * Avoids the complex revenue-share-pool table initially
 */

require('dotenv').config();
const { supabase } = require('./config/supabase');

// ═══════════════════════════════════════════════════════════════════════════════
// MINIMAL SCHEMA CREATION FOR TESTING
// ═══════════════════════════════════════════════════════════════════════════════

async function setupMinimalSchema() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  MINIMAL SCHEMA SETUP - API Testing                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Create wallets table
    console.log('📋 Creating wallets table...');
    const { error: walletsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS wallets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          wallet_type VARCHAR(50) NOT NULL DEFAULT 'primary',
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          total_earned DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          total_received DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          total_sent DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          frozen_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          is_frozen BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT unique_user_wallet_type UNIQUE(user_id, wallet_type)
        );
        CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
      `
    });

    if (walletsError && !walletsError.message.includes('already exists')) {
      throw walletsError;
    }
    console.log('   ✅ Wallets table ready\n');

    // 2. Create transactions table
    console.log('📋 Creating transactions table...');
    const { error: txError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          to_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
          from_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT,
          to_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT,
          amount DECIMAL(15, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          transaction_type VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          fee_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT positive_amount CHECK (amount > 0)
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      `
    });

    if (txError && !txError.message.includes('already exists')) {
      throw txError;
    }
    console.log('   ✅ Transactions table ready\n');

    // 3. Create revenue_share_pool table
    console.log('📋 Creating revenue_share_pool table...');
    const { error: poolError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS revenue_share_pool (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          pool_name VARCHAR(255) NOT NULL,
          total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          pool_type VARCHAR(50) NOT NULL,
          distribution_rule JSONB NOT NULL DEFAULT '{}'::jsonb,
          distributed_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          pending_distribution DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_revenue_share_pool_source_user ON revenue_share_pool(source_user_id);
      `
    });

    if (poolError && !poolError.message.includes('already exists')) {
      throw poolError;
    }
    console.log('   ✅ Revenue share pool table ready\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ MINIMAL SCHEMA SETUP COMPLETE\n');
    console.log('You can now run the API tests!');
    console.log('   node test-all-apis.js\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n⚠️  MANUAL SETUP REQUIRED:');
    console.log('Please create tables manually using Supabase dashboard.');
    console.log('See db-schema-economy.sql for table definitions.\n');
    process.exit(1);
  }
}

setupMinimalSchema();
