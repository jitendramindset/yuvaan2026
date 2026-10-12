#!/bin/bash

# Create test user for login testing
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTestUser() {
  try {
    // Hash password using simple SHA256 (same as backend)
    const crypto = require('crypto');
    const password = 'Test@123';
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    console.log('Creating test user...');
    
    // Insert user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        email: 'test@example.com',
        full_name: 'Test User',
        mobile_no: '+919999999999',
        password_hash: hashedPassword,
        auth_method: 'password',
        is_verified: true,
        created_at: new Date()
      }])
      .select();
    
    if (userError) {
      if (userError.message.includes('duplicate') || userError.message.includes('unique')) {
        console.log('✅ User already exists');
        return;
      }
      throw userError;
    }
    
    const userId = userData[0]?.id;
    console.log('✅ User created:', userId);
    
    // Auto-assign owner role
    const { data: ownerRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_name', 'Owner')
      .single();
    
    if (ownerRole) {
      await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: ownerRole.id,
          assigned_at: new Date()
        });
      console.log('✅ Owner role assigned');
    }
    
    console.log('\n✅ TEST USER CREATED');
    console.log('Email: test@example.com');
    console.log('Password: Test@123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();
