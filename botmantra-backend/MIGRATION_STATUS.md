# Migration Status Checklist

Last updated: 2026-02-06

## Summary
- Removed: supabase/migrations/001_core_node_system.sql (per request)
- Removed (covered by baseline): supabase/migrations/002_roles_permissions.sql
- Removed (covered by baseline): supabase/migrations/20260206_sync_schema_columns.sql
- Removed (covered by baseline): supabase/migrations/003_two_api_system.sql
- Removed (covered by baseline): supabase/migrations/004_karma_dharma.sql
- Removed (covered by baseline): supabase/migrations/005_economy.sql
- Removed (covered by baseline): supabase/migrations/006_contribution_graph.sql
- Removed (covered by baseline): db-migrations/20260203_app_builder_mode.sql
- Removed (covered by baseline): db-migrations/20260203_dashboard_setup.sql
- Removed (covered by baseline): db-migrations/20260203_security_hardening.sql
- Removed (covered by baseline): db-migrations/20260203_security_hardening_clean.sql
- Removed (covered by baseline): db-migrations/20260203_ui_extension_pack_part1_marketplace.sql
- Removed (covered by baseline): db-migrations/20260203_ui_extension_pack_part2_user_custom.sql
- Removed (covered by baseline): db-migrations/20260203_ui_extension_pack_part3_drag_drop.sql
- Removed (covered by baseline): db-migrations/20260203_ui_extension_pack_part4_theme_editor.sql
- Removed (covered by baseline): db-migrations/20260203_ui_extension_pack_part5_white_label.sql
- Removed (covered by baseline): db-migrations/20260206_create_password_reset_store.sql
- Removed (covered by baseline): migrations/20260203_create_ai_websites_table.sql
- Pending verification: whether core node schema is fully created elsewhere.
- Add/ensure indexes: supabase/migrations/20260206_add_missing_indexes.sql

## Supabase migrations
| File | Status | Notes |
| --- | --- | --- |
| supabase/migrations/000_extensions.sql | pending verification | Ensure required extensions (e.g., vector, postgis) are installed. |
| supabase/migrations/20260206_add_missing_indexes.sql | pending verification | Adds indexes from Supabase export; safe to re-run. |
| supabase/migrations/20260206_full_schema_baseline.sql | pending verification | Baseline create for all public tables + PKs/FKs from CSV export. |
| supabase/migrations/20260206_add_two_api_system_extras.sql | pending verification | Adds api_logs, user_roles, updated_at triggers, and views. |
| supabase/migrations/20260207_add_missing_views.sql | pending verification | Adds v_* views from CSV export. |
| supabase/migrations/20260207_fix_auth_columns.sql | pending verification | Adds users.auth_method and otp_store.created_at. |
| supabase/migrations/20260207_fix_otp_store_email.sql | pending verification | Adds otp_store.email. |
| supabase/migrations/20260207_fix_otp_store_method.sql | pending verification | Adds otp_store.method. |
| supabase/migrations/20260207_fix_otp_store_otp_code.sql | pending verification | Adds otp_store.otp_code. |
| supabase/migrations/20260207_fix_users_first_last.sql | pending verification | Adds users.first_name and users.last_name. |
| supabase/migrations/20260207_backfill_users_first_last.sql | pending verification | Backfills users first/last name from full_name. |

## db-migrations (manual/legacy)
| File | Status | Notes |
| --- | --- | --- |
| db-migrations/schema_introspection.sql | reference | Used to export schema; not a migration. |

## migrations (app-level)
| File | Status | Notes |
| --- | --- | --- |
| (none) | n/a | App-level migrations directory is now empty. |

## Missing / needs confirmation
- Core node system tables (node_core, node_permission, node_key_vault, etc.)
  - There is a reference schema at db-schema-core-node-system.sql, but the Supabase migration 001 was removed.
  - Confirm where these tables are created before running inserts.

- Large set of public tables present in CSV export are not created by current migrations.
  - Source of truth: botmantra-backend/Tables + columns.csv
  - Action: apply new baseline migration if these tables are not created elsewhere.

## Next actions (to mark done or remove)
1. Run full schema diff (tables + columns + constraints + indexes) after applying migrations.
2. Mark each migration as done when confirmed present in schema.
3. Remove duplicate/legacy scripts once confirmed applied (e.g., security_hardening vs security_hardening_clean).
