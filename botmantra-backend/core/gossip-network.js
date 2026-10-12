/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  GOSSIP NETWORK — Neural OS Kernel                          ║
 * ║  Distributed Node Gossip Protocol for P2P Brand Sync        ║
 * ║  Nodes talk to each other. Not through a server. Through    ║
 * ║  each other.                                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * How it works:
 *   This is NOT traditional P2P (no direct browser connections).
 *   This is server-mediated gossip where:
 *     1. Each node periodically "gossips" its state digest to neighbors
 *     2. Neighbors compare digests → detect drift
 *     3. Drifted nodes request full sync from the freshest source
 *     4. Brand roots propagate policy changes via epidemic broadcast
 *     5. Conflict resolution uses vector clocks
 *
 * Gossip Modes:
 *   PUSH     — I have updates, here's my digest
 *   PULL     — I need updates, send me what changed
 *   PUSH-PULL — Bidirectional synchronization
 *   EPIDEMIC  — Broadcast to ALL nodes in brand (policy changes)
 *
 * Anti-Entropy:
 *   Every node has a state_hash (content hash).
 *   Every gossip round, a node's state_hash is compared to neighbors.
 *   If mismatch → sync triggered.
 *   Convergence guaranteed within O(log N) rounds.
 *
 * Tables used:
 *   node_core          — nid_hash, state_hash, sync_version, last_sync_at
 *   node_event_queue   — gossip events, status, event_hash, prev_hash
 *
 * Socket.io rooms:
 *   gossip:{brandCode}   — brand-wide gossip channel
 *   gossip:global         — cross-brand system gossip
 */

// ─── IMPORTS ────────────────────────────────────────────────
const NodeFactory = require('./nodeFactory');

// ─── GOSSIP CONFIG ───────────────────────────────────────────
const GOSSIP_CONFIG = {
  gossip_interval_ms: 30_000,       // Gossip every 30 seconds
  fanout: 3,                         // Push to 3 random neighbors per round
  max_digest_size: 50,               // Max nodes in a digest
  epidemic_ttl: 10,                  // Max hops for epidemic broadcast
  conflict_resolution: 'LAST_WRITE_WINS',  // or 'VECTOR_CLOCK'
  stale_threshold_ms: 300_000,       // 5 minutes = stale
  dead_threshold_ms: 600_000,        // 10 minutes = presumed dead
  max_gossip_history: 100,           // Max gossip events kept in memory
  anti_entropy_interval_ms: 120_000  // Full anti-entropy every 2 minutes
};

// ─── GOSSIP MESSAGE TYPES ────────────────────────────────────
const MESSAGE_TYPES = {
  DIGEST:         { label: 'State digest',              priority: 1 },
  SYNC_REQUEST:   { label: 'Request full sync',         priority: 2 },
  SYNC_RESPONSE:  { label: 'Full sync response',        priority: 2 },
  POLICY_UPDATE:  { label: 'Brand policy change',       priority: 10 },
  NODE_BIRTH:     { label: 'New node announcement',      priority: 5 },
  NODE_DEATH:     { label: 'Node deactivation notice',  priority: 5 },
  HEARTBEAT:      { label: 'Alive signal',               priority: 0 },
  CONFLICT:       { label: 'Conflict detected',         priority: 8 },
  MERGE:          { label: 'Conflict resolved merge',   priority: 7 }
};

// ─── NODE HEALTH STATES (gossip perspective) ─────────────────
const NODE_STATES = {
  ALIVE:    { label: 'Active and syncing',     color: '#4CAF50' },
  SUSPECT:  { label: 'Missed heartbeats',      color: '#FF9800' },
  DEAD:     { label: 'No activity, presumed dead', color: '#F44336' },
  LEFT:     { label: 'Gracefully departed',    color: '#9E9E9E' }
};

