#!/usr/bin/env node

/**
 * Vanshawali API Test Script
 * Tests genealogy endpoints after database setup
 */

const axios = require('axios');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const tests = [
  {
    name: 'Get User Lineage (No Data)',
    method: 'GET',
    url: `${API_URL}/api/vanshawali/user-lineage/test-user-id`,
    expectedStatus: 200,
    check: (response) => {
      return response.data.success === true && 
             response.data.data.generation === 0 &&
             response.data.data.ancestryLevel === 'Self';
    }
  },
  {
    name: 'Get Family Tree (No Data)',
    method: 'GET',
    url: `${API_URL}/api/vanshawali/family-tree/test-family-id`,
    expectedStatus: 200,
    check: (response) => {
      return response.data.success === true && 
             response.data.data.family_name === null;
    }
  },
  {
    name: 'Get Statistics',
    method: 'GET',
    url: `${API_URL}/api/vanshawali/statistics`,
    expectedStatus: 200,
    check: (response) => {
      return response.data.success === true;
    }
  }
];

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        VANSHAWALI API TEST SUITE                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Testing API at: ${API_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000
      });

      if (response.status === test.expectedStatus && test.check(response)) {
        console.log(`   ✅ PASS: Status ${response.status}, Data valid\n`);
        passed++;
      } else {
        console.log(`   ❌ FAIL: Status ${response.status}, Data invalid\n`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}\n`);
      failed++;
    }
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║ RESULTS: ${passed} passed, ${failed} failed`);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  return failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
});
