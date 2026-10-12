# Phase 4G Report

## Single Node Model

The canonical architecture remains a single Node model centered on `node_core`.

This is proven by:

- `botmantra-backend/core/node-schema.js` describing `node_core` as the master structure
- `botmantra-backend/core/runtimeOrchestrator.js` initializing user nodes as the base of the app runtime
- `botmantra-backend/core/kernel-executor.js` executing user actions around the node model
- `botmantra-backend/core/node-graph.js` using `node_core` as the vertex source

## Node Graph Model

The graph has a clear Node-first design:

- vertices = nodes from `node_core`
- edges = derived relationship links
- traversal = parent/child and sibling graphs via BFS
- graph depth and cycle prevention are supported by runtime logic

This is not evidence of a competing canonical family model.

## Relationship Contract

The relationship contract implied by runtime is:

- source node
- target node
- directed edge type
- metadata
- timestamps

This contract is compatible with NodeOS infrastructure and graph traversal, but not with independent family-table canonical status.

## Family Relationship Mapping

Real family concepts map to graph relationships:

- parent / child
- sibling
- relationship membership
- family structure via connected nodes

The graph already supports the relationship semantics needed for the family view.

## Family Projection

A family projection can be built by traversing connected human nodes and relationship metadata. The resulting output can be adapted to the UI contract consumed by `FamilyTreeScreen.js`.

## Legacy Family Tables

`family_tree` and `user_family_lineage` are best classified as legacy or compatibility projection tables rather than canonical domain roots.

They are useful for old API flows, but they are not the authoritative model.

## Vector Memory

`node_vector_memory` is not a blocker for the family MVP. It is optional infrastructure for semantic memory and retrieval, but not required for the core human-node family graph.

## Required Infrastructure

The minimum runtime infrastructure needed for the family MVP is:

- `node_core`
- `node_relationships` (infrastructure)

Optional but not required for the core family graph:

- `node_vector_memory`
- `family_tree`
- `user_family_lineage`

## Family API

`routes-vanshawali.js` currently queries family projection tables, but the public API contract can be preserved by projecting graph-based relationships into the same family JSON shape.

This means a migration from family-table reads to node graph reads is a projection-layer adaptation, not a redesign of the app’s domain model.

## Frontend Contract

`FamilyTreeScreen.js` expects a member/relationship view with fields like:

- `node_id`
- `name`
- `rel`
- `city`
- `gotra`
- `village`
- `validated`
- `pending_validation`

This contract is satisfied by a graph-derived projection, not by `family_tree` as a canonical source of truth.

## Minimum Database Requirement

Selected answer: B.

`node_core + node_relationships`

This is the minimum infrastructure required for a Single Node family MVP based on the evidence in the runtime and graph layer.

## Migration Requirement

No migration is required in this phase.

The next step is architecture alignment only. The system should be restored to a Node-first model and then optionally adapt the family API as a projection layer.

## Architecture Decision

The family tree can be implemented as a projection of NodeOS without establishing `family_tree` and `user_family_lineage` as independent canonical domain tables.

## Final answer

YES — Vanshawali Family Tree can be implemented as a projection of NodeOS without making `family_tree` and `user_family_lineage` canonical domain tables.

This is proven by the actual runtime:

- `node_core` is the canonical node object
- `node_graph.js` derives traversal and relationships from nodes
- `FamilyTreeScreen.js` consumes a member/relationship projection, not a root family table
- the family tables are compatibility/projection layers, not the system’s authoritative model

DATABASE WRITE PERMISSION: NOT YET
