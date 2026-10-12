/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NODE DISCOVERY ENGINE — Geographic & Relationship Based   ║
 * ║  Find nearest nodes by location, relationships, or criteria║
 * ╚══════════════════════════════════════════════════════════════╝
 */

class NodeDiscovery {
  constructor(supabaseClient, nodeCache = null, nodeFactory = null) {
    this.db = supabaseClient;
    this.cache = nodeCache;
    this.nodeFactory = nodeFactory;
  }

  /**
   * Find nearest nodes by geographic location
   * Uses the find_nearest_node database function
   */
  async findNearestByLocation(latitude, longitude, options = {}) {
    const {
      maxDistance = 100, // km
      limit = 10,
      nodeType = null,
      excludeSelf = null
    } = options;

    try {
      // Use the database function for geographic search
      const result = await this.db.rpc('find_nearest_node', {
        in_lat: latitude,
        in_lon: longitude
      });

      if (!result.data) {
        return { success: false, error: 'No nodes found', nodes: [] };
      }

      // The function returns a node ID, get the full node data
      const nearestNodeId = result.data;
      const nodeData = await this.nodeFactory.loadUserNode(nearestNodeId);

      if (!nodeData) {
        return { success: false, error: 'Node not found', nodes: [] };
      }

      // Calculate distance (simplified - in production use PostGIS)
      const distance = this._calculateDistance(
        latitude, longitude,
        nodeData.latitude || 0, nodeData.longitude || 0
      );

      if (distance > maxDistance) {
        return { success: false, error: 'No nodes within distance', nodes: [] };
      }

      return {
        success: true,
        nodes: [{
          ...nodeData,
          distance: distance,
          location_match: true
        }],
        total_found: 1
      };

    } catch (error) {
      console.error('[NODE-DISCOVERY] Geographic search error:', error);
      return { success: false, error: error.message, nodes: [] };
    }
  }

  /**
   * Select best node based on criteria
   * Uses the select_best_node database function
   */
  async selectBestNode(options = {}) {
    const {
      criteria = 'performance', // performance, reliability, proximity
      userLocation = null,
      nodeType = null
    } = options;

    try {
      // Use the database function to select best node
      const result = await this.db.rpc('select_best_node');

      if (!result.data) {
        return { success: false, error: 'No suitable node found' };
      }

      const bestNodeId = result.data;
      const nodeData = await this.nodeFactory.loadUserNode(bestNodeId);

      if (!nodeData) {
        return { success: false, error: 'Selected node not found' };
      }

      return {
        success: true,
        node: nodeData,
        selection_criteria: criteria,
        selected_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('[NODE-DISCOVERY] Best node selection error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find nodes by multiple criteria (location + relationships + performance)
   */
  async findNodesMultiCriteria(userLocation, preferences = {}) {
    const {
      maxDistance = 50,
      relationshipWeight = 0.4,
      locationWeight = 0.4,
      performanceWeight = 0.2,
      limit = 5
    } = preferences;

    try {
      const results = [];

      // 1. Get geographic nearest nodes
      const geoResults = await this.findNearestByLocation(
        userLocation.lat, userLocation.lon,
        { maxDistance, limit: limit * 2 }
      );

      if (geoResults.success) {
        results.push(...geoResults.nodes);
      }

      // 2. Get relationship-based nodes (from cache if available)
      if (this.cache) {
        // This would need user context to get relationship-based nodes
        // For now, we'll focus on geographic
      }

      // 3. Score and rank nodes
      const scoredNodes = results.map(node => ({
        ...node,
        score: this._calculateNodeScore(node, {
          locationWeight,
          relationshipWeight,
          performanceWeight,
          userLocation
        })
      }));

      // Sort by score and limit
      scoredNodes.sort((a, b) => b.score - a.score);

      return {
        success: true,
        nodes: scoredNodes.slice(0, limit),
        criteria: {
          geographic: geoResults.success,
          relationship: false, // Not implemented yet
          performance: true
        }
      };

    } catch (error) {
      console.error('[NODE-DISCOVERY] Multi-criteria search error:', error);
      return { success: false, error: error.message, nodes: [] };
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this._toRadians(lat2 - lat1);
    const dLon = this._toRadians(lon2 - lon1);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate node score based on multiple criteria
   */
  _calculateNodeScore(node, weights) {
    let score = 0;

    // Location score (inverse of distance)
    if (node.distance !== undefined) {
      const locationScore = Math.max(0, 1 - (node.distance / 100)); // Max 100km
      score += locationScore * weights.locationWeight;
    }

    // Relationship score (placeholder - would need relationship data)
    const relationshipScore = node.relationship_depth ? (1 / (node.relationship_depth + 1)) : 0;
    score += relationshipScore * weights.relationshipWeight;

    // Performance score (based on node health metrics)
    const performanceScore = (node.health_score || 0.5); // Default 0.5 if no data
    score += performanceScore * weights.performanceWeight;

    return score;
  }
}

module.exports = NodeDiscovery;