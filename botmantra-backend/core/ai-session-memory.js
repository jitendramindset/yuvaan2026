/**
 * AI Session Memory Node
 * Node-based AI session memory management with context persistence
 */

const NodeFactory = require('./nodeFactory');

class AISessionMemoryNode {
  constructor() {
    this.nodeFactory = new NodeFactory();
  }

  /**
   * Create a new session memory entry
   */
  async createSessionMemory(sessionData, nodeCode = null) {
    try {
      const nodeData = {
        node_type: 'ai_session_memory',
        node_code: nodeCode || `session_${sessionData.session_id}_${Date.now()}`,
        owner_id: sessionData.user_id,
        metadata: {
          session_id: sessionData.session_id,
          context: sessionData.context,
          last_action: sessionData.last_action,
          expires_at: sessionData.expires_at,
          memory_type: sessionData.memory_type || 'conversation',
          importance_score: sessionData.importance_score || 0.5,
          access_count: sessionData.access_count || 0,
          last_accessed: sessionData.last_accessed || new Date().toISOString(),
          memory_status: sessionData.memory_status || 'active',
          tags: sessionData.tags || [],
          conversation_summary: sessionData.conversation_summary || '',
          key_insights: sessionData.key_insights || [],
          user_preferences: sessionData.user_preferences || {},
          session_metadata: sessionData.session_metadata || {}
        },
        relationships: {
          user: sessionData.user_id,
          session: sessionData.session_id
        },
        permissions: {
          read: ['owner'],
          write: ['owner'],
          delete: ['owner']
        },
        is_active: sessionData.is_active !== false
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Create database record
      const { supabase } = require('../config/supabase');
      const dbRecord = {
        node_code: node.node_code,
        session_id: sessionData.session_id,
        user_id: sessionData.user_id,
        context: sessionData.context,
        last_action: sessionData.last_action,
        expires_at: sessionData.expires_at,
        memory_type: sessionData.memory_type || 'conversation',
        importance_score: sessionData.importance_score || 0.5,
        access_count: sessionData.access_count || 0,
        last_accessed: sessionData.last_accessed || new Date().toISOString(),
        memory_status: sessionData.memory_status || 'active',
        tags: sessionData.tags || [],
        conversation_summary: sessionData.conversation_summary || '',
        key_insights: sessionData.key_insights || [],
        user_preferences: sessionData.user_preferences || {},
        session_metadata: sessionData.session_metadata || {},
        is_active: sessionData.is_active !== false
      };

      const { data, error } = await supabase
        .from('ai_session_memory')
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
      console.error('Error creating session memory entry:', error);
      throw error;
    }
  }

  /**
   * Query session memory entries
   */
  async querySessionMemories(criteria = {}, options = {}) {
    try {
      const { supabase } = require('../config/supabase');

      let query = supabase
        .from('ai_session_memory')
        .select('*', { count: 'exact' });

      // Apply filters
      if (criteria.session_id) {
        query = query.eq('session_id', criteria.session_id);
      }

      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }

      if (criteria.memory_type) {
        query = query.eq('memory_type', criteria.memory_type);
      }

      if (criteria.memory_status) {
        query = query.eq('memory_status', criteria.memory_status);
      }

      if (criteria.is_active !== undefined) {
        query = query.eq('is_active', criteria.is_active);
      }

      if (criteria.tags && criteria.tags.length > 0) {
        query = query.overlaps('tags', criteria.tags);
      }

      // Filter expired sessions
      if (criteria.exclude_expired !== false) {
        query = query.gt('expires_at', new Date().toISOString());
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
      const memories = [];
      for (const record of data) {
        try {
          const node = await this.nodeFactory.queryNodes({
            node_code: record.node_code,
            node_type: 'ai_session_memory'
          });
          if (node.length > 0) {
            memories.push({
              node: node[0],
              database_record: record
            });
          }
        } catch (nodeError) {
          console.warn(`Failed to load node for session memory ${record.node_code}:`, nodeError.message);
        }
      }

      return {
        memories,
        total: count,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error querying session memories:', error);
      throw error;
    }
  }

  /**
   * Get session memory by session ID
   */
  async getSessionMemory(sessionId, userId) {
    try {
      const criteria = {
        session_id: sessionId,
        user_id: userId,
        memory_status: 'active',
        is_active: true
      };

      const result = await this.querySessionMemories(criteria, { limit: 1 });

      if (result.memories.length === 0) {
        return null;
      }

      // Update last accessed
      const memory = result.memories[0];
      await this.updateSessionMemory(memory.node.node_code, {
        last_accessed: new Date().toISOString(),
        access_count: (memory.database_record.access_count || 0) + 1
      });

      return memory;
    } catch (error) {
      console.error('Error getting session memory:', error);
      throw error;
    }
  }

  /**
   * Update session memory
   */
  async updateSessionMemory(nodeCode, updateData) {
    try {
      // Update node
      const node = await this.nodeFactory.updateNode(nodeCode, {
        metadata: updateData,
        updated_at: new Date().toISOString()
      });

      // Update database record
      const { supabase } = require('../config/supabase');
      const dbUpdate = { ...updateData };

      // Add last modified timestamp
      dbUpdate.last_modified = new Date().toISOString();

      const { data, error } = await supabase
        .from('ai_session_memory')
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
      console.error('Error updating session memory:', error);
      throw error;
    }
  }

  /**
   * Extend session expiration
   */
  async extendSessionExpiration(sessionId, userId, additionalHours = 24) {
    try {
      const memory = await this.getSessionMemory(sessionId, userId);

      if (!memory) {
        throw new Error('Session memory not found');
      }

      const currentExpiry = new Date(memory.database_record.expires_at);
      const newExpiry = new Date(currentExpiry.getTime() + (additionalHours * 60 * 60 * 1000));

      return await this.updateSessionMemory(memory.node.node_code, {
        expires_at: newExpiry.toISOString(),
        last_accessed: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error extending session expiration:', error);
      throw error;
    }
  }

  /**
   * Get user session statistics
   */
  async getUserSessionStats(userId) {
    try {
      const { supabase } = require('../config/supabase');

      const { data, error } = await supabase
        .from('ai_session_memory')
        .select('memory_type, memory_status, importance_score, access_count, created_at, expires_at')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const stats = {
        total_sessions: data.length,
        active_sessions: data.filter(d => d.memory_status === 'active').length,
        expired_sessions: data.filter(d => new Date(d.expires_at) < new Date()).length,
        total_access_count: data.reduce((sum, d) => sum + (d.access_count || 0), 0),
        avg_importance_score: data.length > 0 ? data.reduce((sum, d) => sum + (d.importance_score || 0), 0) / data.length : 0,
        memory_types: {},
        oldest_session: data.length > 0 ? data.reduce((oldest, d) => d.created_at < oldest ? d.created_at : oldest, data[0].created_at) : null,
        newest_session: data.length > 0 ? data.reduce((newest, d) => d.created_at > newest ? d.created_at : newest, data[0].created_at) : null
      };

      // Count memory types
      data.forEach(item => {
        const type = item.memory_type || 'unknown';
        stats.memory_types[type] = (stats.memory_types[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting user session stats:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(userId = null, force = false) {
    try {
      const { supabase } = require('../config/supabase');

      let query = supabase
        .from('ai_session_memory')
        .select('node_code, session_id')
        .lt('expires_at', new Date().toISOString());

      if (userId && !force) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const expiredCount = data.length;

      if (expiredCount > 0) {
        // Mark as inactive instead of deleting
        const updateQuery = supabase
          .from('ai_session_memory')
          .update({
            is_active: false,
            memory_status: 'expired'
          });

        if (userId && !force) {
          updateQuery.eq('user_id', userId);
        } else {
          updateQuery.lt('expires_at', new Date().toISOString());
        }

        const { error: updateError } = await updateQuery;

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }
      }

      return {
        cleaned_sessions: expiredCount,
        cutoff_date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Archive old sessions
   */
  async archiveOldSessions(userId, daysOld = 30) {
    try {
      const { supabase } = require('../config/supabase');

      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('ai_session_memory')
        .select('node_code, session_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lt('last_accessed', cutoffDate);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const archiveCount = data.length;

      if (archiveCount > 0) {
        const { error: updateError } = await supabase
          .from('ai_session_memory')
          .update({
            memory_status: 'archived',
            archived_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .lt('last_accessed', cutoffDate);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }
      }

      return {
        archived_sessions: archiveCount,
        cutoff_date: cutoffDate
      };
    } catch (error) {
      console.error('Error archiving old sessions:', error);
      throw error;
    }
  }

  /**
   * Delete session memory
   */
  async deleteSessionMemory(nodeCode) {
    try {
      // Delete from database
      const { supabase } = require('../config/supabase');
      const { error } = await supabase
        .from('ai_session_memory')
        .delete()
        .eq('node_code', nodeCode);

      if (error) {
        throw new Error(`Database delete failed: ${error.message}`);
      }

      // Delete node
      await this.nodeFactory.deleteNode(nodeCode);

      return { deleted: true };
    } catch (error) {
      console.error('Error deleting session memory:', error);
      throw error;
    }
  }

  /**
   * Merge session contexts
   */
  async mergeSessionContexts(sessionIds, userId, targetSessionId) {
    try {
      const { supabase } = require('../config/supabase');

      // Get all sessions to merge
      const { data, error } = await supabase
        .from('ai_session_memory')
        .select('*')
        .eq('user_id', userId)
        .in('session_id', sessionIds)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (data.length === 0) {
        throw new Error('No sessions found to merge');
      }

      // Combine contexts
      const mergedContext = data.map(d => d.context).join('\n\n');
      const mergedInsights = data.flatMap(d => d.key_insights || []);
      const mergedTags = [...new Set(data.flatMap(d => d.tags || []))];

      // Calculate average importance
      const avgImportance = data.reduce((sum, d) => sum + (d.importance_score || 0), 0) / data.length;

      // Create merged session
      const mergedData = {
        session_id: targetSessionId,
        user_id: userId,
        context: mergedContext,
        last_action: 'session_merge',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        memory_type: 'merged_conversation',
        importance_score: Math.min(avgImportance + 0.1, 1.0), // Slightly boost importance
        access_count: data.reduce((sum, d) => sum + (d.access_count || 0), 0),
        tags: mergedTags,
        conversation_summary: `Merged from ${data.length} sessions`,
        key_insights: [...new Set(mergedInsights)],
        session_metadata: {
          merged_from: sessionIds,
          merged_at: new Date().toISOString(),
          original_sessions: data.length
        }
      };

      const result = await this.createSessionMemory(mergedData);

      // Mark original sessions as merged
      await supabase
        .from('ai_session_memory')
        .update({
          memory_status: 'merged',
          merged_into: targetSessionId,
          merged_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('session_id', sessionIds);

      return result;
    } catch (error) {
      console.error('Error merging session contexts:', error);
      throw error;
    }
  }
}

const aiSessionMemoryNode = new AISessionMemoryNode();
module.exports = { aiSessionMemoryNode, AISessionMemoryNode };