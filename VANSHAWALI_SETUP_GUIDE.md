╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              📜 VANSHAWALI (FAMILY TREE) - DATABASE SETUP 📜               ║
║                                                                              ║
║                  Status: Ready for Supabase SQL Setup                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

This guide will help you create the Vanshawali (Family Tree) tables in Supabase.

═════════════════════════════════════════════════════════════════════════════════

🚀 QUICK START - 3 STEPS (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Open Supabase SQL Editor
────────────────────────────────
  1. Go to: https://app.supabase.com/
  2. Select your Botmantra project
  3. Click "SQL Editor" in the left sidebar
  4. Click "+ New Query" button (top right)

STEP 2: Copy & Paste SQL Code
─────────────────────────────
  1. Copy the SQL code from below (between the lines)
  2. Paste it into the SQL Editor
  3. Click the "Run" button (or Ctrl+Enter)

STEP 3: Verify Tables Created
─────────────────────────────
  1. Go to "Table Editor" in the left sidebar
  2. Look for "family_tree" and "user_family_lineage" tables
  3. Verify you see both tables with all columns

═════════════════════════════════════════════════════════════════════════════════

📋 SQL CODE TO EXECUTE IN SUPABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copy everything from the START MARKER to the END MARKER below:

---- START MARKER: Copy from here ----

-- Vanshawali (Family Tree) Tables
-- Genealogy and ancestry data for Indian families

-- Drop existing tables if they exist (for idempotency)
DROP TABLE IF EXISTS user_family_lineage CASCADE;
DROP TABLE IF EXISTS family_tree CASCADE;

-- family_tree Table - Root family definitions and structures
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

-- user_family_lineage Table - Links users to families with genealogical metadata
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

-- Enable Row Level Security (RLS)
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

---- END MARKER: Copy up to here ----

═════════════════════════════════════════════════════════════════════════════════

✅ WHAT GETS CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ family_tree Table
  Stores family definitions with:
  - Family names and root ancestors
  - Geographic origins (region, state)
  - Gotra (clan lineage)
  - Metadata and member counts

✓ user_family_lineage Table
  Stores user genealogy with:
  - User-to-family relationships
  - Generational information
  - Ancestor names and branches
  - Genealogical details

✓ Indexes (for performance)
  - Fast lookups by user_id, family_id, family_name
  - Fast gotra and generation searches
  - Creator lookups for family_tree

✓ Row Level Security (RLS)
  - Users can only see their own lineage
  - Public can view family trees
  - Secure by default

═════════════════════════════════════════════════════════════════════════════════

🔍 VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After running the SQL, verify in Supabase:

1. Go to Table Editor
2. Look for these tables:
   - ✓ family_tree
   - ✓ user_family_lineage

3. Click on family_tree and verify columns:
   - family_id (UUID)
   - family_name (VARCHAR)
   - root_ancestor (VARCHAR)
   - gotra (VARCHAR)
   - metadata (JSONB)
   - created_at, updated_at (TIMESTAMP)

4. Click on user_family_lineage and verify columns:
   - lineage_id (UUID)
   - user_id (UUID)
   - family_id (UUID)
   - family_name (VARCHAR)
   - generation (INTEGER)
   - ancestor_names (TEXT[])
   - details (JSONB)
   - created_at, updated_at (TIMESTAMP)

═════════════════════════════════════════════════════════════════════════════════

🎯 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After tables are created:

1. Backend is ready to use:
   - GET /api/vanshawali/user-lineage/:userId
   - GET /api/vanshawali/family-tree/:familyId
   - POST /api/vanshawali/create-lineage

2. UI Component (VanshawaliDisplay) will:
   - Load empty genealogy for users with no data
   - Display family trees when data exists
   - Support searching families by name/gotra

3. Test the integration:
   - Open dashboard with Vanshawali component
   - Should show "Your Lineage" tab with empty state
   - No more "Could not load genealogy" errors

═════════════════════════════════════════════════════════════════════════════════

❓ TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: "relation does not exist" error
→ Solution: Make sure you ran the SQL and see "Statements executed: X"

Issue: Tables created but component still shows error
→ Solution: Clear browser cache (Ctrl+Shift+Del) and reload

Issue: "permission denied" when inserting
→ Solution: Check RLS policies are created. Run the policy creation SQL again.

═════════════════════════════════════════════════════════════════════════════════

✨ FEATURES ENABLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After setup, you can:

✨ View Your Lineage
   - See your genealogical position
   - View generation and gotra information
   - Display ancestral details

✨ Explore Family Trees
   - Browse complete family structures
   - See all family members
   - Track multiple families

✨ Search & Discover
   - Find families by name
   - Search by gotra
   - Discover ancestors

✨ Secure Data
   - Your data is private (RLS protected)
   - Only you can see your lineage
   - Family trees are publicly viewable

═════════════════════════════════════════════════════════════════════════════════
