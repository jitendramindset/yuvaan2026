/**
 * AI Action Whitelist Node Examples
 * Usage examples for the AI action whitelist node system
 */

const AIActionWhitelistNode = require('./ai-action-whitelist');

/**
 * Example: Create an action whitelist for a table
 * @param {string} nodeCode - Node code for the whitelist
 * @param {string} tableName - Table name to whitelist
 * @param {Array} allowedActions - Array of allowed actions
 */
async function createTableWhitelist(nodeCode, tableName, allowedActions) {
  try {
    const whitelistData = {
      table_name: tableName,
      allowed_actions: allowedActions,
      description: `Whitelist for ${tableName} table`,
      is_active: true
    };

    const node = await AIActionWhitelistNode.createActionWhitelistNode(nodeCode, whitelistData);
    console.log('Created action whitelist node:', node.id);
    return node;
  } catch (error) {
    console.error('Error creating table whitelist:', error);
    throw error;
  }
}

/**
 * Example: Query whitelists for a specific table
 * @param {string} tableName - Table name to query
 */
async function getTableWhitelists(tableName) {
  try {
    const nodes = await AIActionWhitelistNode.queryActionWhitelistNodes({
      table_name: tableName,
      is_active: true
    });
    console.log(`Found ${nodes.length} whitelists for table ${tableName}`);
    return nodes;
  } catch (error) {
    console.error('Error querying table whitelists:', error);
    throw error;
  }
}

/**
 * Example: Check if an action is allowed for a table
 * @param {string} tableName - Table name
 * @param {string} action - Action to check
 */
async function checkActionPermission(tableName, action) {
  try {
    const isAllowed = await AIActionWhitelistNode.isActionAllowed(tableName, action);
    console.log(`Action '${action}' on table '${tableName}' is ${isAllowed ? 'ALLOWED' : 'DENIED'}`);
    return isAllowed;
  } catch (error) {
    console.error('Error checking action permission:', error);
    throw error;
  }
}

/**
 * Example: Update whitelist actions
 * @param {string} nodeCode - Node code to update
 * @param {Array} newActions - New allowed actions
 */
async function updateWhitelistActions(nodeCode, newActions) {
  try {
    const updates = {
      'metadata.allowed_actions': newActions,
      'metadata.description': `Updated whitelist with ${newActions.length} actions`
    };

    const node = await AIActionWhitelistNode.updateActionWhitelistNode(nodeCode, updates);
    console.log('Updated whitelist actions:', node.metadata.allowed_actions);
    return node;
  } catch (error) {
    console.error('Error updating whitelist actions:', error);
    throw error;
  }
}

/**
 * Example: Get whitelist statistics
 */
async function getWhitelistStats() {
  try {
    const stats = await AIActionWhitelistNode.getWhitelistStatistics();
    console.log('Whitelist statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting whitelist stats:', error);
    throw error;
  }
}

/**
 * Example: Deactivate a whitelist
 * @param {string} nodeCode - Node code to deactivate
 */
async function deactivateWhitelist(nodeCode) {
  try {
    const updates = {
      'metadata.is_active': false
    };

    const node = await AIActionWhitelistNode.updateActionWhitelistNode(nodeCode, updates);
    console.log('Deactivated whitelist:', node.id);
    return node;
  } catch (error) {
    console.error('Error deactivating whitelist:', error);
    throw error;
  }
}

/**
 * Example: Create comprehensive whitelists for common tables
 */
async function createCommonWhitelists() {
  const whitelists = [
    {
      table: 'users',
      actions: ['read', 'update'],
      description: 'Basic user operations'
    },
    {
      table: 'conversations',
      actions: ['create', 'read', 'update'],
      description: 'Chat conversation management'
    },
    {
      table: 'ai_action_logs',
      actions: ['create', 'read'],
      description: 'AI action logging'
    },
    {
      table: 'business_data',
      actions: ['read', 'update', 'delete'],
      description: 'Business data operations'
    }
  ];

  const createdWhitelists = [];

  for (const whitelist of whitelists) {
    try {
      const nodeCode = `whitelist_${whitelist.table}_${Date.now()}`;
      const node = await createTableWhitelist(
        nodeCode,
        whitelist.table,
        whitelist.actions
      );
      createdWhitelists.push(node);
    } catch (error) {
      console.error(`Failed to create whitelist for ${whitelist.table}:`, error);
    }
  }

  console.log(`Created ${createdWhitelists.length} common whitelists`);
  return createdWhitelists;
}

// Export example functions for testing
module.exports = {
  createTableWhitelist,
  getTableWhitelists,
  checkActionPermission,
  updateWhitelistActions,
  getWhitelistStats,
  deactivateWhitelist,
  createCommonWhitelists
};

// Example usage (uncomment to test):
/*
async function runExamples() {
  // Create common whitelists
  await createCommonWhitelists();

  // Check permissions
  await checkActionPermission('users', 'read');
  await checkActionPermission('users', 'delete'); // Should be denied

  // Get stats
  await getWhitelistStats();

  // Query specific table
  const userWhitelists = await getTableWhitelists('users');
  console.log('User table whitelists:', userWhitelists);
}

runExamples().catch(console.error);
*/