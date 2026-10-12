const express = require('express');
const { supabase, dbSchema } = require('../config/supabase');

const router = express.Router();

// In-memory stores for lightweight compatibility
const memory = {
  logs: [],
  logEmbeddings: [],
  vectors: [],
  messages: [],
  sessions: []
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function fakeEmbedding(text, size = 8) {
  const base = simpleHash(text || '');
  const vec = [];
  for (let i = 0; i < size; i += 1) {
    vec.push(((base >> (i % 16)) & 255) / 255);
  }
  return vec;
}

// ============================================
// EMBEDDINGS
// ============================================
router.post('/embed', async (req, res) => {
  const { text = '' } = req.body || {};
  return res.json({ embedding: fakeEmbedding(text) });
});

router.post('/embed/batch', async (req, res) => {
  const { texts = [] } = req.body || {};
  const embeddings = (texts || []).map((t) => fakeEmbedding(t));
  return res.json({ embeddings });
});

// ============================================
// VECTORS
// ============================================
router.post('/vectors/store', async (req, res) => {
  const { text = '', embedding = [], metadata = {} } = req.body || {};
  const vector = {
    id: `vec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    embedding,
    metadata,
    created_at: new Date().toISOString()
  };
  memory.vectors.unshift(vector);
  return res.json({ success: true, vector });
});

router.post('/vectors/search', async (req, res) => {
  const { type, limit = 10, filters = {} } = req.body || {};
  const results = memory.vectors
    .filter((v) => !type || v.metadata?.type === type)
    .filter((v) => !filters?.identityId || v.metadata?.identityId === filters.identityId)
    .slice(0, limit);
  return res.json({ success: true, results });
});

router.get('/vectors/recommendations/:userId/:identityId', async (req, res) => {
  return res.json({
    suggestedScreens: [],
    suggestedFeatures: [],
    suggestedOptimizations: [],
    confidenceScore: 0
  });
});

router.get('/vectors/trending/:identityId', async (req, res) => {
  return res.json({ trending: [] });
});

router.get('/vectors/stats/:identityId', async (req, res) => {
  return res.json({
    totalVectors: memory.vectors.length,
    vectorsByType: {},
    lastUpdated: memory.vectors[0]?.created_at || null,
    storageSize: 0
  });
});

router.delete('/vectors/:vectorId', async (req, res) => {
  const { vectorId } = req.params;
  memory.vectors = memory.vectors.filter((v) => v.id !== vectorId);
  return res.json({ success: true });
});

router.patch('/vectors/:vectorId', async (req, res) => {
  const { vectorId } = req.params;
  const { metadata = {} } = req.body || {};
  const vector = memory.vectors.find((v) => v.id === vectorId);
  if (vector) vector.metadata = { ...vector.metadata, ...metadata };
  return res.json({ success: true, vector });
});

router.delete('/vectors/identity/:identityId', async (req, res) => {
  const { identityId } = req.params;
  memory.vectors = memory.vectors.filter((v) => v.metadata?.identityId !== identityId);
  return res.json({ success: true });
});

// ============================================
// LOGS + ANALYTICS (Lightweight)
// ============================================
router.post('/logs', async (req, res) => {
  const logEntry = req.body || {};
  memory.logs.unshift(logEntry);

  try {
    await supabase.from('node_logs').insert({
      user_id: logEntry?.userId || null,
      event_type: logEntry?.action?.type || 'ui_action',
      event_action: logEntry?.action?.target || null,
      description: JSON.stringify(logEntry?.action || {}),
      metadata: logEntry
    });
  } catch (e) {
    // Ignore DB write failures for compatibility
  }

  return res.json({ success: true, log: logEntry });
});

router.post('/logs/embeddings', async (req, res) => {
  const entry = { ...req.body, created_at: new Date().toISOString() };
  memory.logEmbeddings.unshift(entry);
  return res.json({ success: true, embedding: entry });
});

router.get('/logs/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  const logs = memory.logs.filter((l) => l.userId === userId).slice(0, parseInt(limit));
  return res.json({ logs });
});

router.get('/logs/user/:userId/range', async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  const logs = memory.logs.filter((l) => {
    if (l.userId !== userId) return false;
    const ts = new Date(l.timestamp || l.created_at || Date.now()).getTime();
    return ts >= start && ts <= end;
  });
  return res.json({ logs });
});

router.post('/logs/similar', async (req, res) => {
  const { limit = 10 } = req.body || {};
  return res.json({ similarLogs: memory.logs.slice(0, limit) });
});

router.get('/logs/export', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.send('id,timestamp,userId,actionType\n');
});

router.get('/analytics/:userId/:identityId', async (req, res) => {
  return res.json({
    totalActions: memory.logs.length,
    actionsByType: {},
    mostUsedFeatures: [],
    averageSessionTime: 0,
    errorRate: 0,
    trends: {},
    topActions: [],
    timeDistribution: {}
  });
});

router.get('/analytics/:userId/workflows', async (req, res) => {
  return res.json({ workflows: [] });
});

// ============================================
// USERS, IDENTITIES, SCHEMA, PERMISSIONS
// ============================================
router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});

router.get('/users/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  const { data: identities } = await supabase.from('business_users').select('*').eq('user_id', userId);
  return res.json({ user, identities, currentIdentity: identities?.[0] || null, permissions: {}, schema: {} });
});

router.post('/identities/:identityId/activate', async (req, res) => {
  const { identityId } = req.params;
  const { data } = await supabase.from('data_model_registry').select('*').eq('business_id', identityId).limit(200);
  const tables = [...new Set((data || []).map((r) => r.table_name))];
  return res.json({ schema: { tables }, tables, permissions: {}, modules: [] });
});

router.get('/schema/:identityId', async (req, res) => {
  const { identityId } = req.params;
  const { data } = await supabase.from('data_model_registry').select('*').eq('business_id', identityId).limit(500);
  const tables = [...new Set((data || []).map((r) => r.table_name))];
  const columns = (data || []).reduce((acc, row) => {
    acc[row.table_name] = acc[row.table_name] || [];
    acc[row.table_name].push(row);
    return acc;
  }, {});
  return res.json({ tables: tables.map((name) => ({ name })), columns, functions: [], relationships: [], modules: [], vectors: [] });
});

router.get('/permissions/:userId/:identityId', async (req, res) => {
  const { identityId } = req.params;
  const { data } = await supabase.from('data_model_registry').select('table_name').eq('business_id', identityId).limit(500);
  const tables = [...new Set((data || []).map((r) => r.table_name))];
  return res.json({ tables, columns: [], actions: [], functions: [], modules: [], restrictions: {} });
});

// ============================================
// FUNCTIONS (stub)
// ============================================
router.get('/functions/:functionName', async (req, res) => {
  const { functionName } = req.params;
  return res.json({ success: true, functionName, status: 'not_implemented' });
});

// ============================================
// MESSAGES & SESSIONS (lightweight)
// ============================================
router.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const messages = memory.messages.filter((m) => m.userId === userId);
  return res.json({ messages });
});

router.get('/sessions/:userId', async (req, res) => {
  const { userId } = req.params;
  const sessions = memory.sessions.filter((s) => s.userId === userId);
  return res.json({ sessions });
});

// ============================================
// DASHBOARDS
// ============================================
router.post('/dashboards/save', async (req, res) => {
  const payload = req.body || {};
  const { data, error } = await supabase.from('dashboards').insert([payload]).select();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data?.[0] || payload);
});

router.get('/dashboards', async (req, res) => {
  const { user_id } = req.query;
  let query = supabase.from('dashboards').select('*');
  if (user_id) query = query.eq('user_id', user_id);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data || []);
});

router.get('/dashboards/:dashboardId', async (req, res) => {
  const { dashboardId } = req.params;
  const { data, error } = await supabase.from('dashboards').select('*').eq('id', dashboardId).single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});

router.put('/dashboards/:dashboardId', async (req, res) => {
  const { dashboardId } = req.params;
  const updates = req.body || {};
  const { data, error } = await supabase.from('dashboards').update(updates).eq('id', dashboardId).select();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data?.[0] || updates);
});

router.delete('/dashboards/:dashboardId', async (req, res) => {
  const { dashboardId } = req.params;
  const { error } = await supabase.from('dashboards').delete().eq('id', dashboardId);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ success: true });
});

module.exports = router;