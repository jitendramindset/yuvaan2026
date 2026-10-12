/**
 * AI Summary Cache Node
 * Node-based AI summary caching with query deduplication and performance tracking
 */

const NodeFactory = require('./nodeFactory');

class AISummaryCacheNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Create a new summary cache entry
   */
  async createSummaryCache(cacheData, nodeCode = null) {
    try {
      // Generate node code if not provided
      const finalNodeCode = nodeCode || `summary_cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create the node
      const nodeData = {
        node_code: finalNodeCode,
        node_type: 'ai_summary_cache',
        node_name: `Summary Cache: ${cacheData.query_hash.substring(0, 50)}...`,
        node_title: `AI Summary Cache Entry`,
        node_description: `Cached summary for query hash: ${cacheData.query_hash}`,
        business_id: cacheData.business_id,
        user_id: cacheData.user_id,
        metadata: {
          query_hash: cacheData.query_hash,
          original_query: cacheData.original_query,
          context_hash: cacheData.context_hash,
          summary: cacheData.summary,
          usage_count: cacheData.usage_count || 1,
          cache_status: cacheData.cache_status || 'active',
          performance_metrics: cacheData.performance_metrics || {
            avg_generation_time: 0,
            total_requests: 0,
            cache_hit_rate: 0
          },
          tags: cacheData.tags || [],
          is_active: cacheData.is_active !== false
        },
        relationships: [],
        is_active: cacheData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Create database record
      const dbData = {
        id: node.node_id,
        business_id: cacheData.business_id,
        query_hash: cacheData.query_hash,
        original_query: cacheData.original_query,
        context_hash: cacheData.context_hash,
        summary: cacheData.summary,
        usage_count: cacheData.usage_count || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: dbRecord, error: dbError } = await this.db
        .from('ai_summary_cache')
        .insert(dbData)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Failed to create summary cache record: ${dbError.message}`);
      }

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating summary cache:', error);
      throw error;
    }
  }

  /**
   * Query summary cache entries
   */
  async querySummaryCaches(criteria = {}, options = {}) {
    try {
      let query = this.db
        .from('ai_summary_cache')
        .select('*', { count: 'exact' });

      // Apply filters
      if (criteria.business_id) {
        query = query.eq('business_id', criteria.business_id);
      }

      if (criteria.query_hash) {
        query = query.eq('query_hash', criteria.query_hash);
      }

      if (criteria.context_hash) {
        query = query.eq('context_hash', criteria.context_hash);
      }

      if (criteria.usage_count_min) {
        query = query.gte('usage_count', criteria.usage_count_min);
      }

      if (criteria.usage_count_max) {
        query = query.lte('usage_count', criteria.usage_count_max);
      }

      // Date range filters
      if (criteria.created_after) {
        query = query.gte('created_at', criteria.created_after);
      }

      if (criteria.created_before) {
        query = query.lte('created_at', criteria.created_before);
      }

      if (criteria.updated_after) {
        query = query.gte('updated_at', criteria.updated_after);
      }

      if (criteria.updated_before) {
        query = query.lte('updated_at', criteria.updated_before);
      }

      // Apply sorting
      const sortField = options.sort || 'updated_at';
      const sortOrder = options.order === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortField, sortOrder);

      // Apply pagination
      const limit = Math.min(options.limit || 50, 100); // Max 100 records
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data: records, error, count } = await query;

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      // Get corresponding nodes
      const caches = [];
      for (const record of records || []) {
        try {
          const node = await this.nodeFactory.queryNodes({
            node_code: record.id,
            node_type: 'ai_summary_cache'
          });

          caches.push({
            node: node.nodes[0] || null,
            database_record: record
          });
        } catch (nodeError) {
          console.warn(`Failed to load node for cache ${record.id}:`, nodeError.message);
          caches.push({
            node: null,
            database_record: record
          });
        }
      }

      return {
        caches,
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error querying summary caches:', error);
      throw error;
    }
  }

  /**
   * Get summary cache by query hash
   */
  async getSummaryCache(queryHash, businessId) {
    try {
      const result = await this.querySummaryCaches({
        query_hash: queryHash,
        business_id: businessId
      }, { limit: 1 });

      return result.caches[0] || null;
    } catch (error) {
      console.error('Error getting summary cache by hash:', error);
      throw error;
    }
  }

  /**
   * Update summary cache entry
   */
  async updateSummaryCache(nodeCode, updateData) {
    try {
      // Update node metadata
      const nodeUpdate = {
        metadata: updateData,
        updated_at: new Date().toISOString()
      };

      const node = await this.nodeFactory.updateNode(nodeCode, nodeUpdate);

      // Update database record
      const dbUpdate = { ...updateData };
      delete dbUpdate.node_code;
      delete dbUpdate.node_type;
      delete dbUpdate.relationships;
      dbUpdate.updated_at = new Date().toISOString();

      const { data: dbRecord, error: dbError } = await this.db
        .from('ai_summary_cache')
        .update(dbUpdate)
        .eq('id', node.node_id)
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to update summary cache record: ${dbError.message}`);
      }

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error updating summary cache:', error);
      throw error;
    }
  }

  /**
   * Increment usage count for a cache entry
   */
  async incrementUsageCount(nodeCode) {
    try {
      // Get current usage count
      const { data: currentRecord, error: fetchError } = await this.db
        .from('ai_summary_cache')
        .select('usage_count')
        .eq('id', nodeCode)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current usage count: ${fetchError.message}`);
      }

      const newUsageCount = (currentRecord.usage_count || 0) + 1;

      // Update both node and database
      const updateData = {
        usage_count: newUsageCount,
        updated_at: new Date().toISOString()
      };

      return await this.updateSummaryCache(nodeCode, updateData);
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics for a business
   */
  async getCacheStats(businessId) {
    try {
      const { data: stats, error } = await this.db
        .from('ai_summary_cache')
        .select('usage_count, created_at, updated_at')
        .eq('business_id', businessId);

      if (error) {
        throw new Error(`Failed to get cache stats: ${error.message}`);
      }

      const totalEntries = stats.length;
      const totalUsage = stats.reduce((sum, entry) => sum + (entry.usage_count || 0), 0);
      const avgUsage = totalEntries > 0 ? totalUsage / totalEntries : 0;

      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentEntries = stats.filter(entry =>
        new Date(entry.created_at) > lastWeek
      ).length;

      return {
        business_id: businessId,
        total_entries: totalEntries,
        total_usage: totalUsage,
        average_usage_per_entry: Math.round(avgUsage * 100) / 100,
        recent_entries_last_week: recentEntries,
        cache_efficiency_score: totalUsage > 0 ? Math.min(totalUsage / totalEntries, 10) : 0
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old or unused cache entries
   */
  async cleanupOldCache(businessId, daysOld = 30, minUsage = 1) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Find entries to delete
      const { data: entriesToDelete, error: fetchError } = await this.db
        .from('ai_summary_cache')
        .select('id')
        .eq('business_id', businessId)
        .lt('updated_at', cutoffDate.toISOString())
        .lt('usage_count', minUsage);

      if (fetchError) {
        throw new Error(`Failed to fetch entries for cleanup: ${fetchError.message}`);
      }

      const deletedIds = entriesToDelete.map(entry => entry.id);

      // Delete from database
      const { error: deleteError } = await this.db
        .from('ai_summary_cache')
        .delete()
        .in('id', deletedIds);

      if (deleteError) {
        throw new Error(`Failed to delete cache entries: ${deleteError.message}`);
      }

      // Delete corresponding nodes
      for (const nodeId of deletedIds) {
        try {
          await this.nodeFactory.deleteNode(nodeId);
        } catch (nodeError) {
          console.warn(`Failed to delete node ${nodeId}:`, nodeError.message);
        }
      }

      return {
        cleaned_entries: deletedIds.length,
        cutoff_date: cutoffDate.toISOString(),
        min_usage_threshold: minUsage
      };
    } catch (error) {
      console.error('Error cleaning up old cache:', error);
      throw error;
    }
  }

  /**
   * Delete summary cache entry
   */
  async deleteSummaryCache(nodeCode) {
    try {
      // Delete from database
      const { error: dbError } = await this.db
        .from('ai_summary_cache')
        .delete()
        .eq('id', nodeCode);

      if (dbError) {
        throw new Error(`Failed to delete summary cache record: ${dbError.message}`);
      }

      // Delete node
      const result = await this.nodeFactory.deleteNode(nodeCode);

      return {
        deleted: true,
        node_code: nodeCode
      };
    } catch (error) {
      console.error('Error deleting summary cache:', error);
      throw error;
    }
  }

  /**
   * Batch create summary cache entries
   */
  async batchCreateSummaryCaches(entries, businessId) {
    try {
      const results = [];
      const errors = [];

      for (const entry of entries) {
        try {
          const cacheData = {
            business_id: businessId,
            ...entry
          };

          const result = await this.createSummaryCache(cacheData, entry.node_code);
          results.push(result);
        } catch (entryError) {
          errors.push({
            entry,
            error: entryError.message
          });
        }
      }

      return {
        created: results,
        errors,
        total_created: results.length,
        total_errors: errors.length
      };
    } catch (error) {
      console.error('Error in batch create:', error);
      throw error;
    }
  }
}

module.exports = { AISummaryCacheNode };