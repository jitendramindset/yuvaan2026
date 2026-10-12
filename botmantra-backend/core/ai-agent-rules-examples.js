/**
 * AI Agent Rules Node Examples
 * Usage examples for the AI agent rules node system
 */

const AIAgentRulesNode = require('./ai-agent-rules');

/**
 * Example: Create an agent rule for user activity monitoring
 * @param {string} nodeCode - Node code for the rule
 * @param {string} ruleName - Name of the rule
 * @param {string} triggerType - Type of trigger (e.g., 'user_login', 'data_change')
 */
async function createUserActivityRule(nodeCode, ruleName, triggerType) {
  try {
    const ruleData = {
      rule_name: ruleName,
      trigger_type: triggerType,
      condition_json: JSON.stringify({
        user_type: 'premium',
        activity_score: { $gt: 10 }
      }),
      action_json: JSON.stringify([
        {
          type: 'notification',
          target: 'admin',
          message: `High activity detected for ${ruleName}`
        },
        {
          type: 'log',
          level: 'info',
          data: { rule_triggered: ruleName, trigger_type: triggerType }
        }
      ]),
      description: `Monitor ${triggerType} activities for ${ruleName}`,
      priority: 5,
      is_active: true
    };

    const node = await AIAgentRulesNode.createAgentRuleNode(nodeCode, ruleData);
    console.log('Created agent rule node:', node.id);
    return node;
  } catch (error) {
    console.error('Error creating user activity rule:', error);
    throw error;
  }
}

/**
 * Example: Query rules by trigger type
 * @param {string} triggerType - Trigger type to query
 */
async function getRulesByTrigger(triggerType) {
  try {
    const nodes = await AIAgentRulesNode.queryAgentRuleNodes({
      trigger_type: triggerType,
      is_active: true
    });
    console.log(`Found ${nodes.length} active rules for trigger type: ${triggerType}`);
    return nodes;
  } catch (error) {
    console.error('Error querying rules by trigger:', error);
    throw error;
  }
}

/**
 * Example: Evaluate rules for a specific trigger
 * @param {string} triggerType - Type of trigger
 * @param {Object} triggerData - Data associated with the trigger
 */
async function evaluateTriggerRules(triggerType, triggerData) {
  try {
    const matchingRules = await AIAgentRulesNode.evaluateRules(triggerType, triggerData);
    console.log(`Found ${matchingRules.length} matching rules for trigger: ${triggerType}`);

    if (matchingRules.length > 0) {
      console.log('Executing rule actions...');
      // Here you would execute the actions defined in each rule
      for (const rule of matchingRules) {
        console.log(`Executing rule: ${rule.rule_name} with priority ${rule.priority}`);
        // Execute actions based on rule.action_json
        await executeRuleActions(rule.actions, triggerData);
      }
    }

    return matchingRules;
  } catch (error) {
    console.error('Error evaluating trigger rules:', error);
    throw error;
  }
}

/**
 * Example: Update rule conditions and actions
 * @param {string} nodeCode - Node code to update
 * @param {Object} newConditions - New condition JSON
 * @param {Array} newActions - New action array
 */
async function updateRuleLogic(nodeCode, newConditions, newActions) {
  try {
    const updates = {
      'metadata.condition_json': JSON.stringify(newConditions),
      'metadata.action_json': JSON.stringify(newActions),
      'metadata.description': `Updated rule with ${newActions.length} actions`
    };

    const node = await AIAgentRulesNode.updateAgentRuleNode(nodeCode, updates);
    console.log('Updated rule logic for node:', node.node_code);
    return node;
  } catch (error) {
    console.error('Error updating rule logic:', error);
    throw error;
  }
}

/**
 * Example: Get rule statistics
 */
async function getRuleStats() {
  try {
    const stats = await AIAgentRulesNode.getRuleStatistics();
    console.log('Agent rule statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting rule stats:', error);
    throw error;
  }
}

/**
 * Example: Create a comprehensive security monitoring rule set
 */
