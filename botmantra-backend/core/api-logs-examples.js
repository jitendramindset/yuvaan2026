/**
 * API Logs Node Examples
 * Comprehensive usage examples for node-based API logging
 */

const { apiLogsNode } = require('../core/api-logs');

// ============================================================
// BASIC API LOG OPERATIONS
// ============================================================

/**
 * Example 1: Create a new API log entry
 */
async function createAPILogExample() {
  try {
    const logData = {
      user_id: 'user_12345',
      endpoint: '/api/users',
      request_data: {
        method: 'GET',
        params: { limit: 10 }
      },
      response_data: {
        status: 200,
        data: { users: [] }
      },
      status: 'success',
      timestamp: new Date().toISOString(),
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    const result = await apiLogsNode.createAPILog(logData, 'api_log_001');

    console.log('API log created:', result);
    return result;
  } catch (error) {
    console.error('Error creating API log:', error);
  }
}

/**
 * Example 2: Query API logs with filters
 */
async function queryAPILogsExample() {
  try {
    // Query successful API calls for a user
    const criteria = {
      user_id: 'user_12345',
      status: 'success'
    };

    const options = {
      limit: 20,
      offset: 0,
      sort: 'timestamp',
      order: 'desc'
    };

    const result = await apiLogsNode.queryAPILogs(criteria, options);

    console.log(`Found ${result.total} API logs:`, result.logs);
    return result;
  } catch (error) {
    console.error('Error querying API logs:', error);
  }
}

/**
 * Example 3: Get API log by node code
 */
async function getAPILogByCodeExample() {
  try {
    const nodeCode = 'api_log_001';
    const userId = 'user_12345';

    const log = await apiLogsNode.getAPILog(nodeCode, userId);

    if (log) {
      console.log('API log found:', log);
    } else {
      console.log('API log not found');
    }

    return log;
  } catch (error) {
    console.error('Error getting API log:', error);
  }
}

/**
 * Example 4: Get logs by endpoint
 */
async function getLogsByEndpointExample() {
  try {
    const endpoint = '/api/users';
    const userId = 'user_12345';
    const options = {
      limit: 50,
      sort: 'timestamp',
      order: 'desc'
    };

    const result = await apiLogsNode.getLogsByEndpoint(endpoint, userId, options);

    console.log(`Found ${result.total} logs for endpoint ${endpoint}:`, result.logs);
    return result;
  } catch (error) {
    console.error('Error getting logs by endpoint:', error);
  }
}

/**
 * Example 5: Get logs by user
 */
async function getLogsByUserExample() {
  try {
    const userId = 'user_12345';
    const options = {
      limit: 100,
      sort: 'timestamp',
      order: 'desc'
    };

    const result = await apiLogsNode.getLogsByUser(userId, options);

    console.log(`Found ${result.total} logs for user ${userId}:`, result.logs);
    return result;
  } catch (error) {
    console.error('Error getting logs by user:', error);
  }
}

// ============================================================
// TIME-BASED LOG OPERATIONS
// ============================================================

/**
 * Example 6: Get logs by time range
 */
async function getLogsByTimeRangeExample() {
  try {
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
    const endTime = new Date().toISOString();
    const userId = 'user_12345';
    const options = {
      limit: 200
    };

    const result = await apiLogsNode.getLogsByTimeRange(startTime, endTime, userId, options);

    console.log(`Found ${result.total} logs in time range:`, result.logs);
    return result;
  } catch (error) {
    console.error('Error getting logs by time range:', error);
  }
}

/**
 * Example 7: Get API usage statistics
 */
async function getAPIUsageStatsExample() {
  try {
    const userId = 'user_12345';
    const timeRange = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      end: new Date().toISOString()
    };

    const stats = await apiLogsNode.getAPIUsageStats(userId, timeRange);

    console.log('API usage statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting API usage stats:', error);
  }
}

/**
 * Example 8: Clean up old logs
 */
async function cleanupOldLogsExample() {
  try {
    const daysOld = 30; // Clean up logs older than 30 days

    const result = await apiLogsNode.cleanupOldLogs(daysOld);

    console.log(`Cleaned up ${result.deleted} old log entries`);
    return result;
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
  }
}

// ============================================================
// ADVANCED LOG OPERATIONS
// ============================================================

/**
 * Example 9: Batch create API logs
 */
