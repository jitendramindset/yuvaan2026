# Node Relationship Contract

## Scope

This document describes the relationship contract implied by the actual NodeOS runtime and graph layer. It does not create a table or claim a live database object exists.

## Canonical contract implied by runtime

The graph code in `botmantra-backend/core/node-graph.js` expects the relationship model to be a graph over `node_core` entries. The runtime semantics are visible in:

- `buildGraph()`
- `getSubtree()`
- `shortestPath()`
- `EDGE_TYPES`
- `parent_nid_hash` rules

## Inferred relationship record contract

| Column | Type | Purpose | Required | Evidence |
|---|---|---|---|---|
| `relationship_id` | UUID | unique edge identifier | Yes | canonical graph pattern |
| `parent_node` | UUID / node reference | source node for directed relationship | Yes | `parent_nid_hash` logic and edge generation |
| `child_node` | UUID / node reference | target node for directed relationship | Yes | `buildGraph()` and `getSubtree()` |
| `relation_type` | varchar/string | relationship semantics | Yes | `relation_type` in NodeOS schema and edge type system |
| `metadata` | JSONB | relationship metadata, flags, details | Optional but expected | `metadata` field in migration and graph edges |
| `created_at` | timestamp | creation time | Yes | lifecycle convention |
| `updated_at` | timestamp | last update time | Yes | lifecycle convention |

## Relationship semantics actually used by runtime

The graph runtime defines edge types:

- `PARENT_CHILD`
- `CHILD_PARENT`
- `PERMISSION`
- `BRAND_MEMBER`
- `SIBLING`
- `RELATIONSHIP`

The code specifically uses parent/child edges and sibling grouping. The runtime therefore depends on:

- source and target node references
- directional edges
- edge type identification
- optional metadata payload

## Required properties for family use

For family functionality, the critical relationship semantics are:

- parent-child
- sibling
- relationship / family link

The runtime does not require a separate `family_tree` table to express those semantics; it uses graph identity and edge direction.

## Constraints and indexing (inferred)

These are the constraints the runtime implies:

- parent and child cannot be the same node
- relationship types should not be blank
- an edge should be unique by parent + child + relation type
- parent and child should reference valid nodes in `node_core`
- indexes should support:
  - parent lookup
  - child lookup
  - relation type lookup
  - uniqueness on parent-child-type

This aligns with the canonical NodeOS migration artifact and the graph traversal requirements.

## RLS and access

The graph runtime expects visibility and ownership checks to be applied at the node level. The relationship records should not be treated as a source-of-truth domain root; they are edge infrastructure that should respect node visibility and ownership.

## Conclusion

The Node relationship contract is not a family table contract. It is a graph edge contract layered over the Node model.

The minimum logical relationship model is:

- node-defined graph vertices
- relationship edges between nodes
- relationship type + metadata
- edge traversal and visibility checks

This is not evidence for a canonical standalone family domain table.
