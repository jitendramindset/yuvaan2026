require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');
const { supabase, queryTable, insertData, updateData, deleteData } = require('./config/supabase');
const setupKernelRoutes = require('./routes-kernel');
const { initRealtime } = require('./realtime-server');
const setupAuthRoutes = require('./routes-auth');
const setupChatRoutes = require('./routes-chat');
const karmaDharmaRoutes = require('./routes-karma-dharma');
const nodesRoutes = require('./routes-nodes');
const widgetConfigRoutes = require('./routes/widget-config');
const uiToolsRoutes = require('./routes/ui-tools-api');
const kernelExecuteRoutes = require('./routes/kernel-execute');
const uiBootstrapRoutes = require('./routes/ui-bootstrap');
const interactionClassifier = require('./routes/routes-interaction-classifier');
const uiRenderer = require('./routes/routes-ui-renderer');
const walletRoutes = require('./routes/routes-wallet');
const transactionRoutes = require('./routes/routes-transactions');
const revenueRoutes = require('./routes/routes-revenue');
const uiExtensionsRoutes = require('./routes/ui-extensions');
const appBuilderRoutes = require('./routes/app-builder');
const aiWebsiteRoutes = require('./routes/ai-website-routes');
const onboardingRoutes = require('./routes-onboarding');
const setupVanshawaliRoutes = require('./routes-vanshawali');
const legacyUiRoutes = require('./routes/legacy-ui-api');
const authApiRoutes = require('./routes/auth-api');
const adminApiRoutes = require('./routes/admin-api');
const setupAdminNodeOSRoutes = require('./routes/admin-nodeos');
const dashboardApiRoutes = require('./routes/dashboard-api');
const setupNeuralOSAPI = require('./routes/neural-os-api');
const mcpTextApiRoutes = require('./routes/mcp-text-api');
const aiActionRequestsNodeRoutes = require('./routes/ai-action-requests-node');
const aiActionWhitelistNodeRoutes = require('./routes/ai-action-whitelist-node');
const aiAgentRulesNodeRoutes = require('./routes/ai-agent-rules-node');
const aiAgentTemplatesNodeRoutes = require('./routes/ai-agent-templates-node');
const aiAppRequestsNodeRoutes = require('./routes/ai-app-requests-node');
const aiChatMessagesNodeRoutes = require('./routes/ai-chat-messages-node');
const aiChatSessionsNodeRoutes = require('./routes/ai-chat-sessions-node');
const aiDashboardRequestsNodeRoutes = require('./routes/ai-dashboard-requests-node');
const aiGeneratedTemplatesNodeRoutes = require('./routes/ai-generated-templates-node');
const aiKnowledgeBaseNodeRoutes = require('./routes/ai-knowledge-base-node');
const aiModelRouterNodeRoutes = require('./routes/ai-model-router-node');
const aiSemanticCacheNodeRoutes = require('./routes/ai-semantic-cache-node');
const aiPluginsNodeRoutes = require('./routes/ai-plugins-node');
const aiSessionMemoryNodeRoutes = require('./routes/ai-session-memory-node');
const aiSummaryCacheNodeRoutes = require('./routes/ai-summary-cache-node');
const aiVoiceLogsNodeRoutes = require('./routes/ai-voice-logs-node');
const aiPreferencesNodeRoutes = require('./routes/ai-preferences-node');

// ═══════════════════════════════════════════════════════════════
// 🚀 MAIN APIS - Two Core Systems
// ═══════════════════════════════════════════════════════════════
const botmantraAIRoutes = require('./routes/botmantra-ai-framework');
const nodecoreChatRoutes = require('./routes/nodecore-chat');

const app = express();
const { KernelExecutor } = require('./core/kernel-executor');
const kernelExecutor = new KernelExecutor(supabase);
app.set('kernelExecutor', kernelExecutor);
app.set('nodeCache', kernelExecutor.getNodeCache());
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);

app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to inject supabase into requests
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Auto-create user records for authenticated requests
const ensureUserExists = require('./middleware/ensureUserExists');
app.use(ensureUserExists);

// ═══════════════════════════════════════════════════════════════
// � DEBUG ROUTES (Development Only)
// ═══════════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'production') {
  const debugRoutes = require('./routes/debug');
  debugRoutes(app, supabase);
}

