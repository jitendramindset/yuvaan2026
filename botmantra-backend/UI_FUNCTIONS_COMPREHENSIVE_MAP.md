╔════════════════════════════════════════════════════════════════════════════╗
║                     UI LAYER FUNCTIONS - COMPREHENSIVE MAP                  ║
║                                                                              ║
║              70+ Functions Organizing UI, Dashboards, Templates, AI          ║
╚════════════════════════════════════════════════════════════════════════════╝

FUNCTION CATEGORIZATION (70+ Functions)
═════════════════════════════════════════════════════════════════════════════

🤖 AI & RAG FUNCTIONS (Search + Context Building)
═════════════════════════════════════════════════════════════════════════════

Core AI Context:
  ✅ build_ai_context(p_business_id uuid, p_query_embedding vector) → text
     └─ Purpose: Build AI context from query embedding
     └─ Related: ai_context_cache, embeddings
  
  ✅ build_ai_prompt(in_nid text, in_user_prompt text) → text
     └─ Purpose: Build system prompt for AI
     └─ Related: node_core, users
  
  ✅ build_rag_context(p_business_id uuid, p_query_embedding vector) → text
     └─ Purpose: Build RAG (Retrieval-Augmented Generation) context
     └─ Related: doc vectors, knowledge base

AI Execution:
  ✅ run_rag_engine(p_user uuid, p_agent text, p_question text) → jsonb
     └─ Purpose: Execute RAG pipeline (search + answer)
     └─ Related: RAG_system, agent_state

Search Functions:
  ✅ search_ai_context(p_business_id uuid, p_query_embedding vector, p_limit int) 
     → TABLE(id uuid, content text, similarity double precision)
     └─ Purpose: Vector search in AI context
     └─ Related: vector_db, embeddings_table
  
  ✅ search_knowledge(query_embedding vector, owner uuid, limit_count int)
     → TABLE(content text, metadata jsonb)
     └─ Purpose: Search knowledge base
     └─ Related: knowledge_base_vectors, documents
  
  ✅ search_primary_context(p_business_id uuid, p_query_embedding vector, p_limit int)
     → TABLE(id uuid, doc_id uuid, heading text, sub_heading text, similarity double precision)
     └─ Purpose: Search primary documents
     └─ Related: document_index, business_documents

Semantic Caching:
  ✅ semantic_cache_lookup(p_business_id uuid, p_embedding vector, p_min_similarity double)
     → TABLE(cached_answer text, similarity double precision)
     └─ Purpose: Look up cached AI responses by similarity
     └─ Related: semantic_cache_table
  
  ✅ save_semantic_cache(p_business_id uuid, p_query text, p_embedding vector, p_answer text)
     └─ Purpose: Cache AI response with embedding
     └─ Related: semantic_cache_table

AI Agent:
  ✅ select_best_node() → text
     └─ Purpose: Select best node/agent for task
     └─ Related: node_core

---

📊 DASHBOARD FUNCTIONS (KPIs, Widgets, Analytics)
═════════════════════════════════════════════════════════════════════════════

Dashboard Loading:
  ✅ load_dashboard(p_business_id uuid, p_role_id uuid) → jsonb
     └─ Purpose: Load complete dashboard
     └─ Related: dashboard_layouts, dashboard_kpis, dashboard_widgets
  
  ✅ load_dashboard_widget(p_widget_id uuid, p_business_id uuid, p_role_id uuid) → jsonb
     └─ Purpose: Load single widget data
     └─ Related: dashboard_widgets, widget_layouts

KPI Functions:
  ✅ load_dashboard_kpis(p_business_id uuid) → jsonb
     └─ Purpose: Load all KPIs for business
     └─ Related: dashboard_kpis
  
  ✅ load_dashboard_kpis_cached(p_business_id uuid, p_cache_ttl int DEFAULT 60) → jsonb
     └─ Purpose: Load KPIs with caching (60s default)
     └─ Related: dashboard_kpis, query_cache
  
  ✅ build_kpi_query(p_kpi_id uuid, p_business_id uuid) → text
     └─ Purpose: Build SQL query for KPI
     └─ Related: dashboard_kpis, kpi_definitions
  
  ✅ run_kpi(p_kpi_id uuid, p_business_id uuid) → jsonb
     └─ Purpose: Execute KPI query and return data
     └─ Related: dashboard_kpis
  
  ✅ resolve_dashboard_query(p_query text, p_business_id uuid) → text
     └─ Purpose: Resolve dashboard query (compile/validate)
     └─ Related: query_validation

