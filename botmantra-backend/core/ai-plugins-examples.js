/**
 * AI Plugins Node Examples
 * Usage examples for AI Plugins Management
 */

const { aiPluginsNode } = require('../core/ai-plugins');

/**
 * Example: Create a new AI plugin
 */
async function createPluginExample() {
  try {
    console.log('=== Creating AI Plugin Example ===');

    const pluginData = {
      user_id: 'user-12345',
      plugin_name: 'Text Generation Assistant',
      plugin_type: 'text_generation',
      provider: 'openai',
      api_key: 'sk-...your-openai-api-key...', // In production, this would be encrypted
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 150
      },
      capabilities: ['text-generation', 'chat', 'completion'],
      is_active: true,
      version: '1.0.0',
      description: 'Advanced text generation plugin using GPT-4',
      tags: ['text', 'generation', 'gpt-4', 'production'],
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
      }
    };

    const result = await aiPluginsNode.createPlugin(pluginData);

    console.log('Plugin created successfully:');
    console.log('Node Code:', result.node.node_code);
    console.log('Database ID:', result.database_record.id);
    console.log('Plugin Name:', result.node.metadata.plugin_name);
    console.log('Plugin Type:', result.node.metadata.plugin_type);
    console.log('Provider:', result.node.metadata.provider);

    return result;
  } catch (error) {
    console.error('Error in create plugin example:', error);
  }
}

/**
 * Example: Execute an AI plugin
 */
async function executePluginExample(nodeCode) {
  try {
    console.log('=== Executing AI Plugin Example ===');

    const executionData = {
      prompt: 'Write a short story about a robot learning to paint',
      temperature: 0.8,
      max_tokens: 200
    };

    const result = await aiPluginsNode.executePlugin(nodeCode, executionData);

    console.log('Plugin execution result:');
    console.log('Success:', result.success);
    console.log('Execution Time:', result.execution_time, 'ms');
    console.log('Cost:', result.cost, 'USD');
    console.log('Plugin:', result.plugin.plugin_name);
    if (result.output) {
      console.log('Output:', result.output.text ? result.output.text.substring(0, 100) + '...' : 'Complex output');
    }

    return result;
  } catch (error) {
    console.error('Error in execute plugin example:', error);
  }
}

/**
 * Example: Query plugins by criteria
 */
async function queryPluginsExample(userId) {
  try {
    console.log('=== Querying AI Plugins Example ===');

    const criteria = {
      user_id: userId,
      is_active: true
    };

    const plugins = await aiPluginsNode.queryPlugins(criteria, { limit: 10 });

    console.log(`Found ${plugins.length} active plugins for user ${userId}:`);
    plugins.forEach((plugin, index) => {
      console.log(`${index + 1}. ${plugin.database_record.plugin_name}`);
      console.log(`   Type: ${plugin.database_record.plugin_type}`);
      console.log(`   Provider: ${plugin.database_record.provider}`);
      console.log(`   Usage: ${plugin.database_record.usage_count} times`);
      console.log(`   Success Rate: ${(plugin.database_record.success_rate * 100).toFixed(1)}%`);
      console.log(`   Total Cost: $${plugin.database_record.total_cost.toFixed(2)}`);
      console.log('');
    });

    return plugins;
  } catch (error) {
    console.error('Error in query plugins example:', error);
  }
}

/**
 * Example: Update plugin configuration
 */
async function updatePluginExample(nodeCode) {
  try {
    console.log('=== Updating AI Plugin Example ===');

    const updateData = {
      config: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.9,
        max_tokens: 300
      },
      rate_limits: {
        requests_per_minute: 100,
        requests_per_hour: 2000,
        tokens_per_minute: 20000
      },
      cost_tracking: {
        budget_limit: 200.00,
        alert_threshold: 0.85
      },
      tags: ['text', 'generation', 'gpt-4-turbo', 'production', 'updated']
    };

    const result = await aiPluginsNode.updatePlugin(nodeCode, updateData);

    console.log('Plugin updated:');
    console.log('Node Code:', result.node.node_code);
    console.log('Updated Model:', result.node.metadata.config.model);
    console.log('Updated Rate Limits:', result.node.metadata.rate_limits);
    console.log('Updated Budget:', result.node.metadata.cost_tracking.budget_limit);

    return result;
  } catch (error) {
    console.error('Error in update plugin example:', error);
  }
}

