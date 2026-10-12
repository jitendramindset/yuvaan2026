/**
 * Comprehensive API Test Suite for Generated Routes
 * Tests all auto-generated CRUD endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'test@botmantra.com';
const TEST_PASSWORD = 'Test@123456';

class ComprehensiveAPITester {
  constructor() {
    this.authToken = null;
    this.businessId = null;
    this.userId = null;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating...');
      const response = await axios.post(`${BASE_URL}/auth/signin`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      
      this.authToken = response.data.access_token || response.data.token;
      this.userId = response.data.user?.id;
      this.businessId = response.data.user?.business_id;
      console.log('✅ Authentication successful\n');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed - trying signup');
      
      try {
        await axios.post(`${BASE_URL}/auth/signup`, {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: 'Test User'
        });
        
        return await this.authenticate();
      } catch (signupError) {
        console.error('❌ Signup failed:', signupError.message);
        return false;
      }
    }
  }

  async testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
    this.testResults.total++;
    
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        data,
        validateStatus: () => true
      };
      
      const response = await axios(config);
      
      if (response.status === expectedStatus) {
        this.testResults.passed++;
        this.testResults.details.push({
          endpoint: `${method.toUpperCase()} ${endpoint}`,
          status: 'PASS',
          responseTime: response.headers['x-response-time'] || 'N/A'
        });
        return { success: true, data: response.data };
      } else {
        throw new Error(`Expected ${expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        endpoint: `${method.toUpperCase()} ${endpoint}`,
        status: 'FAIL',
        error: error.response?.data?.error || error.message
      });
      return { success: false, error };
    }
  }

  async testCRUDSequence(routeName, sampleData) {
    console.log(`\n🧪 Testing ${routeName}...`);
    
    let createdId = null;
    
    // GET ALL
    const getAll = await this.testEndpoint('GET', `/${routeName}`);
    console.log(`  ✓ GET /${routeName}`);
    
    // CREATE
    const create = await this.testEndpoint('POST', `/${routeName}`, sampleData, 201);
    if (create.success && create.data?.data?.id) {
      createdId = create.data.data.id;
      console.log(`  ✓ POST /${routeName} (ID: ${createdId})`);
      
      // GET BY ID
      await this.testEndpoint('GET', `/${routeName}/${createdId}`);
      console.log(`  ✓ GET /${routeName}/:id`);
      
      // UPDATE
      await this.testEndpoint('PUT', `/${routeName}/${createdId}`, { ...sampleData, updated: true });
      console.log(`  ✓ PUT /${routeName}/:id`);
      
      // DELETE
      await this.testEndpoint('DELETE', `/${routeName}/${createdId}`);
      console.log(`  ✓ DELETE /${routeName}/:id`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive API Tests\n');
    console.log(`📍 Base URL: ${BASE_URL}\n`);
    
    if (!(await this.authenticate())) {
      console.error('\n❌ Cannot proceed without authentication');
      return this.testResults;
    }
    
    // Test AI Routes
    console.log('\n═══ AI AGENT TESTS ═══');
    await this.testCRUDSequence('ai-agent-rules', {
      rule_name: 'Test Rule',
      trigger_type: 'time',
      condition_json: {},
      action_json: {},
      is_active: true
    });
    
    await this.testCRUDSequence('ai-chat-sessions', {
      session_name: 'Test Session'
    });
    
    // Test Business Routes
    console.log('\n═══ BUSINESS TESTS ═══');
    await this.testCRUDSequence('business-branding', {
      app_name: 'Test App',
      primary_color: '#000000',
      theme_mode: 'light'
    });
    
    await this.testCRUDSequence('business-documents', {
      doc_title: 'Test Document',
      doc_content: 'Test content',
      doc_kind: 'manual'
    });
    
    // Test CRM Routes
    console.log('\n═══ CRM TESTS ═══');
    await this.testCRUDSequence('clients', {
      name: 'Test Client',
      email: 'client@test.com',
      status: 'active'
    });
    
    return this.testResults;
  }

  printResults() {
    console.log('\n\n═══════════════════════════════════════');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`✅ Passed:  ${this.testResults.passed}/${this.testResults.total}`);
    console.log(`❌ Failed:  ${this.testResults.failed}/${this.testResults.total}`);
    
    const passRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(2);
    console.log(`\n📈 Pass Rate: ${passRate}%\n`);
    
    const failed = this.testResults.details.filter(d => d.status === 'FAIL');
    if (failed.length > 0) {
      console.log('❌ Failed Tests:');
      failed.forEach(f => console.log(`   ${f.endpoint}: ${f.error}`));
    }
    
    fs.writeFileSync(
      path.join(__dirname, 'api-test-results.json'),
      JSON.stringify(this.testResults, null, 2)
    );
  }
}

if (require.main === module) {
  const tester = new ComprehensiveAPITester();
  tester.runAllTests()
    .then(() => {
      tester.printResults();
      process.exit(tester.testResults.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = ComprehensiveAPITester;
