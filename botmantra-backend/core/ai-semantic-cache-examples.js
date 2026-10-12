/**
 * AI Semantic Cache Node Examples
 * Usage examples for AI Semantic Caching
 */

const { aiSemanticCacheNode } = require('../core/ai-semantic-cache');

/**
 * Example: Create a new semantic cache entry
 */
async function createCacheEntryExample() {
  try {
    console.log('=== Creating Semantic Cache Entry Example ===');

    const cacheData = {
      user_id: 'user-12345',
      business_id: 'business-67890',
      query: 'What is the capital of France?',
      query_embedding: [0.1, 0.2, 0.3, 0.4, 0.5], // Mock embedding vector
      answer: 'The capital of France is Paris.',
      similarity_threshold: 0.85,
      hit_count: 0,
      cache_status: 'active',
      embedding_model: 'text-embedding-ada-002',
      query_hash: 'hash_of_query_123',
      tags: ['geography', 'europe', 'capitals'],
      performance_metrics: {
        avg_response_time: 0,
        total_hits: 0,
        cache_hit_rate: 0
      }
    };

    const result = await aiSemanticCacheNode.createCacheEntry(cacheData);

    console.log('Cache entry created successfully:');
    console.log('Node Code:', result.node.node_code);
    console.log('Database ID:', result.database_record.id);
    console.log('Query:', result.node.metadata.query);
    console.log('Answer:', result.node.metadata.answer);

    return result;
  } catch (error) {
    console.error('Error in create cache entry example:', error);
  }
}

/**
 * Example: Query cache entries with filters
 */
async function queryCacheEntriesExample(businessId) {
  try {
    console.log('=== Querying Cache Entries Example ===');

    const criteria = {
      business_id: businessId,
      cache_status: 'active',
      is_active: true
    };

    const options = {
      limit: 10,
      offset: 0,
      sort: 'last_accessed',
      order: 'desc'
    };

    const result = await aiSemanticCacheNode.queryCacheEntries(criteria, options);

    console.log(`Found ${result.entries.length} cache entries:`);
    result.entries.forEach((entry, index) => {
      console.log(`${index + 1}. Node Code: ${entry.node.node_code}`);
      console.log(`   Query: ${entry.node.metadata.query.substring(0, 50)}...`);
      console.log(`   Hits: ${entry.database_record.hit_count}`);
      console.log(`   Status: ${entry.database_record.cache_status}`);
      console.log(`   Last Accessed: ${entry.database_record.last_accessed}`);
      console.log('');
    });

    return result;
  } catch (error) {
    console.error('Error in query cache entries example:', error);
  }
}

/**
 * Example: Find similar cache entries using vector similarity
 */
async function findSimilarEntriesExample(businessId) {
  try {
    console.log('=== Finding Similar Cache Entries Example ===');

    // Mock query embedding for "What is the capital of Spain?"
    const queryEmbedding = [0.15, 0.25, 0.35, 0.45, 0.55];

    const similarEntries = await aiSemanticCacheNode.findSimilarEntries(
      queryEmbedding,
      businessId,
      0.8, // similarity threshold
      5    // limit
    );

    console.log(`Found ${similarEntries.length} similar entries:`);
    similarEntries.forEach((entry, index) => {
      console.log(`${index + 1}. Similarity: ${(entry.similarity_score * 100).toFixed(1)}%`);
      console.log(`   Query: ${entry.node.metadata.query}`);
      console.log(`   Answer: ${entry.database_record.answer}`);
      console.log('');
    });

    return similarEntries;
  } catch (error) {
    console.error('Error in find similar entries example:', error);
  }
}

/**
 * Example: Update cache entry and increment hit count
 */
async function updateCacheEntryExample(nodeCode) {
  try {
    console.log('=== Updating Cache Entry Example ===');

    const updateData = {
      hit_count: 5, // This will be incremented automatically
      performance_metrics: {
        avg_response_time: 150,
        total_hits: 5,
        cache_hit_rate: 0.75
      },
      last_accessed: new Date().toISOString()
    };

    const result = await aiSemanticCacheNode.updateCacheEntry(nodeCode, updateData);

    console.log('Cache entry updated:');
    console.log('Node Code:', result.node.node_code);
    console.log('Updated Hits:', result.database_record.hit_count);
    console.log('Performance Metrics:', result.database_record.performance_metrics);

    return result;
  } catch (error) {
    console.error('Error in update cache entry example:', error);
  }
}

/**
 * Example: Get cache statistics
 */
