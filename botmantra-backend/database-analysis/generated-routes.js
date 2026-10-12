// Auto-generated Express routes
// Generated: 2026-02-15T23:08:43.549Z

const express = require('express');
const { supabase } = require('./config/supabase');
const router = express.Router();

// ═══ USERS ROUTES ═══

// GET all users
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET users by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CREATE users
router.post('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').insert(req.body).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE users
router.put('/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE users
router.delete('/users/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ═══ ROLES ROUTES ═══

// GET all roles
router.get('/roles', async (req, res) => {
  try {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET roles by ID
router.get('/roles/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('roles').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CREATE roles
router.post('/roles', async (req, res) => {
  try {
    const { data, error } = await supabase.from('roles').insert(req.body).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE roles
router.put('/roles/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('roles').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE roles
router.delete('/roles/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('roles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ═══ PERMISSIONS ROUTES ═══

// GET all permissions
router.get('/permissions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('permissions').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET permissions by ID
router.get('/permissions/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('permissions').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CREATE permissions
router.post('/permissions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('permissions').insert(req.body).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE permissions
router.put('/permissions/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('permissions').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE permissions
router.delete('/permissions/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('permissions').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ═══ ROLE_PERMISSIONS ROUTES ═══

// GET all role_permissions
router.get('/role-permissions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('role_permissions').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CREATE role_permissions
router.post('/role-permissions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('role_permissions').insert(req.body).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ═══ NODE_PERMISSION ROUTES ═══

// GET all node_permission
router.get('/node-permission', async (req, res) => {
  try {
    const { data, error } = await supabase.from('node_permission').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CREATE node_permission
router.post('/node-permission', async (req, res) => {
  try {
    const { data, error } = await supabase.from('node_permission').insert(req.body).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ═══ DHARMA_RULES ROUTES ═══

// GET all dharma_rules
router.get('/dharma-rules', async (req, res) => {
  try {
    const { data, error } = await supabase.from('dharma_rules').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CREATE dharma_rules
router.post('/dharma-rules', async (req, res) => {
  try {
    const { data, error } = await supabase.from('dharma_rules').insert(req.body).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ═══ CHAT_HISTORY ROUTES ═══

// GET all chat_history
router.get('/chat-history', async (req, res) => {
  try {
    const { data, error } = await supabase.from('chat_history').select('*');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET chat_history by ID
router.get('/chat-history/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('chat_history').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CREATE chat_history
router.post('/chat-history', async (req, res) => {
  try {
    const { data, error } = await supabase.from('chat_history').insert(req.body).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE chat_history
router.put('/chat-history/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('chat_history').update(req.body).eq('id', req.params.id).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE chat_history
router.delete('/chat-history/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('chat_history').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
