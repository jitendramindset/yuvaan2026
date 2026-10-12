/**
 * RUNTIME ORCHESTRATOR - The Neural OS Brain
 * 
 * This orchestrates the entire app flow:
 * 1. Boot/Init
 * 2. Signup/Login  
 * 3. Brand routing
 * 4. Dashboard loading
 * 5. MCP chat control
 * 6. UI refresh
 */

const nodeCore = require('./nodeCore');
const dashboardLoader = require('./dashboardLoader');
const brandRouter = require('./brandRouter');
const nodeFactory = require('./nodeFactory');
const kernelIntegration = require('./kernelIntegration');

class RuntimeOrchestrator {
  /**
   * PHASE 1: APP BOOT
   * 
   * When app starts:
   * 1. Check if user is logged in
   * 2. If yes -> loadDashboard()
   * 3. If no -> show introductionScreen
   */
  async bootApp() {
    console.log('🚀 BOOTING NEURAL OS...');

    // Check environment
    const environment = {
      backend_ready: !!process.env.SUPABASE_URL,
      kernel_ready: !!process.env.OPENAI_API_KEY,
      vector_memory_ready: !!process.env.PINECONE_API_KEY
    };

    if (!environment.backend_ready) {
      return {
        success: false,
        phase: 'boot',
        error: 'Backend not configured',
        ui: { show: 'error_screen' }
      };
    }

    return {
      success: true,
      phase: 'boot_complete',
      ui: { show: 'auth_check' }
    };
  }

  /**
   * PHASE 2: USER SIGNUP/LOGIN
   * 
   * On signup:
   * 1. Create NODE CORE (user node + 5 containers)
   * 2. Detect age
   * 3. Set default brand
   * 4. Initialize layouts
   * 5. Load dashboard
   */
  async signupNewUser(userData) {
    console.log('📝 SIGNUP FLOW:', userData.email);

    try {
      // Step 1: Create NODE CORE
      const userNode = await nodeCore.initializeUserNode(
        userData.user_id,
        {
          name: userData.name,
          email: userData.email,
          age: userData.age,
          signup_date: new Date()
        }
      );

      console.log('✅ Node core initialized');

      // Step 2: Determine default brand based on age
      const defaultBrand = this.getDefaultBrand(userData.age);

      console.log('✅ Default brand:', defaultBrand);

      // Step 3: Initialize brand-specific data
      await brandRouter.initializeBrandForUser(
        userData.user_id,
        defaultBrand,
        userData.age
      );

      console.log('✅ Brand initialized');

      // Step 4: Load dashboard
      const dashboard = await dashboardLoader.loadDashboard(userData.user_id);

      console.log('✅ Dashboard loaded');

      return {
        success: true,
        phase: 'signup_complete',
        user_node: userNode,
        render_schema: dashboard.render_schema,
        ui: {
          show: 'dashboard',
          render: dashboard.render_schema
        }
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        phase: 'signup_failed',
        error: error.message
      };
    }
  }

