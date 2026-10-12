/**
 * KERNEL INTEGRATION - MCP Chat-Driven Control
 * 
 * Floating chat is the MCP controller
 * 
 * Flow:
 * User voice/text → Kernel (OpenAI with tools) → 
 * AI decides action → Kernel executes → UI reloads
 */

const nodeCore = require('./nodeCore');
const dashboardLoader = require('./dashboardLoader');
const brandRouter = require('./brandRouter');
const NodeFactory = require('./nodeFactory');

/**
 * MCP Tool Definitions
 * Available to AI for decision making
 */
const MCP_TOOLS = {
  query_vector: {
    description: 'Query vector memory for context',
    params: ['query', 'limit', 'node_type']
  },
  modify_layout: {
    description: 'Change dashboard layout',
    params: ['layout_type', 'widgets']
  },
  fetch_node: {
    description: 'Fetch specific node by type and filters',
    params: ['node_type', 'filters']
  },
  create_relationship: {
    description: 'Create relationship between nodes',
    params: ['from_node', 'to_node', 'relationship_type']
  },
  update_node_metadata: {
    description: 'Update node metadata',
    params: ['node_id', 'metadata_updates']
  },
  switch_brand: {
    description: 'Switch active brand view',
    params: ['brand_key']
  },
  create_node: {
    description: 'Create new node',
    params: ['node_type', 'node_data']
  },
  search_nodes: {
    description: 'Search nodes by criteria',
    params: ['node_type', 'search_params']
  },
  get_recommendations: {
    description: 'Get AI recommendations',
    params: ['context_type']
  }
};

/**
 * Kernel Integration Manager
 */
