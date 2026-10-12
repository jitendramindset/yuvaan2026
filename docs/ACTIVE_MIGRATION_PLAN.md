# ACTIVE MIGRATION PLAN

## Status

No SQL migrations are currently authorized for execution.

The active runtime is already centered on `node_core` and the Node graph. Family functionality should be implemented as a projection layer over existing Node data.

## Current approved migration state

NONE.

The system is intentionally not executing any schema creation for:

- `family_tree`
- `user_family_lineage`
- `node_vector_memory`
- `node_core`
- legacy schema replay

## Future migration policy

Any future migration must satisfy all of the following:

1. additive only
2. runtime-proven
3. minimal to the current family MVP
4. aligned with NodeOS canonical architecture
5. reviewed before execution

## Current recommendation

Keep this file as the source of truth for future migration readiness.

No migration should be added here unless a real runtime requirement exists and is explicitly approved.
