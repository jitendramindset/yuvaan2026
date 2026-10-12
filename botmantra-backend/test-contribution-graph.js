#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTION GRAPH - Test & Demo
// ═══════════════════════════════════════════════════════════════════════════════
// Tests the contribution graph builder service

const { buildContributionGraph, getContributionGraph, DEFAULT_WEIGHTS } = require('./services/contribution-graph');

// Test UUIDs (replace with real ones from your database)
const TEST_TRANSACTION_ID = '550e8400-e29b-41d4-a716-446655440001';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: Build Contribution Graph with Multiple Participants
// ═══════════════════════════════════════════════════════════════════════════════

async function testBuildGraph() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 1: Build Contribution Graph                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const options = {
    // Owner context
    owner_time_spent: 45,           // 45 seconds
    owner_device_touches: 3,        // 3 interactions
    owner_refresh_count: 1,         // 1 refresh

    // Serving node
    serving_node_id: '550e8400-e29b-41d4-a716-446655440010',
    serving_time_spent: 20,

    // Relay node
    relay_node_id: '550e8400-e29b-41d4-a716-446655440011',
    relay_time_spent: 8,

    // Device info
    device_id: 'device-fingerprint-abc123',
    device_type: 'mobile',
    session_id: 'session-xyz789',

    // Cache provider
    cache_node_id: '550e8400-e29b-41d4-a716-446655440012',

    // UI renderer
    ui_renderer_node_id: '550e8400-e29b-41d4-a716-446655440013'
  };

  const result = await buildContributionGraph(TEST_TRANSACTION_ID, options);

  console.log('📊 Build Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log(`\n✅ Graph built successfully!`);
    console.log(`   Entries: ${result.entries}`);
    console.log(`   Total Weight: ${result.total_weight}`);
    console.log(`   Normalization Factor: ${result.normalization_factor}`);
    
    if (result.participants) {
      console.log(`\n📋 Participants:`);
      result.participants.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.contribution_type.toUpperCase()}`);
        console.log(`      Node: ${p.node_id}`);
        console.log(`      Base Weight: ${p.base_weight}`);
        console.log(`      Normalized Weight: ${p.normalized_weight}`);
        console.log(`      Time Spent: ${p.time_spent}s`);
        console.log(`      Formula: ${p.weight_formula}`);
        console.log('');
      });
    }
  } else {
    console.log(`\n❌ Failed to build graph: ${result.error}`);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: Fetch Existing Contribution Graph
// ═══════════════════════════════════════════════════════════════════════════════

async function testGetGraph() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 2: Fetch Contribution Graph                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const result = await getContributionGraph(TEST_TRANSACTION_ID);

  console.log('📊 Fetch Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log(`\n✅ Graph fetched successfully!`);
    console.log(`   Entries: ${result.entries}`);
    console.log(`   Total Weight: ${result.total_weight}`);
  } else {
    console.log(`\n❌ Failed to fetch graph: ${result.error}`);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: Verify Weight Distribution
// ═══════════════════════════════════════════════════════════════════════════════

async function testWeightDistribution() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 3: Verify Weight Distribution                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Default Weights Configuration:');
  Object.entries(DEFAULT_WEIGHTS).forEach(([type, weight]) => {
    console.log(`   ${type.padEnd(15)}: ${weight.toFixed(4)} (${(weight * 100).toFixed(2)}%)`);
  });

  const totalDefaultWeight = Object.values(DEFAULT_WEIGHTS).reduce((sum, w) => sum + w, 0);
  console.log(`\n   Total: ${totalDefaultWeight.toFixed(4)}`);

  if (Math.abs(totalDefaultWeight - 1.0) < 0.01) {
    console.log(`   ✅ Weights sum to 1.0 (valid)`);
  } else {
    console.log(`   ⚠️  Weights do NOT sum to 1.0 (normalization will adjust)`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 4: Simulate Payout Calculation
// ═══════════════════════════════════════════════════════════════════════════════

async function testPayoutCalculation() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 4: Simulate Payout Calculation                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const graph = await getContributionGraph(TEST_TRANSACTION_ID);

  if (!graph.success) {
    console.log('❌ Cannot calculate payout - no graph available');
    return;
  }

  const FEE_POOL = 100.00; // Simulate $100 fee pool

  console.log(`💰 Fee Pool: $${FEE_POOL.toFixed(2)}`);
  console.log(`\n📊 Payout Distribution:`);

  let totalPayout = 0;

  graph.participants.forEach((participant, i) => {
    const payout = FEE_POOL * participant.normalized_weight;
    totalPayout += payout;

    console.log(`\n   ${i + 1}. ${participant.contribution_type.toUpperCase()}`);
    console.log(`      Weight: ${participant.normalized_weight} (${(participant.normalized_weight * 100).toFixed(2)}%)`);
    console.log(`      Payout: $${payout.toFixed(2)}`);
    console.log(`      Time Spent: ${participant.time_spent}s`);
    console.log(`      Node Role: ${participant.node_role}`);
  });

  console.log(`\n   ─────────────────────────────`);
  console.log(`   Total Distributed: $${totalPayout.toFixed(2)}`);
  console.log(`   Remaining: $${(FEE_POOL - totalPayout).toFixed(2)}`);

  if (Math.abs(totalPayout - FEE_POOL) < 0.01) {
    console.log(`   ✅ Full pool distributed (valid)`);
  } else {
    console.log(`   ⚠️  Payout mismatch (check normalization)`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║            CONTRIBUTION GRAPH BUILDER - TEST SUITE                            ║');
  console.log('║                                                                               ║');
  console.log('║  Tests:                                                                       ║');
  console.log('║  1. Build contribution graph with multiple participants                       ║');
  console.log('║  2. Fetch existing contribution graph                                         ║');
  console.log('║  3. Verify weight distribution                                                ║');
  console.log('║  4. Simulate payout calculation                                               ║');
  console.log('║                                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Starting tests at ${new Date().toISOString()}\n`);

  try {
    // Test 3: Weight distribution (no DB needed)
    await testWeightDistribution();

    // Test 1: Build graph
    await testBuildGraph();

    // Test 2: Fetch graph
    await testGetGraph();

    // Test 4: Payout calculation
    await testPayoutCalculation();

    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(80));
    console.log('✅ All tests completed');
    console.log(`⏱️  Completed at ${new Date().toISOString()}`);
    console.log('═'.repeat(80));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal test error:', error);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📚 USAGE EXAMPLES:');
console.log('\n1. Build contribution graph for a transaction:');
console.log('   ```javascript');
console.log('   const { buildContributionGraph } = require("./services/contribution-graph");');
console.log('   const result = await buildContributionGraph(transactionId, {');
console.log('     owner_time_spent: 45,');
console.log('     serving_node_id: "node-uuid",');
console.log('     device_id: "fingerprint"');
console.log('   });');
console.log('   ```\n');

console.log('2. Fetch existing graph:');
console.log('   ```javascript');
console.log('   const { getContributionGraph } = require("./services/contribution-graph");');
console.log('   const graph = await getContributionGraph(transactionId);');
console.log('   ```\n');

console.log('3. Calculate payouts:');
console.log('   ```javascript');
console.log('   const feePool = 100.00;');
console.log('   graph.participants.forEach(p => {');
console.log('     const payout = feePool * p.normalized_weight;');
console.log('     console.log(`${p.contribution_type}: $${payout}`);');
console.log('   });');
console.log('   ```\n');

// Start tests if run directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testBuildGraph,
  testGetGraph,
  testWeightDistribution,
  testPayoutCalculation
};
