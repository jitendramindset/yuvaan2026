/**
 * AI Semantic Cache Node
 * Node-based AI semantic caching system with vector similarity search
 */

const NodeFactory = require('./nodeFactory');

class AISemanticCacheNode {
  constructor() {
    this.nodeFactory = new NodeFactory();
  }

  /**
   * Create a new semantic cache entry
   */
  async createCacheEntry(cacheData, nodeCode = null) {
    try {
      const nodeData = {
        node_type: 'ai_semantic_cache',
        node_code: nodeCode || `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        owner_id: cacheData.user_id,
        metadata: {
          business_id: cacheData.business_id,
          query: cacheData.query,
          query_embedding: cacheData.query_embedding,
          answer: cacheData.answer,
          similarity_threshold: cacheData.similarity_threshold || 0.8,
          hit_count: cacheData.hit_count || 0,
          last_accessed: cacheData.last_accessed || new Date().toISOString(),
          cache_status: cacheData.cache_status || 'active',
          embedding_model: cacheData.embedding_model || 'text-embedding-ada-002',
          query_hash: cacheData.query_hash,
          tags: cacheData.tags || [],
          performance_metrics: cacheData.performance_metrics || {
            avg_response_time: 0,
            total_hits: 0,
            cache_hit_rate: 0
          }
        },
        relationships: {
          business: cacheData.business_id,
          user: cacheData.user_id
        },
        permissions: {
          read: ['owner', 'business_users'],
          write: ['owner'],
          delete: ['owner']
        },
        is_active: cacheData.is_active !== false
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Create database record
      const { supabase } = require('../config/supabase');
      const dbRecord = {
        node_code: node.node_code,
        business_id: cacheData.business_id,
        user_id: cacheData.user_id,
        query: cacheData.query,
        query_embedding: cacheData.query_embedding,
        answer: cacheData.answer,
        similarity_threshold: cacheData.similarity_threshold || 0.8,
        hit_count: cacheData.hit_count || 0,
        last_accessed: cacheData.last_accessed || new Date().toISOString(),
        cache_status: cacheData.cache_status || 'active',
        embedding_model: cacheData.embedding_model || 'text-embedding-ada-002',
        query_hash: cacheData.query_hash,
        tags: cacheData.tags || [],
        performance_metrics: cacheData.performance_metrics || {
          avg_response_time: 0,
          total_hits: 0,
          cache_hit_rate: 0
        },
        is_active: cacheData.is_active !== false
      };

      const { data, error } = await supabase
        .from('ai_semantic_cache')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }

      return {
        node,
        database_record: data
      };
    } catch (error) {
      console.error('Error creating semantic cache entry:', error);
      throw error;
    }
  }

  /**
   * Query semantic cache entries with vector similarity search
   */
  async queryCacheEntries(criteria = {}, options = {}) {
    try {
      const { supabase } = require('../config/supabase');

      let query = supabase
        .from('ai_semantic_cache')
        .select('*', { count: 'exact' });

      // Apply filters
      if (criteria.business_id) {
        query = query.eq('business_id', criteria.business_id);
      }

      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }

      if (criteria.cache_status) {
        query = query.eq('cache_status', criteria.cache_status);
      }

      if (criteria.is_active !== undefined) {
        query = query.eq('is_active', criteria.is_active);
      }

      if (criteria.query_hash) {
        query = query.eq('query_hash', criteria.query_hash);
      }

      if (criteria.tags && criteria.tags.length > 0) {
        query = query.overlaps('tags', criteria.tags);
      }

      // Apply pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      const sortBy = options.sort || 'last_accessed';
      const sortOrder = options.order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Get corresponding nodes
      const nodes = [];
      for (const record of data) {
        try {
          const node = await this.nodeFactory.queryNodes({
            node_code: record.node_code,
            node_type: 'ai_semantic_cache'
          });
          if (node.length > 0) {
            nodes.push({
              node: node[0],
              database_record: record
            });
          }
        } catch (nodeError) {
          console.warn(`Failed to load node for cache entry ${record.node_code}:`, nodeError.message);
        }
      }

      return {
        entries: nodes,
        total: count,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error querying semantic cache entries:', error);
      throw error;
    }
  }

  /**
   * Find similar cache entries using vector similarity
   */
  async findSimilarEntries(queryEmbedding, businessId, similarityThreshold = 0.8, limit = 10) {
    try {
      const { supabase } = require('../config/supabase');

      // Use pgvector for cosine similarity search
      const { data, error } = await supabase.rpc('find_similar_cache_entries', {
        query_embedding: queryEmbedding,
        business_id: businessId,
        similarity_threshold: similarityThreshold,
        result_limit: limit
      });

      if (error) {
        // Fallback to basic query if RPC function doesn't exist
        console.warn('RPC function not available, using basic similarity search');
        return this._basicSimilaritySearch(queryEmbedding, businessId, similarityThreshold, limit);
      }

      // Get corresponding nodes
      const results = [];
      for (const record of data) {
        try {
          const node = await this.nodeFactory.queryNodes({
            node_code: record.node_code,
            node_type: 'ai_semantic_cache'
          });
          if (node.length > 0) {
            results.push({
              node: node[0],
              database_record: record,
              similarity_score: record.similarity_score
            });
          }
        } catch (nodeError) {
          console.warn(`Failed to load node for similar entry ${record.node_code}:`, nodeError.message);
        }
      }

      return results;
    } catch (error) {
      console.error('Error finding similar cache entries:', error);
      throw error;
    }
  }

  /**
   * Basic similarity search fallback (when pgvector RPC is not available)
   */
  async _basicSimilaritySearch(queryEmbedding, businessId, similarityThreshold, limit) {
    try {
      const { supabase } = require('../config/supabase');

      const { data, error } = await supabase
        .from('ai_semantic_cache')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .eq('cache_status', 'active')
        .limit(limit * 2); // Get more for manual filtering

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Calculate cosine similarity manually
      const results = [];
      for (const record of data) {
        const similarity = this._calculateCosineSimilarity(queryEmbedding, record.query_embedding);
        if (similarity >= similarityThreshold) {
          results.push({
            node_code: record.node_code,
            database_record: record,
            similarity_score: similarity
          });
        }
      }

      // Sort by similarity and limit
      results.sort((a, b) => b.similarity_score - a.similarity_score);
      const limitedResults = results.slice(0, limit);

      // Get corresponding nodes
      const finalResults = [];
      for (const result of limitedResults) {
        try {
          const node = await this.nodeFactory.queryNodes({
            node_code: result.node_code,
            node_type: 'ai_semantic_cache'
          });
          if (node.length > 0) {
            finalResults.push({
              node: node[0],
              database_record: result.database_record,
              similarity_score: result.similarity_score
            });
          }
        } catch (nodeError) {
          console.warn(`Failed to load node for similar entry ${result.node_code}:`, nodeError.message);
        }
      }

      return finalResults;
    } catch (error) {
      console.error('Error in basic similarity search:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  _calculateCosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Update cache entry and increment hit count
   */
  async updateCacheEntry(nodeCode, updateData) {
    try {
      // Update node
      const node = await this.nodeFactory.updateNode(nodeCode, {
        metadata: updateData,
        updated_at: new Date().toISOString()
      });

      // Update database record
      const { supabase } = require('../config/supabase');
      const dbUpdate = { ...updateData };

      // Increment hit count if accessing
      if (updateData.increment_hit !== false) {
        const { data: current } = await supabase
          .from('ai_semantic_cache')
          .select('hit_count, performance_metrics')
          .eq('node_code', nodeCode)
          .single();

        if (current) {
          dbUpdate.hit_count = (current.hit_count || 0) + 1;
          dbUpdate.last_accessed = new Date().toISOString();

          // Update performance metrics
          const metrics = current.performance_metrics || {};
          metrics.total_hits = (metrics.total_hits || 0) + 1;
          dbUpdate.performance_metrics = metrics;
        }
      }

      const { data, error } = await supabase
        .from('ai_semantic_cache')
        .update(dbUpdate)
        .eq('node_code', nodeCode)
        .select()
        .single();

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      return {
        node,
        database_record: data
      };
    } catch (error) {
      console.error('Error updating cache entry:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(businessId, userId = null) {
    try {
      const { supabase } = require('../config/supabase');

      let query = supabase
        .from('ai_semantic_cache')
        .select('cache_status, hit_count, performance_metrics, created_at, last_accessed');

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const stats = {
        total_entries: data.length,
        active_entries: data.filter(d => d.cache_status === 'active').length,
        total_hits: data.reduce((sum, d) => sum + (d.hit_count || 0), 0),
        avg_hit_count: data.length > 0 ? data.reduce((sum, d) => sum + (d.hit_count || 0), 0) / data.length : 0,
        cache_hit_rate: 0, // Would need more complex calculation
        oldest_entry: data.length > 0 ? data.reduce((oldest, d) => d.created_at < oldest ? d.created_at : oldest, data[0].created_at) : null,
        newest_entry: data.length > 0 ? data.reduce((newest, d) => d.created_at > newest ? d.created_at : newest, data[0].created_at) : null,
        recently_accessed: data.filter(d => {
          const lastAccessed = new Date(d.last_accessed);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return lastAccessed > weekAgo;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old/inactive cache entries
   */
  async cleanupCache(businessId, maxAgeDays = 30, minHits = 0) {
    try {
      const { supabase } = require('../config/supabase');

      const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();

      // Find entries to clean up
      const { data, error } = await supabase
        .from('ai_semantic_cache')
        .select('node_code')
        .eq('business_id', businessId)
        .or(`last_accessed.lt.${cutoffDate},hit_count.lt.${minHits}`)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const cleanupCount = data.length;

      if (cleanupCount > 0) {
        // Mark as inactive instead of deleting
        const { error: updateError } = await supabase
          .from('ai_semantic_cache')
          .update({
            is_active: false,
            cache_status: 'expired'
          })
          .in('node_code', data.map(d => d.node_code));

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }
      }

      return {
        cleaned_entries: cleanupCount,
        cutoff_date: cutoffDate,
        min_hits: minHits
      };
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      throw error;
    }
  }

  /**
   * Delete cache entry
   */
  async deleteCacheEntry(nodeCode) {
    try {
      // Delete from database
      const { supabase } = require('../config/supabase');
      const { error } = await supabase
        .from('ai_semantic_cache')
        .delete()
        .eq('node_code', nodeCode);

      if (error) {
        throw new Error(`Database delete failed: ${error.message}`);
      }

      // Delete node
      await this.nodeFactory.deleteNode(nodeCode);

      return { deleted: true };
    } catch (error) {
      console.error('Error deleting cache entry:', error);
      throw error;
    }
  }
}

const aiSemanticCacheNode = new AISemanticCacheNode();
module.exports = { aiSemanticCacheNode, AISemanticCacheNode };