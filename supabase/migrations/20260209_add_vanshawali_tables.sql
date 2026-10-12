-- ====================================================
-- Vanshawali (Family Tree) Tables
-- Genealogy and ancestry data for Indian families
-- ====================================================

-- Drop existing tables if they exist (for idempotency)
DROP TABLE IF EXISTS user_family_lineage CASCADE;
DROP TABLE IF EXISTS family_tree CASCADE;

-- ====================================================
-- family_tree Table
-- Root family definitions and structures
-- ====================================================
CREATE TABLE IF NOT EXISTS family_tree (
  family_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_name VARCHAR(255) NOT NULL,
  root_ancestor VARCHAR(255),
  origin_region VARCHAR(255),
  origin_state VARCHAR(255),
  gotra VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  total_members INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_family_name CHECK (LENGTH(TRIM(family_name)) > 0)
);

-- Create indexes for family_tree
CREATE INDEX idx_family_tree_family_name ON family_tree(family_name);
CREATE INDEX idx_family_tree_root_ancestor ON family_tree(root_ancestor);
CREATE INDEX idx_family_tree_gotra ON family_tree(gotra);
CREATE INDEX idx_family_tree_created_by ON family_tree(created_by);

-- ====================================================
-- user_family_lineage Table
-- Links users to families with genealogical metadata
-- ====================================================
CREATE TABLE IF NOT EXISTS user_family_lineage (
  lineage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES family_tree(family_id) ON DELETE SET NULL,
  family_name VARCHAR(255) NOT NULL,
  gotra VARCHAR(255),
  generation INTEGER DEFAULT 0,
  ancestor_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  branch VARCHAR(255),
  ancestry_level VARCHAR(50) DEFAULT 'Self',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_family_name_lineage CHECK (LENGTH(TRIM(family_name)) > 0),
  CONSTRAINT valid_generation CHECK (generation >= 0)
);

-- Create indexes for user_family_lineage
CREATE INDEX idx_user_family_lineage_user_id ON user_family_lineage(user_id);
CREATE INDEX idx_user_family_lineage_family_id ON user_family_lineage(family_id);
CREATE INDEX idx_user_family_lineage_family_name ON user_family_lineage(family_name);
CREATE INDEX idx_user_family_lineage_gotra ON user_family_lineage(gotra);
CREATE INDEX idx_user_family_lineage_generation ON user_family_lineage(generation);

-- ====================================================
-- RPC Functions for Vanshawali
-- ====================================================

-- Function to get user's lineage with family tree data
CREATE OR REPLACE FUNCTION get_user_lineage(p_user_id UUID)
RETURNS TABLE (
  lineage_id UUID,
  user_id UUID,
  family_id UUID,
  family_name VARCHAR,
  gotra VARCHAR,
  generation INTEGER,
  ancestor_names TEXT[],
  branch VARCHAR,
  ancestry_level VARCHAR,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ufl.lineage_id,
    ufl.user_id,
    ufl.family_id,
    ufl.family_name,
    ufl.gotra,
    ufl.generation,
    ufl.ancestor_names,
    ufl.branch,
    ufl.ancestry_level,
    ufl.details,
    ufl.created_at,
    ufl.updated_at
  FROM user_family_lineage ufl
  WHERE ufl.user_id = p_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get family tree with members
CREATE OR REPLACE FUNCTION get_family_tree_with_members(p_family_id UUID)
RETURNS TABLE (
  family_id UUID,
  family_name VARCHAR,
  root_ancestor VARCHAR,
  origin_region VARCHAR,
  origin_state VARCHAR,
  gotra VARCHAR,
  metadata JSONB,
  total_members INTEGER,
  members JSONB
) AS $$
DECLARE
  v_members JSONB;
BEGIN
  -- Aggregate members data
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', ufl.user_id,
    'family_name', ufl.family_name,
    'generation', ufl.generation,
    'gotra', ufl.gotra
  )), '[]'::jsonb) INTO v_members
  FROM user_family_lineage ufl
  WHERE ufl.family_id = p_family_id;

  RETURN QUERY
  SELECT 
    ft.family_id,
    ft.family_name,
    ft.root_ancestor,
    ft.origin_region,
    ft.origin_state,
    ft.gotra,
    ft.metadata,
    ft.total_members,
    v_members
  FROM family_tree ft
  WHERE ft.family_id = p_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search families by name or gotra
CREATE OR REPLACE FUNCTION search_families(p_search_term VARCHAR)
RETURNS TABLE (
  family_id UUID,
  family_name VARCHAR,
  gotra VARCHAR,
  total_members INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.family_id,
    ft.family_name,
    ft.gotra,
    ft.total_members
  FROM family_tree ft
  WHERE ft.family_name ILIKE '%' || p_search_term || '%'
     OR ft.gotra ILIKE '%' || p_search_term || '%'
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- Enable Row Level Security (RLS)
-- ====================================================
ALTER TABLE family_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_family_lineage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_tree
CREATE POLICY "Anyone can view family trees"
  ON family_tree FOR SELECT
  USING (true);

CREATE POLICY "Only creators can update their family trees"
  ON family_tree FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create family trees"
  ON family_tree FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for user_family_lineage
CREATE POLICY "Users can view their own lineage"
  ON user_family_lineage FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own lineage"
  ON user_family_lineage FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lineage"
  ON user_family_lineage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ====================================================
-- Grant permissions to service role
-- ====================================================
GRANT ALL PRIVILEGES ON family_tree TO service_role;
GRANT ALL PRIVILEGES ON user_family_lineage TO service_role;
GRANT ALL PRIVILEGES ON SEQUENCE family_tree_id_seq TO service_role;
GRANT ALL PRIVILEGES ON SEQUENCE user_family_lineage_id_seq TO service_role;
GRANT EXECUTE ON FUNCTION get_user_lineage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_family_tree_with_members(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION search_families(VARCHAR) TO service_role;

-- ====================================================
-- Sample Data (Optional - for testing)
-- ====================================================
-- Uncomment to add sample data for testing

-- INSERT INTO family_tree (family_name, root_ancestor, gotra, origin_state, total_members)
-- VALUES 
--   ('Sharma', 'Maharishi Vishvamitra', 'Bhargava', 'Uttar Pradesh', 0),
--   ('Patel', 'Vallabh Bhai Patel', 'Vashistha', 'Gujarat', 0),
--   ('Verma', 'Raja Vikramaditya', 'Kausika', 'Madhya Pradesh', 0);
