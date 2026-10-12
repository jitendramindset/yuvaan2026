-- Vanshawali (Genealogy) tables

CREATE TABLE IF NOT EXISTS family_tree (
  family_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name text,
  root_ancestor text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_family_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  family_id uuid REFERENCES family_tree(family_id) ON DELETE SET NULL,
  family_name text,
  gotra text,
  generation integer DEFAULT 0,
  ancestor_names jsonb DEFAULT '[]'::jsonb,
  branch text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_family_lineage_user_id ON user_family_lineage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_family_lineage_family_id ON user_family_lineage(family_id);
CREATE INDEX IF NOT EXISTS idx_family_tree_name ON family_tree(family_name);
