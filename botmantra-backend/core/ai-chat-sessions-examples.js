/**
 * AI Chat Sessions Node Examples
 * Usage examples for AI Chat Sessions management
 */

const examples = {
  // Example 1: Create a new chat session
  createSession: {
    description: "Create a new chat session for a user",
    curl: `curl -X POST http://localhost:3001/api/chat-sessions-node \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "business_id": "business-123",
    "user_id": "user-456",
    "session_name": "Customer Support Chat",
    "last_active": "2024-01-15T10:30:00Z",
    "metadata": {
      "chat_type": "support",
      "priority": "high",
      "tags": ["urgent", "technical"]
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-chat-session-1705312200000-abc123def",
        node_type: "ai-chat-sessions",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          session_name: "Customer Support Chat",
          last_active: "2024-01-15T10:30:00Z",
          database_id: 123,
          created_at: "2024-01-15T10:30:00.000Z",
          message_count: 0
        },
        relationships: [
          {
            target_node_code: "user-user-456",
            relationship_type: "owned_by_user"
          },
          {
            target_node_code: "business-business-123",
            relationship_type: "belongs_to_business"
          }
        ]
      }
    }
  },

  // Example 2: Get user sessions
  getUserSessions: {
    description: "Retrieve all chat sessions for a specific user in a business",
    curl: `curl -X GET "http://localhost:3001/api/chat-sessions-node/user/user-456/business-123?limit=10" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: [
        {
          node_code: "ai-chat-session-1705312200000-abc123def",
          node_type: "ai-chat-sessions",
          metadata: {
            business_id: "business-123",
            user_id: "user-456",
            session_name: "Customer Support Chat",
            last_active: "2024-01-15T10:45:00Z",
            database_id: 123,
            created_at: "2024-01-15T10:30:00.000Z",
            message_count: 5
          }
        },
        {
          node_code: "ai-chat-session-1705300000000-def456ghi",
          node_type: "ai-chat-sessions",
          metadata: {
            business_id: "business-123",
            user_id: "user-456",
            session_name: "Product Inquiry",
            last_active: "2024-01-14T15:20:00Z",
            database_id: 122,
            created_at: "2024-01-14T14:00:00.000Z",
            message_count: 12
          }
        }
      ],
      user_id: "user-456",
      business_id: "business-123"
    }
  },

  // Example 3: Query sessions by criteria
  querySessions: {
    description: "Query chat sessions with filters",
    curl: `curl -X GET "http://localhost:3001/api/chat-sessions-node?business_id=business-123&session_name=support" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: [
        {
          node_code: "ai-chat-session-1705312200000-abc123def",
          node_type: "ai-chat-sessions",
          metadata: {
            business_id: "business-123",
            user_id: "user-456",
            session_name: "Customer Support Chat",
            last_active: "2024-01-15T10:45:00Z",
            database_id: 123,
            created_at: "2024-01-15T10:30:00.000Z",
            message_count: 5
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 50
      }
    }
  },

  // Example 4: Update session name
  updateSession: {
    description: "Update a chat session's name and metadata",
    curl: `curl -X PUT http://localhost:3001/api/chat-sessions-node/ai-chat-session-1705312200000-abc123def \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "session_name": "Technical Support - Database Issue",
    "metadata": {
      "chat_type": "support",
      "priority": "critical",
      "tags": ["urgent", "technical", "database"],
      "assigned_agent": "agent-789"
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-chat-session-1705312200000-abc123def",
        node_type: "ai-chat-sessions",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          session_name: "Technical Support - Database Issue",
          last_active: "2024-01-15T10:45:00Z",
          database_id: 123,
          created_at: "2024-01-15T10:30:00.000Z",
          message_count: 5,
          updated_at: "2024-01-15T11:00:00.000Z",
          chat_type: "support",
          priority: "critical",
          tags: ["urgent", "technical", "database"],
          assigned_agent: "agent-789"
        }
      }
    }
  },

  // Example 5: Update last active time
  updateLastActive: {
    description: "Update the session's last active timestamp (typically called when user sends a message)",
    curl: `curl -X PATCH http://localhost:3001/api/chat-sessions-node/ai-chat-session-1705312200000-abc123def/active \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-chat-session-1705312200000-abc123def",
        node_type: "ai-chat-sessions",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          session_name: "Technical Support - Database Issue",
          last_active: "2024-01-15T11:15:00.000Z",
          database_id: 123,
          created_at: "2024-01-15T10:30:00.000Z",
          message_count: 5
        }
      },
      message: "Session last active time updated"
    }
  },

  // Example 6: Get session statistics
  getStats: {
    description: "Get statistics about chat sessions",
    curl: `curl -X GET "http://localhost:3001/api/chat-sessions-node/stats?business_id=business-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: {
        total_sessions: 25,
        active_sessions_24h: 8,
        active_sessions_7d: 15,
        sessions_by_business: {
          "business-123": 25
        },
        sessions_by_user: {
          "user-456": 5,
          "user-789": 3,
          "user-101": 7
        }
      }
    }
  },

  // Example 7: Delete a session
  deleteSession: {
    description: "Delete a chat session (soft delete - marks as deleted)",
    curl: `curl -X DELETE http://localhost:3001/api/chat-sessions-node/ai-chat-session-1705312200000-abc123def \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      message: "Chat session deleted successfully"
    }
  },

  // Example 8: Create session with AI context
  createAISession: {
    description: "Create a session for AI-powered conversations with specific context",
    curl: `curl -X POST http://localhost:3001/api/chat-sessions-node \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "business_id": "business-123",
    "user_id": "user-456",
    "session_name": "AI Assistant - Code Review",
    "last_active": "2024-01-15T12:00:00Z",
    "metadata": {
      "chat_type": "ai_assistant",
      "ai_model": "gpt-4",
      "context": "code_review",
      "language": "javascript",
      "difficulty": "intermediate",
      "tags": ["coding", "review", "javascript"]
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-chat-session-1705320000000-ai123code",
        node_type: "ai-chat-sessions",
        metadata: {
          business_id: "business-123",
          user_id: "user-456",
          session_name: "AI Assistant - Code Review",
          last_active: "2024-01-15T12:00:00Z",
          database_id: 124,
          created_at: "2024-01-15T12:00:00.000Z",
          message_count: 0,
          chat_type: "ai_assistant",
          ai_model: "gpt-4",
          context: "code_review",
          language: "javascript",
          difficulty: "intermediate",
          tags: ["coding", "review", "javascript"]
        }
      }
    }
  }
};

// Export examples for use in other modules
module.exports = {
  aiChatSessionsExamples: examples,

  // Function to display examples
  displayExamples: () => {
    console.log('=== AI Chat Sessions Node API Examples ===\n');

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