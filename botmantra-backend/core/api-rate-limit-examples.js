/**
 * API Rate Limit Node Examples
 * Comprehensive usage examples for node-based API rate limiting
 */

const { apiRateLimitNode } = require('../core/api-rate-limit');

// ============================================================
// BASIC RATE LIMIT OPERATIONS
// ============================================================

/**
 * Example 1: Create a new rate limit entry
 */
async function createRateLimitExample() {
  try {
    const limitData = {
      user_id: 'user_12345',
      endpoint: '/api/users',
      requests_per_minute: 60,
      requests_per_hour: 1000,
      requests_per_day: 5000,
      current_minute_count: 0,
      current_hour_count: 0,
      current_day_count: 0,
      last_request_time: new Date().toISOString(),
      ip_address: '192.168.1.100',
      nid_hash: 'hash_12345'
    };

    const result = await apiRateLimitNode.createRateLimit(limitData, 'rate_limit_001');

    console.log('Rate limit created:', result);
    return result;
  } catch (error) {
    console.error('Error creating rate limit:', error);
  }
}

/**
 * Example 2: Check if request is allowed
 */
async function checkRateLimitExample() {
  try {
    const userId = 'user_12345';
    const endpoint = '/api/users';
    const ipAddress = '192.168.1.100';
    const nidHash = 'hash_12345';

    const result = await apiRateLimitNode.checkRateLimit(userId, endpoint, ipAddress, nidHash);

    console.log('Rate limit check result:', result);
    return result;
  } catch (error) {
    console.error('Error checking rate limit:', error);
  }
}

/**
 * Example 3: Update rate limit counters
 */
async function updateRateLimitExample() {
  try {
    const userId = 'user_12345';
    const endpoint = '/api/users';
    const ipAddress = '192.168.1.100';
    const nidHash = 'hash_12345';

    const result = await apiRateLimitNode.updateRateLimit(userId, endpoint, ipAddress, nidHash);

    console.log('Rate limit updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating rate limit:', error);
  }
}

/**
 * Example 4: Get rate limit by user and endpoint
 */
async function getRateLimitExample() {
  try {
    const userId = 'user_12345';
    const endpoint = '/api/users';

    const limit = await apiRateLimitNode.getRateLimit(userId, endpoint);

    if (limit) {
      console.log('Rate limit found:', limit);
    } else {
      console.log('Rate limit not found');
    }

    return limit;
  } catch (error) {
    console.error('Error getting rate limit:', error);
  }
}

/**
 * Example 5: Query rate limits with filters
 */
async function queryRateLimitsExample() {
  try {
    const criteria = {
      user_id: 'user_12345'
    };

    const options = {
      limit: 20,
      offset: 0,
      sort: 'last_request_time',
      order: 'desc'
    };

    const result = await apiRateLimitNode.queryRateLimits(criteria, options);

    console.log(`Found ${result.total} rate limits:`, result.limits);
    return result;
  } catch (error) {
    console.error('Error querying rate limits:', error);
  }
}

// ============================================================
// RATE LIMIT MANAGEMENT OPERATIONS
// ============================================================

/**
 * Example 6: Reset rate limit counters
 */
