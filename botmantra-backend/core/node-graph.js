/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NODE GRAPH VISUALIZER — Neural OS Kernel                   ║
 * ║  Expose Node Relationships as Traversable Graph Data        ║
 * ║  Every node is a vertex. Every relationship is an edge.     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Graph Model:
 *   Vertices = Nodes from node_core
 *   Edges    = parent→child, permission links, brand membership
 *
 * Capabilities:
 *   1. Build full graph for a brand
 *   2. Build family tree subgraph for Vanshawali
 *   3. Compute BFS/DFS traversals
 *   4. Find shortest path between two nodes
 *   5. Detect clusters/communities
 *   6. Export in formats: D3, Mermaid, Cytoscape, adjacency list
 *   7. Graph stats: depth, breadth, density, connected components
 *
 * Tables used:
 *   node_core         — nid_hash, parent_nid_hash, node_depth, node_type,
 *                        owner_id, dna_blob, field_map
 *   node_permission   — cross-node permission links
 *   node_event_queue  — for graph change events
 *
 * Relationship resolution:
 *   Children: SELECT FROM node_core WHERE parent_nid_hash = X
 *   Parents:  SELECT parent_nid_hash FROM node_core WHERE nid_hash = X
 *   Perms:    SELECT FROM node_permission WHERE src/target = X
 */

const { decodeFromBlob } = require('./node-schema');

// ─── EDGE TYPES ──────────────────────────────────────────────
const EDGE_TYPES = {
  PARENT_CHILD:   { label: 'parent→child',    color: '#4CAF50', weight: 10 },
  CHILD_PARENT:   { label: 'child→parent',    color: '#8BC34A', weight: 10 },
  PERMISSION:     { label: 'permission',       color: '#2196F3', weight: 5 },
  BRAND_MEMBER:   { label: 'brand_member',     color: '#FF9800', weight: 3 },
  SIBLING:        { label: 'sibling',          color: '#9C27B0', weight: 7 },
  RELATIONSHIP:   { label: 'relationship',     color: '#E91E63', weight: 6 }
};

// ─── VERTEX STYLES (by node type) ────────────────────────────
const VERTEX_STYLES = {
  brand_root:      { shape: 'diamond',  color: '#FFD700', size: 40 },
  user_node:       { shape: 'circle',   color: '#4CAF50', size: 25 },
  nonliving_node:  { shape: 'square',   color: '#2196F3', size: 20 },
  dashboard_layout:{ shape: 'square',   color: '#9C27B0', size: 15 },
  widget:          { shape: 'triangle', color: '#FF9800', size: 12 },
  permission_rule: { shape: 'hexagon',  color: '#F44336', size: 15 },
  role_node:       { shape: 'star',     color: '#E91E63', size: 18 },
  data_template:   { shape: 'square',   color: '#607D8B', size: 15 },
  relationship_rule:{ shape: 'octagon', color: '#795548', size: 15 },
  theme_config:    { shape: 'diamond',  color: '#00BCD4', size: 12 },
  default:         { shape: 'circle',   color: '#9E9E9E', size: 15 }
};

class NodeGraph {
  constructor(supabaseClient, nodeFactory) {
    this.db = supabaseClient;
    this.nodeFactory = nodeFactory;
  }

