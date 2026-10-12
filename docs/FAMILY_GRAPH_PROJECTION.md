# Family Graph Projection

## Goal

Define the logical projection that can be generated from Node graph relationships without creating canonical family tables.

## Read-only logical flow

Human Node
↓
relationship traversal
↓
connected nodes
↓
relationship metadata
↓
family tree JSON

## Existing UI contract expected by the frontend

The actual FamilyTreeScreen UI expects a graph-like member list, not a hard-coded family table shape. The code in `botmantra-ui/src/modules/FamilyTreeScreen.js` uses fields such as:

- `node_id`
- `name`
- `rel`
- `city`
- `gotra`
- `village`
- `validated`
- `pending_validation`
- `online`
- `avatar`

This means the projection only needs the fields actually consumed by the UI.

## Minimal family projection shape

A family projection can be represented as:

{
  person: {
    node_id,
    name,
    city,
    gotra,
    village,
    validated
  },
  parents: [
    { node_id, name, rel: 'father' | 'mother' }
  ],
  spouses: [
    { node_id, name, rel: 'spouse' }
  ],
  children: [
    { node_id, name, rel: 'son' | 'daughter' }
  ],
  siblings: [
    { node_id, name, rel: 'brother' | 'sister' }
  ],
  ancestors: [
    { node_id, name, rel: 'grandfather' | 'grandmother' }
  ],
  descendants: [
    { node_id, name, rel: 'son' | 'daughter' }
  ]
}

## Why this is valid

This is supported by the runtime and UI:

- `node-graph.js` can traverse parent/child edges and sibling groups
- `FamilyTreeScreen.js` renders people as members and derives relationship labels from `rel`
- the UI does not require a canonical `family_tree` table as the source of truth

## Important constraint

The family projection should be derived from the graph. It must not become a second source of truth.

The projection is a view over node relationships, not a primary domain model.
