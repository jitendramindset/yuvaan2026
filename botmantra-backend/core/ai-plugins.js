/**
 * AI Plugins Node System
 * Node-based AI plugins management within the neural OS architecture
 */

const NodeFactory = require('./nodeFactory');

class AIPluginsNode {
  constructor() {
    this.nodeFactory = new NodeFactory();
  }

  /**
   * Create a new AI plugin configuration
   */
  async createPlugin(pluginData, nodeCode = null) {
    try {
      // Create the node using NodeFactory
      const nodeData = {
        node_type: 'ai_plugin',
        owner_id: pluginData.user_id,
        node_code: nodeCode,
        metadata: {
          plugin_name: pluginData.plugin_name,
          plugin_type: pluginData.plugin_type,
          provider: pluginData.provider,
          api_key: pluginData.api_key, // In production, this should be encrypted
          config: pluginData.config || {},
          capabilities: pluginData.capabilities || [],
          is_active: pluginData.is_active !== false,
          version: pluginData.version || '1.0.0',
          description: pluginData.description,
          tags: pluginData.tags || [],
          rate_limits: pluginData.rate_limits || {
            requests_per_minute: 60,
            requests_per_hour: 1000,
            tokens_per_minute: 10000
          },
          cost_tracking: pluginData.cost_tracking || {
            enabled: true,
            currency: 'USD',
            budget_limit: 100.00,
            alert_threshold: 0.80
          },
          last_used: pluginData.last_used,
          usage_count: pluginData.usage_count || 0,
          success_rate: pluginData.success_rate || 1.0,
          total_cost: pluginData.total_cost || 0.0,
          error_count: pluginData.error_count || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relationships: {
          owner: pluginData.user_id,
          type: 'ai_plugin'
        }
      };

      const result = await this.nodeFactory.createNonLiveNode(nodeData);

      // Insert into ai_plugins table
      const { supabase } = require('../config/supabase');
      const dbRecord = {
        node_code: result.node.node_code,
        user_id: pluginData.user_id,
        plugin_name: pluginData.plugin_name,
        plugin_type: pluginData.plugin_type,
        provider: pluginData.provider,
        api_key: pluginData.api_key,
        config: pluginData.config || {},
        capabilities: pluginData.capabilities || [],
        is_active: pluginData.is_active !== false,
        version: pluginData.version || '1.0.0',
        description: pluginData.description,
        tags: pluginData.tags || [],
        rate_limits: pluginData.rate_limits || {
          requests_per_minute: 60,
          requests_per_hour: 1000,
          tokens_per_minute: 10000
        },
        cost_tracking: pluginData.cost_tracking || {
          enabled: true,
          currency: 'USD',
          budget_limit: 100.00,
          alert_threshold: 0.80
        },
        last_used: pluginData.last_used,
        usage_count: pluginData.usage_count || 0,
        success_rate: pluginData.success_rate || 1.0,
        total_cost: pluginData.total_cost || 0.0,
        error_count: pluginData.error_count || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_plugins')
        .insert([dbRecord])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to insert plugin record: ${error.message}`);
      }

      return {
        node: result.node,
        database_record: data
      };
    } catch (error) {
      console.error('Error creating AI plugin:', error);
      throw error;
    }
  }

  /**
   * Query AI plugins by criteria
   */
  async queryPlugins(criteria = {}, options = {}) {
    try {
      const { supabase } = require('../config/supabase');

      let query = supabase
        .from('ai_plugins')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }
      if (criteria.plugin_type) {
        query = query.eq('plugin_type', criteria.plugin_type);
      }
      if (criteria.provider) {
        query = query.eq('provider', criteria.provider);
      }
      if (criteria.is_active !== undefined) {
        query = query.eq('is_active', criteria.is_active);
      }
      if (criteria.plugin_name) {
        query = query.ilike('plugin_name', `%${criteria.plugin_name}%`);
      }
      if (criteria.tags && criteria.tags.length > 0) {
        query = query.overlaps('tags', criteria.tags);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to query plugins: ${error.message}`);
      }

      // Get corresponding nodes
      const nodes = [];
      for (const record of data) {
        try {
          const node = await this.nodeFactory.queryNodes({
            node_code: record.node_code,
            node_type: 'ai_plugin'
          });
          if (node.length > 0) {
            nodes.push({
              node: node[0],
              database_record: record
            });
          }
        } catch (nodeError) {
          console.warn(`Failed to get node for plugin ${record.node_code}:`, nodeError);
        }
      }

      return nodes;
    } catch (error) {
      console.error('Error querying AI plugins:', error);
      throw error;
    }
  }