async function batchCreateAPILogsExample() {
  try {
    const logs = [
      {
        user_id: 'user_12345',
        endpoint: '/api/users',
        request_data: { method: 'GET' },
        response_data: { status: 200, count: 10 },
        status: 'success',
        ip_address: '192.168.1.100',
        node_code: 'batch_log_001'
      },
      {
        user_id: 'user_12345',
        endpoint: '/api/posts',
        request_data: { method: 'POST', data: { title: 'Test' } },
        response_data: { status: 201, id: 123 },
        status: 'success',
        ip_address: '192.168.1.100',
        node_code: 'batch_log_002'
      },
      {
        user_id: 'user_12345',
        endpoint: '/api/invalid',
        request_data: { method: 'GET' },
        response_data: { status: 404, error: 'Not found' },
        status: 'error',
        ip_address: '192.168.1.100',
        node_code: 'batch_log_003'
      }
    ];

    const results = [];
    const errors = [];

    for (const logData of logs) {
      try {
        const result = await apiLogsNode.createAPILog(logData, logData.node_code);
        results.push(result);
      } catch (logError) {
        errors.push({
          log: logData,
          error: logError.message
        });
      }
    }

    console.log(`Batch create completed: ${results.length} created, ${errors.length} errors`);
    return { created: results, errors };
  } catch (error) {
    console.error('Error in batch create:', error);
  }
}

/**
 * Example 10: API Request Logging Simulation
 */
async function apiRequestLoggingSimulationExample() {
  try {
    const userId = 'user_12345';
    const endpoints = ['/api/users', '/api/posts', '/api/comments', '/api/settings'];

    console.log('Simulating API requests and logging...');

    for (let i = 0; i < 20; i++) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const success = Math.random() > 0.1; // 90% success rate

      const logData = {
        user_id: userId,
        endpoint: endpoint,
        request_data: {
          method: 'GET',
          params: { page: Math.floor(Math.random() * 10) + 1 }
        },
        response_data: success ?
          { status: 200, data: { count: Math.floor(Math.random() * 100) } } :
          { status: 500, error: 'Internal server error' },
        status: success ? 'success' : 'error',
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'TestAgent/1.0'
      };

      await apiLogsNode.createAPILog(logData);

      // Small delay to simulate real requests
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log('Simulation completed. Getting statistics...');

    // Get usage statistics
    const stats = await apiLogsNode.getAPIUsageStats(userId);
    console.log('Final statistics:', stats);

    // Get recent logs
    const recentLogs = await apiLogsNode.queryAPILogs({ user_id: userId }, { limit: 5 });
    console.log('Recent logs:', recentLogs.logs);

    return { simulation_completed: true, stats };
  } catch (error) {
    console.error('Error in logging simulation:', error);
  }
}

/**
 * Example 11: Error Analysis from Logs
 */
async function errorAnalysisExample() {
  try {
    const userId = 'user_12345';

    // Get all error logs
    const errorLogs = await apiLogsNode.queryAPILogs({
      user_id: userId,
      status: 'error'
    }, { limit: 100 });

    console.log(`Found ${errorLogs.total} error logs`);

    // Analyze errors by endpoint
    const errorByEndpoint = {};
    errorLogs.logs.forEach(log => {
      const endpoint = log.database_record.endpoint;
      if (!errorByEndpoint[endpoint]) {
        errorByEndpoint[endpoint] = { count: 0, errors: [] };
      }
      errorByEndpoint[endpoint].count++;
      errorByEndpoint[endpoint].errors.push(log.database_record.response_data);
    });

    console.log('Errors by endpoint:', errorByEndpoint);

    // Get time range analysis
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeRangeLogs = await apiLogsNode.getLogsByTimeRange(oneWeekAgo, new Date().toISOString(), userId);

    const errorRate = timeRangeLogs.logs.filter(log => log.database_record.status === 'error').length / timeRangeLogs.logs.length;

    console.log(`Error rate over past week: ${(errorRate * 100).toFixed(2)}%`);

    return {
      error_logs: errorLogs.total,
      error_by_endpoint: errorByEndpoint,
      error_rate: errorRate
    };
  } catch (error) {
    console.error('Error in error analysis:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  createAPILogExample,
  queryAPILogsExample,
  getAPILogByCodeExample,
  getLogsByEndpointExample,
  getLogsByUserExample,
  getLogsByTimeRangeExample,
  getAPIUsageStatsExample,
  cleanupOldLogsExample,
  batchCreateAPILogsExample,
  apiRequestLoggingSimulationExample,
  errorAnalysisExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running API Logs Examples...\n');

  // Run examples sequentially
  (async () => {
    try {
      console.log('1. Creating API log...');
      await createAPILogExample();

      console.log('\n2. Querying API logs...');
      await queryAPILogsExample();

      console.log('\n3. Getting API log by code...');
      await getAPILogByCodeExample();

      console.log('\n4. Getting logs by endpoint...');
      await getLogsByEndpointExample();

      console.log('\n5. Getting logs by user...');
      await getLogsByUserExample();

      console.log('\n6. Getting logs by time range...');
      await getLogsByTimeRangeExample();

      console.log('\n7. Getting API usage stats...');
      await getAPIUsageStatsExample();

      console.log('\n8. API request logging simulation...');
      await apiRequestLoggingSimulationExample();

      console.log('\n9. Error analysis...');
      await errorAnalysisExample();

      console.log('\nAll examples completed successfully!');
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}