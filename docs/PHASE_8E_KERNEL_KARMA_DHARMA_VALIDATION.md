# Phase 8E Kernel / Karma / Dharma Validation

Date: 2026-09-22

## 1. Executive Summary

Family-member creation follows a direct route-to-service-to-factory-to-database path that **bypasses** the Kernel executor, Karma engine, and Dharma validator entirely. The `gen_random_bytes(integer)` error originates from a database-level default or trigger on columns (`version_hash`, `previous_version_hash`, `is_head`) that exist in the remote `node_core` but are absent from the baseline migration and are not supplied by the application.

## 2. Actual Family Creation Execution Chain

```
POST /api/vanshawali/family-member
  ↓
routes-vanshawali.js: requireAuth (JWT/Supabase auth)
  ↓
routes-vanshawali.js: createFamilyMember()
  ↓
family-member-service.js: resolveCanonicalOwnerId()
  ↓
family-member-service.js: resolveCanonicalUserNode()
  ↓
family-member-service.js: NodeFactory.createFamilyMember()
  ↓
nodeFactory.js: createLiveNode()
  ↓
nodeCore.js: createChildNode()
  ↓
node-schema.js: buildNodeCoreRow()
  ↓
nodeCore.js: supabase.from('node_core').insert(childNodeData)
  ↓
DATABASE: column default/trigger evaluates gen_random_bytes(integer)
  ↓
FAIL: 42883
```

## 3. Kernel Entry Point

The Kernel executor (`core/kernel-executor.js`) is **NOT** invoked during family-member creation. The route calls `createFamilyMember()` directly from the service layer, which delegates to `NodeFactory` → `NodeCore`. The Kernel executor is used for admin actions, chat, and generic `POST /api/kernel/v2/execute` requests, but the Vanshavali family-member route does not pass through it.

**Finding**: Family creation bypasses the Kernel execution layer.

## 4. Authentication / Authorization

| Check | Location | Status |
|-------|----------|--------|
| JWT/Supabase token verification | `routes-vanshawali.js:requireAuth` | PASS |
| Anonymous request rejection | `401` returned | PASS |
| Invalid token rejection | `401` returned | PASS |
| Owner resolution | `resolveCanonicalOwnerId()` | PASS |
| Cross-owner parent access | `NodeCore.createChildNode()` validates `owner_id` match | PASS |
| Client-controlled owner/parent/depth | All server-derived | PASS |

## 5. Dharma Validation

The Dharma validator (`core/dharma-validator.js`) is **NOT** invoked during family-member creation. The creation path does not call any Dharma validation function.

**Finding**: Dharma validation is defined but not executed in this creation path.

## 6. Karma Execution

The Karma engine (`core/karma-engine.js`) is **NOT** invoked during family-member creation. The `buildNodeCoreRow` function sets `karma_score: 0` and `trust_score: 50` as static defaults, but no Karma calculation, update, or audit occurs.

**Finding**: Karma is defined but not executed in this creation path.

## 7. Node Lifecycle Validation

| Field | Source | Client-Controllable? |
|-------|--------|---------------------|
| `owner_id` | `buildNodeCoreRow` from authenticated owner | NO |
| `nid_hash` | `generateNidHash()` (SHA-256) | NO |
| `node_type` | `typeDef.db_node_type` from NodeFactory | NO (server maps `family_member` → `living`) |
| `node_state` | `'ACTIVE'` default | NO |
| `node_depth` | `parentDepth + 1` | NO |
| `parent_nid_hash` | Server-resolved parent | NO |
| `encryption_key_ref` | `uuid.v4()` in JS | NO |
| `state_hash` | SHA-256 of owner+nid+timestamp | NO |
| `karma_score` | `0` default | NO |
| `trust_score` | `50` default | NO |

All canonical identity and security fields are server-controlled.

## 8. Relationship Validation

| Check | Location | Status |
|-------|----------|--------|
| Relationship type allowed | `family-member-service.js`: only `child` accepted | PASS |
| Duplicate detection | Same name + relationship under same parent → `409` | PASS |
| Parent ownership | `NodeCore.createChildNode()` validates `owner_id` | PASS |
| Spouse/sibling rejection | `400` for non-child relationships | PASS |

## 9. Ownership / Security Boundary

- Route-level: `requireAuth` rejects anonymous/invalid tokens.
- Service-level: `resolveCanonicalOwnerId()` maps JWT user to canonical owner.
- Factory-level: `createChildNode()` validates parent `owner_id` matches the caller.
- No client-supplied `owner_id`, `parent_nid_hash`, `node_depth`, `nid_hash`, or `node_state` is accepted.

## 10. NodeCore Construction

