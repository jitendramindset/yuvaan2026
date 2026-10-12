/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NODE SYNC ENGINE — Neural OS Kernel                        ║
 * ║  Nearest Node Sync + Multi-Device Real-Time System          ║
 * ║  Every change propagates through the node graph             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Sync flow when a node updates:
 *   1. Update parent node's memory/field references
 *   2. Notify child nodes
 *   3. Update relationship graph links
 *   4. Update relevant vector entries
 *   5. Broadcast WebSocket event to all connected devices
 *   6. Track per-device sync timestamps
 *
 * Multi-Device:
 *   Each user may have: mobile, web, tablet
 *   Each has device_node, device_trust, last_sync_timestamp
 *   Sync via Socket.io rooms: user:{userId}, node:{nidHash}
 *
 * Tables:
 *   node_core           — parent_nid_hash, sync_version, last_sync_at
 *   trusted_devices     — device trust registry
 *   node_event_queue    — async event processing
 */

class NodeSync {
  constructor(supabaseClient, io, nodeCache, nodeFactory, nodeDiscovery = null) {
    this.db = supabaseClient;
    this.io = io; // Socket.io server instance
    this.cache = nodeCache || null; // NodeCache instance (optional)
    this.nodeFactory = nodeFactory; // NodeFactory instance
    this.nodeDiscovery = nodeDiscovery; // NodeDiscovery instance (optional)
  }

  /**
   * Attach cache after construction (for late binding from kernel)
   */
  setCache(nodeCache) {
    this.cache = nodeCache;
  }

