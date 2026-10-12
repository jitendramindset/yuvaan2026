const { supabase } = require('./config/supabase');

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  DATABASE FUNCTIONS TEST SUITE                             ║
 * ║  Comprehensive Testing of All Node Database Functions     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

async function testDatabaseFunctions() {
  console.log('🧪 DATABASE FUNCTIONS TEST SUITE');
  console.log('=' .repeat(50));

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    notImplemented: 0,
    results: []
  };

  // Test helper function
  async function testFunction(functionName, params = {}, description = '') {
    testResults.total++;
    console.log(`\n🔍 Testing: ${functionName}`);
    if (description) console.log(`   ${description}`);

    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        testResults.failed++;
        testResults.results.push({
          function: functionName,
          status: 'FAILED',
          error: error.message,
          params
        });
        return false;
      } else {
        console.log(`   ✅ PASSED: ${JSON.stringify(data).substring(0, 100)}...`);
        testResults.passed++;
        testResults.results.push({
          function: functionName,
          status: 'PASSED',
          data: typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : data,
          params
        });
        return true;
      }
    } catch (error) {
      console.log(`   ❌ EXCEPTION: ${error.message}`);
      testResults.failed++;
      testResults.results.push({
        function: functionName,
        status: 'EXCEPTION',
        error: error.message,
        params
      });
      return false;
    }
  }

  // 1. Authentication & Security Functions
  console.log('\n🔐 TESTING: Authentication & Security Functions');

  await testFunction('validate_node_action',
    { p_nid: 'test-node-123', p_requester: '550e8400-e29b-41d4-a716-446655440000' },
    'Validate node action permissions'
  );

  await testFunction('validate_node_execution',
    { p_nid: 'test-node-123', p_action: 'test_action', p_requester: '550e8400-e29b-41d4-a716-446655440000' },
    'Validate node execution permissions'
  );

  // 2. Execution & Runtime Functions
  console.log('\n🚀 TESTING: Execution & Runtime Functions');

  await testFunction('node_runtime_execute',
    {
      p_nid: 'test-node-123',
      p_requester: '550e8400-e29b-41d4-a716-446655440000',
      p_action: 'test_action',
      p_payload: { test: true },
      p_principle: 'Neutral'
    },
    'Execute node runtime action'
  );

  // 3. Node Identity Functions
  console.log('\n🆔 TESTING: Node Identity Functions');

  await testFunction('generate_node_id',
    { owner_id: 123 },
    'Generate node ID from owner ID'
  );

  await testFunction('generate_node_hash',
    { owner_uuid: '550e8400-e29b-41d4-a716-446655440000' },
    'Generate node hash from owner UUID'
  );

  await testFunction('select_best_node',
    {},
    'Select best available node'
  );

  await testFunction('find_nearest_node',
    { in_lat: 40.7128, in_lon: -74.0060 },
    'Find nearest node by coordinates'
  );

  // 4. Logging Functions
  console.log('\n📝 TESTING: Logging Functions');

  await testFunction('log_node_execution',
    {
      in_nid: 'test-node-123',
      in_action: 'test_log',
      in_requester: '550e8400-e29b-41d4-a716-446655440000',
      in_status: 'TEST',
      in_exec_type: 'TEST'
    },
    'Log node execution (version 1)'
  );

  await testFunction('log_node_execution',
    {
      in_nid: 'test-node-123',
      in_action: 'test_log',
      in_payload: 'test payload',
      in_result: 'test result'
    },
    'Log node execution (version 2)'
  );

  // 5. Event Functions
  console.log('\n📡 TESTING: Event Functions');

  await testFunction('node_event_ingest',
    {
      p_nid: 'test-node-123',
      p_action: 'test_event',
      p_payload: { event_data: 'test' }
    },
    'Ingest node event'
  );

  // 6. Billing Functions
  console.log('\n💰 TESTING: Billing Functions');

  await testFunction('calculate_node_bill',
    {
      p_nid: 'test-node-123',
      p_owner: '550e8400-e29b-41d4-a716-446655440000',
      p_minutes: 60
    },
    'Calculate node billing'
  );

  // 7. System Functions
  console.log('\n🔧 TESTING: System Functions');

  await testFunction('node_health_check',
    {},
    'Check node system health'
  );

  await testFunction('wallet_transfer_node',
    {
      from_nid: 'test-node-123',
      to_nid: 'test-node-456',
      amt: 100.00
    },
    'Transfer between node wallets'
  );

  await testFunction('st_node',
    { g: 'POINT(-74.0060 40.7128)' },
    'Spatial node operations'
  );

  // 8. Trigger Functions (may not be directly callable)
  console.log('\n🎯 TESTING: Trigger Functions (May Fail - Expected)');

  try {
    await testFunction('auto_attach_node_key', {}, 'Auto attach node key trigger');
  } catch (e) {
    console.log('   ⚠️  Expected: auto_attach_node_key is a trigger function');
    testResults.notImplemented++;
  }

  try {
    await testFunction('cache_node_update', {}, 'Cache node update trigger');
  } catch (e) {
    console.log('   ⚠️  Expected: cache_node_update is a trigger function');
    testResults.notImplemented++;
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Functions Tested: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Not Implemented/Triggers: ${testResults.notImplemented}`);

  const successRate = ((testResults.passed / (testResults.total - testResults.notImplemented)) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);

  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  testResults.results.forEach((result, index) => {
    const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${status} ${result.function}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.data) console.log(`   Data: ${result.data}`);
  });

  return testResults;
}

// Run the tests
testDatabaseFunctions().catch(console.error);