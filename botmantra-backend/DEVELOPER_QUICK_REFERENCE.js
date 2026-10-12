/**
 * NEURAL OS - QUICK DEVELOPER REFERENCE
 * 
 * Fast lookup for implementing features
 * Based on 2,050+ lines of runtime code
 */

// ============================================================
// QUICK START - MINIMAL VIABLE INTEGRATION
// ============================================================

/*
STEP 1: Import the orchestrator
*/
const runtimeOrchestrator = require('./core/runtimeOrchestrator');

/*
STEP 2: On signup
*/
async function handleSignup(email, password, name, dob) {
  const age = calculateAge(dob);
  
  return await runtimeOrchestrator.signupNewUser({
    user_id: user.id,
    email: email,
    name: name,
    age: age
  });
  
  // Returns: { render_schema, user_node, success }
  // render_schema = what to display on frontend
}

/*
STEP 3: On login
*/
async function handleLogin(userId) {
  return await runtimeOrchestrator.loginUser(userId);
  
  // Returns: { render_schema, user_node, success }
}

/*
STEP 4: On any user action
*/
async function handleUserAction(userId, action) {
  return await runtimeOrchestrator.handleDashboardAction(userId, action);
  
  // action = {
  //   type: 'switch_brand|create_node|widget_click|voice_command|refresh',
  //   ... additional params
  // }
  
  // Returns: { ui_update, success }
}

// ============================================================
// COMMON PATTERNS
// ============================================================

/*
PATTERN 1: Load dashboard
*/
async function loadDashboard(userId, brandKey = null) {
  const dashboardLoader = require('./core/dashboardLoader');
  
  if (brandKey) {
    return await dashboardLoader.loadBrandDashboard(userId, brandKey);
  }
  return await dashboardLoader.loadDashboard(userId);
  
  // Result: { render_schema, ... }
}

/*
PATTERN 2: Create a node
*/
async function createNodeOfType(userId, nodeType, nodeData) {
  const nodeFactory = require('./core/nodeFactory');
  
  if (nodeType === 'post' || nodeType === 'task' || nodeType === 'homework') {
    return await nodeFactory.createNonLiveNode(userId, nodeType, nodeData);
  }
  
  if (nodeType === 'family_member' || nodeType === 'friend') {
    return await nodeFactory.createLiveNode(userId, nodeType, nodeData);
  }
}

/*
PATTERN 3: Query nodes
*/
async function findNodes(filters) {
  const nodeCore = require('./core/nodeCore');
  
  // filters can include:
  // - node_type: 'post', 'task', 'homework', etc.
  // - owner_node: user_id
  // - parent_node: parent_id
  // - brand_root: 'vanshawali', 'jeetmantra', etc.
  
  return await nodeCore.queryNodes(filters);
  
  // Result: { nodes: [...], count: n }
}

/*
PATTERN 4: Switch brand
*/
async function switchUserBrand(userId, brandKey) {
  const brandRouter = require('./core/brandRouter');
  
  await brandRouter.switchBrand(userId, brandKey);
  
  // Then reload dashboard:
  return await loadDashboard(userId, brandKey);
}

/*
PATTERN 5: Process voice command
*/
async function processVoiceInput(userId, voiceText) {
  return await runtimeOrchestrator.handleVoiceCommand(userId, voiceText);
  
  // Result: { type: 'full_reload|layout_update|refresh', reload_sections: [...] }
}

// ============================================================
// NODE CREATION EXAMPLES
// ============================================================

/*
Create a POST
*/
async function createPost(userId, title, content, visibility = 'friends') {
  const nodeFactory = require('./core/nodeFactory');
  
  return await nodeFactory.createNonLiveNode(userId, 'post', {
    title: title,
    content: content,
    visibility: visibility,  // 'public', 'friends', 'family_only', 'private'
    media_urls: []
  });
}

