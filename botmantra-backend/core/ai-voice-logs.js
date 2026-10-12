/**
 * AI Voice Logs Node
 * Node-based AI voice interaction logging system
 */

const NodeFactory = require('./nodeFactory');
const { supabase } = require('../config/supabase');

class AIVoiceLogsNode {
  constructor() {
    this.nodeFactory = new NodeFactory(supabase);
  }

  /**
   * Create a new voice log entry
   */
  async createVoiceLog(voiceData, nodeCode = null) {
    try {
      // Create the node first
      const nodeData = {
        node_type: 'ai_voice_logs',
        node_code: nodeCode || `voice_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        owner_id: voiceData.user_id,
        properties: {
          business_id: voiceData.business_id,
          user_id: voiceData.user_id,
          audio_url: voiceData.audio_url,
          transcript: voiceData.transcript,
          detected_intent: voiceData.detected_intent,
          confidence_score: voiceData.confidence_score || 0.0,
          processing_duration: voiceData.processing_duration || 0,
          audio_duration: voiceData.audio_duration || 0,
          language: voiceData.language || 'en',
          voice_provider: voiceData.voice_provider || 'unknown',
          sentiment: voiceData.sentiment || 'neutral',
          keywords: voiceData.keywords || [],
          entities: voiceData.entities || [],
          metadata: voiceData.metadata || {},
          is_active: voiceData.is_active !== false
        },
        relationships: [],
        tags: ['ai', 'voice', 'log', 'interaction'].concat(voiceData.tags || []),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Create database record
      const dbData = {
        id: node.node_code, // Use node_code as primary key
        business_id: voiceData.business_id,
        user_id: voiceData.user_id,
        audio_url: voiceData.audio_url,
        transcript: voiceData.transcript,
        detected_intent: voiceData.detected_intent,
        created_at: new Date().toISOString()
      };

      const { data: dbRecord, error: dbError } = await supabase
        .from('ai_voice_logs')
        .insert(dbData)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating voice log:', error);
      throw error;
    }
  }

  /**
   * Query voice logs with filters
   */
  async queryVoiceLogs(criteria = {}, options = {}) {
    try {
      let query = supabase
        .from('ai_voice_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (criteria.business_id) {
        query = query.eq('business_id', criteria.business_id);
      }
      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }
      if (criteria.detected_intent) {
        query = query.eq('detected_intent', criteria.detected_intent);
      }
      if (criteria.language) {
        query = query.eq('language', criteria.language);
      }
      if (criteria.voice_provider) {
        query = query.eq('voice_provider', criteria.voice_provider);
      }
      if (criteria.sentiment) {
        query = query.eq('sentiment', criteria.sentiment);
      }
      if (criteria.confidence_score && criteria.confidence_score.$gte !== undefined) {
        query = query.gte('confidence_score', criteria.confidence_score.$gte);
      }
      if (criteria.created_at && criteria.created_at.$gte) {
        query = query.gte('created_at', criteria.created_at.$gte);
      }
      if (criteria.created_at && criteria.created_at.$lte) {
        query = query.lte('created_at', criteria.created_at.$lte);
      }

      // Apply options
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const sort = options.sort || 'created_at';
      const order = options.order || 'desc';

      query = query
        .range(offset, offset + limit - 1)
        .order(sort, { ascending: order === 'asc' });

      const { data: logs, error, count } = await query;

      if (error) {
        throw error;
      }

      // Get corresponding nodes
      const nodeCodes = logs.map(log => log.id);
      const nodes = await this.nodeFactory.queryNodes({
        node_code: { $in: nodeCodes }
      });

      return {
        logs,
        nodes,
        total: count,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error querying voice logs:', error);
      throw error;
    }
  }

  /**
   * Get voice log by ID
   */
  async getVoiceLog(nodeCode, userId = null) {
    try {
      // Get database record
      let query = supabase
        .from('ai_voice_logs')
        .select('*')
        .eq('id', nodeCode);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: log, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Get corresponding node
      const node = await this.nodeFactory.getNodeByCode(nodeCode);

      return {
        log,
        node
      };
    } catch (error) {
      console.error('Error getting voice log:', error);
      throw error;
    }
  }

  /**
   * Update voice log
   */
  async updateVoiceLog(nodeCode, updateData) {
    try {
      // Update node properties
      const nodeUpdate = {
        properties: {},
        updated_at: new Date().toISOString()
      };

      // Map update data to node properties
      if (updateData.confidence_score !== undefined) {
        nodeUpdate.properties.confidence_score = updateData.confidence_score;
      }
      if (updateData.processing_duration !== undefined) {
        nodeUpdate.properties.processing_duration = updateData.processing_duration;
      }
      if (updateData.audio_duration !== undefined) {
        nodeUpdate.properties.audio_duration = updateData.audio_duration;
      }
      if (updateData.language !== undefined) {
        nodeUpdate.properties.language = updateData.language;
      }
      if (updateData.voice_provider !== undefined) {
        nodeUpdate.properties.voice_provider = updateData.voice_provider;
      }
      if (updateData.sentiment !== undefined) {
        nodeUpdate.properties.sentiment = updateData.sentiment;
      }
      if (updateData.keywords !== undefined) {
        nodeUpdate.properties.keywords = updateData.keywords;
      }
      if (updateData.entities !== undefined) {
        nodeUpdate.properties.entities = updateData.entities;
      }
      if (updateData.metadata !== undefined) {
        nodeUpdate.properties.metadata = updateData.metadata;
      }
      if (updateData.is_active !== undefined) {
        nodeUpdate.properties.is_active = updateData.is_active;
      }

      const node = await this.nodeFactory.updateNode(nodeCode, nodeUpdate);

      // Update database record (only allowed fields)
      const dbUpdate = {};
      if (updateData.detected_intent !== undefined) {
        dbUpdate.detected_intent = updateData.detected_intent;
      }

      if (Object.keys(dbUpdate).length > 0) {
        const { data: dbRecord, error: dbError } = await supabase
          .from('ai_voice_logs')
          .update(dbUpdate)
          .eq('id', nodeCode)
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        return {
          node,
          database_record: dbRecord
        };
      }

      return { node };
    } catch (error) {
      console.error('Error updating voice log:', error);
      throw error;
    }
  }

  /**
   * Delete voice log
   */
  async deleteVoiceLog(nodeCode) {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('ai_voice_logs')
        .delete()
        .eq('id', nodeCode);

      if (dbError) {
        throw dbError;
      }

      // Delete node
      const result = await this.nodeFactory.deleteNode(nodeCode);

      return { deleted: true };
    } catch (error) {
      console.error('Error deleting voice log:', error);
      throw error;
    }
  }

  /**
   * Get voice analytics for user
   */
  async getVoiceAnalytics(userId, dateRange = null) {
    try {
      let query = supabase
        .from('ai_voice_logs')
        .select('*')
        .eq('user_id', userId);

      if (dateRange) {
        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end);
        }
      }

      const { data: logs, error } = await query;

      if (error) {
        throw error;
      }

      // Calculate analytics
      const analytics = {
        total_interactions: logs.length,
        intents: {},
        sentiments: {},
        languages: {},
        providers: {},
        avg_confidence: 0,
        avg_duration: 0,
        total_audio_duration: 0
      };

      let totalConfidence = 0;
      let totalProcessingDuration = 0;
      let totalAudioDuration = 0;

      logs.forEach(log => {
        // Count intents
        analytics.intents[log.detected_intent] = (analytics.intents[log.detected_intent] || 0) + 1;

        // Count sentiments
        analytics.sentiments[log.sentiment] = (analytics.sentiments[log.sentiment] || 0) + 1;

        // Count languages
        analytics.languages[log.language] = (analytics.languages[log.language] || 0) + 1;

        // Count providers
        analytics.providers[log.voice_provider] = (analytics.providers[log.voice_provider] || 0) + 1;

        // Accumulate metrics
        totalConfidence += log.confidence_score || 0;
        totalProcessingDuration += log.processing_duration || 0;
        totalAudioDuration += log.audio_duration || 0;
      });

      analytics.avg_confidence = logs.length > 0 ? totalConfidence / logs.length : 0;
      analytics.avg_duration = logs.length > 0 ? totalProcessingDuration / logs.length : 0;
      analytics.total_audio_duration = totalAudioDuration;

      return analytics;
    } catch (error) {
      console.error('Error getting voice analytics:', error);
      throw error;
    }
  }

  /**
   * Search voice logs by transcript content
   */
  async searchVoiceLogs(searchQuery, userId, options = {}) {
    try {
      // Use text search on transcript field
      let query = supabase
        .from('ai_voice_logs')
        .select('*')
        .eq('user_id', userId)
        .ilike('transcript', `%${searchQuery}%`);

      // Apply options
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data: logs, error } = await query;

      if (error) {
        throw error;
      }

      // Get corresponding nodes
      const nodeCodes = logs.map(log => log.id);
      const nodes = await this.nodeFactory.queryNodes({
        node_code: { $in: nodeCodes }
      });

      return {
        logs,
        nodes,
        total: logs.length,
        search_query: searchQuery
      };
    } catch (error) {
      console.error('Error searching voice logs:', error);
      throw error;
    }
  }

  /**
   * Batch create voice logs
   */
  async batchCreateVoiceLogs(entries) {
    try {
      const results = [];
      const errors = [];

      for (const entry of entries) {
        try {
          const result = await this.createVoiceLog(entry.voiceData, entry.nodeCode);
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

// Export singleton instance
const aiVoiceLogsNode = new AIVoiceLogsNode();
module.exports = { aiVoiceLogsNode, AIVoiceLogsNode };