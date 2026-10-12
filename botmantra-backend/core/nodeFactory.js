/**
 * NODE FACTORY - Create LIVE and NON-LIVE nodes
 * 
 * LIVE NODES: Real entities with relationships
 * - Users, Family members, Friends, Groups
 * 
 * NON-LIVE NODES: Content and static objects
 * - Posts, Documents, Videos, Tasks, Homework, etc.
 */

const nodeCore = require('./nodeCore');

/**
 * NODE TYPE DEFINITIONS
 */
const NODE_TYPES = {
  // LIVE NODES - Entities with identity
  user: {
    category: 'live',
    is_entity: true,
    has_relationships: true,
    has_permissions: true,
    searchable: true
  },
  family_member: {
    category: 'live',
    is_entity: true,
    has_relationships: true,
    parent_required: true,
    visibility_options: ['family_only', 'private']
  },
  friend: {
    category: 'live',
    is_entity: true,
    has_relationships: true,
    visibility_options: ['friend_group', 'private']
  },
  group: {
    category: 'live',
    is_entity: true,
    has_relationships: true,
    has_members: true,
    visibility_options: ['public', 'private', 'invite_only']
  },
  company: {
    category: 'live',
    is_entity: true,
    has_relationships: true,
    has_employees: true,
    parent_required: true
  },
  employee: {
    category: 'live',
    is_entity: true,
    parent_required: true,
    visibility_options: ['company_only']
  },

  // NON-LIVE NODES - Content and objects
  post: {
    category: 'non_live',
    is_content: true,
    has_timestamp: true,
    archivable: true,
    visibility_options: ['public', 'friends', 'family_only', 'private']
  },
  document: {
    category: 'non_live',
    is_content: true,
    has_timestamp: true,
    versionable: true,
    visibility_options: ['public', 'private']
  },
  video: {
    category: 'non_live',
    is_content: true,
    has_timestamp: true,
    streamable: true,
    visibility_options: ['public', 'private', 'student_only']
  },
  task: {
    category: 'non_live',
    is_content: true,
    has_deadline: true,
    has_status: true,
    visibility_options: ['owner', 'team']
  },
  homework: {
    category: 'non_live',
    is_content: true,
    has_deadline: true,
    has_status: true,
    parent_required: true,
    validity_required: true,
    visibility_options: ['student_only', 'class_only']
  },
  message: {
    category: 'non_live',
    is_content: true,
    has_timestamp: true,
    ephemeral: true,
    visibility_options: ['recipient_only']
  },
  comment: {
    category: 'non_live',
    is_content: true,
    parent_required: true,
    visibility_options: ['same_as_parent']
  },
  course: {
    category: 'non_live',
    is_content: true,
    has_curriculum: true,
    visibility_options: ['public', 'students_enrolled']
  },
  event: {
    category: 'non_live',
    is_content: true,
    has_timestamp: true,
    has_rsvp: true,
    visibility_options: ['public', 'invited', 'private']
  },

  // SYSTEM NODES - Infrastructure and configuration
  brand_root: {
    category: 'system',
    is_config: true,
    visibility_options: ['public']
  },
  layout_schema: {
    category: 'system',
    is_config: true,
    parent_required: true,
    visibility_options: ['owner']
  },
  layout_widget: {
    category: 'system',
    is_config: true,
    parent_required: true,
    visibility_options: ['owner']
  },
  layout_section: {
    category: 'system',
    is_config: true,
    parent_required: true,
    visibility_options: ['owner']
  },
  vector_memory: {
    category: 'system',
    is_config: true,
    parent_required: true,
    visibility_options: ['owner']
  },
  permission_set: {
    category: 'system',
    is_config: true,
    parent_required: true,
    visibility_options: ['owner']
  },
  relationship_map: {
    category: 'system',
    is_config: true,
    parent_required: true,
    visibility_options: ['owner']
  }
};

/**
 * Node Factory
 */
