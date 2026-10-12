# DEPLOY_ALL - Visual Architecture & Flow Diagrams

---

## 1️⃣ Deployment Execution Flow

```
START
  │
  └─→ Read DEPLOY_ALL_QUICK_START.md (5 min)
       │
       └─→ Choose Deployment Method
            │
            ├─→ [OPTION A] Supabase CLI (Recommended)
            │    │
            │    ├─→ supabase login
            │    ├─→ supabase link --project-ref YOUR_ID
            │    └─→ supabase db push
            │         │
            │         └─→ All migrations execute automatically
            │
            └─→ [OPTION B] Manual Supabase Dashboard
                 │
                 ├─→ Open SQL Editor
                 ├─→ Execute migrations 000-006 in order
                 │    (copy & paste each file)
                 └─→ Execute seeds 001, 002, 010, 011 in order
                      (copy & paste each file)
  │
  └─→ Run verify_deploy.sql
       │
       └─→ Check output: All 38 tables with row_count >= 0
            │
            ├─→ ✅ SUCCESS: Continue
            └─→ ❌ ERROR: Troubleshoot with DEPLOY_ALL_CHECKLIST.md
  │
  └─→ Run Smoke Tests
       │
       └─→ node smoke-tests/run-smoke-tests.js
            │
            ├─→ ✅ TESTS PASS: Database ready
            └─→ ❌ TESTS FAIL: Check backend server
  │
  └─→ Database Deployment Complete! 🎉
       │
       └─→ Next: Frontend Development (2-3 weeks)
```

---

## 2️⃣ Migration Execution Sequence

```
Migration Files (Execute in this order)
│
├─→ 000_extensions.sql  ◀─────────────────────┐
│   Creates: pgcrypto, vector               │ Must run first
│   Tables: 0 (extensions only)             │
│   Time: <1 min                            │
│                                           │
├─→ 001_core_node_system.sql  ◀────────────┐ │ Depends on: 000
│   Creates: 13 core tables                │ │
│   Table: data_model_registry (ADDED)     │ │
│   Time: 2 min                            │ │
│   +---> Tables created:                  │ │
│         • users                          │ │
│         • core_node                      │ │
│         • node_relationship              │ │
│         • node_permission                │ │
│         • node_function                  │ │
│         • node_role                      │ │
│         • ui_template                    │ │
│         • node_selected_fields           │ │
│         • node_module_config             │ │
│         • data_model_registry (FIXED)    │ │
│         • onboarding_session             │ │
│         • transaction_log                │ │
│         • website_scrape_data            │ │
│         • session                        │ │
│                                          │ │
├─→ 002_roles_permissions.sql  ◀─────────┐│ │ Depends on: none
│   Creates: 3 RBAC tables                ││ │
│   Time: 1 min                           ││ │
│   +---> Tables: roles, permissions,    ││ │
│         role_permissions                ││ │
│                                          ││ │
├─→ 003_two_api_system.sql  ◀─────────────┼┘ │ Depends on: 001, 002
│   Creates: 5 API tables + 1 view         │ │ (FIXED RBAC schema)
│   Time: 1 min                            │ │
│   +---> Tables: api_logs, user_roles,   │ │
│         vector_documents, vector_chunks,│ │
│         ui_templates                    │ │
│   +---> View: user_permissions_view     │ │
│         (FIXED: uses correct columns)   │ │
│                                          │ │
├─→ 004_karma_dharma.sql  ◀────────────────┘ │ Depends on: 001
│   Creates: 6 governance tables             │ (VERIFIED correct refs)
│   Time: 1 min                              │
│   +---> Tables: karma_logs, dharma_logs, │
│         node_policies, node_logs,        │
│         chat_history,                    │
│         node_prompt_templates            │
│                                          │
├─→ 005_economy.sql  ◀───────────────────────── Depends on: 001
│   Creates: 8 wallet tables + 2 views
│   Time: 2 min
│   +---> Tables: wallets, transactions,
│         revenue_share_pool,
│         revenue_share_recipients,
│         wallet_permissions,
│         wallet_balance_history,
│         wallet_settings
│
└─→ 006_contribution_graph.sql  ◀──────────── Depends on: 001, 005
    Creates: 4 tables + 3 views + 1 trigger
    Time: 1 min
    +---> Tables: contribution_graph,
          revenue_distribution_log,
          node_earnings_summary,
          contribution_weights_template
    +---> Trigger: contribution_graph_update_earnings

TOTAL TIME: ~10 minutes
```

