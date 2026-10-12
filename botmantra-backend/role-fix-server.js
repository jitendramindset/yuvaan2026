/**
 * ONE-TIME ROLE FIX ENDPOINT
 * Simple HTTP endpoint to assign owner role
 */

const express = require('express');
const app = express();
const { supabase } = require('./config/supabase');

app.use(express.json());

app.post('/fix-role/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log(`🔧 Fixing role for: ${email}`);
    
    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ Found user:', user);
    
    // Get owner role
    const { data: role } = await supabase
      .from('roles')
      .select('*')
      .eq('role_code', 'owner')
      .single();
    
    if (!role) {
      return res.status(404).json({ error: 'Owner role not found' });
    }
    
    console.log('✅ Found role:', role);
    
    // Check existing
    const { data: existing } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);
    
    if (existing && existing.length > 0) {
      console.log('✅ User already has roles');
      return res.json({ success: true, message: 'Already has role', roles: existing });
    }
    
    // Assign role
    const { data: assignment, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_id: role.id,
        assigned_at: new Date()
      })
      .select();
    
    if (error) {
      console.error('❌ Assignment error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('✅ Role assigned!', assignment);
    
    res.json({
      success: true,
      message: 'Role assigned successfully',
      user: user,
      role: role,
      assignment: assignment
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🔧 Role Fix Server running on http://localhost:${PORT}`);
  console.log(`📝 Usage: POST http://localhost:${PORT}/fix-role/prasadjitendra9@gmail.com`);
});