/**
 * Example: Get plugin statistics
 */
async function getPluginStatsExample(userId) {
  try {
    console.log('=== Getting Plugin Statistics Example ===');

    const stats = await aiPluginsNode.getPluginStats(userId);

    console.log('Plugin Statistics:');
    console.log(`Total Plugins: ${stats.total_plugins}`);
    console.log(`Active Plugins: ${stats.active_plugins}`);
    console.log(`Total Usage: ${stats.total_usage}`);
    console.log(`Total Cost: $${stats.total_cost.toFixed(2)}`);
    console.log(`Average Success Rate: ${(stats.avg_success_rate * 100).toFixed(1)}%`);

    console.log('\nPlugin Types:');
    Object.entries(stats.plugin_types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} plugins`);
    });

    console.log('\nProviders:');
    Object.entries(stats.providers).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count} plugins`);
    });

    return stats;
  } catch (error) {
    console.error('Error in get plugin stats example:', error);
  }
}

/**
 * Example: Clone a plugin
 */
async function clonePluginExample(originalNodeCode, newUserId) {
  try {
    console.log('=== Cloning AI Plugin Example ===');

    const modifications = {
      plugin_name: 'Text Generation Assistant (Team Copy)',
      cost_tracking: {
        budget_limit: 50.00,
        alert_threshold: 0.90
      },
      tags: ['text', 'generation', 'team', 'cloned']
    };

    const result = await aiPluginsNode.clonePlugin(originalNodeCode, newUserId, modifications);

    console.log('Plugin cloned successfully:');
    console.log('Original Node Code:', originalNodeCode);
    console.log('New Node Code:', result.node.node_code);
    console.log('New Owner:', result.node.metadata.user_id);
    console.log('New Name:', result.node.metadata.plugin_name);
    console.log('Active Status:', result.node.metadata.is_active);

    return result;
  } catch (error) {
    console.error('Error in clone plugin example:', error);
  }
}

/**
 * Example: Test plugin configuration
 */
async function testPluginExample(nodeCode) {
  try {
    console.log('=== Testing AI Plugin Example ===');

    // Get plugin info
    const plugins = await aiPluginsNode.queryPlugins({ node_code: nodeCode });
    if (plugins.length === 0) {
      console.log('Plugin not found');
      return;
    }

    const plugin = plugins[0];

    console.log('Testing plugin configuration...');
    console.log('Plugin Name:', plugin.database_record.plugin_name);
    console.log('Plugin Type:', plugin.database_record.plugin_type);
    console.log('Provider:', plugin.database_record.provider);

    // Perform test execution
    const testResult = await executePluginExample(nodeCode);

    console.log('Test completed:', testResult ? 'SUCCESS' : 'FAILED');

    return testResult;
  } catch (error) {
    console.error('Error in test plugin example:', error);
  }
}

/**
 * Example: Create multiple plugin types
 */
async function createMultiplePluginsExample(userId) {
  try {
    console.log('=== Creating Multiple Plugin Types Example ===');

    const plugins = [
      {
        user_id: userId,
        plugin_name: 'Image Generator Pro',
        plugin_type: 'image_generation',
        provider: 'openai',
        api_key: 'sk-openai-key',
        config: { model: 'dall-e-3', size: '1024x1024' },
        capabilities: ['image-generation', 'dalle-3'],
        rate_limits: { requests_per_minute: 10 },
        cost_tracking: { enabled: true, budget_limit: 50.00 }
      },
      {
        user_id: userId,
        plugin_name: 'Code Analyzer',
        plugin_type: 'code_analysis',
        provider: 'anthropic',
        api_key: 'sk-ant-key',
        config: { model: 'claude-3-sonnet' },
        capabilities: ['code-review', 'optimization'],
        rate_limits: { requests_per_minute: 30 },
        cost_tracking: { enabled: true, budget_limit: 25.00 }
      },
      {
        user_id: userId,
        plugin_name: 'Data Processor',
        plugin_type: 'data_processing',
        provider: 'huggingface',
        api_key: 'hf-key',
        config: { model: 'data-analyzer-v1' },
        capabilities: ['data-analysis', 'insights'],
        rate_limits: { requests_per_minute: 20 },
        cost_tracking: { enabled: true, budget_limit: 15.00 }
      }
    ];

    console.log('Creating multiple plugins...');
    const createdPlugins = [];

    for (const pluginData of plugins) {
      try {
        const result = await aiPluginsNode.createPlugin(pluginData);
        createdPlugins.push(result);
        console.log(`✓ Created ${result.node.metadata.plugin_name} (${result.node.metadata.plugin_type})`);
      } catch (error) {
        console.log(`✗ Failed to create ${pluginData.plugin_name}: ${error.message}`);
      }
    }

    console.log(`\nSuccessfully created ${createdPlugins.length} plugins`);

    return createdPlugins;
  } catch (error) {
    console.error('Error in create multiple plugins example:', error);
  }
}

