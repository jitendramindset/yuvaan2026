/**
 * AI Voice Logs Node Examples
 * Comprehensive usage examples for node-based AI voice interaction logging
 */

const { aiVoiceLogsNode } = require('../core/ai-voice-logs');

// ============================================================
// BASIC VOICE LOG OPERATIONS
// ============================================================

/**
 * Example 1: Create a new voice log entry
 */
async function createVoiceLogExample() {
  try {
    const voiceData = {
      business_id: 'business_12345',
      user_id: 'user_67890',
      audio_url: 'https://storage.example.com/audio/session_123.wav',
      transcript: 'Hello, I would like to know the current weather in New York',
      detected_intent: 'weather_query',
      confidence_score: 0.92,
      processing_duration: 1250, // milliseconds
      audio_duration: 3200, // milliseconds
      language: 'en',
      voice_provider: 'google_speech',
      sentiment: 'neutral',
      keywords: ['weather', 'New York', 'current'],
      entities: [
        { type: 'location', value: 'New York', confidence: 0.98 },
        { type: 'intent', value: 'weather_query', confidence: 0.92 }
      ],
      metadata: {
        device_type: 'mobile',
        app_version: '2.1.0',
        session_id: 'session_123'
      },
      tags: ['voice', 'query', 'weather'],
      is_active: true
    };

    const result = await aiVoiceLogsNode.createVoiceLog(voiceData, 'voice_log_001');

    console.log('Voice log created:', result);
    return result;
  } catch (error) {
    console.error('Error creating voice log:', error);
  }
}

/**
 * Example 2: Query voice logs with filters
 */
async function queryVoiceLogsExample() {
  try {
    // Query recent voice interactions for a user
    const criteria = {
      user_id: 'user_67890',
      language: 'en',
      confidence_score: { $gte: 0.8 },
      created_at: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
      }
    };

    const options = {
      limit: 20,
      offset: 0,
      sort: 'created_at',
      order: 'desc'
    };

    const result = await aiVoiceLogsNode.queryVoiceLogs(criteria, options);

    console.log(`Found ${result.total} voice logs:`, result.logs);
    return result;
  } catch (error) {
    console.error('Error querying voice logs:', error);
  }
}

/**
 * Example 3: Get voice log by ID
 */
async function getVoiceLogByIdExample() {
  try {
    const nodeCode = 'voice_log_001';
    const userId = 'user_67890';

    const result = await aiVoiceLogsNode.getVoiceLog(nodeCode, userId);

    if (result) {
      console.log('Voice log found:', result);
    } else {
      console.log('Voice log not found');
    }

    return result;
  } catch (error) {
    console.error('Error getting voice log:', error);
  }
}

/**
 * Example 4: Update voice log with additional analysis
 */
async function updateVoiceLogExample() {
  try {
    const nodeCode = 'voice_log_001';
    const updateData = {
      confidence_score: 0.95,
      processing_duration: 1100,
      sentiment: 'positive',
      keywords: ['weather', 'New York', 'current', 'sunny'],
      entities: [
        { type: 'location', value: 'New York', confidence: 0.98 },
        { type: 'intent', value: 'weather_query', confidence: 0.95 },
        { type: 'weather_type', value: 'sunny', confidence: 0.87 }
      ],
      metadata: {
        device_type: 'mobile',
        app_version: '2.1.0',
        session_id: 'session_123',
        follow_up_processed: true
      },
      last_modified: new Date().toISOString()
    };

    const result = await aiVoiceLogsNode.updateVoiceLog(nodeCode, updateData);

    console.log('Voice log updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating voice log:', error);
  }
}

// ============================================================
// SEARCH AND ANALYTICS OPERATIONS
// ============================================================

/**
 * Example 5: Search voice logs by transcript content
 */
async function searchVoiceLogsExample() {
  try {
    const searchQuery = 'weather';
    const userId = 'user_67890';
    const options = {
      limit: 10,
      offset: 0
    };

    const result = await aiVoiceLogsNode.searchVoiceLogs(searchQuery, userId, options);

    console.log(`Found ${result.logs.length} voice logs containing "${searchQuery}":`, result.logs);
    return result;
  } catch (error) {
    console.error('Error searching voice logs:', error);
  }
}

/**
 * Example 6: Get voice analytics
 */
async function getVoiceAnalyticsExample() {
  try {
    const userId = 'user_67890';
    const dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      end: new Date().toISOString()
    };

    const analytics = await aiVoiceLogsNode.getVoiceAnalytics(userId, dateRange);

    console.log('Voice analytics:', analytics);
    return analytics;
  } catch (error) {
    console.error('Error getting voice analytics:', error);
  }
}

/**
 * Example 7: Analyze intent distribution
 */