---

📋 TEMPLATE FUNCTIONS (Dynamic UI Rendering)
═════════════════════════════════════════════════════════════════════════════

Template Resolution:
  ✅ resolve_active_template(p_user_id uuid, p_business_id uuid) → text
     └─ Purpose: Get user's active template
     └─ Related: user_templates, ui_templates
  
  ✅ resolve_template_context(p_user_id uuid, p_business_id uuid) → jsonb
     └─ Purpose: Get all template context (columns, filters, data)
     └─ Related: ui_templates, ui_template_widgets

Template Loading:
  ✅ load_dynamic_template_ui(p_user_id uuid, p_business_id uuid) → jsonb
     └─ Purpose: Load complete dynamic UI
     └─ Related: ui_templates, ui_template_widgets, ui_themes
  
  ✅ load_template_data(p_user_id uuid, p_business_id uuid) → jsonb
     └─ Purpose: Load template data
     └─ Related: data tied to template

Template Schema:
  ✅ get_template_columns(p_template_code text, p_table_name text) → text
     └─ Purpose: Get columns for template
     └─ Related: template_versions, data_model_registry
  
  ✅ get_template_filters(p_template_code text, p_table_name text, p_filters jsonb) → text
     └─ Purpose: Get available filters
     └─ Related: ui_templates, column_role_permissions
  
  ✅ get_sortable_columns(p_template_code text, p_table_name text, p_role_id uuid) → text[]
     └─ Purpose: Get sortable columns (role-based)
     └─ Related: column_role_permissions, roles

Template Queries:
  ✅ build_template_query(p_template_code text, p_table_name text, p_business_id uuid, p_filters jsonb) → text
     └─ Purpose: Build SQL query from template
     └─ Related: ui_templates, query_templates
  
  ✅ run_template_query(p_template_code text, p_table_name text, p_business_id uuid, p_filters jsonb) → jsonb
     └─ Purpose: Execute template query
     └─ Related: any business table
  
  ✅ run_template_query_cached(p_template_code text, p_table_name text, p_business_id uuid, 
                               p_role_id uuid, p_filters jsonb, p_sort_by text, p_sort_dir text,
                               p_limit int, p_offset int, p_cache_ttl int DEFAULT 30) → jsonb
     └─ Purpose: Execute template query with caching
     └─ Related: query_cache
  
  ✅ run_template_query_paged(p_template_code text, p_table_name text, p_business_id uuid, 
                              p_role_id uuid, p_filters jsonb, p_sort_by text, p_sort_dir text,
                              p_limit int, p_offset int) → jsonb
     └─ Purpose: Execute template query with pagination
     └─ Related: any business table
  
  ✅ run_secure_template(p_user_id uuid, p_template_code text, p_business_id uuid, p_filters jsonb) → text
     └─ Purpose: Execute template with security checks
     └─ Related: user_permissions, column_role_permissions

Template Counts:
  ✅ run_template_count(p_template_code text, p_table_name text, p_business_id uuid, p_filters jsonb) → integer
     └─ Purpose: Get row count for template
     └─ Related: business tables

Template Config:
  ✅ set_user_default_template(p_user_id uuid, p_business_id uuid, p_template_code text) → void
  ✅ set_user_default_template(p_user_id uuid, p_business_id uuid, p_template_id uuid) → void
     └─ Purpose: Set user's default template
     └─ Related: user_templates

---

🎨 UI CONTEXT & SCHEMA FUNCTIONS (Theme, Branding, Layout)
═════════════════════════════════════════════════════════════════════════════

UI Context:
  ✅ get_ui_context(p_user_id uuid, p_business_id uuid) → jsonb
     └─ Purpose: Get complete UI context for user
     └─ Related: ui_context_cache, user_preferences, business_branding
  
  ✅ get_ui_schema(p_business_id uuid, p_template_code text, p_table_name text, p_role_id uuid) → jsonb
     └─ Purpose: Get UI schema (columns, types, validation)
     └─ Related: data_model_registry, column_role_permissions

Branding:
  ✅ get_branding(p_business_id uuid) → jsonb
     └─ Purpose: Get business branding (logo, colors, etc)
     └─ Related: business_branding

