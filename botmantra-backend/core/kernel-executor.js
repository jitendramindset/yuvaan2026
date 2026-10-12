/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KERNEL EXECUTOR — Neural OS Brain                          ║
 * ║  THE MASTER EXECUTION PIPELINE                              ║
 * ║  Every action flows through node_runtime_execute()          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * AUTHENTICATION FLOW:
 *   auth-api.js /login
 *     → Validates credentials
 *     → Returns token + node_core data (nid_hash, root_node_id, node_code)
 *       ↓
 *   kernel-v2-api.js /execute
 *     → STEP 1: JWT Validation (extract userId from token)
 *     → STEP 2: Load node_core data by owner_id/nid_hash
 *       ↓
 *   kernel-executor.js execute()
 *     → Load user node from node_core by owner_id
 *     → CHECK VECTOR NODE (memory_blob + vec_embedding in node_core)
 *     → If not present or corrupted, CREATE vector node
 *     → Continue all checks BASED ON VECTOR NODE
 *
 * Pipeline (18 steps):
 *   1.  Validate Session (JWT from token)
 *   2.  Load User Node (from node_core by owner_id)
 *   2A. Check/Validate Vector Node (memory_blob, vec_embedding in node_core)
 *   2B. Create Vector Node if missing (assign to node_core)
 *   2C. Admin AI Tools Initialization (with audit trail)
 *   3.  Identify Target Brand (from nid_hash + DNA scope)
 *   4.  Trust Assessment (cached via nid_hash)
 *   5.  Risk Prediction (behavioral anomaly check)
 *   6.  Resolve Permission Rule (cached via nid_hash)
 *   7.  Run Karma Check (from node_core karma_score)
 *   8.  Run Dharma Validation (ethical checks)
 *   9.  Rate Limit Check (by owner_id + action_type)
 *  10.  Resolve Target Node (if applicable)
 *  11.  Execute Action (via ActionExecutors)
 *  12.  Update Vector State (store in memory_blob + vec_embedding)
 *  13.  Update Karma + Trust Events (update node_core)
 *  14.  Log Event (node_execution_log)
 *  15.  Sync Nearest Nodes (gossip network)
 *  16.  Prompt Evolution Check (update system_prompt)
 *  17.  Build UI Response (JSON)
 *  18.  Return (Success or Error Response)
 *
 * Key Node References:
 *   - owner_id: UUID from users table
 *   - nid_hash: SHA256(owner_id) — unique node identifier
 *   - vector data: memory_blob (bytea) + vec_embedding (pgvector)
 *   - node_core: Row in node_core table for all data
 *
 * Integrations:
 *   nodeCore.js         → initializeUserNode, vector lifecycle
 *   nodeFactory.js      → createLiveNode, createNonLiveNode
 *   admin-ai-tools.js   → Admin actions + node auditing
 *   vector-manager.js   → Vector embedding generation
 *   trust-engine.js     → Multi-factor trust scoring
 *
 * Extended Systems:
 *   B) LayoutEvolution — Autonomous UI redesign
 *   C) NodeGraph — Graph visualizer
 *   D) GossipNetwork — Distributed node gossip
 */

const { decodeFromBlob } = require('./node-schema');
const { PermissionEngine } = require('./permission-engine');
const { KarmaEngine } = require('./karma-engine');
const { DharmaValidator } = require('./dharma-validator');

const { NodeSync, MultiDeviceSync } = require('./node-sync');
const { PromptEvolution } = require('./prompt-evolution');
const { VectorManager } = require('./vector-manager');
const { TrustEngine } = require('./trust-engine');
const { RiskPredictor } = require('./risk-predictor');
const { LayoutEvolution } = require('./layout-evolution');
const { NodeGraph } = require('./node-graph');
const { GossipNetwork } = require('./gossip-network');
const { NodeCache } = require('./node-cache');
const NodeFactory = require('./nodeFactory');
const NodeCoreManager = require('./nodeCore');
const NodeDiscovery = require('./node-discovery');
const { AdminToolExecutor } = require('./admin-ai-tools');

// ─── RATE LIMITER (in-memory, no Redis dependency) ───────────
class RateLimiter {
  constructor() {
    this.hits = new Map(); // key → { count, windowStart }
    this.limits = {
      default:    { max: 60,  windowMs: 60_000 },
      chat:       { max: 30,  windowMs: 60_000 },
      data_write: { max: 20,  windowMs: 60_000 },
      admin:      { max: 10,  windowMs: 60_000 },
      create_node:{ max: 10,  windowMs: 60_000 },
      delete_node:{ max: 5,   windowMs: 60_000 }
    };
  }

  check(userId, actionType) {
    const limit = this.limits[actionType] || this.limits.default;
    const key = `${userId}:${actionType}`;
    const now = Date.now();

    let entry = this.hits.get(key);
    if (!entry || (now - entry.windowStart) > limit.windowMs) {
      entry = { count: 0, windowStart: now };
    }

    entry.count++;
    this.hits.set(key, entry);

    if (entry.count > limit.max) {
      return {
        allowed: false,
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded: ${entry.count}/${limit.max} in ${limit.windowMs / 1000}s`,
        retry_after_ms: limit.windowMs - (now - entry.windowStart)
      };
    }

    return { allowed: true, remaining: limit.max - entry.count };
  }

  // Cleanup old entries every 5 minutes
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.hits) {
        if ((now - entry.windowStart) > 120_000) this.hits.delete(key);
      }
    }, 300_000);
  }
}

// ═════════════════════════════════════════════════════════════
// ACTION EXECUTORS — the actual work for each action type
// ═════════════════════════════════════════════════════════════
class ActionExecutors {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  async execute(actionType, userNode, payload, context) {
    switch (actionType) {
      case 'chat':
        return this._chat(userNode, payload, context);
      case 'ui_bootstrap':
      case 'post_login':
      case 'post_login_bootstrap':
        return this._uiBootstrap(userNode, payload, context);
      case 'ui':
        return this._uiAction(userNode, payload, context);
      case 'data':
      case 'data_read':
        return this._dataRead(userNode, payload, context);
      case 'data_write':
      case 'form_submit':
        return this._dataWrite(userNode, payload, context);
      case 'data_delete':
        return this._dataDelete(userNode, payload, context);
      case 'create_node':
        return this._createNode(userNode, payload, context);
      case 'delete_node':
        return this._deleteNode(userNode, payload, context);
      case 'switch_brand':
        return this._switchBrand(userNode, payload, context);
      case 'automation':
        return this._automation(userNode, payload, context);
      case 'admin':
      case 'admin_execute':
      case 'admin_bootstrap':
        return this._adminAction(userNode, payload, context);
      case 'create_action_request':
        return this._createActionRequest(userNode, payload, context);
      case 'query_action_requests':
        return this._queryActionRequests(userNode, payload, context);
      case 'update_action_request':
        return this._updateActionRequest(userNode, payload, context);
      case 'create_action_whitelist':
        return this._createActionWhitelist(userNode, payload, context);
      case 'query_action_whitelist':
        return this._queryActionWhitelist(userNode, payload, context);
      case 'update_action_whitelist':
        return this._updateActionWhitelist(userNode, payload, context);
      case 'check_action_whitelist':
        return this._checkActionWhitelist(userNode, payload, context);
      case 'create_agent_rule':
        return this._createAgentRule(userNode, payload, context);
      case 'query_agent_rules':
        return this._queryAgentRules(userNode, payload, context);
      case 'update_agent_rule':
        return this._updateAgentRule(userNode, payload, context);
      case 'evaluate_agent_rules':
        return this._evaluateAgentRules(userNode, payload, context);
      case 'create_agent_template':
        return this._createAgentTemplate(userNode, payload, context);
      case 'query_agent_templates':
        return this._queryAgentTemplates(userNode, payload, context);
      case 'find_nearest_nodes':
        return this._findNearestNodes(userNode, payload, context);
      case 'select_best_node':
        return this._selectBestNode(userNode, payload, context);
      case 'sync_geographic':
        return this._syncGeographic(userNode, payload, context);
      case 'clone_agent_template':
        return this._cloneAgentTemplate(userNode, payload, context);
      case 'instantiate_agent_template':
        return this._instantiateAgentTemplate(userNode, payload, context);
      case 'create_app_request':
        return this._createAppRequest(userNode, payload, context);
      case 'query_app_requests':
        return this._queryAppRequests(userNode, payload, context);
      case 'update_app_request':
        return this._updateAppRequest(userNode, payload, context);
      case 'update_app_request_status':
        return this._updateAppRequestStatus(userNode, payload, context);
      case 'add_app_request_feedback':
        return this._addAppRequestFeedback(userNode, payload, context);
      case 'create_chat_message':
        return this._createChatMessage(userNode, payload, context);
      case 'query_chat_messages':
        return this._queryChatMessages(userNode, payload, context);
      case 'update_chat_message':
        return this._updateChatMessage(userNode, payload, context);
      case 'delete_chat_message':
        return this._deleteChatMessage(userNode, payload, context);
      case 'get_conversation_history':
        return this._getConversationHistory(userNode, payload, context);
      case 'create_chat_session':
        return this._createChatSession(userNode, payload, context);
      case 'query_chat_sessions':
        return this._queryChatSessions(userNode, payload, context);
      case 'update_chat_session':
        return this._updateChatSession(userNode, payload, context);
      case 'update_chat_session_active':
        return this._updateChatSessionActive(userNode, payload, context);
      case 'delete_chat_session':
        return this._deleteChatSession(userNode, payload, context);
      case 'get_user_sessions':
        return this._getUserSessions(userNode, payload, context);
      case 'create_dashboard_request':
        return this._createDashboardRequest(userNode, payload, context);
      case 'query_dashboard_requests':
        return this._queryDashboardRequests(userNode, payload, context);
      case 'update_dashboard_request':
        return this._updateDashboardRequest(userNode, payload, context);
      case 'update_dashboard_request_status':
        return this._updateDashboardRequestStatus(userNode, payload, context);
      case 'process_dashboard_request':
        return this._processDashboardRequest(userNode, payload, context);
      case 'delete_dashboard_request':
        return this._deleteDashboardRequest(userNode, payload, context);
      case 'get_user_dashboard_requests':
        return this._getUserDashboardRequests(userNode, payload, context);
      case 'create_generated_template':
        return this._createGeneratedTemplate(userNode, payload, context);
      case 'query_generated_templates':
        return this._queryGeneratedTemplates(userNode, payload, context);
      case 'update_generated_template':
        return this._updateGeneratedTemplate(userNode, payload, context);
      case 'increment_template_usage':
        return this._incrementTemplateUsage(userNode, payload, context);
      case 'rate_template':
        return this._rateTemplate(userNode, payload, context);
      case 'delete_generated_template':
        return this._deleteGeneratedTemplate(userNode, payload, context);
      case 'get_templates_by_request':
        return this._getTemplatesByRequest(userNode, payload, context);
      case 'get_popular_templates':
        return this._getPopularTemplates(userNode, payload, context);
      case 'get_template_stats':
        return this._getTemplateStats(userNode, payload, context);
      case 'clone_template':
        return this._cloneTemplate(userNode, payload, context);
      case 'create_knowledge_entry':
        return this._createKnowledgeEntry(userNode, payload, context);
      case 'query_knowledge_entries':
        return this._queryKnowledgeEntries(userNode, payload, context);
      case 'update_knowledge_entry':
        return this._updateKnowledgeEntry(userNode, payload, context);
      case 'increment_knowledge_access':
        return this._incrementKnowledgeAccess(userNode, payload, context);
      case 'search_knowledge_similarity':
        return this._searchKnowledgeSimilarity(userNode, payload, context);
      case 'search_knowledge_text':
        return this._searchKnowledgeText(userNode, payload, context);
      case 'get_knowledge_by_document':
        return this._getKnowledgeByDocument(userNode, payload, context);
      case 'get_knowledge_by_business':
        return this._getKnowledgeByBusiness(userNode, payload, context);
      case 'delete_knowledge_entry':
        return this._deleteKnowledgeEntry(userNode, payload, context);
      case 'get_knowledge_stats':
        return this._getKnowledgeStats(userNode, payload, context);
      case 'clone_knowledge_entry':
        return this._cloneKnowledgeEntry(userNode, payload, context);
      case 'batch_create_knowledge':
        return this._batchCreateKnowledge(userNode, payload, context);
      case 'create_model_router':
        return this._createModelRouter(userNode, payload, context);
      case 'query_model_routers':
        return this._queryModelRouters(userNode, payload, context);
      case 'update_model_router':
        return this._updateModelRouter(userNode, payload, context);
      case 'route_ai_request':
        return this._routeAiRequest(userNode, payload, context);
      case 'handle_routing_failure':
        return this._handleRoutingFailure(userNode, payload, context);
      case 'get_router_stats':
        return this._getRouterStats(userNode, payload, context);
      case 'test_model_router':
        return this._testModelRouter(userNode, payload, context);
      case 'clone_model_router':
        return this._cloneModelRouter(userNode, payload, context);
      case 'delete_model_router':
        return this._deleteModelRouter(userNode, payload, context);
      case 'create_semantic_cache':
        return this._createSemanticCache(userNode, payload, context);
      case 'query_semantic_cache':
        return this._querySemanticCache(userNode, payload, context);
      case 'find_similar_cache':
        return this._findSimilarCache(userNode, payload, context);
      case 'update_semantic_cache':
        return this._updateSemanticCache(userNode, payload, context);
      case 'increment_cache_hit':
        return this._incrementCacheHit(userNode, payload, context);
      case 'get_cache_stats':
        return this._getCacheStats(userNode, payload, context);
      case 'cleanup_semantic_cache':
        return this._cleanupSemanticCache(userNode, payload, context);
      case 'delete_semantic_cache':
        return this._deleteSemanticCache(userNode, payload, context);
      case 'batch_create_cache':
        return this._batchCreateCache(userNode, payload, context);
      case 'create_plugin':
        return this._createPlugin(userNode, payload, context);
      case 'query_plugins':
        return this._queryPlugins(userNode, payload, context);
      case 'update_plugin':
        return this._updatePlugin(userNode, payload, context);
      case 'execute_plugin':
        return this._executePlugin(userNode, payload, context);
      case 'get_plugin_stats':
        return this._getPluginStats(userNode, payload, context);
      case 'clone_plugin':
        return this._clonePlugin(userNode, payload, context);
      case 'delete_plugin':
        return this._deletePlugin(userNode, payload, context);
      case 'create_session_memory':
        return this._createSessionMemory(userNode, payload, context);
      case 'query_session_memories':
        return this._querySessionMemories(userNode, payload, context);
      case 'update_session_memory':
        return this._updateSessionMemory(userNode, payload, context);
      case 'extend_session_expiration':
        return this._extendSessionExpiration(userNode, payload, context);
      case 'get_session_stats':
        return this._getSessionStats(userNode, payload, context);
      case 'cleanup_expired_sessions':
        return this._cleanupExpiredSessions(userNode, payload, context);
      case 'archive_old_sessions':
        return this._archiveOldSessions(userNode, payload, context);
      case 'merge_session_contexts':
        return this._mergeSessionContexts(userNode, payload, context);
      case 'delete_session_memory':
        return this._deleteSessionMemory(userNode, payload, context);
      case 'batch_create_session_memories':
        return this._batchCreateSessionMemories(userNode, payload, context);
      case 'create_preferences':
        return this._createPreferences(userNode, payload, context);
      case 'query_preferences':
        return this._queryPreferences(userNode, payload, context);
      case 'update_preferences':
        return this._updatePreferences(userNode, payload, context);
      case 'update_user_preferences':
        return this._updateUserPreferences(userNode, payload, context);
      case 'get_preference_value':
        return this._getPreferenceValue(userNode, payload, context);
      case 'set_preference_value':
        return this._setPreferenceValue(userNode, payload, context);
      case 'get_preferences_stats':
        return this._getPreferencesStats(userNode, payload, context);
      case 'export_user_preferences':
        return this._exportUserPreferences(userNode, payload, context);
      case 'import_user_preferences':
        return this._importUserPreferences(userNode, payload, context);
      case 'delete_preferences':
        return this._deletePreferences(userNode, payload, context);
      case 'batch_update_preferences':
        return this._batchUpdatePreferences(userNode, payload, context);
      case 'create_voice_log':
        return this._createVoiceLog(userNode, payload, context);
      case 'query_voice_logs':
        return this._queryVoiceLogs(userNode, payload, context);
      case 'update_voice_log':
        return this._updateVoiceLog(userNode, payload, context);
      case 'search_voice_logs':
        return this._searchVoiceLogs(userNode, payload, context);
      case 'get_voice_analytics':
        return this._getVoiceAnalytics(userNode, payload, context);
      case 'delete_voice_log':
        return this._deleteVoiceLog(userNode, payload, context);
      case 'batch_create_voice_logs':
        return this._batchCreateVoiceLogs(userNode, payload, context);
      case 'create_summary_cache':
        return this._createSummaryCache(userNode, payload, context);
      case 'query_summary_caches':
        return this._querySummaryCaches(userNode, payload, context);
      case 'update_summary_cache':
        return this._updateSummaryCache(userNode, payload, context);
      case 'increment_cache_usage':
        return this._incrementCacheUsage(userNode, payload, context);
      case 'get_summary_cache_stats':
        return this._getSummaryCacheStats(userNode, payload, context);
      case 'cleanup_summary_cache':
        return this._cleanupSummaryCache(userNode, payload, context);
      case 'delete_summary_cache':
        return this._deleteSummaryCache(userNode, payload, context);
      case 'batch_create_summary_caches':
        return this._batchCreateSummaryCaches(userNode, payload, context);
      case 'create_api_key':
        return this._createApiKey(userNode, payload, context);
      case 'query_api_keys':
        return this._queryApiKeys(userNode, payload, context);
      case 'validate_api_key':
        return this._validateApiKey(userNode, payload, context);
      case 'update_api_key':
        return this._updateApiKey(userNode, payload, context);
      case 'revoke_api_key':
        return this._revokeApiKey(userNode, payload, context);
      case 'get_api_key_stats':
        return this._getApiKeyStats(userNode, payload, context);
      case 'create_api_log':
        return this._createApiLog(userNode, payload, context);
      case 'query_api_logs':
        return this._queryApiLogs(userNode, payload, context);
      case 'get_api_logs_by_endpoint':
        return this._getApiLogsByEndpoint(userNode, payload, context);
      case 'get_api_logs_by_user':
        return this._getApiLogsByUser(userNode, payload, context);
      case 'get_api_usage_stats':
        return this._getApiUsageStats(userNode, payload, context);
      case 'cleanup_api_logs':
        return this._cleanupApiLogs(userNode, payload, context);
      case 'check_rate_limit':
        return this._checkRateLimit(userNode, payload, context);
      case 'update_rate_limit':
        return this._updateRateLimit(userNode, payload, context);
      case 'reset_rate_limit':
        return this._resetRateLimit(userNode, payload, context);
      case 'get_rate_limit_stats':
        return this._getRateLimitStats(userNode, payload, context);
      case 'cleanup_rate_limits':
        return this._cleanupRateLimits(userNode, payload, context);
      case 'create_api_route':
        return this._createApiRoute(userNode, payload, context);
      case 'query_api_routes':
        return this._queryApiRoutes(userNode, payload, context);
      case 'update_api_route':
        return this._updateApiRoute(userNode, payload, context);
      case 'check_route_permissions':
        return this._checkRoutePermissions(userNode, payload, context);
      case 'deactivate_api_route':
        return this._deactivateApiRoute(userNode, payload, context);
      case 'get_routes_by_permissions':
        return this._getRoutesByPermissions(userNode, payload, context);
      case 'get_api_route_stats':
        return this._getApiRouteStats(userNode, payload, context);
    }
  }

  async _chat(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const result = {
        success: true,
        action: 'chat',
        system_prompt: context.system_prompt,
        user_message: payload.message,
        brand: context.brand,
        karma_level: context.karma_level
      };

      // Log AI action to ai_action_logs (non-critical — swallow any error)
      try { await this._logActionLog('chat', userNode, payload, result, startTime); } catch {}

      return result;
    } catch (error) {
      try { await this._logActionLog('chat', userNode, payload, null, startTime, error.message); } catch {}
      throw error;
    }
  }

  async _logActionLog(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    const logData = {
      user_id: userNode.owner_id,
      node_code: payload.node_code || userNode.nid_hash,
      action_type: payload.action_type || payload.action || operation,
      input_payload: payload,
      status: error ? 'failed' : 'success',
      error_message: error,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      operation,
      created_at: new Date().toISOString()
    };
    await this.db.from('ai_action_logs').insert(logData);
  }

  async _uiBootstrap(userNode, payload, context) {
    const ownerId = payload.business_id || userNode.owner_id;
    const brand = context.brand || payload.brand || 'BOTMANTRA';

    // 1. Try a stored (user-customized) layout + widgets first.
    const { data: layout } = await this.db
      .from('dashboard_layouts')
      .select('*')
      .eq('business_id', ownerId)
      .eq('brand', brand)
      .limit(1)
      .single()
      .then(r => r, () => ({ data: null }));

    const { data: widgets } = await this.db
      .from('dashboard_widgets')
      .select('*')
      .eq('business_id', ownerId)
      .eq('brand', brand)
      .limit(50)
      .then(r => r, () => ({ data: null }));

    // 2. Fall back to the brand's default dashboard when nothing is stored.
    const brandDash = this._getBrandDashboard(brand, ownerId);
    const finalLayout = layout || brandDash.layout;
    let finalWidgets = (widgets && widgets.length > 0) ? widgets : brandDash.widgets;

    // 3. Always append the floating chat controller.
    finalWidgets = [...finalWidgets, {
      id: 'chat_button_widget',
      business_id: ownerId,
      brand,
      widget_type: 'floating_chat',
      widget_config: {
        buttonText: 'Chat with AI',
        position: 'bottom-right',
        icon: 'message-circle',
        defaultMessage: `Hello! I'm your ${brandDash.displayName} assistant. How can I help?`
      },
      position: { x: 0, y: 99, width: 3, height: 1 }
    }];

