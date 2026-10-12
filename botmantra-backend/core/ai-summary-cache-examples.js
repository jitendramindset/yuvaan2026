/**
 * AI Summary Cache Node Examples
 * Comprehensive usage examples for node-based AI summary caching
 */

const { AISummaryCacheNode } = require('../core/ai-summary-cache');

// Initialize the cache node (in a real app, this would be done in server setup)
let aiSummaryCacheNode;

function initializeCacheNode(supabaseClient) {
  aiSummaryCacheNode = new AISummaryCacheNode(supabaseClient);
}

// ============================================================
// BASIC CACHE OPERATIONS
// ============================================================

/**
 * Example 1: Create a new summary cache entry
 */
async function createSummaryCacheExample() {
  try {
    const cacheData = {
      business_id: 'business_12345',
      user_id: 'user_67890',
      query_hash: 'hash_abc123def456',
      original_query: 'What are the main benefits of React?',
      context_hash: 'context_xyz789',
      summary: 'React offers component-based architecture, virtual DOM for performance, and a rich ecosystem of libraries and tools.',
      usage_count: 1,
      cache_status: 'active',
      performance_metrics: {
        avg_generation_time: 2.5,
        total_requests: 1,
        cache_hit_rate: 0
      },
      tags: ['react', 'frontend', 'javascript'],
      is_active: true
    };

    const result = await aiSummaryCacheNode.createSummaryCache(cacheData, 'summary_cache_001');

    console.log('Summary cache created:', result);
    return result;
  } catch (error) {
    console.error('Error creating summary cache:', error);
  }
}

/**
 * Example 2: Query summary cache entries
 */
async function querySummaryCachesExample() {
  try {
    // Query active cache entries for a business
    const criteria = {
      business_id: 'business_12345',
      usage_count_min: 1,
      updated_after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
    };

    const options = {
      limit: 20,
      offset: 0,
      sort: 'usage_count',
      order: 'desc'
    };

    const result = await aiSummaryCacheNode.querySummaryCaches(criteria, options);

    console.log(`Found ${result.total} summary cache entries:`, result.caches);
    return result;
  } catch (error) {
    console.error('Error querying summary caches:', error);
  }
}

/**
 * Example 3: Get cache entry by query hash
 */
async function getSummaryCacheByHashExample() {
  try {
    const queryHash = 'hash_abc123def456';
    const businessId = 'business_12345';

    const cache = await aiSummaryCacheNode.getSummaryCache(queryHash, businessId);

    if (cache) {
      console.log('Cache entry found:', cache);
    } else {
      console.log('Cache entry not found');
    }

    return cache;
  } catch (error) {
    console.error('Error getting cache by hash:', error);
  }
}

/**
 * Example 4: Update cache entry with new usage data
 */
async function updateSummaryCacheExample() {
  try {
    const nodeCode = 'summary_cache_001';
    const updateData = {
      usage_count: 5,
      performance_metrics: {
        avg_generation_time: 2.3,
        total_requests: 5,
        cache_hit_rate: 0.8
      },
      summary: 'React provides component-based architecture for building reusable UI components, virtual DOM for efficient rendering, and a vast ecosystem including hooks, context API, and third-party libraries.',
      tags: ['react', 'frontend', 'javascript', 'hooks', 'performance'],
      updated_at: new Date().toISOString()
    };

    const result = await aiSummaryCacheNode.updateSummaryCache(nodeCode, updateData);

    console.log('Summary cache updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating summary cache:', error);
  }
}

/**
 * Example 5: Increment usage count (cache hit)
 */
async function incrementUsageCountExample() {
  try {
    const nodeCode = 'summary_cache_001';

    const result = await aiSummaryCacheNode.incrementUsageCount(nodeCode);

    console.log('Usage count incremented:', result);
    return result;
  } catch (error) {
    console.error('Error incrementing usage count:', error);
  }
}

// ============================================================
// CACHE MANAGEMENT OPERATIONS
// ============================================================

/**
 * Example 6: Get cache statistics
 */
