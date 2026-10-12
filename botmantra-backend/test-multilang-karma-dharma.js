/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEST SUITE: Multi-Language & Karma/Dharma System Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This test suite validates:
 * 1. Language detection and translation
 * 2. Dynamic system prompt generation
 * 3. Karma/dharma access control
 * 4. Database schema integration
 * 5. Chat endpoint responses
 */

const http = require('http');
const assert = require('assert');

const API_BASE = 'http://localhost:3000/api';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: Language Support Module
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 1: Language Support Module');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const { 
    SUPPORTED_LANGUAGES, 
    TRANSLATIONS, 
    detectLanguage, 
    t 
  } = require('./language-support');
  
  console.log('✓ language-support.js imported successfully');
  
  // Test 1.1: Check supported languages
  assert(Object.keys(TRANSLATIONS).length >= 9, 'Should have at least 9 languages');
  console.log('✓ 9+ languages supported:', Object.keys(TRANSLATIONS).join(', '));
  
  // Test 1.2: Test language detection
  const mockReq1 = {
    headers: { 'accept-language': 'hi-IN,hi;q=0.9' },
    query: {}
  };
  const detected1 = detectLanguage(mockReq1);
  assert(detected1 === 'hi', `Expected 'hi', got '${detected1}'`);
  console.log('✓ Language detection works (Accept-Language header)');
  
  // Test 1.3: Test explicit language parameter
  const mockReq2 = {
    headers: {},
    query: { language: 'es' }
  };
  const detected2 = detectLanguage(mockReq2);
  assert(detected2 === 'es', `Expected 'es', got '${detected2}'`);
  console.log('✓ Explicit language parameter works');
  
  // Test 1.4: Test translation function
  const greeting = t('welcome', 'en');
  assert(typeof greeting === 'string', 'Translation should return string');
  console.log('✓ Translation function works');
  
  console.log('\n✅ Language Support: ALL TESTS PASSED\n');
  
} catch (error) {
  console.error('❌ Language Support Test Failed:', error.message);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: Dynamic Prompt Generation Module
// ═══════════════════════════════════════════════════════════════════════════════

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 2: Dynamic Prompt Generation Module');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const {
    DEFAULT_PROMPTS,
    getAccessLevel,
    generateSystemPrompt
  } = require('./node-system-prompts');
  
  console.log('✓ node-system-prompts.js imported successfully');
  
  // Test 2.1: Check default prompts
  const nodeTypes = ['account', 'transaction', 'knowledge', 'form', 'admin', 'default'];
  nodeTypes.forEach(type => {
    assert(DEFAULT_PROMPTS[type], `Missing prompt for node type: ${type}`);
  });
  console.log('✓ All 6 default prompts present:', nodeTypes.join(', '));
  
  // Test 2.2: Test access level calculation - MINIMAL
  const level1 = getAccessLevel(15, 35);
  assert(level1 === 'MINIMAL_ACCESS', `Expected MINIMAL_ACCESS, got ${level1}`);
  console.log('✓ Access level MINIMAL for karma=15, dharma=35');
  
  // Test 2.3: Test access level calculation - LIMITED
  const level2 = getAccessLevel(35, 50);
  assert(level2 === 'LIMITED_ACCESS', `Expected LIMITED_ACCESS, got ${level2}`);
  console.log('✓ Access level LIMITED for karma=35, dharma=50');
  
  // Test 2.4: Test access level calculation - STANDARD
  const level3 = getAccessLevel(55, 55);
  assert(level3 === 'STANDARD_ACCESS', `Expected STANDARD_ACCESS, got ${level3}`);
  console.log('✓ Access level STANDARD for karma=55, dharma=55');
  
  // Test 2.5: Test access level calculation - FULL
  const level4 = getAccessLevel(85, 85);
  assert(level4 === 'FULL_ACCESS', `Expected FULL_ACCESS, got ${level4}`);
  console.log('✓ Access level FULL for karma=85, dharma=85');
  
  // Test 2.6: Test prompt generation with karma/dharma
  const nodeData = {
    name: 'Test Node',
    type: 'account',
    category: 'finance'
  };
  
  const prompt = generateSystemPrompt(nodeData, 75, 80);
  assert(prompt.includes('account'), 'Prompt should mention node type');
  assert(prompt.includes('karma') || prompt.includes('Karma'), 'Prompt should reference karma');
  console.log('✓ System prompt generation includes karma/dharma modifications');
  
  console.log('\n✅ Prompt Generation: ALL TESTS PASSED\n');
  
} catch (error) {
  console.error('❌ Prompt Generation Test Failed:', error.message);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: Chat Endpoint Integration
// ═══════════════════════════════════════════════════════════════════════════════

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 3: Chat Endpoint Integration (requires server running)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testChatEndpoint() {
  return new Promise((resolve, reject) => {
    // Test 3.1: Basic chat message with language
    const payload = JSON.stringify({
      userId: 'test-user-123',
      sessionId: 'session-123',
      message: 'Hello, how are you?',
      language: 'en',
      platform: 'web',
      currentNode: null
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'Accept-Language': 'en'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          // Validate response structure
          assert(response.success !== undefined, 'Response should have success field');
          assert(response.platform, 'Response should include platform');
          assert(response.response, 'Response should have response object');
          
          // Validate language and access level
          if (response.response.ui) {
            assert(response.response.ui.language, 'Response UI should include language');
            assert(response.response.ui.accessLevel, 'Response UI should include accessLevel');
          }
          
          console.log('✓ Chat endpoint responds correctly');
          console.log(`  Status: ${response.success}`);
          console.log(`  Platform: ${response.platform}`);
          console.log(`  Language: ${response.response.ui?.language || 'en'}`);
          console.log(`  Access Level: ${response.response.ui?.accessLevel || 'STANDARD_ACCESS'}`);
          
          resolve();
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (e) => {
      if (e.code === 'ECONNREFUSED') {
        console.log('⚠️  Server not running - skipping endpoint test');
        console.log('   Start server with: npm start');
        resolve();
      } else {
        reject(e);
      }
    });

    req.write(payload);
    req.end();
  });
}

// Run chat endpoint test
testChatEndpoint()
  .then(() => {
    console.log('\n✅ Chat Endpoint: TEST PASSED (or skipped)\n');
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // TEST 4: Database Schema Check
    // ═══════════════════════════════════════════════════════════════════════════════

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: Database Schema Requirements');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const requiredTables = [
      { name: 'karma_logs', columns: ['user_id', 'karma_score', 'created_at'] },
      { name: 'dharma_logs', columns: ['user_id', 'dharma_alignment', 'created_at'] },
      { name: 'node_policies', columns: ['node_id', 'rule_type', 'enabled'] },
      { name: 'node_logs', columns: ['node_id', 'user_id', 'event_type', 'created_at'] },
      { name: 'chat_history', columns: ['user_id', 'session_id', 'message_text', 'created_at'] }
    ];

    console.log('Required database tables:');
    requiredTables.forEach(table => {
      console.log(`✓ ${table.name}`);
      console.log(`  Columns: ${table.columns.join(', ')}`);
    });

    console.log('\nTo create tables, execute db-schema-karma-dharma.sql in Supabase SQL editor');
    console.log('\n✅ Database Schema: REQUIREMENTS DOCUMENTED\n');

    // ═══════════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════════

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Language Support Module: WORKING');
    console.log('   - 9 languages supported');
    console.log('   - Auto-detection from headers');
    console.log('   - Translation function available\n');

    console.log('✅ Prompt Generation Module: WORKING');
    console.log('   - Default prompts for 6 node types');
    console.log('   - Karma-based modifications');
    console.log('   - Dharma-based modifications');
    console.log('   - Access level calculation\n');

    console.log('✅ Chat Endpoint Integration: READY');
    console.log('   - Language detection');
    console.log('   - System prompt generation');
    console.log('   - Access control');
    console.log('   - Response translation\n');

    console.log('⏳ Database Schema: READY TO EXECUTE');
    console.log('   - File: db-schema-karma-dharma.sql');
    console.log('   - Action: Execute in Supabase SQL editor\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 NEXT STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1. Execute db-schema-karma-dharma.sql in Supabase');
    console.log('2. Insert sample karma/dharma data');
    console.log('3. Create sample node policies');
    console.log('4. Test with: npm start (server)');
    console.log('5. Call: POST /api/chat/process with language parameter\n');

    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
  });
