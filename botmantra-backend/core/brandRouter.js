/**
 * BRAND ROUTER - Runtime decision engine
 * 
 * Routes user to correct brand experience based on:
 * - Age
 * - Active brand selection
 * - User permissions
 * - Current context
 */

const { createClient } = require('@supabase/supabase-js');
const NodeFactory = require('./nodeFactory');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * BRAND DEFINITIONS
 */
const BRANDS = {
  vanshawali: {
    name: 'Vanshawali',
    type: 'social',
    age_range: [0, 120],
    description: 'Social family network',
    color: '#8B5CF6',
    icon: 'users',
    features: [
      'social_feed',
      'family_tree',
      'posts',
      'invitations',
      'relationship_graph',
      'memories'
    ],
    default_layout: 'social_feed',
    vector_uses: [
      'suggest_memories',
      'similar_posts',
      'auto_tag_family'
    ]
  },

  junior_mantra: {
    name: 'Junior Mantra',
    type: 'kids',
    age_range: [0, 10],
    description: 'Safe learning for kids',
    color: '#F59E0B',
    icon: 'sparkles',
    features: [
      'video_feed',
      'games',
      'learning_modules',
      'parent_connection',
      'safe_content'
    ],
    default_layout: 'video_feed',
    safe_mode: true,
    parent_control: true,
    vector_uses: [
      'recommend_learning_videos',
      'filter_safe_tags',
      'age_appropriate_content'
    ]
  },

  jeetmantra: {
    name: 'JeetMantra',
    type: 'education',
    age_range: [10, 18],
    description: 'Educational platform',
    color: '#3B82F6',
    icon: 'book',
    features: [
      'teacher_dashboard',
      'student_dashboard',
      'assignments',
      'attendance',
      'live_classes',
      'grades',
      'study_material'
    ],
    default_layout: 'student_dashboard',
    role_based: true,
    vector_uses: [
      'suggest_study_material',
      'auto_summarize_lectures',
      'personalized_learning'
    ]
  },

  mantravat: {
    name: 'Mantravat',
    type: 'business',
    age_range: [18, 120],
    description: 'Business management',
    color: '#10B981',
    icon: 'briefcase',
    features: [
      'company_dashboard',
      'create_company',
      'add_employees',
      'tasks',
      'workflows',
      'analytics',
      'automation'
    ],
    default_layout: 'business_dashboard',
    vector_uses: [
      'suggest_modules',
      'suggest_automation',
      'business_intelligence'
    ]
  }
};

/**
 * Brand Router Manager
 */
class BrandRouter {
  /**
   * Get active brand for user
   */
  async getActiveBrand(userId) {
    try {
      // Load user node with related nodes
      const userNodeData = await NodeFactory.loadUserNode(userId);

      if (!userNodeData.success) {
        throw new Error('Failed to load user node');
      }

      // Get age from field_map
      const age = userNodeData.user_node.field_map?.age;

      // Get active brand from layout node's field_map
      const activeBrand = userNodeData.layout_node?.field_map?.active_brand ||
                         this.getBrandByAge(age);

      return {
        success: true,
        active_brand: activeBrand,
        brand_definition: BRANDS[activeBrand],
        age: age
      };
    } catch (error) {
      console.error('Get active brand error:', error);
      throw error;
    }
  }

  /**
   * Get brand by age (routing logic)
   */
  getBrandByAge(age) {
    if (age < 10) return 'junior_mantra';
    if (age < 18) return 'jeetmantra';
    return 'mantravat';
  }

  /**
   * Get all available brands for user
   */
  async getAvailableBrands(userId) {
    try {
      // Load user node to get age
      const userNodeData = await NodeFactory.loadUserNode(userId);

      if (!userNodeData.success) {
        throw new Error('Failed to load user node');
      }

      const age = userNodeData.user_node.field_map?.age;

      // All users can access vanshawali
      const available = ['vanshawali'];

      // Age-based access
      if (age < 10) available.push('junior_mantra');
      if (age >= 10 && age < 18) available.push('jeetmantra');
      if (age >= 18) available.push('mantravat');

      return {
        success: true,
        available_brands: available.map(b => ({
          key: b,
          ...BRANDS[b]
        }))
      };
    } catch (error) {
      console.error('Get available brands error:', error);
      throw error;
    }
  }

