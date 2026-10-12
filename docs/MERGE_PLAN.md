# Canonical Merge Plan

## Objective

Align the repository around a single authoritative runtime and model without discarding evidence from the existing workspace.

## Phase 1: Selection

1. Confirm runtime entry points:
   - `botmantra-backend/server.js`
   - `botmantra-ui/src/App.js`
   - `supabase/migrations/...`
2. Confirm runtime core modules:
   - `core/kernel-executor.js`
   - `core/node-schema.js`
   - `core/node-graph.js`
   - `core/permission-engine.js`
   - `core/vector-manager.js`
3. Confirm family integration modules:
   - `routes-vanshawali.js`
   - `family_tree` and `user_family_lineage`

## Phase 2: Classification

- Move duplicate routes and legacy wrappers into archive status.
- Preserve generated scripts as compatibility artifacts.
- Retain documentation but mark it as reference or historical rather than implementation.

## Phase 3: Consolidation

- Keep one backend entry path at `server.js`.
- Keep one frontend application shell at `botmantra-ui/src/App.js` + `FamilyOS.js`.
- Keep one database model definition centered on NodeOS + family lineage tables.
- Keep one kernel action contract via `/api/kernel/v2/execute`.

## Phase 4: Validation

Before implementation begins, validate:

- the auth flow still points to the same runtime modules
- the UI shell still calls the same backend endpoints
- the database model supports both node runtime and family data reads
- the relationship model remains graph-backed rather than table-only

## Final policy

The merge should be alignment, not replacement. Use the existing evidence to pick canonical files and fold compatibility files around them.
