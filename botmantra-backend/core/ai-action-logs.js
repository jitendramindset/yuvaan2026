/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  AI ACTION LOGS NODE ENGINE — Neural OS Core               ║
 * ║  Action Logs as Vector Nodes in the Neural Graph           ║
 * ║  Every AI action becomes a traceable node in the system    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Node Type: ai_action_log
 * Purpose: Track all AI actions as nodes for audit, analysis, and evolution
 *
 * Node Structure:
 *   - node_type: 'ai_action_log'
 *   - metadata: {
 *       action_type: 'chat|tool|generation|etc',
 *       table_name: 'target_table',
 *       before_data: {...},
 *       after_data: {...},
 *       executed_sql: 'SQL statement',
 *       ip_address: 'client_ip',
 *       device_id: 'device_fingerprint',
 *       business_id: 'business_context',
 *       user_id: 'user_context'
 *     }
 *   - relationships: links to user, business, and affected nodes
 */

const NodeFactory = require('./nodeFactory');

class AIActionLogsNode {
  constructor(supabaseClient, nodeFactory = null) {
    this.supabase = supabaseClient;
    this.nodeFactory = nodeFactory || new NodeFactory(supabaseClient);
  }

  /**
   * Create Action Log Node
   * Records an AI action as a node in the neural graph
   */
  async createActionLogNode(nodeCode, actionData) {
    try {
      const {
        action_type,
        table_name,
        before_data = {},
        after_data = {},
        executed_sql = '',
        ip_address = '',
        device_id = '',
        business_id = null
      } = actionData;

      // Validate required fields
      if (!action_type || !table_name) {
        return {
          success: false,
          error: 'action_type and table_name are required'
        };
      }

      // Create action log node
      const nodeMetadata = {
        action_type,
        table_name,
        before_data,
        after_data,
        executed_sql,
        ip_address,
        device_id,
        business_id,
        logged_at: new Date().toISOString(),
        node_category: 'ai_action_log'
      };

      const actionLogNode = await this.nodeFactory.createNonLiveNode(
        'ai_action_log',
        userId,
        nodeMetadata,
        {
          name: `${action_type} on ${table_name}`,
          status: 'completed',
          visibility: 'owner'
        }
      );

      if (!actionLogNode) {
        return {
          success: false,
          error: 'Failed to create action log node'
        };
      }

      // Create relationships to user and business nodes
      if (business_id) {
        await this._createRelationship(actionLogNode.id, business_id, 'business_context');
      }

      // Link to affected data nodes if applicable
      if (after_data && after_data.id) {
        await this._createRelationship(actionLogNode.id, after_data.id, 'affects_node');
      }

      return {
        success: true,
        action_log_node: actionLogNode,
        node_id: actionLogNode.id
      };

    } catch (error) {
      console.error('Create action log node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Query Action Log Nodes
   * Find action logs by various criteria
   */
  async queryActionLogNodes(queryParams = {}) {
    try {
      const {
        node_code,
        business_id,
        action_type,
        table_name,
        date_from,
        date_to,
        limit = 50,
        offset = 0
      } = queryParams;

      const filters = {
        node_type: 'ai_action_log'
      };

      if (node_code) filters.node_code = node_code;
      if (business_id) filters['metadata.business_id'] = business_id;
      if (action_type) filters['metadata.action_type'] = action_type;
      if (table_name) filters['metadata.table_name'] = table_name;

      // Date range filtering
      if (date_from || date_to) {
        filters.created_at = {};
        if (date_from) filters.created_at.gte = date_from;
        if (date_to) filters.created_at.lte = date_to;
      }

      const result = await this.nodeFactory.queryNodes({
        filters,
        limit,
        offset,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });

      return result;

    } catch (error) {
      console.error('Query action log nodes error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Action Log Node by ID
   */
  async getActionLogNode(nodeId) {
    try {
      const result = await this.nodeFactory.queryNodes({
        filters: {
          id: nodeId,
          node_type: 'ai_action_log'
        }
      });

      if (!result.success || !result.nodes || result.nodes.length === 0) {
        return {
          success: false,
          error: 'Action log node not found'
        };
      }

      return {
        success: true,
        action_log_node: result.nodes[0]
      };

    } catch (error) {
      console.error('Get action log node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update Action Log Node
   * Usually for adding additional metadata or status updates
   */
  async updateActionLogNode(nodeId, updates) {
    try {
      const result = await this.nodeFactory.updateNode(nodeId, updates);

      if (!result) {
        return {
          success: false,
          error: 'Failed to update action log node'
        };
      }

      return {
        success: true,
        action_log_node: result
      };

    } catch (error) {
      console.error('Update action log node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Action Statistics
   * Aggregate statistics about AI actions
   */
  async getActionStatistics(queryParams = {}) {
    try {
      const { node_code, business_id, date_from, date_to } = queryParams;

      // Get all action log nodes matching criteria
      const logsResult = await this.queryActionLogNodes({
        node_code,
        business_id,
        date_from,
        date_to,
        limit: 1000 // Get more for statistics
      });

      if (!logsResult.success) {
        return logsResult;
      }

      const logs = logsResult.nodes || [];

      // Calculate statistics
      const stats = {
        total_actions: logs.length,
        actions_by_type: {},
        actions_by_table: {},
        actions_by_date: {},
        avg_actions_per_day: 0,
        most_active_table: null,
        most_common_action: null
      };

      logs.forEach(log => {
        const metadata = log.metadata || {};

        // Count by action type
        const actionType = metadata.action_type || 'unknown';
        stats.actions_by_type[actionType] = (stats.actions_by_type[actionType] || 0) + 1;

        // Count by table
        const tableName = metadata.table_name || 'unknown';
        stats.actions_by_table[tableName] = (stats.actions_by_table[tableName] || 0) + 1;

        // Count by date
        const date = new Date(log.created_at).toISOString().split('T')[0];
        stats.actions_by_date[date] = (stats.actions_by_date[date] || 0) + 1;
      });

      // Find most common
      stats.most_common_action = Object.keys(stats.actions_by_type).reduce((a, b) =>
        stats.actions_by_type[a] > stats.actions_by_type[b] ? a : b, null);

      stats.most_active_table = Object.keys(stats.actions_by_table).reduce((a, b) =>
        stats.actions_by_table[a] > stats.actions_by_table[b] ? a : b, null);

      // Calculate average actions per day
      const dates = Object.keys(stats.actions_by_date);
      if (dates.length > 0) {
        const totalDays = dates.length;
        stats.avg_actions_per_day = stats.total_actions / totalDays;
      }

      return {
        success: true,
        statistics: stats,
        period: {
          from: date_from,
          to: date_to,
          total_logs_analyzed: logs.length
        }
      };

    } catch (error) {
      console.error('Get action statistics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Audit Trail for Node
   * Get complete audit trail of AI actions for a node
   */
  async getNodeAuditTrail(nodeCode, options = {}) {
    try {
      const { limit = 100, offset = 0, action_types = [], date_from, date_to } = options;

      const filters = {
        node_type: 'ai_action_log',
        node_code: nodeCode
      };

      if (action_types.length > 0) {
        filters['metadata.action_type'] = { in: action_types };
      }

      if (date_from || date_to) {
        filters.created_at = {};
        if (date_from) filters.created_at.gte = date_from;
        if (date_to) filters.created_at.lte = date_to;
      }

      const result = await this.nodeFactory.queryNodes({
        filters,
        limit,
        offset,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });

      return result;

    } catch (error) {
      console.error('Get user audit trail error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create relationship between nodes
   * Private helper method
   */
  async _createRelationship(sourceNodeId, targetNodeId, relationshipType) {
    try {
      // This would typically use a relationship creation method
      // For now, we'll store relationship info in metadata
      const relationshipData = {
        related_node_id: targetNodeId,
        relationship_type: relationshipType,
        created_at: new Date().toISOString()
      };

      await this.nodeFactory.updateNode(sourceNodeId, {
        [`relationship_${relationshipType}`]: relationshipData
      });

    } catch (error) {
      console.error('Create relationship error:', error);
      // Don't fail the main operation for relationship creation
    }
  }

  /**
   * Clean up old action logs
   * Archive or delete old action log nodes based on retention policy
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Find old action log nodes
      const oldLogsResult = await this.nodeFactory.queryNodes({
        filters: {
          node_type: 'ai_action_log',
          created_at: { lt: cutoffDate.toISOString() }
        },
        limit: 1000
      });

      if (!oldLogsResult.success) {
        return oldLogsResult;
      }

      const oldLogs = oldLogsResult.nodes || [];
      const archivedCount = oldLogs.length;

      // Mark as archived (or delete if preferred)
      for (const log of oldLogs) {
        await this.nodeFactory.updateNode(log.id, {
          status: 'archived',
          archived_at: new Date().toISOString()
        });
      }

      return {
        success: true,
        archived_count: archivedCount,
        retention_days: retentionDays,
        cutoff_date: cutoffDate.toISOString()
      };

    } catch (error) {
      console.error('Cleanup old logs error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AIActionLogsNode;