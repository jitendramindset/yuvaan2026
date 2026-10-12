/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  VECTOR DB CATEGORY MAPPING — Blueprint                     ║
 * ║  8 vector categories, separated vector space                 ║
 * ║  DB: vector_documents, vector_chunks, admin_memory_vectors, ║
 * ║      ai_knowledge_base, ai_semantic_cache                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * COLLECTIONS:
 *   1. layout_vectors        — Dashboard layouts + theme configs
 *   2. widget_vectors         — Reusable UI blocks
 *   3. permission_vectors     — Semantic rule logic
 *   4. relationship_vectors   — Graph memory
 *   5. content_vectors        — Posts, videos, homework, tasks
 *   6. knowledge_vectors      — RAG documents
 *   7. user_memory_vectors    — Chat history + preferences
 *   8. admin_design_vectors   — Design conversations for reuse
 */

const crypto = require('crypto');

// ─── VECTOR CATEGORIES ──────────────────────────────────────
const VECTOR_CATEGORIES = {
  layout_vectors: {
    label: 'Layout Vectors',
    description: 'Dashboard layouts and theme configurations',
    db_table: 'vector_chunks',        // primary storage
    db_source_type: 'layout_vectors', // stored in vector_documents.source_type
    node_types: ['dashboard_layout', 'theme_config'],
    searchable: true
  },
  widget_vectors: {
    label: 'Widget Vectors',
    description: 'Reusable UI widget configurations',
    db_table: 'vector_chunks',
    db_source_type: 'widget_vectors',
    node_types: ['widget'],
    searchable: true
  },
  permission_vectors: {
    label: 'Permission Vectors',
    description: 'Semantic permission and access rule logic',
    db_table: 'vector_chunks',
    db_source_type: 'permission_vectors',
    node_types: ['permission_rule', 'role_node'],
    searchable: true
  },
  relationship_vectors: {
    label: 'Relationship Vectors',
    description: 'Graph memory — connections between nodes',
    db_table: 'vector_chunks',
    db_source_type: 'relationship_vectors',
    node_types: ['relationship_rule'],
    searchable: true
  },
  content_vectors: {
    label: 'Content Vectors',
    description: 'Posts, videos, homework, tasks, documents',
    db_table: 'vector_chunks',
    db_source_type: 'content_vectors',
    node_types: ['nonliving_node'],
    searchable: true
  },
  knowledge_vectors: {
    label: 'Knowledge Vectors',
    description: 'RAG knowledge base documents',
    db_table: 'ai_knowledge_base',    // uses dedicated table
    db_source_type: 'knowledge_vectors',
    node_types: ['data_template'],
    searchable: true
  },
  user_memory_vectors: {
    label: 'User Memory Vectors',
    description: 'Chat history, preferences, interaction patterns',
    db_table: 'ai_session_memory',
    db_source_type: 'user_memory_vectors',
    node_types: ['user_node'],
    searchable: true
  },
  admin_design_vectors: {
    label: 'Admin Design Vectors',
    description: 'Admin design conversations stored for reuse',
    db_table: 'admin_memory_vectors', // uses dedicated table
    db_source_type: 'admin_design_vectors',
    node_types: ['dashboard_layout', 'widget', 'theme_config'],
    searchable: true
  }
};

// ─── MASTER VECTOR STRUCTURE ─────────────────────────────────
function createVectorEntry(nodeReference, category, content, options = {}) {
  if (!VECTOR_CATEGORIES[category]) {
    throw new Error(`Invalid category: ${category}. Valid: ${Object.keys(VECTOR_CATEGORIES).join(', ')}`);
  }

  return {
    vector_id: options.vector_id || crypto.randomUUID(),
    node_reference: nodeReference,
    category: category,
    content: content,
    semantic_tags: options.semantic_tags || [],
    visibility_scope: options.visibility_scope || 'private',
    brand_scope: options.brand_scope || null,
    role_access: options.role_access || [],
    metadata: options.metadata || {}
  };
}

