/**
 * AI Agent Templates Node
 * Node-based AI agent template management within the neural OS architecture
 */

const NodeFactory = require('./nodeFactory');

class AIAgentTemplatesNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Create a new AI agent template node
   * @param {string} nodeCode - Node code for identification
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created node
   */
  async createAgentTemplateNode(nodeCode, templateData) {
    try {
      const nodeData = {
        node_code: nodeCode,
        node_type: 'ai_agent_template',
        node_category: 'ai_agent_template',
        metadata: {
          name: templateData.name,
          description: templateData.description,
          system_prompt: templateData.system_prompt,
          rag_enabled: templateData.rag_enabled || false,
          tools: templateData.tools || [],
          model_config: templateData.model_config || {},
          temperature: templateData.temperature || 0.7,
          max_tokens: templateData.max_tokens || 1000,
          is_active: templateData.is_active !== undefined ? templateData.is_active : true,
          business_id: templateData.business_id,
          tags: templateData.tags || [],
          version: templateData.version || '1.0.0',
          created_by: templateData.created_by
        },
        relationships: {
          parent_nodes: [],
          child_nodes: [],
          related_nodes: []
        },
        permissions: {
          read: ['owner', 'admin'],
          write: ['owner', 'admin'],
          delete: ['owner', 'admin']
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);
      return node;
    } catch (error) {
      console.error('Error creating AI agent template node:', error);
      throw error;
    }
  }

  /**
   * Query AI agent template nodes with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of matching nodes
   */
  async queryAgentTemplateNodes(filters = {}) {
    try {
      const query = {
        node_type: 'ai_agent_template'
      };

      // Add metadata filters
      if (filters.name) query['metadata.name'] = filters.name;
      if (filters.rag_enabled !== undefined) query['metadata.rag_enabled'] = filters.rag_enabled;
      if (filters.is_active !== undefined) query['metadata.is_active'] = filters.is_active;
      if (filters.business_id) query['metadata.business_id'] = filters.business_id;
      if (filters.tags && filters.tags.length > 0) {
        query['metadata.tags'] = { $in: filters.tags };
      }
      if (filters.node_code) query.node_code = filters.node_code;

      const nodes = await this.nodeFactory.queryNodes(query);
      return nodes;
    } catch (error) {
      console.error('Error querying AI agent template nodes:', error);
      throw error;
    }
  }

  /**
   * Update an AI agent template node
   * @param {string} nodeCode - Node code to update
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated node
   */
  async updateAgentTemplateNode(nodeCode, updates) {
    try {
      const node = await this.nodeFactory.updateNode(nodeCode, updates);
      return node;
    } catch (error) {
      console.error('Error updating AI agent template node:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getTemplateStatistics() {
    try {
      const allTemplates = await this.queryAgentTemplateNodes();

      const stats = {
        total_templates: allTemplates.length,
        active_templates: allTemplates.filter(t => t.metadata.is_active).length,
        rag_enabled_templates: allTemplates.filter(t => t.metadata.rag_enabled).length,
        templates_by_version: {},
        templates_by_business: {},
        average_tools_per_template: 0
      };

      let totalTools = 0;
      allTemplates.forEach(template => {
        // Version stats
        const version = template.metadata.version || 'unknown';
        stats.templates_by_version[version] = (stats.templates_by_version[version] || 0) + 1;

        // Business stats
        const businessId = template.metadata.business_id || 'unknown';
        stats.templates_by_business[businessId] = (stats.templates_by_business[businessId] || 0) + 1;

        // Tools count
        totalTools += (template.metadata.tools || []).length;
      });

      stats.average_tools_per_template = allTemplates.length > 0 ? totalTools / allTemplates.length : 0;

      return stats;
    } catch (error) {
      console.error('Error getting template statistics:', error);
      throw error;
    }
  }

  /**
   * Instantiate a template into a live agent
   * @param {string} templateNodeCode - Template node code
   * @param {Object} instanceData - Instance-specific data
   * @returns {Promise<Object>} Live agent node
   */
  async instantiateTemplate(templateNodeCode, instanceData = {}) {
    try {
      const templateNodes = await this.queryAgentTemplateNodes({ node_code: templateNodeCode });
      if (templateNodes.length === 0) {
        throw new Error('Template not found');
      }

      const template = templateNodes[0];
      const instanceNodeCode = instanceData.node_code || `${templateNodeCode}_instance_${Date.now()}`;

      const instanceData_combined = {
        ...template.metadata,
        ...instanceData,
        template_node_code: templateNodeCode,
        instantiated_at: new Date().toISOString(),
        instance_config: instanceData.instance_config || {}
      };

      const liveNode = await this.nodeFactory.createLiveNode({
        node_code: instanceNodeCode,
        node_type: 'ai_agent_instance',
        node_category: 'ai_agent',
        metadata: instanceData_combined,
        relationships: {
          parent_nodes: [templateNodeCode],
          child_nodes: [],
          related_nodes: []
        },
        permissions: {
          read: ['owner', 'admin'],
          write: ['owner', 'admin'],
          delete: ['owner', 'admin']
        }
      });

      return liveNode;
    } catch (error) {
      console.error('Error instantiating template:', error);
      throw error;
    }
  }

  /**
   * Clone an existing template
   * @param {string} sourceNodeCode - Source template node code
   * @param {Object} modifications - Modifications to apply
   * @returns {Promise<Object>} Cloned template node
   */
  async cloneTemplate(sourceNodeCode, modifications = {}) {
    try {
      const sourceNodes = await this.queryAgentTemplateNodes({ node_code: sourceNodeCode });
      if (sourceNodes.length === 0) {
        throw new Error('Source template not found');
      }

      const sourceTemplate = sourceNodes[0];
      const cloneNodeCode = modifications.node_code || `${sourceNodeCode}_clone_${Date.now()}`;

      const clonedData = {
        ...sourceTemplate.metadata,
        ...modifications,
        name: modifications.name || `${sourceTemplate.metadata.name} (Clone)`,
        description: modifications.description || `${sourceTemplate.metadata.description} (Cloned)`,
        version: modifications.version || '1.0.0',
        cloned_from: sourceNodeCode,
        cloned_at: new Date().toISOString()
      };

      const clonedNode = await this.createAgentTemplateNode(cloneNodeCode, clonedData);
      return clonedNode;
    } catch (error) {
      console.error('Error cloning template:', error);
      throw error;
    }
  }
}

module.exports = AIAgentTemplatesNode;