/**
 * Assign Default Role to User
 * Quick script to assign 'owner' role to prasadjitendra9@gmail.com
 */

require('dotenv').config();
const pg = require('pg');

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

async function assignDefaultRole() {
  try {
    console.log('🔍 Finding user...');
    const userResult = await pool.query(
      `SELECT id, email, full_name FROM users WHERE email = $1`,
      ['prasadjitendra9@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ User not found');
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Found user:', user);

    console.log('\n🔍 Finding owner role...');
    const roleResult = await pool.query(
      `SELECT id, role_code, role_name FROM roles WHERE role_code = $1`,
      ['owner']
    );

    if (roleResult.rows.length === 0) {
      console.error('❌ Owner role not found');
      await pool.end();
      return;
    }

    const role = roleResult.rows[0];
    console.log('✅ Found role:', role);

    console.log('\n🔍 Checking existing role assignment...');
    const existingRoleResult = await pool.query(
      `SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2`,
      [user.id, role.id]
    );

    if (existingRoleResult.rows.length > 0) {
      console.log('✅ User already has owner role');
      await pool.end();
      return;
    }

    console.log('\n📝 Assigning owner role...');
    const assignResult = await pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING *`,
      [user.id, role.id]
    );

    console.log('✅ Successfully assigned owner role:', assignResult.rows[0]);

    // Verify
    console.log('\n🔍 Verifying role assignment...');
    const verificationResult = await pool.query(
      `SELECT ur.*, r.role_code, r.role_name 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = $1`,
      [user.id]
    );

    console.log('✅ User roles:', verificationResult.rows);
    
    await pool.end();

  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

assignDefaultRole();
