/**
 * AI Generated Templates Node Routes
 * REST API endpoints for AI Generated Templates Management
 */

const express = require('express');
const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Authentication is applied per route

/**
 * POST /api/ai-generated-templates
 * Create a new AI-generated template
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { request_id, template_code, config, metadata, node_code } = req.body;

    if (!request_id || !template_code || !config) {
      return res.status(400).json({
        error: 'Missing required fields: request_id, template_code, config'
      });
    }

    const templateData = {
      request_id,
      template_code,
      config,
      metadata: metadata || {}
    };

    const result = await aiGeneratedTemplatesNode.createGeneratedTemplate(templateData, node_code);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating generated template:', error);
    res.status(500).json({
      error: 'Failed to create generated template',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-generated-templates
 * Query AI-generated templates with optional filters
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { request_id, is_active, limit, offset } = req.query;

    const criteria = {};
    if (request_id) criteria.request_id = request_id;
    if (is_active !== undefined) criteria.is_active = is_active === 'true';

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const templates = await aiGeneratedTemplatesNode.queryGeneratedTemplates(criteria, options);

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error querying generated templates:', error);
    res.status(500).json({
      error: 'Failed to query generated templates',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-generated-templates/:nodeCode
 * Get a specific generated template by node code
 */
router.get('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const templates = await aiGeneratedTemplatesNode.queryGeneratedTemplates();
    const template = templates.find(node => node.node_code === nodeCode);

    if (!template) {
      return res.status(404).json({
        error: 'Generated template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error getting generated template:', error);
    res.status(500).json({
      error: 'Failed to get generated template',
      details: error.message
    });
  }
});

/**
 * PUT /api/ai-generated-templates/:nodeCode
 * Update a generated template
 */
router.put('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = req.body;

    const result = await aiGeneratedTemplatesNode.updateGeneratedTemplate(nodeCode, updateData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating generated template:', error);
    res.status(500).json({
      error: 'Failed to update generated template',
      details: error.message
    });
  }
});

/**
 * PATCH /api/ai-generated-templates/:nodeCode/usage
 * Increment usage count for a template
 */
router.patch('/:nodeCode/usage', async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const result = await aiGeneratedTemplatesNode.incrementUsage(nodeCode);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error incrementing template usage:', error);
    res.status(500).json({
      error: 'Failed to increment template usage',
      details: error.message
    });
  }
});

/**
 * PATCH /api/ai-generated-templates/:nodeCode/rate
 * Rate a template
 */
router.patch('/:nodeCode/rate', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    const result = await aiGeneratedTemplatesNode.rateTemplate(nodeCode, rating, feedback);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error rating template:', error);
    res.status(500).json({
      error: 'Failed to rate template',
      details: error.message
    });
  }
});

/**
 * DELETE /api/ai-generated-templates/:nodeCode
 * Delete a generated template
 */
router.delete('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const success = await aiGeneratedTemplatesNode.deleteGeneratedTemplate(nodeCode);

    res.json({
      success,
      message: 'Generated template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting generated template:', error);
    res.status(500).json({
      error: 'Failed to delete generated template',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-generated-templates/request/:requestId
 * Get templates generated from a specific request
 */
router.get('/request/:requestId', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { limit, offset } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const templates = await aiGeneratedTemplatesNode.getTemplatesByRequest(requestId, options);

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error getting templates by request:', error);
    res.status(500).json({
      error: 'Failed to get templates by request',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-generated-templates/popular
 * Get popular templates by usage count
 */
router.get('/popular', authenticate, async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const templates = await aiGeneratedTemplatesNode.getPopularTemplates(options);

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error getting popular templates:', error);
    res.status(500).json({
      error: 'Failed to get popular templates',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-generated-templates/stats
 * Get template statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { request_id } = req.query;

    const stats = await aiGeneratedTemplatesNode.getTemplateStats(request_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting template stats:', error);
    res.status(500).json({
      error: 'Failed to get template stats',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-generated-templates/:nodeCode/clone
 * Clone a template with modifications
 */
router.post('/:nodeCode/clone', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { modifications, new_request_id } = req.body;

    // Get the original template
    const templates = await aiGeneratedTemplatesNode.queryGeneratedTemplates();
    const originalTemplate = templates.find(node => node.node_code === nodeCode);

    if (!originalTemplate) {
      return res.status(404).json({
        error: 'Original template not found'
      });
    }

    // Create cloned template data
    const clonedData = {
      request_id: new_request_id || originalTemplate.metadata.request_id,
      template_code: modifications?.template_code || originalTemplate.metadata.template_code,
      config: modifications?.config || originalTemplate.metadata.config,
      metadata: {
        ...originalTemplate.metadata,
        cloned_from: nodeCode,
        cloned_at: new Date().toISOString(),
        ...modifications?.metadata
      }
    };

    const result = await aiGeneratedTemplatesNode.createGeneratedTemplate(clonedData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Template cloned successfully'
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({
      error: 'Failed to clone template',
      details: error.message
    });
  }
});

module.exports = router;