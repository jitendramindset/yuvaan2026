/**
 * AI Preferences Node Routes
 * REST API for node-based AI preferences management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { AIPreferencesNode } = require('../core/ai-preferences');

// Initialize the AI preferences node
const aiPreferencesNode = new AIPreferencesNode(require('../config/supabase').supabase);

// ============================================================
// CREATE - Create new AI preferences entry
// ============================================================
router.post('/ai-preferences', authenticate, async (req, res) => {
  try {
    const preferencesData = {
      user_id: req.user.id,
      preferences: req.body.preferences || {}
    };

    const result = await aiPreferencesNode.createPreferences(preferencesData, req.body.node_code);

    res.status(201).json({
      success: true,
      message: 'AI preferences created successfully',
      data: result
    });
  } catch (error) {
    console.error('AI preferences CREATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// QUERY - Query AI preferences entries
// ============================================================
router.get('/ai-preferences', authenticate, async (req, res) => {
  try {
    const criteria = {};
    const options = {};

    // Users can only query their own preferences
    criteria.user_id = req.user.id;

    options.limit = parseInt(req.query.limit) || 50;
    options.offset = parseInt(req.query.offset) || 0;
    options.sort = req.query.sort || 'updated_at';
    options.order = req.query.order || 'desc';

    const result = await aiPreferencesNode.queryPreferences(criteria, options);

    res.json({
      success: true,
      data: result.preferences,
      nodes: result.nodes,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('AI preferences QUERY error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET CURRENT USER PREFERENCES - Get current user's preferences
// ============================================================
router.get('/ai-preferences/me', authenticate, async (req, res) => {
  try {
    const result = await aiPreferencesNode.getUserPreferences(req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No preferences found for user'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI preferences GET ME error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET BY ID - Get specific preferences entry
// ============================================================
router.get('/ai-preferences/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const criteria = {
      node_code: nodeCode,
      user_id: req.user.id
    };

    const result = await aiPreferencesNode.queryPreferences(criteria, { limit: 1 });

    if (result.preferences.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preferences entry not found'
      });
    }

    res.json({
      success: true,
      data: result.preferences[0],
      node: result.nodes[0]
    });
  } catch (error) {
    console.error('AI preferences GET BY ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE - Update preferences entry
// ============================================================
router.put('/ai-preferences/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.node_code;
    delete updateData.id;
    delete updateData.user_id;

    const result = await aiPreferencesNode.updatePreferences(nodeCode, updateData);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: result
    });
  } catch (error) {
    console.error('AI preferences UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// UPDATE USER PREFERENCES - Upsert current user's preferences
// ============================================================
router.put('/ai-preferences/me', authenticate, async (req, res) => {
  try {
    const { preferences, node_code } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Valid preferences object is required'
      });
    }

    const result = await aiPreferencesNode.updateUserPreferences(req.user.id, preferences, node_code);

    res.json({
      success: true,
      message: 'User preferences updated successfully',
      data: result
    });
  } catch (error) {
    console.error('AI preferences UPDATE ME error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET PREFERENCE VALUE - Get specific preference value
// ============================================================
router.get('/ai-preferences/me/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    const { default: defaultValue } = req.query;

    const value = await aiPreferencesNode.getPreferenceValue(req.user.id, key, defaultValue);

    res.json({
      success: true,
      key,
      value,
      found: value !== null && value !== undefined
    });
  } catch (error) {
    console.error('AI preferences GET VALUE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// SET PREFERENCE VALUE - Set specific preference value
// ============================================================
router.put('/ai-preferences/me/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, node_code } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Value is required'
      });
    }

    const result = await aiPreferencesNode.setPreferenceValue(req.user.id, key, value, node_code);

    res.json({
      success: true,
      message: `Preference '${key}' updated successfully`,
      data: result
    });
  } catch (error) {
    console.error('AI preferences SET VALUE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET STATS - Get preferences statistics
// ============================================================
router.get('/ai-preferences/stats', authenticate, async (req, res) => {
  try {
    const stats = await aiPreferencesNode.getPreferencesStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI preferences GET STATS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// EXPORT - Export user preferences
// ============================================================
router.get('/ai-preferences/export', authenticate, async (req, res) => {
  try {
    const exportData = await aiPreferencesNode.exportUserPreferences(req.user.id);

    if (!exportData) {
      return res.status(404).json({
        success: false,
        error: 'No preferences found to export'
      });
    }

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('AI preferences EXPORT error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// IMPORT - Import user preferences
// ============================================================
router.post('/ai-preferences/import', authenticate, async (req, res) => {
  try {
    const { preferences, node_code } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Valid preferences object is required'
      });
    }

    const importData = {
      user_id: req.user.id,
      preferences
    };

    const result = await aiPreferencesNode.importUserPreferences(importData, node_code);

    res.status(201).json({
      success: true,
      message: 'Preferences imported successfully',
      data: result
    });
  } catch (error) {
    console.error('AI preferences IMPORT error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BATCH UPDATE - Update preferences for multiple users (admin only)
// ============================================================
router.post('/ai-preferences/batch', authenticate, async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid updates array is required'
      });
    }

    const results = await aiPreferencesNode.batchUpdatePreferences(updates);

    res.status(200).json({
      success: true,
      message: `Processed ${results.total_processed} updates: ${results.success_count} successful, ${results.error_count} failed`,
      data: results
    });
  } catch (error) {
    console.error('AI preferences BATCH UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE - Delete preferences entry
// ============================================================
router.delete('/ai-preferences/:nodeCode', authenticate, async (req, res) => {
  try {
    const { nodeCode } = req.params;

    // First check if the entry belongs to the user
    const criteria = {
      node_code: nodeCode,
      user_id: req.user.id
    };

    const existing = await aiPreferencesNode.queryPreferences(criteria, { limit: 1 });

    if (existing.preferences.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preferences entry not found or unauthorized'
      });
    }

    await aiPreferencesNode.deletePreferences(nodeCode);

    res.json({
      success: true,
      message: 'Preferences entry deleted successfully'
    });
  } catch (error) {
    console.error('AI preferences DELETE error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;