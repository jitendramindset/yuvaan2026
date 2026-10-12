# NodeOS Duplicate Domain Models

## Summary

The codebase contains multiple implementations of the same conceptual idea. The real issue is not whether a feature exists in a different table; it is whether that table is a canonical root model or a derived view.

## Duplicate concepts

| Concept | Implementation A | Implementation B | Canonical | Legacy | Migration required |
|---|---|---|---|---|---|
| User identity | `auth.users` | `node_core` as user node | `node_core` for runtime entity identity | `auth.users` as credential provider | No new migration yet |
| Family identity | `family_tree` | derived Node relationships / graph | Node graph + projection | `family_tree` as compatibility projection | Possibly compatibility only |
| Relationships | `node_relationships` | `node_core.parent_node` + relationship metadata in blobs | Node graph semantics | edge table as infrastructure | Not as canonical domain root |
| Lineage | `user_family_lineage` | derived graph traversal and family projection | computed family projection | materialized lineage view | Possibly compatibility only |
| Memory | `node_core.memory_blob` | `node_vector_memory` | Node memory concept | vector memory as infra support | No canonical domain split |
| Permissions | `node_core.permissions` | permission engine runtime logic | Node state + runtime evaluation | static permission tables | Not as primary root |
| Profile | `user_profiles` | `node_core.metadata` / node blob | node metadata | profile table as cache | No new canonical split |
| Trust | `trust_state` | `node_core.trust_score` | node-level trust state | trust_state as support table | Maybe support only |

## Why duplication exists

The repository contains multiple eras of architecture:

- relational/family-first design
- NodeOS graph-first design
- compatibility tables
- UI-driven aggregates

Those are all symptoms of the same underlying issue: the repository has not yet been unified around a single canonical root model.

## Canonical decision

The canonical root is the Node.

The duplicate domain models are legacy or projection artifacts that should be reconciled around the Node and not elevated to independent canonical tables unless the actual runtime explicitly requires it.

## Practical rule

If a concept can be represented by Node identity and Node state, then it should not be treated as a separate canonical business domain table unless there is a clear runtime requirement.