---

## 3️⃣ Seed Data Execution Sequence

```
Seeds (Execute AFTER all migrations)
│
├─→ 001_core_seed.sql
│   Inserts: ~3 rows
│   Data: default_root node, system roles
│   Time: <1 min
│   Depends: Migrations 001, 002
│   Idempotent: YES ✅
│
├─→ 002_roles_seed.sql
│   Inserts: ~12 rows
│   Data: owner, admin, editor, viewer roles + permissions
│   Time: <1 min
│   Depends: Migration 002
│   Idempotent: YES ✅
│
├─→ 010_templates_seed.sql
│   Inserts: ~2 rows
│   Data: dashboard_default_v1, form_basic_v1 templates
│   Time: <1 min
│   Depends: Migration 001
│   Idempotent: YES ✅
│
└─→ 011_widgets_seed.sql
    Inserts: ~2 rows
    Data: widget_kpi_v1, widget_table_v1 widgets
    Time: <1 min
    Depends: Migration 001
    Idempotent: YES ✅

TOTAL TIME: ~3 minutes
TOTAL ROWS INSERTED: ~19 rows
```

---

## 4️⃣ Schema Dependencies Graph

```
pgcrypto & vector extensions (000)
          │
          ▼
    core_node system (001)
          │
          ├─→ users
          ├─→ core_node (main structure)
          ├─→ ui_template
          └─→ data_model_registry ◀── node_selected_fields references it
          
RBAC system (002)
          │
          ├─→ roles
          ├─→ permissions
          └─→ role_permissions

API System (003) ◀── Depends on: 001, 002
          │
          ├─→ api_logs
          ├─→ user_roles ◀── References: users, roles
          ├─→ vector_documents
          └─→ vector_chunks

Karma/Dharma (004) ◀── Depends on: 001
          │
          ├─→ karma_logs
          ├─→ dharma_logs
          ├─→ node_policies ◀── References: core_node
          ├─→ node_logs
          ├─→ chat_history
          └─→ node_prompt_templates

Economy (005) ◀── Depends on: 001
          │
          ├─→ wallets ◀── References: users
          ├─→ transactions
          ├─→ revenue_share_pool
          ├─→ revenue_share_recipients
          ├─→ wallet_permissions
          ├─→ wallet_balance_history
          └─→ wallet_settings

Contribution (006) ◀── Depends on: 001, 005
          │
          ├─→ contribution_graph ◀── References: core_node, transactions
          ├─→ revenue_distribution_log
          ├─→ node_earnings_summary
          └─→ contribution_weights_template
             Trigger: contribution_graph_update_earnings
```

---

## 5️⃣ Database Structure Overview

