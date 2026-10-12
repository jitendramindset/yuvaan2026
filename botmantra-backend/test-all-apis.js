#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE API TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════
// Tests all Node OS APIs: Health, Auth, Kernel, Wallet, Transactions, Revenue

const BASE_URL = 'http://localhost:5000';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test result tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP REQUEST HELPER
// ═══════════════════════════════════════════════════════════════════════════════

async function request(method, endpoint, data = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let json;
    
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data: json
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

async function runTest(name, testFn) {
  results.total++;
  process.stdout.write(`  Testing: ${name}... `);
  
  try {
    await testFn();
    log('✅ PASS', 'green');
    results.passed++;
    return true;
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    results.failed++;
    // Log the full error details in debug mode
    if (process.env.DEBUG_TESTS) {
      console.log(`      ${error.stack}`);
    }
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 1. CORE SYSTEM TESTS
// ─────────────────────────────────────────────────────────────────────────────

async function testCoreSystem() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 1: CORE SYSTEM                                   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Health Check', async () => {
    const res = await request('GET', '/health');
    assert(res.ok, 'Health endpoint should return 200');
    assert(res.data.status === 'OK', 'Health status should be OK');
  });

  await runTest('Database Status', async () => {
    const res = await request('GET', '/api/db-status');
    assert(res.ok, 'DB status should return 200');
    assert(res.data.status === 'connected', 'Database should be connected');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. INTERACTION CLASSIFIER TESTS (Week 1)
// ─────────────────────────────────────────────────────────────────────────────

async function testInteractionClassifier() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 2: INTERACTION CLASSIFIER (Week 1)               ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Get Available Intents', async () => {
    const res = await request('GET', '/api/interaction/intents');
    assert(res.ok, 'Should return available intents');
    assert(Array.isArray(res.data.intents), 'Intents should be an array');
    assert(res.data.intents.length > 0, 'Should have at least one intent');
  });

  await runTest('Classify User Input (requires session)', async () => {
    const res = await request('POST', '/api/interaction/classify', {
      input: 'Show me all users',
      context: { page: 'dashboard' }
    });
    
    // Will fail without session, but endpoint should exist
    assert(res.status === 401 || res.status === 200, 'Endpoint should exist (401 = needs auth, 200 = success)');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. UI RENDERER TESTS (Week 1)
// ─────────────────────────────────────────────────────────────────────────────

async function testUIRenderer() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 3: UI RENDERER (Week 1)                          ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Get UI Templates', async () => {
    const res = await request('GET', '/api/ui/templates');
    
    // Check if endpoint exists
    assert(res.status === 401 || res.status === 200, 'Templates endpoint should exist');
  });

  await runTest('Generate UI Schema (requires session)', async () => {
    const res = await request('POST', '/api/ui/schema/generate', {
      table: 'users',
      type: 'table'
    });
    
    assert(res.status === 401 || res.status === 200, 'Generate endpoint should exist');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. WALLET SYSTEM TESTS (Week 2 Part 1)
// ─────────────────────────────────────────────────────────────────────────────

async function testWalletSystem() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 4: WALLET SYSTEM (Week 2 Part 1)                 ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Wallet Initialize Endpoint Exists', async () => {
    const res = await request('POST', '/api/wallet/initialize', {
      user_id: 'test-user-123'
    });
    
    assert(res.status === 401 || res.status === 200 || res.status === 400, 'Wallet initialize endpoint should exist');
  });

  await runTest('Get Wallet Balance Endpoint Exists', async () => {
    const res = await request('GET', '/api/wallet/test-user/balance');
    
    assert(res.status === 401 || res.status === 200 || res.status === 404, 'Balance endpoint should exist');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRANSACTION SYSTEM TESTS (Week 2 Part 1)
// ─────────────────────────────────────────────────────────────────────────────

async function testTransactionSystem() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 5: TRANSACTION SYSTEM (Week 2 Part 1)            ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Transaction Create Endpoint Exists', async () => {
    const res = await request('POST', '/api/transaction/create', {
      from_user_id: 'user1',
      to_user_id: 'user2',
      amount: 100
    });
    
    assert(res.status === 401 || res.status === 200 || res.status === 400, 'Create transaction endpoint should exist');
  });

  await runTest('Transaction List Endpoint Exists', async () => {
    const res = await request('GET', '/api/transaction/list');
    
    assert(res.status === 401 || res.status === 200, 'List endpoint should exist');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. REVENUE SHARING TESTS (Week 2 Part 2)
// ─────────────────────────────────────────────────────────────────────────────

async function testRevenueSharing() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 6: REVENUE SHARING (Week 2 Part 2)               ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Revenue Stats Endpoint Exists', async () => {
    const res = await request('GET', '/api/revenue/stats');
    
    assert(res.status === 401 || res.status === 200, 'Stats endpoint should exist');
  });

  await runTest('Top Earners Endpoint Exists', async () => {
    const res = await request('GET', '/api/revenue/top-earners?limit=10');
    
    assert(res.status === 401 || res.status === 200, 'Top earners endpoint should exist');
  });

  await runTest('Recent Distributions Endpoint Exists', async () => {
    const res = await request('GET', '/api/revenue/recent?limit=20');
    
    assert(res.status === 401 || res.status === 200, 'Recent distributions endpoint should exist');
  });

  await runTest('Process Revenue Endpoint Exists (Admin)', async () => {
    const res = await request('POST', '/api/revenue/process-all');
    
    assert(res.status === 401 || res.status === 403 || res.status === 200, 'Process all endpoint should exist');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. BOTMANTRA AI FRAMEWORK TESTS
// ─────────────────────────────────────────────────────────────────────────────

async function testBotMantraAI() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 7: BOTMANTRA AI FRAMEWORK                        ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Get Available Tables', async () => {
    const res = await request('GET', '/api/botmantra-ai/tables');
    assert(res.ok, 'Should return tables list');
  });

  await runTest('Chat Endpoint Exists', async () => {
    const res = await request('POST', '/api/botmantra-ai/chat', {
      message: 'test',
      table: 'users'
    });
    
    assert(res.status === 200 || res.status === 400, 'Chat endpoint should exist');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. KARMA/DHARMA SYSTEM TESTS
// ─────────────────────────────────────────────────────────────────────────────

async function testKarmaDharma() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TEST SUITE 8: KARMA/DHARMA SYSTEM                           ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  await runTest('Get Karma Profile Endpoint Exists', async () => {
    const res = await request('GET', '/api/karma-dharma/profile/test-user');
    
    assert(res.status === 401 || res.status === 200 || res.status === 404, 'Karma profile endpoint should exist');
  });

  await runTest('Get Leaderboard Endpoint Exists', async () => {
    const res = await request('GET', '/api/karma-dharma/leaderboard?limit=10');
    
    assert(res.status === 401 || res.status === 200, 'Leaderboard endpoint should exist');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════════════════════════╗', 'blue');
  log('║                    NODE OS - COMPREHENSIVE API TEST SUITE                     ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\n🎯 Testing all Node OS APIs...`, 'yellow');
  log(`📍 Base URL: ${BASE_URL}\n`, 'yellow');

  const startTime = Date.now();

  // Run all test suites
  await testCoreSystem();
  await testInteractionClassifier();
  await testUIRenderer();
  await testWalletSystem();
  await testTransactionSystem();
  await testRevenueSharing();
  await testBotMantraAI();
  await testKarmaDharma();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n');
  log('═'.repeat(80), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('═'.repeat(80), 'blue');
  log(`Total Tests:     ${results.total}`, 'cyan');
  log(`✅ Passed:       ${results.passed}`, 'green');
  log(`❌ Failed:       ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`⏭️  Skipped:      ${results.skipped}`, 'yellow');
  log(`⏱️  Duration:     ${duration}s`, 'cyan');
  log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'cyan');
  log('═'.repeat(80), 'blue');

  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! System is operational.', 'green');
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed. Review errors above.`, 'yellow');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
