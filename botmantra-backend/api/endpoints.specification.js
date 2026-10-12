/**
 * API ENDPOINTS SPECIFICATION
 * Based on Neural OS Runtime Flow
 * 
 * These endpoints implement the runtime orchestrator flow
 * Ready to be created in your Express backend
 */

const express = require('express');
const runtimeOrchestrator = require('./core/runtimeOrchestrator');
const auth = require('./middleware/auth');

const router = express.Router();

/**
 * ==================== AUTHENTICATION ====================
 */

/**
 * POST /api/auth/signup
 * 
 * Create new user and initialize NODE CORE
 * 
 * Body: {
 *   email: "user@example.com",
 *   password: "secure_password",
 *   name: "John Doe",
 *   dob: "2010-05-15"  // Birth date for age calculation
 * }
 * 
 * Response: {
 *   success: true,
 *   user_id: "USER_123",
 *   render_schema: {...},  // Dashboard schema
 *   token: "JWT_TOKEN"
 * }
 */
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name, dob } = req.body;

    // Validate input
    if (!email || !password || !name || !dob) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Calculate age
    const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));

    // Create user in auth system (Supabase, Firebase, etc.)
    const user = await createAuthUser(email, password);

    // Call runtime orchestrator
    const result = await runtimeOrchestrator.signupNewUser({
      user_id: user.id,
      email: user.email,
      name: name,
      age: age
    });

    // Generate JWT token
    const token = generateJWT(user.id);

    res.json({
      success: true,
      user_id: user.id,
      render_schema: result.render_schema,
      token: token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * 
 * Authenticate user and load dashboard
 * 
 * Body: {
 *   email: "user@example.com",
 *   password: "secure_password"
 * }
 * 
 * Response: {
 *   success: true,
 *   user_id: "USER_123",
 *   render_schema: {...},
 *   token: "JWT_TOKEN"
 * }
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Load dashboard
    const result = await runtimeOrchestrator.loginUser(user.id);

    // Generate JWT token
    const token = generateJWT(user.id);

    res.json({
      success: true,
      user_id: user.id,
      render_schema: result.render_schema,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * 
 * Invalidate user session
 */
router.post('/auth/logout', auth, async (req, res) => {
  // Invalidate token in cache/database
  res.json({ success: true });
});

/**
 * ==================== DASHBOARD ====================
 */

/**
 * GET /api/dashboard
 * 
 * Load complete dashboard with 7-step sequence
 * 
 * Query params:
 *   - brand (optional): Force load specific brand
 *   - refresh_sections (optional): "all" or comma-separated (widgets,layout,vector)
 * 
 * Response: {
 *   success: true,
 *   render_schema: {
 *     brand: "vanshawali",
 *     widgets: [...],
 *     theme: {...},
 *     features: [...],
 *     vector_hints: {...}
 *   }
 * }
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { brand, refresh_sections } = req.query;

    let result;

    if (brand) {
      // Load specific brand
      const dashboardLoader = require('./core/dashboardLoader');
      result = await dashboardLoader.loadBrandDashboard(userId, brand);
    } else {
      // Load default dashboard
      result = await runtimeOrchestrator.loginUser(userId);
    }

    res.json({
      success: true,
      render_schema: result.render_schema
    });
  } catch (error) {
    console.error('Dashboard load error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/dashboard/refresh
 * 
 * Partial refresh of specific dashboard sections
 * 
 * Body: {
 *   sections: ["widgets", "vector", "layout"]  // or "all"
 * }
 * 
 * Response: {
 *   success: true,
 *   render_schema: {...}
 * }
 */
router.post('/dashboard/refresh', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sections } = req.body;

    const dashboardLoader = require('./core/dashboardLoader');
    const result = await dashboardLoader.refreshDashboard(
      userId,
      sections || ['all']
    );

    res.json({
      success: true,
      render_schema: result.render_schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/app-state
 * 
 * Get complete app state
 * 
 * Response: {
 *   user: {...},
 *   active_brand: "vanshawali",
 *   available_brands: [...],
 *   dashboard: {...},
 *   kernel_ready: true
 * }
 */
router.get('/dashboard/app-state', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const appState = await runtimeOrchestrator.getAppState(userId);

    res.json({
      success: true,
      app_state: appState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================== BRANDS ====================
 */

/**
 * GET /api/brands
 * 
 * Get all brands and user's available brands
 * 
 * Response: {
 *   success: true,
 *   all_brands: [...],
 *   user_available_brands: [...]
 * }
 */
router.get('/brands', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const brandRouter = require('./core/brandRouter');

    const allBrands = await brandRouter.getAllBrands();
    const userBrands = await brandRouter.getAvailableBrands(userId);

    res.json({
      success: true,
      all_brands: allBrands.brands,
      user_available_brands: userBrands.brands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/brands/switch
 * 
 * Switch active brand
 * 
 * Body: {
 *   brand_key: "jeetmantra"
 * }
 * 
 * Response: {
 *   success: true,
 *   brand: "jeetmantra",
 *   render_schema: {...}
 * }
 */
router.post('/brands/switch', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { brand_key } = req.body;

    const result = await runtimeOrchestrator.handleDashboardAction(userId, {
      type: 'switch_brand',
      brand_key: brand_key
    });

    res.json({
      success: result.success,
      brand: brand_key,
      render_schema: result.ui.render_schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================== NODES ====================
 */

/**
 * GET /api/nodes
 * 
 * Query nodes with filters
 * 
 * Query params:
 *   - node_type: "post", "task", "homework", etc.
 *   - owner_node (optional): Filter by owner
 *   - parent_node (optional): Filter by parent
 *   - limit: Max results (default 20)
 *   - offset: Pagination offset
 * 
 * Response: {
 *   success: true,
 *   total: 150,
 *   nodes: [...],
 *   pagination: { limit, offset, total }
 * }
 */
router.get('/nodes', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { node_type, owner_node, parent_node, limit = 20, offset = 0 } = req.query;
    const nodeCore = require('./core/nodeCore');

    const filters = {
      node_type: node_type,
      owner_node: owner_node || userId,
      parent_node: parent_node
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => !filters[key] && delete filters[key]);

    const result = await nodeCore.queryNodes(filters);

    // Apply pagination
    const paginated = result.nodes.slice(offset, offset + limit);

    res.json({
      success: true,
      total: result.nodes.length,
      nodes: paginated,
      pagination: { limit, offset, total: result.nodes.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/nodes/create
 * 
 * Create new node (post, task, family member, etc.)
 * 
 * Body: {
 *   node_type: "post",  // or "task", "homework", "family_member", etc.
 *   node_data: {
 *     title: "My post",
 *     content: "Hello world!",
 *     visibility: "friends"
 *   }
 * }
 * 
 * Response: {
 *   success: true,
 *   node: {...},
 *   render_schema: {...}  // Updated dashboard
 * }
 */
router.post('/nodes/create', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { node_type, node_data } = req.body;

    const result = await runtimeOrchestrator.handleDashboardAction(userId, {
      type: 'create_node',
      node_type: node_type,
      node_data: node_data
    });

    res.json({
      success: result.success,
      node: result.ui.node,
      render_schema: result.ui.render_schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/nodes/:nodeId
 * 
 * Get specific node by ID
 * 
 * Response: {
 *   success: true,
 *   node: {...}
 * }
 */
router.get('/nodes/:nodeId', auth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const nodeCore = require('./core/nodeCore');

    const result = await nodeCore.queryNodes({
      node_id: nodeId
    });

    if (!result.nodes || result.nodes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }

    res.json({
      success: true,
      node: result.nodes[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/nodes/:nodeId
 * 
 * Update node
 * 
 * Body: {
 *   updates: {
 *     title: "Updated title",
 *     metadata: { ... }
 *   }
 * }
 * 
 * Response: {
 *   success: true,
 *   node: {...}
 * }
 */
router.put('/nodes/:nodeId', auth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { updates } = req.body;
    const nodeCore = require('./core/nodeCore');

    const result = await nodeCore.updateNode(nodeId, updates);

    res.json({
      success: result.success,
      node: result.node
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/nodes/:nodeId/relationships
 * 
 * Create relationship between nodes
 * 
 * Body: {
 *   to_node_id: "NODE_456",
 *   relationship_type: "parent"
 * }
 * 
 * Response: {
 *   success: true,
 *   relationship: {...}
 * }
 */
router.post('/nodes/:nodeId/relationships', auth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { to_node_id, relationship_type } = req.body;
    const nodeCore = require('./core/nodeCore');

    const result = await nodeCore.createRelationship(
      nodeId,
      to_node_id,
      relationship_type
    );

    res.json({
      success: result.success,
      relationship: result.relationship
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================== VOICE/CHAT (MCP) ====================
 */

/**
 * POST /api/chat/command
 * 
 * Process voice/chat command via MCP Kernel
 * 
 * Body: {
 *   input: "Show my homework"
 * }
 * 
 * Response: {
 *   success: true,
 *   tools_executed: 2,
 *   ui_update: {
 *     type: "full_reload",
 *     render_schema: {...}
 *   }
 * }
 */
router.post('/chat/command', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { input } = req.body;

    const result = await runtimeOrchestrator.handleVoiceCommand(userId, input);

    res.json({
      success: result.success,
      tools_executed: result.tools_executed,
      ui_update: result.ui_update
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat/tools
 * 
 * Get available MCP tools for AI
 * 
 * Response: {
 *   success: true,
 *   tools: {
 *     query_vector: {...},
 *     fetch_node: {...},
 *     ...
 *   }
 * }
 */
router.get('/chat/tools', auth, async (req, res) => {
  try {
    const result = await runtimeOrchestrator.getAvailableMCPTools();

    res.json({
      success: true,
      tools: result.tools
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================== VECTOR MEMORY ====================
 */

/**
 * POST /api/vector/query
 * 
 * Query vector memory for similar content
 * 
 * Body: {
 *   query: "summer memories",
 *   limit: 5
 * }
 * 
 * Response: {
 *   success: true,
 *   results: [...]  // Vector search results
 * }
 */
router.post('/vector/query', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, limit = 5 } = req.body;

    // This would call vector memory system (Pinecone, Weaviate, etc.)
    const results = await queryVectorMemory(userId, query, limit);

    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================== USER SETTINGS ====================
 */

/**
 * GET /api/user/profile
 * 
 * Get user profile
 * 
 * Response: {
 *   success: true,
 *   profile: {
 *     name, email, age, profile_picture, bio
 *   }
 * }
 */
router.get('/user/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const nodeCore = require('./core/nodeCore');

    const userNode = await nodeCore.loadUserNode(userId);

    res.json({
      success: true,
      profile: userNode.user_node.metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/user/profile
 * 
 * Update user profile
 * 
 * Body: {
 *   name: "New Name",
 *   bio: "Updated bio",
 *   profile_picture: "url"
 * }
 */
router.put('/user/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, profile_picture } = req.body;
    const nodeCore = require('./core/nodeCore');

    const result = await nodeCore.updateNode(userId, {
      metadata: {
        name: name,
        bio: bio,
        profile_picture: profile_picture
      }
    });

    res.json({
      success: result.success,
      profile: result.node.metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/permissions
 * 
 * Get user's permissions for all brands
 * 
 * Response: {
 *   success: true,
 *   permissions: {
 *     vanshawali: {...},
 *     jeetmantra: {...},
 *     ...
 *   }
 * }
 */
router.get('/user/permissions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const nodeCore = require('./core/nodeCore');

    const userNode = await nodeCore.loadUserNode(userId);

    res.json({
      success: true,
      permissions: userNode.permission_node.permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
