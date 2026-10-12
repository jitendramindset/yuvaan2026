require('dotenv').config();
const { supabase } = require('./config/supabase');

async function createTable() {
  console.log('\n📋 Creating ai_websites table...\n');

  try {
    // Try creating the table using raw SQL
    const { data, error } = await supabase
      .from('ai_websites')
      .select('id')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('❌ Table does not exist');
      console.log('\n📝 Manual Setup Instructions:');
      console.log('─'.repeat(60));
      console.log('1. Go to: https://app.supabase.com/');
      console.log('2. Select your Botmantra project');
      console.log('3. Click "SQL Editor" in the left sidebar');
      console.log('4. Click "+ New Query"');
      console.log('5. Copy-paste the SQL from: migrations/20260203_create_ai_websites_table.sql');
      console.log('6. Click "Run" (or Ctrl+Enter)');
      console.log('7. Once done, come back here and run: npm run setup:website-builder');
      console.log('─'.repeat(60));
      console.log('\n📄 Alternative: Direct SQL copy\n');
      console.log(require('fs').readFileSync('./migrations/20260203_create_ai_websites_table.sql', 'utf8'));
      process.exit(0);
    } else if (!error) {
      console.log('✅ Table already exists and is accessible!');
      console.log('📊 Table status: READY');
      return;
    }

    console.log('⚠️ Error:', error.message);
  } catch (err) {
    console.log('Error:', err.message);
  }
}

createTable();
