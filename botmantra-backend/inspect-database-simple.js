// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLIFIED DATABASE INSPECTOR - Direct Table Queries
// ═══════════════════════════════════════════════════════════════════════════════
// Purpose: Inspect existing Supabase tables and generate analysis

require('dotenv').config();
const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWN TABLES TO INSPECT (from schema files)
// ═══════════════════════════════════════════════════════════════════════════════

const KNOWN_TABLES = [
  // Core System
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'core_node',
  'node_relationship',
  'node_permission',
  'node_function',
  'node_role',
  'ui_template',
  'node_selected_fields',
  'node_module_config',
  'onboarding_session',
  'transaction_log',
  'website_scrape_data',
  'session',
  'node_prompt_versions',
  'sessions',
  
  // Economy System (Week 2 Part 1)
  'wallets',
  'transactions',
  'revenue_share_pool',
  'revenue_share_recipients',
  'wallet_permissions',
  'wallet_balance_history',
  'wallet_settings',
  
  // Contribution Graph (Week 2 Part 2)
  'contribution_graph',
  'revenue_distribution_log',
  'node_earnings_summary',
  'contribution_weights_template',
  
  // Karma/Dharma System
  'karma_accounts',
  'karma_transactions',
  'dharma_rules',
  'dharma_violations',
  
  // Onboarding System
  'business_entity_details',
  'entity_types',
  'industries',
  'service_categories',
  'onboarding_progress',
  
  // Chat & AI
  'chat_history',
  'kernel_nodes',
  'ui_frameworks',
  
  // Widget System
  'widget_configs'
];

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE STRUCTURE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

