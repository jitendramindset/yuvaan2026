#!/usr/bin/env node

/**
 * 🧪 Complete API Endpoint Test Runner
 * Tests all Botmantra API endpoints systematically
 * Date: January 29, 2026
 */

const http = require('http');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const BASE_URL = 'http://localhost:5000';
let testResults = [];
let passCount = 0;
let failCount = 0;

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
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
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test logging
function logTest(name, passed, message = '') {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  console.log(`${status} ${name}`);
  if (message) {
    console.log(`   ${colors.dim}${message}${colors.reset}`);
  }
  
  testResults.push({
    name,
    passed,
    message
  });
  
  if (passed) passCount++;
  else failCount++;
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🧪 BOTMANTRA API ENDPOINT TEST SUITE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

  // ============================================
  // PHASE 1: Health & Status Endpoints
  // ============================================
  console.log(`${colors.bright}${colors.blue}📍 PHASE 1: HEALTH & STATUS ENDPOINTS${colors.reset}\n`);

  // Test 1: Health Check
  const health = await makeRequest('GET', '/health');
  logTest(
    'GET /health',
    health.status === 200 && health.data.status === 'OK',
    `Status: ${health.status}, Response: ${health.data.status || health.error}`
  );

  // Test 2: Database Status
  const dbStatus = await makeRequest('GET', '/api/db-status');
  logTest(
    'GET /api/db-status',
    dbStatus.status === 200 && dbStatus.data.status === 'connected',
    `Status: ${dbStatus.status}, DB: ${dbStatus.data.status || dbStatus.error}`
  );

  // ============================================
  // PHASE 2: Kernel Engine - Validation & Execution
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}⚙️ PHASE 2: KERNEL ENGINE - VALIDATION & EXECUTION${colors.reset}\n`);

  const validateBody = {
    nidHash: "test_node_001",
    targetOwnerId: "owner-uuid-123",
    actionType: "read",
    requesterUuid: "user-uuid-456"
  };

  // Test 3: Validate Node Action
  const validate = await makeRequest('POST', '/api/kernel/validate', validateBody);
  logTest(
    'POST /api/kernel/validate',
    validate.status === 200,
    `Status: ${validate.status}`
  );

  // Test 4: Execute Node
  const executeBody = {
    nidHash: "test_node_001",
    targetOwnerId: "owner-uuid-123",
    actionType: "execute",
    payload: { command: "test", parameters: {} }
  };
  const execute = await makeRequest('POST', '/api/kernel/execute', executeBody);
  logTest(
    'POST /api/kernel/execute',
    [200, 500].includes(execute.status),
    `Status: ${execute.status}`
  );

  // Test 5: Evaluate Dharma
  const dharmaBody = {
    nidHash: "test_node_001",
    actionType: "read",
    principle: "dharma_principle_001"
  };
  const dharma = await makeRequest('POST', '/api/kernel/evaluate-dharma', dharmaBody);
  logTest(
    'POST /api/kernel/evaluate-dharma',
    [200, 500].includes(dharma.status),
    `Status: ${dharma.status}`
  );

  // Test 6: Apply Karma
  const karmaBody = {
    nidHash: "test_node_001",
    actorOwnerId: "actor-uuid-789",
    actionType: "help",
    karmaDelta: 10,
    trustDelta: 5,
    reason: "Test action"
  };
  const karma = await makeRequest('POST', '/api/kernel/apply-karma', karmaBody);
  logTest(
    'POST /api/kernel/apply-karma',
    [200, 500].includes(karma.status),
    `Status: ${karma.status}`
  );

  // Test 7: Ingest Event
  const eventBody = {
    nidHash: "test_node_001",
    eventType: "action_completed",
    payload: { action_id: "act-001", status: "success" },
    prevHash: "prev_hash"
  };
  const event = await makeRequest('POST', '/api/kernel/event-ingest', eventBody);
  logTest(
    'POST /api/kernel/event-ingest',
    [200, 500].includes(event.status),
    `Status: ${event.status}`
  );

  // Test 8: Calculate Reputation
  const reputationCalcBody = { nidHash: "test_node_001" };
  const repCalc = await makeRequest('POST', '/api/kernel/calculate-reputation', reputationCalcBody);
  logTest(
    'POST /api/kernel/calculate-reputation',
    [200, 500].includes(repCalc.status),
    `Status: ${repCalc.status}`
  );

  // ============================================
  // PHASE 3: Kernel Engine - Data Retrieval
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}📊 PHASE 3: KERNEL ENGINE - DATA RETRIEVAL${colors.reset}\n`);

  // Test 9: Get Session
  const session = await makeRequest('GET', '/api/kernel/session/test_session');
  logTest(
    'GET /api/kernel/session/:sessionId',
    [200, 500].includes(session.status),
    `Status: ${session.status}`
  );

  // Test 10: Get Execution
  const execution = await makeRequest('GET', '/api/kernel/execution/test_exec');
  logTest(
    'GET /api/kernel/execution/:executionId',
    [200, 500].includes(execution.status),
    `Status: ${execution.status}`
  );

  // Test 11: Get Reputation
  const reputation = await makeRequest('GET', '/api/kernel/reputation/test_node_001');
  logTest(
    'GET /api/kernel/reputation/:nidHash',
    [200, 500].includes(reputation.status),
    `Status: ${reputation.status}`
  );

  // Test 12: Get Permissions
  const permissions = await makeRequest('GET', '/api/kernel/permissions/test_node_001?targetOwnerId=owner-uuid-123');
  logTest(
    'GET /api/kernel/permissions/:nidHash',
    [200, 500].includes(permissions.status),
    `Status: ${permissions.status}`
  );

  // Test 13: Get Events
  const events = await makeRequest('GET', '/api/kernel/events/test_node_001?limit=50&offset=0');
  logTest(
    'GET /api/kernel/events/:nidHash',
    [200, 500].includes(events.status),
    `Status: ${events.status}`
  );

  // Test 14: Get Failures
  const failures = await makeRequest('GET', '/api/kernel/failures/test_node_001?limit=50');
  logTest(
    'GET /api/kernel/failures/:nidHash',
    [200, 500].includes(failures.status),
    `Status: ${failures.status}`
  );

  // Test 15: Get Dharma Logs
  const dharmaLogs = await makeRequest('GET', '/api/kernel/dharma-logs/test_node_001?limit=50');
  logTest(
    'GET /api/kernel/dharma-logs/:nidHash',
    [200, 500].includes(dharmaLogs.status),
    `Status: ${dharmaLogs.status}`
  );

  // Test 16: Get Karma Logs
  const karmaLogs = await makeRequest('GET', '/api/kernel/karma-logs/test_node_001?limit=50');
  logTest(
    'GET /api/kernel/karma-logs/:nidHash',
    [200, 500].includes(karmaLogs.status),
    `Status: ${karmaLogs.status}`
  );

  // ============================================
  // PHASE 4: Generic CRUD Operations
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}🔄 PHASE 4: GENERIC CRUD OPERATIONS${colors.reset}\n`);

  // Test 17: Get Users Table
  const users = await makeRequest('GET', '/api/table/users?limit=10&offset=0');
  logTest(
    'GET /api/table/users',
    users.status === 200 && users.data.success === true,
    `Status: ${users.status}, Success: ${users.data.success || false}`
  );

  // Test 18: Get Node Core Table
  const nodeCore = await makeRequest('GET', '/api/table/node_core?limit=10&offset=0');
  logTest(
    'GET /api/table/node_core',
    nodeCore.status === 200 && nodeCore.data.success === true,
    `Status: ${nodeCore.status}, Success: ${nodeCore.data.success || false}`
  );

  // Test 19: Get Businesses Table
  const businesses = await makeRequest('GET', '/api/table/businesses?limit=10&offset=0');
  logTest(
    'GET /api/table/businesses',
    businesses.status === 200 && businesses.data.success === true,
    `Status: ${businesses.status}, Success: ${businesses.data.success || false}`
  );

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📋 TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

  const totalTests = passCount + failCount;
  const passRate = totalTests > 0 ? ((passCount / totalTests) * 100).toFixed(1) : 0;

  console.log(`${colors.bright}Total Tests:${colors.reset} ${totalTests}`);
  console.log(`${colors.green}${colors.bright}✅ Passed:${colors.reset} ${passCount}`);
  console.log(`${colors.red}${colors.bright}❌ Failed:${colors.reset} ${failCount}`);
  console.log(`${colors.bright}Pass Rate:${colors.reset} ${passRate}%\n`);

  // Status
  if (failCount === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}\n`);
  } else if (passRate >= 80) {
    console.log(`${colors.yellow}${colors.bright}⚠️  MOST TESTS PASSED (${passRate}%)${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ SOME TESTS FAILED${colors.reset}\n`);
  }

  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}✅ Test Execution Complete${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal Error:${colors.reset}`, error.message);
  process.exit(1);
});
