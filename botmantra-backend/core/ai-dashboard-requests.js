/**
 * AI Dashboard Requests Node System
 * Neural OS Integration for AI Dashboard Requests Management
 */

const NodeFactory = require('./nodeFactory');
const { supabase } = require('../config/supabase');

class AIDashboardRequestsNode {
  constructor() {
    this.nodeType = 'ai-dashboard-requests';
    this.tableName = 'ai_dashboard_requests';
  }

  /**
   * Create a new dashboard request node
   * @param {Object} requestData - Request data
   * @param {string} requestData.business_id - Business ID
   * @param {string} requestData.user_id - User ID
   * @param {string} requestData.prompt - AI prompt/request
   * @param {string} requestData.status - Request status
   * @param {Object} requestData.metadata - Additional metadata
   * @param {string} nodeCode - Node code for identification
   * @returns {Promise<Object>} Created request node
   */
  async createDashboardRequest(requestData, nodeCode = null) {
    try {
      // Generate node code if not provided
      if (!nodeCode) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        nodeCode = `ai-dashboard-request-${timestamp}-${randomId}`;
      }

      // Create the database record
      const dbData = {
        business_id: requestData.business_id,
        user_id: requestData.user_id,
        prompt: requestData.prompt,
        status: requestData.status || 'pending',
        metadata: requestData.metadata || {}
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
          business_id: requestData.business_id,
          user_id: requestData.user_id,
          prompt: requestData.prompt,
          status: requestData.status || 'pending',
          database_id: dbRecord.id,
          created_at: dbRecord.created_at,
          processing_time: null,
          ai_response: null,
          ...requestData.metadata
        },
        relationships: [
          {
            target_node_code: `user-${requestData.user_id}`,
            relationship_type: 'requested_by_user'
          },
          {
            target_node_code: `business-${requestData.business_id}`,
            relationship_type: 'belongs_to_business'
          }
        ]
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);

