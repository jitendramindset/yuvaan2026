# Schema Alignment Matrix

| Object | Expected by code | Expected migration | Live DB | Status |
|---|---|---|---|---|
| `node_core` | Yes | `20260210_node_core_vector_architecture.sql` | Exists | MATCH |
| `node_relationships` | Yes | `20260210_node_core_vector_architecture.sql` | Missing | MISSING |
| `node_vector_memory` | Yes | `20260210_node_core_vector_architecture.sql` | Missing | MISSING |
| `family_tree` | Yes | `20260209_add_vanshawali_tables.sql` | Missing | MISSING |
| `user_family_lineage` | Yes | `20260209_add_vanshawali_tables.sql` | Missing | MISSING |
| `node_permission` | Yes | baseline / runtime engine assumptions | Not confirmed in this phase | UNKNOWN |
| `node_permission_effective` | Yes | runtime engine assumptions | Not confirmed in this phase | UNKNOWN |
| `node_execution_log` | Yes | runtime engine assumptions | Not confirmed in this phase | UNKNOWN |
| `users` | Yes | auth system | Present via auth flow | MATCH |
| `auth.users` | Yes | Supabase auth | Present via auth flow | MATCH |
| `schema_migrations` | Usually present | Supabase migration metadata | Not visible | UNKNOWN |
| `family` | Possibly | family alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `families` | Possibly | family alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `family_members` | Possibly | family alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `family_relationships` | Possibly | family alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `lineage` | Possibly | family alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `user_lineage` | Possibly | family alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `relationships` | Possibly | graph alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `node_edges` | Possibly | graph alternatives | None found | NO FAMILY DATA OBJECTS FOUND |
| `node_vectors` | Possibly | vector alternatives | None found | NO FAMILY DATA OBJECTS FOUND |

## Supporting objects

| Object | Expected by code | Live DB | Status |
|---|---|---|---|
| `get_node_full()` | Yes | Not visible | UNKNOWN |
| `get_nodes_by_type()` | Yes | Not visible | UNKNOWN |
| `search_similar_vectors()` | Yes | Not visible | UNKNOWN |
| `get_user_lineage()` | Yes | Not visible | UNKNOWN |
| `get_family_tree_with_members()` | Yes | Not visible | UNKNOWN |
| `search_families()` | Yes | Not visible | UNKNOWN |
| row-level security policies for family tables | Yes | Not visible | UNKNOWN |
| graph indexes for relationships | Yes | Not visible | UNKNOWN |
| vector indexes | Yes | Not visible | UNKNOWN |

## Summary

The core identity table exists, but the graph, vector, and family tables expected by the canonical Vanshawali and Node OS architecture are absent from the connected database. This indicates a schema-version mismatch rather than a pure app-code issue.