class NodeFactory {
  /**
   * Create user node and initialize complete node ecosystem
   */
  async createUserNode(userId, userData) {
    try {
      const result = await nodeCore.initializeUserNode(userId, userData);

      if (!result.success) {
        return result;
      }

      return {
        success: true,
        user_node: result.user_node,
        vector_node: result.vector_node,
        relationship_node: result.relationship_node,
        layout_node: result.layout_node,
        permission_node: result.permission_node,
        active_brand: result.active_brand
      };
    } catch (error) {
      console.error('Create user node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load user node and all related nodes
   */
  async loadUserNode(userId) {
    try {
      return await nodeCore.loadUserNode(userId);
    } catch (error) {
      console.error('Load user node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Query nodes with filters
   */
  async queryNodes(queryParams) {
    try {
      return await nodeCore.queryNodes(queryParams);
    } catch (error) {
      console.error('Query nodes error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update node
   */
  async updateNode(rowId, updates) {
    try {
      return await nodeCore.updateNode(rowId, updates);
    } catch (error) {
      console.error('Update node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create LIVE node (entity) in node_core table
   */
  async createLiveNode(userId, nodeType, nodeData) {
    try {
      // Validate node type
      if (!NODE_TYPES[nodeType] || NODE_TYPES[nodeType].category !== 'live') {
        return {
          success: false,
          error: `${nodeType} is not a live node type`
        };
      }

      // Use nodeCore to create the child node
      const result = await nodeCore.createChildNode(userId, {
        node_type: nodeType,
        parent_nid_hash: nodeData.parent_nid_hash,
        node_depth: nodeData.node_depth,
        visibility: nodeData.visibility || 'private',
        metadata: {
          ...nodeData,
          entity_type: nodeType,
          is_live: true,
          has_relationships: NODE_TYPES[nodeType].has_relationships,
          relationships: []
        },
        ui_schema: {},
        validity: {
          valid_from: new Date().toISOString(),
          valid_until: null
        }
      });

      if (!result.success) {
        return result;
      }

      return {
        success: true,
        node: result.node,
        node_type: nodeType,
        is_entity: true
      };
    } catch (error) {
      console.error('Create live node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create NON-LIVE node (content) in node_core table
   */
  async createNonLiveNode(userId, nodeType, nodeData) {
    try {
      // Validate node type
      if (!NODE_TYPES[nodeType] || NODE_TYPES[nodeType].category !== 'non_live') {
        return {
          success: false,
          error: `${nodeType} is not a non-live node type`
        };
      }

      const nodeDef = NODE_TYPES[nodeType];

      // Use nodeCore to create the child node
      const result = await nodeCore.createChildNode(userId, {
        node_type: nodeType,
        visibility: nodeData.visibility || 'private',
        metadata: {
          ...nodeData,
          content_type: nodeType,
          is_live: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deadline: nodeDef.has_deadline ? nodeData.deadline : null,
          status: nodeDef.has_status ? (nodeData.status || 'pending') : null,
          valid_until: nodeDef.validity_required ? nodeData.valid_until : null
        },
        ui_schema: {},
        validity: {
          valid_from: new Date().toISOString(),
          valid_until: nodeDef.validity_required ? nodeData.valid_until : null
        }
      });

      if (!result.success) {
        return result;
      }

      return {
        success: true,
        node: result.node,
        node_type: nodeType,
        is_content: true
      };
    } catch (error) {
      console.error('Create non-live node error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create post (Vanshawali)
   */
  async createPost(userId, postData) {
    return this.createNonLiveNode(userId, 'post', {
      title: postData.title,
      content: postData.content,
      media: postData.media || [],
      visibility: postData.visibility || 'friends',
      tags: postData.tags || [],
      mentions: postData.mentions || []
    });
  }

  /**
   * Create family member (Vanshawali)
   */
  async createFamilyMember(userId, memberData) {
    return this.createLiveNode(userId, 'family_member', {
      name: memberData.name,
      relation_type: memberData.relation_type, // parent, sibling, child, etc.
      age: memberData.age,
      profile_picture: memberData.profile_picture,
      visibility: 'family_only',
      parent_nid_hash: memberData.parent_nid_hash,
      relation_type: memberData.relation_type
    });
  }

  /**
   * Create homework assignment (JeetMantra)
   */
  async createHomework(teacherId, homeworkData) {
    return this.createNonLiveNode(teacherId, 'homework', {
      title: homeworkData.title,
      description: homeworkData.description,
      subject: homeworkData.subject,
      class_id: homeworkData.class_id,
      deadline: homeworkData.deadline,
      instructions: homeworkData.instructions,
      attachments: homeworkData.attachments || [],
      visibility: 'student_only',
      valid_until: homeworkData.deadline,
      status: 'published'
    });
  }

  /**
   * Create task (Mantravat)
   */
  async createTask(userId, taskData) {
    return this.createNonLiveNode(userId, 'task', {
      title: taskData.title,
      description: taskData.description,
      assigned_to: taskData.assigned_to,
      deadline: taskData.deadline,
      priority: taskData.priority || 'medium',
      status: 'open',
      company_id: taskData.company_id,
      visibility: 'team'
    });
  }

  /**
   * Create company (Mantravat)
   */
  async createCompany(userId, companyData) {
    return this.createLiveNode(userId, 'company', {
      name: companyData.name,
      description: companyData.description,
      industry: companyData.industry,
      size: companyData.size,
      logo: companyData.logo,
      visibility: 'public',
      parent_node: userId,
      relation_type: 'owns'
    });
  }

  /**
   * Create video (JeetMantra/Junior Mantra)
   */
  async createVideo(userId, videoData) {
    return this.createNonLiveNode(userId, 'video', {
      title: videoData.title,
      description: videoData.description,
      url: videoData.url,
      duration: videoData.duration,
      thumbnail: videoData.thumbnail,
      tags: videoData.tags || [],
      visibility: videoData.visibility || 'public',
      age_restriction: videoData.age_restriction || null
    });
  }

  /**
   * Get default permissions for node type
   */
  getDefaultPermissions(nodeType, nodeData) {
    const permissions = {
      can_view: true,
      can_edit: true,
      can_delete: true,
      can_share: false
    };

    // Role-specific permissions
    if (nodeType === 'company') {
      permissions.can_add_employees = true;
      permissions.can_manage_roles = true;
    }

    if (nodeType === 'family_member') {
      permissions.can_view = true;
      permissions.can_edit = false;
      permissions.can_share = false;
    }

    return permissions;
  }

  /**
   * Bulk create nodes
   */
  async bulkCreateNodes(userId, nodesList) {
    try {
      const results = [];

      for (const item of nodesList) {
        if (item.is_live) {
          const result = await this.createLiveNode(
            userId,
            item.node_type,
            item.data
          );
          results.push(result);
        } else {
          const result = await this.createNonLiveNode(
            userId,
            item.node_type,
            item.data
          );
          results.push(result);
        }
      }

      return {
        success: true,
        created_nodes: results.length,
        results
      };
    } catch (error) {
      console.error('Bulk create error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get node type definition
   */
  getNodeTypeDefinition(nodeType) {
    return NODE_TYPES[nodeType] || null;
  }

  /**
   * List all node types
   */
  getAllNodeTypes() {
    return {
      live_nodes: Object.entries(NODE_TYPES)
        .filter(([_, def]) => def.category === 'live')
        .reduce((acc, [key, def]) => ({ ...acc, [key]: def }), {}),
      non_live_nodes: Object.entries(NODE_TYPES)
        .filter(([_, def]) => def.category === 'non_live')
        .reduce((acc, [key, def]) => ({ ...acc, [key]: def }), {})
    };
  }
}

module.exports = NodeFactory;
