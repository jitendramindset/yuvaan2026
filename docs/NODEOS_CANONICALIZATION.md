# Canonical NodeOS Selection

## Scope

This document identifies the canonical NodeOS implementation in the workspace, using actual runtime code and schema evidence rather than generated docs.

## Selected canonical NodeOS

Primary files:

- `botmantra-backend/core/node-schema.js`
- `botmantra-backend/core/node-graph.js`
- `botmantra-backend/core/kernel-executor.js`
- `botmantra-backend/core/permission-engine.js`
- `botmantra-backend/core/vector-manager.js`
- `botmantra-backend/core/runtimeOrchestrator.js`
- `botmantra-backend/routes/kernel-v2-api.js`

## Why this is canonical

### 1. Schema is the canonical model definition

`node-schema.js` is the deepest, most explicit description of the system's object model. It documents the full Node Core table with field definitions, enums, lifecycle states, permissions, trust, AI memory, synchronization, and security states.

### 2. Kernel orchestration is the execution layer

`kernel-executor.js` contains the runtime orchestration logic that interprets user actions and coordinates permission, trust, memory, and execution behavior. This is the real system engine.

### 3. Permission and graph handling define runtime behavior

- `permission-engine.js` is where action validation and permissions are evaluated.
- `node-graph.js` defines traversal and relationship behavior across NodeOS entities.
- `vector-manager.js` connects the app to AI memory and semantic retrieval.

### 4. The canonical API gateway aligns with this layer

`routes/kernel-v2-api.js` provides the single controlled execution endpoint `/api/kernel/v2/execute`. This is the strongest evidence for the unified access pattern.

## Canonical design principles

- Every major system object is represented as a node.
- Relationships are explicit graph connections rather than foreign-key-only modeling.
- Permissions are enforced as runtime checks instead of static access flags alone.
- AI memory is treated as a vector-enabled node property and not as a separate app-only concept.
- Family data is a projection of the graph, not a separate universal root object.

## Canonical runtime flow

The code suggests the following runtime flow:

1. Authenticate user through auth routes.
2. Load user node or identity in NodeOS.
3. Evaluate permissions via `permission-engine.js`.
4. Run the kernel action via `kernel-executor.js`.
5. Pull/write graph data and memory through node graph and vector store modules.
6. Expose execution results via the unified API gateway.

## Non-canonical NodeOS candidates

These should be treated as supporting or experimental artifacts until merged:

- generated nodes route files and helper wrappers
- old route sets that duplicate NodeOS logic
- temporary runtime experiments not mounted as the canonical kernel entry point

## Decision

The canonical NodeOS implementation is the runtime model encapsulated in the Node schema, graph, permission engine, vector system, and unified kernel API. This is the actual operating model of the app, even though the repo still contains overlaps and legacy versions.
