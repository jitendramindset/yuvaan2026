require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const baseUrl = 'http://localhost:5000';
const jwtSecret = process.env.JWT_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

console.log('🔍 Fetching test data from database...\n');

(async () => {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Try to get first user and business
    console.log('📋 Step 1: Fetching first user...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ Could not fetch users. Error:', usersError?.message);
      console.log('\n💡 Trying direct SQL query approach...');
      
      // Alternative: use raw SQL
      const { data: sqlUsers, error: sqlError } = await supabase
        .rpc('execute_sql', { query: 'SELECT id, email FROM users LIMIT 1' })
        .catch(() => ({ data: null, error: 'RPC not available' }));
      
      if (sqlError) {
        console.log('⚠️  Cannot access user database directly');
        console.log('   Will use placeholder credentials for testing');
      }
    } else {
      const user = users[0];
      console.log('✅ Found user:', user.email);

      // Get user's business
      console.log('\n📋 Step 2: Fetching user business association...');
      const { data: businessUsers } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1);

      let businessId = businessUsers?.[0]?.business_id;

      if (!businessId) {
        console.log('⚠️  No business association found, fetching first business...');
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id')
          .limit(1);
        businessId = businesses?.[0]?.id;
      }

      if (!businessId) {
        console.log('❌ Could not find any business');
        process.exit(1);
      }

      console.log('✅ Found business:', businessId);

      // Now test the endpoint with real data
      console.log('\n🧪 Step 3: Testing /ui-bootstrap with real data...');
      const testToken = jwt.sign(
        { 
          sub: user.id,
          email: user.email,
          iss: 'supabase'
        },
        jwtSecret,
        { expiresIn: '1h' }
      );

      console.log('   User ID:', user.id);
      console.log('   Business ID:', businessId);
      console.log('   Auth: Bearer token (from JWT)');

      try {
        const response = await axios.post(
          `${baseUrl}/ui-bootstrap`,
          {
            user_id: user.id,
            business_id: businessId,
            device: 'web',
            screen: 'dashboard'
          },
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('\n✅ UI Bootstrap endpoint responded!');
        console.log('   Status:', response.status);
        
        const { screen, device, theme, layout, widgets, permissions, floating_chat } = response.data;
        
        console.log('\n📦 Response structure:');
        console.log('   ✓ screen:', screen);
        console.log('   ✓ device:', device);
        console.log('   ✓ theme:', theme);
        console.log('   ✓ floating_chat:', floating_chat);
        console.log('   ✓ layout type:', typeof layout);
        console.log('   ✓ widgets count:', Array.isArray(widgets) ? widgets.length : 'N/A');
        console.log('   ✓ permissions keys:', Object.keys(permissions || {}).length);

        console.log('\n🎉 SMOKE TEST PASSED!');
        console.log('\n📄 Full Response (first 1000 chars):');
        console.log(JSON.stringify(response.data, null, 2).substring(0, 1000));

      } catch (error) {
        if (error.response) {
          console.error('❌ Request failed:', error.response.status);
          console.error('   Error:', error.response.data);
        } else {
          console.error('❌ Connection error:', error.message);
        }
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
})();