async function getCacheStatsExample() {
  try {
    const businessId = 'business_12345';

    const stats = await aiSummaryCacheNode.getCacheStats(businessId);

    console.log('Cache statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
  }
}

/**
 * Example 7: Clean up old cache entries
 */
async function cleanupOldCacheExample() {
  try {
    const businessId = 'business_12345';
    const daysOld = 30; // Clean entries older than 30 days
    const minUsage = 2; // That have been used less than 2 times

    const result = await aiSummaryCacheNode.cleanupOldCache(businessId, daysOld, minUsage);

    console.log('Cleanup result:', result);
    return result;
  } catch (error) {
    console.error('Error cleaning up old cache:', error);
  }
}

/**
 * Example 8: Batch create cache entries
 */
async function batchCreateSummaryCachesExample() {
  try {
    const businessId = 'business_12345';
    const entries = [
      {
        query_hash: 'hash_react_components',
        original_query: 'How do React components work?',
        context_hash: 'context_frontend',
        summary: 'React components are reusable pieces of UI that manage their own state and can be composed together.',
        usage_count: 3,
        tags: ['react', 'components'],
        node_code: 'batch_cache_001'
      },
      {
        query_hash: 'hash_javascript_async',
        original_query: 'Explain async/await in JavaScript',
        context_hash: 'context_javascript',
        summary: 'Async/await is syntactic sugar for promises, allowing asynchronous code to be written synchronously.',
        usage_count: 7,
        tags: ['javascript', 'async', 'promises'],
        node_code: 'batch_cache_002'
      },
      {
        query_hash: 'hash_node_express',
        original_query: 'How to build APIs with Node.js and Express?',
        context_hash: 'context_backend',
        summary: 'Express.js is a web framework for Node.js that provides routing, middleware, and HTTP utilities.',
        usage_count: 12,
        tags: ['nodejs', 'express', 'api'],
        node_code: 'batch_cache_003'
      }
    ];

    const results = await aiSummaryCacheNode.batchCreateSummaryCaches(entries, businessId);

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
 * Example 9: AI Chatbot with Summary Caching
 */
async function aiChatbotWithCachingExample() {
  try {
    const businessId = 'business_12345';

    // Simulate a conversation where similar questions are asked
    const questions = [
      'What is React?',
      'Can you explain React?',
      'Tell me about React framework',
      'What are React basics?',
      'Explain React for beginners'
    ];

    console.log('Processing questions with caching...');

    for (const question of questions) {
      // Generate a simple hash for the question (in real app, use proper hashing)
      const queryHash = `hash_${question.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)}`;

      // Check if we have a cached summary
      let cache = await aiSummaryCacheNode.getSummaryCache(queryHash, businessId);

      if (cache) {
        // Cache hit - increment usage
        await aiSummaryCacheNode.incrementUsageCount(cache.database_record.id);
        console.log(`Cache hit for "${question}": ${cache.database_record.summary}`);
      } else {
        // Cache miss - create new entry
        const summary = `React is a JavaScript library for building user interfaces. It allows developers to create reusable UI components and manage application state efficiently.`;

        cache = await aiSummaryCacheNode.createSummaryCache({
          business_id: businessId,
          user_id: 'user_67890',
          query_hash: queryHash,
          original_query: question,
          context_hash: 'context_general',
          summary: summary,
          usage_count: 1,
          tags: ['react', 'basics']
        }, `cache_${Date.now()}`);

        console.log(`Cache created for "${question}": ${summary}`);
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Get final statistics
    const stats = await aiSummaryCacheNode.getCacheStats(businessId);
    console.log('Final cache statistics:', stats);

    return stats;
  } catch (error) {
    console.error('Error in chatbot caching example:', error);
  }
}

/**
 * Example 10: Cache Performance Analysis
 */
async function cachePerformanceAnalysisExample() {
  try {
    const businessId = 'business_12345';

    // Get current statistics
    const stats = await aiSummaryCacheNode.getCacheStats(businessId);
    console.log('Current cache performance:', stats);

    // Query high-usage entries
    const highUsageQuery = await aiSummaryCacheNode.querySummaryCaches({
      business_id: businessId,
      usage_count_min: 5
    }, {
      sort: 'usage_count',
      order: 'desc',
      limit: 10
    });

    console.log(`Found ${highUsageQuery.total} high-usage cache entries:`);
    highUsageQuery.caches.forEach((cache, index) => {
      console.log(`${index + 1}. "${cache.database_record.original_query}" - ${cache.database_record.usage_count} uses`);
    });

    // Query recently updated entries
    const recentQuery = await aiSummaryCacheNode.querySummaryCaches({
      business_id: businessId,
      updated_after: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
    }, {
      sort: 'updated_at',
      order: 'desc'
    });

    console.log(`\nFound ${recentQuery.total} recently updated cache entries`);

    // Analyze cache efficiency
    const efficiency = stats.total_usage > 0 ? (stats.total_usage / stats.total_entries) : 0;
    console.log(`\nCache Efficiency Analysis:`);
    console.log(`- Total Cache Entries: ${stats.total_entries}`);
    console.log(`- Total Usage Count: ${stats.total_usage}`);
    console.log(`- Average Usage per Entry: ${stats.average_usage_per_entry}`);
    console.log(`- Efficiency Score: ${efficiency.toFixed(2)} (higher is better)`);

    if (efficiency < 2) {
      console.log('⚠️  Low cache efficiency - consider reviewing cache strategy');
    } else if (efficiency > 5) {
      console.log('✅ High cache efficiency - cache is being utilized well');
    } else {
      console.log('✓ Moderate cache efficiency - performing adequately');
    }

    return {
      stats,
      highUsageEntries: highUsageQuery.caches,
      recentEntries: recentQuery.caches,
      efficiency
    };
  } catch (error) {
    console.error('Error in performance analysis:', error);
  }
}

/**
 * Example 11: Automated Cache Maintenance
 */
async function automatedCacheMaintenanceExample() {
  try {
    const businessId = 'business_12345';

    console.log('Starting automated cache maintenance...');

    // Step 1: Get current statistics
    const beforeStats = await aiSummaryCacheNode.getCacheStats(businessId);
    console.log('Before maintenance:', beforeStats);

    // Step 2: Clean up old, low-usage entries
    const cleanupResult = await aiSummaryCacheNode.cleanupOldCache(businessId, 60, 3); // 60 days old, < 3 uses
    console.log('Cleanup completed:', cleanupResult);

    // Step 3: Get updated statistics
    const afterStats = await aiSummaryCacheNode.getCacheStats(businessId);
    console.log('After maintenance:', afterStats);

    // Step 4: Identify optimization opportunities
    const optimization = {
      entries_removed: cleanupResult.cleaned_entries,
      efficiency_improved: afterStats.average_usage_per_entry - beforeStats.average_usage_per_entry,
      space_saved: cleanupResult.cleaned_entries > 0,
      recommendations: []
    };

    if (afterStats.average_usage_per_entry < 2) {
      optimization.recommendations.push('Consider adjusting cache retention policies');
    }

    if (afterStats.total_entries > 1000) {
      optimization.recommendations.push('Large cache size detected - consider implementing LRU eviction');
    }

    if (afterStats.recent_entries_last_week < afterStats.total_entries * 0.1) {
      optimization.recommendations.push('Low recent activity - cache may have stale content');
    }

    console.log('Maintenance optimization analysis:', optimization);

    return {
      beforeStats,
      afterStats,
      cleanupResult,
      optimization
    };
  } catch (error) {
    console.error('Error in automated maintenance:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  initializeCacheNode,
  createSummaryCacheExample,
  querySummaryCachesExample,
  getSummaryCacheByHashExample,
  updateSummaryCacheExample,
  incrementUsageCountExample,
  getCacheStatsExample,
  cleanupOldCacheExample,
  batchCreateSummaryCachesExample,
  aiChatbotWithCachingExample,
  cachePerformanceAnalysisExample,
  automatedCacheMaintenanceExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running AI Summary Cache Examples...\n');

  // Note: In a real environment, you would initialize with actual supabase client
  // For now, we'll show the example structure

  console.log('Examples loaded. To run individual examples:');
  console.log('- createSummaryCacheExample()');
  console.log('- querySummaryCachesExample()');
  console.log('- aiChatbotWithCachingExample()');
  console.log('- cachePerformanceAnalysisExample()');
  console.log('- automatedCacheMaintenanceExample()');

  console.log('\nNote: These examples require a properly initialized AISummaryCacheNode with Supabase client.');
}