// ═══════════════════════════════════════════════════════════════
// �🔥 MAIN API #1: BotMantra AI Framework (No Auth Required)
// Purpose: UI Building, Data-to-UI conversion, Property management
// ═══════════════════════════════════════════════════════════════
app.use('/api/botmantra-ai', botmantraAIRoutes);

// ═══════════════════════════════════════════════════════════════
// 🔥 MAIN API #2: NodeCore Chat (Auth Required)
// Purpose: Data operations with RAG, Permissions, AI Key management
// ═══════════════════════════════════════════════════════════════
app.use('/api/nodecore-chat', nodecoreChatRoutes);
// Alias for legacy UI routes
app.use('/api/nodecore', nodecoreChatRoutes);

// 🔥 Load Widget Configuration Routes
app.use('/api/widget', widgetConfigRoutes);

// 🔥 Load UI Tools API (Auth Required)
app.use('/api/ui-tools', uiToolsRoutes);

// 🔥 UI Bootstrap (UI Contract)
app.use('/', uiBootstrapRoutes);

// 🔥 Load Chat Routes (UNIFIED ENDPOINT)
setupChatRoutes(app, supabase);

// 🔥 Load Authentication Routes
setupAuthRoutes(app, supabase);

// 🔥 Load Vanshawali Routes (Genealogy & Family Tree)
setupVanshawaliRoutes(app, supabase);
setupAdminNodeOSRoutes(app, supabase);

// 🔥 Load Onboarding Routes
app.use('/api/onboarding', onboardingRoutes);

// 🔥 Load Kernel Routes
const io = initRealtime(httpServer);
app.set('io', io);
setupKernelRoutes(app, supabase, io);

// 🔥 Kernel Execute (MCP gateway)
app.use('/kernel', kernelExecuteRoutes);

// 🔥 Load Unified Onboarding Kernel Routes (NEW - 4 Engines)
const setupUnifiedOnboardingRoutes = require('./routes-onboarding-kernel');
setupUnifiedOnboardingRoutes(app, supabase, io);

// 🔥 Load Karma/Dharma Routes (NEW)
app.use('/api/karma-dharma', karmaDharmaRoutes);

// 🔥 Load Interaction Classifier (NODE OS)
app.use('/api/interaction', interactionClassifier);

// 🔥 Load UI Renderer (NODE OS)
app.use('/api/ui', uiRenderer);

// 🔥 Load Wallet Routes (ECONOMY SYSTEM)
app.use('/api/wallet', walletRoutes);

// 🔥 MCP Text API (VS Code integration)
app.use('/api', mcpTextApiRoutes);

// ═══════════════════════════════════════════════════════════════
// 🆕 AUTO-GENERATED API ROUTES (34 Tables, 158 Endpoints)
// Purpose: Complete CRUD for Business, AI, CRM tables
// ═══════════════════════════════════════════════════════════════
try {
  const generatedRoutes = require('./routes/api-index');
  app.use('/api', generatedRoutes);
  console.log('✅ Loaded 158 auto-generated API endpoints');
} catch (error) {
  console.warn('⚠️ Auto-generated routes not found - run: node api-generator.js');
}

// ═══════════════════════════════════════════════════════════════
// 🔥 NEW API V1 - RPC-BASED ROUTES (30+ Endpoints)
// Purpose: Template-based data access, AI, Permissions, Node system
// ═══════════════════════════════════════════════════════════════
try {
  const apiRoutesV1 = require('./routes/api-routes-v1');
  app.use('/api/v1', apiRoutesV1);
  console.log('✅ Loaded API v1 routes (30+ RPC endpoints)');
} catch (error) {
  console.warn('⚠️ API v1 routes not found:', error.message);
}

// 🔥 Load Transaction Routes (ECONOMY SYSTEM)
app.use('/api/transaction', transactionRoutes);

// 🔥 Load Revenue Routes (ECONOMY SYSTEM - REVENUE SHARING)
app.use('/api/revenue', revenueRoutes);

// 🔥 Load UI Extensions (MARKETPLACE, THEMES, WHITE LABEL)
app.use('/api/ui-extensions', uiExtensionsRoutes);

