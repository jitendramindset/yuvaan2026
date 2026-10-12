/**
 * AI Model Router Node System
 * Neural OS Integration for AI Model Router Management
 */

const NodeFactory = require('./nodeFactory');
const { supabase } = require('../config/supabase');

class AIModelRouterNode {
  constructor() {
    this.nodeType = 'ai-model-router';
    this.tableName = 'ai_model_router';
  }

  /**
   * Create a new AI model router configuration node
   * @param {Object} routerData - Router configuration data
   * @param {string} routerData.user_id - User ID
   * @param {string} routerData.provider - AI provider (openai, anthropic, etc.)
   * @param {string} routerData.api_key - API key for the provider
   * @param {string} routerData.fallback_provider - Fallback provider
   * @param {Object} routerData.models - Available models configuration
   * @param {Object} routerData.rate_limits - Rate limiting configuration
   * @param {Object} routerData.cost_tracking - Cost tracking settings
   * @param {boolean} routerData.is_active - Active status
   * @param {Object} routerData.metadata - Additional metadata
   * @param {string} nodeCode - Node code for identification
   * @returns {Promise<Object>} Created router configuration node
   */
  async createModelRouter(routerData, nodeCode = null) {
    try {
      // Generate node code if not provided
      if (!nodeCode) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        nodeCode = `ai-router-${timestamp}-${randomId}`;
      }

      // Create the database record
      const dbData = {
        user_id: routerData.user_id,
        provider: routerData.provider,
        api_key: routerData.api_key,
        fallback_provider: routerData.fallback_provider,
        models: routerData.models || {},
        rate_limits: routerData.rate_limits || {},
        cost_tracking: routerData.cost_tracking || {},
        is_active: routerData.is_active !== false,
        metadata: routerData.metadata || {}
      };

      const { data: dbRecord, error: dbError } = await supabase
        .from(this.tableName)
        .insert(dbData)
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Create the node
      const nodeData = {
        node_code: nodeCode,
        node_type: this.nodeType,
        metadata: {
          user_id: routerData.user_id,
          provider: routerData.provider,
          fallback_provider: routerData.fallback_provider,
          models: routerData.models || {},
          rate_limits: routerData.rate_limits || {},
          cost_tracking: routerData.cost_tracking || {},
          database_id: dbRecord.id,
          created_at: dbRecord.created_at,
          is_active: routerData.is_active !== false,
          api_calls_count: 0,
          total_cost: 0,
          last_used: null,
          error_count: 0,
          success_rate: 1.0,
          ...routerData.metadata
        },
        relationships: [
          {
            target_node_code: `user-${routerData.user_id}`,
            relationship_type: 'belongs_to_user'
          }
        ]
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);

      // Log the creation
      await this._logModelRouter('create', {
        node_code: nodeCode,
        user_id: routerData.user_id,
        provider: routerData.provider
      });

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating model router:', error);
      throw error;
    }
  }

  /**
   * Query AI model router configurations by criteria
   * @param {Object} criteria - Query criteria
   * @param {string} criteria.user_id - Filter by user ID
   * @param {string} criteria.provider - Filter by provider
   * @param {boolean} criteria.is_active - Filter by active status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of router configuration nodes
   */
  async queryModelRouters(criteria = {}, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }
      if (criteria.provider) {
        query = query.eq('provider', criteria.provider);
      }
      if (criteria.is_active !== undefined) {
        query = query.eq('is_active', criteria.is_active);
      }

      // Apply ordering
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data: routers, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to nodes
      const nodes = [];
      for (const router of routers) {
        const nodeCode = `ai-router-${router.id}`;
        const node = await NodeFactory.queryNodes({ node_code: nodeCode });

        if (node && node.length > 0) {
          nodes.push(node[0]);
        } else {
          // Create node if it doesn't exist
          const nodeData = {
            node_code: nodeCode,
            node_type: this.nodeType,
            metadata: {
              user_id: router.user_id,
              provider: router.provider,
              fallback_provider: router.fallback_provider,
              models: router.models || {},
              rate_limits: router.rate_limits || {},
              cost_tracking: router.cost_tracking || {},
              database_id: router.id,
              created_at: router.created_at,
              is_active: router.is_active,
              api_calls_count: router.api_calls_count || 0,
              total_cost: router.total_cost || 0,
              last_used: router.last_used,
              error_count: router.error_count || 0,
              success_rate: router.success_rate || 1.0,
              ...router.metadata
            },
            relationships: [
              {
                target_node_code: `user-${router.user_id}`,
                relationship_type: 'belongs_to_user'
              }
            ]
          };

          const createdNode = await NodeFactory.createNonLiveNode(nodeData);
          nodes.push(createdNode);
        }
      }

      return nodes;
    } catch (error) {
      console.error('Error querying model routers:', error);
      throw error;
    }
  }

  /**
   * Update a model router configuration
   * @param {string} nodeCode - Node code of the router to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated router configuration node
   */
  async updateModelRouter(nodeCode, updateData) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-router-', '');

      // Update database record
      const dbUpdateData = {};
      if (updateData.api_key !== undefined) dbUpdateData.api_key = updateData.api_key;
      if (updateData.fallback_provider !== undefined) dbUpdateData.fallback_provider = updateData.fallback_provider;
      if (updateData.models !== undefined) dbUpdateData.models = updateData.models;
      if (updateData.rate_limits !== undefined) dbUpdateData.rate_limits = updateData.rate_limits;
      if (updateData.cost_tracking !== undefined) dbUpdateData.cost_tracking = updateData.cost_tracking;
      if (updateData.is_active !== undefined) dbUpdateData.is_active = updateData.is_active;
      if (updateData.api_calls_count !== undefined) dbUpdateData.api_calls_count = updateData.api_calls_count;
      if (updateData.total_cost !== undefined) dbUpdateData.total_cost = updateData.total_cost;
      if (updateData.last_used !== undefined) dbUpdateData.last_used = updateData.last_used;
      if (updateData.error_count !== undefined) dbUpdateData.error_count = updateData.error_count;
      if (updateData.success_rate !== undefined) dbUpdateData.success_rate = updateData.success_rate;
      if (updateData.metadata !== undefined) dbUpdateData.metadata = updateData.metadata;

      const { data: dbRecord, error: dbError } = await supabase
        .from(this.tableName)
        .update(dbUpdateData)
        .eq('id', databaseId)
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Update node
      const nodeUpdateData = {
        metadata: {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      };

      const updatedNode = await NodeFactory.updateNode(nodeCode, nodeUpdateData);

      // Log the update
      await this._logModelRouter('update', {
        node_code: nodeCode,
        updates: Object.keys(updateData)
      });

      return {
        node: updatedNode,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error updating model router:', error);
      throw error;
    }
  }

  /**
   * Route an AI request to the appropriate model
   * @param {string} userId - User ID
   * @param {Object} request - AI request details
   * @param {string} request.model - Requested model
   * @param {string} request.task_type - Type of task (chat, completion, etc.)
   * @returns {Promise<Object>} Routing decision with provider and model
   */
  async routeRequest(userId, request) {
    try {
      // Get active routers for the user
      const routers = await this.queryModelRouters({
        user_id: userId,
        is_active: true
      });

      if (routers.length === 0) {
        throw new Error('No active model routers found for user');
      }

      // Find the best router for this request
      const bestRouter = this._selectBestRouter(routers, request);

      if (!bestRouter) {
        throw new Error('No suitable router found for the requested model/task');
      }

      // Update usage statistics
      await this._updateRouterStats(bestRouter.node_code, 'success');

      return {
        router_node_code: bestRouter.node_code,
        provider: bestRouter.metadata.provider,
        api_key: await this._getDecryptedApiKey(bestRouter.node_code),
        model: this._resolveModel(bestRouter, request.model),
        fallback_provider: bestRouter.metadata.fallback_provider,
        rate_limits: bestRouter.metadata.rate_limits,
        cost_tracking: bestRouter.metadata.cost_tracking
      };
    } catch (error) {
      console.error('Error routing request:', error);
      throw error;
    }
  }

  /**
   * Handle routing failure and fallback
   * @param {string} routerNodeCode - Router node code that failed
   * @param {Object} request - Original request
   * @returns {Promise<Object>} Fallback routing decision
   */
  async handleRoutingFailure(routerNodeCode, request) {
    try {
      // Update error statistics
      await this._updateRouterStats(routerNodeCode, 'failure');

      // Get the router configuration
      const routers = await this.queryModelRouters();
      const router = routers.find(node => node.node_code === routerNodeCode);

      if (!router || !router.metadata.fallback_provider) {
        throw new Error('No fallback provider configured');
      }

      // Find fallback router
      const fallbackRouters = await this.queryModelRouters({
        user_id: router.metadata.user_id,
        provider: router.metadata.fallback_provider,
        is_active: true
      });

      if (fallbackRouters.length === 0) {
        throw new Error('Fallback provider not available');
      }

      const fallbackRouter = fallbackRouters[0];

      return {
        router_node_code: fallbackRouter.node_code,
        provider: fallbackRouter.metadata.provider,
        api_key: await this._getDecryptedApiKey(fallbackRouter.node_code),
        model: this._resolveModel(fallbackRouter, request.model),
        is_fallback: true,
        original_provider: router.metadata.provider
      };
    } catch (error) {
      console.error('Error handling routing failure:', error);
      throw error;
    }
  }

  /**
   * Get router statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Router usage statistics
   */
  async getRouterStats(userId) {
    try {
      const routers = await this.queryModelRouters({ user_id: userId });

      const stats = {
        total_routers: routers.length,
        active_routers: 0,
        total_api_calls: 0,
        total_cost: 0,
        avg_success_rate: 0,
        provider_breakdown: {},
        cost_by_provider: {},
        error_rate_by_provider: {}
      };

      let totalSuccessRate = 0;
      let activeCount = 0;

      routers.forEach(router => {
        if (router.metadata.is_active) {
          stats.active_routers++;
          activeCount++;
        }

        stats.total_api_calls += router.metadata.api_calls_count || 0;
        stats.total_cost += router.metadata.total_cost || 0;

        if (router.metadata.success_rate !== undefined) {
          totalSuccessRate += router.metadata.success_rate;
        }

        // Provider breakdown
        const provider = router.metadata.provider;
        stats.provider_breakdown[provider] = (stats.provider_breakdown[provider] || 0) + 1;
        stats.cost_by_provider[provider] = (stats.cost_by_provider[provider] || 0) + (router.metadata.total_cost || 0);

        const errorRate = router.metadata.error_count && router.metadata.api_calls_count ?
          router.metadata.error_count / router.metadata.api_calls_count : 0;
        stats.error_rate_by_provider[provider] = errorRate;
      });

      stats.avg_success_rate = activeCount > 0 ? totalSuccessRate / activeCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting router stats:', error);
      throw error;
    }
  }

  /**
   * Delete a model router configuration
   * @param {string} nodeCode - Node code of the router to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteModelRouter(nodeCode) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-router-', '');

      // Delete from database
      const { error: dbError } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', databaseId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Delete node (if NodeFactory supports deletion)
      // For now, we'll mark it as deleted in metadata
      const nodeUpdateData = {
        metadata: {
          deleted: true,
          deleted_at: new Date().toISOString(),
          is_active: false
        }
      };

      await NodeFactory.updateNode(nodeCode, nodeUpdateData);

      // Log the deletion
      await this._logModelRouter('delete', {
        node_code: nodeCode
      });

      return true;
    } catch (error) {
      console.error('Error deleting model router:', error);
      throw error;
    }
  }

  /**
   * Select the best router for a given request
   * @private
   * @param {Array} routers - Available routers
   * @param {Object} request - Request details
   * @returns {Object} Best router node
   */
  _selectBestRouter(routers, request) {
    // Simple selection logic - can be enhanced with ML-based routing
    const suitableRouters = routers.filter(router => {
      const models = router.metadata.models || {};
      return models[request.model] || models['*']; // Support wildcard models
    });

    if (suitableRouters.length === 0) return null;

    // Select based on success rate and cost
    return suitableRouters.reduce((best, current) => {
      const bestScore = (best.metadata.success_rate || 0) - (best.metadata.total_cost || 0) * 0.1;
      const currentScore = (current.metadata.success_rate || 0) - (current.metadata.total_cost || 0) * 0.1;
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Resolve the actual model name from router configuration
   * @private
   * @param {Object} router - Router node
   * @param {string} requestedModel - Requested model name
   * @returns {string} Resolved model name
   */
  _resolveModel(router, requestedModel) {
    const models = router.metadata.models || {};
    return models[requestedModel] || models['*'] || requestedModel;
  }

  /**
   * Get decrypted API key (placeholder - implement actual decryption)
   * @private
   * @param {string} nodeCode - Router node code
   * @returns {Promise<string>} Decrypted API key
   */
  async _getDecryptedApiKey(nodeCode) {
    // In a real implementation, this would decrypt the stored API key
    // For now, we'll query the database directly (not recommended for production)
    const databaseId = nodeCode.replace('ai-router-', '');
    const { data, error } = await supabase
      .from(this.tableName)
      .select('api_key')
      .eq('id', databaseId)
      .single();

    if (error) throw new Error('Failed to retrieve API key');
    return data.api_key;
  }

  /**
   * Update router statistics
   * @private
   * @param {string} nodeCode - Router node code
   * @param {string} result - 'success' or 'failure'
   */
  async _updateRouterStats(nodeCode, result) {
    try {
      const routers = await this.queryModelRouters();
      const router = routers.find(node => node.node_code === nodeCode);

      if (!router) return;

      const updates = {
        api_calls_count: (router.metadata.api_calls_count || 0) + 1,
        last_used: new Date().toISOString()
      };

      if (result === 'failure') {
        updates.error_count = (router.metadata.error_count || 0) + 1;
      }

      // Recalculate success rate
      const totalCalls = updates.api_calls_count;
      const errorCount = updates.error_count || router.metadata.error_count || 0;
      updates.success_rate = totalCalls > 0 ? (totalCalls - errorCount) / totalCalls : 1.0;

      await this.updateModelRouter(nodeCode, updates);
    } catch (error) {
      console.error('Error updating router stats:', error);
    }
  }

  /**
   * Log model router operations to ai_model_router table
   * @private
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  async _logModelRouter(operation, details) {
    try {
      const logData = {
        user_id: details.user_id || 'system',
        provider: details.provider || 'system',
        api_key: 'log-entry', // Placeholder for logging
        fallback_provider: 'none',
        models: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        },
        rate_limits: {},
        cost_tracking: {},
        is_active: true,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        }
      };

      await supabase
        .from('ai_model_router')
        .insert(logData);

    } catch (error) {
      console.error('Error logging model router operation:', error);
      // Don't throw - logging failure shouldn't break main operation
    }
  }
}

module.exports = {
  AIModelRouterNode,
  aiModelRouterNode: new AIModelRouterNode()
};