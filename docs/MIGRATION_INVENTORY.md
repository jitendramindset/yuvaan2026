# Migration Inventory

## Migration chronology

| Date | Filename | Purpose | Classification | Relevant objects |
|---|---|---|---|---|
| 2026-02-06 | `botmantra-backend/supabase/migrations/20260206_full_schema_baseline.sql` | baseline platform schema | REQUIRED / LEGACY | `node_core`, many platform tables |
| 2026-02-06 | `botmantra-backend/supabase/migrations/20260206_add_two_api_system_extras.sql` | API/log extras | OPTIONAL | `api_logs`, `user_roles` |
| 2026-02-06 | `botmantra-backend/supabase/migrations/20260206_add_missing_indexes.sql` | indexes | OPTIONAL | indexes |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_fix_auth_columns.sql` | auth fix | OPTIONAL | auth/user fields |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_backfill_users_first_last.sql` | backfill auth fields | OPTIONAL | users |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_fix_users_first_last.sql` | auth fix | OPTIONAL | users |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_fix_otp_store_otp_code.sql` | OTP fix | OPTIONAL | otp_store |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_fix_otp_store_method.sql` | OTP fix | OPTIONAL | otp_store |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_fix_otp_store_email.sql` | OTP fix | OPTIONAL | otp_store |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_add_dashboards_table.sql` | dashboard support | OPTIONAL | dashboards |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_add_missing_views.sql` | view creation | OPTIONAL | views |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_add_node_logs.sql` | node logs | OPTIONAL | node_logs |
| 2026-02-07 | `botmantra-backend/supabase/migrations/20260207_add_onboarding_tables.sql` | onboarding tables | OPTIONAL | `node_identity`, `trust_state`, `reward_wallet`, `user_profiles` |
| 2026-02-09 | `botmantra-backend/supabase/migrations/20260209_add_admin_mcp_tables.sql` | admin MCP support | OPTIONAL | `admin_profiles`, `admin_action_logs`, `admin_memory_vectors`, `ui_schemas` |
| 2026-02-09 | `botmantra-backend/supabase/migrations/20260209_add_ai_tool_discovery_and_telemetry.sql` | AI tool and telemetry | OPTIONAL | `ai_execution_log`, functions |
| 2026-02-09 | `supabase/migrations/20260209_add_vanshawali_tables.sql` | family lineage and family tree | REQUIRED for canonical Vanshawali | `family_tree`, `user_family_lineage`, functions |
| 2026-02-10 | `supabase/migrations/20260210_node_core_vector_architecture.sql` | Node OS + vector graph | REQUIRED for canonical Node OS | `node_core`, `node_vector_memory`, `node_relationships`, functions |

## Classification notes

### Required for canonical Vanshawali / Node OS
- `supabase/migrations/20260209_add_vanshawali_tables.sql`
- `supabase/migrations/20260210_node_core_vector_architecture.sql`

### Optional / support-only migrations
- the 20260206 to 20260209 backend support migrations are not the missing Vanshawali schema but may still be relevant for overall runtime compatibility

### Legacy / duplicate risk
- there are duplicate migration sets under both `supabase/migrations` and `botmantra-backend/supabase/migrations`
- this suggests schema drift and multiple possible target environments

### Destructive operations note
- `20260209_add_vanshawali_tables.sql` contains `DROP TABLE IF EXISTS ... CASCADE`
- `20260210_node_core_vector_architecture.sql` contains `DROP TABLE IF EXISTS node_relationships`, `node_vector_memory`, and `node_core` before re-creating them
- these are not safe to run blindly on a live project with current app data

## Migration ordering concerns

The repo shows both a family projection migration and a NodeOS core migration. They are conceptually related but not strictly codependent:

- `20260210_node_core_vector_architecture.sql` defines the core node graph and vector memory model
- `20260209_add_vanshawali_tables.sql` defines family projection tables over user and family data

The canonical order in the repo is effectively:

1. node core / graph / vector migration
2. family tree / family lineage migration

However, because both include destructive statements and the live DB already contains `node_core`, the migration history must be reconciled before direct execution.
