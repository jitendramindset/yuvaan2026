/**
 * AI Generated Templates Node System
 * Neural OS Integration for AI Generated Templates Management
 */

const NodeFactory = require('./nodeFactory');
const { supabase } = require('../config/supabase');

class AIGeneratedTemplatesNode {
  constructor() {
    this.nodeType = 'ai-generated-templates';
    this.tableName = 'ai_generated_templates';
  }

  /**
   * Create a new AI-generated template node
   * @param {Object} templateData - Template data
   * @param {string} templateData.request_id - Request ID that generated this template
   * @param {string} templateData.template_code - Generated template code
   * @param {Object} templateData.config - Template configuration
   * @param {Object} templateData.metadata - Additional metadata
   * @param {string} nodeCode - Node code for identification
   * @returns {Promise<Object>} Created template node
   */
  async createGeneratedTemplate(templateData, nodeCode = null) {
    try {
      // Generate node code if not provided
      if (!nodeCode) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        nodeCode = `ai-generated-template-${timestamp}-${randomId}`;
      }

      // Create the database record
      const dbData = {
        request_id: templateData.request_id,
        template_code: templateData.template_code,
        config: templateData.config,
        metadata: templateData.metadata || {}
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
          request_id: templateData.request_id,
          template_code: templateData.template_code,
          config: templateData.config,
          database_id: dbRecord.id,
          created_at: dbRecord.created_at,
          usage_count: 0,
          rating: null,
          is_active: true,
          ...templateData.metadata
        },
        relationships: [
          {
            target_node_code: `ai-dashboard-request-${templateData.request_id}`,
            relationship_type: 'generated_from_request'
          }
        ]
      };

      const node = await NodeFactory.createNonLiveNode(nodeData);