class KernelIntegration {
  /**
   * Process MCP request from Floating Chat
   * 
   * Flow:
   * 1. Receive user input (voice/text)
   * 2. Send to Kernel with tools
   * 3. Kernel calls AI
   * 4. AI decides which tools to use
   * 5. Execute tools
   * 6. Return updated UI state
   */
  async processMCPRequest(userId, userInput, context = {}) {
    try {
      console.log('MCP Request:', userInput);

      // Prepare context for AI
      const aiContext = await this.buildAIContext(userId, context);

      // This would call OpenAI or another LLM with tools
      // For now, we'll use a simple decision engine
      const toolsToExecute = await this.decideTools(
        userInput,
        aiContext
      );

      // Execute tools
      const toolResults = await this.executeTools(
        userId,
        toolsToExecute
      );

      // Determine UI update needed
      const uiUpdate = await this.generateUIUpdate(
        userId,
        toolResults
      );

      return {
        success: true,
        user_input: userInput,
        tools_executed: toolResults.length,
        ui_update: uiUpdate
      };
    } catch (error) {
      console.error('MCP request error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build AI context from user node and surroundings
   */
  async buildAIContext(userId, context) {
    try {
      const userNode = await nodeCore.loadUserNode(userId);
      const activeBrand = await brandRouter.getActiveBrand(userId);

      return {
        user_id: userId,
        user_name: userNode.user_node.metadata.name,
        age: userNode.user_node.metadata.age,
        active_brand: activeBrand.active_brand,
        brand_definition: activeBrand.brand_definition,
        recent_activity: context.recent_activity || [],
        vector_hints: context.vector_hints || [],
        current_location: context.current_location || 'dashboard',
        user_preferences: userNode.permission_node.metadata.permissions
      };
    } catch (error) {
      console.error('Build AI context error:', error);
      return {};
    }
  }

  /**
   * Decide which tools to use (simple decision engine)
   * In production, this would call OpenAI with tools
   */
  async decideTools(userInput, context) {
    const input = userInput.toLowerCase();

    // Example patterns
    if (input.includes('family') || input.includes('show connections')) {
      return [
        {
          tool: 'switch_brand',
          params: { brand_key: 'vanshawali' }
        },
        {
          tool: 'modify_layout',
          params: { layout_type: 'family_tree' }
        }
      ];
    }

    if (input.includes('posts') || input.includes('feed')) {
      return [
        {
          tool: 'fetch_node',
          params: {
            node_type: 'post',
            filters: { 
              owner_node: context.user_id,
              brand_root: 'vanshawali'
            }
          }
        }
      ];
    }

    if (input.includes('homework') || input.includes('assignments')) {
      return [
        {
          tool: 'switch_brand',
          params: { brand_key: 'jeetmantra' }
        },
        {
          tool: 'fetch_node',
          params: {
            node_type: 'homework',
            filters: { 
              owner_node: context.user_id,
              status: 'active'
            }
          }
        }
      ];
    }

    if (input.includes('tasks') || input.includes('office')) {
      return [
        {
          tool: 'switch_brand',
          params: { brand_key: 'mantravat' }
        },
        {
          tool: 'fetch_node',
          params: {
            node_type: 'task',
            filters: { owner_node: context.user_id }
          }
        }
      ];
    }

    if (input.includes('create') || input.includes('new')) {
      // Parse what to create
      if (input.includes('post')) {
        return [
          {
            tool: 'create_node',
            params: {
              node_type: 'post',
              node_data: { title: 'New Post', visibility: 'friends' }
            }
          }
        ];
      }
    }

    // Default: query vector
    return [
      {
        tool: 'query_vector',
        params: { query: userInput, limit: 5 }
      }
    ];
  }

  /**
   * Execute tools
   */
  async executeTools(userId, toolsToExecute) {
    const results = [];

    for (const toolCall of toolsToExecute) {
      try {
        let result;

        switch (toolCall.tool) {
          case 'query_vector':
            result = await this.tool_queryVector(userId, toolCall.params);
            break;

          case 'modify_layout':
            result = await this.tool_modifyLayout(userId, toolCall.params);
            break;

          case 'fetch_node':
            result = await this.tool_fetchNode(userId, toolCall.params);
            break;

          case 'create_relationship':
            result = await this.tool_createRelationship(userId, toolCall.params);
            break;

          case 'update_node_metadata':
            result = await this.tool_updateNodeMetadata(userId, toolCall.params);
            break;

          case 'switch_brand':
            result = await this.tool_switchBrand(userId, toolCall.params);
            break;

          case 'create_node':
            result = await this.tool_createNode(userId, toolCall.params);
            break;

          case 'search_nodes':
            result = await this.tool_searchNodes(userId, toolCall.params);
            break;

          case 'get_recommendations':
            result = await this.tool_getRecommendations(userId, toolCall.params);
            break;

          default:
            result = { success: false, error: 'Unknown tool' };
        }

        results.push({
          tool: toolCall.tool,
          result
        });
      } catch (error) {
        console.error(`Tool ${toolCall.tool} error:`, error);
        results.push({
          tool: toolCall.tool,
          result: { success: false, error: error.message }
        });
      }
    }

    return results;
  }

  /**
   * TOOL IMPLEMENTATIONS
   */

  async tool_queryVector(userId, params) {
    const queryResult = await NodeFactory.queryNodes({
      owner_id: userId,
      node_type: 'vector_memory'
    });

    if (!queryResult.success || !queryResult.nodes || queryResult.nodes.length === 0) {
      return {
        success: false,
        error: 'No vector memory found'
      };
    }

    const vectorNode = queryResult.nodes[0];

    return {
      success: true,
      query: params.query,
      results: vectorNode.memory_blob ? 
        JSON.parse(vectorNode.memory_blob).embeddings?.slice(0, params.limit || 5) || [] : []
    };
  }

  async tool_modifyLayout(userId, params) {
    // Get current layout node
    const queryResult = await NodeFactory.queryNodes({
      owner_id: userId,
      node_type: 'layout_schema'
    });

    if (!queryResult.success || !queryResult.nodes || queryResult.nodes.length === 0) {
      return {
        success: false,
        error: 'No layout schema found'
      };
    }

    const layoutNode = queryResult.nodes[0];

    // Update layout
    const updateResult = await NodeFactory.updateNode(layoutNode.nid_hash, {
      ui_schema: {
        ...layoutNode.ui_schema,
        layout_type: params.layout_type,
        widgets: params.widgets || []
      },
      updated_at: new Date().toISOString()
    });

    return {
      success: updateResult.success,
      layout_type: params.layout_type
    };
  }

  async tool_fetchNode(userId, params) {
    const queryParams = {
      node_type: params.node_type
    };

    // Add filters
    if (params.filters) {
      Object.assign(queryParams, params.filters);
    }

    const queryResult = await NodeFactory.queryNodes(queryParams);

    if (!queryResult.success) {
      return {
        success: false,
        error: queryResult.error
      };
    }

    return {
      success: true,
      node_type: params.node_type,
      count: queryResult.nodes ? queryResult.nodes.length : 0,
      nodes: queryResult.nodes ? queryResult.nodes.slice(0, 10) : [] // Limit to 10
    };
  }

  async tool_createRelationship(userId, params) {
    return await nodeCore.createRelationship(
      params.from_node,
      params.to_node,
      params.relationship_type
    );
  }

  async tool_updateNodeMetadata(userId, params) {
    return await nodeCore.updateNode(params.node_id, {
      metadata: params.metadata_updates
    });
  }

  async tool_switchBrand(userId, params) {
    return await brandRouter.switchBrand(userId, params.brand_key);
  }

  async tool_createNode(userId, params) {
    return await NodeFactory.createNonLiveNode(
      userId,
      params.node_type,
      params.node_data
    );
  }

  async tool_searchNodes(userId, params) {
    return await nodeCore.queryNodes(params.search_params);
  }

  async tool_getRecommendations(userId, params) {
    // Placeholder for AI recommendations
    return {
      success: true,
      recommendations: [
        { type: 'widget', title: 'Suggested Widget 1' },
        { type: 'widget', title: 'Suggested Widget 2' }
      ]
    };
  }

  /**
   * Generate UI update from tool results
   */
  async generateUIUpdate(userId, toolResults) {
    // Check if brand was switched
    const brandSwitched = toolResults.some(r => r.tool === 'switch_brand');

    if (brandSwitched) {
      // Reload entire dashboard
      const dashboard = await dashboardLoader.loadDashboard(userId);
      return {
        type: 'full_reload',
        dashboard: dashboard.dashboard
      };
    }

    // Check if layout was modified
    const layoutModified = toolResults.some(r => r.tool === 'modify_layout');

    if (layoutModified) {
      return {
        type: 'layout_update',
        reload_sections: ['widgets', 'layout']
      };
    }

    // Check if nodes were created
    const nodeCreated = toolResults.some(r => r.tool === 'create_node');

    if (nodeCreated) {
      return {
        type: 'node_created',
        reload_sections: ['feed']
      };
    }

    // Default: refresh current view
    return {
      type: 'refresh',
      reload_sections: ['all']
    };
  }

  /**
   * Get available MCP tools
   */
  getAvailableTools() {
    return {
      success: true,
      tools: MCP_TOOLS
    };
  }
}

module.exports = new KernelIntegration();