  // ═══════════════════════════════════════════════════════════
  // BUILD FULL GRAPH — all nodes + edges for a scope
  // ═══════════════════════════════════════════════════════════
  async buildGraph(options = {}) {
    const {
      brand = null,         // Filter by brand (from dna_blob)
      owner_id = null,      // Filter by owner
      root_nid_hash = null, // Start from specific root
      max_depth = 10,       // Max tree depth
      include_permissions = true,
      limit = 500
    } = options;

    // Fetch nodes using NodeFactory
    const queryParams = {
      node_state: 'ACTIVE',
      max_depth: max_depth
    };

    if (owner_id) queryParams.owner_id = owner_id;
    if (root_nid_hash) {
      // For root filtering, we need to get nodes that are either the root or its descendants
      queryParams.parent_nid_hash = root_nid_hash; // This will get direct children
      // We'll also need to get the root node itself
    }

    const nodes = await this.nodeFactory.queryNodes(queryParams);

    // If root_nid_hash specified, also get the root node
    let rootNode = null;
    if (root_nid_hash) {
      rootNode = await this.nodeFactory.queryNodes({ nid_hash: root_nid_hash });
      if (rootNode && rootNode.length > 0) {
        nodes.unshift(rootNode[0]); // Add root at beginning
      }
    }

    if (!nodes || nodes.length === 0) return { vertices: [], edges: [], stats: {} };

    // Build vertices
    const vertices = [];
    const vertexMap = new Map(); // nid_hash → index

    for (const node of nodes) {
      const dna = decodeFromBlob(node.dna_blob) || {};
      const fieldMap = decodeFromBlob(node.field_map) || {};

      // Brand filter (if requested)
      if (brand && dna.brand_scope && dna.brand_scope !== brand) continue;

      const nodeType = dna.node_type || node.node_type || 'default';
      const style = VERTEX_STYLES[nodeType] || VERTEX_STYLES.default;

      const vertex = {
        id: node.nid_hash,
        label: fieldMap.name || fieldMap.title || fieldMap.email || `Node_${node.nid_hash.slice(0, 8)}`,
        type: nodeType,
        depth: node.node_depth || 0,
        owner_id: node.owner_id,
        brand: dna.brand_scope || 'BOTMANTRA',
        state: node.node_state,
        karma: node.karma_score || 0,
        trust: node.trust_score || 50,
        style,
        metadata: {
          role: dna.role || fieldMap.role,
          subtype: dna.subtype,
          created: node.created_at
        }
      };

      vertexMap.set(node.nid_hash, vertices.length);
      vertices.push(vertex);
    }

    // Build edges from parent→child relationships
    const edges = [];
    for (const node of nodes) {
      if (!node.parent_nid_hash) continue;
      if (!vertexMap.has(node.nid_hash) || !vertexMap.has(node.parent_nid_hash)) continue;

      edges.push({
        source: node.parent_nid_hash,
        target: node.nid_hash,
        type: 'PARENT_CHILD',
        style: EDGE_TYPES.PARENT_CHILD
      });
    }

    // Add permission edges
    if (include_permissions) {
      const nidHashes = vertices.map(v => v.id);
      const permEdges = await this._fetchPermissionEdges(nidHashes);
      edges.push(...permEdges);
    }

    // Detect siblings (same parent)
    const siblingGroups = {};
    for (const node of nodes) {
      if (!node.parent_nid_hash) continue;
      if (!siblingGroups[node.parent_nid_hash]) siblingGroups[node.parent_nid_hash] = [];
      siblingGroups[node.parent_nid_hash].push(node.nid_hash);
    }
    for (const siblings of Object.values(siblingGroups)) {
      if (siblings.length < 2) continue;
      for (let i = 0; i < siblings.length - 1; i++) {
        if (vertexMap.has(siblings[i]) && vertexMap.has(siblings[i + 1])) {
          edges.push({
            source: siblings[i],
            target: siblings[i + 1],
            type: 'SIBLING',
            style: EDGE_TYPES.SIBLING
          });
        }
      }
    }

    // Compute stats
    const stats = this._computeGraphStats(vertices, edges);

    return { vertices, edges, stats, built_at: new Date().toISOString() };
  }

  // ═══════════════════════════════════════════════════════════
  // SUBTREE — Get tree rooted at a specific node
  // ═══════════════════════════════════════════════════════════
  async getSubtree(rootNidHash, maxDepth = 5) {
    // BFS traversal from root
    const visited = new Set();
    const queue = [{ nid_hash: rootNidHash, depth: 0 }];
    const vertices = [];
    const edges = [];

    while (queue.length > 0) {
      const { nid_hash, depth } = queue.shift();
      if (visited.has(nid_hash) || depth > maxDepth) continue;
      visited.add(nid_hash);

      // Load node using NodeFactory
      const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: nid_hash });
      const node = nodeQuery && nodeQuery.length > 0 ? nodeQuery[0] : null;

      if (!node) continue;

      const dna = decodeFromBlob(node.dna_blob) || {};
      const fm = decodeFromBlob(node.field_map) || {};
      const nodeType = dna.node_type || node.node_type || 'default';

      vertices.push({
        id: node.nid_hash,
        label: fm.name || fm.title || `Node_${node.nid_hash.slice(0, 8)}`,
        type: nodeType,
        depth: depth,
        brand: dna.brand_scope || 'BOTMANTRA',
        karma: node.karma_score || 0,
        trust: node.trust_score || 50,
        style: VERTEX_STYLES[nodeType] || VERTEX_STYLES.default
      });

      if (node.parent_nid_hash && visited.has(node.parent_nid_hash)) {
        edges.push({
          source: node.parent_nid_hash,
          target: node.nid_hash,
          type: 'PARENT_CHILD',
          style: EDGE_TYPES.PARENT_CHILD
        });
      }

