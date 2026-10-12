/**
 * AI Model Router Node Examples
 * Usage examples for AI Model Router Management
 */

const { aiModelRouterNode } = require('../core/ai-model-router');

/**
 * Example: Create a new AI model router configuration
 */
async function createModelRouterExample() {
  try {
    console.log('=== Creating AI Model Router Configuration Example ===');

    const routerData = {
      user_id: 'user-12345',
      provider: 'openai',
      api_key: 'sk-...your-openai-api-key...', // In production, this would be encrypted
      fallback_provider: 'anthropic',
      models: {
        'gpt-4': 'gpt-4',
        'gpt-3.5-turbo': 'gpt-3.5-turbo',
        'chat': 'gpt-4', // Default model for chat tasks
        '*': 'gpt-3.5-turbo' // Wildcard fallback
      },
      rate_limits: {
        requests_per_minute: 60,
        requests_per_hour: 1000,
        tokens_per_minute: 10000
      },
      cost_tracking: {
        enabled: true,
        currency: 'USD',
        budget_limit: 100.00,
        alert_threshold: 0.80
      },
      is_active: true,
      metadata: {
        description: 'Primary OpenAI router with Anthropic fallback',
        region: 'us-east-1',
        priority: 'high',
        tags: ['production', 'chat', 'completion']
      }
    };

    const result = await aiModelRouterNode.createModelRouter(routerData);

    console.log('Model router created successfully:');
    console.log('Node Code:', result.node.node_code);
    console.log('Database ID:', result.database_record.id);
    console.log('Provider:', result.node.metadata.provider);
    console.log('Fallback Provider:', result.node.metadata.fallback_provider);

    return result;
  } catch (error) {
    console.error('Error in create model router example:', error);
  }
}

/**
 * Example: Route an AI request
 */
async function routeRequestExample(userId) {
  try {
    console.log('=== Routing AI Request Example ===');

    const request = {
      model: 'gpt-4',
      task_type: 'chat',
      messages: [
        { role: 'user', content: 'Hello, how are you?' }
      ],
      parameters: {
        temperature: 0.7,
        max_tokens: 150
      }
    };

    const routingDecision = await aiModelRouterNode.routeRequest(userId, request);

    console.log('Routing decision:');
    console.log('Router Node Code:', routingDecision.router_node_code);
    console.log('Selected Provider:', routingDecision.provider);
    console.log('Selected Model:', routingDecision.model);
    console.log('Fallback Provider:', routingDecision.fallback_provider);
    console.log('Rate Limits:', routingDecision.rate_limits);

    return routingDecision;
  } catch (error) {
    console.error('Error in route request example:', error);
  }
}

/**
 * Example: Handle routing failure with fallback
 */
async function handleRoutingFailureExample(routerNodeCode) {
  try {
    console.log('=== Handling Routing Failure Example ===');

    const originalRequest = {
      model: 'gpt-4',
      task_type: 'chat'
    };

    const fallbackDecision = await aiModelRouterNode.handleRoutingFailure(routerNodeCode, originalRequest);

    console.log('Fallback routing decision:');
    console.log('Router Node Code:', fallbackDecision.router_node_code);
    console.log('Fallback Provider:', fallbackDecision.provider);
    console.log('Selected Model:', fallbackDecision.model);
    console.log('Is Fallback:', fallbackDecision.is_fallback);
    console.log('Original Provider:', fallbackDecision.original_provider);

    return fallbackDecision;
  } catch (error) {
    console.error('Error in handle routing failure example:', error);
  }
}

/**
 * Example: Query model routers by criteria
 */
async function queryModelRoutersExample(userId) {
  try {
    console.log('=== Querying Model Routers Example ===');

    const criteria = {
      user_id: userId,
      is_active: true
    };

    const routers = await aiModelRouterNode.queryModelRouters(criteria, { limit: 5 });

    console.log(`Found ${routers.length} active routers for user ${userId}:`);
    routers.forEach((router, index) => {
      console.log(`${index + 1}. Node Code: ${router.node_code}`);
      console.log(`   Provider: ${router.metadata.provider}`);
      console.log(`   Fallback: ${router.metadata.fallback_provider}`);
      console.log(`   API Calls: ${router.metadata.api_calls_count || 0}`);
      console.log(`   Success Rate: ${((router.metadata.success_rate || 0) * 100).toFixed(1)}%`);
      console.log(`   Total Cost: $${(router.metadata.total_cost || 0).toFixed(2)}`);
      console.log('');
    });

    return routers;
  } catch (error) {
    console.error('Error in query model routers example:', error);
  }
}

