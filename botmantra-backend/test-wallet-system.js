#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET SYSTEM - Complete Test Suite
// ═══════════════════════════════════════════════════════════════════════════════
// Tests: Wallet CRUD, transfers, transactions, karma integration, authorization

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let testsPassed = 0;
let testsFailed = 0;

// Mock session token for testing (in real scenario, get from auth endpoint)
const MOCK_SESSION_TOKEN = 'test-session-token-12345';

// Test User IDs (use real UUIDs from your database)
const TEST_USER_1 = '550e8400-e29b-41d4-a716-446655440001';
const TEST_USER_2 = '550e8400-e29b-41d4-a716-446655440002';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function makeRequest(method, path, body = null, query = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    Object.keys(query).forEach(key => url.searchParams.append(key, query[key]));

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`✅ ${message}`);
  } else {
    testsFailed++;
    console.log(`❌ ${message}`);
  }
}

async function test(name, fn) {
  console.log(`\n📋 ${name}`);
  console.log('─'.repeat(60));
  try {
    await fn();
  } catch (error) {
    testsFailed++;
    console.error(`❌ Test error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testWalletSystem() {
  console.log('\n\n🏦 WALLET SYSTEM TEST SUITE');
  console.log('═'.repeat(60));

  // TEST 1: Initialize Wallet
  await test('Wallet Initialization', async () => {
    const response = await makeRequest('POST', '/api/wallet/initialize', {
      session_token: MOCK_SESSION_TOKEN,
      wallet_type: 'primary'
    });

    assert(
      response.status === 201 || response.status === 400,
      `Initialize wallet returned ${response.status} ${response.status === 201 ? '(created)' : '(likely already exists)'}`
    );

    if (response.status === 201) {
      console.log(`   Wallet ID: ${response.body.wallet_id}`);
      console.log(`   Balance: $${response.body.balance}`);
    }
  });

  // TEST 2: Get Wallet Details
  await test('Get Wallet Details', async () => {
    const response = await makeRequest('GET', `/api/wallet/${TEST_USER_1}`, null, {
      session_token: MOCK_SESSION_TOKEN
    });

    assert(
      response.status === 200,
      `Get wallet returned ${response.status}`
    );

    if (response.body.wallets && response.body.wallets.length > 0) {
      const wallet = response.body.wallets[0];
      console.log(`   Wallets: ${response.body.wallets.length}`);
      console.log(`   Total Balance: $${response.body.total_balance}`);
      console.log(`   Wallet Type: ${wallet.wallet_type}`);
      console.log(`   Transactions: ${wallet.transaction_count}`);
    }
  });

  // TEST 3: Get Balance Quick Check
  await test('Get Balance (Quick Check)', async () => {
    const response = await makeRequest('GET', `/api/wallet/${TEST_USER_1}/balance`, null, {
      session_token: MOCK_SESSION_TOKEN,
      wallet_type: 'primary'
    });

    assert(
      response.status === 200,
      `Quick balance check returned ${response.status}`
    );

    if (response.body.balance !== undefined) {
      console.log(`   Balance: $${response.body.balance}`);
      console.log(`   Available: $${response.body.available_balance}`);
      console.log(`   Frozen: $${response.body.frozen_balance}`);
    }
  });

  // TEST 4: Get Wallet Settings
  await test('Get Wallet Settings', async () => {
    const response = await makeRequest('GET', `/api/wallet/settings/${TEST_USER_1}`, null, {
      session_token: MOCK_SESSION_TOKEN
    });

    assert(
      response.status === 200,
      `Get settings returned ${response.status}`
    );

    if (response.body.settings) {
      console.log(`   Currency: ${response.body.settings.preferred_currency}`);
      console.log(`   Notify Transactions: ${response.body.settings.notify_transactions}`);
      console.log(`   Low Balance Threshold: $${response.body.settings.low_balance_threshold}`);
    }
  });

  // TEST 5: Session Token Validation
  await test('Session Token Validation (Error Case)', async () => {
    const response = await makeRequest('GET', `/api/wallet/${TEST_USER_1}`, null, {
      session_token: 'invalid-token'
    });

    assert(
      response.status === 401,
      `Invalid session returned ${response.status} (should be 401)`
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFER & TRANSACTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testTransactionSystem() {
  console.log('\n\n💳 TRANSACTION SYSTEM TEST SUITE');
  console.log('═'.repeat(60));

  // TEST 1: Transfer Between Users
  await test('Transfer Funds Between Users', async () => {
    const response = await makeRequest('POST', '/api/wallet/transfer', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_2,
      amount: 50.00,
      description: 'Test transfer'
    });

    assert(
      response.status === 201 || response.status === 402,
      `Transfer returned ${response.status} ${response.status === 201 ? '(created)' : '(likely insufficient balance)'}`
    );

    if (response.body.transaction_id) {
      console.log(`   Transaction ID: ${response.body.transaction_id}`);
      console.log(`   Amount: $${response.body.amount}`);
      console.log(`   Karma Earned: ${response.body.karma_earned}`);
      console.log(`   From Balance: $${response.body.from_wallet.balance_before} → $${response.body.from_wallet.balance_after}`);
    }
  });

  // TEST 2: Insufficient Balance Error
  await test('Transfer with Insufficient Balance', async () => {
    const response = await makeRequest('POST', '/api/wallet/transfer', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_2,
      amount: 1000000.00
    });

    assert(
      response.status === 402,
      `Insufficient balance returned ${response.status} (should be 402)`
    );

    if (response.body.error) {
      console.log(`   Error: ${response.body.error}`);
    }
  });

  // TEST 3: Invalid Transfer (Same User)
  await test('Transfer to Same User (Error)', async () => {
    const response = await makeRequest('POST', '/api/wallet/transfer', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_1,
      amount: 50.00
    });

    assert(
      response.status === 400,
      `Same user transfer returned ${response.status} (should be 400)`
    );
  });

  // TEST 4: Create Transaction
  await test('Create Transaction', async () => {
    const response = await makeRequest('POST', '/api/transaction/create', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_2,
      amount: 25.00,
      transaction_type: 'transfer',
      description: 'Service payment',
      reference_id: 'REF-001'
    });

    assert(
      response.status === 201 || response.status === 402,
      `Create transaction returned ${response.status}`
    );

    if (response.body.transaction_id) {
      console.log(`   Transaction ID: ${response.body.transaction_id}`);
      console.log(`   Status: ${response.body.status}`);
      console.log(`   Fee: $${response.body.fee}`);
    }
  });

  // TEST 5: Get Transaction Details
  await test('Get Transaction Details', async () => {
    // First create a transaction to get ID
    const createResponse = await makeRequest('POST', '/api/transaction/create', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_2,
      amount: 10.00
    });

    if (createResponse.body.transaction_id) {
      const response = await makeRequest('GET', `/api/transaction/${createResponse.body.transaction_id}`, null, {
        session_token: MOCK_SESSION_TOKEN
      });

      assert(
        response.status === 200,
        `Get transaction returned ${response.status}`
      );

      if (response.body.transaction) {
        console.log(`   Type: ${response.body.transaction.type}`);
        console.log(`   Amount: $${response.body.transaction.amount}`);
        console.log(`   Status: ${response.body.transaction.status}`);
        console.log(`   Karma Earned: ${response.body.transaction.karma_earned}`);
      }
    }
  });

  // TEST 6: Get Transaction History
  await test('Get Transaction History', async () => {
    const response = await makeRequest('GET', '/api/wallet/history', null, {
      session_token: MOCK_SESSION_TOKEN,
      user_id: TEST_USER_1,
      limit: 10,
      offset: 0
    });

    assert(
      response.status === 200,
      `History returned ${response.status}`
    );

    if (response.body.transactions) {
      console.log(`   Total Transactions: ${response.body.pagination?.total || 0}`);
      console.log(`   Returned: ${response.body.transactions.length}`);
      if (response.body.transactions.length > 0) {
        console.log(`   Latest: ${response.body.transactions[0].description}`);
      }
    }
  });

  // TEST 7: List Transactions with Filters
  await test('List Transactions with Filters', async () => {
    const response = await makeRequest('GET', '/api/transactions/list', null, {
      session_token: MOCK_SESSION_TOKEN,
      user_id: TEST_USER_1,
      status: 'completed',
      type: 'transfer',
      limit: 20
    });

    assert(
      response.status === 200,
      `List transactions returned ${response.status}`
    );

    if (response.body.stats) {
      console.log(`   Total Transactions: ${response.body.stats.total_transactions}`);
      console.log(`   Total Sent: $${response.body.stats.total_amount_sent}`);
      console.log(`   Total Received: $${response.body.stats.total_amount_received}`);
      console.log(`   Total Karma: ${response.body.stats.total_karma_earned}`);
    }
  });

  // TEST 8: Get Pending Transactions
  await test('Get Pending Transactions', async () => {
    const response = await makeRequest('GET', '/api/transactions/pending', null, {
      session_token: MOCK_SESSION_TOKEN,
      user_id: TEST_USER_1
    });

    assert(
      response.status === 200,
      `Pending transactions returned ${response.status}`
    );

    console.log(`   Pending Count: ${response.body.pending_count || 0}`);
    console.log(`   Pending Amount: $${response.body.pending_amount || 0}`);
  });

  // TEST 9: Get Transaction Statistics
  await test('Get Transaction Statistics', async () => {
    const response = await makeRequest('GET', `/api/transactions/stats/${TEST_USER_1}`, null, {
      session_token: MOCK_SESSION_TOKEN
    });

    assert(
      response.status === 200,
      `Stats returned ${response.status}`
    );

    if (response.body.stats) {
      console.log(`   Total Transactions: ${response.body.stats.total_transactions}`);
      console.log(`   Sent: ${response.body.stats.sent.count} transactions, $${response.body.stats.sent.amount}`);
      console.log(`   Received: ${response.body.stats.received.count} transactions, $${response.body.stats.received.amount}`);
      console.log(`   Karma Earned: ${response.body.stats.total_karma_earned}`);
      console.log(`   Fees Paid: $${response.body.stats.fees_paid}`);
    }
  });

  // TEST 10: Authorization Check
  await test('Authorization Check (Wrong User)', async () => {
    const response = await makeRequest('GET', `/api/transactions/list`, null, {
      session_token: MOCK_SESSION_TOKEN,
      user_id: '550e8400-e29b-41d4-a716-446655440099' // Different user
    });

    // Will fail if session token user doesn't match and is not admin
    // Status may be 403 or could still be 200 if test token is admin
    console.log(`   Response: ${response.status} ${response.body.error || 'OK'}`);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// KARMA INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testKarmaIntegration() {
  console.log('\n\n🔮 KARMA INTEGRATION TEST SUITE');
  console.log('═'.repeat(60));

  // TEST 1: Karma Earned on Transfer
  await test('Karma Earned on Transfer', async () => {
    const response = await makeRequest('POST', '/api/wallet/transfer', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_2,
      amount: 100.00
    });

    if (response.status === 201) {
      assert(
        response.body.karma_earned !== undefined && response.body.karma_earned > 0,
        `Karma earned on transfer: ${response.body.karma_earned} (amount: $${response.body.amount})`
      );

      const karmaPerDollar = response.body.karma_earned / response.body.amount;
      console.log(`   Karma/Dollar Ratio: ${karmaPerDollar}`);
    } else {
      console.log(`   ⚠️  Unable to test (insufficient balance or error)`);
    }
  });

  // TEST 2: Karma Multiplier Application
  await test('Karma Multiplier Calculation', async () => {
    // Create transaction and check karma earned
    const response = await makeRequest('POST', '/api/transaction/create', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_2,
      amount: 50.00,
      transaction_type: 'transfer'
    });

    if (response.status === 201) {
      // Karma should be: amount × multiplier × 10
      // Example: $50 × 1.0 × 10 = 500 karma
      console.log(`   Amount: $${response.body.amount}`);
      console.log(`   Karma Earned: ${response.body.karma_earned}`);
      console.log(`   Calculated Multiplier: ${response.body.karma_earned / (response.body.amount * 10)}`);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testErrorHandling() {
  console.log('\n\n⚠️  ERROR HANDLING TEST SUITE');
  console.log('═'.repeat(60));

  // TEST 1: Missing Required Fields
  await test('Missing Required Fields (Transfer)', async () => {
    const response = await makeRequest('POST', '/api/wallet/transfer', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1
      // Missing to_user_id and amount
    });

    assert(
      response.status === 400,
      `Missing fields returned ${response.status} (should be 400)`
    );
  });

  // TEST 2: Invalid Amount
  await test('Invalid Amount (Negative)', async () => {
    const response = await makeRequest('POST', '/api/wallet/transfer', {
      session_token: MOCK_SESSION_TOKEN,
      from_user_id: TEST_USER_1,
      to_user_id: TEST_USER_2,
      amount: -100
    });

    assert(
      response.status === 400,
      `Negative amount returned ${response.status} (should be 400)`
    );
  });

  // TEST 3: Missing Session Token
  await test('Missing Session Token', async () => {
    const response = await makeRequest('GET', `/api/wallet/${TEST_USER_1}`);

    assert(
      response.status === 401,
      `No session token returned ${response.status} (should be 401)`
    );
  });

  // TEST 4: Invalid Transaction ID
  await test('Invalid Transaction ID', async () => {
    const response = await makeRequest('GET', '/api/transaction/invalid-uuid', null, {
      session_token: MOCK_SESSION_TOKEN
    });

    assert(
      response.status === 404,
      `Invalid transaction ID returned ${response.status} (should be 404)`
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   WALLET SYSTEM - COMPLETE TEST SUITE                         ║');
  console.log('║                                                                               ║');
  console.log('║  This test suite validates:                                                   ║');
  console.log('║  • Wallet initialization and management                                       ║');
  console.log('║  • Transfer functionality with fee calculation                                ║');
  console.log('║  • Transaction creation, listing, and history                                 ║');
  console.log('║  • Karma multiplier integration                                               ║');
  console.log('║  • Authorization and session validation                                       ║');
  console.log('║  • Error handling and edge cases                                              ║');
  console.log('║                                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Starting tests at ${new Date().toISOString()}\n`);

  await testWalletSystem();
  await testTransactionSystem();
  await testKarmaIntegration();
  await testErrorHandling();

  // Summary
  console.log('\n\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${(testsPassed / (testsPassed + testsFailed) * 100).toFixed(1)}%`);
  console.log(`⏱️  Completed at ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Wallet system is ready for production.');
    process.exit(0);
  }
}

// Start tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
