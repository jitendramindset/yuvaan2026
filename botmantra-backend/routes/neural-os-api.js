/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NEURAL OS API — Express Routes for the Complete System    ║
 * ║  Exposes: Node CRUD, Widgets, Vector, Brand, Admin AI      ║
 * ║  Mount: /api/neural-os                                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const router = express.Router();

const { BRANDS, NODE_TYPES, validateNodeData, buildNodeCoreRow, decodeFromBlob, encodeToBlob, generateNidHash } = require('../core/node-schema');
const { WIDGET_TYPES, WIDGET_PRESETS, createWidgetTemplate, getBrandDefaultLayout, validateWidget } = require('../core/widget-engine');
const { ADMIN_TOOLS, AdminToolExecutor, formatToolCall } = require('../core/admin-ai-tools');
const { VECTOR_CATEGORIES, VectorManager } = require('../core/vector-manager');
const { MCPDesigner } = require('../core/mcp-designer');
const { BrandRouter, SEMANTIC_ROUTES } = require('../core/brand-router-unified');

module.exports = function setupNeuralOSAPI(app, supabaseClient) {
  const vectorManager = new VectorManager(supabaseClient);
  const brandRouter = new BrandRouter(supabaseClient);
  const toolExecutor = new AdminToolExecutor(supabaseClient);

  // Optionally create MCPDesigner if OpenAI is available
  let mcpDesigner = null;
  try {
    const OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      mcpDesigner = new MCPDesigner(supabaseClient, openai);
    }
  } catch { /* OpenAI not installed */ }
  if (!mcpDesigner) {
    mcpDesigner = new MCPDesigner(supabaseClient, null);
  }

  // ═══════════════════════════════════════════════════════════
  // SCHEMA / META ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/neural-os/schema — All type definitions */
  router.get('/schema', (req, res) => {
    res.json({
      brands: BRANDS,
      node_types: NODE_TYPES(),
      widget_types: WIDGET_TYPES,
      vector_categories: Object.keys(VECTOR_CATEGORIES),
      admin_tools: ADMIN_TOOLS.map(t => ({ name: t.name, description: t.description })),
      semantic_routes: SEMANTIC_ROUTES
    });
  });

  /** GET /api/neural-os/schema/node/:type — Specific node type schema */
  router.get('/schema/node/:type', (req, res) => {
    const types = NODE_TYPES();
    const typeDef = types[req.params.type];
    if (!typeDef) return res.status(404).json({ error: `Unknown type: ${req.params.type}` });
    res.json({ type: req.params.type, ...typeDef });
  });

  /** POST /api/neural-os/schema/validate — Validate node data */
  router.post('/schema/validate', (req, res) => {
    const { node_type, metadata, brand_scope } = req.body;
    const result = validateNodeData(node_type, metadata, brand_scope);
    res.json(result);
  });

  // ═══════════════════════════════════════════════════════════
  // NODE CRUD ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** POST /api/neural-os/nodes — Create a node */
  router.post('/nodes', async (req, res) => {
    try {
      const { node_type, brand_scope, metadata, parent_nid_hash, permissions } = req.body;
      const userId = req.user?.id || req.body.owner_id;
      if (!userId) return res.status(401).json({ error: 'User ID required' });

      // Validate
      const validation = validateNodeData(node_type, metadata, brand_scope);
      if (!validation.valid) return res.status(400).json({ error: 'Validation failed', details: validation.errors });

      // Build row
      const row = buildNodeCoreRow(node_type, userId, metadata, {
        brand_scope, parent_nid_hash, permissions
      });

      const { data, error } = await supabaseClient
        .from('node_core')
        .insert(row)
        .select('row_id, nid_hash, node_type, node_state, created_at')
        .single();

      if (error) throw error;

      // Auto-store in vector
      await vectorManager.autoStore(data.nid_hash, node_type, JSON.stringify(metadata), { owner_id: userId, brand_scope });

      res.status(201).json({ success: true, node: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/nodes/:nidHash — Get a node */
  router.get('/nodes/:nidHash', async (req, res) => {
    try {
      const { data, error } = await supabaseClient
        .from('node_core')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Node not found' });

      // Decode blobs
      const decoded = {
        ...data,
        dna: decodeFromBlob(data.dna_blob),
        field_map: decodeFromBlob(data.field_map),
        permissions: decodeFromBlob(data.perm_blob),
        rules: decodeFromBlob(data.rule_blob),
        ui: decodeFromBlob(data.ui_blob),
        runtime: decodeFromBlob(data.runtime_blob),
        memory: decodeFromBlob(data.memory_blob),
        system: decodeFromBlob(data.sys_blob)
      };

      res.json({ success: true, node: decoded });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/nodes/user/:userId — Get all nodes for a user */
  router.get('/nodes/user/:userId', async (req, res) => {
    try {
      const { data, error } = await supabaseClient
        .from('node_core')
        .select('row_id, nid_hash, node_type, node_state, field_map, dna_blob, created_at')
        .eq('owner_id', req.params.userId)
        .eq('node_state', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(parseInt(req.query.limit) || 50);

      if (error) throw error;

      const nodes = (data || []).map(n => ({
        ...n,
        dna: decodeFromBlob(n.dna_blob),
        metadata: decodeFromBlob(n.field_map)
      }));

      res.json({ success: true, count: nodes.length, nodes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** PUT /api/neural-os/nodes/:nidHash — Update a node */
  router.put('/nodes/:nidHash', async (req, res) => {
    try {
      const { updates } = req.body;
      const result = await toolExecutor.execute(
        formatToolCall('update_node', { nid_hash: req.params.nidHash, updates }),
        req.user?.id || req.body.user_id
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** DELETE /api/neural-os/nodes/:nidHash — Soft-delete (archive) */
  router.delete('/nodes/:nidHash', async (req, res) => {
    try {
      const { error } = await supabaseClient
        .from('node_core')
        .update({
          node_state: 'ARCHIVED',
          is_archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('nid_hash', req.params.nidHash);

      if (error) throw error;
      res.json({ success: true, archived: req.params.nidHash });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // WIDGET ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/neural-os/widgets/types — All widget types */
  router.get('/widgets/types', (req, res) => {
    res.json({ widget_types: WIDGET_TYPES });
  });

  /** GET /api/neural-os/widgets/presets — All widget presets */
  router.get('/widgets/presets', (req, res) => {
    const presets = {};
    for (const [name, fn] of Object.entries(WIDGET_PRESETS)) {
      presets[name] = fn();
    }
    res.json({ presets });
  });

  /** POST /api/neural-os/widgets/create — Create from template */
  router.post('/widgets/create', (req, res) => {
    try {
      const widget = createWidgetTemplate(req.body);
      const validation = validateWidget(widget);
      if (!validation.valid) return res.status(400).json({ error: 'Invalid widget', details: validation.errors });
      res.status(201).json({ success: true, widget });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /** POST /api/neural-os/widgets/validate — Validate widget JSON */
  router.post('/widgets/validate', (req, res) => {
    const result = validateWidget(req.body);
    res.json(result);
  });

  // ═══════════════════════════════════════════════════════════
  // BRAND / DASHBOARD ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/neural-os/brands — All brands */
  router.get('/brands', (req, res) => {
    res.json({ brands: BRANDS });
  });

  /** GET /api/neural-os/brands/resolve/:userId — Resolve user's brand */
  router.get('/brands/resolve/:userId', async (req, res) => {
    try {
      const result = await brandRouter.resolveUserBrand(req.params.userId);
      result.available_brands = brandRouter.getAvailableBrands(result.user_meta?.age);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural-os/brands/switch — Switch user's brand */
  router.post('/brands/switch', async (req, res) => {
    try {
      const { user_id, target_brand } = req.body;
      const result = await brandRouter.switchBrand(user_id, target_brand);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural-os/brands/route — Chat-based routing */
  router.post('/brands/route', async (req, res) => {
    try {
      const { user_id, message } = req.body;
      const result = await brandRouter.route(user_id, message);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/dashboard/:userId — Load dashboard */
  router.get('/dashboard/:userId', async (req, res) => {
    try {
      const brandCode = req.query.brand || 'BOTMANTRA';
      const dashboard = await brandRouter.loadDashboard(req.params.userId, brandCode);
      res.json({ success: true, ...dashboard });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/dashboard/default/:brand — Default layout for a brand */
  router.get('/dashboard/default/:brand', (req, res) => {
    try {
      const layout = getBrandDefaultLayout(req.params.brand);
      res.json({ success: true, brand: req.params.brand, layout });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/intro — Intro layout for new users */
  router.get('/intro', (req, res) => {
    res.json({ success: true, layout: brandRouter.getIntroLayout() });
  });

  // ═══════════════════════════════════════════════════════════
  // VECTOR ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/neural-os/vectors/categories — All vector categories */
  router.get('/vectors/categories', (req, res) => {
    res.json({ categories: VECTOR_CATEGORIES });
  });

  /** POST /api/neural-os/vectors/store — Store vector */
  router.post('/vectors/store', async (req, res) => {
    try {
      const { nid_hash, category, content, owner_id, semantic_tags, brand_scope, role_access } = req.body;
      const result = await vectorManager.store(nid_hash, category, content, {
        owner_id: owner_id || req.user?.id,
        semantic_tags, brand_scope, role_access
      });
      res.status(201).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural-os/vectors/search — Search vectors */
  router.post('/vectors/search', async (req, res) => {
    try {
      const { category, query, brand_scope, limit } = req.body;
      const results = await vectorManager.search(category, query, { brand_scope, limit });
      res.json({ success: true, count: results.length, results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/vectors/node/:nidHash — Get vectors for node */
  router.get('/vectors/node/:nidHash', async (req, res) => {
    try {
      const results = await vectorManager.getByNode(req.params.nidHash);
      res.json({ success: true, ...results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/vectors/stats — Vector stats */
  router.get('/vectors/stats', async (req, res) => {
    try {
      const stats = await vectorManager.getStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** DELETE /api/neural-os/vectors/node/:nidHash — Delete vectors for node */
  router.delete('/vectors/node/:nidHash', async (req, res) => {
    try {
      const result = await vectorManager.deleteByNode(req.params.nidHash);
      res.json({ success: true, deleted: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // ADMIN AI TOOL ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/neural-os/admin/tools — List available tools */
  router.get('/admin/tools', (req, res) => {
    res.json({ tools: ADMIN_TOOLS });
  });

  /** POST /api/neural-os/admin/execute — Execute single tool */
  router.post('/admin/execute', async (req, res) => {
    try {
      const { tool, arguments: args } = req.body;
      const userId = req.user?.id || req.body.admin_id;
      if (!userId) return res.status(401).json({ error: 'Admin ID required' });

      const result = await toolExecutor.execute({ tool, arguments: args }, userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural-os/admin/batch — Execute multiple tools */
  router.post('/admin/batch', async (req, res) => {
    try {
      const { tool_calls, admin_id } = req.body;
      const userId = req.user?.id || admin_id;
      if (!userId) return res.status(401).json({ error: 'Admin ID required' });

      const results = await toolExecutor.executeBatch(tool_calls, userId);
      res.json({ success: true, results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural-os/admin/chat — MCP designer chat (AI-driven) */
  router.post('/admin/chat', async (req, res) => {
    try {
      const { message, admin_id, brand_scope } = req.body;
      const userId = req.user?.id || admin_id;
      if (!userId) return res.status(401).json({ error: 'Admin ID required' });

      const result = await mcpDesigner.processAdminRequest(userId, message, { brand_scope });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural-os/admin/prompt — Get MCP system prompt */
  router.get('/admin/prompt', (req, res) => {
    res.json({ prompt: mcpDesigner.getSystemPrompt() });
  });

  // ═══════════════════════════════════════════════════════════
  // PERMISSION ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/neural-os/permissions/:nidHash — Get permissions for node */
  router.get('/permissions/:nidHash', async (req, res) => {
    try {
      const { data, error } = await supabaseClient
        .from('node_permission')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .eq('is_revoked', false);

      if (error) throw error;
      res.json({ success: true, permissions: data || [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural-os/permissions — Create/update permission */
  router.post('/permissions', async (req, res) => {
    try {
      const { nid_hash, target_owner_id, permission_type, can_read, can_write, can_delete } = req.body;
      const ownerId = req.user?.id || req.body.owner_id;

      const { data, error } = await supabaseClient
        .from('node_permission')
        .insert({
          nid_hash, owner_id: ownerId,
          target_owner_id: target_owner_id || ownerId,
          permission_type: permission_type || 'MEMBER',
          can_read: can_read !== false,
          can_write: can_write || false,
          can_delete: can_delete || false
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, permission: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // HEALTH / STATUS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/neural-os/health — System health */
  router.get('/health', async (req, res) => {
    const status = { api: 'ok', timestamp: new Date().toISOString() };

    // Check node_core
    try {
      const { count } = await supabaseClient.from('node_core').select('row_id', { count: 'exact', head: true });
      status.node_core = { status: 'ok', count };
    } catch { status.node_core = { status: 'error' }; }

    // Check vector_chunks
    try {
      const { count } = await supabaseClient.from('vector_chunks').select('id', { count: 'exact', head: true });
      status.vector_chunks = { status: 'ok', count };
    } catch { status.vector_chunks = { status: 'error' }; }

    // Check node_permission
    try {
      const { count } = await supabaseClient.from('node_permission').select('perm_id', { count: 'exact', head: true });
      status.node_permission = { status: 'ok', count };
    } catch { status.node_permission = { status: 'error' }; }

    status.mcp_designer = mcpDesigner ? 'available' : 'unavailable';
    status.openai = process.env.OPENAI_API_KEY ? 'configured' : 'not_configured';

    res.json(status);
  });

  // Mount router
  app.use('/api/neural-os', router);

  console.log('🧠 Neural OS API mounted at /api/neural-os');
  console.log('   Endpoints: schema, nodes, widgets, brands, vectors, admin, permissions, health');

  return router;
};
