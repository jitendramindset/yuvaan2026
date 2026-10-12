/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  DATABASE VERIFICATION SCRIPT                                ║
 * ║  Queries node_core table to verify implementation            ║
 * ║  Run: node verify-database.js                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`),
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Query 1: Total node count
 */
async function query1_TotalNodeCount() {
  log.section('QUERY 1: Total node_core rows');
  
  try {
    const { data, error } = await supabase
      .from('node_core')
      .select('count', { count: 'exact' });

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    const count = data[0]?.count || 0;
    log.success(`Total node_core rows: ${count}`);
    
    if (count === 0) {
      log.warn('No nodes created yet - run signup test first');
    } else if (count < 5) {
      log.warn(`Only ${count} nodes - expected at least 5 for 1 user`);
    } else {
      log.success(`Database populated (${count} nodes)`);
    }
    
    return true;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Query 2: Nodes per user
 */
async function query2_NodesPerUser() {
  log.section('QUERY 2: Node count per user');
  
  try {
    const { data, error } = await supabase
      .from('node_core')
      .select('owner_id, count(*)')
      .group_by('owner_id');

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      log.warn('No users have nodes yet');
      return true;
    }

    log.success(`Found ${data?.length} users with nodes`);
    
    // This is a workaround since grouping might not work perfectly
    // Instead, fetch all and group manually
    const { data: allNodes } = await supabase
      .from('node_core')
      .select('owner_id')
      .limit(1000);

    if (allNodes) {
      const grouped = {};
      allNodes.forEach(node => {
        grouped[node.owner_id] = (grouped[node.owner_id] || 0) + 1;
      });

      Object.entries(grouped).forEach(([userId, count]) => {
        const userDisplay = userId.substring(0, 8) + '...';
        if (count === 5) {
          log.success(`  User ${userDisplay}: ${count} nodes (complete set)`);
        } else if (count >= 3) {
          log.warn(`  User ${userDisplay}: ${count} nodes (incomplete?)`);
        } else {
          log.info(`  User ${userDisplay}: ${count} nodes`);
        }
      });
    }
    
    return true;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Query 3: Node types summary
 */
async function query3_NodeTypesSummary() {
  log.section('QUERY 3: Node types distribution');
  
  try {
    const { data, error } = await supabase
      .from('node_core')
      .select('node_type');

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      log.warn('No nodes in database');
      return true;
    }

    const typeCounts = {};
    data.forEach(node => {
      typeCounts[node.node_type] = (typeCounts[node.node_type] || 0) + 1;
    });

    const expectedTypes = ['user', 'vector_memory', 'relationship_map', 'layout_schema', 'permission_set'];
    
    log.success('Node type distribution:');
    expectedTypes.forEach(type => {
      const count = typeCounts[type] || 0;
      if (count > 0) {
        log.success(`  ✓ ${type}: ${count}`);
      } else {
        log.warn(`  ✗ ${type}: ${count} (missing!)`);
      }
    });

    // Check for unexpected types
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (!expectedTypes.includes(type)) {
        log.info(`  ? ${type}: ${count} (custom/legacy)`);
      }
    });

    return true;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Query 4: Brand root distribution
 */
async function query4_BrandRootDistribution() {
  log.section('QUERY 4: Brand root assignment distribution');
  
  try {
    const { data, error } = await supabase
      .from('node_core')
      .select('brand_root, owner_id')
      .limit(1000);

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      log.warn('No nodes in database');
      return true;
    }

    // Get one brand per user
    const userBrands = {};
    data.forEach(node => {
      if (node.brand_root) {
        userBrands[node.owner_id] = node.brand_root;
      }
    });

    const brandCounts = {};
    Object.values(userBrands).forEach(brand => {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });

    log.success('Brand distribution across users:');
    const expectedBrands = ['junior_mantra', 'jeetmantra', 'mantravat', 'vanshawali'];
    expectedBrands.forEach(brand => {
      const count = brandCounts[brand] || 0;
      if (count > 0) {
        log.info(`  ${brand}: ${count} users`);
      }
    });

    // Check if the brands match expected ages
    log.info('\nBrand meaning:');
    log.info('  junior_mantra: Age < 10');
    log.info('  jeetmantra: Age 10-17');
    log.info('  mantravat: Age 18-65');
    log.info('  vanshawali: Age 65+ or default');

    return true;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Query 5: Sample node details
 */
async function query5_SampleNodeDetails() {
  log.section('QUERY 5: Sample node details');
  
  try {
    const { data, error } = await supabase
      .from('node_core')
      .select('row_id, owner_id, nid_hash, node_type, node_state, brand_root, karma_score, trust_score, created_at')
      .limit(10);

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      log.warn('No nodes in database');
      return true;
    }

    log.success(`Showing ${data.length} sample nodes:`);
    console.log('');

    data.forEach((node, i) => {
      console.log(`${colors.cyan}Node ${i + 1}:${colors.reset}`);
      console.log(`  row_id: ${node.row_id}`);
      console.log(`  owner_id: ${node.owner_id.substring(0, 8)}...`);
      console.log(`  nid_hash: ${node.nid_hash.substring(0, 16)}...`);
      console.log(`  node_type: ${node.node_type}`);
      console.log(`  node_state: ${node.node_state}`);
      console.log(`  brand_root: ${colors.green}${node.brand_root}${colors.reset}`);
      console.log(`  karma_score: ${node.karma_score}`);
      console.log(`  trust_score: ${node.trust_score}`);
      console.log(`  created_at: ${new Date(node.created_at).toLocaleString()}`);
      console.log('');
    });

    return true;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Query 6: Check blob fields
 */
async function query6_BlobFieldsCheck() {
  log.section('QUERY 6: Blob fields verification');
  
  try {
    const { data, error } = await supabase
      .from('node_core')
      .select('node_type, dna_blob, field_map, perm_blob, memory_blob')
      .limit(5);

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      log.warn('No nodes in database');
      return true;
    }

    log.success(`Checking blob fields in ${data.length} nodes:`);
    console.log('');

    const blobStats = {
      dna_blob: { present: 0, null: 0 },
      field_map: { present: 0, null: 0 },
      perm_blob: { present: 0, null: 0 },
      memory_blob: { present: 0, null: 0 }
    };

    data.forEach(node => {
      ['dna_blob', 'field_map', 'perm_blob', 'memory_blob'].forEach(field => {
        if (node[field]) {
          blobStats[field].present++;
        } else {
          blobStats[field].null++;
        }
      });
    });

    Object.entries(blobStats).forEach(([field, stats]) => {
      const percentage = Math.round((stats.present / (stats.present + stats.null)) * 100);
      console.log(`${colors.cyan}${field}:${colors.reset}`);
      console.log(`  Present: ${stats.present}/${data.length} (${percentage}%)`);
      console.log(`  Null: ${stats.null}/${data.length}`);
    });

    log.warn('\nNote: Empty blobs are expected for some node types');
    log.warn('(e.g., layout_schema node might not have dna_blob)');

    return true;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Query 7: Recent activity (recovery indicator)
 */
async function query7_RecentActivity() {
  log.section('QUERY 7: Recent node creation (recovery activity)');
  
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { data, error } = await supabase
      .from('node_core')
      .select('owner_id, node_type, created_at')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      log.info('No nodes created in last hour');
      return true;
    }

    log.success(`${data.length} nodes created in last hour`);
    
    // Group by owner
    const byOwner = {};
    data.forEach(node => {
      if (!byOwner[node.owner_id]) {
        byOwner[node.owner_id] = [];
      }
      byOwner[node.owner_id].push(node);
    });

    console.log('');
    Object.entries(byOwner).forEach(([owner, nodes]) => {
      const ownerDisplay = owner.substring(0, 8) + '...';
      const types = nodes.map(n => n.node_type).join(', ');
      const time = new Date(nodes[0].created_at).toLocaleTimeString();
      console.log(`${colors.cyan}${ownerDisplay}${colors.reset}: ${types} (${time})`);
    });

    log.info('\nTip: Multiple node creations for same user = recovery mechanism likely triggered');

    return true;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Query 8: Validation checks
 */
async function query8_ValidationChecks() {
  log.section('QUERY 8: Data integrity validation');
  
  try {
    const { data, error } = await supabase
      .from('node_core')
      .select('row_id, owner_id, nid_hash, node_state, brand_root')
      .limit(100);

    if (error) {
      log.error(`Database error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      log.warn('No nodes in database');
      return true;
    }

    let issues = 0;

    // Check 1: All have owner_id
    const noOwner = data.filter(n => !n.owner_id).length;
    if (noOwner > 0) {
      log.error(`${noOwner} nodes missing owner_id`);
      issues++;
    } else {
      log.success('All nodes have owner_id ✓');
    }

    // Check 2: All have nid_hash
    const noHash = data.filter(n => !n.nid_hash).length;
    if (noHash > 0) {
      log.error(`${noHash} nodes missing nid_hash`);
      issues++;
    } else {
      log.success('All nodes have nid_hash ✓');
    }

    // Check 3: All have node_state = ACTIVE
    const notActive = data.filter(n => n.node_state !== 'ACTIVE').length;
    if (notActive > 0) {
      log.warn(`${notActive} nodes not in ACTIVE state`);
    } else {
      log.success('All nodes have node_state = ACTIVE ✓');
    }

    // Check 4: All have brand_root
    const noBrand = data.filter(n => !n.brand_root).length;
    if (noBrand > 0) {
      log.error(`${noBrand} nodes missing brand_root`);
      issues++;
    } else {
      log.success('All nodes have brand_root ✓');
    }

    // Check 5: Unique nid_hash
    const hashes = data.map(n => n.nid_hash);
    const duplicates = hashes.length - new Set(hashes).size;
    if (duplicates > 0) {
      log.error(`${duplicates} duplicate nid_hash values`);
      issues++;
    } else {
      log.success('All nid_hash values are unique ✓');
    }

    console.log('');
    if (issues === 0) {
      log.success('All validation checks passed!');
    } else {
      log.error(`${issues} validation checks failed`);
    }

    return issues === 0;
  } catch (err) {
    log.error(`Query failed: ${err.message}`);
    return false;
  }
}

