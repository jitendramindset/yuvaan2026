/**
 * AI Chat Sessions Node System
 * Neural OS Integration for AI Chat Sessions Management
 */

const NodeFactory = require('./nodeFactory');
const { supabase } = require('../config/supabase');

class AIChatSessionsNode {
  constructor() {
    this.nodeType = 'ai-chat-sessions';
    this.tableName = 'ai_chat_sessions';
  }

  /**
   * Create a new chat session node
   * @param {Object} sessionData - Session data
   * @param {string} sessionData.business_id - Business ID
   * @param {string} sessionData.user_id - User ID
   * @param {string} sessionData.session_name - Session name
   * @param {string} sessionData.last_active - Last active timestamp
   * @param {Object} sessionData.metadata - Additional metadata
   * @param {string} nodeCode - Node code for identification
   * @returns {Promise<Object>} Created session node
   */
  async createChatSession(sessionData, nodeCode = null) {
    try {
      // Generate node code if not provided
      if (!nodeCode) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        nodeCode = `ai-chat-session-${timestamp}-${randomId}`;
      }

      // Create the database record
      const dbData = {
        business_id: sessionData.business_id,
        user_id: sessionData.user_id,
        session_name: sessionData.session_name,
        last_active: sessionData.last_active,
        metadata: sessionData.metadata || {}
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
          business_id: sessionData.business_id,
          user_id: sessionData.user_id,
          session_name: sessionData.session_name,
          last_active: sessionData.last_active,
          database_id: dbRecord.id,
          created_at: dbRecord.created_at,
          message_count: 0,
          ...sessionData.metadata
        },
        relationships: [
          {
            target_node_code: `user-${sessionData.user_id}`,
            relationship_type: 'owned_by_user'
          },
          {
            target_node_code: `business-${sessionData.business_id}`,
            relationship_type: 'belongs_to_business'
          }
        ]
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);

      // Log the creation
      await this._logChatSession('create', {
        node_code: nodeCode,
        business_id: sessionData.business_id,
        user_id: sessionData.user_id,
        session_name: sessionData.session_name
      });

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  /**
   * Query chat sessions by criteria
   * @param {Object} criteria - Query criteria
   * @param {string} criteria.business_id - Filter by business ID
   * @param {string} criteria.user_id - Filter by user ID
   * @param {string} criteria.session_name - Filter by session name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of session nodes
   */
  async queryChatSessions(criteria = {}, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      if (criteria.business_id) {
        query = query.eq('business_id', criteria.business_id);
      }
      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }
      if (criteria.session_name) {
        query = query.ilike('session_name', `%${criteria.session_name}%`);
      }

      // Apply ordering
      query = query.order('last_active', { ascending: false });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to nodes
      const nodes = [];
      for (const session of sessions) {
        const nodeCode = `ai-chat-session-${session.id}`;
        const node = await NodeFactory.queryNodes({ node_code: nodeCode });

        if (node && node.length > 0) {
          nodes.push(node[0]);
        } else {
          // Create node if it doesn't exist
          const nodeData = {
            node_code: nodeCode,
            node_type: this.nodeType,
            metadata: {
              business_id: session.business_id,
              user_id: session.user_id,
              session_name: session.session_name,
              last_active: session.last_active,
              database_id: session.id,
              created_at: session.created_at,
              message_count: await this._getMessageCount(session.id),
              ...session.metadata
            },
            relationships: [
              {
                target_node_code: `user-${session.user_id}`,
                relationship_type: 'owned_by_user'
              },
              {
                target_node_code: `business-${session.business_id}`,
                relationship_type: 'belongs_to_business'
              }
            ]
          };

          const createdNode = await NodeFactory.createNonLiveNode(nodeData);
          nodes.push(createdNode);
        }
      }

