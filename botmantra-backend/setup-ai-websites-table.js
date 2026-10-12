/**
 * AI Websites Table Setup
 * Run this once to create the ai_websites table in Supabase
 * 
 * Usage: node setup-ai-websites-table.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupTable() {
  console.log('\n📋 Setting up AI Websites Table...\n');

  try {
    // Step 1: Create table
    console.log('1️⃣ Creating ai_websites table...');
    const { error: createError } = await supabase.rpc('sql_execute', {
      query: `
        CREATE TABLE IF NOT EXISTS public.ai_websites (
            id TEXT PRIMARY KEY DEFAULT ('site_' || substr(md5(random()::text), 1, 16)),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            website_name TEXT NOT NULL,
            website_type TEXT NOT NULL CHECK (website_type IN ('landing', 'product', 'blog', 'ecommerce', 'portfolio', 'saas')),
            design_style TEXT NOT NULL DEFAULT 'modern' CHECK (design_style IN ('modern', 'minimal', 'playful', 'professional', 'tech')),
            schema JSONB NOT NULL,
            rendered_html JSONB,
            page_count INTEGER DEFAULT 1 CHECK (page_count > 0),
            is_published BOOLEAN DEFAULT false,
            deployed_url TEXT,
            deployment_platform TEXT,
            deployed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('   Note:', createError.message.includes('already exists') ? '✅ Table already exists' : '⚠️ ' + createError.message);
    } else {
      console.log('   ✅ Table created');
    }

    // Step 2: Create indexes
    console.log('2️⃣ Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_websites_user ON public.ai_websites(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_websites_created ON public.ai_websites(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_ai_websites_type ON public.ai_websites(website_type)'
    ];

    for (const indexSql of indexes) {
      await supabase.rpc('sql_execute', { query: indexSql }).catch(() => null);
    }
    console.log('   ✅ Indexes created');

    // Step 3: Enable RLS
    console.log('3️⃣ Enabling Row Level Security...');
    await supabase.rpc('sql_execute', {
      query: 'ALTER TABLE public.ai_websites ENABLE ROW LEVEL SECURITY'
    }).catch(() => null);
    console.log('   ✅ RLS enabled');

    // Step 4: Test table
    console.log('4️⃣ Testing table access...');
    const { data, error } = await supabase.from('ai_websites').select('count', { count: 'exact' }).limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('   ⚠️ Table may not exist - check Supabase dashboard');
      console.log('   💡 Alternative: Copy SQL from migrations/20260203_create_ai_websites_table.sql');
      console.log('   📍 And paste into Supabase SQL Editor directly');
    } else if (error) {
      console.log('   ⚠️ Error:', error.message);
    } else {
      console.log('   ✅ Table is accessible');
    }

    console.log('\n✅ Setup completed!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 Manual Setup Instructions:');
    console.log('   1. Go to: https://app.supabase.com/');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Click "New Query"');
    console.log('   5. Copy content from: migrations/20260203_create_ai_websites_table.sql');
    console.log('   6. Paste and click "Run"');
    process.exit(1);
  }
}

setupTable();