```
┌──────────────────────────────────────────────────────────┐
│           BOTMANTRA SUPABASE SCHEMA                      │
│         (38 Tables, 7 Views, 50+ Indexes)                │
└──────────────────────────────────────────────────────────┘

┌─ CORE SYSTEM (13 tables)
│  ├─ Users: users, session
│  ├─ Nodes: core_node, node_relationship
│  ├─ Permissions: node_permission, node_function, node_role
│  ├─ UI: ui_template, node_selected_fields, node_module_config
│  ├─ Data Model: data_model_registry
│  └─ Misc: onboarding_session, transaction_log, website_scrape_data
│
├─ RBAC SYSTEM (3 tables)
│  ├─ roles (owner, admin, editor, viewer)
│  ├─ permissions (ui.view, data.write, admin.manage, etc.)
│  └─ role_permissions (mapping)
│
├─ API TRACKING (5 tables + 1 view)
│  ├─ api_logs (request/response audit)
│  ├─ user_roles (user ↔ role mapping)
│  ├─ vector_documents (RAG documents)
│  ├─ vector_chunks (RAG embeddings 1536-dim)
│  ├─ ui_templates (template instances)
│  └─ user_permissions_view (JOIN query)
│
├─ KARMA/DHARMA (6 tables)
│  ├─ karma_logs (0-100 user behavior scores)
│  ├─ dharma_logs (0-100% ethical alignment)
│  ├─ node_policies (governance rules)
│  ├─ node_logs (operation audit with context)
│  ├─ chat_history (conversation logs)
│  └─ node_prompt_templates (custom prompts)
│
├─ ECONOMY (8 tables + 2 views)
│  ├─ wallets (user balances)
│  ├─ transactions (transfers, payments)
│  ├─ revenue_share_pool (distribution pool)
│  ├─ revenue_share_recipients (allocation %)
│  ├─ wallet_permissions (access control)
│  ├─ wallet_balance_history (audit trail)
│  ├─ wallet_settings (preferences)
│  └─ user_transaction_summary, wallet_summary (views)
│
└─ CONTRIBUTION (4 tables + 3 views + 1 trigger)
   ├─ contribution_graph (node participation tracking)
   ├─ revenue_distribution_log (payout audit)
   ├─ node_earnings_summary (aggregated earnings)
   ├─ contribution_weights_template (weighting config)
   ├─ top_earners, recent_distributions, 
      contribution_type_summary (views)
   └─ contribution_graph_update_earnings (trigger)

TOTAL: 38 tables, 7 views, 50+ indexes, 1 trigger
```

---

## 6️⃣ Deployment Timeline

```
Time:        Action:                           Duration:
────────────────────────────────────────────────────────────
T+0:00      Start deployment                    0
T+0:01      Run migrations 000-006              10 min
            (1 min each, sequential)
T+0:10      Run seeds 001, 002, 010, 011        3 min
            (1 min each)
T+0:13      Run verify_deploy.sql               1 min
T+0:14      Run smoke tests                     3 min
            (kernel-execute, rag-engine)
T+0:17      Database ready! 🎉                  Total: 17 min
            
BUFFER TIME: ~13 minutes (for troubleshooting if needed)
TOTAL ALLOCATED: ~30 minutes
```

---

## 7️⃣ Documentation Reading Guide

```
┌─ START HERE
│  │
│  └─→ [5 min] DEPLOY_ALL_MASTER_INDEX.md
│       (Overview, navigation, file index)
│
├─ QUICK PATH (for experienced users)
│  │
│  ├─→ [2 min] DEPLOY_ALL_QUICK_START.md
│  │   (Copy commands, paste into Supabase)
│  │
│  └─→ [30 min] Execute deployment
│
├─ DETAILED PATH (for careful planning)
│  │
│  ├─→ [5 min] DEPLOY_ALL_MASTER_INDEX.md
│  ├─→ [15 min] DEPLOY_ALL_README.md
│  ├─→ [10 min] DEPLOY_ALL_CHECKLIST.md
│  │
│  └─→ [30 min] Execute with tracking
│
└─ REFERENCE
   │
   ├─→ [10 min] DEPLOY_ALL_COMPLETION_SUMMARY.md
   │   (What's been done, what's fixed)
   │
   ├─→ [Use as needed] DEPLOY_ALL_EXECUTION_LOG.md
   │   (Track your progress during deployment)
   │
   ├─→ [5 min] DEPLOY_ALL_FINAL_STATUS.md
   │   (Final summary, next steps)
   │
   └─→ [Reference] DEPLOY_ALL_FILES_STATUS.md
       (Complete file inventory)
```

---

## 8️⃣ Error Recovery Flow

