# Phase 4E Report

## Target Objects

- `node_core` (existing; keep)
- `node_relationships` (missing; create)
- `node_vector_memory` (missing; create)
- `family_tree` (missing; create)
- `user_family_lineage` (missing; create)

## Source Migrations

- `supabase/migrations/20260209_add_vanshawali_tables.sql`
- `supabase/migrations/20260210_node_core_vector_architecture.sql`
- supporting comparison reads from:
  - `botmantra-backend/supabase/migrations/20260206_full_schema_baseline.sql`
  - `botmantra-backend/supabase/migrations/20260207_add_onboarding_tables.sql`
  - `botmantra-backend/supabase/migrations/20260209_add_admin_mcp_tables.sql`
  - `botmantra-backend/routes-vanshawali.js`
  - `botmantra-backend/core/node-graph.js`
  - `botmantra-backend/core/node-schema.js`

## Corrective Migration

The corrective migration is created at:

- `supabase/migrations/20260815023830_vanshawali_nodeos_reconciliation.sql`

It is intentionally additive and non-destructive.

## Objects Created

- `node_relationships`
- `node_vector_memory`
- `family_tree`
- `user_family_lineage`
- dependent indexes
- dependent policies
- required functions

## Objects Intentionally Skipped

- `node_core` recreation
- any destructive table reset
- any data cleanup or archival operation
- any migration replay of unrelated admin/onboarding tables
- any non-required functions or table wrappers

## Functions

Included functions are limited to those validated by the canonical schema and active app contract:

- `get_user_lineage`
- `get_family_tree_with_members`
- `search_families`

Potential helper functions such as `get_node_full`, `get_nodes_by_type`, and `search_similar_vectors` are treated as review-only and not forced into this migration unless a human approves full NodeOS alignment.

## RLS

The migration includes RLS for:

- `family_tree`
- `user_family_lineage`
- `node_vector_memory`
- `node_relationships`

Policies are created only when missing and preserve the runtime contract:

- users can view their own lineage
- family access remains scoped to the owning user or service role
- public read access is kept limited and consistent with the canonical migration semantics

## Extensions

- `pgcrypto` for `gen_random_uuid()`
- `vector` for pgvector similarity support

These are included only if missing and are protected with `IF NOT EXISTS`.

## Safety Review

The migration contains no destructive DDL or data manipulation statements.

## Idempotency Review

The migration is safe for repeated review in partially migrated databases because it uses:

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `CREATE POLICY ...` guarded by catalog checks
- `CREATE OR REPLACE FUNCTION` only where needed

## Potential Conflicts

- multiple migration sets exist in the repo, which may represent overlapping historical versions
- the live DB may already contain partial schema objects created outside the canonical migration set
- the canonical migration scripts include destructive resets that are intentionally not reused here
- pgvector may or may not already be installed in the target database

## Data Risk

The risk is moderate because the runtime is active and the database is serving the live app. However, this corrective migration does not drop or delete data, so the risk is constrained to schema extension rather than destructive reset.

## Required Pre-Execution Backup

Before any live execution, a human should ensure all of the following:

- full schema snapshot of public schema
- full data backup of `node_core`
- row-level backup of any existing family lineage or family tree tables
- confirmation of the exact live project target behind `api.mantravat.cloud`
- confirmation of migration history in the target DB

## Exact Execution Plan

1. Verify the live project identity behind `api.mantravat.cloud`.
2. Capture schema and data backup.
3. Run the additive reconciliation migration in a staging or review environment first.
4. Validate objects and functions with the read-only validation script.
5. Run auth + kernel + family route smoke tests.
6. Only then decide whether the production environment is safe for migration execution.

## Post-Migration Validation

Use the read-only validation script:

- `scripts/validate-vanshawali-schema.sql`

Validate:

- table existence
- required indexes
- function existence
- policy existence
- table-level RLS status
- vector extension presence

## Rollback Considerations

If results are not acceptable after execution:

- restore the schema backup
- restore the affected table data
- drop only the newly created objects added by the corrective migration
- re-run auth and kernel validation

## Final Recommendation

READY FOR HUMAN REVIEW

This migration is intentionally designed as a non-destructive additive reconciliation and is ready for review by a human operator before any database write is allowed.
