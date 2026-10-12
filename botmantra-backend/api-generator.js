/**
 * Comprehensive API Generator for Supabase Tables
 * Generates CRUD endpoints with proper validation, error handling, and testing
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Parse CSV schema
async function parseSchema(csvPath) {
  const tables = {};
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const { table_name, column_name, data_type } = row;
        
        // Skip PostgreSQL system tables
        if (table_name.startsWith('pg_') || table_name.startsWith('_pg_')) {
          return;
        }
        
        if (!tables[table_name]) {
          tables[table_name] = {
            name: table_name,
            columns: []
          };
        }
        
        tables[table_name].columns.push({
          name: column_name,
          type: data_type,
          isPrimaryKey: column_name === 'id',
          isRequired: !['created_at', 'updated_at'].includes(column_name)
        });
      })
      .on('end', () => {
        resolve(Object.values(tables));
      })
      .on('error', reject);
  });
}

// Determine table category
function categorizeTable(tableName) {
  if (tableName.startsWith('ai_')) return 'ai';
  if (tableName.startsWith('business_')) return 'business';
  if (tableName.startsWith('node_')) return 'node';
  if (tableName.startsWith('admin_')) return 'admin';
  if (['users', 'owner', 'identities', 'sessions'].includes(tableName)) return 'auth';
  if (['clients', 'invoices', 'payments', 'projects'].includes(tableName)) return 'crm';
  return 'misc';
}

// Generate route name
function generateRouteName(tableName) {
  return tableName.replace(/_/g, '-');
}

// Generate validation schema
function generateValidationSchema(columns) {
  const requiredFields = columns
    .filter(c => c.isRequired && !c.isPrimaryKey && c.name !== 'created_at' && c.name !== 'updated_at')
    .map(c => c.name);
    
  return `
  const requiredFields = ${JSON.stringify(requiredFields)};
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: \`Missing required fields: \${missingFields.join(', ')}\`
    });
  }`;
}

// Generate single route file
function generateRouteFile(table) {
  const routeName = generateRouteName(table.name);
  const hasId = table.columns.some(c => c.name === 'id');
  const hasBusinessId = table.columns.some(c => c.name === 'business_id');
  const hasUserId = table.columns.some(c => c.name === 'user_id');
  
  const validation = generateValidationSchema(table.columns);
  
  return `/**
 * Auto-generated API Routes for ${table.name}
 * Generated: ${new Date().toISOString()}
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ============================================================
// GET ALL - List all ${table.name} records
// ============================================================
router.get('/${routeName}', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('${table.name}')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });
    
    ${hasBusinessId ? '// Filter by business if business_id present\n    if (req.user.business_id) {\n      query = query.eq(\'business_id\', req.user.business_id);\n    }' : ''}
    ${hasUserId ? '// Filter by user if user_id present\n    if (req.user.id) {\n      query = query.eq(\'user_id\', req.user.id);\n    }' : ''}
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('${table.name} GET ALL error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('${table.name} GET ALL exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

${hasId ? `// ============================================================
// GET BY ID - Get single ${table.name} record
// ============================================================
router.get('/${routeName}/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('${table.name}')
      .select('*')
      .eq('id', id);
    
    ${hasBusinessId ? '// Security: Ensure user can only access their business data\n    if (req.user.business_id) {\n      query = query.eq(\'business_id\', req.user.business_id);\n    }' : ''}
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: '${table.name} record not found'
        });
      }
      console.error('${table.name} GET BY ID error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('${table.name} GET BY ID exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});` : ''}

// ============================================================
// CREATE - Create new ${table.name} record
// ============================================================
router.post('/${routeName}', authenticate, async (req, res) => {
  try {
    ${validation}
    
    const payload = {
      ...req.body${hasBusinessId ? ',\n      business_id: req.user.business_id' : ''}${hasUserId ? ',\n      user_id: req.user.id' : ''}
    };
    
    const { data, error } = await supabase
      .from('${table.name}')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('${table.name} CREATE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('${table.name} CREATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

${hasId ? `// ============================================================
// UPDATE - Update existing ${table.name} record
// ============================================================
router.put('/${routeName}/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = req.body;
    
    let query = supabase
      .from('${table.name}')
      .update(updateData)
      .eq('id', id);
    
    ${hasBusinessId ? '// Security: Ensure user can only update their business data\n    if (req.user.business_id) {\n      query = query.eq(\'business_id\', req.user.business_id);\n    }' : ''}
    
    const { data, error } = await query.select().single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: '${table.name} record not found or unauthorized'
        });
      }
      console.error('${table.name} UPDATE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('${table.name} UPDATE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================
// DELETE - Delete ${table.name} record
// ============================================================
router.delete('/${routeName}/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = supabase
      .from('${table.name}')
      .delete()
      .eq('id', id);
    
    ${hasBusinessId ? '// Security: Ensure user can only delete their business data\n    if (req.user.business_id) {\n      query = query.eq(\'business_id\', req.user.business_id);\n    }' : ''}
    
    const { error } = await query;
    
    if (error) {
      console.error('${table.name} DELETE error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: '${table.name} record deleted successfully'
    });
  } catch (error) {
    console.error('${table.name} DELETE exception:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});` : ''}

module.exports = router;
`;
}

// Generate test file
function generateTestFile(table) {
  const routeName = generateRouteName(table.name);
  
  return `/**
 * API Tests for ${table.name}
 * Generated: ${new Date().toISOString()}
 */

