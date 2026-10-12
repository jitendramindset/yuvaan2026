'use strict';

const assert = require('assert');
const { projectFamilyLineage } = require('./family-graph-projection');
const {
  RELATIONSHIPS,
  normalizeRelationship,
  isSymmetricRelationship,
  relationshipReferences
} = require('./family-relationship-model');

function database(rows) {
  return {
    from: () => ({
      select: () => {
        const filters = [];
        const query = {
          eq: (key, value) => { filters.push([key, value]); return query; },
          then: resolve => resolve({
            data: rows.filter(row => filters.every(([key, value]) => row[key] === value)),
            error: null
          })
        };
        return query;
      }
    })
  };
}

async function run() {
  assert.strictEqual(normalizeRelationship('brother'), RELATIONSHIPS.SIBLING);
  assert.strictEqual(isSymmetricRelationship('spouse'), true);
  assert.deepStrictEqual(relationshipReferences({ metadata: { relationships: [{ node_id: 'spouse-1', relationship: 'spouse' }] } }), [{ node_id: 'spouse-1', relationship: 'spouse' }]);

  const rows = [
    { nid_hash: 'user-1', owner_id: 'owner-1', node_type: 'user_node', node_state: 'ACTIVE', node_depth: 1, parent_nid_hash: 'parent-1', field_map: { name: 'User', relationships: [{ node_id: 'spouse-1', relationship: 'spouse' }] } },
    { nid_hash: 'parent-1', owner_id: 'owner-2', node_type: 'user_node', node_state: 'ACTIVE', node_depth: 0, parent_nid_hash: null, field_map: { name: 'Parent' } },
    { nid_hash: 'sibling-1', owner_id: 'owner-3', node_type: 'user_node', node_state: 'ACTIVE', node_depth: 1, parent_nid_hash: 'parent-1', field_map: { name: 'Sibling' } },
    { nid_hash: 'child-1', owner_id: 'owner-4', node_type: 'user_node', node_state: 'ACTIVE', node_depth: 2, parent_nid_hash: 'user-1', field_map: { name: 'Child', relationship_type: 'child' } },
    { nid_hash: 'spouse-1', owner_id: 'owner-5', node_type: 'user_node', node_state: 'ACTIVE', node_depth: 0, parent_nid_hash: null, field_map: { name: 'Spouse' } }
  ];

  const result = await projectFamilyLineage(database(rows), { userId: 'owner-1' });
  assert.deepStrictEqual(result.parents.map(member => member.node_id), ['parent-1']);
  assert.deepStrictEqual(result.siblings.map(member => member.node_id), ['sibling-1']);
  assert.deepStrictEqual(result.spouse.map(member => member.node_id), ['spouse-1']);
  assert.deepStrictEqual(result.children.map(member => member.node_id), ['child-1']);
  assert.deepStrictEqual(result.descendants.map(member => member.node_id), ['child-1']);
  assert.strictEqual(result.children.some(member => member.node_id === 'spouse-1'), false);
  assert.strictEqual(result.children.some(member => member.node_id === 'sibling-1'), false);

  console.log('FAMILY_RELATIONSHIP_MODEL PASS');
}

run().catch(error => { console.error(error); process.exit(1); });
