/**
 * DASHBOARD LOADER - Dynamic UI Assembly
 * 
 * Loads complete dashboard state:
 * 1. User node
 * 2. Active brand
 * 3. Brand root node
 * 4. Layout schema
 * 5. Child layout nodes
 * 6. Vector context
 * 7. Render schema
 */

const { createClient } = require('@supabase/supabase-js');
const nodeCore = require('./nodeCore');
const brandRouter = require('./brandRouter');
const NodeFactory = require('./nodeFactory');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Dashboard Loader
 */
class DashboardLoader {
  /**
   * Complete dashboard loading sequence
   */
  async loadDashboard(userId) {
    try {
      // Step 1: Load user node core
      console.log('Step 1: Loading user node...');
      const userNodeData = await nodeCore.loadUserNode(userId);

      if (!userNodeData.success) {
        throw new Error('Failed to load user node');
      }

      // Step 2: Get active brand
      console.log('Step 2: Detecting active brand...');
      const brandData = await brandRouter.getActiveBrand(userId);

      if (!brandData.success) {
        throw new Error('Failed to detect brand');
      }

      const activeBrand = brandData.active_brand;

      // Step 3: Load brand root node
      console.log('Step 3: Loading brand root...');
      const brandRootNode = await this.loadBrandRoot(activeBrand);

      // Step 4: Load layout nodes
      console.log('Step 4: Loading layout schema...');
      const layoutNodes = await this.loadLayoutNodes(
        userNodeData.layout_node.node_id
      );

      // Step 5: Load child layout nodes
      console.log('Step 5: Loading child layouts...');
      const childLayouts = await this.loadChildLayouts(
        layoutNodes.primary.node_id
      );

      // Step 6: Load vector context
      console.log('Step 6: Loading vector context...');
      const vectorContext = await this.loadVectorContext(
        userNodeData.vector_node.node_id
      );

      // Step 7: Assemble render schema
      console.log('Step 7: Assembling render schema...');
      const renderSchema = this.assembleRenderSchema(
        activeBrand,
        layoutNodes.primary,
        childLayouts,
        brandData.brand_definition
      );

      return {
        success: true,
        dashboard: {
          user_node: userNodeData.user_node,
          active_brand: activeBrand,
          brand_definition: brandData.brand_definition,
          brand_root: brandRootNode,
          layout: {
            primary: layoutNodes.primary,
            secondary: layoutNodes.secondary
          },
          child_layouts: childLayouts,
          vector_context: vectorContext,
          render_schema: renderSchema,
          loaded_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Dashboard loading error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load brand root node
   */
  async loadBrandRoot(brandKey) {
    try {
      const queryResult = await NodeFactory.queryNodes({
        node_type: 'brand_root'
      });

      if (queryResult.success && queryResult.nodes.length > 0) {
        const brandRoot = queryResult.nodes.find(node => node.field_map?.brand === brandKey);
        if (brandRoot) {
          return brandRoot;
        }
      }

      console.warn(`Brand root not found for ${brandKey}, creating default`);
      return await this.createDefaultBrandRoot(brandKey);
    } catch (error) {
      console.error('Load brand root error:', error);
      return await this.createDefaultBrandRoot(brandKey);
    }
  }

  /**
   * Create default brand root if missing
   */
  async createDefaultBrandRoot(brandKey) {
    try {
      const createResult = await NodeFactory.createNonLiveNode('system', 'brand_root', {
        brand: brandKey,
        created_at: new Date().toISOString(),
        visibility: 'public'
      });

      if (createResult.success) {
        return createResult.node;
      }

      throw new Error('Failed to create brand root');
    } catch (error) {
      console.error('Create default brand root error:', error);
      // Return a minimal brand root object
      return {
        nid_hash: `brand_root_${brandKey}`,
        node_type: 'brand_root',
        brand_root: brandKey,
        metadata: {
          brand: brandKey,
          created_at: new Date().toISOString()
        },
        node_state: 'ACTIVE'
      };
    }
  }

  /**
   * Load primary and secondary layouts
   */
  async loadLayoutNodes(userLayoutNodeId) {
    try {
      // Get the primary layout node by nid_hash
      const primaryQuery = await NodeFactory.queryNodes({
        nid_hash: userLayoutNodeId
      });

      if (!primaryQuery.success || primaryQuery.nodes.length === 0) {
        throw new Error('Primary layout node not found');
      }

      const primaryLayout = primaryQuery.nodes[0];

      // Try to get secondary layout (child of primary)
      const secondaryQuery = await NodeFactory.queryNodes({
        parent_nid_hash: userLayoutNodeId,
        node_type: 'layout_schema'
      });

      const secondaryLayout = secondaryQuery.success && secondaryQuery.nodes.length > 0
        ? secondaryQuery.nodes[0]
        : primaryLayout;

      return {
        primary: primaryLayout,
        secondary: secondaryLayout
      };
    } catch (error) {
      console.error('Load layout nodes error:', error);
      throw error;
    }
  }

  /**
   * Load child layout nodes (widgets, sections, etc.)
   */
  async loadChildLayouts(parentLayoutId) {
    try {
      const results = [];

      // Query layout_widget nodes
      const widgetQuery = await NodeFactory.queryNodes({
        parent_nid_hash: parentLayoutId,
        node_type: 'layout_widget'
      });

      if (widgetQuery.success) {
        results.push(...widgetQuery.nodes);
      }

      // Query layout_section nodes
      const sectionQuery = await NodeFactory.queryNodes({
        parent_nid_hash: parentLayoutId,
        node_type: 'layout_section'
      });

      if (sectionQuery.success) {
        results.push(...sectionQuery.nodes);
      }

      // Sort by position if available
      return results.sort((a, b) => {
        const posA = a.field_map?.position || 0;
        const posB = b.field_map?.position || 0;
        return posA - posB;
      });
    } catch (error) {
      console.error('Load child layouts error:', error);
      return [];
    }
  }

  /**
   * Load vector context for personalization
   */
  async loadVectorContext(vectorNodeId) {
    try {
      const queryResult = await NodeFactory.queryNodes({
        nid_hash: vectorNodeId
      });

      if (queryResult.success && queryResult.nodes.length > 0) {
        const vectorNode = queryResult.nodes[0];
        return {
          embeddings: vectorNode.memory_blob?.embeddings || [],
          recent_memories: vectorNode.memory_blob?.recent_memories || [],
          suggested_widgets: vectorNode.memory_blob?.suggested_widgets || [],
          personalization_scores: vectorNode.memory_blob?.personalization_scores || {}
        };
      }

      return {
        embeddings: [],
        recent_memories: [],
        suggested_widgets: [],
        personalization_scores: {}
      };
    } catch (error) {
      console.error('Load vector context error:', error);
      return {
        embeddings: [],
        recent_memories: [],
        suggested_widgets: [],
        personalization_scores: {}
      };
    }
  }

  /**
   * Assemble complete render schema
   */
  assembleRenderSchema(activeBrand, layoutNode, childLayouts, brandDef) {
    // Base UI schema from field_map
    const baseSchema = layoutNode.field_map?.ui_schema || {
      brand: activeBrand,
      layout_type: 'default',
      widgets: []
    };

    // Map child layouts to widgets
    const widgets = childLayouts.map(child => ({
      id: child.nid_hash,
      type: child.field_map?.widget_type || 'generic',
      position: child.field_map?.position || 0,
      size: child.field_map?.size || { width: 12, height: 6 },
      config: child.field_map?.config || {},
      title: child.field_map?.title || '',
      data_source: child.field_map?.data_source || null
    }));

    return {
      brand: activeBrand,
      layout_type: baseSchema.layout_type,
      safe_mode: brandDef.safe_mode || false,
      widgets: widgets.length > 0 ? widgets : baseSchema.widgets,
      theme: {
        color: brandDef.color,
        icon: brandDef.icon
      },
      features: brandDef.features,
      vector_hints: {
        uses: brandDef.vector_uses,
        enabled: true
      }
    };
  }

  /**
   * Load specific brand dashboard
   */
  async loadBrandDashboard(userId, brandKey) {
    try {
      // Verify user can access this brand
      const availableBrands = await brandRouter.getAvailableBrands(userId);

      const hasAccess = availableBrands.available_brands.some(
        b => b.key === brandKey
      );

      if (!hasAccess) {
        return {
          success: false,
          error: `User does not have access to ${brandKey}`
        };
      }

      // Switch to brand
      await brandRouter.switchBrand(userId, brandKey);

      // Load dashboard
      return await this.loadDashboard(userId);
    } catch (error) {
      console.error('Load brand dashboard error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh dashboard (reload specific sections)
   */
  async refreshDashboard(userId, sections = ['all']) {
    try {
      if (sections.includes('all')) {
        return await this.loadDashboard(userId);
      }

      // Partial refresh
      const dashboard = await this.loadDashboard(userId);

      if (sections.includes('widgets')) {
        // Reload widget data
        dashboard.dashboard.child_layouts = await this.loadChildLayouts(
          dashboard.dashboard.layout.primary.node_id
        );
      }

      if (sections.includes('vector')) {
        // Reload vector context
        dashboard.dashboard.vector_context = await this.loadVectorContext(
          dashboard.dashboard.user_node.node_id
        );
      }

      return dashboard;
    } catch (error) {
      console.error('Refresh dashboard error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new DashboardLoader();
