# Canonical Database Selection

## Scope

This document identifies which database schemas in the workspace are authoritative for the live application model.

## Selected canonical database layer

The canonical database is Supabase/PostgreSQL, using the following schema files as the strongest evidence for the live production shape:

- `supabase/migrations/20260210_node_core_vector_architecture.sql`
- `supabase/migrations/20260209_add_vanshawali_tables.sql`

## Canonical tables

### 1. `node_core`

This is the primary system identity and runtime table.

Evidence:

- `botmantra-backend/core/node-schema.js` documents it as the master node model.
- `20260210_node_core_vector_architecture.sql` creates `node_core` as the central graph entity table.
- `server.js` and the core runtime modules rely on NodeOS semantics built around this table.

This is the strongest candidate for the universal system-of-record table.

### 2. `node_relationships`

This table encodes the graph edge semantics that replace traditional foreign keys in the NodeOS model.

Evidence:

- `20260210_node_core_vector_architecture.sql` defines `parent_node`, `child_node`, and `relation_type`.
- `botmantra-backend/core/node-graph.js` models the same graph semantics.

### 3. `node_vector_memory`

This stores vector-backed and semantic memory associated with nodes.

Evidence:

- `20260210_node_core_vector_architecture.sql` defines vector memory content, metadata, and embedding fields.
- `core/vector-manager.js` supports vector memory management in the backend runtime.

### 4. `family_tree`

This table defines family-level grouping and genealogy metadata.

### 5. `user_family_lineage`

This table links individual users to their family lineage and ancestry metadata.

Evidence:

- `20260209_add_vanshawali_tables.sql` defines both tables and the RPC functions `get_user_lineage`, `get_family_tree_with_members`, and `search_families`.
- `botmantra-backend/routes-vanshawali.js` uses these tables directly for family endpoints.

## Canonical design decision

The canonical durable design is a hybrid model:

- `node_core` is the primary system model.
- `family_tree` and `user_family_lineage` are family projections layered on top of the system graph.
- The family tree is not the root storage model; it is a derived domain projection.

## Why this is the correct source-of-truth model

1. The runtime files in the backend describe the Node model as the master model.
2. The migration SQL creates explicit graph tables for NodeOS semantics.
3. The Vanshawali tables are concrete genealogy tables but are not the universal root for all entities.
4. The app’s product domain is family-related, but the application architecture is still node- and graph-oriented.

## Non-canonical database artifacts

These should not be treated as the authoritative database model without additional confirmation:

- generated database-inspector outputs
- isolated SQL probes, test scripts, or migration fragments with incomplete schema coverage
- legacy compatibility tables created for experiments or temporary prototypes

## Recommended source-of-truth policy

- Use `node_core` as the main runtime identity model.
- Use `node_relationships` for graph semantics.
- Use `node_vector_memory` for AI/semantic contexts.
- Use `family_tree` and `user_family_lineage` for genealogy-specific reads and projections.

## Final decision

The canonical database architecture is the Supabase schema created by the NodeOS migration plus the family lineage migration. The canonical root abstraction is the NodeOS graph model, and the family model is a derivative projection of that model.
