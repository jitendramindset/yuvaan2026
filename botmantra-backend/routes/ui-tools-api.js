/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 UI TOOLS API - AI-Powered UI Generation & Management
 * ═══════════════════════════════════════════════════════════════
 * 
 * Purpose: Complete UI lifecycle management with AI assistance
 * Features:
 * - Generate UI from AI prompts
 * - Adjust/Modify existing UI configurations
 * - Archive (soft delete) UI for users
 * - Permanent delete for admins only
 * - Add/manage tables via AI
 * - System prompt execution based on input flow
 * - User memory for chat history
 * - Integration with all database functions
 * 
 * Auth: LOGIN REQUIRED (with role-based permissions)
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

/**
 * ═══════════════════════════════════════════════════════════════
 * DATABASE FUNCTION TOOLS - Organized by 12 Engine Groups
 * ═══════════════════════════════════════════════════════════════
 */
const DB_TOOLS = {
  // ═══════════════════════════════════════════════════════════════
  // 1️⃣ AI CONTEXT + PROMPT ENGINE
  // Pipeline: Query → Vector Search → Context Expansion → Prompt Builder → AI
  // ═══════════════════════════════════════════════════════════════
  aiContext: {
    buildAiContext: { fn: 'build_ai_context', params: ['p_business_id', 'p_query_embedding'], returns: 'text', desc: 'Build AI context from embeddings' },
    buildAiPrompt: { fn: 'build_ai_prompt', params: ['in_nid', 'in_user_prompt'], returns: 'text', desc: 'Construct safe AI prompts' },
    buildRagContext: { fn: 'build_rag_context', params: ['p_business_id', 'p_query_embedding'], returns: 'text', desc: 'Build RAG context layer' },
    expandContext: { fn: 'expand_context', params: ['p_doc_id', 'p_heading', 'p_sub_heading'], returns: 'table', desc: 'Heading-based context expansion' },
    searchAiContext: { fn: 'search_ai_context', params: ['p_business_id', 'p_query_embedding', 'p_limit'], returns: 'table', desc: 'Vector search AI context' },
    searchPrimaryContext: { fn: 'search_primary_context', params: ['p_business_id', 'p_query_embedding', 'p_limit'], returns: 'table', desc: 'Search primary context layer' },
    searchKnowledge: { fn: 'search_knowledge', params: ['query_embedding', 'owner', 'limit_count'], returns: 'table', desc: 'Knowledge base vector search' },
    semanticCacheLookup: { fn: 'semantic_cache_lookup', params: ['p_business_id', 'p_embedding', 'p_min_similarity'], returns: 'table', desc: 'Semantic cache reuse' },
    generateSummaryHash: { fn: 'generate_summary_hash', params: ['p_query', 'p_context'], returns: 'text', desc: 'Generate hash for summary caching' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 2️⃣ TEMPLATE QUERY ENGINE (UI + DATA RENDER CORE)
  // Pipeline: UI Template → Safe SQL Builder → Permission Filter → Pagination → Cache → UI
  // ═══════════════════════════════════════════════════════════════
  templateQuery: {
    buildTemplateQuery: { fn: 'build_template_query', params: ['p_template_code', 'p_table_name', 'p_business_id', 'p_filters'], returns: 'text', desc: 'Build safe SQL from template' },
    generateDynamicQuery: { fn: 'generate_dynamic_query', params: ['p_template_code', 'p_business_id', 'p_filters'], returns: 'text', desc: 'Dynamic SQL generator' },
    runTemplateQuery: { fn: 'run_template_query', params: ['p_template_code', 'p_table_name', 'p_business_id', 'p_filters'], returns: 'jsonb', desc: 'Execute template query' },
    runTemplateQueryPaged: { fn: 'run_template_query_paged', params: ['p_template_code', 'p_table_name', 'p_business_id', 'p_role_id', 'p_filters', 'p_sort_by', 'p_sort_dir', 'p_limit', 'p_offset'], returns: 'jsonb', desc: 'Paginated template query' },
    runTemplateQueryCached: { fn: 'run_template_query_cached', params: ['p_template_code', 'p_table_name', 'p_business_id', 'p_role_id', 'p_filters', 'p_sort_by', 'p_sort_dir', 'p_limit', 'p_offset', 'p_cache_ttl'], returns: 'jsonb', desc: 'Cached template query' },
    runTemplateCount: { fn: 'run_template_count', params: ['p_template_code', 'p_table_name', 'p_business_id', 'p_filters'], returns: 'integer', desc: 'Count template results' },
    runSecureTemplate: { fn: 'run_secure_template', params: ['p_user_id', 'p_template_code', 'p_business_id', 'p_filters'], returns: 'text', desc: 'Permission-checked template execution' },
    resolveDashboardQuery: { fn: 'resolve_dashboard_query', params: ['p_query', 'p_business_id'], returns: 'text', desc: 'Resolve dashboard query' },
    buildAutoJoinClause: { fn: 'build_auto_join_clause', params: ['p_base_table', 'p_business_id'], returns: 'text', desc: 'Auto-generate JOIN clauses' },
    getTemplateColumns: { fn: 'get_template_columns', params: ['p_template_code', 'p_table_name'], returns: 'text', desc: 'Get template column list' },
    getTemplateFilters: { fn: 'get_template_filters', params: ['p_template_code', 'p_table_name', 'p_filters'], returns: 'text', desc: 'Get template filter clause' },
    getSortableColumns: { fn: 'get_sortable_columns', params: ['p_template_code', 'p_table_name', 'p_role_id'], returns: 'text[]', desc: 'Get role-based sortable columns' },
    validateTemplateSchema: { fn: 'validate_template_schema', params: ['p_template_code', 'p_business_id'], returns: 'boolean', desc: 'Validate template schema' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 3️⃣ DASHBOARD + KPI ENGINE
  // Purpose: Real-time dashboards, Cached KPI, Role-based layouts
  // ═══════════════════════════════════════════════════════════════
  dashboard: {
    buildKpiQuery: { fn: 'build_kpi_query', params: ['p_kpi_id', 'p_business_id'], returns: 'text', desc: 'Build KPI SQL query' },
    runKpi: { fn: 'run_kpi', params: ['p_kpi_id', 'p_business_id'], returns: 'jsonb', desc: 'Execute KPI query' },
    loadDashboard: { fn: 'load_dashboard', params: ['p_business_id', 'p_role_id'], returns: 'jsonb', desc: 'Load complete dashboard' },
    loadDashboardKpis: { fn: 'load_dashboard_kpis', params: ['p_business_id'], returns: 'jsonb', desc: 'Load dashboard KPIs' },
    loadDashboardKpisCached: { fn: 'load_dashboard_kpis_cached', params: ['p_business_id', 'p_cache_ttl'], returns: 'jsonb', desc: 'Load cached KPIs' },
    loadDashboardWidget: { fn: 'load_dashboard_widget', params: ['p_widget_id', 'p_business_id', 'p_role_id'], returns: 'jsonb', desc: 'Load single dashboard widget' },
    getActiveDashboardTemplate: { fn: 'get_active_dashboard_template', params: ['p_user_id', 'p_business_id'], returns: 'uuid', desc: 'Get active dashboard template' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 4️⃣ UI LAYOUT + RENDER ENGINE
  // Pipeline: User → Default Template → Layout Resolver → Widget Position → UI Render
  // ═══════════════════════════════════════════════════════════════
  uiLayout: {
    getUiContext: { fn: 'get_ui_context', params: ['p_user_id', 'p_business_id'], returns: 'jsonb', desc: 'Get UI context for user' },
    getUiSchema: { fn: 'get_ui_schema', params: ['p_business_id', 'p_template_code', 'p_table_name', 'p_role_id'], returns: 'jsonb', desc: 'Get UI schema config' },
    loadDynamicTemplateUi: { fn: 'load_dynamic_template_ui', params: ['p_user_id', 'p_business_id'], returns: 'jsonb', desc: 'Load dynamic UI template' },
    loadTemplateData: { fn: 'load_template_data', params: ['p_user_id', 'p_business_id'], returns: 'jsonb', desc: 'Load template data' },
    loadWidgetLayout: { fn: 'load_widget_layout', params: ['p_user_id', 'p_business_id', 'p_template_id'], returns: 'table', desc: 'Load widget positions' },
    saveWidgetLayout: { fn: 'save_widget_layout', params: ['p_user_id', 'p_business_id', 'p_template_id', 'p_widget_id', 'p_x', 'p_y', 'p_w', 'p_h', 'p_hidden'], returns: 'void', desc: 'Save widget layout' },
    setUserDefaultTemplate: { fn: 'set_user_default_template', params: ['p_user_id', 'p_business_id', 'p_template_code'], returns: 'void', desc: 'Set user default template (by code)' },
    setUserDefaultTemplateById: { fn: 'set_user_default_template', params: ['p_user_id', 'p_business_id', 'p_template_id'], returns: 'void', desc: 'Set user default template (by UUID)' },
    resolveActiveTemplate: { fn: 'resolve_active_template', params: ['p_user_id', 'p_business_id'], returns: 'text', desc: 'Resolve active template for user' },
    resolveTemplateContext: { fn: 'resolve_template_context', params: ['p_user_id', 'p_business_id'], returns: 'jsonb', desc: 'Get template context' },
    inferUiComponent: { fn: 'infer_ui_component', params: ['p_data_type'], returns: 'text', desc: 'Infer UI component from data type' },
    createWidgetsFromAi: { fn: 'create_widgets_from_ai', params: ['p_template_id', 'p_widgets'], returns: 'void', desc: 'AI-generated widget creation' },
    getWidgetData: { fn: 'get_widget_data', params: ['p_widget_id', 'p_business_id'], returns: 'jsonb', desc: 'Get widget data' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 5️⃣ PERMISSION + SECURITY ENGINE
  // Pipeline: User → Role → Table → Action → Allow/Deny
  // ═══════════════════════════════════════════════════════════════
  permission: {
    checkActionPermission: { fn: 'check_action_permission', params: ['p_business_id', 'p_user_id', 'p_table', 'p_action'], returns: 'boolean', desc: 'Check table action permission' },
    hasTablePermission: { fn: 'has_table_permission', params: ['p_user_id', 'p_business_id', 'p_table', 'p_action'], returns: 'boolean', desc: 'Has table permission' },
    checkFeatureAccess: { fn: 'check_feature_access', params: ['p_business_id', 'p_feature_key'], returns: 'boolean', desc: 'Check feature access' },
    validateApiAccess: { fn: 'validate_api_access', params: ['p_business_id', 'p_route_code', 'p_http_method'], returns: 'boolean', desc: 'Validate API route access' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 6️⃣ BUSINESS BOOTSTRAP + SCHEMA ENGINE
  // Purpose: Low-code Business Generator Engine
  // ═══════════════════════════════════════════════════════════════
  businessBootstrap: {
    fnRegisterBusinessV1: { fn: 'fn_register_business_v1', params: ['p_name', 'p_description', 'p_industry', 'p_category', 'p_business_size', 'p_module_selection'], returns: 'uuid', desc: 'Register new business' },
    fnInitializeBusinessV1: { fn: 'fn_initialize_business_v1', params: ['p_business_id'], returns: 'void', desc: 'Initialize business' },
    fnCreateBusinessSchemaV1: { fn: 'fn_create_business_schema_v1', params: ['p_business_id', 'p_schema_name'], returns: 'void', desc: 'Create business schema' },
    fnCreateBusinessTables: { fn: 'fn_create_business_tables', params: ['p_business_id'], returns: 'void', desc: 'Create business tables' },
    fnBuildBusinessTablesV1: { fn: 'fn_build_business_tables_v1', params: ['p_schema_name'], returns: 'void', desc: 'Build business tables' },
    fnSeedBusinessTemplatesV1: { fn: 'fn_seed_business_templates_v1', params: ['p_business_id', 'p_created_by'], returns: 'void', desc: 'Seed business templates' },
    generateSchemaFromBlueprint: { fn: 'generate_schema_from_blueprint', params: ['p_blueprint', 'p_business_id'], returns: 'void', desc: 'Generate schema from blueprint' },
    syncTemplateRegistry: { fn: 'sync_template_registry', params: [], returns: 'void', desc: 'Sync template registry' },
    syncDataModelRegistry: { fn: 'sync_data_model_registry', params: ['p_business_id', 'p_table_name', 'p_template_code'], returns: 'void', desc: 'Sync data model registry' },
    checkRegistryDuplicate: { fn: 'check_registry_duplicate', params: ['p_business_id', 'p_table_name', 'p_column_name', 'p_template_code'], returns: 'boolean', desc: 'Check for registry duplicates' },
    getBranding: { fn: 'get_branding', params: ['p_business_id'], returns: 'jsonb', desc: 'Get business branding' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 7️⃣ CACHE + PERFORMANCE ENGINE
  // Purpose: Query caching, AI response reuse, Performance optimization
  // ═══════════════════════════════════════════════════════════════
  cache: {
    generateCacheKey: { fn: 'generate_cache_key', params: ['p_template', 'p_table', 'p_role_id', 'p_filters', 'p_sort', 'p_limit', 'p_offset'], returns: 'text', desc: 'Generate cache key' },
    getCachedResult: { fn: 'get_cached_result', params: ['p_business_id', 'p_cache_key'], returns: 'jsonb', desc: 'Get cached result' },
    saveCachedResult: { fn: 'save_cached_result', params: ['p_business_id', 'p_cache_key', 'p_response', 'p_ttl_seconds'], returns: 'void', desc: 'Save result to cache' },
    saveSemanticCache: { fn: 'save_semantic_cache', params: ['p_business_id', 'p_query', 'p_embedding', 'p_answer'], returns: 'void', desc: 'Save semantic cache' },
    getCachedSummary: { fn: 'get_cached_summary', params: ['p_business_id', 'p_query_hash'], returns: 'text', desc: 'Get cached summary' },
    saveSummaryCache: { fn: 'save_summary_cache', params: ['p_business_id', 'p_query_hash', 'p_query', 'p_context', 'p_summary'], returns: 'void', desc: 'Save summary cache' },
    incrementSemanticHit: { fn: 'increment_semantic_hit', params: ['p_business_id', 'p_answer'], returns: 'void', desc: 'Increment semantic cache hit' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 8️⃣ USAGE + BILLING + LIMIT ENGINE
  // Purpose: Feature usage, Quota tracking, Billing hooks
  // ═══════════════════════════════════════════════════════════════
  usage: {
    checkUsageLimit: { fn: 'check_usage_limit', params: ['p_business_id', 'p_feature', 'p_limit'], returns: 'boolean', desc: 'Check usage limit' },
    incrementUsage: { fn: 'increment_usage', params: ['p_business_id', 'p_feature'], returns: 'void', desc: 'Increment usage counter' },
    increaseUsage: { fn: 'increase_usage', params: ['p_business_id', 'p_metric_key', 'p_value'], returns: 'void', desc: 'Increase usage by value' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 9️⃣ MEMORY ENGINE (AI PERSONALIZATION)
  // Purpose: Conversation continuity, Personalized AI, User behavioral context
  // ═══════════════════════════════════════════════════════════════
  memory: {
    loadUserMemory: { fn: 'load_user_memory', params: ['p_user'], returns: 'jsonb', desc: 'Load user memory' },
    saveUserMemory: { fn: 'save_user_memory', params: ['p_user', 'p_context', 'p_action'], returns: 'void', desc: 'Save user memory' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 🔟 PLUGIN + MARKETPLACE ENGINE
  // Purpose: Paid plugins, Feature marketplace, Extension system
  // ═══════════════════════════════════════════════════════════════
  plugin: {
    executePlugin: { fn: 'execute_plugin', params: ['p_business_id', 'p_plugin_code', 'p_role_id', 'p_payload'], returns: 'jsonb', desc: 'Execute plugin' },
    resolvePlugin: { fn: 'resolve_plugin', params: ['p_business_id', 'p_plugin_code', 'p_role_id'], returns: 'text', desc: 'Resolve plugin path' },
    installMarketplaceTemplate: { fn: 'install_marketplace_template', params: ['p_marketplace_id', 'p_user_id', 'p_business_id'], returns: 'uuid', desc: 'Install marketplace template' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 1️⃣1️⃣ WEB INGESTION ENGINE
  // Purpose: Website scraping, Knowledge ingestion, Vector creation
  // ═══════════════════════════════════════════════════════════════
  webIngestion: {
    ingestWebSource: { fn: 'ingest_web_source', params: ['p_owner', 'p_url', 'p_api_key'], returns: 'text', desc: 'Ingest web source to knowledge base' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 1️⃣2️⃣ COMPLIANCE ENGINE
  // Purpose: Legal data deletion, Compliance requirements
  // ═══════════════════════════════════════════════════════════════
  compliance: {
    gdprDeleteUser: { fn: 'gdpr_delete_user', params: ['p_user_id'], returns: 'void', desc: 'GDPR compliant user deletion' },
  },

  // ═══════════════════════════════════════════════════════════════
  // 🔥 RAG EXECUTION ENGINE (Combined AI + Data)
  // Purpose: Full RAG pipeline execution
  // ═══════════════════════════════════════════════════════════════
  ragEngine: {
    runRagEngine: { fn: 'run_rag_engine', params: ['p_user', 'p_agent', 'p_question'], returns: 'jsonb', desc: 'Execute full RAG pipeline' },
    executeAiAction: { fn: 'execute_ai_action', params: ['p_action_id'], returns: 'jsonb', desc: 'Execute AI action' },
    buildSafeInsert: { fn: 'build_safe_insert', params: ['p_table', 'p_payload'], returns: 'text', desc: 'Build safe INSERT statement' },
  },
};

/**
 * ═══════════════════════════════════════════════════════════════
 * ENGINE FLOW PIPELINES - How engines connect
 * ═══════════════════════════════════════════════════════════════
 */
const ENGINE_FLOWS = {
  // UI → DATA FLOW
  uiDataFlow: [
    'User UI',
    'Template Resolver (uiLayout.resolveActiveTemplate)',
    'Permission Check (permission.hasTablePermission)',
    'Dynamic Query Builder (templateQuery.buildTemplateQuery)',
    'Cache Layer (cache.getCachedResult)',
    'Database',
    'UI Renderer'
  ],
  
  // AI RAG FLOW
  aiRagFlow: [
    'User Question',
    'Embedding Generation',
    'Primary Context Search (aiContext.searchPrimaryContext)',
    'Expanded Context (aiContext.expandContext)',
    'Semantic Cache Check (aiContext.semanticCacheLookup)',
    'Prompt Builder (aiContext.buildAiPrompt)',
    'AI Response (ragEngine.runRagEngine)',
    'Summary Cache Save (cache.saveSummaryCache)'
  ],
  
  // BUSINESS ONBOARD FLOW
  businessOnboardFlow: [
    'Register Business (businessBootstrap.fnRegisterBusinessV1)',
    'Create Schema (businessBootstrap.fnCreateBusinessSchemaV1)',
    'Seed Templates (businessBootstrap.fnSeedBusinessTemplatesV1)',
    'Create Registry (businessBootstrap.syncDataModelRegistry)',
    'Assign Permissions',
    'Enable UI'
  ]
};

/**
 * ═══════════════════════════════════════════════════════════════
 * SYSTEM PROMPTS - AI Input Flow Processing (12 Engines)
 * ═══════════════════════════════════════════════════════════════
 */
const SYSTEM_PROMPTS = {
  // 1️⃣ AI CONTEXT ENGINE
  ai_context: `You are an AI Context Engine assistant.
Pipeline: Query → Vector Search → Context Expansion → Prompt Builder → AI

Available tools: buildAiContext, buildAiPrompt, buildRagContext, expandContext, 
searchAiContext, searchPrimaryContext, searchKnowledge, semanticCacheLookup

Your job:
1. Build AI context from embeddings
2. Expand context using headings
3. Check semantic cache for reuse
4. Construct safe prompts

Output: Context object with relevance scores.`,

  // 2️⃣ TEMPLATE QUERY ENGINE
  template_query: `You are a Template Query Engine assistant.
Pipeline: UI Template → Safe SQL Builder → Permission Filter → Pagination → Cache → UI

Available tools: buildTemplateQuery, generateDynamicQuery, runTemplateQuery,
runTemplateQueryPaged, runSecureTemplate, buildAutoJoinClause, getSortableColumns

Your job:
1. Build safe SQL from templates
2. Apply permission filters
3. Handle pagination and sorting
4. Use cache when available

Output: Query results with pagination metadata.`,

  // 3️⃣ DASHBOARD ENGINE
  dashboard: `You are a Dashboard & KPI Engine assistant.
Purpose: Real-time dashboards, Cached KPI rendering, Role-based layouts

Available tools: buildKpiQuery, runKpi, loadDashboard, loadDashboardKpis,
loadDashboardKpisCached, loadDashboardWidget, getActiveDashboardTemplate

Your job:
1. Build and execute KPI queries
2. Load dashboard configurations
3. Apply role-based filtering
4. Optimize with caching

Output: Dashboard configuration with KPI data.`,

  // 4️⃣ UI LAYOUT ENGINE
  ui_layout: `You are a UI Layout Engine assistant.
Pipeline: User → Default Template → Layout Resolver → Widget Position → UI Render

Available tools: getUiContext, getUiSchema, loadDynamicTemplateUi, loadWidgetLayout,
saveWidgetLayout, setUserDefaultTemplate, resolveActiveTemplate, inferUiComponent,
createWidgetsFromAi, getWidgetData

Your job:
1. Resolve user's active template
2. Load widget positions
3. Infer components from data types
4. Generate AI-powered widgets

Output: Complete UI layout configuration.`,

  // 5️⃣ PERMISSION ENGINE
  permission: `You are a Permission & Security Engine assistant.
Pipeline: User → Role → Table → Action → Allow/Deny

Available tools: checkActionPermission, hasTablePermission, checkFeatureAccess,
validateApiAccess

Your job:
1. Validate user permissions
2. Check feature access
3. Validate API routes
4. Enforce security policies

Output: Permission result with reason.`,

  // 6️⃣ BUSINESS BOOTSTRAP ENGINE
  business_bootstrap: `You are a Business Bootstrap Engine assistant.
Purpose: Low-code Business Generator Engine

Available tools: fnRegisterBusinessV1, fnInitializeBusinessV1, fnCreateBusinessSchemaV1,
fnCreateBusinessTables, fnSeedBusinessTemplatesV1, generateSchemaFromBlueprint,
syncTemplateRegistry, syncDataModelRegistry, checkRegistryDuplicate

Your job:
1. Register new businesses
2. Create schemas and tables
3. Seed default templates
4. Sync registries

Output: Business setup status with IDs.`,

  // 7️⃣ CACHE ENGINE
  cache: `You are a Cache & Performance Engine assistant.
Purpose: Query caching, AI response reuse, Performance optimization

Available tools: generateCacheKey, getCachedResult, saveCachedResult,
saveSemanticCache, getCachedSummary, saveSummaryCache, incrementSemanticHit

Your job:
1. Generate unique cache keys
2. Retrieve cached results
3. Save responses to cache
4. Track cache hits

Output: Cached data or cache save confirmation.`,

  // 8️⃣ USAGE ENGINE
  usage: `You are a Usage & Billing Engine assistant.
Purpose: Feature usage tracking, Quota management, Billing hooks

Available tools: checkUsageLimit, incrementUsage, increaseUsage

Your job:
1. Check usage limits
2. Increment usage counters
3. Track billing metrics
4. Enforce quotas

Output: Usage status with limits.`,

  // 9️⃣ MEMORY ENGINE
  memory: `You are a Memory Engine assistant for AI Personalization.
Purpose: Conversation continuity, Personalized AI, User behavioral context

Available tools: loadUserMemory, saveUserMemory

Your job:
1. Load user's conversation history
2. Save new context
3. Maintain personalization
4. Track user behavior

Output: User memory context.`,

  // 🔟 PLUGIN ENGINE
  plugin: `You are a Plugin & Marketplace Engine assistant.
Purpose: Paid plugins, Feature marketplace, Extension system

Available tools: executePlugin, resolvePlugin, installMarketplaceTemplate

Your job:
1. Execute plugin code
2. Resolve plugin paths
3. Install marketplace templates
4. Manage extensions

Output: Plugin execution result.`,

  // 1️⃣1️⃣ WEB INGESTION ENGINE
  web_ingestion: `You are a Web Ingestion Engine assistant.
Purpose: Website scraping, Knowledge ingestion, Vector creation pipeline

Available tools: ingestWebSource

Your job:
1. Ingest web sources
2. Extract content
3. Create embeddings
4. Store in knowledge base

Output: Ingestion status with document IDs.`,

  // 1️⃣2️⃣ COMPLIANCE ENGINE
  compliance: `You are a Compliance Engine assistant.
Purpose: Legal data deletion, GDPR compliance

Available tools: gdprDeleteUser

Your job:
1. Handle user deletion requests
2. Ensure GDPR compliance
3. Remove all user data
4. Generate compliance reports

Output: Deletion confirmation with audit log.`,

  // COMBINED: UI GENERATION (uses multiple engines)
  ui_generation: `You are an AI UI Generator combining multiple engines.
Engines used: UI Layout + Template Query + Dashboard + Cache

Available tools from each:
- UI: getUiSchema, inferUiComponent, createWidgetsFromAi
- Template: buildTemplateQuery, getTemplateColumns
- Dashboard: loadDashboard, loadDashboardKpis
- Cache: getCachedResult, saveCachedResult

Your job:
1. Analyze user requirements
2. Infer optimal components
3. Generate widget configurations
4. Cache results for performance

Output: Complete UI configuration with components.`,

  // COMBINED: UI ADJUSTMENT
  ui_adjustment: `You are an AI UI Adjuster combining multiple engines.
Engines used: UI Layout + Permission + Memory

Your job:
1. Load current UI configuration
2. Check modification permissions
3. Apply user adjustments
4. Save to user memory
5. Validate changes

Output: Updated UI configuration with change log.`,

  // COMBINED: TABLE MANAGEMENT
  table_management: `You are an AI Table Manager combining multiple engines.
Engines used: Business Bootstrap + Permission + Template Query

Available tools:
- Bootstrap: generateSchemaFromBlueprint, syncDataModelRegistry
- Permission: checkActionPermission
- Template: validateTemplateSchema

Your job:
1. Validate admin permissions
2. Generate schema from blueprint
3. Sync registries
4. Create templates

Output: Table creation status.`,
};

/**
 * ═══════════════════════════════════════════════════════════════
 * AUTHENTICATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'botmantra-secret-key');
    req.user = decoded;

    // Get user from database
    const { data: user, error } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Try to get business roles (optional - may not exist)
    let isAdmin = ['Owner', 'Admin', 'SuperAdmin'].includes(user?.role);
    try {
      const { data: businessUsers } = await req.supabase
        .from('business_users')
        .select('business_id, role')
        .eq('user_id', decoded.userId);
      
      if (businessUsers) {
        isAdmin = isAdmin || businessUsers.some(bu => bu.role === 'admin');
      }
    } catch (e) {
      // business_users table may not exist or role column missing
    }

    // Fallback: admin_permissions table
    try {
      const { data: adminPerms } = await req.supabase
        .from('admin_permissions')
        .select('admin_id')
        .eq('admin_id', decoded.userId)
        .limit(1);
      if (adminPerms && adminPerms.length > 0) {
        isAdmin = true;
      }
    } catch (e) {
      // Continue without admin_permissions check
    }

    req.authenticatedUser = user;
    req.isAdmin = isAdmin;
    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
      details: error.message
    });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * OPTIONAL AUTH MIDDLEWARE (for endpoints that work with/without login)
 * ═══════════════════════════════════════════════════════════════
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // No token - continue as guest
      req.authenticatedUser = null;
      req.isAdmin = false;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'botmantra-secret-key');
    req.user = decoded;

    // Get user from database
    const { data: user, error } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      // Invalid token - continue as guest
      req.authenticatedUser = null;
      req.isAdmin = false;
      return next();
    }

    // Try to get business roles
    let isAdmin = ['Owner', 'Admin', 'SuperAdmin'].includes(user?.role);
    try {
      const { data: businessUsers } = await req.supabase
        .from('business_users')
        .select('business_id, role')
        .eq('user_id', decoded.userId);
      
      if (businessUsers) {
        isAdmin = isAdmin || businessUsers.some(bu => bu.role === 'admin');
      }
    } catch (e) {
      // Continue without admin check
    }

    // Fallback: admin_permissions table
    try {
      const { data: adminPerms } = await req.supabase
        .from('admin_permissions')
        .select('admin_id')
        .eq('admin_id', decoded.userId)
        .limit(1);
      if (adminPerms && adminPerms.length > 0) {
        isAdmin = true;
      }
    } catch (e) {
      // Continue without admin_permissions check
    }

    req.authenticatedUser = user;
    req.isAdmin = isAdmin;
    next();

  } catch (error) {
    // Token verification failed - continue as guest
    req.authenticatedUser = null;
    req.isAdmin = false;
    next();
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN-ONLY MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 */
const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Check if user has existing data
 * ═══════════════════════════════════════════════════════════════
 */
async function checkUserExistingData(supabase, userId, businessId) {
  const results = {
    hasData: false,
    uiTemplates: 0,
    dashboards: 0,
    widgets: 0,
    memory: null
  };

  try {
    // Check UI templates
    const { data: templates, count: templateCount } = await supabase
      .from('ui_templates')
      .select('id', { count: 'exact' })
      .or(`created_by.eq.${userId},user_id.eq.${userId}`)
      .limit(1);
    
    results.uiTemplates = templateCount || 0;

    // Check dashboards (if table exists)
    try {
      const { count: dashCount } = await supabase
        .from('dashboard_templates')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .limit(1);
      results.dashboards = dashCount || 0;
    } catch (e) { /* table may not exist */ }

    // Check widgets (if table exists)
    try {
      const { count: widgetCount } = await supabase
        .from('widgets')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .limit(1);
      results.widgets = widgetCount || 0;
    } catch (e) { /* table may not exist */ }

    // Check user memory
    const memoryResult = await executeDbFunction(supabase, 'load_user_memory', { p_user: userId });
    results.memory = memoryResult.success ? memoryResult.data : null;

    results.hasData = results.uiTemplates > 0 || results.dashboards > 0 || results.widgets > 0 || !!results.memory;

  } catch (error) {
    console.error('Error checking user data:', error);
  }

  return results;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Update UI ownership with user_id and business_id
 * ═══════════════════════════════════════════════════════════════
 */
async function updateUiOwnership(supabase, uiId, userId, businessId) {
  try {
    const { error } = await supabase
      .from('ui_templates')
      .update({
        user_id: userId,
        business_id: businessId,
        updated_at: new Date()
      })
      .eq('id', uiId);

    if (error) {
      console.error('Error updating UI ownership:', error);
    }
    return !error;
  } catch (error) {
    console.error('Exception updating UI ownership:', error);
    return false;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Get suggestions for guest users
 * ═══════════════════════════════════════════════════════════════
 */
function getSuggestionsForGuest(intent) {
  const baseSuggestions = [
    { action: 'login', title: '🔐 Login to Save', description: 'Sign in to save your work and access all features' },
    { action: 'signup', title: '✨ Create Account', description: 'Get started with a free account' }
  ];

  const intentSuggestions = {
    dashboard_builder: [
      ...baseSuggestions,
      { action: 'preview', title: '👀 Preview Dashboards', description: 'See sample dashboard layouts before signing up' }
    ],
    ui_generation: [
      ...baseSuggestions,
      { action: 'preview', title: '🎨 View Templates', description: 'Browse UI templates available' }
    ],
    data_query: [
      ...baseSuggestions,
      { action: 'preview', title: '📊 Sample Queries', description: 'See example data queries' }
    ],
    default: baseSuggestions
  };

  return intentSuggestions[intent] || intentSuggestions.default;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Get suggestions for new users with no data
 * ═══════════════════════════════════════════════════════════════
 */
function getNewUserSuggestions(intent) {
  const suggestions = {
    dashboard_builder: [
      { action: 'create_dashboard', title: '📊 Create Your First Dashboard', description: 'Start with a blank dashboard or use a template', endpoint: '/api/ui-tools/generate' },
      { action: 'import_template', title: '📥 Import Template', description: 'Use a pre-built dashboard template' },
      { action: 'add_widget', title: '🧩 Add Widget', description: 'Add charts, tables, or KPI cards' }
    ],
    ui_generation: [
      { action: 'generate_table', title: '📋 Generate Table UI', description: 'Create a data table with AI', prompt: 'Create a simple data table' },
      { action: 'generate_form', title: '📝 Generate Form', description: 'Create an input form with AI', prompt: 'Create a contact form' },
      { action: 'generate_card', title: '🃏 Generate Card Layout', description: 'Create card-based layout', prompt: 'Create a product card grid' }
    ],
    data_query: [
      { action: 'list_tables', title: '📂 Browse Tables', description: 'See available data tables' },
      { action: 'sample_query', title: '🔍 Run Sample Query', description: 'Try a sample data query' }
    ],
    default: [
      { action: 'start_tutorial', title: '🎓 Quick Tutorial', description: 'Learn the basics in 2 minutes' },
      { action: 'create_first', title: '🚀 Create Something', description: 'Jump right in and create your first UI' },
      { action: 'browse_tools', title: '🔧 Explore Tools', description: 'See all 77+ available database functions', endpoint: '/api/ui-tools/tools' }
    ]
  };

  return suggestions[intent] || suggestions.default;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Detect login intent from message
 * ═══════════════════════════════════════════════════════════════
 */
function detectLoginIntent(message) {
  if (!message) return { isLoginAttempt: false };
  
  const msg = message.toLowerCase().trim();
  
  // Check if message contains login keywords
  const loginKeywords = ['login', 'signin', 'sign in', 'log in', 'authenticate'];
  const hasLoginKeyword = loginKeywords.some(kw => msg.includes(kw));
  
  if (!hasLoginKeyword) {
    return { isLoginAttempt: false };
  }

  // Try to extract credentials using various patterns
  let emailOrPhone = null;
  let password = null;

  // Pattern 1: email: xxx password: xxx
  const emailMatch = message.match(/email[:\s]+([^\s]+)/i);
  const phoneMatch = message.match(/phone[:\s]+([^\s]+)/i);
  const emailOrPhoneMatch = message.match(/emailOrPhone[:\s]+([^\s]+)/i);
  const passwordMatch = message.match(/password[:\s]+([^\s]+)/i);

  emailOrPhone = emailMatch?.[1] || phoneMatch?.[1] || emailOrPhoneMatch?.[1];
  password = passwordMatch?.[1];

  // Pattern 2: login with xxx and xxx
  if (!emailOrPhone || !password) {
    const withPattern = message.match(/login\s+(?:with\s+)?([^\s]+)\s+(?:and\s+|password\s*:?\s*)([^\s]+)/i);
    if (withPattern) {
      emailOrPhone = emailOrPhone || withPattern[1];
      password = password || withPattern[2];
    }
  }

  // Pattern 3: Simple format - login email password
  if (!emailOrPhone || !password) {
    const simplePattern = message.match(/login\s+([^\s]+@[^\s]+)\s+([^\s]+)/i);
    if (simplePattern) {
      emailOrPhone = emailOrPhone || simplePattern[1];
      password = password || simplePattern[2];
    }
  }

  if (emailOrPhone && password) {
    return {
      isLoginAttempt: true,
      credentials: {
        emailOrPhone: emailOrPhone.replace(/[,;]$/, ''), // Remove trailing punctuation
        password: password.replace(/[,;]$/, '')
      }
    };
  }

  return { isLoginAttempt: true, credentials: null };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Perform login via chat
 * ═══════════════════════════════════════════════════════════════
 */
async function performChatLogin(supabase, credentials) {
  const crypto = require('crypto');
  const jwt = require('jsonwebtoken');

  try {
    const { emailOrPhone, password } = credentials;

    // Find user by email or phone
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${emailOrPhone},mobile.eq.${emailOrPhone}`);

    if (error || !users || users.length === 0) {
      return { success: false, error: 'User not found. Please check your email/phone.' };
    }

    const user = users[0];

    // Hash password and verify
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    if (user.password !== hashedPassword && user.password_hash !== hashedPassword) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, iat: Date.now() },
      process.env.JWT_SECRET || 'botmantra-secret-key',
      { expiresIn: '7d' }
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        mobile: user.mobile
      },
      token
    };

  } catch (error) {
    console.error('Chat login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Execute Database Function
 * ═══════════════════════════════════════════════════════════════
 */
async function executeDbFunction(supabase, functionName, params = {}) {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`❌ DB Function Error [${functionName}]:`, error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`❌ DB Function Exception [${functionName}]:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Load User Memory
 * ═══════════════════════════════════════════════════════════════
 */
async function loadUserMemory(supabase, userId) {
  const result = await executeDbFunction(supabase, 'load_user_memory', { p_user: userId });
  return result.success ? result.data : null;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Save User Memory
 * ═══════════════════════════════════════════════════════════════
 */
async function saveUserMemory(supabase, userId, context, action) {
  return executeDbFunction(supabase, 'save_user_memory', {
    p_user: userId,
    p_context: context,
    p_action: action
  });
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER: Process AI Request with System Prompt
 * ═══════════════════════════════════════════════════════════════
 */
async function processAIRequest(supabase, userId, businessId, promptType, userMessage, context = {}) {
  // Load user memory for context
  const userMemory = await loadUserMemory(supabase, userId);
  
  // Build AI context
  const aiContextResult = await executeDbFunction(supabase, 'get_ui_context', {
    p_user_id: userId,
    p_business_id: businessId
  });
  
  // Get system prompt
  const systemPrompt = SYSTEM_PROMPTS[promptType] || SYSTEM_PROMPTS.ui_generation;
  
  // Build complete prompt
  const fullPrompt = `
${systemPrompt}

User Memory: ${JSON.stringify(userMemory || {})}
UI Context: ${JSON.stringify(aiContextResult.data || {})}
Additional Context: ${JSON.stringify(context)}

User Request: ${userMessage}
`;

  // Try to use build_ai_prompt if NID is provided
  if (context.nid) {
    const promptResult = await executeDbFunction(supabase, 'build_ai_prompt', {
      in_nid: context.nid,
      in_user_prompt: userMessage
    });
    if (promptResult.success) {
      return { prompt: promptResult.data, userMemory, systemPrompt };
    }
  }

  return { prompt: fullPrompt, userMemory, systemPrompt };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * API ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * POST /api/ui-tools/generate
 * Generate UI from AI prompt
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { message, context = {}, businessId } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    console.log('🎨 Generating UI:', { userId, message });

    // Check feature access
    const hasAccess = await executeDbFunction(supabase, 'check_feature_access', {
      p_business_id: businessId,
      p_feature_key: 'ui_generation'
    });

    if (!hasAccess.success || !hasAccess.data) {
      return res.status(403).json({
        success: false,
        error: 'UI generation feature not available for this business'
      });
    }

    // Process AI request
    const aiRequest = await processAIRequest(supabase, userId, businessId, 'ui_generation', message, context);

    // Get UI schema for reference
    const uiSchema = await executeDbFunction(supabase, 'get_ui_schema', {
      p_business_id: businessId,
      p_template_code: context.templateCode || 'default',
      p_table_name: context.tableName || null,
      p_role_id: context.roleId || null
    });

    // Infer UI components based on data types
    const componentInferences = [];
    if (context.dataTypes) {
      for (const dataType of context.dataTypes) {
        const inference = await executeDbFunction(supabase, 'infer_ui_component', {
          p_data_type: dataType
        });
        componentInferences.push({ dataType, component: inference.data });
      }
    }

    // Generate UI configuration
    const uiConfig = {
      id: `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt: message,
      schema: uiSchema.data,
      components: componentInferences,
      layout: context.layout || 'auto',
      theme: context.theme || 'default',
      createdBy: userId,
      createdAt: new Date(),
      status: 'active'
    };

    // Save to database
    const { data: savedUi, error: saveError } = await supabase
      .from('ui_templates')
      .insert({
        id: uiConfig.id,
        template_code: uiConfig.id,
        template_name: `AI Generated - ${message.substring(0, 50)}`,
        layout: uiConfig,
        created_at: new Date()
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Save user memory
    await saveUserMemory(supabase, userId, {
      lastAction: 'ui_generation',
      generatedUiId: uiConfig.id,
      prompt: message,
      timestamp: new Date()
    }, 'generate_ui');

    // Increment usage
    await executeDbFunction(supabase, 'increment_usage', {
      p_business_id: businessId,
      p_feature: 'ui_generation'
    });

    res.json({
      success: true,
      ui: savedUi,
      config: uiConfig,
      aiContext: aiRequest
    });

  } catch (error) {
    console.error('❌ UI Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/adjust
 * Adjust existing UI configuration
 */
router.post('/adjust', requireAuth, async (req, res) => {
  try {
    const { uiId, adjustments, message, businessId } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    console.log('🔧 Adjusting UI:', { userId, uiId, adjustments });

    // Check permission
    const hasPermission = await executeDbFunction(supabase, 'has_table_permission', {
      p_user_id: userId,
      p_business_id: businessId,
      p_table: 'ui_templates',
      p_action: 'update'
    });

    if (!hasPermission.success || !hasPermission.data) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied for UI adjustment'
      });
    }

    // Get existing UI
    const { data: existingUi, error: fetchError } = await supabase
      .from('ui_templates')
      .select('*')
      .eq('id', uiId)
      .single();

    if (fetchError || !existingUi) {
      return res.status(404).json({
        success: false,
        error: 'UI not found'
      });
    }

    // Process AI adjustment request
    const aiRequest = await processAIRequest(supabase, userId, businessId, 'ui_adjustment', message, {
      currentUi: existingUi,
      adjustments
    });

    // Apply adjustments
    const updatedLayout = {
      ...existingUi.layout,
      ...adjustments,
      lastModifiedBy: userId,
      lastModifiedAt: new Date()
    };

    // Update in database
    const { data: updatedUi, error: updateError } = await supabase
      .from('ui_templates')
      .update({
        layout: updatedLayout,
        updated_at: new Date()
      })
      .eq('id', uiId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Save user memory
    await saveUserMemory(supabase, userId, {
      lastAction: 'ui_adjustment',
      adjustedUiId: uiId,
      adjustments,
      timestamp: new Date()
    }, 'adjust_ui');

    res.json({
      success: true,
      ui: updatedUi,
      changes: adjustments,
      aiContext: aiRequest
    });

  } catch (error) {
    console.error('❌ UI Adjustment Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/archive
 * Archive (soft delete) UI - Available to all users
 */
router.post('/archive', requireAuth, async (req, res) => {
  try {
    const { uiId, businessId } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    console.log('📦 Archiving UI:', { userId, uiId });

    // Check permission
    const hasPermission = await executeDbFunction(supabase, 'has_table_permission', {
      p_user_id: userId,
      p_business_id: businessId,
      p_table: 'ui_templates',
      p_action: 'archive'
    });

    // Get existing UI to check ownership
    const { data: existingUi, error: fetchError } = await supabase
      .from('ui_templates')
      .select('*')
      .eq('id', uiId)
      .single();

    if (fetchError || !existingUi) {
      return res.status(404).json({
        success: false,
        error: 'UI not found'
      });
    }

    // Update status to archived
    const { data: archivedUi, error: archiveError } = await supabase
      .from('ui_templates')
      .update({
        layout: {
          ...existingUi.layout,
          status: 'archived',
          archivedBy: userId,
          archivedAt: new Date()
        }
      })
      .eq('id', uiId)
      .select()
      .single();

    if (archiveError) throw archiveError;

    // Save user memory
    await saveUserMemory(supabase, userId, {
      lastAction: 'ui_archive',
      archivedUiId: uiId,
      timestamp: new Date()
    }, 'archive_ui');

    res.json({
      success: true,
      message: 'UI archived successfully',
      ui: archivedUi
    });

  } catch (error) {
    console.error('❌ UI Archive Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ui-tools/delete
 * Permanently delete UI - ADMIN ONLY
 */
router.delete('/delete', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { uiId } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    console.log('🗑️ Deleting UI (Admin):', { userId, uiId });

    // Permanently delete
    const { error: deleteError } = await supabase
      .from('ui_templates')
      .delete()
      .eq('id', uiId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'UI permanently deleted'
    });

  } catch (error) {
    console.error('❌ UI Delete Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/table/add
 * Add new table using AI - ADMIN ONLY
 */
router.post('/table/add', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { tableName, schema, blueprint, businessId } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    console.log('📊 Adding Table (Admin):', { userId, tableName });

    // Check for duplicates
    const isDuplicate = await executeDbFunction(supabase, 'check_registry_duplicate', {
      p_business_id: businessId,
      p_table_name: tableName,
      p_column_name: null,
      p_template_code: 'default'
    });

    if (isDuplicate.data) {
      return res.status(400).json({
        success: false,
        error: 'Table already exists'
      });
    }

    // Generate schema from blueprint
    if (blueprint) {
      await executeDbFunction(supabase, 'generate_schema_from_blueprint', {
        p_blueprint: blueprint,
        p_business_id: businessId
      });
    }

    // Sync data model registry
    await executeDbFunction(supabase, 'sync_data_model_registry', {
      p_business_id: businessId,
      p_table_name: tableName,
      p_template_code: 'default'
    });

    res.json({
      success: true,
      message: `Table ${tableName} created successfully`,
      tableName
    });

  } catch (error) {
    console.error('❌ Table Add Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ui-tools/table/delete
 * Delete table - ADMIN ONLY
 */
router.delete('/table/delete', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { tableName, businessId } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    console.log('🗑️ Deleting Table (Admin):', { userId, tableName });

    // This would need custom SQL execution for dropping tables
    // For safety, we'll just remove from registry
    const { error } = await supabase
      .from('data_model_registry')
      .delete()
      .eq('business_id', businessId)
      .eq('table_name', tableName);

    if (error) throw error;

    res.json({
      success: true,
      message: `Table ${tableName} removed from registry`
    });

  } catch (error) {
    console.error('❌ Table Delete Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/chat
 * AI Chat with memory and tool execution
 * - Handles unauthenticated users with login prompt
 * - Can perform login if credentials provided in message
 * - Suggests actions if no data exists
 * - Updates UI tables with user_id and business_id
 */
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    // Handle various message field names (with or without trailing space typos)
    const rawMessage = req.body.message || req.body['message '] || req.body.msg || '';
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
    const businessId = req.body.businessId;
    const context = req.body.context || {};
    const supabase = req.supabase;
    const crypto = require('crypto');

    console.log('💬 UI Tools Chat:', { message, isAuthenticated: !!req.authenticatedUser });

    // Validate message
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        hint: 'Send a JSON body with "message" field, e.g., {"message": "hello"}'
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // CHECK IF USER WANTS TO LOGIN VIA CHAT
    // ═══════════════════════════════════════════════════════════════
    const loginIntent = detectLoginIntent(message);
    
    if (loginIntent.isLoginAttempt && loginIntent.credentials) {
      // Try to perform login
      const loginResult = await performChatLogin(supabase, loginIntent.credentials);
      
      if (loginResult.success) {
        return res.json({
          success: true,
          authenticated: true,
          loginPerformed: true,
          user: loginResult.user,
          token: loginResult.token,
          response: {
            message: `✅ Welcome back, ${loginResult.user.fullName || loginResult.user.email}! You're now logged in. What would you like to do?`,
            intent: 'login_success',
            suggestions: [
              { action: 'create_dashboard', title: '📊 Create Dashboard', description: 'Start building a dashboard' },
              { action: 'view_tools', title: '🔧 View Tools', description: 'See all 77+ available tools', endpoint: '/api/ui-tools/tools' },
              { action: 'chat', title: '💬 Continue Chat', description: 'Ask me anything!' }
            ]
          }
        });
      } else {
        return res.json({
          success: false,
          authenticated: false,
          loginPerformed: true,
          loginFailed: true,
          response: {
            message: `❌ Login failed: ${loginResult.error}. Please check your credentials and try again.`,
            intent: 'login_failed',
            suggestions: [
              { action: 'retry_login', title: '🔄 Try Again', description: 'Check email/password and retry' },
              { action: 'signup', title: '✨ Create Account', description: 'Sign up for a new account', endpoint: '/api/auth/signup' },
              { action: 'forgot_password', title: '🔑 Forgot Password', description: 'Reset your password', endpoint: '/api/auth/forgot-password' }
            ],
            hint: 'Format: login email: your@email.com password: yourpassword'
          }
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // CHECK IF USER IS LOGGED IN
    // ═══════════════════════════════════════════════════════════════
    if (!req.authenticatedUser) {
      // Analyze message to provide helpful suggestions
      const intent = detectIntent(message);
      const suggestions = getSuggestionsForGuest(intent);

      return res.json({
        success: true,
        authenticated: false,
        response: {
          message: "👋 Welcome! To access all features and save your work, please log in or sign up.\n\n💡 **Quick Login:** You can login via chat! Just type:\n`login email: your@email.com password: yourpassword`",
          loginRequired: true,
          intent,
          suggestions,
          availableActions: [
            { action: 'login', endpoint: '/api/auth/signin', description: 'Sign in with email/phone and password' },
            { action: 'chat_login', description: 'Type: login email: your@email.com password: yourpassword' },
            { action: 'signup', endpoint: '/api/auth/signup', description: 'Create a new account' },
            { action: 'explore', description: 'You can still browse available tools and features' }
          ],
          previewFeatures: [
            'View available UI tools and engines',
            'See sample dashboard layouts',
            'Explore template options'
          ]
        }
      });
    }

    const userId = req.authenticatedUser.id;
    const userEmail = req.authenticatedUser.email;

    // ═══════════════════════════════════════════════════════════════
    // LOAD USER MEMORY
    // ═══════════════════════════════════════════════════════════════
    const userMemory = await loadUserMemory(supabase, userId);

    // ═══════════════════════════════════════════════════════════════
    // CHECK IF USER HAS EXISTING DATA
    // ═══════════════════════════════════════════════════════════════
    const existingDataCheck = await checkUserExistingData(supabase, userId, businessId);
    
    // ═══════════════════════════════════════════════════════════════
    // GET UI CONTEXT
    // ═══════════════════════════════════════════════════════════════
    const uiContext = await executeDbFunction(supabase, 'get_ui_context', {
      p_user_id: userId,
      p_business_id: businessId
    });

    // ═══════════════════════════════════════════════════════════════
    // DETECT INTENT AND PROCESS
    // ═══════════════════════════════════════════════════════════════
    const intent = detectIntent(message);
    const aiRequest = await processAIRequest(supabase, userId, businessId, intent, message, context);

    // ═══════════════════════════════════════════════════════════════
    // EXECUTE TOOLS AND GET RESULTS
    // ═══════════════════════════════════════════════════════════════
    const toolResults = await executeToolsForIntent(supabase, intent, {
      userId,
      businessId,
      message,
      context
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE UI TABLES WITH USER_ID AND BUSINESS_ID
    // ═══════════════════════════════════════════════════════════════
    if (context.uiId || toolResults.generatedUiId) {
      const uiIdToUpdate = context.uiId || toolResults.generatedUiId;
      await updateUiOwnership(supabase, uiIdToUpdate, userId, businessId);
    }

    // ═══════════════════════════════════════════════════════════════
    // SAVE CHAT TO USER MEMORY
    // ═══════════════════════════════════════════════════════════════
    await saveUserMemory(supabase, userId, {
      lastMessage: message,
      intent,
      toolResults,
      timestamp: new Date()
    }, 'chat');

    // ═══════════════════════════════════════════════════════════════
    // BUILD RESPONSE WITH SUGGESTIONS IF NO DATA
    // ═══════════════════════════════════════════════════════════════
    let responseMessage = generateResponse(intent, toolResults);
    let suggestions = [];

    if (!existingDataCheck.hasData) {
      suggestions = getNewUserSuggestions(intent);
      responseMessage = `${responseMessage}\n\n💡 **Getting Started:** ${suggestions[0]?.description || 'Try creating your first dashboard!'}`;
    }

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: userId,
        email: userEmail
      },
      response: {
        message: responseMessage,
        intent,
        toolResults,
        userMemory,
        uiContext: uiContext.data,
        existingData: existingDataCheck,
        suggestions: !existingDataCheck.hasData ? suggestions : undefined
      }
    });

  } catch (error) {
    console.error('❌ Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-tools/memory
 * Get user memory
 */
router.get('/memory', requireAuth, async (req, res) => {
  try {
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    const memory = await loadUserMemory(supabase, userId);

    res.json({
      success: true,
      memory
    });

  } catch (error) {
    console.error('❌ Memory Load Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ui-tools/memory
 * Clear user memory
 */
router.delete('/memory', requireAuth, async (req, res) => {
  try {
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    await saveUserMemory(supabase, userId, {}, 'clear');

    res.json({
      success: true,
      message: 'Memory cleared'
    });

  } catch (error) {
    console.error('❌ Memory Clear Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-tools/dashboard
 * Load dashboard with KPIs and widgets
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const { businessId, roleId } = req.query;
    const supabase = req.supabase;

    // Load dashboard
    const dashboard = await executeDbFunction(supabase, 'load_dashboard', {
      p_business_id: businessId,
      p_role_id: roleId
    });

    // Load KPIs (cached)
    const kpis = await executeDbFunction(supabase, 'load_dashboard_kpis_cached', {
      p_business_id: businessId,
      p_cache_ttl: 60
    });

    res.json({
      success: true,
      dashboard: dashboard.data,
      kpis: kpis.data
    });

  } catch (error) {
    console.error('❌ Dashboard Load Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/widget/layout
 * Save widget layout
 */
router.post('/widget/layout', requireAuth, async (req, res) => {
  try {
    const { businessId, templateId, widgetId, x, y, w, h, hidden } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    await executeDbFunction(supabase, 'save_widget_layout', {
      p_user_id: userId,
      p_business_id: businessId,
      p_template_id: templateId,
      p_widget_id: widgetId,
      p_x: x,
      p_y: y,
      p_w: w,
      p_h: h,
      p_hidden: hidden || false
    });

    res.json({
      success: true,
      message: 'Widget layout saved'
    });

  } catch (error) {
    console.error('❌ Widget Layout Save Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-tools/widget/:widgetId
 * Get widget data
 */
router.get('/widget/:widgetId', requireAuth, async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { businessId } = req.query;
    const supabase = req.supabase;

    const widgetData = await executeDbFunction(supabase, 'get_widget_data', {
      p_widget_id: widgetId,
      p_business_id: businessId
    });

    res.json({
      success: true,
      widget: widgetData.data
    });

  } catch (error) {
    console.error('❌ Widget Data Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/template/run
 * Run template query
 */
router.post('/template/run', requireAuth, async (req, res) => {
  try {
    const { templateCode, tableName, businessId, roleId, filters, sortBy, sortDir, limit, offset } = req.body;
    const supabase = req.supabase;

    // Validate template schema
    const isValid = await executeDbFunction(supabase, 'validate_template_schema', {
      p_template_code: templateCode,
      p_business_id: businessId
    });

    if (!isValid.data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid template schema'
      });
    }

    // Run template query (cached)
    const result = await executeDbFunction(supabase, 'run_template_query_paged', {
      p_template_code: templateCode,
      p_table_name: tableName,
      p_business_id: businessId,
      p_role_id: roleId,
      p_filters: filters || {},
      p_sort_by: sortBy,
      p_sort_dir: sortDir || 'ASC',
      p_limit: limit || 20,
      p_offset: offset || 0
    });

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Template Run Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/kpi/run
 * Run KPI query
 */
router.post('/kpi/run', requireAuth, async (req, res) => {
  try {
    const { kpiId, businessId } = req.body;
    const supabase = req.supabase;

    const result = await executeDbFunction(supabase, 'run_kpi', {
      p_kpi_id: kpiId,
      p_business_id: businessId
    });

    res.json({
      success: true,
      kpi: result.data
    });

  } catch (error) {
    console.error('❌ KPI Run Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ui-tools/tools
 * Get available tools
 */
router.get('/tools', requireAuth, async (req, res) => {
  try {
    const toolList = [];
    
    for (const [category, tools] of Object.entries(DB_TOOLS)) {
      for (const [name, config] of Object.entries(tools)) {
        toolList.push({
          category,
          name,
          function: config.fn,
          params: config.params,
          returns: config.returns
        });
      }
    }

    res.json({
      success: true,
      tools: toolList,
      categories: Object.keys(DB_TOOLS),
      totalTools: toolList.length
    });

  } catch (error) {
    console.error('❌ Tools List Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/execute
 * Execute a specific tool function
 */
router.post('/execute', requireAuth, async (req, res) => {
  try {
    const { category, tool, params, businessId } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    // Get tool config
    const toolConfig = DB_TOOLS[category]?.[tool];
    
    if (!toolConfig) {
      return res.status(404).json({
        success: false,
        error: `Tool not found: ${category}.${tool}`
      });
    }

    // Check permission
    const hasPermission = await executeDbFunction(supabase, 'check_action_permission', {
      p_business_id: businessId,
      p_user_id: userId,
      p_table: 'tools',
      p_action: 'execute'
    });

    if (!hasPermission.data && !req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied for tool execution'
      });
    }

    // Execute tool
    const result = await executeDbFunction(supabase, toolConfig.fn, params);

    // Save to user memory
    await saveUserMemory(supabase, userId, {
      lastTool: `${category}.${tool}`,
      toolParams: params,
      toolResult: result.success,
      timestamp: new Date()
    }, 'tool_execution');

    res.json({
      success: result.success,
      data: result.data,
      error: result.error
    });

  } catch (error) {
    console.error('❌ Tool Execute Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ui-tools/rag
 * Run RAG engine
 */
router.post('/rag', requireAuth, async (req, res) => {
  try {
    const { question, agent } = req.body;
    const supabase = req.supabase;
    const userId = req.authenticatedUser.id;

    const result = await executeDbFunction(supabase, 'run_rag_engine', {
      p_user: userId,
      p_agent: agent || 'default',
      p_question: question
    });

    res.json({
      success: true,
      response: result.data
    });

  } catch (error) {
    console.error('❌ RAG Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════
 */

function detectIntent(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('create') || lower.includes('generate') || lower.includes('build')) {
    if (lower.includes('table')) return 'table_management';
    if (lower.includes('dashboard')) return 'dashboard_builder';
    if (lower.includes('template')) return 'template_manager';
    return 'ui_generation';
  }
  
  if (lower.includes('adjust') || lower.includes('modify') || lower.includes('change') || lower.includes('update')) {
    return 'ui_adjustment';
  }
  
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('archive')) {
    return 'ui_adjustment';
  }
  
  return 'ui_generation';
}

async function executeToolsForIntent(supabase, intent, context) {
  const results = [];
  
  switch (intent) {
    case 'ui_generation':
      // Get UI context
      results.push(await executeDbFunction(supabase, 'get_ui_context', {
        p_user_id: context.userId,
        p_business_id: context.businessId
      }));
      break;
      
    case 'dashboard_builder':
      // Load dashboard
      results.push(await executeDbFunction(supabase, 'load_dashboard', {
        p_business_id: context.businessId,
        p_role_id: null
      }));
      break;
      
    case 'template_manager':
      // Get active template
      results.push(await executeDbFunction(supabase, 'resolve_active_template', {
        p_user_id: context.userId,
        p_business_id: context.businessId
      }));
      break;
      
    default:
      break;
  }
  
  return results;
}

function generateResponse(intent, toolResults) {
  const responses = {
    ui_generation: 'I can help you generate a UI. Based on my analysis, here are the available options and configurations.',
    ui_adjustment: 'I can help you adjust your UI. Please specify what changes you\'d like to make.',
    table_management: 'I can help you manage tables. What table operations would you like to perform?',
    dashboard_builder: 'I can help you build a dashboard. Here are the available widgets and KPIs.',
    template_manager: 'I can help you manage templates. Here are your current templates and options.'
  };
  
  return responses[intent] || 'How can I help you with your UI?';
}

module.exports = router;
