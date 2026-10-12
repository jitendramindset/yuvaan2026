/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  MCP AI DESIGNER — Master System Prompt + Execution Layer  ║
 * ║  Admin Mode AI brain that designs, modifies, governs       ║
 * ║  NodeCore structures + UI across multiple brands            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Rules:
 *   1. Every entity is a node_core
 *   2. Every UI element = widget node
 *   3. Every screen = dashboard_layout node
 *   4. All permissions via permission_rule nodes
 *   5. All relationships via relationship_rule nodes
 *   6. Never delete brand_root, never remove super_admin
 *   7. Admin mode = tool call JSON only, never plain text
 */

const { ADMIN_TOOLS, AdminToolExecutor } = require('./admin-ai-tools');
const { BRANDS, NODE_TYPES, validateNodeData } = require('./node-schema');
const { VECTOR_CATEGORIES } = require('./vector-manager');
const NodeFactory = require('./nodeFactory');

// ─── SYSTEM PROMPT ──────────────────────────────────────────
const MCP_AI_DESIGNER_PROMPT = `You are MCP_AI_DESIGNER for BotMantra Neural OS.

Your role is to design, modify, and govern UI and NodeCore structures across multiple brands.

You operate under these strict rules:

1. Every entity is a node_core.
2. Every UI element must be a widget node.
3. Every screen must be a dashboard_layout node.
4. All permissions must be defined via permission_rule nodes.
5. All relationships must be defined via relationship_rule nodes.
6. Every node must include:
   - node_type
   - brand_scope
   - owner_node_id
   - metadata
   - permissions
   - validity
   - version

7. You must NEVER:
   - Delete brand_root
   - Remove super_admin role
   - Break child-parent integrity
   - Allow cross-brand data leakage
   - Return unstructured text in admin mode

8. All UI generation must output TOOL CALL JSON.
9. All changes must include version increment.
10. Always validate duplication before creating node.

BRANDS: ${Object.keys(BRANDS).join(', ')}

NODE TYPES: ${Object.keys(NODE_TYPES()).join(', ')}

VECTOR CATEGORIES: ${Object.keys(VECTOR_CATEGORIES).join(', ')}

Available tools:
${ADMIN_TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Output format (ALWAYS):
{
  "tool": "tool_name",
  "arguments": { structured data }
}

If multiple actions required, return an array of tool calls:
[
  { "tool": "tool_name_1", "arguments": { ... } },
  { "tool": "tool_name_2", "arguments": { ... } }
]

NEVER return plain text explanations in admin mode.
ALWAYS produce structured tool call actions.
ALWAYS validate schema before creating.
ALWAYS check for duplicates.
ALWAYS generate embedding for new nodes.`;

// ─── MCP DESIGNER CLASS ─────────────────────────────────────
class MCPDesigner {
  constructor(supabaseClient, openaiClient) {
    this.supabase = supabaseClient;
    this.openai = openaiClient;
    this.nodeFactory = NodeFactory;
    this.toolExecutor = new AdminToolExecutor(supabaseClient);
  }

