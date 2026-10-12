'use strict';

const assert = require('assert');
const { safeNode, listNodes } = require('./admin-nodeos-service');

const blob = value => Buffer.from(JSON.stringify(value)).toString('hex');

async function run() {
  const node = safeNode({
    nid_hash: 'node-1', owner_id: 'owner-1', node_type: 'living', node_state: 'ACTIVE', node_depth: 2,
    parent_nid_hash: 'parent-1', created_at: 'now', updated_at: 'now',
    field_map: blob({ name: 'Member', relationship: 'child' }),
    dna_blob: blob({ node_type: 'user_node' }),
    perm_blob: blob({ can_read: true }),
    row_id: 99
  });
  assert.strictEqual(node.nid_hash, 'node-1');
  assert.strictEqual(node.metadata.name, 'Member');
  assert.strictEqual(node.permissions.can_read, true);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(node, 'row_id'), false);

  const rows = [
    { nid_hash: 'a', owner_id: 'owner', node_type: 'living', node_state: 'ACTIVE', node_depth: 0, parent_nid_hash: null, field_map: blob({ name: 'Alpha' }), dna_blob: blob({}), perm_blob: blob({}) },
    { nid_hash: 'b', owner_id: 'owner', node_type: 'nonliving', node_state: 'ACTIVE', node_depth: 0, parent_nid_hash: null, field_map: blob({ name: 'Beta' }), dna_blob: blob({}), perm_blob: blob({}) }
  ];
  const query = { select: () => query, order: () => query, limit: () => query, eq: () => query, then: resolve => resolve({ data: rows, error: null }) };
  const result = await listNodes({ from: () => query }, { search: 'alpha' });
  assert.deepStrictEqual(result.nodes.map(item => item.nid_hash), ['a']);
  console.log('ADMIN_NODEOS_SERVICE PASS');
}

run().catch(error => { console.error(error); process.exit(1); });
