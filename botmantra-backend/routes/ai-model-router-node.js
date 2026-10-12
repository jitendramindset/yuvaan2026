/**
 * AI Model Router Node Routes
 * REST API endpoints for AI Model Router Management
 */

const express = require('express');
const { aiModelRouterNode } = require('../core/ai-model-router');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/ai-model-router
 * Create a new AI model router configuration
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      provider,
      api_key,
      fallback_provider,
      models,
      rate_limits,
      cost_tracking,
      is_active,
      metadata,
      node_code
    } = req.body;

    if (!user_id || !provider || !api_key || !fallback_provider) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, provider, api_key, fallback_provider'
      });
    }

    const routerData = {
      user_id,
      provider,
      api_key,
      fallback_provider,
      models: models || {},
      rate_limits: rate_limits || {},
      cost_tracking: cost_tracking || {},
      is_active: is_active !== false,
      metadata: metadata || {}
    };

    const result = await aiModelRouterNode.createModelRouter(routerData, node_code);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating model router:', error);
    res.status(500).json({
      error: 'Failed to create model router',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-model-router
 * Query AI model router configurations with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      user_id,
      provider,
      is_active,
      limit,
      offset
    } = req.query;

    const criteria = {};
    if (user_id) criteria.user_id = user_id;
    if (provider) criteria.provider = provider;
    if (is_active !== undefined) criteria.is_active = is_active === 'true';

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const routers = await aiModelRouterNode.queryModelRouters(criteria, options);

    res.json({
      success: true,
      data: routers,
      count: routers.length
    });
  } catch (error) {
    console.error('Error querying model routers:', error);
    res.status(500).json({
      error: 'Failed to query model routers',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-model-router/:nodeCode
 * Get a specific model router configuration by node code
 */
router.get('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const routers = await aiModelRouterNode.queryModelRouters();
    const router = routers.find(node => node.node_code === nodeCode);

    if (!router) {
      return res.status(404).json({
        error: 'Model router not found'
      });
    }

    res.json({
      success: true,
      data: router
    });
  } catch (error) {
    console.error('Error getting model router:', error);
    res.status(500).json({
      error: 'Failed to get model router',
      details: error.message
    });
  }
});

/**
 * PUT /api/ai-model-router/:nodeCode
 * Update a model router configuration
 */
router.put('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = req.body;

    const result = await aiModelRouterNode.updateModelRouter(nodeCode, updateData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating model router:', error);
    res.status(500).json({
      error: 'Failed to update model router',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-model-router/route
 * Route an AI request to the appropriate model
 */
router.post('/route', async (req, res) => {
  try {
    const { user_id, model, task_type, messages, parameters } = req.body;

    if (!user_id || !model) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, model'
      });
    }

    const request = {
      model,
      task_type: task_type || 'chat',
      messages,
      parameters
    };

    const routingDecision = await aiModelRouterNode.routeRequest(user_id, request);

    res.json({
      success: true,
      data: routingDecision
    });
  } catch (error) {
    console.error('Error routing request:', error);
    res.status(500).json({
      error: 'Failed to route request',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-model-router/fallback
 * Handle routing failure and get fallback configuration
 */
router.post('/fallback', async (req, res) => {
  try {
    const { router_node_code, model, task_type } = req.body;

    if (!router_node_code) {
      return res.status(400).json({
        error: 'Missing required field: router_node_code'
      });
    }

    const request = {
      model,
      task_type: task_type || 'chat'
    };

    const fallbackDecision = await aiModelRouterNode.handleRoutingFailure(router_node_code, request);

    res.json({
      success: true,
      data: fallbackDecision
    });
  } catch (error) {
    console.error('Error handling routing failure:', error);
    res.status(500).json({
      error: 'Failed to handle routing failure',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-model-router/stats/:userId
 * Get router statistics for a user
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await aiModelRouterNode.getRouterStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting router stats:', error);
    res.status(500).json({
      error: 'Failed to get router stats',
      details: error.message
    });
  }
});

/**
 * DELETE /api/ai-model-router/:nodeCode
 * Delete a model router configuration
 */
router.delete('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const success = await aiModelRouterNode.deleteModelRouter(nodeCode);

    res.json({
      success,
      message: 'Model router deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting model router:', error);
    res.status(500).json({
      error: 'Failed to delete model router',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-model-router/providers/available
 * Get list of available AI providers
 */
router.get('/providers/available', async (req, res) => {
  try {
    // This would typically come from a configuration or external service
    const availableProviders = [
      {
        name: 'openai',
        display_name: 'OpenAI',
        models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
        features: ['chat', 'completion', 'embedding']
      },
      {
        name: 'anthropic',
        display_name: 'Anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        features: ['chat', 'completion']
      },
      {
        name: 'google',
        display_name: 'Google AI',
        models: ['gemini-pro', 'gemini-pro-vision'],
        features: ['chat', 'completion', 'vision']
      },
      {
        name: 'mistral',
        display_name: 'Mistral AI',
        models: ['mistral-large', 'mistral-medium', 'mistral-small'],
        features: ['chat', 'completion']
      }
    ];

    res.json({
      success: true,
      data: availableProviders
    });
  } catch (error) {
    console.error('Error getting available providers:', error);
    res.status(500).json({
      error: 'Failed to get available providers',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-model-router/:nodeCode/test
 * Test a model router configuration
 */
router.post('/:nodeCode/test', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { test_message } = req.body;

    // Get the router configuration
    const routers = await aiModelRouterNode.queryModelRouters();
    const router = routers.find(node => node.node_code === nodeCode);

    if (!router) {
      return res.status(404).json({
        error: 'Model router not found'
      });
    }

    // Mock test response (in real implementation, this would make an actual API call)
    const testResult = {
      router_node_code: nodeCode,
      provider: router.metadata.provider,
      status: 'success',
      response_time: Math.random() * 1000 + 500, // Mock response time
      test_message: test_message || 'Hello, this is a test message',
      mock_response: `Mock response from ${router.metadata.provider} for testing purposes`
    };

    // Update router stats
    await aiModelRouterNode.updateModelRouter(nodeCode, {
      last_used: new Date().toISOString()
    });

    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing model router:', error);
    res.status(500).json({
      error: 'Failed to test model router',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-model-router/:nodeCode/clone
 * Clone a model router configuration
 */
router.post('/:nodeCode/clone', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { modifications } = req.body;

    // Get the original router
    const routers = await aiModelRouterNode.queryModelRouters();
    const originalRouter = routers.find(node => node.node_code === nodeCode);

    if (!originalRouter) {
      return res.status(404).json({
        error: 'Original model router not found'
      });
    }

    // Create cloned router data
    const clonedData = {
      user_id: modifications.user_id || originalRouter.metadata.user_id,
      provider: modifications.provider || originalRouter.metadata.provider,
      api_key: modifications.api_key || 'REPLACE_WITH_NEW_API_KEY', // Don't copy API keys
      fallback_provider: modifications.fallback_provider || originalRouter.metadata.fallback_provider,
      models: modifications.models || originalRouter.metadata.models,
      rate_limits: modifications.rate_limits || originalRouter.metadata.rate_limits,
      cost_tracking: modifications.cost_tracking || originalRouter.metadata.cost_tracking,
      is_active: modifications.is_active !== undefined ? modifications.is_active : false, // Clones start inactive
      metadata: {
        ...originalRouter.metadata,
        cloned_from: nodeCode,
        cloned_at: new Date().toISOString(),
        purpose: modifications.purpose || 'backup',
        ...modifications.metadata
      }
    };

    const result = await aiModelRouterNode.createModelRouter(clonedData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Model router cloned successfully. Please update the API key.'
    });
  } catch (error) {
    console.error('Error cloning model router:', error);
    res.status(500).json({
      error: 'Failed to clone model router',
      details: error.message
    });
  }
});

module.exports = router;