Widget Layout:
  ✅ load_widget_layout(p_user_id uuid, p_business_id uuid, p_template_id uuid) 
     → TABLE(widget_id uuid, x integer, y integer, w integer, h integer, hidden boolean)
     └─ Purpose: Get widget positions/sizes
     └─ Related: ui_widget_layouts
  
  ✅ save_widget_layout(p_user_id uuid, p_business_id uuid, p_template_id uuid, 
                        p_widget_id uuid, p_x int, p_y int, p_w int, p_h int, p_hidden bool) → void
     └─ Purpose: Save user's widget layout
     └─ Related: ui_widget_layouts

Widget Data:
  ✅ get_widget_data(p_widget_id uuid, p_business_id uuid) → jsonb
     └─ Purpose: Get widget data
     └─ Related: dashboard_widgets

Plugins:
  ✅ resolve_plugin(p_business_id uuid, p_plugin_code text, p_role_id uuid) → text
     └─ Purpose: Resolve plugin (get config/code)
     └─ Related: business_plugins

---

💾 CACHING FUNCTIONS (Query & Result Caching)
═════════════════════════════════════════════════════════════════════════════

Query Cache:
  ✅ get_cached_result(p_business_id uuid, p_cache_key text) → jsonb
     └─ Purpose: Get cached query result
     └─ Related: query_cache
  
  ✅ save_cached_result(p_business_id uuid, p_cache_key text, p_response jsonb, p_ttl_seconds int DEFAULT 30) → void
     └─ Purpose: Save query result with TTL
     └─ Related: query_cache

Summary Cache:
  ✅ get_cached_summary(p_business_id uuid, p_query_hash text) → text
     └─ Purpose: Get cached summary
     └─ Related: query_cache
  
  ✅ save_summary_cache(p_business_id uuid, p_query_hash text, p_query text, p_context text, p_summary text) → void
     └─ Purpose: Cache query summary
     └─ Related: query_cache

---

👤 USER & MEMORY FUNCTIONS (Session, Preferences, Context)
═════════════════════════════════════════════════════════════════════════════

User Memory:
  ✅ load_user_memory(p_user uuid) → jsonb
     └─ Purpose: Load user session/memory
     └─ Related: user_preferences, ui_user_preferences
  
  ✅ save_user_memory(p_user uuid, p_context jsonb, p_action text) → void
     └─ Purpose: Save user memory (session context)
     └─ Related: user_preferences

User ID:
  ✅ get_my_business_id() → uuid
     └─ Purpose: Get current user's business ID
     └─ Related: auth context, users, business_users

---

🏢 BUSINESS SETUP FUNCTIONS (Onboarding & Schema Creation)
═════════════════════════════════════════════════════════════════════════════

Business Registration:
  ✅ fn_register_business_v1(p_name text, p_description text, p_industry text, p_category text,
                            p_business_size text, p_module_selection jsonb) → uuid
     └─ Purpose: Register new business
     └─ Related: businesses, business_subscriptions
  
  ✅ fn_initialize_business_v1(p_business_id uuid) → void
     └─ Purpose: Initialize business (create schema, seed data)
     └─ Related: fn_create_business_schema_v1, fn_seed_business_templates_v1

Schema Creation:
  ✅ fn_create_business_schema_v1(p_business_id uuid, p_schema_name text) → void
     └─ Purpose: Create business schema
     └─ Related: PostgreSQL schema
  
  ✅ fn_build_business_tables_v1(p_schema_name text) → void
     └─ Purpose: Build tables in business schema
     └─ Related: business_metadata
  
  ✅ fn_create_business_tables(p_business_id uuid) → void
     └─ Purpose: Create business tables
     └─ Related: business_metadata

Templates:
  ✅ fn_seed_business_templates_v1(p_business_id uuid, p_created_by uuid) → void
     └─ Purpose: Seed default templates
     └─ Related: ui_templates, business_templates

---

🛠️ UTILITY FUNCTIONS (Data Building & Helpers)
═════════════════════════════════════════════════════════════════════════════

Auto Join:
  ✅ build_auto_join_clause(p_base_table text, p_business_id uuid) → text
     └─ Purpose: Build JOIN clause automatically
     └─ Related: table_relationships

Safe Insert:
  ✅ build_safe_insert(p_table text, p_payload jsonb) → text
     └─ Purpose: Build safe INSERT statement
     └─ Related: security validation

Spatial:
  ✅ get_proj4_from_srid(integer) → text
     └─ Purpose: Get PROJ4 string from SRID
     └─ Related: spatial_ref_sys, geo functions

---

FUNCTION SUMMARY
═════════════════════════════════════════════════════════════════════════════