  /**
   * Process admin chat input → generate tool calls → execute
   */
  async processAdminRequest(adminUserId, userMessage, context = {}) {
    try {
      // 1. Build context for AI
      const aiContext = await this._buildContext(adminUserId, context);

      // 2. Call OpenAI with function calling
      const toolCalls = await this._getAIDecision(userMessage, aiContext);

      // 3. Validate all tool calls before executing
      const validated = this._validateToolCalls(toolCalls);
      if (!validated.valid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validated.errors,
          raw_tool_calls: toolCalls
        };
      }

      // 4. Execute tool calls
      const results = await this.toolExecutor.executeBatch(validated.calls, adminUserId);

      // 5. Generate UI update instructions
      const uiUpdates = this._generateUIUpdates(results);

      return {
        success: true,
        tool_calls: toolCalls,
        results,
        ui_updates: uiUpdates
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build context for AI decision-making
   */
  async _buildContext(adminUserId, ctx) {
    const context = {
      admin_id: adminUserId,
      current_brand: ctx.brand_scope || 'BOTMANTRA',
      available_brands: Object.keys(BRANDS),
      available_nodes: Object.keys(NODE_TYPES()),
      available_tools: ADMIN_TOOLS.map(t => t.name)
    };

    // Get recent admin actions
    try {
      const { data: recentActions } = await this.supabase
        .from('ai_execution_log')
        .select('action_type, status, created_at')
        .eq('user_id', adminUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      context.recent_actions = recentActions || [];
    } catch { context.recent_actions = []; }

    // Get current layout state
    try {
      const queryResult = await this.nodeFactory.queryNodes({
        owner_id: adminUserId,
        node_state: 'ACTIVE'
      });
      context.active_nodes = queryResult.success ? (queryResult.nodes || []).length : 0;
    } catch { context.active_nodes = 0; }

    return context;
  }

  /**
   * Get AI decision via OpenAI function calling
   */
  async _getAIDecision(userMessage, context) {
    if (!this.openai) {
      // Fallback: keyword-based tool matching (no OpenAI configured)
      return this._keywordFallback(userMessage, context);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: MCP_AI_DESIGNER_PROMPT },
          { role: 'user', content: `Context: ${JSON.stringify(context)}\n\nAdmin request: ${userMessage}` }
        ],
        tools: ADMIN_TOOLS.map(t => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.parameters }
        })),
        tool_choice: 'auto',
        temperature: 0.1
      });

      const msg = response.choices[0].message;

      // Extract tool calls from response
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        return msg.tool_calls.map(tc => ({
          tool: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        }));
      }

      // If AI returned text, try to parse as JSON tool call
      if (msg.content) {
        try {
          const parsed = JSON.parse(msg.content);
          if (Array.isArray(parsed)) return parsed;
          if (parsed.tool) return [parsed];
        } catch { /* not JSON */ }
      }

      return [];

    } catch (error) {
      console.error('OpenAI call failed, using fallback:', error.message);
      return this._keywordFallback(userMessage, context);
    }
  }

  /**
   * Keyword-based fallback when OpenAI is not available
   */
  _keywordFallback(message, context) {
    const lower = message.toLowerCase();
    const brand = context.current_brand || 'BOTMANTRA';
    const calls = [];

    if (lower.includes('create') && lower.includes('widget')) {
      const widgetType = lower.includes('chart') ? 'chart' :
        lower.includes('table') ? 'table' :
        lower.includes('feed') ? 'feed' :
        lower.includes('kanban') ? 'kanban' :
        lower.includes('form') ? 'form' : 'card';

      calls.push({
        tool: 'create_node',
        arguments: {
          node_type: 'widget',
          brand_scope: brand,
          metadata: { widget_type: widgetType }
        }
      });
    }

    if (lower.includes('create') && lower.includes('layout')) {
      const layoutType = lower.includes('feed') ? 'feed' :
        lower.includes('kanban') ? 'kanban' :
        lower.includes('tree') ? 'tree' : 'grid';

      calls.push({
        tool: 'create_node',
        arguments: {
          node_type: 'dashboard_layout',
          brand_scope: brand,
          metadata: { layout_type: layoutType, widgets: [], is_default: false }
        }
      });
    }

    if (lower.includes('update') && lower.includes('theme')) {
      calls.push({
        tool: 'update_theme',
        arguments: { brand_scope: brand, theme_updates: { theme_name: `${brand}_theme` } }
      });
    }

    if (lower.includes('add') && lower.includes('permission')) {
      calls.push({
        tool: 'validate_schema',
        arguments: { node_type: 'permission_rule', metadata: { allowed_roles: ['owner'], allowed_actions: ['read', 'write'] } }
      });
    }

    if (calls.length === 0) {
      calls.push({
        tool: 'validate_schema',
        arguments: { node_type: 'user_node', metadata: { name: 'test', profile_type: 'personal' } }
      });
    }

    return calls;
  }

  /**
   * Validate tool calls before execution
   */
  _validateToolCalls(toolCalls) {
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return { valid: false, errors: ['No tool calls generated'], calls: [] };
    }

    const errors = [];
    const validCalls = [];

    for (const call of toolCalls) {
      const toolDef = ADMIN_TOOLS.find(t => t.name === call.tool);
      if (!toolDef) {
        errors.push(`Unknown tool: ${call.tool}`);
        continue;
      }

      // Check required args
      const required = toolDef.parameters.required || [];
      const missing = required.filter(r => call.arguments?.[r] === undefined);
      if (missing.length > 0) {
        errors.push(`Tool ${call.tool} missing: ${missing.join(', ')}`);
        continue;
      }

      // Schema validation for create_node
      if (call.tool === 'create_node') {
        const v = validateNodeData(call.arguments.node_type, call.arguments.metadata, call.arguments.brand_scope);
        if (!v.valid) {
          errors.push(`Schema validation for ${call.tool}: ${v.errors.join('; ')}`);
          continue;
        }
      }

      // Safety checks
      if (call.tool === 'update_node' || call.tool === 'clone_template') {
        if (!call.arguments.nid_hash && !call.arguments.source_nid_hash) {
          errors.push(`${call.tool}: missing nid_hash`);
          continue;
        }
      }

      validCalls.push(call);
    }

    return {
      valid: errors.length === 0,
      errors,
      calls: validCalls
    };
  }

  /**
   * Generate UI update instructions from tool results
   */
  _generateUIUpdates(results) {
    const updates = [];

    for (const r of results) {
      if (!r.success) continue;

      switch (r.tool) {
        case 'create_node':
          updates.push({ action: 'reload_dashboard', scope: 'full' });
          break;
        case 'update_node':
          updates.push({ action: 'refresh_node', nid_hash: r.result?.nid_hash });
          break;
        case 'attach_widget_to_layout':
          updates.push({ action: 'reload_layout', layout_nid_hash: r.result?.layout_nid_hash });
          break;
        case 'update_theme':
          updates.push({ action: 'apply_theme', theme_id: r.result?.theme_id });
          break;
        case 'activate_layout_version':
          updates.push({ action: 'switch_layout', layout_nid_hash: r.result?.layout_nid_hash });
          break;
        default:
          updates.push({ action: 'refresh', tool: r.tool });
      }
    }

    return updates;
  }

  /**
   * Get system prompt for external use
   */
  getSystemPrompt() {
    return MCP_AI_DESIGNER_PROMPT;
  }

  /**
   * Get available tools for the frontend
   */
  getAvailableTools() {
    return ADMIN_TOOLS;
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────
module.exports = {
  MCP_AI_DESIGNER_PROMPT,
  MCPDesigner,
  ADMIN_TOOLS
};
