/**
 * Manual user creation script
 * Run: node create-user.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  const email = 'mantravat@gmail.com';
  
  try {
    console.log('Finding user in Supabase auth...');
    
    // Get the user from Supabase auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    const authUser = users.find(u => u.email === email);
    
    if (!authUser) {
      console.error(`❌ User ${email} not found in Supabase auth`);
      console.log('Please sign up first on the login page');
      return;
    }
    
    const userId = authUser.id;
    console.log(`Found user in auth: ${userId}`);
    
    // Check if user record exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      console.log('✅ User record already exists');
    } else if (checkError && checkError.code === 'PGRST116') {
      // PGRST116 means no rows found - that's expected
      console.log('Creating user record...');
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: authUser.user_metadata?.full_name || email.split('@')[0],
          created_at: new Date().toISOString()
        });
      
      if (userError) {
        console.error('Error creating user record:', userError);
        return;
      }
      
      console.log('✅ User record created');
    } else if (checkError) {
      console.error('Error checking user:', checkError);
      return;
    }
    
    // Check if business exists
    let { data: business, error: bizCheckError } = await supabase
      .from('businesses')
      .select('id')
      .limit(1)
      .single();
    
    if (!business) {
      if (bizCheckError && bizCheckError.code === 'PGRST116') {
        // No businesses exist - create one
        console.log('Creating default business...');
        
        const { data: newBusiness, error: bizError } = await supabase
          .from('businesses')
          .insert({
            name: 'My Business',
            owner_id: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (bizError) {
          console.error('Error creating business:', bizError);
          return;
        }
        
        business = newBusiness;
        console.log('✅ Business created:', business.id);
      } else if (bizCheckError) {
        console.error('Error checking business:', bizCheckError);
        return;
      }
    } else {
      console.log('✅ Business already exists:', business.id);
    }
    
    // Check business_users entry
    const { data: busUser, error: busCheckError } = await supabase
      .from('business_users')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (busUser) {
      console.log('✅ Business user entry already exists');
    } else if (busCheckError && busCheckError.code === 'PGRST116') {
      // Entry doesn't exist - create it
      console.log('Creating business_users entry...');
      
      const { error: busUserError } = await supabase
        .from('business_users')
        .insert({
          user_id: userId,
          business_id: business.id,
          role_id: 'owner',
          joined_at: new Date().toISOString()
        });
      
      if (busUserError) {
        console.error('Error creating business_users:', busUserError);
        return;
      }
      
      console.log('✅ Business user entry created');
    } else if (busCheckError) {
      console.error('Error checking business_users:', busCheckError);
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ USER SETUP COMPLETE');
    console.log('='.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`User ID: ${userId}`);
    console.log(`Business ID: ${business.id}`);
    console.log('\nYou can now log in and access the dashboard!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

createUser();
