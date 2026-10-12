/**
 * API Keys Node
 * Node-based API key management system
 */

const NodeFactory = require('./nodeFactory');

class APIKeysNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Create a new API key entry
   */
  async createAPIKey(apiKeyData, nodeCode = null) {
    try {
      // Create the node first
      const nodeData = {
        node_type: 'api_keys',
        node_code: nodeCode || `api_key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        owner_id: apiKeyData.owner_id,
        data: {
          api_key_hash: apiKeyData.api_key_hash,
          scope: apiKeyData.scope || 'read',
          rate_limit: apiKeyData.rate_limit || 1000,
          is_active: apiKeyData.is_active !== false
        },
        metadata: {
          description: `API Key for ${apiKeyData.scope || 'general'} access`,
          created_by: apiKeyData.owner_id,
          permissions: apiKeyData.scope === 'admin' ? ['read', 'write', 'delete'] : ['read']
        },
        relationships: [],
        is_active: apiKeyData.is_active !== false
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Insert into api_keys table
      const dbData = {
        api_key_id: node.node_id,
        owner_id: apiKeyData.owner_id,
        api_key_hash: apiKeyData.api_key_hash,
        scope: apiKeyData.scope || 'read',
        rate_limit: apiKeyData.rate_limit || 1000,
        is_active: apiKeyData.is_active !== false
      };

      const { data: dbRecord, error: dbError } = await this.db
        .from('api_keys')
        .insert(dbData)
        .select()
        .single();

      if (dbError) {
        // If database insert fails, we should clean up the node
        await this.nodeFactory.deleteNode(node.node_code);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('API Keys Node - Create error:', error);
      throw error;
    }
  }

  /**
   * Query API keys with filters
   */
  async queryAPIKeys(criteria = {}, options = {}) {
    try {
      const { limit = 50, offset = 0, sort = 'created_at', order = 'desc' } = options;

      // Build node query criteria
      const nodeCriteria = {
        node_type: 'api_keys',
        is_active: criteria.is_active !== undefined ? criteria.is_active : true
      };

      if (criteria.owner_id) {
        nodeCriteria.owner_id = criteria.owner_id;
      }

      if (criteria.scope) {
        nodeCriteria['data.scope'] = criteria.scope;
      }

      // Query nodes
      const nodes = await this.nodeFactory.queryNodes(nodeCriteria, { limit, offset, sort, order });

      // Get corresponding database records
      const nodeIds = nodes.map(node => node.node_id);
      const { data: dbRecords, error } = await this.db
        .from('api_keys')
        .select('*')
        .in('api_key_id', nodeIds)
        .order(sort, { ascending: order === 'asc' });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Combine node and database data
      const combined = nodes.map(node => {
        const dbRecord = dbRecords.find(record => record.api_key_id === node.node_id);
        return {
          ...node,
          database_record: dbRecord
        };
      });

      return {
        keys: combined,
        total: nodes.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('API Keys Node - Query error:', error);
      throw error;
    }
  }

  /**
   * Get API key by node code
   */
  async getAPIKey(nodeCode, ownerId = null) {
    try {
      const node = await this.nodeFactory.getNodeByCode(nodeCode);

      if (!node || node.node_type !== 'api_keys') {
        return null;
      }

      // Check ownership if specified
      if (ownerId && node.owner_id !== ownerId) {
        return null;
      }

      // Get database record
      const { data: dbRecord, error } = await this.db
        .from('api_keys')
        .select('*')
        .eq('api_key_id', node.node_id)
        .single();

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return {
        ...node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('API Keys Node - Get by code error:', error);
      throw error;
    }
  }

  /**
   * Update API key
   */
  async updateAPIKey(nodeCode, updateData) {
    try {
      // Get current node
      const current = await this.getAPIKey(nodeCode);
      if (!current) {
        throw new Error('API key not found');
      }

      // Prepare node update
      const nodeUpdate = {
        data: {
          ...current.data,
          scope: updateData.scope !== undefined ? updateData.scope : current.data.scope,
          rate_limit: updateData.rate_limit !== undefined ? updateData.rate_limit : current.data.rate_limit,
          is_active: updateData.is_active !== undefined ? updateData.is_active : current.data.is_active
        },
        metadata: {
          ...current.metadata,
          updated_at: new Date().toISOString(),
          last_modified_by: updateData.modified_by || current.owner_id
        },
        is_active: updateData.is_active !== undefined ? updateData.is_active : current.is_active
      };

      // Update node
      const updatedNode = await this.nodeFactory.updateNode(nodeCode, nodeUpdate);

      // Update database record
      const dbUpdate = {};
      if (updateData.scope !== undefined) dbUpdate.scope = updateData.scope;
      if (updateData.rate_limit !== undefined) dbUpdate.rate_limit = updateData.rate_limit;
      if (updateData.is_active !== undefined) dbUpdate.is_active = updateData.is_active;

      if (Object.keys(dbUpdate).length > 0) {
        const { data: dbRecord, error } = await this.db
          .from('api_keys')
          .update(dbUpdate)
          .eq('api_key_id', current.node_id)
          .select()
          .single();

        if (error) {
          throw new Error(`Database update failed: ${error.message}`);
        }

        return {
          ...updatedNode,
          database_record: dbRecord
        };
      }

      return updatedNode;
    } catch (error) {
      console.error('API Keys Node - Update error:', error);
      throw error;
    }
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(nodeCode) {
    try {
      // Get current node to get the database ID
      const current = await this.getAPIKey(nodeCode);
      if (!current) {
        throw new Error('API key not found');
      }

      // Delete from database
      const { error: dbError } = await this.db
        .from('api_keys')
        .delete()
        .eq('api_key_id', current.node_id);

      if (dbError) {
        throw new Error(`Database delete failed: ${dbError.message}`);
      }

      // Delete node
      const result = await this.nodeFactory.deleteNode(nodeCode);

      return { deleted: true };
    } catch (error) {
      console.error('API Keys Node - Delete error:', error);
      throw error;
    }
  }

  /**
   * Validate API key hash
   */
  async validateAPIKey(apiKeyHash, scope = null) {
    try {
      // Query database for the key
      let query = this.db
        .from('api_keys')
        .select('*')
        .eq('api_key_hash', apiKeyHash)
        .eq('is_active', true);

      if (scope) {
        query = query.eq('scope', scope);
      }

      const { data: dbRecord, error } = await query.single();

      if (error || !dbRecord) {
        return { valid: false, reason: 'Key not found or inactive' };
      }

      // Get corresponding node
      const node = await this.nodeFactory.getNodeById(dbRecord.api_key_id);

      return {
        valid: true,
        key: {
          ...node,
          database_record: dbRecord
        }
      };
    } catch (error) {
      console.error('API Keys Node - Validate error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Get API key statistics
   */
  async getAPIKeyStats(ownerId = null) {
    try {
      const criteria = {};
      if (ownerId) {
        criteria.owner_id = ownerId;
      }

      const result = await this.queryAPIKeys(criteria, { limit: 1000 });

      const stats = {
        total_keys: result.total,
        active_keys: result.keys.filter(k => k.database_record?.is_active).length,
        inactive_keys: result.keys.filter(k => !k.database_record?.is_active).length,
        scope_breakdown: {},
        total_rate_limit: 0
      };

      result.keys.forEach(key => {
        const scope = key.database_record?.scope || 'unknown';
        stats.scope_breakdown[scope] = (stats.scope_breakdown[scope] || 0) + 1;
        stats.total_rate_limit += key.database_record?.rate_limit || 0;
      });

      return stats;
    } catch (error) {
      console.error('API Keys Node - Stats error:', error);
      throw error;
    }
  }
}

module.exports = { APIKeysNode };