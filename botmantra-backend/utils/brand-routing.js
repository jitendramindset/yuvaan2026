/**
 * BRAND DEFINITIONS & ROUTING
 * Each brand is a Root Node with its own layout, widgets, and permissions
 * 
 * This replaces all the old hardcoded platform logic.
 * Everything comes from node_core table now.
 */

const brandDefinitions = {
  // 🔴 BOTMANTRA - User Entry Point & Router
  botmantra: {
    node_code: 'botmantra',
    node_type: 'brand',
    node_name: 'Botmantra',
    description: 'Intelligent User Registration & Routing',
    visibility: 'public',
    metadata: {
      theme: 'assistant',
      target_audience: 'all_new_users',
      base_color: '#3498DB',
      is_entry_point: true
    },
    ui_schema: {
      layout: 'onboarding',
      widgets: [
        { type: 'age_detector', config: {} },
        { type: 'brand_suggester', config: {} },
        { type: 'user_creator', config: {} },
        { type: 'preference_mapper', config: {} }
      ]
    },
    routing_rules: {
      // Age-based routing to other brands
      'age < 10': 'juniormantra',
      'age >= 10 && age <= 18': 'jeetmantra',
      'age > 18 && business == true': 'mantravat',
      'default': 'vanshavali'
    },
    child_node_types: ['user', 'onboarding_session']
  },

  // 🟣 VANSHAVALI - Social & Family
  vanshavali: {
    node_code: 'vanshavali',
    node_type: 'brand',
    node_name: 'Vanshavali',
    description: 'Social & Family Tree Platform',
    visibility: 'public',
    metadata: {
      theme: 'warm',
      target_audience: 'families',
      base_color: '#FF6B6B'
    },
    ui_schema: {
      layout: 'social_feed',
      widgets: [
        { type: 'story_bar', config: {} },
        { type: 'family_tree', config: {} },
        { type: 'activity_feed', config: {} },
        { type: 'community_events', config: {} }
      ]
    },
    child_node_types: [
      'user_profile',
      'family_group',
      'post',
      'photo',
      'event',
      'relationship_link'
    ],
    permissions: {
      read: ['user'],
      write: ['user'],
      admin: ['admin']
    }
  },

  // 🟢 JEETMANTRA - Education
  jeetmantra: {
    node_code: 'jeetmantra',
    node_type: 'brand',
    node_name: 'Jeetmantra',
    description: 'Education & Learning Platform',
    visibility: 'public',
    metadata: {
      theme: 'academic',
      target_audience: 'students_teachers',
      base_color: '#2ECC71'
    },
    ui_schema: {
      layout: 'edu_dashboard',
      widgets: [
        { type: 'course_manager', config: {} },
        { type: 'lecture_hall', config: {} },
        { type: 'homework_tracker', config: {} },
        { type: 'progress_analytics', config: {} },
        { type: 'attendance_system', config: {} }
      ]
    },
    child_node_types: [
      'teacher',
      'student',
      'course',
      'lecture',
      'assignment',
      'homework',
      'event',
      'live_class'
    ],
    dashboard_layouts: {
      student: {
        widgets: [
          'homework_list',
          'upcoming_classes',
          'attendance',
          'progress_chart'
        ]
      },
      teacher: {
        widgets: [
          'create_lecture',
          'upload_material',
          'student_progress',
          'class_schedule'
        ]
      }
    }
  },

  // 🟡 JUNIORMANTRA - Kids Safe Platform
  juniormantra: {
    node_code: 'juniormantra',
    node_type: 'brand',
    node_name: 'JuniorMantra',
    description: 'Safe Learning Platform for Kids (Age 5-12)',
    visibility: 'public',
    metadata: {
      theme: 'kids_friendly',
      target_audience: 'children_5_12',
      base_color: '#F39C12',
      age_filter: true,
      safe_content: true
    },
    ui_schema: {
      layout: 'kids_ui',
      widgets: [
        { type: 'animated_lessons', config: {} },
        { type: 'safe_activities', config: {} },
        { type: 'parent_dashboard', config: {} },
        { type: 'progress_tracker', config: {} }
      ]
    },
    child_node_types: [
      'learning_video',
      'activity',
      'parent_note',
      'task',
      'cartoon_module'
    ],
    content_filters: {
      age_min: 5,
      age_max: 12,
      requires_parent_approval: true
    }
  },

  // 🟠 MANTRAVAT - Business Builder
  mantravat: {
    node_code: 'mantravat',
    node_type: 'brand',
    node_name: 'Mantravat',
    description: 'Business Creation & Management Platform',
    visibility: 'public',
    metadata: {
      theme: 'professional',
      target_audience: 'entrepreneurs',
      base_color: '#5A4FFF'
    },
    ui_schema: {
      layout: 'business_dashboard',
      widgets: [
        { type: 'company_manager', config: {} },
        { type: 'employee_hub', config: {} },
        { type: 'sales_kpi', config: {} },
        { type: 'workflow_builder', config: {} },
        { type: 'invoice_system', config: {} }
      ]
    },
    child_node_types: [
      'company',
      'employee',
      'department',
      'product',
      'invoice',
      'workflow',
      'report',
      'customer'
    ],
    business_features: {
      can_create_modules: true,
      can_define_tables: true,
      can_build_workflows: true,
      can_generate_reports: true
    }
  }
};

