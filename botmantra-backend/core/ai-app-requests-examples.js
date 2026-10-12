/**
 * AI App Requests Node Examples
 * Usage examples for the AI app request management system
 */

const AIAppRequestsNode = require('./ai-app-requests');

/**
 * Example: Create a web app development request
 * @param {string} nodeCode - Node code for the request
 * @param {string} appName - Name of the app to develop
 */
async function createWebAppRequest(nodeCode, appName) {
  try {
    const requestData = {
      user_id: 'user_123',
      business_id: 'business_456',
      app_name: appName,
      description: `Develop a comprehensive ${appName} web application with modern UI/UX, responsive design, and full backend integration.`,
      status: 'pending',
      ai_response: {},
      request_type: 'web_development',
      priority: 'high',
      estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      tags: ['web-app', 'frontend', 'backend', 'full-stack'],
      attachments: [
        {
          type: 'document',
          name: 'requirements.pdf',
          url: 'https://example.com/requirements.pdf'
        },
        {
          type: 'image',
          name: 'mockup.png',
          url: 'https://example.com/mockup.png'
        }
      ]
    };

    const node = await AIAppRequestsNode.createAppRequestNode(nodeCode, requestData);
    console.log('Created web app request:', node.id);
    return node;
  } catch (error) {
    console.error('Error creating web app request:', error);
    throw error;
  }
}

/**
 * Example: Create a mobile app request
 * @param {string} nodeCode - Node code for the request
 */
async function createMobileAppRequest(nodeCode) {
  try {
    const requestData = {
      user_id: 'user_789',
      business_id: 'business_101',
      app_name: 'Fitness Tracker Pro',
      description: 'Cross-platform mobile app for fitness tracking with workout plans, progress monitoring, and social features.',
      status: 'processing',
      ai_response: {
        analysis: 'Requirements analyzed. Starting development with React Native.',
        estimated_features: 15,
        tech_stack: ['React Native', 'Firebase', 'SQLite']
      },
      request_type: 'mobile_development',
      priority: 'normal',
      estimated_completion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      tags: ['mobile-app', 'ios', 'android', 'fitness', 'social'],
      attachments: []
    };

    const node = await AIAppRequestsNode.createAppRequestNode(nodeCode, requestData);
    console.log('Created mobile app request:', node.id);
    return node;
  } catch (error) {
    console.error('Error creating mobile app request:', error);
    throw error;
  }
}

/**
 * Example: Query requests by status and business
 * @param {string} status - Request status to filter by
 * @param {string} businessId - Business ID to filter by
 */
async function getRequestsByStatusAndBusiness(status, businessId) {
  try {
    const nodes = await AIAppRequestsNode.queryAppRequestNodes({
      status: status,
      business_id: businessId,
      is_archived: false
    });
    console.log(`Found ${nodes.length} ${status} requests for business ${businessId}`);
    return nodes;
  } catch (error) {
    console.error('Error querying requests by status and business:', error);
    throw error;
  }
}

/**
 * Example: Update request status with AI response
 * @param {string} nodeCode - Node code to update
 * @param {string} newStatus - New status
 * @param {Object} aiResponse - AI processing response
 */
async function updateRequestWithAIResponse(nodeCode, newStatus, aiResponse) {
  try {
    const node = await AIAppRequestsNode.updateRequestStatus(nodeCode, newStatus, {
      ai_response: aiResponse,
      actual_completion: newStatus === 'completed' ? new Date().toISOString() : undefined
    });

    console.log(`Updated request ${nodeCode} status to ${newStatus}`);
    return node;
  } catch (error) {
    console.error('Error updating request with AI response:', error);
    throw error;
  }
}

/**
 * Example: Add user feedback to completed request
 * @param {string} nodeCode - Node code to add feedback to
 * @param {number} rating - User rating (1-5)
 * @param {string} comments - User comments
 */
async function addUserFeedback(nodeCode, rating, comments) {
  try {
    const node = await AIAppRequestsNode.addFeedback(nodeCode, rating, comments);
    console.log(`Added ${rating}-star feedback to request ${nodeCode}`);
    return node;
  } catch (error) {
    console.error('Error adding user feedback:', error);
    throw error;
  }
}

/**
 * Example: Get comprehensive request statistics
 */
async function getRequestStats() {
  try {
    const stats = await AIAppRequestsNode.getRequestStatistics();
    console.log('Request statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting request stats:', error);
    throw error;
  }
}

/**
 * Example: Create a batch of sample requests for testing
 */
