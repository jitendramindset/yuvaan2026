/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ADMIN AI TOOL MAPPING — Tool Call Contract                 ║
 * ║  Admin chats → AI translates to structured tool calls       ║
 * ║  DB: ai_action_requests, ai_execution_log, node_core        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Tool Categories:
 *   1. create_node          — Create any node type
 *   2. update_node          — Modify node metadata
 *   3. attach_widget_to_layout
 *   4. create_relationship
 *   5. update_permission_rule
 *   6. update_theme
 *   7. activate_layout_version
 *   8. clone_template
 *   9. generate_embedding   — Create vector embedding
 *  10. validate_schema      — Validate node data
 */

const { validateNodeData, buildNodeCoreRow, encodeToBlob, decodeFromBlob } = require('./node-schema');
const { createWidgetTemplate, validateWidget, widgetToDBRow, layoutToDBRow } = require('./widget-engine');
const NodeFactory = require('./nodeFactory');

// ─── TOOL REGISTRY (OpenAI function-calling compatible) ──────
const ADMIN_TOOLS = [
  {
    name: 'create_node',
    description: 'Create any node type in the system (user, widget, layout, permission, etc.)',
    parameters: {
      type: 'object',
      required: ['node_type', 'brand_scope', 'metadata'],
      properties: {
        node_type:      { type: 'string', enum: ['brand_root', 'user_node', 'nonliving_node', 'dashboard_layout', 'widget', 'permission_rule', 'role_node', 'data_template', 'relationship_rule', 'theme_config'] },
        brand_scope:    { type: 'string', enum: ['VANSHAWALI', 'JEETMANTRA', 'MANTRAVAT', 'JUNIOR', 'BOTMANTRA'] },
        metadata:       { type: 'object' },
        parent_nid_hash: { type: 'string' },
        permissions:    { type: 'object' }
      }
    }
  },
  {
    name: 'update_node',
    description: 'Update an existing node\'s metadata or configuration',
    parameters: {
      type: 'object',
      required: ['nid_hash', 'updates'],
      properties: {
        nid_hash: { type: 'string' },
        updates:  { type: 'object' }
      }
    }
  },
  {
    name: 'attach_widget_to_layout',
    description: 'Add a widget to a dashboard layout',
    parameters: {
      type: 'object',
      required: ['layout_nid_hash', 'widget_config'],
      properties: {
        layout_nid_hash: { type: 'string' },
        widget_config:   { type: 'object' }
      }
    }
  },
  {
    name: 'create_relationship',
    description: 'Create a relationship between two nodes',
    parameters: {
      type: 'object',
      required: ['source_nid_hash', 'target_nid_hash', 'relationship_type'],
      properties: {
        source_nid_hash:   { type: 'string' },
        target_nid_hash:   { type: 'string' },
        relationship_type: { type: 'string', enum: ['parent-child', 'teacher-student', 'employer-employee', 'family-member', 'friend', 'colleague', 'brand-member'] },
        bidirectional:     { type: 'boolean' }
      }
    }
  },
  {
    name: 'update_permission_rule',
    description: 'Create or update a permission rule on a node',
    parameters: {
      type: 'object',
      required: ['nid_hash', 'permission_type'],
      properties: {
        nid_hash:        { type: 'string' },
        permission_type: { type: 'string' },
        target_owner_id: { type: 'string' },
        can_read:        { type: 'boolean' },
        can_write:       { type: 'boolean' },
        can_delete:      { type: 'boolean' }
      }
    }
  },
  {
    name: 'update_theme',
    description: 'Update a brand or user theme configuration',
    parameters: {
      type: 'object',
      required: ['brand_scope', 'theme_updates'],
      properties: {
        brand_scope:   { type: 'string' },
        theme_updates: { type: 'object' }
      }
    }
  },
  {
    name: 'activate_layout_version',
    description: 'Activate a specific layout version for a brand or user',
    parameters: {
      type: 'object',
      required: ['layout_nid_hash'],
      properties: {
        layout_nid_hash: { type: 'string' },
        target_brand:    { type: 'string' },
        target_user_id:  { type: 'string' }
      }
    }
  },
  {
    name: 'clone_template',
    description: 'Clone a layout, widget, or template to create a variant',
    parameters: {
      type: 'object',
      required: ['source_nid_hash', 'new_name'],
      properties: {
        source_nid_hash: { type: 'string' },
        new_name:        { type: 'string' },
        target_brand:    { type: 'string' },
        override_meta:   { type: 'object' }
      }
    }
  },
  {
    name: 'generate_embedding',
    description: 'Generate a vector embedding for a node and store in vector DB',
    parameters: {
      type: 'object',
      required: ['nid_hash', 'content'],
      properties: {
        nid_hash: { type: 'string' },
        content:  { type: 'string' },
        category: { type: 'string', enum: ['layout_vectors', 'widget_vectors', 'permission_vectors', 'relationship_vectors', 'content_vectors', 'knowledge_vectors', 'user_memory_vectors', 'admin_design_vectors'] }
      }
    }
  },
  {
    name: 'validate_schema',
    description: 'Validate node data against its type schema before creating',
    parameters: {
      type: 'object',
      required: ['node_type', 'metadata'],
      properties: {
        node_type:   { type: 'string' },
        metadata:    { type: 'object' },
        brand_scope: { type: 'string' }
      }
    }
  }
];