// 🔥 Load App Builder Routes (MOBILE + WEB APP BUILDER, DEPLOYMENT)
app.use('/api/app-builder', appBuilderRoutes);

// 🔥 Legacy UI compatibility routes
app.use('/api', legacyUiRoutes);

// 🔥 Load Nodes Routes (Location & Proximity)
app.use('/api/nodes', nodesRoutes(app, supabase));

// 🔥 AI Website Builder Routes (AI-Powered Website Generation)
app.use('/api/ai-web', aiWebsiteRoutes);

// 🔥 Auth API Routes — not mounted (use routes-auth.js via setupAuthRoutes)
// app.use('/api/auth', authApiRoutes);

// 🔥 Admin API Routes (Theme, Widgets, Layouts, Audit)
app.use('/api/admin', adminApiRoutes);

// 🔥 Dashboard API Routes (Dashboard CRUD, Widgets, Sharing)
app.use('/api/dashboard', dashboardApiRoutes);

// 🔥 AI Action Requests Node Routes (Node-based action request management)
app.use('/api/action-requests', aiActionRequestsNodeRoutes);

// 🔥 AI Action Whitelist Node Routes (Node-based whitelist management)
app.use('/api/action-whitelist', aiActionWhitelistNodeRoutes);

// 🔥 AI Agent Rules Node Routes (Node-based agent rule management)
app.use('/api/agent-rules', aiAgentRulesNodeRoutes);

// 🔥 AI Agent Templates Node Routes (Node-based agent template management)
app.use('/api/agent-templates', aiAgentTemplatesNodeRoutes);

// 🔥 AI App Requests Node Routes (Node-based app request management)
app.use('/api/app-requests', aiAppRequestsNodeRoutes);

// 🔥 AI Chat Messages Node Routes (Node-based chat message management)
app.use('/api/chat-messages', aiChatMessagesNodeRoutes);

// 🔥 AI Chat Sessions Node Routes (Node-based chat session management)
app.use('/api/chat-sessions', aiChatSessionsNodeRoutes);

// 🔥 AI Dashboard Requests Node Routes (Node-based dashboard request management)
app.use('/api/dashboard-requests', aiDashboardRequestsNodeRoutes);

// 🔥 AI Generated Templates Node Routes (Node-based template management)
app.use('/api/generated-templates', aiGeneratedTemplatesNodeRoutes);

// 🔥 AI Knowledge Base Node Routes (Node-based knowledge base management)
app.use('/api/ai-knowledge-base', aiKnowledgeBaseNodeRoutes);

// 🔥 AI Model Router Node Routes (Node-based AI model routing management)
app.use('/api/ai-model-router', aiModelRouterNodeRoutes);

// 🔥 AI Semantic Cache Node Routes (Node-based AI semantic caching)
app.use('/api/ai-semantic-cache', aiSemanticCacheNodeRoutes);

// 🔥 AI Plugins Node Routes (Node-based AI plugins management)
app.use('/api/ai-plugins', aiPluginsNodeRoutes);

// 🔥 AI Session Memory Node Routes (Node-based AI session memory management)
app.use('/api/ai-session-memory', aiSessionMemoryNodeRoutes);

// 🔥 AI Summary Cache Node Routes (Node-based AI summary caching)
app.use('/api/ai-summary-cache', aiSummaryCacheNodeRoutes);

// 🔥 AI Voice Logs Node Routes (Node-based AI voice interaction logging)
app.use('/api/ai-voice-logs', aiVoiceLogsNodeRoutes);

// 🔥 AI Preferences Node Routes (Node-based AI user preferences management)
app.use('/api/ai-preferences', aiPreferencesNodeRoutes);

// 🔥 API Keys Node Routes (Node-based API key management)
const apiKeysNodeRoutes = require('./routes/api-keys-node');
app.use('/api/api-keys', apiKeysNodeRoutes);

// 🔥 API Logs Node Routes (Node-based API request logging)
const apiLogsNodeRoutes = require('./routes/api-logs-node');
app.use('/api/api-logs', apiLogsNodeRoutes);

