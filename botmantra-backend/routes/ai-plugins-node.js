/**
 * AI Plugins Node Routes
 * REST API endpoints for AI plugins management
 */

const express = require('express');
const router = express.Router();
const { aiPluginsNode } = require('../core/ai-plugins');

/**
 * POST /api/ai-plugins
 * Create a new AI plugin
 */
router.post('/', async (req, res) => {
  try {
    const pluginData = {
      user_id: req.body.user_id || req.user?.id,
      plugin_name: req.body.plugin_name,
      plugin_type: req.body.plugin_type,
      provider: req.body.provider,
      api_key: req.body.api_key,
      config: req.body.config || {},
      capabilities: req.body.capabilities || [],
      is_active: req.body.is_active !== false,
      version: req.body.version || '1.0.0',
      description: req.body.description,
      tags: req.body.tags || [],
      rate_limits: req.body.rate_limits,
      cost_tracking: req.body.cost_tracking
    };

    // Validate required fields
    if (!pluginData.plugin_name || !pluginData.plugin_type || !pluginData.provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: plugin_name, plugin_type, provider'
      });
    }

    const result = await aiPluginsNode.createPlugin(pluginData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'AI plugin created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating AI plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-plugins
 * Query AI plugins with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    // Parse query parameters
    if (req.query.user_id) criteria.user_id = req.query.user_id;
    if (req.query.plugin_type) criteria.plugin_type = req.query.plugin_type;
    if (req.query.provider) criteria.provider = req.query.provider;
    if (req.query.is_active !== undefined) criteria.is_active = req.query.is_active === 'true';
    if (req.query.plugin_name) criteria.plugin_name = req.query.plugin_name;
    if (req.query.tags) criteria.tags = req.query.tags.split(',');

    if (req.query.limit) options.limit = parseInt(req.query.limit);
    if (req.query.offset) options.offset = parseInt(req.query.offset);

    const plugins = await aiPluginsNode.queryPlugins(criteria, options);

    res.json({
      success: true,
      count: plugins.length,
      data: plugins
    });
  } catch (error) {
    console.error('Error querying AI plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-plugins/stats
 * Get plugin statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id;
    const stats = await aiPluginsNode.getPluginStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting plugin stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-plugins/:nodeCode
 * Get a specific plugin by node code
 */
router.get('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const plugins = await aiPluginsNode.queryPlugins({ node_code: nodeCode });

    if (plugins.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    res.json({
      success: true,
      data: plugins[0]
    });
  } catch (error) {
    console.error('Error getting plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/ai-plugins/:nodeCode
 * Update a plugin
 */
router.put('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = req.body;

    const result = await aiPluginsNode.updatePlugin(nodeCode, updateData);

    res.json({
      success: true,
      message: 'Plugin updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-plugins/:nodeCode/execute
 * Execute a plugin
 */
router.post('/:nodeCode/execute', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const executionData = req.body;

    const result = await aiPluginsNode.executePlugin(nodeCode, executionData);

    res.json({
      success: true,
      message: 'Plugin executed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error executing plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-plugins/:nodeCode/clone
 * Clone a plugin
 */
router.post('/:nodeCode/clone', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { new_user_id, modifications } = req.body;

    if (!new_user_id) {
      return res.status(400).json({
        success: false,
        error: 'new_user_id is required'
      });
    }

    const result = await aiPluginsNode.clonePlugin(nodeCode, new_user_id, modifications || {});

    res.status(201).json({
      success: true,
      message: 'Plugin cloned successfully',
      data: result
    });
  } catch (error) {
    console.error('Error cloning plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ai-plugins/:nodeCode
 * Delete a plugin
 */
router.delete('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const result = await aiPluginsNode.deletePlugin(nodeCode);

    res.json({
      success: true,
      message: 'Plugin deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-plugins/types/list
 * Get available plugin types
 */
router.get('/types/list', async (req, res) => {
  try {
    const pluginTypes = [
      {
        type: 'text_generation',
        name: 'Text Generation',
        description: 'Generate text content using AI models',
        capabilities: ['text-generation', 'completion', 'chat']
      },
      {
        type: 'image_generation',
        name: 'Image Generation',
        description: 'Generate images from text prompts',
        capabilities: ['image-generation', 'dalle', 'stable-diffusion']
      },
      {
        type: 'code_analysis',
        name: 'Code Analysis',
        description: 'Analyze and improve code quality',
        capabilities: ['code-review', 'linting', 'optimization']
      },
      {
        type: 'data_processing',
        name: 'Data Processing',
        description: 'Process and analyze data using AI',
        capabilities: ['data-analysis', 'insights', 'visualization']
      },
      {
        type: 'custom',
        name: 'Custom Plugin',
        description: 'Custom AI functionality',
        capabilities: ['custom-logic', 'webhooks', 'integrations']
      }
    ];

    res.json({
      success: true,
      data: pluginTypes
    });
  } catch (error) {
    console.error('Error getting plugin types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-plugins/providers/list
 * Get available AI providers
 */
router.get('/providers/list', async (req, res) => {
  try {
    const providers = [
      {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-4', 'gpt-3.5-turbo', 'dall-e-3'],
        plugin_types: ['text_generation', 'image_generation']
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet'],
        plugin_types: ['text_generation']
      },
      {
        id: 'google',
        name: 'Google AI',
        models: ['gemini-pro', 'gemini-pro-vision'],
        plugin_types: ['text_generation', 'image_generation']
      },
      {
        id: 'huggingface',
        name: 'Hugging Face',
        models: ['various open-source models'],
        plugin_types: ['text_generation', 'code_analysis', 'data_processing']
      },
      {
        id: 'custom',
        name: 'Custom Provider',
        models: ['custom models'],
        plugin_types: ['custom']
      }
    ];

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-plugins/:nodeCode/test
 * Test a plugin configuration
 */
router.post('/:nodeCode/test', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const testData = req.body;

    // Get plugin
    const plugins = await aiPluginsNode.queryPlugins({ node_code: nodeCode });
    if (plugins.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    const plugin = plugins[0];

    // Perform a test execution with minimal data
    const testExecutionData = {
      prompt: testData.prompt || 'Test prompt',
      test_mode: true
    };

    const result = await aiPluginsNode.executePlugin(nodeCode, testExecutionData);

    res.json({
      success: true,
      message: 'Plugin test completed',
      data: {
        plugin_name: plugin.database_record.plugin_name,
        plugin_type: plugin.database_record.plugin_type,
        test_result: result.success,
        execution_time: result.execution_time,
        cost: result.cost,
        output_preview: result.output ? JSON.stringify(result.output).substring(0, 200) + '...' : null
      }
    });
  } catch (error) {
    console.error('Error testing plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;