/**
 * BRAND SELECTOR LOGIC
 * Based on user profile, suggest appropriate brand
 */
function suggestBrand(userProfile) {
  const { age, interests, business_interest, family_interest, learning_interest } = userProfile;

  // Age-based primary routing
  if (age < 10) {
    return 'juniormantra';
  }

  if (age >= 10 && age <= 18) {
    // Learning is default for this age, but allow customization
    if (business_interest) return 'mantravat';
    if (family_interest) return 'vanshavali';
    return 'jeetmantra';
  }

  if (age > 18) {
    // Adults
    if (business_interest) return 'mantravat';
    if (learning_interest) return 'jeetmantra';
    if (family_interest) return 'vanshavali';
    return 'vanshavali'; // Default social
  }

  return 'botmantra'; // Fallback to router
}

/**
 * GET BRAND CONFIG
 * Returns complete brand configuration from definition
 */
function getBrandConfig(brandCode) {
  return brandDefinitions[brandCode] || null;
}

/**
 * VALIDATE USER CAN ACCESS BRAND
 * Check if user has permission
 */
async function validateBrandAccess(userId, brandCode, supabase) {
  try {
    // Get brand node
    const { data: brandNode, error: brandError } = await supabase
      .from('node_core')
      .select('node_id, visibility, permissions')
      .eq('node_code', brandCode)
      .single();

    if (brandError) return false;

    // Public brands always accessible
    if (brandNode.visibility === 'public') return true;

    // Check if user is linked to brand
    const { data: relationship } = await supabase
      .from('node_relationships')
      .select('relationship_id')
      .eq('parent_node', brandNode.node_id)
      .eq('child_node', userId)
      .single();

    return !!relationship;
  } catch (error) {
    console.error('Brand access validation error:', error);
    return false;
  }
}

/**
 * CREATE USER NODE & LINK TO BRAND
 * When user registers, create node and link to appropriate brand
 */
async function onboardUserToNode(userProfile, supabase) {
  try {
    const {
      email,
      name,
      age,
      phone = null,
      address = null
    } = userProfile;

    // 1. Create user node
    const { data: userNode, error: nodeError } = await supabase
      .from('node_core')
      .insert([{
        node_type: 'user',
        node_name: name,
        owner_node: userProfile.user_id,
        visibility: 'private',
        metadata: {
          email,
          age,
          phone,
          address,
          created_at: new Date().toISOString()
        }
      }])
      .select()
      .single();

    if (nodeError) throw nodeError;

    // 2. Suggest brand
    const suggestedBrand = suggestBrand({
      age,
      ...userProfile.preferences
    });

    // 3. Get brand root node
    const { data: brandNode } = await supabase
      .from('node_core')
      .select('node_id')
      .eq('node_code', suggestedBrand)
      .single();

    // 4. Create relationship
    await supabase
      .from('node_relationships')
      .insert([{
        parent_node: brandNode.node_id,
        child_node: userNode.node_id,
        relation_type: 'member_of',
        metadata: {
          onboarded_via: 'botmantra',
          timestamp: new Date().toISOString()
        }
      }]);

    return {
      success: true,
      user_node_id: userNode.node_id,
      suggested_brand: suggestedBrand
    };
  } catch (error) {
    console.error('User onboarding error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * GET USER DASHBOARD
 * Based on user's brand membership, load appropriate dashboard
 */
async function getUserDashboard(userId, supabase) {
  try {
    // Get user node
    const { data: userNode } = await supabase
      .from('node_core')
      .select('node_id')
      .eq('owner_node', userId)
      .eq('node_type', 'user')
      .single();

    if (!userNode) {
      return { error: 'User node not found' };
    }

    // Get all brand relationships
    const { data: brandRelationships } = await supabase
      .from('node_relationships')
      .select('parent_node, relation_type')
      .eq('child_node', userNode.node_id)
      .eq('relation_type', 'member_of');

    // Get brand details
    const brands = [];
    for (const rel of brandRelationships) {
      const { data: brandNode } = await supabase
        .from('node_core')
        .select('node_id, node_name, node_code, ui_schema, metadata')
        .eq('node_id', rel.parent_node)
        .single();

      if (brandNode) {
        brands.push({
          node_id: brandNode.node_id,
          name: brandNode.node_name,
          code: brandNode.node_code,
          layout: brandNode.ui_schema,
          config: getBrandConfig(brandNode.node_code)
        });
      }
    }

    return {
      success: true,
      user_node_id: userNode.node_id,
      brands,
      primary_brand: brands[0] || null
    };
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return { error: error.message };
  }
}

module.exports = {
  brandDefinitions,
  suggestBrand,
  getBrandConfig,
  validateBrandAccess,
  onboardUserToNode,
  getUserDashboard
};
