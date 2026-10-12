# 🏗️ UI LAYER ↔ KERNEL LAYER INTEGRATION ARCHITECTURE

## Complete System Architecture (UI + Kernel + DB)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React/Next.js)                        │
│                   (Does NOT touch database directly)                     │
└───────────────────────┬──────────────────────────────────────────────────┘
                        │
                        ↓ REST API Calls
                        │
┌──────────────────────────────────────────────────────────────────────────┐
│                        REST API GATEWAY LAYER                            │
│                                                                          │
│  routes-ui.js (UI endpoints)                                           │
│  routes-kernel.js (Kernel endpoints)                                   │
│                                                                          │
│  GET  /api/ui/template/{code}                                          │
│  GET  /api/ui/dashboard/{id}                                           │
│  GET  /api/ui/context                                                  │
│  POST /api/kernel/execute                                              │
│  GET  /api/kernel/validate                                             │
└───────────────┬──────────────────────────┬────────────────────────────┘
                │                          │
        ╔═══════╩════════╗        ╔═══════╩═════════╗
        ↓                ↓        ↓                 ↓
┌───────────────────┐  ┌──────────────────┐ ┌────────────────┐
│  UI ENGINE LAYER  │  │ KERNEL ENGINE    │ │  CACHING LAYER │
│                   │  │                  │ │                │
│ load_template_ui  │  │ validate_node()  │ │ query_cache    │
│ resolve_context   │  │ execute_action() │ │ semantic_cache │
│ build_dashboard   │  │ apply_karma()    │ │ ui_cache       │
│ run_query         │  │ evaluate_dharma()│ │                │
│ get_ui_schema     │  │ event_ingest()   │ │ Redis/PG cache │
└────────┬──────────┘  └────────┬─────────┘ └────────┬───────┘
         │                      │                    │
         └──────────┬───────────┴────────────────────┘
                    │
                    ↓
        ╔═══════════════════════════╗
        │   SUPABASE REST API       │
        │  (PostgreSQL via HTTPS)   │
        ╚═══════════════════╬═══════╝
                            │
                            ↓
        ╔═══════════════════════════════════════════════════════╗
        │          POSTGRESQL DATABASE LAYER                   │
        │                                                       │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │         KERNEL TABLES (Node OS)                 │ │
        │  │ • node_core                 (identity + state)  │ │
        │  │ • node_execution_log        (audit trail)       │ │
        │  │ • node_event_queue          (events)            │ │
        │  │ • node_karma_log            (reputation)        │ │
        │  │ • dharma_rules              (ethics)            │ │
        │  └─────────────────────────────────────────────────┘ │
        │                                                       │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │         UI TABLES (Rendering Layer)            │ │
        │  │ • ui_templates, ui_themes, ui_widgets         │ │
        │  │ • dashboard_kpis, dashboard_layouts           │ │
        │  │ • ui_user_preferences, ui_widget_layouts      │ │
        │  │ • ui_context_cache                            │ │
        │  └─────────────────────────────────────────────────┘ │
        │                                                       │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │      BUSINESS TABLES (Multi-tenant Data)       │ │
        │  │ • businesses, business_users, business_*      │ │
        │  │ • Custom schemas per business (inv_biz_01)    │ │
        │  └─────────────────────────────────────────────────┘ │
        │                                                       │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │    USER & PERMISSION TABLES (Access Control)   │ │
        │  │ • users, roles, permissions                   │ │
        │  │ • column_role_permissions (column-level)      │ │
        │  │ • role_permissions, user_templates            │ │
        │  └─────────────────────────────────────────────────┘ │
        │                                                       │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │     DATA MODEL TABLES (Schema Registry)        │ │
        │  │ • data_model_registry (32 cols)               │ │
        │  │ • data_model_relations                        │ │
        │  │ • table_relationships                         │ │
        │  └─────────────────────────────────────────────────┘ │
        │                                                       │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │        AI/CACHE TABLES (Optimization)          │ │
        │  │ • query_cache, semantic_cache                 │ │
        │  │ • embeddings, chat_history                    │ │
        │  └─────────────────────────────────────────────────┘ │
        │                                                       │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │        RPC FUNCTIONS (70+ Functions)           │ │
        │  │ • UI Functions (20+)                          │ │
        │  │ • Kernel Functions (7)                        │ │
        │  │ • Business Setup (6)                          │ │
        │  │ • AI/Cache (15+)                              │ │
        │  │ • Dashboard (7)                               │ │
        │  └─────────────────────────────────────────────────┘ │
        │                                                       │
        └───────────────────────────────────────────────────────┘
