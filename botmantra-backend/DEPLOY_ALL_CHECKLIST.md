# DEPLOY_ALL Execution Checklist

**Status**: ✅ ALL SQL FILES VERIFIED AND READY FOR DEPLOYMENT

## Pre-Deployment Requirements

### Environment Setup
- [ ] Supabase project created at https://supabase.com
- [ ] Project URL noted: `https://<PROJECT_ID>.supabase.co`
- [ ] Service role API key obtained (Settings → API)
- [ ] PostgREST API key obtained
- [ ] Node.js and npm installed locally
- [ ] Supabase CLI installed: `npm install -g supabase`

### Local Setup
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <PROJECT_ID>

# Create local Postgres (Docker required)
supabase start
```

## Deployment Sequence

### Phase 1: Extensions (5 minutes)
```bash
# File: supabase/migrations/000_extensions.sql
# Action: Copy content to Supabase SQL Editor and execute
# Expected: No output (extensions created silently)
# Creates: pgcrypto, vector extensions
```

### Phase 2: Core Schema (15 minutes)
Execute in this exact order:

```bash
# 1. Core Node System
# File: supabase/migrations/001_core_node_system.sql
# Creates: 13 tables + indexes
# Rows: 0 (schema only)

# 2. Roles & Permissions
# File: supabase/migrations/002_roles_permissions.sql
# Creates: 3 tables + indexes
# Rows: 0 (schema only)

# 3. Two API System
# File: supabase/migrations/003_two_api_system.sql
# Creates: 5 tables, 1 view
# Rows: 0 (schema only)
# FIXED: Removed legacy inserts, corrected RBAC columns

# 4. Karma & Dharma
# File: supabase/migrations/004_karma_dharma.sql
# Creates: 6 tables + indexes
# Rows: 0 (schema only)

# 5. Economy System
# File: supabase/migrations/005_economy.sql
# Creates: 8 tables + views
# Rows: 0 (schema only)

# 6. Contribution Graph
# File: supabase/migrations/006_contribution_graph.sql
# Creates: 4 tables + views + triggers
# Rows: 0 (schema only)
```

### Phase 3: Seed Data (5 minutes)
Execute in this exact order:

```bash
# 1. Core Seed
# File: supabase/seed/001_core_seed.sql
# Creates: default_root node, system roles, permissions
# Rows Added: ~3 (root node, role, permissions)
# Status Check: SELECT COUNT(*) FROM core_node; -- should be >= 1

# 2. Roles & Permissions Seed
# File: supabase/seed/002_roles_seed.sql
# Creates: owner, admin, editor, viewer roles
# Rows Added: ~12 (4 roles + 8 permissions)
# Status Check: SELECT COUNT(*) FROM roles; -- should be >= 4

# 3. Templates Seed
# File: supabase/seed/010_templates_seed.sql
# Creates: dashboard_default_v1, form_basic_v1
# Rows Added: ~2
# Status Check: SELECT COUNT(*) FROM ui_template; -- should be >= 2

# 4. Widgets Seed
# File: supabase/seed/011_widgets_seed.sql
# Creates: widget_kpi_v1, widget_table_v1
# Rows Added: ~2
# Status Check: SELECT COUNT(*) FROM ui_template; -- should be >= 4
```

### Phase 4: Verification (5 minutes)
```bash
# File: supabase/seed/verify_deploy.sql
# Action: Copy content to Supabase SQL Editor and execute
# Expected Output: All tables listed with row counts >= 0
# Status: ✅ If all return successfully
```

## Supabase CLI Automated Deployment

If using Supabase CLI locally:

```bash
# Push all migrations to Supabase
supabase db push

# This will automatically execute migrations in numerical order
# Status: Check Migrations tab in Supabase dashboard
```

## Manual Supabase Dashboard Deployment

If NOT using CLI:

1. Open Supabase Dashboard → SQL Editor
2. Create new query for each file in order
3. Copy entire file content
4. Execute (▶ button)
5. Wait for completion
6. Repeat for next file

## Expected Outcomes

### Table Counts After Complete Deployment:
```
users: 0 (seeded during frontend auth)
core_node: >= 1 (default_root)
node_relationship: 0
node_permission: 0
node_function: 0
node_role: >= 1
ui_template: >= 4 (2 templates + 2 widgets)
node_selected_fields: 0
node_module_config: 0
data_model_registry: >= 1 (depends on seeding)
onboarding_session: 0
transaction_log: 0
website_scrape_data: 0
session: 0
roles: >= 4 (system roles)
permissions: >= 8 (system permissions)
role_permissions: >= 8
api_logs: 0 (populated during operations)
user_roles: 0 (seeded by auth)
vector_documents: 0
vector_chunks: 0
ui_templates: 0
karma_logs: 0
dharma_logs: 0
node_policies: 0
node_logs: 0
chat_history: 0
node_prompt_templates: 0
wallets: 0 (seeded during onboarding)
transactions: 0
revenue_share_pool: 0
revenue_share_recipients: 0
wallet_permissions: 0
wallet_balance_history: 0
wallet_settings: 0
contribution_graph: 0
revenue_distribution_log: 0
node_earnings_summary: 0
contribution_weights_template: >= 1 (default_v1)
```

### Views Created:
- `user_permissions_view`
- `api_usage_stats`
- `user_transaction_summary`
- `wallet_summary`
- `top_earners`
- `recent_distributions`
- `contribution_type_summary`

### Triggers Created:
- `contribution_graph_update_earnings`

## Troubleshooting

### Error: "Table X does not exist"
**Cause**: Migrations ran out of order
**Fix**: Check that you ran migrations 000-006 sequentially

### Error: "Column X does not exist"
**Cause**: Migration 003 RBAC schema mismatch
**Fix**: Confirmed FIXED in this version - should not occur

### Error: "Foreign key constraint violation"
**Cause**: data_model_registry not created
**Fix**: Confirmed FIXED - data_model_registry added to migration 001

### Error: "Extension pgvector not found"
**Cause**: Extension not enabled
**Fix**: Run migration 000 first

## Post-Deployment Tasks

### 1. Smoke Test Core Endpoints
```bash
# Test kernel execution
BASE_URL=http://localhost:3001 node smoke-tests/kernel-execute-smoke.js

