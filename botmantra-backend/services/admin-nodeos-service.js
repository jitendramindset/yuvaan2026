'use strict';

const { decodeFromBlob } = require('../core/node-schema');

function safeDecode(value) {
  return decodeFromBlob(value) || {};
}

function safeNode(node) {
  return {
    nid_hash: node.nid_hash,
    owner_id: node.owner_id,
    node_type: node.node_type,
    node_state: node.node_state,
    node_depth: node.node_depth,
    parent_nid_hash: node.parent_nid_hash || null,
    created_at: node.created_at,
    updated_at: node.updated_at,
    metadata: safeDecode(node.field_map),
    dna: safeDecode(node.dna_blob),
    permissions: safeDecode(node.perm_blob)
  };
}

async function listNodes(supabaseClient, { search = '', type = '', state = 'ACTIVE', limit = 100 } = {}) {
  let query = supabaseClient.from('node_core').select('nid_hash,owner_id,node_type,node_state,node_depth,parent_nid_hash,created_at,updated_at,field_map,dna_blob,perm_blob').order('created_at', { ascending: false }).limit(Math.min(Number(limit) || 100, 200));
  if (state) query = query.eq('node_state', state);
  if (type) query = query.eq('node_type', type);
  const result = await query;
  if (result.error) throw result.error;
  const normalizedSearch = String(search).trim().toLowerCase();
  const nodes = (result.data || []).map(safeNode).filter(node => {
    if (!normalizedSearch) return true;
    return [node.nid_hash, node.owner_id, node.node_type, node.metadata?.name, node.metadata?.full_name, node.metadata?.email]
      .some(value => String(value || '').toLowerCase().includes(normalizedSearch));
  });
  return { nodes, count: nodes.length };
}

async function getNode(supabaseClient, nidHash) {
  const result = await supabaseClient.from('node_core').select('nid_hash,owner_id,node_type,node_state,node_depth,parent_nid_hash,created_at,updated_at,field_map,dna_blob,perm_blob').eq('nid_hash', nidHash).single();
  if (result.error || !result.data) return null;
  return safeNode(result.data);
}

module.exports = { listNodes, getNode, safeNode };
