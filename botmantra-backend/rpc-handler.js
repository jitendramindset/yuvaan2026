/**
 * Auto-generated RPC Route Handlers
 * DO NOT EDIT MANUALLY - Generated from function definitions
 */

const { createClient } = require('@supabase/supabase-js');

class RPCHandler {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Business Management Functions
  async registerBusiness(params) {
    return await this.supabase.rpc('fn_register_business_v1', params);
  }

  async createBusinessTables(businessId) {
    return await this.supabase.rpc('fn_create_business_tables', { p_business_id: businessId });
  }

  async initializeBusiness(businessId) {
    return await this.supabase.rpc('fn_initialize_business_v1', { p_business_id: businessId });
  }

  // API Handler Functions
  async apiGet(routeCode, businessId, roleId, filters = {}, sortBy = null, sortDir = 'ASC', limit = 20, offset = 0) {
    return await this.supabase.rpc('api_get_handler', {
      p_route_code: routeCode,
      p_business_id: businessId,
      p_role_id: roleId,
      p_filters: filters,
      p_sort_by: sortBy,
      p_sort_dir: sortDir,
      p_limit: limit,
      p_offset: offset
    });
  }

  async apiPost(routeCode, businessId, roleId, payload) {
    return await this.supabase.rpc('api_post_handler', {
      p_route_code: routeCode,
      p_business_id: businessId,
      p_role_id: roleId,
      p_payload: payload
    });
  }

  // Query Building Functions
  async buildTemplateQuery(templateCode, tableName, businessId, filters = {}) {
    return await this.supabase.rpc('build_template_query', {
      p_template_code: templateCode,
      p_table_name: tableName,
      p_business_id: businessId,
      p_filters: filters
    });
  }

  async buildKPIQuery(kpiId, businessId) {
    return await this.supabase.rpc('build_kpi_query', {
      p_kpi_id: kpiId,
      p_business_id: businessId
    });
  }

  async generateDynamicQuery(templateCode, businessId, filters = {}) {
    return await this.supabase.rpc('generate_dynamic_query', {
      p_template_code: templateCode,
      p_business_id: businessId,
      p_filters: filters
    });
  }

  // AI Functions
  async buildAIContext(businessId, queryEmbedding) {
    return await this.supabase.rpc('build_ai_context', {
      p_business_id: businessId,
      p_query_embedding: queryEmbedding
    });
  }

  async buildAIPrompt(nid, userPrompt) {
    return await this.supabase.rpc('build_ai_prompt', {
      in_nid: nid,
      in_user_prompt: userPrompt
    });
  }

  async buildRAGContext(businessId, queryEmbedding) {
    return await this.supabase.rpc('build_rag_context', {
      p_business_id: businessId,
      p_query_embedding: queryEmbedding
    });
  }

  async generateEmbedding(text) {
    return await this.supabase.rpc('generate_embedding', {
      input_text: text
    });
  }

  async executeAIAction(actionId) {
    return await this.supabase.rpc('execute_ai_action', {
      p_action_id: actionId
    });
  }

  // Permission Functions
  async checkActionPermission(businessId, userId, table, action) {
    return await this.supabase.rpc('check_action_permission', {
      p_business_id: businessId,
      p_user_id: userId,
      p_table: table,
      p_action: action
    });
  }

  async checkFeatureAccess(businessId, featureKey) {
    return await this.supabase.rpc('check_feature_access', {
      p_business_id: businessId,
      p_feature_key: featureKey
    });
  }

  async checkUsageLimit(businessId, feature, limit) {
    return await this.supabase.rpc('check_usage_limit', {
      p_business_id: businessId,
      p_feature: feature,
      p_limit: limit
    });
  }

  // Node Functions
  async generateNodeHash(ownerUuid) {
    return await this.supabase.rpc('generate_node_hash', {
      owner_uuid: ownerUuid
    });
  }

  async createRuntimeSession(nid, device, ip) {
    return await this.supabase.rpc('create_runtime_session', {
      in_nid: nid,
      in_device: device,
      in_ip: ip
    });
  }

  async aiDecide(nid) {
    return await this.supabase.rpc('ai_decide', {
      p_nid: nid
    });
  }

  async applyKarma(nidHash, actor, karmaDelta, trustDelta, reason) {
    return await this.supabase.rpc('apply_karma', {
      p_nid_hash: nidHash,
      p_actor: actor,
      p_karma_delta: karmaDelta,
      p_trust_delta: trustDelta,
      p_reason: reason
    });
  }

  async applyBilling(nid, action) {
    return await this.supabase.rpc('apply_billing', {
      p_nid: nid,
      p_action: action
    });
  }

  // UI Functions
  async getUISchema(businessId, templateCode, tableName, roleId) {
    return await this.supabase.rpc('get_ui_schema', {
      p_business_id: businessId,
      p_template_code: templateCode,
      p_table_name: tableName,
      p_role_id: roleId
    });
  }

  async getUIContext(userId, businessId) {
    return await this.supabase.rpc('get_ui_context', {
      p_user_id: userId,
      p_business_id: businessId
    });
  }

  async getWidgetData(widgetId, businessId) {
    return await this.supabase.rpc('get_widget_data', {
      p_widget_id: widgetId,
      p_business_id: businessId
    });
  }

  async getBranding(businessId) {
    return await this.supabase.rpc('get_branding', {
      p_business_id: businessId
    });
  }

  // Plugin Functions
  async executePlugin(businessId, pluginCode, roleId, payload) {
    return await this.supabase.rpc('execute_plugin', {
      p_business_id: businessId,
      p_plugin_code: pluginCode,
      p_role_id: roleId,
      p_payload: payload
    });
  }

  // Cache Functions
  async getCachedResult(businessId, cacheKey) {
    return await this.supabase.rpc('get_cached_result', {
      p_business_id: businessId,
      p_cache_key: cacheKey
    });
  }

  async generateCacheKey(template, table, roleId, filters, sort, limit, offset) {
    return await this.supabase.rpc('generate_cache_key', {
      p_template: template,
      p_table: table,
      p_role_id: roleId,
      p_filters: filters,
      p_sort: sort,
      p_limit: limit,
      p_offset: offset
    });
  }

  // Utility Functions
  async encryptPayload(payload, secret) {
    return await this.supabase.rpc('encrypt_payload', {
      p_payload: payload,
      p_secret: secret
    });
  }

  async decryptPayload(encrypted, secret) {
    return await this.supabase.rpc('decrypt_payload', {
      p_encrypted: encrypted,
      p_secret: secret
    });
  }

  async chunkText(text, chunkSize = 800) {
    return await this.supabase.rpc('chunk_text', {
      input_text: text,
      chunk_size: chunkSize
    });
  }

  // GDPR Functions
  async gdprDeleteUser(userId) {
    return await this.supabase.rpc('gdpr_delete_user', {
      p_user_id: userId
    });
  }
}

module.exports = RPCHandler;
