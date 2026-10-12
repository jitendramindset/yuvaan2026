/**
 * AI Action Requests Node Management
 * Handles AI action requests as nodes in the neural graph system
 */

const NodeFactory = require('../core/nodeFactory');

class AIActionRequestsNode {
  /**
   * Create a new AI action request node
   * @param {string} nodeCode - The node code for identification
   * @param {Object} requestData - Action request data
   * @returns {Promise<Object>} Created node data
   */
  static async createActionRequestNode(nodeCode, requestData) {
    try {
      const nodeData = {
        node_code: nodeCode,
        node_type: 'ai_action_request',
        metadata: {
          action_type: requestData.action_type,
          target_table: requestData.target_table,
          input_payload: requestData.input_payload,
          status: requestData.status || 'pending',
          error_message: requestData.error_message,
          executed_at: requestData.executed_at,
          business_id: requestData.business_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relationships: {
          owner: nodeCode,
          business: requestData.business_id ? `business_${requestData.business_id}` : null
        }
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);
      return node;
    } catch (error) {
      console.error('Error creating action request node:', error);
      throw error;
    }
  }

  /**
   * Query action request nodes with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of matching nodes
   */
  static async queryActionRequestNodes(filters = {}) {
    try {
      const queryFilters = {};

      if (filters.node_code) {
        queryFilters.node_code = filters.node_code;
      }

      if (filters.action_type) {
        queryFilters['metadata.action_type'] = filters.action_type;
      }

      if (filters.status) {
        queryFilters['metadata.status'] = filters.status;
      }

      if (filters.business_id) {
        queryFilters['metadata.business_id'] = filters.business_id;
      }

      const nodes = await NodeFactory.queryNodes({
        node_type: 'ai_action_request',
        ...queryFilters
      });

      return nodes;
    } catch (error) {
      console.error('Error querying action request nodes:', error);
      throw error;
    }
  }

  /**
   * Update an action request node
   * @param {string} nodeCode - Node code to update
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated node data
   */
  static async updateActionRequestNode(nodeCode, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const node = await NodeFactory.updateNode(nodeCode, updateData);
      return node;
    } catch (error) {
      console.error('Error updating action request node:', error);
      throw error;
    }
  }

  /**
   * Get action request statistics for a node
   * @param {string} nodeCode - Node code
   * @returns {Promise<Object>} Statistics object
   */
  static async getActionRequestStatistics(nodeCode) {
    try {
      const nodes = await this.queryActionRequestNodes({ node_code: nodeCode });

      const stats = {
        total_requests: nodes.length,
        pending: nodes.filter(n => n.metadata.status === 'pending').length,
        completed: nodes.filter(n => n.metadata.status === 'completed').length,
        failed: nodes.filter(n => n.metadata.status === 'failed').length,
        by_action_type: {}
      };

      nodes.forEach(node => {
        const type = node.metadata.action_type;
        stats.by_action_type[type] = (stats.by_action_type[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting action request statistics:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a node's action requests
   * @param {string} nodeCode - Node code
   * @returns {Promise<Array>} Audit trail array
   */
  static async getNodeActionRequestAuditTrail(nodeCode) {
    try {
      const nodes = await this.queryActionRequestNodes({ node_code: nodeCode });

      return nodes.map(node => ({
        id: node.id,
        action_type: node.metadata.action_type,
        target_table: node.metadata.target_table,
        status: node.metadata.status,
        executed_at: node.metadata.executed_at,
        error_message: node.metadata.error_message,
        created_at: node.metadata.created_at
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('Error getting node action request audit trail:', error);
      throw error;
    }
  }
}

module.exports = AIActionRequestsNode;