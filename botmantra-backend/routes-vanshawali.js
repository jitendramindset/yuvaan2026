/**
 * Vanshawali API - Genealogy and Family Tree Information
 * Provides family hierarchy, relationships, and ancestry data
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { fetchNodeCore, projectFamilyLineage, projectFamilyTree } = require('./services/family-graph-projection');
const nodeCore = require('./core/nodeCore');
const { decodeFromBlob } = require('./core/node-schema');
const NodeFactory = require('./core/nodeFactory');
const { createFamilyMember, resolveCanonicalOwnerId } = require('./services/family-member-service');

module.exports = function(app, supabaseClient) {
  const router = express.Router();
  const nodeFactory = new NodeFactory(supabaseClient);

  async function requireAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const token = authHeader.slice(7);
      const { data } = await supabaseClient.auth.getUser(token);
      if (data?.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata || {},
          owner_id: await resolveCanonicalOwnerId(nodeFactory, supabaseClient, data.user.id)
        };
        return next();
      }

      const claims = jwt.verify(token, process.env.JWT_SECRET || 'botmantra-secret-key');
      if (!claims.userId) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
      }

      req.user = {
        id: claims.userId,
        email: claims.email,
        user_metadata: {},
        owner_id: await resolveCanonicalOwnerId(nodeFactory, supabaseClient, claims.userId)
      };
      return next();
    } catch (error) {
      console.error('Vanshawali auth error:', error);
      return res.status(401).json({ success: false, error: 'Authentication failed' });
    }
  }

  router.use(requireAuth);

  function requireSelf(req, res, requestedUserId) {
    if (!requestedUserId || requestedUserId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Family access is limited to the authenticated user' });
      return false;
    }
    return true;
  }

  async function requireFamilyScope(req, res, familyId) {
    if (!familyId) {
      res.status(400).json({ success: false, error: 'Family ID is required' });
      return false;
    }
    if (familyId === req.user.id) return true;

    const result = await fetchNodeCore(supabaseClient, {
      owner_id: req.user.id,
      nid_hash: familyId,
      node_state: 'ACTIVE'
    });
    if (result.success && result.nodes.length > 0) return true;

    res.status(403).json({ success: false, error: 'Family access is limited to the authenticated user' });
    return false;
  }

  function normalizeLineageData(data) {
    if (!data) return null;
    return {
      userId: data.userId || data.user_id || null,
      family_id: data.family_id || data.familyId || null,
      familyName: data.familyName || data.family_name || null,
      gotra: data.gotra || null,
      generation: data.generation ?? 0,
      ancestryLevel: data.ancestryLevel || data.ancestry_level || 'Self',
      branch: data.branch || null,
      ancestors: data.ancestors || data.ancestor_names || [],
      descendants: data.descendants || [],
      connectedAncestors: data.connectedAncestors || data.connected_ancestors || [],
      details: data.details || data.details || null
    };
  }

  function normalizeFamilyTreeData(data) {
    if (!data) return null;
    return {
      familyId: data.family_id || data.familyId || null,
      familyName: data.family_name || data.familyName || null,
      rootAncestor: data.root_ancestor || data.rootAncestor || null,
      originRegion: data.origin_region || data.originRegion || null,
      originState: data.origin_state || data.originState || null,
      gotra: data.gotra || null,
      metadata: data.metadata || {},
      totalMembers: data.total_members ?? data.totalMembers ?? 0,
      members: data.members || [],
      createdAt: data.created_at || data.createdAt || null,
      updatedAt: data.updated_at || data.updatedAt || null
    };
  }

  // ============================================
  // GET /api/vanshawali/user-lineage/:userId
  // Get user's family lineage/ancestry
  // ============================================
  router.get('/vanshawali/user-lineage/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      if (!requireSelf(req, res, userId)) return;
      const lineage = await projectFamilyLineage(supabaseClient, { userId: req.user.owner_id || userId });
      return res.json({
        success: true,
        data: normalizeLineageData(lineage)
      });
    } catch (error) {
      console.error('Vanshawali fetch error:', error);
      return res.json({
        success: true,
        data: {
          userId: req.params.userId,
          generation: 0,
          ancestryLevel: 'Self',
          familyName: null,
          gotra: null,
          branch: null,
          ancestors: [],
          descendants: [],
          connectedAncestors: [],
          details: null
        }
      });
    }
  });

  // ============================================
  // GET /api/vanshawali/family-tree/:familyId
  // Get complete family tree
  // ============================================
  router.get('/vanshawali/family-tree/:familyId', async (req, res) => {
    try {
      const { familyId } = req.params;
      if (!await requireFamilyScope(req, res, familyId)) return;
      const treeData = await projectFamilyTree(supabaseClient, { familyId, userId: req.user.owner_id || req.user.id });
      return res.json({
        success: true,
        data: normalizeFamilyTreeData(treeData)
      });
    } catch (error) {
      console.error('Family tree fetch error:', error);
      return res.json({
        success: true,
        data: {
          family_id: req.params.familyId,
          family_name: null,
          root_ancestor: null,
          metadata: {},
          members: [],
          created_at: null,
          updated_at: null
        }
      });
    }
  });

  router.get('/vanshawali/nodes', async (req, res) => {
    try {
      const requestedOwner = req.query.owner || req.user.id;
      if (!requireSelf(req, res, requestedOwner)) return;

      const result = await nodeCore.queryNodes({
        owner_id: req.user.owner_id || req.user.id,
        node_state: 'ACTIVE'
      });
      const requestedType = String(req.query.type || '').toLowerCase();
      const allowedTypes = requestedType === 'relation'
        ? new Set(['family_node', 'relationship_node'])
        : requestedType ? new Set([requestedType]) : null;
      const nodes = (result?.nodes || [])
        .filter(node => !allowedTypes || allowedTypes.has(String(node.node_type || '').toLowerCase()))
        .map(node => ({
          node_id: node.nid_hash,
          node_type: node.node_type,
          owner_id: node.owner_id,
          parent_node: node.parent_nid_hash || null,
          created_at: node.created_at,
          metadata: decodeFromBlob(node.field_map) || {},
          node_state: node.node_state,
          node_depth: node.node_depth
        }));
      return res.json({ success: true, data: nodes, count: nodes.length });
    } catch (error) {
      console.error('Vanshawali nodes error:', error);
      return res.status(500).json({ success: false, error: 'Failed to load family nodes' });
    }
  });

  router.post('/vanshawali/family-member', async (req, res) => {
    try {
      const result = await createFamilyMember({
        nodeFactory,
        supabaseClient,
        userId: req.user.id,
        input: req.body || {}
      });
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error('Create family member error:', error);
      return res.status(500).json({ success: false, error: 'Failed to create family member' });
    }
  });

  // ============================================
  // POST /api/vanshawali/create-lineage
  // Create user family lineage entry
  // ============================================
  router.post('/vanshawali/create-lineage', async (req, res) => {
    try {
      const result = await createFamilyMember({
        nodeFactory,
        userId: req.user.id,
        input: {
          ...req.body,
          name: req.body?.name || req.body?.familyName,
          relationship: req.body?.relationship || 'child'
        }
      });
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error('Create lineage error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create family lineage'
      });
    }
  });

  // ============================================
  // GET /api/vanshawali/search
  // Search for family members or lineages
  // ============================================
  router.get('/vanshawali/search', async (req, res) => {
    try {
      const { query, familyName, gotra } = req.query;

      let dbQuery = supabaseClient
        .from('node_core')
        .select('*')
        .eq('node_state', 'ACTIVE');

      if (query) {
        dbQuery = dbQuery.ilike('field_map', `%${query}%`);
      }

      if (familyName) {
        dbQuery = dbQuery.ilike('field_map', `%"family_name":"${familyName}"%`);
      }

      if (gotra) {
        dbQuery = dbQuery.ilike('field_map', `%"gotra":"${gotra}"%`);
      }

      const { data, error } = await dbQuery.limit(50);

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    } catch (error) {
      console.error('Vanshawali search error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Search failed'
      });
    }
  });

  // ============================================
  // GET /api/vanshawali/statistics
  // Get vanshawali statistics and genealogy info
  // ============================================
  router.get('/vanshawali/statistics', async (req, res) => {
    try {
      const { count: totalUsers, error: totalUsersError } = await supabaseClient
        .from('node_core')
        .select('*', { count: 'exact', head: true })
        .eq('node_type', 'user_node');

      if (totalUsersError) throw totalUsersError;

      const { data: familyNodes, error: familyError } = await supabaseClient
        .from('node_core')
        .select('field_map')
        .eq('node_state', 'ACTIVE');

      if (familyError) throw familyError;

      const families = [...new Set((familyNodes || [])
        .map(node => {
          const fieldMap = JSON.parse(node.field_map || '{}');
          return fieldMap.family_name || fieldMap.familyName || null;
        })
        .filter(Boolean))];

      res.json({
        success: true,
        data: {
          totalUsersWithFamily: totalUsers || 0,
          uniqueFamilies: families.length,
          families: families.slice(0, 20),
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Statistics fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch statistics'
      });
    }
  });

  // ============================================
  // PUT /api/vanshawali/update-lineage/:userId
  // Update user family information
  // ============================================
  router.put('/vanshawali/update-lineage/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { familyName, gotra, generation, ancestorNames, branch, details } = req.body;

      const { data: userNodes, error: queryError } = await supabaseClient
        .from('node_core')
        .select('*')
        .eq('owner_id', userId)
        .eq('node_state', 'ACTIVE')
        .limit(1);

      if (queryError) throw queryError;

      if (!userNodes || userNodes.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Family lineage not found'
        });
      }

      const existing = userNodes[0];
      const currentFieldMap = JSON.parse(existing.field_map || '{}');
      const nextFieldMap = {
        ...currentFieldMap,
        family_name: familyName || currentFieldMap.family_name,
        familyName: familyName || currentFieldMap.familyName,
        gotra: gotra || currentFieldMap.gotra,
        generation: generation ?? currentFieldMap.generation,
        ancestor_names: ancestorNames || currentFieldMap.ancestor_names || [],
        branch: branch || currentFieldMap.branch,
        details: details || currentFieldMap.details || {}
      };

      const { data, error } = await supabaseClient
        .from('node_core')
        .update({
          field_map: nextFieldMap,
          updated_at: new Date().toISOString()
        })
        .eq('row_id', existing.row_id)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Family lineage updated successfully',
        data: data[0] || { userId, family_name: familyName, gotra, generation, ancestor_names: ancestorNames, branch, details }
      });
    } catch (error) {
      console.error('Update lineage error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update family lineage'
      });
    }
  });

  app.use('/api', router);
};
