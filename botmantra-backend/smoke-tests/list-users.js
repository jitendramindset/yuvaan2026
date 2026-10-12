require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY);

(async () => {
  try {
    console.log('📋 Fetching all users from database...\n');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(10);

    if (error) {
      console.error('❌ Query error:', error);
    } else {
      console.log('✅ Users found:', data?.length || 0);
      data?.forEach((u, i) => {
        console.log(`  [${i+1}] ID: ${u.id}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      Created: ${u.created_at}`);
        console.log('');
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