// 🔥 API Rate Limit Node Routes (Node-based API rate limiting)
const apiRateLimitNodeRoutes = require('./routes/api-rate-limit-node');
app.use('/api/api-rate-limit', apiRateLimitNodeRoutes);

// 🔥 API Routes Node Routes (Node-based API route configuration)
const apiRoutesNodeRoutes = require('./routes/api-routes-node');
app.use('/api/api-routes', apiRoutesNodeRoutes);

// 🧠 Neural OS API (Nodes, Widgets, Brands, Vectors, Admin AI)
setupNeuralOSAPI(app, supabase);

// ⚡ Kernel V2 — Unified Execution Pipeline (16-step governed kernel)
const setupKernelV2Routes = require('./routes/kernel-v2-api');
setupKernelV2Routes(app, supabase, io);

// 🧬 Neural OS Advanced — Layout Evolution + Node Graph + Gossip Network
const setupAdvancedRoutes = require('./routes/neural-advanced-api');
setupAdvancedRoutes(app, supabase, io);

// Realtime push endpoint (n8n/webhooks)
app.post('/realtime/push', (req, res) => {
  const io = app.get('io');
  const { nid_hash, type, payload, message } = req.body || {};
  if (!io) {
    return res.status(503).json({ success: false, error: 'Realtime not available' });
  }
  const room = nid_hash || 'public';
  io.to(room).emit('kernel_update', {
    type: type || 'notification',
    payload: payload || { message }
  });
  return res.json({ success: true });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Database Status Endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const result = await supabase.from('users').select('count()', { count: 'exact' }).limit(1);
    res.json({
      status: 'connected',
      timestamp: new Date(),
      message: '✅ Supabase connection successful'
    });
  } catch (error) {
    res.status(500).json({
      status: 'disconnected',
      error: error.message,
      message: '❌ Supabase connection failed'
    });
  }
});

