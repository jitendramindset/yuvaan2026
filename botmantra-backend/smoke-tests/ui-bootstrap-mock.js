require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const baseUrl = 'http://localhost:5000';
const jwtSecret = process.env.JWT_SECRET;

console.log('🧪 Testing /ui-bootstrap endpoint with mock user\n');

(async () => {
  try {
    // Generate a JWT token with a fake but valid user ID
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';  // Random UUID format
    const testBusinessId = '660e8400-e29b-41d4-a716-446655440001';  // Random UUID format
    
    const testToken = jwt.sign(
      { 
        sub: testUserId,
        email: 'test@botmantra.dev',
        iss: 'supabase',
        aud: 'authenticated'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    console.log('✅ Generated test JWT');
    console.log('   User ID:', testUserId);
    console.log('   Business ID:', testBusinessId);
    console.log('   Token:', testToken.substring(0, 40) + '...\n');

    // Test the endpoint
    console.log('📤 Sending POST /ui-bootstrap request...');
    
    try {
      const response = await axios.post(
        `${baseUrl}/ui-bootstrap`,
        {
          user_id: testUserId,
          business_id: testBusinessId,
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

      console.log('\n✅ SUCCESS! UI Bootstrap endpoint responded!\n');
      console.log('📊 Response Status:', response.status);
      console.log('📦 Response Keys:', Object.keys(response.data).join(', '));
      
      const { screen, device, theme, layout, widgets, permissions, floating_chat, status } = response.data;
      
      if (status === 'error') {
        console.log('\n⚠️  Response indicates error:');
        console.log('   Code:', response.data.code);
        console.log('   Message:', response.data.message);
      } else {
        console.log('\n📋 Response Details:');
        console.log('   screen:', screen);
        console.log('   device:', device);
        console.log('   theme:', theme);
        console.log('   floating_chat:', floating_chat);
        
        if (layout) {
          console.log('   layout:', {
            type: typeof layout,
            keys: typeof layout === 'object' ? Object.keys(layout).slice(0, 5) : 'N/A'
          });
        }
        
        if (widgets) {
          console.log('   widgets:', {
            type: typeof widgets,
            count: Array.isArray(widgets) ? widgets.length : 'N/A'
          });
        }
        
        if (permissions) {
          console.log('   permissions:', {
            type: typeof permissions,
            keys: typeof permissions === 'object' ? Object.keys(permissions).length : 'N/A'
          });
        }

        console.log('\n🎉 SMOKE TEST PASSED!');
      }

      console.log('\n📄 Full Response:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
      if (error.response) {
        console.error('❌ Request failed with status:', error.response.status);
        console.error('   Error Code:', error.response.data?.code);
        console.error('   Error Message:', error.response.data?.message);
        console.error('\n📄 Full Error Response:');
        console.error(JSON.stringify(error.response.data, null, 2));
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection refused - is the server running on', baseUrl, '?');
        console.error('   Run: npm run dev');
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
