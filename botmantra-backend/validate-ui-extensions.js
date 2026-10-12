/**
 * UI Extension Pack - Comprehensive Validation Script
 * Tests all 5 systems: Marketplace, Custom Dashboards, Drag & Drop, Themes, White Label
 */
require('dotenv').config();
const { supabase } = require('./config/supabase');

const TESTS = {
  marketplace: [],
  customDashboards: [],
  dragDrop: [],
  themes: [],
  whiteLabel: []
};

async function testMarketplace() {
  console.log('\n🏬 TESTING MARKETPLACE DASHBOARDS\n');

  // Test 1: Browse marketplace templates
  const { data: templates, error: tError } = await supabase.rpc('get_marketplace_templates', {
    p_category: null,
    p_brand_code: null,
    p_is_free: null
  });

  if (tError) {
    console.error('❌ Browse templates failed:', tError.message);
    TESTS.marketplace.push({ test: 'Browse templates', pass: false });
  } else {
    console.log(`✅ Found ${templates.length} marketplace templates`);
    console.table(templates.map(t => ({ code: t.template_code, name: t.template_name, category: t.category, price: t.price })));
    TESTS.marketplace.push({ test: 'Browse templates', pass: true });
  }

  // Test 2: Install marketplace template (simulation)
  if (templates && templates.length > 0) {
    const testTemplate = templates[0];
    const testUserId = '00000000-0000-0000-0000-000000000001'; // Mock user

    const { data: installResult, error: iError } = await supabase.rpc('install_marketplace_template', {
      p_template_id: testTemplate.id,
      p_user_id: testUserId,
      p_business_id: null
    });

    if (iError) {
      console.error('❌ Install template failed:', iError.message);
      TESTS.marketplace.push({ test: 'Install template', pass: false });
    } else {
      console.log('✅ Template installation:', installResult);
      TESTS.marketplace.push({ test: 'Install template', pass: installResult.success });
    }
  }
}

async function testCustomDashboards() {
  console.log('\n👤 TESTING USER CUSTOMIZABLE DASHBOARDS\n');

  // Test 1: Get user template
  const testUserId = '00000000-0000-0000-0000-000000000001';

  const { data: userTemplate, error: utError } = await supabase.rpc('get_user_template', {
    p_user_id: testUserId,
    p_context: 'dashboard'
  });

  if (utError) {
    console.error('❌ Get user template failed:', utError.message);
    TESTS.customDashboards.push({ test: 'Get user template', pass: false });
  } else {
    console.log('✅ User template:', userTemplate && userTemplate.length > 0 ? userTemplate[0].template_code : 'Using default');
    TESTS.customDashboards.push({ test: 'Get user template', pass: true });
  }

  // Test 2: Duplicate template (requires existing template)
  const { data: templates } = await supabase
    .from('ui_templates')
    .select('id, template_code')
    .limit(1);

  if (templates && templates.length > 0) {
    const { data: dupResult, error: dupError } = await supabase.rpc('duplicate_template_for_user', {
      p_template_id: templates[0].id,
      p_user_id: testUserId,
      p_new_template_name: 'Test Personal Dashboard'
    });

    if (dupError) {
      console.error('❌ Duplicate template failed:', dupError.message);
      TESTS.customDashboards.push({ test: 'Duplicate template', pass: false });
    } else {
      console.log('✅ Template duplication:', dupResult);
      TESTS.customDashboards.push({ test: 'Duplicate template', pass: dupResult.success });
    }
  }

  // Test 3: Set user default template
  if (templates && templates.length > 0) {
    const { data: setResult, error: setError } = await supabase.rpc('set_user_default_template', {
      p_user_id: testUserId,
      p_template_id: templates[0].id,
      p_context: 'dashboard'
    });

    if (setError) {
      console.error('❌ Set default template failed:', setError.message);
      TESTS.customDashboards.push({ test: 'Set default template', pass: false });
    } else {
      console.log('✅ Set default template:', setResult);
      TESTS.customDashboards.push({ test: 'Set default template', pass: setResult.success });
    }
  }
}