// ─── TOOL EXECUTOR ──────────────────────────────────────────
class AdminToolExecutor {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Execute a single tool call with full validation
   */
  async execute(toolCall, adminUserId) {
    const { tool, arguments: args } = toolCall;
    const startTime = Date.now();

    try {
      // 1. Validate tool exists
      const toolDef = ADMIN_TOOLS.find(t => t.name === tool);
      if (!toolDef) throw new Error(`Unknown tool: ${tool}`);

      // 2. Validate required args
      const required = toolDef.parameters.required || [];
      for (const r of required) {
        if (args[r] === undefined) throw new Error(`Missing required argument: ${r}`);
      }

      // 3. Validate admin permission
      const adminCheck = await this._checkAdminPermission(adminUserId);
      if (!adminCheck.allowed) throw new Error(`Permission denied: ${adminCheck.reason}`);

      // 4. Execute tool
      let result;
      switch (tool) {
        case 'create_node':
          result = await this._createNode(args, adminUserId);
          break;
        case 'update_node':
          result = await this._updateNode(args, adminUserId);
          break;
        case 'attach_widget_to_layout':
          result = await this._attachWidget(args, adminUserId);
          break;
        case 'create_relationship':
          result = await this._createRelationship(args, adminUserId);
          break;
        case 'update_permission_rule':
          result = await this._updatePermission(args, adminUserId);
          break;
        case 'update_theme':
          result = await this._updateTheme(args, adminUserId);
          break;
        case 'activate_layout_version':
          result = await this._activateLayout(args, adminUserId);
          break;
        case 'clone_template':
          result = await this._cloneTemplate(args, adminUserId);
          break;
        case 'generate_embedding':
          result = await this._generateEmbedding(args, adminUserId);
          break;
        case 'validate_schema':
          result = this._validateSchema(args);
          break;
        default:
          throw new Error(`Tool not implemented: ${tool}`);
      }

      // 5. Log execution
      await this._logExecution(tool, args, result, adminUserId, Date.now() - startTime, true);
      return { success: true, tool, result };

    } catch (error) {
      await this._logExecution(tool, args, { error: error.message }, adminUserId, Date.now() - startTime, false);
      return { success: false, tool, error: error.message };
    }
  }

  /**
   * Execute multiple tool calls (from AI array response)
   */
  async executeBatch(toolCalls, adminUserId) {
    const results = [];
    for (const call of toolCalls) {
      const r = await this.execute(call, adminUserId);
      results.push(r);
      if (!r.success && call.abort_on_error) break;
    }
    return results;
  }

  // ─── TOOL IMPLEMENTATIONS ─────────────────────────────────

