# Single Node Storage Model

## Classification framework

Each table is classified according to whether it is:

- CANONICAL NODE
- NODE INFRASTRUCTURE
- PROJECTION
- CACHE
- AUTH INFRASTRUCTURE
- MEDIA INFRASTRUCTURE
- LEGACY
- UNKNOWN

## Core inventory

### `node_core`

Classification: CANONICAL NODE

Why:

- This is the primary object model in the architecture.
- It stores node identity, lifecycle, metadata, permissions, trust, and runtime state.
- It is the main durable representation of an entity in the system.

### `node_relationships`

Classification: NODE INFRASTRUCTURE

Why:

- This is a structural implementation of graph edges between nodes.
- It is not the canonical domain root unless the project explicitly chooses an edge-first relational graph model.
- The NodeOS design treats the Node as the authoritative unit and relationships as graph semantics built off that model.

### `node_vector_memory`

Classification: NODE INFRASTRUCTURE

Why:

- It stores vectorized content attached to a node.
- It is infrastructure for retrieval, memory, and AI search.
- It is not a separate canonical business entity; it supports the Node's memory layer.

### `family_tree`

Classification: PROJECTION

Why:

- The architecture documents state that the family tree is derived from the graph and relationships.
- `routes-vanshawali.js` consumes it as a family-facing query result.
- It is focused on family presentation, not the root domain model.

### `user_family_lineage`

Classification: PROJECTION / CACHE / LEGACY COMPATIBILITY

Why:

- It represents a lineage mapping for a user in a family context.
- It may be useful as a materialized projection or query-denormalized helper.
- It does not represent the canonical Node model by itself.
- It is not the primary domain entity.

## Additional relevant tables

### `auth.users`

Classification: AUTH INFRASTRUCTURE

Why:

- This is the identity provider and login/account base.
- It is necessary for authentication but not a replacement for the system Node model.

### `user_profiles`

Classification: AUTH INFRASTRUCTURE / PROFILE CACHE

Why:

- This stores user profile state, but it is not the canonical system entity.

### `trust_state`

Classification: NODE INFRASTRUCTURE

Why:

- It is supporting runtime trust metadata attached to user identity.
- It belongs to the Node or user identity state, not an independent primary domain.

### `node_devices`

Classification: NODE INFRASTRUCTURE

Why:

- Device identity and trust are part of node/device lifecycle support.

### `node_audit_log`

Classification: NODE INFRASTRUCTURE

Why:

- Operational audit log; not a domain root.

### `admin_memory_vectors`

Classification: MEDIA / AI INFRASTRUCTURE

Why:

- This is vector memory for admin design workflows and is specialized infrastructure.

### `feature_access`

Classification: AUTH INFRASTRUCTURE / POLICY CACHE

Why:

- Feature access is a permission helper, not a canonical domain model.

### `ai_preferences`

Classification: PROFILE CACHE / NODE STATE

Why:

- Preferences are part of user or node state; not a separate domain root.

### `business_profiles`

Classification: LEGACY / PROFILE ATTRIBUTE

Why:

- A profile or business attribute is not the root system domain.

## Summary classification

| Table / object | Classification |
|---|---|
| `node_core` | CANONICAL NODE |
| `node_relationships` | NODE INFRASTRUCTURE |
| `node_vector_memory` | NODE INFRASTRUCTURE |
| `family_tree` | PROJECTION |
| `user_family_lineage` | PROJECTION / CACHE / LEGACY |
| `auth.users` | AUTH INFRASTRUCTURE |
| `node_devices` | NODE INFRASTRUCTURE |
| `trust_state` | NODE INFRASTRUCTURE |
| `admin_memory_vectors` | AI INFRASTRUCTURE |
| `user_profiles` | PROFILE CACHE |
| `feature_access` | POLICY CACHE |
| `business_profiles` | LEGACY PROFILE |

## Final conclusion

The canonical storage model is Node-centered. Family and lineage are important but derivative business views. They should not be treated as primary domain tables in the architecture.