      return nodes;
    } catch (error) {
      console.error('Error querying chat sessions:', error);
      throw error;
    }
  }

  /**
   * Update a chat session
   * @param {string} nodeCode - Node code of the session to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated session node
   */
  async updateChatSession(nodeCode, updateData) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-chat-session-', '');

      // Update database record
      const dbUpdateData = {};
      if (updateData.session_name !== undefined) dbUpdateData.session_name = updateData.session_name;
      if (updateData.last_active !== undefined) dbUpdateData.last_active = updateData.last_active;
      if (updateData.metadata !== undefined) dbUpdateData.metadata = updateData.metadata;

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
      await this._logChatSession('update', {
        node_code: nodeCode,
        updates: Object.keys(updateData)
      });

      return {
        node: updatedNode,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error updating chat session:', error);
      throw error;
    }
  }

  /**
   * Update session last active time
   * @param {string} nodeCode - Node code of the session
   * @returns {Promise<Object>} Updated session node
   */
  async updateLastActive(nodeCode) {
    try {
      const lastActive = new Date().toISOString();
      return await this.updateChatSession(nodeCode, { last_active: lastActive });
    } catch (error) {
      console.error('Error updating last active:', error);
      throw error;
    }
  }

  /**
   * Delete a chat session
   * @param {string} nodeCode - Node code of the session to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteChatSession(nodeCode) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-chat-session-', '');

      // Delete from database
      const { error: dbError } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', databaseId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Delete node (if NodeFactory supports deletion)
      // For now, we'll mark it as deleted in metadata
      const nodeUpdateData = {
        metadata: {
          deleted: true,
          deleted_at: new Date().toISOString()
        }
      };

      await NodeFactory.updateNode(nodeCode, nodeUpdateData);

      // Log the deletion
      await this._logChatSession('delete', {
        node_code: nodeCode
      });

      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  /**
   * Get user's active sessions
   * @param {string} userId - User ID
   * @param {string} businessId - Business ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active session nodes
   */
  async getUserSessions(userId, businessId, options = {}) {
    try {
      const criteria = { user_id: userId, business_id: businessId };
      const sessions = await this.queryChatSessions(criteria, {
        limit: options.limit || 20,
        offset: options.offset || 0
      });

      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   * @param {string} businessId - Business ID (optional)
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats(businessId = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('business_id, user_id, created_at, last_active');

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const stats = {
        total_sessions: sessions.length,
        active_sessions_24h: 0,
        active_sessions_7d: 0,
        sessions_by_business: {},
        sessions_by_user: {}
      };

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      sessions.forEach(session => {
        const lastActive = new Date(session.last_active);

        if (lastActive >= oneDayAgo) {
          stats.active_sessions_24h++;
        }
        if (lastActive >= sevenDaysAgo) {
          stats.active_sessions_7d++;
        }

        // Count by business
        stats.sessions_by_business[session.business_id] = (stats.sessions_by_business[session.business_id] || 0) + 1;

        // Count by user
        stats.sessions_by_user[session.user_id] = (stats.sessions_by_user[session.user_id] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw error;
    }
  }

  /**
   * Get message count for a session
   * @private
   * @param {string} sessionId - Session ID
   * @returns {Promise<number>} Message count
   */
  async _getMessageCount(sessionId) {
    try {
      const { count, error } = await supabase
        .from('ai_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (error) {
        console.warn('Error getting message count:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.warn('Error getting message count:', error.message);
      return 0;
    }
  }

  /**
   * Log chat session operations to ai_chat_sessions table
   * @private
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  async _logChatSession(operation, details) {
    try {
      const logData = {
        business_id: details.business_id || 'system',
        user_id: details.user_id || 'system',
        session_name: `Session ${operation}: ${details.session_name || details.node_code || 'unknown'}`,
        last_active: new Date().toISOString(),
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        }
      };

      await supabase
        .from('ai_chat_sessions')
        .insert(logData);

    } catch (error) {
      console.error('Error logging chat session operation:', error);
      // Don't throw - logging failure shouldn't break main operation
    }
  }
}

module.exports = {
  AIChatSessionsNode,
  aiChatSessionsNode: new AIChatSessionsNode()
};