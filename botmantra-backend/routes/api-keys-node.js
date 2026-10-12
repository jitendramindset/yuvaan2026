/**
 * API Keys Node Routes
 * REST API for node-based API key management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { apiKeysNode } = require('../core/api-keys');

// ============================================================
// CREATE - Create new API key
// ============================================================
router.post('/api-keys', authenticate, async (req, res) => {
  try {
    const keyData = {
      owner_id: req.user.id,
      api_key_hash: req.body.api_key_hash,
      scope: req.body.scope || 'read',
      rate_limit: req.body.rate_limit || 1000,
      is_active: req.body.is_active !== false
    };

    const result = await apiKeysNode.createAPIKey(keyData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: result
    });
  } catch (error) {
    console.error('API Keys CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query API keys
// ============================================================
router.get('/api-keys', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    if (req.query.scope) criteria.scope = req.query.scope;
    if (req.query.is_active !== undefined) criteria.is_active = req.query.is_active === 'true';

    // Security: Users can only query their own keys
    criteria.owner_id = req.user.id;

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'created_at';
    options.order = req.query.order || 'desc';

    const result = await apiKeysNode.queryAPIKeys(criteria, options);

    res.json({
      success: true,
      data: result.keys,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('API Keys QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific API key
// ============================================================
router.get('/api-keys/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const key = await apiKeysNode.getAPIKey(nodeCode, req.user.id);

    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.json({
      success: true,
      data: key
    });
  } catch (error) {
    console.error('API Keys GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update API key
// ============================================================
router.put('/api-keys/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.node_code;
    delete updateData.owner_id;
    delete updateData.created_at;

    // Add last modified timestamp
    updateData.last_modified = new Date().toISOString();

    const result = await apiKeysNode.updateAPIKey(nodeCode, updateData);

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: result
    });
  } catch (error) {
    console.error('API Keys UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// VALIDATE - Validate API key hash
// ============================================================
router.post('/api-keys/validate', authenticate, async (req, res) => {
  try {
    const { api_key_hash, scope } = req.body;

    if (!api_key_hash) {
      return res.status(400).json({
        success: false,
        error: 'api_key_hash is required'
      });
    }

    const result = await apiKeysNode.validateAPIKey(api_key_hash, scope);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('API Keys VALIDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// STATS - Get API key statistics
// ============================================================
router.get('/api-keys/stats', authenticate, async (req, res) => {
  try {
    const stats = await apiKeysNode.getAPIKeyStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('API Keys STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete API key
// ============================================================
router.delete('/api-keys/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // First check if the key belongs to the user
    const existing = await apiKeysNode.getAPIKey(nodeCode, req.user.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'API key not found or unauthorized'
      });
    }

    await apiKeysNode.deleteAPIKey(nodeCode);

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('API Keys DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH CREATE - Create multiple API keys
// ============================================================
router.post('/api-keys/batch', authenticate, async (req, res) => {
  try {
    const { keys } = req.body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid keys array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const keyData of keys) {
      try {
        const data = {
          owner_id: req.user.id,
          ...keyData
        };

        const result = await apiKeysNode.createAPIKey(data, keyData.node_code);
        results.push(result);
      } catch (keyError) {
        errors.push({
          key: keyData,
          error: keyError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.length} API keys${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        created: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('API Keys BATCH CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;