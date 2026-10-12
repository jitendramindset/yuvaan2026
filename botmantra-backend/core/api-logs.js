/**
 * API Logs Node
 * Node-based API logging system
 */

const NodeFactory = require('./nodeFactory');

class APILogsNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Create a new API log entry
   */
  async createAPILog(logData, nodeCode = null) {
    try {
      // Create the node first
      const nodeData = {
        node_type: 'api_logs',
        node_code: nodeCode || `api_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        owner_id: logData.user_id,
        data: {
          endpoint: logData.endpoint,
          request_data: logData.request_data || {},
          response_data: logData.response_data || {},
          status: logData.status || 'success',
          ip_address: logData.ip_address,
          user_agent: logData.user_agent
        },
        metadata: {
          description: `API call to ${logData.endpoint}`,
          log_type: 'api_request',
          response_status: logData.status || 'success',
          timestamp: logData.timestamp || new Date().toISOString()
        },
        relationships: [],
        is_active: true
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Insert into api_logs table
      const dbData = {
        id: node.node_id,
        endpoint: logData.endpoint,
        user_id: logData.user_id,
        request_data: logData.request_data || {},
        response_data: logData.response_data || {},
        status: logData.status || 'success',
        timestamp: logData.timestamp || new Date().toISOString(),
        ip_address: logData.ip_address,
        user_agent: logData.user_agent
      };

      const { data: dbRecord, error: dbError } = await this.db
        .from('api_logs')
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
      console.error('API Logs Node - Create error:', error);
      throw error;
    }
  }

  /**
   * Query API logs with filters
   */
  async queryAPILogs(criteria = {}, options = {}) {
    try {
      const { limit = 50, offset = 0, sort = 'timestamp', order = 'desc' } = options;

      // Build node query criteria
      const nodeCriteria = {
        node_type: 'api_logs',
        is_active: true
      };

      if (criteria.user_id) {
        nodeCriteria.owner_id = criteria.user_id;
      }

      if (criteria.endpoint) {
        nodeCriteria['data.endpoint'] = criteria.endpoint;
      }

      if (criteria.status) {
        nodeCriteria['data.status'] = criteria.status;
      }

      // Query nodes
      const nodes = await this.nodeFactory.queryNodes(nodeCriteria, { limit, offset, sort, order });

      // Get corresponding database records
      const nodeIds = nodes.map(node => node.node_id);
      const { data: dbRecords, error } = await this.db
        .from('api_logs')
        .select('*')
        .in('id', nodeIds)
        .order(sort, { ascending: order === 'asc' });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Combine node and database data
      const combined = nodes.map(node => {
        const dbRecord = dbRecords.find(record => record.id === node.node_id);
        return {
          ...node,
          database_record: dbRecord
        };
      });

      return {
        logs: combined,
        total: nodes.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('API Logs Node - Query error:', error);
      throw error;
    }
  }

  /**
   * Get API log by node code
   */
  async getAPILog(nodeCode, userId = null) {
    try {
      const node = await this.nodeFactory.getNodeByCode(nodeCode);

      if (!node || node.node_type !== 'api_logs') {
        return null;
      }

      // Check ownership if specified
      if (userId && node.owner_id !== userId) {
        return null;
      }

      // Get database record
      const { data: dbRecord, error } = await this.db
        .from('api_logs')
        .select('*')
        .eq('id', node.node_id)
        .single();

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return {
        ...node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('API Logs Node - Get by code error:', error);
      throw error;
    }
  }

  /**
   * Get logs by endpoint
   */
  async getLogsByEndpoint(endpoint, userId = null, options = {}) {
    try {
      const criteria = {
        endpoint: endpoint
      };

      if (userId) {
        criteria.user_id = userId;
      }

      return await this.queryAPILogs(criteria, options);
    } catch (error) {
      console.error('API Logs Node - Get by endpoint error:', error);
      throw error;
    }
  }

  /**
   * Get logs by user
   */
  async getLogsByUser(userId, options = {}) {
    try {
      const criteria = {
        user_id: userId
      };

      return await this.queryAPILogs(criteria, options);
    } catch (error) {
      console.error('API Logs Node - Get by user error:', error);
      throw error;
    }
  }

  /**
   * Get logs by time range
   */
  async getLogsByTimeRange(startTime, endTime, userId = null, options = {}) {
    try {
      // For time range queries, we need to query the database directly
      // since node metadata doesn't have efficient time indexing
      let query = this.db
        .from('api_logs')
        .select('*')
        .gte('timestamp', startTime)
        .lte('timestamp', endTime);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: dbRecords, error } = await query
        .order('timestamp', { ascending: false })
        .limit(options.limit || 100);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Get corresponding nodes
      const nodeIds = dbRecords.map(record => record.id);
      const nodes = await this.nodeFactory.getNodesByIds(nodeIds);

      // Combine data
      const combined = dbRecords.map(dbRecord => {
        const node = nodes.find(n => n.node_id === dbRecord.id);
        return {
          ...node,
          database_record: dbRecord
        };
      });

      return {
        logs: combined,
        total: combined.length
      };
    } catch (error) {
      console.error('API Logs Node - Get by time range error:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsageStats(userId = null, timeRange = null) {
    try {
      let query = this.db
        .from('api_logs')
        .select('endpoint, status, timestamp');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (timeRange) {
        query = query
          .gte('timestamp', timeRange.start)
          .lte('timestamp', timeRange.end);
      }

      const { data: logs, error } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const stats = {
        total_requests: logs.length,
        endpoint_breakdown: {},
        status_breakdown: {},
        hourly_distribution: {}
      };

      logs.forEach(log => {
        // Endpoint breakdown
        stats.endpoint_breakdown[log.endpoint] = (stats.endpoint_breakdown[log.endpoint] || 0) + 1;

        // Status breakdown
        stats.status_breakdown[log.status] = (stats.status_breakdown[log.status] || 0) + 1;

        // Hourly distribution
        const hour = new Date(log.timestamp).getHours();
        stats.hourly_distribution[hour] = (stats.hourly_distribution[hour] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('API Logs Node - Usage stats error:', error);
      throw error;
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Get logs to delete
      const { data: oldLogs, error: queryError } = await this.db
        .from('api_logs')
        .select('id')
        .lt('timestamp', cutoffDate.toISOString());

      if (queryError) {
        throw new Error(`Query failed: ${queryError.message}`);
      }

      if (oldLogs.length === 0) {
        return { deleted: 0 };
      }

      // Delete from database
      const { error: deleteError } = await this.db
        .from('api_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (deleteError) {
        throw new Error(`Database delete failed: ${deleteError.message}`);
      }

      // Delete corresponding nodes
      const nodeIds = oldLogs.map(log => log.id);
      for (const nodeId of nodeIds) {
        try {
          await this.nodeFactory.deleteNodeById(nodeId);
        } catch (nodeError) {
          console.warn(`Failed to delete node ${nodeId}:`, nodeError.message);
        }
      }

      return { deleted: oldLogs.length };
    } catch (error) {
      console.error('API Logs Node - Cleanup error:', error);
      throw error;
    }
  }
}

module.exports = { APILogsNode };