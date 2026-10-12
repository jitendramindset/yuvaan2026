# Family Legacy Projection Analysis

## Objective

Determine whether `family_tree` and `user_family_lineage` are canonical domain tables or legacy projection caches.

## Comparison to NodeOS

| Object | NodeOS comparison | Classification |
|---|---|---|
| `family_tree` | graph projection of connected nodes and relationships | Temporary compatibility layer / projection |
| `user_family_lineage` | person-centric lineage view over a node graph or relation set | Temporary compatibility layer / materialized projection |
| `node_core` | authoritative identity and state model | canonical root |
| `node_relationships` | graph edges between node records | required infrastructure |

## Evidence

### `family_tree` is a projection pattern

`botmantra-backend/routes-vanshawali.js` reads from `family_tree` and `user_family_lineage` directly, but this is API-level access to a family-specific projection layer, not evidence that the model is canonical.

The target architecture documents a family tree as a projection of relationships, not a separate root model.

### `user_family_lineage` is a user-centric materialized convenience layer

The route names and logic point to a convenience model for user ancestry and members. It is useful for the API, but it is not the runtime identity model.

### `node_core` is the true root

`node-schema.js` defines the Node as the real durable abstraction across identity, state, metadata, permissions, runtime, trust, and lifecycle.

No part of the runtime says the family tree is the root of the system.

## Classification

### A. Completely unnecessary

Not completely unnecessary, but it is not canonical. It is optional as a compatibility/projection layer.

### B. Temporary compatibility layer

Yes — likely.

### C. Read projection

Yes — likely.

### D. Materialized projection

Possible, especially for lineage read optimization.

### E. Required for some legacy feature

Yes, for legacy family APIs and compatibility flows.

### F. Unknown

Only if a future optimization or external reporting use requires denormalized family data.

## Final conclusion

`family_tree` and `user_family_lineage` are not canonical domain roots in the NodeOS architecture. They are best treated as compatibility or projection artifacts layered over the node graph.
