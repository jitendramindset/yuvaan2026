/**
 * AI Action Logs Node - Usage Examples
 *
 * This demonstrates how to use the AIActionLogsNode core module
 * to treat action logs as nodes in the neural graph system.
 */

const { createClient } = require('@supabase/supabase-js');
const AIActionLogsNode = require('../core/ai-action-logs');

// Initialize (in a real app, this would be done in server.js)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const actionLogsNode = new AIActionLogsNode(supabase);

/**
 * Example 1: Log an AI Chat Action
 */
async function logChatAction(nodeCode, chatData) {
  const result = await actionLogsNode.createActionLogNode(nodeCode, {
    action_type: 'chat_message',
    table_name: 'ai_chat_messages',
    before_data: {},
    after_data: {
      message: chatData.message,
      response: chatData.response,
      model: chatData.model
    },
    executed_sql: 'INSERT INTO ai_chat_messages ...',
    ip_address: chatData.ip,
    device_id: chatData.deviceId,
    business_id: chatData.businessId
  });

  if (result.success) {
    console.log('Chat action logged as node:', result.node_id);
  }
  return result;
}

/**
 * Example 2: Query Action Logs for Audit
 */
async function getNodeActionHistory(nodeCode, days = 30) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const result = await actionLogsNode.queryActionLogNodes({
    node_code: nodeCode,
    date_from: dateFrom.toISOString(),
    limit: 100
  });

  if (result.success) {
    console.log(`Found ${result.nodes.length} action log nodes`);
  }
  return result;
}

/**
 * Example 3: Get Action Statistics
 */
async function getActionStats(nodeCode) {
  const result = await actionLogsNode.getActionStatistics({
    node_code: nodeCode,
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  });

  if (result.success) {
    console.log('Action Statistics:', result.statistics);
  }
  return result;
}

/**
 * Example 4: Audit Trail for Compliance
 */
async function generateComplianceReport(nodeCode, businessId) {
  const auditResult = await actionLogsNode.getNodeAuditTrail(nodeCode, {
    action_types: ['data_write', 'data_delete', 'admin_access'],
    limit: 500
  });

  if (auditResult.success) {
    // Generate compliance report
    const report = {
      node_code: nodeCode,
      business_id: businessId,
      total_actions: auditResult.nodes.length,
      actions: auditResult.nodes.map(node => ({
        id: node.id,
        action_type: node.metadata.action_type,
        table_name: node.metadata.table_name,
        timestamp: node.created_at,
        ip_address: node.metadata.ip_address
      }))
    };

    console.log('Compliance Report Generated');
    return report;
  }

  return auditResult;
}

module.exports = {
  logChatAction,
  getNodeActionHistory,
  getActionStats,
  generateComplianceReport,
  actionLogsNode
};