  /**
   * Update an AI plugin
   */
  async updatePlugin(nodeCode, updateData) {
    try {
      // Update the node
      const nodeUpdate = {
        metadata: {}
      };

      if (updateData.plugin_name !== undefined) nodeUpdate.metadata.plugin_name = updateData.plugin_name;
      if (updateData.plugin_type !== undefined) nodeUpdate.metadata.plugin_type = updateData.plugin_type;
      if (updateData.provider !== undefined) nodeUpdate.metadata.provider = updateData.provider;
      if (updateData.api_key !== undefined) nodeUpdate.metadata.api_key = updateData.api_key;
      if (updateData.config !== undefined) nodeUpdate.metadata.config = updateData.config;
      if (updateData.capabilities !== undefined) nodeUpdate.metadata.capabilities = updateData.capabilities;
      if (updateData.is_active !== undefined) nodeUpdate.metadata.is_active = updateData.is_active;
      if (updateData.version !== undefined) nodeUpdate.metadata.version = updateData.version;
      if (updateData.description !== undefined) nodeUpdate.metadata.description = updateData.description;
      if (updateData.tags !== undefined) nodeUpdate.metadata.tags = updateData.tags;
      if (updateData.rate_limits !== undefined) nodeUpdate.metadata.rate_limits = updateData.rate_limits;
      if (updateData.cost_tracking !== undefined) nodeUpdate.metadata.cost_tracking = updateData.cost_tracking;
      if (updateData.last_used !== undefined) nodeUpdate.metadata.last_used = updateData.last_used;
      if (updateData.usage_count !== undefined) nodeUpdate.metadata.usage_count = updateData.usage_count;
      if (updateData.success_rate !== undefined) nodeUpdate.metadata.success_rate = updateData.success_rate;
      if (updateData.total_cost !== undefined) nodeUpdate.metadata.total_cost = updateData.total_cost;
      if (updateData.error_count !== undefined) nodeUpdate.metadata.error_count = updateData.error_count;

      nodeUpdate.metadata.updated_at = new Date().toISOString();

      const nodeResult = await this.nodeFactory.updateNode(nodeCode, nodeUpdate);

      // Update database record
      const { supabase } = require('../config/supabase');
      const dbUpdate = { ...updateData, updated_at: new Date().toISOString() };

      const { data, error } = await supabase
        .from('ai_plugins')
        .update(dbUpdate)
        .eq('node_code', nodeCode)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update plugin record: ${error.message}`);
      }

      return {
        node: nodeResult,
        database_record: data
      };
    } catch (error) {
      console.error('Error updating AI plugin:', error);
      throw error;
    }
  }

  /**
   * Execute an AI plugin
   */
  async executePlugin(nodeCode, executionData) {
    try {
      // Get plugin configuration
      const plugins = await this.queryPlugins({ node_code: nodeCode });
      if (plugins.length === 0) {
        throw new Error('Plugin not found');
      }

      const plugin = plugins[0];

      // Check if plugin is active
      if (!plugin.database_record.is_active) {
        throw new Error('Plugin is not active');
      }

      // Check rate limits (simplified implementation)
      const now = Date.now();
      const lastUsed = plugin.database_record.last_used ? new Date(plugin.database_record.last_used).getTime() : 0;
      const timeDiff = now - lastUsed;

      if (timeDiff < (60 * 1000) / plugin.database_record.rate_limits.requests_per_minute) {
        throw new Error('Rate limit exceeded');
      }

      // Execute plugin logic (this would be customized per plugin type)
      const result = await this._executePluginLogic(plugin, executionData);

      // Update usage statistics
      await this.updatePlugin(nodeCode, {
        last_used: new Date().toISOString(),
        usage_count: plugin.database_record.usage_count + 1,
        total_cost: plugin.database_record.total_cost + (result.cost || 0),
        success_rate: result.success ?
          ((plugin.database_record.success_rate * plugin.database_record.usage_count) + 1) / (plugin.database_record.usage_count + 1) :
          (plugin.database_record.success_rate * plugin.database_record.usage_count) / (plugin.database_record.usage_count + 1),
        error_count: result.success ? plugin.database_record.error_count : plugin.database_record.error_count + 1
      });

      return {
        success: result.success,
        output: result.output,
        cost: result.cost || 0,
        execution_time: result.execution_time,
        plugin: {
          node_code: plugin.node.node_code,
          plugin_name: plugin.database_record.plugin_name,
          plugin_type: plugin.database_record.plugin_type
        }
      };
    } catch (error) {
      console.error('Error executing AI plugin:', error);
      throw error;
    }
  }

  /**
   * Execute plugin-specific logic
   */
  async _executePluginLogic(plugin, executionData) {
    const startTime = Date.now();

    try {
      switch (plugin.database_record.plugin_type) {
        case 'text_generation':
          return await this._executeTextGeneration(plugin, executionData);
        case 'image_generation':
          return await this._executeImageGeneration(plugin, executionData);
        case 'code_analysis':
          return await this._executeCodeAnalysis(plugin, executionData);
        case 'data_processing':
          return await this._executeDataProcessing(plugin, executionData);
        case 'custom':
          return await this._executeCustomPlugin(plugin, executionData);
        default:
          throw new Error(`Unsupported plugin type: ${plugin.database_record.plugin_type}`);
      }
    } catch (error) {
      return {
        success: false,
        output: null,
        cost: 0,
        execution_time: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Execute text generation plugin
   */
  async _executeTextGeneration(plugin, data) {
    // Mock implementation - in real scenario, this would call the actual AI provider
    const executionTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, executionTime));

    return {
      success: Math.random() > 0.1, // 90% success rate
      output: {
        text: `Generated text for prompt: "${data.prompt}"`,
        tokens_used: Math.floor(data.prompt.length * 1.5),
        model: plugin.database_record.config.model || 'gpt-3.5-turbo'
      },
      cost: (data.prompt.length * 0.00002), // Mock cost calculation
      execution_time: executionTime
    };
  }

  /**
   * Execute image generation plugin
   */
  async _executeImageGeneration(plugin, data) {
    const executionTime = Math.random() * 5000 + 2000; // 2-7 seconds
    await new Promise(resolve => setTimeout(resolve, executionTime));

    return {
      success: Math.random() > 0.15, // 85% success rate
      output: {
        image_url: `https://example.com/generated-image-${Date.now()}.png`,
        prompt: data.prompt,
        size: data.size || '512x512'
      },
      cost: 0.02, // Fixed cost for image generation
      execution_time: executionTime
    };
  }

  /**
   * Execute code analysis plugin
   */
  async _executeCodeAnalysis(plugin, data) {
    const executionTime = Math.random() * 1000 + 300; // 300-1300ms
    await new Promise(resolve => setTimeout(resolve, executionTime));

    return {
      success: Math.random() > 0.05, // 95% success rate
      output: {
        analysis: `Code analysis for ${data.language}: ${data.code.length} characters`,
        suggestions: ['Consider using const instead of let', 'Add error handling'],
        complexity: Math.floor(Math.random() * 10) + 1
      },
      cost: (data.code.length * 0.00001),
      execution_time: executionTime
    };
  }

  /**
   * Execute data processing plugin
   */
  async _executeDataProcessing(plugin, data) {
    const executionTime = Math.random() * 3000 + 1000; // 1-4 seconds
    await new Promise(resolve => setTimeout(resolve, executionTime));

    return {
      success: Math.random() > 0.1, // 90% success rate
      output: {
        processed_data: `Processed ${data.data_points || 0} data points`,
        insights: ['Trend detected', 'Anomaly found'],
        confidence: Math.random() * 0.3 + 0.7 // 70-100%
      },
      cost: (data.data_points || 100) * 0.001,
      execution_time: executionTime
    };
  }

  /**
   * Execute custom plugin
   */
  async _executeCustomPlugin(plugin, data) {
    const executionTime = Math.random() * 1500 + 500; // 500-2000ms
    await new Promise(resolve => setTimeout(resolve, executionTime));

    return {
      success: Math.random() > 0.2, // 80% success rate
      output: {
        result: `Custom plugin execution: ${JSON.stringify(data)}`,
        custom_output: plugin.database_record.config.custom_logic || 'Default custom logic'
      },
      cost: 0.01,
      execution_time: executionTime
    };
  }

  /**
   * Get plugin statistics
   */
  async getPluginStats(userId = null) {
    try {
      const { supabase } = require('../config/supabase');

      let query = supabase
        .from('ai_plugins')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get plugin stats: ${error.message}`);
      }

      const stats = {
        total_plugins: data.length,
        active_plugins: data.filter(p => p.is_active).length,
        plugin_types: {},
        providers: {},
        total_usage: data.reduce((sum, p) => sum + p.usage_count, 0),
        total_cost: data.reduce((sum, p) => sum + p.total_cost, 0),
        avg_success_rate: data.length > 0 ?
          data.reduce((sum, p) => sum + p.success_rate, 0) / data.length : 0
      };

      // Count by type and provider
      data.forEach(plugin => {
        stats.plugin_types[plugin.plugin_type] = (stats.plugin_types[plugin.plugin_type] || 0) + 1;
        stats.providers[plugin.provider] = (stats.providers[plugin.provider] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting plugin stats:', error);
      throw error;
    }
  }

  /**
   * Clone a plugin
   */
  async clonePlugin(originalNodeCode, newUserId, modifications = {}) {
    try {
      // Get original plugin
      const plugins = await this.queryPlugins({ node_code: originalNodeCode });
      if (plugins.length === 0) {
        throw new Error('Original plugin not found');
      }

      const original = plugins[0];

      // Create cloned plugin data
      const clonedData = {
        user_id: newUserId,
        plugin_name: modifications.plugin_name || `${original.database_record.plugin_name} (Clone)`,
        plugin_type: original.database_record.plugin_type,
        provider: original.database_record.provider,
        api_key: 'REPLACE_WITH_NEW_API_KEY', // Don't copy API keys
        config: { ...original.database_record.config, ...modifications.config },
        capabilities: [...original.database_record.capabilities],
        is_active: false, // Clones start inactive for security
        version: original.database_record.version,
        description: modifications.description || `${original.database_record.description} (Cloned)`,
        tags: [...original.database_record.tags],
        rate_limits: { ...original.database_record.rate_limits },
        cost_tracking: {
          ...original.database_record.cost_tracking,
          budget_limit: modifications.budget_limit || original.database_record.cost_tracking.budget_limit * 0.5
        },
        usage_count: 0,
        success_rate: 1.0,
        total_cost: 0.0,
        error_count: 0
      };

      // Apply modifications
      Object.assign(clonedData, modifications);

      const result = await this.createPlugin(clonedData);

      return result;
    } catch (error) {
      console.error('Error cloning plugin:', error);
      throw error;
    }
  }

  /**
   * Delete a plugin
   */
  async deletePlugin(nodeCode) {
    try {
      // Delete from database
      const { supabase } = require('../config/supabase');
      const { error: dbError } = await supabase
        .from('ai_plugins')
        .delete()
        .eq('node_code', nodeCode);

      if (dbError) {
        throw new Error(`Failed to delete plugin record: ${dbError.message}`);
      }

      // Delete the node
      await this.nodeFactory.deleteNode(nodeCode);

      return { deleted: true, node_code: nodeCode };
    } catch (error) {
      console.error('Error deleting plugin:', error);
      throw error;
    }
  }
}

// Export singleton instance
const aiPluginsNode = new AIPluginsNode();
module.exports = { aiPluginsNode };