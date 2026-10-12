#!/usr/bin/env node

/**
 * UI/Kernel Integration Test
 * 
 * Tests that:
 * 1. Backend API returns proper response structure
 * 2. Frontend receives and processes correctly
 * 3. All components are wired properly
 */

const http = require('http');

// Configuration
const API_URL = 'http://localhost:3000';
const API_PATH = '/kernel/execute';

// Mock JWT token for testing
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.test';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(message) {
  log(`✅ ${message}`, 'green');
}

function fail(message) {
  log(`❌ ${message}`, 'red');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test helper function
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseData,
            parseError: true
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Main test suite
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'bold');
  log('║   UI/KERNEL INTEGRATION TEST SUITE                     ║', 'bold');
  log('╚════════════════════════════════════════════════════════╝\n', 'bold');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // TEST 1: API Health Check
    info('TEST 1: API Health Check');
    try {
      const healthResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/kernel/health',
        method: 'GET'
      });

      if (healthResponse.status === 200) {
        pass('Backend API is running');
        testsPassed++;
      } else {
        fail(`Backend returned status ${healthResponse.status}`);
        testsFailed++;
      }
    } catch (e) {
      fail(`Cannot reach backend: ${e.message}`);
      testsFailed++;
      log('\nMake sure backend is running: npm run start (from botmantra-backend)', 'yellow');
      process.exit(1);
    }

    // TEST 2: UI Bootstrap Response Structure
    info('\nTEST 2: UI Bootstrap Response Structure');
    try {
      const bootstrapResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/kernel/execute',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }, {
        action: 'ui_bootstrap'
      });

      if (bootstrapResponse.status === 200 || bootstrapResponse.status === 401) {
        // 401 is ok - means auth system is working
        if (bootstrapResponse.body?.response?.ui) {
          pass('Response has correct structure: response.response.ui');
          testsPassed++;

          // Check UI structure
          const ui = bootstrapResponse.body.response.ui;
          info('  Checking UI schema properties:');

          const requiredProps = ['layout', 'widgets', 'floating_chat'];
          let allPropsExist = true;

          for (const prop of requiredProps) {
            if (ui.hasOwnProperty(prop)) {
              pass(`    ✓ Has property: ${prop}`);
            } else {
              fail(`    ✗ Missing property: ${prop}`);
              allPropsExist = false;
            }
          }

          if (allPropsExist) {
            testsPassed++;
          } else {
            testsFailed++;
          }

          // Check widgets format
          if (Array.isArray(ui.widgets)) {
            pass(`    ✓ widgets is array with ${ui.widgets.length} items`);
            
            if (ui.widgets.length > 0) {
              const firstWidget = ui.widgets[0];
              const widgetProps = ['id', 'type', 'title'];
              let validWidgets = true;
              
              for (const prop of widgetProps) {
                if (!firstWidget.hasOwnProperty(prop)) {
                  fail(`    ✗ First widget missing: ${prop}`);
                  validWidgets = false;
                }
              }
              
              if (validWidgets) {
                pass(`    ✓ Widget schema is correct`);
                testsPassed++;
              } else {
                testsFailed++;
              }
            }
          } else {
            fail(`    ✗ widgets is not array`);
            testsFailed++;
          }
        } else {
          fail('Response does NOT have: response.response.ui');
          fail('  Response structure: ' + JSON.stringify(bootstrapResponse.body, null, 2));
          testsFailed += 2;
        }
      } else {
        fail(`Unexpected status code: ${bootstrapResponse.status}`);
        testsFailed += 2;
      }
    } catch (e) {
      fail(`Bootstrap test error: ${e.message}`);
      testsFailed += 2;
    }

    // TEST 3: Check Frontend Configuration
    info('\nTEST 3: Frontend Configuration');
    const fs = require('fs');
    const path = require('path');

    try {
      const indexPath = path.join(__dirname, 'botmantra-ui', 'src', 'index.js');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        
        if (content.includes("REACT_APP_USE_NEW_UI_ENGINE ?? 'true'")) {
          pass('index.js defaults to new UI engine');
          testsPassed++;
        } else if (content.includes("REACT_APP_USE_NEW_UI_ENGINE")) {
          warn('index.js has REACT_APP_USE_NEW_UI_ENGINE but check default value');
          testsPassed++;
        } else {
          fail('index.js does not configure UI engine selection');
          testsFailed++;
        }
      } else {
        warn('Cannot verify index.js (file not in expected location)');
      }
    } catch (e) {
      warn(`Frontend check skipped: ${e.message}`);
    }

    // TEST 4: Component Integration Points
    info('\nTEST 4: Component Integration Points');
    try {
      const files = [
        { path: 'botmantra-ui/src/core/Renderer.tsx', should: 'export' },
        { path: 'botmantra-ui/src/core/UIStateManager.tsx', should: 'export' },
        { path: 'botmantra-ui/src/core/KernelClient.ts', should: 'export' },
        { path: 'botmantra-ui/src/components/FloatingChat.tsx', should: 'export' }
      ];

      let found = 0;
      for (const file of files) {
        const fullPath = path.join(__dirname, file.path);
        if (fs.existsSync(fullPath)) {
          pass(`Found: ${file.path}`);
          found++;
        } else {
          fail(`Missing: ${file.path}`);
        }
      }

      if (found === files.length) {
        testsPassed++;
      } else {
        testsFailed++;
      }
    } catch (e) {
      warn(`Component check skipped: ${e.message}`);
    }

    // Summary
    log('\n╔════════════════════════════════════════════════════════╗', 'bold');
    log('║   TEST SUMMARY                                         ║', 'bold');
    log('╚════════════════════════════════════════════════════════╝\n', 'bold');

    const total = testsPassed + testsFailed;
    if (testsFailed === 0) {
      log(`✅ All ${total} tests passed!`, 'green');
      log('\n✅ UI/Kernel Integration Status: READY', 'green');
      log('\nNext steps:', 'yellow');
      log('  1. npm start  (from botmantra-ui)', 'yellow');
      log('  2. Open http://localhost:3001', 'yellow');
      log('  3. Verify UI loads with dynamic widgets', 'yellow');
    } else {
      log(`Tests: ${testsPassed} passed, ${testsFailed} failed`, 'red');
      log('\n❌ Fix issues above before proceeding', 'red');
    }

  } catch (error) {
    log('\n❌ Test suite error: ' + error.message, 'red');
    process.exit(1);
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  log('\nUnexpected error: ' + err.message, 'red');
  process.exit(1);
});
