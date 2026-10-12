require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('=== USER AUDIT ===\n');
  
  // Get all data
  const { data: users } = await supabase.from('users').select('id, email');
  const { data: bizUsers } = await supabase.from('business_users').select('user_id, business_id, role_id');
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  
  console.log('📊 Database Summary:');
  console.log('  Users table:', users?.length || 0, 'records');
  console.log('  Business_users table:', bizUsers?.length || 0, 'records');
  console.log('  Auth users:', authUsers?.length || 0, 'records\n');
  
  console.log('📋 Detailed Mapping:');
  authUsers?.forEach(auth => {
    const inUsers = users?.find(u => u.id === auth.id);
    const inBiz = bizUsers?.find(b => b.user_id === auth.id);
    
    const status = [];
    if (inUsers) status.push('users ✓');
    if (inBiz) status.push('business_users ✓');
    if (!inUsers && !inBiz) status.push('❌ NO MAPPING');
    
    console.log(`\n  ${auth.email}`);
    console.log(`    Auth ID: ${auth.id}`);
    console.log(`    Status: ${status.join(', ')}`);
    if (inBiz) console.log(`    Business: ${inBiz.business_id}`);
  });
  
  console.log('\n=== ISSUE ANALYSIS ===');
  const unmapped = authUsers?.filter(a => !bizUsers?.find(b => b.user_id === a.id)) || [];
  if (unmapped.length > 0) {
    console.log(`⚠️  ${unmapped.length} auth user(s) without business_users entry:`);
    unmapped.forEach(u => console.log(`    - ${u.email}`));
  } else {
    console.log('✅ All auth users have business_users entries');
  }
})();