async function createSecurityRules() {
  const securityRules = [
    {
      name: 'Failed Login Monitor',
      trigger: 'login_failed',
      conditions: { failure_count: { $gte: 3 }, time_window: 300 },
      actions: [
        { type: 'alert', level: 'high', message: 'Multiple failed login attempts detected' },
        { type: 'lock_account', duration: 900 }
      ],
      priority: 10
    },
    {
      name: 'Suspicious Data Access',
      trigger: 'data_access',
      conditions: { sensitivity_level: 'high', user_clearance: 'low' },
      actions: [
        { type: 'log', level: 'warning' },
        { type: 'notification', target: 'security_team' }
      ],
      priority: 8
    },
    {
      name: 'API Rate Limit Exceeded',
      trigger: 'api_call',
      conditions: { rate_limit_exceeded: true, endpoint: { $in: ['/admin', '/sensitive'] } },
      actions: [
        { type: 'block_ip', duration: 3600 },
        { type: 'alert', level: 'critical' }
      ],
      priority: 9
    }
  ];

  const createdRules = [];

  for (const rule of securityRules) {
    try {
      const nodeCode = `security_rule_${rule.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const node = await createUserActivityRule(
        nodeCode,
        rule.name,
        rule.trigger
      );

      // Update with specific conditions and actions
      await updateRuleLogic(nodeCode, rule.conditions, rule.actions);

      createdRules.push({ ...rule, node_code: nodeCode });
    } catch (error) {
      console.error(`Failed to create security rule ${rule.name}:`, error);
    }
  }

  console.log(`Created ${createdRules.length} security monitoring rules`);
  return createdRules;
}

/**
 * Example: Simulate rule evaluation for testing
 * @param {string} triggerType - Trigger type to simulate
 * @param {Object} testData - Test data for evaluation
 */
async function simulateRuleEvaluation(triggerType, testData) {
  try {
    console.log(`Simulating rule evaluation for trigger: ${triggerType}`);
    console.log('Test data:', testData);

    const matchingRules = await evaluateTriggerRules(triggerType, testData);

    return {
      trigger_type: triggerType,
      test_data: testData,
      matching_rules: matchingRules.length,
      rules_executed: matchingRules.map(r => r.rule_name)
    };
  } catch (error) {
    console.error('Error in rule evaluation simulation:', error);
    throw error;
  }
}

/**
 * Helper function to execute rule actions (mock implementation)
 * @param {Array} actions - Array of actions to execute
 * @param {Object} triggerData - Trigger data context
 */
async function executeRuleActions(actions, triggerData) {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'notification':
          console.log(`📧 Notification: ${action.message || 'Rule triggered'}`);
          break;
        case 'alert':
          console.log(`🚨 Alert (${action.level}): ${action.message || 'Alert triggered'}`);
          break;
        case 'log':
          console.log(`📝 Log (${action.level}):`, action.data || triggerData);
          break;
        case 'lock_account':
          console.log(`🔒 Account locked for ${action.duration || 900} seconds`);
          break;
        case 'block_ip':
          console.log(`🚫 IP blocked for ${action.duration || 3600} seconds`);
          break;
        default:
          console.log(`⚡ Executing action: ${action.type}`);
      }
    } catch (actionError) {
      console.error(`Failed to execute action ${action.type}:`, actionError);
    }
  }
}

// Export example functions for testing
module.exports = {
  createUserActivityRule,
  getRulesByTrigger,
  evaluateTriggerRules,
  updateRuleLogic,
  getRuleStats,
  createSecurityRules,
  simulateRuleEvaluation,
  executeRuleActions
};

// Example usage (uncomment to test):
/*
async function runExamples() {
  // Create security rules
  await createSecurityRules();

  // Test rule evaluation
  const testResult = await simulateRuleEvaluation('login_failed', {
    failure_count: 5,
    time_window: 300,
    user_id: 'test_user'
  });

  console.log('Test result:', testResult);

  // Get statistics
  await getRuleStats();
}

runExamples().catch(console.error);
*/