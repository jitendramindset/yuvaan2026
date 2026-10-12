/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NODE CACHE — Unified In-Memory Caching Layer               ║
 * ║  LRU + TTL for every hot-path DB query in the kernel        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Caches (with individual TTLs):
 *   1. Node Data        — node_core rows by nid_hash / owner_id
 *   2. Permissions       — permission results by user+action+target
 *   3. Nearest Nodes     — parent/children/siblings by nid_hash
 *   4. Sync Versions     — sync_version counters by nid_hash
 *   5. Trust Scores      — computed trust scores by nid_hash
 *   6. Brand Resolution  — user→brand mapping by owner_id
 *   7. Dashboard Layouts — layout configs by business_id+role_id
 *
 * Features:
 *   - LRU eviction (per-cache max size)
 *   - TTL expiration (per-cache configurable)
 *   - Selective invalidation (single key, pattern, entire cache)
 *   - Hit/miss statistics
 *   - Warm-up from DB on boot
 *   - Event-driven invalidation hooks
 */

// ─── IMPORTS ────────────────────────────────────────────────
const NodeFactory = require('./nodeFactory');

// ─── CACHE CONFIG ────────────────────────────────────────────
const CACHE_CONFIG = {
  node_data: {
    maxSize: 500,
    ttlMs: 60_000,         // 1 min — nodes change infrequently
    label: 'Node Data'
  },
  permissions: {
    maxSize: 1000,
    ttlMs: 30_000,         // 30s — permission checks are frequent + hot
    label: 'Permissions'
  },
  nearest_nodes: {
    maxSize: 300,
    ttlMs: 120_000,        // 2 min — tree structure changes rarely
    label: 'Nearest Nodes'
  },
  sync_versions: {
    maxSize: 500,
    ttlMs: 15_000,         // 15s — sync versions change on mutations
    label: 'Sync Versions'
  },
  trust_scores: {
    maxSize: 500,
    ttlMs: 60_000,         // 1 min — trust recalculated periodically
    label: 'Trust Scores'
  },
  brand_resolution: {
    maxSize: 500,
    ttlMs: 300_000,        // 5 min — brand rarely changes
    label: 'Brand Resolution'
  },
  dashboard_layouts: {
    maxSize: 100,
    ttlMs: 120_000,        // 2 min
    label: 'Dashboard Layouts'
  },
  query_results: {
    maxSize: 200,
    ttlMs: 30_000,         // 30s — generic query cache
    label: 'Query Results'
  }
};

// ─── LRU CACHE IMPLEMENTATION ────────────────────────────────
class LRUCache {
  constructor(maxSize = 100, ttlMs = 60_000, label = 'cache') {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.label = label;
    this._cache = new Map();  // key → { value, expiresAt, accessedAt }
    this._stats = { hits: 0, misses: 0, sets: 0, evictions: 0, invalidations: 0 };
  }

