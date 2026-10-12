/**
 * NODE CORE - Neural OS Graph Database Management
 * 
 * Every entity in the system is a NODE:
 * - Users
 * - Brands
 * - Relationships
 * - Content (posts, homework, etc.)
 * - Layouts
 * - Permissions
 * 
 * NODE = First-class citizen in the system
 */

const { createClient } = require('@supabase/supabase-js');
const {
  MASTER_NODE_SCHEMA,
  buildNodeCoreRow,
  encodeToBlob,
  decodeFromBlob,
  defaultUserMetadata,
  defaultDashboardLayoutMetadata
} = require('./node-schema');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * NODE CORE SCHEMA (node_core table)
 * Every node must have these fields in modern kernel schema
 */
// const NODE_SCHEMA = {
//   row_id: 'bigint',           // PK - SERIAL
//   owner_id: 'uuid',           // Owner reference (was owner_node)
//   nid_hash: 'text',           // SHA256(owner_id) - unique identifier
//   dna_blob: 'bytea',          // Serialized DNA/structure
//   field_map: 'bytea',         // Serialized metadata (was metadata JSONB)
//   perm_blob: 'bytea',         // Serialized permissions (was permissions JSONB)
//   memory_blob: 'bytea',       // Vector memory storage
//   vec_embedding: 'pgvector',  // Vector embeddings
//   karma_score: 'integer',
//   trust_score: 'integer',
//   node_state: 'text',         // active, archived, deleted (was status)
//   node_type: 'string',        // user, post, family, task, etc.
//   parent_nid_hash: 'text',    // Parent reference (was parent_node)
//   created_at: 'timestamp',
//   updated_at: 'timestamp'
// };

/**
 * Create node core for new user
 */
class NodeCoreManager {
  /**
   * Initialize node core for user on signup
   */
  async initializeUserNode(userId, userData) {
    try {
      const {
        email,
        name,
        age,
        phone,
        profile_picture
      } = userData;

      // Create main user node in node_core table
      const nidHash = require('crypto')
        .createHash('sha256')
        .update(userId)
        .digest('hex');
      
      // Determine brand based on age
      const brandRoot = this.getActiveBrandByAge(age);
      
      // Create user metadata
      const userMetadata = defaultUserMetadata({
        full_name: name,
        email,
        age,
        mobile: phone,
        avatar_url: profile_picture,
        profile_type: 'personal',
        brand_default: brandRoot
      });
      
      // Build user node row using schema
      const userNodeData = buildNodeCoreRow('user', userId, userMetadata, {
        permissions: {
          can_create_posts: true,
          can_invite_friends: true,
          can_manage_profile: true
        },
        brand_scope: brandRoot,
        visibility: 'private'
      });
      
      const { data: userNode, error: nodeError } = await supabase
        .from('node_core')
        .insert(userNodeData)
        .select()
        .single();

      if (nodeError) throw nodeError;

      // Create vector memory container for user in node_core
      const vectorMetadata = {
        memory_type: 'user_context',
        embeddings: [],
        last_updated: new Date().toISOString()
      };
      
      const vectorNodeData = buildNodeCoreRow('vector_memory', userId, vectorMetadata, {
        parent_nid_hash: userNode.nid_hash,
        brand_scope: brandRoot
      });
      
      const { data: vectorNode, error: vectorError } = await supabase
        .from('node_core')
        .insert(vectorNodeData)
        .select()
        .single();

      if (vectorError) throw vectorError;

      // Create relationship container in node_core
      const relMetadata = {
        relationships: []
      };
      
      const relNodeData = buildNodeCoreRow('relationship_map', userId, relMetadata, {
        parent_nid_hash: userNode.nid_hash,
        brand_scope: brandRoot
      });
      
      const { data: relNode, error: relError } = await supabase
        .from('node_core')
        .insert(relNodeData)
        .select()
        .single();

      if (relError) throw relError;

      // Create default layout node in node_core
      const layoutMetadata = defaultDashboardLayoutMetadata('grid');
      layoutMetadata.active_brand = brandRoot;
      layoutMetadata.ui_schema = this.getDefaultLayout(age);
      
      const layoutNodeData = buildNodeCoreRow('layout_schema', userId, layoutMetadata, {
        parent_nid_hash: userNode.nid_hash,
        brand_scope: brandRoot
      });
      
      const { data: layoutNode, error: layoutError } = await supabase
        .from('node_core')
        .insert(layoutNodeData)
        .select()
        .single();

      if (layoutError) throw layoutError;

      // Create permission object in node_core
      const permMetadata = {};
      
      const permNodeData = buildNodeCoreRow('permission_set', userId, permMetadata, {
        parent_nid_hash: userNode.nid_hash,
        brand_scope: brandRoot,
        permissions: {
          role: 'basic_user',
          permissions: this.getDefaultPermissions(age),
          restrictions: this.getAgeRestrictions(age)
        }
      });
      
      const { data: permNode, error: permError } = await supabase
        .from('node_core')
        .insert(permNodeData)
        .select()
        .single();

      if (permError) throw permError;

      return {
        success: true,
        user_node: userNode,
        vector_node: vectorNode,
        relationship_node: relNode,
        layout_node: layoutNode,
        permission_node: permNode,
        active_brand: this.getActiveBrandByAge(age)
      };
    } catch (error) {
      console.error('Node initialization error:', error);
      throw error;
    }
  }

