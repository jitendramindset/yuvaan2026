/**
 * Karma/Dharma System Integration Test
 * Tests all logging methods and backend API endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const TEST_USER_ID = 'test-user-' + Date.now();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testBatchLogging() {
  logSection('TEST 1: Batch Logging');
  
  const testLogs = [
    {
      action: 'camera_access',
      category: 'device_access',
      granted: true,
      metadata: { device: 'front_camera', duration: 30 }
    },
    {
      action: 'microphone_access',
      category: 'device_access',
      granted: true,
      metadata: { device: 'default_mic', duration: 45 }
    },
    {
      action: 'location_access',
      category: 'privacy_sensitive',
      granted: true,
      metadata: { latitude: 28.7041, longitude: 77.1025, accuracy: 10 }
    },
    {
      action: 'file_read',
      category: 'filesystem',
      granted: true,
      metadata: { path: '/documents/test.pdf', size: 1024 }
    },
    {
      action: 'message_sent',
      category: 'communication',
      granted: true,
      metadata: { recipient: 'user-456', messageType: 'text' }
    }
  ];

  try {
    const response = await axios.post(`${API_URL}/api/karma-dharma/log-batch`, {
      logs: testLogs,
      userId: TEST_USER_ID,
      sessionId: 'test-session-' + Date.now()
    });

    if (response.data.success) {
      log(`✓ Logged ${response.data.logsInserted} actions successfully`, 'green');
      if (response.data.evaluation) {
        log(`  Karma Delta: ${response.data.evaluation.totalKarmaDelta || 0}`, 'blue');
        log(`  Dharma Delta: ${response.data.evaluation.totalDharmaDelta || 0}`, 'blue');
      }
      return true;
    }
  } catch (error) {
    log(`✗ Batch logging failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Error: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testGetScores() {
  logSection('TEST 2: Get Karma/Dharma Scores');
  
  try {
    const response = await axios.get(`${API_URL}/api/karma-dharma/scores/${TEST_USER_ID}`);
    
    const { karma, dharma, accessLevel, weightedScore } = response.data;
    log('✓ Scores retrieved successfully', 'green');
    log(`  Karma: ${karma}`, 'blue');
    log(`  Dharma: ${dharma}`, 'blue');
    log(`  Weighted Score: ${weightedScore}`, 'blue');
    log(`  Access Level: ${accessLevel}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Get scores failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testEvaluateAction() {
  logSection('TEST 3: Evaluate Single Action');
  
  try {
    const response = await axios.post(`${API_URL}/api/karma-dharma/evaluate`, {
      userId: TEST_USER_ID,
      actionType: 'node_access',
      actionCategory: 'navigation',
      metadata: { nodeId: 'node-123', nodeName: 'Test Node' }
    });
    
    if (response.data.success) {
      log('✓ Action evaluated successfully', 'green');
      log(`  Karma Impact: ${response.data.karmaImpact}`, 'blue');
      log(`  Dharma Impact: ${response.data.dharmaImpact}`, 'blue');
      log(`  Current Karma: ${response.data.currentKarma}`, 'blue');
      log(`  Current Dharma: ${response.data.currentDharma}`, 'blue');
      return true;
    }
  } catch (error) {
    log(`✗ Evaluate action failed: ${error.message}`, 'red');
    return false;
  }
}

async function testGetHistory() {
  logSection('TEST 4: Get Action History');
  
  try {
    const response = await axios.get(`${API_URL}/api/karma-dharma/history/${TEST_USER_ID}?limit=10`);
    
    if (response.data.success) {
      log(`✓ Retrieved ${response.data.actions.length} actions from history`, 'green');
      
      if (response.data.actions.length > 0) {
        log('\n  Recent Actions:', 'yellow');
        response.data.actions.slice(0, 3).forEach((action, index) => {
          log(`  ${index + 1}. ${action.action_type} (${action.action_category})`, 'blue');
          log(`     Karma: ${action.karma_delta}, Dharma: ${action.dharma_delta}`, 'blue');
        });
      }
      return true;
    }
  } catch (error) {
    log(`✗ Get history failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAllActionTypes() {
  logSection('TEST 3: All Action Types');
  
  const allActionTypes = [
    { action: 'camera_access', category: 'device_access', meta: { device: 'rear_camera' } },
    { action: 'microphone_access', category: 'device_access', meta: { device: 'mic' } },
    { action: 'location_access', category: 'privacy_sensitive', meta: { lat: 0, lng: 0 } },
    { action: 'file_read', category: 'filesystem', meta: { path: '/test.txt' } },
    { action: 'file_write', category: 'filesystem', meta: { path: '/output.txt' } },
    { action: 'file_delete', category: 'filesystem', meta: { path: '/temp.txt' } },
    { action: 'message_sent', category: 'communication', meta: { to: 'user-1' } },
    { action: 'message_received', category: 'communication', meta: { from: 'user-2' } },
    { action: 'contacts_access', category: 'privacy_sensitive', meta: { count: 100 } },
    { action: 'node_access', category: 'navigation', meta: { nodeId: 'n1' } },
    { action: 'nearest_node_search', category: 'navigation', meta: { radius: 100 } },
    { action: 'permission_request', category: 'security', meta: { permission: 'camera' } },
    { action: 'role_change', category: 'security', meta: { oldRole: 'user', newRole: 'admin' } }
  ];

  const logs = allActionTypes.map(actionDef => ({
    action: actionDef.action,
    category: actionDef.category,
    granted: true,
    metadata: actionDef.meta
  }));

  try {
    const response = await axios.post(`${API_URL}/api/karma-dharma/log-batch`, { 
      logs,
      userId: TEST_USER_ID,
      sessionId: 'test-all-types-' + Date.now()
    });
    
    if (response.data.success) {
      log(`✓ Tested ${allActionTypes.length} different action types`, 'green');
      log(`  Logs Inserted: ${response.data.logsInserted}`, 'blue');
      if (response.data.evaluation) {
        log(`  Total Karma Delta: ${response.data.evaluation.totalKarmaDelta || 0}`, 'blue');
        log(`  Total Dharma Delta: ${response.data.evaluation.totalDharmaDelta || 0}`, 'blue');
      }
      return true;
    }
  } catch (error) {
    log(`✗ Action types test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBuffering() {
  logSection('TEST 4: Buffer Flush (50 Actions)');
  
  const logs = [];
  for (let i = 0; i < 50; i++) {
    logs.push({
      action: 'node_access',
      category: 'navigation',
      granted: true,
      nodeId: `node-${i}`,
      metadata: { iteration: i }
    });
  }

  try {
    const response = await axios.post(`${API_URL}/api/karma-dharma/log-batch`, { 
      logs,
      userId: TEST_USER_ID,
      sessionId: 'test-buffer-' + Date.now()
    });
    
    if (response.data.success && response.data.logsInserted === 50) {
      log('✓ Buffer flush test passed (50 actions)', 'green');
      log(`  Logs Inserted: ${response.data.logsInserted}`, 'blue');
      return true;
    } else {
      log(`✗ Expected 50 logs, got ${response.data.logsInserted}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Buffer test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n' + '█'.repeat(60), 'cyan');
  log('  KARMA/DHARMA SYSTEM - COMPREHENSIVE TEST SUITE', 'cyan');
  log('█'.repeat(60) + '\n', 'cyan');
  
  log(`Test User ID: ${TEST_USER_ID}`, 'yellow');
  log(`API URL: ${API_URL}\n`, 'yellow');

  const results = {
    passed: 0,
    failed: 0
  };

  // Run all tests
  const tests = [
    testBatchLogging,
    testGetScores,
    testAllActionTypes,
    testBuffering
  ];

  for (const test of tests) {
    const result = await test();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Final summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.passed + results.failed}`, 'yellow');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.failed === 0) {
    log('\n✓ ALL TESTS PASSED!', 'green');
    log('Karma/Dharma logging system is working correctly.\n', 'green');
  } else {
    log('\n✗ SOME TESTS FAILED', 'red');
    log('Please check the backend server and database connection.\n', 'red');
  }

  console.log('='.repeat(60) + '\n');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.status === 200;
  } catch (error) {
    console.log('Server check error:', error.message);
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log('\n⚠ Backend server is not running!', 'red');
    log('Please start the server first:', 'yellow');
    log('  cd botmantra-backend && node server.js\n', 'cyan');
    process.exit(1);
  }

  await runAllTests();
})();
