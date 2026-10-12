-- ═══════════════════════════════════════════════════════════════════════════════
-- NEURAL OPERATING SYSTEM - NODE CORE ARCHITECTURE
-- Three Core Tables Only (Everything = Node + Vector + Metadata)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🧠 TABLE 1: NODE CORE (The Brain)
-- Every entity in the system is a Node
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS node_relationships CASCADE;
DROP TABLE IF EXISTS node_vector_memory CASCADE;
DROP TABLE IF EXISTS node_core CASCADE;

CREATE TABLE node_core (
  node_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Node Identity
  node_type VARCHAR(50) NOT NULL, -- 'user', 'brand', 'layout', 'post', 'family', 'company', 'course', etc.
  node_code VARCHAR(100), -- 'botmantra', 'vanshavali', 'mantravat', etc.
  node_name VARCHAR(255) NOT NULL,
  node_description TEXT,
  
  -- Hierarchy
  parent_node UUID REFERENCES node_core(node_id) ON DELETE SET NULL, -- Parent in graph
  owner_node UUID REFERENCES node_core(node_id) ON DELETE CASCADE, -- Who owns this node
  
  -- Visibility & Access
  visibility VARCHAR(20) DEFAULT 'private', -- 'private' | 'family' | 'public'
  
  -- Permissions as JSONB (flexible, not hardcoded)
  permissions JSONB DEFAULT '{
    "read": [],
    "write": [],
    "admin": []
  }'::jsonb,
  
  -- Metadata (Everything about the node)
  metadata JSONB DEFAULT '{}'::jsonb, -- age, theme, business_type, status, etc.
  
  -- UI Layout Definition (stored inside node)
  ui_schema JSONB DEFAULT '{
    "widgets": [],
    "theme": "default",
    "layout": "feed"
  }'::jsonb,
  
  -- Vector Memory Reference
  vector_id UUID, -- Links to node_vector_memory for embedding
  
  -- Lifecycle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_node_type CHECK (LENGTH(TRIM(node_type)) > 0),
  CONSTRAINT valid_node_name CHECK (LENGTH(TRIM(node_name)) > 0),
  CONSTRAINT valid_visibility CHECK (visibility IN ('private', 'family', 'public')),
  CONSTRAINT no_self_parent CHECK (node_id != parent_node)
);