async function getCacheStatsExample(businessId) {
  try {
    console.log('=== Getting Cache Statistics Example ===');

    const stats = await aiSemanticCacheNode.getCacheStats(businessId);

    console.log('Cache Statistics:');
    console.log(`Total Entries: ${stats.total_entries}`);
    console.log(`Active Entries: ${stats.active_entries}`);
    console.log(`Total Hits: ${stats.total_hits}`);
    console.log(`Average Hit Count: ${stats.avg_hit_count.toFixed(2)}`);
    console.log(`Recently Accessed: ${stats.recently_accessed}`);
    console.log(`Oldest Entry: ${stats.oldest_entry}`);
    console.log(`Newest Entry: ${stats.newest_entry}`);

    return stats;
  } catch (error) {
    console.error('Error in get cache stats example:', error);
  }
}

/**
 * Example: Clean up old cache entries
 */
async function cleanupCacheExample(businessId) {
  try {
    console.log('=== Cleaning Up Cache Example ===');

    const cleanupResult = await aiSemanticCacheNode.cleanupCache(
      businessId,
      7,  // max age in days
      1   // minimum hits
    );

    console.log('Cache cleanup completed:');
    console.log(`Entries cleaned: ${cleanupResult.cleaned_entries}`);
    console.log(`Cutoff date: ${cleanupResult.cutoff_date}`);
    console.log(`Minimum hits threshold: ${cleanupResult.min_hits}`);

    return cleanupResult;
  } catch (error) {
    console.error('Error in cleanup cache example:', error);
  }
}

/**
 * Example: Batch create cache entries
 */
async function batchCreateEntriesExample(businessId) {
  try {
    console.log('=== Batch Creating Cache Entries Example ===');

    const entries = [
      {
        query: 'What is machine learning?',
        query_embedding: [0.2, 0.3, 0.4, 0.5, 0.6],
        answer: 'Machine learning is a subset of AI that enables systems to learn from data.',
        similarity_threshold: 0.8,
        tags: ['ai', 'ml', 'definition'],
        embedding_model: 'text-embedding-ada-002'
      },
      {
        query: 'Explain neural networks',
        query_embedding: [0.25, 0.35, 0.45, 0.55, 0.65],
        answer: 'Neural networks are computing systems inspired by biological neural networks.',
        similarity_threshold: 0.85,
        tags: ['ai', 'neural-networks', 'deep-learning'],
        embedding_model: 'text-embedding-ada-002'
      },
      {
        query: 'What is the weather like today?',
        query_embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        answer: 'I cannot provide real-time weather information.',
        similarity_threshold: 0.9,
        tags: ['weather', 'real-time', 'limitation'],
        embedding_model: 'text-embedding-ada-002'
      }
    ];

    console.log(`Creating ${entries.length} cache entries...`);

    // Note: In a real implementation, you'd call the batch endpoint
    // For this example, we'll create them individually
    const results = [];
    for (const entry of entries) {
      const cacheData = {
        user_id: 'user-12345',
        business_id: businessId,
        ...entry
      };

      const result = await aiSemanticCacheNode.createCacheEntry(cacheData);
      results.push(result);
    }

    console.log(`Successfully created ${results.length} cache entries`);

    return results;
  } catch (error) {
    console.error('Error in batch create entries example:', error);
  }
}

/**
 * Example: Simulate cache hit workflow
 */
async function cacheHitWorkflowExample(businessId) {
  try {
    console.log('=== Cache Hit Workflow Example ===');

    // 1. Create a cache entry
    console.log('1. Creating cache entry...');
    const cacheData = {
      user_id: 'user-12345',
      business_id: businessId,
      query: 'Hello, how are you?',
      query_embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      answer: 'I am doing well, thank you for asking!',
      similarity_threshold: 0.8,
      tags: ['greeting', 'conversation']
    };

    const createResult = await aiSemanticCacheNode.createCacheEntry(cacheData);
    const nodeCode = createResult.node.node_code;

    // 2. Simulate multiple cache hits
    console.log('2. Simulating cache hits...');
    for (let i = 0; i < 3; i++) {
      await aiSemanticCacheNode.updateCacheEntry(nodeCode, { increment_hit: true });
      console.log(`   Cache hit ${i + 1} recorded`);
    }

    // 3. Query the updated entry
    console.log('3. Querying updated entry...');
    const criteria = { node_code: nodeCode };
    const queryResult = await aiSemanticCacheNode.queryCacheEntries(criteria, { limit: 1 });

    if (queryResult.entries.length > 0) {
      const entry = queryResult.entries[0];
      console.log('Updated entry:');
      console.log(`   Hits: ${entry.database_record.hit_count}`);
      console.log(`   Last Accessed: ${entry.database_record.last_accessed}`);
    }

    return createResult;
  } catch (error) {
    console.error('Error in cache hit workflow example:', error);
  }
}

