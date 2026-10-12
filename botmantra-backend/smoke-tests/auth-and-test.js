require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const baseUrl = process.env.KERNEL_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000';
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.ANON_KEY;

console.log('🔐 Authenticating with Supabase...');
console.log('📍 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, anonKey);

(async () => {
  try {
    // Step 1: Authenticate with email/password
    console.log('\n📧 Step 1: Signing in with email/password...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'prasadjitendra9@gmail.com',
      password: '123456'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      process.exit(1);
    }

    if (!authData.session) {
      console.error('❌ No session returned from authentication');
      process.exit(1);
    }

    const token = authData.session.access_token;
    const userId = authData.user.id;

    console.log('✅ Authentication successful!');
    console.log('   User ID:', userId);
    console.log('   Token:', token.substring(0, 20) + '...');

    // Step 2: Get user details and business association
    console.log('\n🏢 Step 2: Fetching user business association...');
    const supabaseAdmin = createClient(supabaseUrl, process.env.SERVICE_ROLE_KEY);

    const { data: businessUsers, error: buError } = await supabaseAdmin
      .from('business_users')
      .select('business_id')
      .eq('user_id', userId)
      .limit(1);

    let businessId = null;
    if (!buError && businessUsers && businessUsers.length > 0) {
      businessId = businessUsers[0].business_id;
      console.log('✅ Business found:', businessId);
    } else {
      console.log('⚠️  No business association found, fetching first business...');
      const { data: businesses } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .limit(1);
      if (businesses && businesses.length > 0) {
        businessId = businesses[0].id;
        console.log('✅ Using business:', businessId);
      }
    }

    // Step 3: Test /ui-bootstrap endpoint with auth token
    console.log('\n🌐 Step 3: Testing /ui-bootstrap endpoint...');
    const requestUrl = `${baseUrl}/ui-bootstrap`;
    const requestBody = {
      user_id: userId,
      business_id: businessId,
      device: 'web',
      screen: 'dashboard'
    };

    console.log('📤 POST:', requestUrl);
    console.log('📦 Body:', requestBody);
    console.log('🔑 Auth: Bearer token (from session)');

    try {
      const response = await axios.post(requestUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('\n✅ UI Bootstrap successful!');
      console.log('📊 Response status:', response.status);
      console.log('📦 Response keys:', Object.keys(response.data));

      if (response.data.layout) {
        console.log('✅ Layout:', typeof response.data.layout);
      }
      if (response.data.ui) {
        console.log('✅ UI Schema:', typeof response.data.ui);
      }
      if (response.data.permissions) {
        console.log('✅ Permissions:', typeof response.data.permissions);
      }
      if (response.data.theme) {
        console.log('✅ Theme:', typeof response.data.theme);
      }

      console.log('\n🎉 SMOKE TEST PASSED!');
      console.log('\n📄 Full Response:');
      console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');

    } catch (error) {
      if (error.response) {
        console.error('❌ Request failed with status:', error.response.status);
        console.error('   Response:', error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection refused - is the server running on', baseUrl, '?');
      } else {
        console.error('❌ Request error:', error.message);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
})();