async function testDragDrop() {
  console.log('\n🧩 TESTING DRAG & DROP LAYOUT SAVING\n');

  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testTemplateId = 'a1000000-0000-0000-0000-000000000001';
  const testWidgetId = 'w1000000-0000-0000-0000-000000000001';

  // Test 1: Save widget layout
  const { data: saveResult, error: saveError } = await supabase.rpc('save_widget_layout', {
    p_user_id: testUserId,
    p_template_id: testTemplateId,
    p_widget_id: testWidgetId,
    p_x: 0,
    p_y: 0,
    p_w: 6,
    p_h: 4,
    p_hidden: false
  });

  if (saveError) {
    console.error('❌ Save layout failed:', saveError.message);
    TESTS.dragDrop.push({ test: 'Save layout', pass: false });
  } else {
    console.log('✅ Layout saved:', saveResult);
    TESTS.dragDrop.push({ test: 'Save layout', pass: saveResult.success });
  }

  // Test 2: Save bulk layouts
  const bulkLayouts = [
    { widget_id: testWidgetId, x: 0, y: 0, w: 6, h: 4, hidden: false },
    { widget_id: 'w1000000-0000-0000-0000-000000000002', x: 6, y: 0, w: 6, h: 4, hidden: false }
  ];

  const { data: bulkResult, error: bulkError } = await supabase.rpc('save_bulk_widget_layouts', {
    p_user_id: testUserId,
    p_template_id: testTemplateId,
    p_layouts: bulkLayouts
  });

  if (bulkError) {
    console.error('❌ Bulk save failed:', bulkError.message);
    TESTS.dragDrop.push({ test: 'Bulk save layouts', pass: false });
  } else {
    console.log('✅ Bulk save:', bulkResult);
    TESTS.dragDrop.push({ test: 'Bulk save layouts', pass: bulkResult.success });
  }

  // Test 3: Get layout versions
  const { data: versions, error: vError } = await supabase.rpc('get_layout_versions', {
    p_user_id: testUserId,
    p_template_id: testTemplateId
  });

  if (vError) {
    console.error('❌ Get versions failed:', vError.message);
    TESTS.dragDrop.push({ test: 'Get versions', pass: false });
  } else {
    console.log(`✅ Found ${versions.length} layout versions`);
    if (versions.length > 0) console.table(versions);
    TESTS.dragDrop.push({ test: 'Get versions', pass: true });
  }
}

async function testThemes() {
  console.log('\n🎨 TESTING THEME EDITOR\n');

  // Test 1: Get branding
  const { data: branding, error: bError } = await supabase.rpc('get_branding', {
    p_brand_code: 'BOTMANTRA'
  });

  if (bError) {
    console.error('❌ Get branding failed:', bError.message);
    TESTS.themes.push({ test: 'Get branding', pass: false });
  } else {
    console.log('✅ Branding loaded:', branding && branding.length > 0 ? branding[0] : 'None');
    if (branding && branding.length > 0) {
      console.table([branding[0]]);
    }
    TESTS.themes.push({ test: 'Get branding', pass: true });
  }

  // Test 2: Save branding
  const testTheme = {
    primary_color: '#FF5722',
    secondary_color: '#00BCD4',
    background_color: '#FFFFFF',
    text_color: '#212121',
    font_family: 'Roboto, sans-serif',
    border_radius: '4px',
    dark_mode: false
  };

  const { data: saveResult, error: saveError } = await supabase.rpc('save_branding', {
    p_brand_code: 'TEST_BRAND',
    p_theme_config: testTheme
  });

  if (saveError) {
    console.error('❌ Save branding failed:', saveError.message);
    TESTS.themes.push({ test: 'Save branding', pass: false });
  } else {
    console.log('✅ Branding saved:', saveResult);
    TESTS.themes.push({ test: 'Save branding', pass: saveResult.success });
  }

  // Test 3: Preview theme
  const { data: preview, error: pError } = await supabase.rpc('preview_theme', {
    p_theme_config: testTheme
  });

  if (pError) {
    console.error('❌ Preview theme failed:', pError.message);
    TESTS.themes.push({ test: 'Preview theme', pass: false });
  } else {
    console.log('✅ Theme preview:', preview);
    TESTS.themes.push({ test: 'Preview theme', pass: true });
  }
}

