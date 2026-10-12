/**
 * Supabase Database Configuration & Schema Mapping
 * Connected to: api.mantravat.cloud
 * Database: postgres
 * User: supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use environment variable or fallback to working URL
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api.mantravat.cloud';
const SUPABASE_KEY = process.env.SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Database schema mapping for all available tables
 * Total tables: 183
 */
const dbSchema = {
  // Authentication & Users
  users: 'id, email, phone, name, avatar_url, metadata, created_at, updated_at',
  auth_identity: 'id, user_id, identity_data, provider, created_at',
  business_users: 'id, user_id, business_id, role, permissions, created_at',
  user_preferences: 'id, user_id, preferences, created_at',
  user_templates: 'id, user_id, template_id, custom_settings, created_at',
  
  // Business Management
  businesses: 'id, name, description, logo_url, metadata, created_at, updated_at',
  business_templates: 'id, business_id, template_code, is_default, config, created_at',
  business_domains: 'id, business_id, domain, is_verified, created_at',
  business_functions: 'id, business_id, function_name, config, created_at',
  
  // Chat & Messages
  ai_chat_sessions: 'id, user_id, title, metadata, created_at, updated_at',
  ai_chat_messages: 'id, session_id, role, content, metadata, created_at',
  whatsapp_sessions: 'id, user_id, phone, metadata, created_at, updated_at',
  whatsapp_messages: 'id, session_id, direction, message_type, content, created_at',
  chat_history: 'id, user_id, participant_ids, messages, created_at, updated_at',
  
  // Node Management (Complex system)
  node_core: 'row_id, owner_id, nid_hash, dna_blob, field_map, status, created_at, updated_at',
  node_permission: 'id, nid_hash, owner_id, permission_type, granted_to, created_at',
  node_wallet: 'wallet_id, owner_id, balance, currency, created_at, updated_at',
  node_time_billing: 'bill_id, owner_id, minutes_used, rate_per_hour, total_amount, created_at',
  node_execution_log: 'exec_id, nid_hash, action_name, status, created_at',
  
  // AI & Automation
  ai_agent_templates: 'id, name, description, system_prompt, rag_enabled, tools, created_at',
  ai_knowledge_base: 'id, agent_id, content, metadata, embedding, created_at',
  ai_action_requests: 'id, user_id, action_type, parameters, status, created_at',
  ai_session_memory: 'id, session_id, memory_data, created_at',
  system_prompt_templates: 'id, name, prompt_text, version, created_at',
  
  // Permissions & Roles
  roles: 'id, name, description, permissions, created_at',
  permissions: 'id, name, description, scope, created_at',
  role_permissions: 'id, role_id, permission_id, created_at',
  
  // UI Templates & Configuration
  ui_templates: 'id, template_code, template_name, layout, created_at',
  ui_themes: 'id, business_id, theme_name, colors, fonts, spacing, created_at',
  business_templates: 'id, business_id, template_code, config, created_at',
  
  // Vector & Embeddings (for RAG)
  vector_documents: 'id, user_id, document_name, content, created_at',
  vector_chunks: 'id, document_id, chunk_text, embedding, created_at',
  
  // Additional Important Tables
  api_keys: 'id, user_id, key_hash, name, last_used, created_at',
  payments: 'id, user_id, amount, currency, status, created_at',
  subscriptions: 'id, user_id, plan_id, status, started_at, ended_at, created_at',
};

/**
 * Get Supabase client instance
 */
function getSupabaseClient() {
  return supabase;
}

/**
 * Query a specific table
 * @param {string} tableName - Name of the table
 * @param {object} options - Query options (select, filter, etc.)
 */
async function queryTable(tableName, options = {}) {
  try {
    let query = supabase.from(tableName).select(options.select || '*');
    
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending !== false });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Insert data into a table
 * @param {string} tableName - Name of the table
 * @param {object} data - Data to insert
 */
async function insertData(tableName, data) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert([data])
      .select();
    
    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update data in a table
 * @param {string} tableName - Name of the table
 * @param {object} filter - Filter conditions
 * @param {object} data - Data to update
 */
async function updateData(tableName, filter, data) {
  try {
    let query = supabase.from(tableName).update(data);
    
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) throw error;
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete data from a table
 * @param {string} tableName - Name of the table
 * @param {object} filter - Filter conditions
 */
async function deleteData(tableName, filter) {
  try {
    let query = supabase.from(tableName).delete();
    
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { error } = await query;
    
    if (error) throw error;
    return { success: true, message: 'Data deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  supabase,
  dbSchema,
  getSupabaseClient,
  queryTable,
  insertData,
  updateData,
  deleteData,
};