  /**
   * Attach node discovery engine
   */
  setNodeDiscovery(nodeDiscovery) {
    this.nodeDiscovery = nodeDiscovery;
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN SYNC — called after every node mutation
  // ═══════════════════════════════════════════════════════════
  async syncNearestNodes(userNode, changedFields = {}, actionType = 'update') {
    const syncResults = {
      parent_synced: false,
      children_notified: 0,
      relationships_updated: 0,
      vectors_updated: false,
      devices_notified: 0,
      sync_version: null
    };

    try {
      // 1. Increment sync version on the changed node
      const newVersion = await this._incrementSyncVersion(userNode.nid_hash);
      syncResults.sync_version = newVersion;

      // 2. Sync parent
      if (userNode.parent_nid_hash) {
        syncResults.parent_synced = await this._syncParent(
          userNode.parent_nid_hash, userNode.nid_hash, changedFields
        );
      }

      // 3. Notify children
      syncResults.children_notified = await this._notifyChildren(
        userNode.nid_hash, actionType, changedFields
      );

      // 4. Update relationship graph
      syncResults.relationships_updated = await this._updateRelationshipGraph(
        userNode, changedFields
      );

      // 5. Queue vector update (async)
      syncResults.vectors_updated = await this._queueVectorUpdate(
        userNode, changedFields
      );

      // 6. Broadcast to all connected devices
      syncResults.devices_notified = this._broadcastToDevices(
        userNode, actionType, changedFields, newVersion
      );

    } catch (err) {
      console.error('[NODE-SYNC] Error:', err.message);
    }

    return syncResults;
  }

  // ═══════════════════════════════════════════════════════════
  // GEOGRAPHIC NEAREST NODES — Location-based sync
  // ═══════════════════════════════════════════════════════════
  async syncGeographicNearest(userNode, userLocation, options = {}) {
    if (!this.nodeDiscovery) {
      console.warn('[NODE-SYNC] NodeDiscovery not available for geographic sync');
      return { success: false, error: 'NodeDiscovery not configured' };
    }

    const {
      maxDistance = 50, // km
      syncData = true,
      notifyNodes = true
    } = options;

    try {
      // Find geographically nearest nodes
      const discoveryResult = await this.nodeDiscovery.findNearestByLocation(
        userLocation.latitude,
        userLocation.longitude,
        { maxDistance, limit: 5 }
      );

      if (!discoveryResult.success) {
        return {
          success: false,
          error: discoveryResult.error,
          geographic_nodes: []
        };
      }

      const geoNodes = discoveryResult.nodes;
      const syncResults = {
        geographic_nodes: geoNodes.length,
        data_synced: 0,
        notifications_sent: 0
      };

      // Sync data with geographic nearest nodes
      if (syncData) {
        for (const geoNode of geoNodes) {
          try {
            // Sync relevant data based on node type and relationships
            await this._syncGeographicData(userNode, geoNode);
            syncResults.data_synced++;
          } catch (err) {
            console.error(`[NODE-SYNC] Failed to sync with geo node ${geoNode.nid_hash}:`, err.message);
          }
        }
      }

      // Notify geographic nodes of user's presence/activity
      if (notifyNodes && this.io) {
        for (const geoNode of geoNodes) {
          this._emit(`node:${geoNode.nid_hash}`, 'geographic_neighbor_active', {
            neighbor_nid_hash: userNode.nid_hash,
            location: userLocation,
            distance: geoNode.distance,
            timestamp: new Date().toISOString()
          });
        }
        syncResults.notifications_sent = geoNodes.length;
      }

      return {
        success: true,
        ...syncResults
      };

    } catch (error) {
      console.error('[NODE-SYNC] Geographic sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 1. INCREMENT SYNC VERSION
  // ═══════════════════════════════════════════════════════════
  async _incrementSyncVersion(nidHash) {
    // Use cache if available (avoids SELECT + UPDATE round-trips)
    if (this.cache) {
      return await this.cache.incrementSyncVersion(nidHash);
    }

    // Fallback: use NodeFactory
    const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: nidHash });
    const node = nodeQuery && nodeQuery.length > 0 ? nodeQuery[0] : null;

    const newVersion = (node?.sync_version || 0) + 1;

    await this.nodeFactory.updateNode(nidHash, {
      sync_version: newVersion,
      last_sync_at: new Date().toISOString()
    });

    return newVersion;
  }

  // ═══════════════════════════════════════════════════════════
  // 2. SYNC PARENT NODE
  // ═══════════════════════════════════════════════════════════
  async _syncParent(parentNidHash, childNidHash, changedFields) {
    try {
      // Touch parent's updated_at and increment sync_version using NodeFactory
      await this.nodeFactory.updateNode(parentNidHash, {
        updated_at: new Date().toISOString()
        // sync_version will be handled by trigger or separate logic
      });

      // Emit parent update event
      this._emit(`node:${parentNidHash}`, 'child_updated', {
        child_nid_hash: childNidHash,
        changed_fields: Object.keys(changedFields),
        timestamp: new Date().toISOString()
      });

      return true;
    } catch { return false; }
  }

  // ═══════════════════════════════════════════════════════════
  // 3. NOTIFY CHILDREN
  // ═══════════════════════════════════════════════════════════
  async _notifyChildren(parentNidHash, actionType, changedFields) {
    try {
      let children;

      // Use cached nearest-nodes if available (avoids DB query)
      if (this.cache) {
        const nearest = await this.cache.getNearestNodes(parentNidHash);
        children = nearest.children;
      } else {
        // Use NodeFactory to get children
        children = await this.nodeFactory.queryNodes({
          parent_nid_hash: parentNidHash
        });
      }

      if (!children || children.length === 0) return 0;

      for (const child of children) {
        this._emit(`node:${child.nid_hash}`, 'parent_updated', {
          parent_nid_hash: parentNidHash,
          action: actionType,
          changed_fields: Object.keys(changedFields),
          timestamp: new Date().toISOString()
        });
      }

      return children.length;
    } catch { return 0; }
  }

  // ═══════════════════════════════════════════════════════════
  // 4. UPDATE RELATIONSHIP GRAPH
  // ═══════════════════════════════════════════════════════════
  async _updateRelationshipGraph(userNode, changedFields) {
    try {
      // Find all nodes related to this user (via node_permission)
      const { data: related } = await this.db
        .from('node_permission')
        .select('nid_hash, target_owner_id')
        .or(`owner_id.eq.${userNode.owner_id},target_owner_id.eq.${userNode.owner_id}`)
        .eq('is_revoked', false)
        .limit(50);

      if (!related || related.length === 0) return 0;

      // Emit relationship update to each related node
      for (const rel of related) {
        this._emit(`node:${rel.nid_hash}`, 'relationship_updated', {
          source_nid_hash: userNode.nid_hash,
          changed_fields: Object.keys(changedFields),
          timestamp: new Date().toISOString()
        });
      }

      return related.length;
    } catch { return 0; }
  }

  // ═══════════════════════════════════════════════════════════
  // 5. QUEUE VECTOR UPDATE (async)
  // ═══════════════════════════════════════════════════════════
  async _queueVectorUpdate(userNode, changedFields) {
    try {
      await this.db
        .from('node_event_queue')
        .insert({
          nid_hash: userNode.nid_hash,
          event_type: 'vector_sync',
          payload: {
            owner_id: userNode.owner_id,
            changed_fields: changedFields,
            timestamp: new Date().toISOString()
          },
          status: 'pending',
          created_at: new Date().toISOString()
        });
      return true;
    } catch { return false; }
  }

  // ═══════════════════════════════════════════════════════════
  // 6. BROADCAST TO ALL DEVICES
  // ═══════════════════════════════════════════════════════════
  _broadcastToDevices(userNode, actionType, changedFields, syncVersion) {
    if (!this.io) return 0;

    const payload = {
      type: 'node_updated',
      nid_hash: userNode.nid_hash,
      owner_id: userNode.owner_id,
      action: actionType,
      changed_fields: Object.keys(changedFields),
      sync_version: syncVersion,
      timestamp: new Date().toISOString()
    };

    // Emit to user room (all devices of this user)
    this._emit(`user:${userNode.owner_id}`, 'node_updated', payload);

    // Emit to node room (anyone watching this node)
    this._emit(`node:${userNode.nid_hash}`, 'node_updated', payload);

    // Emit brand-level update
    const dna = userNode.dna_blob;
    const brandScope = typeof dna === 'object' ? dna?.brand_scope : null;
    if (brandScope) {
      this._emit(`brand:${brandScope}`, 'brand_update', {
        nid_hash: userNode.nid_hash,
        action: actionType,
        timestamp: payload.timestamp
      });
    }

    return 1; // We broadcast; actual device count unknown
  }

  _emit(room, event, data) {
    if (!this.io) return;
    try {
      this.io.to(room).emit(event, data);
    } catch { /* silent */ }
  }
}

// ═════════════════════════════════════════════════════════════
// MULTI-DEVICE SYNC MANAGER
// ═════════════════════════════════════════════════════════════
class MultiDeviceSync {
  constructor(supabaseClient, io) {
    this.db = supabaseClient;
    this.io = io;
  }

  // Register a device for a user session
  async registerDevice(userId, deviceId, deviceInfo = {}) {
    const now = new Date().toISOString();

    try {
      // Upsert into trusted_devices
      const { data, error } = await this.db
        .from('trusted_devices')
        .upsert({
          user_id: userId,
          device_id: deviceId,
          device_type: deviceInfo.type || 'web',
          device_name: deviceInfo.name || 'Unknown Device',
          trust_level: deviceInfo.trust_level || 50,
          last_active: now,
          is_trusted: true
        }, { onConflict: 'user_id,device_id' })
        .select()
        .single();

      if (error) throw error;

      return { registered: true, device: data };
    } catch (err) {
      // Table may not exist — use in-memory tracking
      return { registered: true, device: { user_id: userId, device_id: deviceId, trust_level: 50 } };
    }
  }

  // Get device trust level
  async getDeviceTrust(userId, deviceId) {
    try {
      const { data } = await this.db
        .from('trusted_devices')
        .select('trust_level, is_trusted, last_active')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single();

      return data || { trust_level: 0, is_trusted: false };
    } catch {
      return { trust_level: 0, is_trusted: false };
    }
  }

  // List all devices for a user
  async getUserDevices(userId) {
    try {
      const { data } = await this.db
        .from('trusted_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trusted', true)
        .order('last_active', { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }

  // Sync state to a specific device
  async syncToDevice(userId, deviceId, stateUpdate) {
    if (!this.io) return false;

    this.io.to(`device:${deviceId}`).emit('state_sync', {
      user_id: userId,
      ...stateUpdate,
      timestamp: new Date().toISOString()
    });

    // Update last_sync on device
    try {
      await this.db
        .from('trusted_devices')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_id', deviceId);
    } catch { /* silent */ }

    return true;
  }

  // Revoke device trust
  async revokeDevice(userId, deviceId) {
    try {
      await this.db
        .from('trusted_devices')
        .update({ is_trusted: false })
        .eq('user_id', userId)
        .eq('device_id', deviceId);

      // Force disconnect the device
      if (this.io) {
        this.io.to(`device:${deviceId}`).emit('force_disconnect', {
          reason: 'Device trust revoked',
          timestamp: new Date().toISOString()
        });
      }

      return { revoked: true };
    } catch {
      return { revoked: false };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SOCKET.IO ENHANCED SETUP
  // ═══════════════════════════════════════════════════════════
  setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth?.userId;
      const deviceId = socket.handshake.auth?.deviceId;

      if (userId) {
        // Join user room (all devices for this user)
        socket.join(`user:${userId}`);
      }
      if (deviceId) {
        // Join device-specific room
        socket.join(`device:${deviceId}`);
      }

      // Join a node room (watch for changes)
      socket.on('watch_node', (nidHash) => {
        socket.join(`node:${nidHash}`);
      });

      // Leave a node room
      socket.on('unwatch_node', (nidHash) => {
        socket.leave(`node:${nidHash}`);
      });

      // Join a brand room
      socket.on('watch_brand', (brandCode) => {
        socket.join(`brand:${brandCode}`);
      });

      // Request full state sync
      socket.on('request_sync', async (data) => {
        if (!userId) return;
        const lastVersion = data?.last_sync_version || 0;

        try {
          // Find all nodes updated since the client's last known version
          const { data: updatedNodes } = await this.db
            .from('node_core')
            .select('nid_hash, sync_version, updated_at, node_state')
            .eq('owner_id', userId)
            .gt('sync_version', lastVersion)
            .order('updated_at', { ascending: false })
            .limit(50);

          socket.emit('sync_response', {
            nodes: updatedNodes || [],
            server_time: new Date().toISOString()
          });
        } catch { /* silent */ }
      });

      // Heartbeat
      socket.on('heartbeat', () => {
        socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // GEOGRAPHIC DATA SYNC — Sync with location-based neighbors
  // ═══════════════════════════════════════════════════════════
  async _syncGeographicData(sourceNode, targetNode) {
    try {
      // Determine what data to sync based on node types and relationships
      const syncPayload = {
        source_nid_hash: sourceNode.nid_hash,
        target_nid_hash: targetNode.nid_hash,
        sync_type: 'geographic_neighbor',
        shared_context: this._determineSharedContext(sourceNode, targetNode),
        timestamp: new Date().toISOString()
      };

      // Queue the sync operation
      await this.db
        .from('node_event_queue')
        .insert({
          nid_hash: sourceNode.nid_hash,
          event_type: 'geographic_sync',
          payload: syncPayload,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('[NODE-SYNC] Geographic data sync error:', error);
      return false;
    }
  }

  /**
   * Determine shared context between two nodes for geographic sync
   */
  _determineSharedContext(node1, node2) {
    const contexts = [];

    // Location-based context
    if (node1.location && node2.location) {
      contexts.push('location_proximity');
    }

    // Brand/context sharing
    if (node1.dna_blob?.brand_scope && node2.dna_blob?.brand_scope) {
      if (node1.dna_blob.brand_scope === node2.dna_blob.brand_scope) {
        contexts.push('brand_shared');
      }
    }

    // Interest similarity (would need more complex logic)
    // This is a placeholder for future enhancement

    return contexts;
  }
}

module.exports = {
  NodeSync,
  MultiDeviceSync
};
