/**
 * Direct PostgreSQL Migration Executor
 * Connects directly to the Supabase PostgreSQL database
 * 
 * Usage: node migrate-db-direct.js
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: parseInt(process.env.POSTGRES_PORT) || 5432
});

async function migrate() {
  console.log('\n🚀 Starting Database Migration...\n');
  
  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Read SQL file
    const sqlPath = './migrations/20260203_create_ai_websites_table.sql';
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQL file not found: ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📝 SQL file loaded\n');

    // Execute migration
    console.log('▶️  Executing migration...\n');
    const result = await client.query(sql);
    
    console.log('✅ Migration executed successfully!\n');

    // Step 2: Verify table
    console.log('🔍 Verifying table creation...\n');
    
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_websites'
      ) as exists;
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Table "ai_websites" exists\n');

      // Get table info
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_websites'
        ORDER BY ordinal_position;
      `);

      console.log('📊 Table columns:\n');
      tableInfo.rows.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        console.log(`   ${idx + 1}. ${col.column_name} - ${col.data_type} ${nullable}`);
      });

      // Get indexes
      console.log('\n📑 Indexes:\n');
      const indexInfo = await client.query(`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'ai_websites'
        ORDER BY indexname;
      `);

      if (indexInfo.rows.length > 0) {
        indexInfo.rows.forEach((idx, i) => {
          console.log(`   ${i + 1}. ${idx.indexname}`);
        });
      } else {
        console.log('   No indexes found');
      }

      // Get row count
      const rowCount = await client.query('SELECT COUNT(*) as count FROM public.ai_websites;');
      console.log(`\n📦 Current rows: ${rowCount.rows[0].count}\n`);

      console.log('✅ Database migration COMPLETE!\n');
      console.log('═'.repeat(70));
      console.log('🎉 ai_websites table is ready for use!');
      console.log('═'.repeat(70));
      console.log('\nYou can now:');
      console.log('  1. Start the server: node server.js');
      console.log('  2. Test API endpoints');
      console.log('  3. Launch beta users');
      console.log('  4. Start generating revenue!\n');

    } else {
      console.log('❌ Table "ai_websites" was not created\n');
      console.log('Please check the SQL file for errors.\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed!\n');
    console.error('Error:', error.message);
    console.error('\n');
    
    if (error.message.includes('permission denied')) {
      console.error('💡 Permission Error: The user does not have CREATE TABLE privileges');
    } else if (error.message.includes('connection refused')) {
      console.error('💡 Connection Error: Cannot reach the database');
      console.error('   Check POSTGRES_HOST, POSTGRES_PORT, and credentials in .env');
    } else if (error.message.includes('does not exist')) {
      console.error('💡 Database Error: Database does not exist');
      console.error('   Check POSTGRES_DATABASE in .env');
    }
    
    console.error('\n');
    process.exit(1);

  } finally {
    console.log('🔌 Closing connection...');
    await client.end();
    console.log('✅ Done\n');
  }
}

migrate();