async function inspectTableStructure(tableName) {
  try {
    // Query the table to get sample data and infer structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205') {
        return { exists: false, error: 'Table does not exist' };
      }
      return { exists: false, error: error.message };
    }

    // Table exists, analyze structure from sample row
    const structure = {
      exists: true,
      tableName: tableName,
      columns: [],
      sampleData: data[0] || null,
      rowCount: null
    };

    // Get column names and types from sample data
    if (data.length > 0) {
      const sampleRow = data[0];
      structure.columns = Object.keys(sampleRow).map(key => ({
        name: key,
        type: typeof sampleRow[key],
        sampleValue: sampleRow[key]
      }));
    } else {
      // Empty table - try to get structure another way
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      structure.rowCount = count || 0;
    }

    // Try to get row count
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    structure.rowCount = count;

    return structure;

  } catch (error) {
    return {
      exists: false,
      tableName: tableName,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RELATIONSHIP DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

function detectRelationships(tables) {
  const relationships = [];

  tables.forEach(table => {
    if (!table.exists) return;

    table.columns.forEach(col => {
      // Detect foreign keys by naming convention
      if (col.name.endsWith('_id') && col.name !== 'id') {
        const relatedTable = col.name.replace(/_id$/, '') + 's';
        const singular = col.name.replace(/_id$/, '');
        
        // Check if related table exists
        const relatedExists = tables.find(t => 
          t.tableName === relatedTable || 
          t.tableName === singular ||
          t.tableName === singular.replace(/_/g, '')
        );

        if (relatedExists) {
          relationships.push({
            fromTable: table.tableName,
            fromColumn: col.name,
            toTable: relatedExists.tableName,
            toColumn: 'id',
            type: 'foreign_key'
          });
        }
      }
    });
  });

  return relationships;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ENDPOINT MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

function generateAPIMapping(tables) {
  const apiMap = {
    crudEndpoints: {},
    customEndpoints: [],
    missingImplementations: []
  };

  tables.forEach(table => {
    if (!table.exists) return;

    const routeName = table.tableName.replace(/_/g, '-');
    const hasId = table.columns.some(col => col.name === 'id');

    apiMap.crudEndpoints[table.tableName] = {
      list: {
        method: 'GET',
        path: `/api/${routeName}`,
        implemented: false
      },
      getById: hasId ? {
        method: 'GET',
        path: `/api/${routeName}/:id`,
        implemented: false
      } : null,
      create: {
        method: 'POST',
        path: `/api/${routeName}`,
        implemented: false
      },
      update: hasId ? {
        method: 'PUT',
        path: `/api/${routeName}/:id`,
        implemented: false
      } : null,
      delete: hasId ? {
        method: 'DELETE',
        path: `/api/${routeName}/:id`,
        implemented: false
      } : null
    };
  });

  return apiMap;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENT MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

function generateUIMapping(tables) {
  const uiMap = {
    forms: {},
    dataGrids: {},
    dashboards: {}
  };

  tables.forEach(table => {
    if (!table.exists) return;

    // Generate form configuration
    uiMap.forms[table.tableName] = {
      title: toTitleCase(table.tableName),
      fields: table.columns.map(col => {
        const field = {
          name: col.name,
          label: toTitleCase(col.name),
          type: inferInputType(col),
          required: isRequiredField(col.name),
          placeholder: `Enter ${toTitleCase(col.name)}`,
        };

        // Add validation based on type
        if (col.name.includes('email')) {
          field.validation = 'email';
        } else if (col.name.includes('phone')) {
          field.validation = 'phone';
        } else if (col.name.includes('url')) {
          field.validation = 'url';
        }

        return field;
      })
    };

    // Generate data grid configuration
    uiMap.dataGrids[table.tableName] = {
      title: toTitleCase(table.tableName),
      columns: table.columns
        .filter(col => !col.name.includes('password') && col.name !== 'metadata')
        .map(col => ({
          field: col.name,
          headerName: toTitleCase(col.name),
          width: col.name === 'id' ? 80 : 150,
          type: inferGridColumnType(col),
          sortable: true,
          filterable: true
        })),
      actions: ['view', 'edit', 'delete'],
      features: {
        search: true,
        filter: true,
        pagination: true,
        export: true
      }
    };
  });

  return uiMap;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateTypeScriptTypes(tables) {
  let code = '// Auto-generated TypeScript types from Supabase database\n';
  code += `// Generated: ${new Date().toISOString()}\n\n`;

  tables.forEach(table => {
    if (!table.exists) return;

    const interfaceName = toPascalCase(table.tableName);
    code += `export interface ${interfaceName} {\n`;

    table.columns.forEach(col => {
      const tsType = inferTypeScriptType(col);
      const optional = isOptionalField(col.name) ? '?' : '';
      code += `  ${col.name}${optional}: ${tsType};\n`;
    });

    code += '}\n\n';
  });

  return code;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateExpressRoutes(tables) {
  let code = '// Auto-generated Express routes\n';
  code += `// Generated: ${new Date().toISOString()}\n\n`;
  code += `const express = require('express');\n`;
  code += `const { supabase } = require('./config/supabase');\n`;
  code += `const router = express.Router();\n\n`;

  tables.forEach(table => {
    if (!table.exists) return;

    const routePath = table.tableName.replace(/_/g, '-');
    const hasId = table.columns.some(col => col.name === 'id');

    code += `// ═══ ${table.tableName.toUpperCase()} ROUTES ═══\n\n`;

    // LIST
    code += `// GET all ${table.tableName}\n`;
    code += `router.get('/${routePath}', async (req, res) => {\n`;
    code += `  try {\n`;
    code += `    const { data, error } = await supabase.from('${table.tableName}').select('*');\n`;
    code += `    if (error) throw error;\n`;
    code += `    res.json({ success: true, data });\n`;
    code += `  } catch (error) {\n`;
    code += `    res.status(400).json({ success: false, error: error.message });\n`;
    code += `  }\n`;
    code += `});\n\n`;

    if (hasId) {
      // GET BY ID
      code += `// GET ${table.tableName} by ID\n`;
      code += `router.get('/${routePath}/:id', async (req, res) => {\n`;
      code += `  try {\n`;
      code += `    const { data, error } = await supabase.from('${table.tableName}').select('*').eq('id', req.params.id).single();\n`;
      code += `    if (error) throw error;\n`;
      code += `    res.json({ success: true, data });\n`;
      code += `  } catch (error) {\n`;
      code += `    res.status(400).json({ success: false, error: error.message });\n`;
      code += `  }\n`;
      code += `});\n\n`;
    }

    // CREATE
    code += `// CREATE ${table.tableName}\n`;
    code += `router.post('/${routePath}', async (req, res) => {\n`;
    code += `  try {\n`;
    code += `    const { data, error } = await supabase.from('${table.tableName}').insert(req.body).select();\n`;
    code += `    if (error) throw error;\n`;
    code += `    res.json({ success: true, data });\n`;
    code += `  } catch (error) {\n`;
    code += `    res.status(400).json({ success: false, error: error.message });\n`;
    code += `  }\n`;
    code += `});\n\n`;

    if (hasId) {
      // UPDATE
      code += `// UPDATE ${table.tableName}\n`;
      code += `router.put('/${routePath}/:id', async (req, res) => {\n`;
      code += `  try {\n`;
      code += `    const { data, error } = await supabase.from('${table.tableName}').update(req.body).eq('id', req.params.id).select();\n`;
      code += `    if (error) throw error;\n`;
      code += `    res.json({ success: true, data });\n`;
      code += `  } catch (error) {\n`;
      code += `    res.status(400).json({ success: false, error: error.message });\n`;
      code += `  }\n`;
      code += `});\n\n`;

      // DELETE
      code += `// DELETE ${table.tableName}\n`;
      code += `router.delete('/${routePath}/:id', async (req, res) => {\n`;
      code += `  try {\n`;
      code += `    const { error } = await supabase.from('${table.tableName}').delete().eq('id', req.params.id);\n`;
      code += `    if (error) throw error;\n`;
      code += `    res.json({ success: true, message: 'Deleted successfully' });\n`;
      code += `  } catch (error) {\n`;
      code += `    res.status(400).json({ success: false, error: error.message });\n`;
      code += `  }\n`;
      code += `});\n\n`;
    }
  });

  code += `module.exports = router;\n`;
  return code;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function toPascalCase(str) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function toTitleCase(str) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function inferTypeScriptType(col) {
  if (col.name === 'id') return 'string';
  if (col.name.endsWith('_id')) return 'string';
  if (col.name.endsWith('_at')) return 'string'; // ISO timestamp
  if (col.name === 'created_at' || col.name === 'updated_at') return 'string';
  if (col.name === 'metadata' || col.name.endsWith('_data')) return 'any';
  
  switch (col.type) {
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'object': return 'any';
    default: return 'string';
  }
}

function inferInputType(col) {
  if (col.name.includes('email')) return 'email';
  if (col.name.includes('password')) return 'password';
  if (col.name.includes('phone')) return 'tel';
  if (col.name.includes('url') || col.name.includes('link')) return 'url';
  if (col.name.includes('date') || col.name.endsWith('_at')) return 'datetime-local';
  if (col.name === 'description' || col.name.includes('text')) return 'textarea';
  if (col.type === 'boolean') return 'checkbox';
  if (col.type === 'number') return 'number';
  if (col.name === 'metadata') return 'json';
  
  return 'text';
}

function inferGridColumnType(col) {
  if (col.type === 'number') return 'number';
  if (col.type === 'boolean') return 'boolean';
  if (col.name.endsWith('_at')) return 'dateTime';
  return 'string';
}

function isRequiredField(fieldName) {
  const optionalFields = ['metadata', 'description', 'notes', 'updated_at'];
  return !optionalFields.includes(fieldName) && !fieldName.endsWith('_at');
}

function isOptionalField(fieldName) {
  return !isRequiredField(fieldName);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateAnalysisReport(analysis) {
  let report = '';

  report += '═══════════════════════════════════════════════════════════════\n';
  report += '  SUPABASE DATABASE ANALYSIS REPORT\n';
  report += '═══════════════════════════════════════════════════════════════\n\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Database: ${process.env.SUPABASE_URL}\n\n`;

  report += '📊 SUMMARY\n';
  report += `  Total Tables Checked: ${analysis.tables.length}\n`;
  report += `  Tables Found: ${analysis.tables.filter(t => t.exists).length}\n`;
  report += `  Tables Missing: ${analysis.tables.filter(t => !t.exists).length}\n`;
  report += `  Relationships Detected: ${analysis.relationships.length}\n\n`;

  report += '═══════════════════════════════════════════════════════════════\n';
  report += '  EXISTING TABLES\n';
  report += '═══════════════════════════════════════════════════════════════\n\n';

  analysis.tables.filter(t => t.exists).forEach(table => {
    report += `📋 ${table.tableName}\n`;
    report += `   Columns: ${table.columns.length}\n`;
    report += `   Rows: ${table.rowCount || 'Unknown'}\n`;
    report += `   Fields: ${table.columns.map(c => c.name).join(', ')}\n\n`;
  });

  if (analysis.tables.some(t => !t.exists)) {
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '  MISSING TABLES\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';

    analysis.tables.filter(t => !t.exists).forEach(table => {
      report += `❌ ${table.tableName}\n`;
      report += `   Error: ${table.error}\n\n`;
    });
  }

  if (analysis.relationships.length > 0) {
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '  DETECTED RELATIONSHIPS\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';

    analysis.relationships.forEach(rel => {
      report += `🔗 ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}\n`;
    });
    report += '\n';
  }

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  SUPABASE DATABASE INSPECTOR                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`🔗 Database: ${process.env.SUPABASE_URL}`);
  console.log(`📅 Inspection Time: ${new Date().toISOString()}\n`);

  try {
    // Inspect all tables
    console.log('🔍 Inspecting tables...\n');
    const tables = [];
    
    for (const tableName of KNOWN_TABLES) {
      process.stdout.write(`   Checking ${tableName}...`);
      const structure = await inspectTableStructure(tableName);
      tables.push(structure);
      console.log(structure.exists ? ' ✅' : ' ❌');
    }

    // Detect relationships
    console.log('\n🔗 Detecting relationships...');
    const relationships = detectRelationships(tables.filter(t => t.exists));
    console.log(`   Found ${relationships.length} relationships\n`);

    // Build analysis
    const analysis = {
      metadata: {
        inspected_at: new Date().toISOString(),
        database_url: process.env.SUPABASE_URL
      },
      tables: tables,
      relationships: relationships,
      apiMapping: generateAPIMapping(tables),
      uiMapping: generateUIMapping(tables.filter(t => t.exists))
    };

    // Create output directory
    const outputDir = path.join(__dirname, 'database-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📝 Generating files...\n');

    // Save complete analysis
    fs.writeFileSync(
      path.join(outputDir, 'database-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    console.log('   ✅ database-analysis.json');

    // Generate text report
    const report = generateAnalysisReport(analysis);
    fs.writeFileSync(
      path.join(outputDir, 'database-report.txt'),
      report
    );
    console.log('   ✅ database-report.txt');

    // Generate TypeScript types
    const types = generateTypeScriptTypes(tables.filter(t => t.exists));
    fs.writeFileSync(
      path.join(outputDir, 'generated-types.ts'),
      types
    );
    console.log('   ✅ generated-types.ts');

    // Generate Express routes
    const routes = generateExpressRoutes(tables.filter(t => t.exists));
    fs.writeFileSync(
      path.join(outputDir, 'generated-routes.js'),
      routes
    );
    console.log('   ✅ generated-routes.js');

    // Save UI mapping
    fs.writeFileSync(
      path.join(outputDir, 'ui-component-mapping.json'),
      JSON.stringify(analysis.uiMapping, null, 2)
    );
    console.log('   ✅ ui-component-mapping.json');

    // Save API mapping
    fs.writeFileSync(
      path.join(outputDir, 'api-endpoint-mapping.json'),
      JSON.stringify(analysis.apiMapping, null, 2)
    );
    console.log('   ✅ api-endpoint-mapping.json');

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ANALYSIS COMPLETE!                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log(`📁 Output: ${outputDir}`);
    console.log(`\n📊 Results:`);
    console.log(`   - ${tables.filter(t => t.exists).length} tables analyzed`);
    console.log(`   - ${relationships.length} relationships detected`);
    console.log(`   - TypeScript types generated`);
    console.log(`   - Express routes scaffolded`);
    console.log(`   - UI mappings created`);
    console.log(`   - API endpoints documented\n`);

  } catch (error) {
    console.error('\n❌ Inspection failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  inspectTableStructure,
  detectRelationships,
  generateAPIMapping,
  generateUIMapping,
  generateTypeScriptTypes,
  generateExpressRoutes
};