  async _createNode(args, adminUserId) {
    // Validate schema first
    const validation = validateNodeData(args.node_type, args.metadata, args.brand_scope);
    if (!validation.valid) throw new Error(`Schema validation failed: ${validation.errors.join('; ')}`);

    // Check duplication for brand_root
    if (args.node_type === 'brand_root') {
      const existing = await this.nodeFactory.queryNodes({
        node_type: 'brand_root',
        owner_id: adminUserId
      });
      if (existing.length > 0) throw new Error('Brand root already exists for this user');
    }

    // Create node using NodeFactory
    const node = await this.nodeFactory.createNonLiveNode(args.node_type, adminUserId, args.metadata, {
      brand_scope: args.brand_scope,
      parent_nid_hash: args.parent_nid_hash,
      permissions: args.permissions
    });

    return { created: true, row_id: node.row_id, nid_hash: node.nid_hash };
  }

  async _updateNode(args, adminUserId) {
    // Update node using NodeFactory
    const result = await this.nodeFactory.updateNode(args.nid_hash, args.updates, adminUserId);
    return { updated: true, nid_hash: args.nid_hash, new_version: result.new_version };
  }

  async _attachWidget(args, adminUserId) {
    // Validate widget config
    const widget = createWidgetTemplate(args.widget_config);
    const validation = validateWidget(widget);
    if (!validation.valid) throw new Error(`Widget invalid: ${validation.errors.join('; ')}`);

    // Get layout node using NodeFactory
    const layout = await this.nodeFactory.loadUserNode(args.layout_nid_hash);
    if (!layout) throw new Error(`Layout not found: ${args.layout_nid_hash}`);

    // Create widget node using NodeFactory
    const widgetNode = await this.nodeFactory.createNonLiveNode('widget', adminUserId, args.widget_config, {
      parent_nid_hash: args.layout_nid_hash,
      node_depth: 1
    });

    // Update layout's widget list in field_map using NodeFactory
    const layoutMeta = layout.field_map || {};
    layoutMeta.widgets = layoutMeta.widgets || [];
    layoutMeta.widgets.push(widgetNode.nid_hash);

    await this.nodeFactory.updateNode(args.layout_nid_hash, { widgets: layoutMeta.widgets }, adminUserId);

    return { attached: true, widget_nid_hash: widgetNode.nid_hash, layout_nid_hash: args.layout_nid_hash };
  }

  async _createRelationship(args, adminUserId) {
    // Verify both nodes exist using NodeFactory
    const source = await this.nodeFactory.loadUserNode(args.source_nid_hash);
    const target = await this.nodeFactory.loadUserNode(args.target_nid_hash);

    if (!source) throw new Error(`Source node not found: ${args.source_nid_hash}`);
    if (!target) throw new Error(`Target node not found: ${args.target_nid_hash}`);

    // Create relationship node using NodeFactory
    const relNode = await this.nodeFactory.createNonLiveNode('relationship_rule', adminUserId, {
      relationship_type: args.relationship_type,
      bidirectional: args.bidirectional || false,
      source_nid: args.source_nid_hash,
      target_nid: args.target_nid_hash
    }, {
      parent_nid_hash: args.source_nid_hash,
      node_depth: 1
    });

    return { created: true, relationship_nid_hash: relNode.nid_hash };
  }

  async _updatePermission(args, adminUserId) {
    const { data, error } = await this.supabase
      .from('node_permission')
      .upsert({
        nid_hash: args.nid_hash,
        owner_id: adminUserId,
        target_owner_id: args.target_owner_id || adminUserId,
        permission_type: args.permission_type,
        can_read: args.can_read !== false,
        can_write: args.can_write || false,
        can_delete: args.can_delete || false
      }, { onConflict: 'nid_hash, owner_id, permission_type' })
      .select()
      .single();

    if (error) throw error;
    return { updated: true, perm_id: data.perm_id };
  }

  async _updateTheme(args, adminUserId) {
    const { data, error } = await this.supabase
      .from('ui_themes')
      .upsert({
        theme_name: args.theme_updates.theme_name || `${args.brand_scope}_theme`,
        colors: args.theme_updates.colors || {},
        fonts: args.theme_updates.fonts || {},
        spacing: args.theme_updates.spacing || {},
        is_default: true
      })
      .select()
      .single();

    if (error) throw error;
    return { updated: true, theme_id: data.id };
  }