    return {
      success: true,
      action: 'ui_bootstrap',
      result: {
        layout: finalLayout,
        widgets: finalWidgets,
        brand,
        theme: brand,
        hostName: 'localhost',
        hostType: 'development'
      }
    };
  }

  /**
   * Brand-specific default dashboards.
   * Each brand renders a distinct set of widgets (hero, how-it-helps,
   * core screens, kernel functions) so no brand dashboard is ever blank.
   */
  _getBrandDashboard(brand, ownerId) {
    const key = String(brand || 'BOTMANTRA').toUpperCase();

    const BRANDS = {
      BOTMANTRA: {
        displayName: 'BotMantra',
        color: '#6366f1',
        tagline: 'AI automation studio for building assistants, workflows, and dashboards.',
        mission: 'Make AI usable by everyone — not just developers.',
        vision: 'Become the operating system for AI-powered companies.',
        helps: ['AI chat assistants', 'Automated workflows', 'Dashboard generation', 'Multi-channel bots'],
        screens: ['AI Chat Studio', 'Workflow Builder', 'Dashboard Builder', 'Template Marketplace'],
        functions: ['run_rag_engine', 'build_ai_prompt', 'create_widgets_from_ai', 'execute_plugin']
      },
      MANTRAVAT: {
        displayName: 'MantraVat',
        color: '#0ea5e9',
        tagline: 'Business command center for governance, billing, and compliance.',
        mission: 'Give businesses full control over their AI-powered infrastructure.',
        vision: 'Build the world’s most secure AI governance platform.',
        helps: ['User & role control', 'Billing & plans', 'Security & compliance', 'Audit logs'],
        screens: ['Admin Dashboard', 'User Manager', 'Permissions Panel', 'Billing Panel'],
        functions: ['check_feature_access', 'check_usage_limit', 'resolve_active_template', 'get_branding']
      },
      JEETMANTRA: {
        displayName: 'JeetMantra',
        color: '#22c55e',
        tagline: 'AI education platform for students, teachers, and institutes.',
        mission: 'Make quality education accessible with AI.',
        vision: 'Build the smartest AI classroom ecosystem.',
        helps: ['AI tutor chat', 'Test generation', 'Progress tracking', 'Course management'],
        screens: ['Student Dashboard', 'AI Tutor', 'Exam Panel', 'Progress Tracker'],
        functions: ['run_rag_engine', 'search_knowledge', 'load_user_memory', 'save_user_memory']
      },
      JUNER: {
        displayName: 'JuniorMantra',
        color: '#f59e0b',
        tagline: 'Kid-friendly learning & play platform with safe AI experiences.',
        mission: 'Make learning fun and safe.',
        vision: 'Build the best AI-powered kids ecosystem.',
        helps: ['Learning games', 'AI storytelling', 'Drawing tools', 'Parental controls'],
        screens: ['Kids Home', 'Story AI', 'Parent Panel', 'Progress Report'],
        functions: ['resolve_template_context', 'load_dynamic_template_ui', 'check_feature_access']
      },
      VANSHAWALI: {
        displayName: 'Vanshawali',
        color: '#a855f7',
        tagline: 'Digital family graph and trust platform for lineage, heritage, and relationships.',
        mission: 'Preserve and connect family history with trusted relationships.',
        vision: 'Create the world’s most trusted digital family lineage network.',
        helps: ['Family lineage graph', 'Ancestry records', 'Trust verification', 'Shared heritage'],
        screens: ['Family Tree', 'Lineage Profile', 'Trusted Connections', 'Heritage Vault'],
        functions: ['resolve_active_template', 'load_dynamic_template_ui', 'check_action_permission', 'get_ui_context']
      }
    };

    // Accept aliases (e.g. "juniormantra", "vanshawali" lowercase)
    const aliasMap = { JUNIORMANTRA: 'JUNER', JUNIOR: 'JUNER', BOT: 'BOTMANTRA' };
    const b = BRANDS[key] || BRANDS[aliasMap[key]] || BRANDS.BOTMANTRA;
    const resolvedBrand = BRANDS[key] ? key : (aliasMap[key] || 'BOTMANTRA');

    const widgets = [
      {
        id: 'brand_hero',
        business_id: ownerId,
        brand: resolvedBrand,
        widget_type: 'hero',
        widget_config: {
          title: b.displayName,
          tagline: b.tagline,
          mission: b.mission,
          vision: b.vision,
          color: b.color
        },
        position: { x: 0, y: 0, width: 3, height: 1 }
      },
      {
        id: 'brand_helps',
        business_id: ownerId,
        brand: resolvedBrand,
        widget_type: 'feature_list',
        widget_config: { title: 'How it helps', items: b.helps, color: b.color, icon: '✨' },
        position: { x: 0, y: 1, width: 1, height: 1 }
      },
      {
        id: 'brand_screens',
        business_id: ownerId,
        brand: resolvedBrand,
        widget_type: 'screen_grid',
        widget_config: { title: 'Core screens', screens: b.screens, color: b.color },
        position: { x: 1, y: 1, width: 1, height: 1 }
      },
      {
        id: 'brand_functions',
        business_id: ownerId,
        brand: resolvedBrand,
        widget_type: 'feature_list',
        widget_config: { title: 'Kernel functions', items: b.functions, color: b.color, icon: '⚙️', mono: true },
        position: { x: 2, y: 1, width: 1, height: 1 }
      }
    ];

    return {
      displayName: b.displayName,
      layout: {
        id: `${resolvedBrand.toLowerCase()}_default_layout`,
        name: `${b.displayName} Dashboard`,
        business_id: ownerId,
        brand: resolvedBrand,
        layout_config: { type: 'grid', columns: 3, rows: 2 }
      },
      widgets
    };
  }

  async _uiAction(userNode, payload, context) {
    return {
      success: true,
      action: 'ui',
      component: payload.component,
      operation: payload.operation,
      result: payload,
      hostName: 'localhost',
      hostType: 'development'
    };
  }

  async _dataRead(userNode, payload, context) {
    const table = payload.table || payload.source;
    if (!table) return { success: false, error: 'No table/source specified' };

    const { data, error } = await this.db
      .from(table)
      .select(payload.select || '*')
      .limit(payload.limit || 50);

    if (error) return { success: false, error: error.message };
    return { success: true, action: 'data_read', data, count: data?.length || 0 };
  }

  async _dataWrite(userNode, payload, context) {
    const table = payload.table;
    if (!table || !payload.data) return { success: false, error: 'table and data required' };

    const { data, error } = await this.db
      .from(table)
      .insert(payload.data)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, action: 'data_write', created: true, data };
  }

  async _dataDelete(userNode, payload, context) {
    const table = payload.table;
    if (!table || !payload.id) return { success: false, error: 'table and id required' };

    const { error } = await this.db
      .from(table)
      .delete()
      .eq('id', payload.id);

    if (error) return { success: false, error: error.message };
    return { success: true, action: 'data_delete', deleted: true };
  }

  async _createNode(userNode, payload, context) {
    const node = await this.nodeFactory.createNonLiveNode(
      payload.node_type,
      userNode.owner_id,
      payload.metadata,
      { brand_scope: context.brand, parent_nid_hash: payload.parent_nid_hash }
    );

    return { success: true, action: 'create_node', created: true, node: {
      row_id: node.row_id,
      nid_hash: node.nid_hash,
      node_type: node.node_type,
      node_state: node.node_state,
      created_at: node.created_at
    }};
  }

  async _deleteNode(userNode, payload, context) {
    await this.nodeFactory.updateNode(payload.target_nid_hash, {
      is_archived: true,
      archived_at: new Date().toISOString(),
      node_state: 'ARCHIVED'
    }, userNode.owner_id);

    return { success: true, action: 'delete_node', archived: true };
  }

  async _switchBrand(userNode, payload, context) {
    return {
      success: true,
      action: 'switch_brand',
      previous_brand: context.brand,
      new_brand: payload.target_brand
    };
  }

  async _automation(userNode, payload, context) {
    return {
      success: true,
      action: 'automation',
      workflow: payload.workflow,
      result: 'queued'
    };
  }

  async _adminAction(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const result = {
        success: true,
        action: 'admin',
        operation: payload.operation || 'admin_generic',
        result: payload
      };

      // Log admin AI action
      await this._logActionLog('admin', userNode, payload, result, startTime);

      return result;
    } catch (error) {
      // Log failed admin action
      await this._logActionLog('admin', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _createActionRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIActionRequestsNode = require('../core/ai-action-requests');

      const requestData = {
        action_type: payload.action_type,
        target_table: payload.target_table,
        input_payload: payload.input_payload,
        status: payload.status || 'pending',
        error_message: payload.error_message,
        executed_at: payload.executed_at,
        business_id: payload.business_id || userNode.owner_id
      };

      const node = await AIActionRequestsNode.createActionRequestNode(
        payload.node_code || userNode.nid_hash,
        requestData
      );

      // Log to ai_action_requests table
      await this._logActionRequest('create', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'create_action_request',
        created: true,
        node: node
      };
    } catch (error) {
      // Log failed action request
      await this._logActionRequest('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_action_request',
        error: error.message
      };
    }
  }

  async _queryActionRequests(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIActionRequestsNode = require('../core/ai-action-requests');

      const filters = {
        node_code: payload.node_code || userNode.nid_hash
      };

      if (payload.action_type) filters.action_type = payload.action_type;
      if (payload.status) filters.status = payload.status;
      if (payload.business_id) filters.business_id = payload.business_id;

      const nodes = await AIActionRequestsNode.queryActionRequestNodes(filters);

      // Log query operation
      await this._logActionRequest('query', userNode, payload, { count: nodes.length }, startTime);

      return {
        success: true,
        action: 'query_action_requests',
        data: nodes,
        count: nodes.length
      };
    } catch (error) {
      // Log failed query
      await this._logActionRequest('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_action_requests',
        error: error.message
      };
    }
  }

  async _updateActionRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIActionRequestsNode = require('../core/ai-action-requests');

      const updates = {};
      if (payload.status !== undefined) updates['metadata.status'] = payload.status;
      if (payload.error_message !== undefined) updates['metadata.error_message'] = payload.error_message;
      if (payload.executed_at !== undefined) updates['metadata.executed_at'] = payload.executed_at;

      const node = await AIActionRequestsNode.updateActionRequestNode(
        payload.node_code || userNode.nid_hash,
        updates
      );

      // Log update operation
      await this._logActionRequest('update', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'update_action_request',
        updated: true,
        node: node
      };
    } catch (error) {
      // Log failed update
      await this._logActionRequest('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_action_request',
        error: error.message
      };
    }
  }

  async _createActionWhitelist(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIActionWhitelistNode = require('../core/ai-action-whitelist');

      const whitelistData = {
        table_name: payload.table_name,
        allowed_actions: payload.allowed_actions,
        description: payload.description,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        business_id: payload.business_id || userNode.owner_id
      };

      const node = await AIActionWhitelistNode.createActionWhitelistNode(
        payload.node_code || userNode.nid_hash,
        whitelistData
      );

      // Log to ai_action_whitelist table
      await this._logActionWhitelist('create', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'create_action_whitelist',
        created: true,
        node: node
      };
    } catch (error) {
      // Log failed whitelist creation
      await this._logActionWhitelist('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_action_whitelist',
        error: error.message
      };
    }
  }

  async _queryActionWhitelist(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIActionWhitelistNode = require('../core/ai-action-whitelist');

      const filters = {
        node_code: payload.node_code || userNode.nid_hash
      };

      if (payload.table_name) filters.table_name = payload.table_name;
      if (payload.is_active !== undefined) filters.is_active = payload.is_active;
      if (payload.business_id) filters.business_id = payload.business_id;

      const nodes = await AIActionWhitelistNode.queryActionWhitelistNodes(filters);

      // Log query operation
      await this._logActionWhitelist('query', userNode, payload, { count: nodes.length }, startTime);

      return {
        success: true,
        action: 'query_action_whitelist',
        data: nodes,
        count: nodes.length
      };
    } catch (error) {
      // Log failed query
      await this._logActionWhitelist('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_action_whitelist',
        error: error.message
      };
    }
  }

  async _updateActionWhitelist(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIActionWhitelistNode = require('../core/ai-action-whitelist');

      const updates = {};
      if (payload.allowed_actions !== undefined) updates['metadata.allowed_actions'] = payload.allowed_actions;
      if (payload.description !== undefined) updates['metadata.description'] = payload.description;
      if (payload.is_active !== undefined) updates['metadata.is_active'] = payload.is_active;

      const node = await AIActionWhitelistNode.updateActionWhitelistNode(
        payload.node_code || userNode.nid_hash,
        updates
      );

      // Log update operation
      await this._logActionWhitelist('update', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'update_action_whitelist',
        updated: true,
        node: node
      };
    } catch (error) {
      // Log failed update
      await this._logActionWhitelist('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_action_whitelist',
        error: error.message
      };
    }
  }

  async _checkActionWhitelist(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIActionWhitelistNode = require('../core/ai-action-whitelist');

      const isAllowed = await AIActionWhitelistNode.isActionAllowed(
        payload.table_name,
        payload.action
      );

      const result = {
        table_name: payload.table_name,
        action: payload.action,
        allowed: isAllowed
      };

      // Log check operation
      await this._logActionWhitelist('check', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'check_action_whitelist',
        data: result
      };
    } catch (error) {
      // Log failed check
      await this._logActionWhitelist('check', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'check_action_whitelist',
        error: error.message
      };
    }
  }

  async _createAgentRule(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentRulesNode = require('../core/ai-agent-rules');

      const ruleData = {
        rule_name: payload.rule_name,
        trigger_type: payload.trigger_type,
        condition_json: payload.condition_json,
        action_json: payload.action_json,
        description: payload.description,
        priority: payload.priority || 1,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        business_id: payload.business_id || userNode.owner_id
      };

      const node = await AIAgentRulesNode.createAgentRuleNode(
        payload.node_code || userNode.nid_hash,
        ruleData
      );

      // Log to ai_agent_rules table
      await this._logAgentRules('create', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'create_agent_rule',
        created: true,
        node: node
      };
    } catch (error) {
      // Log failed agent rule creation
      await this._logAgentRules('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_agent_rule',
        error: error.message
      };
    }
  }

  async _queryAgentRules(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentRulesNode = require('../core/ai-agent-rules');

      const filters = {
        node_code: payload.node_code || userNode.nid_hash
      };

      if (payload.trigger_type) filters.trigger_type = payload.trigger_type;
      if (payload.is_active !== undefined) filters.is_active = payload.is_active;
      if (payload.business_id) filters.business_id = payload.business_id;

      const nodes = await AIAgentRulesNode.queryAgentRuleNodes(filters);

      // Log query operation
      await this._logAgentRules('query', userNode, payload, { count: nodes.length }, startTime);

      return {
        success: true,
        action: 'query_agent_rules',
        data: nodes,
        count: nodes.length
      };
    } catch (error) {
      // Log failed query
      await this._logAgentRules('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_agent_rules',
        error: error.message
      };
    }
  }

  async _updateAgentRule(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentRulesNode = require('../core/ai-agent-rules');

      const updates = {};
      if (payload.condition_json !== undefined) updates['metadata.condition_json'] = payload.condition_json;
      if (payload.action_json !== undefined) updates['metadata.action_json'] = payload.action_json;
      if (payload.description !== undefined) updates['metadata.description'] = payload.description;
      if (payload.priority !== undefined) updates['metadata.priority'] = payload.priority;
      if (payload.is_active !== undefined) updates['metadata.is_active'] = payload.is_active;

      const node = await AIAgentRulesNode.updateAgentRuleNode(
        payload.node_code || userNode.nid_hash,
        updates
      );

      // Log update operation
      await this._logAgentRules('update', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'update_agent_rule',
        updated: true,
        node: node
      };
    } catch (error) {
      // Log failed update
      await this._logAgentRules('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_agent_rule',
        error: error.message
      };
    }
  }

  async _evaluateAgentRules(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentRulesNode = require('../core/ai-agent-rules');

      const matchingRules = await AIAgentRulesNode.evaluateRules(
        payload.trigger_type,
        payload.trigger_data || {}
      );

      const result = {
        trigger_type: payload.trigger_type,
        trigger_data: payload.trigger_data,
        matching_rules: matchingRules.length,
        rules: matchingRules
      };

      // Log evaluation operation
      await this._logAgentRules('evaluate', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'evaluate_agent_rules',
        data: result
      };
    } catch (error) {
      // Log failed evaluation
      await this._logAgentRules('evaluate', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'evaluate_agent_rules',
        error: error.message
      };
    }
  }

  async _createAgentTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentTemplatesNode = require('../core/ai-agent-templates');

      const templateData = {
        name: payload.name,
        description: payload.description,
        system_prompt: payload.system_prompt,
        rag_enabled: payload.rag_enabled || false,
        tools: payload.tools || [],
        model_config: payload.model_config || {},
        temperature: payload.temperature || 0.7,
        max_tokens: payload.max_tokens || 1000,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        business_id: payload.business_id || userNode.owner_id,
        tags: payload.tags || [],
        version: payload.version || '1.0.0',
        created_by: payload.created_by || userNode.owner_id
      };

      const node = await AIAgentTemplatesNode.createAgentTemplateNode(
        payload.node_code || userNode.nid_hash,
        templateData
      );

      // Log to ai_agent_templates table
      await this._logAgentTemplates('create', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'create_agent_template',
        created: true,
        node: node
      };
    } catch (error) {
      // Log failed agent template creation
      await this._logAgentTemplates('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_agent_template',
        error: error.message
      };
    }
  }

  async _queryAgentTemplates(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentTemplatesNode = require('../core/ai-agent-templates');

      const filters = {
        node_code: payload.node_code || userNode.nid_hash
      };

      if (payload.name) filters.name = payload.name;
      if (payload.rag_enabled !== undefined) filters.rag_enabled = payload.rag_enabled;
      if (payload.is_active !== undefined) filters.is_active = payload.is_active;
      if (payload.business_id) filters.business_id = payload.business_id;
      if (payload.tags && payload.tags.length > 0) filters.tags = payload.tags;

      const nodes = await AIAgentTemplatesNode.queryAgentTemplateNodes(filters);

      // Log query operation
      await this._logAgentTemplates('query', userNode, payload, { count: nodes.length }, startTime);

      return {
        success: true,
        action: 'query_agent_templates',
        data: nodes,
        count: nodes.length
      };
    } catch (error) {
      // Log failed query
      await this._logAgentTemplates('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_agent_templates',
        error: error.message
      };
    }
  }

  async _updateAgentTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentTemplatesNode = require('../core/ai-agent-templates');

      const updates = {};
      if (payload.name !== undefined) updates['metadata.name'] = payload.name;
      if (payload.description !== undefined) updates['metadata.description'] = payload.description;
      if (payload.system_prompt !== undefined) updates['metadata.system_prompt'] = payload.system_prompt;
      if (payload.rag_enabled !== undefined) updates['metadata.rag_enabled'] = payload.rag_enabled;
      if (payload.tools !== undefined) updates['metadata.tools'] = payload.tools;
      if (payload.model_config !== undefined) updates['metadata.model_config'] = payload.model_config;
      if (payload.temperature !== undefined) updates['metadata.temperature'] = payload.temperature;
      if (payload.max_tokens !== undefined) updates['metadata.max_tokens'] = payload.max_tokens;
      if (payload.is_active !== undefined) updates['metadata.is_active'] = payload.is_active;
      if (payload.version !== undefined) updates['metadata.version'] = payload.version;

      const node = await AIAgentTemplatesNode.updateAgentTemplateNode(
        payload.node_code || userNode.nid_hash,
        updates
      );

      // Log update operation
      await this._logAgentTemplates('update', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'update_agent_template',
        updated: true,
        node: node
      };
    } catch (error) {
      // Log failed update
      await this._logAgentTemplates('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_agent_template',
        error: error.message
      };
    }
  }

  async _cloneAgentTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentTemplatesNode = require('../core/ai-agent-templates');

      const clonedNode = await AIAgentTemplatesNode.cloneTemplate(
        payload.source_node_code,
        {
          node_code: payload.new_node_code,
          name: payload.name,
          description: payload.description,
          ...payload.modifications
        }
      );

      // Log clone operation
      await this._logAgentTemplates('clone', userNode, payload, clonedNode, startTime);

      return {
        success: true,
        action: 'clone_agent_template',
        cloned: true,
        node: clonedNode
      };
    } catch (error) {
      // Log failed clone
      await this._logAgentTemplates('clone', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'clone_agent_template',
        error: error.message
      };
    }
  }

  async _instantiateAgentTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAgentTemplatesNode = require('../core/ai-agent-templates');

      const liveNode = await AIAgentTemplatesNode.instantiateTemplate(
        payload.template_node_code,
        {
          node_code: payload.instance_node_code,
          instance_config: payload.instance_config || {},
          instantiated_by: userNode.owner_id
        }
      );

      // Log instantiate operation
      await this._logAgentTemplates('instantiate', userNode, payload, liveNode, startTime);

      return {
        success: true,
        action: 'instantiate_agent_template',
        instantiated: true,
        node: liveNode
      };
    } catch (error) {
      // Log failed instantiation
      await this._logAgentTemplates('instantiate', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'instantiate_agent_template',
        error: error.message
      };
    }
  }

  async _createAppRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAppRequestsNode = require('../core/ai-app-requests');

      const requestData = {
        user_id: payload.user_id || userNode.owner_id,
        business_id: payload.business_id || userNode.owner_id,
        app_name: payload.app_name,
        description: payload.description,
        status: payload.status || 'pending',
        ai_response: payload.ai_response || {},
        request_type: payload.request_type || 'general',
        priority: payload.priority || 'normal',
        estimated_completion: payload.estimated_completion,
        tags: payload.tags || [],
        attachments: payload.attachments || []
      };

      const node = await AIAppRequestsNode.createAppRequestNode(
        payload.node_code || userNode.nid_hash,
        requestData
      );

      // Log to ai_app_requests table
      await this._logAppRequests('create', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'create_app_request',
        created: true,
        node: node
      };
    } catch (error) {
      // Log failed app request creation
      await this._logAppRequests('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_app_request',
        error: error.message
      };
    }
  }

  async _queryAppRequests(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAppRequestsNode = require('../core/ai-app-requests');

      const filters = {
        node_code: payload.node_code || userNode.nid_hash
      };

      if (payload.user_id) filters.user_id = payload.user_id;
      if (payload.business_id) filters.business_id = payload.business_id;
      if (payload.app_name) filters.app_name = payload.app_name;
      if (payload.status) filters.status = payload.status;
      if (payload.request_type) filters.request_type = payload.request_type;
      if (payload.priority) filters.priority = payload.priority;
      if (payload.is_archived !== undefined) filters.is_archived = payload.is_archived;

      const nodes = await AIAppRequestsNode.queryAppRequestNodes(filters);

      // Log query operation
      await this._logAppRequests('query', userNode, payload, { count: nodes.length }, startTime);

      return {
        success: true,
        action: 'query_app_requests',
        data: nodes,
        count: nodes.length
      };
    } catch (error) {
      // Log failed query
      await this._logAppRequests('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_app_requests',
        error: error.message
      };
    }
  }

  async _updateAppRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAppRequestsNode = require('../core/ai-app-requests');

      const updates = {};
      if (payload.app_name !== undefined) updates['metadata.app_name'] = payload.app_name;
      if (payload.description !== undefined) updates['metadata.description'] = payload.description;
      if (payload.request_type !== undefined) updates['metadata.request_type'] = payload.request_type;
      if (payload.priority !== undefined) updates['metadata.priority'] = payload.priority;
      if (payload.estimated_completion !== undefined) updates['metadata.estimated_completion'] = payload.estimated_completion;
      if (payload.tags !== undefined) updates['metadata.tags'] = payload.tags;
      if (payload.attachments !== undefined) updates['metadata.attachments'] = payload.attachments;

      const node = await AIAppRequestsNode.updateAppRequestNode(
        payload.node_code || userNode.nid_hash,
        updates
      );

      // Log update operation
      await this._logAppRequests('update', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'update_app_request',
        updated: true,
        node: node
      };
    } catch (error) {
      // Log failed update
      await this._logAppRequests('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_app_request',
        error: error.message
      };
    }
  }

  async _updateAppRequestStatus(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAppRequestsNode = require('../core/ai-app-requests');

      const additionalData = {};
      if (payload.ai_response) additionalData.ai_response = payload.ai_response;
      if (payload.actual_completion) additionalData.actual_completion = payload.actual_completion;
      if (payload.error_message) additionalData.error_message = payload.error_message;

      const node = await AIAppRequestsNode.updateRequestStatus(
        payload.node_code || userNode.nid_hash,
        payload.status,
        additionalData
      );

      // Log status update operation
      await this._logAppRequests('status_update', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'update_app_request_status',
        updated: true,
        node: node
      };
    } catch (error) {
      // Log failed status update
      await this._logAppRequests('status_update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_app_request_status',
        error: error.message
      };
    }
  }

  async _addAppRequestFeedback(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const AIAppRequestsNode = require('../core/ai-app-requests');

      const node = await AIAppRequestsNode.addFeedback(
        payload.node_code || userNode.nid_hash,
        payload.rating,
        payload.comments
      );

      // Log feedback operation
      await this._logAppRequests('feedback', userNode, payload, node, startTime);

      return {
        success: true,
        action: 'add_app_request_feedback',
        feedback_added: true,
        node: node
      };
    } catch (error) {
      // Log failed feedback
      await this._logAppRequests('feedback', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'add_app_request_feedback',
        error: error.message
      };
    }
  }

  async _createChatMessage(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatMessagesNode } = require('../core/ai-chat-messages');

      const messageData = {
        session_id: payload.session_id,
        role: payload.role,
        content: payload.content,
        metadata: payload.metadata || {}
      };

      const result = await AIChatMessagesNode.createChatMessage(messageData, payload.node_code);

      // Log to ai_chat_messages table
      await this._logChatMessages('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_chat_message',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed chat message creation
      await this._logChatMessages('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_chat_message',
        error: error.message
      };
    }
  }

  async _queryChatMessages(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatMessagesNode } = require('../core/ai-chat-messages');

      const criteria = {};
      if (payload.session_id) criteria.session_id = payload.session_id;
      if (payload.role) criteria.role = payload.role;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const messages = await AIChatMessagesNode.queryChatMessages(criteria, options);

      // Log query operation
      await this._logChatMessages('query', userNode, payload, { count: messages.length }, startTime);

      return {
        success: true,
        action: 'query_chat_messages',
        data: messages,
        count: messages.length
      };
    } catch (error) {
      // Log failed query
      await this._logChatMessages('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_chat_messages',
        error: error.message
      };
    }
  }

  async _updateChatMessage(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatMessagesNode } = require('../core/ai-chat-messages');

      const updateData = {};
      if (payload.content !== undefined) updateData.content = payload.content;
      if (payload.metadata !== undefined) updateData.metadata = payload.metadata;

      const result = await AIChatMessagesNode.updateChatMessage(payload.node_code, updateData);

      // Log update operation
      await this._logChatMessages('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_chat_message',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logChatMessages('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_chat_message',
        error: error.message
      };
    }
  }

  async _deleteChatMessage(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatMessagesNode } = require('../core/ai-chat-messages');

      const success = await AIChatMessagesNode.deleteChatMessage(payload.node_code);

      // Log delete operation
      await this._logChatMessages('delete', userNode, payload, { deleted: success }, startTime);

      return {
        success: true,
        action: 'delete_chat_message',
        deleted: success
      };
    } catch (error) {
      // Log failed delete
      await this._logChatMessages('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_chat_message',
        error: error.message
      };
    }
  }

  async _getConversationHistory(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatMessagesNode } = require('../core/ai-chat-messages');

      const messages = await AIChatMessagesNode.getConversationHistory(
        payload.session_id,
        {
          limit: payload.limit || 100,
          offset: payload.offset || 0
        }
      );

      // Log conversation history operation
      await this._logChatMessages('conversation_history', userNode, payload, { count: messages.length }, startTime);

      return {
        success: true,
        action: 'get_conversation_history',
        data: messages,
        session_id: payload.session_id,
        count: messages.length
      };
    } catch (error) {
      // Log failed conversation history
      await this._logChatMessages('conversation_history', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_conversation_history',
        error: error.message
      };
    }
  }

  async _logChatMessages(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        session_id: payload.session_id || (result && result.session_id) || 'system',
        role: payload.role || (result && result.role) || 'system',
        content: `Chat message ${operation}: ${JSON.stringify({
          node_code: payload.node_code,
          session_id: payload.session_id,
          operation,
          duration_ms: duration,
          status: error ? 'failed' : 'success',
          error_message: error
        })}`,
        metadata: {
          operation,
          user_id: userNode.owner_id,
          node_code: payload.node_code || userNode.nid_hash,
          duration_ms: duration,
          status: error ? 'failed' : 'success',
          error_message: error,
          result_summary: result ? {
            node_type: result.node_type,
            has_relationships: !!(result.relationships && result.relationships.length > 0)
          } : null,
          created_at: new Date().toISOString()
        }
      };

      await this.db.from('ai_chat_messages').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI chat messages:', logError.message);
    }
  }

  async _createChatSession(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatSessionsNode } = require('../core/ai-chat-sessions');

      const sessionData = {
        business_id: payload.business_id,
        user_id: payload.user_id || userNode.owner_id,
        session_name: payload.session_name,
        last_active: payload.last_active || new Date().toISOString(),
        metadata: payload.metadata || {}
      };

      const result = await AIChatSessionsNode.createChatSession(sessionData, payload.node_code);

      // Log to ai_chat_sessions table
      await this._logChatSession('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_chat_session',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed chat session creation
      await this._logChatSession('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_chat_session',
        error: error.message
      };
    }
  }

  async _queryChatSessions(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatSessionsNode } = require('../core/ai-chat-sessions');

      const criteria = {};
      if (payload.business_id) criteria.business_id = payload.business_id;
      if (payload.user_id) criteria.user_id = payload.user_id;
      if (payload.session_name) criteria.session_name = payload.session_name;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const sessions = await AIChatSessionsNode.queryChatSessions(criteria, options);

      // Log query operation
      await this._logChatSession('query', userNode, payload, { count: sessions.length }, startTime);

      return {
        success: true,
        action: 'query_chat_sessions',
        data: sessions,
        count: sessions.length
      };
    } catch (error) {
      // Log failed query
      await this._logChatSession('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_chat_sessions',
        error: error.message
      };
    }
  }

  async _updateChatSession(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatSessionsNode } = require('../core/ai-chat-sessions');

      const updateData = {};
      if (payload.session_name !== undefined) updateData.session_name = payload.session_name;
      if (payload.last_active !== undefined) updateData.last_active = payload.last_active;
      if (payload.metadata !== undefined) updateData.metadata = payload.metadata;

      const result = await AIChatSessionsNode.updateChatSession(payload.node_code, updateData);

      // Log update operation
      await this._logChatSession('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_chat_session',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logChatSession('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_chat_session',
        error: error.message
      };
    }
  }

  async _updateChatSessionActive(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatSessionsNode } = require('../core/ai-chat-sessions');

      const result = await AIChatSessionsNode.updateLastActive(payload.node_code);

      // Log active update operation
      await this._logChatSession('update_active', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_chat_session_active',
        updated: true,
        node: result.node
      };
    } catch (error) {
      // Log failed active update
      await this._logChatSession('update_active', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_chat_session_active',
        error: error.message
      };
    }
  }

  async _deleteChatSession(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatSessionsNode } = require('../core/ai-chat-sessions');

      const success = await AIChatSessionsNode.deleteChatSession(payload.node_code);

      // Log delete operation
      await this._logChatSession('delete', userNode, payload, { deleted: success }, startTime);

      return {
        success: true,
        action: 'delete_chat_session',
        deleted: success
      };
    } catch (error) {
      // Log failed delete
      await this._logChatSession('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_chat_session',
        error: error.message
      };
    }
  }

  async _getUserSessions(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIChatSessionsNode } = require('../core/ai-chat-sessions');

      const sessions = await AIChatSessionsNode.getUserSessions(
        payload.user_id || userNode.owner_id,
        payload.business_id,
        {
          limit: payload.limit || 20,
          offset: payload.offset || 0
        }
      );

      // Log user sessions operation
      await this._logChatSession('get_user_sessions', userNode, payload, { count: sessions.length }, startTime);

      return {
        success: true,
        action: 'get_user_sessions',
        data: sessions,
        user_id: payload.user_id || userNode.owner_id,
        business_id: payload.business_id,
        count: sessions.length
      };
    } catch (error) {
      // Log failed user sessions
      await this._logChatSession('get_user_sessions', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_user_sessions',
        error: error.message
      };
    }
  }

  async _logChatSession(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        business_id: payload.business_id || (result && result.business_id) || 'system',
        user_id: payload.user_id || (result && result.user_id) || userNode.owner_id,
        session_name: `Session ${operation}: ${payload.session_name || payload.node_code || 'unknown'}`,
        last_active: new Date().toISOString(),
        metadata: {
          operation,
          user_id: userNode.owner_id,
          node_code: payload.node_code || userNode.nid_hash,
          duration_ms: duration,
          status: error ? 'failed' : 'success',
          error_message: error,
          result_summary: result ? {
            node_type: result.node_type,
            has_relationships: !!(result.relationships && result.relationships.length > 0)
          } : null,
          created_at: new Date().toISOString()
        }
      };

      await this.db.from('ai_chat_sessions').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI chat sessions:', logError.message);
    }
  }

  async _createDashboardRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');

      const requestData = {
        business_id: payload.business_id,
        user_id: payload.user_id || userNode.owner_id,
        prompt: payload.prompt,
        status: payload.status || 'pending',
        metadata: payload.metadata || {}
      };

      const result = await AIDashboardRequestsNode.createDashboardRequest(requestData, payload.node_code);

      // Log to ai_dashboard_requests table
      await this._logDashboardRequest('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_dashboard_request',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed dashboard request creation
      await this._logDashboardRequest('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_dashboard_request',
        error: error.message
      };
    }
  }

  async _queryDashboardRequests(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');

      const criteria = {};
      if (payload.business_id) criteria.business_id = payload.business_id;
      if (payload.user_id) criteria.user_id = payload.user_id;
      if (payload.status) criteria.status = payload.status;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const requests = await AIDashboardRequestsNode.queryDashboardRequests(criteria, options);

      // Log query operation
      await this._logDashboardRequest('query', userNode, payload, { count: requests.length }, startTime);

      return {
        success: true,
        action: 'query_dashboard_requests',
        data: requests,
        count: requests.length
      };
    } catch (error) {
      // Log failed query
      await this._logDashboardRequest('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_dashboard_requests',
        error: error.message
      };
    }
  }

  async _updateDashboardRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');

      const updateData = {};
      if (payload.prompt !== undefined) updateData.prompt = payload.prompt;
      if (payload.status !== undefined) updateData.status = payload.status;
      if (payload.processing_time !== undefined) updateData.processing_time = payload.processing_time;
      if (payload.ai_response !== undefined) updateData.ai_response = payload.ai_response;
      if (payload.metadata !== undefined) updateData.metadata = payload.metadata;

      const result = await AIDashboardRequestsNode.updateDashboardRequest(payload.node_code, updateData);

      // Log update operation
      await this._logDashboardRequest('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_dashboard_request',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logDashboardRequest('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_dashboard_request',
        error: error.message
      };
    }
  }

  async _updateDashboardRequestStatus(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');

      const additionalData = {};
      if (payload.ai_response) additionalData.ai_response = payload.ai_response;
      if (payload.processing_time) additionalData.processing_time = payload.processing_time;

      const result = await AIDashboardRequestsNode.updateRequestStatus(payload.node_code, payload.status, additionalData);

      // Log status update operation
      await this._logDashboardRequest('status_update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_dashboard_request_status',
        updated: true,
        node: result.node
      };
    } catch (error) {
      // Log failed status update
      await this._logDashboardRequest('status_update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_dashboard_request_status',
        error: error.message
      };
    }
  }

  async _processDashboardRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');

      // Update status to processing
      await AIDashboardRequestsNode.updateRequestStatus(payload.node_code, 'processing');

      // Get the request node
      const requests = await AIDashboardRequestsNode.queryDashboardRequests();
      const request = requests.find(node => node.node_code === payload.node_code);

      if (!request) {
        throw new Error('Dashboard request not found');
      }

      // Mock AI processing (in real implementation, this would call an AI service)
      const mockResponse = {
        dashboard_config: {
          title: `AI Generated Dashboard - ${request.metadata.prompt.substring(0, 30)}...`,
          widgets: [
            {
              type: 'chart',
              title: 'Sample Chart',
              data: { /* mock data */ }
            }
          ]
        },
        processing_details: {
          ai_model: payload.ai_model || 'gpt-4',
          parameters: payload.parameters || {},
          processing_time: Date.now() - startTime
        }
      };

      // Update with AI response and mark as completed
      const result = await AIDashboardRequestsNode.updateRequestStatus(payload.node_code, 'completed', {
        ai_response: mockResponse
      });

      // Log processing operation
      await this._logDashboardRequest('process', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'process_dashboard_request',
        processed: true,
        node: result.node,
        ai_response: mockResponse
      };
    } catch (error) {
      // Mark as failed
      try {
        const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');
        await AIDashboardRequestsNode.updateRequestStatus(payload.node_code, 'failed', {
          ai_response: { error: error.message }
        });
      } catch (updateError) {
        console.error('Failed to update request status to failed:', updateError);
      }

      // Log failed processing
      await this._logDashboardRequest('process', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'process_dashboard_request',
        error: error.message
      };
    }
  }

  async _deleteDashboardRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');

      const success = await AIDashboardRequestsNode.deleteDashboardRequest(payload.node_code);

      // Log delete operation
      await this._logDashboardRequest('delete', userNode, payload, { deleted: success }, startTime);

      return {
        success: true,
        action: 'delete_dashboard_request',
        deleted: success
      };
    } catch (error) {
      // Log failed delete
      await this._logDashboardRequest('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_dashboard_request',
        error: error.message
      };
    }
  }

  async _getUserDashboardRequests(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIDashboardRequestsNode } = require('../core/ai-dashboard-requests');

      const requests = await AIDashboardRequestsNode.getUserRequests(
        payload.user_id || userNode.owner_id,
        payload.business_id,
        {
          limit: payload.limit || 20,
          offset: payload.offset || 0
        }
      );

      // Log user requests operation
      await this._logDashboardRequest('get_user_requests', userNode, payload, { count: requests.length }, startTime);

      return {
        success: true,
        action: 'get_user_dashboard_requests',
        data: requests,
        user_id: payload.user_id || userNode.owner_id,
        business_id: payload.business_id,
        count: requests.length
      };
    } catch (error) {
      // Log failed user requests
      await this._logDashboardRequest('get_user_requests', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_user_dashboard_requests',
        error: error.message
      };
    }
  }

  async _logDashboardRequest(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        business_id: payload.business_id || (result && result.business_id) || 'system',
        user_id: payload.user_id || (result && result.user_id) || userNode.owner_id,
        prompt: `Dashboard request ${operation}: ${payload.prompt || payload.node_code || 'unknown'}`,
        status: payload.status || (result && result.status) || 'completed',
        metadata: {
          operation,
          user_id: userNode.owner_id,
          node_code: payload.node_code || userNode.nid_hash,
          duration_ms: duration,
          status: error ? 'failed' : 'success',
          error_message: error,
          result_summary: result ? {
            node_type: result.node_type,
            has_ai_response: !!(result.ai_response),
            processing_time: result.processing_time
          } : null,
          created_at: new Date().toISOString()
        }
      };

      await this.db.from('ai_dashboard_requests').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI dashboard requests:', logError.message);
    }
  }

  async _createGeneratedTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const templateData = {
        request_id: payload.request_id,
        template_code: payload.template_code,
        config: payload.config,
        metadata: payload.metadata || {}
      };

      const result = await aiGeneratedTemplatesNode.createGeneratedTemplate(templateData, payload.node_code);

      // Log to ai_generated_templates table
      await this._logGeneratedTemplate('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_generated_template',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed template creation
      await this._logGeneratedTemplate('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_generated_template',
        error: error.message
      };
    }
  }

  async _queryGeneratedTemplates(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const criteria = {};
      if (payload.request_id) criteria.request_id = payload.request_id;
      if (payload.is_active !== undefined) criteria.is_active = payload.is_active;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const templates = await aiGeneratedTemplatesNode.queryGeneratedTemplates(criteria, options);

      // Log query operation
      await this._logGeneratedTemplate('query', userNode, payload, { count: templates.length }, startTime);

      return {
        success: true,
        action: 'query_generated_templates',
        data: templates,
        count: templates.length
      };
    } catch (error) {
      // Log failed query
      await this._logGeneratedTemplate('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_generated_templates',
        error: error.message
      };
    }
  }

  async _updateGeneratedTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const updateData = {};
      if (payload.template_code !== undefined) updateData.template_code = payload.template_code;
      if (payload.config !== undefined) updateData.config = payload.config;
      if (payload.usage_count !== undefined) updateData.usage_count = payload.usage_count;
      if (payload.rating !== undefined) updateData.rating = payload.rating;
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
      if (payload.metadata !== undefined) updateData.metadata = payload.metadata;

      const result = await aiGeneratedTemplatesNode.updateGeneratedTemplate(payload.node_code, updateData);

      // Log update operation
      await this._logGeneratedTemplate('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_generated_template',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logGeneratedTemplate('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_generated_template',
        error: error.message
      };
    }
  }

  async _incrementTemplateUsage(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const result = await aiGeneratedTemplatesNode.incrementUsage(payload.node_code);

      // Log usage increment operation
      await this._logGeneratedTemplate('increment_usage', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'increment_template_usage',
        updated: true,
        node: result.node
      };
    } catch (error) {
      // Log failed usage increment
      await this._logGeneratedTemplate('increment_usage', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'increment_template_usage',
        error: error.message
      };
    }
  }

  async _rateTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const result = await aiGeneratedTemplatesNode.rateTemplate(payload.node_code, payload.rating, payload.feedback);

      // Log rating operation
      await this._logGeneratedTemplate('rate', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'rate_template',
        rated: true,
        node: result.node
      };
    } catch (error) {
      // Log failed rating
      await this._logGeneratedTemplate('rate', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'rate_template',
        error: error.message
      };
    }
  }

  async _deleteGeneratedTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const success = await aiGeneratedTemplatesNode.deleteGeneratedTemplate(payload.node_code);

      // Log delete operation
      await this._logGeneratedTemplate('delete', userNode, payload, { deleted: success }, startTime);

      return {
        success: true,
        action: 'delete_generated_template',
        deleted: success
      };
    } catch (error) {
      // Log failed delete
      await this._logGeneratedTemplate('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_generated_template',
        error: error.message
      };
    }
  }

  async _getTemplatesByRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const options = {
        limit: payload.limit || 10,
        offset: payload.offset || 0
      };

      const templates = await aiGeneratedTemplatesNode.getTemplatesByRequest(payload.request_id, options);

      // Log get by request operation
      await this._logGeneratedTemplate('get_by_request', userNode, payload, { count: templates.length }, startTime);

      return {
        success: true,
        action: 'get_templates_by_request',
        data: templates,
        request_id: payload.request_id,
        count: templates.length
      };
    } catch (error) {
      // Log failed get by request
      await this._logGeneratedTemplate('get_by_request', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_templates_by_request',
        error: error.message
      };
    }
  }

  async _getPopularTemplates(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const options = {
        limit: payload.limit || 10,
        offset: payload.offset || 0
      };

      const templates = await aiGeneratedTemplatesNode.getPopularTemplates(options);

      // Log get popular operation
      await this._logGeneratedTemplate('get_popular', userNode, payload, { count: templates.length }, startTime);

      return {
        success: true,
        action: 'get_popular_templates',
        data: templates,
        count: templates.length
      };
    } catch (error) {
      // Log failed get popular
      await this._logGeneratedTemplate('get_popular', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_popular_templates',
        error: error.message
      };
    }
  }

  async _getTemplateStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      const stats = await aiGeneratedTemplatesNode.getTemplateStats(payload.request_id);

      // Log get stats operation
      await this._logGeneratedTemplate('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_template_stats',
        data: stats
      };
    } catch (error) {
      // Log failed get stats
      await this._logGeneratedTemplate('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_template_stats',
        error: error.message
      };
    }
  }

  async _cloneTemplate(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

      // Get the original template
      const templates = await aiGeneratedTemplatesNode.queryGeneratedTemplates();
      const originalTemplate = templates.find(node => node.node_code === payload.node_code);

      if (!originalTemplate) {
        throw new Error('Original template not found');
      }

      // Create cloned template data
      const clonedData = {
        request_id: payload.new_request_id || originalTemplate.metadata.request_id,
        template_code: payload.modifications?.template_code || originalTemplate.metadata.template_code,
        config: payload.modifications?.config || originalTemplate.metadata.config,
        metadata: {
          ...originalTemplate.metadata,
          cloned_from: payload.node_code,
          cloned_at: new Date().toISOString(),
          ...payload.modifications?.metadata
        }
      };

      const result = await aiGeneratedTemplatesNode.createGeneratedTemplate(clonedData);

      // Log clone operation
      await this._logGeneratedTemplate('clone', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'clone_template',
        cloned: true,
        original_node_code: payload.node_code,
        new_node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed clone
      await this._logGeneratedTemplate('clone', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'clone_template',
        error: error.message
      };
    }
  }

  async _logGeneratedTemplate(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        request_id: payload.request_id || (result && result.request_id) || 'system',
        template_code: `Template ${operation}: ${payload.node_code || payload.template_code?.substring(0, 50) || 'unknown'}`,
        config: {
          operation,
          timestamp: new Date().toISOString(),
          ...payload
        },
        metadata: {
          operation,
          user_id: userNode.owner_id,
          node_code: payload.node_code || userNode.nid_hash,
          duration_ms: duration,
          status: error ? 'failed' : 'success',
          error_message: error,
          result_summary: result ? {
            node_type: result.node_type,
            has_config: !!(result.config),
            usage_count: result.usage_count
          } : null,
          created_at: new Date().toISOString()
        }
      };

      await this.db.from('ai_generated_templates').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI generated templates:', logError.message);
    }
  }

  async _createKnowledgeEntry(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const knowledgeData = {
        business_id: payload.business_id,
        source_type: payload.source_type,
        source_id: payload.source_id,
        content: payload.content,
        embedding: payload.embedding,
        metadata: payload.metadata || {},
        is_active: payload.is_active !== false,
        doc_id: payload.doc_id,
        heading: payload.heading,
        sub_heading: payload.sub_heading,
        chunk_index: payload.chunk_index || 0,
        user_id: payload.user_id || userNode.owner_id
      };

      const result = await aiKnowledgeBaseNode.createKnowledgeEntry(knowledgeData, payload.node_code);

      // Log to ai_knowledge_base table
      await this._logKnowledgeEntry('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_knowledge_entry',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed knowledge entry creation
      await this._logKnowledgeEntry('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_knowledge_entry',
        error: error.message
      };
    }
  }

  async _queryKnowledgeEntries(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const criteria = {};
      if (payload.business_id) criteria.business_id = payload.business_id;
      if (payload.source_type) criteria.source_type = payload.source_type;
      if (payload.source_id) criteria.source_id = payload.source_id;
      if (payload.doc_id) criteria.doc_id = payload.doc_id;
      if (payload.is_active !== undefined) criteria.is_active = payload.is_active;
      if (payload.user_id) criteria.user_id = payload.user_id;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries(criteria, options);

      // Log query operation
      await this._logKnowledgeEntry('query', userNode, payload, { count: entries.length }, startTime);

      return {
        success: true,
        action: 'query_knowledge_entries',
        data: entries,
        count: entries.length
      };
    } catch (error) {
      // Log failed query
      await this._logKnowledgeEntry('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_knowledge_entries',
        error: error.message
      };
    }
  }

  async _updateKnowledgeEntry(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const updateData = {};
      if (payload.content !== undefined) updateData.content = payload.content;
      if (payload.embedding !== undefined) updateData.embedding = payload.embedding;
      if (payload.metadata !== undefined) updateData.metadata = payload.metadata;
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
      if (payload.heading !== undefined) updateData.heading = payload.heading;
      if (payload.sub_heading !== undefined) updateData.sub_heading = payload.sub_heading;
      if (payload.access_count !== undefined) updateData.access_count = payload.access_count;
      if (payload.last_accessed !== undefined) updateData.last_accessed = payload.last_accessed;
      if (payload.similarity_score !== undefined) updateData.similarity_score = payload.similarity_score;

      const result = await aiKnowledgeBaseNode.updateKnowledgeEntry(payload.node_code, updateData);

      // Log update operation
      await this._logKnowledgeEntry('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_knowledge_entry',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logKnowledgeEntry('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_knowledge_entry',
        error: error.message
      };
    }
  }

  async _incrementKnowledgeAccess(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const result = await aiKnowledgeBaseNode.incrementAccessCount(payload.node_code);

      // Log access increment operation
      await this._logKnowledgeEntry('increment_access', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'increment_knowledge_access',
        updated: true,
        node: result.node
      };
    } catch (error) {
      // Log failed access increment
      await this._logKnowledgeEntry('increment_access', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'increment_knowledge_access',
        error: error.message
      };
    }
  }

  async _searchKnowledgeSimilarity(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const results = await aiKnowledgeBaseNode.searchBySimilarity(
        payload.embedding,
        payload.filters || {},
        payload.limit || 10
      );

      // Log similarity search operation
      await this._logKnowledgeEntry('search_similarity', userNode, payload, { count: results.length }, startTime);

      return {
        success: true,
        action: 'search_knowledge_similarity',
        data: results,
        count: results.length
      };
    } catch (error) {
      // Log failed similarity search
      await this._logKnowledgeEntry('search_similarity', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'search_knowledge_similarity',
        error: error.message
      };
    }
  }

  async _searchKnowledgeText(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const results = await aiKnowledgeBaseNode.searchByText(
        payload.query,
        payload.filters || {},
        payload.limit || 10
      );

      // Log text search operation
      await this._logKnowledgeEntry('search_text', userNode, payload, { count: results.length }, startTime);

      return {
        success: true,
        action: 'search_knowledge_text',
        data: results,
        count: results.length,
        query: payload.query
      };
    } catch (error) {
      // Log failed text search
      await this._logKnowledgeEntry('search_text', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'search_knowledge_text',
        error: error.message
      };
    }
  }

  async _getKnowledgeByDocument(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const options = {
        limit: payload.limit || 100,
        offset: payload.offset || 0
      };

      const entries = await aiKnowledgeBaseNode.getEntriesByDocument(payload.doc_id, options);

      // Log get by document operation
      await this._logKnowledgeEntry('get_by_document', userNode, payload, { count: entries.length }, startTime);

      return {
        success: true,
        action: 'get_knowledge_by_document',
        data: entries,
        doc_id: payload.doc_id,
        count: entries.length
      };
    } catch (error) {
      // Log failed get by document
      await this._logKnowledgeEntry('get_by_document', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_knowledge_by_document',
        error: error.message
      };
    }
  }

  async _getKnowledgeByBusiness(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const entries = await aiKnowledgeBaseNode.getEntriesByBusiness(payload.business_id, options);

      // Log get by business operation
      await this._logKnowledgeEntry('get_by_business', userNode, payload, { count: entries.length }, startTime);

      return {
        success: true,
        action: 'get_knowledge_by_business',
        data: entries,
        business_id: payload.business_id,
        count: entries.length
      };
    } catch (error) {
      // Log failed get by business
      await this._logKnowledgeEntry('get_by_business', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_knowledge_by_business',
        error: error.message
      };
    }
  }

  async _deleteKnowledgeEntry(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const success = await aiKnowledgeBaseNode.deleteKnowledgeEntry(payload.node_code);

      // Log delete operation
      await this._logKnowledgeEntry('delete', userNode, payload, { deleted: success }, startTime);

      return {
        success: true,
        action: 'delete_knowledge_entry',
        deleted: success
      };
    } catch (error) {
      // Log failed delete
      await this._logKnowledgeEntry('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_knowledge_entry',
        error: error.message
      };
    }
  }

  async _getKnowledgeStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const stats = await aiKnowledgeBaseNode.getKnowledgeStats(payload.business_id);

      // Log get stats operation
      await this._logKnowledgeEntry('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_knowledge_stats',
        data: stats
      };
    } catch (error) {
      // Log failed get stats
      await this._logKnowledgeEntry('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_knowledge_stats',
        error: error.message
      };
    }
  }

  async _cloneKnowledgeEntry(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      // Get the original entry
      const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries();
      const originalEntry = entries.find(node => node.node_code === payload.node_code);

      if (!originalEntry) {
        throw new Error('Original knowledge entry not found');
      }

      // Create cloned entry data
      const clonedData = {
        business_id: payload.new_business_id || originalEntry.metadata.business_id,
        source_type: payload.source_type || originalEntry.metadata.source_type,
        source_id: payload.source_id || `${originalEntry.metadata.source_id}-clone`,
        content: payload.content || originalEntry.metadata.content,
        embedding: payload.embedding || originalEntry.metadata.embedding,
        metadata: {
          ...originalEntry.metadata,
          cloned_from: payload.node_code,
          cloned_at: new Date().toISOString(),
          ...payload.metadata
        },
        is_active: payload.is_active !== undefined ? payload.is_active : originalEntry.metadata.is_active,
        doc_id: payload.doc_id || `${originalEntry.metadata.doc_id}-clone`,
        heading: payload.heading || originalEntry.metadata.heading,
        sub_heading: payload.sub_heading || originalEntry.metadata.sub_heading,
        chunk_index: payload.chunk_index !== undefined ? payload.chunk_index : originalEntry.metadata.chunk_index,
        user_id: payload.user_id || originalEntry.metadata.user_id
      };

      const result = await aiKnowledgeBaseNode.createKnowledgeEntry(clonedData);

      // Log clone operation
      await this._logKnowledgeEntry('clone', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'clone_knowledge_entry',
        cloned: true,
        original_node_code: payload.node_code,
        new_node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed clone
      await this._logKnowledgeEntry('clone', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'clone_knowledge_entry',
        error: error.message
      };
    }
  }

  async _batchCreateKnowledge(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

      const { entries } = payload;

      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('Entries array is required and must not be empty');
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < entries.length; i++) {
        try {
          const entry = entries[i];
          const result = await aiKnowledgeBaseNode.createKnowledgeEntry(entry);
          results.push(result);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message,
            entry: entries[i]
          });
        }
      }

      // Log batch operation
      await this._logKnowledgeEntry('batch_create', userNode, payload, {
        successful: results.length,
        failed: errors.length
      }, startTime);

      return {
        success: true,
        action: 'batch_create_knowledge',
        data: {
          successful: results.length,
          failed: errors.length,
          results,
          errors
        }
      };
    } catch (error) {
      // Log failed batch creation
      await this._logKnowledgeEntry('batch_create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'batch_create_knowledge',
        error: error.message
      };
    }
  }

  async _createModelRouter(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const routerData = {
        user_id: payload.user_id || userNode.owner_id,
        provider: payload.provider,
        api_key: payload.api_key,
        fallback_provider: payload.fallback_provider,
        models: payload.models || {},
        rate_limits: payload.rate_limits || {},
        cost_tracking: payload.cost_tracking || {},
        is_active: payload.is_active !== false,
        metadata: payload.metadata || {}
      };

      const result = await aiModelRouterNode.createModelRouter(routerData);

      // Log to ai_model_router table
      await this._logModelRouter('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_model_router',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed model router creation
      await this._logModelRouter('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_model_router',
        error: error.message
      };
    }
  }

  async _queryModelRouters(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const criteria = {};
      if (payload.user_id) criteria.user_id = payload.user_id;
      if (payload.provider) criteria.provider = payload.provider;
      if (payload.is_active !== undefined) criteria.is_active = payload.is_active;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const routers = await aiModelRouterNode.queryModelRouters(criteria, options);

      // Log to ai_model_router table
      await this._logModelRouter('query', userNode, payload, { count: routers.length }, startTime);

      return {
        success: true,
        action: 'query_model_routers',
        routers,
        count: routers.length
      };
    } catch (error) {
      // Log failed model router query
      await this._logModelRouter('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_model_routers',
        error: error.message
      };
    }
  }

  async _updateModelRouter(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const result = await aiModelRouterNode.updateModelRouter(payload.node_code, payload.updateData);

      // Log to ai_model_router table
      await this._logModelRouter('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_model_router',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed model router update
      await this._logModelRouter('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_model_router',
        error: error.message
      };
    }
  }

  async _routeAiRequest(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const routingDecision = await aiModelRouterNode.routeRequest(payload.user_id || userNode.owner_id, payload.request);

      // Log to ai_model_router table
      await this._logModelRouter('route_request', userNode, payload, routingDecision, startTime);

      return {
        success: true,
        action: 'route_ai_request',
        routing_decision: routingDecision
      };
    } catch (error) {
      // Log failed routing
      await this._logModelRouter('route_request', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'route_ai_request',
        error: error.message
      };
    }
  }

  async _handleRoutingFailure(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const fallbackDecision = await aiModelRouterNode.handleRoutingFailure(payload.router_node_code, payload.original_request);

      // Log to ai_model_router table
      await this._logModelRouter('handle_failure', userNode, payload, fallbackDecision, startTime);

      return {
        success: true,
        action: 'handle_routing_failure',
        fallback_decision: fallbackDecision
      };
    } catch (error) {
      // Log failed fallback routing
      await this._logModelRouter('handle_failure', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'handle_routing_failure',
        error: error.message
      };
    }
  }

  async _getRouterStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const stats = await aiModelRouterNode.getRouterStats(payload.user_id || userNode.owner_id);

      // Log to ai_model_router table
      await this._logModelRouter('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_router_stats',
        stats
      };
    } catch (error) {
      // Log failed stats retrieval
      await this._logModelRouter('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_router_stats',
        error: error.message
      };
    }
  }

  async _testModelRouter(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      // This would typically make a test API call, but for now we'll just update the last_used timestamp
      const result = await aiModelRouterNode.updateModelRouter(payload.node_code, {
        last_used: new Date().toISOString()
      });

      // Log to ai_model_router table
      await this._logModelRouter('test', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'test_model_router',
        tested: true,
        node: result.node
      };
    } catch (error) {
      // Log failed test
      await this._logModelRouter('test', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'test_model_router',
        error: error.message
      };
    }
  }

  async _cloneModelRouter(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const result = await aiModelRouterNode.cloneModelRouter(payload.original_node_code, payload.new_user_id || userNode.owner_id);

      // Log to ai_model_router table
      await this._logModelRouter('clone', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'clone_model_router',
        cloned: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed clone
      await this._logModelRouter('clone', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'clone_model_router',
        error: error.message
      };
    }
  }

  async _deleteModelRouter(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiModelRouterNode } = require('../core/ai-model-router');

      const result = await aiModelRouterNode.updateModelRouter(payload.node_code, { is_active: false });

      // Log to ai_model_router table
      await this._logModelRouter('delete', userNode, payload, { deleted: true }, startTime);

      return {
        success: true,
        action: 'delete_model_router',
        deleted: true
      };
    } catch (error) {
      // Log failed deletion
      await this._logModelRouter('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_model_router',
        error: error.message
      };
    }
  }

  async _createSemanticCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const cacheData = {
        user_id: payload.user_id || userNode.owner_id,
        business_id: payload.business_id,
        query: payload.query,
        query_embedding: payload.query_embedding,
        answer: payload.answer,
        similarity_threshold: payload.similarity_threshold || 0.8,
        hit_count: payload.hit_count || 0,
        cache_status: payload.cache_status || 'active',
        embedding_model: payload.embedding_model || 'text-embedding-ada-002',
        query_hash: payload.query_hash,
        tags: payload.tags || [],
        performance_metrics: payload.performance_metrics || {
          avg_response_time: 0,
          total_hits: 0,
          cache_hit_rate: 0
        },
        is_active: payload.is_active !== false
      };

      const result = await aiSemanticCacheNode.createCacheEntry(cacheData, payload.node_code);

      // Log to ai_semantic_cache table
      await this._logSemanticCache('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_semantic_cache',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed semantic cache creation
      await this._logSemanticCache('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_semantic_cache',
        error: error.message
      };
    }
  }

  async _querySemanticCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const criteria = {};
      if (payload.business_id) criteria.business_id = payload.business_id;
      if (payload.user_id) criteria.user_id = payload.user_id;
      if (payload.cache_status) criteria.cache_status = payload.cache_status;
      if (payload.is_active !== undefined) criteria.is_active = payload.is_active;
      if (payload.query_hash) criteria.query_hash = payload.query_hash;
      if (payload.tags && payload.tags.length > 0) criteria.tags = payload.tags;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0,
        sort: payload.sort || 'last_accessed',
        order: payload.order || 'desc'
      };

      const result = await aiSemanticCacheNode.queryCacheEntries(criteria, options);

      // Log to ai_semantic_cache table
      await this._logSemanticCache('query', userNode, payload, { count: result.total }, startTime);

      return {
        success: true,
        action: 'query_semantic_cache',
        entries: result.entries,
        total: result.total
      };
    } catch (error) {
      // Log failed semantic cache query
      await this._logSemanticCache('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_semantic_cache',
        error: error.message
      };
    }
  }

  async _findSimilarCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const results = await aiSemanticCacheNode.findSimilarEntries(
        payload.query_embedding,
        payload.business_id,
        payload.similarity_threshold || 0.8,
        payload.limit || 10
      );

      // Log to ai_semantic_cache table
      await this._logSemanticCache('find_similar', userNode, payload, { count: results.length }, startTime);

      return {
        success: true,
        action: 'find_similar_cache',
        results,
        count: results.length
      };
    } catch (error) {
      // Log failed similarity search
      await this._logSemanticCache('find_similar', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'find_similar_cache',
        error: error.message
      };
    }
  }

  async _updateSemanticCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const result = await aiSemanticCacheNode.updateCacheEntry(payload.node_code, payload.updateData);

      // Log to ai_semantic_cache table
      await this._logSemanticCache('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_semantic_cache',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed semantic cache update
      await this._logSemanticCache('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_semantic_cache',
        error: error.message
      };
    }
  }

  async _incrementCacheHit(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const result = await aiSemanticCacheNode.updateCacheEntry(payload.node_code, {
        increment_hit: true
      });

      // Log to ai_semantic_cache table
      await this._logSemanticCache('increment_hit', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'increment_cache_hit',
        updated: true,
        node: result.node
      };
    } catch (error) {
      // Log failed hit increment
      await this._logSemanticCache('increment_hit', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'increment_cache_hit',
        error: error.message
      };
    }
  }

  async _getCacheStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const stats = await aiSemanticCacheNode.getCacheStats(payload.business_id, payload.user_id);

      // Log to ai_semantic_cache table
      await this._logSemanticCache('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_cache_stats',
        stats
      };
    } catch (error) {
      // Log failed stats retrieval
      await this._logSemanticCache('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_cache_stats',
        error: error.message
      };
    }
  }

  async _cleanupSemanticCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const result = await aiSemanticCacheNode.cleanupCache(
        payload.business_id,
        payload.max_age_days || 30,
        payload.min_hits || 0
      );

      // Log to ai_semantic_cache table
      await this._logSemanticCache('cleanup', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'cleanup_semantic_cache',
        cleaned_entries: result.cleaned_entries
      };
    } catch (error) {
      // Log failed cleanup
      await this._logSemanticCache('cleanup', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'cleanup_semantic_cache',
        error: error.message
      };
    }
  }

  async _deleteSemanticCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      await aiSemanticCacheNode.deleteCacheEntry(payload.node_code);

      // Log to ai_semantic_cache table
      await this._logSemanticCache('delete', userNode, payload, { deleted: true }, startTime);

      return {
        success: true,
        action: 'delete_semantic_cache',
        deleted: true
      };
    } catch (error) {
      // Log failed deletion
      await this._logSemanticCache('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_semantic_cache',
        error: error.message
      };
    }
  }

  async _batchCreateCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

      const results = [];
      const errors = [];

      for (const entry of payload.entries) {
        try {
          const cacheData = {
            user_id: payload.user_id || userNode.owner_id,
            business_id: payload.business_id,
            ...entry
          };

          const result = await aiSemanticCacheNode.createCacheEntry(cacheData, entry.node_code);
          results.push(result);
        } catch (entryError) {
          errors.push({
            entry,
            error: entryError.message
          });
        }
      }

      // Log to ai_semantic_cache table
      await this._logSemanticCache('batch_create', userNode, payload, {
        created: results.length,
        errors: errors.length
      }, startTime);

      return {
        success: true,
        action: 'batch_create_cache',
        created: results,
        errors,
        total_created: results.length,
        total_errors: errors.length
      };
    } catch (error) {
      // Log failed batch creation
      await this._logSemanticCache('batch_create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'batch_create_cache',
        error: error.message
      };
    }
  }

  async _createPlugin(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiPluginsNode } = require('../core/ai-plugins');

      const pluginData = {
        user_id: payload.user_id || userNode.owner_id,
        plugin_name: payload.plugin_name,
        plugin_type: payload.plugin_type,
        provider: payload.provider,
        api_key: payload.api_key,
        config: payload.config || {},
        capabilities: payload.capabilities || [],
        is_active: payload.is_active !== false,
        version: payload.version || '1.0.0',
        description: payload.description,
        tags: payload.tags || [],
        rate_limits: payload.rate_limits,
        cost_tracking: payload.cost_tracking
      };

      const result = await aiPluginsNode.createPlugin(pluginData, payload.node_code);

      // Log to ai_plugins table
      await this._logPlugin('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_plugin',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed plugin creation
      await this._logPlugin('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_plugin',
        error: error.message
      };
    }
  }

  async _queryPlugins(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiPluginsNode } = require('../core/ai-plugins');

      const criteria = {};
      if (payload.user_id) criteria.user_id = payload.user_id;
      if (payload.plugin_type) criteria.plugin_type = payload.plugin_type;
      if (payload.provider) criteria.provider = payload.provider;
      if (payload.is_active !== undefined) criteria.is_active = payload.is_active;
      if (payload.plugin_name) criteria.plugin_name = payload.plugin_name;
      if (payload.tags && payload.tags.length > 0) criteria.tags = payload.tags;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0
      };

      const plugins = await aiPluginsNode.queryPlugins(criteria, options);

      // Log to ai_plugins table
      await this._logPlugin('query', userNode, payload, { count: plugins.length }, startTime);

      return {
        success: true,
        action: 'query_plugins',
        count: plugins.length,
        plugins: plugins
      };
    } catch (error) {
      // Log failed query
      await this._logPlugin('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_plugins',
        error: error.message
      };
    }
  }

  async _updatePlugin(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiPluginsNode } = require('../core/ai-plugins');

      const result = await aiPluginsNode.updatePlugin(payload.node_code, payload.update_data || payload);

      // Log to ai_plugins table
      await this._logPlugin('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_plugin',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logPlugin('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_plugin',
        error: error.message
      };
    }
  }

  async _executePlugin(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiPluginsNode } = require('../core/ai-plugins');

      const result = await aiPluginsNode.executePlugin(payload.node_code, payload.execution_data || payload);

      // Log to ai_plugins table
      await this._logPlugin('execute', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'execute_plugin',
        executed: true,
        result: result
      };
    } catch (error) {
      // Log failed execution
      await this._logPlugin('execute', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'execute_plugin',
        error: error.message
      };
    }
  }

  async _getPluginStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiPluginsNode } = require('../core/ai-plugins');

      const userId = payload.user_id || userNode.owner_id;
      const stats = await aiPluginsNode.getPluginStats(userId);

      // Log to ai_plugins table
      await this._logPlugin('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_plugin_stats',
        stats: stats
      };
    } catch (error) {
      // Log failed stats retrieval
      await this._logPlugin('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_plugin_stats',
        error: error.message
      };
    }
  }

  async _clonePlugin(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiPluginsNode } = require('../core/ai-plugins');

      const result = await aiPluginsNode.clonePlugin(
        payload.original_node_code,
        payload.new_user_id || userNode.owner_id,
        payload.modifications || {}
      );

      // Log to ai_plugins table
      await this._logPlugin('clone', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'clone_plugin',
        cloned: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed clone
      await this._logPlugin('clone', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'clone_plugin',
        error: error.message
      };
    }
  }

  async _deletePlugin(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiPluginsNode } = require('../core/ai-plugins');

      const result = await aiPluginsNode.deletePlugin(payload.node_code);

      // Log to ai_plugins table
      await this._logPlugin('delete', userNode, payload, { deleted: result.deleted }, startTime);

      return {
        success: true,
        action: 'delete_plugin',
        deleted: result.deleted
      };
    } catch (error) {
      // Log failed deletion
      await this._logPlugin('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_plugin',
        error: error.message
      };
    }
  }

  async _logKnowledgeEntry(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        business_id: payload.business_id || (result && result.business_id) || 'system',
        source_type: 'operation_log',
        source_id: `log-${Date.now()}`,
        content: `Knowledge base ${operation}: ${payload.node_code || payload.doc_id || 'unknown'}`,
        embedding: [], // Empty embedding for log entries
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...payload
        },
        is_active: true,
        doc_id: `log-${Date.now()}`,
        heading: `Operation: ${operation}`,
        sub_heading: payload.node_code || 'System Operation',
        chunk_index: 0,
        user_id: payload.user_id || userNode.owner_id
      };

      await this.db.from('ai_knowledge_base').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI knowledge base:', logError.message);
    }
  }

  async _logModelRouter(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: payload.user_id || userNode.owner_id,
        provider: payload.provider || (result && result.provider) || 'system',
        api_key: 'LOGGED', // Never log actual API keys
        fallback_provider: payload.fallback_provider || (result && result.fallback_provider),
        models: payload.models || (result && result.models) || {},
        rate_limits: payload.rate_limits || (result && result.rate_limits) || {},
        cost_tracking: payload.cost_tracking || (result && result.cost_tracking) || {},
        operation_type: operation,
        operation_result: error ? 'error' : 'success',
        operation_details: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          ...payload
        },
        is_active: true,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        }
      };

      await this.db.from('ai_model_router').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI model router:', logError.message);
    }
  }

  async _logSemanticCache(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        business_id: payload.business_id,
        user_id: payload.user_id || userNode.owner_id,
        query: payload.query || (result && result.query) || 'system_operation',
        query_embedding: payload.query_embedding || [],
        answer: payload.answer || (result && result.answer) || 'operation_result',
        similarity_threshold: payload.similarity_threshold || 0.8,
        hit_count: payload.hit_count || 0,
        last_accessed: new Date().toISOString(),
        cache_status: 'active',
        embedding_model: payload.embedding_model || 'text-embedding-ada-002',
        query_hash: payload.query_hash || `log-${Date.now()}`,
        tags: payload.tags || ['system', 'operation'],
        performance_metrics: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null
        },
        operation_type: operation,
        operation_result: error ? 'error' : 'success',
        operation_details: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          ...payload
        },
        is_active: true,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        }
      };

      await this.db.from('ai_semantic_cache').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI semantic cache:', logError.message);
    }
  }

  async _logPlugin(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: payload.user_id || userNode.owner_id,
        plugin_name: payload.plugin_name || (result && result.plugin_name) || 'system',
        plugin_type: payload.plugin_type || (result && result.plugin_type) || 'system',
        provider: payload.provider || (result && result.provider) || 'system',
        api_key: 'LOGGED', // Never log actual API keys
        config: payload.config || (result && result.config) || {},
        capabilities: payload.capabilities || (result && result.capabilities) || [],
        operation_type: operation,
        operation_result: error ? 'error' : 'success',
        operation_details: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          ...payload
        },
        is_active: true,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        }
      };

      await this.db.from('ai_plugins').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI plugin:', logError.message);
    }
  }

  async _createSessionMemory(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const sessionData = {
        user_id: payload.user_id || userNode.owner_id,
        session_id: payload.session_id,
        context: payload.context || {},
        last_action: payload.last_action,
        expires_at: payload.expires_at,
        memory_type: payload.memory_type || 'conversation',
        importance_score: payload.importance_score || 0.5,
        access_count: payload.access_count || 0,
        last_accessed: payload.last_accessed || new Date().toISOString(),
        memory_status: payload.memory_status || 'active',
        tags: payload.tags || [],
        conversation_summary: payload.conversation_summary || '',
        key_insights: payload.key_insights || [],
        user_preferences: payload.user_preferences || {},
        session_metadata: payload.session_metadata || {},
        is_active: payload.is_active !== false
      };

      const result = await aiSessionMemoryNode.createSessionMemory(sessionData, payload.node_code);

      // Log to ai_session_memory table
      await this._logSessionMemory('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_session_memory',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed session memory creation
      await this._logSessionMemory('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_session_memory',
        error: error.message
      };
    }
  }

  async _querySessionMemories(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const criteria = {};
      if (payload.session_id) criteria.session_id = payload.session_id;
      if (payload.user_id) criteria.user_id = payload.user_id;
      if (payload.memory_type) criteria.memory_type = payload.memory_type;
      if (payload.memory_status) criteria.memory_status = payload.memory_status;
      if (payload.is_active !== undefined) criteria.is_active = payload.is_active;
      if (payload.exclude_expired !== undefined) criteria.exclude_expired = payload.exclude_expired;
      if (payload.tags && payload.tags.length > 0) criteria.tags = payload.tags;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0,
        sort: payload.sort || 'last_accessed',
        order: payload.order || 'desc'
      };

      const result = await aiSessionMemoryNode.querySessionMemories(criteria, options);

      // Log to ai_session_memory table
      await this._logSessionMemory('query', userNode, payload, {
        total: result.total,
        returned: result.memories.length
      }, startTime);

      return {
        success: true,
        action: 'query_session_memories',
        memories: result.memories,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset
        }
      };
    } catch (error) {
      // Log failed query
      await this._logSessionMemory('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_session_memories',
        error: error.message
      };
    }
  }

  async _updateSessionMemory(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const updateData = { ...payload };
      delete updateData.node_code;
      delete updateData.session_id;
      delete updateData.user_id;
      delete updateData.created_at;
      updateData.last_modified = new Date().toISOString();

      const result = await aiSessionMemoryNode.updateSessionMemory(payload.node_code, updateData);

      // Log to ai_session_memory table
      await this._logSessionMemory('update', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'update_session_memory',
        updated: true,
        node: result
      };
    } catch (error) {
      // Log failed update
      await this._logSessionMemory('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_session_memory',
        error: error.message
      };
    }
  }

  async _extendSessionExpiration(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const result = await aiSessionMemoryNode.extendSessionExpiration(
        payload.session_id,
        payload.user_id || userNode.owner_id,
        payload.additional_hours || 24
      );

      // Log to ai_session_memory table
      await this._logSessionMemory('extend_expiration', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'extend_session_expiration',
        extended: true,
        new_expires_at: result.expires_at
      };
    } catch (error) {
      // Log failed extension
      await this._logSessionMemory('extend_expiration', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'extend_session_expiration',
        error: error.message
      };
    }
  }

  async _getSessionStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const stats = await aiSessionMemoryNode.getUserSessionStats(payload.user_id || userNode.owner_id);

      // Log to ai_session_memory table
      await this._logSessionMemory('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_session_stats',
        stats
      };
    } catch (error) {
      // Log failed stats retrieval
      await this._logSessionMemory('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_session_stats',
        error: error.message
      };
    }
  }

  async _cleanupExpiredSessions(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const result = await aiSessionMemoryNode.cleanupExpiredSessions(
        payload.user_id || userNode.owner_id,
        payload.force || false
      );

      // Log to ai_session_memory table
      await this._logSessionMemory('cleanup_expired', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'cleanup_expired_sessions',
        cleaned_sessions: result.cleaned_sessions,
        total_processed: result.total_processed
      };
    } catch (error) {
      // Log failed cleanup
      await this._logSessionMemory('cleanup_expired', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'cleanup_expired_sessions',
        error: error.message
      };
    }
  }

  async _archiveOldSessions(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const result = await aiSessionMemoryNode.archiveOldSessions(
        payload.user_id || userNode.owner_id,
        payload.days_old || 30
      );

      // Log to ai_session_memory table
      await this._logSessionMemory('archive_old', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'archive_old_sessions',
        archived_sessions: result.archived_sessions,
        total_processed: result.total_processed
      };
    } catch (error) {
      // Log failed archiving
      await this._logSessionMemory('archive_old', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'archive_old_sessions',
        error: error.message
      };
    }
  }

  async _mergeSessionContexts(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const result = await aiSessionMemoryNode.mergeSessionContexts(
        payload.session_ids,
        payload.user_id || userNode.owner_id,
        payload.target_session_id
      );

      // Log to ai_session_memory table
      await this._logSessionMemory('merge_contexts', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'merge_session_contexts',
        merged: true,
        target_session: result
      };
    } catch (error) {
      // Log failed merge
      await this._logSessionMemory('merge_contexts', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'merge_session_contexts',
        error: error.message
      };
    }
  }

  async _deleteSessionMemory(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const result = await aiSessionMemoryNode.deleteSessionMemory(payload.node_code);

      // Log to ai_session_memory table
      await this._logSessionMemory('delete', userNode, payload, { deleted: result.deleted }, startTime);

      return {
        success: true,
        action: 'delete_session_memory',
        deleted: result.deleted
      };
    } catch (error) {
      // Log failed deletion
      await this._logSessionMemory('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_session_memory',
        error: error.message
      };
    }
  }

  async _batchCreateSessionMemories(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiSessionMemoryNode } = require('../core/ai-session-memory');

      const results = [];
      const errors = [];

      for (const entry of payload.entries) {
        try {
          const sessionData = {
            user_id: payload.user_id || userNode.owner_id,
            ...entry
          };

          const result = await aiSessionMemoryNode.createSessionMemory(sessionData, entry.node_code);
          results.push(result);
        } catch (entryError) {
          errors.push({
            entry,
            error: entryError.message
          });
        }
      }

      // Log to ai_session_memory table
      await this._logSessionMemory('batch_create', userNode, payload, {
        created: results.length,
        errors: errors.length
      }, startTime);

      return {
        success: true,
        action: 'batch_create_session_memories',
        created: results,
        errors,
        total_created: results.length,
        total_errors: errors.length
      };
    } catch (error) {
      // Log failed batch creation
      await this._logSessionMemory('batch_create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'batch_create_session_memories',
        error: error.message
      };
    }
  }

  async _logSessionMemory(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        session_id: payload.session_id || `log-${Date.now()}`,
        user_id: payload.user_id || userNode.owner_id,
        context: payload.context || {},
        last_action: operation,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year for logs
        memory_type: 'operation_log',
        importance_score: 0.1,
        access_count: 1,
        last_accessed: new Date().toISOString(),
        memory_status: 'active',
        tags: ['system', 'operation', operation],
        conversation_summary: `Operation: ${operation}`,
        key_insights: [
          `Operation performed: ${operation}`,
          `Duration: ${duration}ms`,
          error ? `Error: ${error}` : 'Success'
        ],
        user_preferences: {},
        session_metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        },
        operation_type: operation,
        operation_result: error ? 'error' : 'success',
        operation_details: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          ...payload
        },
        is_active: true,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        }
      };

      await this.db.from('ai_session_memory').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI session memory:', logError.message);
    }
  }

  async _createPreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const preferencesData = {
        user_id: payload.user_id || userNode.owner_id,
        preferences: payload.preferences || {}
      };

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const result = await aiPreferencesNode.createPreferences(preferencesData, payload.node_code);

      // Log to ai_preferences table
      await this._logPreferences('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_preferences',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed preferences creation
      await this._logPreferences('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_preferences',
        error: error.message
      };
    }
  }

  async _queryPreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const criteria = {};
      if (payload.user_id) criteria.user_id = payload.user_id;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0,
        sort: payload.sort || 'updated_at',
        order: payload.order || 'desc'
      };

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const result = await aiPreferencesNode.queryPreferences(criteria, options);

      // Log to ai_preferences table
      await this._logPreferences('query', userNode, payload, {
        total: result.total,
        returned: result.preferences.length
      }, startTime);

      return {
        success: true,
        action: 'query_preferences',
        preferences: result.preferences,
        nodes: result.nodes,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset
        }
      };
    } catch (error) {
      // Log failed query
      await this._logPreferences('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_preferences',
        error: error.message
      };
    }
  }

  async _updatePreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const updateData = { ...payload };
      delete updateData.node_code;
      delete updateData.id;
      delete updateData.user_id;

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const result = await aiPreferencesNode.updatePreferences(payload.node_code, updateData);

      // Log to ai_preferences table
      await this._logPreferences('update', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'update_preferences',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logPreferences('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_preferences',
        error: error.message
      };
    }
  }

  async _updateUserPreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const result = await aiPreferencesNode.updateUserPreferences(
        payload.user_id || userNode.owner_id,
        payload.preferences,
        payload.node_code
      );

      // Log to ai_preferences table
      await this._logPreferences('update_user', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'update_user_preferences',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logPreferences('update_user', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_user_preferences',
        error: error.message
      };
    }
  }

  async _getPreferenceValue(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const value = await aiPreferencesNode.getPreferenceValue(
        payload.user_id || userNode.owner_id,
        payload.key,
        payload.default
      );

      // Log to ai_preferences table
      await this._logPreferences('get_value', userNode, payload, { key: payload.key, found: value !== null }, startTime);

      return {
        success: true,
        action: 'get_preference_value',
        key: payload.key,
        value,
        found: value !== null && value !== undefined
      };
    } catch (error) {
      // Log failed get
      await this._logPreferences('get_value', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_preference_value',
        error: error.message
      };
    }
  }

  async _setPreferenceValue(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const result = await aiPreferencesNode.setPreferenceValue(
        payload.user_id || userNode.owner_id,
        payload.key,
        payload.value,
        payload.node_code
      );

      // Log to ai_preferences table
      await this._logPreferences('set_value', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'set_preference_value',
        key: payload.key,
        value: payload.value,
        updated: true
      };
    } catch (error) {
      // Log failed set
      await this._logPreferences('set_value', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'set_preference_value',
        error: error.message
      };
    }
  }

  async _getPreferencesStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const stats = await aiPreferencesNode.getPreferencesStats();

      // Log to ai_preferences table
      await this._logPreferences('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_preferences_stats',
        stats
      };
    } catch (error) {
      // Log failed stats
      await this._logPreferences('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_preferences_stats',
        error: error.message
      };
    }
  }

  async _exportUserPreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const exportData = await aiPreferencesNode.exportUserPreferences(payload.user_id || userNode.owner_id);

      // Log to ai_preferences table
      await this._logPreferences('export', userNode, payload, { exported: !!exportData }, startTime);

      return {
        success: true,
        action: 'export_user_preferences',
        data: exportData
      };
    } catch (error) {
      // Log failed export
      await this._logPreferences('export', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'export_user_preferences',
        error: error.message
      };
    }
  }

  async _importUserPreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const result = await aiPreferencesNode.importUserPreferences({
        user_id: payload.user_id || userNode.owner_id,
        preferences: payload.preferences
      }, payload.node_code);

      // Log to ai_preferences table
      await this._logPreferences('import', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'import_user_preferences',
        imported: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed import
      await this._logPreferences('import', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'import_user_preferences',
        error: error.message
      };
    }
  }

  async _deletePreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const result = await aiPreferencesNode.deletePreferences(payload.node_code);

      // Log to ai_preferences table
      await this._logPreferences('delete', userNode, payload, { deleted: result.deleted }, startTime);

      return {
        success: true,
        action: 'delete_preferences',
        deleted: result.deleted
      };
    } catch (error) {
      // Log failed deletion
      await this._logPreferences('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_preferences',
        error: error.message
      };
    }
  }

  async _batchUpdatePreferences(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AIPreferencesNode } = require('../core/ai-preferences');

      const aiPreferencesNode = new AIPreferencesNode(this.db);
      const results = await aiPreferencesNode.batchUpdatePreferences(payload.updates);

      // Log to ai_preferences table
      await this._logPreferences('batch_update', userNode, payload, {
        successful: results.successful.length,
        failed: results.failed.length
      }, startTime);

      return {
        success: true,
        action: 'batch_update_preferences',
        successful: results.successful,
        failed: results.failed,
        total_processed: results.total_processed,
        success_count: results.success_count,
        error_count: results.error_count
      };
    } catch (error) {
      // Log failed batch update
      await this._logPreferences('batch_update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'batch_update_preferences',
        error: error.message
      };
    }
  }

  async _logPreferences(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        id: `log-${Date.now()}`,
        user_id: payload.user_id || userNode.owner_id,
        preferences: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        },
        updated_at: new Date().toISOString()
      };

      await this.db.from('ai_preferences').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI preferences:', logError.message);
    }
  }

  async _createVoiceLog(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

      const voiceData = {
        business_id: payload.business_id || userNode.owner_id,
        user_id: payload.user_id || userNode.owner_id,
        audio_url: payload.audio_url,
        transcript: payload.transcript,
        detected_intent: payload.detected_intent,
        confidence_score: payload.confidence_score || 0.0,
        processing_duration: payload.processing_duration || 0,
        audio_duration: payload.audio_duration || 0,
        language: payload.language || 'en',
        voice_provider: payload.voice_provider || 'unknown',
        sentiment: payload.sentiment || 'neutral',
        keywords: payload.keywords || [],
        entities: payload.entities || [],
        metadata: payload.metadata || {},
        tags: payload.tags || [],
        is_active: payload.is_active !== false
      };

      const result = await aiVoiceLogsNode.createVoiceLog(voiceData, payload.node_code);

      // Log to ai_voice_logs table
      await this._logVoiceLog('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_voice_log',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed voice log creation
      await this._logVoiceLog('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_voice_log',
        error: error.message
      };
    }
  }

  async _queryVoiceLogs(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

      const criteria = {};
      if (payload.business_id) criteria.business_id = payload.business_id;
      if (payload.user_id) criteria.user_id = payload.user_id;
      if (payload.detected_intent) criteria.detected_intent = payload.detected_intent;
      if (payload.language) criteria.language = payload.language;
      if (payload.voice_provider) criteria.voice_provider = payload.voice_provider;
      if (payload.sentiment) criteria.sentiment = payload.sentiment;
      if (payload.confidence_score && payload.confidence_score.$gte !== undefined) {
        criteria.confidence_score = { $gte: payload.confidence_score.$gte };
      }
      if (payload.created_at && payload.created_at.$gte) {
        criteria.created_at = criteria.created_at || {};
        criteria.created_at.$gte = payload.created_at.$gte;
      }
      if (payload.created_at && payload.created_at.$lte) {
        criteria.created_at = criteria.created_at || {};
        criteria.created_at.$lte = payload.created_at.$lte;
      }

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0,
        sort: payload.sort || 'created_at',
        order: payload.order || 'desc'
      };

      const result = await aiVoiceLogsNode.queryVoiceLogs(criteria, options);

      // Log to ai_voice_logs table
      await this._logVoiceLog('query', userNode, payload, {
        total: result.total,
        returned: result.logs.length
      }, startTime);

      return {
        success: true,
        action: 'query_voice_logs',
        logs: result.logs,
        nodes: result.nodes,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset
        }
      };
    } catch (error) {
      // Log failed query
      await this._logVoiceLog('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_voice_logs',
        error: error.message
      };
    }
  }

  async _updateVoiceLog(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

      const updateData = { ...payload };
      delete updateData.node_code;
      delete updateData.business_id;
      delete updateData.user_id;
      delete updateData.audio_url;
      delete updateData.transcript;
      delete updateData.created_at;
      updateData.last_modified = new Date().toISOString();

      const result = await aiVoiceLogsNode.updateVoiceLog(payload.node_code, updateData);

      // Log to ai_voice_logs table
      await this._logVoiceLog('update', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'update_voice_log',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logVoiceLog('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_voice_log',
        error: error.message
      };
    }
  }

  async _searchVoiceLogs(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

      const options = {
        limit: payload.limit || 20,
        offset: payload.offset || 0
      };

      const result = await aiVoiceLogsNode.searchVoiceLogs(payload.query, payload.user_id || userNode.owner_id, options);

      // Log to ai_voice_logs table
      await this._logVoiceLog('search', userNode, payload, {
        query: payload.query,
        results_found: result.logs.length
      }, startTime);

      return {
        success: true,
        action: 'search_voice_logs',
        logs: result.logs,
        nodes: result.nodes,
        search_query: payload.query
      };
    } catch (error) {
      // Log failed search
      await this._logVoiceLog('search', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'search_voice_logs',
        error: error.message
      };
    }
  }

  async _getVoiceAnalytics(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

      const dateRange = {};
      if (payload.date_from) dateRange.start = payload.date_from;
      if (payload.date_to) dateRange.end = payload.date_to;

      const analytics = await aiVoiceLogsNode.getVoiceAnalytics(payload.user_id || userNode.owner_id, Object.keys(dateRange).length > 0 ? dateRange : null);

      // Log to ai_voice_logs table
      await this._logVoiceLog('get_analytics', userNode, payload, analytics, startTime);

      return {
        success: true,
        action: 'get_voice_analytics',
        analytics
      };
    } catch (error) {
      // Log failed analytics
      await this._logVoiceLog('get_analytics', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_voice_analytics',
        error: error.message
      };
    }
  }

  async _deleteVoiceLog(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

      const result = await aiVoiceLogsNode.deleteVoiceLog(payload.node_code);

      // Log to ai_voice_logs table
      await this._logVoiceLog('delete', userNode, payload, { deleted: result.deleted }, startTime);

      return {
        success: true,
        action: 'delete_voice_log',
        deleted: result.deleted
      };
    } catch (error) {
      // Log failed deletion
      await this._logVoiceLog('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_voice_log',
        error: error.message
      };
    }
  }

  async _batchCreateVoiceLogs(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

      const results = await aiVoiceLogsNode.batchCreateVoiceLogs(payload.entries);

      // Log to ai_voice_logs table
      await this._logVoiceLog('batch_create', userNode, payload, {
        created: results.total_created,
        errors: results.total_errors
      }, startTime);

      return {
        success: true,
        action: 'batch_create_voice_logs',
        created: results.created,
        errors: results.errors,
        total_created: results.total_created,
        total_errors: results.total_errors
      };
    } catch (error) {
      // Log failed batch creation
      await this._logVoiceLog('batch_create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'batch_create_voice_logs',
        error: error.message
      };
    }
  }

  async _logVoiceLog(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        session_id: `voice_log_${Date.now()}`,
        user_id: payload.user_id || userNode.owner_id,
        context: {
          operation,
          transcript: payload.transcript || 'system_operation',
          detected_intent: payload.detected_intent || operation
        },
        last_action: operation,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year for logs
        memory_type: 'voice_operation_log',
        importance_score: 0.2,
        access_count: 1,
        last_accessed: new Date().toISOString(),
        memory_status: 'active',
        tags: ['system', 'voice', 'operation', operation],
        conversation_summary: `Voice operation: ${operation}`,
        key_insights: [
          `Voice operation performed: ${operation}`,
          `Duration: ${duration}ms`,
          error ? `Error: ${error}` : 'Success'
        ],
        user_preferences: {},
        session_metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          voice_provider: payload.voice_provider || 'system',
          confidence_score: payload.confidence_score || 0,
          ...payload
        },
        operation_type: operation,
        operation_result: error ? 'error' : 'success',
        operation_details: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          ...payload
        },
        is_active: true,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        }
      };

      await this.db.from('ai_session_memory').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI voice log:', logError.message);
    }
  }

  async _createSummaryCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const cacheData = {
        business_id: payload.business_id,
        user_id: payload.user_id || userNode.owner_id,
        query_hash: payload.query_hash,
        original_query: payload.original_query,
        context_hash: payload.context_hash,
        summary: payload.summary,
        usage_count: payload.usage_count || 1,
        cache_status: payload.cache_status || 'active',
        performance_metrics: payload.performance_metrics || {
          avg_generation_time: 0,
          total_requests: 0,
          cache_hit_rate: 0
        },
        tags: payload.tags || [],
        is_active: payload.is_active !== false
      };

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const result = await aiSummaryCacheNode.createSummaryCache(cacheData, payload.node_code);

      // Log to ai_summary_cache table
      await this._logSummaryCache('create', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'create_summary_cache',
        created: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed summary cache creation
      await this._logSummaryCache('create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'create_summary_cache',
        error: error.message
      };
    }
  }

  async _querySummaryCaches(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const criteria = {};
      if (payload.business_id) criteria.business_id = payload.business_id;
      if (payload.query_hash) criteria.query_hash = payload.query_hash;
      if (payload.context_hash) criteria.context_hash = payload.context_hash;
      if (payload.usage_count_min) criteria.usage_count_min = payload.usage_count_min;
      if (payload.usage_count_max) criteria.usage_count_max = payload.usage_count_max;
      if (payload.created_after) criteria.created_after = payload.created_after;
      if (payload.created_before) criteria.created_before = payload.created_before;
      if (payload.updated_after) criteria.updated_after = payload.updated_after;
      if (payload.updated_before) criteria.updated_before = payload.updated_before;

      const options = {
        limit: payload.limit || 50,
        offset: payload.offset || 0,
        sort: payload.sort || 'updated_at',
        order: payload.order || 'desc'
      };

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const result = await aiSummaryCacheNode.querySummaryCaches(criteria, options);

      // Log to ai_summary_cache table
      await this._logSummaryCache('query', userNode, payload, {
        total_found: result.total,
        criteria,
        options
      }, startTime);

      return {
        success: true,
        action: 'query_summary_caches',
        caches: result.caches,
        total: result.total,
        limit: result.limit,
        offset: result.offset
      };
    } catch (error) {
      // Log failed query
      await this._logSummaryCache('query', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'query_summary_caches',
        error: error.message
      };
    }
  }

  async _updateSummaryCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const result = await aiSummaryCacheNode.updateSummaryCache(payload.node_code, payload.updateData || payload);

      // Log to ai_summary_cache table
      await this._logSummaryCache('update', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'update_summary_cache',
        updated: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed update
      await this._logSummaryCache('update', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'update_summary_cache',
        error: error.message
      };
    }
  }

  async _incrementCacheUsage(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const result = await aiSummaryCacheNode.incrementUsageCount(payload.node_code);

      // Log to ai_summary_cache table
      await this._logSummaryCache('increment_usage', userNode, payload, result.node, startTime);

      return {
        success: true,
        action: 'increment_cache_usage',
        incremented: true,
        node: result.node,
        database_record: result.database_record
      };
    } catch (error) {
      // Log failed increment
      await this._logSummaryCache('increment_usage', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'increment_cache_usage',
        error: error.message
      };
    }
  }

  async _getSummaryCacheStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const stats = await aiSummaryCacheNode.getCacheStats(payload.business_id);

      // Log to ai_summary_cache table
      await this._logSummaryCache('get_stats', userNode, payload, stats, startTime);

      return {
        success: true,
        action: 'get_summary_cache_stats',
        stats
      };
    } catch (error) {
      // Log failed stats retrieval
      await this._logSummaryCache('get_stats', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'get_summary_cache_stats',
        error: error.message
      };
    }
  }

  async _cleanupSummaryCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const result = await aiSummaryCacheNode.cleanupOldCache(
        payload.business_id,
        payload.days_old || 30,
        payload.min_usage || 1
      );

      // Log to ai_summary_cache table
      await this._logSummaryCache('cleanup', userNode, payload, result, startTime);

      return {
        success: true,
        action: 'cleanup_summary_cache',
        cleaned_entries: result.cleaned_entries,
        cutoff_date: result.cutoff_date,
        min_usage_threshold: result.min_usage_threshold
      };
    } catch (error) {
      // Log failed cleanup
      await this._logSummaryCache('cleanup', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'cleanup_summary_cache',
        error: error.message
      };
    }
  }

  async _deleteSummaryCache(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const result = await aiSummaryCacheNode.deleteSummaryCache(payload.node_code);

      // Log to ai_summary_cache table
      await this._logSummaryCache('delete', userNode, payload, { deleted: result.deleted }, startTime);

      return {
        success: true,
        action: 'delete_summary_cache',
        deleted: result.deleted
      };
    } catch (error) {
      // Log failed deletion
      await this._logSummaryCache('delete', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'delete_summary_cache',
        error: error.message
      };
    }
  }

  async _batchCreateSummaryCaches(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { AISummaryCacheNode } = require('../core/ai-summary-cache');

      const aiSummaryCacheNode = new AISummaryCacheNode(this.db);
      const results = await aiSummaryCacheNode.batchCreateSummaryCaches(payload.entries, payload.business_id);

      // Log to ai_summary_cache table
      await this._logSummaryCache('batch_create', userNode, payload, {
        created: results.total_created,
        errors: results.total_errors
      }, startTime);

      return {
        success: true,
        action: 'batch_create_summary_caches',
        created: results.created,
        errors: results.errors,
        total_created: results.total_created,
        total_errors: results.total_errors
      };
    } catch (error) {
      // Log failed batch creation
      await this._logSummaryCache('batch_create', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'batch_create_summary_caches',
        error: error.message
      };
    }
  }

  async _logSummaryCache(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        business_id: payload.business_id,
        query_hash: `log-${Date.now()}`,
        original_query: `Operation: ${operation}`,
        context_hash: 'system_operation',
        summary: `Summary cache ${operation} operation performed`,
        usage_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        operation_type: operation,
        operation_result: error ? 'error' : 'success',
        operation_details: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          ...payload
        },
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          duration,
          error: error || null,
          result_summary: result ? JSON.stringify(result).substring(0, 500) : null,
          ...payload
        }
      };

      await this.db.from('ai_summary_cache').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI summary cache:', logError.message);
    }
  }
}

