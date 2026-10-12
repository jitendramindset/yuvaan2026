/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CROSS-BRAND ROUTER — Unified Brand Routing Engine         ║
 * ║  Replaces duplicate: core/brandRouter.js + utils/brand-*   ║
 * ║  Age → brand auto-routing, chat routing, brand switching   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { BRANDS, decodeFromBlob, encodeToBlob, buildNodeCoreRow } = require('./node-schema');
const { getBrandDefaultLayout } = require('./widget-engine');
const NodeFactory = require('./nodeFactory');

// ─── SEMANTIC CLASSIFICATION MAP ─────────────────────────────
const SEMANTIC_ROUTES = {
  VANSHAWALI:  ['family', 'genealogy', 'parent', 'child', 'marriage', 'ancestor', 'relative', 'sibling', 'gotra', 'vansh', 'tree'],
  JEETMANTRA:  ['homework', 'school', 'exam', 'study', 'course', 'teacher', 'grade', 'subject', 'enroll', 'learn', 'education'],
  MANTRAVAT:   ['business', 'company', 'invoice', 'payment', 'employee', 'project', 'task', 'revenue', 'client', 'enterprise'],
  JUNIOR:      ['video', 'cartoon', 'game', 'story', 'fun', 'animation', 'play', 'kids', 'draw', 'color'],
  BOTMANTRA:   ['bot', 'ai', 'chat', 'settings', 'profile', 'general', 'help', 'support']
};

