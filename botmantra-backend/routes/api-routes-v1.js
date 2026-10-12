/**
 * REST API Routes - Version 1
 * Auto-generated from Supabase function definitions
 */

const express = require('express');
const router = express.Router();
const RPCHandler = require('../rpc-handler');

// Initialize RPC Handler
const rpcHandler = new RPCHandler(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware for auth
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.token = token;
  next();
};

// Validation middleware
const validateUUID = (field) => (req, res, next) => {
  const value = req.body[field] || req.params[field] || req.query[field];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (value && !uuidRegex.test(value)) {
    return res.status(400).json({ error: `Invalid UUID format for ${field}` });
  }
  next();
};

// ============================================
// BUSINESS MANAGEMENT ROUTES
// ============================================

/**
 * POST /api/v1/business/register
 * Register a new business
 */
router.post('/business/register', requireAuth, async (req, res) => {
  try {
    const { name, description, industry, category, business_size, module_selection } = req.body;
    
    if (!name || !industry) {
      return res.status(400).json({ error: 'Name and industry are required' });
    }

    const result = await rpcHandler.registerBusiness({
      p_name: name,
      p_description: description,
      p_industry: industry,
      p_category: category,
      p_business_size: business_size,
      p_module_selection: module_selection || {}
    });

    res.json(result);
  } catch (error) {
    console.error('Register business error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/business/:businessId/initialize
 * Initialize business tables and data
 */
router.post('/business/:businessId/initialize', 
  requireAuth, 
  validateUUID('businessId'),
  async (req, res) => {
    try {
      await rpcHandler.createBusinessTables(req.params.businessId);
      await rpcHandler.initializeBusiness(req.params.businessId);
      
      res.json({ success: true, message: 'Business initialized' });
    } catch (error) {
      console.error('Initialize business error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================
// GENERIC API ROUTES (Template-based)
// ============================================

/**
 * GET /api/v1/data/:routeCode
 * Generic GET handler using api_get_handler function
 */
router.get('/data/:routeCode', requireAuth, async (req, res) => {
  try {
    const { routeCode } = req.params;
    const { business_id, role_id, filters, sort_by, sort_dir, limit, offset } = req.query;

    if (!business_id || !role_id) {
      return res.status(400).json({ error: 'business_id and role_id are required' });
    }

    const result = await rpcHandler.apiGet(
      routeCode,
      business_id,
      role_id,
      filters ? JSON.parse(filters) : {},
      sort_by,
      sort_dir || 'ASC',
      parseInt(limit) || 20,
      parseInt(offset) || 0
    );

    res.json(result);
  } catch (error) {
    console.error('API GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/data/:routeCode
 * Generic POST handler using api_post_handler function
 */
router.post('/data/:routeCode', requireAuth, async (req, res) => {
  try {
    const { routeCode } = req.params;
    const { business_id, role_id, payload } = req.body;

    if (!business_id || !role_id || !payload) {
      return res.status(400).json({ error: 'business_id, role_id, and payload are required' });
    }

    const result = await rpcHandler.apiPost(
      routeCode,
      business_id,
      role_id,
      payload
    );

    res.json(result);
  } catch (error) {
    console.error('API POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AI & RAG ROUTES
// ============================================

/**
 * POST /api/v1/ai/context
 * Build AI context from knowledge base
 */
router.post('/ai/context', requireAuth, async (req, res) => {
  try {
    const { business_id, query_embedding } = req.body;

    if (!business_id || !query_embedding) {
      return res.status(400).json({ error: 'business_id and query_embedding are required' });
    }

    const result = await rpcHandler.buildAIContext(business_id, query_embedding);
    res.json({ context: result.data });
  } catch (error) {
    console.error('Build AI context error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/ai/prompt
 * Build AI prompt with node context
 */
router.post('/ai/prompt', requireAuth, async (req, res) => {
  try {
    const { nid, user_prompt } = req.body;

    if (!nid || !user_prompt) {
      return res.status(400).json({ error: 'nid and user_prompt are required' });
    }

    const result = await rpcHandler.buildAIPrompt(nid, user_prompt);
    res.json({ prompt: result.data });
  } catch (error) {
    console.error('Build AI prompt error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/ai/embedding
 * Generate text embedding
 */
router.post('/ai/embedding', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await rpcHandler.generateEmbedding(text);
    res.json({ embedding: result.data });
  } catch (error) {
    console.error('Generate embedding error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/ai/action/:actionId
 * Execute AI action
 */
router.post('/ai/action/:actionId', 
  requireAuth,
  validateUUID('actionId'),
  async (req, res) => {
    try {
      const result = await rpcHandler.executeAIAction(req.params.actionId);
      res.json(result);
    } catch (error) {
      console.error('Execute AI action error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/ai/chunk-text
 * Chunk text for processing
 */
router.post('/ai/chunk-text', requireAuth, async (req, res) => {
  try {
    const { text, chunk_size } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await rpcHandler.chunkText(text, chunk_size);
    res.json({ chunks: result.data });
  } catch (error) {
    console.error('Chunk text error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// QUERY BUILDER ROUTES
// ============================================

/**
 * POST /api/v1/query/template
 * Build template-based query
 */
router.post('/query/template', requireAuth, async (req, res) => {
  try {
    const { template_code, table_name, business_id, filters } = req.body;

    if (!template_code || !table_name || !business_id) {
      return res.status(400).json({ error: 'template_code, table_name, and business_id are required' });
    }

    const result = await rpcHandler.buildTemplateQuery(
      template_code,
      table_name,
      business_id,
      filters || {}
    );

    res.json({ query: result.data });
  } catch (error) {
    console.error('Build template query error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/query/kpi/:kpiId
 * Build KPI query
 */
router.post('/query/kpi/:kpiId',
  requireAuth,
  validateUUID('kpiId'),
  async (req, res) => {
    try {
      const { business_id } = req.body;

      if (!business_id) {
        return res.status(400).json({ error: 'business_id is required' });
      }

      const result = await rpcHandler.buildKPIQuery(req.params.kpiId, business_id);
      res.json({ query: result.data });
    } catch (error) {
      console.error('Build KPI query error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/query/dynamic
 * Generate dynamic query
 */
router.post('/query/dynamic', requireAuth, async (req, res) => {
  try {
    const { template_code, business_id, filters } = req.body;

    if (!template_code || !business_id) {
      return res.status(400).json({ error: 'template_code and business_id are required' });
    }

    const result = await rpcHandler.generateDynamicQuery(
      template_code,
      business_id,
      filters || {}
    );

    res.json({ query: result.data });
  } catch (error) {
    console.error('Generate dynamic query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PERMISSION & SECURITY ROUTES
// ============================================

/**
 * POST /api/v1/permission/check
 * Check action permission
 */
router.post('/permission/check', requireAuth, async (req, res) => {
  try {
    const { business_id, user_id, table, action } = req.body;

    if (!business_id || !user_id || !table || !action) {
      return res.status(400).json({ error: 'business_id, user_id, table, and action are required' });
    }

    const result = await rpcHandler.checkActionPermission(business_id, user_id, table, action);
    res.json({ allowed: result.data });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/feature/check
 * Check feature access
 */
router.post('/feature/check', requireAuth, async (req, res) => {
  try {
    const { business_id, feature_key } = req.body;

    if (!business_id || !feature_key) {
      return res.status(400).json({ error: 'business_id and feature_key are required' });
    }

    const result = await rpcHandler.checkFeatureAccess(business_id, feature_key);
    res.json({ allowed: result.data });
  } catch (error) {
    console.error('Check feature access error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// NODE SYSTEM ROUTES
// ============================================

/**
 * POST /api/v1/node/generate-hash
 * Generate node hash
 */
router.post('/node/generate-hash', requireAuth, async (req, res) => {
  try {
    const { owner_uuid } = req.body;

    if (!owner_uuid) {
      return res.status(400).json({ error: 'owner_uuid is required' });
    }

    const result = await rpcHandler.generateNodeHash(owner_uuid);
    res.json({ hash: result.data });
  } catch (error) {
    console.error('Generate node hash error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/node/session
 * Create runtime session
 */
router.post('/node/session', requireAuth, async (req, res) => {
  try {
    const { nid, device, ip } = req.body;

    if (!nid || !device || !ip) {
      return res.status(400).json({ error: 'nid, device, and ip are required' });
    }

    const result = await rpcHandler.createRuntimeSession(nid, device, ip);
    res.json({ session_id: result.data });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/node/karma
 * Apply karma
 */
router.post('/node/karma', requireAuth, async (req, res) => {
  try {
    const { nid_hash, actor, karma_delta, trust_delta, reason } = req.body;

    if (!nid_hash || !actor || karma_delta === undefined) {
      return res.status(400).json({ error: 'nid_hash, actor, and karma_delta are required' });
    }

    const result = await rpcHandler.applyKarma(
      nid_hash,
      actor,
      karma_delta,
      trust_delta || 0,
      reason || 'Manual adjustment'
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Apply karma error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/node/billing
 * Apply billing
 */
router.post('/node/billing', requireAuth, async (req, res) => {
  try {
    const { nid, action } = req.body;

    if (!nid || !action) {
      return res.status(400).json({ error: 'nid and action are required' });
    }

    const result = await rpcHandler.applyBilling(nid, action);
    res.json({ cost: result.data });
  } catch (error) {
    console.error('Apply billing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UI ROUTES
// ============================================

/**
 * GET /api/v1/ui/schema
 * Get UI schema
 */
router.get('/ui/schema', requireAuth, async (req, res) => {
  try {
    const { business_id, template_code, table_name, role_id } = req.query;

    if (!business_id || !template_code || !table_name || !role_id) {
      return res.status(400).json({ 
        error: 'business_id, template_code, table_name, and role_id are required' 
      });
    }

    const result = await rpcHandler.getUISchema(
      business_id,
      template_code,
      table_name,
      role_id
    );

    res.json(result);
  } catch (error) {
    console.error('Get UI schema error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/ui/context
 * Get UI context
 */
router.get('/ui/context', requireAuth, async (req, res) => {
  try {
    const { user_id, business_id } = req.query;

    if (!user_id || !business_id) {
      return res.status(400).json({ error: 'user_id and business_id are required' });
    }

    const result = await rpcHandler.getUIContext(user_id, business_id);
    res.json(result);
  } catch (error) {
    console.error('Get UI context error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/ui/widget/:widgetId
 * Get widget data
 */
router.get('/ui/widget/:widgetId',
  requireAuth,
  validateUUID('widgetId'),
  async (req, res) => {
    try {
      const { business_id } = req.query;

      if (!business_id) {
        return res.status(400).json({ error: 'business_id is required' });
      }

      const result = await rpcHandler.getWidgetData(req.params.widgetId, business_id);
      res.json(result);
    } catch (error) {
      console.error('Get widget data error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/ui/branding/:businessId
 * Get branding config
 */
router.get('/ui/branding/:businessId',
  requireAuth,
  validateUUID('businessId'),
  async (req, res) => {
    try {
      const result = await rpcHandler.getBranding(req.params.businessId);
      res.json(result);
    } catch (error) {
      console.error('Get branding error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================
// PLUGIN ROUTES
// ============================================

/**
 * POST /api/v1/plugin/execute
 * Execute plugin
 */
router.post('/plugin/execute', requireAuth, async (req, res) => {
  try {
    const { business_id, plugin_code, role_id, payload } = req.body;

    if (!business_id || !plugin_code || !role_id) {
      return res.status(400).json({ 
        error: 'business_id, plugin_code, and role_id are required' 
      });
    }

    const result = await rpcHandler.executePlugin(
      business_id,
      plugin_code,
      role_id,
      payload || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Execute plugin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CACHE ROUTES
// ============================================

/**
 * GET /api/v1/cache/:cacheKey
 * Get cached result
 */
router.get('/cache/:cacheKey', requireAuth, async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({ error: 'business_id is required' });
    }

    const result = await rpcHandler.getCachedResult(business_id, req.params.cacheKey);
    res.json(result);
  } catch (error) {
    console.error('Get cached result error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/cache/generate-key
 * Generate cache key
 */
router.post('/cache/generate-key', requireAuth, async (req, res) => {
  try {
    const { template, table, role_id, filters, sort, limit, offset } = req.body;

    if (!template || !table || !role_id) {
      return res.status(400).json({ error: 'template, table, and role_id are required' });
    }

    const result = await rpcHandler.generateCacheKey(
      template,
      table,
      role_id,
      filters || {},
      sort,
      limit || 20,
      offset || 0
    );

    res.json({ cache_key: result.data });
  } catch (error) {
    console.error('Generate cache key error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UTILITY ROUTES
// ============================================

/**
 * POST /api/v1/util/encrypt
 * Encrypt payload
 */
router.post('/util/encrypt', requireAuth, async (req, res) => {
  try {
    const { payload, secret } = req.body;

    if (!payload || !secret) {
      return res.status(400).json({ error: 'payload and secret are required' });
    }

    const result = await rpcHandler.encryptPayload(payload, secret);
    res.json({ encrypted: result.data });
  } catch (error) {
    console.error('Encrypt payload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/util/decrypt
 * Decrypt payload
 */
router.post('/util/decrypt', requireAuth, async (req, res) => {
  try {
    const { encrypted, secret } = req.body;

    if (!encrypted || !secret) {
      return res.status(400).json({ error: 'encrypted and secret are required' });
    }

    const result = await rpcHandler.decryptPayload(encrypted, secret);
    res.json({ payload: result.data });
  } catch (error) {
    console.error('Decrypt payload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GDPR ROUTES
// ============================================

/**
 * DELETE /api/v1/gdpr/user/:userId
 * GDPR user deletion
 */
router.delete('/gdpr/user/:userId',
  requireAuth,
  validateUUID('userId'),
  async (req, res) => {
    try {
      await rpcHandler.gdprDeleteUser(req.params.userId);
      res.json({ success: true, message: 'User data deleted per GDPR requirements' });
    } catch (error) {
      console.error('GDPR delete user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
