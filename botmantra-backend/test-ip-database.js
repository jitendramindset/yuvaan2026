// Test IP-based Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');

console.log('=== TESTING IP-BASED DATABASE (72.61.248.216:8000) ===\n');

// Test 1: Supabase client with IP address
async function testIPSupabase() {
  console.log('Test 1: Supabase Client via IP');
  console.log('URL: http://72.61.248.216:8000');
  
  const supabase = createClient(
    'http://72.61.248.216:8000',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY4MTQ0MTIyLCJleHAiOjE5MjU4MjQxMjJ9.DdPucnoKYPiGA7wxV5_V6f3d1bPV1wl4UgUbp9hWpOM'
  );

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Query Failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection Successful!');
    console.log('Users found:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Sample user:', data[0]);
    }
    return true;
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    return false;
  }
}

// Test 2: Check other critical tables
async function testCriticalTables() {
  console.log('\n\nTest 2: Critical Tables Check');
  
  const supabase = createClient(
    'http://72.61.248.216:8000',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY4MTQ0MTIyLCJleHAiOjE5MjU4MjQxMjJ9.DdPucnoKYPiGA7wxV5_V6f3d1bPV1wl4UgUbp9hWpOM'
  );

  const tables = [
    'users',
    'core_node',
    'node_identity',
    'roles',
    'permissions',
    'dashboard_templates',
    'dashboard_widgets',
    'karma_ledger',
    'wallet_accounts'
  ];

  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌', table, '- Error:', error.message);
        results[table] = false;
      } else {
        console.log('✅', table, '- Exists');
        results[table] = true;
      }
    } catch (error) {
      console.log('❌', table, '- Exception:', error.message);
      results[table] = false;
    }
  }
  
  return results;
}

// Test 3: Test with service role key from backend .env
async function testWithBackendCreds() {
  console.log('\n\nTest 3: Using Backend Credentials (api.mantravat.cloud)');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://api.mantravat.cloud/project/default',
    process.env.SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Backend credentials failed:', error.message);
      return false;
    }
    
    console.log('✅ Backend credentials work!');
    return true;
  } catch (error) {
    console.log('❌ Backend credentials error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const test1 = await testIPSupabase();
  const tableResults = await testCriticalTables();
  const test3 = await testWithBackendCreds();
  
  console.log('\n\n=== SUMMARY ===');
  console.log('IP-based Supabase (72.61.248.216:8000):', test1 ? '✅ WORKS' : '❌ FAIL');
  console.log('Domain-based (api.mantravat.cloud):', test3 ? '✅ WORKS' : '❌ FAIL');
  
  const workingTables = Object.values(tableResults).filter(v => v).length;
  const totalTables = Object.keys(tableResults).length;
  console.log(`\nTables accessible: ${workingTables}/${totalTables}`);
  
  if (test1 && workingTables > 5) {
    console.log('\n🎉 DATABASE IS READY!');
    console.log('✅ You can use: http://72.61.248.216:8000');
    console.log('✅ Database has data and tables');
    console.log('✅ Backend can start using this database immediately');
    console.log('\n📝 Update botmantra-backend/.env:');
    console.log('   SUPABASE_URL=http://72.61.248.216:8000');
    return true;
  } else if (test1) {
    console.log('\n⚠️  Database accessible but missing some tables');
    console.log('Need to run migrations for missing tables');
    return true;
  } else {
    console.log('\n❌ Database not accessible from either URL');
    console.log('Need to setup new Supabase or fix connection');
    return false;
  }
}

runAllTests().then(success => process.exit(success ? 0 : 1));