# Test RAG engine
UI_TOOLS_TOKEN=your_token BASE_URL=http://localhost:3001 node smoke-tests/rag-engine-smoke.js

# Run all smoke tests
node smoke-tests/run-smoke-tests.js
```

### 2. Seed data_model_registry
The system requires you to populate data_model_registry with your business modules:

```sql
-- Example: Seed for CUSTOMERS module
INSERT INTO data_model_registry (module, table_name, column_name, display_name, data_type, ui_component, category, is_filterable, is_sortable, is_visible_default, metadata)
VALUES 
  ('CUSTOMERS', 'customers', 'id', 'ID', 'uuid', 'text', 'identifier', true, true, false, '{"readonly": true}'),
  ('CUSTOMERS', 'customers', 'name', 'Customer Name', 'text', 'text', 'personal', true, true, true, '{"maxLength": 255}'),
  ('CUSTOMERS', 'customers', 'email', 'Email', 'text', 'email', 'contact', true, true, true, '{"pattern": "email"}'),
  ('CUSTOMERS', 'customers', 'phone', 'Phone', 'text', 'tel', 'contact', true, true, true, '{"maxLength": 20}'),
  ('CUSTOMERS', 'customers', 'status', 'Status', 'text', 'select', 'metadata', true, true, true, '{"options": ["active", "inactive", "suspended"]}')
ON CONFLICT (module, column_name) DO NOTHING;
```

### 3. Enable Row-Level Security (RLS)
```sql
-- Example: Enable RLS on core_node for multi-tenancy
ALTER TABLE core_node ENABLE ROW LEVEL SECURITY;

-- Create policy for node owners
CREATE POLICY "Users can view their own nodes"
  ON core_node
  FOR SELECT
  USING (owner_id = auth.uid());

-- Create policy for editors
CREATE POLICY "Editors can view and modify nodes"
  ON core_node
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM node_permission
      WHERE node_id = core_node.id
      AND user_id = auth.uid()
      AND permission_type IN ('edit', 'admin')
    )
  );
```

### 4. Create Initial Users
```sql
-- Create admin user (requires Supabase auth setup)
-- This is typically done through Supabase Auth dashboard or your signup flow
```

### 5. Test API Endpoints
```bash
# Test kernel endpoint with curl
curl -X POST http://localhost:3001/api/kernel/execute \
  -H "Content-Type: application/json" \
  -d '{
    "nidHash": "default_root",
    "actionName": "test"
  }'

# Expected: 200 OK with response JSON
```

## Files Ready for Deployment

### Migrations (Ready ✅)
- ✅ 000_extensions.sql
- ✅ 001_core_node_system.sql (includes data_model_registry)
- ✅ 002_roles_permissions.sql
- ✅ 003_two_api_system.sql (FIXED RBAC schema)
- ✅ 004_karma_dharma.sql (verified correct references)
- ✅ 005_economy.sql
- ✅ 006_contribution_graph.sql

### Seeds (Ready ✅)
- ✅ 001_core_seed.sql
- ✅ 002_roles_seed.sql
- ✅ 010_templates_seed.sql (migration-numbered)
- ✅ 011_widgets_seed.sql (migration-numbered)
- ✅ verify_deploy.sql

### Tests (Ready ✅)
- ✅ kernel-execute-smoke.js
- ✅ rag-engine-smoke.js
- ✅ run-smoke-tests.js
- ✅ smoke-tests/README.md

## Next Phase: Frontend Development

After deployment verification:
1. Build React/Next.js Chat UI component
2. Connect to /api/kernel/execute endpoint
3. Build Dashboard engine to load ui_template layouts
4. Build Form builder to render templates as React components
5. Create data grid for transaction_log, contribution_graph

See [CHAT_UI_IMPLEMENTATION_COMPLETE.md](../CHAT_UI_IMPLEMENTATION_COMPLETE.md) for frontend specifications.

---

**Deployment Status**: ✅ READY FOR EXECUTION

**SQL Quality**: ✅ ALL FILES VERIFIED AND CORRECTED
- data_model_registry dependency resolved
- RBAC schema alignment corrected
- Table references consistent (core_node, not node_core)
- All migrations idempotent (CREATE IF NOT EXISTS, ON CONFLICT)

**Next Action**: User approval to execute deployment sequence

**Estimated Time**: 30 minutes for complete deployment + verification