  /**
   * PHASE 3: USER LOGIN
   * 
   * On login:
   * 1. Load user node
   * 2. Verify session
   * 3. Load dashboard
   * 4. Inject vector context
   */
  async loginUser(userId) {
    console.log('🔐 LOGIN FLOW:', userId);

    try {
      // Step 1: Load complete user node
      const userNode = await nodeCore.loadUserNode(userId);

      console.log('✅ User node loaded');

      // Step 2: Load dashboard (which loads active brand)
      const dashboard = await dashboardLoader.loadDashboard(userId);

      console.log('✅ Dashboard loaded for brand:', dashboard.active_brand);

      return {
        success: true,
        phase: 'login_complete',
        user_node: userNode,
        render_schema: dashboard.render_schema,
        ui: {
          show: 'dashboard',
          render: dashboard.render_schema
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        phase: 'login_failed',
        error: error.message,
        ui: { show: 'login_screen' }
      };
    }
  }

  /**
   * PHASE 4: DASHBOARD INTERACTION
   * 
   * User interacts with dashboard:
   * 1. Click widget
   * 2. Switch brand
   * 3. Create node
   * 4. Use floating chat
   */
  async handleDashboardAction(userId, action) {
    console.log('⚡ DASHBOARD ACTION:', action.type);

    try {
      let uiUpdate = {};

      switch (action.type) {
        case 'widget_click':
          uiUpdate = await this.handleWidgetClick(userId, action);
          break;

        case 'switch_brand':
          uiUpdate = await this.handleBrandSwitch(userId, action.brand_key);
          break;

        case 'create_node':
          uiUpdate = await this.handleCreateNode(userId, action);
          break;

        case 'voice_command':
          uiUpdate = await this.handleVoiceCommand(userId, action.input);
          break;

        case 'refresh':
          uiUpdate = await this.handleRefresh(userId, action);
          break;

        default:
          return { success: false, error: 'Unknown action' };
      }

      return {
        success: true,
        phase: 'action_complete',
        ui: uiUpdate
      };
    } catch (error) {
      console.error('Dashboard action error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Widget click handler
   */
  async handleWidgetClick(userId, action) {
    // Navigate to widget's data source
    // Could be posts, homework, tasks, etc.
    const nodes = await nodeCore.queryNodes({
      node_type: action.widget_type,
      owner_node: userId
    });

    return {
      type: 'widget_data_loaded',
      widget_type: action.widget_type,
      nodes: nodes.nodes
    };
  }

  /**
   * Brand switch handler
   */
  async handleBrandSwitch(userId, brandKey) {
    console.log('🔄 SWITCHING BRAND:', brandKey);

    // Validate user can access this brand
    const availableBrands = await brandRouter.getAvailableBrands(userId);

    if (!availableBrands.brands.find(b => b.key === brandKey)) {
      return {
        type: 'error',
        error: 'Brand not available for this user'
      };
    }

    // Switch brand
    await brandRouter.switchBrand(userId, brandKey);

    // Reload dashboard for new brand
    const dashboard = await dashboardLoader.loadBrandDashboard(userId, brandKey);

    return {
      type: 'brand_switched',
      brand: brandKey,
      reload: 'full',
      render_schema: dashboard.render_schema
    };
  }

  /**
   * Create node handler
   */
  async handleCreateNode(userId, action) {
    console.log('📌 CREATING NODE:', action.node_type);

    const node = await nodeFactory.createNonLiveNode(
      userId,
      action.node_type,
      action.node_data
    );

    return {
      type: 'node_created',
      node: node.node,
      reload: 'feed'
    };
  }

  /**
   * Voice command handler (floating chat)
   */
  async handleVoiceCommand(userId, input) {
    console.log('🎤 VOICE COMMAND:', input);

    // Send to Kernel/MCP
    const result = await kernelIntegration.processMCPRequest(
      userId,
      input
    );

    return result.ui_update;
  }

  /**
   * Refresh handler
   */
  async handleRefresh(userId, action) {
    const dashboard = await dashboardLoader.refreshDashboard(
      userId,
      action.sections || ['all']
    );

    return {
      type: 'refresh_complete',
      reload: action.sections,
      render_schema: dashboard.render_schema
    };
  }

  /**
   * HELPER: Get default brand by age
   */
  getDefaultBrand(age) {
    if (age < 10) return 'junior_mantra';
    if (age < 18) return 'jeetmantra';
    return 'mantravat';
  }

  /**
   * UTILITY: Get complete app state
   */
  async getAppState(userId) {
    const userNode = await nodeCore.loadUserNode(userId);
    const dashboard = await dashboardLoader.loadDashboard(userId);
    const brands = await brandRouter.getAvailableBrands(userId);

    return {
      user: userNode.user_node,
      active_brand: dashboard.active_brand,
      available_brands: brands.brands,
      dashboard: dashboard.render_schema,
      kernel_ready: !!process.env.OPENAI_API_KEY
    };
  }

  /**
   * UTILITY: Get all brand definitions
   */
  async getAllBrands() {
    return await brandRouter.getAllBrands();
  }

  /**
   * UTILITY: Get MCP tools available to AI
   */
  async getAvailableMCPTools() {
    return kernelIntegration.getAvailableTools();
  }
}

module.exports = new RuntimeOrchestrator();