async function analyzeIntentDistributionExample() {
  try {
    const userId = 'user_67890';

    // Get recent logs
    const criteria = {
      user_id: userId,
      created_at: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    const result = await aiVoiceLogsNode.queryVoiceLogs(criteria, { limit: 100 });

    // Analyze intents
    const intentStats = {};
    result.logs.forEach(log => {
      const intent = log.detected_intent || 'unknown';
      intentStats[intent] = (intentStats[intent] || 0) + 1;
    });

    console.log('Intent distribution:', intentStats);
    return intentStats;
  } catch (error) {
    console.error('Error analyzing intent distribution:', error);
  }
}

// ============================================================
// BATCH OPERATIONS
// ============================================================

/**
 * Example 8: Batch create voice logs
 */
async function batchCreateVoiceLogsExample() {
  try {
    const entries = [
      {
        voiceData: {
          business_id: 'business_12345',
          user_id: 'user_67890',
          audio_url: 'https://storage.example.com/audio/batch_001.wav',
          transcript: 'What is the temperature today?',
          detected_intent: 'weather_query',
          confidence_score: 0.89,
          language: 'en',
          voice_provider: 'google_speech',
          sentiment: 'neutral',
          keywords: ['temperature', 'today'],
          entities: [{ type: 'intent', value: 'weather_query', confidence: 0.89 }],
          tags: ['batch', 'weather']
        },
        nodeCode: 'batch_voice_001'
      },
      {
        voiceData: {
          business_id: 'business_12345',
          user_id: 'user_67890',
          audio_url: 'https://storage.example.com/audio/batch_002.wav',
          transcript: 'Play some music',
          detected_intent: 'media_control',
          confidence_score: 0.94,
          language: 'en',
          voice_provider: 'google_speech',
          sentiment: 'positive',
          keywords: ['play', 'music'],
          entities: [{ type: 'intent', value: 'media_control', confidence: 0.94 }],
          tags: ['batch', 'music']
        },
        nodeCode: 'batch_voice_002'
      },
      {
        voiceData: {
          business_id: 'business_12345',
          user_id: 'user_67890',
          audio_url: 'https://storage.example.com/audio/batch_003.wav',
          transcript: 'Set a reminder for tomorrow at 3 PM',
          detected_intent: 'reminder_set',
          confidence_score: 0.91,
          language: 'en',
          voice_provider: 'google_speech',
          sentiment: 'neutral',
          keywords: ['reminder', 'tomorrow', '3 PM'],
          entities: [
            { type: 'intent', value: 'reminder_set', confidence: 0.91 },
            { type: 'datetime', value: 'tomorrow 3 PM', confidence: 0.88 }
          ],
          tags: ['batch', 'reminder']
        },
        nodeCode: 'batch_voice_003'
      }
    ];

    const results = await aiVoiceLogsNode.batchCreateVoiceLogs(entries);

    console.log(`Batch create completed: ${results.total_created} created, ${results.total_errors} errors`);
    return results;
  } catch (error) {
    console.error('Error in batch create:', error);
  }
}

// ============================================================
// PRACTICAL USAGE SCENARIOS
// ============================================================

/**
 * Example 9: Voice Assistant Session Logging
 */
async function voiceAssistantSessionExample() {
  try {
    const sessionId = 'session_' + Date.now();
    const userId = 'user_67890';

    // Simulate a voice assistant conversation
    const voiceInteractions = [
      {
        transcript: 'Hello, how can I help you today?',
        detected_intent: 'greeting',
        sentiment: 'neutral',
        confidence_score: 0.96
      },
      {
        transcript: 'What\'s the weather like?',
        detected_intent: 'weather_query',
        sentiment: 'neutral',
        confidence_score: 0.92
      },
      {
        transcript: 'It\'s sunny and 75 degrees',
        detected_intent: 'weather_response',
        sentiment: 'positive',
        confidence_score: 0.89
      },
      {
        transcript: 'Thanks for the information',
        detected_intent: 'gratitude',
        sentiment: 'positive',
        confidence_score: 0.94
      }
    ];

    const createdLogs = [];

    for (let i = 0; i < voiceInteractions.length; i++) {
      const interaction = voiceInteractions[i];
      const voiceData = {
        business_id: 'business_12345',
        user_id: userId,
        audio_url: `https://storage.example.com/audio/${sessionId}_${i}.wav`,
        transcript: interaction.transcript,
        detected_intent: interaction.detected_intent,
        confidence_score: interaction.confidence_score,
        processing_duration: Math.floor(Math.random() * 1000) + 500,
        audio_duration: Math.floor(Math.random() * 2000) + 1000,
        language: 'en',
        voice_provider: 'google_speech',
        sentiment: interaction.sentiment,
        keywords: interaction.transcript.toLowerCase().split(' ').filter(word => word.length > 3),
        entities: [{ type: 'intent', value: interaction.detected_intent, confidence: interaction.confidence_score }],
        metadata: {
          session_id: sessionId,
          interaction_index: i,
          conversation_flow: 'voice_assistant'
        },
        tags: ['voice_assistant', 'conversation', sessionId]
      };

      const result = await aiVoiceLogsNode.createVoiceLog(voiceData, `voice_${sessionId}_${i}`);
      createdLogs.push(result);

      // Simulate time between interactions
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Created ${createdLogs.length} voice interaction logs for session ${sessionId}`);

    // Get session analytics
    const analytics = await aiVoiceLogsNode.getVoiceAnalytics(userId);
    console.log('Session analytics:', analytics);

    return {
      sessionId,
      logs: createdLogs,
      analytics
    };
  } catch (error) {
    console.error('Error in voice assistant session:', error);
  }
}

/**
 * Example 10: Voice Quality Analysis
 */
async function voiceQualityAnalysisExample() {
  try {
    const userId = 'user_67890';

    // Get recent voice logs
    const criteria = {
      user_id: userId,
      created_at: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    const result = await aiVoiceLogsNode.queryVoiceLogs(criteria, { limit: 200 });

    // Analyze voice quality metrics
    const qualityMetrics = {
      total_interactions: result.logs.length,
      avg_confidence: 0,
      avg_processing_time: 0,
      avg_audio_duration: 0,
      confidence_distribution: { high: 0, medium: 0, low: 0 },
      provider_performance: {},
      language_distribution: {},
      sentiment_distribution: {}
    };

    let totalConfidence = 0;
    let totalProcessingTime = 0;
    let totalAudioDuration = 0;

    result.logs.forEach(log => {
      totalConfidence += log.confidence_score || 0;
      totalProcessingTime += log.processing_duration || 0;
      totalAudioDuration += log.audio_duration || 0;

      // Confidence distribution
      const confidence = log.confidence_score || 0;
      if (confidence >= 0.8) qualityMetrics.confidence_distribution.high++;
      else if (confidence >= 0.6) qualityMetrics.confidence_distribution.medium++;
      else qualityMetrics.confidence_distribution.low++;

      // Provider performance
      const provider = log.voice_provider || 'unknown';
      if (!qualityMetrics.provider_performance[provider]) {
        qualityMetrics.provider_performance[provider] = { count: 0, total_confidence: 0 };
      }
      qualityMetrics.provider_performance[provider].count++;
      qualityMetrics.provider_performance[provider].total_confidence += confidence;

      // Language distribution
      const language = log.language || 'unknown';
      qualityMetrics.language_distribution[language] = (qualityMetrics.language_distribution[language] || 0) + 1;

      // Sentiment distribution
      const sentiment = log.sentiment || 'unknown';
      qualityMetrics.sentiment_distribution[sentiment] = (qualityMetrics.sentiment_distribution[sentiment] || 0) + 1;
    });

    qualityMetrics.avg_confidence = result.logs.length > 0 ? totalConfidence / result.logs.length : 0;
    qualityMetrics.avg_processing_time = result.logs.length > 0 ? totalProcessingTime / result.logs.length : 0;
    qualityMetrics.avg_audio_duration = result.logs.length > 0 ? totalAudioDuration / result.logs.length : 0;

    // Calculate provider averages
    Object.keys(qualityMetrics.provider_performance).forEach(provider => {
      const perf = qualityMetrics.provider_performance[provider];
      perf.avg_confidence = perf.total_confidence / perf.count;
    });

    console.log('Voice quality analysis:', qualityMetrics);
    return qualityMetrics;
  } catch (error) {
    console.error('Error in voice quality analysis:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  createVoiceLogExample,
  queryVoiceLogsExample,
  getVoiceLogByIdExample,
  updateVoiceLogExample,
  searchVoiceLogsExample,
  getVoiceAnalyticsExample,
  analyzeIntentDistributionExample,
  batchCreateVoiceLogsExample,
  voiceAssistantSessionExample,
  voiceQualityAnalysisExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running AI Voice Logs Examples...\n');

  // Run examples sequentially
  (async () => {
    try {
      console.log('1. Creating voice log...');
      await createVoiceLogExample();

      console.log('\n2. Querying voice logs...');
      await queryVoiceLogsExample();

      console.log('\n3. Getting voice log by ID...');
      await getVoiceLogByIdExample();

      console.log('\n4. Updating voice log...');
      await updateVoiceLogExample();

      console.log('\n5. Searching voice logs...');
      await searchVoiceLogsExample();

      console.log('\n6. Getting voice analytics...');
      await getVoiceAnalyticsExample();

      console.log('\n7. Analyzing intent distribution...');
      await analyzeIntentDistributionExample();

      console.log('\n8. Batch creating voice logs...');
      await batchCreateVoiceLogsExample();

      console.log('\n9. Voice assistant session...');
      await voiceAssistantSessionExample();

      console.log('\n10. Voice quality analysis...');
      await voiceQualityAnalysisExample();

      console.log('\nAll examples completed successfully!');
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}