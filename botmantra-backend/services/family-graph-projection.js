'use strict';

const { decodeFromBlob } = require('../core/node-schema');
const { relationshipFromNode, relationshipReferences } = require('./family-relationship-model');

function safeJsonParse(value) {
  if (!value) return {};
  if (Buffer.isBuffer(value)) {
    return decodeFromBlob(value.toString('utf8')) || {};
  }
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return decodeFromBlob(value) || {};
    }
  }
  return {};
}

function getNodeLabel(node) {
  const fieldMap = safeJsonParse(node?.field_map || node?.fieldMap || node?.metadata || {});
  const dna = safeJsonParse(node?.dna_blob || node?.dna || {});
  const directName = fieldMap.name || fieldMap.title || fieldMap.full_name || node?.node_name || dna.name || null;
  if (directName) return directName;
  return `Node_${String(node?.nid_hash || node?.node_id || '').slice(0, 8) || 'Unknown'}`;
}

function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function dedupeByKey(items, key) {
  const seen = new Set();
  return items.filter(item => {
    const id = item?.[key];
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function projectMember(node, rel, depth = null) {
  const metadata = safeJsonParse(node?.field_map || node?.metadata || {});
  return {
    node_id: node.nid_hash || node.node_id,
    name: getNodeLabel(node),
    rel,
    depth: depth ?? node.node_depth ?? null,
    city: metadata.city || '',
    gotra: metadata.gotra || '',
    village: metadata.village || '',
    validated: true
  };
}

async function fetchNodeCore(supabaseClient, filters = {}) {
  let query = supabaseClient.from('node_core').select('*');

  if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);
  if (filters.nid_hash) query = query.eq('nid_hash', filters.nid_hash);
  if (filters.parent_nid_hash) query = query.eq('parent_nid_hash', filters.parent_nid_hash);
  if (filters.node_type) query = query.eq('node_type', filters.node_type);
  if (filters.node_state) query = query.eq('node_state', filters.node_state);

  const { data, error } = await query;
  if (error) {
    return { success: false, error, nodes: [] };
  }

  return { success: true, nodes: data || [] };
}

async function projectFamilyLineage(supabaseClient, { userId, maxDepth = 6 } = {}) {
  if (!userId) {
    return {
      userId: null,
      family_id: null,
      familyName: null,
      gotra: null,
      generation: 0,
      ancestryLevel: 'Self',
      branch: null,
      parents: [],
      spouse: [],
      siblings: [],
      children: [],
      ancestors: [],
      descendants: [],
      extendedFamily: [],
      connectedAncestors: [],
      details: null
    };
  }

  const { success, nodes, error } = await fetchNodeCore(supabaseClient, { owner_id: userId, node_state: 'ACTIVE' });
  if (!success) {
    console.warn('family-graph-projection lineage error:', error?.message || error);
    return {
      userId,
      family_id: null,
      familyName: null,
      gotra: null,
      generation: 0,
      ancestryLevel: 'Self',
      branch: null,
      parents: [],
      spouse: [],
      siblings: [],
      children: [],
      ancestors: [],
      descendants: [],
      extendedFamily: [],
      connectedAncestors: [],
      details: null
    };
  }

  const rootNodes = nodes.filter(node => node.node_type === 'user_node' || node.node_type === 'user' || node.node_type === 'living');
  const rootNode = rootNodes[0] || nodes[0] || null;

  if (!rootNode) {
    return {
      userId,
      family_id: null,
      familyName: null,
      gotra: null,
      generation: 0,
      ancestryLevel: 'Self',
      branch: null,
      parents: [],
      spouse: [],
      siblings: [],
      children: [],
      ancestors: [],
      descendants: [],
      extendedFamily: [],
      connectedAncestors: [],
      details: null
    };
  }

  const children = await fetchNodeCore(supabaseClient, { parent_nid_hash: rootNode.nid_hash, node_state: 'ACTIVE' });
  const directChildren = children.success ? children.nodes : [];
  const ancestors = [];
  const parentNodes = [];
  let cursor = rootNode.parent_nid_hash;
  let depth = 0;

  while (cursor && depth < maxDepth) {
    const parentResult = await fetchNodeCore(supabaseClient, { nid_hash: cursor, node_state: 'ACTIVE' });
    const parentNode = parentResult.success && parentResult.nodes[0] ? parentResult.nodes[0] : null;
    if (!parentNode) break;
    parentNodes.push(parentNode);
    ancestors.push(projectMember(parentNode, 'ancestor', depth + 1));
    cursor = parentNode.parent_nid_hash;
    depth += 1;
  }

  const descendantNodes = [];
  const queue = directChildren.map(node => ({ node, depth: 1 }));
  const visited = new Set([rootNode.nid_hash]);
  while (queue.length > 0) {
    const { node, depth: childDepth } = queue.shift();
    if (!node?.nid_hash || visited.has(node.nid_hash) || childDepth > maxDepth) continue;
    visited.add(node.nid_hash);
    descendantNodes.push(node);

    const childResult = await fetchNodeCore(supabaseClient, {
      parent_nid_hash: node.nid_hash,
      node_state: 'ACTIVE'
    });
    if (childResult.success) {
      childResult.nodes.forEach(child => queue.push({ node: child, depth: childDepth + 1 }));
    }
  }

  const descendants = dedupeByKey(
    descendantNodes.map(child => ({
      node_id: child.nid_hash || child.node_id,
      name: getNodeLabel(child),
      rel: child.node_type === 'user_node' || child.node_type === 'user' ? 'child' : 'member',
      depth: child.node_depth ?? null,
      city: safeJsonParse(child.field_map || {}).city || '',
      gotra: safeJsonParse(child.field_map || {}).gotra || '',
      validated: true
    })),
    'node_id'
  );

  const metadata = safeJsonParse(rootNode.field_map || rootNode.metadata || {});
  const parent = parentNodes[0] || null;
  const siblingResult = parent
    ? await fetchNodeCore(supabaseClient, { parent_nid_hash: parent.nid_hash, node_state: 'ACTIVE' })
    : { success: true, nodes: [] };
  const siblings = siblingResult.success
    ? siblingResult.nodes.filter(node => node.nid_hash !== rootNode.nid_hash).map(node => projectMember(node, 'sibling'))
    : [];
  const childrenProjection = directChildren.map(child => projectMember(child, relationshipFromNode(child) || 'child', 1));
  const semanticRelations = relationshipReferences({ metadata });
  const semanticNodes = [];
  for (const reference of semanticRelations) {
    const relatedResult = await fetchNodeCore(supabaseClient, { nid_hash: reference.node_id, node_state: 'ACTIVE' });
    const related = relatedResult.success ? relatedResult.nodes[0] : null;
    if (related) semanticNodes.push(projectMember(related, reference.relationship));
  }
  const spouse = semanticNodes.filter(member => member.rel === 'spouse');
  const extendedFamily = semanticNodes.filter(member => !['spouse', 'sibling'].includes(member.rel));
  return {
    userId,
    family_id: rootNode.nid_hash || rootNode.node_id || null,
    familyName: metadata.family_name || metadata.familyName || rootNode.node_name || null,
    gotra: metadata.gotra || null,
    generation: 0,
    ancestryLevel: ancestors.length > 0 ? 'Ancestor' : 'Self',
    branch: metadata.branch || null,
    parents: parentNodes.map(node => projectMember(node, 'parent')),
    spouse,
    siblings,
    children: childrenProjection,
    ancestors,
    descendants,
    extendedFamily,
    connectedAncestors: ancestors,
    details: metadata
  };
}

async function projectFamilyTree(supabaseClient, { familyId, userId, maxDepth = 6 } = {}) {
  const targetUserId = userId || familyId || null;
  const lineage = await projectFamilyLineage(supabaseClient, { userId: targetUserId, maxDepth });

  if (!lineage || !lineage.family_id) {
    return {
      familyId: familyId || null,
      familyName: null,
      rootAncestor: null,
      originRegion: null,
      originState: null,
      gotra: null,
      metadata: {},
      totalMembers: 0,
      members: [],
      createdAt: null,
      updatedAt: null
    };
  }

  const rootNode = await fetchNodeCore(supabaseClient, { nid_hash: lineage.family_id, node_state: 'ACTIVE' });
  const root = rootNode.success && rootNode.nodes[0] ? rootNode.nodes[0] : null;
  const members = dedupeByKey([
    root ? { node_id: root.nid_hash || root.node_id, name: getNodeLabel(root), rel: 'self', city: safeJsonParse(root.field_map || {}).city || '', gotra: safeJsonParse(root.field_map || {}).gotra || '', village: safeJsonParse(root.field_map || {}).village || '', validated: true } : null,
    ...(lineage.ancestors || []),
    ...(lineage.parents || []),
    ...(lineage.spouse || []),
    ...(lineage.siblings || []),
    ...(lineage.children || []),
    ...(lineage.descendants || [])
  ].filter(Boolean), 'node_id');

  return {
    familyId: familyId || lineage.family_id,
    familyName: lineage.familyName,
    rootAncestor: lineage.ancestors[0]?.name || null,
    originRegion: null,
    originState: null,
    gotra: lineage.gotra,
    metadata: lineage.details || {},
    totalMembers: members.length,
    members,
    createdAt: root?.created_at || null,
    updatedAt: root?.updated_at || null
  };
}

module.exports = {
  fetchNodeCore,
  projectFamilyLineage,
  projectFamilyTree,
  safeJsonParse,
  getNodeLabel
};