  /**
   * Get active brand based on age
   */
  getActiveBrandByAge(age) {
    if (age < 10) return 'junior_mantra';
    if (age < 18) return 'jeetmantra';
    return 'mantravat';
  }

  /**
   * Get default layout for age/brand
   */
  getDefaultLayout(age) {
    const brand = this.getActiveBrandByAge(age);

    const layouts = {
      junior_mantra: {
        brand: 'junior_mantra',
        layout_type: 'safe_feed',
        widgets: [
          { type: 'video_feed', position: 0 },
          { type: 'games', position: 1 },
          { type: 'learning', position: 2 },
          { type: 'parent_connection', position: 3 }
        ],
        safe_mode: true
      },
      jeetmantra: {
        brand: 'jeetmantra',
        layout_type: 'student_dashboard',
        widgets: [
          { type: 'assignment_list', position: 0 },
          { type: 'class_schedule', position: 1 },
          { type: 'grades', position: 2 },
          { type: 'study_material', position: 3 }
        ]
      },
      mantravat: {
        brand: 'mantravat',
        layout_type: 'business_dashboard',
        widgets: [
          { type: 'company_overview', position: 0 },
          { type: 'tasks', position: 1 },
          { type: 'analytics', position: 2 },
          { type: 'team', position: 3 }
        ]
      },
      vanshawali: {
        brand: 'vanshawali',
        layout_type: 'social_feed',
        widgets: [
          { type: 'social_feed', position: 0 },
          { type: 'family_tree', position: 1 },
          { type: 'connections', position: 2 },
          { type: 'notifications', position: 3 }
        ]
      }
    };

    return layouts[brand] || layouts.vanshawali;
  }

  /**
   * Get default permissions based on age
   */
  getDefaultPermissions(age) {
    if (age < 10) {
      return {
        can_create_posts: false,
        can_send_messages: false,
        can_join_groups: false,
        can_edit_profile: false,
        can_view_social: false,
        can_access_parent_only: true
      };
    }

    if (age < 18) {
      return {
        can_create_posts: true,
        can_send_messages: true,
        can_join_groups: true,
        can_edit_profile: true,
        can_view_social: true,
        can_access_parent_control: true,
        can_access_business: false
      };
    }

    return {
      can_create_posts: true,
      can_send_messages: true,
      can_join_groups: true,
      can_edit_profile: true,
      can_view_social: true,
      can_create_company: true,
      can_manage_business: true,
      can_add_employees: true
    };
  }

  /**
   * Get age-based restrictions
   */
  getAgeRestrictions(age) {
    if (age < 10) {
      return {
        restricted_content: ['adult', 'violence', 'explicit'],
        screen_time_limit: 60, // minutes
        bedtime_enforced: true,
        require_parent_permission: true
      };
    }

    if (age < 18) {
      return {
        restricted_content: ['adult', 'explicit'],
        screen_time_limit: 180,
        bedtime_enforced: false,
        require_parent_permission: false
      };
    }

    return {
      restricted_content: [],
      screen_time_limit: null,
      bedtime_enforced: false,
      require_parent_permission: false
    };
  }

