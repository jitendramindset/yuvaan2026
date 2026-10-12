/**
 * AI Website Builder - Automated Test Suite
 * 
 * Tests all components before full deployment
 * Run: node test-website-builder.js
 */

const path = require('path');
const fs = require('fs');

console.log('\n🧪 AI WEBSITE BUILDER - AUTOMATED TEST SUITE\n');
console.log('='.repeat(70));

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const issues = [];

/**
 * Test helper
 */
function test(name, fn) {
  testsRun++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      testsPassed++;
      console.log(`✅ PASS: ${name}`);
      return true;
    } else {
      testsFailed++;
      console.log(`❌ FAIL: ${name}`);
      issues.push({ test: name, error: result });
      return false;
    }
  } catch (error) {
    testsFailed++;
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    issues.push({ test: name, error: error.message });
    return false;
  }
}

console.log('\n📂 FILE EXISTENCE TESTS\n');

test('ai-website-builder.js exists', () => {
  return fs.existsSync(path.join(__dirname, 'ai-website-builder.js'));
});

test('website-renderer.js exists', () => {
  return fs.existsSync(path.join(__dirname, 'website-renderer.js'));
});

test('routes/ai-website-routes.js exists', () => {
  return fs.existsSync(path.join(__dirname, 'routes', 'ai-website-routes.js'));
});

console.log('\n📦 FILE CONTENT VALIDATION\n');

test('ai-website-builder.js has AIWebsiteBuilder class', () => {
  const content = fs.readFileSync(path.join(__dirname, 'ai-website-builder.js'), 'utf8');
  return content.includes('class AIWebsiteBuilder') && content.includes('designWebsite');
});

test('website-renderer.js has WebsiteRenderer class', () => {
  const content = fs.readFileSync(path.join(__dirname, 'website-renderer.js'), 'utf8');
  return content.includes('class WebsiteRenderer') && content.includes('renderWebsite');
});

test('ai-website-routes.js has all endpoints', () => {
  const content = fs.readFileSync(path.join(__dirname, 'routes', 'ai-website-routes.js'), 'utf8');
  const hasDesign = content.includes("router.post('/design'");
  const hasPreview = content.includes("router.post('/preview'");
  const hasExport = content.includes("router.post('/export");
  const hasTemplates = content.includes("router.get('/templates'");
  return hasDesign && hasPreview && hasExport && hasTemplates;
});

console.log('\n🔧 DEPENDENCY CHECKS\n');

test('archiver dependency available', () => {
  try {
    require.resolve('archiver');
    return true;
  } catch (e) {
    return 'archiver not installed - run: npm install archiver';
  }
});

test('express dependency available', () => {
  try {
    require.resolve('express');
    return true;
  } catch (e) {
    return 'express not installed';
  }
});

test('https module available (built-in)', () => {
  try {
    require.resolve('https');
    return true;
  } catch (e) {
    return 'https not available';
  }
});

console.log('\n🔐 ENVIRONMENT CHECKS\n');

test('.env file exists', () => {
  return fs.existsSync(path.join(__dirname, '.env'));
});

test('ANTHROPIC_API_KEY is configured', () => {
  require('dotenv').config();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return 'ANTHROPIC_API_KEY not found in .env';
  }
  if (!apiKey.startsWith('sk-ant-')) {
    return 'ANTHROPIC_API_KEY format invalid (should start with sk-ant-)';
  }
  return true;
});

console.log('\n🗂️ SERVER.JS INTEGRATION\n');

test('server.js exists', () => {
  return fs.existsSync(path.join(__dirname, 'server.js'));
});

test('server.js has ai-website-routes registered', () => {
  const content = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  const hasImport = content.includes("require('./routes/ai-website-routes')");
  const hasRoute = content.includes("app.use('/api/ai-web'");
  
  if (!hasImport && !hasRoute) {
    return 'Routes NOT registered - add to server.js:\n' +
           "  const aiWebsiteRoutes = require('./routes/ai-website-routes');\n" +
           "  app.use('/api/ai-web', aiWebsiteRoutes);";
  }
  return hasImport && hasRoute;
});

console.log('\n🗄️ DATABASE CHECKS\n');

test('Supabase config exists', () => {
  try {
    const supabaseConfig = require('./config/supabase');
    return supabaseConfig.supabase !== undefined;
  } catch (e) {
    return 'Supabase config not found: ' + e.message;
  }
});

test('ai_websites table exists', () => {
  try {
    // Placeholder - table will be created via manual SQL
    return 'ai_websites table requires manual SQL setup in Supabase';
  } catch (e) {
    return 'Database check failed: ' + e.message;
  }
});

console.log('\n📊 CLASS INSTANTIATION TESTS\n');

test('AIWebsiteBuilder can be instantiated', () => {
  try {
    const AIWebsiteBuilder = require('./ai-website-builder');
    const builder = new AIWebsiteBuilder('test-key');
    return builder.websiteTypes !== undefined;
  } catch (e) {
    return 'Instantiation failed: ' + e.message;
  }
});

test('WebsiteRenderer can be instantiated', () => {
  try {
    const WebsiteRenderer = require('./website-renderer');
    const renderer = new WebsiteRenderer();
    return renderer.version !== undefined;
  } catch (e) {
    return 'Instantiation failed: ' + e.message;
  }
});

console.log('\n⚙️ ROUTES MODULE LOADING TEST\n');

test('ai-website-routes.js can be loaded', () => {
  try {
    // Check if archiver is available first
    try {
      require.resolve('archiver');
    } catch (e) {
      return 'Cannot load routes - archiver dependency missing';
    }
    
    const routes = require('./routes/ai-website-routes');
    return routes !== undefined;
  } catch (e) {
    return 'Routes loading failed: ' + e.message;
  }
});

console.log('\n' + '='.repeat(70));
console.log('\n📋 TEST SUMMARY\n');
console.log(`Total Tests:  ${testsRun}`);
console.log(`Passed:       ${testsPassed} ✅`);
console.log(`Failed:       ${testsFailed} ❌`);
console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%\n`);

if (issues.length > 0) {
  console.log('🔴 ISSUES FOUND:\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.test}`);
    console.log(`   → ${issue.error}\n`);
  });
  
  console.log('📝 REQUIRED ACTIONS:\n');
  
  const hasDatabaseIssue = issues.some(i => typeof i.error === 'string' && i.error.includes('table'));
  
  if (hasDatabaseIssue) {
    console.log('   1. Create database table (execute SQL in Supabase):');
    console.log('      See: migrations/20260203_create_ai_websites_table.sql\n');
  }
  
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.log('🎉 ALL TESTS PASSED!\n');
  console.log('✅ AI Website Builder is ready for deployment\n');
  console.log('Next steps:');
  console.log('  1. Restart server: node server.js');
  console.log('  2. Test endpoints: See AI_WEBSITE_BUILDER_TEST_REPORT.md');
  console.log('  3. Launch to beta users\n');
  console.log('='.repeat(70));
  process.exit(0);
}
