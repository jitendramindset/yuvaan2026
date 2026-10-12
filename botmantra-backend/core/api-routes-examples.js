/**
 * API Routes Node Examples
 * Comprehensive usage examples for node-based API route configuration
 */

const { apiRoutesNode } = require('../core/api-routes');

// ============================================================
// BASIC API ROUTE OPERATIONS
// ============================================================

/**
 * Example 1: Create a new API route
 */
async function createAPIRouteExample() {
  try {
    const routeData = {
      path: '/api/users',
      method: 'GET',
      description: 'Get list of users',
      required_permissions: ['users.read'],
      rate_limit: {
        requests_per_minute: 60,
        requests_per_hour: 1000
      },
      authentication_required: true,
      is_active: true,
      created_by: 'admin_user',
      tags: ['users', 'read']
    };

    const result = await apiRoutesNode.createAPIRoute(routeData, 'route_users_get');

    console.log('API route created:', result);
    return result;
  } catch (error) {
    console.error('Error creating API route:', error);
  }
}

/**
 * Example 2: Get route by path and method
 */
async function getAPIRouteExample() {
  try {
    const path = '/api/users';
    const method = 'GET';

    const route = await apiRoutesNode.getAPIRoute(path, method);

    if (route) {
      console.log('API route found:', route);
    } else {
      console.log('API route not found');
    }

    return route;
  } catch (error) {
    console.error('Error getting API route:', error);
  }
}

/**
 * Example 3: Check route permissions
 */
async function checkRoutePermissionsExample() {
  try {
    const path = '/api/users';
    const method = 'GET';
    const userPermissions = ['users.read', 'admin'];

    const result = await apiRoutesNode.checkRoutePermissions(path, method, userPermissions);

    console.log('Permission check result:', result);
    return result;
  } catch (error) {
    console.error('Error checking route permissions:', error);
  }
}

/**
 * Example 4: Query API routes with filters
 */
async function queryAPIRoutesExample() {
  try {
    const criteria = {
      is_active: true,
      authentication_required: true
    };

    const options = {
      limit: 20,
      offset: 0,
      sort: 'path',
      order: 'asc'
    };

    const result = await apiRoutesNode.queryAPIRoutes(criteria, options);

    console.log(`Found ${result.total} API routes:`, result.routes);
    return result;
  } catch (error) {
    console.error('Error querying API routes:', error);
  }
}

/**
 * Example 5: Update route configuration
 */
async function updateAPIRouteExample() {
  try {
    const path = '/api/users';
    const method = 'GET';
    const updates = {
      description: 'Get paginated list of users',
      rate_limit: {
        requests_per_minute: 120,
        requests_per_hour: 2000
      },
      tags: ['users', 'read', 'pagination']
    };

    const result = await apiRoutesNode.updateAPIRoute(path, method, updates);

    console.log('API route updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating API route:', error);
  }
}

// ============================================================
// ROUTE MANAGEMENT OPERATIONS
// ============================================================

/**
 * Example 6: Deactivate a route
 */
async function deactivateAPIRouteExample() {
  try {
    const path = '/api/admin/users';
    const method = 'DELETE';

    const result = await apiRoutesNode.deactivateAPIRoute(path, method);

    console.log('API route deactivated:', result);
    return result;
  } catch (error) {
    console.error('Error deactivating API route:', error);
  }
}

/**
 * Example 7: Get routes by tags
 */
async function getRoutesByTagsExample() {
  try {
    const tags = ['users', 'admin'];
    const options = {
      limit: 50,
      sort: 'path'
    };

    const result = await apiRoutesNode.getRoutesByTags(tags, options);

    console.log(`Found ${result.total} routes with tags ${tags.join(', ')}:`, result.routes);
    return result;
  } catch (error) {
    console.error('Error getting routes by tags:', error);
  }
}

/**
 * Example 8: Get routes by permissions
 */
async function getRoutesByPermissionsExample() {
  try {
    const permissions = ['users.read'];
    const options = {
      limit: 30
    };

    const result = await apiRoutesNode.getRoutesByPermissions(permissions, options);

    console.log(`Found ${result.total} routes requiring permissions ${permissions.join(', ')}:`, result.routes);
    return result;
  } catch (error) {
    console.error('Error getting routes by permissions:', error);
  }
}

/**
 * Example 9: Get route statistics
 */
async function getRouteStatsExample() {
  try {
    const stats = await apiRoutesNode.getRouteStats();

    console.log('API route statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting route stats:', error);
  }
}

// ============================================================
// ADVANCED ROUTE CONFIGURATION
// ============================================================

/**
 * Example 10: Create multiple related routes
 */
