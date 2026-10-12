/**
 * Database Initialization Script
 * Creates default roles and assigns admin role to the first user
 * Run: node init-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function initializeDatabase() {
  try {
    console.log('Initializing database with default roles...');

    // Create default roles
    const defaultRoles = [
      { role_name: 'super_admin', description: 'Full system access' },
      { role_name: 'admin', description: 'Administrative access' },
      { role_name: 'user', description: 'Standard user access' },
      { role_name: 'viewer', description: 'Read-only access' }
    ];

    console.log('Creating roles...');
    for (const role of defaultRoles) {
      const { data, error } = await supabase
        .from('roles')
        .upsert(role, { onConflict: 'role_name' })
        .select();

      if (error) {
        console.error(`Error creating role ${role.role_name}:`, error);
      } else {
        console.log(`✓ Created role: ${role.role_name}`);
      }
    }

    // Check if there are any users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (users && users.length > 0) {
      const firstUser = users[0];
      console.log(`Found user: ${firstUser.email} (${firstUser.id})`);

      // Get super_admin role
      const { data: adminRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', 'super_admin')
        .single();

      if (roleError || !adminRole) {
        console.error('Error finding super_admin role:', roleError);
        return;
      }

      // Assign super_admin role to first user
      const { data: userRole, error: assignError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: firstUser.id,
          role_id: adminRole.id,
          assigned_at: new Date().toISOString()
        }, { onConflict: 'user_id,role_id' })
        .select();

      if (assignError) {
        console.error('Error assigning role:', assignError);
      } else {
        console.log(`✓ Assigned super_admin role to user: ${firstUser.email}`);
      }
    } else {
      console.log('No users found - roles created but no assignments made');
    }

    console.log('Database initialization complete!');

  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initializeDatabase();