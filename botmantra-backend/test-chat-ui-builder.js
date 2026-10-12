/**
 * Test script for BotMantra AI Chat UI Builder
 * Tests the /api/botmantra-ai/chat endpoint with various widget types
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test cases for different widget types
const testCases = [
  {
    name: 'Instagram Profile',
    message: 'Show me an Instagram profile',
    expectedType: 'profile'
  },
  {
    name: 'Dashboard Stats',
    message: 'Create dashboard with analytics',
    expectedType: 'stats'
  },
  {
    name: 'Data Table',
    message: 'Show a data table',
    expectedType: 'table'
  },
  {
    name: 'Bar Chart',
    message: 'Add a bar chart for analytics',
    expectedType: 'chart'
  },
  {
    name: 'Contact Form',
    message: 'Create a contact form with name, email, phone',
    expectedType: 'input'
  }
];

async function testChatEndpoint(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${testCase.name}`);
  console.log(`📝 Message: "${testCase.message}"`);
  console.log(`${'='.repeat(60)}`);

  try {
    const response = await axios.post(
      `${API_URL}/api/botmantra-ai/chat`,
      {
        message: testCase.message,
        context: {
          currentWidgets: [],
          screenTitle: 'Test Dashboard',
          user: 'test-user'
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const data = response.data;

    console.log('\n✅ Response received!');
    console.log('\n📊 Response Structure:');
    console.log(JSON.stringify({
      success: data.success,
      hasFramework: !!data.framework,
      hasComponents: !!data.framework?.components,
      componentCount: data.framework?.components?.length || 0,
      message: data.message,
      hasSuggestions: !!data.suggestions,
      suggestionCount: data.suggestions?.length || 0
    }, null, 2));

    if (data.framework?.components) {
      console.log('\n🎨 Generated Components:');
      data.framework.components.forEach((comp, idx) => {
        console.log(`  ${idx + 1}. Type: ${comp.type || comp.widget || 'unknown'}`);
        console.log(`     ID: ${comp.id}`);
        if (comp.title) console.log(`     Title: ${comp.title}`);
        if (comp.name) console.log(`     Name: ${comp.name}`);
        if (comp.label) console.log(`     Label: ${comp.label}`);
        if (comp.fields) console.log(`     Fields: ${comp.fields.length}`);
        if (comp.stats) console.log(`     Stats: ${JSON.stringify(comp.stats)}`);
      });

      // Verify expected type
      const actualTypes = data.framework.components.map(c => c.type || c.widget);
      const hasExpectedType = actualTypes.some(t => t === testCase.expectedType);
      
      if (hasExpectedType) {
        console.log(`\n✅ PASS: Found expected widget type "${testCase.expectedType}"`);
      } else {
        console.log(`\n⚠️  WARNING: Expected "${testCase.expectedType}", got: ${actualTypes.join(', ')}`);
      }
    }

    if (data.suggestions) {
      console.log('\n💡 Suggestions:');
      data.suggestions.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s}`);
      });
    }

    console.log('\n📝 AI Message:');
    console.log(data.message || data.response);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting BotMantra AI Chat UI Builder Tests...\n');
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  
  for (const testCase of testCases) {
    await testChatEndpoint(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All tests completed!');
  console.log(`${'='.repeat(60)}\n`);
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { testChatEndpoint, runAllTests };
