/**
 * AI Agent Templates Node Routes
 * REST API routes for AI agent template management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const AIAgentTemplatesNode = require('../core/ai-agent-templates');
const { supabase } = require('../config/supabase');

// Initialize the AI agent templates node handler
const aiAgentTemplatesNode = new AIAgentTemplatesNode(supabase);

/**
 * POST /api/agent-templates
 * Create a new AI agent template
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      node_code,
      name,
      description,
      system_prompt,
      rag_enabled,
      tools,
      model_config,
      temperature,
      max_tokens,
      is_active,
      business_id,
      tags,
      version,
      created_by
    } = req.body;

    if (!node_code || !name || !description || !system_prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: node_code, name, description, system_prompt'
      });
    }

    const templateData = {
      name,
      description,
      system_prompt,
      rag_enabled: rag_enabled || false,
      tools: tools || [],
      model_config: model_config || {},
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      is_active: is_active !== undefined ? is_active : true,
      business_id: business_id || req.user?.business_id,
      tags: tags || [],
      version: version || '1.0.0',
      created_by: created_by || req.user?.id
    };

    const node = await aiAgentTemplatesNode.createAgentTemplateNode(node_code, templateData);

    res.status(201).json({
      success: true,
      data: node,
      message: 'AI agent template created successfully'
    });
  } catch (error) {
    console.error('Error creating AI agent template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-templates
 * Query AI agent templates with optional filters
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      node_code,
      name,
      rag_enabled,
      is_active,
      business_id,
      tags,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {};
    if (node_code) filters.node_code = node_code;
    if (name) filters.name = name;
    if (rag_enabled !== undefined) filters.rag_enabled = rag_enabled === 'true';
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (business_id) filters.business_id = business_id;
    if (tags) filters.tags = tags.split(',');

    const nodes = await aiAgentTemplatesNode.queryAgentTemplateNodes(filters);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNodes = nodes.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedNodes,
      pagination: {
        total: nodes.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(nodes.length / limit)
      }
    });
  } catch (error) {
    console.error('Error querying AI agent templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-templates/:nodeCode
 * Get a specific AI agent template by node code
 */
router.get('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const nodes = await aiAgentTemplatesNode.queryAgentTemplateNodes({ node_code: nodeCode });

    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'AI agent template not found'
      });
    }

    res.json({
      success: true,
      data: nodes[0]
    });
  } catch (error) {
    console.error('Error getting AI agent template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/agent-templates/:nodeCode
 * Update an AI agent template
 */
router.put('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updates = {};

    // Map request body to metadata updates
    const updateFields = [
      'name', 'description', 'system_prompt', 'rag_enabled', 'tools',
      'model_config', 'temperature', 'max_tokens', 'is_active', 'tags', 'version'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`metadata.${field}`] = req.body[field];
      }
    });

    // Always update the updated_at timestamp
    updates['metadata.updated_at'] = new Date().toISOString();
    updates.updated_at = new Date().toISOString();

    const node = await aiAgentTemplatesNode.updateAgentTemplateNode(nodeCode, updates);

    res.json({
      success: true,
      data: node,
      message: 'AI agent template updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI agent template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/agent-templates/:nodeCode
 * Delete an AI agent template (soft delete by setting is_active to false)
 */
router.delete('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const updates = {
      'metadata.is_active': false,
      'metadata.deleted_at': new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const node = await aiAgentTemplatesNode.updateAgentTemplateNode(nodeCode, updates);

    res.json({
      success: true,
      message: 'AI agent template deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating AI agent template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agent-templates/:nodeCode/clone
 * Clone an existing AI agent template
 */
router.post('/:nodeCode/clone', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { new_node_code, modifications = {} } = req.body;

    if (!new_node_code) {
      return res.status(400).json({
        success: false,
        error: 'new_node_code is required for cloning'
      });
    }

    const clonedNode = await aiAgentTemplatesNode.cloneTemplate(nodeCode, {
      node_code: new_node_code,
      ...modifications
    });

    res.status(201).json({
      success: true,
      data: clonedNode,
      message: 'AI agent template cloned successfully'
    });
  } catch (error) {
    console.error('Error cloning AI agent template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agent-templates/:nodeCode/instantiate
 * Instantiate a template into a live agent
 */
router.post('/:nodeCode/instantiate', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { instance_node_code, instance_config = {} } = req.body;

    const instanceData = {
      node_code: instance_node_code,
      instance_config,
      instantiated_by: req.user?.id
    };

    const liveNode = await aiAgentTemplatesNode.instantiateTemplate(nodeCode, instanceData);

    res.status(201).json({
      success: true,
      data: liveNode,
      message: 'AI agent template instantiated successfully'
    });
  } catch (error) {
    console.error('Error instantiating AI agent template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agent-templates/stats/overview
 * Get template statistics
 */
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const stats = await aiAgentTemplatesNode.getTemplateStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting template statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;