Total Functions: 70+

Breakdown:
├─ AI & RAG Functions:           9 functions
├─ Dashboard Functions:           7 functions
├─ Template Functions:           14 functions
├─ UI Context & Schema:           8 functions
├─ Caching Functions:             6 functions
├─ User & Memory Functions:       3 functions
├─ Business Setup Functions:      6 functions
└─ Utility Functions:             4 functions

Key Security Patterns:
  ✓ Role-based access (p_role_id parameter)
  ✓ Business isolation (p_business_id parameter)
  ✓ User-specific data (p_user_id parameter)
  ✓ Permission checks via column_role_permissions

Key Performance Patterns:
  ✓ Caching with TTL (p_cache_ttl, p_ttl_seconds)
  ✓ Pagination support (p_limit, p_offset)
  ✓ Query optimization (build_auto_join_clause)
  ✓ Vector search (embeddings)

═════════════════════════════════════════════════════════════════════════════

CRITICAL RELATED TABLES
═════════════════════════════════════════════════════════════════════════════

UI Tables (for rendering):
  ✅ ui_templates (12 cols) - Template definitions
  ✅ ui_template_widgets (9 cols) - Widget configs
  ✅ ui_widget_layouts (13 cols) - User widget positions
  ✅ ui_themes (8 cols) - Theme definitions
  ✅ ui_theme_settings (9 cols) - Theme configs
  ✅ ui_context_cache (5 cols) - Cached contexts
  ✅ ui_labels (5 cols) - UI labels
  ✅ ui_user_preferences (7 cols) - User UI prefs
  ✅ ui_template_theme_map (2 cols) - Template→Theme

Business Tables:
  ✅ businesses (20 cols) - Core business registry
  ✅ business_users (6 cols) - User→Business mapping
  ✅ business_branding (16 cols) - Logo, colors, etc
  ✅ business_metadata (11 cols) - Modular mapping
  ✅ business_functions (13 cols) - Custom functions
  ✅ business_templates (7 cols) - Business templates
  ✅ business_subscriptions (8 cols) - Subscription state

Data Model Tables:
  ✅ data_model_registry (32 cols) - Schema metadata
  ✅ data_model_relations (9 cols) - Table relationships
  ✅ column_role_permissions (8 cols) - Column-level access
  ✅ table_relationships (8 cols) - FK relationships

User & Permission Tables:
  ✅ users (22 cols) - User profiles
  ✅ roles (6 cols) - Role definitions
  ✅ permissions (7 cols) - Module permissions
  ✅ role_permissions (2 cols) - Role→Permission
  ✅ user_preferences (6 cols) - User settings
  ✅ user_templates (8 cols) - User template assoc
  ✅ auth_identity (9 cols) - Auth providers

Dashboard Tables:
  ✅ dashboard_kpis (14 cols) - KPI definitions
  ✅ dashboard_widgets (9 cols) - Widget configs
  ✅ dashboard_layouts (7 cols) - Dashboard layouts
  ✅ query_cache (6 cols) - Query result cache

AI/Analytics Tables:
  ✅ chat_history (6 cols) - AI chat logs
  ✅ n8n_chat_histories (3 cols) - n8n chat
  ✅ semantic_cache (?) - AI response cache
  ✅ embeddings (?) - Vector storage

═════════════════════════════════════════════════════════════════════════════

STATUS CHECK - MISSING OR ADDITIONAL TABLES
═════════════════════════════════════════════════════════════════════════════

User mentioned: "may missing or added different table will check that later"

Potentially Missing Tables (to verify):
  ⏳ semantic_cache_table (for semantic_cache_lookup)
  ⏳ embeddings_table (for vector search)
  ⏳ ai_context_cache (for build_ai_context)
  ⏳ document_index (for search_primary_context)
  ⏳ knowledge_base_vectors (for search_knowledge)
  ⏳ rag_system (for run_rag_engine)
  ⏳ kpi_definitions (for build_kpi_query)
  ⏳ widget_data_sources (for get_widget_data)

═════════════════════════════════════════════════════════════════════════════

READY FOR NEXT PHASE
═════════════════════════════════════════════════════════════════════════════

Please provide:
1. Any missing tables from above list
2. Any additional functions
3. Function implementation details (if available)
4. Data flow examples
5. Security/permission rules

Will then create:
✅ UI Layer Architecture Report
✅ UI → Kernel Integration Map
✅ UI Postman Collection
✅ Complete Testing Guide
