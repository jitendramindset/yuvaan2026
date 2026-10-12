/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NEURAL OS ADVANCED API — Layout Evolution, Graph, Gossip   ║
 * ║  Mount: /api/neural/v2                                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Systems:
 *   B) /evolution/*   — Autonomous Layout Evolution
 *   C) /graph/*       — Node Graph Visualizer
 *   D) /gossip/*      — Distributed Node Gossip Network
 */

const express = require('express');
const router = express.Router();

module.exports = function setupAdvancedRoutes(app, supabaseClient, io) {
  const { LayoutEvolution } = require('../core/layout-evolution');
  const { NodeGraph } = require('../core/node-graph');
  const { GossipNetwork } = require('../core/gossip-network');
  const NodeFactory = require('../core/nodeFactory');

  const nodeFactory = new NodeFactory(supabaseClient);
  const layoutEvolution = new LayoutEvolution(supabaseClient);
  const nodeGraph = new NodeGraph(supabaseClient, nodeFactory);
  const gossipNetwork = new GossipNetwork(supabaseClient, io);

  // Start gossip protocol
  gossipNetwork.start();

  // Store on app for kernel access
  app.set('layoutEvolution', layoutEvolution);
  app.set('nodeGraph', nodeGraph);
  app.set('gossipNetwork', gossipNetwork);

    // ═══════════════════════════════════════════════════════════
    // CACHE MANAGEMENT ENDPOINTS
    // ═══════════════════════════════════════════════════════════
    /** GET /api/neural/v2/cache/stats — Cache statistics */
    router.get('/cache/stats', (req, res) => {
      try {
        // NodeCache is attached to app by kernel-executor
        const kernel = app.get('kernelExecutor');
        const nodeCache = kernel && kernel.nodeCache ? kernel.nodeCache : app.get('nodeCache');
        if (!nodeCache) return res.status(404).json({ error: 'NodeCache not available' });
        res.json(nodeCache.getStats());
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    /** POST /api/neural/v2/cache/clear — Clear all cache tiers */
    router.post('/cache/clear', (req, res) => {
      try {
        const kernel = app.get('kernelExecutor');
        const nodeCache = kernel && kernel.nodeCache ? kernel.nodeCache : app.get('nodeCache');
        if (!nodeCache) return res.status(404).json({ error: 'NodeCache not available' });
        nodeCache.clearAll();
        res.json({ cleared: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    /** POST /api/neural/v2/cache/warmup — Warm up cache from DB */
    router.post('/cache/warmup', async (req, res) => {
      try {
        const kernel = app.get('kernelExecutor');
        const nodeCache = kernel && kernel.nodeCache ? kernel.nodeCache : app.get('nodeCache');
        if (!nodeCache) return res.status(404).json({ error: 'NodeCache not available' });
        await nodeCache.warmupAll();
        res.json({ warmed_up: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

  // ═══════════════════════════════════════════════════════════
  // B) LAYOUT EVOLUTION ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** POST /api/neural/v2/evolution/track — Record widget interaction */
  router.post('/evolution/track', (req, res) => {
    try {
      const { user_id, widget_id, interaction, metadata } = req.body;
      if (!user_id || !widget_id || !interaction) {
        return res.status(400).json({ error: 'user_id, widget_id, and interaction required' });
      }
      const result = layoutEvolution.trackInteraction(user_id, widget_id, interaction, metadata);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/evolution/track-batch — Record multiple interactions */
  router.post('/evolution/track-batch', (req, res) => {
    try {
      const { user_id, interactions } = req.body;
      if (!user_id || !Array.isArray(interactions)) {
        return res.status(400).json({ error: 'user_id and interactions[] required' });
      }
      const results = interactions.map(i =>
        layoutEvolution.trackInteraction(user_id, i.widget_id, i.interaction, i.metadata)
      );
      res.json({ tracked: results.filter(r => r.tracked).length, total: interactions.length, results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/evolution/analyze/:userId — Usage heatmap */
  router.get('/evolution/analyze/:userId', (req, res) => {
    try {
      const result = layoutEvolution.analyzeUsage(req.params.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/evolution/propose/:userId — Generate mutations */
  router.get('/evolution/propose/:userId', (req, res) => {
    try {
      const result = layoutEvolution.propose(req.params.userId);
      // Store proposals in evolution state for later mutation
      if (result.proposals.length > 0) {
        if (!layoutEvolution._evolutionState.has(req.params.userId)) {
          layoutEvolution._evolutionState.set(req.params.userId, {});
        }
        layoutEvolution._evolutionState.get(req.params.userId).proposals = result.proposals;
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/evolution/mutate — Apply a proposal */
  router.post('/evolution/mutate', async (req, res) => {
    try {
      const { user_id, proposal_id, brand, force } = req.body;
      if (!user_id || !proposal_id) {
        return res.status(400).json({ error: 'user_id and proposal_id required' });
      }
      const result = await layoutEvolution.mutate(user_id, proposal_id, brand, force);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/evolution/auto-evolve — Full auto cycle */
  router.post('/evolution/auto-evolve', async (req, res) => {
    try {
      const { user_id, brand } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const result = await layoutEvolution.autoEvolve(user_id, brand);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/evolution/brand/:brand — Brand-wide analytics */
  router.get('/evolution/brand/:brand', (req, res) => {
    try {
      const result = layoutEvolution.analyzeBrandUsage(req.params.brand);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/evolution/state/:userId — Evolution history for user */
  router.get('/evolution/state/:userId', (req, res) => {
    try {
      res.json(layoutEvolution.getEvolutionState(req.params.userId));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/evolution/schema — Interaction types, mutation types, config */
  router.get('/evolution/schema', (req, res) => {
    const { INTERACTION_TYPES, MUTATION_TYPES, GRID_ZONES, EVOLUTION_CONFIG } = require('../core/layout-evolution');
    res.json({ interaction_types: INTERACTION_TYPES, mutation_types: MUTATION_TYPES, grid_zones: GRID_ZONES, config: EVOLUTION_CONFIG });
  });

  // ═══════════════════════════════════════════════════════════
  // C) NODE GRAPH VISUALIZER ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** POST /api/neural/v2/graph/build — Build full graph */
  router.post('/graph/build', async (req, res) => {
    try {
      const { brand, owner_id, root_nid_hash, max_depth, include_permissions, limit } = req.body;
      const graph = await nodeGraph.buildGraph({
        brand, owner_id, root_nid_hash, max_depth, include_permissions, limit
      });
      res.json({ success: true, graph });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/graph/subtree/:nidHash — Get subtree */
  router.get('/graph/subtree/:nidHash', async (req, res) => {
    try {
      const maxDepth = parseInt(req.query.max_depth) || 5;
      const tree = await nodeGraph.getSubtree(req.params.nidHash, maxDepth);
      res.json({ success: true, tree });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/graph/neighborhood/:nidHash — Immediate connections */
  router.get('/graph/neighborhood/:nidHash', async (req, res) => {
    try {
      const radius = parseInt(req.query.radius) || 1;
      const neighborhood = await nodeGraph.getNeighborhood(req.params.nidHash, radius);
      res.json({ success: true, neighborhood });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/graph/path — Shortest path between two nodes */
  router.post('/graph/path', async (req, res) => {
    try {
      const { from, to, max_steps } = req.body;
      if (!from || !to) return res.status(400).json({ error: 'from and to nid_hashes required' });
      const path = await nodeGraph.shortestPath(from, to, max_steps);
      res.json({ success: true, path });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/graph/export — Export graph in format */
  router.post('/graph/export', async (req, res) => {
    try {
      const { format, brand, owner_id, max_depth, limit } = req.body;
      const graph = await nodeGraph.buildGraph({ brand, owner_id, max_depth, limit });

      let exported;
      switch (format) {
        case 'mermaid':    exported = nodeGraph.exportToMermaid(graph); break;
        case 'cytoscape':  exported = nodeGraph.exportToCytoscape(graph); break;
        case 'adjacency':  exported = nodeGraph.exportToAdjacencyList(graph); break;
        case 'd3':
        default:           exported = nodeGraph.exportToD3(graph); break;
      }

      res.json({ success: true, format: format || 'd3', data: exported, stats: graph.stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/graph/schema — Edge types, vertex styles */
  router.get('/graph/schema', (req, res) => {
    const { EDGE_TYPES, VERTEX_STYLES } = require('../core/node-graph');
    res.json({ edge_types: EDGE_TYPES, vertex_styles: VERTEX_STYLES });
  });

  // ═══════════════════════════════════════════════════════════
  // D) GOSSIP NETWORK ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** POST /api/neural/v2/gossip/register — Join gossip network */
  router.post('/gossip/register', async (req, res) => {
    try {
      const { nid_hash, brand } = req.body;
      if (!nid_hash) return res.status(400).json({ error: 'nid_hash required' });
      const result = await gossipNetwork.registerNode(nid_hash, brand);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/gossip/push — Push gossip digest */
  router.post('/gossip/push', async (req, res) => {
    try {
      const { nid_hash } = req.body;
      if (!nid_hash) return res.status(400).json({ error: 'nid_hash required' });
      const result = await gossipNetwork.pushGossip(nid_hash);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/gossip/pull — Pull sync from freshest neighbor */
  router.post('/gossip/pull', async (req, res) => {
    try {
      const { nid_hash } = req.body;
      if (!nid_hash) return res.status(400).json({ error: 'nid_hash required' });
      const result = await gossipNetwork.pullSync(nid_hash);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/gossip/broadcast — Epidemic broadcast */
  router.post('/gossip/broadcast', async (req, res) => {
    try {
      const { brand, message_type, payload, ttl } = req.body;
      if (!brand || !message_type) {
        return res.status(400).json({ error: 'brand and message_type required' });
      }
      const result = await gossipNetwork.epidemicBroadcast(brand, message_type, payload, ttl);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/gossip/detect-conflict — Compare two nodes */
  router.post('/gossip/detect-conflict', (req, res) => {
    try {
      const { nid_hash_a, nid_hash_b } = req.body;
      if (!nid_hash_a || !nid_hash_b) {
        return res.status(400).json({ error: 'nid_hash_a and nid_hash_b required' });
      }
      const result = gossipNetwork.detectConflicts(nid_hash_a, nid_hash_b);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/neural/v2/gossip/resolve — Resolve conflict */
  router.post('/gossip/resolve', async (req, res) => {
    try {
      const { nid_hash_a, nid_hash_b, strategy } = req.body;
      if (!nid_hash_a || !nid_hash_b) {
        return res.status(400).json({ error: 'nid_hash_a and nid_hash_b required' });
      }
      const result = await gossipNetwork.resolveConflict(nid_hash_a, nid_hash_b, strategy);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/gossip/status — Full network membership */
  router.get('/gossip/status', (req, res) => {
    try {
      const status = gossipNetwork.getNetworkStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/gossip/log — Recent gossip events */
  router.get('/gossip/log', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      res.json({ events: gossipNetwork.getGossipLog(limit) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/neural/v2/gossip/schema — Message types, node states, config */
  router.get('/gossip/schema', (req, res) => {
    const { MESSAGE_TYPES, NODE_STATES, GOSSIP_CONFIG } = require('../core/gossip-network');
    res.json({ message_types: MESSAGE_TYPES, node_states: NODE_STATES, config: GOSSIP_CONFIG });
  });

  // ═══════════════════════════════════════════════════════════
  // HEALTH — Combined health for all 3 systems
  // ═══════════════════════════════════════════════════════════
  router.get('/health', (req, res) => {
    const gossipStatus = gossipNetwork.getNetworkStatus();
    res.json({
      neural_os: 'operational',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      systems: {
        layout_evolution: {
          status: 'active',
          users_tracked: layoutEvolution._interactions.size,
          evolution_states: layoutEvolution._evolutionState.size
        },
        node_graph: {
          status: 'active',
          export_formats: ['d3', 'mermaid', 'cytoscape', 'adjacency']
        },
        gossip_network: {
          status: 'active',
          total_members: gossipStatus.total_members,
          alive: gossipStatus.alive,
          suspect: gossipStatus.suspect,
          dead: gossipStatus.dead,
          gossip_log: gossipStatus.gossip_log_size
        }
      }
    });
  });

  // Mount
  app.use('/api/neural/v2', router);
  console.log('🧠 Neural OS Advanced API mounted at /api/neural/v2');
  console.log('   B) Layout Evolution — OBSERVE → ANALYZE → PROPOSE → MUTATE → DEPLOY');
  console.log('   C) Node Graph — build, subtree, neighborhood, path, export (D3/Mermaid/Cytoscape)');
  console.log('   D) Gossip Network — register, push, pull, broadcast, conflict detection');
};