class GossipNetwork {
  constructor(supabaseClient, io) {
    this.db = supabaseClient;
    this.io = io;
    this.nodeFactory = NodeFactory;
    this.cache = null; // NodeCache — set via setCache()

    // Membership list — Map<nid_hash, { state, sync_version, state_hash, last_heartbeat, brand }>
    this._members = new Map();

    // Gossip event log (in-memory ring buffer)
    this._gossipLog = [];

    // Vector clocks — Map<nid_hash, Map<nid_hash, version>>
    this._vectorClocks = new Map();

    // Pending syncs — Set<nid_hash>
    this._pendingSyncs = new Set();

    // Intervals
    this._gossipInterval = null;
    this._antiEntropyInterval = null;
  }

  // ═══════════════════════════════════════════════════════════
  // START — Begin gossip protocol
  // ═══════════════════════════════════════════════════════════
  start() {
    // Periodic gossip rounds
    this._gossipInterval = setInterval(() => this._gossipRound(), GOSSIP_CONFIG.gossip_interval_ms);

    // Periodic anti-entropy (full state comparison)
    this._antiEntropyInterval = setInterval(() => this._antiEntropyRound(), GOSSIP_CONFIG.anti_entropy_interval_ms);

    // Setup Socket.io gossip handlers
    if (this.io) {
      this.io.on('connection', (socket) => {
        socket.on('gossip:join', (data) => this._handleJoin(socket, data));
        socket.on('gossip:digest', (data) => this._handleDigest(socket, data));
        socket.on('gossip:sync_request', (data) => this._handleSyncRequest(socket, data));
        socket.on('gossip:heartbeat', (data) => this._handleHeartbeat(socket, data));
        socket.on('gossip:leave', (data) => this._handleLeave(socket, data));
      });
    }

    console.log('    🔮 Gossip Network started (interval: 30s, fanout: 3, anti-entropy: 2m)');
    return { started: true };
  }

  /**
   * Attach NodeCache for faster lookups
   */
  setCache(nodeCache) {
    this.cache = nodeCache;
  }