async function createRelatedRoutesExample() {
  try {
    const userRoutes = [
      {
        path: '/api/users',
        method: 'GET',
        description: 'List users',
        required_permissions: ['users.read'],
        rate_limit: { requests_per_minute: 60 },
        authentication_required: true,
        tags: ['users', 'read']
      },
      {
        path: '/api/users',
        method: 'POST',
        description: 'Create user',
        required_permissions: ['users.create'],
        rate_limit: { requests_per_minute: 30 },
        authentication_required: true,
        tags: ['users', 'create']
      },
      {
        path: '/api/users/:id',
        method: 'GET',
        description: 'Get user by ID',
        required_permissions: ['users.read'],
        rate_limit: { requests_per_minute: 120 },
        authentication_required: true,
        tags: ['users', 'read']
      },
      {
        path: '/api/users/:id',
        method: 'PUT',
        description: 'Update user',
        required_permissions: ['users.update'],
        rate_limit: { requests_per_minute: 30 },
        authentication_required: true,
        tags: ['users', 'update']
      },
      {
        path: '/api/users/:id',
        method: 'DELETE',
        description: 'Delete user',
        required_permissions: ['users.delete'],
        rate_limit: { requests_per_minute: 10 },
        authentication_required: true,
        tags: ['users', 'delete']
      }
    ];

    const createdRoutes = [];

    for (let i = 0; i < userRoutes.length; i++) {
      const route = userRoutes[i];
      try {
        const result = await apiRoutesNode.createAPIRoute(route, `user_route_${i + 1}`);
        createdRoutes.push(result);
        console.log(`Created route: ${route.method} ${route.path}`);
      } catch (error) {
        console.error(`Error creating route ${route.method} ${route.path}:`, error);
      }
    }

    console.log(`Successfully created ${createdRoutes.length} user routes`);
    return createdRoutes;
  } catch (error) {
    console.error('Error creating related routes:', error);
  }
}

/**
 * Example 11: Route permission matrix
 */
async function routePermissionMatrixExample() {
  try {
    console.log('Building route permission matrix...');

    // Get all active routes
    const allRoutes = await apiRoutesNode.queryAPIRoutes({ is_active: true }, { limit: 100 });

    // Group routes by resource
    const permissionMatrix = {};

    for (const route of allRoutes.routes) {
      const record = route.database_record;
      const resource = record.path.split('/')[2]; // Extract resource from path like /api/users

      if (!permissionMatrix[resource]) {
        permissionMatrix[resource] = {};
      }

      const method = record.method.toLowerCase();
      permissionMatrix[resource][method] = {
        path: record.path,
        permissions: record.required_permissions,
        auth_required: record.authentication_required,
        rate_limit: record.rate_limit
      };
    }

    console.log('Route permission matrix:');
    Object.keys(permissionMatrix).forEach(resource => {
      console.log(`\n${resource.toUpperCase()}:`);
      Object.keys(permissionMatrix[resource]).forEach(method => {
        const route = permissionMatrix[resource][method];
        console.log(`  ${method.toUpperCase()} ${route.path}`);
        console.log(`    Permissions: ${route.permissions.join(', ')}`);
        console.log(`    Auth Required: ${route.auth_required}`);
        console.log(`    Rate Limit: ${route.rate_limit.requests_per_minute}/min`);
      });
    });

    return permissionMatrix;
  } catch (error) {
    console.error('Error building permission matrix:', error);
  }
}

/**
 * Example 12: Route access control simulation
 */
async function routeAccessControlSimulationExample() {
  try {
    const users = [
      {
        id: 'user_regular',
        permissions: ['users.read', 'posts.read'],
        role: 'Regular User'
      },
      {
        id: 'user_moderator',
        permissions: ['users.read', 'users.update', 'posts.read', 'posts.update', 'posts.delete'],
        role: 'Moderator'
      },
      {
        id: 'user_admin',
        permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'posts.read', 'posts.create', 'posts.update', 'posts.delete', 'admin'],
        role: 'Administrator'
      }
    ];

    const testRoutes = [
      { path: '/api/users', method: 'GET' },
      { path: '/api/users', method: 'POST' },
      { path: '/api/users/123', method: 'PUT' },
      { path: '/api/users/123', method: 'DELETE' },
      { path: '/api/posts', method: 'GET' },
      { path: '/api/posts', method: 'POST' },
      { path: '/api/admin/users', method: 'GET' }
    ];

    console.log('Simulating route access control...\n');

    const results = {};

    for (const user of users) {
      console.log(`${user.role} (${user.id}):`);
      results[user.id] = {};

      for (const route of testRoutes) {
        const access = await apiRoutesNode.checkRoutePermissions(route.path, route.method, user.permissions);
        const status = access.allowed ? '✓ ALLOWED' : '✗ DENIED';

        console.log(`  ${route.method} ${route.path}: ${status}`);
        results[user.id][`${route.method} ${route.path}`] = access.allowed;
      }

      console.log('');
    }

    return results;
  } catch (error) {
    console.error('Error in access control simulation:', error);
  }
}

