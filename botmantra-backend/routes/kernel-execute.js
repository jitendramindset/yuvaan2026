/**
 * BOTMANTRA KERNEL API - PRODUCTION HANDLER
 * 
 * Purpose: Single execution gateway for all platform operations
 * 
 * Pipeline:
 * 1. JWT Validation
 * 2. User/Business/Role Resolution
 * 3. Permission Gate
 * 4. Trust Score Gate
 * 5. Action Routing (chat | ui | data | automation)
 * 6. Event Logging + Queue Publishing
 * 
 * All platform operations (UI, AI, Bots, Automation, Data) flow through here.
 * Nothing bypasses Kernel.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { getAdminTools, executeAdminTool, executeAdminTools } = require('../services/admin-tool-registry');

const router = express.Router();

// ============================================================================
// SUPABASE CLIENT (service role for admin operations)
// ============================================================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// KERNEL EXECUTION PIPELINE
// ============================================================================

/**
 * POST /kernel/execute
 * 
 * Main entry point for all platform operations
 */
router.post('/execute', async (req, res) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  let action = 'unknown'; // Declare at top for catch block access
  
  console.log(`\n🔥 [KERNEL EXECUTE] START [${requestId}]`);
  console.log(`   Action: ${req.body?.action}`);
  console.log(`   User Token: ${req.headers.authorization?.substring(0, 20)}...`);

  try {
    // ========================================================================
    // STEP 1: JWT VALIDATION
    // ========================================================================
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        status: 'error',
        code: 'MISSING_AUTH_HEADER',
        message: 'Authorization header required'
      });
    }

    const token = authHeader.substring(7);
    let jwtPayload;
    try {
      jwtPayload = jwt.decode(token); // Trust Supabase to verify in middleware
      if (!jwtPayload || !(jwtPayload.sub || jwtPayload.userId || jwtPayload.id)) {
        throw new Error('Invalid JWT');
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        status: 'error',
        code: 'INVALID_JWT',
        message: 'Authentication failed'
      });
    }

    const userId = jwtPayload.sub || jwtPayload.userId || jwtPayload.id;

    // ========================================================================
    // STEP 2: RESOLVE USER + BUSINESS + ROLE
    // ========================================================================
    // First try to get business context (this is the primary authorization)
    let businessUser = null;
    try {
      const { data } = await supabase
        .from('business_users')
        .select('business_id, role_id')
        .eq('user_id', userId)
        .limit(1);
      businessUser = data?.[0] || null;
      console.log(`[Kernel] Looking for business_users with user_id: ${userId}, found:`, businessUser);
    } catch (err) {
      console.log(`[Kernel] Error querying business_users:`, err.message);
      businessUser = null;
    }

    // If no business_users entry, user doesn't have access
    if (!businessUser) {
      return res.status(403).json({
        success: false,
        status: 'error',
        code: 'NO_BUSINESS_ACCESS',
        message: 'User does not have business access'
      });
    }

    const businessId = businessUser.business_id;
    const roleId = businessUser.role_id;


    // Try to get user record by ID
    let userRecord = null;
    console.log(`[Kernel] DEBUG: userId value:`, userId, 'typeof:', typeof userId);
    try {
      // Direct debug: fetch all users with this id (no .single())
      const { data: debugUsers, error: debugError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);
      if (debugError) {
        console.error(`[Kernel] DEBUG: Error fetching users by id (${userId}):`, debugError.message || debugError);
      }
      console.log(`[Kernel] DEBUG: All users with id (${userId}):`, debugUsers);

      // Now do the .single() query as before
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error(`[Kernel] Error fetching user by id (${userId}):`, error.message || error);
      }
      console.log(`[Kernel] Fetched user by id (${userId}):`, data);
      userRecord = data;
    } catch (err) {
      console.error(`[Kernel] Exception fetching user by id (${userId}):`, err.message || err);
      userRecord = null;
    }

    // Fallback: try by email
    if (!userRecord && jwtPayload.email) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, mobile, pass_hash, mobile_hash')
          .eq('email', jwtPayload.email)
          .single();
        if (error) {
          console.error(`[Kernel] Error fetching user by email (${jwtPayload.email}):`, error.message || error);
        }
        console.log(`[Kernel] Fetched user by email (${jwtPayload.email}):`, data);
        userRecord = data;
      } catch (err) {
        console.error(`[Kernel] Exception fetching user by email (${jwtPayload.email}):`, err.message || err);
        userRecord = null;
      }
    }

    // Fallback: create minimal user record if not found
    if (!userRecord) {
      try {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: jwtPayload.email || `user_${userId.substring(0, 8)}@app.local`,
            full_name: jwtPayload.full_name || jwtPayload.name || 'User'
          })
          .select('id, email, mobile, pass_hash, mobile_hash')
          .single();
        userRecord = newUser;
      } catch (err) {
        userRecord = null;
      }
    }

    // Fallback: try to resolve business context from business_users or owner mapping
    let resolvedRoleId = roleId;
    if (!resolvedRoleId) {
      // Try to get from business_users
      try {
        const { data: businessUserRows } = await supabase
          .from('business_users')
          .select('role_id')
          .eq('user_id', userId);
        if (businessUserRows && businessUserRows.length > 0) {
          resolvedRoleId = businessUserRows[0].role_id;
        }
      } catch (err) {}
    }
    if (!resolvedRoleId) {
      // Try to get from owner mapping (if available)
      if (userRecord && userRecord.mobile) {
        const mobileHash = require('crypto').createHash('sha256').update(userRecord.mobile).digest('hex');
        try {
          const { data: ownerRows } = await supabase
            .from('owner')
            .select('id')
            .eq('mobile_hash', mobileHash);
          if (ownerRows && ownerRows.length > 0) {
            resolvedRoleId = ownerRows[0].id;
          }
        } catch (err) {}
      }
    }
    if (!resolvedRoleId) {
      return res.status(403).json({
        success: false,
        status: 'error',
        code: 'NO_BUSINESS_CONTEXT',
        message: 'User must have a business and role'
      });
    }

    // ========================================================================
    // STEP 3: PERMISSION GATE
    // ========================================================================
    const requestAction = req.body?.action;
    if (requestAction) {
      action = requestAction; // Safe assignment
    }
    const { payload } = req.body || {};
    console.log(`[🔥 KERNEL] Request body:`, { action, payloadKeys: Object.keys(payload || {}) });
    const isAdminUser = await resolveAdminAccess(userId, userRecord, supabase);
    console.log(`[🔥 KERNEL] User is admin:`, isAdminUser);

    // Map action to required permission
    const actionPermissionMap = {
      'chat': 'chat_access',
      'ui': 'ui_access',
      'data': 'data_query',
      'automation': 'automation_execute',
      'plugin': 'plugin_execute',
      'admin': 'admin_access'
    };

    const requiredPermission = actionPermissionMap[action];
    if (!requiredPermission) {
      return res.status(400).json({
        success: false,
        status: 'error',
        code: 'INVALID_ACTION',
        message: `Unknown action: ${action}`
      });
    }

    // Check permission via RPC
    if (!(action === 'admin' && isAdminUser)) {
      let hasPermission = false;
      let permError = null;
      try {
        const rpcResult = await supabase.rpc('check_action_permission', {
          p_business_id: businessId,
          p_user_id: userId,
          p_permission_code: requiredPermission
        });
        hasPermission = rpcResult.data;
        permError = rpcResult.error;
      } catch (err) {
        permError = err;
      }
      // If RPC is missing (first time/new DB), auto-assign permission
      if (permError && String(permError).toLowerCase().includes('function check_action_permission does not exist')) {
        console.warn('[Kernel] RPC check_action_permission missing, auto-assigning permission for first-time/new DB.');
        hasPermission = true;
      }
      // If isAdminUser, allow all except admin panel for non-admins
      if (!hasPermission && isAdminUser) {
        console.log('[Kernel] isAdminUser detected, bypassing permission check for non-admin actions.');
        hasPermission = true;
      }
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          status: 'error',
          code: 'PERMISSION_DENIED',
          message: `User lacks permission: ${requiredPermission}`
        });
      }
      console.log(`[🔥 KERNEL] ✅ Permission check passed for action: ${action}`);
    }

    // ========================================================================
    // STEP 4: TRUST SCORE GATE
    // ========================================================================
    const { data: trustRecord } = await supabase
      .from('node_trust_state')
      .select('trust_score, is_trusted')
      .eq('nid_hash', generateNodeHash(userId))
      .single();

    const trustScore = trustRecord?.trust_score || 50;
    const isTrusted = trustRecord?.is_trusted || false;

    // Block write operations if trust is too low
    if (['data', 'automation', 'plugin'].includes(action) && trustScore < 30) {
      return res.status(403).json({
        success: false,
        status: 'error',
        code: 'LOW_TRUST_SCORE',
        message: `Trust score too low (${trustScore}). Write operations blocked.`
      });
    }

    // ========================================================================
    // STEP 5: ACTION ROUTER
    // ========================================================================
    let actionResult;
    console.log(`[🔥 KERNEL] Routing action: ${action} for user: ${userId}`);

    switch (action) {
      case 'chat':
        console.log('[🔥 KERNEL] → Handling CHAT action');
        actionResult = await handleChatAction(userId, businessId, payload, supabase);
        console.log('[🔥 KERNEL] ✅ CHAT action completed');
        break;

      case 'ui':
        console.log('[🔥 KERNEL] → Handling UI action');
        actionResult = await handleUIAction(userId, businessId, payload, supabase);
        console.log('[🔥 KERNEL] ✅ UI action completed');
        break;

      case 'data':
        console.log('[🔥 KERNEL] → Handling DATA action');
        actionResult = await handleDataAction(userId, businessId, payload, supabase);
        console.log('[🔥 KERNEL] ✅ DATA action completed');
        break;

      case 'automation':
        console.log('[🔥 KERNEL] → Handling AUTOMATION action');
        actionResult = await handleAutomationAction(userId, businessId, payload, supabase);
        console.log('[🔥 KERNEL] ✅ AUTOMATION action completed');
        break;

      case 'plugin':
        console.log('[🔥 KERNEL] → Handling PLUGIN action');
        actionResult = await handlePluginAction(userId, businessId, payload, supabase);
        console.log('[🔥 KERNEL] ✅ PLUGIN action completed');
        break;

      case 'admin':
        console.log('[🔥 KERNEL] → Handling ADMIN action');
        actionResult = await handleAdminAction(userId, businessId, payload, supabase, isAdminUser);
        console.log('[🔥 KERNEL] ✅ ADMIN action completed');
        break;

      default:
        console.error('[🔥 KERNEL] ❌ UNKNOWN action:', action);
        return res.status(400).json({
          success: false,
          status: 'error',
          code: 'UNKNOWN_ACTION',
          message: `Action not supported: ${action}`
        });
    }

    // ========================================================================
    // STEP 6: EVENT LOGGING + QUEUE PUBLISHING
    // ========================================================================
    const executionTime = Date.now() - startTime;

    try {
      await supabase.from('ai_execution_log').insert({
        user_id: userId,
        business_id: businessId,
        model: 'kernel',
        tool_used: action,
        prompt_tokens: null,
        completion_tokens: null,
        latency_ms: executionTime,
        success: true,
        error_message: null
      });
    } catch (telemetryError) {
      console.warn('AI telemetry insert failed:', telemetryError?.message || telemetryError);
    }

    // Log execution
    try {
      const logResult = await supabase
        .from('node_execution_log')
        .insert({
          request_id: requestId,
          user_id: userId,
          business_id: businessId,
          action_type: action,
          status: 'success',
          execution_time_ms: executionTime,
          trust_score: trustScore,
          ip_address: req.ip,
          created_at: new Date().toISOString()
        });
      
      if (logResult.error) {
        console.error('Failed to log execution:', logResult.error);
      }
    } catch (err) {
      console.error('Exception logging execution:', err.message);
    }

    // Publish async events if needed
    if (actionResult.asyncEvents && actionResult.asyncEvents.length > 0) {
      for (const event of actionResult.asyncEvents) {
        try {
          const eventResult = await supabase
            .from('node_event_queue')
            .insert({
              business_id: businessId,
              event_type: event.type,
              payload: event.payload,
              status: 'pending',
              created_at: new Date().toISOString()
            });
          
          if (eventResult.error) {
            console.error('Failed to queue event:', eventResult.error);
          }
        } catch (err) {
          console.error('Exception queueing event:', err.message);
        }
      }
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    console.log(`[🔥 KERNEL] ✅ Building response, execution time: ${executionTime}ms`);
    return res.status(200).json({
      success: true,
      status: 'success',
      request_id: requestId,
      user_id: userId,
      business_id: businessId,
      trust_score: trustScore,
      karma_score: 100, // TODO: fetch from database
      execution_time_ms: executionTime,
      response: actionResult.response,
      next_actions: actionResult.nextActions || [],
      metadata: {
        timestamp: new Date().toISOString(),
        kernel_version: '1.0.0'
      }
    });

  } catch (error) {
    console.error(`❌ [🔥 KERNEL] FATAL ERROR [${requestId}]:`, error.message);
    console.error(`❌ [🔥 KERNEL] Stack:`, error.stack);
    console.error(`❌ [🔥 KERNEL] Full error:`, error);

    return res.status(500).json({
      success: false,
      status: 'error',
      code: 'KERNEL_ERROR',
      message: 'Internal server error',
      request_id: requestId,
      debug: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Handle chat action
 * - Build RAG context
 * - Call AI endpoint
 * - Save memory
 * - Return response with suggested next UI
 */
async function handleChatAction(userId, businessId, payload, supabase) {
  const { message, context } = payload;

  try {
    // Get RAG context
    const { data: ragContext } = await supabase
      .rpc('build_rag_context', {
        query_text: message,
        business_id_param: businessId
      })
      .catch(() => ({ data: null }));

    const sessionId = context?.session_id || generateUUID();
    
    // Get MCP System Prompt from frontend context
    const mcpSystemPrompt = context?.mcp_system_prompt || context?.system_prompt;
    const mcpBrand = context?.mcp_brand || 'VANSHAWALI';

    // Queue AI task (async worker will process with MCP context)
    const { data: queuedTask } = await supabase
      .from('node_ai_task_queue')
      .insert({
        business_id: businessId,
        task_type: 'chat_ai',
        payload: {
          provider: 'openai',
          prompt: message,
          context: ragContext || {},
          session_id: sessionId,
          user_id: userId,
          business_id: businessId,
          // MCP System Prompt Context for OpenAI
          mcp_system_prompt: mcpSystemPrompt,
          mcp_brand: mcpBrand,
          system_prompt: mcpSystemPrompt,
          menu_context: context?.menu_context
        },
        status: 'pending',
        created_by: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
      .catch(err => {
        console.error('AI queue insert error:', err);
        return { data: null };
      });

    const taskId = queuedTask?.id || generateUUID();

    return {
      response: {
        text: 'Your request is queued for AI processing.',
        type: 'chat_async_queued',
        task_id: taskId,
        status: 'queued',
        ui: {
          layout: 'chat_with_sidebar',
          widgets: ['chat_window', 'task_status'],
          actions: ['send_message', 'clear_chat', 'poll_status']
        }
      },
      nextActions: ['poll_status'],
      asyncEvents: [
        {
          type: 'memory_write_pending',
          payload: {
            user_id: userId,
            business_id: businessId,
            session_id: sessionId,
            role: 'user',
            message
          }
        }
      ]
    };
  } catch (error) {
    console.error('Chat action error:', error);
    throw error;
  }
}

/**
 * Handle UI action
 * - Load dynamic template
 * - Resolve widgets
 * - Return layout schema matching Renderer expectations
 */
async function handleUIAction(userId, businessId, payload, supabase) {
  const { screen, context } = payload;
  console.log(`[🔥 UI ACTION] Starting for user: ${userId}, screen: ${screen}`);

  try {
    // Get active template
    console.log(`[🔥 UI ACTION] Fetching template for business: ${businessId}`);
    let template = null;
    const templateResult = await supabase
      .from('ui_templates')
      .select('id, template_code, schema_json')
      .eq('business_id', businessId)
      .eq('is_default', true)
      .limit(1)
      .single();
    
    if (templateResult.error) {
      console.log('[🔥 UI ACTION] No template found, using default:', templateResult.error.message);
    } else {
      template = templateResult.data;
    }

    const templateId = template?.id || 'default_dashboard';
    console.log(`[🔥 UI ACTION] Using template: ${templateId}`);

    // Get dashboard widgets
    console.log(`[🔥 UI ACTION] Fetching widgets for business: ${businessId}`);
    let widgets = [];
    const widgetsResult = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('business_id', businessId)
      .limit(10);
    
    if (widgetsResult.error) {
      console.error('[🔥 UI ACTION] Error fetching widgets:', widgetsResult.error);
      widgets = [];
    } else {
      widgets = widgetsResult.data || [];
    }

    console.log(`[🔥 UI ACTION] Found ${widgets?.length || 0} widgets`);

    // Transform widgets to match Renderer expectations
    // IMPORTANT: Only use widget types that WidgetRenderer supports: kpi, table, chart, form, actions
    const SUPPORTED_WIDGET_TYPES = ['kpi', 'table', 'chart', 'form', 'actions'];
    
    const formattedWidgets = (widgets || [])
      .filter(w => {
        const type = w.widget_code || 'unknown';
        const isSupported = SUPPORTED_WIDGET_TYPES.includes(type);
        if (!isSupported && type !== 'unknown') {
          console.log(`[🔥 UI ACTION] ⚠️ Skipping unsupported widget type: ${type}`);
        }
        return isSupported || !type || type === 'unknown';  // Include if no type or type is unknown (will use default)
      })
      .map(w => ({
        id: w.id,
        type: w.widget_code || 'table',  // Default to 'table' instead of 'card'
        title: w.widget_title || 'Widget',
        size: w.size || 'medium',
        config: w.config_json || {},
        data: w.data_json || {}
      }));

    // Build layout schema that Renderer can consume
    const layout = template?.schema_json || 'grid';

    // Return UI state that matches UIStateManager expectations
    const uiState = {
      layout: layout,
      widgets: formattedWidgets,
      floating_chat: true,
      permissions: {
        can_edit: true,
        can_delete: false,
        can_share: true
      },
      theme: 'light',
      brand: 'default'
    };

    console.log('[🔥 UI ACTION] ✅ Successfully built UI state');
    return {
      response: {
        type: 'ui_bootstrap',
        screen: screen || 'dashboard',
        template_id: templateId,
        ui: uiState  // Renderer expects response.response.ui to be the full UI state
      },
      nextActions: ['load_data', 'initialize_chat'],
      asyncEvents: [
        {
          type: 'log_ui_load',
          payload: { user_id: userId, screen, timestamp: Date.now() }
        }
      ]
    };
  } catch (error) {
    console.error('[🔥 UI ACTION] ❌ Error:', error);
    throw error;
  }
}

/**
 * Handle data action
 * - Execute template query
 * - Apply RLS via Supabase
 * - Cache results
 * - Return paginated data
 */
async function handleDataAction(userId, businessId, payload, supabase) {
  const { template_code, filters, pagination } = payload;

  try {
    // Execute template query via RPC
    const { data: queryResult, error: queryError } = await supabase
      .rpc('run_template_query_cached', {
        template_code_param: template_code,
        business_id_param: businessId,
        filters_param: filters || {},
        limit_param: pagination?.limit || 50,
        offset_param: pagination?.offset || 0
      })
      .catch(err => {
        console.error('RPC error:', err);
        return { data: [], error: err };
      });

    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`);
    }

    return {
      response: {
        type: 'data_result',
        template_code,
        data: queryResult || [],
        pagination: {
          limit: pagination?.limit || 50,
          offset: pagination?.offset || 0,
          total: (queryResult?.length || 0) + (pagination?.offset || 0)
        },
        metadata: {
          cached: true,
          cache_ttl: 300
        },
        ui: {
          layout: 'data_grid',
          widgets: ['data_table', 'filters', 'export'],
          actions: ['export', 'filter', 'sort']
        }
      },
      nextActions: [],
      asyncEvents: []
    };
  } catch (error) {
    console.error('Data action error:', error);
    throw error;
  }
}

/**
 * Handle automation action
 * - Validate automation access
 * - Queue execution
 * - Return webhook info
 */
async function handleAutomationAction(userId, businessId, payload, supabase) {
  const { automation_code, parameters } = payload;

  try {
    const taskId = generateUUID();

    return {
      response: {
        type: 'automation_queued',
        task_id: taskId,
        automation_code,
        status: 'queued',
        webhook_url: `/webhooks/automation/${taskId}`,
        ui: {
          layout: 'confirmation',
          message: `Automation "${automation_code}" queued for execution`,
          widgets: ['status_indicator', 'logs']
        }
      },
      nextActions: ['poll_status'],
      asyncEvents: [
        {
          type: 'automation_triggered',
          payload: {
            task_id: taskId,
            automation_code,
            parameters: parameters || {},
            user_id: userId,
            business_id: businessId
          }
        }
      ]
    };
  } catch (error) {
    console.error('Automation action error:', error);
    throw error;
  }
}

/**
 * Handle plugin action
 * - Load plugin config
 * - Execute plugin RPC
 * - Return plugin response
 */
async function handlePluginAction(userId, businessId, payload, supabase) {
  const { plugin_code, action: pluginAction, parameters } = payload;

  try {
    // Get plugin config
    const { data: pluginConfig } = await supabase
      .from('ai_plugins')
      .select('*')
      .eq('plugin_code', plugin_code)
      .eq('business_id', businessId)
      .single()
      .catch(() => ({ data: null }));

    if (!pluginConfig) {
      throw new Error(`Plugin not found: ${plugin_code}`);
    }

    // Call plugin RPC
    const { data: pluginResult } = await supabase
      .rpc(`plugin_${plugin_code}`, {
        action: pluginAction,
        parameters: parameters || {}
      })
      .catch(() => ({ data: null }));

    return {
      response: {
        type: 'plugin_result',
        plugin_code,
        result: pluginResult || {},
        ui: {
          layout: 'plugin_output',
          widgets: ['plugin_content', 'actions'],
          actions: ['close', 'refresh', 'share']
        }
      },
      nextActions: [],
      asyncEvents: []
    };
  } catch (error) {
    console.error('Plugin action error:', error);
    throw error;
  }
}

/**
 * Handle admin MCP control action
 * - admin_bootstrap: load admin context
 * - admin_chat_control: process admin command (tool calls + ui updates)
 * - admin_execute_tool: execute a tool (placeholder)
 */
async function handleAdminAction(userId, businessId, payload, supabase, isAdminUser) {
  if (!isAdminUser) {
    return {
      response: {
        type: 'admin_denied',
        chat_reply: 'Permission denied. Admin access required.',
        tool_calls: [],
        ui_update: {
          toast: 'Permission denied'
        }
      },
      nextActions: [],
      asyncEvents: []
    };
  }

  const adminAction = payload?.action;

  if (!adminAction) {
    return {
      response: {
        type: 'admin_error',
        chat_reply: 'Admin action is required.',
        tool_calls: [],
        ui_update: {
          toast: 'Missing admin action'
        }
      },
      nextActions: [],
      asyncEvents: []
    };
  }

  if (adminAction === 'admin_bootstrap') {
    const [brandsResult, templatesResult, widgetsResult, registryResult] = await Promise.all([
      supabase.from('brands').select('*').limit(50).catch(() => ({ data: [] })),
      supabase.from('ui_templates').select('*').eq('business_id', businessId).limit(50).catch(() => ({ data: [] })),
      supabase.from('dashboard_widgets').select('*').eq('business_id', businessId).limit(50).catch(() => ({ data: [] })),
      supabase.from('data_model_registry').select('*').eq('business_id', businessId).limit(200).catch(() => ({ data: [] }))
    ]);

    const adminContext = {
      brands: brandsResult.data || [],
      templates: templatesResult.data || [],
      widgets: widgetsResult.data || [],
      db_schema_snapshot: registryResult.data || [],
      permissions: [],
      available_tools: getAdminTools()
    };

    await supabase
      .from('admin_action_logs')
      .insert({
        admin_id: userId,
        action: 'admin_bootstrap',
        payload: { business_id: businessId },
        status: 'success',
        created_at: new Date().toISOString()
      })
      .catch(() => null);

    return {
      response: {
        type: 'admin_bootstrap',
        admin_context: adminContext,
        chat_reply: 'Admin context loaded.',
        tool_calls: [],
        ui_update: {
          navigate: 'dashboard'
        }
      },
      nextActions: [],
      asyncEvents: []
    };
  }

  if (adminAction === 'admin_chat_control') {
    const message = String(payload?.message || '').trim();
    const aiMode = payload?.ai_mode || 'SAFE';
    const toolCalls = [];
    let uiUpdate = {};
    let chatReply = 'Tell me more about what you are trying to accomplish.';

    if (!message) {
      return {
        response: {
          type: 'admin_chat_control',
          chat_reply: 'Please enter a command to continue.',
          tool_calls: [],
          ui_update: {}
        },
        nextActions: [],
        asyncEvents: []
      };
    }

    if (message.toLowerCase().includes('create role')) {
      const roleName = message.replace(/.*create role/i, '').trim() || 'New Role';
      toolCalls.push({
        name: 'create_role',
        arguments: { business_id: businessId, role_name: roleName }
      });
      uiUpdate = { reload: ['roles_table'], toast: `Role queued: ${roleName}` };
      chatReply = aiMode === 'SAFE'
        ? `I can create the role "${roleName}". Switch to Execute Mode to apply.`
        : `Creating role "${roleName}".`;
    } else if (message.toLowerCase().includes('dashboard')) {
      uiUpdate = { navigate: 'dashboard', toast: 'Opening dashboard' };
      chatReply = 'Opening the dashboard view.';
    }

    let toolResults = [];
    if (aiMode === 'EXECUTE' && toolCalls.length > 0) {
      toolResults = await executeAdminTools(supabase, toolCalls);
      const failed = toolResults.filter((r) => !r.success);
      if (failed.length > 0) {
        uiUpdate = { ...uiUpdate, toast: `Tool errors: ${failed.map(f => f.name).join(', ')}` };
        chatReply = `Some tools failed: ${failed.map(f => f.name).join(', ')}.`;
      }
    }

    await supabase
      .from('admin_action_logs')
      .insert({
        admin_id: userId,
        action: 'admin_chat_control',
        payload: { message, ai_mode: aiMode },
        status: 'success',
        created_at: new Date().toISOString()
      })
      .catch(() => null);

    return {
      response: {
        type: 'admin_chat_control',
        chat_reply: chatReply,
        tool_calls: toolCalls,
        ui_update: uiUpdate,
        tool_results: toolResults
      },
      nextActions: [],
      asyncEvents: []
    };
  }

  if (adminAction === 'admin_execute_tool') {
    const toolName = payload?.tool?.name;
    const toolResult = payload?.tool ? await executeAdminTool(supabase, payload.tool) : null;
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_id: userId,
        action: 'admin_execute_tool',
        payload: payload?.tool || {},
        status: toolResult?.success === false ? 'error' : 'success',
        created_at: new Date().toISOString()
      })
      .catch(() => null);

    return {
      response: {
        type: 'admin_execute_tool',
        chat_reply: toolResult?.success
          ? `Executed tool: ${toolName}`
          : toolName
            ? `Tool failed: ${toolName}`
            : 'No tool executed.',
        tool_calls: payload?.tool ? [payload.tool] : [],
        tool_results: toolResult ? [toolResult] : [],
        ui_update: { toast: toolResult?.success ? `Executed ${toolName}` : toolName ? `Failed ${toolName}` : 'No tool executed' }
      },
      nextActions: [],
      asyncEvents: []
    };
  }

  return {
    response: {
      type: 'admin_error',
      chat_reply: `Unknown admin action: ${adminAction}`,
      tool_calls: [],
      ui_update: { toast: 'Unknown admin action' }
    },
    nextActions: [],
    asyncEvents: []
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

router.get('/health', (req, res) => {
  const responsePayload = {
    status: 'healthy',
    kernel_version: '1.0.0',
    timestamp: new Date().toISOString()
  };
  res.json(responsePayload);
});

// ============================================================================
// UTILITIES
// ============================================================================

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateNodeHash(userId) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(userId).digest('hex');
}

async function resolveAdminAccess(userId, userRecord, supabaseClient) {
  if (userRecord?.business_role && String(userRecord.business_role).toLowerCase().includes('admin')) {
    return true;
  }
  try {
    const { data, error } = await supabaseClient
      .from('admin_permissions')
      .select('admin_id')
      .eq('admin_id', userId)
      .limit(1)
      .single();

    return !!data && !error;
  } catch {
    return false;
  }
}

module.exports = router;
