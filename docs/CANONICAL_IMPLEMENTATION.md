# Canonical Implementation Decision

Status: evidence-based source-of-truth selection for the current workspace. No application code was modified.

## Executive decision

The codebase does not currently have a single clean production build. It contains multiple overlapping stacks, generated route sets, and older or experimental modules. The canonical production implementation is therefore the set of files that are most consistently connected to the live runtime and data model:

1. Backend runtime: `botmantra-backend/server.js` + canonical core modules under `botmantra-backend/core/` and the kernel/auth route layer.
2. Frontend shell: `botmantra-ui/src/App.js` + `botmantra-ui/src/modules/FamilyOS.js` + Family tree screen modules.
3. Database source of truth: Supabase schema in `supabase/migrations/20260209_add_vanshawali_tables.sql` and `supabase/migrations/20260210_node_core_vector_architecture.sql`.
4. Logical runtime layer: Node OS abstractions from `botmantra-backend/core/node-schema.js`, `node-graph.js`, `kernel-executor.js`, `permission-engine.js`, and `vector-manager.js`.
5. Family model: family graph is derived from relationships, not a standalone authoritative database model.

## Canonical backend

The canonical backend is the active Express app rooted in `botmantra-backend/server.js`.

Evidence:

- `server.js` mounts the core runtime stacks: auth, NodeOS, Vanshawali, kernel, dashboard, wallet, AI, and admin APIs.
- The app creates a `KernelExecutor` and exposes it globally for runtime orchestration.
- The routes for the main production user flow are mounted as active endpoints, notably `/api/nodecore-chat`, `/api/kernel/v2`, `/api/vanshawali`, and `/api/botmantra-ai`.

Primary canonical files:

- `botmantra-backend/server.js`
- `botmantra-backend/routes-auth.js`
- `botmantra-backend/routes-vanshawali.js`
- `botmantra-backend/routes/nodecore-chat.js`
- `botmantra-backend/routes/kernel-v2-api.js`
- `botmantra-backend/core/kernel-executor.js`
- `botmantra-backend/core/node-schema.js`
- `botmantra-backend/core/node-graph.js`
- `botmantra-backend/core/permission-engine.js`
- `botmantra-backend/core/vector-manager.js`

## Canonical frontend

The canonical frontend is the React app that loads the Family OS shell and the active app state logic.

Evidence:

- `botmantra-ui/src/App.js` controls user session, authenticated chat flow, kernel execution, and screen navigation.
- `botmantra-ui/src/modules/FamilyOS.js` is the active Family OS module shell and routes to the major app modules.
- `botmantra-ui/src/modules/FamilyTreeScreen.js` is the strongest UI evidence for the family/relationship model.

Primary canonical files:

- `botmantra-ui/src/App.js`
- `botmantra-ui/src/modules/FamilyOS.js`
- `botmantra-ui/src/modules/FamilyTreeScreen.js`
- `botmantra-ui/src/modules/HomeDashboard.js`
- `botmantra-ui/src/modules/ProfileScreen.js`
- `botmantra-ui/src/components/Navigation.js`

## Canonical database

The canonical durable source of truth is Supabase/PostgreSQL. The design is hybrid but the strongest authoritative evidence points to a two-layer model:

1. Core node architecture in `node_core` / `node_relationships` / `node_vector_memory`.
2. Family projection tables in `family_tree` and `user_family_lineage`.

The authoritative schema files are:

- `supabase/migrations/20260210_node_core_vector_architecture.sql`
- `supabase/migrations/20260209_add_vanshawali_tables.sql`

Canonical database decisions:

- `node_core` is the logical identity and runtime state store for all system entities.
- `node_relationships` is the graph relation model for hierarchy and membership.
- `node_vector_memory` stores semantic content and AI memory.
- `family_tree` and `user_family_lineage` are family-specific aggregate and lineage tables used for genealogy queries.
- The family tree is not the root model; it is a derivative projection over relationships and user lineage data.

## Canonical Node OS model

The canonical Node OS abstraction is expressed in the core runtime modules:

- `node-schema.js` defines the master field and type system.
- `node-graph.js` defines graph traversal semantics and relationship handling.
- `kernel-executor.js` orchestrates runtime execution and actions.
- `permission-engine.js` validates actions and grants.
- `vector-manager.js` manages memory and semantic retrieval.

This is the strongest architectural source for the app’s real operating model.

## Canonical family model

The family model is a projection-based architecture:

- User identity and person records live in `node_core` and user data flows.
- Family/subfamily membership is recorded in `family_tree` + `user_family_lineage`.
- Relationship edges are represented by `node_relationships` or family lineage mappings.
- Screens such as `FamilyTreeScreen` consume the projected family hierarchy rather than treating the family tree as the sole source of truth.

Conclusion: treat the family tree as a derived view, not the dominant canonical storage model.

## Non-canonical areas

These are not the chosen production source of truth and should be treated as archive or compatibility layers until explicitly merged:

- generated route suites under `botmantra-backend/routes/` that duplicate core functionality
- legacy compatibility mounts in `server.js`
- worktree copies under `botmantra-ui.worktrees/`
- duplicate documentation, generated endpoints, and older app shells

## Production posture

This workspace is not a single clean deployment yet, but the evidence supports a canonical target architecture:

- Node-backed runtime as the system logic layer
- Supabase/Postgres as durable storage
- Express API as server boundary
- React app as client shell
- Family tree as a semantic projection over relationships

The next step is not a rewrite. It is consolidation and alignment around these selected source-of-truth files.