```
┌──────────────────────┐
│   ERROR OCCURS       │
└──────┬───────────────┘
       │
       ├─→ Note error message
       │
       ├─→ Check: Which migration failed?
       │   ├─ 000-006? ──→ See DEPLOY_ALL_CHECKLIST.md (Troubleshooting)
       │   └─ 001-011? ──→ See DEPLOY_ALL_CHECKLIST.md (Troubleshooting)
       │
       ├─→ Common errors:
       │   ├─ "Column X does not exist" ──→ FIXED (migration 003)
       │   ├─ "Foreign key constraint" ──→ FIXED (data_model_registry added)
       │   ├─ "Extension not found" ──→ Run migration 000 first
       │   ├─ "Table already exists" ──→ OK (idempotent, retry safe)
       │   └─ "Permission denied" ──→ Check Supabase role permissions
       │
       └─→ Quick Recovery Options:
           ├─ [Fast] Restore Supabase snapshot (5 min)
           │  Supabase Dashboard → Database → Backups → Restore
           │
           ├─ [Moderate] Fix and re-run single migration (10 min)
           │  Drop table, fix SQL, re-run migration file
           │
           └─ [Nuclear] Reset and start over (15 min)
              supabase db reset && supabase db push
```

---

## 9️⃣ Success Indicators

```
┌─────────────────────────────┐
│    DEPLOYMENT SUCCESS       │
└─────────────────────────────┘

✅ All 7 migrations executed without errors
   └─ Check: Supabase Dashboard → Migrations tab

✅ All 4 seed scripts executed
   └─ Check: No error messages in SQL Editor

✅ verify_deploy.sql shows 38 tables
   └─ Example output:
      users | 0
      core_node | 1
      roles | 4
      ... (34 more tables)

✅ kernel-execute-smoke.js returns 200 status
   └─ Command: node smoke-tests/kernel-execute-smoke.js

✅ Database is accessible from backend
   └─ Check: Backend logs show successful connection

✅ ui_template has 4+ rows (templates + widgets)
   └─ Query: SELECT COUNT(*) FROM ui_template;

✅ user_permissions_view is queryable
   └─ Query: SELECT * FROM user_permissions_view LIMIT 1;

┌─────────────────────────────┐
│  DATABASE IS READY! 🎉      │
│  PROCEED TO FRONTEND PHASE   │
└─────────────────────────────┘
```

---

## 🔟 Next Phase: Frontend Development

```
┌──────────────────────────────────────────┐
│    DATABASE DEPLOYMENT COMPLETE ✅        │
└──────────────────────────────────────────┘
                    │
                    └─→ Frontend Development (2-3 weeks)
                         │
                         ├─→ Chat UI Component
                         │   └─ Connects to /api/kernel/execute
                         │
                         ├─→ Dashboard Engine
                         │   └─ Loads ui_template from database
                         │
                         ├─→ Form Builder
                         │   └─ Renders templates as React components
                         │
                         ├─→ Data Grid
                         │   └─ Displays tables, transactions, contributions
                         │
                         ├─→ Permission UI
                         │   └─ Role/permission management
                         │
                         └─→ Revenue Dashboard
                             └─ Contribution visualization

See: CHAT_UI_IMPLEMENTATION_COMPLETE.md
```

---

## Summary

**Deployment is straightforward:**

```
1. Run migrations 000-006 in order (10 min)
2. Run seeds 001, 002, 010, 011 (3 min)
3. Run verify_deploy.sql (1 min)
4. Run smoke tests (3 min)
5. Database ready! 🎉 (Total: ~17 min)
```

**All documentation is in botmantra-backend directory:**
- 7 migrations + 5 seeds = 12 SQL files
- 3 smoke test scripts + orchestrator = 4 test files
- 8 documentation files = complete guides

**You're ready when:**
- [ ] All 38 tables created
- [ ] All seeds inserted
- [ ] Smoke tests pass
- [ ] Database accessible from backend

**Next: Start Frontend Development**
See CHAT_UI_IMPLEMENTATION_COMPLETE.md

---

*All diagrams, flows, and information current and ready for execution.*
