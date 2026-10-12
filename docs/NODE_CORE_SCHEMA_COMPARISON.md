# node_core Schema Comparison

## Scope

This comparison reviews the live `node_core` table against the canonical definition in `supabase/migrations/20260210_node_core_vector_architecture.sql`.

## Evidence status

The live DB clearly contains `node_core` and the backend runtime is using it successfully. However, this forensic phase did not expose a full live column-by-column schema report or a standard migration metadata table, so the comparison must be reported with explicit uncertainty.

## Comparison status summary

| Area | Status | Notes |
|---|---|---|
| table exists | MATCH | live DB confirms `node_core` exists |
| primary key | UNKNOWN | not fully exposed in safe metadata inspection |
| key identity columns | MATCH / PARTIAL | matches repo expectation in runtime architecture |
| lifecycle columns | MATCH / PARTIAL | consistent with node runtime docs |
| vector + graph companion tables | MISSING | `node_vector_memory` and `node_relationships` are absent |
| RLS / policies | UNKNOWN | not fully exposed during this phase |
| indexes | UNKNOWN | not fully exposed during this phase |
| constraints | UNKNOWN | not fully exposed during this phase |

## Expected `node_core` definition from migration

The canonical migration defines a table with core fields such as:

- `node_id` as UUID primary key
- `node_type`
- `node_code`
- `node_name`
- `node_description`
- `parent_node`
- `owner_node`
- `visibility`
- `permissions`
- `metadata`
- `ui_schema`
- `vector_id`
- created/updated lifecycle fields
- graph and vector linkage fields

## Observed live state

- `node_core` table exists in the current connected database
- runtime authentication and kernel execution both succeed against it
- the table is active enough to serve the app
- the live DB does not yet expose the associated `node_relationships` and `node_vector_memory` tables

## Interpretation

This is not proof that the entire 20260210 migration ran successfully.

The live `node_core` may reflect a partial or earlier schema state that is compatible with the current runtime but not complete relative to the canonical Node OS design.

## Status matrix

| Check | Result |
|---|---|
| `node_core` table exists | MATCH |
| `node_core` needed by current runtime | MATCH |
| `node_core` matches full 20260210 design exactly | UNKNOWN |
| `node_relationships` companion table present | MISSING |
| `node_vector_memory` companion table present | MISSING |
| `node_core` likely from earlier partial schema | MISMATCH / PARTIAL |

## Conclusion

The live `node_core` is a real and active component of the current system, but the evidence shows the rest of the canonical Node OS package is not fully present. The current runtime appears to be running against a partial schema state, not a fully reconciled 20260210 installation.