  /**
   * Switch brand for user
   */
  async switchBrand(userId, targetBrand) {
    try {
      // Validate brand exists
      if (!BRANDS[targetBrand]) {
        return {
          success: false,
          error: `Brand ${targetBrand} does not exist`
        };
      }

      // Load user node to get age
      const userNodeData = await NodeFactory.loadUserNode(userId);

      if (!userNodeData.success) {
        throw new Error('Failed to load user node');
      }

      const age = userNodeData.user_node.field_map?.age;

      // Check if user can access this brand
      const brand = BRANDS[targetBrand];
      const [minAge, maxAge] = brand.age_range;

      if (age < minAge || age > maxAge) {
        return {
          success: false,
          error: `You don't have access to ${targetBrand}`
        };
      }

      // Update layout node with new active brand
      const layoutNode = userNodeData.layout_node;
      if (!layoutNode) {
        return {
          success: false,
          error: 'Layout node not found'
        };
      }

      const updateResult = await NodeFactory.updateNode(layoutNode.row_id, {
        field_map: {
          ...layoutNode.field_map,
          active_brand: targetBrand,
          switched_at: new Date().toISOString()
        }
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: 'Failed to update layout node'
        };
      }

      return {
        success: true,
        active_brand: targetBrand,
        brand_definition: BRANDS[targetBrand]
      };
    } catch (error) {
      console.error('Switch brand error:', error);
      throw error;
    }
  }

  /**
   * Get brand-specific layout
   */
  async getBrandLayout(userId, brandKey) {
    try {
      const brand = BRANDS[brandKey];

      if (!brand) {
        return {
          success: false,
          error: `Brand ${brandKey} not found`
        };
      }

      // Load brand root node
      const brandRootQuery = await NodeFactory.queryNodes({
        node_type: 'brand_root'
      });

      const brandRootNode = brandRootQuery.success ?
        brandRootQuery.nodes.find(node => node.field_map?.brand === brandKey) :
        null;

      if (!brandRootNode) {
        return {
          success: false,
          brand: brand,
          error: 'Brand root not found'
        };
      }

      // Load layout nodes for this brand
      const layoutQuery = await NodeFactory.queryNodes({
        parent_nid_hash: brandRootNode.nid_hash,
        node_type: 'layout_schema'
      });

      return {
        success: true,
        brand: brand,
        brand_root: brandRootNode,
        layouts: layoutQuery.success ? layoutQuery.nodes : []
      };
    } catch (error) {
      console.error('Get brand layout error:', error);
      return {
        success: false,
        brand: BRANDS[brandKey],
        error: 'Layout not found, using defaults'
      };
    }
  }

  /**
   * Get brand features based on permissions
   */
  async getBrandFeatures(userId, brandKey) {
    try {
      const brand = BRANDS[brandKey];

      if (!brand) {
        return {
          success: false,
          error: `Brand ${brandKey} not found`
        };
      }

      // Load user node with permission node
      const userNodeData = await NodeFactory.loadUserNode(userId);

      if (!userNodeData.success) {
        throw new Error('Failed to load user node');
      }

      const permissions = userNodeData.permission_node?.field_map?.permissions || {};

      // Filter features based on permissions
      const availableFeatures = brand.features.filter(feature => {
        const permKey = `can_${feature}`;
        return permissions[permKey] !== false;
      });

      return {
        success: true,
        brand: brandKey,
        all_features: brand.features,
        available_features: availableFeatures,
        vector_uses: brand.vector_uses
      };
    } catch (error) {
      console.error('Get brand features error:', error);
      throw error;
    }
  }

  /**
   * Get all brand definitions
   */
  getAllBrands() {
    return {
      success: true,
      brands: BRANDS
    };
  }
}

module.exports = new BrandRouter();