/**
 * Example: Plugin lifecycle management
 */
async function pluginLifecycleExample() {
  try {
    console.log('=== Plugin Lifecycle Management Example ===');

    // 1. Create a plugin
    console.log('1. Creating plugin...');
    const createResult = await createPluginExample();
    const nodeCode = createResult.node.node_code;

    // 2. Query the plugin
    console.log('2. Querying plugin...');
    const plugins = await aiPluginsNode.queryPlugins({ node_code: nodeCode });
    console.log('Plugin found:', plugins[0].database_record.plugin_name);

    // 3. Update configuration
    console.log('3. Updating configuration...');
    await updatePluginExample(nodeCode);

    // 4. Execute the plugin
    console.log('4. Executing plugin...');
    await executePluginExample(nodeCode);

    // 5. Test the plugin
    console.log('5. Testing plugin...');
    await testPluginExample(nodeCode);

    // 6. Get statistics
    console.log('6. Getting statistics...');
    await getPluginStatsExample(plugins[0].database_record.user_id);

    // 7. Clone the plugin
    console.log('7. Cloning plugin...');
    await clonePluginExample(nodeCode, 'user-67890');

    // 8. Deactivate (soft delete)
    console.log('8. Deactivating plugin...');
    await aiPluginsNode.updatePlugin(nodeCode, { is_active: false });

    console.log('Plugin lifecycle completed successfully');

  } catch (error) {
    console.error('Error in plugin lifecycle example:', error);
  }
}

/**
 * Example: Batch plugin operations
 */
async function batchPluginOperationsExample(userId) {
  try {
    console.log('=== Batch Plugin Operations Example ===');

    // Create multiple plugins
    const createdPlugins = await createMultiplePluginsExample(userId);

    if (createdPlugins.length === 0) {
      console.log('No plugins created, skipping batch operations');
      return;
    }

    // Execute all plugins
    console.log('\nExecuting all plugins...');
    for (const plugin of createdPlugins) {
      try {
        const result = await executePluginExample(plugin.node.node_code);
        console.log(`✓ Executed ${plugin.node.metadata.plugin_name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        console.log(`✗ Failed to execute ${plugin.node.metadata.plugin_name}: ${error.message}`);
      }
    }

    // Update all plugins with new rate limits
    console.log('\nUpdating all plugins with new rate limits...');
    for (const plugin of createdPlugins) {
      try {
        await aiPluginsNode.updatePlugin(plugin.node.node_code, {
          rate_limits: {
            requests_per_minute: 50,
            requests_per_hour: 1000,
            tokens_per_minute: 15000
          }
        });
        console.log(`✓ Updated rate limits for ${plugin.node.metadata.plugin_name}`);
      } catch (error) {
        console.log(`✗ Failed to update ${plugin.node.metadata.plugin_name}: ${error.message}`);
      }
    }

    // Get final statistics
    console.log('\nFinal statistics:');
    await getPluginStatsExample(userId);

  } catch (error) {
    console.error('Error in batch plugin operations example:', error);
  }
}

// Export examples for external use
module.exports = {
  createPluginExample,
  executePluginExample,
  queryPluginsExample,
  updatePluginExample,
  getPluginStatsExample,
  clonePluginExample,
  testPluginExample,
  createMultiplePluginsExample,
  pluginLifecycleExample,
  batchPluginOperationsExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running AI Plugins Examples...\n');

  // Run examples sequentially
  setTimeout(async () => {
    await pluginLifecycleExample();
    console.log('\n' + '='.repeat(50) + '\n');
    await batchPluginOperationsExample('user-12345');
    console.log('\nExamples completed.');
  }, 1000);
}