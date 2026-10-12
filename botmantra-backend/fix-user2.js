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
    
    // 1. Get or create user record
    console.log('\n1️⃣  Checking user record...');
    let { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!userRecord) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: authUser.user_metadata?.full_name || 'User'
        });
      
      if (userError) {
        console.error('   ❌ Error creating user:', userError.message);
        return;
      }
      console.log('   ✅ User record created');
    } else {
      console.log('   ✅ User record exists');
    }
    
    // 2. Get business
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
    
    // 3. Get a role ID
    console.log('\n3️⃣  Getting role ID...');
    const { data: roles } = await supabase
      .from('roles')
      .select('id')
      .limit(1);
    
    let roleId = roles?.[0]?.id;
    if (!roleId) {
      // Try common role IDs
      console.log('   ℹ️  No roles found, trying default...');
      roleId = 'user'; // This might be wrong, but let's try
    }
    console.log('   ✅ Role ID:', roleId);
    
    // 4. Create business_users entry
    console.log('\n4️⃣  Creating business_users entry...');
    const { error: busError } = await supabase
      .from('business_users')
      .insert({
        user_id: userId,
        business_id: businessId,
        role_id: roleId
      });
    
    if (busError) {
      if (busError.code === '23505') {
        console.log('   ℹ️  business_users entry already exists');
      } else {
        console.error('   ❌ Error:', busError.message);
        console.error('   Full error:', busError);
        return;
      }
    } else {
      console.log('   ✅ business_users entry created');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ USER SETUP COMPLETE');
    console.log('='.repeat(50));
    console.log('Email:', email);
    console.log('User ID:', userId);
    console.log('Business ID:', businessId);
    console.log('Role ID:', roleId);
    console.log('\nTry logging in now!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

fixUser();
