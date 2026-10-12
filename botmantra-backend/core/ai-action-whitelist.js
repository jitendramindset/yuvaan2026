/**
 * AI Action Whitelist Node Management
 * Handles AI action whitelists as nodes in the neural graph system
 */

const NodeFactory = require('../core/nodeFactory');

class AIActionWhitelistNode {
  /**
   * Create a new AI action whitelist node
   * @param {string} nodeCode - The node code for identification
   * @param {Object} whitelistData - Whitelist data
   * @returns {Promise<Object>} Created node data
   */
  static async createActionWhitelistNode(nodeCode, whitelistData) {
    try {
      const nodeData = {
        node_code: nodeCode,
        node_type: 'ai_action_whitelist',
        metadata: {
          table_name: whitelistData.table_name,
          allowed_actions: whitelistData.allowed_actions,
          description: whitelistData.description,
          is_active: whitelistData.is_active !== undefined ? whitelistData.is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relationships: {
          owner: nodeCode,
          business: whitelistData.business_id ? `business_${whitelistData.business_id}` : null
        }
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);
      return node;
    } catch (error) {
      console.error('Error creating action whitelist node:', error);
      throw error;
    }
  }

  /**
   * Query action whitelist nodes with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of matching nodes
   */
  static async queryActionWhitelistNodes(filters = {}) {
    try {
      const queryFilters = {};

      if (filters.node_code) {
        queryFilters.node_code = filters.node_code;
      }

      if (filters.table_name) {
        queryFilters['metadata.table_name'] = filters.table_name;
      }

      if (filters.is_active !== undefined) {
        queryFilters['metadata.is_active'] = filters.is_active;
      }

      if (filters.business_id) {
        queryFilters['metadata.business_id'] = filters.business_id;
      }

      const nodes = await NodeFactory.queryNodes({
        node_type: 'ai_action_whitelist',
        ...queryFilters
      });

      return nodes;
    } catch (error) {
      console.error('Error querying action whitelist nodes:', error);
      throw error;
    }
  }

  /**
   * Update an action whitelist node
   * @param {string} nodeCode - Node code to update
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated node data
   */
  static async updateActionWhitelistNode(nodeCode, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const node = await NodeFactory.updateNode(nodeCode, updateData);
      return node;
    } catch (error) {
      console.error('Error updating action whitelist node:', error);
      throw error;
    }
  }

  /**
   * Check if an action is allowed for a table
   * @param {string} tableName - Table name to check
   * @param {string} action - Action to check
   * @returns {Promise<boolean>} Whether the action is allowed
   */
  static async isActionAllowed(tableName, action) {
    try {
      const nodes = await this.queryActionWhitelistNodes({
        table_name: tableName,
        is_active: true
      });

      for (const node of nodes) {
        if (node.metadata.allowed_actions && node.metadata.allowed_actions.includes(action)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking action whitelist:', error);
      return false;
    }
  }

  /**
   * Get whitelist statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getWhitelistStatistics() {
    try {
      const allNodes = await this.queryActionWhitelistNodes();
      const activeNodes = allNodes.filter(n => n.metadata.is_active !== false);

      const stats = {
        total_whitelists: allNodes.length,
        active_whitelists: activeNodes.length,
        inactive_whitelists: allNodes.length - activeNodes.length,
        tables_covered: [...new Set(activeNodes.map(n => n.metadata.table_name))].length,
        actions_per_table: {}
      };

      activeNodes.forEach(node => {
        const table = node.metadata.table_name;
        const actions = node.metadata.allowed_actions || [];
        if (!stats.actions_per_table[table]) {
          stats.actions_per_table[table] = new Set();
        }
        actions.forEach(action => stats.actions_per_table[table].add(action));
      });

      // Convert Sets to arrays for JSON serialization
      Object.keys(stats.actions_per_table).forEach(table => {
        stats.actions_per_table[table] = Array.from(stats.actions_per_table[table]);
      });

      return stats;
    } catch (error) {
      console.error('Error getting whitelist statistics:', error);
      throw error;
    }
  }
}

module.exports = AIActionWhitelistNode;