/*
Create HOMEWORK
*/
async function createHomework(teacherId, title, instructions, deadline) {
  const nodeFactory = require('./core/nodeFactory');
  
  return await nodeFactory.createNonLiveNode(teacherId, 'homework', {
    title: title,
    instructions: instructions,
    deadline: deadline,
    subject: 'math',  // or 'english', 'science', etc.
    status: 'pending'
  });
}

/*
Create TASK (for Mantravat/business)
*/
async function createTask(userId, title, assignedTo, deadline) {
  const nodeFactory = require('./core/nodeFactory');
  
  return await nodeFactory.createNonLiveNode(userId, 'task', {
    title: title,
    assigned_to: assignedTo,
    priority: 'high',  // or 'medium', 'low'
    deadline: deadline,
    status: 'pending'
  });
}

/*
Add FAMILY MEMBER
*/
async function addFamilyMember(userId, name, relationType) {
  const nodeFactory = require('./core/nodeFactory');
  
  return await nodeFactory.createLiveNode(userId, 'family_member', {
    name: name,
    relation_type: relationType  // 'parent', 'sibling', 'child'
  });
}

/*
Add FRIEND
*/
async function addFriend(userId, friendName) {
  const nodeFactory = require('./core/nodeFactory');
  
  return await nodeFactory.createLiveNode(userId, 'friend', {
    name: friendName
  });
}

/*
Create COMPANY
*/
async function createCompany(userId, companyName, industry) {
  const nodeFactory = require('./core/nodeFactory');
  
  return await nodeFactory.createLiveNode(userId, 'company', {
    name: companyName,
    industry: industry,
    size: 'small'  // or 'medium', 'large'
  });
}

/*
Create COURSE
*/
async function createCourse(teacherId, courseName, targetAgeRange) {
  const nodeFactory = require('./core/nodeFactory');
  
  return await nodeFactory.createNonLiveNode(teacherId, 'course', {
    name: courseName,
    description: '',
    modules: [],
    target_age_range: targetAgeRange  // [10, 18]
  });
}

// ============================================================
// BRAND-SPECIFIC LOGIC
// ============================================================

/*
Get available brands for user
*/
async function getUserBrands(userId) {
  const brandRouter = require('./core/brandRouter');
  const result = await brandRouter.getAvailableBrands(userId);
  
  // Result: { brands: [{ key, name, color, age_range }, ...] }
  return result.brands;
}

/*
Check if user can access brand
*/
async function canAccessBrand(userId, brandKey) {
  const brands = await getUserBrands(userId);
  return brands.some(b => b.key === brandKey);
}

/*
Get all features for user in brand
*/
async function getAvailableFeatures(userId, brandKey) {
  const brandRouter = require('./core/brandRouter');
  const result = await brandRouter.getBrandFeatures(userId, brandKey);
  
  // Result: { features: [...] }
  return result.features;
}

/*
Get user's active brand
*/
async function getActiveBrand(userId) {
  const brandRouter = require('./core/brandRouter');
  const result = await brandRouter.getActiveBrand(userId);
  
  // Result: { active_brand, brand_definition }
  return result.active_brand;
}

// ============================================================
// VOICE COMMAND EXAMPLES
// ============================================================

/*
User says: "Show my family"
*/
async function handleVoiceCommand(userId, input) {
  const orchestrator = require('./core/runtimeOrchestrator');
  return await orchestrator.handleVoiceCommand(userId, input);
  
  // Input: "Show my family"
  // AI decides: switch to vanshawali, fetch family nodes
  // Result: UI updates with family tree
}

/*
User says: "Create a post"
*/
// System will show compose dialog
// User creates post
// Node is created

/*
User says: "Show my homework"
*/
// AI decides: switch to jeetmantra
// Fetch homework nodes
// Display homework widget

/*
User says: "List my tasks"
*/
// AI decides: switch to mantravat
// Fetch task nodes
// Display task board