const request = require('supertest');
const app = require('../server');

describe('${table.name} API Tests', () => {
  let authToken;
  let testRecordId;
  
  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    authToken = loginResponse.body.access_token;
  });
  
  test('GET /${routeName} - should return list', async () => {
    const response = await request(app)
      .get('/api/${routeName}')
      .set('Authorization', \`Bearer \${authToken}\`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
  
  test('POST /${routeName} - should create record', async () => {
    const newRecord = {
      // Add test data based on table schema
    };
    
    const response = await request(app)
      .post('/api/${routeName}')
      .set('Authorization', \`Bearer \${authToken}\`)
      .send(newRecord);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    testRecordId = response.body.data.id;
  });
  
  test('GET /${routeName}/:id - should return single record', async () => {
    const response = await request(app)
      .get(\`/api/${routeName}/\${testRecordId}\`)
      .set('Authorization', \`Bearer \${authToken}\`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testRecordId);
  });
  
  test('PUT /${routeName}/:id - should update record', async () => {
    const updateData = {
      // Add update data
    };
    
    const response = await request(app)
      .put(\`/api/${routeName}/\${testRecordId}\`)
      .set('Authorization', \`Bearer \${authToken}\`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  test('DELETE /${routeName}/:id - should delete record', async () => {
    const response = await request(app)
      .delete(\`/api/${routeName}/\${testRecordId}\`)
      .set('Authorization', \`Bearer \${authToken}\`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
`;
}

// Main execution
async function main() {
  console.log('🚀 Starting Comprehensive API Generation...\n');
  
  const csvPath = 'C:\\Users\\JITENDRA\\Downloads\\Supabase Snippet SQL Query (9).csv';
  const outputDir = path.join(__dirname, 'routes', 'generated');
  const testDir = path.join(__dirname, 'tests', 'generated');
  
  // Create directories
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Parse schema
  const tables = await parseSchema(csvPath);
  console.log(`📊 Found ${tables.length} tables\n`);
  
  // Filter tables to generate APIs for
  const targetTables = tables.filter(t => {
    const category = categorizeTable(t.name);
    return ['ai', 'business', 'crm'].includes(category);
  });
  
  console.log(`✅ Generating APIs for ${targetTables.length} tables:\n`);
  
  const manifest = {
    generated: new Date().toISOString(),
    tables: []
  };
  
  // Generate route files
  for (const table of targetTables) {
    const category = categorizeTable(table.name);
    const routeCode = generateRouteFile(table);
    const testCode = generateTestFile(table);
    
    const routeFile = path.join(outputDir, `${table.name}.routes.js`);
    const testFile = path.join(testDir, `${table.name}.test.js`);
    
    fs.writeFileSync(routeFile, routeCode);
    fs.writeFileSync(testFile, testCode);
    
    manifest.tables.push({
      name: table.name,
      category,
      routeFile,
      testFile,
      endpoints: table.columns.some(c => c.name === 'id') ? 5 : 2
    });
    
    console.log(`  ✓ ${table.name} (${category})`);
  }
  
  // Generate master route index
  const indexCode = `/**
 * Auto-generated Route Index
 * Generated: ${new Date().toISOString()}
 */

const express = require('express');
const router = express.Router();

${manifest.tables.map(t => `const ${t.name}Routes = require('./generated/${t.name}.routes');`).join('\n')}

// Mount routes
${manifest.tables.map(t => `router.use('/', ${t.name}Routes);`).join('\n')}

module.exports = router;
`;
  
  fs.writeFileSync(path.join(__dirname, 'routes', 'api-index.js'), indexCode);
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  console.log(`\n✅ Generation Complete!`);
  console.log(`   📁 Routes: ${outputDir}`);
  console.log(`   🧪 Tests: ${testDir}`);
  console.log(`   📄 Manifest: ${path.join(outputDir, 'manifest.json')}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - ${manifest.tables.length} route files generated`);
  console.log(`   - ${manifest.tables.reduce((sum, t) => sum + t.endpoints, 0)} total endpoints`);
  console.log(`   - ${manifest.tables.length} test files generated`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { parseSchema, generateRouteFile, generateTestFile };