/**
 * Example: Semantic search simulation
 */
async function semanticSearchExample(businessId) {
  try {
    console.log('=== Semantic Search Simulation Example ===');

    // Create some test entries
    const testEntries = [
      {
        query: 'What is the capital of France?',
        query_embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        answer: 'Paris',
        tags: ['geography', 'europe']
      },
      {
        query: 'What is the capital of Germany?',
        query_embedding: [0.15, 0.25, 0.35, 0.45, 0.55],
        answer: 'Berlin',
        tags: ['geography', 'europe']
      },
      {
        query: 'How does photosynthesis work?',
        query_embedding: [0.8, 0.7, 0.6, 0.5, 0.4],
        answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
        tags: ['biology', 'science']
      }
    ];

    console.log('Creating test entries...');
    for (const entry of testEntries) {
      await aiSemanticCacheNode.createCacheEntry({
        user_id: 'user-12345',
        business_id: businessId,
        ...entry
      });
    }

    // Search for similar entries
    console.log('Searching for entries similar to "capital of Spain"...');
    const searchEmbedding = [0.12, 0.22, 0.32, 0.42, 0.52]; // Similar to France/Germany entries

    const results = await aiSemanticCacheNode.findSimilarEntries(
      searchEmbedding,
      businessId,
      0.7, // Lower threshold for demo
      5
    );

    console.log(`Found ${results.length} similar entries:`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.node.metadata.query} (similarity: ${(result.similarity_score * 100).toFixed(1)}%)`);
    });

    return results;
  } catch (error) {
    console.error('Error in semantic search example:', error);
  }
}

/**
 * Example: Cache performance monitoring
 */
async function performanceMonitoringExample(businessId) {
  try {
    console.log('=== Cache Performance Monitoring Example ===');

    // Get current stats
    console.log('Current cache statistics:');
    const initialStats = await aiSemanticCacheNode.getCacheStats(businessId);
    console.log(initialStats);

    // Simulate some activity
    console.log('Simulating cache activity...');

    // Create a few entries
    for (let i = 0; i < 5; i++) {
      await aiSemanticCacheNode.createCacheEntry({
        user_id: 'user-12345',
        business_id: businessId,
        query: `Test query ${i}`,
        query_embedding: Array.from({ length: 5 }, () => Math.random()),
        answer: `Test answer ${i}`,
        tags: ['test', 'performance']
      });
    }

    // Simulate hits on some entries
    const entries = await aiSemanticCacheNode.queryCacheEntries({ business_id: businessId }, { limit: 5 });
    for (const entry of entries.entries.slice(0, 3)) {
      for (let i = 0; i < Math.floor(Math.random() * 10); i++) {
        await aiSemanticCacheNode.updateCacheEntry(entry.node.node_code, { increment_hit: true });
      }
    }

    // Get updated stats
    console.log('Updated cache statistics:');
    const updatedStats = await aiSemanticCacheNode.getCacheStats(businessId);
    console.log(updatedStats);

    return { initial: initialStats, updated: updatedStats };
  } catch (error) {
    console.error('Error in performance monitoring example:', error);
  }
}

// Export examples for external use
module.exports = {
  createCacheEntryExample,
  queryCacheEntriesExample,
  findSimilarEntriesExample,
  updateCacheEntryExample,
  getCacheStatsExample,
  cleanupCacheExample,
  batchCreateEntriesExample,
  cacheHitWorkflowExample,
  semanticSearchExample,
  performanceMonitoringExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running AI Semantic Cache Examples...\n');

  // Run examples sequentially
  setTimeout(async () => {
    const businessId = 'business-demo-123';

    await createCacheEntryExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await queryCacheEntriesExample(businessId);
    console.log('\n' + '='.repeat(50) + '\n');

    await findSimilarEntriesExample(businessId);
    console.log('\n' + '='.repeat(50) + '\n');

    await semanticSearchExample(businessId);
    console.log('\n' + '='.repeat(50) + '\n');

    await performanceMonitoringExample(businessId);
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('Examples completed.');
  }, 1000);
}