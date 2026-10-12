# Corrective Migration Object Map

## Scope

This document maps the canonical live DB objects that are missing or incomplete relative to the app runtime. The corrective migration is intentionally additive and does not drop or replace existing runtime objects.

| Object | Source migration | Required by | Dependencies | Live status | Action |
|---|---|---|---|---|---|
| `node_core` | `20260210_node_core_vector_architecture.sql` | Node runtime, kernel, graph, AI memory, permissions | none | EXISTS | KEEP |
| `node_relationships` | `20260210_node_core_vector_architecture.sql` | `node-graph.js`, `node-core-api.js`, relationships traversal | `node_core` | MISSING | CREATE |
| `node_vector_memory` | `20260210_node_core_vector_architecture.sql` | vector search, AI memory, content retrieval | `node_core`, `vector` extension | MISSING | CREATE |
| `family_tree` | `20260209_add_vanshawali_tables.sql` | `routes-vanshawali.js`, family UI | `auth.users` | MISSING | CREATE |
| `user_family_lineage` | `20260209_add_vanshawali_tables.sql` | `routes-vanshawali.js`, lineage queries | `auth.users`, `family_tree` | MISSING | CREATE |
| `get_user_lineage` | `20260209_add_vanshawali_tables.sql` | lineage API | `user_family_lineage` | UNKNOWN / missing | CREATE OR REPLACE |
| `get_family_tree_with_members` | `20260209_add_vanshawali_tables.sql` | family tree API | `family_tree`, `user_family_lineage` | UNKNOWN / missing | CREATE OR REPLACE |
| `search_families` | `20260209_add_vanshawali_tables.sql` | family search UI/API | `family_tree` | UNKNOWN / missing | CREATE OR REPLACE |
| `get_node_full` | `20260210_node_core_vector_architecture.sql` | node runtime helpers | `node_core`, graph memory | UNKNOWN / missing | REVIEW |
| `get_nodes_by_type` | `20260210_node_core_vector_architecture.sql` | node queries | `node_core` | UNKNOWN / missing | REVIEW |
| `search_similar_vectors` | `20260210_node_core_vector_architecture.sql` | vector search helpers | `node_vector_memory` | UNKNOWN / missing | REVIEW |
| `idx_relationships_parent` | `20260210_node_core_vector_architecture.sql` | graph performance | `node_relationships` | MISSING | CREATE |
| `idx_relationships_child` | `20260210_node_core_vector_architecture.sql` | graph performance | `node_relationships` | MISSING | CREATE |
| `idx_relationships_type` | `20260210_node_core_vector_architecture.sql` | graph performance | `node_relationships` | MISSING | CREATE |
| `idx_relationships_unique` | `20260210_node_core_vector_architecture.sql` | uniqueness and dedupe | `node_relationships` | MISSING | CREATE |
| `idx_vector_memory_embedding` | `20260210_node_core_vector_architecture.sql` | vector similarity lookup | `node_vector_memory` | MISSING | CREATE |
| `idx_vector_memory_node` | `20260210_node_core_vector_architecture.sql` | query speed | `node_vector_memory` | MISSING | CREATE |
| `idx_vector_memory_type` | `20260210_node_core_vector_architecture.sql` | query speed | `node_vector_memory` | MISSING | CREATE |
| `idx_family_tree_family_name` | `20260209_add_vanshawali_tables.sql` | family lookup | `family_tree` | MISSING | CREATE |
| `idx_user_family_lineage_user_id` | `20260209_add_vanshawali_tables.sql` | lineage lookup | `user_family_lineage` | MISSING | CREATE |
| `family_tree` RLS policies | `20260209_add_vanshawali_tables.sql` | access control | `family_tree` | MISSING | CREATE |
| `user_family_lineage` RLS policies | `20260209_add_vanshawali_tables.sql` | access control | `user_family_lineage` | MISSING | CREATE |
| `node_vector_memory` RLS policy | `20260210_node_core_vector_architecture.sql` | visualize memory safely | `node_core`, `node_vector_memory` | MISSING | CREATE |
| `node_relationships` RLS policy | `20260210_node_core_vector_architecture.sql` | graph visibility | `node_core`, `node_relationships` | MISSING | CREATE |
| `vector` extension | `20260210_node_core_vector_architecture.sql` | embeddings and similarity search | Postgres extension | UNKNOWN | CREATE IF NOT EXISTS |
| `pgcrypto` extension | `20260209_add_vanshawali_tables.sql` | `gen_random_uuid()` support | Postgres extension | UNKNOWN | CREATE IF NOT EXISTS |

## Notes

- `node_core` is treated as an existing live object and is not recreated.
- Any action is intentionally additive only.
- No object is marked for `DROP` or `REPLACE` beyond safe function recreation.
- `CREATE OR REPLACE FUNCTION` is allowed only for runtime-required functions that are already part of the canonical contract.
- The migration leaves existing tables and data untouched unless the object is absent.