// ============================================================
// RENDER SCHEMA STRUCTURE
// ============================================================

/*
What the frontend receives:
*/
const renderSchema = {
  brand: 'vanshawali',
  brand_color: '#8B5CF6',
  layout_type: 'social_feed',
  safe_mode: false,
  
  widgets: [
    {
      id: 'w1',
      type: 'posts_feed',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 60 },
      title: 'Social Feed',
      data: [
        // Array of post nodes
      ],
      config: {
        limit: 10,
        sort: 'recent'
      }
    },
    {
      id: 'w2',
      type: 'family_tree',
      position: { x: 100, y: 0 },
      size: { width: 100, height: 60 },
      title: 'Family',
      data: [
        // Array of family member nodes
      ]
    }
    // ... more widgets
  ],
  
  theme: {
    color: '#8B5CF6',
    icon: 'users',
    fonts: 'sans-serif'
  },
  
  features: ['social_feed', 'family_tree', 'posts', ...],
  
  vector_hints: {
    uses: ['suggest_memories', 'similar_posts', ...],
    enabled: true
  }
};

// ============================================================
// API ENDPOINT MAPPING
// ============================================================

/*
Frontend → Backend mapping:

User Actions:
- Signup: POST /api/auth/signup
- Login: POST /api/auth/login
- Load Dashboard: GET /api/dashboard
- Refresh Dashboard: POST /api/dashboard/refresh

Brand:
- Get Brands: GET /api/brands
- Switch Brand: POST /api/brands/switch

Nodes:
- List Nodes: GET /api/nodes?node_type=post
- Create Node: POST /api/nodes/create
- Get Node: GET /api/nodes/:id
- Update Node: PUT /api/nodes/:id

Relationships:
- Add Relationship: POST /api/nodes/:id/relationships

Chat:
- Send Command: POST /api/chat/command
- Get Tools: GET /api/chat/tools

Vector:
- Query Memory: POST /api/vector/query

User:
- Get Profile: GET /api/user/profile
- Update Profile: PUT /api/user/profile
- Get Permissions: GET /api/user/permissions
*/

// ============================================================
// DEBUGGING HELPERS
// ============================================================

/*
Check if node was created correctly
*/
async function validateNode(nodeId) {
  const nodeCore = require('./core/nodeCore');
  const result = await nodeCore.queryNodes({ node_id: nodeId });
  
  if (!result.nodes || result.nodes.length === 0) {
    console.error('Node not found:', nodeId);
    return false;
  }
  
  const node = result.nodes[0];
  
  // Check required fields
  if (!node.node_id || !node.node_type || !node.owner_node) {
    console.error('Node missing required fields');
    return false;
  }
  
  console.log('Node valid:', node.node_type, node.node_id);
  return true;
}

/*
Get complete app state (for debugging)
*/
async function getDebugState(userId) {
  const orchestrator = require('./core/runtimeOrchestrator');
  return await orchestrator.getAppState(userId);
  
  // Returns: { user, active_brand, available_brands, dashboard, kernel_ready }
}

/*
Trace dashboard loading
*/
async function traceDashboardLoad(userId) {
  console.log('Step 1: Load user node...');
  const nodeCore = require('./core/nodeCore');
  const userNode = await nodeCore.loadUserNode(userId);
  console.log('✓ User node loaded');
  
  console.log('Step 2: Get active brand...');
  const brandRouter = require('./core/brandRouter');
  const brand = await brandRouter.getActiveBrand(userId);
  console.log('✓ Brand:', brand.active_brand);
  
  console.log('Step 3-7: Loading dashboard...');
  const dashboardLoader = require('./core/dashboardLoader');
  const dashboard = await dashboardLoader.loadDashboard(userId);
  console.log('✓ Dashboard loaded');
  
  return dashboard;
}

// ============================================================
// TESTING TEMPLATES
// ============================================================

