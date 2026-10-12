# Live Database Forensics

## Connected Environment

- Backend runtime is configured to the Supabase project at `https://api.mantravat.cloud`.
- The active backend `.env` file and the frontend `.env` file both target the same host, without exposing secret values.
- The canonical repo-level and backend-level migrations also reference the same project family and naming conventions, but the live project does not currently expose the Vanshawali tables.
- The live runtime is therefore not obviously pointed at a different project; it is pointed at the configured `api.mantravat.cloud` project, but that project is missing the expected objects.

Evidence:

- backend `.env` contains `SUPABASE_URL=https://api.mantravat.cloud`
- frontend `.env` contains `REACT_APP_SUPABASE_URL=https://api.mantravat.cloud`
- `botmantra-backend/config/supabase.js` defaults to `https://api.mantravat.cloud`
- runtime verification: `projectHost: "api.mantravat.cloud"`, `env: "development"`
- live metadata check: `node_core` exists, but:
  - `node_relationships` missing
  - `node_vector_memory` missing
  - `family_tree` missing
  - `user_family_lineage` missing

## node_core Status

- `node_core` exists in the live connected schema.
- Runtime check reported: `exists: true`, `count: 1`.
- This means the core identity table is present and used by the app.
- The data is not yet proven to match the 20260210 architecture schema exactly, because the full table definition and migration metadata were not available in a metadata-discovery layer. However, the table is live and reachable.

## node_relationships Status

- Status: MISSING
- Runtime error: `Could not find the table 'public.node_relationships' in the schema cache`
- This object is expected by the repo’s canonical Node OS schema and by `20260210_node_core_vector_architecture.sql`.

## node_vector_memory Status

- Status: MISSING
- Runtime error: `Could not find the table 'public.node_vector_memory' in the schema cache`
- This object is expected by the vector architecture migration and by the Node OS runtime documentation.

## family_tree Status

- Status: MISSING
- Runtime error: `Could not find the table 'public.family_tree' in the schema cache`
- This object is expected by `20260209_add_vanshawali_tables.sql`.

## user_family_lineage Status

- Status: MISSING
- Runtime error: `Could not find the table 'public.user_family_lineage' in the schema cache`
- This object is expected by the same Vanshawali migration and by the route layer that serves family data.

## Alternative Family Objects

Safe metadata inspection did not reveal any active family-like tables in the connected project.

Observed result:

- no `family_tree` table
- no `user_family_lineage` table
- no `family`/`families`/`family_members`/`lineage` tables visible in the active connected schema metadata at the time of verification

Conclusion:

- `NO FAMILY DATA OBJECTS FOUND` in the live connected project for the Vanshawali route stack.

## Migration History

Repository migration files discovered:

- `supabase/migrations/20260209_add_vanshawali_tables.sql`
- `supabase/migrations/20260210_node_core_vector_architecture.sql`
- `botmantra-backend/supabase/migrations/20260209_add_vanshawali_tables.sql`
- additional later migration files in the backend migration directory, including the 20260206 and 20260207 sequence and the 20260209 admin/AI migrations

Migration purpose and status summary:

| Migration | Purpose | Tables created | Functions created | RLS | Status |
|---|---|---|---|---|---|
| 20260209_add_vanshawali_tables.sql | Family tree and lineage model | `family_tree`, `user_family_lineage` | `get_user_lineage`, `get_family_tree_with_members`, `search_families` | Yes | NOT CONFIRMED APPLIED |
| 20260210_node_core_vector_architecture.sql | Node OS core graph + vector memory | `node_core`, `node_vector_memory`, `node_relationships` | `get_node_full`, `get_nodes_by_type`, `search_similar_vectors` | Yes | NOT CONFIRMED APPLIED |
| 20260206_full_schema_baseline.sql | baseline system schema | broad platform tables | many | mixed | UNKNOWN |
| 20260207_* | auth, onboarding, dashboards, logs, views, fixes | multiple support tables | various | mixed | UNKNOWN |
| 20260209_add_admin_mcp_tables.sql | admin MCP support | admin-related tables | likely admin functions | likely | UNKNOWN |
| 20260209_add_ai_tool_discovery_and_telemetry.sql | AI/tool admin telemetry | AI metadata tables | likely | likely | UNKNOWN |

