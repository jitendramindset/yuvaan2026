# PHASE 6B DEV FAMILY SEED

## Safety Guards

This phase is intentionally limited to a dry-run proof before any database write is allowed.

The seed script checks:
- NODE_ENV must be development or test
- SUPABASE_URL must not look like a production target
- the script defaults to dry-run unless a developer explicitly passes a confirmation flag
- no raw SQL, no direct node_core insert, and no new relationship table are used

## Dry Run

The first run is always intended to be:

```bash
node scripts/dev/seed-vanshawali-family.js --dry-run
```

The dry-run output confirms:
- environment = development or test
- target = safe
- planned nodes = Grandparent, Parent, Child
- planned hierarchy = Grandparent depth 0 -> Parent depth 1 -> Child depth 2
- no database writes

## NodeFactory Path

The seed design follows the actual existing creation path:

```text
NodeFactory
  ↓
NodeCore
  ↓
node_core
```

The script validates the supported node types through the existing NodeFactory API and prepares the exact family-member hierarchy without executing a write.

## Test Nodes

Synthetic development identities used in the dry-run plan:
- vanshawali-e2e-grandparent
- vanshawali-e2e-parent
- vanshawali-e2e-child

No real identities are used. No credentials are printed.

## Hierarchy

The planned hierarchy is:

```text
Grandparent
  ↓
Parent
  ↓
Child
```

with the field values:
- Grandparent: parent_nid_hash = null, node_depth = 0
- Parent: parent_nid_hash = Grandparent.nid_hash, node_depth = 1
- Child: parent_nid_hash = Parent.nid_hash, node_depth = 2

## Idempotency

The design is idempotent because the seed script will check for existing synthetic nodes before creating anything. If the nodes exist, they will be reused instead of duplicated.

## Graph Result

The expected graph validation path is via the existing NodeGraph traversal logic. The dry-run verifies the relationship structure conceptually before any write is allowed.

## Projection Result

The projection path must read the synthetic hierarchy through the existing family projection logic and return a self/ancestor chain. This remains a future validation step once a safe write path is approved.

## API Result

The authenticated family API should return a valid lineage once the dry-run-safe seed is created in a development-only environment. The script does not invoke the API in dry-run mode.

## Frontend Result

The expected frontend contract remains that FamilyTreeScreen receives a child/parent/grandparent lineage without any UI schema change. This is a future validation after the seed proof is complete.

## Database Writes

This phase does not perform a database write.

Final status:
- DATABASE MIGRATION REQUIRED: NO
- DATABASE SCHEMA CHANGE REQUIRED: NO
- DEV SEED WRITE: NOT YET
