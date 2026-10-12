# Node Graph Family Capability

## Scope

This document verifies whether the active Node graph can support the Vanshawali family experience using the existing NodeOS model rather than canonical family tables.

## Evidence from the runtime

### Node graph is the canonical graph abstraction

`botmantra-backend/core/node-graph.js` defines the system as:

- vertices = nodes from `node_core`
- edges = relationships between nodes
- traversal = BFS / DFS on the graph
- graph ranges = root / parent / child / sibling / path / subtree

The code explicitly explains:

- `buildGraph()` loads nodes and creates graph vertices from `node_core`
- it then creates edges based on `parent_nid_hash`
- it adds sibling edges by grouping nodes with the same parent
- it computes graph stats and supports traversal and pathfinding

This is direct evidence that the family graph is conceptually derived from Node graph semantics rather than a separate canonical family root.

## How nodes are loaded

`node-graph.js` obtains nodes via `this.nodeFactory.queryNodes(queryParams)`, with parameters such as:

- `node_state: 'ACTIVE'`
- `max_depth`
- `owner_id`
- `parent_nid_hash`
- `nid_hash`

This means the graph runtime loads from the canonical node model, not from a family-only table.

## How relationships are loaded

The graph runtime builds edges in two ways:

1. direct parent/child edges from `node_core.parent_nid_hash`
2. derived sibling grouping when multiple nodes share the same parent

The code comment says:

- children: `SELECT FROM node_core WHERE parent_nid_hash = X`
- parents: `SELECT parent_nid_hash FROM node_core WHERE nid_hash = X`

This is important: the system already treats hierarchy as Node state, not as a separate family table.

## Traversal model

The graph supports:

- `buildGraph()`
- `getSubtree(rootNidHash, maxDepth)`
- `shortestPath(fromNidHash, toNidHash)`

Traversal is BFS-based and includes:

- parent neighbor lookup
- child neighbor lookup
- path reconstruction
- visited-set cycle prevention

This is sufficient to produce a family tree or lineage projection from node relationships.

## Relationship types supported by the graph code

The edge types defined in `node-graph.js` are:

- `PARENT_CHILD`
- `CHILD_PARENT`
- `PERMISSION`
- `BRAND_MEMBER`
- `SIBLING`
- `RELATIONSHIP`

These are the only relationship types actually encoded in the graph runtime.

The code does not define a canonical family table with distinct family-specific relationship types. Instead, it treats relationship semantics as graph data.

## Directionality and hierarchy

The graph is directional in the sense that it stores:

- source = parent node
- target = child node

This makes the graph suitable for:

- parent/child traversal
- descendant traversal
- ancestor traversal via repeated parent lookup
- sibling grouping via shared parent

## Family-specific behavior supported by code

### Parent/child traversal

Supported by:

- direct `parent_nid_hash` lookup
- BFS children query from `parent_nid_hash`

### Sibling traversal

Supported by:

- `siblingGroups` built from shared parent node
- direct sibling edge generation

### Ancestor traversal

Supported by repeated parent traversal through `parent_nid_hash`.

### Descendant traversal

Supported by repeated child traversal through `parent_nid_hash` queries.

### Depth tracking

`node_depth` is part of the schema and is used during graph construction;
`max_depth` is used in graph and subtree queries.

### Cycle prevention

`getSubtree()` uses a `visited` set; `shortestPath()` uses a `visited` Map to block loops.

This is strong evidence that the graph is designed for navigation and tree structure, not for a separate family model that duplicates the graph.

## Permission filtering

The graph builder supports `include_permissions` and `_fetchPermissionEdges(nidHashes)`, so permissions are part of the graph view. This shows that graph queries are layered over the node model and can be filtered by access rules.

## Conclusion

The active Node graph can support a family view because:

- it loads nodes from `node_core`
- it derives relationships from parent/child structure and edge metadata
- it traverses connected nodes via graph semantics
- it already supports parent, child, sibling, ancestor, and descendant logic
- the UI can project a family tree from connected nodes without a `family_tree` canonical table

The runtime is therefore consistent with:

NODE_CORE → NODE GRAPH → FAMILY PROJECTION → FamilyTreeScreen

not:

NODE_CORE + FAMILY_TREE + USER_LINEAGE as three independent canonical roots.
