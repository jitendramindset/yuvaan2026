/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ONBOARDING FLOW API - Complete Step-by-Step User Registration & Setup
 * ═══════════════════════════════════════════════════════════════════════════════
 * File: routes-onboarding.js
 * Purpose: Handle user signup, profile creation, company setup, module selection
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('./config/supabase');
const axios = require('axios');
const cheerio = require('cheerio');
const jwt = require('jsonwebtoken');
const NodeFactory = require('./core/nodeFactory');
const nodeFactory = new NodeFactory(supabase);

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

// Check if user is authenticated
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId || decoded.id;
    req.userEmail = decoded.email || decoded.user?.email;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: SIGNUP - User Registration
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/step1/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database (using auth.users or custom users table)
    let user;
    
    // Try Supabase Auth first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone
        }
      }
    });

    if (authError) {
      // Fallback to custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          is_verified: false
        }])
        .select()
        .single();

      if (userError) throw userError;
      user = userData;
    } else {
      user = authData.user;
      // Also create in users table for consistency
      await supabase
        .from('users')
        .insert([{
          id: user.id,
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          is_verified: false
        }])
        .select()
        .single();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Create onboarding session
    const { data: session } = await supabase
      .from('onboarding_session')
      .insert([{
        user_id: user.id,
        current_step: 'profile',
        session_data: { email, firstName, lastName }
      }])
      .select()
      .single();

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token,
      session: { id: session.id, currentStep: 'profile' }
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'Check server logs for more info'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: PROFILE SETUP - Create Default Profile/Core Node
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/step2/create-profile', verifyToken, async (req, res) => {
  try {
    const { profileName, selectedFields } = req.body;

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    // Generate node code
    const nodeCode = `PROFILE-${Date.now()}`;

    // Create core_node (profile) using NodeFactory
    const nodeMetadata = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      createdVia: 'onboarding',
      profileComplete: true,
      onboardingStep: 2,
      completedAt: new Date().toISOString()
    };

    const coreNode = await nodeFactory.createNonLiveNode('profile', req.userId, nodeMetadata, {
      node_code: nodeCode,
      node_category: 'root',
      name: profileName || `${user.first_name}'s Profile`,
      status: 'active',
      is_default: true
    });

    console.log('✅ Core node created successfully:', coreNode.id);

    // Add selected fields to node
    if (selectedFields && selectedFields.length > 0) {
      const fieldInserts = selectedFields.map((fieldId, index) => ({
        node_id: coreNode.id,
        data_model_id: fieldId,
        display_order: index,
        is_visible: true,
        is_required: true,
        added_by: req.userId
      }));

      const { error: fieldError } = await supabase
        .from('node_selected_fields')
        .insert(fieldInserts);

      if (fieldError) throw fieldError;
    }

    // Update onboarding session
    await supabase
      .from('onboarding_session')
      .update({
        current_step: 'company',
        completed_steps: 1,
        progress_percentage: 16,
        session_data: {
          profileId: coreNode.id,
          profileName: coreNode.name,
          selectedFields
        }
      })
      .eq('user_id', req.userId);

    res.json({
      success: true,
      profile: coreNode,
      nextStep: 'company'
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId: req.userId
    });
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'Check server logs for more info'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: COMPANY SETUP - Collect Business Details
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/step3/setup-company', verifyToken, async (req, res) => {
  try {
    const {
      companyName,
      businessType,
      industry,
      website,
      phone,
      email,
      address,
      city,
      state,
      country,
      postalCode
    } = req.body;

    // Get active profile from onboarding session
    const { data: session } = await supabase
      .from('onboarding_session')
      .select('session_data')
      .eq('user_id', req.userId)
      .single();

    const profileId = session?.session_data?.profileId;

    // Create or update company core_node using NodeFactory
    const nodeCode = `COMPANY-${Date.now()}`;
    
    const companyNode = await nodeFactory.createNonLiveNode('business', req.userId, {}, {
      node_code: nodeCode,
      node_category: 'root',
      parent_node_id: profileId,
      name: companyName,
      business_type: businessType,
      industry,
      website,
      phone,
      email,
      address,
      city,
      state,
      country,
      postal_code: postalCode,
      status: 'draft'
    });

    // Create relationship between profile and company
    if (profileId) {
      await supabase
        .from('node_relationship')
        .insert([{
          source_node_id: profileId,
          target_node_id: companyNode.id,
          relationship_type: 'owner',
          relationship_label: 'Profile owns Company'
        }]);
    }

    // Scrape website if provided
    let scrapedData = null;
    if (website) {
      scrapedData = await scrapeWebsite(website, companyNode.id, req.userId);
    }

    // Update onboarding session
    await supabase
      .from('onboarding_session')
      .update({
        current_step: 'modules',
        completed_steps: 2,
        progress_percentage: 33,
        session_data: {
          ...session.session_data,
          companyId: companyNode.id,
          companyName,
          businessType,
          scrapedData
        }
      })
      .eq('user_id', req.userId);

    res.json({
      success: true,
      company: companyNode,
      scrapedData,
      nextStep: 'modules'
    });
  } catch (error) {
    console.error('Company setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: MODULE SUGGESTION - Recommend modules based on business type
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/step4/suggest-modules', verifyToken, async (req, res) => {
  try {
    const { businessType, industry } = req.body;

    // Module suggestions based on business type
    const moduleMap = {
      'retail_store': ['CORE', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ORDERS', 'FINANCE'],
      'medical': ['CORE', 'CUSTOMERS', 'SERVICES', 'APPOINTMENTS', 'EMPLOYEES', 'FINANCE'],
      'restaurant': ['CORE', 'PRODUCTS', 'ORDERS', 'INVENTORY', 'CUSTOMERS', 'FINANCE'],
      'software': ['CORE', 'SERVICES', 'CUSTOMERS', 'ORDERS', 'FINANCE', 'TEAM', 'PROJECT'],
      'education': ['CORE', 'CUSTOMERS', 'SERVICES', 'APPOINTMENTS', 'EMPLOYEES', 'FINANCE'],
      'coaching': ['CORE', 'CUSTOMERS', 'SERVICES', 'APPOINTMENTS', 'TEAM', 'PROJECT'],
      'social_media': ['CORE', 'SOCIAL', 'CUSTOMERS', 'FINANCE', 'TEAM'],
      'service': ['CORE', 'SERVICES', 'APPOINTMENTS', 'CUSTOMERS', 'EMPLOYEES', 'FINANCE'],
      'corporate': ['CORE', 'CUSTOMERS', 'PRODUCTS', 'SERVICES', 'ORDERS', 'FINANCE', 'TEAM', 'PROJECT', 'REGION', 'COST']
    };

    const suggestedModules = moduleMap[businessType?.toLowerCase()] || moduleMap['corporate'];

    // Get field counts for each module
    const modules = [];
    for (const moduleName of suggestedModules) {
      const { data: fields } = await supabase
        .from('data_model_registry')
        .select('id, column_name, display_name, category, ui_component', { count: 'exact' })
        .eq('module', moduleName)
        .eq('is_active', true);

      modules.push({
        module: moduleName,
        fieldCount: fields?.length || 0,
        fields: fields || [],
        isRecommended: true
      });
    }

    res.json({
      success: true,
      suggestedModules: modules,
      businessType,
      industry
    });
  } catch (error) {
    console.error('Module suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: CONFIGURE MODULES - User selects and configures modules
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/step5/configure-modules', verifyToken, async (req, res) => {
  try {
    const { companyId, selectedModules } = req.body;

    // Get session to retrieve company info
    const { data: session } = await supabase
      .from('onboarding_session')
      .select('session_data')
      .eq('user_id', req.userId)
      .single();

    const company = session?.session_data?.companyId || companyId;

    // Create module configurations
    const moduleConfigs = [];
    const nodeFieldSelections = [];

    for (let i = 0; i < selectedModules.length; i++) {
      const module = selectedModules[i];

      // Add module configuration
      moduleConfigs.push({
        node_id: company,
        module_name: module.module,
        module_type: module.type || 'reference',
        is_enabled: true,
        display_order: i,
        configured_by: req.userId,
        module_settings: module.settings || {}
      });

      // Add selected fields from this module
      if (module.selectedFieldIds && module.selectedFieldIds.length > 0) {
        for (let j = 0; j < module.selectedFieldIds.length; j++) {
          nodeFieldSelections.push({
            node_id: company,
            data_model_id: module.selectedFieldIds[j],
            display_order: j,
            is_visible: true,
            is_required: module.requiredFieldIds?.includes(module.selectedFieldIds[j]) || false,
            added_by: req.userId
          });
        }
      }
    }

    // Insert module configs
    if (moduleConfigs.length > 0) {
      const { error: configError } = await supabase
        .from('node_module_config')
        .insert(moduleConfigs);
      if (configError) throw configError;
    }

    // Insert field selections
    if (nodeFieldSelections.length > 0) {
      const { error: fieldError } = await supabase
        .from('node_selected_fields')
        .insert(nodeFieldSelections);
      if (fieldError) throw fieldError;
    }

    // Update onboarding session
    await supabase
      .from('onboarding_session')
      .update({
        current_step: 'layout',
        completed_steps: 3,
        progress_percentage: 50,
        session_data: {
          ...session.session_data,
          selectedModules: selectedModules.map(m => m.module)
        }
      })
      .eq('user_id', req.userId);

    res.json({
      success: true,
      modulesConfigured: moduleConfigs.length,
      fieldsAdded: nodeFieldSelections.length,
      nextStep: 'layout'
    });
  } catch (error) {
    console.error('Module configuration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: DEFAULT LAYOUT - Generate and select default layout
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/step6/create-layout', verifyToken, async (req, res) => {
  try {
    const { companyId, layoutType = 'dashboard' } = req.body;

    // Get company and modules
    const { data: moduleConfigs } = await supabase
      .from('node_module_config')
      .select('*')
      .eq('node_id', companyId)
      .eq('is_enabled', true);

    const { data: selectedFields } = await supabase
      .from('node_selected_fields')
      .select('data_model_id, display_order, is_visible, is_required, custom_label, custom_placeholder, custom_validation_rule')
      .eq('node_id', companyId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const dataModelIds = (selectedFields || []).map(field => field.data_model_id);
    const { data: modelFields } = dataModelIds.length > 0
      ? await supabase
          .from('data_model_registry')
          .select('id, module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type, category, validation_rule, default_value')
          .in('id', dataModelIds)
      : { data: [] };

    const uiFieldsSnapshot = (modelFields || []).map(field => {
      const override = (selectedFields || []).find(item => item.data_model_id === field.id);
      return {
        id: field.id,
        module: field.module,
        table_name: field.table_name,
        column_name: field.column_name,
        display_name: field.display_name,
        ui_label: field.ui_label,
        ui_component: field.ui_component,
        input_type: field.input_type,
        category: field.category,
        is_required: override?.is_required ?? false,
        is_visible: override?.is_visible ?? true,
        custom_label: override?.custom_label || null,
        custom_placeholder: override?.custom_placeholder || null,
        custom_validation_rule: override?.custom_validation_rule || field.validation_rule || null
      };
    });

    const modelFieldsSnapshot = (modelFields || []).map(field => ({
      id: field.id,
      module: field.module,
      table_name: field.table_name,
      column_name: field.column_name,
      data_type: field.data_type,
      validation_rule: field.validation_rule || null,
      default_value: field.default_value || null
    }));

    // Generate layout structure based on modules and selected fields
    const layoutStructure = generateLayoutStructure(companyId, moduleConfigs, layoutType);

    // Create UI template
    const templateCode = `LAYOUT-${Date.now()}`;
    const { data: template, error: templateError } = await supabase
      .from('ui_template')
      .insert([{
        node_id: companyId,
        template_code: templateCode,
        template_name: `${layoutType} Layout for Company`,
        template_type: layoutType,
        template_category: 'business',
        template_structure: layoutStructure,
        layout_config: {
          type: layoutType,
          responsive: true,
          theme: 'default'
        },
        ui_fields_json: uiFieldsSnapshot,
        model_fields_json: modelFieldsSnapshot,
        is_default: true,
        created_by: req.userId
      }])
      .select()
      .single();

    if (templateError) throw templateError;

    // Update core_node with default template using NodeFactory
    await nodeFactory.updateNode(companyId, {
      default_template_id: template.id,
      default_layout_id: template.id,
      ui_template_json: layoutStructure,
      ui_fields_json: uiFieldsSnapshot,
      model_fields_json: modelFieldsSnapshot
    });

    // Update onboarding session
    const { data: session } = await supabase
      .from('onboarding_session')
      .select('session_data')
      .eq('user_id', req.userId)
      .single();

    await supabase
      .from('onboarding_session')
      .update({
        current_step: 'confirmation',
        completed_steps: 4,
        progress_percentage: 66,
        session_data: {
          ...session.session_data,
          layoutId: template.id
        }
      })
      .eq('user_id', req.userId);

    res.json({
      success: true,
      template,
      layoutStructure,
      nextStep: 'confirmation'
    });
  } catch (error) {
    console.error('Layout creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7: FINALIZE - Save everything and mark setup as complete
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/step7/finalize', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.body;

    // Update core_node status to active using NodeFactory
    const company = await nodeFactory.updateNode(companyId, { status: 'active' });

    if (!company) throw new Error('Company not found');

    // Create owner permission
    await supabase
      .from('node_permission')
      .insert([{
        node_id: companyId,
        user_id: req.userId,
        role: 'owner',
        permission_level: 4,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_manage_permissions: true,
        can_manage_users: true
      }]);

    // Create user session
    const token = jwt.sign({ id: req.userId, nodeId: companyId }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    const { data: userSession } = await supabase
      .from('session')
      .insert([{
        user_id: req.userId,
        active_node_id: companyId,
        session_token: token
      }])
      .select()
      .single();

    // Mark onboarding as complete
    await supabase
      .from('onboarding_session')
      .update({
        status: 'completed',
        completed_at: new Date(),
        completed_steps: 7,
        progress_percentage: 100,
        current_step: 'complete'
      })
      .eq('user_id', req.userId);

    res.json({
      success: true,
      company,
      session: userSession,
      token,
      message: 'Onboarding completed successfully!'
    });
  } catch (error) {
    console.error('Finalization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET ONBOARDING STATUS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/status', verifyToken, async (req, res) => {
  try {
    const { data: session } = await supabase
      .from('onboarding_session')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Scrape website for business information
 */
async function scrapeWebsite(url, nodeId, userId) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(response.data);

    const scrapedData = {
      pageTitle: $('title').text(),
      pageDescription: $('meta[name="description"]').attr('content'),
      h1: $('h1').first().text(),
      email: extractEmail(response.data),
      phone: extractPhone(response.data),
      socialLinks: extractSocialLinks($),
      services: extractServices($),
      products: extractProducts($)
    };

    // Save to database
    await supabase
      .from('website_scrape_data')
      .insert([{
        node_id: nodeId,
        website_url: url,
        page_title: scrapedData.pageTitle,
        page_description: scrapedData.pageDescription,
        company_email: scrapedData.email,
        company_phone: scrapedData.phone,
        social_links: scrapedData.socialLinks,
        services: JSON.stringify(scrapedData.services),
        products: JSON.stringify(scrapedData.products),
        scraped_metadata: scrapedData,
        scrape_status: 'success',
        requested_by: userId
      }]);

    return scrapedData;
  } catch (error) {
    console.error('Website scrape error:', error);
    return null;
  }
}

function extractEmail(html) {
  const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/;
  const match = html.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(html) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = html.match(phoneRegex);
  return match ? match[0] : null;
}

function extractSocialLinks($) {
  return {
    facebook: $('a[href*="facebook"]').attr('href') || null,
    twitter: $('a[href*="twitter"]').attr('href') || null,
    linkedin: $('a[href*="linkedin"]').attr('href') || null,
    instagram: $('a[href*="instagram"]').attr('href') || null
  };
}

function extractServices($) {
  const services = [];
  $('h2, h3').each((i, el) => {
    const text = $(el).text();
    if (text.length > 0 && text.length < 100) {
      services.push(text);
    }
  });
  return services.slice(0, 10);
}

function extractProducts($) {
  const products = [];
  $('[class*="product"], [id*="product"]').each((i, el) => {
    const text = $(el).text();
    if (text.length > 0 && text.length < 100) {
      products.push(text);
    }
  });
  return products.slice(0, 10);
}

/**
 * Generate layout structure based on modules and fields
 */
function generateLayoutStructure(nodeId, moduleConfigs, layoutType) {
  const structure = {
    type: layoutType,
    version: '1.0',
    sections: []
  };

  if (layoutType === 'dashboard') {
    structure.sections = [
      {
        id: 'header',
        type: 'header',
        title: 'Dashboard',
        components: ['search', 'notifications', 'user_menu']
      },
      {
        id: 'stats',
        type: 'stats',
        components: [
          { name: 'total_users', metric: 'Users' },
          { name: 'total_transactions', metric: 'Transactions' },
          { name: 'total_revenue', metric: 'Revenue' }
        ]
      },
      {
        id: 'modules',
        type: 'grid',
        cols: 2,
        components: moduleConfigs?.map(m => ({
          id: m.module_name,
          type: 'card',
          title: m.module_name,
          icon: getModuleIcon(m.module_name)
        })) || []
      },
      {
        id: 'recent_activity',
        type: 'table',
        title: 'Recent Activity',
        columns: ['Date', 'Type', 'Action', 'Status']
      }
    ];
  }

  return structure;
}

function getModuleIcon(moduleName) {
  const iconMap = {
    'CORE': '🏢',
    'CUSTOMERS': '👥',
    'PRODUCTS': '📦',
    'SERVICES': '🔧',
    'ORDERS': '📋',
    'INVENTORY': '📊',
    'EMPLOYEES': '👔',
    'FINANCE': '💰',
    'APPOINTMENTS': '📅',
    'SOCIAL': '📱',
    'PROJECT': '🎯',
    'TEAM': '🤝',
    'TASK': '✅',
    'REGION': '🌍',
    'COST': '💸'
  };
  return iconMap[moduleName] || '📌';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE USER PROFILE (NODE-BASED) - Persist profile data via Node Architecture
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/user-profile/save', verifyToken, async (req, res) => {
  try {
    const { userId, profileData, timestamp } = req.body;
    const actualUserId = req.userId || userId;

    if (!actualUserId || !profileData) {
      return res.status(400).json({ error: 'Missing userId or profileData' });
    }

    // Use NodeFactory to update or create user node
    const nodeFactory = new NodeFactory(supabase);

    // Query user's node
    let userNode = await nodeFactory.queryNodes({ 
      node_type: 'user_node',
      owner_id: actualUserId 
    });

    if (!userNode || userNode.length === 0) {
      // Create new user node if doesn't exist
      const createResult = await nodeFactory.createUserNode(actualUserId, profileData);
      if (!createResult.success) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create user node',
          details: createResult.error 
        });
      }
      userNode = [createResult.user_node];
    }

    // Update user node with profile data (stored in field_map)
    const nodeId = userNode[0].row_id;
    const updateResult = await nodeFactory.updateNode(nodeId, {
      field_map: JSON.stringify(profileData), // Store profile data in field_map
      updated_at: new Date().toISOString()
    });

    if (!updateResult.success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update user node' 
      });
    }

    res.json({
      success: true,
      message: 'Profile saved successfully via node system',
      node: userNode[0],
      profile: profileData
    });
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to save profile'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET USER PROFILE (NODE-BASED) - Retrieve profile data from User Node
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/user-profile/get', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Use NodeFactory to get user node
    const nodeFactory = new NodeFactory(supabase);
    
    const userNodes = await nodeFactory.queryNodes({ 
      node_type: 'user_node',
      owner_id: userId 
    });

    if (!userNodes || userNodes.length === 0) {
      return res.json({
        success: true,
        profile: null,
        message: 'No user node found'
      });
    }

    const userNode = userNodes[0];
    
    // Parse profile data from field_map (stored as bytea/JSONB)
    let profileData = {};
    try {
      if (userNode.field_map) {
        const fieldMapStr = Buffer.isBuffer(userNode.field_map) 
          ? userNode.field_map.toString('utf-8')
          : userNode.field_map;
        profileData = typeof fieldMapStr === 'string' 
          ? JSON.parse(fieldMapStr)
          : fieldMapStr;
      }
    } catch (parseErr) {
      console.warn('Could not parse field_map:', parseErr.message);
    }

    res.json({
      success: true,
      profile: {
        node_id: userNode.row_id,
        node_nid_hash: userNode.nid_hash,
        profile_data: profileData,
        created_at: userNode.created_at,
        updated_at: userNode.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch profile'
    });
  }
});

module.exports = router;
