/**
 * 🧪 Test Unified Chat Endpoint
 * Quick tests for /api/chat/process
 */

const http = require('http');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function makeRequest(body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/chat/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '═'.repeat(60));
  console.log(`${colors.blue}🤖 UNIFIED CHAT ENDPOINT TESTS${colors.reset}`);
  console.log('═'.repeat(60) + '\n');

  let passCount = 0;
  let failCount = 0;

  // Test 1: Simple text query (Web platform)
  console.log(`${colors.yellow}📝 Test 1: Simple query (Web)${colors.reset}`);
  const test1 = await makeRequest({
    platform: 'web',
    message: 'Hello, how are you?',
    userId: null,
    sessionId: 'test-session-1'
  });
  
  if (test1.status === 200 && test1.data.success) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Status: ${test1.status}`);
    console.log(`   Response type: ${test1.data.intent}`);
    console.log(`   Platform: ${test1.data.platform}\n`);
    passCount++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Status: ${test1.status}\n`);
    failCount++;
  }

  // Test 2: Navigation intent (App platform)
  console.log(`${colors.yellow}📱 Test 2: Navigation (App)${colors.reset}`);
  const test2 = await makeRequest({
    platform: 'app',
    message: 'Navigate to home',
    currentNode: null,
    sessionId: 'test-session-2'
  });
  
  if (test2.status === 200 && test2.data.success) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Status: ${test2.status}`);
    console.log(`   Intent: ${test2.data.intent}`);
    console.log(`   Platform: ${test2.data.platform}\n`);
    passCount++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Status: ${test2.status}\n`);
    failCount++;
  }

  // Test 3: Auth intent (WhatsApp)
  console.log(`${colors.yellow}💬 Test 3: Auth intent (WhatsApp)${colors.reset}`);
  const test3 = await makeRequest({
    platform: 'whatsapp',
    message: 'I want to signup',
    sessionId: 'test-session-3'
  });
  
  if (test3.status === 200 && test3.data.success) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Status: ${test3.status}`);
    console.log(`   Intent: ${test3.data.intent}`);
    console.log(`   Platform: ${test3.data.platform}\n`);
    passCount++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Status: ${test3.status}\n`);
    failCount++;
  }

  // Test 4: Query with context (Telegram)
  console.log(`${colors.yellow}📨 Test 4: Query (Telegram)${colors.reset}`);
  const test4 = await makeRequest({
    platform: 'telegram',
    query: 'What is my account balance?',
    currentNode: 'account_node',
    userId: 'test-user-123',
    sessionId: 'test-session-4'
  });
  
  if (test4.status === 200 && test4.data.success) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Status: ${test4.status}`);
    console.log(`   Intent: ${test4.data.intent}`);
    console.log(`   Platform: ${test4.data.platform}\n`);
    passCount++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Status: ${test4.status}\n`);
    failCount++;
  }

  // Summary
  console.log('═'.repeat(60));
  console.log(`${colors.blue}📊 TEST SUMMARY${colors.reset}`);
  console.log('═'.repeat(60));
  console.log(`Total Tests: 4`);
  console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);
  console.log(`Pass Rate: ${((passCount/4)*100).toFixed(1)}%`);
  console.log('═'.repeat(60) + '\n');

  console.log(`${colors.blue}🎯 ENDPOINT READY:${colors.reset}`);
  console.log(`   POST http://localhost:5000/api/chat/process`);
  console.log(`\n${colors.blue}📝 SUPPORTED PLATFORMS:${colors.reset}`);
  console.log(`   ✓ web      - Full JSON with UI data`);
  console.log(`   ✓ app      - Mobile-optimized JSON`);
  console.log(`   ✓ whatsapp - Text-formatted responses`);
  console.log(`   ✓ telegram - Telegram-formatted with buttons`);
  console.log('\n');

  process.exit(failCount > 0 ? 1 : 0);
}

// Give server time to start
setTimeout(runTests, 2000);
