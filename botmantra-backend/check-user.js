require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
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
    console.log('✅ User ID:', userId);
    
    // Check users table
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('✅ User record:', userRecord ? 'EXISTS' : 'MISSING');
    if (userRecord) console.log('  -', userRecord);
    
    // Check business_users
    const { data: busUser, error: busError } = await supabase
      .from('business_users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('✅ Business user entry:', busUser ? 'EXISTS' : 'MISSING');
    if (busUser) console.log('  -', busUser);
    if (busError) console.log('  Error:', busError.code, busError.message);
    
    // Check businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*');
    
    console.log('✅ Total businesses:', businesses?.length || 0);
    if (businesses?.length) {
      console.log('  - First business:', businesses[0].id);
    }
    
    // Diagnosis
    console.log('\n=== DIAGNOSIS ===');
    if (!userRecord) {
      console.log('❌ Missing: users table record');
    }
    if (!busUser) {
      console.log('❌ Missing: business_users entry (THIS IS THE PROBLEM)');
      console.log('   Solution: Need to create business_users entry');
    }
    if (!businesses?.length) {
      console.log('❌ Missing: Any business');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUser();
