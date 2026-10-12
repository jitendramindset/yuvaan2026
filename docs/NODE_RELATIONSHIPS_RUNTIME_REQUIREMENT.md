# Node Relationships Runtime Requirement

## Conclusion

NO — `node_relationships` is not required for the current runtime Family Tree generation path.

The actual graph code in [botmantra-backend/core/node-graph.js](../botmantra-backend/core/node-graph.js) traverses `node_core` using `parent_nid_hash` and child queries. It does not require a dedicated `node_relationships` table to generate a parent/child family tree.

## Runtime evidence

- [botmantra-backend/core/node-graph.js](../botmantra-backend/core/node-graph.js) builds graph vertices from `node_core`
- parent-child edges are created from `node.parent_nid_hash`
- children are queried via `queryNodes({ parent_nid_hash: current.nid_hash })`
- shortest path and subtree logic use the parent/child chain already present in the node model

## Minimal contract if a relationship table is later added

| Column | Type | Required | Source | Target | Notes |
|---|---|---|---|---|---|
| `relationship_id` | UUID | Yes | generated | generated | unique edge ID |
| `parent_node` | UUID | Yes | `node_core.node_id` | `node_core.node_id` | parent side |
| `child_node` | UUID | Yes | `node_core.node_id` | `node_core.node_id` | child side |
| `relation_type` | VARCHAR | Yes | runtime edge type | runtime edge type | e.g. parent/child | 
| `metadata` | JSONB | Yes | relationship metadata | relationship metadata | optional structured data |
| `created_at` | TIMESTAMPTZ | Yes | runtime | runtime | creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | runtime | runtime | update timestamp |

## Foreign keys

- `parent_node` -> `node_core(node_id)`
- `child_node` -> `node_core(node_id)`

## Indexes

- index on `parent_node`
- index on `child_node`
- index on `relation_type`
- unique index on `(parent_node, child_node, relation_type)`

## RLS / permissions

- read access should be restricted by node visibility and ownership
- no table is required for the current family MVP
- if later used, it must remain a graph infrastructure table, not a canonical family table

## Final answer

NO

`node_relationships` is not required for runtime Family Tree generation in the current Node-first architecture.