```

---

## DETAILED DATA FLOW: UI REQUEST TO KERNEL EXECUTION

### Flow Example: "Load User Dashboard"

```
1. FRONTEND REQUEST
   ├─ User clicks "Dashboard" button
   ├─ Frontend: GET /api/ui/dashboard/business-id
   └─ Headers: { user_id, business_id, role_id }

2. API GATEWAY (routes-ui.js)
   ├─ Route: GET /api/ui/dashboard/:businessId
   ├─ Handler: GET /api/ui/dashboard
   ├─ Extract params: businessId, roleId from context
   └─ Call: UI Layer function

3. UI ENGINE LAYER (load_dashboard)
   ├─ Function: load_dashboard(business_id, role_id)
   ├─ Queries:
   │  ├─ SELECT dashboard_layouts WHERE business_id = ?
   │  ├─ SELECT dashboard_kpis WHERE business_id = ?
   │  ├─ SELECT dashboard_widgets WHERE business_id = ?
   │  └─ SELECT ui_themes WHERE id = ?
   ├─ Loops through widgets:
   │  └─ Call: load_dashboard_widget(widget_id, business_id, role_id)
   │     ├─ Check permission (column_role_permissions)
   │     ├─ Run KPI query if KPI widget
   │     ├─ Run template query if data widget
   │     └─ Return widget data (JSONB)
   └─ Returns: Complete dashboard JSON

4. DATA POPULATION (from Business Tables + Templates)
   ├─ For each widget that queries data:
   │  ├─ Function: run_template_query_paged()
   │  │  ├─ Build query: build_template_query()
   │  │  ├─ Apply filters (where, having)
   │  │  ├─ Apply sorting (order by)
   │  │  ├─ Apply pagination (limit, offset)
   │  │  └─ Check permissions (column_role_permissions)
   │  │
   │  └─ Or Function: run_kpi()
   │     ├─ Build KPI query: build_kpi_query()
   │     ├─ Execute against business tables
   │     └─ Aggregate results

5. PERMISSION LAYER CHECK (at every step)
   ├─ Can user access this business? (business_users)
   ├─ Can user see this module? (role_permissions)
   ├─ Can user see these columns? (column_role_permissions)
   ├─ Can user see these rows? (RLS policies)
   └─ If any fails: Return 403 Forbidden

6. CACHING LAYER
   ├─ Check if result cached: get_cached_result()
   ├─ If cached & not expired: Return immediately
   ├─ If not cached: Execute query
   ├─ Cache result: save_cached_result(ttl=30s)
   └─ Return cached result to frontend

7. RETURN TO FRONTEND
   ├─ Response: { widgets: [...], kpis: [...], theme: {...} }
   ├─ Frontend renders dashboard
   └─ User sees live data ✅

DECISION POINT: When does this call Kernel Layer?
─────────────────────────────────────────────────
This dashboard load does NOT call kernel directly.

But IF a widget needs to execute a node action:
   ├─ Example: "Run optimization" button clicked
   ├─ Frontend: POST /api/kernel/execute
   │  ├─ nodeHash: Node to execute
   │  ├─ action: optimize_dashboard
   │  └─ params: dashboard_id, filters
   │
   └─ Kernel takes over:
      ├─ validate_node_action() - Check permissions
      ├─ evaluate_dharma() - Check ethics
      ├─ node_event_ingest() - Queue event
      ├─ node_runtime_execute() - Execute action
      └─ Result used to update dashboard

```

---

## INTEGRATION POINTS: UI ↔ KERNEL

### When UI Calls Kernel

| Scenario | UI Function | Kernel Function | Data Flow |
|----------|-------------|-----------------|-----------|
| User action in UI | (none, goes direct to kernel) | POST /api/kernel/execute | User gesture → Kernel action |
| Permission check | get_ui_schema() | validate_node_action() | Schema access + node permission |
| Data export/save | run_secure_template() | validate_node_action() | Verify user can write data |
| Custom action | load_dynamic_template_ui() | node_runtime_execute() | Template action → kernel execution |
| AI assistance | run_rag_engine() | (no direct call, but uses kernel's data) | Chat queries kernel knowledge |
| Dashboard KPI update | run_kpi() | (uses business tables, not kernel) | Pure analytics, no action |

### Key Separation

```
UI LAYER IS RESPONSIBLE FOR:
├─ Rendering (templates, themes, widgets)
├─ Data retrieval (queries, filtering, pagination)
├─ Caching (query results)
├─ User preferences (layout, theme)
├─ Dashboard analytics (KPIs)
└─ User experience

