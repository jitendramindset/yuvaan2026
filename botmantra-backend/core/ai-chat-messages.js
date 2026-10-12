/**
 * AI Chat Messages Node System
 * Neural OS Integration for AI Chat Messages Management
 */

const NodeFactory = require('./nodeFactory');
const { supabase } = require('../config/supabase');

class AIChatMessagesNode {
  constructor() {
    this.nodeType = 'ai-chat-messages';
    this.tableName = 'ai_chat_messages';
  }

  /**
   * Create a new chat message node
   * @param {Object} messageData - Message data
   * @param {string} messageData.session_id - Chat session ID
   * @param {string} messageData.role - Message role (user/assistant/system)
   * @param {string} messageData.content - Message content
   * @param {Object} messageData.metadata - Additional metadata
   * @param {string} nodeCode - Node code for identification
   * @returns {Promise<Object>} Created message node
   */
  async createChatMessage(messageData, nodeCode = null) {
    try {
      // Generate node code if not provided
      if (!nodeCode) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        nodeCode = `ai-chat-message-${timestamp}-${randomId}`;
      }

      // Create the database record
      const dbData = {
        session_id: messageData.session_id,
        role: messageData.role,
        content: messageData.content,
        metadata: messageData.metadata || {}
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
          session_id: messageData.session_id,
          role: messageData.role,
          content: messageData.content,
          database_id: dbRecord.id,
          created_at: dbRecord.created_at,
          ...messageData.metadata
        },
        relationships: [
          {
            target_node_code: `ai-chat-session-${messageData.session_id}`,
            relationship_type: 'belongs_to_session'
          }
        ]
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);

      // Log the creation
      await this._logChatMessage('create', {
        node_code: nodeCode,
        session_id: messageData.session_id,
        role: messageData.role,
        content_length: messageData.content.length
      });

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw error;
    }
  }

  /**
   * Query chat messages by criteria
   * @param {Object} criteria - Query criteria
   * @param {string} criteria.session_id - Filter by session ID
   * @param {string} criteria.role - Filter by role
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of message nodes
   */
  async queryChatMessages(criteria = {}, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      if (criteria.session_id) {
        query = query.eq('session_id', criteria.session_id);
      }
      if (criteria.role) {
        query = query.eq('role', criteria.role);
      }

      // Apply ordering
      query = query.order('created_at', { ascending: true });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data: messages, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to nodes
      const nodes = [];
      for (const message of messages) {
        const nodeCode = `ai-chat-message-${message.id}`;
        const node = await NodeFactory.queryNodes({ node_code: nodeCode });

        if (node && node.length > 0) {
          nodes.push(node[0]);
        } else {
          // Create node if it doesn't exist
          const nodeData = {
            node_code: nodeCode,
            node_type: this.nodeType,
            metadata: {
              session_id: message.session_id,
              role: message.role,
              content: message.content,
              database_id: message.id,
              created_at: message.created_at,
              ...message.metadata
            },
            relationships: [
              {
                target_node_code: `ai-chat-session-${message.session_id}`,
                relationship_type: 'belongs_to_session'
              }
            ]
          };

          const createdNode = await NodeFactory.createNonLiveNode(nodeData);
          nodes.push(createdNode);
        }
      }

      return nodes;
    } catch (error) {
      console.error('Error querying chat messages:', error);
      throw error;
    }
  }

  /**
   * Update a chat message
   * @param {string} nodeCode - Node code of the message to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated message node
   */
  async updateChatMessage(nodeCode, updateData) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-chat-message-', '');

      // Update database record
      const dbUpdateData = {};
      if (updateData.content !== undefined) dbUpdateData.content = updateData.content;
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
      await this._logChatMessage('update', {
        node_code: nodeCode,
        updates: Object.keys(updateData)
      });

      return {
        node: updatedNode,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error updating chat message:', error);
      throw error;
    }
  }

  /**
   * Delete a chat message
   * @param {string} nodeCode - Node code of the message to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteChatMessage(nodeCode) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-chat-message-', '');

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
      await this._logChatMessage('delete', {
        node_code: nodeCode
      });

      return true;
    } catch (error) {
      console.error('Error deleting chat message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of message nodes in chronological order
   */
  async getConversationHistory(sessionId, options = {}) {
    try {
      const criteria = { session_id: sessionId };
      const messages = await this.queryChatMessages(criteria, {
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return messages;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Log chat message operations to ai_chat_messages table
   * @private
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  async _logChatMessage(operation, details) {
    try {
      const logData = {
        session_id: details.session_id || 'system',
        role: 'system',
        content: `Chat message ${operation}: ${JSON.stringify(details)}`,
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        }
      };

      await supabase
        .from('ai_chat_messages')
        .insert(logData);

    } catch (error) {
      console.error('Error logging chat message operation:', error);
      // Don't throw - logging failure shouldn't break main operation
    }
  }
}

module.exports = {
  AIChatMessagesNode,
  aiChatMessagesNode: new AIChatMessagesNode()
};