// ─── VECTOR MANAGER ─────────────────────────────────────────
class VectorManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Store a vector entry in the appropriate category table
   */
  async store(nodeNidHash, category, content, options = {}) {
    const catConfig = VECTOR_CATEGORIES[category];
    if (!catConfig) throw new Error(`Unknown category: ${category}`);

    const ownerId = options.owner_id;

    // 1. Create parent document in vector_documents
    const { data: doc, error: docErr } = await this.supabase
      .from('vector_documents')
      .insert({
        source_type: catConfig.db_source_type,
        source_name: `${category}_${nodeNidHash}`,
        source_uri: nodeNidHash,
        module: category,
        access_roles: options.role_access || ['owner'],
        created_by: ownerId
      })
      .select()
      .single();

    if (docErr) throw docErr;

    // 2. Store chunk (with embedding slot) in target table
    if (catConfig.db_table === 'vector_chunks') {
      const { data: chunk, error: chunkErr } = await this.supabase
        .from('vector_chunks')
        .insert({
          document_id: doc.id,
          business_id: options.business_id || null,
          chunk_index: 0,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          metadata: {
            nid_hash: nodeNidHash,
            category: category,
            semantic_tags: options.semantic_tags || [],
            visibility_scope: options.visibility_scope || 'private',
            brand_scope: options.brand_scope || null,
            role_access: options.role_access || []
          }
        })
        .select()
        .single();

      if (chunkErr) throw chunkErr;
      return { document_id: doc.id, chunk_id: chunk.id, category };
    }

    // knowledge_vectors → ai_knowledge_base
    if (catConfig.db_table === 'ai_knowledge_base') {
      const { data, error } = await this.supabase
        .from('ai_knowledge_base')
        .insert({
          source_type: category,
          source_id: nodeNidHash,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          metadata: {
            nid_hash: nodeNidHash,
            semantic_tags: options.semantic_tags || [],
            brand_scope: options.brand_scope || null
          },
          user_id: ownerId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return { knowledge_id: data.id, document_id: doc.id, category };
    }

    // admin_design_vectors → admin_memory_vectors
    if (catConfig.db_table === 'admin_memory_vectors') {
      const { data, error } = await this.supabase
        .from('admin_memory_vectors')
        .insert({
          admin_id: ownerId,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          metadata: {
            nid_hash: nodeNidHash,
            category: category,
            semantic_tags: options.semantic_tags || [],
            brand_scope: options.brand_scope || null
          }
        })
        .select()
        .single();

      if (error) throw error;
      return { memory_id: data.id, document_id: doc.id, category };
    }

    return { document_id: doc.id, category };
  }

  /**
   * Search vectors by category with optional brand/text filtering
   */
  async search(category, query, options = {}) {
    const catConfig = VECTOR_CATEGORIES[category];
    if (!catConfig) throw new Error(`Unknown category: ${category}`);

    const limit = options.limit || 20;

    if (catConfig.db_table === 'vector_chunks') {
      let q = this.supabase
        .from('vector_chunks')
        .select('id, content, metadata, created_at, document_id')
        .limit(limit);

      // Filter by category via metadata
      if (query) {
        q = q.ilike('content', `%${query}%`);
      }
      // Filter by brand_scope in metadata
      if (options.brand_scope) {
        q = q.contains('metadata', { brand_scope: options.brand_scope });
      }

      const { data, error } = await q;
      if (error) throw error;

      // Post-filter by category metadata
      const filtered = (data || []).filter(d =>
        d.metadata?.category === category
      );

      return filtered;
    }

    if (catConfig.db_table === 'ai_knowledge_base') {
      let q = this.supabase
        .from('ai_knowledge_base')
        .select('id, content, metadata, created_at')
        .eq('source_type', category)
        .eq('is_active', true)
        .limit(limit);

      if (query) q = q.ilike('content', `%${query}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }

    if (catConfig.db_table === 'admin_memory_vectors') {
      let q = this.supabase
        .from('admin_memory_vectors')
        .select('id, content, metadata, created_at')
        .limit(limit);

      if (options.admin_id) q = q.eq('admin_id', options.admin_id);
      if (query) q = q.ilike('content', `%${query}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).filter(d => d.metadata?.category === category);
    }

    return [];
  }

  /**
   * Get all vectors for a specific node
   */
  async getByNode(nidHash) {
    const results = {};

    // Search across vector_chunks
    const { data: chunks } = await this.supabase
      .from('vector_chunks')
      .select('id, content, metadata, created_at')
      .contains('metadata', { nid_hash: nidHash });

    results.chunks = chunks || [];

    // Search ai_knowledge_base
    const { data: knowledge } = await this.supabase
      .from('ai_knowledge_base')
      .select('id, content, metadata, created_at')
      .eq('source_id', nidHash);

    results.knowledge = knowledge || [];

    return results;
  }

  /**
   * Delete vectors for a node (across all categories)
   */
  async deleteByNode(nidHash) {
    const deleted = { chunks: 0, knowledge: 0 };

    const { data: chunks } = await this.supabase
      .from('vector_chunks')
      .delete()
      .contains('metadata', { nid_hash: nidHash })
      .select('id');

    deleted.chunks = (chunks || []).length;

    const { data: kb } = await this.supabase
      .from('ai_knowledge_base')
      .delete()
      .eq('source_id', nidHash)
      .select('id');

    deleted.knowledge = (kb || []).length;

    return deleted;
  }

  /**
   * Get category statistics
   */
  async getStats() {
    const stats = {};

    for (const [cat, config] of Object.entries(VECTOR_CATEGORIES)) {
      try {
        if (config.db_table === 'vector_chunks') {
          const { count } = await this.supabase
            .from('vector_chunks')
            .select('id', { count: 'exact', head: true });
          stats[cat] = { table: config.db_table, estimated_count: count || 0 };
        } else if (config.db_table === 'ai_knowledge_base') {
          const { count } = await this.supabase
            .from('ai_knowledge_base')
            .select('id', { count: 'exact', head: true })
            .eq('source_type', cat);
          stats[cat] = { table: config.db_table, count: count || 0 };
        } else if (config.db_table === 'admin_memory_vectors') {
          const { count } = await this.supabase
            .from('admin_memory_vectors')
            .select('id', { count: 'exact', head: true });
          stats[cat] = { table: config.db_table, estimated_count: count || 0 };
        }
      } catch {
        stats[cat] = { table: config.db_table, count: 'error' };
      }
    }

    return stats;
  }

  /**
   * Store node content for a specific node in the right category
   * Auto-detects category from node_type
   */
  async autoStore(nidHash, nodeType, content, options = {}) {
    const categoryMap = {
      dashboard_layout: 'layout_vectors',
      theme_config:     'layout_vectors',
      widget:           'widget_vectors',
      permission_rule:  'permission_vectors',
      role_node:        'permission_vectors',
      relationship_rule: 'relationship_vectors',
      nonliving_node:   'content_vectors',
      data_template:    'knowledge_vectors',
      user_node:        'user_memory_vectors',
      brand_root:       'layout_vectors'
    };

    const category = categoryMap[nodeType] || 'content_vectors';
    return this.store(nidHash, category, content, options);
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────
module.exports = {
  VECTOR_CATEGORIES,
  VectorManager,
  createVectorEntry
};
