/**
 * API Test Suite - Version 1
 * Comprehensive tests for all API endpoints
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN;

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

// Test helper
async function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await testFn();
    testResults.passed.push(name);
    console.log(`   ✅ PASSED`);
    return true;
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    console.log(`   ❌ FAILED: ${error.message}`);
    return false;
  }
}

// HTTP helper
async function apiCall(method, endpoint, data = null, headers = {}) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    if (method === 'GET') {
      config.params = data;
    } else {
      config.data = data;
    }
  }

  const response = await axios(config);
  return response.data;
}

// ============================================
// TEST SUITES
// ============================================

async function testHealthCheck() {
  await runTest('Health Check', async () => {
    const result = await apiCall('GET', '/health', null, {});
    if (!result.status || result.status !== 'healthy') {
      throw new Error('Health check failed');
    }
  });
}

async function testBusinessManagement() {
  console.log('\n📦 BUSINESS MANAGEMENT TESTS');
  
  let businessId;

  await runTest('Register Business', async () => {
    const result = await apiCall('POST', '/business/register', {
      name: 'Test Business',
      description: 'Test business description',
      industry: 'Technology',
      category: 'Software',
      business_size: 'Small',
      module_selection: { crm: true }
    });

    if (!result.data) {
      throw new Error('No business ID returned');
    }
    businessId = result.data;
  });

  if (businessId) {
    await runTest('Initialize Business', async () => {
      const result = await apiCall('POST', `/business/${businessId}/initialize`);
      
      if (!result.success) {
        throw new Error('Business initialization failed');
      }
    });
  } else {
    testResults.skipped.push('Initialize Business - No business ID');
  }
}

async function testGenericDataAPI() {
  console.log('\n📊 GENERIC DATA API TESTS');

  const testBusinessId = process.env.TEST_BUSINESS_ID;
  const testRoleId = process.env.TEST_ROLE_ID;

  if (!testBusinessId || !testRoleId) {
    console.log('   ⚠️  Skipping - TEST_BUSINESS_ID or TEST_ROLE_ID not set');
    testResults.skipped.push('Generic Data API tests');
    return;
  }

  await runTest('Generic GET - List Data', async () => {
    const result = await apiCall('GET', '/data/list_clients', {
      business_id: testBusinessId,
      role_id: testRoleId,
      limit: 10,
      offset: 0
    });

    if (!result.data) {
      throw new Error('No data returned');
    }
  });

  await runTest('Generic POST - Create Data', async () => {
    const result = await apiCall('POST', '/data/create_client', {
      business_id: testBusinessId,
      role_id: testRoleId,
      payload: {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '1234567890'
      }
    });

    if (!result.data) {
      throw new Error('No data returned from create');
    }
  });
}

async function testAIRoutes() {
  console.log('\n🤖 AI & RAG TESTS');

  const testBusinessId = process.env.TEST_BUSINESS_ID;

  if (!testBusinessId) {
    console.log('   ⚠️  Skipping - TEST_BUSINESS_ID not set');
    testResults.skipped.push('AI Routes tests');
    return;
  }

  await runTest('Generate Embedding', async () => {
    const result = await apiCall('POST', '/ai/embedding', {
      text: 'This is a test sentence for embedding generation'
    });

    if (!result.embedding || !Array.isArray(result.embedding)) {
      throw new Error('Invalid embedding format');
    }
  });

  await runTest('Chunk Text', async () => {
    const result = await apiCall('POST', '/ai/chunk-text', {
      text: 'A'.repeat(2000), // Long text
      chunk_size: 500
    });

    if (!result.chunks || !Array.isArray(result.chunks)) {
      throw new Error('Invalid chunks format');
    }
  });

  await runTest('Build AI Prompt', async () => {
    const result = await apiCall('POST', '/ai/prompt', {
      nid: 'test_nid_hash',
      user_prompt: 'What is the weather today?'
    });

    if (!result.prompt) {
      throw new Error('No prompt returned');
    }
  });
}

async function testQueryBuilder() {
  console.log('\n🔍 QUERY BUILDER TESTS');

  const testBusinessId = process.env.TEST_BUSINESS_ID;

  if (!testBusinessId) {
    console.log('   ⚠️  Skipping - TEST_BUSINESS_ID not set');
    testResults.skipped.push('Query Builder tests');
    return;
  }

  await runTest('Build Template Query', async () => {
    const result = await apiCall('POST', '/query/template', {
      template_code: 'default',
      table_name: 'clients',
      business_id: testBusinessId,
      filters: { status: 'active' }
    });

    if (!result.query) {
      throw new Error('No query returned');
    }
  });

  await runTest('Generate Dynamic Query', async () => {
    const result = await apiCall('POST', '/query/dynamic', {
      template_code: 'default',
      business_id: testBusinessId,
      filters: {}
    });

    if (!result.query) {
      throw new Error('No query returned');
    }
  });
}

async function testPermissions() {
  console.log('\n🔒 PERMISSION & SECURITY TESTS');

  const testBusinessId = process.env.TEST_BUSINESS_ID;
  const testUserId = process.env.TEST_USER_ID;

  if (!testBusinessId || !testUserId) {
    console.log('   ⚠️  Skipping - TEST_BUSINESS_ID or TEST_USER_ID not set');
    testResults.skipped.push('Permission tests');
    return;
  }

  await runTest('Check Action Permission', async () => {
    const result = await apiCall('POST', '/permission/check', {
      business_id: testBusinessId,
      user_id: testUserId,
      table: 'clients',
      action: 'read'
    });

    if (typeof result.allowed !== 'boolean') {
      throw new Error('Invalid permission check result');
    }
  });

  await runTest('Check Feature Access', async () => {
    const result = await apiCall('POST', '/feature/check', {
      business_id: testBusinessId,
      feature_key: 'ai_assistant'
    });

    if (typeof result.allowed !== 'boolean') {
      throw new Error('Invalid feature access result');
    }
  });
}

async function testNodeSystem() {
  console.log('\n🌐 NODE SYSTEM TESTS');

  await runTest('Generate Node Hash', async () => {
    const result = await apiCall('POST', '/node/generate-hash', {
      owner_uuid: '00000000-0000-0000-0000-000000000000'
    });

    if (!result.hash || typeof result.hash !== 'string') {
      throw new Error('Invalid hash format');
    }
  });

  await runTest('Create Runtime Session', async () => {
    try {
      const result = await apiCall('POST', '/node/session', {
        nid: 'test_nid',
        device: 'test_device',
        ip: '127.0.0.1'
      });

      if (!result.session_id) {
        throw new Error('No session ID returned');
      }
    } catch (error) {
      // May fail if node doesn't exist - that's ok for test
      if (!error.message.includes('node')) {
        throw error;
      }
    }
  });

  await runTest('Apply Karma', async () => {
    try {
      await apiCall('POST', '/node/karma', {
        nid_hash: 'test_nid_hash',
        actor: '00000000-0000-0000-0000-000000000000',
        karma_delta: 10,
        trust_delta: 5,
        reason: 'Test karma application'
      });
    } catch (error) {
      // May fail if node doesn't exist - that's ok for test
      if (!error.message.includes('node')) {
        throw error;
      }
    }
  });
}

async function testUIRoutes() {
  console.log('\n🎨 UI ROUTES TESTS');

  const testBusinessId = process.env.TEST_BUSINESS_ID;
  const testUserId = process.env.TEST_USER_ID;
  const testRoleId = process.env.TEST_ROLE_ID;

  if (!testBusinessId) {
    console.log('   ⚠️  Skipping - TEST_BUSINESS_ID not set');
    testResults.skipped.push('UI Routes tests');
    return;
  }

  await runTest('Get Branding', async () => {
    const result = await apiCall('GET', `/ui/branding/${testBusinessId}`);
    
    // Result may be null if no branding set - that's ok
    if (result.error) {
      throw new Error(result.error);
    }
  });

  if (testUserId && testRoleId) {
    await runTest('Get UI Schema', async () => {
      const result = await apiCall('GET', '/ui/schema', {
        business_id: testBusinessId,
        template_code: 'default',
        table_name: 'clients',
        role_id: testRoleId
      });

      if (result.error) {
        throw new Error(result.error);
      }
    });

    await runTest('Get UI Context', async () => {
      const result = await apiCall('GET', '/ui/context', {
        user_id: testUserId,
        business_id: testBusinessId
      });

      if (result.error) {
        throw new Error(result.error);
      }
    });
  } else {
    testResults.skipped.push('Get UI Schema - No TEST_USER_ID or TEST_ROLE_ID');
    testResults.skipped.push('Get UI Context - No TEST_USER_ID');
  }
}

async function testCacheRoutes() {
  console.log('\n💾 CACHE ROUTES TESTS');

  const testBusinessId = process.env.TEST_BUSINESS_ID;
  const testRoleId = process.env.TEST_ROLE_ID;

  if (!testBusinessId || !testRoleId) {
    console.log('   ⚠️  Skipping - TEST_BUSINESS_ID or TEST_ROLE_ID not set');
    testResults.skipped.push('Cache Routes tests');
    return;
  }

  await runTest('Generate Cache Key', async () => {
    const result = await apiCall('POST', '/cache/generate-key', {
      template: 'default',
      table: 'clients',
      role_id: testRoleId,
      filters: {},
      sort: 'name',
      limit: 20,
      offset: 0
    });

    if (!result.cache_key) {
      throw new Error('No cache key returned');
    }
  });
}

async function testUtilityRoutes() {
  console.log('\n🔧 UTILITY ROUTES TESTS');

  await runTest('Encrypt/Decrypt Payload', async () => {
    const testPayload = { secret: 'test data', value: 123 };
    const testSecret = 'test_secret_key_12345';

    // Encrypt
    const encryptResult = await apiCall('POST', '/util/encrypt', {
      payload: testPayload,
      secret: testSecret
    });

    if (!encryptResult.encrypted) {
      throw new Error('No encrypted data returned');
    }

    // Decrypt
    const decryptResult = await apiCall('POST', '/util/decrypt', {
      encrypted: encryptResult.encrypted,
      secret: testSecret
    });

    if (JSON.stringify(decryptResult.payload) !== JSON.stringify(testPayload)) {
      throw new Error('Decrypted payload does not match original');
    }
  });
}

async function testPluginRoutes() {
  console.log('\n🔌 PLUGIN ROUTES TESTS');

  const testBusinessId = process.env.TEST_BUSINESS_ID;
  const testRoleId = process.env.TEST_ROLE_ID;

  if (!testBusinessId || !testRoleId) {
    console.log('   ⚠️  Skipping - TEST_BUSINESS_ID or TEST_ROLE_ID not set');
    testResults.skipped.push('Plugin Routes tests');
    return;
  }

  await runTest('Execute Plugin', async () => {
    try {
      const result = await apiCall('POST', '/plugin/execute', {
        business_id: testBusinessId,
        plugin_code: 'test_plugin',
        role_id: testRoleId,
        payload: { test: true }
      });

      // Plugin may not exist - that's ok
      if (result.error && !result.error.includes('not found')) {
        throw new Error(result.error);
      }
    } catch (error) {
      if (!error.message.includes('not found') && !error.message.includes('plugin')) {
        throw error;
      }
    }
  });
}

async function testValidation() {
  console.log('\n✔️  VALIDATION TESTS');

  await runTest('Invalid UUID Format', async () => {
    try {
      await apiCall('GET', '/ui/branding/invalid-uuid-format');
      throw new Error('Should have failed validation');
    } catch (error) {
      if (!error.response || error.response.status !== 400) {
        throw new Error('Expected 400 validation error');
      }
    }
  });

  await runTest('Missing Required Field', async () => {
    try {
      await apiCall('POST', '/business/register', {
        name: 'Test'
        // Missing required 'industry' field
      });
      throw new Error('Should have failed validation');
    } catch (error) {
      if (!error.response || error.response.status !== 400) {
        throw new Error('Expected 400 validation error');
      }
    }
  });

  await runTest('Missing Auth Token', async () => {
    try {
      await axios.get(`${API_BASE_URL}/health`);
      // Health check should work without auth
    } catch (error) {
      throw new Error('Health check should work without auth');
    }

    try {
      await axios.get(`${API_BASE_URL}/ui/branding/00000000-0000-0000-0000-000000000000`);
      throw new Error('Should require auth token');
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        throw new Error('Expected 401 unauthorized error');
      }
    }
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   API TEST SUITE - COMPREHENSIVE      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n📍 API Base URL: ${API_BASE_URL}`);
  console.log(`🔑 Auth Token: ${TEST_TOKEN ? '✓ Set' : '✗ Not Set'}`);

  const startTime = Date.now();

  // Run all test suites
  await testHealthCheck();
  await testBusinessManagement();
  await testGenericDataAPI();
  await testAIRoutes();
  await testQueryBuilder();
  await testPermissions();
  await testNodeSystem();
  await testUIRoutes();
  await testCacheRoutes();
  await testUtilityRoutes();
  await testPluginRoutes();
  await testValidation();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           TEST SUMMARY                ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n✅ Passed:  ${testResults.passed.length}`);
  console.log(`❌ Failed:  ${testResults.failed.length}`);
  console.log(`⚠️  Skipped: ${testResults.skipped.length}`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  if (testResults.skipped.length > 0) {
    console.log('\n⚠️  SKIPPED TESTS:');
    testResults.skipped.forEach(name => {
      console.log(`   - ${name}`);
    });
  }

  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
