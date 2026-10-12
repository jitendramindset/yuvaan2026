require('dotenv').config();
const axios = require('axios');

const baseUrl = process.env.KERNEL_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000';

console.log('🧪 Testing /ui-bootstrap endpoint...\n');
console.log('📍 Server URL:', baseUrl);

(async () => {
  try {
    // Test 1: Check if server is running
    console.log('\n1️⃣  Testing server health...');
    try {
      const healthResponse = await axios.get(`${baseUrl}/health`);
      console.log('✅ Server is running');
    } catch (err) {
      console.log('❌ Server not responding at', baseUrl);
      console.log('   Make sure the backend is running: npm run dev');
      process.exit(1);
    }

    // Test 2: Call /ui-bootstrap without auth (should fail with 401)
    console.log('\n2️⃣  Testing /ui-bootstrap without auth...');
    try {
      const response = await axios.post(`${baseUrl}/ui-bootstrap`, {
        device: 'web',
        screen: 'dashboard'
      });
      console.log('⚠️  Endpoint returned 200 (no auth required)');
      console.log('   Response:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint correctly requires authentication (401)');
        console.log('   Message:', error.response.data?.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
        console.log('   Data:', error.response?.data);
      }
    }

    // Test 3: Call /ui-bootstrap with a test token
    console.log('\n3️⃣  Testing /ui-bootstrap with mock token...');
    const jwtSecret = process.env.JWT_SECRET;
    const jwt = require('jsonwebtoken');
    
    const testUserId = 'test-user-123';
    const testToken = jwt.sign(
      { 
        sub: testUserId,
        email: 'test@example.com',
        iss: 'supabase'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    console.log('   Generated test token:', testToken.substring(0, 30) + '...');

    try {
      const response = await axios.post(
        `${baseUrl}/ui-bootstrap`,
        {
          user_id: testUserId,
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
      console.log('✅ UI Bootstrap endpoint responded!');
      console.log('   Status:', response.status);
      console.log('   Response keys:', Object.keys(response.data));
      console.log('\n📦 Response structure:');
      if (response.data.layout) console.log('   ✓ layout:', typeof response.data.layout);
      if (response.data.ui) console.log('   ✓ ui:', typeof response.data.ui);
      if (response.data.widgets) console.log('   ✓ widgets:', typeof response.data.widgets);
      if (response.data.permissions) console.log('   ✓ permissions:', typeof response.data.permissions);
      if (response.data.theme) console.log('   ✓ theme:', typeof response.data.theme);
      
      console.log('\n🎉 SMOKE TEST PASSED!');
    } catch (error) {
      if (error.response) {
        console.log('❌ Request failed with status:', error.response.status);
        console.log('   Error:', error.response.data);
      } else {
        console.log('❌ Request error:', error.message);
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
})();
