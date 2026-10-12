# Canonical Dependency Graph

## Overview

This dependency graph reflects the architecture already evident in the source files without introducing a new implementation model.

## Primary runtime chain

User UI
  -> `botmantra-ui/src/App.js`
  -> `botmantra-ui/src/modules/FamilyOS.js`
  -> `botmantra-ui/src/modules/FamilyTreeScreen.js`
  -> API calls to backend routes

Backend API layer
  -> `botmantra-backend/server.js`
  -> `/api/botmantra-ai`
  -> `/api/nodecore-chat`
  -> `/api/kernel/v2`
  -> `/api/vanshawali`

Kernel and runtime layer
  -> `botmantra-backend/core/kernel-executor.js`
  -> `botmantra-backend/core/permission-engine.js`
  -> `botmantra-backend/core/node-graph.js`
  -> `botmantra-backend/core/vector-manager.js`
  -> `botmantra-backend/core/node-schema.js`

Database layer
  -> Supabase/Postgres
  -> `node_core`
  -> `node_relationships`
  -> `node_vector_memory`
  -> `family_tree`
  -> `user_family_lineage`

## Cross-layer contract

- frontend chat uses authenticated route execution for real system actions
- kernel validation governs action execution
- the node model defines system entity identity
- family tables create genealogy-specific read models
- vector memory and graph relationships support discovery and AI augmentation

## Canonical dependency relationships

1. `App.js` depends on active frontend modules and chat execution flow.
2. `FamilyOS.js` depends on both shell and domain modules.
3. `server.js` depends on runtime route groups and the kernel executor.
4. `kernel-v2-api.js` depends on `KernelExecutor` and permission checks.
5. `KernelExecutor` depends on the node schema, graph engine, vector manager, and permissions.
6. The database migration files define the durable model that the runtime depends on.

## Important note

The repo contains duplicate and generated route sets, but these are not the canonical source of truth. The canonical graph is the runtime path above, not a documentation-only or generated version.
