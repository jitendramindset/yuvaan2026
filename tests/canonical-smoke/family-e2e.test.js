const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { projectFamilyLineage, projectFamilyTree } = require('../../botmantra-backend/services/family-graph-projection');
require('dotenv').config({ path: '../../botmantra-backend/.env' });

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, body: { raw: body } });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log('FAMILY_E2E', 'FAIL');
    console.log('REASON', 'Supabase runtime credentials missing in botmantra-backend/.env');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { data: rows, error } = await supabase
      .from('node_core')
      .select('nid_hash,node_type,node_depth,parent_nid_hash,owner_id')
      .limit(100);

    if (error) {
      console.log('FAMILY_E2E', 'FAIL');
      console.log('NODE_CORE_ERROR', error.message);
      process.exit(1);
    }

    const testNode = (rows || []).find(r => r.node_type === 'living' || r.node_type === 'user_node') || (rows || [])[0];
    if (!testNode) {
      console.log('FAMILY_E2E', 'FAIL');
      console.log('REASON', 'No runtime node_core rows available');
      process.exit(1);
    }

    const lineage = await projectFamilyLineage(supabase, { userId: testNode.owner_id, maxDepth: 6 });
    const familyTree = await projectFamilyTree(supabase, { familyId: testNode.owner_id, userId: testNode.owner_id, maxDepth: 6 });
    const apiRes = await httpGet(`http://localhost:3000/api/vanshawali/user-lineage/${encodeURIComponent(testNode.owner_id)}`);

    const passed = Boolean(
      rows && rows.length > 0 &&
      lineage &&
      familyTree &&
      apiRes &&
      apiRes.status === 200
    );

    console.log('FAMILY_E2E', passed ? 'PASS' : 'FAIL');
    console.log('NODE_TYPE', testNode.node_type);
    console.log('NODE_DEPTH', testNode.node_depth);
    console.log('HAS_PARENT', !!testNode.parent_nid_hash);
    console.log('LINEAGE_SUCCESS', !!lineage);
    console.log('TREE_SUCCESS', !!familyTree);
    console.log('API_STATUS', apiRes.status);
    console.log('API_KEYS', Object.keys(apiRes.body || {}).join(','));
    console.log('TREE_MEMBERS', familyTree?.members?.length ?? 0);

    if (!passed) process.exit(1);
  } catch (err) {
    console.log('FAMILY_E2E', 'FAIL');
    console.log('ERROR', err && err.message ? err.message : String(err));
    process.exit(1);
  }
})();
