/**
 * AI Preferences Node
 * Node-based AI preferences management for user-specific AI settings
 */

const NodeFactory = require('./nodeFactory');

class AIPreferencesNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Create new AI preferences entry
   */
  async createPreferences(preferencesData, nodeCode) {
    try {
      // Create the node first
      const nodeData = {
        node_type: 'ai_preferences',
        node_code: nodeCode || `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: preferencesData.user_id,
        data: {
          preferences: preferencesData.preferences || {},
          updated_at: new Date().toISOString()
        },
        metadata: {
          created_at: new Date().toISOString(),
          version: '1.0.0',
          source: 'ai_preferences_system'
        },
        relationships: [],
        is_active: true
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Insert into ai_preferences table
      const dbData = {
        id: node.node_id, // Use node_id as primary key
        user_id: preferencesData.user_id,
        preferences: preferencesData.preferences || {},
        updated_at: new Date().toISOString()
      };

      const { data: dbRecord, error: dbError } = await this.db
        .from('ai_preferences')
        .insert(dbData)
        .select()
        .single();

      if (dbError) {
        console.error('AI preferences database insert error:', dbError);
        throw dbError;
      }

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('AI preferences creation error:', error);
      throw error;
    }
  }

  /**
   * Query AI preferences entries
   */
  async queryPreferences(criteria = {}, options = {}) {
    try {
      let query = this.db
        .from('ai_preferences')
        .select('*', { count: 'exact' });

      // Apply filters
      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }

      // Apply sorting and pagination
      const sortField = options.sort || 'updated_at';
      const sortOrder = options.order === 'asc';
      query = query.order(sortField, { ascending: sortOrder });

      if (options.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      const { data: preferences, error, count } = await query;

      if (error) {
        console.error('AI preferences query error:', error);
        throw error;
      }

      // Get corresponding nodes
      const nodeIds = preferences.map(p => p.id);
      const nodes = await this.nodeFactory.queryNodes({
        node_id: nodeIds,
        node_type: 'ai_preferences'
      });

      return {
        preferences,
        nodes: nodes.nodes,
        total: count,
        limit: options.limit,
        offset: options.offset
      };
    } catch (error) {
      console.error('AI preferences query error:', error);
      throw error;
    }
  }

  /**
   * Get preferences by user ID
   */
  async getUserPreferences(userId) {
    try {
      const result = await this.queryPreferences({ user_id: userId }, { limit: 1 });

      if (result.preferences.length === 0) {
        return null;
      }

      return {
        preferences: result.preferences[0],
        node: result.nodes[0]
      };
    } catch (error) {
      console.error('Get user preferences error:', error);
      throw error;
    }
  }

  /**
   * Update AI preferences
   */
  async updatePreferences(nodeCode, updateData) {
    try {
      // Update the node
      const nodeUpdate = {
        data: {
          preferences: updateData.preferences,
          updated_at: new Date().toISOString()
        },
        metadata: {
          updated_at: new Date().toISOString(),
          version: updateData.version || '1.0.1'
        }
      };

      const node = await this.nodeFactory.updateNode(nodeCode, nodeUpdate);

      // Update database record
      const dbUpdate = {
        preferences: updateData.preferences,
        updated_at: new Date().toISOString()
      };

      const { data: dbRecord, error: dbError } = await this.db
        .from('ai_preferences')
        .update(dbUpdate)
        .eq('id', node.node_id)
        .select()
        .single();

      if (dbError) {
        console.error('AI preferences database update error:', dbError);
        throw dbError;
      }

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('AI preferences update error:', error);
      throw error;
    }
  }

  /**
   * Update user preferences (upsert pattern)
   */
  async updateUserPreferences(userId, preferences, nodeCode = null) {
    try {
      // Check if preferences already exist for this user
      const existing = await this.getUserPreferences(userId);

      if (existing) {
        // Update existing preferences
        return await this.updatePreferences(existing.node.node_code, { preferences });
      } else {
        // Create new preferences
        return await this.createPreferences({
          user_id: userId,
          preferences
        }, nodeCode);
      }
    } catch (error) {
      console.error('Update user preferences error:', error);
      throw error;
    }
  }

  /**
   * Get preference value by key
   */
  async getPreferenceValue(userId, key, defaultValue = null) {
    try {
      const userPrefs = await this.getUserPreferences(userId);

      if (!userPrefs) {
        return defaultValue;
      }

      const preferences = userPrefs.preferences.preferences || {};
      return preferences[key] !== undefined ? preferences[key] : defaultValue;
    } catch (error) {
      console.error('Get preference value error:', error);
      return defaultValue;
    }
  }

  /**
   * Set preference value by key
   */
  async setPreferenceValue(userId, key, value, nodeCode = null) {
    try {
      const userPrefs = await this.getUserPreferences(userId);
      const currentPrefs = userPrefs ? userPrefs.preferences.preferences || {} : {};

      // Update the specific preference
      currentPrefs[key] = value;

      return await this.updateUserPreferences(userId, currentPrefs, nodeCode);
    } catch (error) {
      console.error('Set preference value error:', error);
      throw error;
    }
  }

  /**
   * Delete AI preferences
   */
  async deletePreferences(nodeCode) {
    try {
      // Get the node to find the database ID
      const node = await this.nodeFactory.queryNodes({
        node_code: nodeCode,
        node_type: 'ai_preferences'
      }, { limit: 1 });

      if (node.nodes.length === 0) {
        throw new Error('Preferences node not found');
      }

      const nodeId = node.nodes[0].node_id;

      // Delete from database
      const { error: dbError } = await this.db
        .from('ai_preferences')
        .delete()
        .eq('id', nodeId);

      if (dbError) {
        console.error('AI preferences database delete error:', dbError);
        throw dbError;
      }

      // Delete the node
      await this.nodeFactory.deleteNode(nodeCode);

      return { deleted: true };
    } catch (error) {
      console.error('AI preferences delete error:', error);
      throw error;
    }
  }

  /**
   * Get preferences statistics
   */
  async getPreferencesStats() {
    try {
      const { data: stats, error } = await this.db
        .from('ai_preferences')
        .select('user_id, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('AI preferences stats error:', error);
        throw error;
      }

      const totalUsers = new Set(stats.map(s => s.user_id)).size;
      const recentUpdates = stats.filter(s => {
        const updatedAt = new Date(s.updated_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return updatedAt > weekAgo;
      }).length;

      return {
        total_users: totalUsers,
        total_entries: stats.length,
        recent_updates: recentUpdates,
        average_per_user: totalUsers > 0 ? (stats.length / totalUsers).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Get preferences stats error:', error);
      throw error;
    }
  }

  /**
   * Batch update preferences for multiple users
   */
  async batchUpdatePreferences(updates) {
    try {
      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const result = await this.updateUserPreferences(
            update.user_id,
            update.preferences,
            update.node_code
          );
          results.push(result);
        } catch (error) {
          errors.push({
            user_id: update.user_id,
            error: error.message
          });
        }
      }

      return {
        successful: results,
        failed: errors,
        total_processed: updates.length,
        success_count: results.length,
        error_count: errors.length
      };
    } catch (error) {
      console.error('Batch update preferences error:', error);
      throw error;
    }
  }

  /**
   * Export user preferences
   */
  async exportUserPreferences(userId) {
    try {
      const userPrefs = await this.getUserPreferences(userId);

      if (!userPrefs) {
        return null;
      }

      return {
        user_id: userId,
        preferences: userPrefs.preferences.preferences,
        exported_at: new Date().toISOString(),
        node_code: userPrefs.node.node_code,
        metadata: userPrefs.node.metadata
      };
    } catch (error) {
      console.error('Export user preferences error:', error);
      throw error;
    }
  }

  /**
   * Import user preferences
   */
  async importUserPreferences(importData, nodeCode = null) {
    try {
      return await this.updateUserPreferences(
        importData.user_id,
        importData.preferences,
        nodeCode
      );
    } catch (error) {
      console.error('Import user preferences error:', error);
      throw error;
    }
  }
}

module.exports = { AIPreferencesNode };