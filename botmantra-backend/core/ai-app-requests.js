/**
 * AI App Requests Node
 * Node-based AI app request management within the neural OS architecture
 */

const NodeFactory = require('./nodeFactory');

class AIAppRequestsNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Create a new AI app request node
   * @param {string} nodeCode - Node code for identification
   * @param {Object} requestData - Request data
   * @returns {Promise<Object>} Created node
   */
  async createAppRequestNode(nodeCode, requestData) {
    try {
      const nodeData = {
        node_code: nodeCode,
        node_type: 'ai_app_request',
        node_category: 'ai_app_request',
        metadata: {
          user_id: requestData.user_id,
          business_id: requestData.business_id,
          app_name: requestData.app_name,
          description: requestData.description,
          status: requestData.status || 'pending',
          ai_response: requestData.ai_response || {},
          request_type: requestData.request_type || 'general',
          priority: requestData.priority || 'normal',
          estimated_completion: requestData.estimated_completion,
          actual_completion: requestData.actual_completion,
          tags: requestData.tags || [],
          attachments: requestData.attachments || [],
          feedback_rating: requestData.feedback_rating,
          feedback_comments: requestData.feedback_comments,
          is_archived: requestData.is_archived || false
        },
        relationships: {
          parent_nodes: [],
          child_nodes: [],
          related_nodes: []
        },
        permissions: {
          read: ['owner', 'admin'],
          write: ['owner', 'admin'],
          delete: ['owner', 'admin']
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);
      return node;
    } catch (error) {
      console.error('Error creating AI app request node:', error);
      throw error;
    }
  }

  /**
   * Query AI app request nodes with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of matching nodes
   */
  async queryAppRequestNodes(filters = {}) {
    try {
      const query = {
        node_type: 'ai_app_request'
      };

      // Add metadata filters
      if (filters.user_id) query['metadata.user_id'] = filters.user_id;
      if (filters.business_id) query['metadata.business_id'] = filters.business_id;
      if (filters.app_name) query['metadata.app_name'] = filters.app_name;
      if (filters.status) query['metadata.status'] = filters.status;
      if (filters.request_type) query['metadata.request_type'] = filters.request_type;
      if (filters.priority) query['metadata.priority'] = filters.priority;
      if (filters.is_archived !== undefined) query['metadata.is_archived'] = filters.is_archived;
      if (filters.node_code) query.node_code = filters.node_code;

      const nodes = await this.nodeFactory.queryNodes(query);
      return nodes;
    } catch (error) {
      console.error('Error querying AI app request nodes:', error);
      throw error;
    }
  }

  /**
   * Update an AI app request node
   * @param {string} nodeCode - Node code to update
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated node
   */
  async updateAppRequestNode(nodeCode, updates) {
    try {
      const node = await this.nodeFactory.updateNode(nodeCode, updates);
      return node;
    } catch (error) {
      console.error('Error updating AI app request node:', error);
      throw error;
    }
  }

  /**
   * Update request status with validation
   * @param {string} nodeCode - Node code
   * @param {string} newStatus - New status
   * @param {Object} additionalData - Additional status data
   * @returns {Promise<Object>} Updated node
   */
  async updateRequestStatus(nodeCode, newStatus, additionalData = {}) {
    try {
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const updates = {
        'metadata.status': newStatus,
        'metadata.updated_at': new Date().toISOString()
      };

      // Add status-specific data
      if (newStatus === 'completed' && additionalData.actual_completion) {
        updates['metadata.actual_completion'] = additionalData.actual_completion;
      }

      if (newStatus === 'failed' && additionalData.error_message) {
        updates['metadata.error_message'] = additionalData.error_message;
      }

      if (additionalData.ai_response) {
        updates['metadata.ai_response'] = additionalData.ai_response;
      }

      const node = await this.updateAppRequestNode(nodeCode, updates);
      return node;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  /**
   * Add feedback to a completed request
   * @param {string} nodeCode - Node code
   * @param {number} rating - Rating (1-5)
   * @param {string} comments - Feedback comments
   * @returns {Promise<Object>} Updated node
   */
  async addFeedback(nodeCode, rating, comments = '') {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const updates = {
        'metadata.feedback_rating': rating,
        'metadata.feedback_comments': comments,
        'metadata.feedback_date': new Date().toISOString(),
        'metadata.updated_at': new Date().toISOString()
      };

      const node = await this.updateAppRequestNode(nodeCode, updates);
      return node;
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  }

  /**
   * Get request statistics
   * @param {string} businessId - Optional business ID filter
   * @returns {Promise<Object>} Statistics object
   */
  async getRequestStatistics(businessId = null) {
    try {
      const filters = businessId ? { business_id: businessId } : {};
      const allRequests = await this.queryAppRequestNodes(filters);

      const stats = {
        total_requests: allRequests.length,
        status_breakdown: {},
        type_breakdown: {},
        priority_breakdown: {},
        average_completion_time: 0,
        completion_rate: 0,
        average_rating: 0
      };

      let totalCompletionTime = 0;
      let completedCount = 0;
      let totalRating = 0;
      let ratedCount = 0;

      allRequests.forEach(request => {
        const meta = request.metadata;

        // Status breakdown
        stats.status_breakdown[meta.status] = (stats.status_breakdown[meta.status] || 0) + 1;

        // Type breakdown
        stats.type_breakdown[meta.request_type] = (stats.type_breakdown[meta.request_type] || 0) + 1;

        // Priority breakdown
        stats.priority_breakdown[meta.priority] = (stats.priority_breakdown[meta.priority] || 0) + 1;

        // Completion time calculation
        if (meta.status === 'completed' && meta.actual_completion && meta.created_at) {
          const created = new Date(meta.created_at);
          const completed = new Date(meta.actual_completion);
          const completionTime = completed - created;
          totalCompletionTime += completionTime;
          completedCount++;
        }

        // Rating calculation
        if (meta.feedback_rating) {
          totalRating += meta.feedback_rating;
          ratedCount++;
        }
      });

      stats.completion_rate = allRequests.length > 0 ? (completedCount / allRequests.length) * 100 : 0;
      stats.average_completion_time = completedCount > 0 ? totalCompletionTime / completedCount : 0;
      stats.average_rating = ratedCount > 0 ? totalRating / ratedCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting request statistics:', error);
      throw error;
    }
  }

  /**
   * Archive old completed requests
   * @param {number} daysOld - Archive requests older than this many days
   * @returns {Promise<number>} Number of archived requests
   */
  async archiveOldRequests(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldRequests = await this.queryAppRequestNodes({
        status: 'completed',
        is_archived: false
      });

      let archivedCount = 0;
      for (const request of oldRequests) {
        const createdDate = new Date(request.created_at);
        if (createdDate < cutoffDate) {
          await this.updateAppRequestNode(request.node_code, {
            'metadata.is_archived': true,
            'metadata.archived_at': new Date().toISOString()
          });
          archivedCount++;
        }
      }

      return archivedCount;
    } catch (error) {
      console.error('Error archiving old requests:', error);
      throw error;
    }
  }
}

module.exports = AIAppRequestsNode;