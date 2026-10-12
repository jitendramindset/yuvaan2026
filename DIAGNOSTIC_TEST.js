/**
 * DIAGNOSTIC TEST
 * Check: Backend APIs, Database, and User Journey
 */

const http = require('http');

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
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
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
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

async function runDiagnostics() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          SYSTEM DIAGNOSTIC TEST                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const tests = [];

  // Test 1: Backend Health
  try {
    console.log('🔍 Test 1: Backend Health Check...');
    const healthRes = await makeRequest('http://localhost:5000/health');
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Response: ${JSON.stringify(healthRes.data).substring(0, 100)}...`);
    tests.push({ name: 'Backend Health', passed: healthRes.status === 200 });
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    tests.push({ name: 'Backend Health', passed: false });
  }

  // Test 2: Database Status
  try {
    console.log('\n🔍 Test 2: Database Status...');
    const dbRes = await makeRequest('http://localhost:5000/api/db-status');
    console.log(`   Status: ${dbRes.status}`);
    console.log(`   Response: ${JSON.stringify(dbRes.data).substring(0, 150)}...`);
    tests.push({ name: 'Database Status', passed: dbRes.status === 200 });
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    tests.push({ name: 'Database Status', passed: false });
  }

  // Test 3: Kernel Bootstrap
  try {
    console.log('\n🔍 Test 3: Kernel Bootstrap (Post-Login)...');
    const bootRes = await makeRequest(
      'http://localhost:5000/api/kernel/post-login-bootstrap',
      'POST',
      {
        userId: 'test-user-123',
        domain: 'botmantra.ai'
      }
    );
    console.log(`   Status: ${bootRes.status}`);
    console.log(`   Response: ${JSON.stringify(bootRes.data).substring(0, 150)}...`);
    tests.push({ name: 'Kernel Bootstrap', passed: bootRes.status >= 200 && bootRes.status < 300 });
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    tests.push({ name: 'Kernel Bootstrap', passed: false });
  }

  // Test 4: NodeCore Chat (requires auth)
  try {
    console.log('\n🔍 Test 4: NodeCore Chat (Auth Required)...');
    const chatRes = await makeRequest(
      'http://localhost:5000/api/nodecore-chat/chat',
      'POST',
      {
        userId: 'test-user-123',
        message: 'Hello',
        nodeId: 'test-node'
      }
    );
    console.log(`   Status: ${chatRes.status}`);
    console.log(`   Response: ${JSON.stringify(chatRes.data).substring(0, 100)}...`);
    tests.push({ name: 'NodeCore Chat', passed: chatRes.status < 500 });
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    tests.push({ name: 'NodeCore Chat', passed: false });
  }

  // Test 5: UI Tools Dashboard
  try {
    console.log('\n🔍 Test 5: UI Tools Dashboard (Get Dashboard)...');
    const dashRes = await makeRequest(
      'http://localhost:5000/api/ui-tools/dashboard',
      'GET'
    );
    console.log(`   Status: ${dashRes.status}`);
    console.log(`   Response: ${JSON.stringify(dashRes.data).substring(0, 150)}...`);
    tests.push({ name: 'UI Tools Dashboard', passed: dashRes.status < 500 });
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    tests.push({ name: 'UI Tools Dashboard', passed: false });
  }

  // Test 6: BotMantra AI - Get Tables
  try {
    console.log('\n🔍 Test 6: BotMantra AI - Get Tables...');
    const tablesRes = await makeRequest(
      'http://localhost:5000/api/botmantra-ai/tables?domainId=botmantra.ai'
    );
    console.log(`   Status: ${tablesRes.status}`);
    console.log(`   Response: ${JSON.stringify(tablesRes.data).substring(0, 200)}...`);
    tests.push({ name: 'BotMantra AI Tables', passed: tablesRes.status === 200 });
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    tests.push({ name: 'BotMantra AI Tables', passed: false });
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const passed = tests.filter(t => t.passed).length;
  const total = tests.length;

  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });

  console.log(`\n📊 Score: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);

  if (passed === total) {
    console.log('✨ All systems operational!\n');
  } else {
    console.log('⚠️  Some tests failed. Check logs above for details.\n');
  }
}

runDiagnostics().catch(console.error);
