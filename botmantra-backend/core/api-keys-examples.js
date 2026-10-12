/**
 * API Keys Node Examples
 * Comprehensive usage examples for node-based API key management
 */

const { apiKeysNode } = require('../core/api-keys');

// ============================================================
// BASIC API KEY OPERATIONS
// ============================================================

/**
 * Example 1: Create a new API key
 */
async function createAPIKeyExample() {
  try {
    const keyData = {
      owner_id: 'user_12345',
      api_key_hash: 'hashed_api_key_abcdef123456',
      scope: 'read',
      rate_limit: 1000,
      is_active: true
    };

    const result = await apiKeysNode.createAPIKey(keyData, 'api_key_001');

    console.log('API key created:', result);
    return result;
  } catch (error) {
    console.error('Error creating API key:', error);
  }
}

/**
 * Example 2: Query API keys with filters
 */
async function queryAPIKeysExample() {
  try {
    // Query active read-scope keys for a user
    const criteria = {
      owner_id: 'user_12345',
      scope: 'read',
      is_active: true
    };

    const options = {
      limit: 10,
      offset: 0,
      sort: 'created_at',
      order: 'desc'
    };

    const result = await apiKeysNode.queryAPIKeys(criteria, options);

    console.log(`Found ${result.total} API keys:`, result.keys);
    return result;
  } catch (error) {
    console.error('Error querying API keys:', error);
  }
}

/**
 * Example 3: Get API key by node code
 */
async function getAPIKeyByCodeExample() {
  try {
    const nodeCode = 'api_key_001';
    const ownerId = 'user_12345';

    const key = await apiKeysNode.getAPIKey(nodeCode, ownerId);

    if (key) {
      console.log('API key found:', key);
    } else {
      console.log('API key not found');
    }

    return key;
  } catch (error) {
    console.error('Error getting API key:', error);
  }
}

/**
 * Example 4: Update API key properties
 */
async function updateAPIKeyExample() {
  try {
    const nodeCode = 'api_key_001';
    const updateData = {
      scope: 'admin',
      rate_limit: 5000,
      is_active: true
    };

    const result = await apiKeysNode.updateAPIKey(nodeCode, updateData);

    console.log('API key updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating API key:', error);
  }
}

/**
 * Example 5: Validate API key hash
 */
async function validateAPIKeyExample() {
  try {
    const apiKeyHash = 'hashed_api_key_abcdef123456';
    const scope = 'read';

    const result = await apiKeysNode.validateAPIKey(apiKeyHash, scope);

    console.log('API key validation result:', result);
    return result;
  } catch (error) {
    console.error('Error validating API key:', error);
  }
}

// ============================================================
// API KEY MANAGEMENT OPERATIONS
// ============================================================

/**
 * Example 6: Get API key statistics
 */
async function getAPIKeyStatsExample() {
  try {
    const ownerId = 'user_12345';

    const stats = await apiKeysNode.getAPIKeyStats(ownerId);

    console.log('API key statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting API key stats:', error);
  }
}

/**
 * Example 7: Deactivate API key
 */
async function deactivateAPIKeyExample() {
  try {
    const nodeCode = 'api_key_001';
    const updateData = {
      is_active: false
    };

    const result = await apiKeysNode.updateAPIKey(nodeCode, updateData);

    console.log('API key deactivated:', result);
    return result;
  } catch (error) {
    console.error('Error deactivating API key:', error);
  }
}

/**
 * Example 8: Delete API key
 */
async function deleteAPIKeyExample() {
  try {
    const nodeCode = 'api_key_001';

    await apiKeysNode.deleteAPIKey(nodeCode);

    console.log('API key deleted successfully');
    return { deleted: true };
  } catch (error) {
    console.error('Error deleting API key:', error);
  }
}

// ============================================================
// ADVANCED API KEY OPERATIONS
// ============================================================

/**
 * Example 9: Batch create API keys
 */
async function batchCreateAPIKeysExample() {
  try {
    const keys = [
      {
        owner_id: 'user_12345',
        api_key_hash: 'hash_key_001',
        scope: 'read',
        rate_limit: 1000,
        node_code: 'batch_key_001'
      },
      {
        owner_id: 'user_12345',
        api_key_hash: 'hash_key_002',
        scope: 'write',
        rate_limit: 500,
        node_code: 'batch_key_002'
      },
      {
        owner_id: 'user_12345',
        api_key_hash: 'hash_key_003',
        scope: 'admin',
        rate_limit: 10000,
        node_code: 'batch_key_003'
      }
    ];

    const results = [];
    const errors = [];

    for (const keyData of keys) {
      try {
        const result = await apiKeysNode.createAPIKey(keyData, keyData.node_code);
        results.push(result);
      } catch (keyError) {
        errors.push({
          key: keyData,
          error: keyError.message
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
 * Example 10: API Key Lifecycle Management
 */
async function apiKeyLifecycleExample() {
  try {
    // Create a new API key
    console.log('1. Creating API key...');
    const keyData = {
      owner_id: 'user_12345',
      api_key_hash: 'lifecycle_key_123',
      scope: 'read',
      rate_limit: 1000,
      is_active: true
    };

    const created = await apiKeysNode.createAPIKey(keyData, 'lifecycle_key');
    console.log('Created:', created.node.node_code);

    // Update the key
    console.log('2. Updating API key...');
    const updated = await apiKeysNode.updateAPIKey('lifecycle_key', {
      scope: 'write',
      rate_limit: 2000
    });
    console.log('Updated scope to:', updated.data.scope);

    // Validate the key
    console.log('3. Validating API key...');
    const validation = await apiKeysNode.validateAPIKey('lifecycle_key_123', 'write');
    console.log('Validation result:', validation.valid);

    // Get statistics
    console.log('4. Getting statistics...');
    const stats = await apiKeysNode.getAPIKeyStats('user_12345');
    console.log('Total keys:', stats.total_keys);

    // Deactivate the key
    console.log('5. Deactivating API key...');
    await apiKeysNode.updateAPIKey('lifecycle_key', { is_active: false });
    console.log('Key deactivated');

    // Try to validate deactivated key
    console.log('6. Validating deactivated key...');
    const deactivatedValidation = await apiKeysNode.validateAPIKey('lifecycle_key_123');
    console.log('Deactivated key validation:', deactivatedValidation.valid);

    // Delete the key
    console.log('7. Deleting API key...');
    await apiKeysNode.deleteAPIKey('lifecycle_key');
    console.log('Key deleted');

    return { completed: true };
  } catch (error) {
    console.error('Error in lifecycle example:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  createAPIKeyExample,
  queryAPIKeysExample,
  getAPIKeyByCodeExample,
  updateAPIKeyExample,
  validateAPIKeyExample,
  getAPIKeyStatsExample,
  deactivateAPIKeyExample,
  deleteAPIKeyExample,
  batchCreateAPIKeysExample,
  apiKeyLifecycleExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running API Keys Examples...\n');

  // Run examples sequentially
  (async () => {
    try {
      console.log('1. Creating API key...');
      await createAPIKeyExample();

      console.log('\n2. Querying API keys...');
      await queryAPIKeysExample();

      console.log('\n3. Getting API key by code...');
      await getAPIKeyByCodeExample();

      console.log('\n4. Updating API key...');
      await updateAPIKeyExample();

      console.log('\n5. Validating API key...');
      await validateAPIKeyExample();

      console.log('\n6. Getting API key stats...');
      await getAPIKeyStatsExample();

      console.log('\n7. API Key lifecycle management...');
      await apiKeyLifecycleExample();

      console.log('\nAll examples completed successfully!');
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}