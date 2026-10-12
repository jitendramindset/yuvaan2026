/**
 * ═══════════════════════════════════════════════════════════════
 * INTERACTION CLASSIFIER - TEST SUITE
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test Messages with Expected Classifications
const testMessages = [
  // Greetings
  { message: 'Hello', expected: 'greeting' },
  { message: 'Hi there!', expected: 'greeting' },
  { message: 'Good morning', expected: 'greeting' },

  // Navigation
  { message: 'Go to dashboard', expected: 'navigation' },
  { message: 'Open settings page', expected: 'navigation' },
  { message: 'Show my profile', expected: 'navigation' },

  // UI Creation
  { message: 'Create a sales dashboard', expected: 'ui_creation' },
  { message: 'Build a user table widget', expected: 'ui_creation' },
  { message: 'Add a chart for revenue', expected: 'ui_creation' },
  { message: 'Make a form for customer data', expected: 'ui_creation' },

  // Data Read
  { message: 'Show all users', expected: 'data_read' },
  { message: 'Get list of orders', expected: 'data_read' },
  { message: 'Fetch customer records', expected: 'data_read' },
  { message: 'Display product inventory', expected: 'data_read' },

  // Data Write
  { message: 'Add a new user', expected: 'data_write' },
  { message: 'Create new order', expected: 'data_write' },
  { message: 'Insert customer record', expected: 'data_write' },

  // Data Update
  { message: 'Update user email', expected: 'data_update' },
  { message: 'Change order status', expected: 'data_update' },
  { message: 'Modify product price', expected: 'data_update' },

  // Data Delete
  { message: 'Delete user account', expected: 'data_delete' },
  { message: 'Remove old orders', expected: 'data_delete' },
  { message: 'Drop test table', expected: 'data_delete' },

  // Information
  { message: 'What is Node OS?', expected: 'information' },
  { message: 'Tell me about karma system', expected: 'information' },
  { message: 'How does the UI builder work?', expected: 'information' }
];

/**
 * Run Single Classification Test
 */
async function testClassification(testCase) {
  try {
    const response = await axios.post(`${API_BASE}/api/interaction/classify`, {
      message: testCase.message,
      context: { test: true }
    });

    const classification = response.data.classification;
    const isCorrect = classification.intent === testCase.expected;

    console.log(`\n📝 Message: "${testCase.message}"`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got: ${classification.intent}`);
    console.log(`   Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
    console.log(`   Data Action: ${classification.data_action || 'none'}`);
    console.log(`   UI Action: ${classification.ui_action || 'none'}`);
    console.log(`   Response Mode: ${classification.response_mode}`);
    console.log(`   Security: ${classification.security_flag}`);
    console.log(`   ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);

    return { isCorrect, classification, testCase };

  } catch (error) {
    console.error(`❌ Error testing "${testCase.message}":`, error.message);
    return { isCorrect: false, error: error.message, testCase };
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 INTERACTION CLASSIFIER TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════');

  const results = [];

  for (const testCase of testMessages) {
    const result = await testClassification(testCase);
    results.push(result);
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Calculate statistics
  const passed = results.filter(r => r.isCorrect).length;
  const failed = results.length - passed;
  const accuracy = (passed / results.length) * 100;

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Show failed tests
  const failedTests = results.filter(r => !r.isCorrect);
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(({ testCase, classification }) => {
      console.log(`  - "${testCase.message}"`);
      console.log(`    Expected: ${testCase.expected}, Got: ${classification?.intent || 'error'}`);
    });
  }
}

/**
 * Test Batch Classification
 */
async function testBatchClassification() {
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('🔄 BATCH CLASSIFICATION TEST');
  console.log('═══════════════════════════════════════════════════════════════');

  const batchMessages = testMessages.slice(0, 5).map(t => ({ message: t.message }));

  try {
    const response = await axios.post(`${API_BASE}/api/interaction/classify-batch`, {
      messages: batchMessages
    });

    console.log(`\nBatch Size: ${response.data.count}`);
    console.log('Results:');
    response.data.classifications.forEach((c, i) => {
      console.log(`  ${i + 1}. "${batchMessages[i].message}" → ${c.intent} (${(c.confidence * 100).toFixed(0)}%)`);
    });

    console.log('\n✅ Batch classification successful');

  } catch (error) {
    console.error('❌ Batch classification failed:', error.message);
  }
}

/**
 * Test Intent Documentation Endpoint
 */
async function testIntentDocumentation() {
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📚 INTENT DOCUMENTATION TEST');
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    const response = await axios.get(`${API_BASE}/api/interaction/intents`);
    
    console.log('\nSupported Intents:');
    Object.entries(response.data.intents).forEach(([intent, config]) => {
      console.log(`\n  ${intent}:`);
      console.log(`    Description: ${config.description}`);
      console.log(`    Action: ${config.action}`);
      console.log(`    Examples: ${config.examples.join(', ')}`);
    });

    console.log('\n✅ Intent documentation retrieved');

  } catch (error) {
    console.error('❌ Documentation retrieval failed:', error.message);
  }
}

/**
 * Main Test Runner
 */
async function main() {
  console.log('\n🚀 Starting Interaction Classifier Tests...\n');
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  await runAllTests();
  await testBatchClassification();
  await testIntentDocumentation();

  console.log('\n\n✅ All tests completed!\n');
}

// Run tests
main().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