/**
 * Example: Update router configuration
 */
async function updateModelRouterExample(nodeCode) {
  try {
    console.log('=== Updating Model Router Example ===');

    const updateData = {
      rate_limits: {
        requests_per_minute: 100,
        requests_per_hour: 2000,
        tokens_per_minute: 20000
      },
      cost_tracking: {
        budget_limit: 200.00,
        alert_threshold: 0.90
      },
      models: {
        'gpt-4': 'gpt-4-turbo-preview', // Update to newer model
        'gpt-3.5-turbo': 'gpt-3.5-turbo',
        'chat': 'gpt-4-turbo-preview',
        '*': 'gpt-3.5-turbo'
      },
      metadata: {
        last_updated: new Date().toISOString(),
        update_reason: 'Performance optimization'
      }
    };

    const result = await aiModelRouterNode.updateModelRouter(nodeCode, updateData);

    console.log('Model router updated:');
    console.log('Node Code:', result.node.node_code);
    console.log('Updated Rate Limits:', result.node.metadata.rate_limits);
    console.log('Updated Models:', result.node.metadata.models);

    return result;
  } catch (error) {
    console.error('Error in update model router example:', error);
  }
}

/**
 * Example: Get router statistics
 */
async function getRouterStatsExample(userId) {
  try {
    console.log('=== Getting Router Statistics Example ===');

    const stats = await aiModelRouterNode.getRouterStats(userId);

    console.log('Router Statistics:');
    console.log(`Total Routers: ${stats.total_routers}`);
    console.log(`Active Routers: ${stats.active_routers}`);
    console.log(`Total API Calls: ${stats.total_api_calls}`);
    console.log(`Total Cost: $${stats.total_cost.toFixed(2)}`);
    console.log(`Average Success Rate: ${(stats.avg_success_rate * 100).toFixed(1)}%`);

    console.log('\nProvider Breakdown:');
    Object.entries(stats.provider_breakdown).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count} routers`);
    });

    console.log('\nCost by Provider:');
    Object.entries(stats.cost_by_provider).forEach(([provider, cost]) => {
      console.log(`  ${provider}: $${cost.toFixed(2)}`);
    });

    console.log('\nError Rate by Provider:');
    Object.entries(stats.error_rate_by_provider).forEach(([provider, rate]) => {
      console.log(`  ${provider}: ${(rate * 100).toFixed(1)}%`);
    });

    return stats;
  } catch (error) {
    console.error('Error in get router stats example:', error);
  }
}

/**
 * Example: Clone a model router
 */
async function cloneModelRouterExample(originalNodeCode, newUserId) {
  try {
    console.log('=== Cloning Model Router Example ===');

    // Get the original router
    const routers = await aiModelRouterNode.queryModelRouters();
    const originalRouter = routers.find(node => node.node_code === originalNodeCode);

    if (!originalRouter) {
      console.log('Original router not found');
      return;
    }

    // Create cloned router data
    const clonedData = {
      user_id: newUserId,
      provider: originalRouter.metadata.provider,
      api_key: 'REPLACE_WITH_NEW_API_KEY', // Don't copy API keys
      fallback_provider: originalRouter.metadata.fallback_provider,
      models: originalRouter.metadata.models,
      rate_limits: originalRouter.metadata.rate_limits,
      cost_tracking: {
        ...originalRouter.metadata.cost_tracking,
        budget_limit: 50.00 // Lower budget for clone
      },
      is_active: false, // Clones start inactive for security
      metadata: {
        ...originalRouter.metadata,
        cloned_from: originalNodeCode,
        cloned_at: new Date().toISOString(),
        purpose: 'user_template',
        original_owner: originalRouter.metadata.user_id
      }
    };

    const result = await aiModelRouterNode.createModelRouter(clonedData);

    console.log('Model router cloned successfully:');
    console.log('Original Node Code:', originalNodeCode);
    console.log('New Node Code:', result.node.node_code);
    console.log('New Owner:', result.node.metadata.user_id);
    console.log('Active Status:', result.node.metadata.is_active);

    return result;
  } catch (error) {
    console.error('Error in clone model router example:', error);
  }
}

/**
 * Example: Test a model router configuration
 */
async function testModelRouterExample(nodeCode) {
  try {
    console.log('=== Testing Model Router Example ===');

    // Get the router configuration
    const routers = await aiModelRouterNode.queryModelRouters();
    const router = routers.find(node => node.node_code === nodeCode);

    if (!router) {
      console.log('Router not found');
      return;
    }

    // Mock test (in real implementation, this would make an actual API call)
    console.log('Testing router configuration...');
    console.log('Router Node Code:', nodeCode);
    console.log('Provider:', router.metadata.provider);
    console.log('Models:', router.metadata.models);
    console.log('Rate Limits:', router.metadata.rate_limits);

    // Update last used timestamp
    await aiModelRouterNode.updateModelRouter(nodeCode, {
      last_used: new Date().toISOString()
    });

    console.log('Router test completed successfully');

    return {
      node_code: nodeCode,
      provider: router.metadata.provider,
      status: 'success',
      last_used: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in test model router example:', error);
  }
}

/**
 * Example: Multi-provider routing scenario
 */
async function multiProviderRoutingExample(userId) {
  try {
    console.log('=== Multi-Provider Routing Scenario Example ===');

    // Create multiple routers for different providers
    const routers = [
      {
        user_id: userId,
        provider: 'openai',
        api_key: 'sk-openai-key',
        fallback_provider: 'anthropic',
        models: { 'gpt-4': 'gpt-4', '*': 'gpt-3.5-turbo' },
        rate_limits: { requests_per_minute: 60 },
        cost_tracking: { enabled: true, budget_limit: 100 }
      },
      {
        user_id: userId,
        provider: 'anthropic',
        api_key: 'sk-ant-key',
        fallback_provider: 'openai',
        models: { 'claude-3': 'claude-3-opus', '*': 'claude-3-sonnet' },
        rate_limits: { requests_per_minute: 50 },
        cost_tracking: { enabled: true, budget_limit: 80 }
      }
    ];

    console.log('Creating multiple provider routers...');
    const createdRouters = [];

    for (const routerData of routers) {
      const result = await aiModelRouterNode.createModelRouter(routerData);
      createdRouters.push(result);
      console.log(`Created ${result.node.metadata.provider} router: ${result.node.node_code}`);
    }

    // Test routing different requests
    const testRequests = [
      { model: 'gpt-4', task_type: 'chat' },
      { model: 'claude-3', task_type: 'completion' },
      { model: 'unknown-model', task_type: 'chat' }
    ];

    console.log('\nTesting routing decisions...');
    for (const request of testRequests) {
      try {
        const decision = await aiModelRouterNode.routeRequest(userId, request);
        console.log(`Request ${request.model}: Routed to ${decision.provider} (${decision.model})`);
      } catch (error) {
        console.log(`Request ${request.model}: Routing failed - ${error.message}`);
      }
    }

    return createdRouters;
  } catch (error) {
    console.error('Error in multi-provider routing example:', error);
  }
}

/**
 * Example: Router lifecycle management
 */
async function routerLifecycleExample() {
  try {
    console.log('=== Router Lifecycle Management Example ===');

    // 1. Create a router
    console.log('1. Creating router...');
    const createResult = await createModelRouterExample();
    const nodeCode = createResult.node.node_code;

    // 2. Query the router
    console.log('2. Querying router...');
    const routers = await aiModelRouterNode.queryModelRouters();
    const router = routers.find(node => node.node_code === nodeCode);
    console.log('Router found:', router.node_code);

    // 3. Update configuration
    console.log('3. Updating configuration...');
    await updateModelRouterExample(nodeCode);

    // 4. Test routing
    console.log('4. Testing routing...');
    await routeRequestExample(router.metadata.user_id);

    // 5. Get statistics
    console.log('5. Getting statistics...');
    await getRouterStatsExample(router.metadata.user_id);

    // 6. Clone the router
    console.log('6. Cloning router...');
    await cloneModelRouterExample(nodeCode, 'user-67890');

    // 7. Deactivate (soft delete)
    console.log('7. Deactivating router...');
    await aiModelRouterNode.updateModelRouter(nodeCode, { is_active: false });

    console.log('Router lifecycle completed successfully');

  } catch (error) {
    console.error('Error in router lifecycle example:', error);
  }
}

// Export examples for external use
module.exports = {
  createModelRouterExample,
  routeRequestExample,
  handleRoutingFailureExample,
  queryModelRoutersExample,
  updateModelRouterExample,
  getRouterStatsExample,
  cloneModelRouterExample,
  testModelRouterExample,
  multiProviderRoutingExample,
  routerLifecycleExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running AI Model Router Examples...\n');

  // Run examples sequentially
  setTimeout(async () => {
    await routerLifecycleExample();
    console.log('\n' + '='.repeat(50) + '\n');
    await multiProviderRoutingExample('user-12345');
    console.log('\nExamples completed.');
  }, 1000);
}