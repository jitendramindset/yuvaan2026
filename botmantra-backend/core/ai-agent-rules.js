/**
 * AI Agent Rules Node Management
 * Handles AI agent rules as nodes in the neural graph system
 */

const NodeFactory = require('../core/nodeFactory');

class AIAgentRulesNode {
  /**
   * Create a new AI agent rule node
   * @param {string} nodeCode - The node code for identification
   * @param {Object} ruleData - Rule data
   * @returns {Promise<Object>} Created node data
   */
  static async createAgentRuleNode(nodeCode, ruleData) {
    try {
      const nodeData = {
        node_code: nodeCode,
        node_type: 'ai_agent_rule',
        metadata: {
          rule_name: ruleData.rule_name,
          trigger_type: ruleData.trigger_type,
          condition_json: ruleData.condition_json,
          action_json: ruleData.action_json,
          is_active: ruleData.is_active !== undefined ? ruleData.is_active : true,
          last_run: ruleData.last_run,
          description: ruleData.description,
          priority: ruleData.priority || 1,
          business_id: ruleData.business_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relationships: {
          owner: nodeCode,
          business: ruleData.business_id ? `business_${ruleData.business_id}` : null
        }
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);
      return node;
    } catch (error) {
      console.error('Error creating agent rule node:', error);
      throw error;
    }
  }

  /**
   * Query agent rule nodes with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of matching nodes
   */
  static async queryAgentRuleNodes(filters = {}) {
    try {
      const queryFilters = {};

      if (filters.node_code) {
        queryFilters.node_code = filters.node_code;
      }

      if (filters.rule_name) {
        queryFilters['metadata.rule_name'] = filters.rule_name;
      }

      if (filters.trigger_type) {
        queryFilters['metadata.trigger_type'] = filters.trigger_type;
      }

      if (filters.is_active !== undefined) {
        queryFilters['metadata.is_active'] = filters.is_active;
      }

      if (filters.business_id) {
        queryFilters['metadata.business_id'] = filters.business_id;
      }

      const nodes = await NodeFactory.queryNodes({
        node_type: 'ai_agent_rule',
        ...queryFilters
      });

      return nodes;
    } catch (error) {
      console.error('Error querying agent rule nodes:', error);
      throw error;
    }
  }

  /**
   * Update an agent rule node
   * @param {string} nodeCode - Node code to update
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated node data
   */
  static async updateAgentRuleNode(nodeCode, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const node = await NodeFactory.updateNode(nodeCode, updateData);
      return node;
    } catch (error) {
      console.error('Error updating agent rule node:', error);
      throw error;
    }
  }

  /**
   * Execute a rule based on trigger conditions
   * @param {string} triggerType - Type of trigger
   * @param {Object} triggerData - Trigger data to evaluate
   * @returns {Promise<Array>} Array of matching rules with their actions
   */
  static async evaluateRules(triggerType, triggerData) {
    try {
      const rules = await this.queryAgentRuleNodes({
        trigger_type: triggerType,
        is_active: true
      });

      const matchingRules = [];

      for (const rule of rules) {
        try {
          const conditions = typeof rule.metadata.condition_json === 'string'
            ? JSON.parse(rule.metadata.condition_json)
            : rule.metadata.condition_json;

          if (this._evaluateConditions(conditions, triggerData)) {
            const actions = typeof rule.metadata.action_json === 'string'
              ? JSON.parse(rule.metadata.action_json)
              : rule.metadata.action_json;

            matchingRules.push({
              rule_id: rule.id,
              rule_name: rule.metadata.rule_name,
              priority: rule.metadata.priority || 1,
              actions: actions,
              node_code: rule.node_code
            });

            // Update last_run timestamp
            await this.updateAgentRuleNode(rule.node_code, {
              'metadata.last_run': new Date().toISOString()
            });
          }
        } catch (evalError) {
          console.warn(`Failed to evaluate rule ${rule.metadata.rule_name}:`, evalError.message);
        }
      }

      // Sort by priority (higher priority first)
      return matchingRules.sort((a, b) => (b.priority || 1) - (a.priority || 1));
    } catch (error) {
      console.error('Error evaluating rules:', error);
      throw error;
    }
  }

  /**
   * Get rule statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getRuleStatistics() {
    try {
      const allRules = await this.queryAgentRuleNodes();
      const activeRules = allRules.filter(r => r.metadata.is_active !== false);

      const stats = {
        total_rules: allRules.length,
        active_rules: activeRules.length,
        inactive_rules: allRules.length - activeRules.length,
        trigger_types: {},
        rules_by_priority: {}
      };

      activeRules.forEach(rule => {
        // Count by trigger type
        const triggerType = rule.metadata.trigger_type;
        stats.trigger_types[triggerType] = (stats.trigger_types[triggerType] || 0) + 1;

        // Count by priority
        const priority = rule.metadata.priority || 1;
        stats.rules_by_priority[priority] = (stats.rules_by_priority[priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting rule statistics:', error);
      throw error;
    }
  }

  /**
   * Private method to evaluate rule conditions
   * @param {Object} conditions - Rule conditions
   * @param {Object} triggerData - Trigger data
   * @returns {boolean} Whether conditions are met
   */
  static _evaluateConditions(conditions, triggerData) {
    // Simple condition evaluation - can be extended for complex logic
    if (!conditions || typeof conditions !== 'object') return true;

    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = triggerData[key];

      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(actualValue)) return false;
      } else if (typeof expectedValue === 'object') {
        // Handle operators like { $gt: 5 }, { $in: [...] }, etc.
        if (expectedValue.$gt !== undefined && !(actualValue > expectedValue.$gt)) return false;
        if (expectedValue.$gte !== undefined && !(actualValue >= expectedValue.$gte)) return false;
        if (expectedValue.$lt !== undefined && !(actualValue < expectedValue.$lt)) return false;
        if (expectedValue.$lte !== undefined && !(actualValue <= expectedValue.$lte)) return false;
        if (expectedValue.$in !== undefined && !expectedValue.$in.includes(actualValue)) return false;
        if (expectedValue.$nin !== undefined && expectedValue.$nin.includes(actualValue)) return false;
        if (expectedValue.$eq !== undefined && actualValue !== expectedValue.$eq) return false;
        if (expectedValue.$ne !== undefined && actualValue === expectedValue.$ne) return false;
      } else {
        if (actualValue !== expectedValue) return false;
      }
    }

    return true;
  }
}

module.exports = AIAgentRulesNode;