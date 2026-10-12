// Simple test to find working Supabase credentials
const { createClient } = require('@supabase/supabase-js');

console.log('=== TESTING DIFFERENT URL/KEY COMBINATIONS ===\n');

// Test combinations from different .env files
const combinations = [
  {
    name: 'UI Config (IP-based)',
    url: 'http://72.61.248.216:8000',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY4MTQ0MTIyLCJleHAiOjE5MjU4MjQxMjJ9.DdPucnoKYPiGA7wxV5_V6f3d1bPV1wl4UgUbp9hWpOM'
  },
  {
    name: 'Backend Config (Domain)',
    url: 'https://api.mantravat.cloud',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjgxNDQxMjIsImV4cCI6MTkyNTgyNDEyMn0.j9XEBLD9SdKvEhSsRsluA52y_jXTdSjoedzoND5xVOQ'
  },
  {
    name: 'Backend Config with /project/default',
    url: 'https://api.mantravat.cloud/project/default',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjgxNDQxMjIsImV4cCI6MTkyNTgyNDEyMn0.j9XEBLD9SdKvEhSsRsluA52y_jXTdSjoedzoND5xVOQ'
  },
  {
    name: 'IP with HTTPS',
    url: 'https://72.61.248.216:8000',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY4MTQ0MTIyLCJleHAiOjE5MjU4MjQxMjJ9.DdPucnoKYPiGA7wxV5_V6f3d1bPV1wl4UgUbp9hWpOM'
  },
  {
    name: 'IP REST endpoint',
    url: 'http://72.61.248.216:8000/rest/v1',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY4MTQ0MTIyLCJleHAiOjE5MjU4MjQxMjJ9.DdPucnoKYPiGA7wxV5_V6f3d1bPV1wl4UgUbp9hWpOM'
  },
  {
    name: 'Domain REST endpoint',
    url: 'https://api.mantravat.cloud/rest/v1',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjgxNDQxMjIsImV4cCI6MTkyNTgyNDEyMn0.j9XEBLD9SdKvEhSsRsluA52y_jXTdSjoedzoND5xVOQ'
  }
];

async function testCombination(config) {
  console.log(`\nTesting: ${config.name}`);
  console.log(`URL: ${config.url}`);
  
  try {
    const supabase = createClient(config.url, config.key);
    
    // Test 1: List tables
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(3);
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ SUCCESS! Found ${data?.length || 0} users`);
    if (data && data.length > 0) {
      console.log(`  Sample data:`, JSON.stringify(data[0], null, 2));
    }
    
    // Test 2: Count records
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`  📊 Total users in database: ${count}`);
    }
    
    // This combination works!
    console.log('\n🎉 WORKING CONFIGURATION FOUND!');
    console.log('=' .repeat(60));
    console.log('Use these values in your .env files:');
    console.log('SUPABASE_URL=' + config.url);
    console.log('ANON_KEY=' + config.key.substring(0, 50) + '...');
    console.log('=' .repeat(60));
    
    return true;
  } catch (error) {
    console.log(`  ❌ Exception: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('Testing all URL/Key combinations from your .env files...\n');
  
  let foundWorking = false;
  
  for (const config of combinations) {
    const works = await testCombination(config);
    if (works) {
      foundWorking = true;
      
      // Try to get more info about the database
      console.log('\n📊 Getting database schema info...');
      const supabase = createClient(config.url, config.key);
      
      const tables = [
        'users',
        'core_node',
        'node_identity',
        'roles',
        'permissions',
        'dashboard_templates',
        'dashboard_widgets',
        'karma_ledger',
        'wallet_accounts',
        'businesses'
      ];
      
      console.log('\nChecking critical tables:');
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`  ✅ ${table}: ${count} records`);
          } else {
            console.log(`  ❌ ${table}: ${error.message}`);
          }
        } catch (e) {
          console.log(`  ❌ ${table}: ${e.message}`);
        }
      }
      
      break; // Found working config, stop testing
    }
  }
  
  if (!foundWorking) {
    console.log('\n❌ NO WORKING CONFIGURATION FOUND');
    console.log('\nPossible reasons:');
    console.log('1. API keys have been regenerated (need fresh keys from dashboard)');
    console.log('2. Database access is restricted by IP address');
    console.log('3. Self-hosted Supabase is using custom JWT secret');
    console.log('\nNext steps:');
    console.log('1. Try accessing dashboard: http://72.61.248.216:8000');
    console.log('2. Login and get fresh API keys from Settings → API');
    console.log('3. Or check server logs for authentication errors');
  }
  
  process.exit(foundWorking ? 0 : 1);
}

runAllTests();
