/**
 * AI Action Requests Node Examples
 * Usage examples for the AI action requests node system
 */

const AIActionRequestsNode = require('./ai-action-requests');

/**
 * Example: Create an action request for a chat interaction
 * @param {string} nodeCode - Node code for the user/bot
 * @param {string} actionType - Type of action (e.g., 'chat_response', 'data_update')
 * @param {string} targetTable - Target table for the action
 * @param {Object} payload - Input payload data
 */
async function createChatActionRequest(nodeCode, actionType, targetTable, payload) {
  try {
    const requestData = {
      action_type: actionType,
      target_table: targetTable,
      input_payload: payload,
      status: 'pending'
    };

    const node = await AIActionRequestsNode.createActionRequestNode(nodeCode, requestData);
    console.log('Created action request node:', node.id);
    return node;
  } catch (error) {
    console.error('Error creating chat action request:', error);
    throw error;
  }
}

/**
 * Example: Query action requests for a specific node
 * @param {string} nodeCode - Node code to query
 * @param {string} status - Optional status filter
 */
async function getNodeActionRequests(nodeCode, status = null) {
  try {
    const filters = { node_code: nodeCode };
    if (status) filters.status = status;

    const nodes = await AIActionRequestsNode.queryActionRequestNodes(filters);
    console.log(`Found ${nodes.length} action requests for node ${nodeCode}`);
    return nodes;
  } catch (error) {
    console.error('Error querying node action requests:', error);
    throw error;
  }
}

/**
 * Example: Update action request status
 * @param {string} nodeCode - Node code
 * @param {string} newStatus - New status ('completed', 'failed', etc.)
 * @param {string} errorMessage - Optional error message
 */
async function updateActionRequestStatus(nodeCode, newStatus, errorMessage = null) {
  try {
    const updates = {
      'metadata.status': newStatus
    };

    if (errorMessage) {
      updates['metadata.error_message'] = errorMessage;
    }

    if (newStatus === 'completed') {
      updates['metadata.executed_at'] = new Date().toISOString();
    }

    const node = await AIActionRequestsNode.updateActionRequestNode(nodeCode, updates);
    console.log('Updated action request status:', node.metadata.status);
    return node;
  } catch (error) {
    console.error('Error updating action request status:', error);
    throw error;
  }
}

/**
 * Example: Get action request statistics for a node
 * @param {string} nodeCode - Node code
 */
async function getActionRequestStats(nodeCode) {
  try {
    const stats = await AIActionRequestsNode.getActionRequestStatistics(nodeCode);
    console.log('Action request statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting action request stats:', error);
    throw error;
  }
}

/**
 * Example: Generate compliance report for action requests
 * @param {string} nodeCode - Node code
 */
async function generateComplianceReport(nodeCode) {
  try {
    const auditTrail = await AIActionRequestsNode.getNodeActionRequestAuditTrail(nodeCode);

    const report = {
      nodeCode,
      totalRequests: auditTrail.length,
      completedRequests: auditTrail.filter(r => r.status === 'completed').length,
      failedRequests: auditTrail.filter(r => r.status === 'failed').length,
      pendingRequests: auditTrail.filter(r => r.status === 'pending').length,
      recentActivity: auditTrail.slice(0, 10), // Last 10 requests
      generatedAt: new Date().toISOString()
    };

    console.log('Compliance report generated:', report);
    return report;
  } catch (error) {
    console.error('Error generating compliance report:', error);
    throw error;
  }
}

/**
 * Example: Bulk update action requests for a node
 * @param {string} nodeCode - Node code
 * @param {string} oldStatus - Status to update from
 * @param {string} newStatus - Status to update to
 */
async function bulkUpdateActionRequests(nodeCode, oldStatus, newStatus) {
  try {
    const nodes = await AIActionRequestsNode.queryActionRequestNodes({
      node_code: nodeCode,
      status: oldStatus
    });

    const updates = { 'metadata.status': newStatus };
    if (newStatus === 'completed') {
      updates['metadata.executed_at'] = new Date().toISOString();
    }

    const updatedNodes = [];
    for (const node of nodes) {
      const updated = await AIActionRequestsNode.updateActionRequestNode(node.node_code, updates);
      updatedNodes.push(updated);
    }

    console.log(`Bulk updated ${updatedNodes.length} action requests`);
    return updatedNodes;
  } catch (error) {
    console.error('Error in bulk update:', error);
    throw error;
  }
}

// Export example functions for testing
module.exports = {
  createChatActionRequest,
  getNodeActionRequests,
  updateActionRequestStatus,
  getActionRequestStats,
  generateComplianceReport,
  bulkUpdateActionRequests
};

// Example usage (uncomment to test):
/*
async function runExamples() {
  const nodeCode = 'user_123';

  // Create a request
  await createChatActionRequest(nodeCode, 'chat_response', 'conversations', { message: 'Hello' });

  // Query requests
  const requests = await getNodeActionRequests(nodeCode);

  // Update status
  if (requests.length > 0) {
    await updateActionRequestStatus(requests[0].node_code, 'completed');
  }

  // Get stats
  await getActionRequestStats(nodeCode);

  // Generate report
  await generateComplianceReport(nodeCode);
}

runExamples().catch(console.error);
*/