  /**
   * Get cached value, or undefined if miss/expired
   */
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) {
      this._stats.misses++;
      return undefined;
    }

    // TTL check
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      this._stats.misses++;
      return undefined;
    }

    // LRU: move to end (most recently used)
    this._cache.delete(key);
    entry.accessedAt = Date.now();
    this._cache.set(key, entry);
    this._stats.hits++;
    return entry.value;
  }

  /**
   * Set cache value with TTL
   */
  set(key, value, customTtlMs) {
    // Evict if at capacity (remove oldest = first entry in Map)
    if (this._cache.size >= this.maxSize && !this._cache.has(key)) {
      const oldestKey = this._cache.keys().next().value;
      this._cache.delete(oldestKey);
      this._stats.evictions++;
    }

    this._cache.set(key, {
      value,
      expiresAt: Date.now() + (customTtlMs || this.ttlMs),
      accessedAt: Date.now(),
      createdAt: Date.now()
    });
    this._stats.sets++;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const entry = this._cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidate a single key
   */
  invalidate(key) {
    const deleted = this._cache.delete(key);
    if (deleted) this._stats.invalidations++;
    return deleted;
  }

  /**
   * Invalidate all keys matching a prefix
   */
  invalidateByPrefix(prefix) {
    let count = 0;
    for (const key of this._cache.keys()) {
      if (key.startsWith(prefix)) {
        this._cache.delete(key);
        count++;
        this._stats.invalidations++;
      }
    }
    return count;
  }

  /**
   * Invalidate all keys matching a pattern function
   */
  invalidateWhere(predicate) {
    let count = 0;
    for (const [key, entry] of this._cache.entries()) {
      if (predicate(key, entry.value)) {
        this._cache.delete(key);
        count++;
        this._stats.invalidations++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache
   */
  clear() {
    const size = this._cache.size;
    this._cache.clear();
    this._stats.invalidations += size;
    return size;
  }

  /**
   * Remove expired entries
   */
  prune() {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this._cache.entries()) {
      if (now > entry.expiresAt) {
        this._cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Get stats
   */
  getStats() {
    const total = this._stats.hits + this._stats.misses;
    return {
      label: this.label,
      size: this._cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
      hits: this._stats.hits,
      misses: this._stats.misses,
      hitRate: total > 0 ? ((this._stats.hits / total) * 100).toFixed(1) + '%' : '0%',
      sets: this._stats.sets,
      evictions: this._stats.evictions,
      invalidations: this._stats.invalidations
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this._stats = { hits: 0, misses: 0, sets: 0, evictions: 0, invalidations: 0 };
  }
}

// ═════════════════════════════════════════════════════════════
// NODE CACHE — THE UNIFIED CACHING LAYER
// ═════════════════════════════════════════════════════════════
class NodeCache {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = NodeFactory;

    // Initialize all cache tiers
    this.nodeData = new LRUCache(
      CACHE_CONFIG.node_data.maxSize,
      CACHE_CONFIG.node_data.ttlMs,
      CACHE_CONFIG.node_data.label
    );
    this.permissions = new LRUCache(
      CACHE_CONFIG.permissions.maxSize,
      CACHE_CONFIG.permissions.ttlMs,
      CACHE_CONFIG.permissions.label
    );
    this.nearestNodes = new LRUCache(
      CACHE_CONFIG.nearest_nodes.maxSize,
      CACHE_CONFIG.nearest_nodes.ttlMs,
      CACHE_CONFIG.nearest_nodes.label
    );
    this.syncVersions = new LRUCache(
      CACHE_CONFIG.sync_versions.maxSize,
      CACHE_CONFIG.sync_versions.ttlMs,
      CACHE_CONFIG.sync_versions.label
    );
    this.trustScores = new LRUCache(
      CACHE_CONFIG.trust_scores.maxSize,
      CACHE_CONFIG.trust_scores.ttlMs,
      CACHE_CONFIG.trust_scores.label
    );
    this.brandResolution = new LRUCache(
      CACHE_CONFIG.brand_resolution.maxSize,
      CACHE_CONFIG.brand_resolution.ttlMs,
      CACHE_CONFIG.brand_resolution.label
    );
    this.dashboardLayouts = new LRUCache(
      CACHE_CONFIG.dashboard_layouts.maxSize,
      CACHE_CONFIG.dashboard_layouts.ttlMs,
      CACHE_CONFIG.dashboard_layouts.label
    );
    this.queryResults = new LRUCache(
      CACHE_CONFIG.query_results.maxSize,
      CACHE_CONFIG.query_results.ttlMs,
      CACHE_CONFIG.query_results.label
    );

    // All caches for iteration
    this._allCaches = {
      nodeData: this.nodeData,
      permissions: this.permissions,
      nearestNodes: this.nearestNodes,
      syncVersions: this.syncVersions,
      trustScores: this.trustScores,
      brandResolution: this.brandResolution,
      dashboardLayouts: this.dashboardLayouts,
      queryResults: this.queryResults
    };

    // Start periodic pruning (every 2 min)
    this._pruneInterval = setInterval(() => this.pruneAll(), 120_000);

    console.log('🗄️  NodeCache initialized — 8 tiers, LRU+TTL eviction');
  }

  // ═══════════════════════════════════════════════════════════
  // 1. NODE DATA — Cache node_core rows
  // ═══════════════════════════════════════════════════════════

  /**
   * Initialize Node Core for a user via node-schema.js
   * Uses: node_core, node_permission, vector_documents/vector_chunks
   * Idempotent — skips if node already exists.
   */
  async initializeNodeCore(userId, userData) {

    try {
      // Fetch user table data
      const { data: userRows } = await this.db
        .from('users')
        .select('id, mobile_hash, email_hash, pass_hash')
        .eq('id', userId);
      if(!userData) userData = userRows?.[0] || {};
      let nodeCoreId = null;
      if (userRows && userRows.length > 0) {
        const user = userRows[0];
        // Compute mobile_hash
        const mobileHash = user.mobile_hash ? user.mobile_hash : null;
        if (mobileHash) {
          // Match with owner table
          const { data: ownerRows } = await this.db
            .from('owner')
            .select('id, mobile_hash')
            .eq('mobile_hash', mobileHash);
          if (ownerRows && ownerRows.length > 0) {
            nodeCoreId = ownerRows[0].id;
          }
        }
      }

      // Try to find node_core by nodeCoreId
      let existingNode = null;
      if (nodeCoreId) {
        const nodeQuery = await this.nodeFactory.queryNodes({ owner_id: nodeCoreId, node_type: 'living' });
        const nodeByHash = nodeQuery.length > 0 ? nodeQuery[0] : null;
        if (nodeByHash) existingNode = nodeByHash;
      }
      // Fallback: check by owner_id
      if (!existingNode) {
        const nodeQuery = await this.nodeFactory.queryNodes({ owner_id: userId, node_type: 'living' });
        const nodeByOwner = nodeQuery.length > 0 ? nodeQuery[0] : null;
        if (nodeByOwner) existingNode = nodeByOwner;
      }

      if (existingNode) {
        return { success: true, already_exists: true, node: existingNode };
      }

      // Build metadata using schema system
      const metadata = defaultUserMetadata(userData);

      // Create node using NodeFactory
      const newNode = await this.nodeFactory.createNonLiveNode('user_node', userId, metadata, {
        brand_scope: 'BOTMANTRA',
        permission_scope: 'ALL',
        system_prompt: `You are the personal node for ${userData.full_name || 'User'}. Manage profile, friends, posts, and messages.`
      });

      // Create node_permission (owner full-access)
      await this.db.from('node_permission').insert({
        nid_hash: newNode.nid_hash,
        owner_id: userId,
        target_owner_id: userId,
        permission_type: 'OWNER',
        can_read: true,
        can_write: true,
        can_delete: true
      });

      // Store profile in vector system
      const vectorManager = new VectorManager(this.db);
      try {
        await vectorManager.store(newNode.nid_hash, 'user_memory_vectors', JSON.stringify({
          user_id: userId, nid_hash: newNode.nid_hash,
          email: userData.email, full_name: userData.full_name || '',
          mobile: userData.mobile || '', created_at: new Date().toISOString()
        }), {
          owner_id: userId,
          brand_scope: 'BOTMANTRA',
          semantic_tags: ['user_profile', 'identity'],
          role_access: ['owner']
        });
      } catch (vecErr) {
        console.warn(`⚠ Vector store skipped for ${userId}:`, vecErr.message);
      }

      console.log(`✅ Node Core initialized for user ${userId} | nid: ${newNode.nid_hash}`);
      return { success: true, node: newNode };
    } catch (error) {
      console.error(`❌ Node Core init failed for ${userId}:`, error.message);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get node by nid_hash (cache-first, DB fallback)
   */
  async getNodeByNidHash(nidHash) {
    const cacheKey = `nid:${nidHash}`;
    let node = this.nodeData.get(cacheKey);
    if (node !== undefined) return node;

    // DB fallback using NodeFactory
    const queryResult = await this.nodeFactory.queryNodes({ nid_hash: nidHash });
    const data = queryResult.success && queryResult.nodes && queryResult.nodes.length > 0 ? queryResult.nodes[0] : null;

    if (!data) return null;

    // Cache both by nid_hash and owner_id
    this.nodeData.set(cacheKey, data);
    if (data.owner_id) {
      this.nodeData.set(`owner:${data.owner_id}`, data);
    }
    return data;
  }

  
  /**
   * Get node by owner_id (cache-first, DB fallback)
   */
  async getNodeByOwnerId(ownerId) {
    const cacheKey = `owner:${ownerId}`;
    let node = this.nodeData.get(cacheKey);
    if (node !== undefined) return node;

    // DB fallback using NodeFactory
    const nodeData = await this.nodeFactory.loadUserNode(ownerId);

    if (!nodeData) return null;

    // Cache both ways
    this.nodeData.set(cacheKey, nodeData);
    if (nodeData.nid_hash) {
      this.nodeData.set(`nid:${nodeData.nid_hash}`, nodeData);
    }
    return nodeData;
  }

  /**
   * Invalidate node data after mutation
   */
  invalidateNode(nidHash, ownerId) {
    if (nidHash) this.nodeData.invalidate(`nid:${nidHash}`);
    if (ownerId) this.nodeData.invalidate(`owner:${ownerId}`);
    // Also invalidate related caches
    if (nidHash) {
      this.nearestNodes.invalidate(`near:${nidHash}`);
      this.syncVersions.invalidate(`sv:${nidHash}`);
      this.trustScores.invalidate(`trust:${nidHash}`);
    }
    if (ownerId) {
      this.brandResolution.invalidate(`brand:${ownerId}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 2. PERMISSIONS — Cache permission checks
  // ═══════════════════════════════════════════════════════════

  /**
   * Build permission cache key
   */
  _permKey(userNidHash, action, targetNidHash) {
    return `perm:${userNidHash}:${action}:${targetNidHash || 'self'}`;
  }

  /**
   * Get cached permission result
   */
  getCachedPermission(userNidHash, action, targetNidHash) {
    return this.permissions.get(this._permKey(userNidHash, action, targetNidHash));
  }

  /**
   * Cache permission result
   */
  cachePermission(userNidHash, action, targetNidHash, result) {
    this.permissions.set(this._permKey(userNidHash, action, targetNidHash), result);
  }

  /**
   * Invalidate all permissions for a user
   */
  invalidatePermissionsForUser(nidHash) {
    return this.permissions.invalidateByPrefix(`perm:${nidHash}:`);
  }

  // ═══════════════════════════════════════════════════════════
  // 3. NEAREST NODES — Cache parent/children/siblings
  // ═══════════════════════════════════════════════════════════

  /**
   * Get nearest nodes (parent + children + siblings) — cache-first
   */
  async getNearestNodes(nidHash) {
    const cacheKey = `near:${nidHash}`;
    let cached = this.nearestNodes.get(cacheKey);
    if (cached !== undefined) return cached;

    // Fetch from DB
    const result = { parent: null, children: [], siblings: [] };

    // Get current node (may be cached already)
    const node = await this.getNodeByNidHash(nidHash);
    if (!node) return result;

    // Parent
    if (node.parent_nid_hash) {
      const parent = await this.getNodeByNidHash(node.parent_nid_hash);
      result.parent = parent;

      // Siblings = same parent, excluding self
      const siblingsQuery = await this.nodeFactory.queryNodes({
        parent_nid_hash: node.parent_nid_hash
      });
      result.siblings = (siblingsQuery.success && siblingsQuery.nodes ? 
        siblingsQuery.nodes.filter(n => n.nid_hash !== nidHash).slice(0, 50) : []);
    }

    // Children
    const childrenQuery = await this.nodeFactory.queryNodes({
      parent_nid_hash: nidHash
    });
    result.children = (childrenQuery.success && childrenQuery.nodes ? 
      childrenQuery.nodes.slice(0, 100) : []);

    this.nearestNodes.set(cacheKey, result);
    return result;
  }

  /**
   * Invalidate nearest-node cache for a node and its parent
   */
  invalidateNearestNodes(nidHash, parentNidHash) {
    this.nearestNodes.invalidate(`near:${nidHash}`);
    if (parentNidHash) {
      this.nearestNodes.invalidate(`near:${parentNidHash}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 4. SYNC VERSIONS — Track sync counters in memory
  // ═══════════════════════════════════════════════════════════

  /**
   * Get sync version — cache-first, DB fallback
   */
  async getSyncVersion(nidHash) {
    const cacheKey = `sv:${nidHash}`;
    let cached = this.syncVersions.get(cacheKey);
    if (cached !== undefined) return cached;

    const queryResult = await this.nodeFactory.queryNodes({ nid_hash: nidHash });
    const data = queryResult.success && queryResult.nodes && queryResult.nodes.length > 0 ? queryResult.nodes[0] : null;

    const version = data?.sync_version || 0;
    this.syncVersions.set(cacheKey, version);
    return version;
  }

  /**
   * Increment sync version — update DB + cache
   */
  async incrementSyncVersion(nidHash) {
    const cacheKey = `sv:${nidHash}`;
    const current = await this.getSyncVersion(nidHash);
    const next = current + 1;

    // Update DB using NodeFactory
    await this.nodeFactory.updateNode(nidHash, { 
      sync_version: next, 
      last_synced_at: new Date().toISOString() 
    });

    // Update cache
    this.syncVersions.set(cacheKey, next);

    // Also invalidate the full node data (sync_version changed)
    this.nodeData.invalidate(`nid:${nidHash}`);

    return next;
  }

  // ═══════════════════════════════════════════════════════════
  // 5. TRUST SCORES — Cache computed trust scores
  // ═══════════════════════════════════════════════════════════

  /**
   * Get trust score — cache-first
   */
  getCachedTrust(nidHash) {
    return this.trustScores.get(`trust:${nidHash}`);
  }

  /**
   * Cache trust score
   */
  cacheTrust(nidHash, trustResult) {
    this.trustScores.set(`trust:${nidHash}`, trustResult);
  }

  /**
   * Invalidate trust after trust event
   */
  invalidateTrust(nidHash) {
    this.trustScores.invalidate(`trust:${nidHash}`);
  }

  // ═══════════════════════════════════════════════════════════
  // 6. BRAND RESOLUTION — Cache user→brand mapping
  // ═══════════════════════════════════════════════════════════

  /**
   * Get brand for user — cache-first, DB fallback
   */
  async getUserBrand(ownerId) {
    const cacheKey = `brand:${ownerId}`;
    let cached = this.brandResolution.get(cacheKey);
    if (cached !== undefined) return cached;

    const node = await this.getNodeByOwnerId(ownerId);
    const brand = node?.brand_code || 'BOTMANTRA';
    this.brandResolution.set(cacheKey, brand);
    return brand;
  }

  /**
   * Invalidate brand resolution after brand change
   */
  invalidateBrand(ownerId) {
    this.brandResolution.invalidate(`brand:${ownerId}`);
  }

  // ═══════════════════════════════════════════════════════════
  // 7. DASHBOARD LAYOUTS — Cache layout configs
  // ═══════════════════════════════════════════════════════════

  /**
   * Get dashboard layout — cache-first, DB fallback
   */
  async getDashboardLayout(businessId, roleId) {
    const cacheKey = `layout:${businessId}:${roleId || 'default'}`;
    let cached = this.dashboardLayouts.get(cacheKey);
    if (cached !== undefined) return cached;

    let query = this.db.from('dashboard_layouts').select('*').eq('business_id', businessId);
    if (roleId) query = query.eq('role_id', roleId);
    else query = query.eq('is_default', true);

    const { data } = await query.single();
    const layout = data || null;
    this.dashboardLayouts.set(cacheKey, layout);
    return layout;
  }

  /**
   * Invalidate layout after mutation
   */
  invalidateLayout(businessId) {
    this.dashboardLayouts.invalidateByPrefix(`layout:${businessId}:`);
  }

  // ═══════════════════════════════════════════════════════════
  // 8. GENERIC QUERY CACHE — For arbitrary DB queries
  // ═══════════════════════════════════════════════════════════

  /**
   * Get or fetch a query result
   * @param {string} key - Unique cache key
   * @param {Function} fetcher - async () => result (called on miss)
   * @param {number} [ttlMs] - Custom TTL for this query
   */
  async getOrFetch(key, fetcher, ttlMs) {
    let cached = this.queryResults.get(key);
    if (cached !== undefined) return cached;

    const result = await fetcher();
    this.queryResults.set(key, result, ttlMs);
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // GLOBAL OPERATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Invalidate ALL caches for a specific node (after mutation)
   */
  invalidateAllForNode(nidHash, ownerId, parentNidHash) {
    this.invalidateNode(nidHash, ownerId);
    this.invalidateNearestNodes(nidHash, parentNidHash);
    this.invalidatePermissionsForUser(nidHash);
    this.invalidateTrust(nidHash);
    if (ownerId) this.invalidateBrand(ownerId);
  }

  /**
   * Prune expired entries from all caches
   */
  pruneAll() {
    let total = 0;
    for (const [name, cache] of Object.entries(this._allCaches)) {
      total += cache.prune();
    }
    return total;
  }

  /**
   * Clear ALL caches (nuclear option)
   */
  clearAll() {
    let total = 0;
    for (const [name, cache] of Object.entries(this._allCaches)) {
      total += cache.clear();
    }
    return total;
  }

  /**
   * Get combined stats for all cache tiers
   */
  getStats() {
    const stats = {};
    let totalHits = 0, totalMisses = 0, totalSize = 0;

    for (const [name, cache] of Object.entries(this._allCaches)) {
      const s = cache.getStats();
      stats[name] = s;
      totalHits += s.hits;
      totalMisses += s.misses;
      totalSize += s.size;
    }

    const total = totalHits + totalMisses;
    return {
      tiers: stats,
      summary: {
        total_entries: totalSize,
        total_hits: totalHits,
        total_misses: totalMisses,
        overall_hit_rate: total > 0 ? ((totalHits / total) * 100).toFixed(1) + '%' : '0%',
        tiers: Object.keys(this._allCaches).length
      }
    };
  }

  /**
   * Reset stats for all caches
   */
  resetStats() {
    for (const cache of Object.values(this._allCaches)) {
      cache.resetStats();
    }
  }

  /**
   * Warm-up critical caches from DB
   */
  async warmUp(options = {}) {
    const { maxNodes = 50 } = options;
    const warmed = { nodes: 0, brands: 0 };

    try {
      // Pre-load recently active nodes
      const { data: recentNodes } = await this.db
        .from('node_core')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(maxNodes);

      if (recentNodes) {
        for (const node of recentNodes) {
          this.nodeData.set(`nid:${node.nid_hash}`, node);
          if (node.owner_id) {
            this.nodeData.set(`owner:${node.owner_id}`, node);
            if (node.brand_code) {
              this.brandResolution.set(`brand:${node.owner_id}`, node.brand_code);
              warmed.brands++;
            }
          }
          warmed.nodes++;
        }
      }
    } catch (err) {
      console.warn('⚠️ Cache warm-up partial failure:', err.message);
    }

    console.log(`🗄️  Cache warmed: ${warmed.nodes} nodes, ${warmed.brands} brands`);
    return warmed;
  }

  /**
   * Destroy — stop timers
   */
  destroy() {
    if (this._pruneInterval) clearInterval(this._pruneInterval);
    this.clearAll();
  }
}

module.exports = {
  NodeCache,
  LRUCache,
  CACHE_CONFIG
};
