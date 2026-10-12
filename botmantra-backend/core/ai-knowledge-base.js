/**
 * AI Knowledge Base Node System
 * Neural OS Integration for AI Knowledge Base Management
 */

const NodeFactory = require('./nodeFactory');
const { supabase } = require('../config/supabase');

class AIKnowledgeBaseNode {
  constructor() {
    this.nodeType = 'ai-knowledge-base';
    this.tableName = 'ai_knowledge_base';
  }

  /**
   * Create a new AI knowledge base entry node
   * @param {Object} knowledgeData - Knowledge data
   * @param {string} knowledgeData.business_id - Business ID
   * @param {string} knowledgeData.source_type - Source type (document, webpage, etc.)
   * @param {string} knowledgeData.source_id - Source identifier
   * @param {string} knowledgeData.content - Content text
   * @param {Array<number>} knowledgeData.embedding - Vector embedding
   * @param {Object} knowledgeData.metadata - Additional metadata
   * @param {boolean} knowledgeData.is_active - Active status
   * @param {string} knowledgeData.doc_id - Document ID
   * @param {string} knowledgeData.heading - Content heading
   * @param {string} knowledgeData.sub_heading - Content sub-heading
   * @param {number} knowledgeData.chunk_index - Chunk index in document
   * @param {string} knowledgeData.user_id - User ID
   * @param {string} nodeCode - Node code for identification
   * @returns {Promise<Object>} Created knowledge base node
   */
  async createKnowledgeEntry(knowledgeData, nodeCode = null) {
    try {
      // Generate node code if not provided
      if (!nodeCode) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        nodeCode = `ai-knowledge-${timestamp}-${randomId}`;
      }

      // Create the database record
      const dbData = {
        business_id: knowledgeData.business_id,
        source_type: knowledgeData.source_type,
        source_id: knowledgeData.source_id,
        content: knowledgeData.content,
        embedding: knowledgeData.embedding,
        metadata: knowledgeData.metadata || {},
        is_active: knowledgeData.is_active !== false,
        doc_id: knowledgeData.doc_id,
        heading: knowledgeData.heading,
        sub_heading: knowledgeData.sub_heading,
        chunk_index: knowledgeData.chunk_index || 0,
        user_id: knowledgeData.user_id
      };

      const { data: dbRecord, error: dbError } = await supabase
        .from(this.tableName)
        .insert(dbData)
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Create the node
      const nodeData = {
        node_code: nodeCode,
        node_type: this.nodeType,
        metadata: {
          business_id: knowledgeData.business_id,
          source_type: knowledgeData.source_type,
          source_id: knowledgeData.source_id,
          content: knowledgeData.content,
          embedding: knowledgeData.embedding,
          database_id: dbRecord.id,
          created_at: dbRecord.created_at,
          is_active: knowledgeData.is_active !== false,
          doc_id: knowledgeData.doc_id,
          heading: knowledgeData.heading,
          sub_heading: knowledgeData.sub_heading,
          chunk_index: knowledgeData.chunk_index || 0,
          user_id: knowledgeData.user_id,
          access_count: 0,
          last_accessed: null,
          similarity_score: null,
          ...knowledgeData.metadata
        },
        relationships: [
          {
            target_node_code: `business-${knowledgeData.business_id}`,
            relationship_type: 'belongs_to_business'
          },
          {
            target_node_code: `user-${knowledgeData.user_id}`,
            relationship_type: 'created_by_user'
          }
        ]
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);

      // Log the creation
      await this._logKnowledgeEntry('create', {
        node_code: nodeCode,
        business_id: knowledgeData.business_id,
        source_type: knowledgeData.source_type,
        doc_id: knowledgeData.doc_id
      });

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      throw error;
    }
  }

  /**
   * Query AI knowledge base entries by criteria
   * @param {Object} criteria - Query criteria
   * @param {string} criteria.business_id - Filter by business ID
   * @param {string} criteria.source_type - Filter by source type
   * @param {string} criteria.source_id - Filter by source ID
   * @param {string} criteria.doc_id - Filter by document ID
   * @param {boolean} criteria.is_active - Filter by active status
   * @param {string} criteria.user_id - Filter by user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of knowledge base nodes
   */
  async queryKnowledgeEntries(criteria = {}, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      if (criteria.business_id) {
        query = query.eq('business_id', criteria.business_id);
      }
      if (criteria.source_type) {
        query = query.eq('source_type', criteria.source_type);
      }
      if (criteria.source_id) {
        query = query.eq('source_id', criteria.source_id);
      }
      if (criteria.doc_id) {
        query = query.eq('doc_id', criteria.doc_id);
      }
      if (criteria.is_active !== undefined) {
        query = query.eq('is_active', criteria.is_active);
      }
      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }

      // Apply ordering
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data: entries, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to nodes
      const nodes = [];
      for (const entry of entries) {
        const nodeCode = `ai-knowledge-${entry.id}`;
        const node = await NodeFactory.queryNodes({ node_code: nodeCode });

        if (node && node.length > 0) {
          nodes.push(node[0]);
        } else {
          // Create node if it doesn't exist
          const nodeData = {
            node_code: nodeCode,
            node_type: this.nodeType,
            metadata: {
              business_id: entry.business_id,
              source_type: entry.source_type,
              source_id: entry.source_id,
              content: entry.content,
              embedding: entry.embedding,
              database_id: entry.id,
              created_at: entry.created_at,
              is_active: entry.is_active,
              doc_id: entry.doc_id,
              heading: entry.heading,
              sub_heading: entry.sub_heading,
              chunk_index: entry.chunk_index,
              user_id: entry.user_id,
              access_count: entry.access_count || 0,
              last_accessed: entry.last_accessed,
              similarity_score: entry.similarity_score,
              ...entry.metadata
            },
            relationships: [
              {
                target_node_code: `business-${entry.business_id}`,
                relationship_type: 'belongs_to_business'
              },
              {
                target_node_code: `user-${entry.user_id}`,
                relationship_type: 'created_by_user'
              }
            ]
          };

          const createdNode = await NodeFactory.createNonLiveNode(nodeData);
          nodes.push(createdNode);
        }
      }

      return nodes;
    } catch (error) {
      console.error('Error querying knowledge entries:', error);
      throw error;
    }
  }

  /**
   * Update a knowledge base entry
   * @param {string} nodeCode - Node code of the entry to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated knowledge base node
   */
  async updateKnowledgeEntry(nodeCode, updateData) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-knowledge-', '');

      // Update database record
      const dbUpdateData = {};
      if (updateData.content !== undefined) dbUpdateData.content = updateData.content;
      if (updateData.embedding !== undefined) dbUpdateData.embedding = updateData.embedding;
      if (updateData.metadata !== undefined) dbUpdateData.metadata = updateData.metadata;
      if (updateData.is_active !== undefined) dbUpdateData.is_active = updateData.is_active;
      if (updateData.heading !== undefined) dbUpdateData.heading = updateData.heading;
      if (updateData.sub_heading !== undefined) dbUpdateData.sub_heading = updateData.sub_heading;
      if (updateData.access_count !== undefined) dbUpdateData.access_count = updateData.access_count;
      if (updateData.last_accessed !== undefined) dbUpdateData.last_accessed = updateData.last_accessed;
      if (updateData.similarity_score !== undefined) dbUpdateData.similarity_score = updateData.similarity_score;

      const { data: dbRecord, error: dbError } = await supabase
        .from(this.tableName)
        .update(dbUpdateData)
        .eq('id', databaseId)
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Update node
      const nodeUpdateData = {
        metadata: {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      };

      const updatedNode = await NodeFactory.updateNode(nodeCode, nodeUpdateData);

      // Log the update
      await this._logKnowledgeEntry('update', {
        node_code: nodeCode,
        updates: Object.keys(updateData)
      });

      return {
        node: updatedNode,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      throw error;
    }
  }

  /**
   * Increment access count for a knowledge entry
   * @param {string} nodeCode - Node code of the entry
   * @returns {Promise<Object>} Updated knowledge base node
   */
  async incrementAccessCount(nodeCode) {
    try {
      // Get current access count
      const entries = await this.queryKnowledgeEntries();
      const entry = entries.find(node => node.node_code === nodeCode);

      if (!entry) {
        throw new Error('Knowledge entry not found');
      }

      const currentAccess = entry.metadata.access_count || 0;
      return await this.updateKnowledgeEntry(nodeCode, {
        access_count: currentAccess + 1,
        last_accessed: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error incrementing access count:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base by semantic similarity
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {Object} filters - Additional filters
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Array of similar knowledge entries with scores
   */
  async searchBySimilarity(queryEmbedding, filters = {}, limit = 10) {
    try {
      // Get all active entries matching filters
      const criteria = { is_active: true, ...filters };
      const allEntries = await this.queryKnowledgeEntries(criteria);

      // Calculate cosine similarity for each entry
      const similarities = allEntries.map(entry => {
        const similarity = this._calculateCosineSimilarity(queryEmbedding, entry.metadata.embedding);
        return {
          ...entry,
          similarity_score: similarity
        };
      });

      // Sort by similarity and return top results
      similarities.sort((a, b) => b.similarity_score - a.similarity_score);

      return similarities.slice(0, limit);
    } catch (error) {
      console.error('Error searching by similarity:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base by text content
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Array of matching knowledge entries
   */
  async searchByText(query, filters = {}, limit = 10) {
    try {
      const criteria = { is_active: true, ...filters };
      const allEntries = await this.queryKnowledgeEntries(criteria);

      // Simple text matching (in production, this would use full-text search)
      const matches = allEntries.filter(entry => {
        const content = entry.metadata.content?.toLowerCase() || '';
        const heading = entry.metadata.heading?.toLowerCase() || '';
        const subHeading = entry.metadata.sub_heading?.toLowerCase() || '';

        const searchText = `${heading} ${subHeading} ${content}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

      return matches.slice(0, limit);
    } catch (error) {
      console.error('Error searching by text:', error);
      throw error;
    }
  }

  /**
   * Get knowledge entries by document
   * @param {string} docId - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of knowledge entries for the document
   */
  async getEntriesByDocument(docId, options = {}) {
    try {
      const criteria = { doc_id: docId, is_active: true };
      const entries = await this.queryKnowledgeEntries(criteria, {
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      // Sort by chunk index
      entries.sort((a, b) => (a.metadata.chunk_index || 0) - (b.metadata.chunk_index || 0));

      return entries;
    } catch (error) {
      console.error('Error getting entries by document:', error);
      throw error;
    }
  }

  /**
   * Get knowledge entries by business
   * @param {string} businessId - Business ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of knowledge entries for the business
   */
  async getEntriesByBusiness(businessId, options = {}) {
    try {
      const criteria = { business_id: businessId, is_active: true };
      const entries = await this.queryKnowledgeEntries(criteria, {
        limit: options.limit || 50,
        offset: options.offset || 0
      });

      return entries;
    } catch (error) {
      console.error('Error getting entries by business:', error);
      throw error;
    }
  }

  /**
   * Delete a knowledge base entry
   * @param {string} nodeCode - Node code of the entry to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteKnowledgeEntry(nodeCode) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-knowledge-', '');

      // Soft delete by marking as inactive
      const { error: dbError } = await supabase
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', databaseId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Update node metadata
      const nodeUpdateData = {
        metadata: {
          deleted: true,
          deleted_at: new Date().toISOString(),
          is_active: false
        }
      };

      await NodeFactory.updateNode(nodeCode, nodeUpdateData);

      // Log the deletion
      await this._logKnowledgeEntry('delete', {
        node_code: nodeCode
      });

      return true;
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base statistics
   * @param {string} businessId - Optional business ID filter
   * @returns {Promise<Object>} Knowledge base statistics
   */
  async getKnowledgeStats(businessId = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('business_id, source_type, doc_id, is_active, access_count, created_at');

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data: entries, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const stats = {
        total_entries: entries.length,
        active_entries: 0,
        total_access: 0,
        source_types: {},
        documents: {},
        businesses: {},
        avg_access_per_entry: 0
      };

      entries.forEach(entry => {
        if (entry.is_active !== false) {
          stats.active_entries++;
        }

        stats.total_access += entry.access_count || 0;

        // Count by source type
        stats.source_types[entry.source_type] = (stats.source_types[entry.source_type] || 0) + 1;

        // Count by document
        if (entry.doc_id) {
          stats.documents[entry.doc_id] = (stats.documents[entry.doc_id] || 0) + 1;
        }

        // Count by business
        stats.businesses[entry.business_id] = (stats.businesses[entry.business_id] || 0) + 1;
      });

      stats.avg_access_per_entry = stats.total_entries > 0 ? stats.total_access / stats.total_entries : 0;

      return stats;
    } catch (error) {
      console.error('Error getting knowledge stats:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @private
   * @param {Array<number>} vecA - First vector
   * @param {Array<number>} vecB - Second vector
   * @returns {number} Cosine similarity score
   */
  _calculateCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Log knowledge base operations to ai_knowledge_base table
   * @private
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  async _logKnowledgeEntry(operation, details) {
    try {
      const logData = {
        business_id: details.business_id || 'system',
        source_type: 'operation_log',
        source_id: `log-${Date.now()}`,
        content: `Knowledge base ${operation}: ${details.node_code || details.doc_id || 'unknown'}`,
        embedding: [], // Empty embedding for log entries
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        },
        is_active: true,
        doc_id: `log-${Date.now()}`,
        heading: `Operation: ${operation}`,
        sub_heading: details.node_code || 'System Operation',
        chunk_index: 0,
        user_id: details.user_id || 'system'
      };

      await supabase
        .from('ai_knowledge_base')
        .insert(logData);

    } catch (error) {
      console.error('Error logging knowledge entry operation:', error);
      // Don't throw - logging failure shouldn't break main operation
    }
  }
}

module.exports = {
  AIKnowledgeBaseNode,
  aiKnowledgeBaseNode: new AIKnowledgeBaseNode()
};