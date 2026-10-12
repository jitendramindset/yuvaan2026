'use strict';

const assert = require('assert');
const { createFamilyMember } = require('./family-member-service');

function factoryFor(nodes, createdNode) {
  return {
    queryNodes: async () => ({ success: true, nodes }),
    createFamilyMember: async (userId, data) => ({
      success: true,
      node: {
        nid_hash: 'child-hash',
        owner_id: userId,
        parent_nid_hash: data.parent_nid_hash,
        node_depth: 1,
        node_type: 'living',
        node_state: 'ACTIVE',
        field_map: Buffer.from(JSON.stringify({ name: data.name, relation_type: data.relation_type })).toString('hex'),
        ...createdNode
      }
    })
  };
}

async function run() {
  const parent = { nid_hash: 'user-hash', owner_id: 'owner-1', node_type: 'user_node', node_state: 'ACTIVE', node_depth: 0 };

  let result = await createFamilyMember({ nodeFactory: factoryFor([parent]), userId: 'owner-1', input: { relationship: 'spouse', name: 'Sam' } });
  assert.strictEqual(result.status, 400);

  result = await createFamilyMember({ nodeFactory: factoryFor([parent]), userId: 'owner-1', input: { relationship: 'child' } });
  assert.strictEqual(result.status, 400);

  result = await createFamilyMember({ nodeFactory: factoryFor([]), userId: 'owner-1', input: { relationship: 'child', name: 'Sam' } });
  assert.strictEqual(result.status, 404);

  const duplicate = { ...parent, nid_hash: 'existing', field_map: Buffer.from(JSON.stringify({ name: 'Sam', relation_type: 'child' })).toString('hex'), parent_nid_hash: 'user-hash' };
  result = await createFamilyMember({ nodeFactory: factoryFor([parent, duplicate]), userId: 'owner-1', input: { relationship: 'child', name: 'Sam' } });
  assert.strictEqual(result.status, 409);

  let received;
  const factory = factoryFor([parent]);
  factory.createFamilyMember = async (userId, data) => {
    received = { userId, data };
    return { success: true, node: { nid_hash: 'new', owner_id: userId, parent_nid_hash: data.parent_nid_hash, node_depth: 1, node_type: 'living', node_state: 'ACTIVE', field_map: Buffer.from(JSON.stringify({ name: data.name, relation_type: data.relation_type })).toString('hex') } };
  };
  result = await createFamilyMember({ nodeFactory: factory, userId: 'owner-1', input: { relationship: 'child', name: 'Sam', owner_id: 'attacker', parent_nid_hash: 'attacker-parent' } });
  assert.strictEqual(result.status, 201);
  assert.deepStrictEqual(received, { userId: 'owner-1', data: { name: 'Sam', relation_type: 'child', parent_nid_hash: 'user-hash', age: undefined, profile_picture: undefined, city: undefined, gotra: undefined, village: undefined, gender: undefined, occupation: undefined, company: undefined } });
  assert.deepStrictEqual(result.body.data, { node_id: 'new', node_type: 'living', owner_id: 'owner-1', parent_node: 'user-hash', node_depth: 1, node_state: 'ACTIVE', metadata: { name: 'Sam', relation_type: 'child' } });

  console.log('FAMILY_MEMBER_SERVICE PASS');
}

run().catch(error => { console.error(error); process.exit(1); });