// ═════════════════════════════════════════════════════════════
// KERNEL EXECUTOR — THE BRAIN
// ═════════════════════════════════════════════════════════════
class KernelExecutor {
  constructor(supabaseClient, io) {
    this.db = supabaseClient;
    this.io = io;
    this.nodeFactory = new NodeFactory(supabaseClient);

    // Initialize all sub-engines
    this.permissionEngine = new PermissionEngine(supabaseClient);
    this.karmaEngine = new KarmaEngine(supabaseClient);
    this.dharmaValidator = new DharmaValidator(supabaseClient);
    this.nodeSync = new NodeSync(supabaseClient, io, null, this.nodeFactory);
    this.multiDeviceSync = new MultiDeviceSync(supabaseClient, io);
    this.nodeDiscovery = new NodeDiscovery(supabaseClient, null, this.nodeFactory);
    this.promptEvolution = new PromptEvolution(supabaseClient, this.nodeFactory);
    this.vectorManager = new VectorManager(supabaseClient);
    this.trustEngine = new TrustEngine(supabaseClient, this.nodeFactory);
    this.riskPredictor = new RiskPredictor(supabaseClient);
    this.layoutEvolution = new LayoutEvolution(supabaseClient);
    this.nodeGraph = new NodeGraph(supabaseClient, this.nodeFactory);
    this.gossipNetwork = new GossipNetwork(supabaseClient, io);
    this.nodeCache = new NodeCache(supabaseClient);
    this.rateLimiter = new RateLimiter();
    this.actionExecutors = new ActionExecutors(supabaseClient);

    // Bind cache to sub-engines that support it
    this.nodeSync.setCache(this.nodeCache);
    this.nodeSync.setNodeDiscovery(this.nodeDiscovery);
    this.gossipNetwork.setCache(this.nodeCache);

    // Start cleanup
    this.rateLimiter.startCleanup();

    // Warm up cache on boot (async, non-blocking)
    this.nodeCache.warmUp().catch(err => console.warn('Cache warm-up error:', err.message));
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN PIPELINE — node_runtime_execute()
  // 18-step execution aligned with auth-api login flow
  // All checks based on vector node from node_core
  // ═══════════════════════════════════════════════════════════
  async execute({ user_node_id, action_type = 'ui', payload = {}, device_id, session_token }) {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const trace = {
      execution_id: executionId,
      steps: [],
      started_at: new Date().toISOString()
    };

    try {
      // ─── STEP 1: VALIDATE SESSION ────────────────────────
      trace.steps.push('validate_session');
      const session = await this._validateSession(user_node_id, session_token, device_id);
      if (!session.valid) {
        return this._buildErrorResponse('SESSION_INVALID', session.error, trace, 401);
      }


      // ─── STEP 2: LOAD USER NODE ─────────────────────────
      trace.steps.push('load_user_node');
      const userNodeDetails = await this._loadUserNode(user_node_id);
      // _loadUserNode returns the node row directly (or a default fallback);
      // tolerate both shapes for safety.
      const userNode = userNodeDetails?.node || userNodeDetails;
      if (!userNode || !userNode.owner_id) {
        return this._buildErrorResponse('NODE_NOT_FOUND', 'User node not found', trace, 404);
      }

      // ─── STEP 2A: CHECK VECTOR NODE (memory_blob + vec_embedding) ─
      trace.steps.push('check_vector_node');
      let vectorNode = null;
      let vectorValid = false;
      try {
        // Check node for vector data using NodeFactory
        const nodeWithVector = await this.nodeFactory.loadUserNode(userNode.nid_hash);

        if (nodeWithVector && (nodeWithVector.memory_blob || nodeWithVector.vec_embedding)) {
          // Vector data exists
          vectorNode = nodeWithVector;
          vectorValid = true;
          trace.steps.push('vector_node_found');
        } else {
          // No vector node found — need to create one
          trace.steps.push('vector_node_missing');
        }
      } catch (err) {
        // Vector check is non-critical
        console.warn('[KERNEL] Vector node check warning:', err.message);
      }

      // ─── STEP 2B: CREATE VECTOR NODE IF MISSING ────────────────
      if (!vectorValid) {
        trace.steps.push('create_vector_node');
        try {
          // Initialize vector node with memory_blob + generate vec_embedding
          const vectorData = {
            memory_type: 'user_context',
            user_id: userNode.owner_id,
            nid_hash: userNode.nid_hash,
            created_at: new Date().toISOString(),
            embedding_status: 'pending'
          };

          // Encode to memory_blob (bytea)
          const { encodeToBlob } = require('./node-schema');
          const memoryBlob = encodeToBlob(vectorData);

          // Update node with vector data using NodeFactory
          await this.nodeFactory.updateNode(userNode.nid_hash, {
            memory_blob: memoryBlob,
            vec_embedding: null, // Will be populated by vector-manager after embedding
            updated_at: new Date().toISOString()
          }, userNode.owner_id);

          vectorValid = true;
          trace.steps.push('vector_node_created');
        } catch (err) {
          // Vector creation failure is non-critical
          console.warn('[KERNEL] Failed to create vector node:', err.message);
        }
      }

      // ─── STEP 2C: ADMIN AI TOOLS INITIALIZATION ────────────────
      trace.steps.push('admin_tools_init');
      let adminAccess = false;
      let adminToolExecutor = null;
      try {
        adminToolExecutor = new AdminToolExecutor(this.db);
        const adminCheck = await adminToolExecutor._checkAdminPermission(userNode.owner_id);
        adminAccess = adminCheck.allowed;
        if(!adminAccess) {
          const adminCheck = await adminToolExecutor._checkAdminPermission(user_node_id);
          adminAccess = adminCheck.allowed;
        }
        // If admin: log node access for audit trail
        if (adminAccess) {
          try {
            await this.db.from('admin_node_audit').insert({
              admin_id: userNode.owner_id,
              target_nid_hash: userNode.nid_hash,
              action: 'node_access_watch',
              timestamp: new Date().toISOString(),
              metadata: {
                vector_node_valid: vectorValid,
                vector_check_passed: !!vectorNode
              }
            });
          } catch {}
        }
      } catch (err) {
        // Admin tools init is non-critical
        console.warn('[KERNEL] Admin tools init failed:', err.message);
      }

      // ─── STEP 3: IDENTIFY TARGET BRAND ──────────────────
      trace.steps.push('identify_brand');
      const brand = this._resolveBrand(userNode, payload);

      // ─── STEP 4: TRUST ASSESSMENT (cached) ─────────────
      trace.steps.push('trust_assessment');
      let trustResult = this.nodeCache.getCachedTrust(userNode.nid_hash);
      if (!trustResult) {
        trustResult = await this.trustEngine.getQuickTrust(userNode.nid_hash);
        if (trustResult) this.nodeCache.cacheTrust(userNode.nid_hash, trustResult);
      }
      const trustScore = trustResult?.trust_score ?? userNode.trust_score ?? 50;

      // ─── STEP 5: RISK PREDICTION ────────────────────────
      trace.steps.push('risk_prediction');
      const riskResult = await this.riskPredictor.assessRisk(
        userNode.nid_hash, action_type, { ...payload, brand_scope: brand }
      );
      if (riskResult.should_block) {
        return this._buildErrorResponse('RISK_BLOCKED',
          { risk_score: riskResult.risk_score, warnings: riskResult.warnings, level: riskResult.risk_level.label },
          trace, 403);
      }

      // ─── STEP 6: RESOLVE PERMISSION (cached) ───────────
      trace.steps.push('validate_permission');
      const nodehash = userNode.nid_hash;
      const target_nid_hash = payload.target_nid_hash || 'self';
      const permCacheKey = `${nodehash}:${action_type}:${target_nid_hash}`;
      let permResult = this.nodeCache.getCachedPermission(nodehash, action_type, target_nid_hash);
      if (!permResult) {
        permResult = await this.permissionEngine.validatePermission(userNode, action_type, {
          ...payload,
          brand_scope: brand
        });
        this.nodeCache.cachePermission(nodehash, action_type, target_nid_hash, permResult);
      }
      if (!permResult.allowed) {
        return this._buildErrorResponse('PERMISSION_DENIED', permResult.errors, trace, 403);
      }

      // ─── STEP 7: KARMA CHECK ────────────────────────────
      trace.steps.push('karma_check');
      const karmaResult = this.karmaEngine.validate(userNode, action_type);
      if (!karmaResult.allowed) {
        return this._buildErrorResponse(karmaResult.code, karmaResult.message, trace, 403);
      }

      // ─── STEP 8: DHARMA VALIDATION ──────────────────
      trace.steps.push('dharma_validation');
      const dharmaResult = await this.dharmaValidator.validate(userNode, action_type, payload);
      if (!dharmaResult.valid) {
        return this._buildErrorResponse('DHARMA_VIOLATION', dharmaResult.violations, trace, 403);
      }

      // ─── STEP 9: RATE LIMIT CHECK ──────────────────
      trace.steps.push('rate_limit');
      const rateResult = this.rateLimiter.check(userNode.owner_id, action_type);
      if (!rateResult.allowed) {
        return this._buildErrorResponse('RATE_LIMITED', rateResult.message, trace, 429);
      }

      // ─── STEP 10: RESOLVE TARGET NODE (if applicable) ──
      trace.steps.push('resolve_target');
      let targetNode = null;
      if (payload.target_nid_hash) {
        targetNode = await this._loadNode(payload.target_nid_hash);
      }

      // ─── STEP 11: EXECUTE ACTION ────────────────────
      trace.steps.push('execute_action');

      // Build dynamic system prompt for context
      const systemPrompt = this.promptEvolution.buildPrompt(
        brand,
        userNode.karma_score || 0,
        {
          is_child: this._isChild(userNode),
          custom_prompt: userNode.node_system_prompt
        }
      );

      const actionResult = await this.actionExecutors.execute(action_type, userNode, payload, {
        brand,
        system_prompt: systemPrompt,
        karma_level: karmaResult.level,
        target_node: targetNode,
        execution_id: executionId
      });

      // ─── STEP 12: UPDATE VECTOR STATE ───────────────
      trace.steps.push('update_vectors');
      try {
        await this.vectorManager.autoStore(
          userNode.nid_hash,
          action_type,
          JSON.stringify({ action: action_type, payload_summary: Object.keys(payload) }),
          { owner_id: userNode.owner_id, brand_scope: brand }
        );
      } catch { /* vector update is non-critical */ }

      // ─── STEP 13: UPDATE KARMA + TRUST EVENTS ──────
      trace.steps.push('update_karma_trust');
      const karmaUpdate = await this.karmaEngine.updateKarma(userNode, action_type, actionResult);

      // Apply trust event for successful execution
      try {
        if (actionResult.success) {
          await this.trustEngine.applyTrustEvent(userNode.nid_hash, 'positive_karma_action');
        }
      } catch { /* trust event is non-critical */ }

      // ─── STEP 14: LOG EVENT ─────────────────────────────
      trace.steps.push('log_event');
      await this._logExecution(executionId, userNode, action_type, actionResult, trace, startTime);

      // ─── STEP 15: SYNC NEAREST NODES ────────────────
      trace.steps.push('sync_nearest');
      const syncResult = await this.nodeSync.syncNearestNodes(
        userNode,
        { action: action_type, ...(actionResult.created ? { created: true } : {}) },
        action_type
      );

      // ─── STEP 16: PROMPT EVOLUTION CHECK ────────────
      trace.steps.push('prompt_evolution');
      if (karmaUpdate.updated) {
        // Check if karma change should trigger prompt evolution
        const prevLevel = this.karmaEngine.getAutonomyLevel(karmaUpdate.previous);
        const newLevel = this.karmaEngine.getAutonomyLevel(karmaUpdate.karma);
        if (prevLevel !== newLevel) {
          await this.promptEvolution.evolveNodePrompt(
            userNode.nid_hash, karmaUpdate.karma, brand
          );
        }
      }

      // ─── BUILD UI RESPONSE ──────────────────────────────
      const duration = Date.now() - startTime;

      return {
        success: true,
        execution_id: executionId,
        action: action_type,
        brand,
        result: actionResult,
        karma: {
          score: karmaUpdate.karma || userNode.karma_score,
          delta: karmaUpdate.delta || 0,
          level: karmaUpdate.level || karmaResult.level
        },
        trust: {
          score: trustScore,
          level: trustResult?.level?.label || 'Verified'
        },
        risk: {
          score: riskResult.risk_score,
          level: riskResult.risk_level.label,
          warnings: riskResult.warnings
        },
        sync: {
          version: syncResult.sync_version,
          nodes_notified: syncResult.children_notified + (syncResult.parent_synced ? 1 : 0)
        },
        meta: {
          duration_ms: duration,
          steps_completed: trace.steps.length,
          dharma_warnings: dharmaResult.warning_count,
          rate_remaining: rateResult.remaining
        }
      };

    } catch (error) {
      console.error(`[KERNEL] Execution error:`, error.message);
      return this._buildErrorResponse('KERNEL_ERROR', error.message, trace, 500);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PIPELINE HELPERS
  // ═══════════════════════════════════════════════════════════

  async _validateSession(userNodeId, sessionToken, deviceId) {
    // Session is valid if we have a user_node_id (JWT already validated by middleware)
    if (!userNodeId) return { valid: false, error: 'No user node ID provided' };

    // If device_id provided, check trust
    if (deviceId) {
      const trust = await this.multiDeviceSync.getDeviceTrust(userNodeId, deviceId);
      if (trust.is_trusted === false) {
        return { valid: false, error: 'Device not trusted' };
      }
    }

    return { valid: true };
  }

  async _loadUserNode(userNodeIdOrOwner) {
    try {
      // Try loading via nodeFactory first
      const factoryResult = await NodeFactory.loadUserNode(userNodeIdOrOwner);
      if (factoryResult.success) {
        const node = factoryResult.user_node;
        // Decode blobs for easy access
        node._dna = decodeFromBlob(node.dna_blob);
        node._fieldMap = decodeFromBlob(node.field_map);
        node._permBlob = decodeFromBlob(node.perm_blob);
        return node;
      }

      // Fallback to cache-first approach if factory fails
      let data = await this.nodeCache.getNodeByOwnerId(userNodeIdOrOwner);
      let nodeData = data?.node;
      
      // If not found by owner_id, try by nid_hash
      if (!data) {
        data = await this.nodeCache.getNodeByNidHash(userNodeIdOrOwner);
      }

      // If still nothing, do the full active-state query (won't be in cache if inactive)
      if (!data) {
        const nodeQuery = await this.nodeFactory.queryNodes({ owner_id: userNodeIdOrOwner, node_state: 'ACTIVE' });
        data = nodeQuery.length > 0 ? nodeQuery[0] : null;
      }
      
      if (!nodeData) nodeData = data; 
      
      if (nodeData) {
        // Decode blobs for easy access
        data._dna = decodeFromBlob(nodeData.dna_blob);
        data._fieldMap = decodeFromBlob(nodeData.field_map);
        data._permBlob = decodeFromBlob(nodeData.perm_blob);
      }

      // If still no data, try recovery: recreate node_core
      if (!data) {
        console.warn(`[KERNEL] User node not found for ${userNodeIdOrOwner}, attempting recovery...`);
        try {
          const nodeCoreManager = new NodeCoreManager();
          const recovered = await nodeCoreManager.initializeUserNode(userNodeIdOrOwner, {
            email: 'recovery@botmantra.com',
            name: 'Recovered User',
            age: 18
          });
          if (recovered?.success) {
            console.log(`[KERNEL] Successfully recovered node_core for ${userNodeIdOrOwner}`);
            // Now load the newly created node
            const recoveredQuery = await this.nodeFactory.queryNodes({ owner_id: userNodeIdOrOwner, node_state: 'ACTIVE' });
            const recoveredData = recoveredQuery.length > 0 ? recoveredQuery[0] : null;
            if (recoveredData) {
              data = recoveredData;
              data._dna = decodeFromBlob(recoveredData.dna_blob);
              data._fieldMap = decodeFromBlob(recoveredData.field_map);
              data._permBlob = decodeFromBlob(recoveredData.perm_blob);
            }
          }
        } catch (recoveryErr) {
          console.warn(`[KERNEL] Recovery failed: ${recoveryErr.message}`);
        }
      }

      // Final fallback: return minimal default node
      if (!data) {
        console.warn(`[KERNEL] Using default fallback node for ${userNodeIdOrOwner}`);
        data = this._getDefaultUserNode(userNodeIdOrOwner);
      }

      return data;
    } catch (err) {
      console.error(`[KERNEL] Error loading user node: ${err.message}`);
      return this._getDefaultUserNode(userNodeIdOrOwner);
    }
  }

  async _loadNode(nidHash) {
    // Cache-first
    let data = await this.nodeCache.getNodeByNidHash(nidHash);

    if (!data) {
      // Fallback to NodeFactory
      const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: nidHash });
      data = nodeQuery.length > 0 ? nodeQuery[0] : null;
    }

    if (data) {
      data._dna = decodeFromBlob(data.dna_blob);
      data._fieldMap = decodeFromBlob(data.field_map);
    }
    return data;
  }

  /**
   * Create default user node when nothing else available
   * Ensures kernel never fails to load a user (fallback to default profile)
   */
  _getDefaultUserNode(userId) {
    const crypto = require('crypto');
    return {
      row_id: 0,
      owner_id: userId,
      nid_hash: crypto.createHash('sha256').update(userId).digest('hex'),
      node_type: 'user',
      node_state: 'ACTIVE',
      brand_root: 'vanshawali',
      dna_blob: null,
      field_map: null,
      perm_blob: null,
      memory_blob: null,
      vec_embedding: null,
      karma_score: 0,
      trust_score: 50,
      parent_nid_hash: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _dna: { brand_scope: 'vanshawali' },
      _fieldMap: { 
        email: 'recovery@botmantra.com',
        name: 'Recovered User',
        age: 18,
        brand_root: 'vanshawali'
      },
      _permBlob: {
        role: 'basic_user',
        can_create_posts: true,
        can_send_messages: true,
        can_join_groups: true,
        can_view_social: true
      }
    };
  }

  _resolveBrand(userNode, payload) {
    // Priority: payload.brand_scope > DNA brand > BOTMANTRA
    if (payload.brand_scope) return payload.brand_scope;
    if (payload.brand) return payload.brand;
    if (userNode._dna?.brand_scope) return userNode._dna.brand_scope;
    return 'BOTMANTRA';
  }

  _isChild(userNode) {
    const fm = userNode._fieldMap || {};
    return fm.profile_type === 'child' || fm.role === 'child' || (fm.age && fm.age < 13);
  }

  async _logExecution(executionId, userNode, actionType, result, trace, startTime) {
    const duration = Date.now() - startTime;
    try {
      await this.db
        .from('node_execution_log')
        .insert({
          execution_id: executionId,
          nid_hash: userNode.nid_hash,
          owner_id: userNode.owner_id,
          action_type: actionType,
          status: result.success ? 'success' : 'failed',
          duration_ms: duration,
          steps: trace.steps,
          error: result.error || null,
          created_at: new Date().toISOString()
        });
    } catch {
      // Fallback to ai_execution_log
      try {
        await this.db
          .from('ai_execution_log')
          .insert({
            user_id: userNode.owner_id,
            action: actionType,
            status: result.success ? 'success' : 'failed',
            duration_ms: duration,
            metadata: { execution_id: executionId, steps: trace.steps.length },
            created_at: new Date().toISOString()
          });
      } catch { /* silent */ }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // AI ACTION LOGGING METHODS
  // ═══════════════════════════════════════════════════════════

  async _logActionLog(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: userNode.owner_id,
        node_code: payload.node_code || userNode.nid_hash,
        action_type: payload.action_type || payload.action,
        target_table: payload.target_table,
        input_payload: payload.input_payload || payload,
        status: error ? 'failed' : 'success',
        error_message: error,
        executed_at: new Date().toISOString(),
        duration_ms: duration,
        operation: operation,
        created_at: new Date().toISOString()
      };

      await this.db.from('ai_action_logs').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI action:', logError.message);
    }
  }

  async _logActionRequest(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        business_id: payload.business_id || userNode.owner_id,
        user_id: userNode.owner_id,
        node_code: payload.node_code || userNode.nid_hash,
        action_type: payload.action_type,
        target_table: payload.target_table,
        input_payload: payload.input_payload || payload,
        status: error ? 'failed' : (payload.status || 'pending'),
        error_message: error,
        executed_at: payload.executed_at || new Date().toISOString(),
        duration_ms: duration,
        operation: operation,
        created_at: new Date().toISOString()
      };

      await this.db.from('ai_action_requests').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI action request:', logError.message);
    }
  }

  async _logActionWhitelist(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        table_name: payload.table_name,
        allowed_actions: payload.allowed_actions || (result && result.allowed_actions),
        description: payload.description || `Whitelist ${operation} operation`,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        operation: operation,
        user_id: userNode.owner_id,
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        status: error ? 'failed' : 'success',
        error_message: error,
        created_at: new Date().toISOString()
      };

      await this.db.from('ai_action_whitelist').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI action whitelist:', logError.message);
    }
  }

  async _logAgentRules(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        rule_name: payload.rule_name || (result && result.rule_name),
        trigger_type: payload.trigger_type || (result && result.trigger_type),
        condition_json: payload.condition_json || (result && result.condition_json),
        action_json: payload.action_json || (result && result.action_json),
        description: payload.description || `Agent rule ${operation} operation`,
        priority: payload.priority || (result && result.priority) || 1,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        operation: operation,
        user_id: userNode.owner_id,
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        status: error ? 'failed' : 'success',
        error_message: error,
        created_at: new Date().toISOString()
      };

      await this.db.from('ai_agent_rules').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI agent rules:', logError.message);
    }
  }

  async _logAgentTemplates(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        name: payload.name || (result && result.name),
        description: payload.description || `Agent template ${operation} operation`,
        system_prompt: payload.system_prompt || (result && result.system_prompt),
        rag_enabled: payload.rag_enabled !== undefined ? payload.rag_enabled : (result && result.rag_enabled),
        tools: payload.tools || (result && result.tools) || [],
        model_config: payload.model_config || (result && result.model_config) || {},
        temperature: payload.temperature || (result && result.temperature) || 0.7,
        max_tokens: payload.max_tokens || (result && result.max_tokens) || 1000,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        version: payload.version || (result && result.version) || '1.0.0',
        operation: operation,
        user_id: userNode.owner_id,
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        status: error ? 'failed' : 'success',
        error_message: error,
        created_at: new Date().toISOString()
      };

      await this.db.from('ai_agent_templates').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI agent templates:', logError.message);
    }
  }

  async _logAppRequests(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: payload.user_id || (result && result.user_id),
        business_id: payload.business_id || (result && result.business_id),
        app_name: payload.app_name || (result && result.app_name),
        description: payload.description || `App request ${operation} operation`,
        status: payload.status || (result && result.status) || 'pending',
        ai_response: payload.ai_response || (result && result.ai_response) || {},
        request_type: payload.request_type || (result && result.request_type) || 'general',
        priority: payload.priority || (result && result.priority) || 'normal',
        feedback_rating: payload.feedback_rating || (result && result.feedback_rating),
        operation: operation,
        user_id_log: userNode.owner_id,
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        status_log: error ? 'failed' : 'success',
        error_message: error,
        created_at: new Date().toISOString()
      };

      await this.db.from('ai_app_requests').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log AI app requests:', logError.message);
    }
  }

  _buildErrorResponse(code, details, trace, httpStatus = 400) {
    return {
      success: false,
      error: {
        code,
        details,
        step: trace.steps[trace.steps.length - 1] || 'init',
        steps_completed: trace.steps.length
      },
      execution_id: trace.execution_id,
      httpStatus,
      meta: {
        started_at: trace.started_at,
        failed_at: new Date().toISOString()
      }
    };
  }

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n  // VECTOR NODE MANAGEMENT HELPERS\n  // Manages memory_blob + vec_embedding in node_core\n  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n\n  /**\n   * Check and validate vector node data from node_core\n   * Returns: { valid: boolean, vectorData: object|null, needsUpdate: boolean }\n   */\n  async _validateVectorNode(nidHash) {\n    try {\n      const node = await this.nodeFactory.loadUserNode(nidHash);\n      if (!node) return { valid: false, vectorData: null, needsUpdate: false };\n\n      // Check if memory_blob contains valid data\n      if (node.memory_blob) {\n        try {\n          const vectorData = decodeFromBlob(node.memory_blob);\n          const hasEmbedding = !!node.vec_embedding;\n          return {\n            valid: true,\n            vectorData,\n            needsUpdate: !hasEmbedding // Need to generate embedding if missing\n          };\n        } catch (e) {\n          console.warn('[KERNEL] Memory blob decode error:', e.message);\n        }\n      }\n\n      return { valid: false, vectorData: null, needsUpdate: true };\n    } catch (error) {\n      console.warn('[KERNEL] Vector validation failed:', error.message);\n      return { valid: false, vectorData: null, needsUpdate: false };\n    }\n  }\n\n  /**\n   * Initialize or update vector node in node_core\n   * Stores vector data in memory_blob (bytea) and vec_embedding (pgvector)\n   */\n  async _initializeVectorNode(nidHash, ownerID, initialData = {}) {\n    try {\n      const { encodeToBlob } = require('./node-schema');\n\n      const vectorData = {\n        memory_type: 'user_context',\n        user_id: ownerID,\n        nid_hash: nidHash,\n        initialized_at: new Date().toISOString(),\n        embeddings: [],\n        last_updated: new Date().toISOString(),\n        ...initialData\n      };\n\n      // Encode to bytea\n      const memoryBlob = encodeToBlob(vectorData);\n\n      // Update node using NodeFactory\n      await this.nodeFactory.updateNode(nidHash, {\n        memory_blob: memoryBlob,\n        updated_at: new Date().toISOString()\n      }, ownerID);\n\n      return { success: true, vectorData };\n    } catch (error) {\n      console.warn('[KERNEL] Vector node initialization failed:', error.message);\n      return { success: false };\n    }\n  }

  // ═══════════════════════════════════════════════════════════
  // EXPOSE SUB-ENGINES (for routes)
  // ═══════════════════════════════════════════════════════════
  getPermissionEngine()  { return this.permissionEngine; }
  getKarmaEngine()       { return this.karmaEngine; }
  getDharmaValidator()   { return this.dharmaValidator; }
  getNodeSync()          { return this.nodeSync; }
  getPromptEvolution()   { return this.promptEvolution; }
  getVectorManager()     { return this.vectorManager; }
  getMultiDeviceSync()   { return this.multiDeviceSync; }
  getTrustEngine()       { return this.trustEngine; }
  getRiskPredictor()     { return this.riskPredictor; }
  getLayoutEvolution()   { return this.layoutEvolution; }
  getNodeGraph()         { return this.nodeGraph; }
  getGossipNetwork()     { return this.gossipNetwork; }
  getNodeCache()         { return this.nodeCache; }

  // ═════════════════════════════════════════════════════════════
  // API KEY METHODS
  // ═════════════════════════════════════════════════════════════

  async _createApiKey(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiKeysNode } = require('./api-keys');
      const result = await apiKeysNode.createAPIKey(payload, payload.node_code);

      await this._logApiKey('create', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiKey('create', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _queryApiKeys(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiKeysNode } = require('./api-keys');
      const result = await apiKeysNode.queryAPIKeys(payload.criteria || {}, payload.options || {});

      await this._logApiKey('query', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiKey('query', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _validateApiKey(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiKeysNode } = require('./api-keys');
      const result = await apiKeysNode.validateAPIKey(payload.api_key, payload.user_id);

      await this._logApiKey('validate', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiKey('validate', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _updateApiKey(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiKeysNode } = require('./api-keys');
      const result = await apiKeysNode.updateAPIKey(payload.node_code, payload.updates, payload.user_id);

      await this._logApiKey('update', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiKey('update', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _revokeApiKey(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiKeysNode } = require('./api-keys');
      const result = await apiKeysNode.revokeAPIKey(payload.node_code, payload.user_id);

      await this._logApiKey('revoke', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiKey('revoke', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _getApiKeyStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiKeysNode } = require('./api-keys');
      const result = await apiKeysNode.getAPIKeyStats(payload.user_id);

      await this._logApiKey('stats', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiKey('stats', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // API LOGS METHODS
  // ═════════════════════════════════════════════════════════════

  async _createApiLog(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiLogsNode } = require('./api-logs');
      const result = await apiLogsNode.createAPILog(payload, payload.node_code);

      await this._logApiLog('create', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiLog('create', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _queryApiLogs(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiLogsNode } = require('./api-logs');
      const result = await apiLogsNode.queryAPILogs(payload.criteria || {}, payload.options || {});

      await this._logApiLog('query', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiLog('query', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _getApiLogsByEndpoint(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiLogsNode } = require('./api-logs');
      const result = await apiLogsNode.getLogsByEndpoint(payload.endpoint, payload.user_id, payload.options || {});

      await this._logApiLog('query_endpoint', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiLog('query_endpoint', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _getApiLogsByUser(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiLogsNode } = require('./api-logs');
      const result = await apiLogsNode.getLogsByUser(payload.user_id, payload.options || {});

      await this._logApiLog('query_user', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiLog('query_user', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _getApiUsageStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiLogsNode } = require('./api-logs');
      const result = await apiLogsNode.getAPIUsageStats(payload.user_id, payload.time_range);

      await this._logApiLog('usage_stats', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiLog('usage_stats', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _cleanupApiLogs(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiLogsNode } = require('./api-logs');
      const result = await apiLogsNode.cleanupOldLogs(payload.days_old || 30);

      await this._logApiLog('cleanup', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiLog('cleanup', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // API RATE LIMIT METHODS
  // ═════════════════════════════════════════════════════════════

  async _checkRateLimit(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRateLimitNode } = require('./api-rate-limit');
      const result = await apiRateLimitNode.checkRateLimit(
        payload.user_id,
        payload.endpoint,
        payload.ip_address,
        payload.nid_hash
      );

      await this._logRateLimit('check', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logRateLimit('check', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _updateRateLimit(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRateLimitNode } = require('./api-rate-limit');
      const result = await apiRateLimitNode.updateRateLimit(
        payload.user_id,
        payload.endpoint,
        payload.ip_address,
        payload.nid_hash
      );

      await this._logRateLimit('update', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logRateLimit('update', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _resetRateLimit(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRateLimitNode } = require('./api-rate-limit');
      const result = await apiRateLimitNode.resetRateLimit(payload.user_id, payload.endpoint);

      await this._logRateLimit('reset', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logRateLimit('reset', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _getRateLimitStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRateLimitNode } = require('./api-rate-limit');
      const result = await apiRateLimitNode.getRateLimitStats(payload.user_id);

      await this._logRateLimit('stats', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logRateLimit('stats', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _cleanupRateLimits(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRateLimitNode } = require('./api-rate-limit');
      const result = await apiRateLimitNode.cleanupExpiredRateLimits(payload.hours_old || 24);

      await this._logRateLimit('cleanup', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logRateLimit('cleanup', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // API ROUTES METHODS
  // ═════════════════════════════════════════════════════════════

  async _createApiRoute(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRoutesNode } = require('./api-routes');
      const result = await apiRoutesNode.createAPIRoute(payload, payload.node_code);

      await this._logApiRoute('create', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiRoute('create', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _queryApiRoutes(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRoutesNode } = require('./api-routes');
      const result = await apiRoutesNode.queryAPIRoutes(payload.criteria || {}, payload.options || {});

      await this._logApiRoute('query', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiRoute('query', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _updateApiRoute(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRoutesNode } = require('./api-routes');
      const result = await apiRoutesNode.updateAPIRoute(payload.path, payload.method, payload.updates);

      await this._logApiRoute('update', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiRoute('update', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _checkRoutePermissions(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRoutesNode } = require('./api-routes');
      const result = await apiRoutesNode.checkRoutePermissions(
        payload.path,
        payload.method,
        payload.user_permissions || []
      );

      await this._logApiRoute('check_permissions', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiRoute('check_permissions', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _deactivateApiRoute(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRoutesNode } = require('./api-routes');
      const result = await apiRoutesNode.deactivateAPIRoute(payload.path, payload.method);

      await this._logApiRoute('deactivate', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiRoute('deactivate', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _getRoutesByPermissions(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRoutesNode } = require('./api-routes');
      const result = await apiRoutesNode.getRoutesByPermissions(payload.permissions, payload.options || {});

      await this._logApiRoute('query_permissions', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiRoute('query_permissions', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  async _getApiRouteStats(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { apiRoutesNode } = require('./api-routes');
      const result = await apiRoutesNode.getRouteStats();

      await this._logApiRoute('stats', userNode, payload, result, startTime);
      return result;
    } catch (error) {
      await this._logApiRoute('stats', userNode, payload, null, startTime, error.message);
      throw error;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // API LOGGING METHODS
  // ═════════════════════════════════════════════════════════════

  async _logApiKey(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: payload.user_id || userNode.owner_id,
        endpoint: '/api/api-keys',
        request_data: { operation, ...payload },
        response_data: result ? { success: true, data: result } : { success: false, error },
        status: error ? 'error' : 'success',
        ip_address: payload.ip_address || 'system',
        user_agent: 'KernelExecutor',
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        operation: operation,
        created_at: new Date().toISOString()
      };

      await this.db.from('api_logs').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log API key operation:', logError.message);
    }
  }

  async _logApiLog(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: payload.user_id || userNode.owner_id,
        endpoint: '/api/api-logs',
        request_data: { operation, ...payload },
        response_data: result ? { success: true, data: result } : { success: false, error },
        status: error ? 'error' : 'success',
        ip_address: payload.ip_address || 'system',
        user_agent: 'KernelExecutor',
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        operation: operation,
        created_at: new Date().toISOString()
      };

      await this.db.from('api_logs').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log API log operation:', logError.message);
    }
  }

  async _logRateLimit(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: payload.user_id || userNode.owner_id,
        endpoint: '/api/api-rate-limit',
        request_data: { operation, ...payload },
        response_data: result ? { success: true, data: result } : { success: false, error },
        status: error ? 'error' : 'success',
        ip_address: payload.ip_address || 'system',
        user_agent: 'KernelExecutor',
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        operation: operation,
        created_at: new Date().toISOString()
      };

      await this.db.from('api_logs').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log rate limit operation:', logError.message);
    }
  }

  async _logApiRoute(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: payload.user_id || userNode.owner_id,
        endpoint: '/api/api-routes',
        request_data: { operation, ...payload },
        response_data: result ? { success: true, data: result } : { success: false, error },
        status: error ? 'error' : 'success',
        ip_address: payload.ip_address || 'system',
        user_agent: 'KernelExecutor',
        node_code: payload.node_code || userNode.nid_hash,
        duration_ms: duration,
        operation: operation,
        created_at: new Date().toISOString()
      };

      await this.db.from('api_logs').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log API route operation:', logError.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LOCATION-BASED NODE DISCOVERY ACTIONS
  // ═══════════════════════════════════════════════════════════

  async _findNearestNodes(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const NodeDiscovery = require('./node-discovery');
      const discovery = new NodeDiscovery(this.db, null, this.nodeFactory);

      const { latitude, longitude, maxDistance = 50, limit = 10 } = payload;

      if (!latitude || !longitude) {
        return {
          success: false,
          action: 'find_nearest_nodes',
          error: 'Latitude and longitude are required'
        };
      }

      const result = await discovery.findNearestByLocation(latitude, longitude, {
        maxDistance,
        limit
      });

      // Log the discovery operation
      await this._logLocationDiscovery('find_nearest', userNode, payload, result, startTime);

      return {
        success: result.success,
        action: 'find_nearest_nodes',
        nodes: result.nodes || [],
        total_found: result.total_found || 0,
        criteria: { latitude, longitude, maxDistance }
      };
    } catch (error) {
      await this._logLocationDiscovery('find_nearest', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'find_nearest_nodes',
        error: error.message
      };
    }
  }

  async _selectBestNode(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const NodeDiscovery = require('./node-discovery');
      const discovery = new NodeDiscovery(this.db, null, this.nodeFactory);

      const result = await discovery.selectBestNode({
        criteria: payload.criteria || 'performance',
        userLocation: payload.userLocation,
        nodeType: payload.nodeType
      });

      // Log the selection operation
      await this._logLocationDiscovery('select_best', userNode, payload, result, startTime);

      return {
        success: result.success,
        action: 'select_best_node',
        node: result.node || null,
        selection_criteria: result.selection_criteria,
        selected_at: result.selected_at
      };
    } catch (error) {
      await this._logLocationDiscovery('select_best', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'select_best_node',
        error: error.message
      };
    }
  }

  async _syncGeographic(userNode, payload, context) {
    const startTime = Date.now();
    try {
      const { latitude, longitude } = payload;

      if (!latitude || !longitude) {
        return {
          success: false,
          action: 'sync_geographic',
          error: 'User location (latitude, longitude) is required'
        };
      }

      // Get the kernel instance to access nodeSync with discovery
      const kernel = context.kernel;
      if (!kernel || !kernel.nodeSync) {
        return {
          success: false,
          action: 'sync_geographic',
          error: 'Kernel nodeSync not available'
        };
      }

      const result = await kernel.nodeSync.syncGeographicNearest(userNode, {
        latitude,
        longitude
      }, {
        maxDistance: payload.maxDistance || 50,
        syncData: payload.syncData !== false,
        notifyNodes: payload.notifyNodes !== false
      });

      // Log the sync operation
      await this._logLocationDiscovery('sync_geographic', userNode, payload, result, startTime);

      return {
        success: result.success,
        action: 'sync_geographic',
        ...result
      };
    } catch (error) {
      await this._logLocationDiscovery('sync_geographic', userNode, payload, null, startTime, error.message);
      return {
        success: false,
        action: 'sync_geographic',
        error: error.message
      };
    }
  }

  async _logLocationDiscovery(operation, userNode, payload, result, startTime, error = null) {
    const duration = Date.now() - startTime;
    try {
      const logData = {
        user_id: userNode.owner_id,
        endpoint: `/api/location/${operation}`,
        request_data: { operation, ...payload },
        response_data: result ? { success: true, data: result } : { success: false, error },
        status: error ? 'error' : 'success',
        ip_address: payload.ip_address || 'system',
        user_agent: 'NodeDiscovery',
        node_code: userNode.nid_hash,
        duration_ms: duration,
        operation: `location_${operation}`,
        created_at: new Date().toISOString()
      };

      await this.db.from('api_logs').insert(logData);
    } catch (logError) {
      console.warn('[KERNEL] Failed to log location discovery:', logError.message);
    }
  }
}

module.exports = {
  KernelExecutor,
  RateLimiter,
  ActionExecutors
};
