'use strict';

const RELATIONSHIPS = Object.freeze({
  PARENT: 'parent',
  CHILD: 'child',
  SPOUSE: 'spouse',
  SIBLING: 'sibling',
  GRANDPARENT: 'grandparent',
  GRANDCHILD: 'grandchild',
  GUARDIAN: 'guardian',
  UNCLE: 'uncle',
  AUNT: 'aunt',
  COUSIN: 'cousin'
});

const SYMMETRIC_RELATIONSHIPS = new Set([
  RELATIONSHIPS.SPOUSE,
  RELATIONSHIPS.SIBLING
]);

const HIERARCHICAL_RELATIONSHIPS = new Set([
  RELATIONSHIPS.PARENT,
  RELATIONSHIPS.CHILD,
  RELATIONSHIPS.GRANDPARENT,
  RELATIONSHIPS.GRANDCHILD
]);

const RELATIONSHIP_ALIASES = new Map([
  ['father', RELATIONSHIPS.PARENT],
  ['mother', RELATIONSHIPS.PARENT],
  ['son', RELATIONSHIPS.CHILD],
  ['daughter', RELATIONSHIPS.CHILD],
  ['brother', RELATIONSHIPS.SIBLING],
  ['sister', RELATIONSHIPS.SIBLING]
]);

function normalizeRelationship(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return RELATIONSHIP_ALIASES.get(normalized) || normalized;
}

function isSymmetricRelationship(value) {
  return SYMMETRIC_RELATIONSHIPS.has(normalizeRelationship(value));
}

function isHierarchicalRelationship(value) {
  return HIERARCHICAL_RELATIONSHIPS.has(normalizeRelationship(value));
}

function relationshipFromNode(node) {
  const metadata = node?.metadata && typeof node.metadata === 'object' ? node.metadata : {};
  return normalizeRelationship(
    metadata.relationship || metadata.relationship_type || metadata.relation_type || node?.relationship
  );
}

function relationshipReferences(node) {
  const metadata = node?.metadata && typeof node.metadata === 'object' ? node.metadata : {};
  const references = Array.isArray(metadata.relationships) ? metadata.relationships : [];
  return references
    .filter(reference => reference && (reference.node_id || reference.nid_hash || reference.nodeId))
    .map(reference => ({
      node_id: reference.node_id || reference.nid_hash || reference.nodeId,
      relationship: normalizeRelationship(reference.relationship || reference.relationship_type || reference.relation)
    }));
}

module.exports = {
  RELATIONSHIPS,
  SYMMETRIC_RELATIONSHIPS,
  HIERARCHICAL_RELATIONSHIPS,
  normalizeRelationship,
  isSymmetricRelationship,
  isHierarchicalRelationship,
  relationshipFromNode,
  relationshipReferences
};