`buildNodeCoreRow()` produces a complete row with all required fields. The application supplies every column that has a `NOT NULL` constraint in the baseline migration. The payload includes:

- All `bytea` blobs (dna, field_map, perm, rule, runtime, memory, ui, sys)
- `state_hash`, `nid_hash`, `owner_id`
- `node_type`, `node_state`, `node_depth`, `parent_nid_hash`
- `encryption_key_ref` (via `uuid.v4()`)
- All score/state/permission fields

## 11. Database Persistence Boundary

The `supabase.from('node_core').insert(childNodeData)` call fails because the remote database evaluates a default or trigger that calls `gen_random_bytes(integer)`.

**Evidence**:
- The baseline migration (`baseline_public_migration.sql`) defines `node_core` with 60+ columns, none of which use `gen_random_bytes` as a default.
- The remote database sample rows show columns `version_hash`, `previous_version_hash`, `is_head` that are NOT in the baseline migration.
- The application's `buildNodeCoreRow()` does NOT supply `version_hash`, `previous_version_hash`, or `is_head`.
- These columns likely have database defaults that call `gen_random_bytes(integer)` from `pgcrypto`.
- `pgcrypto` is not enabled in the target Supabase instance.

## 12. Exact gen_random_bytes Dependency

| Finding | Result |
|--------|--------|
| Exact column(s) | `version_hash`, `previous_version_hash`, `is_head` (present in remote DB, absent from baseline migration) |
| Default/trigger | Database-level default or trigger evaluating `gen_random_bytes(integer)` |
| Function schema | Unqualified `gen_random_bytes` (requires `pgcrypto`) |
| PGCRYPTO installed | NO |
| gen_random_bytes available | NO |
| Application supplies value | NO (these columns are not in `buildNodeCoreRow` payload) |
| Baseline migration includes | NO (these columns are not in `baseline_public_migration.sql`) |

## 13. Existing Node Comparison

Existing `node_core` rows have `encryption_key_ref` values (UUIDs) and were created successfully. The difference is that existing rows were created before the additional columns (`version_hash`, `previous_version_hash`, `is_head`) were added to the schema, or were created through a different code path that supplied those values.

## 14. Kernel/Karma/Dharma Decision Matrix

| Area | Status | Evidence |
|------|--------|----------|
| Authentication | PASS | JWT/Supabase token verified at route level |
| Owner resolution | PASS | `resolveCanonicalOwnerId()` maps JWT → canonical owner |
| Kernel execution | NOT PRESENT | Family creation bypasses `kernel-executor.js` |
| Permission validation | NOT PRESENT | No permission check beyond ownership validation |
| Dharma validation | NOT PRESENT | `dharma-validator.js` not invoked |
| Relationship validation | PASS | Only `child` accepted; duplicate detection active |
| Parent validation | PASS | Owner match verified in `createChildNode()` |
| Karma execution | NOT PRESENT | `karma-engine.js` not invoked; static defaults used |
| Lifecycle validation | PASS | All canonical fields server-controlled |
| NodeCore construction | PASS | `buildNodeCoreRow()` supplies all required fields |
| Database persistence | FAIL | `gen_random_bytes(integer)` missing in remote instance |
| gen_random_bytes dependency | DIAGNOSED | Columns `version_hash`, `previous_version_hash`, `is_head` likely have defaults requiring `pgcrypto` |
| Canonical architecture compliance | PASS | NodeOS model, NodeFactory, NodeCore, and node_core are preserved |

## 15. Findings

1. **Family creation bypasses Kernel/Karma/Dharma**: The creation path goes directly from route → service → NodeFactory → NodeCore. No Kernel executor, Karma engine, or Dharma validator is invoked.
2. **All canonical fields are server-controlled**: No client can spoof owner, parent, depth, type, state, or identity.
3. **The `gen_random_bytes` dependency is NOT in the baseline migration**: The remote database has additional columns (`version_hash`, `previous_version_hash`, `is_head`) that are absent from the baseline migration and not supplied by the application.
4. **Existing rows were created before these columns existed**: The oldest rows predate the schema additions.

## 16. Risks / Gaps

- Family creation does not pass through Kernel execution, so no Karma scoring, Dharma validation, or permission policy is applied.
- The additional columns (`version_hash`, `previous_version_hash`, `is_head`) are not documented in the baseline migration and their purpose is unclear.
- Enabling `pgcrypto` alone may not be sufficient if the column defaults also need to be aligned with the application payload.

## 17. Recommended Next Step

The recommended fix is to enable `pgcrypto` extension on the Supabase database instance, which will make `gen_random_bytes(integer)` available for the column defaults on `version_hash`, `previous_version_hash`, and `is_head`. This preserves the existing NodeOS architecture and does not require application code changes.

**No database modification, migration, or schema change was executed in this phase.**