      // Log the creation
      await this._logGeneratedTemplate('create', {
        node_code: nodeCode,
        request_id: templateData.request_id,
        template_code_length: templateData.template_code.length
      });

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error creating generated template:', error);
      throw error;
    }
  }

  /**
   * Query AI-generated templates by criteria
   * @param {Object} criteria - Query criteria
   * @param {string} criteria.request_id - Filter by request ID
   * @param {boolean} criteria.is_active - Filter by active status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of template nodes
   */
  async queryGeneratedTemplates(criteria = {}, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      if (criteria.request_id) {
        query = query.eq('request_id', criteria.request_id);
      }
      if (criteria.is_active !== undefined) {
        query = query.eq('is_active', criteria.is_active);
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

      const { data: templates, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to nodes
      const nodes = [];
      for (const template of templates) {
        const nodeCode = `ai-generated-template-${template.id}`;
        const node = await NodeFactory.queryNodes({ node_code: nodeCode });

        if (node && node.length > 0) {
          nodes.push(node[0]);
        } else {
          // Create node if it doesn't exist
          const nodeData = {
            node_code: nodeCode,
            node_type: this.nodeType,
            metadata: {
              request_id: template.request_id,
              template_code: template.template_code,
              config: template.config,
              database_id: template.id,
              created_at: template.created_at,
              usage_count: template.usage_count || 0,
              rating: template.rating,
              is_active: template.is_active !== false,
              ...template.metadata
            },
            relationships: [
              {
                target_node_code: `ai-dashboard-request-${template.request_id}`,
                relationship_type: 'generated_from_request'
              }
            ]
          };

          const createdNode = await NodeFactory.createNonLiveNode(nodeData);
          nodes.push(createdNode);
        }
      }

      return nodes;
    } catch (error) {
      console.error('Error querying generated templates:', error);
      throw error;
    }
  }

  /**
   * Update a generated template
   * @param {string} nodeCode - Node code of the template to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated template node
   */
  async updateGeneratedTemplate(nodeCode, updateData) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-generated-template-', '');

      // Update database record
      const dbUpdateData = {};
      if (updateData.template_code !== undefined) dbUpdateData.template_code = updateData.template_code;
      if (updateData.config !== undefined) dbUpdateData.config = updateData.config;
      if (updateData.usage_count !== undefined) dbUpdateData.usage_count = updateData.usage_count;
      if (updateData.rating !== undefined) dbUpdateData.rating = updateData.rating;
      if (updateData.is_active !== undefined) dbUpdateData.is_active = updateData.is_active;
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
      await this._logGeneratedTemplate('update', {
        node_code: nodeCode,
        updates: Object.keys(updateData)
      });

      return {
        node: updatedNode,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('Error updating generated template:', error);
      throw error;
    }
  }

  /**
   * Increment usage count for a template
   * @param {string} nodeCode - Node code of the template
   * @returns {Promise<Object>} Updated template node
   */
  async incrementUsage(nodeCode) {
    try {
      // Get current usage count
      const templates = await this.queryGeneratedTemplates();
      const template = templates.find(node => node.node_code === nodeCode);

      if (!template) {
        throw new Error('Template not found');
      }

      const currentUsage = template.metadata.usage_count || 0;
      return await this.updateGeneratedTemplate(nodeCode, {
        usage_count: currentUsage + 1
      });
    } catch (error) {
      console.error('Error incrementing template usage:', error);
      throw error;
    }
  }

  /**
   * Rate a template
   * @param {string} nodeCode - Node code of the template
   * @param {number} rating - Rating value (1-5)
   * @param {string} feedback - Optional feedback
   * @returns {Promise<Object>} Updated template node
   */
  async rateTemplate(nodeCode, rating, feedback = null) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const updateData = { rating };
      if (feedback) {
        updateData.feedback = feedback;
      }

      return await this.updateGeneratedTemplate(nodeCode, updateData);
    } catch (error) {
      console.error('Error rating template:', error);
      throw error;
    }
  }

  /**
   * Delete a generated template
   * @param {string} nodeCode - Node code of the template to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteGeneratedTemplate(nodeCode) {
    try {
      // Extract database ID from node code
      const databaseId = nodeCode.replace('ai-generated-template-', '');

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
          deleted_at: new Date().toISOString(),
          is_active: false
        }
      };

      await NodeFactory.updateNode(nodeCode, nodeUpdateData);

      // Log the deletion
      await this._logGeneratedTemplate('delete', {
        node_code: nodeCode
      });

      return true;
    } catch (error) {
      console.error('Error deleting generated template:', error);
      throw error;
    }
  }

  /**
   * Get templates by request ID
   * @param {string} requestId - Request ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of template nodes for the request
   */
  async getTemplatesByRequest(requestId, options = {}) {
    try {
      const criteria = { request_id: requestId };
      const templates = await this.queryGeneratedTemplates(criteria, {
        limit: options.limit || 10,
        offset: options.offset || 0
      });

      return templates;
    } catch (error) {
      console.error('Error getting templates by request:', error);
      throw error;
    }
  }

  /**
   * Get popular templates (by usage count)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of popular template nodes
   */
  async getPopularTemplates(options = {}) {
    try {
      // Get all active templates and sort by usage count
      const allTemplates = await this.queryGeneratedTemplates({ is_active: true });

      // Sort by usage count descending
      const sortedTemplates = allTemplates.sort((a, b) => {
        const aUsage = a.metadata.usage_count || 0;
        const bUsage = b.metadata.usage_count || 0;
        return bUsage - aUsage;
      });

      // Apply pagination
      const limit = options.limit || 10;
      const offset = options.offset || 0;

      return sortedTemplates.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error getting popular templates:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   * @param {string} requestId - Optional request ID filter
   * @returns {Promise<Object>} Template statistics
   */
  async getTemplateStats(requestId = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('request_id, usage_count, rating, is_active, created_at');

      if (requestId) {
        query = query.eq('request_id', requestId);
      }

      const { data: templates, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const stats = {
        total_templates: templates.length,
        active_templates: 0,
        total_usage: 0,
        avg_rating: 0,
        templates_by_request: {},
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      let totalRating = 0;
      let ratedCount = 0;

      templates.forEach(template => {
        if (template.is_active !== false) {
          stats.active_templates++;
        }

        stats.total_usage += template.usage_count || 0;

        // Count by request
        stats.templates_by_request[template.request_id] = (stats.templates_by_request[template.request_id] || 0) + 1;

        // Rating stats
        if (template.rating) {
          totalRating += template.rating;
          ratedCount++;
          stats.rating_distribution[template.rating] = (stats.rating_distribution[template.rating] || 0) + 1;
        }
      });

      stats.avg_rating = ratedCount > 0 ? totalRating / ratedCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting template stats:', error);
      throw error;
    }
  }

  /**
   * Log generated template operations to ai_generated_templates table
   * @private
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  async _logGeneratedTemplate(operation, details) {
    try {
      const logData = {
        request_id: details.request_id || 'system',
        template_code: `Template ${operation}: ${details.node_code || 'unknown'}`,
        config: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        },
        metadata: {
          operation,
          timestamp: new Date().toISOString(),
          ...details
        }
      };

      await supabase
        .from('ai_generated_templates')
        .insert(logData);

    } catch (error) {
      console.error('Error logging generated template operation:', error);
      // Don't throw - logging failure shouldn't break main operation
    }
  }
}

module.exports = {
  AIGeneratedTemplatesNode,
  aiGeneratedTemplatesNode: new AIGeneratedTemplatesNode()
};