'use strict';

const { decodeFromBlob } = require('../core/node-schema');
const { normalizeRelationship, HIERARCHICAL_RELATIONSHIPS } = require('./family-relationship-model');

function nodeMetadata(node) {
  return decodeFromBlob(node?.field_map) || {};
}

async function resolveCanonicalOwnerId(nodeFactory, supabaseClient, userId) {
  const direct = await nodeFactory.queryNodes({ owner_id: userId, node_state: 'ACTIVE' });
  if (direct?.nodes?.length) return userId;
  if (!supabaseClient) return userId;

  const userResult = await supabaseClient.from('users').select('mobile_hash').eq('id', userId).maybeSingle();
  const mobileHash = userResult.data?.mobile_hash;
  if (!mobileHash) return userId;

  const ownerResult = await supabaseClient.from('owner').select('id').eq('mobile_hash', mobileHash).limit(1);
  return ownerResult.data?.[0]?.id || userId;
}

async function resolveCanonicalUserNode(nodeFactory, supabaseClient, userId) {
  const ownerId = await resolveCanonicalOwnerId(nodeFactory, supabaseClient, userId);
  const result = await nodeFactory.queryNodes({ owner_id: ownerId, node_state: 'ACTIVE' });
  const nodes = result?.nodes || [];
  const node = nodes.find(candidate => candidate.node_type === 'living' || candidate.node_type === 'user_node' || candidate.node_type === 'user' || candidate.node_type === 'family_node');
  return node ? { node, ownerId } : null;
}

async function createFamilyMember({ nodeFactory, supabaseClient, userId, input }) {
  const relationship = normalizeRelationship(input.relationship || input.relation_type);
  if (relationship !== 'child') {
    return { status: 400, body: { success: false, error: 'Only child relationships are currently supported by the single parent_nid_hash hierarchy' } };
  }

  const name = String(input.name || '').trim();
  if (!name) return { status: 400, body: { success: false, error: 'Name is required' } };

  const canonical = await resolveCanonicalUserNode(nodeFactory, supabaseClient, userId);
  if (!canonical?.node?.nid_hash) return { status: 404, body: { success: false, error: 'Canonical user node not found' } };
  const parent = canonical.node;
  const ownerId = canonical.ownerId;

  const existingResult = await nodeFactory.queryNodes({ owner_id: ownerId, node_state: 'ACTIVE' });
  const duplicate = (existingResult?.nodes || []).find(node => {
    if (node.parent_nid_hash !== parent.nid_hash) return false;
    const metadata = nodeMetadata(node);
    return String(metadata.relationship || metadata.relation_type || '').toLowerCase() === relationship &&
      String(metadata.name || '').trim().toLowerCase() === name.toLowerCase();
  });
  if (duplicate) {
    return { status: 409, body: { success: false, error: 'Family relationship already exists', data: { node_id: duplicate.nid_hash } } };
  }

  const result = await nodeFactory.createFamilyMember(ownerId, {
    name,
    relation_type: relationship,
    parent_nid_hash: parent.nid_hash,
    age: input.age,
    profile_picture: input.profile_picture,
    city: input.city,
    gotra: input.gotra,
    village: input.village,
    gender: input.gender,
    occupation: input.occupation,
    company: input.company
  });
  if (!result?.success || !result.node) {
    return { status: 500, body: { success: false, error: 'Failed to create family member' } };
  }

  const node = result.node;
  const metadata = nodeMetadata(node);
  return {
    status: 201,
    body: {
      success: true,
      data: {
        node_id: node.nid_hash,
        node_type: node.node_type,
        owner_id: node.owner_id,
        parent_node: node.parent_nid_hash,
        node_depth: node.node_depth,
        node_state: node.node_state,
        metadata
      }
    }
  };
}

module.exports = {
  HIERARCHICAL_RELATIONSHIPS,
  normalizeRelationship,
  resolveCanonicalOwnerId,
  resolveCanonicalUserNode,
  createFamilyMember
};
