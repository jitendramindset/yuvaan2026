/**
 * AI Knowledge Base Node Routes
 * REST API endpoints for AI Knowledge Base Management
 */

const express = require('express');
const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/ai-knowledge-base
 * Create a new AI knowledge base entry
 */
router.post('/', async (req, res) => {
  try {
    const {
      business_id,
      source_type,
      source_id,
      content,
      embedding,
      metadata,
      is_active,
      doc_id,
      heading,
      sub_heading,
      chunk_index,
      user_id,
      node_code
    } = req.body;

    if (!business_id || !source_type || !source_id || !content || !doc_id) {
      return res.status(400).json({
        error: 'Missing required fields: business_id, source_type, source_id, content, doc_id'
      });
    }

    const knowledgeData = {
      business_id,
      source_type,
      source_id,
      content,
      embedding: embedding || [],
      metadata: metadata || {},
      is_active: is_active !== false,
      doc_id,
      heading: heading || '',
      sub_heading: sub_heading || '',
      chunk_index: chunk_index || 0,
      user_id: user_id || req.user?.id
    };

    const result = await aiKnowledgeBaseNode.createKnowledgeEntry(knowledgeData, node_code);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    res.status(500).json({
      error: 'Failed to create knowledge entry',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-knowledge-base
 * Query AI knowledge base entries with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      business_id,
      source_type,
      source_id,
      doc_id,
      is_active,
      user_id,
      limit,
      offset
    } = req.query;

    const criteria = {};
    if (business_id) criteria.business_id = business_id;
    if (source_type) criteria.source_type = source_type;
    if (source_id) criteria.source_id = source_id;
    if (doc_id) criteria.doc_id = doc_id;
    if (is_active !== undefined) criteria.is_active = is_active === 'true';
    if (user_id) criteria.user_id = user_id;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries(criteria, options);

    res.json({
      success: true,
      data: entries,
      count: entries.length
    });
  } catch (error) {
    console.error('Error querying knowledge entries:', error);
    res.status(500).json({
      error: 'Failed to query knowledge entries',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-knowledge-base/:nodeCode
 * Get a specific knowledge base entry by node code
 */
router.get('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries();
    const entry = entries.find(node => node.node_code === nodeCode);

    if (!entry) {
      return res.status(404).json({
        error: 'Knowledge entry not found'
      });
    }

    // Increment access count
    await aiKnowledgeBaseNode.incrementAccessCount(nodeCode);

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error getting knowledge entry:', error);
    res.status(500).json({
      error: 'Failed to get knowledge entry',
      details: error.message
    });
  }
});

/**
 * PUT /api/ai-knowledge-base/:nodeCode
 * Update a knowledge base entry
 */
router.put('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const updateData = req.body;

    const result = await aiKnowledgeBaseNode.updateKnowledgeEntry(nodeCode, updateData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    res.status(500).json({
      error: 'Failed to update knowledge entry',
      details: error.message
    });
  }
});

/**
 * PATCH /api/ai-knowledge-base/:nodeCode/access
 * Increment access count for a knowledge entry
 */
router.patch('/:nodeCode/access', async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const result = await aiKnowledgeBaseNode.incrementAccessCount(nodeCode);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error incrementing access count:', error);
    res.status(500).json({
      error: 'Failed to increment access count',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-knowledge-base/search/similarity
 * Search knowledge base by semantic similarity
 */
router.post('/search/similarity', async (req, res) => {
  try {
    const { embedding, filters, limit } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({
        error: 'Embedding vector is required and must be an array'
      });
    }

    const results = await aiKnowledgeBaseNode.searchBySimilarity(
      embedding,
      filters || {},
      limit || 10
    );

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching by similarity:', error);
    res.status(500).json({
      error: 'Failed to search by similarity',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-knowledge-base/search/text
 * Search knowledge base by text content
 */
router.get('/search/text', async (req, res) => {
  try {
    const { q: query, business_id, source_type, limit } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Search query parameter "q" is required'
      });
    }

    const filters = {};
    if (business_id) filters.business_id = business_id;
    if (source_type) filters.source_type = source_type;

    const results = await aiKnowledgeBaseNode.searchByText(
      query,
      filters,
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      data: results,
      count: results.length,
      query
    });
  } catch (error) {
    console.error('Error searching by text:', error);
    res.status(500).json({
      error: 'Failed to search by text',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-knowledge-base/document/:docId
 * Get all knowledge entries for a specific document
 */
router.get('/document/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const { limit, offset } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const entries = await aiKnowledgeBaseNode.getEntriesByDocument(docId, options);

    res.json({
      success: true,
      data: entries,
      count: entries.length,
      doc_id: docId
    });
  } catch (error) {
    console.error('Error getting entries by document:', error);
    res.status(500).json({
      error: 'Failed to get entries by document',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-knowledge-base/business/:businessId
 * Get all knowledge entries for a specific business
 */
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit, offset } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const entries = await aiKnowledgeBaseNode.getEntriesByBusiness(businessId, options);

    res.json({
      success: true,
      data: entries,
      count: entries.length,
      business_id: businessId
    });
  } catch (error) {
    console.error('Error getting entries by business:', error);
    res.status(500).json({
      error: 'Failed to get entries by business',
      details: error.message
    });
  }
});

/**
 * DELETE /api/ai-knowledge-base/:nodeCode
 * Delete a knowledge base entry (soft delete)
 */
router.delete('/:nodeCode', async (req, res) => {
  try {
    const { nodeCode } = req.params;

    const success = await aiKnowledgeBaseNode.deleteKnowledgeEntry(nodeCode);

    res.json({
      success,
      message: 'Knowledge entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    res.status(500).json({
      error: 'Failed to delete knowledge entry',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-knowledge-base/stats
 * Get knowledge base statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { business_id } = req.query;

    const stats = await aiKnowledgeBaseNode.getKnowledgeStats(business_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting knowledge stats:', error);
    res.status(500).json({
      error: 'Failed to get knowledge stats',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-knowledge-base/batch
 * Create multiple knowledge entries in batch
 */
router.post('/batch', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: 'Entries array is required and must not be empty'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < entries.length; i++) {
      try {
        const entry = entries[i];
        const result = await aiKnowledgeBaseNode.createKnowledgeEntry(entry);
        results.push(result);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          entry: entries[i]
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error) {
    console.error('Error in batch creation:', error);
    res.status(500).json({
      error: 'Failed to process batch creation',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-knowledge-base/:nodeCode/clone
 * Clone a knowledge entry with modifications
 */
router.post('/:nodeCode/clone', async (req, res) => {
  try {
    const { nodeCode } = req.params;
    const { modifications } = req.body;

    // Get the original entry
    const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries();
    const originalEntry = entries.find(node => node.node_code === nodeCode);

    if (!originalEntry) {
      return res.status(404).json({
        error: 'Original knowledge entry not found'
      });
    }

    // Create cloned entry data
    const clonedData = {
      business_id: modifications.business_id || originalEntry.metadata.business_id,
      source_type: modifications.source_type || originalEntry.metadata.source_type,
      source_id: modifications.source_id || `${originalEntry.metadata.source_id}-clone`,
      content: modifications.content || originalEntry.metadata.content,
      embedding: modifications.embedding || originalEntry.metadata.embedding,
      metadata: {
        ...originalEntry.metadata,
        cloned_from: nodeCode,
        cloned_at: new Date().toISOString(),
        ...modifications.metadata
      },
      is_active: modifications.is_active !== undefined ? modifications.is_active : originalEntry.metadata.is_active,
      doc_id: modifications.doc_id || `${originalEntry.metadata.doc_id}-clone`,
      heading: modifications.heading || originalEntry.metadata.heading,
      sub_heading: modifications.sub_heading || originalEntry.metadata.sub_heading,
      chunk_index: modifications.chunk_index !== undefined ? modifications.chunk_index : originalEntry.metadata.chunk_index,
      user_id: modifications.user_id || originalEntry.metadata.user_id
    };

    const result = await aiKnowledgeBaseNode.createKnowledgeEntry(clonedData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Knowledge entry cloned successfully'
    });
  } catch (error) {
    console.error('Error cloning knowledge entry:', error);
    res.status(500).json({
      error: 'Failed to clone knowledge entry',
      details: error.message
    });
  }
});

module.exports = router;