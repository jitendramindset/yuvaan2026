# Target Database Objects

## Canonical target set

| Object | Source migration | Purpose | Depends on | Currently exists in live DB | Required | Risk |
|---|---|---|---|---|---|---|
| `node_core` | `20260210_node_core_vector_architecture.sql` | core node identity + runtime metadata | none | Yes | Yes | Medium |
| `node_relationships` | `20260210_node_core_vector_architecture.sql` | graph edges and node topology | `node_core` | No | Yes | High |
| `node_vector_memory` | `20260210_node_core_vector_architecture.sql` | semantic storage and AI memory | `node_core`, pgvector | No | Yes | High |
| `family_tree` | `20260209_add_vanshawali_tables.sql` | family definition / root structure | `auth.users` | No | Yes | Medium |
| `user_family_lineage` | `20260209_add_vanshawali_tables.sql` | family linkage for users | `auth.users`, `family_tree` | No | Yes | Medium |
| `get_node_full()` | `20260210_node_core_vector_architecture.sql` | full node read helper | `node_core` + vector + relationships | Unknown | Yes | Medium |
| `get_nodes_by_type()` | `20260210_node_core_vector_architecture.sql` | node filtering helper | `node_core` | Unknown | Yes | Medium |
| `search_similar_vectors()` | `20260210_node_core_vector_architecture.sql` | semantic lookup | `node_vector_memory` | Unknown | Yes | Medium |
| `get_user_lineage()` | `20260209_add_vanshawali_tables.sql` | family lineage retrieval | `user_family_lineage` | Unknown | Yes | Medium |
| `get_family_tree_with_members()` | `20260209_add_vanshawali_tables.sql` | family projection | `family_tree`, `user_family_lineage` | Unknown | Yes | Medium |
| `search_families()` | `20260209_add_vanshawali_tables.sql` | family lookup | `family_tree` | Unknown | Yes | Medium |
| RLS policies for node graph | `20260210_node_core_vector_architecture.sql` | access control | `node_core` / `node_relationships` / `node_vector_memory` | Unknown | Yes | High |
| RLS policies for family tables | `20260209_add_vanshawali_tables.sql` | access control | `family_tree`, `user_family_lineage` | Unknown | Yes | Medium |

## Required target state

The canonical architecture is effectively:

1. Node OS foundation
   - `node_core`
   - `node_relationships`
   - `node_vector_memory`
2. Family projection layer
   - `family_tree`
   - `user_family_lineage`
3. Supporting functions and policies
   - read helpers, search functions, RLS

## Risk statement

The live database already contains a real user-facing backend and active auth path, so any migration that drops or recreates `node_core` or family tables should be treated as high-risk until project identity and migration history are reconciled.