async function createSampleRequests() {
  const sampleRequests = [
    {
      nodeCode: 'request_web_ecommerce',
      appName: 'E-Commerce Platform',
      type: 'web_development',
      priority: 'high',
      description: 'Full-featured e-commerce platform with payment integration'
    },
    {
      nodeCode: 'request_mobile_social',
      appName: 'Social Media App',
      type: 'mobile_development',
      priority: 'normal',
      description: 'Social networking app with real-time messaging'
    },
    {
      nodeCode: 'request_api_integration',
      appName: 'API Integration Service',
      type: 'api_development',
      priority: 'low',
      description: 'RESTful API service for third-party integrations'
    },
    {
      nodeCode: 'request_data_dashboard',
      appName: 'Analytics Dashboard',
      type: 'data_visualization',
      priority: 'high',
      description: 'Real-time data visualization and analytics dashboard'
    }
  ];

  const createdRequests = [];

  for (const request of sampleRequests) {
    try {
      const node = await createWebAppRequest(request.nodeCode, request.appName);

      // Update with specific type and priority
      await AIAppRequestsNode.updateAppRequestNode(request.nodeCode, {
        'metadata.request_type': request.type,
        'metadata.priority': request.priority,
        'metadata.description': request.description
      });

      createdRequests.push({ ...request, node_id: node.id });
    } catch (error) {
      console.error(`Failed to create sample request ${request.appName}:`, error);
    }
  }

  console.log(`Created ${createdRequests.length} sample AI app requests`);
  return createdRequests;
}

/**
 * Example: Simulate complete request lifecycle
 * @param {string} baseNodeCode - Base node code for the simulation
 */
async function simulateRequestLifecycle(baseNodeCode) {
  try {
    console.log('=== Starting Request Lifecycle Simulation ===');

    // 1. Create initial request
    const initialRequest = await createWebAppRequest(baseNodeCode, 'Lifecycle Test App');
    console.log('✓ Created initial request');

    // 2. Update to processing status
    await updateRequestWithAIResponse(baseNodeCode, 'processing', {
      analysis: 'Requirements reviewed. Starting development phase.',
      assigned_developer: 'AI_Dev_001',
      estimated_features: 8
    });
    console.log('✓ Updated to processing status');

    // 3. Simulate completion
    await updateRequestWithAIResponse(baseNodeCode, 'completed', {
      final_result: 'App developed successfully with all requested features.',
      deployment_url: 'https://lifecycle-test-app.com',
      documentation_url: 'https://docs.lifecycle-test-app.com',
      total_features: 8,
      completion_time: '5 days'
    });
    console.log('✓ Marked as completed');

    // 4. Add user feedback
    await addUserFeedback(baseNodeCode, 5, 'Excellent work! The app exceeds expectations.');
    console.log('✓ Added user feedback');

    // 5. Get final request data
    const finalRequests = await AIAppRequestsNode.queryAppRequestNodes({ node_code: baseNodeCode });
    const finalRequest = finalRequests[0];

    console.log('✓ Request lifecycle completed');

    return {
      initial_request: initialRequest,
      final_request: finalRequest,
      lifecycle_complete: true
    };
  } catch (error) {
    console.error('Error in request lifecycle simulation:', error);
    throw error;
  }
}

/**
 * Example: Process pending requests (batch operation)
 */
async function processPendingRequests() {
  try {
    console.log('=== Processing Pending Requests ===');

    const pendingRequests = await AIAppRequestsNode.queryAppRequestNodes({
      status: 'pending',
      is_archived: false
    });

    console.log(`Found ${pendingRequests.length} pending requests`);

    const processedResults = [];

    for (const request of pendingRequests) {
      try {
        // Simulate AI processing
        const aiResponse = {
          processing_started: new Date().toISOString(),
          estimated_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status_update: 'AI analysis in progress'
        };

        await updateRequestWithAIResponse(request.node_code, 'processing', aiResponse);
        processedResults.push({ node_code: request.node_code, success: true });
      } catch (error) {
        console.error(`Failed to process request ${request.node_code}:`, error);
        processedResults.push({ node_code: request.node_code, success: false, error: error.message });
      }
    }

    console.log(`Processed ${processedResults.filter(r => r.success).length} requests successfully`);
    return processedResults;
  } catch (error) {
    console.error('Error processing pending requests:', error);
    throw error;
  }
}

// Export example functions for testing
module.exports = {
  createWebAppRequest,
  createMobileAppRequest,
  getRequestsByStatusAndBusiness,
  updateRequestWithAIResponse,
  addUserFeedback,
  getRequestStats,
  createSampleRequests,
  simulateRequestLifecycle,
  processPendingRequests
};

// Example usage (uncomment to test):
/*
async function runExamples() {
  // Create sample requests
  await createSampleRequests();

  // Run lifecycle simulation
  const lifecycleResult = await simulateRequestLifecycle('lifecycle_test_' + Date.now());

  console.log('Lifecycle simulation result:', lifecycleResult);

  // Process pending requests
  await processPendingRequests();

  // Get final statistics
  await getRequestStats();
}

runExamples().catch(console.error);
*/