/*
Test signup flow
*/
async function testSignup() {
  const result = await runtimeOrchestrator.signupNewUser({
    user_id: 'TEST_USER_1',
    email: 'test@example.com',
    name: 'Test User',
    age: 15
  });
  
  if (!result.success) {
    console.error('Signup failed:', result.error);
    return false;
  }
  
  console.log('Signup success');
  console.log('Brand:', result.render_schema.brand);
  console.log('Widgets:', result.render_schema.widgets.map(w => w.type));
  
  return true;
}

/*
Test node creation
*/
async function testNodeCreation(userId) {
  const nodeFactory = require('./core/nodeFactory');
  
  const post = await nodeFactory.createNonLiveNode(userId, 'post', {
    title: 'Test Post',
    content: 'Hello world',
    visibility: 'friends'
  });
  
  console.log('Post created:', post.node.node_id);
  
  return post.node;
}

/*
Test brand switching
*/
async function testBrandSwitch(userId) {
  const brandRouter = require('./core/brandRouter');
  
  const result = await brandRouter.switchBrand(userId, 'jeetmantra');
  
  if (!result.success) {
    console.error('Brand switch failed:', result.error);
    return false;
  }
  
  console.log('Brand switched to jeetmantra');
  
  // Now load dashboard for new brand
  const dashboard = await loadDashboard(userId, 'jeetmantra');
  console.log('Dashboard loaded for jeetmantra');
  
  return true;
}

// ============================================================
// PERFORMANCE TIPS
// ============================================================

/*
Parallel loading (faster dashboard):
Instead of:
  const dashboard = await dashboardLoader.loadDashboard(userId);
  
Use batch parallel loading:
*/
async function loadDashboardFast(userId) {
  const nodeCore = require('./core/nodeCore');
  const brandRouter = require('./core/brandRouter');
  
  // Load in parallel
  const [userNode, brand] = await Promise.all([
    nodeCore.loadUserNode(userId),
    brandRouter.getActiveBrand(userId)
  ]);
  
  // Then continue sequentially if needed
  const dashboardLoader = require('./core/dashboardLoader');
  return await dashboardLoader.loadDashboard(userId);
}

/*
Cache frequently accessed data:
*/
const cache = {
  brands: null,
  nodes: {}
};

async function getCachedBrands() {
  if (!cache.brands) {
    const brandRouter = require('./core/brandRouter');
    cache.brands = await brandRouter.getAllBrands();
  }
  return cache.brands;
}

// ============================================================
// ERROR HANDLING PATTERNS
// ============================================================

/*
Safe dashboard load with fallback
*/
async function safeLoadDashboard(userId) {
  try {
    const orchestrator = require('./core/runtimeOrchestrator');
    const result = await orchestrator.loginUser(userId);
    
    if (!result.success) {
      console.warn('Dashboard load failed, returning default');
      return getDefaultDashboard();
    }
    
    return result.render_schema;
  } catch (error) {
    console.error('Dashboard load error:', error);
    return getDefaultDashboard();
  }
}

function getDefaultDashboard() {
  return {
    brand: 'vanshawali',
    widgets: [],
    theme: { color: '#8B5CF6' },
    features: [],
    error: 'Failed to load dashboard'
  };
}

// ============================================================
// SUMMARY
// ============================================================

/*
This quick reference covers:
✓ Signup and login
✓ Creating all node types
✓ Switching brands
✓ Processing voice commands
✓ Understanding render schema
✓ API endpoint mapping
✓ Debugging helpers
✓ Testing templates
✓ Performance tips
✓ Error handling

For complete documentation, see:
- RUNTIME_FLOW_COMPLETE.md (all phases and details)
- nodeCore.js (graph database)
- brandRouter.js (brand routing)
- dashboardLoader.js (UI assembly)
- nodeFactory.js (node creation)
- kernelIntegration.js (MCP integration)
- runtimeOrchestrator.js (flow orchestration)
*/