KERNEL LAYER IS RESPONSIBLE FOR:
├─ Action execution (state changes)
├─ Permission validation (can_execute)
├─ Dharma evaluation (ethical checks)
├─ Event queuing (n8n triggers)
├─ Reputation tracking (karma/trust)
└─ Audit logging (execution history)

GOLDEN RULE:
"UI reads data, Kernel changes state"
```

---

## TABLE RELATIONSHIPS MAP

```
KERNEL TABLES
├─ node_core (source of truth)
│  ├─ Has many: node_execution_log (audit)
│  ├─ Has many: node_event_queue (events)
│  ├─ Has many: node_karma_log (reputation)
│  └─ References: users.id (owner)
│
├─ dharma_rules (ethical framework)
│  └─ Used by: evaluate_dharma()
│
├─ node_permission_effective (security)
│  └─ Links: node → users (with permissions)
│
└─ node_trust_state (performance cache)
   └─ Denormalized from: node_core + node_karma_log

UI TABLES
├─ ui_templates
│  ├─ Has many: ui_template_widgets
│  ├─ Links: ui_themes (styling)
│  ├─ Links: data_model_registry (schema)
│  └─ Links: users (user_default_template)
│
├─ dashboard_kpis
│  ├─ Has many: dashboard_widgets (if widget type)
│  ├─ References: data_model_registry (table)
│  └─ Executed by: run_kpi()
│
├─ ui_widget_layouts
│  ├─ References: ui_template_widgets
│  ├─ References: users (position per user)
│  └─ References: ui_templates
│
├─ ui_themes
│  ├─ Links: ui_template_theme_map (which templates)
│  └─ Links: ui_theme_settings (config)
│
└─ ui_context_cache
   ├─ Caches: get_ui_context() results
   └─ References: business_branding, user_preferences

BUSINESS TABLES
├─ businesses (registry)
│  ├─ Has many: business_users
│  ├─ Has many: business_subscriptions
│  ├─ Links: subscription_tiers (limits)
│  └─ Schema: inv_biz_01, inv_biz_02, ... (modular)
│
├─ business_metadata
│  ├─ Maps: modular table slugs
│  ├─ Links: businesses
│  └─ Links: data_model_registry
│
└─ Custom business tables
   ├─ Created per business schema
   ├─ Linked: table_relationships
   └─ Secured: column_role_permissions

USER & PERMISSION TABLES
├─ users (profile + identity)
│  ├─ Has many: business_users
│  ├─ Has many: user_templates
│  ├─ Has many: user_preferences
│  └─ Links: roles (per business)
│
├─ roles (group definitions)
│  ├─ Has many: role_permissions
│  ├─ Has many: column_role_permissions
│  └─ References: permissions
│
├─ permissions (module access)
│  ├─ Has many: role_permissions (many-to-many)
│  └─ Modules: SD, MM, FICO, etc.
│
├─ role_permissions (junction)
│  └─ Links: roles ↔ permissions
│
└─ column_role_permissions (fine-grained)
   ├─ Links: roles
   ├─ Links: data_model_registry (columns)
   └─ Allows: column-level read/write control

DATA MODEL TABLES
├─ data_model_registry (schema metadata)
│  ├─ 32 columns (comprehensive!)
│  ├─ Stores: table names, column names, types, validation
│  ├─ Links: business_metadata
│  └─ Used by: get_ui_schema(), build_template_query()
│
├─ data_model_relations (FK info)
│  ├─ Stores: foreign key relationships
│  ├─ Used by: build_auto_join_clause()
│  └─ Enables: auto-join generation
│
└─ table_relationships
   ├─ Similar to data_model_relations
   └─ Alternative relationship store

AI & CACHE TABLES
├─ query_cache
│  ├─ Used by: run_template_query_cached()
│  ├─ TTL: p_cache_ttl (seconds)
│  └─ Key: business_id + cache_key
│
├─ semantic_cache
│  ├─ Used by: semantic_cache_lookup()
│  ├─ Stores: embeddings + answers
│  ├─ Used by: run_rag_engine()
│  └─ Enables: AI response caching
│
├─ chat_history
│  ├─ Logs: user ↔ AI conversations
│  ├─ Indexed: user_id, session_id
│  └─ Used by: RAG context building
│
└─ embeddings (if exists)
   ├─ Stores: vector embeddings
   ├─ Used by: search_ai_context()
   └─ Used by: build_rag_context()
```

---

## SECURITY ARCHITECTURE

```
Layer 1: Authentication
├─ auth_identity (OAuth, OIDC, etc)
├─ users table (credential storage)
└─ JWT tokens (API authentication)

