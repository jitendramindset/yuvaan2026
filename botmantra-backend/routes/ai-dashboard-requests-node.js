/**
 * AI Dashboard Requests Node Routes
 * REST API endpoints for AI Dashboard Requests management
 */

const express = require('express');
const router = express.Router();
const { aiDashboardRequestsNode } = require('../core/ai-dashboard-requests');
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all dashboard request nodes
// ============================================================
router.get('/ai-dashboard-requests-node', authenticate, async (req, res) => {
  try {
    const { business_id, user_id, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const criteria = {};
    if (business_id) criteria.business_id = business_id;
    if (user_id) criteria.user_id = user_id;
    if (status) criteria.status = status;

    const requests = await aiDashboardRequestsNode.queryDashboardRequests(criteria, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('AI Dashboard Requests GET ALL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY NODE CODE - Get single dashboard request node
// ============================================================
router.get('/ai-dashboard-requests-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // Query the node
    const requests = await aiDashboardRequestsNode.queryDashboardRequests();
    const request = requests.find(node => node.node_code === nodeCode);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard request node not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('AI Dashboard Requests GET BY NODE CODE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CREATE - Create new dashboard request node
// ============================================================
router.post('/ai-dashboard-requests-node', authenticate, async (req, res) => {
  try {
    const { business_id, user_id, prompt, status, metadata, node_code } = req.body;

    // Validate required fields
    if (!business_id || !user_id || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: business_id, user_id, prompt'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const requestData = {
      business_id,
      user_id,
      prompt,
      status: status || 'pending',
      metadata: metadata || {}
    };

    const result = await aiDashboardRequestsNode.createDashboardRequest(requestData, node_code);

    res.status(201).json({
      success: true,
      data: result.node,
      database_record: result.database_record
    });
  } catch (error) {
    console.error('AI Dashboard Requests CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update existing dashboard request node
// ============================================================
router.put('/ai-dashboard-requests-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { prompt, status, processing_time, ai_response, metadata } = req.body;

    // Validate at least one field to update
    if (prompt === undefined && status === undefined && processing_time === undefined &&
        ai_response === undefined && metadata === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update: prompt, status, processing_time, ai_response, metadata'
      });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateData = {};
    if (prompt !== undefined) updateData.prompt = prompt;
    if (status !== undefined) updateData.status = status;
    if (processing_time !== undefined) updateData.processing_time = processing_time;
    if (ai_response !== undefined) updateData.ai_response = ai_response;
    if (metadata !== undefined) updateData.metadata = metadata;

    const result = await aiDashboardRequestsNode.updateDashboardRequest(nodeCode, updateData);

    res.json({
      success: true,
      data: result.node,
      database_record: result.database_record
    });
  } catch (error) {
    console.error('AI Dashboard Requests UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE STATUS - Update request status
// ============================================================
router.patch('/ai-dashboard-requests-node/:nodeCode/status', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { status, ai_response, processing_time } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid or missing status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const additionalData = {};
    if (ai_response !== undefined) additionalData.ai_response = ai_response;
    if (processing_time !== undefined) additionalData.processing_time = processing_time;

    const result = await aiDashboardRequestsNode.updateRequestStatus(nodeCode, status, additionalData);

    res.json({
      success: true,
      data: result.node,
      message: `Request status updated to ${status}`
    });
  } catch (error) {
    console.error('AI Dashboard Requests UPDATE STATUS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete dashboard request node
// ============================================================
router.delete('/ai-dashboard-requests-node/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const success = await aiDashboardRequestsNode.deleteDashboardRequest(nodeCode);

    res.json({
      success: true,
      message: 'Dashboard request deleted successfully'
    });
  } catch (error) {
    console.error('AI Dashboard Requests DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET USER REQUESTS - Get requests for a specific user
// ============================================================
router.get('/ai-dashboard-requests-node/user/:userId/:businessId', authenticate, async (req, res) => {
  try {
    const { userId, businessId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const requests = await aiDashboardRequestsNode.getUserRequests(userId, businessId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: requests,
      user_id: userId,
      business_id: businessId
    });
  } catch (error) {
    console.error('AI Dashboard Requests GET USER REQUESTS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATS - Get dashboard requests statistics
// ============================================================
router.get('/ai-dashboard-requests-node/stats', authenticate, async (req, res) => {
  try {
    const { business_id } = req.query;

    const stats = await aiDashboardRequestsNode.getRequestStats(business_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI Dashboard Requests STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// PROCESS REQUEST - AI processing endpoint (mock for now)
// ============================================================
router.post('/ai-dashboard-requests-node/:nodeCode/process', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { ai_model = 'gpt-4', parameters = {} } = req.body;

    // First update status to processing
    await aiDashboardRequestsNode.updateRequestStatus(nodeCode, 'processing');

    // Get the request node
    const requests = await aiDashboardRequestsNode.queryDashboardRequests();
    const request = requests.find(node => node.node_code === nodeCode);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard request not found'
      });
    }

    // Mock AI processing (in real implementation, this would call an AI service)
    const mockResponse = {
      dashboard_config: {
        title: `AI Generated Dashboard - ${request.metadata.prompt.substring(0, 30)}...`,
        widgets: [
          {
            type: 'chart',
            title: 'Sample Chart',
            data: { /* mock data */ }
          }
        ]
      },
      processing_details: {
        ai_model,
        parameters,
        processing_time: Math.floor(Math.random() * 5000) + 1000 // 1-6 seconds
      }
    };

    // Update with AI response and mark as completed
    const result = await aiDashboardRequestsNode.updateRequestStatus(nodeCode, 'completed', {
      ai_response: mockResponse
    });

    res.json({
      success: true,
      data: result.node,
      message: 'Dashboard request processed successfully',
      ai_response: mockResponse
    });
  } catch (error) {
    console.error('AI Dashboard Requests PROCESS error:', error);

    // Mark as failed
    try {
      await aiDashboardRequestsNode.updateRequestStatus(nodeCode, 'failed', {
        ai_response: { error: error.message }
      });
    } catch (updateError) {
      console.error('Failed to update request status to failed:', updateError);
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;