  async _activateLayout(args, adminUserId) {
    // Load and update layout using NodeFactory
    const node = await this.nodeFactory.loadUserNode(args.layout_nid_hash);
    if (!node) throw new Error(`Layout not found: ${args.layout_nid_hash}`);

    const meta = node.field_map || {};
    meta.is_default = true;

    await this.nodeFactory.updateNode(args.layout_nid_hash, { is_default: true, node_state: 'ACTIVE' }, adminUserId);

    return { activated: true, layout_nid_hash: args.layout_nid_hash };
  }

  async _cloneTemplate(args, adminUserId) {
    // Load source node using NodeFactory
    const source = await this.nodeFactory.loadUserNode(args.source_nid_hash);
    if (!source) throw new Error(`Source not found: ${args.source_nid_hash}`);

    const meta = source.field_map || {};
    const overrides = args.override_meta || {};
    const newMeta = { ...meta, ...overrides, name: args.new_name };

    // Create cloned node using NodeFactory
    const clonedNode = await this.nodeFactory.createNonLiveNode(source.node_type, adminUserId, newMeta, {
      brand_scope: source.brand_scope,
      parent_nid_hash: source.parent_nid_hash,
      permissions: source.permissions
    });

    return { cloned: true, new_nid_hash: clonedNode.nid_hash, from: args.source_nid_hash };
  }

  async _generateEmbedding(args, adminUserId) {
    // Store in vector_documents + vector_chunks
    const { data: doc, error: docErr } = await this.supabase
      .from('vector_documents')
      .insert({
        source_type: args.category || 'content_vectors',
        source_name: `node_${args.nid_hash}`,
        module: args.category || 'content_vectors',
        created_by: adminUserId
      })
      .select()
      .single();

    if (docErr) throw docErr;

    const { data: chunk, error: chunkErr } = await this.supabase
      .from('vector_chunks')
      .insert({
        document_id: doc.id,
        chunk_index: 0,
        content: args.content,
        metadata: {
          nid_hash: args.nid_hash,
          category: args.category || 'content_vectors',
          node_reference: args.nid_hash,
          semantic_tags: [],
          visibility_scope: 'private'
        }
      })
      .select()
      .single();

    if (chunkErr) throw chunkErr;
    return { stored: true, document_id: doc.id, chunk_id: chunk.id };
  }

  _validateSchema(args) {
    return validateNodeData(args.node_type, args.metadata, args.brand_scope);
  }

  // ─── HELPERS ──────────────────────────────────────────────

  async _checkAdminPermission(userId) {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role_id, roles(role_name, id)')
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0 || !data[0]?.roles) {
      console.log('Admin permission check failed:', error?.message || 'No role data');
      // During development/initial setup, allow admin access if no roles exist
      // This allows the system to bootstrap without requiring role setup
      const { data: allRoles, error: rolesError } = await this.supabase
        .from('roles')
        .select('count', { count: 'exact' });

      if (!rolesError && (allRoles === null || allRoles === 0)) {
        console.log('No roles exist in database - allowing admin access for initial setup');
        return { allowed: true, role: 'super_admin', reason: 'Initial setup - no roles defined' };
      }
      return { allowed: false, reason: 'No active role assigned' };
    }

    const roleData = data[0];
    const roleName = (roleData.roles.role_name || '').toLowerCase();
    const adminRoles = ['owner', 'admin', 'superadmin', 'super_admin'];
    if (!adminRoles.includes(roleName)) {
      return { allowed: false, reason: `Role ${roleName} is not admin` };
    }
    return { allowed: true, role: roleData.roles.role_name };
  }

  async _logExecution(tool, args, result, userId, duration, success) {
    try {
      await this.supabase.from('ai_execution_log').insert({
        user_id: userId,
        action_type: tool,
        input_data: args,
        output_data: result,
        execution_time: duration,
        status: success ? 'completed' : 'failed'
      });
    } catch { /* non-critical */ }
  }
}

// ─── TOOL CALL FORMAT (for AI responses) ─────────────────────
function formatToolCall(toolName, args) {
  return { tool: toolName, arguments: args };
}

function formatMultiToolCall(calls) {
  return calls.map(c => formatToolCall(c.tool, c.arguments));
}

// ─── EXPORTS ─────────────────────────────────────────────────
module.exports = {
  ADMIN_TOOLS,
  AdminToolExecutor,
  formatToolCall,
  formatMultiToolCall
};