      // Log the creation
      await this._logDashboardRequest('create', {
        node_code: nodeCode,
        business_id: requestData.business_id,
        user_id: requestData.user_id,
        prompt: requestData.prompt.substring(0, 100) + (requestData.prompt.length > 100 ? '...' : '')
      });

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating dashboard request:', error);
      throw error;
    }
  }

  /**
   * Query dashboard requests by criteria
   * @param {Object} criteria - Query criteria
   * @param {string} criteria.business_id - Filter by business ID
   * @param {string} criteria.user_id - Filter by user ID
   * @param {string} criteria.status - Filter by status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of request nodes
   */
  async queryDashboardRequests(criteria = {}, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      if (criteria.business_id) {
        query = query.eq('business_id', criteria.business_id);
      }
      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }
      if (criteria.status) {
        query = query.eq('status', criteria.status);
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

      const { data: requests, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to nodes
      const nodes = [];
      for (const request of requests) {
        const nodeCode = `ai-dashboard-request-${request.id}`;
        const node = await NodeFactory.queryNodes({ node_code: nodeCode });

        if (node && node.length > 0) {
          nodes.push(node[0]);
        } else {
          // Create node if it doesn't exist
          const nodeData = {
            node_code: nodeCode,
            node_type: this.nodeType,
            metadata: {
              business_id: request.business_id,
              user_id: request.user_id,
              prompt: request.prompt,
              status: request.status,
              database_id: request.id,
              created_at: request.created_at,
              processing_time: request.processing_time,
              ai_response: request.ai_response,
              ...request.metadata
            },
            relationships: [
              {
                target_node_code: `user-${request.user_id}`,
                relationship_type: 'requested_by_user'
              },
              {
                target_node_code: `business-${request.business_id}`,
                relationship_type: 'belongs_to_business'
              }
            ]
          };

          const createdNode = await NodeFactory.createNonLiveNode(nodeData);
          nodes.push(createdNode);
        }
      }

      return nodes;
    } catch (error) {
      console.error('Error querying dashboard requests:', error);
      throw error;
    }
  }

  /**
   * Update a dashboard request
   * @param {string} nodeCode - Node code of the request to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated request node
   */
  async updateDashboardRequest(nodeCode, updateData) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-dashboard-request-', '');

      // Update database record
      const dbUpdateData = {};
      if (updateData.prompt !== undefined) dbUpdateData.prompt = updateData.prompt;
      if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
      if (updateData.processing_time !== undefined) dbUpdateData.processing_time = updateData.processing_time;
      if (updateData.ai_response !== undefined) dbUpdateData.ai_response = updateData.ai_response;
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
      await this._logDashboardRequest('update', {
        node_code: nodeCode,
        updates: Object.keys(updateData)
      });

      return {
        node: updatedNode,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error updating dashboard request:', error);
      throw error;
    }
  }

  /**
   * Update request status
   * @param {string} nodeCode - Node code of the request
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Updated request node
   */
  async updateRequestStatus(nodeCode, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      };

      // If completing the request, set processing time
      if (status === 'completed' || status === 'failed') {
        const node = await NodeFactory.queryNodes({ node_code: nodeCode });
        if (node && node.length > 0) {
          const createdAt = new Date(node[0].metadata.created_at);
          const now = new Date();
          updateData.processing_time = now - createdAt;
        }
      }

      return await this.updateDashboardRequest(nodeCode, updateData);
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  /**
   * Delete a dashboard request
   * @param {string} nodeCode - Node code of the request to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteDashboardRequest(nodeCode) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-dashboard-request-', '');

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
          deleted_at: new Date().toISOString()
        }
      };

      await NodeFactory.updateNode(nodeCode, nodeUpdateData);

      // Log the deletion
      await this._logDashboardRequest('delete', {
        node_code: nodeCode
      });

      return true;
    } catch (error) {
      console.error('Error deleting dashboard request:', error);
      throw error;
    }
  }

  /**
   * Get user's dashboard requests
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of request nodes
   */
  async getUserRequests(userId, businessId, options = {}) {
    try {
      const criteria = { user_id: userId, business_id: businessId };
      const requests = await this.queryDashboardRequests(criteria, {
        limit: options.limit || 20,
        offset: options.offset || 0
      });

      return requests;
    } catch (error) {
      console.error('Error getting user requests:', error);
      throw error;
    }
  }

  /**
   * Get request statistics
   * @param {string} businessId - Business ID (optional)
   * @returns {Promise<Object>} Request statistics
   */
  async getRequestStats(businessId = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('business_id, user_id, status, processing_time, created_at');

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data: requests, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const stats = {
        total_requests: requests.length,
        requests_by_status: {},
        requests_by_business: {},
        requests_by_user: {},
        avg_processing_time: 0,
        completed_requests: 0
      };

      let totalProcessingTime = 0;
      let completedCount = 0;

      requests.forEach(request => {
        // Count by status
        stats.requests_by_status[request.status] = (stats.requests_by_status[request.status] || 0) + 1;

        // Count by business
        stats.requests_by_business[request.business_id] = (stats.requests_by_business[request.business_id] || 0) + 1;

        // Count by user
        stats.requests_by_user[request.user_id] = (stats.requests_by_user[request.user_id] || 0) + 1;

        // Calculate processing time stats
        if (request.processing_time) {
          totalProcessingTime += request.processing_time;
          completedCount++;
        }
      });

      stats.completed_requests = completedCount;
      stats.avg_processing_time = completedCount > 0 ? totalProcessingTime / completedCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting request stats:', error);
      throw error;
    }
  }

  /**
   * Log dashboard request operations to ai_dashboard_requests table
   * @private
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  async _logDashboardRequest(operation, details) {
    try {
      const logData = {
        business_id: details.business_id || 'system',
        user_id: details.user_id || 'system',
        prompt: `Dashboard request ${operation}: ${details.node_code || 'unknown'}`,
        status: 'completed',
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        }
      };

      await supabase
        .from('ai_dashboard_requests')
        .insert(logData);

    } catch (error) {
      console.error('Error logging dashboard request operation:', error);
      // Don't throw - logging failure shouldn't break main operation
    }
  }
}

module.exports = {
  AIDashboardRequestsNode,
  aiDashboardRequestsNode: new AIDashboardRequestsNode()
};