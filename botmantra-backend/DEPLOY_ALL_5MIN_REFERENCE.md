# DEPLOY_ALL - 5 Minute Quick Reference Card

Print this page or keep it visible during deployment.

---

## TL;DR - Fastest Path to Deployment

### Step 1: Choose Your Method (1 minute)

**Option A: Supabase CLI** (Automated, Recommended)
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

**Option B: Manual Dashboard** (Copy & Paste)
```
1. Open https://<PROJECT_ID>.supabase.co
2. Go to SQL Editor
3. Copy migration 000 → Execute
4. Copy migration 001 → Execute
5. ... repeat for 002-006
6. Copy seed 001 → Execute
7. ... repeat for 002, 010, 011
```

### Step 2: Verify (1 minute)
```sql
-- Copy this to SQL Editor and execute:
SELECT table_name, COUNT(*) as row_count FROM information_schema.tables 
WHERE table_schema='public' 
GROUP BY table_name 
ORDER BY table_name;
```
**Expected**: 38 tables listed, all with row_count >= 0

### Step 3: Test (1 minute)
```bash
node smoke-tests/run-smoke-tests.js
```
**Expected**: All tests pass ✅

### Step 4: Done! (2 minutes)
- Database deployed ✅
- Verified ✅
- Tested ✅
- Ready for frontend ✅

---

## File Locations & Deployment Order

### 1. Migrations (Execute in THIS order)
```
supabase/migrations/
  000_extensions.sql           ← Run first
  001_core_node_system.sql     ← Run second
  002_roles_permissions.sql    ← Run third
  003_two_api_system.sql       ← Run fourth
  004_karma_dharma.sql         ← Run fifth
  005_economy.sql              ← Run sixth
  006_contribution_graph.sql   ← Run last
```

### 2. Seeds (Execute AFTER all migrations)
```
supabase/seed/
  001_core_seed.sql     ← Run first
  002_roles_seed.sql    ← Run second
  010_templates_seed.sql ← Run third
  011_widgets_seed.sql  ← Run fourth
  verify_deploy.sql     ← Run for verification
```

### 3. Tests (Execute AFTER seeds)
```
smoke-tests/
  run-smoke-tests.js    ← Runs all tests at once
```

---

## What Gets Created

```
Total:
  • 38 tables
  • 7 views
  • 50+ indexes
  • 1 trigger

Breakdown:
  • Core System: 13 tables (users, core_node, ui_template, etc.)
  • RBAC: 3 tables (roles, permissions, role_permissions)
  • APIs: 5 tables (api_logs, user_roles, vectors, etc.)
  • Karma/Dharma: 6 tables
  • Economy: 8 tables (wallets, transactions, etc.)
  • Contribution: 4 tables (earnings tracking, etc.)
```

---

## Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Column X does not exist" | Migration 003 schema issue | ✅ FIXED in this version |
| "Foreign key violation" | data_model_registry missing | ✅ FIXED - now in migration 001 |
| "Table already exists" | Rerunning migration | OK - migrations are idempotent |
| "Extension not found" | Didn't run migration 000 first | Run migrations in order: 000-006 |
| "Permission denied" | Supabase role issue | Check role permissions in Supabase |

---

## Expected Output

### After Migrations + Seeds
```
users              | 0
core_node          | 1        (default_root)
roles              | 4        (owner, admin, editor, viewer)
permissions        | 8+       (system permissions)
role_permissions   | 8+
ui_template        | 4        (2 templates + 2 widgets)
wallets            | 0
transactions       | 0
... (30 more tables)| >= 0
```

### After Smoke Tests
```
✓ kernel-execute-smoke.js PASSED
✓ rag-engine-smoke.js PASSED (or expected auth failure)
✓ All tests completed successfully
```

---

## Quick Command Reference

```bash
# CLI Deployment
supabase login
supabase link --project-ref YOUR_ID
supabase db push

# Run Tests
node smoke-tests/run-smoke-tests.js

# Check Database
supabase db list

# Reset (WARNING: Deletes data)
supabase db reset

# View Logs
supabase functions list
```

---

## Documentation Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| DEPLOY_ALL_QUICK_START.md | Commands & quick ref | 2 min |
| DEPLOY_ALL_MASTER_INDEX.md | Overview & navigation | 5 min |
| DEPLOY_ALL_CHECKLIST.md | Step-by-step + troubleshooting | 10 min |
| DEPLOY_ALL_README.md | Complete guide | 15 min |
| DEPLOY_ALL_EXECUTION_LOG.md | Track your progress | Use during |
| DEPLOY_ALL_FINAL_STATUS.md | Final summary | 5 min |
| DEPLOY_ALL_VISUAL_FLOWS.md | Diagrams & flows | 5 min |

---

## Rollback (If Something Goes Wrong)

### Option 1: Fast (5 min)
```
Supabase Dashboard → Database → Backups → Select → Restore
```

### Option 2: Complete Reset (10 min)
```bash
supabase db reset
supabase db push
```

---

## Success Checklist

- [ ] All 7 migrations executed (000-006)
- [ ] All 4 seeds executed (001, 002, 010, 011)
- [ ] verify_deploy.sql shows 38 tables
- [ ] kernel-execute-smoke.js passes
- [ ] Database accessible from backend
- [ ] Ready to start frontend dev ✅

---

## Post-Deployment Tasks

- [ ] Seed data_model_registry with your modules
- [ ] Create admin user via Supabase Auth
- [ ] Enable Row-Level Security (RLS) policies
- [ ] Test /api/kernel/execute endpoint
- [ ] Start frontend development

---

## Timeline

```
Migrations:      ~10 min
Seeds:           ~3 min
Verification:    ~1 min
Smoke Tests:     ~3 min
─────────────────────────
TOTAL:          ~17 min
(+13 min buffer for troubleshooting = 30 min allocated)
```

---

## Key Files You'll Need

During deployment, keep these visible:

1. **DEPLOY_ALL_QUICK_START.md** - Your commands
2. **DEPLOY_ALL_EXECUTION_LOG.md** - Track progress
3. **DEPLOY_ALL_CHECKLIST.md** - Troubleshooting

---

## Next Phase

After database is live (30 min from now):

```
✅ Database Deployment Complete
         │
         └─→ Frontend Development (2-3 weeks)
              ├─ Chat UI
              ├─ Dashboard Engine
              ├─ Form Builder
              └─ Data Grid
```

See: CHAT_UI_IMPLEMENTATION_COMPLETE.md

---

## Status

```
✅ All SQL files verified and corrected
✅ All dependencies resolved
✅ All documentation complete
✅ All tests ready
✅ Ready for execution

You're 30 minutes away from a live database! 🚀
```

---

**Print this card or keep it visible during deployment.**

**Questions? See full documentation files in botmantra-backend/**

**Ready? Start with:** DEPLOY_ALL_QUICK_START.md
