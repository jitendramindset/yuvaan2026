# Migration Object Map

## Canonical objects under review

### `node_core`

- Source migration: `supabase/migrations/20260210_node_core_vector_architecture.sql`
- Also present in earlier baseline migrations under `botmantra-backend/supabase/migrations/20260206_full_schema_baseline.sql`
- Create actions:
  - `CREATE TABLE node_core (...)`
- Indexes:
  - `idx_node_core_type`
  - `idx_node_core_parent`
  - `idx_node_core_owner`
  - `idx_node_core_code`
  - `idx_node_core_visibility`
  - `idx_node_core_created`
- RLS:
  - `ALTER TABLE node_core ENABLE ROW LEVEL SECURITY;`
  - policies: `public_nodes_visible`, `own_nodes_visible`, `service_role_all_access`
- Functions:
  - `get_node_full`, `get_nodes_by_type`, `search_similar_vectors`
- Status in live DB: exists, partially aligned

### `node_relationships`

- Source migration: `supabase/migrations/20260210_node_core_vector_architecture.sql`
- Create actions:
  - `CREATE TABLE node_relationships (...)`
- Indexes:
  - `idx_relationships_parent`
  - `idx_relationships_child`
  - `idx_relationships_type`
  - `idx_relationships_unique`
- RLS:
  - `ALTER TABLE node_relationships ENABLE ROW LEVEL SECURITY;`
- Policies:
  - `relationships_visible`
- Status in live DB: missing

### `node_vector_memory`

- Source migration: `supabase/migrations/20260210_node_core_vector_architecture.sql`
- Create actions:
  - `CREATE TABLE node_vector_memory (...)`
- Indexes:
  - `idx_vector_memory_embedding` (pgvector IVFFLAT)
  - `idx_vector_memory_node`
  - `idx_vector_memory_type`
- RLS:
  - `ALTER TABLE node_vector_memory ENABLE ROW LEVEL SECURITY;`
- Policies:
  - `vector_memory_visibility`
- Status in live DB: missing

### `family_tree`

- Source migration: `supabase/migrations/20260209_add_vanshawali_tables.sql`
- Create actions:
  - `CREATE TABLE IF NOT EXISTS family_tree (...)`
- Indexes:
  - `idx_family_tree_family_name`
  - `idx_family_tree_root_ancestor`
  - `idx_family_tree_gotra`
  - `idx_family_tree_created_by`
- RLS:
  - `ALTER TABLE family_tree ENABLE ROW LEVEL SECURITY;`
- Policies:
  - `Anyone can view family trees`
  - `Only creators can update their family trees`
  - `Authenticated users can create family trees`
- Functions:
  - `get_family_tree_with_members`
  - `search_families`
- Status in live DB: missing

### `user_family_lineage`

- Source migration: `supabase/migrations/20260209_add_vanshawali_tables.sql`
- Create actions:
  - `CREATE TABLE IF NOT EXISTS user_family_lineage (...)`
- Indexes:
  - `idx_user_family_lineage_user_id`
  - `idx_user_family_lineage_family_id`
  - `idx_user_family_lineage_family_name`
  - `idx_user_family_lineage_gotra`
  - `idx_user_family_lineage_generation`
- RLS:
  - `ALTER TABLE user_family_lineage ENABLE ROW LEVEL SECURITY;`
- Policies:
  - `Users can view their own lineage`
  - `Users can update their own lineage`
  - `Users can insert their own lineage`
- Functions:
  - `get_user_lineage`
- Status in live DB: missing

## Object dependency graph

```text
node_core
├── created by 20260210_node_core_vector_architecture.sql
├── required by node_vector_memory (FK to node_core)
├── required by node_relationships (FKs to node_core)
├── required by Node OS runtime
└── partially present in live DB

node_vector_memory
├── created by 20260210_node_core_vector_architecture.sql
├── references node_core(node_id)
├── depends on pgvector extension
└── missing in live DB

node_relationships
├── created by 20260210_node_core_vector_architecture.sql
├── references node_core(node_id)
├── graph/traversal layer for Node OS
└── missing in live DB

family_tree
├── created by 20260209_add_vanshawali_tables.sql
├── references auth.users(created_by)
├── family projection layer
└── missing in live DB

user_family_lineage
├── created by 20260209_add_vanshawali_tables.sql
├── references auth.users(id)
├── references family_tree(family_id)
├── family projection layer for user relationships
└── missing in live DB
```

## Summary

The missing objects are not random. They are a coherent slice of the canonical architecture:

- Node OS core objects are missing together
- family projection objects are missing together
- the repo expects them as a single coherent canonical schema set