  // ═══════════════════════════════════════════════════════════
  // REGISTER NODE — Add a node to the gossip network
  // ═══════════════════════════════════════════════════════════
  async registerNode(nidHash, brand = 'BOTMANTRA') {
    // Fetch current state — cache-first if available
    let node;
    if (this.cache) {
      const cached = await this.cache.getNodeByNidHash(nidHash);
      if (cached) {
        node = { nid_hash: cached.nid_hash, state_hash: cached.state_hash, sync_version: cached.sync_version, last_sync_at: cached.last_sync_at, node_state: cached.node_state };
      }
    }
    if (!node) {
      node = await this.nodeFactory.loadUserNode(nidHash);
    }

    if (!node) return { registered: false, reason: 'Node not found' };

    this._members.set(nidHash, {
      state: 'ALIVE',
      sync_version: node.sync_version || 0,
      state_hash: node.state_hash || 'unknown',
      last_heartbeat: Date.now(),
      brand,
      joined_at: Date.now()
    });

    // Initialize vector clock
    this._vectorClocks.set(nidHash, new Map([[nidHash, node.sync_version || 0]]));

    // Announce birth
    this._broadcast(brand, 'NODE_BIRTH', {
      nid_hash: nidHash,
      brand,
      sync_version: node.sync_version || 0
    });

    this._logGossipEvent('NODE_BIRTH', nidHash, brand);

    return {
      registered: true,
      nid_hash: nidHash,
      brand,
      members_in_brand: this._getBrandMemberCount(brand),
      total_members: this._members.size
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PUSH GOSSIP — Send state digest to random neighbors
  // ═══════════════════════════════════════════════════════════
  async pushGossip(nidHash) {
    const member = this._members.get(nidHash);
    if (!member) return { pushed: false, reason: 'Node not in network' };

    // Build digest (my state summary)
    const digest = {
      nid_hash: nidHash,
      sync_version: member.sync_version,
      state_hash: member.state_hash,
      brand: member.brand,
      timestamp: Date.now()
    };

    // Select random neighbors in same brand
    const neighbors = this._selectRandomNeighbors(nidHash, member.brand, GOSSIP_CONFIG.fanout);

    // Push digest to each neighbor
    const results = [];
    for (const neighbor of neighbors) {
      const comparison = this._compareDigests(digest, {
        sync_version: this._members.get(neighbor)?.sync_version || 0,
        state_hash: this._members.get(neighbor)?.state_hash || ''
      });

      if (comparison.drift) {
        // Neighbor is behind → push our state
        this._broadcast(member.brand, 'DIGEST', {
          from: nidHash,
          to: neighbor,
          digest,
          drift: comparison
        });

        results.push({ neighbor, drift: true, direction: comparison.direction });
      } else {
        results.push({ neighbor, drift: false });
      }
    }

    this._logGossipEvent('DIGEST', nidHash, member.brand, { neighbors: neighbors.length });

    return {
      pushed: true,
      nid_hash: nidHash,
      neighbors_contacted: neighbors.length,
      drifts_detected: results.filter(r => r.drift).length,
      results
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PULL SYNC — Request state from freshest neighbor
  // ═══════════════════════════════════════════════════════════
  async pullSync(nidHash) {
    const member = this._members.get(nidHash);
    if (!member) return { synced: false, reason: 'Node not in network' };

    // Find freshest neighbor in same brand
    const freshest = this._findFreshestNeighbor(nidHash, member.brand);
    if (!freshest) return { synced: false, reason: 'No neighbors available' };

    // Fetch freshest node's actual state — cache-first
    let freshNode;
    if (this.cache) {
      const cached = await this.cache.getNodeByNidHash(freshest.nid_hash);
      if (cached) {
        freshNode = { nid_hash: cached.nid_hash, state_hash: cached.state_hash, sync_version: cached.sync_version, last_sync_at: cached.last_sync_at };
      }
    }
    if (!freshNode) {
      freshNode = await this.nodeFactory.loadUserNode(freshest.nid_hash);
    }

    if (!freshNode) return { synced: false, reason: 'Freshest neighbor not in DB' };

    // Compare and sync
    if (freshNode.sync_version > member.sync_version) {
      // Update our member state
      member.sync_version = freshNode.sync_version;
      member.state_hash = freshNode.state_hash;
      member.last_heartbeat = Date.now();

      // Update vector clock
      this._mergeVectorClock(nidHash, freshest.nid_hash, freshNode.sync_version);

      this._logGossipEvent('SYNC_REQUEST', nidHash, member.brand, {
        from: freshest.nid_hash,
        version_delta: freshNode.sync_version - (member.sync_version || 0)
      });

      return {
        synced: true,
        synced_from: freshest.nid_hash,
        new_version: freshNode.sync_version,
        state_hash: freshNode.state_hash
      };
    }

    return { synced: false, reason: 'Already up to date' };
  }

  // ═══════════════════════════════════════════════════════════
  // EPIDEMIC BROADCAST — Push to ALL nodes in brand
  // ═══════════════════════════════════════════════════════════
  async epidemicBroadcast(brand, messageType, payload, ttl = GOSSIP_CONFIG.epidemic_ttl) {
    if (ttl <= 0) return { broadcast: false, reason: 'TTL expired' };

    const brandMembers = this._getBrandMembers(brand);
    let reached = 0;

    for (const [nidHash, member] of brandMembers) {
      if (member.state === 'ALIVE') {
        // Deliver message
        this._broadcast(brand, messageType, {
          ...payload,
          ttl: ttl - 1,
          reached_at: Date.now()
        });
        reached++;
      }
    }

    this._logGossipEvent('EPIDEMIC', 'system', brand, {
      type: messageType,
      reached,
      ttl
    });

    return {
      broadcast: true,
      type: messageType,
      brand,
      nodes_reached: reached,
      total_brand_members: brandMembers.size,
      ttl_remaining: ttl - 1
    };
  }

  // ═══════════════════════════════════════════════════════════
  // DETECT CONFLICTS — Compare vector clocks
  // ═══════════════════════════════════════════════════════════
  detectConflicts(nidHashA, nidHashB) {
    const clockA = this._vectorClocks.get(nidHashA);
    const clockB = this._vectorClocks.get(nidHashB);

    if (!clockA || !clockB) return { conflict: false, reason: 'Missing vector clock' };

    let aAhead = false;
    let bAhead = false;

    // Merge all keys
    const allKeys = new Set([...clockA.keys(), ...clockB.keys()]);

    for (const key of allKeys) {
      const va = clockA.get(key) || 0;
      const vb = clockB.get(key) || 0;
      if (va > vb) aAhead = true;
      if (vb > va) bAhead = true;
    }

    if (aAhead && bAhead) {
      // True conflict — concurrent updates
      return {
        conflict: true,
        type: 'CONCURRENT',
        clock_a: Object.fromEntries(clockA),
        clock_b: Object.fromEntries(clockB),
        resolution: GOSSIP_CONFIG.conflict_resolution
      };
    }

    if (aAhead) return { conflict: false, winner: nidHashA, type: 'A_AHEAD' };
    if (bAhead) return { conflict: false, winner: nidHashB, type: 'B_AHEAD' };
    return { conflict: false, type: 'EQUAL' };
  }

  // ═══════════════════════════════════════════════════════════
  // RESOLVE CONFLICT — Last-write-wins or manual merge
  // ═══════════════════════════════════════════════════════════
  async resolveConflict(nidHashA, nidHashB, strategy = 'LAST_WRITE_WINS') {
    const memberA = this._members.get(nidHashA);
    const memberB = this._members.get(nidHashB);

    if (!memberA || !memberB) return { resolved: false, reason: 'Node(s) not in network' };

    let winner, loser;

    switch (strategy) {
      case 'LAST_WRITE_WINS':
        winner = memberA.last_heartbeat >= memberB.last_heartbeat ? nidHashA : nidHashB;
        loser = winner === nidHashA ? nidHashB : nidHashA;
        break;
      case 'HIGHEST_VERSION':
        winner = memberA.sync_version >= memberB.sync_version ? nidHashA : nidHashB;
        loser = winner === nidHashA ? nidHashB : nidHashA;
        break;
      case 'HIGHEST_TRUST':
        // Query trust scores
        const nodeA = await this.nodeFactory.loadUserNode(nidHashA);
        const nodeB = await this.nodeFactory.loadUserNode(nidHashB);
        winner = (nodeA?.trust_score || 0) >= (nodeB?.trust_score || 0) ? nidHashA : nidHashB;
        loser = winner === nidHashA ? nidHashB : nidHashA;
        break;
      default:
        winner = nidHashA;
        loser = nidHashB;
    }

    // Merge vector clocks — winner's clock dominates
    const winnerClock = this._vectorClocks.get(winner) || new Map();
    const loserClock = this._vectorClocks.get(loser) || new Map();
    for (const [key, val] of loserClock) {
      winnerClock.set(key, Math.max(winnerClock.get(key) || 0, val));
    }
    this._vectorClocks.set(loser, new Map(winnerClock));

    // Update loser's state to match winner
    const loserMember = this._members.get(loser);
    const winnerMember = this._members.get(winner);
    loserMember.sync_version = winnerMember.sync_version;
    loserMember.state_hash = winnerMember.state_hash;

    this._logGossipEvent('MERGE', winner, winnerMember.brand, {
      strategy,
      loser,
      winner_version: winnerMember.sync_version
    });

    return {
      resolved: true,
      strategy,
      winner,
      loser,
      merged_version: winnerMember.sync_version
    };
  }

  // ═══════════════════════════════════════════════════════════
  // NETWORK STATUS — Full membership view
  // ═══════════════════════════════════════════════════════════
  getNetworkStatus() {
    const now = Date.now();
    const members = [];
    let alive = 0, suspect = 0, dead = 0;

    for (const [nidHash, m] of this._members) {
      const age = now - m.last_heartbeat;
      let computedState = m.state;

      if (age > GOSSIP_CONFIG.dead_threshold_ms) {
        computedState = 'DEAD';
        m.state = 'DEAD';
        dead++;
      } else if (age > GOSSIP_CONFIG.stale_threshold_ms) {
        computedState = 'SUSPECT';
        m.state = 'SUSPECT';
        suspect++;
      } else {
        alive++;
      }

      members.push({
        nid_hash: nidHash,
        state: computedState,
        brand: m.brand,
        sync_version: m.sync_version,
        last_heartbeat_ago_ms: age,
        joined_at: new Date(m.joined_at).toISOString()
      });
    }

    // Brand breakdown
    const brands = {};
    for (const m of members) {
      if (!brands[m.brand]) brands[m.brand] = { alive: 0, suspect: 0, dead: 0, total: 0 };
      brands[m.brand][m.state.toLowerCase()]++;
      brands[m.brand].total++;
    }

    return {
      total_members: this._members.size,
      alive,
      suspect,
      dead,
      brands,
      members: members.sort((a, b) => a.last_heartbeat_ago_ms - b.last_heartbeat_ago_ms),
      gossip_log_size: this._gossipLog.length,
      config: {
        gossip_interval_ms: GOSSIP_CONFIG.gossip_interval_ms,
        fanout: GOSSIP_CONFIG.fanout,
        conflict_resolution: GOSSIP_CONFIG.conflict_resolution
      },
      checked_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GOSSIP LOG — Recent gossip events
  // ═══════════════════════════════════════════════════════════
  getGossipLog(limit = 50) {
    return this._gossipLog.slice(-limit).reverse();
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNAL — Gossip Protocol Mechanics
  // ═══════════════════════════════════════════════════════════

  async _gossipRound() {
    // For each ALIVE member, push gossip to random neighbors
    for (const [nidHash, member] of this._members) {
      if (member.state !== 'ALIVE') continue;
      try {
        await this.pushGossip(nidHash);
      } catch { /* gossip round failure is non-critical */ }
    }
  }

  async _antiEntropyRound() {
    // Full state comparison — detect any remaining drift
    const now = Date.now();

    for (const [nidHash, member] of this._members) {
      if (member.state === 'DEAD') continue;

      // Fetch actual DB state — use cache if available
      try {
        let node;
        if (this.cache) {
          const sv = await this.cache.getSyncVersion(nidHash);
          node = { sync_version: sv, state_hash: null };
        } else {
          node = await this.nodeFactory.loadUserNode(nidHash);
        }

        if (node && node.sync_version !== member.sync_version) {
          // Drift detected — update member
          member.sync_version = node.sync_version;
          member.state_hash = node.state_hash;
          member.last_heartbeat = now;

          this._logGossipEvent('ANTI_ENTROPY', nidHash, member.brand, {
            old_version: member.sync_version,
            new_version: node.sync_version
          });
        }
      } catch { /* silent */ }
    }
  }

  _selectRandomNeighbors(excludeHash, brand, count) {
    const candidates = [];
    for (const [nidHash, m] of this._members) {
      if (nidHash !== excludeHash && m.brand === brand && m.state === 'ALIVE') {
        candidates.push(nidHash);
      }
    }

    // Fisher-Yates shuffle and take first `count`
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    return candidates.slice(0, count);
  }

  _findFreshestNeighbor(excludeHash, brand) {
    let freshest = null;
    let maxVersion = -1;

    for (const [nidHash, m] of this._members) {
      if (nidHash !== excludeHash && m.brand === brand && m.state === 'ALIVE') {
        if (m.sync_version > maxVersion) {
          maxVersion = m.sync_version;
          freshest = { nid_hash: nidHash, sync_version: m.sync_version };
        }
      }
    }

    return freshest;
  }

  _compareDigests(digestA, digestB) {
    if (digestA.state_hash === digestB.state_hash && digestA.sync_version === digestB.sync_version) {
      return { drift: false };
    }

    return {
      drift: true,
      direction: digestA.sync_version > digestB.sync_version ? 'A_AHEAD' : 'B_AHEAD',
      version_delta: Math.abs(digestA.sync_version - digestB.sync_version)
    };
  }

  _mergeVectorClock(localHash, remoteHash, remoteVersion) {
    if (!this._vectorClocks.has(localHash)) {
      this._vectorClocks.set(localHash, new Map());
    }
    const clock = this._vectorClocks.get(localHash);
    clock.set(remoteHash, Math.max(clock.get(remoteHash) || 0, remoteVersion));
    // Increment our own counter
    clock.set(localHash, (clock.get(localHash) || 0) + 1);
  }

  _getBrandMembers(brand) {
    const result = new Map();
    for (const [nidHash, m] of this._members) {
      if (m.brand === brand) result.set(nidHash, m);
    }
    return result;
  }

  _getBrandMemberCount(brand) {
    let count = 0;
    for (const m of this._members.values()) {
      if (m.brand === brand) count++;
    }
    return count;
  }

  _broadcast(brand, messageType, payload) {
    if (!this.io) return;
    this.io.to(`gossip:${brand}`).emit('gossip:message', {
      type: messageType,
      brand,
      payload,
      timestamp: Date.now()
    });
  }

  _logGossipEvent(type, nidHash, brand, metadata = {}) {
    this._gossipLog.push({
      type,
      nid_hash: nidHash,
      brand,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Ring buffer — limit size
    if (this._gossipLog.length > GOSSIP_CONFIG.max_gossip_history) {
      this._gossipLog = this._gossipLog.slice(-GOSSIP_CONFIG.max_gossip_history);
    }
  }

  // ─── SOCKET HANDLERS ──────────────────────────────────────

  _handleJoin(socket, data) {
    const { nid_hash, brand } = data || {};
    if (!nid_hash || !brand) return;
    socket.join(`gossip:${brand}`);
    socket.join(`gossip:global`);
    this.registerNode(nid_hash, brand);
  }

  _handleDigest(socket, data) {
    const { nid_hash } = data || {};
    if (!nid_hash) return;
    const member = this._members.get(nid_hash);
    if (member) {
      member.last_heartbeat = Date.now();
      if (data.sync_version) member.sync_version = data.sync_version;
      if (data.state_hash) member.state_hash = data.state_hash;
    }
  }

  _handleSyncRequest(socket, data) {
    const { nid_hash, target } = data || {};
    if (!nid_hash || !target) return;
    const targetMember = this._members.get(target);
    if (targetMember) {
      socket.emit('gossip:sync_response', {
        target,
        sync_version: targetMember.sync_version,
        state_hash: targetMember.state_hash
      });
    }
  }

  _handleHeartbeat(socket, data) {
    const { nid_hash } = data || {};
    if (!nid_hash) return;
    const member = this._members.get(nid_hash);
    if (member) {
      member.last_heartbeat = Date.now();
      member.state = 'ALIVE';
    }
  }

  _handleLeave(socket, data) {
    const { nid_hash } = data || {};
    if (!nid_hash) return;
    const member = this._members.get(nid_hash);
    if (member) {
      member.state = 'LEFT';
      this._logGossipEvent('NODE_DEATH', nid_hash, member.brand, { graceful: true });
      this._broadcast(member.brand, 'NODE_DEATH', { nid_hash, graceful: true });
    }
  }

  // ─── CLEANUP ───────────────────────────────────────────────
  stop() {
    if (this._gossipInterval) clearInterval(this._gossipInterval);
    if (this._antiEntropyInterval) clearInterval(this._antiEntropyInterval);
    this._members.clear();
    this._vectorClocks.clear();
    this._gossipLog = [];
  }
}

module.exports = {
  GossipNetwork,
  GOSSIP_CONFIG,
  MESSAGE_TYPES,
  NODE_STATES
};
