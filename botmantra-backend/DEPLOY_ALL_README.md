# DEPLOY_ALL Migration & Seed Execution Guide

## Overview
This guide outlines the complete deployment sequence for the BotMantra / Node OS platform using Supabase migrations and seed scripts.

## Directory Structure

```
supabase/
├── migrations/          # SQL migrations (numbered, run in order)
│   ├── 000_extensions.sql
│   ├── 001_core_node_system.sql
│   ├── 002_roles_permissions.sql
│   ├── 003_two_api_system.sql
│   ├── 004_karma_dharma.sql
│   ├── 005_economy.sql
│   └── 006_contribution_graph.sql
│
├── seed/                # Seed/data initialization (run after migrations)
│   ├── 001_core_seed.sql
│   ├── 002_roles_seed.sql
│   ├── 010_templates_seed.sql
│   ├── 011_widgets_seed.sql
│   └── verify_deploy.sql
│
├── functions/           # Edge Functions (deployed separately)
│   ├── kernel-execute/
│   └── rag-engine/
│
├── policies/            # Row-Level Security (RLS) policies
├── triggers/            # Database triggers
├── types/               # Auto-generated types
└── extensions/          # Extension configurations
```

## Deployment Steps

### Step 1: Database Extensions
Run the extensions migration first:
```sql
-- supabase/migrations/000_extensions.sql
-- Creates: pgcrypto, vector
```

### Step 2: Core Schema (Sequential Order)
Run migrations in order:

1. **001_core_node_system.sql**
   - Creates: users, core_node, node_relationship, node_permission, node_role, ui_template, data_model_registry, node_selected_fields, node_module_config, onboarding_session, transaction_log, website_scrape_data, session

2. **002_roles_permissions.sql**
   - Creates: roles, permissions, role_permissions

3. **003_two_api_system.sql**
   - Creates: api_logs, user_roles, vector_documents, vector_chunks, ui_templates
   - Creates views: user_permissions_view, api_usage_stats

4. **004_karma_dharma.sql**
   - Creates: karma_logs, dharma_logs, node_policies, node_logs, chat_history, node_prompt_templates

5. **005_economy.sql**
   - Creates: wallets, transactions, revenue_share_pool, revenue_share_recipients, wallet_permissions, wallet_balance_history, wallet_settings
   - Creates views: user_transaction_summary, wallet_summary

6. **006_contribution_graph.sql**
   - Creates: contribution_graph, revenue_distribution_log, node_earnings_summary, contribution_weights_template
   - Creates views: top_earners, recent_distributions, contribution_type_summary
   - Creates triggers: contribution_graph_update_earnings

### Step 3: Seed Data (After All Migrations Complete)
Run seed scripts in order:

1. **001_core_seed.sql**
   - Seeds: default root node, default roles, default permissions

2. **002_roles_seed.sql**
   - Seeds: system roles (owner, admin, editor, viewer)
   - Seeds: system permissions
   - Maps permissions to roles

3. **010_templates_seed.sql**
   - Seeds: default dashboard template, basic form template

4. **011_widgets_seed.sql**
   - Seeds: KPI widget, Table widget

5. **verify_deploy.sql**
   - Verification queries to validate deployment

## Supabase CLI Commands

### Push migrations to Supabase:
```bash
supabase db push
```

### Reset local database (WARNING: destructive):
```bash
supabase db reset
```

### Run migrations manually:
```bash
# Connect to Supabase SQL Editor and run each migration file in order
```

### Run seed scripts:
```sql
-- In Supabase SQL Editor, run each seed file sequentially
```

## Important Notes

### Table Dependencies
- **data_model_registry** must exist before **node_selected_fields** references it
- **users** must exist before any foreign key references
- **core_node** must exist before **ui_template** references it
- **roles** and **permissions** must exist before **role_permissions**
- **transactions** must exist before **contribution_graph**

### Data Model Registry
The `data_model_registry` table is referenced by multiple endpoints in:
- `routes-onboarding.js` (module suggestions)
- `routes/ui-tools-api.js` (data model syncing)

You must seed this table with your business modules and fields for the system to work.

### Schema Alignment
All schema files have been updated to use consistent table names:
- `core_node` (not `node_core`)
- `users`, `roles`, `permissions`
- `ui_template` (not `ui_templates`)

### Error Handling
If you encounter reference errors:
1. Check migration order
2. Ensure all referenced tables exist
3. Look for mismatched table names
4. Review foreign key constraints

## Smoke Testing

After deployment, run smoke tests:

```bash
# Test kernel execution endpoint
node smoke-tests/kernel-execute-smoke.js

# Test RAG engine (requires token)
UI_TOOLS_TOKEN=your_token node smoke-tests/rag-engine-smoke.js

# Run all tests
node smoke-tests/run-smoke-tests.js
```

See [smoke-tests/README.md](../smoke-tests/README.md) for details.

## Rollback Strategy

1. **No Data Loss**: All tables use `CREATE TABLE IF NOT EXISTS`
2. **Snapshot First**: Take a Supabase snapshot before deployment
3. **Disable Features**: Don't drop tables; disable features via flags
4. **Staged Rollback**: Roll back migrations one by one if needed

## Post-Deployment Checklist

- [ ] All 6 migrations completed
- [ ] All 4 seed scripts loaded
- [ ] Verify deployment returns row counts (run verify_deploy.sql)
- [ ] Smoke tests pass
- [ ] data_model_registry seeded with your modules
- [ ] user_roles mappings created
- [ ] Test /api/kernel/execute endpoint
- [ ] Test /api/ui-tools/rag endpoint (if RAG enabled)

## Support

For detailed schema documentation, see:
- `db-schema-core-node-system.sql`
- `db-schema-roles-permissions.sql`
- `db-schema-two-api-system.sql`
- `db-schema-karma-dharma.sql`
- `db-schema-economy.sql`
- `db-schema-contribution-graph.sql`