async function resetRateLimitExample() {
  try {
    const userId = 'user_12345';
    const endpoint = '/api/users';

    const result = await apiRateLimitNode.resetRateLimit(userId, endpoint);

    console.log('Rate limit reset:', result);
    return result;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Example 7: Update rate limit configuration
 */
async function updateRateLimitConfigExample() {
  try {
    const userId = 'user_12345';
    const endpoint = '/api/users';
    const newConfig = {
      requests_per_minute: 120,
      requests_per_hour: 2000,
      requests_per_day: 10000
    };

    const result = await apiRateLimitNode.updateRateLimitConfig(userId, endpoint, newConfig);

    console.log('Rate limit config updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating rate limit config:', error);
  }
}

/**
 * Example 8: Get rate limit statistics
 */
async function getRateLimitStatsExample() {
  try {
    const userId = 'user_12345';

    const stats = await apiRateLimitNode.getRateLimitStats(userId);

    console.log('Rate limit statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
  }
}

/**
 * Example 9: Clean up expired rate limits
 */
async function cleanupExpiredRateLimitsExample() {
  try {
    const hoursOld = 24; // Clean up rate limits older than 24 hours

    const result = await apiRateLimitNode.cleanupExpiredRateLimits(hoursOld);

    console.log(`Cleaned up ${result.deleted} expired rate limit entries`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired rate limits:', error);
  }
}

// ============================================================
// ADVANCED RATE LIMITING SCENARIOS
// ============================================================

/**
 * Example 10: Simulate API requests with rate limiting
 */
async function simulateRateLimitedRequestsExample() {
  try {
    const userId = 'user_12345';
    const endpoint = '/api/users';
    const ipAddress = '192.168.1.100';
    const nidHash = 'hash_12345';

    console.log('Simulating API requests with rate limiting...');

    let allowed = 0;
    let blocked = 0;

    // Simulate 150 requests (exceeding the 60 per minute limit)
    for (let i = 0; i < 150; i++) {
      try {
        const result = await apiRateLimitNode.checkRateLimit(userId, endpoint, ipAddress, nidHash);

        if (result.allowed) {
          allowed++;
          await apiRateLimitNode.updateRateLimit(userId, endpoint, ipAddress, nidHash);
          console.log(`Request ${i + 1}: ALLOWED (${result.remaining} remaining)`);
        } else {
          blocked++;
          console.log(`Request ${i + 1}: BLOCKED (reset in ${result.reset_time} seconds)`);
        }

        // Small delay to simulate real requests
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`Error on request ${i + 1}:`, error);
      }
    }

    console.log(`\nSimulation completed: ${allowed} allowed, ${blocked} blocked`);

    // Get final stats
    const stats = await apiRateLimitNode.getRateLimitStats(userId);
    console.log('Final rate limit stats:', stats);

    return { allowed, blocked, stats };
  } catch (error) {
    console.error('Error in rate limiting simulation:', error);
  }
}

/**
 * Example 11: Multi-endpoint rate limiting
 */
async function multiEndpointRateLimitingExample() {
  try {
    const userId = 'user_12345';
    const ipAddress = '192.168.1.100';
    const nidHash = 'hash_12345';

    const endpoints = [
      { path: '/api/users', limit: 60 },
      { path: '/api/posts', limit: 30 },
      { path: '/api/comments', limit: 20 },
      { path: '/api/settings', limit: 10 }
    ];

    console.log('Setting up multi-endpoint rate limiting...');

    // Create rate limits for each endpoint
    for (const endpoint of endpoints) {
      await apiRateLimitNode.createRateLimit({
        user_id: userId,
        endpoint: endpoint.path,
        requests_per_minute: endpoint.limit,
        requests_per_hour: endpoint.limit * 60,
        requests_per_day: endpoint.limit * 60 * 24,
        current_minute_count: 0,
        current_hour_count: 0,
        current_day_count: 0,
        last_request_time: new Date().toISOString(),
        ip_address: ipAddress,
        nid_hash: nidHash
      });
    }

    console.log('Testing rate limits across endpoints...');

    const results = {};

    // Test each endpoint
    for (const endpoint of endpoints) {
      const checks = [];
      for (let i = 0; i < endpoint.limit + 5; i++) {
        const result = await apiRateLimitNode.checkRateLimit(userId, endpoint.path, ipAddress, nidHash);
        checks.push(result.allowed);

        if (result.allowed) {
          await apiRateLimitNode.updateRateLimit(userId, endpoint.path, ipAddress, nidHash);
        }
      }

      const allowed = checks.filter(Boolean).length;
      const blocked = checks.length - allowed;

      results[endpoint.path] = { allowed, blocked, limit: endpoint.limit };
      console.log(`${endpoint.path}: ${allowed}/${endpoint.limit} allowed, ${blocked} blocked`);
    }

    return results;
  } catch (error) {
    console.error('Error in multi-endpoint rate limiting:', error);
  }
}

/**
 * Example 12: Rate limit monitoring and alerts
 */
async function rateLimitMonitoringExample() {
  try {
    const userId = 'user_12345';

    console.log('Monitoring rate limit usage...');

    // Get current rate limits
    const rateLimits = await apiRateLimitNode.queryRateLimits({ user_id: userId });

    const alerts = [];

    for (const limit of rateLimits.limits) {
      const record = limit.database_record;
      const minuteUsage = (record.current_minute_count / record.requests_per_minute) * 100;
      const hourUsage = (record.current_hour_count / record.requests_per_hour) * 100;
      const dayUsage = (record.current_day_count / record.requests_per_day) * 100;

      console.log(`${record.endpoint}:`);
      console.log(`  Minute: ${record.current_minute_count}/${record.requests_per_minute} (${minuteUsage.toFixed(1)}%)`);
      console.log(`  Hour: ${record.current_hour_count}/${record.requests_per_hour} (${hourUsage.toFixed(1)}%)`);
      console.log(`  Day: ${record.current_day_count}/${record.requests_per_day} (${dayUsage.toFixed(1)}%)`);

      // Check for alerts
      if (minuteUsage > 90) {
        alerts.push({
          type: 'CRITICAL',
          endpoint: record.endpoint,
          message: `Minute limit nearly exceeded: ${minuteUsage.toFixed(1)}% used`
        });
      } else if (minuteUsage > 75) {
        alerts.push({
          type: 'WARNING',
          endpoint: record.endpoint,
          message: `High minute usage: ${minuteUsage.toFixed(1)}% used`
        });
      }

      if (hourUsage > 90) {
        alerts.push({
          type: 'CRITICAL',
          endpoint: record.endpoint,
          message: `Hour limit nearly exceeded: ${hourUsage.toFixed(1)}% used`
        });
      }
    }

    console.log(`\nGenerated ${alerts.length} alerts:`);
    alerts.forEach(alert => console.log(`  ${alert.type}: ${alert.message}`));

    return { rate_limits: rateLimits.limits, alerts };
  } catch (error) {
    console.error('Error in rate limit monitoring:', error);
  }
}

/**
 * Example 13: Batch rate limit operations
 */
async function batchRateLimitOperationsExample() {
  try {
    const userId = 'user_12345';
    const endpoints = ['/api/users', '/api/posts', '/api/comments'];

    console.log('Performing batch rate limit operations...');

    // Batch create rate limits
    const createResults = [];
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      try {
        const result = await apiRateLimitNode.createRateLimit({
          user_id: userId,
          endpoint: endpoint,
          requests_per_minute: 60 - i * 10, // Decreasing limits
          requests_per_hour: 1000 - i * 100,
          requests_per_day: 5000 - i * 500,
          current_minute_count: 0,
          current_hour_count: 0,
          current_day_count: 0,
          last_request_time: new Date().toISOString(),
          ip_address: '192.168.1.100',
          nid_hash: 'hash_12345'
        }, `batch_limit_${i + 1}`);

        createResults.push(result);
      } catch (error) {
        console.error(`Error creating rate limit for ${endpoint}:`, error);
      }
    }

    console.log(`Created ${createResults.length} rate limits`);

    // Batch check rate limits
    const checkResults = [];
    for (const endpoint of endpoints) {
      const result = await apiRateLimitNode.checkRateLimit(userId, endpoint, '192.168.1.100', 'hash_12345');
      checkResults.push({ endpoint, allowed: result.allowed, remaining: result.remaining });
    }

    console.log('Batch check results:', checkResults);

    // Batch update rate limits
    const updateResults = [];
    for (const endpoint of endpoints) {
      const result = await apiRateLimitNode.updateRateLimit(userId, endpoint, '192.168.1.100', 'hash_12345');
      updateResults.push({ endpoint, updated: result.success });
    }

    console.log('Batch update results:', updateResults);

    return {
      created: createResults.length,
      checks: checkResults,
      updates: updateResults
    };
  } catch (error) {
    console.error('Error in batch operations:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  createRateLimitExample,
  checkRateLimitExample,
  updateRateLimitExample,
  getRateLimitExample,
  queryRateLimitsExample,
  resetRateLimitExample,
  updateRateLimitConfigExample,
  getRateLimitStatsExample,
  cleanupExpiredRateLimitsExample,
  simulateRateLimitedRequestsExample,
  multiEndpointRateLimitingExample,
  rateLimitMonitoringExample,
  batchRateLimitOperationsExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running API Rate Limit Examples...\n');

  // Run examples sequentially
  (async () => {
    try {
      console.log('1. Creating rate limit...');
      await createRateLimitExample();

      console.log('\n2. Checking rate limit...');
      await checkRateLimitExample();

      console.log('\n3. Updating rate limit...');
      await updateRateLimitExample();

      console.log('\n4. Getting rate limit...');
      await getRateLimitExample();

      console.log('\n5. Querying rate limits...');
      await queryRateLimitsExample();

      console.log('\n6. Resetting rate limit...');
      await resetRateLimitExample();

      console.log('\n7. Updating rate limit config...');
      await updateRateLimitConfigExample();

      console.log('\n8. Getting rate limit stats...');
      await getRateLimitStatsExample();

      console.log('\n9. Simulating rate limited requests...');
      await simulateRateLimitedRequestsExample();

      console.log('\n10. Multi-endpoint rate limiting...');
      await multiEndpointRateLimitingExample();

      console.log('\n11. Rate limit monitoring...');
      await rateLimitMonitoringExample();

      console.log('\n12. Batch operations...');
      await batchRateLimitOperationsExample();

      console.log('\nAll examples completed successfully!');
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}