/**
 * 🌐 NODE PROXIMITY & VALIDATION API
 * Handles nearby node discovery, location-based sync, and validation
 * Date: January 29, 2026
 */

const express = require('express');
const router = express.Router();

module.exports = function(app, supabaseClient) {

  /**
   * ═══════════════════════════════════════════════
   * 🔍 FIND NEARBY NODES
   * ═══════════════════════════════════════════════
   * POST /api/nodes/nearby
   * Request body: { latitude, longitude, radius }
   */
  router.post('/nearby', async (req, res) => {
    try {
      const { latitude, longitude, radius = 10000 } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      // ════════════════════════════════════════════════════════════════
      // 1. CALCULATE NEARBY NODES USING HAVERSINE FORMULA
      // ════════════════════════════════════════════════════════════════
      const { data: allNodes, error } = await supabaseClient
        .from('node_core')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching nodes:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch nodes'
        });
      }

      // Calculate distance for each node
      const nearbyNodes = allNodes
        .map(node => ({
          ...node,
          distance: calculateDistance(
            latitude,
            longitude,
            node.latitude,
            node.longitude
          )
        }))
        .filter(node => node.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      // ════════════════════════════════════════════════════════════════
      // 2. VALIDATE ACCESS FOR EACH NEARBY NODE
      // ════════════════════════════════════════════════════════════════
      const userId = req.user?.id;
      const validatedNodes = await Promise.all(
        nearbyNodes.map(async (node) => {
          const access = await validateNodeAccess(node, userId, supabaseClient);
          return {
            ...node,
            access: access.granted,
            accessLevel: access.level,
            karma_required: access.karmaRequired
          };
        })
      );

      return res.json({
        success: true,
        nodes: validatedNodes,
        count: validatedNodes.length,
        userLocation: { latitude, longitude }
      });

    } catch (error) {
      console.error('Nearby nodes error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * ═══════════════════════════════════════════════
   * ✅ VALIDATE NODE ACCESS
   * ═══════════════════════════════════════════════
   * POST /api/nodes/validate
   * Request body: { nodeId, userId, action }
   */
  router.post('/validate', async (req, res) => {
    try {
      const { nodeId, userId, action = 'view' } = req.body;

      if (!nodeId) {
        return res.status(400).json({
          success: false,
          error: 'Node ID is required'
        });
      }

      // ════════════════════════════════════════════════════════════════
      // 1. GET NODE DATA
      // ════════════════════════════════════════════════════════════════
      const { data: node, error } = await supabaseClient
        .from('node_core')
        .select('*')
        .eq('nid_hash', nodeId)
        .single();

      if (error || !node) {
        return res.status(404).json({
          success: false,
          error: 'Node not found'
        });
      }

      // ════════════════════════════════════════════════════════════════
      // 2. VALIDATE ACCESS
      // ════════════════════════════════════════════════════════════════
      const access = await validateNodeAccess(node, userId, supabaseClient);

      return res.json({
        success: true,
        node: {
          id: node.nid_hash,
          name: node.name,
          type: node.node_type
        },
        access: access.granted,
        accessLevel: access.level,
        karmaRequired: access.karmaRequired,
        userKarma: access.userKarma,
        reason: access.reason
      });

    } catch (error) {
      console.error('Node validation error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * ═══════════════════════════════════════════════
   * 📡 BROADCAST NODE UPDATE
   * ═══════════════════════════════════════════════
   * POST /api/nodes/broadcast
   * Request body: { nodeId, action, data }
   */
  router.post('/broadcast', async (req, res) => {
    try {
      const { nodeId, action, data } = req.body;

      if (!nodeId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Node ID and action are required'
        });
      }

      // ════════════════════════════════════════════════════════════════
      // 1. LOG BROADCAST EVENT
      // ════════════════════════════════════════════════════════════════
      const { error } = await supabaseClient
        .from('node_logs')
        .insert({
          nid_hash: nodeId,
          action: action,
          broadcast_data: data,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Broadcast logging error:', error);
      }

      // ════════════════════════════════════════════════════════════════
      // 2. NOTIFY NEARBY NODES (if location available)
      // ════════════════════════════════════════════════════════════════
      // In production, this would use WebSockets or Server-Sent Events
      console.log(`📡 Broadcast: ${action} on node ${nodeId}`);

      return res.json({
        success: true,
        message: 'Broadcast sent',
        nodeId,
        action
      });

    } catch (error) {
      console.error('Broadcast error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return router;
};

/**
 * ═══════════════════════════════════════════════
 * 📐 HELPER: CALCULATE DISTANCE (HAVERSINE)
 * ═══════════════════════════════════════════════
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * ═══════════════════════════════════════════════
 * ✅ HELPER: VALIDATE NODE ACCESS
 * ═══════════════════════════════════════════════
 */
async function validateNodeAccess(node, userId, supabaseClient) {
  // Default: public access
  if (node.access_level === 'public' || !node.access_level) {
    return {
      granted: true,
      level: 'PUBLIC_ACCESS',
      karmaRequired: 0,
      userKarma: 0,
      reason: 'Public node'
    };
  }

  // If no user, deny access to protected nodes
  if (!userId) {
    return {
      granted: false,
      level: 'NO_ACCESS',
      karmaRequired: node.karma_threshold || 100,
      userKarma: 0,
      reason: 'Authentication required'
    };
  }

  // ════════════════════════════════════════════════════════════════
  // GET USER'S KARMA SCORE
  // ════════════════════════════════════════════════════════════════
  const { data: karmaLog } = await supabaseClient
    .from('karma_logs')
    .select('karma_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const userKarma = karmaLog?.karma_score || 0;
  const karmaRequired = node.karma_threshold || 100;

  // ════════════════════════════════════════════════════════════════
  // VALIDATE KARMA THRESHOLD
  // ════════════════════════════════════════════════════════════════
  if (userKarma < karmaRequired) {
    return {
      granted: false,
      level: 'INSUFFICIENT_KARMA',
      karmaRequired,
      userKarma,
      reason: `Requires ${karmaRequired} karma (you have ${userKarma})`
    };
  }

  // ════════════════════════════════════════════════════════════════
  // DETERMINE ACCESS LEVEL BASED ON KARMA
  // ════════════════════════════════════════════════════════════════
  let accessLevel = 'STANDARD_ACCESS';
  if (userKarma >= 500) accessLevel = 'PREMIUM_ACCESS';
  if (userKarma >= 1000) accessLevel = 'ELITE_ACCESS';
  if (userKarma >= 2000) accessLevel = 'MASTER_ACCESS';
  if (userKarma >= 5000) accessLevel = 'SUPREME_ACCESS';

  return {
    granted: true,
    level: accessLevel,
    karmaRequired,
    userKarma,
    reason: `Access granted with ${accessLevel}`
  };
}