/**
 * Example 13: Route configuration backup and restore
 */
async function routeConfigurationBackupExample() {
  try {
    console.log('Creating route configuration backup...');

    // Get all routes
    const allRoutes = await apiRoutesNode.queryAPIRoutes({}, { limit: 1000 });

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      total_routes: allRoutes.total,
      routes: allRoutes.routes.map(route => ({
        node_code: route.node_code,
        database_record: route.database_record
      }))
    };

    console.log(`Backup created with ${backup.total_routes} routes`);

    // Simulate restore (in real scenario, this would be saved to file/database)
    console.log('Simulating restore from backup...');

    let restored = 0;
    for (const route of backup.routes) {
      try {
        // In a real restore, you'd check if route exists and update or create
        console.log(`Would restore: ${route.database_record.method} ${route.database_record.path}`);
        restored++;
      } catch (error) {
        console.error(`Error restoring route ${route.node_code}:`, error);
      }
    }

    console.log(`Restore simulation completed: ${restored} routes processed`);

    return {
      backup_created: true,
      total_routes: backup.total_routes,
      restore_simulated: restored
    };
  } catch (error) {
    console.error('Error in backup/restore:', error);
  }
}

/**
 * Example 14: Route performance monitoring setup
 */
async function routePerformanceMonitoringExample() {
  try {
    console.log('Setting up route performance monitoring...');

    // Get all active routes
    const activeRoutes = await apiRoutesNode.queryAPIRoutes({ is_active: true }, { limit: 100 });

    const monitoringConfig = {
      routes: [],
      alerts: [],
      metrics: []
    };

    for (const route of activeRoutes.routes) {
      const record = route.database_record;

      monitoringConfig.routes.push({
        path: record.path,
        method: record.method,
        rate_limit: record.rate_limit,
        monitoring: {
          response_time_threshold: 1000, // ms
          error_rate_threshold: 0.05, // 5%
          throughput_threshold: record.rate_limit.requests_per_minute * 0.8
        }
      });

      // Set up alerts for critical routes
      if (record.tags.includes('admin') || record.path.includes('admin')) {
        monitoringConfig.alerts.push({
          route: `${record.method} ${record.path}`,
          conditions: [
            { type: 'response_time', threshold: 2000, severity: 'critical' },
            { type: 'error_rate', threshold: 0.1, severity: 'high' },
            { type: 'unauthorized_access', threshold: 1, severity: 'critical' }
          ]
        });
      }
    }

    monitoringConfig.metrics = [
      'response_time',
      'error_rate',
      'throughput',
      'success_rate',
      'authentication_failures'
    ];

    console.log('Performance monitoring configuration:');
    console.log(`- Routes monitored: ${monitoringConfig.routes.length}`);
    console.log(`- Alerts configured: ${monitoringConfig.alerts.length}`);
    console.log(`- Metrics tracked: ${monitoringConfig.metrics.join(', ')}`);

    return monitoringConfig;
  } catch (error) {
    console.error('Error setting up performance monitoring:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  createAPIRouteExample,
  getAPIRouteExample,
  checkRoutePermissionsExample,
  queryAPIRoutesExample,
  updateAPIRouteExample,
  deactivateAPIRouteExample,
  getRoutesByTagsExample,
  getRoutesByPermissionsExample,
  getRouteStatsExample,
  createRelatedRoutesExample,
  routePermissionMatrixExample,
  routeAccessControlSimulationExample,
  routeConfigurationBackupExample,
  routePerformanceMonitoringExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running API Routes Examples...\n');

  // Run examples sequentially
  (async () => {
    try {
      console.log('1. Creating API route...');
      await createAPIRouteExample();

      console.log('\n2. Getting API route...');
      await getAPIRouteExample();

      console.log('\n3. Checking route permissions...');
      await checkRoutePermissionsExample();

      console.log('\n4. Querying API routes...');
      await queryAPIRoutesExample();

      console.log('\n5. Updating API route...');
      await updateAPIRouteExample();

      console.log('\n6. Getting routes by tags...');
      await getRoutesByTagsExample();

      console.log('\n7. Getting routes by permissions...');
      await getRoutesByPermissionsExample();

      console.log('\n8. Getting route stats...');
      await getRouteStatsExample();

      console.log('\n9. Creating related routes...');
      await createRelatedRoutesExample();

      console.log('\n10. Building permission matrix...');
      await routePermissionMatrixExample();

      console.log('\n11. Access control simulation...');
      await routeAccessControlSimulationExample();

      console.log('\n12. Configuration backup...');
      await routeConfigurationBackupExample();

      console.log('\n13. Performance monitoring setup...');
      await routePerformanceMonitoringExample();

      console.log('\nAll examples completed successfully!');
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}