// ─── BRAND ROUTER CLASS ─────────────────────────────────────
class BrandRouter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * STEP 1: Load user node and resolve brand
   */
  async resolveUserBrand(userId) {
    // Load user's node via nodeFactory
    const userNodeData = await NodeFactory.loadUserNode(userId);

    if (!userNodeData.success) {
      return { brand: 'BOTMANTRA', source: 'default_no_node' };
    }

    const userNode = userNodeData.user_node;
    const fieldMap = userNode.field_map || {};
    const dna = userNode.dna || {};

    return {
      nid_hash: userNode.nid_hash,
      brand: dna.brand_scope || fieldMap.brand_default || this.getBrandByAge(fieldMap.age),
      user_meta: fieldMap,
      source: dna.brand_scope ? 'dna' : (fieldMap.brand_default ? 'preference' : 'age_auto')
    };
  }

  /**
   * STEP 2: Age-based auto-routing
   */
  getBrandByAge(age) {
    if (age === null || age === undefined) return 'BOTMANTRA';
    if (age < 10)  return 'JUNIOR';
    if (age < 18)  return 'JEETMANTRA';
    if (age >= 18) return 'MANTRAVAT';
    return 'BOTMANTRA';
  }

  /**
   * STEP 3: Brand scope check — returns all accessible brands
   */
  getAvailableBrands(age) {
    const brands = ['BOTMANTRA', 'VANSHAWALI']; // always available

    if (age === null || age === undefined) return brands;
    if (age < 10)  brands.push('JUNIOR');
    if (age >= 10 && age < 18) brands.push('JEETMANTRA', 'JUNIOR');
    if (age >= 18) brands.push('MANTRAVAT', 'JEETMANTRA');

    return [...new Set(brands)];
  }

  /**
   * STEP 4: Load active dashboard layout for user+brand
   */
  async loadDashboard(userId, brandCode) {
    const brand = BRANDS[brandCode];
    if (!brand) throw new Error(`Unknown brand: ${brandCode}`);

    // Try user's custom layout
    const { data: customLayout } = await this.supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('is_default', true)
      .limit(1)
      .single();

    if (customLayout) {
      return {
        source: 'db',
        layout_id: customLayout.id,
        layout: customLayout.grid_json,
        brand: brandCode
      };
    }

    // Fallback: generate default from widget presets
    const defaultLayout = getBrandDefaultLayout(brandCode);
    return {
      source: 'generated',
      layout: defaultLayout,
      brand: brandCode
    };
  }

  /**
   * CHAT-BASED ROUTING: Classify user text → target brand
   */
  classifyText(userMessage) {
    const lower = userMessage.toLowerCase();
    const scores = {};

    for (const [brand, keywords] of Object.entries(SEMANTIC_ROUTES)) {
      scores[brand] = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) scores[brand]++;
      }
    }

    // Find highest scoring brand
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return { brand: null, confidence: 0, needs_clarification: true };
    if (sorted[0][1] === sorted[1]?.[1]) return { brand: null, confidence: 0.5, needs_clarification: true, candidates: [sorted[0][0], sorted[1][0]] };

    return {
      brand: sorted[0][0],
      confidence: Math.min(sorted[0][1] / 3, 1),
      needs_clarification: false
    };
  }

  /**
   * ROUTER JSON OUTPUT — full routing decision
   */
  async route(userId, userMessage) {
    // Resolve user brand
    const userBrand = await this.resolveUserBrand(userId);

    // Classify text intent
    const textRoute = this.classifyText(userMessage || '');

    // Determine target brand
    const targetBrand = textRoute.brand || userBrand.brand || 'BOTMANTRA';

    // Load dashboard
    const dashboard = await this.loadDashboard(userId, targetBrand);

    return {
      target_brand: targetBrand,
      target_layout: dashboard.layout,
      user_brand: userBrand.brand,
      text_classification: textRoute,
      actions: [
        'load_widgets',
        'apply_permission_filter'
      ],
      dashboard
    };
  }

  /**
   * SWITCH BRAND — update user default
   */
  async switchBrand(userId, targetBrand) {
    if (!BRANDS[targetBrand]) throw new Error(`Unknown brand: ${targetBrand}`);

    // Load user node
    const userNodeData = await NodeFactory.loadUserNode(userId);

    if (!userNodeData.success) {
      throw new Error('User node not found');
    }

    const userNode = userNodeData.user_node;

    // Update dna and field_map
    const dna = userNode.dna || {};
    dna.brand_scope = targetBrand;

    const fieldMap = userNode.field_map || {};
    fieldMap.brand_default = targetBrand;

    // Update the node
    const updateResult = await NodeFactory.updateNode(userNode.row_id, {
      dna: dna,
      field_map: fieldMap
    });

    if (!updateResult.success) {
      throw new Error('Failed to update user node');
    }

    // Load new dashboard
    const dashboard = await this.loadDashboard(userId, targetBrand);

    return {
      success: true,
      new_brand: targetBrand,
      dashboard
    };
  }

  /**
   * CREATE NODE — child node creation via chat
   * e.g., "Add new family member" → VANSHAWALI + create_node(user_node)
   */
  routeNodeCreation(userMessage) {
    const lower = userMessage.toLowerCase();

    if (lower.includes('family member') || lower.includes('relative')) {
      return {
        target_brand: 'VANSHAWALI',
        tool: 'create_node',
        node_type: 'user_node',
        metadata_template: { profile_type: 'parent' }
      };
    }

    if (lower.includes('company') || lower.includes('business')) {
      return {
        target_brand: 'MANTRAVAT',
        tool: 'create_node',
        node_type: 'nonliving_node',
        metadata_template: { subtype: 'company', name: '', status: 'active' }
      };
    }

    if (lower.includes('task') || lower.includes('project')) {
      return {
        target_brand: 'MANTRAVAT',
        tool: 'create_node',
        node_type: 'nonliving_node',
        metadata_template: { subtype: 'task', name: '', status: 'active' }
      };
    }

    if (lower.includes('homework') || lower.includes('assignment')) {
      return {
        target_brand: 'JEETMANTRA',
        tool: 'create_node',
        node_type: 'nonliving_node',
        metadata_template: { subtype: 'homework', name: '', status: 'draft' }
      };
    }

    if (lower.includes('video')) {
      return {
        target_brand: 'JUNIOR',
        tool: 'create_node',
        node_type: 'nonliving_node',
        metadata_template: { subtype: 'video', name: '' }
      };
    }

    return null; // unrecognized
  }

  /**
   * DEFAULT INTRO SCREEN — for uninitialized users
   */
  getIntroLayout() {
    return {
      layout_type: 'feed',
      is_intro: true,
      widgets: [
        {
          widget_type: 'card',
          title: 'Welcome to BotMantra Neural OS',
          ui_schema: { show_header: true, display_fields: ['welcome_message', 'brand_options'] },
          event_bindings: { onClick: 'select_brand' }
        },
        {
          widget_type: 'form',
          title: 'Complete Your Profile',
          ui_schema: {
            display_fields: ['name', 'age', 'gender', 'profile_type'],
            actions: ['submit_profile']
          },
          event_bindings: { onSubmit: 'initialize_user' }
        }
      ]
    };
  }
}

// ─── RENDER FLOW ─────────────────────────────────────────────
/*
  1. User login
  2. Load user_node
  3. Resolve brand_scope (age / preference / dna)
  4. Fetch active dashboard_layout
  5. Load widget nodes
  6. Apply permission filtering
  7. Render UI
  8. Attach chat
  9. Chat modifies layout via tool calls
  10. Save vector and update UI live
*/

// ─── EXPORTS ─────────────────────────────────────────────────
module.exports = {
  BrandRouter,
  SEMANTIC_ROUTES,
  BRANDS
};
