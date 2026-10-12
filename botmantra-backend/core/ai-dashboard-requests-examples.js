/**
 * AI Dashboard Requests Node Examples
 * Usage examples for AI Dashboard Requests management
 */

const examples = {
  // Example 1: Create a new dashboard request
  createRequest: {
    description: "Create a new AI dashboard request for generating or modifying dashboards",
    curl: `curl -X POST http://localhost:3001/api/dashboard-requests-node \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "business_id": "business-123",
    "user_id": "user-456",
    "prompt": "Create a sales dashboard with revenue charts, customer metrics, and performance indicators",
    "status": "pending",
    "metadata": {
      "request_type": "create_dashboard",
      "priority": "high",
      "dashboard_type": "sales",
      "widgets_needed": ["revenue_chart", "customer_metrics", "performance_kpi"]
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-dashboard-request-1705312200000-abc123def",
        node_type: "ai-dashboard-requests",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          prompt: "Create a sales dashboard with revenue charts, customer metrics, and performance indicators",
          status: "pending",
          database_id: 123,
          created_at: "2024-01-15T10:30:00.000Z",
          processing_time: null,
          ai_response: null,
          request_type: "create_dashboard",
          priority: "high",
          dashboard_type: "sales",
          widgets_needed: ["revenue_chart", "customer_metrics", "performance_kpi"]
        },
        relationships: [
          {
            target_node_code: "user-user-456",
            relationship_type: "requested_by_user"
          },
          {
            target_node_code: "business-business-123",
            relationship_type: "belongs_to_business"
          }
        ]
      }
    }
  },

  // Example 2: Get user dashboard requests
  getUserRequests: {
    description: "Retrieve all dashboard requests for a specific user in a business",
    curl: `curl -X GET "http://localhost:3001/api/dashboard-requests-node/user/user-456/business-123?limit=10" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: [
        {
          node_code: "ai-dashboard-request-1705312200000-abc123def",
          node_type: "ai-dashboard-requests",
          metadata: {
            business_id: "business-123",
            user_id: "user-456",
            prompt: "Create a sales dashboard...",
            status: "completed",
            database_id: 123,
            created_at: "2024-01-15T10:30:00.000Z",
            processing_time: 3500,
            ai_response: { /* AI generated dashboard config */ }
          }
        },
        {
          node_code: "ai-dashboard-request-1705300000000-def456ghi",
          node_type: "ai-dashboard-requests",
          metadata: {
            business_id: "business-123",
            user_id: "user-456",
            prompt: "Modify existing dashboard with new KPIs",
            status: "processing",
            database_id: 122,
            created_at: "2024-01-14T14:00:00.000Z",
            processing_time: null
          }
        }
      ],
      user_id: "user-456",
      business_id: "business-123"
    }
  },

  // Example 3: Query requests by status
  queryByStatus: {
    description: "Get all dashboard requests with a specific status",
    curl: `curl -X GET "http://localhost:3001/api/dashboard-requests-node?status=completed&business_id=business-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: [
        {
          node_code: "ai-dashboard-request-1705312200000-abc123def",
          node_type: "ai-dashboard-requests",
          metadata: {
            business_id: "business-123",
            user_id: "user-456",
            prompt: "Create a sales dashboard...",
            status: "completed",
            database_id: 123,
            processing_time: 3500,
            ai_response: {
              dashboard_config: {
                title: "Sales Dashboard",
                widgets: [/* widget configurations */]
              }
            }
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 50
      }
    }
  },

  // Example 4: Update request status
  updateStatus: {
    description: "Update the status of a dashboard request",
    curl: `curl -X PATCH http://localhost:3001/api/dashboard-requests-node/ai-dashboard-request-1705312200000-abc123def/status \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "status": "processing"
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-dashboard-request-1705312200000-abc123def",
        node_type: "ai-dashboard-requests",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          prompt: "Create a sales dashboard...",
          status: "processing",
          database_id: 123,
          updated_at: "2024-01-15T11:00:00.000Z"
        }
      },
      message: "Request status updated to processing"
    }
  },

  // Example 5: Process request with AI
  processRequest: {
    description: "Process a dashboard request using AI (generates dashboard configuration)",
    curl: `curl -X POST http://localhost:3001/api/dashboard-requests-node/ai-dashboard-request-1705312200000-abc123def/process \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "ai_model": "gpt-4",
    "parameters": {
      "creativity": 0.7,
      "detail_level": "high",
      "include_sample_data": true
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-dashboard-request-1705312200000-abc123def",
        node_type: "ai-dashboard-requests",
        metadata: {
          status: "completed",
          processing_time: 3200,
          ai_response: {
            dashboard_config: {
              title: "AI Generated Dashboard - Create a sales dash...",
              widgets: [
                {
                  type: "chart",
                  title: "Sample Chart",
                  data: { /* mock data */ }
                }
              ]
            },
            processing_details: {
              ai_model: "gpt-4",
              parameters: {
                creativity: 0.7,
                detail_level: "high",
                include_sample_data: true
              },
              processing_time: 3200
            }
          }
        }
      },
      message: "Dashboard request processed successfully",
      ai_response: {
        dashboard_config: {
          title: "AI Generated Dashboard - Create a sales dash...",
          widgets: [/* widget configurations */]
        },
        processing_details: {
          ai_model: "gpt-4",
          parameters: { /* processing parameters */ },
          processing_time: 3200
        }
      }
    }
  },

  // Example 6: Update request with AI response
  updateWithResponse: {
    description: "Update a completed request with the AI-generated dashboard configuration",
    curl: `curl -X PUT http://localhost:3001/api/dashboard-requests-node/ai-dashboard-request-1705312200000-abc123def \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "status": "completed",
    "ai_response": {
      "dashboard_config": {
        "title": "Sales Performance Dashboard",
        "layout": "grid",
        "widgets": [
          {
            "id": "revenue-chart",
            "type": "line_chart",
            "title": "Monthly Revenue",
            "data_source": "sales_table",
            "config": {
              "x_axis": "month",
              "y_axis": "revenue",
              "color": "#2563eb"
            }
          },
          {
            "id": "customer-metrics",
            "type": "bar_chart",
            "title": "Customer Acquisition",
            "data_source": "customers_table",
            "config": {
              "x_axis": "month",
              "y_axis": "new_customers"
            }
          }
        ]
      },
      "metadata": {
        "ai_model": "gpt-4",
        "processing_time": 4500,
        "confidence_score": 0.92
      }
    },
    "processing_time": 4500
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-dashboard-request-1705312200000-abc123def",
        node_type: "ai-dashboard-requests",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          prompt: "Create a sales dashboard...",
          status: "completed",
          processing_time: 4500,
          ai_response: {
            dashboard_config: {
              title: "Sales Performance Dashboard",
              layout: "grid",
              widgets: [/* detailed widget configs */]
            },
            metadata: {
              ai_model: "gpt-4",
              processing_time: 4500,
              confidence_score: 0.92
            }
          },
          updated_at: "2024-01-15T11:15:00.000Z"
        }
      }
    }
  },

  // Example 7: Get request statistics
  getStats: {
    description: "Get statistics about dashboard requests",
    curl: `curl -X GET "http://localhost:3001/api/dashboard-requests-node/stats?business_id=business-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: {
        total_requests: 25,
        completed_requests: 18,
        avg_processing_time: 3200,
        requests_by_status: {
          pending: 3,
          processing: 4,
          completed: 18,
          failed: 0,
          cancelled: 0
        },
        requests_by_business: {
          "business-123": 25
        },
        requests_by_user: {
          "user-456": 15,
          "user-789": 8,
          "user-101": 2
        }
      }
    }
  },

  // Example 8: Delete a request
  deleteRequest: {
    description: "Delete a dashboard request (soft delete)",
    curl: `curl -X DELETE http://localhost:3001/api/dashboard-requests-node/ai-dashboard-request-1705312200000-abc123def \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      message: "Dashboard request deleted successfully"
    }
  },

  // Example 9: Create request for dashboard modification
  createModificationRequest: {
    description: "Create a request to modify an existing dashboard",
    curl: `curl -X POST http://localhost:3001/api/dashboard-requests-node \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "business_id": "business-123",
    "user_id": "user-456",
    "prompt": "Add a new KPI widget showing customer satisfaction scores and update the revenue chart colors",
    "status": "pending",
    "metadata": {
      "request_type": "modify_dashboard",
      "existing_dashboard_id": "dashboard-789",
      "changes": ["add_kpi_widget", "update_chart_colors"],
      "priority": "medium"
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-dashboard-request-1705320000000-mod123abc",
        node_type: "ai-dashboard-requests",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          prompt: "Add a new KPI widget showing customer satisfaction scores...",
          status: "pending",
          database_id: 124,
          created_at: "2024-01-15T12:00:00.000Z",
          request_type: "modify_dashboard",
          existing_dashboard_id: "dashboard-789",
          changes: ["add_kpi_widget", "update_chart_colors"],
          priority: "medium"
        }
      }
    }
  }
};

// Export examples for use in other modules
module.exports = {
  aiDashboardRequestsExamples: examples,

  // Function to display examples
  displayExamples: () => {
    console.log('=== AI Dashboard Requests Node API Examples ===\n');

    Object.entries(examples).forEach(([key, example]) => {
      console.log(`${key.toUpperCase()}: ${example.description}`);
      console.log('CURL Command:');
      console.log(example.curl);
      console.log('\nExpected Response:');
      console.log(JSON.stringify(example.expectedResponse, null, 2));
      console.log('\n' + '='.repeat(50) + '\n');
    });
  }
};

// If run directly, display examples
if (require.main === module) {
  module.exports.displayExamples();
}