/**
 * Run all verification queries
 */
async function runAllQueries() {
  console.log(`
${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║         NODE_CORE DATABASE VERIFICATION                        ║
║         Checking schema and data integrity                     ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}
`);

  // Test connection
  try {
    const { data: testData, error: testError } = await supabase
      .from('node_core')
      .select('count', { count: 'exact' })
      .limit(1);

    if (testError) {
      log.error(`Cannot connect to database: ${testError.message}`);
      console.log(`
${colors.red}Make sure:
  1. SUPABASE_URL is set in .env
  2. SUPABASE_ANON_KEY is set in .env
  3. node_core table exists in database
  4. You have read permissions on node_core${colors.reset}
`);
      process.exit(1);
    }

    log.success('Database connection successful');
  } catch (err) {
    log.error(`Connection test failed: ${err.message}`);
    process.exit(1);
  }

  const queries = [
    { name: 'Total Node Count', fn: query1_TotalNodeCount },
    { name: 'Nodes Per User', fn: query2_NodesPerUser },
    { name: 'Node Types Summary', fn: query3_NodeTypesSummary },
    { name: 'Brand Distribution', fn: query4_BrandRootDistribution },
    { name: 'Sample Node Details', fn: query5_SampleNodeDetails },
    { name: 'Blob Fields Check', fn: query6_BlobFieldsCheck },
    { name: 'Recent Activity', fn: query7_RecentActivity },
    { name: 'Validation Checks', fn: query8_ValidationChecks }
  ];

  const results = [];

  for (const query of queries) {
    try {
      const passed = await query.fn();
      results.push({ name: query.name, passed });
    } catch (err) {
      log.error(`Query "${query.name}" threw error: ${err.message}`);
      results.push({ name: query.name, passed: false });
    }
  }

  // Summary
  console.log(`\n${colors.bright}
╔════════════════════════════════════════════════════════════════╗
║                     SUMMARY                                    ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const passCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  results.forEach((result, i) => {
    const status = result.passed ? `${colors.green}✅` : `${colors.red}❌`;
    console.log(`${status}${colors.reset} ${i + 1}. ${result.name}`);
  });

  console.log(`
${colors.bright}Results: ${passCount}/${totalCount} queries successful${colors.reset}
${passCount === totalCount ? colors.green : colors.yellow}${passCount === totalCount ? '✅ DATABASE HEALTHY' : '⚠️  SOME CHECKS FAILED'}${colors.reset}
`);

  process.exit(passCount === totalCount ? 0 : 1);
}

// Start verification
runAllQueries().catch(err => {
  log.error(`Verification failed: ${err.message}`);
  process.exit(1);
});
