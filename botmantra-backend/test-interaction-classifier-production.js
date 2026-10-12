/**
 * 🧪 INTERACTION CLASSIFIER TEST SUITE
 * Production-grade tests for Node OS classifier
 * Tests: Session validation, intent classification, batch processing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_ENDPOINT = `${BASE_URL}/api/interaction/classify`;
const BATCH_ENDPOINT = `${BASE_URL}/api/interaction/classify-batch`;
const DOCS_ENDPOINT = `${BASE_URL}/api/interaction/intents`;

// ⚠️ IMPORTANT: Replace with valid session token from your auth system
const SESSION_TOKEN = 'YOUR_SESSION_TOKEN_HERE';

// Test message categories
const TEST_MESSAGES = {
  greetings: [
    "Hello",
    "Hi there!",
    "Good morning",
    "Hey"
  ],
  navigation: [
    "Go to dashboard",
    "Open settings page",
    "Show my profile",
    "Navigate to transactions"
  ],
  ui_creation: [
    "Create a wallet balance card",
    "Build a revenue dashboard",
    "Add a new data table for users",
    "Make a sales chart widget",
    "Create a profile form"
  ],
  data_read: [
    "Show all users",
    "Get my transaction history",
    "Display active orders",
    "Fetch wallet balance"
  ],
  data_write: [
    "Add a new user",
    "Create a transaction",
    "Insert new order"
  ],
  data_update: [
    "Update user email",
    "Change order status",
    "Modify wallet balance"
  ],
  data_delete: [
    "Delete old transactions",
    "Remove inactive users",
    "Drop archived orders"
  ],
  information: [
    "What is Node OS?",
    "How does the wallet work?",
    "Tell me about karma system"
  ]
};

// Test counters
let passed = 0;
let failed = 0;
const failedTests = [];

// ================================
// TEST FUNCTIONS
// ================================

async function testClassification(message, expectedIntent, category) {
  try {
    console.log(`\n📝 Testing: "${message}"`);
    
    const response = await axios.post(API_ENDPOINT, {
      message: message,
      session_token: SESSION_TOKEN,
      ui_context: {
        current_page: "dashboard",
        device: "web"
      }
    });

    if (!response.data.success) {
      console.log(`❌ FAILED: API returned error`);
      console.log(`   Error: ${response.data.error}`);
      failed++;
      failedTests.push({ message, error: response.data.error });
      return;
    }

    const classification = response.data.classification;
    
    console.log(`✅ Classification Result:`);
    console.log(`   Category: ${classification.chat_category}`);
    console.log(`   Data Actions: [${classification.data_actions.join(', ')}]`);
    console.log(`   UI Actions: [${classification.ui_actions.join(', ')}]`);
    console.log(`   Response Mode: ${classification.response_mode}`);
    console.log(`   Target: ${classification.target_component || 'none'}`);
    console.log(`   Security: ${classification.security_flag}`);
    console.log(`   Confidence: ${classification.confidence}`);
    console.log(`   Render from Core: ${classification.render_from_core}`);

    // Validate structure
    if (!classification.chat_category || !Array.isArray(classification.data_actions)) {
      console.log(`❌ FAILED: Invalid response structure`);
      failed++;
      failedTests.push({ message, error: 'Invalid structure' });
      return;
    }

    // Check node context
    if (!response.data.node_context || !response.data.node_context.node_id) {
      console.log(`⚠️  WARNING: Missing node context`);
    }

    passed++;
    console.log(`✅ PASSED`);

  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    failed++;
    failedTests.push({ message, error: error.message });
  }
}

async function testBatchClassification() {
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`🔄 TESTING BATCH CLASSIFICATION`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const messages = [
      { message: "Hello", context: {} },
      { message: "Create a dashboard", context: {} },
      { message: "Show users", context: {} }
    ];

    const response = await axios.post(BATCH_ENDPOINT, {
      messages: messages,
      session_token: SESSION_TOKEN
    });

    if (!response.data.success) {
      console.log(`❌ FAILED: Batch API returned error`);
      console.log(`   Error: ${response.data.error}`);
      failed++;
      return;
    }

    console.log(`✅ Batch processed ${response.data.count} messages`);
    console.log(`\nResults:`);
    
    response.data.classifications.forEach((classification, index) => {
      console.log(`\n${index + 1}. "${messages[index].message}"`);
      console.log(`   Category: ${classification.chat_category}`);
      console.log(`   Response Mode: ${classification.response_mode}`);
    });

    passed++;
    console.log(`\n✅ BATCH TEST PASSED`);

  } catch (error) {
    console.log(`❌ BATCH TEST FAILED: ${error.message}`);
    failed++;
  }
}

async function testIntentDocumentation() {
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📚 TESTING INTENT DOCUMENTATION`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const response = await axios.get(DOCS_ENDPOINT);

    if (!response.data.success) {
      console.log(`❌ FAILED: Docs endpoint returned error`);
      failed++;
      return;
    }

    const intents = response.data.intents;
    
    console.log(`✅ Intent Documentation Retrieved:\n`);
    console.log(`Chat Categories: ${intents.chat_categories.length}`);
    console.log(`Data Actions: ${intents.data_actions.length}`);
    console.log(`UI Actions: ${intents.ui_actions.length}`);
    console.log(`Response Modes: ${intents.response_modes.length}`);
    console.log(`Security Flags: ${intents.security_flags.length}`);

    passed++;
    console.log(`\n✅ DOCUMENTATION TEST PASSED`);

  } catch (error) {
    console.log(`❌ DOCUMENTATION TEST FAILED: ${error.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 INTERACTION CLASSIFIER TEST SUITE`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Session Token: ${SESSION_TOKEN.substring(0, 20)}...`);
  console.log(`\n`);

  // Test Greetings
  console.log(`\n${'='.repeat(60)}`);
  console.log(`👋 TESTING GREETINGS`);
  console.log(`${'='.repeat(60)}`);
  for (const message of TEST_MESSAGES.greetings.slice(0, 3)) {
    await testClassification(message, 'greeting', 'greetings');
  }

  // Test Navigation
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧭 TESTING NAVIGATION`);
  console.log(`${'='.repeat(60)}`);
  for (const message of TEST_MESSAGES.navigation.slice(0, 3)) {
    await testClassification(message, 'navigation', 'navigation');
  }

  // Test UI Creation
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎨 TESTING UI CREATION`);
  console.log(`${'='.repeat(60)}`);
  for (const message of TEST_MESSAGES.ui_creation.slice(0, 3)) {
    await testClassification(message, 'ui_creation', 'ui_creation');
  }

  // Test Data Read
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📖 TESTING DATA READ`);
  console.log(`${'='.repeat(60)}`);
  for (const message of TEST_MESSAGES.data_read.slice(0, 3)) {
    await testClassification(message, 'data_read', 'data_read');
  }

  // Test Data Write
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✍️ TESTING DATA WRITE`);
  console.log(`${'='.repeat(60)}`);
  for (const message of TEST_MESSAGES.data_write.slice(0, 2)) {
    await testClassification(message, 'data_write', 'data_write');
  }

  // Test Data Delete
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗑️ TESTING DATA DELETE`);
  console.log(`${'='.repeat(60)}`);
  for (const message of TEST_MESSAGES.data_delete.slice(0, 2)) {
    await testClassification(message, 'data_delete', 'data_delete');
  }

  // Test Batch Classification
  await testBatchClassification();

  // Test Documentation
  await testIntentDocumentation();

  // Print Results
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 TEST RESULTS`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);

  if (failedTests.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. "${test.message}" - ${test.error}`);
    });
  }

  console.log(`\n${'='.repeat(60)}\n`);
}

// ================================
// RUN TESTS
// ================================

console.log(`\n⚠️  NOTE: Update SESSION_TOKEN before running tests!\n`);

if (SESSION_TOKEN === 'YOUR_SESSION_TOKEN_HERE') {
  console.log(`❌ ERROR: Please set a valid SESSION_TOKEN in the test file`);
  console.log(`\nTo get a session token:`);
  console.log(`1. Login via /api/auth/login endpoint`);
  console.log(`2. Copy the session token from response`);
  console.log(`3. Update SESSION_TOKEN variable in this file`);
  process.exit(1);
}

runAllTests().catch(error => {
  console.error(`\n❌ Test suite error:`, error);
  process.exit(1);
});
