require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUser() {
  const email = 'mantravat@gmail.com';
  
  try {
    // Get user from auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    
    if (!authUser) {
      console.log('❌ User not found in auth');
      return;
    }
    
    const userId = authUser.id;
    console.log('Found user ID:', userId);
    
    // 1. Create user record if missing
    console.log('\n1️⃣  Creating user record...');
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: authUser.user_metadata?.full_name || 'User',
        created_at: new Date().toISOString()
      });
    
    if (userError) {
      if (userError.code === '23505') {
        console.log('   ℹ️  User record already exists');
      } else {
        console.error('   ❌ Error:', userError.message);
        return;
      }
    } else {
      console.log('   ✅ User record created');
    }
    
    // 2. Get first business
    console.log('\n2️⃣  Getting business...');
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);
    
    const businessId = businesses?.[0]?.id;
    if (!businessId) {
      console.error('   ❌ No business found');
      return;
    }
    console.log('   ✅ Business ID:', businessId);
    
    // 3. Create business_users entry
    console.log('\n3️⃣  Creating business_users entry...');
    const { error: busError } = await supabase
      .from('business_users')
      .insert({
        user_id: userId,
        business_id: businessId,
        role_id: 'owner'
      });
    
    if (busError) {
      if (busError.code === '23505') {
        console.log('   ℹ️  business_users entry already exists');
      } else {
        console.error('   ❌ Error:', busError.message);
        return;
      }
    } else {
      console.log('   ✅ business_users entry created');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ USER SETUP COMPLETE');
    console.log('='.repeat(50));
    console.log('User email:', email);
    console.log('User ID:', userId);
    console.log('Business ID:', businessId);
    console.log('\nYou can now log in and access the dashboard!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

fixUser();