Important nuance:

- The file existence alone is not proof of application.
- The live project does not expose a standard migration metadata table such as `schema_migrations` or `supabase_migrations`, so migration application status cannot be proven from the live database metadata alone.

## Repository References

The repo clearly expects these tables across multiple runtime layers, including:

- canonical DB design docs
- Node OS runtime abstraction files
- routes that assume a family model
- kernel action flows that expect graph and vector memory objects

Key source references:

- `supabase/migrations/20260209_add_vanshawali_tables.sql`
- `supabase/migrations/20260210_node_core_vector_architecture.sql`
- `botmantra-backend/core/node-schema.js`
- `botmantra-backend/core/node-graph.js`
- `botmantra-backend/core/permission-engine.js`
- `botmantra-backend/core/kernel-executor.js`
- `botmantra-backend/routes-vanshawali.js` (as documented in the project architecture)

## Live Database Evidence

Verified runtime evidence:

- Authenticated backend login succeeded
- Authenticated kernel execution succeeded
- `node_core` exists in the live project
- Missing objects were reported as absent from the connected schema cache
- no standard migration history table exposed in live metadata

Observed summary:

```json
{
  "projectHost": "api.mantravat.cloud",
  "env": "development",
  "required": {
    "node_core": { "exists": true, "count": 1 },
    "node_relationships": { "exists": false },
    "node_vector_memory": { "exists": false },
    "family_tree": { "exists": false },
    "user_family_lineage": { "exists": false }
  }
}
```

## Schema Alignment

| Object | Expected by code | Expected migration | Live DB | Status |
|---|---|---|---|---|
| `node_core` | Yes | 20260210 | Exists | MATCH |
| `node_relationships` | Yes | 20260210 | Missing | MISSING |
| `node_vector_memory` | Yes | 20260210 | Missing | MISSING |
| `family_tree` | Yes | 20260209 | Missing | MISSING |
| `user_family_lineage` | Yes | 20260209 | Missing | MISSING |
| `schema_migrations` | Usually present in Supabase | N/A | Not visible | UNKNOWN |
| family alternatives | Possibly | N/A | No equivalent objects found | NO FAMILY DATA OBJECTS FOUND |

## Data Safety

- The live database currently contains at least one `node_core` row and appears to be an active development database.
- Real/shared application data cannot be ruled out.
- Because the project is development and the auth flow is operational, the database should be treated as containing important live data.
- `DATA SAFETY = HIGH`

## Migration Risks

The migration risk is high if applied blindly because:

- the project appears active and data-bearing
- the migration history is not visible in the live database
- the runtime is already connected and serving auth + kernel calls
- the canonical family tables are absent, but the app still functions at a basic level

This means the safest approach is not to create new tables directly or modify the live schema without a controlled corrective migration and a schema reconciliation step.

## Root Cause

The most likely root cause is a schema-version mismatch, not a route or app-code failure.

The repo expects a Supabase schema that includes Node OS and Vanshawali tables, but the connected project does not currently have them. The evidence suggests one of these cases:

1. the migrations were never applied to the connected project
2. the project is an older or different database than the repo expected
3. the migration history was not persisted or was partially lost
4. the project is a partially restored environment with only `node_core` present

The evidence does not support a code bug alone; it points to a database/schema mismatch.

## Recommended Option

OPTION D — Repair migration history/schema mismatch

## Why

- The backend is already connected to `api.mantravat.cloud` and is functioning for auth and kernel execution.
- The repo clearly expects the missing tables, but the connected project does not have them.
- `node_core` exists, which suggests the database is partially initialized but not fully aligned with the canonical Node OS + Vanshawali schema.
- There is no evidence the required migration files were applied to the live database.
- There is no evidence of an alternative family schema already present.

## Exact Next Database Action

1. Confirm the exact Supabase project identity and compare it against the intended canonical project.
2. Inspect the migration history in the actual project or restore the migration metadata if the project was partially rebuilt.
3. Determine whether the missing tables were never created or whether the connected project is a stale/older environment.
4. Only after evidence is complete, apply the single corrective migration or restore the original migration chain.
5. Do not create replacement tables or run ad hoc schema changes before reconciliation.

This phase remains forensic only.