      // Fetch children using NodeFactory
      const children = await this.nodeFactory.queryNodes({
        parent_nid_hash: nid_hash,
        node_state: 'ACTIVE'
      });

      if (children) {
        for (const child of children) {
          if (!visited.has(child.nid_hash)) {
            queue.push({ nid_hash: child.nid_hash, depth: depth + 1 });
            edges.push({
              source: nid_hash,
              target: child.nid_hash,
              type: 'PARENT_CHILD',
              style: EDGE_TYPES.PARENT_CHILD
            });
          }
        }
      }
    }

    return {
      root: rootNidHash,
      vertices,
      edges,
      depth: Math.max(0, ...vertices.map(v => v.depth)),
      total_nodes: vertices.length
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SHORTEST PATH — BFS between two nodes
  // ═══════════════════════════════════════════════════════════
  async shortestPath(fromNidHash, toNidHash, maxSteps = 20) {
    const visited = new Map(); // nid → { prev, depth }
    const queue = [{ nid_hash: fromNidHash, depth: 0, prev: null }];
    visited.set(fromNidHash, { prev: null, depth: 0 });

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.nid_hash === toNidHash) {
        // Reconstruct path
        const path = [];
        let cursor = toNidHash;
        while (cursor) {
          path.unshift(cursor);
          cursor = visited.get(cursor)?.prev;
        }
        return {
          found: true,
          path,
          length: path.length - 1,
          hops: path.length - 1
        };
      }

      if (current.depth >= maxSteps) continue;

      // Get neighbors: parent + children using NodeFactory
      const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: current.nid_hash });
      const node = nodeQuery && nodeQuery.length > 0 ? nodeQuery[0] : null;

      const neighbors = [];

      // Parent
      if (node?.parent_nid_hash && !visited.has(node.parent_nid_hash)) {
        neighbors.push(node.parent_nid_hash);
      }

      // Children
      const children = await this.nodeFactory.queryNodes({
        parent_nid_hash: current.nid_hash
      });

      if (children) {
        for (const c of children) {
          if (!visited.has(c.nid_hash)) {
            neighbors.push(c.nid_hash);
          }
        }
      }

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, { prev: current.nid_hash, depth: current.depth + 1 });
          queue.push({ nid_hash: neighbor, depth: current.depth + 1, prev: current.nid_hash });
        }
      }
    }

    return { found: false, path: [], length: -1, reason: 'No path within max steps' };
  }

  // ═══════════════════════════════════════════════════════════
  // NODE NEIGHBORHOOD — immediate connections
  // ═══════════════════════════════════════════════════════════
  async getNeighborhood(nidHash, radius = 1) {
    const vertices = [];
    const edges = [];
    const visited = new Set();

    const explore = async (currentHash, depth) => {
      if (visited.has(currentHash) || depth > radius) return;
      visited.add(currentHash);

      const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: currentHash });
      const node = nodeQuery && nodeQuery.length > 0 ? nodeQuery[0] : null;

      if (!node) return;

      const dna = decodeFromBlob(node.dna_blob) || {};
      const fm = decodeFromBlob(node.field_map) || {};
      const nodeType = dna.node_type || node.node_type || 'default';

      vertices.push({
        id: node.nid_hash,
        label: fm.name || fm.title || `Node_${node.nid_hash.slice(0, 8)}`,
        type: nodeType,
        distance: depth,
        is_center: depth === 0,
        brand: dna.brand_scope || 'BOTMANTRA',
        style: VERTEX_STYLES[nodeType] || VERTEX_STYLES.default
      });

      // Parent
      if (node.parent_nid_hash && !visited.has(node.parent_nid_hash)) {
        edges.push({ source: node.parent_nid_hash, target: currentHash, type: 'PARENT_CHILD', style: EDGE_TYPES.PARENT_CHILD });
        await explore(node.parent_nid_hash, depth + 1);
      }

      // Children
      const children = await this.nodeFactory.queryNodes({
        parent_nid_hash: currentHash
      });

      if (children) {
        for (const c of children) {
          if (!visited.has(c.nid_hash)) {
            edges.push({ source: currentHash, target: c.nid_hash, type: 'PARENT_CHILD', style: EDGE_TYPES.PARENT_CHILD });
            await explore(c.nid_hash, depth + 1);
          }
        }
      }
    };

    await explore(nidHash, 0);

    return {
      center: nidHash,
      radius,
      vertices,
      edges,
      total_nodes: vertices.length
    };
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT — Convert graph to different formats
  // ═══════════════════════════════════════════════════════════
  exportToD3(graph) {
    return {
      nodes: graph.vertices.map(v => ({
        id: v.id,
        label: v.label,
        group: v.type,
        ...v.style
      })),
      links: graph.edges.map(e => ({
        source: e.source,
        target: e.target,
        type: e.type,
        color: e.style?.color
      }))
    };
  }

  exportToMermaid(graph) {
    const lines = ['graph TD'];
    const nodeIds = new Map();
    let counter = 0;

    for (const v of graph.vertices) {
      const shortId = `N${counter++}`;
      nodeIds.set(v.id, shortId);
      const label = v.label.replace(/["\[\](){}]/g, '');
      if (v.type === 'brand_root') {
        lines.push(`    ${shortId}{{"${label}"}}`);
      } else if (v.type === 'user_node') {
        lines.push(`    ${shortId}(("${label}"))`);
      } else {
        lines.push(`    ${shortId}["${label}"]`);
      }
    }

    for (const e of graph.edges) {
      const src = nodeIds.get(e.source);
      const tgt = nodeIds.get(e.target);
      if (src && tgt) {
        if (e.type === 'PARENT_CHILD') {
          lines.push(`    ${src} --> ${tgt}`);
        } else if (e.type === 'SIBLING') {
          lines.push(`    ${src} -.- ${tgt}`);
        } else {
          lines.push(`    ${src} -.-> ${tgt}`);
        }
      }
    }

    return lines.join('\n');
  }

  exportToCytoscape(graph) {
    const elements = [];
    for (const v of graph.vertices) {
      elements.push({
        data: { id: v.id, label: v.label, type: v.type, ...v.style },
        group: 'nodes'
      });
    }
    for (const e of graph.edges) {
      elements.push({
        data: { source: e.source, target: e.target, type: e.type, color: e.style?.color },
        group: 'edges'
      });
    }
    return elements;
  }

  exportToAdjacencyList(graph) {
    const adj = {};
    for (const v of graph.vertices) {
      adj[v.id] = { label: v.label, type: v.type, neighbors: [] };
    }
    for (const e of graph.edges) {
      if (adj[e.source]) adj[e.source].neighbors.push({ id: e.target, type: e.type });
      if (adj[e.target]) adj[e.target].neighbors.push({ id: e.source, type: e.type });
    }
    return adj;
  }

  // ═══════════════════════════════════════════════════════════
  // GRAPH STATS
  // ═══════════════════════════════════════════════════════════
  _computeGraphStats(vertices, edges) {
    const nodeCount = vertices.length;
    const edgeCount = edges.length;

    // Type distribution
    const typeDistribution = {};
    for (const v of vertices) {
      typeDistribution[v.type] = (typeDistribution[v.type] || 0) + 1;
    }

    // Brand distribution
    const brandDistribution = {};
    for (const v of vertices) {
      brandDistribution[v.brand] = (brandDistribution[v.brand] || 0) + 1;
    }

    // Depth distribution
    const depthDistribution = {};
    for (const v of vertices) {
      const d = v.depth || 0;
      depthDistribution[d] = (depthDistribution[d] || 0) + 1;
    }

    // Degree count
    const degree = {};
    for (const e of edges) {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
    }
    const degrees = Object.values(degree);
    const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;
    const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;

    // Density = 2E / (V * (V-1))
    const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;

    return {
      total_vertices: nodeCount,
      total_edges: edgeCount,
      max_depth: Math.max(0, ...vertices.map(v => v.depth || 0)),
      density: Math.round(density * 10000) / 10000,
      avg_degree: Math.round(avgDegree * 100) / 100,
      max_degree: maxDegree,
      type_distribution: typeDistribution,
      brand_distribution: brandDistribution,
      depth_distribution: depthDistribution
    };
  }

  async _fetchPermissionEdges(nidHashes) {
    const edges = [];
    if (nidHashes.length === 0) return edges;

    // Try node_permission table
    try {
      const hashSet = new Set(nidHashes);
      const { data } = await this.db
        .from('node_permission')
        .select('*')
        .in('nid_hash', nidHashes.slice(0, 100)); // Limit for performance

      if (data) {
        for (const perm of data) {
          if (perm.target_nid_hash && hashSet.has(perm.target_nid_hash)) {
            edges.push({
              source: perm.nid_hash,
              target: perm.target_nid_hash,
              type: 'PERMISSION',
              style: EDGE_TYPES.PERMISSION,
              metadata: { permission: perm.permission_type }
            });
          }
        }
      }
    } catch { /* node_permission may not have target_nid_hash */ }

    return edges;
  }
}

module.exports = {
  NodeGraph,
  EDGE_TYPES,
  VERTEX_STYLES
};