// Data Model Registry Endpoint (used by UI onboarding)
app.get('/api/data-model-registry', async (req, res) => {
  try {
    const { module, businessId, tableName, limit = 200 } = req.query;
    let query = supabase.from('data_model_registry').select('*');

    if (module) query = query.eq('module', module);
    if (businessId) query = query.eq('business_id', businessId);
    if (tableName) query = query.eq('table_name', tableName);

    const { data, error } = await query.limit(parseInt(limit));
    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔧 TEMP: Role Assignment Fix Endpoint
app.post('/api/admin/assign-role/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check existing roles
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (existingRoles && existingRoles.length > 0) {
      return res.json({
        success: true,
        message: 'User already has roles',
        roles: existingRoles
      });
    }
    
    // Get owner role (using role_name instead of role_code)
    const { data: ownerRole } = await supabase
      .from('roles')
      .select('*')
      .eq('role_name', 'Owner')
      .single();
    
    if (!ownerRole) {
      return res.status(404).json({ error: 'Owner role not found' });
    }
    
    // Assign role
    const { data: assignment, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: ownerRole.id,
        assigned_at: new Date()
      })
      .select();
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: '✅ Role assigned successfully!',
      assignment
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const allowedTables = (process.env.ALLOWED_TABLES || '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

const isTableAllowed = (tableName) => {
  if (allowedTables.length === 0) return true;
  return allowedTables.includes(tableName);
};

// Generic Query Endpoint - GET
app.get('/api/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!isTableAllowed(tableName)) {
      return res.status(403).json({ success: false, error: 'Table not allowed' });
    }
    const { limit = 10, offset = 0 } = req.query;
    
    let query = supabase.from(tableName).select('*', { count: 'exact' });
    
    if (limit) query = query.limit(parseInt(limit));
    if (offset) query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      table: tableName,
      count: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Insert Data Endpoint
app.post('/api/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!isTableAllowed(tableName)) {
      return res.status(403).json({ success: false, error: 'Table not allowed' });
    }
    const result = await insertData(tableName, req.body);
    
    if (!result.success) throw new Error(result.error);
    
    res.status(201).json({
      success: true,
      message: 'Data inserted successfully',
      data: result.data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update Data Endpoint
app.put('/api/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!isTableAllowed(tableName)) {
      return res.status(403).json({ success: false, error: 'Table not allowed' });
    }
    const { filter, data } = req.body;
    
    if (!filter || !data) {
      return res.status(400).json({
        success: false,
        error: 'Both filter and data are required'
      });
    }
    
    const result = await updateData(tableName, filter, data);
    
    if (!result.success) throw new Error(result.error);
    
    res.json({
      success: true,
      message: 'Data updated successfully',
      data: result.data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Delete Data Endpoint
app.delete('/api/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    if (!isTableAllowed(tableName)) {
      return res.status(403).json({ success: false, error: 'Table not allowed' });
    }
    const { filter } = req.body;
    
    if (!filter) {
      return res.status(400).json({
        success: false,
        error: 'Filter is required'
      });
    }
    
    const result = await deleteData(tableName, filter);
    
    if (!result.success) throw new Error(result.error);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📦 SERVE REACT APP (Frontend Integration)
// ═══════════════════════════════════════════════════════════════
const reactBuildPath = path.join(__dirname, '../botmantra-ui/build');

// Serve static files from React build
app.use(express.static(reactBuildPath));

// 404 Handler for API routes only (must come before catch-all)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'API route not found',
      path: req.path,
      method: req.method
    });
  }
  next();
});

// Serve React app for all non-API routes (must be last)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(reactBuildPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error serving React app:', err);
      res.status(404).json({ 
        error: 'Frontend not built',
        message: 'Run: cd ../botmantra-ui && npm run build'
      });
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🚀 Backend Server Running`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📌 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 DB Status: http://localhost:${PORT}/api/db-status`);  console.log(`${'═'.repeat(50)}`);
  console.log(`🎯 MAIN API #1: BotMantra AI Framework (No Auth)`);
  console.log(`   POST /api/botmantra-ai/chat - UI Building from data`);
  console.log(`   POST /api/botmantra-ai/validate-ui - Validate UI config`);
  console.log(`   POST /api/botmantra-ai/save-ui - Save UI framework`);
  console.log(`   GET  /api/botmantra-ai/tables - Get available tables`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`🔐 MAIN API #2: NodeCore Chat (Auth Required)`);
  console.log(`   POST /api/nodecore-chat/chat - RAG-powered chat`);
  console.log(`   POST /api/nodecore-chat/load - Load from node core`);
  console.log(`   POST /api/nodecore-chat/create - Create in node core`);
  console.log(`   POST /api/nodecore-chat/suggest - AI data suggestions`);
  console.log(`   GET  /api/nodecore-chat/my-nodes - Get user nodes`);
  console.log(`   POST /api/nodecore-chat/get-ai-key - Get AI key`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`🎨 MAIN API #3: UI Tools API (Auth Required)`);
  console.log(`   POST /api/ui-tools/generate - Generate UI from AI`);
  console.log(`   POST /api/ui-tools/adjust - Adjust UI configuration`);
  console.log(`   POST /api/ui-tools/archive - Archive UI (soft delete)`);
  console.log(`   DELETE /api/ui-tools/delete - Delete UI (Admin only)`);
  console.log(`   POST /api/ui-tools/table/add - Add table (Admin only)`);
  console.log(`   POST /api/ui-tools/chat - AI Chat with memory`);
  console.log(`   GET  /api/ui-tools/dashboard - Load dashboard`);
  console.log(`   POST /api/ui-tools/execute - Execute tool function`);
  console.log(`   GET  /api/ui-tools/tools - List all tools`);
  console.log(`${'═'.repeat(50)}`);  console.log(`� Kernel Engine: http://localhost:${PORT}/api/kernel/*`);
  console.log(`�📊 API: GET /api/table/:tableName`);
  console.log(`➕ POST /api/table/:tableName (insert)`);
  console.log(`✏️  PUT /api/table/:tableName (update)`);
  console.log(`🗑️  DELETE /api/table/:tableName (delete)`);
  console.log(`${'═'.repeat(50)}\n`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error.message);
  console.error(error.stack);
  // Log but don't exit - server can continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
  // Log but don't exit - server can continue
});

// Initialize revenue payout cron job (auto-starts if enabled)
try {
  require('./jobs/revenue-payout-cron');
} catch (error) {
  console.error('⚠️  Failed to initialize revenue cron:', error.message);
  // Don't exit - server can continue without cron
}

module.exports = app;
