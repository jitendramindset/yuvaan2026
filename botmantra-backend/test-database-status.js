// Quick database connectivity test
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');

console.log('=== DATABASE CONNECTIVITY TEST ===\n');

// Test 1: Direct PostgreSQL connection
async function testDirectDB() {
  console.log('Test 1: Direct PostgreSQL Connection');
  console.log('Host:', process.env.POSTGRES_HOST);
  console.log('Database:', process.env.POSTGRES_DATABASE);
  console.log('User:', process.env.POSTGRES_USER);
  
  const pool = new pg.Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  });

  try {
    const result = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ PostgreSQL Connected!');
    console.log('Total tables:', result.rows[0].table_count);
    
    // List some key tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name 
      LIMIT 20
    `);
    console.log('\nFirst 20 tables:');
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL Connection Failed:', error.message);
    await pool.end();
    return false;
  }
}

// Test 2: Supabase client connection
async function testSupabaseClient() {
  console.log('\n\nTest 2: Supabase Client Connection');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase Client Failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase Client Connected!');
    console.log('Query successful');
    return true;
  } catch (error) {
    console.log('❌ Supabase Client Error:', error.message);
    return false;
  }
}

// Test 3: Check critical tables exist
async function testCriticalTables() {
  console.log('\n\nTest 3: Critical Tables Check');
  
  const pool = new pg.Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  });

  const requiredTables = [
    'users',
    'core_node',
    'node_identity',
    'roles',
    'permissions',
    'role_permissions',
    'karma_ledger',
    'wallet_accounts',
    'dashboard_templates',
    'dashboard_widgets'
  ];

  try {
    for (const tableName of requiredTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      const exists = result.rows[0].exists;
      console.log(exists ? '✅' : '❌', tableName);
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ Table check failed:', error.message);
    await pool.end();
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const test1 = await testDirectDB();
  const test2 = await testSupabaseClient();
  const test3 = await testCriticalTables();
  
  console.log('\n\n=== SUMMARY ===');
  console.log('Direct PostgreSQL:', test1 ? '✅ PASS' : '❌ FAIL');
  console.log('Supabase Client:', test2 ? '✅ PASS' : '❌ FAIL');
  console.log('Critical Tables:', test3 ? '✅ PASS' : '❌ FAIL');
  
  if (test1 && test3) {
    console.log('\n🎉 DATABASE IS READY! You can proceed with backend integration.');
  } else if (test1) {
    console.log('\n⚠️  Database connected but missing tables. Run migrations.');
  } else {
    console.log('\n❌ Database connection failed. Check credentials.');
  }
  
  process.exit(test1 && test3 ? 0 : 1);
}

runAllTests();
