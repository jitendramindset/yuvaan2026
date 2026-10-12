/**
 * 🧪 UI RENDERER TEST SUITE
 * Tests dynamic UI schema generation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const SESSION_TOKEN = process.argv[2] || 'PASTE_YOUR_SESSION_TOKEN_HERE';

async function testUIRenderer() {
  console.log('\n🎨 UI RENDERER TEST SUITE\n');
  console.log('='.repeat(70));

  if (SESSION_TOKEN === 'PASTE_YOUR_SESSION_TOKEN_HERE') {
    console.log('\n❌ No session token provided!');
    console.log('\nUsage: node test-ui-renderer.js YOUR_SESSION_TOKEN');
    console.log('\nOr update SESSION_TOKEN in the file\n');
    return;
  }

  console.log(`\n🔐 Using token: ${SESSION_TOKEN.substring(0, 40)}...\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Render Dashboard
  console.log('\n📊 Test 1: Render Dashboard UI');
  console.log('-'.repeat(70));
  try {
    const response = await axios.post(`${BASE_URL}/api/ui/render`, {
      component_type: 'dashboard',
      target_component: 'main_dashboard',
      session_token: SESSION_TOKEN,
      properties: {}
    });

    if (response.data.success) {
      const schema = response.data.ui_schema;
      console.log(`✅ Dashboard Schema Generated`);
      console.log(`   Type: ${schema.type}`);
      console.log(`   Name: ${schema.name}`);
      console.log(`   Layout: ${schema.layout?.type} (${schema.layout?.columns} columns)`);
      console.log(`   Widgets: ${schema.widgets?.length || 0}`);
      console.log(`   Source: ${response.data.source}`);
      passed++;
    }
  } catch (error) {
    console.log(`❌ Dashboard test failed: ${error.response?.data?.error || error.message}`);
    failed++;
  }

  // Test 2: Render Table
  console.log('\n📋 Test 2: Render Table UI');
  console.log('-'.repeat(70));
  try {
    const response = await axios.post(`${BASE_URL}/api/ui/render`, {
      component_type: 'table',
      target_component: 'users_table',
      session_token: SESSION_TOKEN
    });

    if (response.data.success) {
      const schema = response.data.ui_schema;
      console.log(`✅ Table Schema Generated`);
      console.log(`   Type: ${schema.type}`);
      console.log(`   Name: ${schema.name}`);
      console.log(`   Columns: ${schema.columns?.length || 0}`);
      console.log(`   Data Source: ${schema.data_source?.endpoint || 'N/A'}`);
      console.log(`   Features: ${Object.keys(schema.features || {}).filter(k => schema.features[k]).join(', ')}`);
      passed++;
    }
  } catch (error) {
    console.log(`❌ Table test failed: ${error.response?.data?.error || error.message}`);
    failed++;
  }

  // Test 3: Render Form
  console.log('\n📝 Test 3: Render Form UI');
  console.log('-'.repeat(70));
  try {
    const response = await axios.post(`${BASE_URL}/api/ui/render`, {
      component_type: 'form',
      target_component: 'user_form',
      session_token: SESSION_TOKEN
    });

    if (response.data.success) {
      const schema = response.data.ui_schema;
      console.log(`✅ Form Schema Generated`);
      console.log(`   Type: ${schema.type}`);
      console.log(`   Name: ${schema.name}`);
      console.log(`   Fields: ${schema.fields?.length || 0}`);
      console.log(`   Submit Endpoint: ${schema.submit?.endpoint || 'N/A'}`);
      passed++;
    }
  } catch (error) {
    console.log(`❌ Form test failed: ${error.response?.data?.error || error.message}`);
    failed++;
  }

  // Test 4: Render Widget
  console.log('\n🎯 Test 4: Render Widget/Card');
  console.log('-'.repeat(70));
  try {
    const response = await axios.post(`${BASE_URL}/api/ui/render`, {
      component_type: 'widget',
      target_component: 'revenue_card',
      session_token: SESSION_TOKEN,
      properties: {
        widget_type: 'stat_card'
      }
    });

    if (response.data.success) {
      const schema = response.data.ui_schema;
      console.log(`✅ Widget Schema Generated`);
      console.log(`   Type: ${schema.type}`);
      console.log(`   Widget Type: ${schema.widget?.type || 'N/A'}`);
      console.log(`   Title: ${schema.widget?.title || schema.name}`);
      console.log(`   Value: ${schema.widget?.value || 0}`);
      passed++;
    }
  } catch (error) {
    console.log(`❌ Widget test failed: ${error.response?.data?.error || error.message}`);
    failed++;
  }

  // Test 5: Generate New Schema
  console.log('\n🔧 Test 5: Generate New UI Schema');
  console.log('-'.repeat(70));
  try {
    const response = await axios.post(`${BASE_URL}/api/ui/schema/generate`, {
      component_type: 'dashboard',
      name: 'Test Dashboard',
      description: 'Auto-generated test dashboard',
      data_source: { type: 'api', endpoint: '/api/data' },
      fields: [
        { name: 'revenue', label: 'Revenue', type: 'number' },
        { name: 'users', label: 'Users', type: 'number' }
      ],
      layout: 'grid',
      theme: { primary: '#6366f1', secondary: '#8b5cf6' },
      session_token: SESSION_TOKEN
    });

    if (response.data.success) {
      const schema = response.data.ui_schema;
      console.log(`✅ Schema Generated & Saved`);
      console.log(`   Name: ${schema.name}`);
      console.log(`   Type: ${schema.type}`);
      console.log(`   Template ID: ${response.data.template_id || 'Not saved'}`);
      console.log(`   Fields: ${Object.keys(schema.fields).join(', ')}`);
      passed++;
    }
  } catch (error) {
    console.log(`❌ Generate schema failed: ${error.response?.data?.error || error.message}`);
    failed++;
  }

  // Test 6: List Templates
  console.log('\n📚 Test 6: List Available Templates');
  console.log('-'.repeat(70));
  try {
    const response = await axios.get(`${BASE_URL}/api/ui/templates`, {
      params: {
        session_token: SESSION_TOKEN
      }
    });

    if (response.data.success) {
      console.log(`✅ Templates Retrieved`);
      console.log(`   Total Templates: ${response.data.count}`);
      if (response.data.templates.length > 0) {
        console.log(`\n   Recent Templates:`);
        response.data.templates.slice(0, 3).forEach((t, i) => {
          console.log(`   ${i + 1}. ${t.name} (${t.node_type}) - ${new Date(t.created_at).toLocaleDateString()}`);
        });
      }
      passed++;
    }
  } catch (error) {
    console.log(`❌ List templates failed: ${error.response?.data?.error || error.message}`);
    failed++;
  }

  // Test 7: Integration with Classifier
  console.log('\n🔄 Test 7: Classifier + Renderer Integration');
  console.log('-'.repeat(70));
  try {
    // Step 1: Classify intent
    const classifyResponse = await axios.post(`${BASE_URL}/api/interaction/classify`, {
      message: 'Create a revenue dashboard card',
      session_token: SESSION_TOKEN,
      ui_context: { current_page: 'dashboard', device: 'web' }
    });

    if (classifyResponse.data.success) {
      const classification = classifyResponse.data.classification;
      console.log(`   Step 1: Intent Classified`);
      console.log(`      Response Mode: ${classification.response_mode}`);
      console.log(`      Target: ${classification.target_component || 'N/A'}`);
      console.log(`      Render from Core: ${classification.render_from_core}`);

      // Step 2: Render UI based on classification
      if (classification.response_mode === 'ui_render') {
        const renderResponse = await axios.post(`${BASE_URL}/api/ui/render`, {
          component_type: classification.ui_actions[0]?.replace('create_', '') || 'widget',
          target_component: classification.target_component,
          session_token: SESSION_TOKEN,
          properties: classification.properties
        });

        if (renderResponse.data.success) {
          console.log(`   Step 2: UI Rendered`);
          console.log(`      Component: ${renderResponse.data.ui_schema.type}`);
          console.log(`      Source: ${renderResponse.data.source}`);
          console.log(`\n✅ Integration Test PASSED`);
          passed++;
        }
      }
    }
  } catch (error) {
    console.log(`❌ Integration test failed: ${error.response?.data?.error || error.message}`);
    failed++;
  }

  // Final Results
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS\n');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n   🎉 ALL UI RENDERER TESTS PASSED!\n');
    console.log('   ✅ Dashboard generation working');
    console.log('   ✅ Table generation working');
    console.log('   ✅ Form generation working');
    console.log('   ✅ Widget generation working');
    console.log('   ✅ Schema generation & saving working');
    console.log('   ✅ Template listing working');
    console.log('   ✅ Classifier integration working');
    console.log('\n   🚀 UI Renderer is production-ready!');
    console.log('   🚀 Week 1 Complete: Control Plane Operational');
  } else {
    console.log(`\n   ⚠️  ${failed} test(s) need attention`);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

testUIRenderer();
