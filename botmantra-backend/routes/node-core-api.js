/**
 * NODE CORE API - Complete CRUD Operations for Neural OS
 * Endpoints for managing nodes, vectors, and relationships
 * 
 * All data is stored as Nodes. No relational tables.
 */

const express = require('express');
const { supabase } = require('../config/supabase');

module.exports = function setupNodeCoreAPI(app) {
  const router = express.Router();

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🧠 NODE CORE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/nodes/create
   * Create a new node in the system
   */
  router.post('/nodes/create', async (req, res) => {
    try {
      const {
        node_type,
        node_name,
        node_description = null,
        node_code = null,
        parent_node = null,
        owner_node = null,
        visibility = 'private',
        permissions = { read: [], write: [], admin: [] },
        metadata = {},
        ui_schema = { widgets: [], theme: 'default', layout: 'feed' }
      } = req.body;

      // Validate required fields
      if (!node_type || !node_name) {
        return res.status(400).json({
          success: false,
          error: 'node_type and node_name are required'
        });
      }

      const { data, error } = await supabase
        .from('node_core')
        .insert([{
          node_type,
          node_name,
          node_description,
          node_code,
          parent_node: parent_node || null,
          owner_node: owner_node || (req.user?.id || null),
          visibility,
          permissions,
          metadata,
          ui_schema
        }])
        .select();

      if (error) throw error;

      res.json({
        success: true,
        data: data[0],
        message: `${node_type} node created successfully`
      });
    } catch (error) {
      console.error('Node creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nodes/:nodeId
   * Get a single node with all its data (node + vectors + relationships)
   */
  router.get('/nodes/:nodeId', async (req, res) => {
    try {
      const { nodeId } = req.params;

      // Get node core
      const { data: nodeData, error: nodeError } = await supabase
        .from('node_core')
        .select('*')
        .eq('node_id', nodeId)
        .single();

      if (nodeError) {
        return res.status(404).json({
          success: false,
          error: 'Node not found'
        });
      }

      // Get vector memory
      const { data: vectors } = await supabase
        .from('node_vector_memory')
        .select('*')
        .eq('node_id', nodeId);

      // Get relationships
      const { data: relationships } = await supabase
        .from('node_relationships')
        .select('*')
        .eq('parent_node', nodeId);

      res.json({
        success: true,
        data: {
          node: nodeData,
          vectors: vectors || [],
          relationships: relationships || []
        }
      });
    } catch (error) {
      console.error('Node fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nodes/type/:nodeType
   * Get all nodes of a specific type
   */
  router.get('/nodes/type/:nodeType', async (req, res) => {
    try {
      const { nodeType } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const { data, error, count } = await supabase
        .from('node_core')
        .select('*', { count: 'exact' })
        .eq('node_type', nodeType)
        .is('deleted_at', null)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data,
        pagination: { limit, offset, total: count }
      });
    } catch (error) {
      console.error('Node type fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nodes/code/:nodeCode
   * Get node by code (e.g., 'botmantra', 'vanshavali')
   */
  router.get('/nodes/code/:nodeCode', async (req, res) => {
    try {
      const { nodeCode } = req.params;

      const { data, error } = await supabase
        .from('node_core')
        .select('*')
        .eq('node_code', nodeCode)
        .single();

      if (error) {
        return res.status(404).json({
          success: false,
          error: 'Node not found'
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Node code fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PUT /api/nodes/:nodeId
   * Update node (metadata, ui_schema, permissions, visibility)
   */
  router.put('/nodes/:nodeId', async (req, res) => {
    try {
      const { nodeId } = req.params;
      const {
        node_name = null,
        node_description = null,
        metadata = null,
        ui_schema = null,
        permissions = null,
        visibility = null
      } = req.body;

      const updateData = {};
      if (node_name) updateData.node_name = node_name;
      if (node_description) updateData.node_description = node_description;
      if (metadata) updateData.metadata = metadata;
      if (ui_schema) updateData.ui_schema = ui_schema;
      if (permissions) updateData.permissions = permissions;
      if (visibility) updateData.visibility = visibility;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('node_core')
        .update(updateData)
        .eq('node_id', nodeId)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        data: data[0],
        message: 'Node updated successfully'
      });
    } catch (error) {
      console.error('Node update error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/nodes/:nodeId
   * Soft delete node (sets deleted_at)
   */
  router.delete('/nodes/:nodeId', async (req, res) => {
    try {
      const { nodeId } = req.params;

      const { data, error } = await supabase
        .from('node_core')
        .update({ deleted_at: new Date().toISOString() })
        .eq('node_id', nodeId)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Node deleted successfully'
      });
    } catch (error) {
      console.error('Node delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🧬 VECTOR MEMORY OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/vectors/add
   * Add vector embedding to a node
   */
  router.post('/vectors/add', async (req, res) => {
    try {
      const {
        node_id,
        content,
        content_type = 'general',
        heading = null,
        sub_heading = null,
        section = null,
        embedding = null, // Array of 1536 floats from OpenAI
        metadata = {}
      } = req.body;

      if (!node_id || !content) {
        return res.status(400).json({
          success: false,
          error: 'node_id and content are required'
        });
      }

      const { data, error } = await supabase
        .from('node_vector_memory')
        .insert([{
          node_id,
          content,
          content_type,
          heading,
          sub_heading,
          section,
          embedding: embedding ? JSON.stringify(embedding) : null,
          metadata
        }])
        .select();

      if (error) throw error;

      res.json({
        success: true,
        data: data[0],
        message: 'Vector memory created'
      });
    } catch (error) {
      console.error('Vector creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/vectors/node/:nodeId
   * Get all vectors (memories) for a node
   */
  router.get('/vectors/node/:nodeId', async (req, res) => {
    try {
      const { nodeId } = req.params;

      const { data, error } = await supabase
        .from('node_vector_memory')
        .select('*')
        .eq('node_id', nodeId);

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Vector fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/vectors/search
   * Vector similarity search (RAG)
   */
  router.post('/vectors/search', async (req, res) => {
    try {
      const {
        query_embedding,
        limit = 10,
        content_type = null
      } = req.body;

      if (!query_embedding) {
        return res.status(400).json({
          success: false,
          error: 'query_embedding is required'
        });
      }

      // Use pgvector similarity search
      let q = supabase
        .from('node_vector_memory')
        .select('*, node_id, content, (1 - (embedding <=> ${embedding})) as similarity');

      if (content_type) {
        q = q.eq('content_type', content_type);
      }

      const { data, error } = await q
        .order('similarity', { ascending: false })
        .limit(limit);

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Vector search error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🔁 NODE RELATIONSHIP OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/relationships/create
   * Create relationship between two nodes
   */
  router.post('/relationships/create', async (req, res) => {
    try {
      const {
        parent_node,
        child_node,
        relation_type,
        metadata = {}
      } = req.body;

      if (!parent_node || !child_node || !relation_type) {
        return res.status(400).json({
          success: false,
          error: 'parent_node, child_node, and relation_type are required'
        });
      }

      const { data, error } = await supabase
        .from('node_relationships')
        .insert([{
          parent_node,
          child_node,
          relation_type,
          metadata
        }])
        .select();

      if (error) throw error;

      res.json({
        success: true,
        data: data[0],
        message: 'Relationship created'
      });
    } catch (error) {
      console.error('Relationship creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/relationships/parent/:parentNodeId
   * Get all children of a node
   */
  router.get('/relationships/parent/:parentNodeId', async (req, res) => {
    try {
      const { parentNodeId } = req.params;

      const { data, error } = await supabase
        .from('node_relationships')
        .select(`
          *,
          child:child_node(*)
        `)
        .eq('parent_node', parentNodeId);

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Relationship fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/relationships/child/:childNodeId
   * Get all parents of a node
   */
  router.get('/relationships/child/:childNodeId', async (req, res) => {
    try {
      const { childNodeId } = req.params;

      const { data, error } = await supabase
        .from('node_relationships')
        .select(`
          *,
          parent:parent_node(*)
        `)
        .eq('child_node', childNodeId);

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Relationship fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/relationships/:relationshipId
   * Remove relationship
   */
  router.delete('/relationships/:relationshipId', async (req, res) => {
    try {
      const { relationshipId } = req.params;

      const { error } = await supabase
        .from('node_relationships')
        .delete()
        .eq('relationship_id', relationshipId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Relationship deleted'
      });
    } catch (error) {
      console.error('Relationship delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🎯 SPECIALIZED ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/brands
   * Get all brand root nodes
   */
  router.get('/brands', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('node_core')
        .select('*')
        .eq('node_type', 'brand')
        .is('deleted_at', null);

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        message: `Found ${data?.length || 0} brands`
      });
    } catch (error) {
      console.error('Brands fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/nodes/link-to-brand
   * Link a user/entity node to a brand root
   */
  router.post('/nodes/link-to-brand', async (req, res) => {
    try {
      const { node_id, brand_code } = req.body;

      // Get brand node
      const { data: brandData, error: brandError } = await supabase
        .from('node_core')
        .select('node_id')
        .eq('node_code', brand_code)
        .single();

      if (brandError) {
        return res.status(404).json({
          success: false,
          error: 'Brand not found'
        });
      }

      // Create relationship
      const { data, error } = await supabase
        .from('node_relationships')
        .insert([{
          parent_node: brandData.node_id,
          child_node: node_id,
          relation_type: 'member_of'
        }])
        .select();

      if (error) throw error;

      res.json({
        success: true,
        data: data[0],
        message: `Node linked to ${brand_code}`
      });
    } catch (error) {
      console.error('Brand link error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/nodes/tree/:nodeId
   * Get complete node tree (recursive children)
   */
  router.get('/nodes/tree/:nodeId', async (req, res) => {
    try {
      const { nodeId } = req.params;

      // Recursive CTE to get full tree
      const { data, error } = await supabase.rpc('get_node_tree', {
        p_node_id: nodeId
      });

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Tree fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.use('/api', router);
};