-- Indexes for fast traversal
CREATE INDEX idx_node_core_type ON node_core(node_type);
CREATE INDEX idx_node_core_parent ON node_core(parent_node);
CREATE INDEX idx_node_core_owner ON node_core(owner_node);
CREATE INDEX idx_node_core_code ON node_core(node_code);
CREATE INDEX idx_node_core_visibility ON node_core(visibility);
CREATE INDEX idx_node_core_created ON node_core(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🧬 TABLE 2: NODE VECTOR MEMORY (The Semantic Store)
-- Vector embeddings + context for RAG & AI
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE node_vector_memory (
  vector_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES node_core(node_id) ON DELETE CASCADE,
  
  -- Content & Context
  content TEXT NOT NULL, -- lecture, post, description, etc.
  content_type VARCHAR(50), -- 'course_material', 'post', 'comment', 'description'
  
  -- Hierarchical Tagging
  heading VARCHAR(255),
  sub_heading VARCHAR(255),
  section VARCHAR(100),
  
  -- Vector Embedding (pgvector)
  embedding vector(1536), -- OpenAI embedding dimension
  
  -- Metadata for RAG
  metadata JSONB DEFAULT '{}'::jsonb, -- language, author, source, etc.
  
  -- Similarity tracking
  similarity_score FLOAT,
  
  -- Lifecycle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_content CHECK (LENGTH(TRIM(content)) > 0)
);

-- Vector similarity index for fast search
CREATE INDEX idx_vector_memory_embedding ON node_vector_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_vector_memory_node ON node_vector_memory(node_id);
CREATE INDEX idx_vector_memory_type ON node_vector_memory(content_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔁 TABLE 3: NODE RELATIONSHIPS (The Graph Connections)
-- Replaces all foreign keys with explicit relationship semantics
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE node_relationships (
  relationship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Nodes being connected
  parent_node UUID NOT NULL REFERENCES node_core(node_id) ON DELETE CASCADE,
  child_node UUID NOT NULL REFERENCES node_core(node_id) ON DELETE CASCADE,
  
  -- Relationship Semantics (replaces traditional FK labels)
  relation_type VARCHAR(50) NOT NULL, -- 'member_of', 'enrolled_in', 'owns', 'invited', 'follows', 'creates', 'contributes'
  
  -- Relationship metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- status: 'pending' | 'active' | 'blocked', since_date, role, etc.
  
  -- Lifecycle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_relation CHECK (parent_node != child_node),
  CONSTRAINT valid_relation_type CHECK (LENGTH(TRIM(relation_type)) > 0)
);

-- Indexes for graph traversal
CREATE INDEX idx_relationships_parent ON node_relationships(parent_node);
CREATE INDEX idx_relationships_child ON node_relationships(child_node);
CREATE INDEX idx_relationships_type ON node_relationships(relation_type);
CREATE UNIQUE INDEX idx_relationships_unique ON node_relationships(parent_node, child_node, relation_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔐 ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE node_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_vector_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_relationships ENABLE ROW LEVEL SECURITY;

-- Public access for public nodes
CREATE POLICY "public_nodes_visible" ON node_core
  FOR SELECT USING (visibility = 'public');

-- Users can see nodes they own
CREATE POLICY "own_nodes_visible" ON node_core
  FOR SELECT USING (owner_node = auth.uid() OR auth.role() = 'service_role');

-- Service role has full access
CREATE POLICY "service_role_all_access" ON node_core
  FOR ALL USING (auth.role() = 'service_role');

-- Vector memory follows node visibility
CREATE POLICY "vector_memory_visibility" ON node_vector_memory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM node_core nc
      WHERE nc.node_id = node_vector_memory.node_id
      AND (nc.visibility = 'public' OR nc.owner_node = auth.uid() OR auth.role() = 'service_role')
    )
  );

-- Relationships visible based on connected nodes
CREATE POLICY "relationships_visible" ON node_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM node_core nc1, node_core nc2
      WHERE nc1.node_id = parent_node AND nc2.node_id = child_node
      AND (nc1.visibility = 'public' OR nc2.visibility = 'public' OR 
           nc1.owner_node = auth.uid() OR nc2.owner_node = auth.uid() OR
           auth.role() = 'service_role')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🧠 HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get full node tree (node + vector memory + relationships)
CREATE OR REPLACE FUNCTION get_node_full(p_node_id UUID)
RETURNS TABLE (
  node_data JSONB,
  vector_context JSONB,
  child_relationships JSONB
) AS $$
DECLARE
  v_node_data JSONB;
  v_vector_data JSONB;
  v_relationships JSONB;
BEGIN
  -- Get node core
  SELECT row_to_json(nc.*) INTO v_node_data
  FROM node_core nc
  WHERE nc.node_id = p_node_id;

  -- Get vector memory
  SELECT COALESCE(jsonb_agg(row_to_json(nvm.*)), '[]'::jsonb) INTO v_vector_data
  FROM node_vector_memory nvm
  WHERE nvm.node_id = p_node_id;

  -- Get relationships
  SELECT COALESCE(jsonb_agg(row_to_json(nr.*)), '[]'::jsonb) INTO v_relationships
  FROM node_relationships nr
  WHERE nr.parent_node = p_node_id;

  RETURN QUERY SELECT v_node_data, v_vector_data, v_relationships;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get nodes by type
CREATE OR REPLACE FUNCTION get_nodes_by_type(p_node_type VARCHAR)
RETURNS TABLE (node_data JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT row_to_json(nc.*)
  FROM node_core nc
  WHERE nc.node_type = p_node_type AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vector similarity search
CREATE OR REPLACE FUNCTION search_similar_vectors(
  p_embedding vector,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  node_id UUID,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nvm.node_id,
    nvm.content,
    (1 - (nvm.embedding <=> p_embedding)) as similarity
  FROM node_vector_memory nvm
  WHERE nvm.embedding IS NOT NULL
  ORDER BY nvm.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 👑 GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT ALL ON node_core TO service_role;
GRANT ALL ON node_vector_memory TO service_role;
GRANT ALL ON node_relationships TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🌱 BRAND ROOT NODES (Initial Setup)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Admin SuperNode (The Root of All Roots)
INSERT INTO node_core (node_type, node_name, node_description, node_code, owner_node, visibility, metadata, ui_schema)
VALUES (
  'admin',
  'Admin SuperNode',
  'Root governance node for entire system',
  'admin_super',
  NULL, -- Self-owned
  'private',
  '{"role": "superadmin", "permissions_level": "unlimited"}',
  '{"dashboard": {"widgets": ["brand_manager", "user_manager", "vector_indexer", "audit_log"]}}'
) ON CONFLICT DO NOTHING;

-- Get admin ID for relationships
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT node_id INTO v_admin_id FROM node_core WHERE node_code = 'admin_super';

  -- 1. Vanshavali (Social/Family Platform)
  INSERT INTO node_core (node_type, node_name, node_description, node_code, parent_node, owner_node, visibility, metadata, ui_schema)
  VALUES (
    'brand',
    'Vanshavali',
    'Social & Family Tree Platform',
    'vanshavali',
    v_admin_id,
    v_admin_id,
    'public',
    '{"theme": "warm", "target_audience": "families", "base_color": "#FF6B6B"}',
    '{"layout": "social_feed", "widgets": ["story_bar", "family_tree", "activity_feed", "community_events"]}'
  );

  -- 2. Mantravat (Business Builder Platform)
  INSERT INTO node_core (node_type, node_name, node_description, node_code, parent_node, owner_node, visibility, metadata, ui_schema)
  VALUES (
    'brand',
    'Mantravat',
    'Business Creation & Management Platform',
    'mantravat',
    v_admin_id,
    v_admin_id,
    'public',
    '{"theme": "professional", "target_audience": "entrepreneurs", "base_color": "#5A4FFF"}',
    '{"layout": "business_dashboard", "widgets": ["company_manager", "employee_hub", "sales_kpi", "workflow_builder", "invoice_system"]}'
  );

  -- 3. Jeetmantra (Education Platform)
  INSERT INTO node_core (node_type, node_name, node_description, node_code, parent_node, owner_node, visibility, metadata, ui_schema)
  VALUES (
    'brand',
    'Jeetmantra',
    'Education & Learning Platform',
    'jeetmantra',
    v_admin_id,
    v_admin_id,
    'public',
    '{"theme": "academic", "target_audience": "students_teachers", "base_color": "#2ECC71"}',
    '{"layout": "edu_dashboard", "widgets": ["course_manager", "lecture_hall", "homework_tracker", "progress_analytics", "attendance_system"]}'
  );

  -- 4. JuniorMantra (Kids Safe Platform)
  INSERT INTO node_core (node_type, node_name, node_description, node_code, parent_node, owner_node, visibility, metadata, ui_schema)
  VALUES (
    'brand',
    'JuniorMantra',
    'Safe Learning Platform for Kids',
    'juniormantra',
    v_admin_id,
    v_admin_id,
    'public',
    '{"theme": "kids_friendly", "target_audience": "children_5_12", "base_color": "#F39C12", "age_filter": true}',
    '{"layout": "kids_ui", "widgets": ["animated_lessons", "safe_activities", "parent_dashboard", "progress_tracker"]}'
  );

  -- 5. Botmantra (User Router Platform)
  INSERT INTO node_core (node_type, node_name, node_description, node_code, parent_node, owner_node, visibility, metadata, ui_schema)
  VALUES (
    'brand',
    'Botmantra',
    'Intelligent User Registration & Routing',
    'botmantra',
    v_admin_id,
    v_admin_id,
    'public',
    '{"theme": "assistant", "target_audience": "all_new_users", "base_color": "#3498DB"}',
    '{"layout": "onboarding", "widgets": ["age_detector", "brand_suggester", "user_creator", "preference_mapper"]}'
  );
END$$;

-- ═══════════════════════════════════════════════════════════════════════════════