  /**
   * Load user node and dependencies
   */
  async loadUserNode(userId) {
    try {
      // Load main user node
      const { data: userNode, error: userError } = await supabase
        .from('node_core')
        .select('*')
        .eq('node_type', 'user')
        .eq('owner_id', userId)
        .single();

      if (userError) throw userError;

      // Load all related nodes
      const { data: relatedNodes, error: relError } = await supabase
        .from('node_core')
        .select('*')
        .eq('parent_nid_hash', userNode.nid_hash);

      if (relError) throw relError;

      // Organize related nodes
      const nodeMap = {
        user: userNode,
        vector_memory: relatedNodes.find(n => n.node_type === 'vector_memory'),
        relationships: relatedNodes.find(n => n.node_type === 'relationship_map'),
        layout: relatedNodes.find(n => n.node_type === 'layout_schema'),
        permissions: relatedNodes.find(n => n.node_type === 'permission_set')
      };

      // Get active brand from layout node field_map
      const layoutFieldMap = decodeFromBlob(nodeMap.layout.field_map);
      const activeBrand = layoutFieldMap.active_brand;

      return {
        success: true,
        user_node: nodeMap.user,
        vector_node: nodeMap.vector_memory,
        relationship_node: nodeMap.relationships,
        layout_node: nodeMap.layout,
        permission_node: nodeMap.permissions,
        active_brand: activeBrand
      };
    } catch (error) {
      console.error('Load user node error:', error);
      throw error;
    }
  }

  /**
   * Create child node (post, family member, task, etc.)
   */
  async createChildNode(parentUserId, nodeData) {
    try {
      const {
        node_type,
        visibility,
        metadata,
        ui_schema,
        validity,
        parent_nid_hash,
        node_depth
      } = nodeData;

      // Family creation supplies a parent selected by the authenticated service.
      // Revalidate its ownership here before deriving hierarchy fields.
      let parentNode;
      if (parent_nid_hash) {
        const { data: requestedParent, error: parentError } = await supabase
          .from('node_core')
          .select('*')
          .eq('nid_hash', parent_nid_hash)
          .eq('owner_id', parentUserId)
          .eq('node_state', 'ACTIVE')
          .single();
        if (parentError || !requestedParent) throw parentError || new Error('Requested parent node not found');
        const parentDna = decodeFromBlob(requestedParent.dna_blob) || {};
        parentNode = {
          user_node: requestedParent,
          active_brand: parentDna.brand_scope || 'VANSHAWALI'
        };
      } else {
        parentNode = await this.loadUserNode(parentUserId);
      }

      const parentHash = parent_nid_hash || parentNode.user_node.nid_hash;
      const parentDepth = parentNode.user_node.node_depth || 0;

      // Build child node using schema
      const childNodeData = buildNodeCoreRow(node_type, parentUserId, metadata || {}, {
        parent_nid_hash: parentHash,
        node_depth: node_depth ?? parentDepth + 1,
        brand_scope: parentNode.active_brand,
        visibility: visibility || 'private',
        ui: ui_schema || {}
      });

      const { data: childNode, error } = await supabase
        .from('node_core')
        .insert(childNodeData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        node: childNode
      };
    } catch (error) {
      console.error('Create child node error:', error);
      throw error;
    }
  }

  /**
   * Create relationship between nodes
   */
  async createRelationship(fromNodeId, toNodeId, relationshipType) {
    try {
      const { data, error } = await supabase
        .from('node_relationships')
        .insert({
          from_node: fromNodeId,
          to_node: toNodeId,
          relationship_type: relationshipType,
          metadata: {
            created_at: new Date().toISOString(),
            status: 'active'
          }
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        relationship: data
      };
    } catch (error) {
      console.error('Create relationship error:', error);
      throw error;
    }
  }

  /**
   * Query nodes by type and filters
   */
  async queryNodes(queryParams) {
    try {
      let query = supabase.from('node_core').select('*');

      if (queryParams.node_type) {
        query = query.eq('node_type', queryParams.node_type);
      }

      if (queryParams.owner_id) {
        query = query.eq('owner_id', queryParams.owner_id);
      }

      if (queryParams.parent_nid_hash) {
        query = query.eq('parent_nid_hash', queryParams.parent_nid_hash);
      }

      if (queryParams.brand_scope) {
        query = query.eq('brand_scope', queryParams.brand_scope);
      }

      if (queryParams.node_state) {
        query = query.eq('node_state', queryParams.node_state);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        nodes: data
      };
    } catch (error) {
      console.error('Query nodes error:', error);
      throw error;
    }
  }

  /**
   * Update node metadata
   */
  async updateNode(rowId, updates) {
    try {
      const { data, error } = await supabase
        .from('node_core')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('row_id', rowId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        node: data
      };
    } catch (error) {
      console.error('Update node error:', error);
      throw error;
    }
  }
}

module.exports = new NodeCoreManager();
