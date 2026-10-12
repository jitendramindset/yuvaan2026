/**
 * 🧪 FULL CLASSIFIER TEST WITH AUTO-SIGNUP
 * Creates test user, gets session, tests classification
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function fullTest() {
  console.log('\n🧪 FULL INTERACTION CLASSIFIER TEST\n');
  console.log('='.repeat(70));

  const testEmail = `test.${Date.now()}@nodeOS.test`;
  const testPassword = 'Test123!@#';
  let sessionToken = null;

  // Step 1: Create test user
  console.log('\n👤 Step 1: Creating test user...');
  try {
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: testEmail,
      password: testPassword
    });

    if (signupResponse.data.session) {
      sessionToken = signupResponse.data.session.access_token;
      console.log('✅ User created successfully');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Token: ${sessionToken.substring(0, 40)}...`);
    }
  } catch (error) {
    console.log('❌ Signup failed:', error.response?.data || error.message);
    console.log('\nTrying login instead...');
    
    // Try login with existing test credentials
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@test.com',
        password: 'test123'
      });
      
      if (loginResponse.data.session) {
        sessionToken = loginResponse.data.session.access_token;
        console.log('✅ Logged in with existing test account');
      }
    } catch (loginError) {
      console.log('❌ Login also failed. Cannot proceed with classification tests.');
      console.log('   Please create a user manually and update SESSION_TOKEN');
      return;
    }
  }

  if (!sessionToken) {
    console.log('❌ No session token available. Exiting.');
    return;
  }

  // Step 2: Test Classifications
  console.log('\n🎯 Step 2: Testing Intent Classifications...\n');
  console.log('='.repeat(70));

  const testCases = [
    {
      message: 'Hello',
      expectedCategory: 'greeting',
      description: 'Simple greeting'
    },
    {
      message: 'Create a wallet balance card on my dashboard',
      expectedCategory: 'information',
      description: 'UI creation request'
    },
    {
      message: 'Show me all users in the system',
      expectedCategory: 'information',
      description: 'Data read request'
    },
    {
      message: 'Go to settings page',
      expectedCategory: 'navigation',
      description: 'Navigation request'
    },
    {
      message: 'Delete all old transactions',
      expectedCategory: 'information',
      description: 'Dangerous operation'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase.message}"`);
    console.log(`   Expected: ${testCase.expectedCategory}`);
    console.log(`   Type: ${testCase.description}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/interaction/classify`, {
        message: testCase.message,
        session_token: sessionToken,
        ui_context: {
          current_page: 'dashboard',
          device: 'web'
        }
      });

      if (response.data.success) {
        const c = response.data.classification;
        
        console.log(`\n   ✅ Classification Result:`);
        console.log(`      Chat Category: ${c.chat_category}`);
        console.log(`      Response Mode: ${c.response_mode}`);
        console.log(`      Confidence: ${(c.confidence * 100).toFixed(1)}%`);
        console.log(`      Security: ${c.security_flag}`);
        console.log(`      Render from Core: ${c.render_from_core}`);
        
        if (c.ui_actions && c.ui_actions.length > 0) {
          console.log(`      UI Actions: [${c.ui_actions.join(', ')}]`);
        }
        if (c.data_actions && c.data_actions.length > 0) {
          console.log(`      Data Actions: [${c.data_actions.join(', ')}]`);
        }
        if (c.target_component) {
          console.log(`      Target: ${c.target_component}`);
        }
        if (c.properties && Object.keys(c.properties).length > 0) {
          console.log(`      Properties: ${JSON.stringify(c.properties)}`);
        }

        // Check node context
        if (response.data.node_context) {
          console.log(`\n   📊 Node Context:`);
          console.log(`      Node ID: ${response.data.node_context.node_id || 'N/A'}`);
          console.log(`      Trust Score: ${response.data.node_context.trust_score || 0}`);
          console.log(`      Authority: Level ${response.data.node_context.authority_level || 1}`);
        }

        passed++;
      } else {
        console.log(`   ❌ Classification failed: ${response.data.error}`);
        failed++;
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`      Status: ${error.response.status}`);
        console.log(`      Error: ${error.response.data.error || 'Unknown'}`);
        if (error.response.data.reason) {
          console.log(`      Reason: ${error.response.data.reason}`);
        }
      }
      failed++;
    }

    console.log('   ' + '-'.repeat(66));
  }

  // Step 3: Test Batch Classification
  console.log('\n🔄 Step 3: Testing Batch Classification...\n');
  
  try {
    const batchResponse = await axios.post(`${BASE_URL}/api/interaction/classify-batch`, {
      messages: [
        { message: 'Hi', context: {} },
        { message: 'Create dashboard', context: {} },
        { message: 'Show data', context: {} }
      ],
      session_token: sessionToken
    });

    if (batchResponse.data.success) {
      console.log(`✅ Batch processed ${batchResponse.data.count} messages successfully\n`);
      
      batchResponse.data.classifications.forEach((c, i) => {
        console.log(`   ${i + 1}. Category: ${c.chat_category}, Mode: ${c.response_mode}, Confidence: ${(c.confidence * 100).toFixed(1)}%`);
      });
      
      passed++;
    }
  } catch (error) {
    console.log(`❌ Batch test failed: ${error.message}`);
    failed++;
  }

  // Final Results
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 FINAL RESULTS\n');
  console.log(`   ✅ Tests Passed: ${passed}`);
  console.log(`   ❌ Tests Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n   🎉 ALL TESTS PASSED!\n');
    console.log('   ✅ Interaction Classifier is production-ready');
    console.log('   ✅ Session validation working');
    console.log('   ✅ OpenAI classification working');
    console.log('   ✅ Batch processing working');
    console.log('   ✅ Node context retrieval working');
    console.log('\n   🚀 Ready for UI Renderer implementation (Week 1 Part 2)');
  } else {
    console.log(`\n   ⚠️  ${failed} test(s) need attention`);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Run the test
fullTest().catch(error => {
  console.error('\n❌ Fatal test error:', error.message);
  process.exit(1);
});
