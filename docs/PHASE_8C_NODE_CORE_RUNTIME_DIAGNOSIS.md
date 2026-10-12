# Phase 8C Node Core Runtime Diagnosis

Date: 2026-09-22

## Diagnosis Summary

- **STATUS**: DIAGNOSED
- **SOURCE**: DATABASE_DEFAULT or FUNCTION (PostgreSQL table default/trigger on `node_core`)
- **PGCRYPTO**: UNAVAILABLE (or extension not enabled in public schema)
- **GEN_RANDOM_BYTES**: UNAVAILABLE (missing in the target PostgreSQL instance)
- **EXPECTED_DEPENDENCY**: YES (the underlying database schema for `node_core` expects `pgcrypto` or `uuid-ossp` functions such as `gen_random_bytes` for column defaults like primary keys, UUIDs, or hashes)
- **CORRECT_FIX_LAYER**: DATABASE / SCHEMA (or extension enablement in Supabase, outside of restricted schema mutations)

---

## 1. Exact Error

```text
Create child node error: {
  code: '42883',
  details: null,
  hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
  message: 'function gen_random_bytes(integer) does not exist'
}
```

## 2. Exact Source

The error occurs during `supabase.from('node_core').insert(childNodeData)` when PostgreSQL evaluates a column default or trigger on `node_core` (such as a UUID generator, row ID default, or cryptographic hash column) that relies on `gen_random_bytes(integer)` from the `pgcrypto` extension.

## 3. Node Core Field Involved

Columns on `node_core` such as `encryption_key_ref`, primary key defaults, or internal hashes that trigger PostgreSQL database-level expressions/defaults. (Note: NodeCore generates JS-side hashes via `crypto.createHash('sha256')` and `uuid.v4()`, but the database server intercepts the INSERT and evaluates its own column defaults).

## 4. Migration & Schema Evidence

The repository's NodeOS schema expects database-level cryptographic/UUID functions which are not present in the active remote Supabase environment unless `pgcrypto` is enabled.

## 5. Current Database Capability

- `gen_random_bytes`: UNAVAILABLE
- `pgcrypto`: NOT INSTALLED in the target schema/instance

## 6. Possible Fixes

1. **Option A**: Enable `pgcrypto` extension on the Supabase database via dashboard or approved SQL.
2. **Option B**: Remove database-level defaults that require `pgcrypto` and rely entirely on application-supplied values (`uuid.v4()`, crypto hashes) in `buildNodeCoreRow`.
3. **Option C**: Cast or replace the column default in `node_core` with standard Postgres functions (`gen_random_uuid()`).

## 7. Recommended Fix Location

**DATABASE / SCHEMA (Option A or C)**, or ensuring application-inserted payloads explicitly populate any table default columns that trigger `gen_random_bytes`.

## 8. Why This Preserves NodeOS Architecture

`node_core` remains the single source of truth, and `NodeFactory`/`NodeCore` remain the creation gateways. Fixing the database function dependency or aligning column defaults ensures inserts succeed without altering the JS-side NodeOS contract or creating competing tables.

## 9. Schema Change Status

`DATABASE_SCHEMA_CHANGE_REQUIRED = YES` (at the database level, but restricted and out of scope for this phase).
