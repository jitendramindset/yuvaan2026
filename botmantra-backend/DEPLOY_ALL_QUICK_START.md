# DEPLOY_ALL Quick Reference - Command Sequence

## One-Liner: Supabase CLI Method (Automated)

```bash
supabase link --project-ref YOUR_PROJECT_ID && supabase db push
```

Then run verification in Supabase SQL Editor:
```bash
# Copy & paste content of supabase/seed/verify_deploy.sql into SQL Editor
```

---

## Manual Method: Supabase Dashboard SQL Editor

### Step 1: Run All Migrations (In Order)

```
1. Copy: supabase/migrations/000_extensions.sql → Execute
2. Copy: supabase/migrations/001_core_node_system.sql → Execute  
3. Copy: supabase/migrations/002_roles_permissions.sql → Execute
4. Copy: supabase/migrations/003_two_api_system.sql → Execute
5. Copy: supabase/migrations/004_karma_dharma.sql → Execute
6. Copy: supabase/migrations/005_economy.sql → Execute
7. Copy: supabase/migrations/006_contribution_graph.sql → Execute
```

**Expected**: No errors, all complete silently

### Step 2: Run All Seeds (In Order)

```
1. Copy: supabase/seed/001_core_seed.sql → Execute
2. Copy: supabase/seed/002_roles_seed.sql → Execute
3. Copy: supabase/seed/010_templates_seed.sql → Execute
4. Copy: supabase/seed/011_widgets_seed.sql → Execute
```

**Expected**: "Query executed successfully" or row count confirmations

### Step 3: Verify Deployment

```
Copy: supabase/seed/verify_deploy.sql → Execute
```

**Expected**: Output showing all tables with row_count >= 0

---

## Status: ✅ READY FOR EXECUTION

### Files Verified:
- ✅ All 7 migrations (000-006)
- ✅ All 4 seed scripts (001, 002, 010, 011)
- ✅ data_model_registry table added
- ✅ RBAC schema corrected (migration 003)
- ✅ Table references consistent (core_node)
- ✅ All foreign keys resolvable
- ✅ Idempotent SQL (safe for repeated execution)

### Known Issues Fixed:
- ❌ ~~data_model_registry missing~~ → ✅ FIXED (added to migration 001)
- ❌ ~~RBAC column mismatch in migration 003~~ → ✅ FIXED (removed legacy inserts, updated view)
- ❌ ~~node_core vs core_node inconsistency~~ → ✅ FIXED (migration 004 uses core_node)

### Test After Deployment:

```bash
# Option 1: Smoke tests
node smoke-tests/run-smoke-tests.js

# Option 2: Single endpoint test
curl -X POST http://localhost:3001/api/kernel/execute \
  -H "Content-Type: application/json" \
  -d '{"nidHash": "default_root", "actionName": "test"}'

# Option 3: Check database directly
supabase functions invoke kernel-execute --body '{"test": true}'
```

---

## Rollback Plan

If issues occur:

1. **Check Supabase Backups**: Supabase automatically backs up database
2. **Restore Snapshot**: Supabase Dashboard → Database → Point-in-time recovery
3. **Check Logs**: Supabase Dashboard → Logs for SQL errors
4. **Contact**: supabase support

Note: All migrations use idempotent patterns (CREATE IF NOT EXISTS), so re-running is safe.

---

## Timeline

- **Migrations**: ~5 min (000-006)
- **Seeds**: ~2 min (001, 002, 010, 011)
- **Verification**: ~1 min (verify_deploy.sql)
- **Smoke Tests**: ~2 min (kernel-execute, rag-engine)
- **Total**: ~10 minutes

---

## What Gets Created

### Tables: 38 total
- Core System: 13 (users, core_node, roles, permissions, etc.)
- APIs: 5 (api_logs, user_roles, vector_*, ui_templates)
- Karma/Dharma: 6 (karma_logs, dharma_logs, node_policies, etc.)
- Economy: 8 (wallets, transactions, revenue_share_*, etc.)
- Contribution: 4 (contribution_graph, revenue_distribution_log, etc.)

### Views: 7 total
- user_permissions_view
- api_usage_stats
- user_transaction_summary
- wallet_summary
- top_earners
- recent_distributions
- contribution_type_summary

### Indexes: 50+ total
- Optimized for common queries
- Foreign key indexes
- Search indexes (email, node_code, etc.)

### Triggers: 1 total
- contribution_graph_update_earnings (auto-updates earnings on insert)

---

## Frontend Next Steps

Once deployment verified:

1. Connect React Chat UI to `/api/kernel/execute`
2. Load dashboard layouts from `ui_template` table
3. Render forms/data grids from `ui_template.template_structure`
4. Implement permission checks against `user_permissions_view`
5. Test revenue distribution with `contribution_graph` queries

---

## Questions? 

See detailed docs:
- [DEPLOY_ALL_README.md](./DEPLOY_ALL_README.md) - Full deployment guide
- [DEPLOY_ALL_CHECKLIST.md](./DEPLOY_ALL_CHECKLIST.md) - Detailed checklist
- [db-schema-*.sql](./db-schema-*.sql) - Original schema documentation
- [smoke-tests/README.md](./smoke-tests/README.md) - Test execution guide
