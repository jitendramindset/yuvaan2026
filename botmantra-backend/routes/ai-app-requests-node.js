/**
 * AI App Requests Node Routes
 * REST API routes for AI app request management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const AIAppRequestsNode = require('../core/ai-app-requests');
const { supabase } = require('../config/supabase');

// Initialize the AI app requests node handler
const aiAppRequestsNode = new AIAppRequestsNode(supabase);

/**
 * POST /api/app-requests
 * Create a new AI app request
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      node_code,
      user_id,
      business_id,
      app_name,
      description,
      status,
      ai_response,
      request_type,
      priority,
      estimated_completion,
      tags,
      attachments
    } = req.body;

    if (!node_code || !app_name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: node_code, app_name, description'
      });
    }

    const requestData = {
      user_id: user_id || req.user?.id,
      business_id: business_id || req.user?.business_id,
      app_name,
      description,
      status: status || 'pending',
      ai_response: ai_response || {},
      request_type: request_type || 'general',
      priority: priority || 'normal',
      estimated_completion,
      tags: tags || [],
      attachments: attachments || []
    };

    const node = await aiAppRequestsNode.createAppRequestNode(node_code, requestData);

    res.status(201).json({
      success: true,
      data: node,
      message: 'AI app request created successfully'
    });
  } catch (error) {
    console.error('Error creating AI app request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/app-requests
 * Query AI app requests with optional filters
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      node_code,
      user_id,
      business_id,
      app_name,
      status,
      request_type,
      priority,
      is_archived,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {};
    if (node_code) filters.node_code = node_code;
    if (user_id) filters.user_id = user_id;
    if (business_id) filters.business_id = business_id;
    if (app_name) filters.app_name = app_name;
    if (status) filters.status = status;
    if (request_type) filters.request_type = request_type;
    if (priority) filters.priority = priority;
    if (is_archived !== undefined) filters.is_archived = is_archived === 'true';

    const nodes = await aiAppRequestsNode.queryAppRequestNodes(filters);

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
    console.error('Error querying AI app requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/app-requests/:nodeCode
 * Get a specific AI app request by node code
 */
router.get('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const nodes = await aiAppRequestsNode.queryAppRequestNodes({ node_code: nodeCode });

    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'AI app request not found'
      });
    }

    res.json({
      success: true,
      data: nodes[0]
    });
  } catch (error) {
    console.error('Error getting AI app request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/app-requests/:nodeCode
 * Update an AI app request
 */
router.put('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updates = {};

    // Map request body to metadata updates
    const updateFields = [
      'app_name', 'description', 'request_type', 'priority',
      'estimated_completion', 'tags', 'attachments'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`metadata.${field}`] = req.body[field];
      }
    });

    // Always update the updated_at timestamp
    updates['metadata.updated_at'] = new Date().toISOString();
    updates.updated_at = new Date().toISOString();

    const node = await aiAppRequestsNode.updateAppRequestNode(nodeCode, updates);

    res.json({
      success: true,
      data: node,
      message: 'AI app request updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI app request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/app-requests/:nodeCode/status
 * Update request status
 */
router.put('/:nodeCode/status', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { status, ai_response, actual_completion, error_message } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const additionalData = {};
    if (ai_response) additionalData.ai_response = ai_response;
    if (actual_completion) additionalData.actual_completion = actual_completion;
    if (error_message) additionalData.error_message = error_message;

    const node = await aiAppRequestsNode.updateRequestStatus(nodeCode, status, additionalData);

    res.json({
      success: true,
      data: node,
      message: `Request status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/app-requests/:nodeCode/feedback
 * Add feedback to a request
 */
router.post('/:nodeCode/feedback', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { rating, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const node = await aiAppRequestsNode.addFeedback(nodeCode, rating, comments);

    res.json({
      success: true,
      data: node,
      message: 'Feedback added successfully'
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/app-requests/:nodeCode
 * Archive an AI app request (soft delete)
 */
router.delete('/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const updates = {
      'metadata.is_archived': true,
      'metadata.archived_at': new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const node = await aiAppRequestsNode.updateAppRequestNode(nodeCode, updates);

    res.json({
      success: true,
      message: 'AI app request archived successfully'
    });
  } catch (error) {
    console.error('Error archiving AI app request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/app-requests/stats/overview
 * Get request statistics
 */
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const { business_id } = req.query;
    const stats = await aiAppRequestsNode.getRequestStatistics(business_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting request statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/app-requests/maintenance/archive-old
 * Archive old completed requests
 */
router.post('/maintenance/archive-old', authenticate, async (req, res) => {
  try {
    const { days_old = 30 } = req.body;

    const archivedCount = await aiAppRequestsNode.archiveOldRequests(days_old);

    res.json({
      success: true,
      message: `Archived ${archivedCount} old requests`
    });
  } catch (error) {
    console.error('Error archiving old requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;