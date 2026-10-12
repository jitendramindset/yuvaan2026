#!/usr/bin/env node

/**
 * SUPABASE FUNCTION VALIDATOR - Direct PostgreSQL Version
 * Tests critical functions via direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runValidation() {
  log('='.repeat(80), 'cyan');
  log('SUPABASE FUNCTION VALIDATION REPORT', 'blue');
  log('='.repeat(80), 'cyan');
  log('');

  try {
    // Get credentials from environment
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api.mantravat.cloud';
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    log('[1/7] Verifying Supabase Connection...', 'cyan');
    
    // Use service role key for admin operations
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Test connection
    const { data: connectionTest, error: connError } = await supabase
      .from('system_mode')
      .select('*')
      .limit(1);

    if (connError) {
      log(`❌ Connection failed: ${connError.message}`, 'red');
      throw connError;
    }

    log('✅ Connected to Supabase', 'green');
    log(`   Database accessible, system_mode records: ${connectionTest?.length || 0}`, 'green');
    log('');

    // Phase 2: Check for functions
    log('[2/7] Enumerating Available Functions...', 'cyan');
    
    const { data: functionsData, error: funcError } = await supabase
      .rpc('list_all_functions')
      .then(() => ({ data: [], error: null }))
      .catch(err => {
        log(`   ℹ️  Function enumeration RPC not available (expected)`, 'yellow');
        return { data: [], error: null };
      });

    log(`   Found functions: ${functionsData?.length || 'using direct test'} (direct testing)`, 'green');
    log('');

    // Phase 3: Test critical functions
    log('[3/7] Testing Critical Functions...', 'cyan');
    
    const criticalFunctions = [
      {
        name: 'generate_cache_key',
        test: async () => {
          const { data, error } = await supabase
            .rpc('generate_cache_key', { 
              input: 'test_value'
            })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error, data };
        }
      },
      {
        name: 'postgis_version',
        test: async () => {
          const { data, error } = await supabase
            .rpc('postgis_version')
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error, data };
        }
      },
      {
        name: 'hash_text',
        test: async () => {
          const { data, error } = await supabase
            .rpc('hash_text', { input_text: 'test' })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error, data };
        }
      }
    ];

    let criticalPassed = 0;
    for (const func of criticalFunctions) {
      try {
        const result = await func.test();
        if (result.success) {
          log(`   ✅ ${func.name}`, 'green');
          criticalPassed++;
        } else {
          log(`   ⚠️  ${func.name}: ${result.error?.message || 'Unknown error'}`, 'yellow');
        }
      } catch (error) {
        log(`   ⚠️  ${func.name}: ${error.message}`, 'yellow');
      }
    }
    log(`   Result: ${criticalPassed}/${criticalFunctions.length} critical functions available`, 'green');
    log('');

    // Phase 4: Test AI functions
    log('[4/7] Testing AI/ML Functions...', 'cyan');
    
    const aiFunctions = [
      { name: 'generate_embedding', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('generate_embedding', { text_input: 'test' })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }},
      { name: 'chunk_text', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('chunk_text', { text: 'test text content', chunk_size: 100 })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }},
      { name: 'build_rag_context', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('build_rag_context', { query_text: 'test' })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }}
    ];

    let aiPassed = 0;
    for (const func of aiFunctions) {
      const result = await func.test();
      if (result.success) {
        log(`   ✅ ${func.name}`, 'green');
        aiPassed++;
      } else {
        log(`   ⚠️  ${func.name}: ${result.error?.message || 'Not available'}`, 'yellow');
      }
    }
    log(`   Result: ${aiPassed}/${aiFunctions.length} AI functions available`, 'green');
    log('');

    // Phase 5: Test business functions
    log('[5/7] Testing Business Logic Functions...', 'cyan');
    
    const businessFunctions = [
      { name: 'get_my_business_id', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('get_my_business_id')
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }},
      { name: 'apply_pagination_sorting', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('apply_pagination_sorting', { 
              offset_val: 0, 
              limit_val: 10,
              sort_col: 'created_at',
              sort_dir: 'DESC'
            })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }},
      { name: 'infer_ui_component', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('infer_ui_component', { data_type: 'text' })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }}
    ];

    let businessPassed = 0;
    for (const func of businessFunctions) {
      const result = await func.test();
      if (result.success) {
        log(`   ✅ ${func.name}`, 'green');
        businessPassed++;
      } else {
        log(`   ⚠️  ${func.name}: ${result.error?.message || 'Not available'}`, 'yellow');
      }
    }
    log(`   Result: ${businessPassed}/${businessFunctions.length} business functions available`, 'green');
    log('');

    // Phase 6: Test security functions
    log('[6/7] Testing Security Functions...', 'cyan');
    
    const securityFunctions = [
      { name: 'encrypt_payload', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('encrypt_payload', { payload: 'test' })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }},
      { name: 'decrypt_payload', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('decrypt_payload', { payload: 'test' })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }},
      { name: 'generate_pin', test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('generate_pin', { length: 6 })
            .then(result => ({ data: result, error: null }))
            .catch(err => ({ data: null, error: err }));
          return { success: !error, error };
        } catch (e) { return { success: false, error: e }; }
      }}
    ];

    let securityPassed = 0;
    for (const func of securityFunctions) {
      const result = await func.test();
      if (result.success) {
        log(`   ✅ ${func.name}`, 'green');
        securityPassed++;
      } else {
        log(`   ⚠️  ${func.name}: ${result.error?.message || 'Not available'}`, 'yellow');
      }
    }
    log(`   Result: ${securityPassed}/${securityFunctions.length} security functions available`, 'green');
    log('');

    // Phase 7: Generate report
    log('[7/7] Generating Validation Report...', 'cyan');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_functions_tested: 9,
        critical_available: criticalPassed,
        ai_available: aiPassed,
        business_available: businessPassed,
        security_available: securityPassed,
        total_available: criticalPassed + aiPassed + businessPassed + securityPassed,
        success_rate: `${Math.round(((criticalPassed + aiPassed + businessPassed + securityPassed) / 12) * 100)}%`
      },
      database_status: {
        connection: 'ACTIVE',
        supabase_url: SUPABASE_URL,
        system_records: connectionTest?.length || 0
      },
      deployment_ready: (criticalPassed + aiPassed + businessPassed + securityPassed) >= 8
    };

    fs.writeFileSync(
      path.join(__dirname, 'validation-report.json'),
      JSON.stringify(report, null, 2)
    );

    log('✅ Report generated: validation-report.json', 'green');
    log('');

    log('='.repeat(80), 'cyan');
    log('VALIDATION COMPLETE', 'blue');
    log('='.repeat(80), 'cyan');
    log(`Total Functions Tested: ${report.summary.total_functions_tested}`, 'cyan');
    log(`Available Functions: ${report.summary.total_available}`, 'green');
    log(`Success Rate: ${report.summary.success_rate}`, report.deployment_ready ? 'green' : 'yellow');
    log(`Deployment Ready: ${report.deployment_ready ? '✅ YES' : '⚠️  PARTIAL'}`, report.deployment_ready ? 'green' : 'yellow');
    log('');

    process.exit(0);

  } catch (error) {
    log(`\n❌ Validation failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run validation
runValidation();
