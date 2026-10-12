/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LOCATION & PROXIMITY API ROUTES                           ║
 * ║  Geographic Node Discovery & Proximity Services           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const router = express.Router();
const NodeDiscovery = require('../core/node-discovery');

// Middleware to validate location data
const validateLocation = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Latitude and longitude are required'
    });
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      error: 'Latitude must be between -90 and 90'
    });
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      error: 'Longitude must be between -180 and 180'
    });
  }

  next();
};

// ═══════════════════════════════════════════════════════════
// FIND NEAREST NODES BY LOCATION
// ═══════════════════════════════════════════════════════════
router.post('/find-nearest', validateLocation, async (req, res) => {
  try {
    const { supabase, user } = req;
    const discovery = new NodeDiscovery(supabase);

    const {
      latitude,
      longitude,
      maxDistance = 50, // km
      limit = 10,
      nodeType = null,
      excludeSelf = true
    } = req.body;

    const result = await discovery.findNearestByLocation(latitude, longitude, {
      maxDistance,
      limit,
      nodeType,
      excludeSelf
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        nodes: result.nodes,
        total_found: result.total_found,
        search_criteria: {
          latitude,
          longitude,
          max_distance: maxDistance,
          limit
        }
      }
    });

  } catch (error) {
    console.error('[LOCATION-API] Find nearest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find nearest nodes'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// SELECT BEST NODE
// ═══════════════════════════════════════════════════════════
router.post('/select-best', async (req, res) => {
  try {
    const { supabase, user } = req;
    const discovery = new NodeDiscovery(supabase);

    const {
      criteria = 'performance',
      userLocation = null,
      nodeType = null
    } = req.body;

    const result = await discovery.selectBestNode({
      criteria,
      userLocation,
      nodeType
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        node: result.node,
        selection_criteria: result.selection_criteria,
        selected_at: result.selected_at
      }
    });

  } catch (error) {
    console.error('[LOCATION-API] Select best error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to select best node'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// MULTI-CRITERIA NODE DISCOVERY
// ═══════════════════════════════════════════════════════════
router.post('/discover', validateLocation, async (req, res) => {
  try {
    const { supabase, user } = req;
    const discovery = new NodeDiscovery(supabase);

    const userLocation = {
      lat: req.body.latitude,
      lon: req.body.longitude
    };

    const preferences = {
      maxDistance: req.body.maxDistance || 50,
      relationshipWeight: req.body.relationshipWeight || 0.4,
      locationWeight: req.body.locationWeight || 0.4,
      performanceWeight: req.body.performanceWeight || 0.2,
      limit: req.body.limit || 5
    };

    const result = await discovery.findNodesMultiCriteria(userLocation, preferences);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        nodes: result.nodes,
        criteria: result.criteria,
        search_location: userLocation,
        preferences
      }
    });

  } catch (error) {
    console.error('[LOCATION-API] Multi-criteria discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover nodes'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET NODE LOCATION INFO
// ═══════════════════════════════════════════════════════════
router.get('/node/:nodeId/location', async (req, res) => {
  try {
    const { supabase, user } = req;
    const { nodeId } = req.params;

    // Get node location data
    const { data: nodeData, error } = await supabase
      .from('nodes')
      .select('nid_hash, latitude, longitude, location, updated_at')
      .eq('nid_hash', nodeId)
      .single();

    if (error || !nodeData) {
      return res.status(404).json({
        success: false,
        error: 'Node not found or no location data'
      });
    }

    res.json({
      success: true,
      data: {
        node_id: nodeData.nid_hash,
        latitude: nodeData.latitude,
        longitude: nodeData.longitude,
        location: nodeData.location,
        last_updated: nodeData.updated_at
      }
    });

  } catch (error) {
    console.error('[LOCATION-API] Get node location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get node location'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// UPDATE NODE LOCATION
// ═══════════════════════════════════════════════════════════
router.put('/node/:nodeId/location', validateLocation, async (req, res) => {
  try {
    const { supabase, user } = req;
    const { nodeId } = req.params;
    const { latitude, longitude, location } = req.body;

    // Update node location
    const { data: updatedNode, error } = await supabase
      .from('nodes')
      .update({
        latitude,
        longitude,
        location: location || null,
        updated_at: new Date().toISOString()
      })
      .eq('nid_hash', nodeId)
      .select('nid_hash, latitude, longitude, location, updated_at')
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update node location'
      });
    }

    res.json({
      success: true,
      data: {
        node_id: updatedNode.nid_hash,
        latitude: updatedNode.latitude,
        longitude: updatedNode.longitude,
        location: updatedNode.location,
        updated_at: updatedNode.updated_at
      }
    });

  } catch (error) {
    console.error('[LOCATION-API] Update node location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update node location'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK FOR LOCATION SERVICES
// ═══════════════════════════════════════════════════════════
router.get('/health', async (req, res) => {
  try {
    const { supabase } = req;

    // Test database functions
    const tests = {
      find_nearest_node: false,
      select_best_node: false,
      database_connection: true
    };

    // Test find_nearest_node function
    try {
      const result = await supabase.rpc('find_nearest_node', {
        in_lat: 0,
        in_lon: 0
      });
      tests.find_nearest_node = !result.error;
    } catch (e) {
      tests.find_nearest_node = false;
    }

    // Test select_best_node function
    try {
      const result = await supabase.rpc('select_best_node');
      tests.select_best_node = !result.error;
    } catch (e) {
      tests.select_best_node = false;
    }

    const allHealthy = Object.values(tests).every(test => test);

    res.json({
      success: true,
      status: allHealthy ? 'healthy' : 'degraded',
      services: tests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[LOCATION-API] Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

module.exports = router;