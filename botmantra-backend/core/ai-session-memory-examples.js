/**
 * AI Session Memory Node Examples
 * Comprehensive usage examples for node-based AI session memory management
 */

const { aiSessionMemoryNode } = require('../core/ai-session-memory');

// ============================================================
// BASIC SESSION MEMORY OPERATIONS
// ============================================================

/**
 * Example 1: Create a new session memory entry
 */
async function createSessionMemoryExample() {
  try {
    const sessionData = {
      session_id: 'session_12345',
      user_id: 'user_67890',
      context: {
        current_topic: 'React development',
        user_mood: 'focused',
        conversation_stage: 'implementation'
      },
      last_action: 'asked about component lifecycle',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      memory_type: 'conversation',
      importance_score: 0.8,
      access_count: 0,
      last_accessed: new Date().toISOString(),
      memory_status: 'active',
      tags: ['react', 'frontend', 'development'],
      conversation_summary: 'User is learning React component lifecycle methods',
      key_insights: [
        'User prefers practical examples',
        'Interested in best practices',
        'Learning pace is intermediate'
      ],
      user_preferences: {
        response_style: 'detailed',
        code_examples: true,
        follow_up_questions: true
      },
      session_metadata: {
        browser: 'Chrome',
        device_type: 'desktop',
        location: 'US'
      },
      is_active: true
    };

    const result = await aiSessionMemoryNode.createSessionMemory(sessionData, 'session_memory_001');

    console.log('Session memory created:', result);
    return result;
  } catch (error) {
    console.error('Error creating session memory:', error);
  }
}

/**
 * Example 2: Query session memories with filters
 */
async function querySessionMemoriesExample() {
  try {
    // Query active conversation memories for a specific user
    const criteria = {
      user_id: 'user_67890',
      memory_type: 'conversation',
      memory_status: 'active',
      is_active: true,
      exclude_expired: true
    };

    const options = {
      limit: 10,
      offset: 0,
      sort: 'last_accessed',
      order: 'desc'
    };

    const result = await aiSessionMemoryNode.querySessionMemories(criteria, options);

    console.log(`Found ${result.total} session memories:`, result.memories);
    return result;
  } catch (error) {
    console.error('Error querying session memories:', error);
  }
}

/**
 * Example 3: Get session memory by session ID
 */
async function getSessionMemoryByIdExample() {
  try {
    const sessionId = 'session_12345';
    const userId = 'user_67890';

    const memory = await aiSessionMemoryNode.getSessionMemory(sessionId, userId);

    if (memory) {
      console.log('Session memory found:', memory);
    } else {
      console.log('Session memory not found');
    }

    return memory;
  } catch (error) {
    console.error('Error getting session memory:', error);
  }
}

/**
 * Example 4: Update session memory context
 */
async function updateSessionMemoryExample() {
  try {
    const nodeCode = 'session_memory_001';
    const updateData = {
      context: {
        current_topic: 'React hooks',
        user_mood: 'excited',
        conversation_stage: 'advanced'
      },
      last_action: 'learned about useEffect hook',
      importance_score: 0.9,
      access_count: 5,
      last_accessed: new Date().toISOString(),
      conversation_summary: 'User progressed to React hooks, showing good understanding',
      key_insights: [
        'User prefers practical examples',
        'Interested in best practices',
        'Learning pace is intermediate',
        'Ready for advanced concepts'
      ],
      last_modified: new Date().toISOString()
    };

    const result = await aiSessionMemoryNode.updateSessionMemory(nodeCode, updateData);

    console.log('Session memory updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating session memory:', error);
  }
}

// ============================================================
// SESSION MANAGEMENT OPERATIONS
// ============================================================

/**
 * Example 5: Extend session expiration
 */
async function extendSessionExpirationExample() {
  try {
    const sessionId = 'session_12345';
    const userId = 'user_67890';
    const additionalHours = 48; // Extend by 2 days

    const result = await aiSessionMemoryNode.extendSessionExpiration(sessionId, userId, additionalHours);

    console.log('Session expiration extended:', result);
    return result;
  } catch (error) {
    console.error('Error extending session expiration:', error);
  }
}

/**
 * Example 6: Get user session statistics
 */
async function getUserSessionStatsExample() {
  try {
    const userId = 'user_67890';

    const stats = await aiSessionMemoryNode.getUserSessionStats(userId);

    console.log('User session statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting user session stats:', error);
  }
}

/**
 * Example 7: Clean up expired sessions
 */
