# Phase 4F Report

## Original Single Node Requirement

The original architecture requirement is a single canonical Node model with Node-centered identity and runtime state. Family data must not replace the Node as the primary domain object.

## What Node Means

The Node is the system's durable entity abstraction. It owns:

- identity
- state
- metadata
- permissions
- lifecycle
- trust and karma
- history / runtime state
- graph structure
- memory references

## Current node_core

`node_core` is the fundamental runtime and storage object. It currently represents the canonical Node state in the system and stores:

- identity fields
- metadata blobs
- permissions
- relationship pointers
- lifecycle values
- trust, karma, and runtime health
- memory references
- UI and configuration schema

This makes `node_core` the only durable primary domain object in the active architecture.

## Relationships

`node_relationships` is not the canonical domain root. It is best understood as infrastructure that implements node-edge semantics.

It can be useful for graph queries, but the graph is still built on top of the Node model rather than replacing it.

## Family Tree

`family_tree` is a projection of graph-derived family relationships. It is important for UI and genealogy workflows, but it is not an independent canonical domain root.

## Lineage

`user_family_lineage` is a lineage projection, materialized query helper, or compatibility layer. It is not the canonical model for identity or family structure.

## Vector Memory

`node_vector_memory` is support infrastructure for semantic retrieval and node memory. It is attached to a node and is a runtime implementation detail, not a competing domain table.

## Supporting Infrastructure

Supporting infrastructure includes:

- node graph edges
- vector memory storage
- permission engine logic
- auth and user identity tables
- audit/event tables
- UI and profile caches

These are needed to operate the system but do not define the root domain model.

## Duplicate Domain Models

The workspace contains duplicates because it mixes:

- NodeOS architecture
- family relational tables
- auth/profile tables
- graph projection models

The duplicate concern is real, but the canonical answer is not to create more primary tables. It is to reduce the system back to the Node-first model and treat family tables as projections.

## Target Logical Model

The target logical model is:

- `Node`
  - identity
  - state
  - metadata
  - permissions
  - actions
  - memory
  - lifecycle
  - relationships
  - projections

The graph and family views are logical views built over the Node.

## Target Physical Storage Model

The target physical storage model is centered on `node_core` with supporting infrastructure.

### Tables that should exist

- `node_core`
- optional graph edge infrastructure if required by runtime
- optional vector memory infrastructure if required by memory/RAG features
- family projection tables only if intentionally used as materialized views or compatibility tables

### Tables that should NOT exist

- independent canonical family domain tables as the root model
- separate canonical lineage domain table as the root model
- separate vector memory root domain table as the root model

### Tables that are infrastructure only

- `node_relationships`
- `node_vector_memory`
- trust state tables
- permission support tables
- audit/event logs

## Migration Required?

NO

## Why

The evidence shows that the canonical root is `node_core`, and the family and vector structures are derivatives or support infrastructure, not independent canonical domain roots.

A migration should not be created to elevate the family and vector tables to primary domain tables. Any migration should instead focus on reconciling compatibility and infrastructure around the Node model.

## Next Safe Step

The next safe step is architecture alignment and review only:

1. keep `node_core` as the canonical model
2. classify family tables as projections
3. classify relationship and vector tables as infrastructure where used
4. hold off on any new schema migration until the Node-first architecture is approved by human review

DATABASE WRITE PERMISSION: NOT YET
