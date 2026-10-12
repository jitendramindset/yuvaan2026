/**
 * 🧪 MANUAL CLASSIFIER TEST
 * Use this with a session token from your login
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// ⚠️ IMPORTANT: Get this from logging into your app or Postman
// Login via: POST http://localhost:5000/api/auth/login
// Body: { "email": "your@email.com", "password": "yourpassword" }
const SESSION_TOKEN = process.argv[2] || 'PASTE_YOUR_SESSION_TOKEN_HERE';

async function testClassifier() {
  console.log('\n🧪 MANUAL INTERACTION CLASSIFIER TEST\n');
  console.log('='.repeat(70));

  if (SESSION_TOKEN === 'PASTE_YOUR_SESSION_TOKEN_HERE') {
    console.log('\n❌ No session token provided!');
    console.log('\nUsage: node test-classifier-manual.js YOUR_SESSION_TOKEN');
    console.log('\nOr update SESSION_TOKEN in the file\n');
    console.log('To get a token:');
    console.log('1. Login via your app or Postman');
    console.log('2. Copy the session.access_token from response');
    console.log('3. Run: node test-classifier-manual.js "your_token_here"\n');
    return;
  }

  console.log(`\n🔐 Using token: ${SESSION_TOKEN.substring(0, 40)}...\n`);

  const tests = [
    'Hello',
    'Create a wallet card',
    'Show all users',
    'Go to settings',
    'Delete old data'
  ];

  console.log(`📝 Running ${tests.length} classification tests...\n`);
  console.log('='.repeat(70));

  for (const message of tests) {
    try {
      console.log(`\n💬 "${message}"`);
      
      const response = await axios.post(`${BASE_URL}/api/interaction/classify`, {
        message: message,
        session_token: SESSION_TOKEN,
        ui_context: { current_page: 'test', device: 'web' }
      });

      if (response.data.success) {
        const c = response.data.classification;
        console.log(`   Category: ${c.chat_category}`);
        console.log(`   Response Mode: ${c.response_mode}`);
        console.log(`   Confidence: ${(c.confidence * 100).toFixed(1)}%`);
        console.log(`   Security: ${c.security_flag}`);
        
        if (c.ui_actions?.length) console.log(`   UI Actions: [${c.ui_actions.join(', ')}]`);
        if (c.data_actions?.length) console.log(`   Data Actions: [${c.data_actions.join(', ')}]`);
        if (c.target_component) console.log(`   Target: ${c.target_component}`);
        
        console.log(`   ✅ SUCCESS`);
      }
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.data?.error || error.message}`);
      if (error.response?.data?.reason) {
        console.log(`   Reason: ${error.response.data.reason}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

testClassifier();
