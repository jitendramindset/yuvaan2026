// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE DATABASE INSPECTOR & SCHEMA ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════
// Purpose: Automatically inspect database and generate backend/UI alignment
// Features:
// - Discover all tables, columns, types, constraints
// - Find all functions, views, triggers
// - Detect foreign key relationships
// - Analyze RLS policies
// - Generate API routes, types, and UI mappings

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA INSPECTION QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

const INSPECTION_QUERIES = {
  // Get all tables in public schema
  tables: `
    SELECT 
      table_name,
      table_type,
      is_insertable_into,
      is_typed
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type IN ('BASE TABLE', 'VIEW')
    ORDER BY table_name;
  `,

  // Get all columns with detailed info
  columns: `
    SELECT 
      c.table_name,
      c.column_name,
      c.ordinal_position,
      c.column_default,
      c.is_nullable,
      c.data_type,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale,
      c.udt_name,
      col_description(format('%s.%s', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as column_comment
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
  `,

  // Get primary keys
  primaryKeys: `
    SELECT 
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
  `,

  // Get foreign keys
  foreignKeys: `
    SELECT
      tc.table_name as from_table,
      kcu.column_name as from_column,
      ccu.table_name as to_table,
      ccu.column_name as to_column,
      tc.constraint_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
  `,

  // Get unique constraints
  uniqueConstraints: `
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
  `,

  // Get check constraints
  checkConstraints: `
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.constraint_type = 'CHECK'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `,

  // Get indexes
  indexes: `
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `,

  // Get functions
  functions: `
    SELECT
      p.proname as function_name,
      pg_get_function_arguments(p.oid) as arguments,
      pg_get_function_result(p.oid) as return_type,
      l.lanname as language,
      CASE
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
      END as volatility,
      d.description
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    LEFT JOIN pg_description d ON p.oid = d.objoid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname;
  `,

  // Get triggers
  triggers: `
    SELECT
      trigger_name,
      event_manipulation,
      event_object_table as table_name,
      action_statement,
      action_timing,
      action_orientation
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `,

  // Get views
  views: `
    SELECT
      table_name as view_name,
      view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `,

  // Get RLS policies
  rlsPolicies: `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `,

  // Get enums
  enums: `
    SELECT
      t.typname as enum_name,
      e.enumlabel as enum_value,
      e.enumsortorder as sort_order
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
  `
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE INSPECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function executeQuery(queryName, sql) {
  try {
    console.log(`\n🔍 Inspecting: ${queryName}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC not available, try direct query
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        console.log(`⚠️  Using fallback method for ${queryName}`);
        return await executeFallbackQuery(queryName);
      }

      return await response.json();
    }

    console.log(`✅ Found ${data?.length || 0} ${queryName}`);
    return data;
  } catch (error) {
    console.error(`❌ Error inspecting ${queryName}:`, error.message);
    return [];
  }
}

async function executeFallbackQuery(queryName) {
  // Use Supabase client methods as fallback
  switch (queryName) {
    case 'tables':
      return await getAllTables();
    default:
      return [];
  }
}

async function getAllTables() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('*')
    .eq('table_schema', 'public');
  
  if (error) return [];
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

async function inspectDatabase() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  SUPABASE DATABASE INSPECTOR                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Database: ${process.env.SUPABASE_URL}`);
  console.log(`📅 Inspection Date: ${new Date().toISOString()}\n`);

  const schema = {
    metadata: {
      inspected_at: new Date().toISOString(),
      database_url: process.env.SUPABASE_URL
    },
    tables: [],
    columns: [],
    primaryKeys: [],
    foreignKeys: [],
    uniqueConstraints: [],
    checkConstraints: [],
    indexes: [],
    functions: [],
    triggers: [],
    views: [],
    rlsPolicies: [],
    enums: []
  };

  // Execute all inspection queries
  for (const [key, sql] of Object.entries(INSPECTION_QUERIES)) {
    schema[key] = await executeQuery(key, sql);
  }

  return schema;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA ORGANIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function organizeSchema(rawSchema) {
  const organized = {
    metadata: rawSchema.metadata,
    tables: {}
  };

  // Group columns by table
  const columnsByTable = {};
  (rawSchema.columns || []).forEach(col => {
    if (!columnsByTable[col.table_name]) {
      columnsByTable[col.table_name] = [];
    }
    columnsByTable[col.table_name].push(col);
  });

  // Group primary keys by table
  const pkByTable = {};
  (rawSchema.primaryKeys || []).forEach(pk => {
    if (!pkByTable[pk.table_name]) {
      pkByTable[pk.table_name] = [];
    }
    pkByTable[pk.table_name].push(pk.column_name);
  });

  // Group foreign keys by table
  const fkByTable = {};
  (rawSchema.foreignKeys || []).forEach(fk => {
    if (!fkByTable[fk.from_table]) {
      fkByTable[fk.from_table] = [];
    }
    fkByTable[fk.from_table].push(fk);
  });

  // Build organized structure
  (rawSchema.tables || []).forEach(table => {
    organized.tables[table.table_name] = {
      name: table.table_name,
      type: table.table_type,
      columns: columnsByTable[table.table_name] || [],
      primaryKeys: pkByTable[table.table_name] || [],
      foreignKeys: fkByTable[table.table_name] || [],
      indexes: (rawSchema.indexes || []).filter(idx => idx.tablename === table.table_name),
      triggers: (rawSchema.triggers || []).filter(trg => trg.table_name === table.table_name),
      rlsPolicies: (rawSchema.rlsPolicies || []).filter(pol => pol.tablename === table.table_name)
    };
  });

  organized.views = rawSchema.views || [];
  organized.functions = rawSchema.functions || [];
  organized.enums = rawSchema.enums || [];

  return organized;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateTextReport(schema) {
  let report = '';

  report += '═══════════════════════════════════════════════════════════════\n';
  report += '  DATABASE SCHEMA ANALYSIS REPORT\n';
  report += '═══════════════════════════════════════════════════════════════\n\n';

  report += `Inspection Date: ${schema.metadata.inspected_at}\n`;
  report += `Database URL: ${schema.metadata.database_url}\n\n`;

  report += `📊 SUMMARY:\n`;
  report += `  - Tables: ${Object.keys(schema.tables).length}\n`;
  report += `  - Views: ${schema.views.length}\n`;
  report += `  - Functions: ${schema.functions.length}\n`;
  report += `  - Enums: ${[...new Set(schema.enums.map(e => e.enum_name))].length}\n\n`;

  report += '═══════════════════════════════════════════════════════════════\n';
  report += '  TABLES DETAILS\n';
  report += '═══════════════════════════════════════════════════════════════\n\n';

  Object.values(schema.tables).forEach(table => {
    report += `📋 Table: ${table.name}\n`;
    report += `   Type: ${table.type}\n`;
    report += `   Columns: ${table.columns.length}\n`;
    report += `   Primary Keys: ${table.primaryKeys.join(', ') || 'None'}\n`;
    report += `   Foreign Keys: ${table.foreignKeys.length}\n`;
    report += `   Indexes: ${table.indexes.length}\n`;
    report += `   Triggers: ${table.triggers.length}\n`;
    report += `   RLS Policies: ${table.rlsPolicies.length}\n`;

    if (table.columns.length > 0) {
      report += '\n   Columns:\n';
      table.columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        const defaultVal = col.column_default ? `= ${col.column_default}` : '';
        report += `     - ${col.column_name}: ${col.data_type} ${nullable} ${defaultVal}\n`;
      });
    }

    if (table.foreignKeys.length > 0) {
      report += '\n   Foreign Keys:\n';
      table.foreignKeys.forEach(fk => {
        report += `     - ${fk.from_column} → ${fk.to_table}(${fk.to_column}) [${fk.delete_rule}]\n`;
      });
    }

    report += '\n';
  });

  if (schema.views.length > 0) {
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '  VIEWS\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
    schema.views.forEach(view => {
      report += `📊 View: ${view.view_name}\n\n`;
    });
  }

  if (schema.functions.length > 0) {
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '  FUNCTIONS\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
    schema.functions.forEach(func => {
      report += `⚙️  Function: ${func.function_name}(${func.arguments})\n`;
      report += `   Returns: ${func.return_type}\n`;
      report += `   Language: ${func.language}\n`;
      report += `   Volatility: ${func.volatility}\n\n`;
    });
  }

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CODE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateTypeScriptTypes(schema) {
  let code = '// Auto-generated TypeScript types from database schema\n';
  code += `// Generated at: ${new Date().toISOString()}\n\n`;

  Object.values(schema.tables).forEach(table => {
    code += `export interface ${toPascalCase(table.name)} {\n`;
    table.columns.forEach(col => {
      const tsType = sqlTypeToTS(col.data_type);
      const optional = col.is_nullable === 'YES' ? '?' : '';
      code += `  ${col.column_name}${optional}: ${tsType};\n`;
    });
    code += '}\n\n';
  });

  return code;
}

function generateAPIRoutes(schema) {
  let code = '// Auto-generated API routes from database schema\n';
  code += `// Generated at: ${new Date().toISOString()}\n\n`;
  code += `const express = require('express');\n`;
  code += `const router = express.Router();\n\n`;

  Object.values(schema.tables).forEach(table => {
    const routeName = table.name.replace(/_/g, '-');
    code += `// ${table.name} routes\n`;
    code += `router.get('/${routeName}', async (req, res) => { /* GET all */ });\n`;
    code += `router.get('/${routeName}/:id', async (req, res) => { /* GET by ID */ });\n`;
    code += `router.post('/${routeName}', async (req, res) => { /* CREATE */ });\n`;
    code += `router.put('/${routeName}/:id', async (req, res) => { /* UPDATE */ });\n`;
    code += `router.delete('/${routeName}/:id', async (req, res) => { /* DELETE */ });\n\n`;
  });

  code += `module.exports = router;\n`;
  return code;
}

function generateUIMapping(schema) {
  const mapping = {
    forms: {},
    tables: {},
    relationships: {}
  };

  Object.values(schema.tables).forEach(table => {
    // Generate form fields
    mapping.forms[table.name] = table.columns.map(col => ({
      name: col.column_name,
      type: sqlTypeToInputType(col.data_type),
      required: col.is_nullable === 'NO',
      label: toTitleCase(col.column_name)
    }));

    // Generate table columns
    mapping.tables[table.name] = table.columns.map(col => ({
      field: col.column_name,
      headerName: toTitleCase(col.column_name),
      type: sqlTypeToGridType(col.data_type)
    }));

    // Map relationships
    mapping.relationships[table.name] = table.foreignKeys.map(fk => ({
      from: fk.from_column,
      to: fk.to_table,
      toColumn: fk.to_column,
      type: 'many-to-one'
    }));
  });

  return mapping;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function toPascalCase(str) {
  return str.replace(/(^\w|_\w)/g, (match) => match.replace('_', '').toUpperCase());
}

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function sqlTypeToTS(sqlType) {
  const typeMap = {
    'integer': 'number',
    'bigint': 'number',
    'smallint': 'number',
    'decimal': 'number',
    'numeric': 'number',
    'real': 'number',
    'double precision': 'number',
    'varchar': 'string',
    'character varying': 'string',
    'text': 'string',
    'uuid': 'string',
    'boolean': 'boolean',
    'timestamp': 'Date',
    'timestamp without time zone': 'Date',
    'timestamp with time zone': 'Date',
    'date': 'Date',
    'jsonb': 'any',
    'json': 'any',
    'array': 'any[]'
  };
  return typeMap[sqlType.toLowerCase()] || 'any';
}

function sqlTypeToInputType(sqlType) {
  const typeMap = {
    'integer': 'number',
    'bigint': 'number',
    'decimal': 'number',
    'varchar': 'text',
    'text': 'textarea',
    'boolean': 'checkbox',
    'timestamp': 'datetime-local',
    'date': 'date',
    'jsonb': 'textarea'
  };
  return typeMap[sqlType.toLowerCase()] || 'text';
}

function sqlTypeToGridType(sqlType) {
  const typeMap = {
    'integer': 'number',
    'decimal': 'number',
    'boolean': 'boolean',
    'timestamp': 'dateTime',
    'date': 'date'
  };
  return typeMap[sqlType.toLowerCase()] || 'string';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    // Inspect database
    const rawSchema = await inspectDatabase();
    const schema = organizeSchema(rawSchema);

    // Create output directory
    const outputDir = path.join(__dirname, 'database-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('\n\n📝 Generating reports and code...\n');

    // Save raw schema JSON
    fs.writeFileSync(
      path.join(outputDir, 'schema-raw.json'),
      JSON.stringify(rawSchema, null, 2)
    );
    console.log('✅ Saved: schema-raw.json');

    // Save organized schema JSON
    fs.writeFileSync(
      path.join(outputDir, 'schema-organized.json'),
      JSON.stringify(schema, null, 2)
    );
    console.log('✅ Saved: schema-organized.json');

    // Generate text report
    const textReport = generateTextReport(schema);
    fs.writeFileSync(
      path.join(outputDir, 'schema-report.txt'),
      textReport
    );
    console.log('✅ Saved: schema-report.txt');

    // Generate TypeScript types
    const tsTypes = generateTypeScriptTypes(schema);
    fs.writeFileSync(
      path.join(outputDir, 'generated-types.ts'),
      tsTypes
    );
    console.log('✅ Saved: generated-types.ts');

    // Generate API routes
    const apiRoutes = generateAPIRoutes(schema);
    fs.writeFileSync(
      path.join(outputDir, 'generated-routes.js'),
      apiRoutes
    );
    console.log('✅ Saved: generated-routes.js');

    // Generate UI mapping
    const uiMapping = generateUIMapping(schema);
    fs.writeFileSync(
      path.join(outputDir, 'ui-mapping.json'),
      JSON.stringify(uiMapping, null, 2)
    );
    console.log('✅ Saved: ui-mapping.json');

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  INSPECTION COMPLETE!                                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - ${Object.keys(schema.tables).length} tables analyzed`);
    console.log(`   - ${schema.views.length} views found`);
    console.log(`   - ${schema.functions.length} functions found`);
    console.log(`   - TypeScript types generated`);
    console.log(`   - API routes scaffolded`);
    console.log(`   - UI mappings created`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Inspection failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the inspector
if (require.main === module) {
  main();
}

module.exports = {
  inspectDatabase,
  organizeSchema,
  generateTypeScriptTypes,
  generateAPIRoutes,
  generateUIMapping
};