async function cleanupExpiredSessionsExample() {
  try {
    const userId = 'user_67890';
    const force = false; // Only cleanup truly expired sessions

    const result = await aiSessionMemoryNode.cleanupExpiredSessions(userId, force);

    console.log('Cleanup result:', result);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

/**
 * Example 8: Archive old sessions
 */
async function archiveOldSessionsExample() {
  try {
    const userId = 'user_67890';
    const daysOld = 30; // Archive sessions older than 30 days

    const result = await aiSessionMemoryNode.archiveOldSessions(userId, daysOld);

    console.log('Archive result:', result);
    return result;
  } catch (error) {
    console.error('Error archiving old sessions:', error);
  }
}

// ============================================================
// ADVANCED SESSION OPERATIONS
// ============================================================

/**
 * Example 9: Merge multiple session contexts
 */
async function mergeSessionContextsExample() {
  try {
    const sessionIds = ['session_12345', 'session_67890', 'session_99999'];
    const userId = 'user_67890';
    const targetSessionId = 'session_merged_001';

    const result = await aiSessionMemoryNode.mergeSessionContexts(sessionIds, userId, targetSessionId);

    console.log('Sessions merged:', result);
    return result;
  } catch (error) {
    console.error('Error merging session contexts:', error);
  }
}

/**
 * Example 10: Batch create session memories
 */
async function batchCreateSessionMemoriesExample() {
  try {
    const entries = [
      {
        session_id: 'batch_session_001',
        user_id: 'user_67890',
        context: { topic: 'JavaScript basics' },
        memory_type: 'conversation',
        importance_score: 0.6,
        tags: ['javascript', 'beginner'],
        node_code: 'batch_memory_001'
      },
      {
        session_id: 'batch_session_002',
        user_id: 'user_67890',
        context: { topic: 'React components' },
        memory_type: 'conversation',
        importance_score: 0.7,
        tags: ['react', 'intermediate'],
        node_code: 'batch_memory_002'
      },
      {
        session_id: 'batch_session_003',
        user_id: 'user_67890',
        context: { topic: 'Node.js APIs' },
        memory_type: 'conversation',
        importance_score: 0.8,
        tags: ['nodejs', 'backend'],
        node_code: 'batch_memory_003'
      }
    ];

    const results = [];
    const errors = [];

    for (const entry of entries) {
      try {
        const result = await aiSessionMemoryNode.createSessionMemory(entry, entry.node_code);
        results.push(result);
      } catch (entryError) {
        errors.push({
          entry,
          error: entryError.message
        });
      }
    }

    console.log(`Batch create completed: ${results.length} created, ${errors.length} errors`);
    return { created: results, errors };
  } catch (error) {
    console.error('Error in batch create:', error);
  }
}

// ============================================================
// PRACTICAL USAGE SCENARIOS
// ============================================================

/**
 * Example 11: AI Chatbot Session Management
 */
async function aiChatbotSessionManagementExample() {
  try {
    // Simulate a chatbot conversation session
    const sessionId = 'chat_session_' + Date.now();
    const userId = 'user_67890';

    // Create initial session memory
    const initialMemory = await aiSessionMemoryNode.createSessionMemory({
      session_id: sessionId,
      user_id: userId,
      context: {
        conversation_start: new Date().toISOString(),
        user_intent: 'learning',
        topics_discussed: []
      },
      memory_type: 'conversation',
      importance_score: 0.5,
      tags: ['chatbot', 'learning'],
      user_preferences: {
        response_length: 'medium',
        include_examples: true
      }
    }, `chat_memory_${sessionId}`);

    console.log('Chat session initialized:', initialMemory);

    // Simulate conversation updates
    const updates = [
      {
        context: { topics_discussed: ['javascript'] },
        last_action: 'asked about variables',
        conversation_summary: 'User learning JavaScript basics'
      },
      {
        context: { topics_discussed: ['javascript', 'functions'] },
        last_action: 'asked about function declarations',
        conversation_summary: 'User progressing through JavaScript functions'
      },
      {
        context: { topics_discussed: ['javascript', 'functions', 'objects'] },
        last_action: 'asked about object methods',
        importance_score: 0.8,
        conversation_summary: 'User showing good progress in JavaScript'
      }
    ];

    for (const update of updates) {
      await aiSessionMemoryNode.updateSessionMemory(initialMemory.node_code, {
        ...update,
        last_accessed: new Date().toISOString()
      });
      // Simulate time passing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get final session state
    const finalMemory = await aiSessionMemoryNode.getSessionMemory(sessionId, userId);
    console.log('Final chat session state:', finalMemory);

    return finalMemory;
  } catch (error) {
    console.error('Error in chatbot session management:', error);
  }
}

/**
 * Example 12: Session Analytics and Insights
 */
async function sessionAnalyticsExample() {
  try {
    const userId = 'user_67890';

    // Get user statistics
    const stats = await aiSessionMemoryNode.getUserSessionStats(userId);
    console.log('Session analytics:', stats);

    // Query sessions by topic
    const topicQuery = await aiSessionMemoryNode.querySessionMemories({
      user_id: userId,
      tags: ['react'],
      memory_status: 'active'
    }, { limit: 20 });

    console.log(`Found ${topicQuery.total} React-related sessions`);

    // Find high-importance sessions
    const importantSessions = await aiSessionMemoryNode.querySessionMemories({
      user_id: userId,
      importance_score: { $gte: 0.8 },
      exclude_expired: true
    }, { sort: 'importance_score', order: 'desc' });

    console.log(`Found ${importantSessions.total} high-importance sessions`);

    return {
      stats,
      topicSessions: topicQuery.memories,
      importantSessions: importantSessions.memories
    };
  } catch (error) {
    console.error('Error in session analytics:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  createSessionMemoryExample,
  querySessionMemoriesExample,
  getSessionMemoryByIdExample,
  updateSessionMemoryExample,
  extendSessionExpirationExample,
  getUserSessionStatsExample,
  cleanupExpiredSessionsExample,
  archiveOldSessionsExample,
  mergeSessionContextsExample,
  batchCreateSessionMemoriesExample,
  aiChatbotSessionManagementExample,
  sessionAnalyticsExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running AI Session Memory Examples...\n');

  // Run examples sequentially
  (async () => {
    try {
      console.log('1. Creating session memory...');
      await createSessionMemoryExample();

      console.log('\n2. Querying session memories...');
      await querySessionMemoriesExample();

      console.log('\n3. Getting session memory by ID...');
      await getSessionMemoryByIdExample();

      console.log('\n4. Updating session memory...');
      await updateSessionMemoryExample();

      console.log('\n5. Extending session expiration...');
      await extendSessionExpirationExample();

      console.log('\n6. Getting user session stats...');
      await getUserSessionStatsExample();

      console.log('\n7. AI Chatbot session management...');
      await aiChatbotSessionManagementExample();

      console.log('\n8. Session analytics...');
      await sessionAnalyticsExample();

      console.log('\nAll examples completed successfully!');
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}