Layer 2: Authorization (Role-Based)
├─ users.role_id (default role)
├─ business_users.role_id (per-business role)
├─ roles table (role definitions)
└─ role_permissions (module access)

Layer 3: Authorization (Column-Level)
├─ column_role_permissions table
├─ Links: role_id + column_id
├─ Enforces: read/write/execute per column
└─ Checked by: get_ui_schema(), run_secure_template()

Layer 4: Authorization (Row-Level)
├─ RLS (Row-Level Security) policies
├─ PostgreSQL native security
├─ Filters: business_id, owner_id, etc
└─ Applied: on all table queries

Layer 5: Node-Based Security (Kernel)
├─ validate_node_action() checks:
│  ├─ Node exists + is ACTIVE
│  ├─ Trust score > minimum
│  ├─ Permission exists in node_permission_effective
│  └─ Lifespan not expired
├─ evaluate_dharma() checks:
│  ├─ Ethical rules compliance
│  └─ Karma impact assessment
└─ Result: execute or deny action

Execution Flow:
┌─ User makes request
├─ Auth layer: Is user logged in? (JWT)
├─ Role layer: Can user access module? (role_permissions)
├─ Column layer: Can user see these columns? (column_role_permissions)
├─ Row layer: Is row in user's business? (RLS)
│
└─ IF action (not just read):
   ├─ Kernel layer: validate_node_action()
   ├─ Dharma check: evaluate_dharma()
   ├─ Event queue: node_event_ingest()
   └─ Execute: node_runtime_execute()
```

---

## PERFORMANCE OPTIMIZATION PATTERNS

```
Caching Strategy (Multi-level)
├─ Level 1: Redis (in-memory, fast)
│  └─ Used for: Session data, temporary results
│
├─ Level 2: PostgreSQL query_cache
│  ├─ Function: get_cached_result(cache_key, ttl)
│  ├─ TTL: default 30 seconds
│  ├─ Key: business_id + template_code
│  └─ Used by: run_template_query_cached()
│
├─ Level 3: PostgreSQL semantic_cache
│  ├─ Function: semantic_cache_lookup(embedding)
│  ├─ Similarity: > 0.85
│  └─ Used by: RAG engine for AI responses
│
└─ Level 4: ui_context_cache
   ├─ Stores: Full UI context
   ├─ TTL: User session duration
   └─ Invalidated on: User changes, theme change

Query Optimization
├─ build_auto_join_clause() - Automatic JOIN generation
├─ build_template_query() - Parameterized queries
├─ run_template_query_paged() - Pagination (limit/offset)
├─ Index strategy: business_id, user_id, template_code
└─ Batch loading: Multi-widget dashboard loads at once

Pagination (Large Results)
├─ Function: run_template_query_paged()
├─ Parameters: limit (20), offset (0)
├─ Returns: { data: [...], total: N, hasMore: bool }
└─ Used by: UI grid/table components

Vector Search (AI)
├─ Embeddings stored in PostgreSQL (pgvector extension)
├─ Functions: search_ai_context(), search_knowledge()
├─ Similarity search: cosine similarity > threshold
└─ Fast with: vector index (HNSW or IVFFlat)
```

---

## DATA ISOLATION (Multi-Tenancy)

```
Level 1: Schema-based Isolation
├─ Each business gets own schema
├─ Naming: inv_biz_01, inv_biz_02, inv_biz_03, ...
├─ Tables: invoices, customers, orders in each schema
└─ RLS: Enforces schema isolation at row level

Level 2: Business ID Isolation
├─ All tables have business_id column
├─ Stored in JWT: { user_id, business_id, role_id }
├─ Every query filters: WHERE business_id = ? (mandatory)
└─ RLS policy: ALTER TABLE ... ENABLE ROW LEVEL SECURITY

Level 3: User-Level Isolation
├─ Template preferences per user per business
├─ Widget layouts per user
├─ Cached context per user
└─ Memory/session per user

Enforcement:
├─ API layer: Extract business_id from JWT
├─ Query layer: All functions receive p_business_id
├─ Database layer: RLS policies enforce at table level
└─ Guarantee: No data leakage between businesses
```

---

## NEXT DOCUMENTATION PHASES

Ready to create:
✅ UI Layer Architecture Report (detailed)
✅ UI Postman Collection (60+ endpoints)
✅ UI → Kernel Integration Guide
✅ Complete Testing Scenarios
✅ Security & Compliance Guide
✅ Performance Tuning Guide

**Status**: Architecture mapping complete, waiting for:
- Missing table confirmations
- Additional function details
- Data flow examples
- Business logic rules