async function testWhiteLabel() {
  console.log('\n🌐 TESTING WHITE LABEL ONBOARDING\n');

  // Test 1: Create white-label client
  const clientConfig = {
    business_id: '00000000-0000-0000-0000-000000000001',
    client_name: 'Test Corp',
    brand_code: 'TESTCORP_' + Date.now(),
    subdomain: 'testcorp' + Date.now(),
    theme_config: {
      primary_color: '#9C27B0',
      secondary_color: '#4CAF50'
    }
  };

  const { data: createResult, error: createError } = await supabase.rpc('create_white_label_client', {
    p_business_id: clientConfig.business_id,
    p_client_name: clientConfig.client_name,
    p_brand_code: clientConfig.brand_code,
    p_subdomain: clientConfig.subdomain,
    p_theme_config: clientConfig.theme_config,
    p_base_template_id: null,
    p_created_by: null
  });

  if (createError) {
    console.error('❌ Create white-label client failed:', createError.message);
    TESTS.whiteLabel.push({ test: 'Create client', pass: false });
  } else {
    console.log('✅ White-label client created:', createResult);
    TESTS.whiteLabel.push({ test: 'Create client', pass: createResult.success });

    // Test 2: Resolve domain
    if (createResult.success) {
      const { data: resolveResult, error: resolveError } = await supabase.rpc('resolve_white_label_domain', {
        p_domain: clientConfig.subdomain
      });

      if (resolveError) {
        console.error('❌ Resolve domain failed:', resolveError.message);
        TESTS.whiteLabel.push({ test: 'Resolve domain', pass: false });
      } else {
        console.log('✅ Domain resolved:', resolveResult && resolveResult.length > 0 ? resolveResult[0] : 'None');
        TESTS.whiteLabel.push({ test: 'Resolve domain', pass: true });
      }

      // Test 3: Get permissions
      const { data: permissions, error: permError } = await supabase.rpc('get_white_label_permissions', {
        p_client_id: createResult.client_id
      });

      if (permError) {
        console.error('❌ Get permissions failed:', permError.message);
        TESTS.whiteLabel.push({ test: 'Get permissions', pass: false });
      } else {
        console.log(`✅ Found ${permissions.length} permissions`);
        if (permissions.length > 0) console.table(permissions);
        TESTS.whiteLabel.push({ test: 'Get permissions', pass: true });
      }
    }
  }
}

async function generateReport() {
  console.log('\n\n' + '═'.repeat(70));
  console.log('📊 UI EXTENSION PACK - VALIDATION REPORT');
  console.log('═'.repeat(70) + '\n');

  const categories = [
    { name: '🏬 Marketplace Dashboards', tests: TESTS.marketplace },
    { name: '👤 User Custom Dashboards', tests: TESTS.customDashboards },
    { name: '🧩 Drag & Drop Layouts', tests: TESTS.dragDrop },
    { name: '🎨 Theme Editor', tests: TESTS.themes },
    { name: '🌐 White Label Onboarding', tests: TESTS.whiteLabel }
  ];

  let totalTests = 0;
  let totalPassed = 0;

  categories.forEach(cat => {
    console.log(`${cat.name}:`);
    cat.tests.forEach(t => {
      const status = t.pass ? '✅' : '❌';
      console.log(`  ${status} ${t.test}`);
      totalTests++;
      if (t.pass) totalPassed++;
    });
    console.log('');
  });

  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log('═'.repeat(70));
  console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed (${passRate}%)`);
  console.log('═'.repeat(70) + '\n');

  if (passRate === '100.0') {
    console.log('🎉 ALL SYSTEMS OPERATIONAL - UI EXTENSION PACK READY FOR PRODUCTION!');
  } else if (passRate >= '80.0') {
    console.log('⚠️  MOST SYSTEMS WORKING - Review failed tests above');
  } else {
    console.log('❌ CRITICAL ISSUES DETECTED - Database migrations may be required');
  }
}

async function runAllTests() {
  try {
    await testMarketplace();
    await testCustomDashboards();
    await testDragDrop();
    await testThemes();
    await testWhiteLabel();
    await generateReport();
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

runAllTests();
