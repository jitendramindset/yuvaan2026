/**
 * Quick debug endpoint to check user and token info
 * Add to server.js temporarily for debugging
 */

const express = require('express');
const router = express.Router();

module.exports = function(app, supabase) {
  // Debug endpoint to check token claims and user record
  app.get('/debug/token/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const jwt = require('jsonwebtoken');
      
      // Decode without verification (unsafe, debug only)
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        return res.json({ error: 'Invalid token', token: 'malformed' });
      }
      
      const userId = decoded.sub || decoded.userId || decoded.id;
      
      // Check user in database
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Check in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      // Check business_users
      const { data: businessUser } = await supabase
        .from('business_users')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single()
        .catch(() => ({ data: null }));
      
      return res.json({
        token_claims: {
          sub: decoded.sub,
          userId: decoded.userId,
          id: decoded.id,
          email: decoded.email,
          extracted_user_id: userId
        },
        user_record: {
          exists: !!userRecord,
          data: userRecord,
          error: userError?.message
        },
        auth_user: {
          exists: !!authUser,
          email: authUser?.email,
          error: authError?.message
        },
        business_user: {
          exists: !!businessUser,
          data: businessUser,
          message: businessUser ? 'User has business context' : 'User missing business_users entry'
        },
        diagnosis: {
          issue_1_no_user_record: !userRecord,
          issue_2_no_business_context: !businessUser,
          solution: !userRecord ? 'Create user record in users table' : 'Create business_users entry'
        }
      });
    } catch (error) {
      res.json({ error: error.message });
    }
  });
  
  // Create test user
  app.post('/debug/create-test-user', async (req, res) => {
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      const userId = authData.user.id;
      
      // 2. Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: testEmail,
          full_name: 'Test User',
          created_at: new Date().toISOString()
        });
      
      if (userError) throw userError;
      
      // 3. Create business (if needed)
      const { data: businessData } = await supabase
        .from('businesses')
        .insert({
          name: 'Test Business',
          owner_id: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      const businessId = businessData?.id;
      
      // 4. Create business_users entry
      if (businessId) {
        await supabase
          .from('business_users')
          .insert({
            user_id: userId,
            business_id: businessId,
            role_id: 'owner', // or fetch from roles table
            joined_at: new Date().toISOString()
          });
      }
      
      return res.json({
        success: true,
        user_id: userId,
        email: testEmail,
        password: testPassword,
        business_id: businessId,
        message: 'Test user created successfully'
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};
