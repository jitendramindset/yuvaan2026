/**
 * AI Chat Messages Node Examples
 * Usage examples for AI Chat Messages management
 */

const examples = {
  // Example 1: Create a new chat message
  createMessage: {
    description: "Create a new chat message in a conversation",
    curl: `curl -X POST http://localhost:3001/api/ai-chat-messages-node \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "session_id": "session-123",
    "role": "user",
    "content": "Hello, how can you help me today?",
    "metadata": {
      "timestamp": "2024-01-15T10:30:00Z",
      "user_agent": "web-client"
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-chat-message-1705312200000-abc123def",
        node_type: "ai-chat-messages",
        metadata: {
          session_id: "session-123",
          role: "user",
          content: "Hello, how can you help me today?",
          database_id: 123,
          created_at: "2024-01-15T10:30:00.000Z"
        },
        relationships: [
          {
            target_node_code: "ai-chat-session-session-123",
            relationship_type: "belongs_to_session"
          }
        ]
      }
    }
  },

  // Example 2: Get conversation history
  getConversationHistory: {
    description: "Retrieve all messages in a conversation session",
    curl: `curl -X GET "http://localhost:3001/api/ai-chat-messages-node/conversation/session-123?limit=50" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: [
        {
          node_code: "ai-chat-message-1705312200000-abc123def",
          node_type: "ai-chat-messages",
          metadata: {
            session_id: "session-123",
            role: "user",
            content: "Hello, how can you help me today?",
            database_id: 123,
            created_at: "2024-01-15T10:30:00.000Z"
          }
        },
        {
          node_code: "ai-chat-message-1705312260000-def456ghi",
          node_type: "ai-chat-messages",
          metadata: {
            session_id: "session-123",
            role: "assistant",
            content: "I can help you with various tasks. What would you like to know?",
            database_id: 124,
            created_at: "2024-01-15T10:31:00.000Z"
          }
        }
      ],
      session_id: "session-123"
    }
  },

  // Example 3: Query messages by role
  queryByRole: {
    description: "Get all messages from a specific role (user/assistant/system)",
    curl: `curl -X GET "http://localhost:3001/api/ai-chat-messages-node?role=assistant&session_id=session-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: [
        {
          node_code: "ai-chat-message-1705312260000-def456ghi",
          node_type: "ai-chat-messages",
          metadata: {
            session_id: "session-123",
            role: "assistant",
            content: "I can help you with various tasks. What would you like to know?",
            database_id: 124,
            created_at: "2024-01-15T10:31:00.000Z"
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 50
      }
    }
  },

  // Example 4: Update a message
  updateMessage: {
    description: "Update the content or metadata of an existing message",
    curl: `curl -X PUT http://localhost:3001/api/ai-chat-messages-node/ai-chat-message-1705312200000-abc123def \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "content": "Hello, I need help with my project.",
    "metadata": {
      "edited": true,
      "edit_timestamp": "2024-01-15T10:35:00Z"
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-chat-message-1705312200000-abc123def",
        node_type: "ai-chat-messages",
        metadata: {
          session_id: "session-123",
          role: "user",
          content: "Hello, I need help with my project.",
          database_id: 123,
          created_at: "2024-01-15T10:30:00.000Z",
          updated_at: "2024-01-15T10:35:00.000Z",
          edited: true,
          edit_timestamp: "2024-01-15T10:35:00Z"
        }
      }
    }
  },

  // Example 5: Get message statistics
  getStats: {
    description: "Get statistics about chat messages",
    curl: `curl -X GET "http://localhost:3001/api/ai-chat-messages-node/stats?session_id=session-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      data: {
        total_messages: 15,
        messages_by_role: {
          user: 8,
          assistant: 6,
          system: 1
        },
        messages_by_session: {
          "session-123": 15
        }
      }
    }
  },

  // Example 6: Create system message
  createSystemMessage: {
    description: "Create a system message to set context for the conversation",
    curl: `curl -X POST http://localhost:3001/api/ai-chat-messages-node \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "session_id": "session-123",
    "role": "system",
    "content": "You are a helpful AI assistant specialized in software development.",
    "metadata": {
      "message_type": "context_setting",
      "priority": "high"
    }
  }'`,
    expectedResponse: {
      success: true,
      data: {
        node_code: "ai-chat-message-1705312400000-sys123abc",
        node_type: "ai-chat-messages",
        metadata: {
          session_id: "session-123",
          role: "system",
          content: "You are a helpful AI assistant specialized in software development.",
          database_id: 125,
          created_at: "2024-01-15T10:33:20.000Z",
          message_type: "context_setting",
          priority: "high"
        }
      }
    }
  },

  // Example 7: Delete a message
  deleteMessage: {
    description: "Delete a chat message (soft delete - marks as deleted)",
    curl: `curl -X DELETE http://localhost:3001/api/ai-chat-messages-node/ai-chat-message-1705312200000-abc123def \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    expectedResponse: {
      success: true,
      message: "Chat message deleted successfully"
    }
  }
};

// Export examples for use in other modules
module.exports = {
  aiChatMessagesExamples: examples,

  // Function to display examples
  displayExamples: () => {
    console.log('=== AI Chat Messages Node API Examples ===\n');

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