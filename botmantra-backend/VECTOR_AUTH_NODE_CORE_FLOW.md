# 🔐 VECTOR-INTEGRATED AUTHENTICATION + NODE CORE FLOW

**Status**: Complete System Architecture with Vector Protection  
**Date**: January 28, 2026  
**Integration**: OpenAI + Vectors + Auth + Node Core Living System  
**Security Model**: Auth-Controlled Vector References + Permission-Based Embedding Access

---

## 📋 OVERVIEW: Vector-Protected Node Core Living System

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    VECTOR-INTEGRATED NODE CORE SYSTEM                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1️⃣  USER AUTHENTICATION (Email/Phone + Password/Biometric)                │
│      ↓ Creates temporary auth context (no vectors yet)                      │
│                                                                               │
│  2️⃣  BASIC DETAILS COLLECTION (with OpenAI system prompt)                  │
│      ↓ Gathers user profile info for node context                          │
│                                                                               │
│  3️⃣  NODE CORE CREATION (Auth-Protected)                                    │
│      ├─ Create nid_hash (unique node identifier)                           │
│      ├─ Generate system_prompt (OpenAI configured)                         │
│      ├─ Link user → node (auth binding)                                    │
│      └─ Initialize vector_references (EMPTY - permission-based)           │
│                                                                               │
│  4️⃣  VECTOR INITIALIZATION (Permission + Auth Controlled)                   │
│      ├─ Create node_embedding (protects node context)                     │
│      ├─ Create user_embedding (protects user profile)                     │
│      ├─ Create business_embedding (protects business data)                │
│      ├─ Create permission_embedding (controls access)                     │
│      └─ ALL vectors auth-controlled via RLS + permissions               │
│                                                                               │
│  5️⃣  RAG + SEMANTIC CACHE (Vector-Based, Auth-Filtered)                     │
│      ├─ build_ai_context (vector similarity search)                       │
│      ├─ search_knowledge (auth-filtered vector search)                    │
│      ├─ semantic_cache_lookup (permission-based cache)                    │
│      └─ save_semantic_cache (stores vectors with auth metadata)          │
│                                                                               │
│  6️⃣  UI LAYER LOAD (Vector-Informed, Auth-Filtered)                        │
│      ├─ Load from node_core (vector-enriched context)                     │
│      ├─ Apply column permissions (vector-mapped)                          │
│      ├─ Apply row-level security (vector-filtered)                        │
│      └─ All data auth-controlled + vector-enhanced                        │
│                                                                               │
│  7️⃣  ONGOING OPERATIONS (Vector Updates + Auth Refresh)                    │
│      ├─ Update vectors on permission changes                              │
│      ├─ Update vectors on data modifications                              │
│      ├─ Regenerate semantic cache when auth changes                       │
│      └─ Maintain vector integrity with auth consistency                   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DETAILED FLOW: Step-by-Step with Vector Integration

### PHASE 1: AUTHENTICATION

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: LOGIN AUTHENTICATION                                       │
│ Status: PRE-VECTOR (vectors created only after auth successful)    │
└─────────────────────────────────────────────────────────────────────┘

INPUT:
  Option A: Email + Password
  Option B: Phone + Password
  Option C: Biometric (Face/Fingerprint) + confirmation

FLOW:
  ┌──────────────────────────────────┐
  │ SELECT FROM users WHERE           │
  │   email = input_email OR          │
  │   phone = input_phone             │
  └──────────────────────────────────┘
          ↓
  ┌──────────────────────────────────┐
  │ Verify password (bcrypt.compare) │
  │ OR biometric match                │
  └──────────────────────────────────┘
          ↓
  ┌──────────────────────────────────┐
  │ Create auth token (JWT)          │
  │ - exp: 24h or configurable       │
  │ - user_id: UUID                  │
  │ - business_id: user's business   │
  │ - role_id: user's role           │
  └──────────────────────────────────┘
          ↓
  ┌──────────────────────────────────┐
  │ Store in client:                  │
  │ - localStorage.authToken          │
  │ - localStorage.userId             │
  │ - localStorage.businessId         │
  │ - localStorage.roleId             │
  └──────────────────────────────────┘
          ↓
  ┌──────────────────────────────────┐
  │ Check user.node_core_id exists    │
  │ (reference to node_core table)    │
  └──────────────────────────────────┘
          ↓
  ┌──────────────────────────────────┐
  │ IF node_core_id EXISTS:           │
  │  → Load existing node_core        │
  │     (VECTOR LOAD - See Phase 3)   │
  │                                   │
  │ IF node_core_id NULL:             │
  │  → NEW USER/FIRST LOGIN           │
  │     → Signup flow (Phase 2)       │
  └──────────────────────────────────┘

OUTPUTS:
  ✅ Auth token (valid 24h)
  ✅ User profile loaded
  ✅ Temporary context (no vectors yet)
  ✅ Ready for Node Core creation (if new)

VECTOR STATUS AT THIS POINT: ❌ NONE
  (Vectors created ONLY after user profile complete + auth confirmed)
```

---

### PHASE 2: SIGNUP + BASIC DETAILS

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: COLLECT BASIC DETAILS (WITH OPENAI SYSTEM PROMPT)         │
│ Status: PREPARING FOR NODE CORE + VECTORS                          │
└─────────────────────────────────────────────────────────────────────┘

✋ INPUT COLLECTION (Step by Step with AI Guidance)

Step 2.1: Personal Identity
  ┌──────────────────────────────────┐
  │ Collect:                          │
  │ - Full Name                       │
  │ - Email (if not used for login)   │
  │ - Phone (if not used for login)   │
  │ - Date of Birth                   │
  │ - Gender (optional)               │
  │                                   │
  │ [IF OPENAI AVAILABLE]             │
  │ OpenAI Suggestion:                │
  │ "Consider adding nationality,    │
  │  language, timezone for better   │
  │  personalization"                 │
  └──────────────────────────────────┘

Step 2.2: Location & Geography
  ┌──────────────────────────────────┐
  │ Collect:                          │
  │ - Current Address                 │
  │ - City, State, Country            │
  │ - Postal Code                     │
  │ - GPS Coordinates (optional)      │
  │ - Timezone                        │
  │                                   │
  │ [IF OPENAI AVAILABLE]             │
  │ OpenAI Suggestion:                │
  │ "Location affects KPI display,   │
  │  language, and time-based alerts" │
  └──────────────────────────────────┘

Step 2.3: Authentication Details
  ┌──────────────────────────────────┐
  │ Collect:                          │
  │ - Password (if not set)           │
  │ - Confirm Password                │
  │ - Password strength indicator     │
  │                                   │
  │ [IF OPENAI AVAILABLE]             │
  │ OpenAI Suggestion:                │
  │ "Recommend 12+ chars, mixed case, │
  │  special chars for security"      │
  └──────────────────────────────────┘

Step 2.4: Biometric Registration
  ┌──────────────────────────────────┐
  │ Collect:                          │
  │ - Register Face (Face ID/Liveness) │
  │ - Register Fingerprint(s)         │
  │ - Confirmation scan               │
  │                                   │
  │ [IF OPENAI AVAILABLE]             │
  │ OpenAI Suggestion:                │
  │ "Biometric provides 2FA security  │
  │  Recommend registering 2 fingers  │
  │  for redundancy"                  │
  └──────────────────────────────────┘

Step 2.5: Business Association
  ┌──────────────────────────────────┐
  │ Collect:                          │
  │ - Business Name (if own business) │
  │ - Business ID (if joining)        │
  │ - Role in Business (owner/member) │
  │ - Department (optional)           │
  │ - Business Address                │
  │                                   │
  │ [IF OPENAI AVAILABLE]             │
  │ OpenAI Suggestion:                │
  │ "Business context enables role-  │
  │  based KPIs and targeted alerts"  │
  └──────────────────────────────────┘

VALIDATION:
  ┌──────────────────────────────────┐
  │ 1. Validate all fields filled     │
  │ 2. Check email/phone unique       │
  │ 3. Verify biometric quality       │
  │ 4. Validate password strength     │
  │ 5. Confirm business affiliation   │
  └──────────────────────────────────┘

OUTPUTS:
  ✅ Complete user profile
  ✅ Biometric templates stored
  ✅ Password hashed (bcrypt)
  ✅ Business association confirmed
  ✅ Ready for Node Core creation

VECTOR STATUS: ❌ STILL NONE
  (Vectors created in Phase 3 with node_core)
```

---

### PHASE 3: NODE CORE CREATION + INITIAL VECTORS

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: CREATE NODE CORE (Auth-Protected Living Entity)            │
│ Status: VECTORS CREATED HERE + PERMISSION LINKED                   │
└─────────────────────────────────────────────────────────────────────┘

DATABASE OPERATIONS:

1️⃣ CREATE USER RECORD IN users TABLE
   ┌──────────────────────────────────┐
   │ INSERT INTO users VALUES:        │
   │ - id: UUID (auto)                │
   │ - email: normalized              │
   │ - phone: normalized              │
   │ - password_hash: bcrypt          │
   │ - full_name: from input          │
   │ - dob: from input                │
   │ - address: from input            │
   │ - geo_location: from input       │
   │ - timezone: from input           │
   │ - face_template: biometric       │
   │ - fingerprint_template: biometric│
   │ - business_id: from input        │
   │ - role_id: from business setup   │
   │ - is_active: true                │
   │ - created_at: NOW()              │
   │ - updated_at: NOW()              │
   │ - auth_method: 'password|bio'    │
   │ - node_core_id: NULL (set in 3)  │
   └──────────────────────────────────┘
   ↓
   RETURNS: user_id (UUID)

2️⃣ CREATE NODE_CORE RECORD
   ┌──────────────────────────────────────────┐
   │ INSERT INTO node_core VALUES:            │
   │ - nid_hash: HASH(user_id + timestamp)   │
   │ - node_name: "{user_name}'s Node Core"  │
   │ - owner_id: user_id                      │
   │ - business_id: from users.business_id    │
   │ - is_activated: true                     │
   │ - can_execute: true                      │
   │ - is_cold: false                         │
   │ - trust_score: 0 (initial)               │
   │ - reputation_level: 0 (initial)          │
   │ - created_at: NOW()                      │
   │ - updated_at: NOW()                      │
   │ - valid_until: 365 days from now         │
   │ - system_prompt: (from OpenAI) ← KEY    │
   │ - node_context: (from OpenAI) ← KEY     │
   │ - initialized_by: 'auth_system'          │
   └──────────────────────────────────────────┘
   ↓
   RETURNS: nid_hash

3️⃣ GENERATE SYSTEM PROMPT + CONTEXT (OpenAI)
   
   [IF OpenAI Key Available]
   ┌──────────────────────────────────────────┐
   │ Call OpenAI.embeddings:                  │
   │ - Model: text-embedding-3-small          │
   │ - Text: User profile (name, role, bus)   │
   │ - Returns: 1536-D vector                 │
   │                                          │
   │ Call OpenAI.chat.completions:           │
   │ - Model: gpt-4-turbo                     │
   │ - System: "Generate node core system    │
   │            prompt for this user..."      │
   │ - Context: {name, role, business,       │
   │            capabilities, restrictions}  │
   │ - Temperature: 0.3 (stable)              │
   │ - Returns: system_prompt text            │
   │                                          │
   │ Call OpenAI.chat.completions:           │
   │ - Generate initial node_context         │
   │ - State: {"status": "initialized", ...} │
   │ - Returns: JSON context                  │
   │                                          │
   │ Store both in node_core record           │
   │ (UPDATE from step 2)                     │
   └──────────────────────────────────────────┘
   
   [IF NO OpenAI Key]
   ┌──────────────────────────────────────────┐
   │ Use default templates:                   │
   │ - system_prompt: template text           │
   │ - node_context: basic JSON               │
   │ - User can add OpenAI later              │
   └──────────────────────────────────────────┘

4️⃣ UPDATE users WITH node_core_id
   ┌──────────────────────────────────────────┐
   │ UPDATE users SET:                        │
   │   node_core_id = nid_hash,               │
   │   updated_at = NOW()                     │
   │ WHERE id = user_id                       │
   └──────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
🔥 VECTOR CREATION STARTS HERE
═══════════════════════════════════════════════════════════════════════

5️⃣ CREATE NODE EMBEDDING (Vector for Node Identity)
   ┌──────────────────────────────────────────┐
   │ Call OpenAI.embeddings:                  │
   │ - Model: text-embedding-3-small (1536D) │
   │ - Text: node_context + system_prompt    │
   │ - Return: embedding vector              │
   │                                          │
   │ INSERT INTO embeddings VALUES:          │
   │ - id: UUID (auto)                       │
   │ - embedding_type: 'node_core'           │
   │ - reference_id: nid_hash                │
   │ - reference_table: 'node_core'          │
   │ - content: node_context (text)          │
   │ - embedding: [1536D vector]             │
   │ - business_id: business_id              │
   │ - owner_id: user_id                     │
   │ - auth_level: 'node_only' ← PROTECTED  │
   │ - created_at: NOW()                     │
   │ - updated_at: NOW()                     │
   │ - ttl: NULL (never expires)             │
   │ - is_active: true                       │
   └──────────────────────────────────────────┘
   ↓
   RETURNS: embedding_id

6️⃣ CREATE USER PROFILE EMBEDDING
   ┌──────────────────────────────────────────┐
   │ Call OpenAI.embeddings:                  │
   │ - Text: user profile (name, role, bio)  │
   │ - Return: 1536D vector                  │
   │                                          │
   │ INSERT INTO embeddings VALUES:          │
   │ - embedding_type: 'user_profile'        │
   │ - reference_id: user_id                 │
   │ - reference_table: 'users'              │
   │ - content: user profile text            │
   │ - embedding: [1536D vector]             │
   │ - auth_level: 'user_only' ← PROTECTED  │
   │ - owner_id: user_id                     │
   │ - business_id: business_id              │
   └──────────────────────────────────────────┘

7️⃣ CREATE BUSINESS EMBEDDING
   ┌──────────────────────────────────────────┐
   │ Call OpenAI.embeddings:                  │
   │ - Text: business info, industry, goals  │
   │ - Return: 1536D vector                  │
   │                                          │
   │ INSERT INTO embeddings VALUES:          │
   │ - embedding_type: 'business_profile'    │
   │ - reference_id: business_id             │
   │ - reference_table: 'businesses'         │
   │ - content: business profile text        │
   │ - embedding: [1536D vector]             │
   │ - auth_level: 'business' ← PROTECTED   │
   │ - owner_id: user_id                     │
   │ - business_id: business_id              │
   └──────────────────────────────────────────┘

8️⃣ CREATE PERMISSION EMBEDDING (Vector for Access Control)
   ┌──────────────────────────────────────────┐
   │ Build permission text from:              │
   │ - role_id permissions                    │
   │ - business_id capabilities               │
   │ - user custom permissions                │
   │                                          │
   │ Call OpenAI.embeddings:                  │
   │ - Text: all permission rules (JSON)      │
   │ - Return: 1536D vector                  │
   │                                          │
   │ INSERT INTO embeddings VALUES:          │
   │ - embedding_type: 'permission_matrix'   │
   │ - reference_id: user_id                 │
   │ - reference_table: 'users'              │
   │ - content: all permission rules (JSON)  │
   │ - embedding: [1536D vector]             │
   │ - auth_level: 'role_based' ← KEY       │
   │ - owner_id: user_id                     │
   │ - business_id: business_id              │
   │                                          │
   │ This vector controls what user can see! │
   └──────────────────────────────────────────┘

9️⃣ CREATE VECTOR REFERENCES TABLE
   ┌──────────────────────────────────────────┐
   │ INSERT INTO vector_references VALUES:   │
   │                                          │
   │ For each embedding created above:       │
   │ - node_id: nid_hash                     │
   │ - embedding_id: from INSERT steps       │
   │ - embedding_type: 'node|user|biz|perm'│
   │ - auth_required: true                   │
   │ - permission_level: 'owner|role|biz'   │
   │ - created_at: NOW()                     │
   │ - is_active: true                       │
   │                                          │
   │ Result: All vectors linked to node_id   │
   │ and permission-controlled                │
   └──────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
VECTOR INITIALIZATION COMPLETE ✅
═══════════════════════════════════════════════════════════════════════

OUTPUTS:
  ✅ nid_hash (unique node identifier)
  ✅ system_prompt (OpenAI configured)
  ✅ node_context (initial state)
  ✅ 4 embeddings created + registered
  ✅ Vector references linked to auth
  ✅ All vectors permission-protected
  ✅ Ready for UI load with vector enhancement

VECTOR STATUS AT THIS POINT: ✅ 4 VECTORS CREATED
  - node_core embedding (identity)
  - user_profile embedding (personalization)
  - business_profile embedding (context)
  - permission_matrix embedding (access control)
```

---

### PHASE 4: UI TABLE LOAD + VECTOR ENRICHMENT

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: LOAD UI TABLES + CHECK FIELDS + ADD MISSING + STORE       │
│ Status: VECTOR-INFORMED LOADING WITH PERMISSION FILTERING         │
└─────────────────────────────────────────────────────────────────────┘

4.1 QUERY UI_TEMPLATE_LAYOUTS TABLE
    ┌──────────────────────────────────────────┐
    │ SELECT * FROM ui_template_layouts        │
    │ WHERE business_id = user.business_id     │
    │   AND role_id IN user.assigned_roles     │
    │   AND is_active = true                   │
    │                                          │
    │ Auth-controlled: RLS filters by:        │
    │  - business_id                          │
    │  - user role                            │
    │  - permission_matrix embedding (vec)    │
    └──────────────────────────────────────────┘

4.2 FOR EACH TEMPLATE, CHECK FIELDS
    ┌──────────────────────────────────────────┐
    │ Expected fields in UI table:             │
    │ - id (UUID)                              │
    │ - name (text)                            │
    │ - description (text)                     │
    │ - layout_json (jsonb)                    │
    │ - modules (text[] of module names)       │
    │ - tables (text[] of table refs)          │
    │ - fields (jsonb - column mappings)       │
    │ - widgets (jsonb - widget config)        │
    │ - filters (jsonb - available filters)    │
    │ - sort_options (jsonb)                   │
    │ - business_id (UUID)                     │
    │ - created_by (UUID)                      │
    │ - created_at (timestamp)                 │
    │ - updated_at (timestamp)                 │
    │ - version (int)                          │
    │ - is_active (boolean)                    │
    │                                          │
    │ IF missing fields:                       │
    │  → Add defaults from template standard  │
    │  → Save back to table                    │
    └──────────────────────────────────────────┘

4.3 VECTOR ENRICHMENT OF UI TEMPLATES
    ┌──────────────────────────────────────────┐
    │ For each template loaded:                │
    │                                          │
    │ Call semantic_cache_lookup:              │
    │ - embedding: [permission_matrix_vector]  │
    │ - similarity_threshold: 0.85             │
    │                                          │
    │ Returns: Cached UI layout optimizations │
    │ (what this user saw before, preferred)  │
    │                                          │
    │ Apply: Personalize layout based on      │
    │ vector similarity (user history)         │
    └──────────────────────────────────────────┘

4.4 GET ALL BUSINESS TABLES FOR THIS ROLE
    ┌──────────────────────────────────────────┐
    │ SELECT table_name FROM tables            │
    │ WHERE business_id = user.business_id     │
    │   AND role_id IN user.assigned_roles     │
    │   AND is_visible = true                  │
    │                                          │
    │ Result: List of accessible tables        │
    │ (auth-controlled via permission vector) │
    └──────────────────────────────────────────┘

4.5 FOR EACH TABLE, GET SCHEMA
    ┌──────────────────────────────────────────┐
    │ Call get_ui_schema():                    │
    │ - business_id: user.business_id          │
    │ - table_name: from step 4.4              │
    │ - role_id: user.role_id                  │
    │ - Returns: Available columns + types     │
    │                                          │
    │ This returns ONLY columns user           │
    │ can see (column-level permission)        │
    └──────────────────────────────────────────┘

4.6 CHECK FIELD DEFINITIONS IN DATA_MODEL_REGISTRY
    ┌──────────────────────────────────────────┐
    │ SELECT FROM data_model_registry          │
    │ WHERE table_name = table                 │
    │   AND business_id = user.business_id     │
    │                                          │
    │ Fields defined:                          │
    │ - column_name                            │
    │ - data_type                              │
    │ - widget_type (text|select|date|etc)     │
    │ - validation_rules (jsonb)               │
    │ - display_label                          │
    │ - is_visible (column permission)         │
    │ - is_editable (write permission)         │
    │ - is_mandatory (required)                │
    │ - display_order (sort)                   │
    │ - help_text (UI hint)                    │
    └──────────────────────────────────────────┘

4.7 ADD MISSING FIELDS TO data_model_registry
    ┌──────────────────────────────────────────┐
    │ For any column in schema but not in      │
    │ data_model_registry:                     │
    │                                          │
    │ INSERT INTO data_model_registry:        │
    │ - table_name (from schema)               │
    │ - column_name (from schema)              │
    │ - data_type (from schema metadata)       │
    │ - widget_type: AUTO-DETECT from type    │
    │   * uuid → hidden                        │
    │   * text → text_input                    │
    │   * integer → number_input               │
    │   * boolean → toggle                     │
    │   * jsonb → json_editor                  │
    │   * timestamp → date_time                │
    │ - display_label: humanize(column_name)  │
    │ - is_visible: true (default)             │
    │ - is_editable: true (default)            │
    │ - is_mandatory: false (default)          │
    │ - display_order: auto_increment          │
    │ - validation_rules: from schema hints    │
    │ - help_text: auto-generate from context │
    │ - business_id: user.business_id          │
    │ - created_by: user.id                    │
    │ - created_at: NOW()                      │
    └──────────────────────────────────────────┘

4.8 VECTOR-BASED FIELD PERSONALIZATION
    ┌──────────────────────────────────────────┐
    │ Call search_ai_context():                │
    │ - query_embedding: [permission_vector]  │
    │ - business_id: user.business_id          │
    │ - Returns: Similar field configs used   │
    │                                          │
    │ Apply: Suggest optimal widget types     │
    │ based on user history (vector sim)       │
    │                                          │
    │ Update: widget_type → better choice      │
    │ for this user + field type               │
    └──────────────────────────────────────────┘

4.9 STORE COMPLETE UI CONFIG IN NODE_CORE
    ┌──────────────────────────────────────────┐
    │ UPDATE node_core SET:                    │
    │   node_context = {                       │
    │     "ui_config": {                       │
    │       "templates": [...loaded templates],│
    │       "tables": [...available tables],   │
    │       "schemas": {...table schemas},     │
    │       "fields": {...field configs},      │
    │       "permissions": {...all perms},     │
    │       "personalization": {               │
    │         "preferred_widgets": {...},      │
    │         "saved_filters": [...],          │
    │         "layout_preference": {...}       │
    │       },                                 │
    │       "vector_references": {             │
    │         "permission_embedding_id": xxx, │
    │         "ui_layout_embedding_id": yyy,  │
    │         "preference_embedding_id": zzz  │
    │       }                                  │
    │     },                                   │
    │     "created_at": NOW(),                │
    │     "loaded_by": "ui_layer_load"        │
    │   },                                     │
    │   updated_at = NOW()                     │
    │ WHERE nid_hash = user.node_core_id      │
    └──────────────────────────────────────────┘

4.10 CREATE UI_LOAD_EMBEDDING (Vector of complete UI state)
     ┌──────────────────────────────────────────┐
     │ Call OpenAI.embeddings:                  │
     │ - Text: complete UI config (JSON stringified) │
     │ - Returns: 1536D vector                  │
     │                                          │
     │ INSERT INTO embeddings VALUES:          │
     │ - embedding_type: 'ui_state_snapshot'   │
     │ - reference_id: nid_hash                │
     │ - reference_table: 'node_core'          │
     │ - content: full UI config                │
     │ - embedding: [1536D vector]             │
     │ - auth_level: 'user_only'               │
     │ - owner_id: user_id                     │
     │ - business_id: business_id              │
     │ - metadata: {                           │
     │     "load_timestamp": NOW(),            │
     │     "ui_version": "v1.0",              │
     │     "template_count": N,                │
     │     "field_count": M,                   │
     │     "permission_level": user.role      │
     │   }                                      │
     └──────────────────────────────────────────┘

OUTPUTS:
  ✅ Complete UI config in node_core
  ✅ All tables + schemas loaded
  ✅ All fields configured + stored
  ✅ Missing fields auto-added
  ✅ Vector snapshot created
  ✅ Ready for app load from node_core

VECTOR COUNT AT THIS POINT: ✅ 5 VECTORS
  (+ 1 ui_state_snapshot embedding)
```

---

### PHASE 5: APP INITIALIZATION FROM NODE_CORE

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: APP LOADS FROM NODE_CORE (Living System Activation)       │
│ Status: COMPLETE SYSTEM INITIALIZATION WITH VECTOR ENHANCEMENT     │
└─────────────────────────────────────────────────────────────────────┘

5.1 APP START - RETRIEVE NODE_CORE FROM CACHE/DB
    ┌──────────────────────────────────────────┐
    │ IF localStorage.nidHash exists:          │
    │  → Check node_core in memory cache       │
    │  → If not in cache:                      │
    │    SELECT * FROM node_core               │
    │    WHERE nid_hash = localStorage.nidHash │
    │                                          │
    │ Result: Complete node_context (with all │
    │ UI configs, embeddings, permissions)    │
    └──────────────────────────────────────────┘

5.2 VALIDATE NODE IS ACTIVE + AUTH VALID
    ┌──────────────────────────────────────────┐
    │ Call validateNodeAction():               │
    │ - nid_hash: from node_core               │
    │ - actionType: 'read'                     │
    │ - Returns: {valid: bool, reason: str}   │
    │                                          │
    │ Checks:                                  │
    │ ✓ Node not archived                     │
    │ ✓ Node not expired                      │
    │ ✓ Node activated                        │
    │ ✓ Node not in cold state                │
    │ ✓ User has read permission               │
    │ ✓ Trust score >= threshold               │
    │                                          │
    │ IF VALID: Continue                       │
    │ IF INVALID: Show error + re-auth        │
    └──────────────────────────────────────────┘

5.3 RETRIEVE + VERIFY VECTOR REFERENCES
    ┌──────────────────────────────────────────┐
    │ SELECT FROM vector_references            │
    │ WHERE node_id = nid_hash                 │
    │   AND is_active = true                   │
    │                                          │
    │ Verify all expected vectors present:     │
    │ ✓ node_core embedding (identity)        │
    │ ✓ user_profile embedding (personal)     │
    │ ✓ business_profile embedding (context)  │
    │ ✓ permission_matrix embedding (access)  │
    │ ✓ ui_state_snapshot embedding (layout)  │
    │                                          │
    │ IF any missing:                          │
    │  → Regenerate (call Phase 3 steps)       │
    │  → Update vector_references              │
    └──────────────────────────────────────────┘

5.4 LOAD SYSTEM PROMPT + NODE CONTEXT
    ┌──────────────────────────────────────────┐
    │ From node_core record:                   │
    │ - system_prompt (for OpenAI)             │
    │ - node_context (complete state)          │
    │ - node_name (for UI display)             │
    │ - capabilities (from Dharma)             │
    │                                          │
    │ Initialize in app:                       │
    │ localStorage.systemPrompt = ...          │
    │ localStorage.nodeContext = ...           │
    │ appState.nodeIdentity = {...}            │
    └──────────────────────────────────────────┘

5.5 LOAD UI CONFIG FROM node_context
    ┌──────────────────────────────────────────┐
    │ Extract from node_context.ui_config:     │
    │                                          │
    │ appState.templates = [...]               │
    │ appState.tables = [...]                  │
    │ appState.schemas = {...}                 │
    │ appState.fieldConfigs = {...}            │
    │ appState.permissions = {...}             │
    │ appState.widgets = {...}                 │
    │                                          │
    │ Initialize UI renderer:                  │
    │ → Load dashboard with this config        │
    │ → Apply widget layout                    │
    │ → Apply field visibility rules           │
    │ → Render forms with correct widgets      │
    └──────────────────────────────────────────┘

5.6 LOAD + VALIDATE PERMISSION VECTOR
    ┌──────────────────────────────────────────┐
    │ Retrieve permission_matrix embedding:    │
    │ SELECT * FROM embeddings                 │
    │ WHERE embedding_type = 'permission_matrix' │
    │   AND reference_id = user_id             │
    │                                          │
    │ This vector controls:                    │
    │ - Which columns user can see             │
    │ - Which rows user can access (RLS)       │
    │ - Which actions user can perform         │
    │                                          │
    │ Apply to UI:                             │
    │ - Hide columns not in vector             │
    │ - Show only rows passing RLS             │
    │ - Disable write-only buttons              │
    └──────────────────────────────────────────┘

5.7 INITIALIZE RAG + SEMANTIC CACHE
    ┌──────────────────────────────────────────┐
    │ FOR EACH RAG-ENABLED FEATURE:            │
    │                                          │
    │ Check semantic_cache:                    │
    │ - Call semantic_cache_lookup()           │
    │ - Use user_profile embedding             │
    │ - Returns: Previous results               │
    │                                          │
    │ Initialize RAG system:                   │
    │ - Load knowledge base (vectors)          │
    │ - Setup vector search (pgvector index)   │
    │ - Initialize OpenAI client                │
    │ - Setup streaming response handling      │
    │                                          │
    │ Result: User can query with RAG          │
    │ (vector-enhanced retrieval)              │
    └──────────────────────────────────────────┘

5.8 CREATE SESSION CONTEXT IN NODE_CORE
    ┌──────────────────────────────────────────┐
    │ UPDATE node_core SET:                    │
    │   node_context = {                       │
    │     ...previous_context,                 │
    │     "session": {                         │
    │       "started_at": NOW(),               │
    │       "user_agent": navigator.userAgent, │
    │       "ip_address": client.ip,           │
    │       "auth_token": localStorage.token,  │
    │       "vectors_loaded": [vector_ids],    │
    │       "rag_enabled": true,               │
    │       "semantic_cache_hits": 0,          │
    │       "last_activity": NOW()             │
    │     }                                     │
    │   },                                     │
    │   updated_at = NOW()                     │
    │ WHERE nid_hash = node_id                 │
    └──────────────────────────────────────────┘

5.9 READY FOR OPERATION
    ┌──────────────────────────────────────────┐
    │ Node Core Living System is ACTIVE:      │
    │                                          │
    │ ✅ Identity: node_core embedding        │
    │ ✅ Context: complete node_context       │
    │ ✅ Permissions: permission vector       │
    │ ✅ UI State: ui_state snapshot          │
    │ ✅ Security: all auth checks pass       │
    │ ✅ RAG: semantic cache ready             │
    │ ✅ Session: tracked in node_core        │
    │                                          │
    │ User can now:                            │
    │ • View dashboard (vector-personalized)  │
    │ • Execute actions (auth + vector check) │
    │ • Query with RAG (semantic search)       │
    │ • Update preferences (updates vectors)  │
    └──────────────────────────────────────────┘

OUTPUTS:
  ✅ Complete app initialized from node_core
  ✅ All vectors validated + loaded
  ✅ Permissions applied via vector filtering
  ✅ RAG system ready with semantic cache
  ✅ Session tracked in living node_core
  ✅ User can interact with full system

VECTOR COUNT AT THIS POINT: ✅ 5 ACTIVE VECTORS
  (All linked to user session + auth)
```

---

### PHASE 6: ONGOING OPERATIONS + VECTOR UPDATES

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: RUNTIME OPERATIONS WITH VECTOR CONSISTENCY                 │
│ Status: LIVING NODE CORE + DYNAMIC VECTOR UPDATES                  │
└─────────────────────────────────────────────────────────────────────┘

6.1 USER EXECUTES ACTION (Create/Read/Update/Delete)
    ┌──────────────────────────────────────────┐
    │ User clicks button → API call:           │
    │                                          │
    │ POST /api/action:                        │
    │ {                                        │
    │   "nidHash": node_id,                    │
    │   "action": "create|read|update|delete",│
    │   "table": "table_name",                 │
    │   "data": {...}                          │
    │ }                                        │
    │                                          │
    │ → API forwards to Kernel                 │
    └──────────────────────────────────────────┘

6.2 KERNEL VALIDATES + EVALUATES
    ┌──────────────────────────────────────────┐
    │ 1. Call validateNodeAction():            │
    │    - Checks auth + permissions           │
    │    - Uses permission_matrix vector      │
    │                                          │
    │ 2. Call evaluateDharma():                │
    │    - Checks ethical constraints          │
    │    - Calculates karma impact             │
    │                                          │
    │ 3. Check RLS policies:                   │
    │    - Row-level security filters          │
    │    - Based on permission vector          │
    │                                          │
    │ IF any check FAILS:                      │
    │  → Return 403 Forbidden                  │
    │  → Log violation in node_core            │
    │  → Optionally update vector (decrease)   │
    │                                          │
    │ IF all checks PASS:                      │
    │  → Proceed to execution (step 6.3)       │
    └──────────────────────────────────────────┘

6.3 EXECUTE ACTION ON DATABASE
    ┌──────────────────────────────────────────┐
    │ INSERT/UPDATE/DELETE on business table  │
    │                                          │
    │ Example UPDATE:                          │
    │ UPDATE customers SET                     │
    │   name = 'New Name',                     │
    │   updated_by = user_id,                  │
    │   updated_at = NOW()                     │
    │ WHERE id = record_id                     │
    │   AND business_id = user.business_id     │
    │   [AND other RLS filters]                │
    │                                          │
    │ Result: 1 row affected (if authorized)  │
    └──────────────────────────────────────────┘

6.4 VECTOR UPDATE: CREATE MODIFIED RECORD EMBEDDING
    ┌──────────────────────────────────────────┐
    │ After successful write operation:        │
    │                                          │
    │ IF action = 'write' OR 'update':        │
    │                                          │
    │ 1. Fetch updated record from DB          │
    │ 2. Serialize to text (for embedding)     │
    │ 3. Call OpenAI.embeddings:               │
    │    - Text: "{table}: {updated data}"     │
    │    - Returns: 1536D vector               │
    │                                          │
    │ 4. INSERT INTO embeddings:               │
    │    - embedding_type: 'record_update'     │
    │    - reference_id: record.id             │
    │    - reference_table: table_name         │
    │    - content: updated data (text)        │
    │    - embedding: [1536D vector]           │
    │    - metadata: {                         │
    │        "action": "update",               │
    │        "modified_by": user_id,           │
    │        "timestamp": NOW(),               │
    │        "vector_version": 2               │
    │      }                                    │
    │    - auth_level: business (RLS filter)  │
    │    - owner_id: business_id               │
    │                                          │
    │ Result: Complete audit trail in vectors │
    └──────────────────────────────────────────┘

6.5 SEMANTIC CACHE UPDATE
    ┌──────────────────────────────────────────┐
    │ IF any AI query was used to inform       │
    │ the action (e.g., "suggest name"):       │
    │                                          │
    │ 1. Check if similar query in cache:      │
    │    Call semantic_cache_lookup():         │
    │    - embedding: [query vector]           │
    │                                          │
    │ 2. Invalidate similar cached results:    │
    │    UPDATE semantic_cache SET             │
    │    is_valid = false                      │
    │    WHERE similarity > 0.80               │
    │      AND reference_table = table_name    │
    │                                          │
    │ 3. Generate new cached result:           │
    │    Call save_semantic_cache():           │
    │    - query: user query (text)            │
    │    - embedding: [query vector]           │
    │    - answer: action result (text)        │
    │                                          │
    │ Result: Cache stays fresh + accurate     │
    └──────────────────────────────────────────┘

6.6 UPDATE NODE_CORE CONTEXT
    ┌──────────────────────────────────────────┐
    │ Update living node's state:              │
    │                                          │
    │ UPDATE node_core SET:                    │
    │   node_context = {                       │
    │     ...previous,                         │
    │     "last_action": {                     │
    │       "type": "update",                  │
    │       "table": table_name,               │
    │       "record_id": record.id,            │
    │       "timestamp": NOW(),                │
    │       "vector_id": new_embedding_id,     │
    │       "cache_status": "updated"          │
    │     },                                   │
    │     "activity_log": [                    │
    │       ...previous_actions,               │
    │       {...action details}                │
    │     ]                                     │
    │   },                                     │
    │   updated_at = NOW()                     │
    │ WHERE nid_hash = node_id                 │
    └──────────────────────────────────────────┘

6.7 CALCULATE KARMA IMPACT
    ┌──────────────────────────────────────────┐
    │ Call applyKarma():                       │
    │ - Evaluates action impact                │
    │ - Updates trust_score                    │
    │ - Updates reputation_level               │
    │                                          │
    │ Example:                                 │
    │ • Creating legitimate record: +karma    │
    │ • Attempting unauthorized access: -karma │
    │ • Successful RAG query: +reputation      │
    │                                          │
    │ UPDATE node_core SET:                    │
    │   trust_score = trust_score + karma_delta │
    │   reputation_level = calculate_rep()    │
    │   updated_at = NOW()                     │
    │ WHERE nid_hash = node_id                 │
    └──────────────────────────────────────────┘

6.8 RETURN RESPONSE TO USER
    ┌──────────────────────────────────────────┐
    │ API Response:                            │
    │ {                                        │
    │   "success": true,                       │
    │   "data": {...updated record},           │
    │   "vectors": {                           │
    │     "embedding_id": new_embed_id,        │
    │     "cached_similar": cache_hit_count,   │
    │     "permission_check": "passed"         │
    │   },                                     │
    │   "node_status": {                       │
    │     "trust_score": new_score,            │
    │     "reputation": new_reputation,        │
    │     "can_execute": true                  │
    │   }                                       │
    │ }                                        │
    └──────────────────────────────────────────┘

VECTOR LIFECYCLE DURING OPERATION:
  📝 Record modified → new vector created
  🔍 Query executed → embedding stored
  ⚡ Cache hit → semantic_cache returns vector
  🔄 Permission changed → permission vector regenerated
  📊 User history → vector-based personalization applied

ONGOING VECTOR COUNTS:
  • Core vectors (5): Always active
  • Transaction vectors: Created per action
  • Cache vectors: Updated per query
  • Audit vectors: Growing with activity log
```

---

## 🔐 VECTOR SECURITY & PERMISSION MODEL

```
┌──────────────────────────────────────────────────────────────────────┐
│                    5-LAYER VECTOR PROTECTION                         │
└──────────────────────────────────────────────────────────────────────┘

LAYER 1: AUTHENTICATION
  ├─ Vector access requires valid JWT token
  ├─ Token checked: NOT expired, NOT revoked
  ├─ User auth status verified before vector retrieval
  └─ Session must be active in node_core

LAYER 2: BUSINESS-LEVEL ISOLATION
  ├─ Vectors filtered by business_id
  ├─ SELECT * FROM embeddings WHERE business_id = user.business_id
  ├─ Cross-business vector access IMPOSSIBLE
  └─ Even if someone gets direct DB access

LAYER 3: PERMISSION MATRIX (Vector-Based)
  ├─ permission_matrix embedding controls access
  ├─ Vector similarity checked: can_read = true?
  ├─ If similarity < threshold → DENY access
  ├─ Dynamic: updates when role/permissions change
  └─ Each user has unique permission vector

LAYER 4: ROW-LEVEL SECURITY (RLS)
  ├─ PostgreSQL RLS policies on embeddings table
  ├─ Policy: (owner_id = current_user OR role = 'admin')
  ├─ Database enforces: user cannot SELECT vectors not owned
  ├─ Even if they craft SQL query → DB blocks
  └─ Transparent + effective

LAYER 5: AUTH METADATA
  ├─ Vector embeddings tagged with auth_level
  ├─ auth_level: 'node_only' → only node can access
  ├─ auth_level: 'user_only' → only user can access
  ├─ auth_level: 'role_based' → role-determined access
  ├─ auth_level: 'business' → anyone in business
  └─ Enforced in application layer + database layer

ATTACK SCENARIOS + DEFENSE:

Scenario 1: User tries to access other user's vector
  ├─ Attacker: SELECT * FROM embeddings WHERE owner_id = 'other_user'
  ├─ Defense Layer 2: business_id mismatch → 0 rows
  ├─ Defense Layer 4: RLS policy blocks query → 0 rows
  ├─ Defense Layer 5: auth_level='user_only' → application rejects
  └─ Result: ❌ BLOCKED at multiple layers

Scenario 2: User tries to access permission vector without permission
  ├─ Attacker: Call semantic_cache_lookup(other_user_permission_vector)
  ├─ Defense Layer 1: Check token, verify user_id
  ├─ Defense Layer 3: Permission matrix check fails
  ├─ Defense Layer 4: RLS blocks if owner_id != current_user
  ├─ Defense Layer 5: auth_level='role_based' → deny
  └─ Result: ❌ BLOCKED at application + database layer

Scenario 3: Compromised JWT token
  ├─ Attacker: Has valid token but shouldn't have access
  ├─ Defense Layer 1: Check token revocation (in Redis)
  ├─ Defense Layer 3: Recalculate permission vector on every call
  ├─ Defense Layer 4: RLS still blocks cross-business access
  └─ Result: ⚠️  Limited damage (business isolation still holds)

IMPLEMENTATION CODE PATTERNS:

Pattern 1: Safe Vector Retrieval
  ```sql
  SELECT e.* FROM embeddings e
  WHERE e.embedding_type = 'user_profile'
    AND e.reference_id = $1
    AND e.business_id = (
      SELECT business_id FROM users WHERE id = current_user_id
    )
    AND e.auth_level IN ('user_only', 'role_based', 'business')
    AND e.is_active = true
  ```

Pattern 2: Permission Vector Check (in application)
  ```javascript
  async function checkVectorPermission(userId, vectorId) {
    const userPermissionVector = await getPermissionVector(userId);
    const vector = await getVector(vectorId);
    
    // Vector similarity check
    const similarity = cosineSimilarity(userPermissionVector, vector);
    
    if (similarity < 0.85) {
      throw new Error('Permission denied');
    }
    return true;
  }
  ```

Pattern 3: Audit Trail (in node_core)
  ```javascript
  // Track vector access in node_core context
  UPDATE node_core SET
    node_context = jsonb_set(
      node_context,
      '{vector_access_log}',
      node_context->'vector_access_log' || 
      jsonb_build_object(
        'vector_id', $1,
        'accessed_by', $2,
        'timestamp', NOW(),
        'similarity_score', $3,
        'access_granted', $4
      )
    )
  WHERE nid_hash = $5
  ```
```

---

## 📊 VECTOR TYPES + PURPOSES

```
┌──────────────────────────────────────────────────────────────────────┐
│                    VECTOR TAXONOMY IN SYSTEM                         │
└──────────────────────────────────────────────────────────────────────┘

TYPE 1: NODE IDENTITY VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Represent the node_core's identity           │
│ Content: node_context + system_prompt                 │
│ Created: During signup (Phase 3)                       │
│ Updated: When system_prompt regenerated               │
│ Access: Only by the node itself                        │
│ Size: 1536D (OpenAI text-embedding-3-small)          │
│ Examples:                                              │
│ - "John Doe's Node Core manages customers for ABC Co" │
│ - "CRM Node for Sales team"                           │
│ - "Analytics Node for Finance dept"                   │
└────────────────────────────────────────────────────────┘

TYPE 2: USER PROFILE VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Represent user's profile + preferences       │
│ Content: name + role + bio + interests                │
│ Created: During signup (Phase 3)                       │
│ Updated: When user updates profile                    │
│ Access: Only by the user (auth_level='user_only')    │
│ Used for: Personalization, vector-based recommendations │
│ Size: 1536D                                           │
│ Examples:                                              │
│ - User preferences (dashboard layout, widgets)        │
│ - User history (queries, actions)                     │
│ - User expertise (domain knowledge)                   │
└────────────────────────────────────────────────────────┘

TYPE 3: BUSINESS PROFILE VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Represent business identity + context        │
│ Content: business_name + industry + capabilities      │
│ Created: When business registered                     │
│ Updated: When business info changes                   │
│ Access: All users in business (auth_level='business')│
│ Used for: Business-wide context, RAG knowledge base   │
│ Size: 1536D                                           │
│ Examples:                                              │
│ - "Manufacturing co, ISO certified, 50 employees"    │
│ - "SaaS startup, AI-focused, 10 employees"          │
│ - "Healthcare provider, HIPAA compliant, clinic"    │
└────────────────────────────────────────────────────────┘

TYPE 4: PERMISSION MATRIX VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Control access to resources + features       │
│ Content: all permission rules in JSON                 │
│ Created: When user role assigned                      │
│ Updated: EVERY time role/permission changes           │
│ Access: Permission check engine (internal)            │
│ Used for: Row-level filtering, column visibility      │
│ Size: 1536D                                           │
│ Critical: Regenerate immediately on permission change │
│ Examples:                                              │
│ - "Can read customers, can't write, can't delete"   │
│ - "Full admin access to all tables"                   │
│ - "View-only for reports, edit own profile"         │
└────────────────────────────────────────────────────────┘

TYPE 5: UI STATE SNAPSHOT VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Snapshot of user's UI state                  │
│ Content: all UI configs, templates, field settings    │
│ Created: When UI loads (Phase 4)                      │
│ Updated: Periodically as UI state changes             │
│ Access: By UI rendering engine                        │
│ Used for: Restoring UI layout, personalization        │
│ Size: 1536D (compressed from large JSON)             │
│ Example JSON:                                          │
│ {                                                      │
│   "templates": [...],                                 │
│   "widgets": {...},                                   │
│   "layout": {...}                                     │
│ }                                                      │
└────────────────────────────────────────────────────────┘

TYPE 6: QUERY RECORD VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Embed database records for semantic search   │
│ Content: record data (all fields)                     │
│ Created: For important business records               │
│ Updated: When record modified (Phase 6)               │
│ Access: Via semantic search (vector similarity)       │
│ Used for: Finding similar records, RAG retrieval      │
│ Size: 1536D per record                               │
│ Examples:                                              │
│ - Customer records (for fuzzy matching)               │
│ - Product catalog (for recommendations)               │
│ - Support tickets (for similar issue search)         │
└────────────────────────────────────────────────────────┘

TYPE 7: SEMANTIC CACHE VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Cache AI query + response pairs              │
│ Content: query embedding + answer text                │
│ Created: After every OpenAI call (Phase 6)            │
│ Updated: Invalidated when similar action occurs       │
│ Access: Before making new OpenAI call                 │
│ Used for: Reducing API costs, faster responses        │
│ Size: 1536D                                           │
│ TTL: 7 days (configurable)                           │
│ Cache Hit Threshold: cosine_similarity > 0.85        │
│ Examples:                                              │
│ - "List all customers in California" → vector + result │
│ - "Top 10 products by revenue" → vector + result     │
│ - "Generate report for Q4" → vector + result         │
└────────────────────────────────────────────────────────┘

TYPE 8: RAG KNOWLEDGE BASE VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Store company knowledge for AI retrieval     │
│ Content: documents, FAQs, training materials          │
│ Created: Admin uploads documents                      │
│ Updated: When documents updated                       │
│ Access: Via vector similarity search                  │
│ Used for: RAG retrieval, AI context building          │
│ Size: 1536D per chunk                                │
│ Chunking: Documents split into 500-token chunks       │
│ Examples:                                              │
│ - Company policies                                     │
│ - Product manuals                                      │
│ - Training videos transcripts                         │
│ - Customer support documentation                      │
│ - Sales playbooks                                     │
└────────────────────────────────────────────────────────┘

TYPE 9: AUDIT TRAIL VECTORS
┌────────────────────────────────────────────────────────┐
│ Purpose: Create audit trail of actions                │
│ Content: action details (who, what, when, why)        │
│ Created: After every significant action               │
│ Updated: Never (immutable)                            │
│ Access: Audit log queries (admin only)                │
│ Used for: Compliance, security investigation          │
│ Size: 1536D                                           │
│ Retention: 7 years (regulatory)                       │
│ Examples:                                              │
│ - "User X created customer Y at 3:45 PM"             │
│ - "Permission granted: User Z can now edit table A"  │
│ - "Unauthorized access attempt from IP 192.168.1.1" │
└────────────────────────────────────────────────────────┘

VECTOR LIFECYCLE SUMMARY:
┌─────────────────────────────────────────────────────────────┐
│ Creation → Active → Updated → Archived → Deleted           │
│                                                              │
│ • Types 1-5: Created once, updated periodically            │
│ • Types 6-8: Created on demand, updated constantly         │
│ • Type 9: Created once, never updated (audit)              │
│                                                              │
│ All vectors:                                                │
│ ✓ Auth-protected at multiple layers                        │
│ ✓ Linked to node_core for tracking                        │
│ ✓ Versioned for consistency                                │
│ ✓ Archived (not deleted) for compliance                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 API ENDPOINTS FOR VECTOR OPERATIONS

```
PUBLIC/AUTH ENDPOINTS:

1. LOGIN (Creates auth token, starts Phase 1)
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "****" or
     "phone": "+1234567890",
     "biometric": "face_template"
   }
   Returns: { authToken, userId, businessId, nodeId (if exists) }

2. SIGNUP (Initiates Phase 2-3)
   POST /api/auth/signup
   {
     "email": "user@example.com",
     "phone": "+1234567890",
     "password": "****",
     "fullName": "John Doe",
     "dob": "1990-01-01",
     "address": "...",
     "businessId": "uuid" (optional, for join)
   }
   Returns: { authToken, userId, businessId, nodeId, setupComplete }

3. REGISTER BIOMETRIC (Part of Phase 2)
   POST /api/auth/biometric/register
   {
     "type": "face" | "fingerprint",
     "template": "biometric_data"
   }
   Returns: { registered: true, template_id: "uuid" }

KERNEL ENDPOINTS (Protected by node_core):

4. VALIDATE NODE ACTION (Internal to Phase 6)
   POST /api/kernel/validate
   {
     "nidHash": "node_id",
     "actionType": "read|write|delete|execute",
     "targetOwnerId": "user_id"
   }
   Returns: { valid: true|false, reason: "string" }

5. GET NODE STATUS (Check node is active)
   GET /api/kernel/node/:nidHash
   Returns: Complete node_core object with vectors

UI/VECTOR ENDPOINTS:

6. LOAD UI CONFIGURATION (Phase 4)
   GET /api/ui/config?businessId=uuid&roleId=uuid
   Returns: { templates, schemas, fields, widgets, ... }

7. CREATE/UPDATE VECTOR
   POST /api/vector/create
   {
     "type": "user_profile|record|cache|etc",
     "content": "text to embed",
     "authLevel": "user_only|role_based|business",
     "metadata": {...}
   }
   Returns: { embedding_id, vector: [1536], created_at }

8. VECTOR SIMILARITY SEARCH (RAG)
   POST /api/vector/search
   {
     "query": "user query text",
     "type": "knowledge_base|cache|records",
     "limit": 10,
     "threshold": 0.85
   }
   Returns: [
     { id, content, similarity: 0.95, ... },
     ...
   ]

9. SEMANTIC CACHE LOOKUP (RAG optimization)
   POST /api/vector/cache/lookup
   {
     "query": "user query",
     "similarity_threshold": 0.85
   }
   Returns: { found: true|false, cached_answer: "text", similarity: 0.92 }

10. SEMANTIC CACHE SAVE (After OpenAI call)
    POST /api/vector/cache/save
    {
      "query": "user query",
      "embedding": [1536D vector],
      "answer": "OpenAI response",
      "ttl": 604800 (7 days)
    }
    Returns: { cache_id, saved_at }

NODE CORE ENDPOINTS:

11. GET NODE CONTEXT (Retrieve node state for app)
    GET /api/node/context/:nidHash
    Returns: Complete node_context (ui_config, permissions, vectors, etc)

12. UPDATE NODE CONTEXT (After action executed)
    PUT /api/node/context/:nidHash
    {
      "node_context": {...updated context},
      "vectorIds": [... new vectors created]
    }
    Returns: { updated: true, updated_at }

13. APPLY KARMA (Update node after action)
    POST /api/node/karma
    {
      "nidHash": "node_id",
      "actionType": "create|update|delete|execute",
      "karmaDelta": +1 or -1
    }
    Returns: { new_trust_score, new_reputation, ... }

RAG ENDPOINTS:

14. RUN RAG ENGINE (User query with AI)
    POST /api/rag/query
    {
      "question": "user question",
      "agent": "default|specialized",
      "context": "optional context"
    }
    Returns: {
      answer: "AI response",
      sources: [embedded_docs],
      vector_id: "of query",
      cache_hit: true|false,
      execution_time_ms: 234
    }

15. SEARCH KNOWLEDGE BASE (Vector search only)
    POST /api/rag/search
    {
      "query": "search query",
      "limit": 10,
      "businessId": "uuid"
    }
    Returns: [
      { id, content, metadata, similarity: 0.92 },
      ...
    ]
```

---

## 📋 IMPLEMENTATION CHECKLIST

```
✓ = Completed
⚠ = In Progress
○ = Planned

PHASE 1: AUTHENTICATION (User Login)
  ✓ Email + Phone login endpoints
  ✓ Password validation
  ✓ Biometric validation
  ✓ JWT token generation
  ✓ Token storage in localStorage
  ✓ Session tracking

PHASE 2: SIGNUP + BASIC DETAILS
  ✓ Personal identity collection
  ✓ Location + geography collection
  ✓ Password setup + hashing
  ✓ Biometric registration
  ✓ Business association
  ⚠ OpenAI system prompt generation

PHASE 3: NODE CORE CREATION
  ✓ Create users table record
  ✓ Create node_core record
  ⚠ Generate system_prompt (OpenAI)
  ⚠ Generate node_context (OpenAI)
  ⚠ Create node_embedding (vector)
  ⚠ Create user_profile_embedding (vector)
  ⚠ Create business_profile_embedding (vector)
  ⚠ Create permission_matrix_embedding (vector)
  ○ Create vector_references table records

PHASE 4: UI LAYER LOAD
  ✓ Load ui_template_layouts
  ✓ Load business tables + schemas
  ○ Check/add missing fields in data_model_registry
  ○ Vector-based field personalization
  ○ Store complete UI config in node_core
  ○ Create ui_state_snapshot_embedding

PHASE 5: APP INITIALIZATION
  ✓ Retrieve node_core from cache/DB
  ✓ Validate node is active + auth valid
  ○ Retrieve + verify vector references
  ○ Load system_prompt + node_context
  ○ Load UI config from node_context
  ○ Load + validate permission vector
  ○ Initialize RAG + semantic cache
  ○ Create session context in node_core

PHASE 6: RUNTIME OPERATIONS
  ✓ User executes action
  ✓ Kernel validates + evaluates
  ✓ Execute on database
  ⚠ Create modified record embedding (vector)
  ○ Update semantic cache
  ○ Update node_core context
  ○ Calculate karma impact
  ○ Return response with vector info

VECTOR SECURITY
  ✓ JWT token authentication
  ✓ Business-level isolation (business_id)
  ○ Permission matrix vector checking
  ✓ PostgreSQL RLS policies
  ○ Auth metadata enforcement

VECTOR TYPES
  ○ Type 1: Node identity vectors
  ○ Type 2: User profile vectors
  ○ Type 3: Business profile vectors
  ○ Type 4: Permission matrix vectors
  ✓ Type 5: UI state snapshot vectors
  ○ Type 6: Query record vectors
  ○ Type 7: Semantic cache vectors
  ○ Type 8: RAG knowledge base vectors
  ○ Type 9: Audit trail vectors

API ENDPOINTS
  ✓ POST /api/auth/login
  ✓ POST /api/auth/signup
  ○ POST /api/auth/biometric/register
  ○ POST /api/kernel/validate
  ○ GET /api/kernel/node/:nidHash
  ○ GET /api/ui/config
  ○ POST /api/vector/create
  ○ POST /api/vector/search
  ○ POST /api/vector/cache/lookup
  ○ POST /api/vector/cache/save
  ○ GET /api/node/context/:nidHash
  ○ PUT /api/node/context/:nidHash
  ○ POST /api/node/karma
  ○ POST /api/rag/query
  ○ POST /api/rag/search

DOCUMENTATION
  ✓ Flow diagrams
  ✓ Phase descriptions
  ✓ Vector taxonomy
  ✓ Security model
  ○ Code examples
  ○ Testing guide
  ○ Deployment checklist
```

---

## 🚀 NEXT STEPS

1. **Implement Vector Creation** (Phase 3 & 4)
   - Complete OpenAI embedding calls
   - Create embeddings table records
   - Setup vector_references links

2. **Build API Endpoints** 
   - All 15 endpoints from section 🎯 
   - Add error handling + logging
   - Add rate limiting for OpenAI calls

3. **Implement Vector Security**
   - Permission matrix checking
   - RLS policy enforcement
   - Audit trail tracking

4. **Test Complete Flows**
   - Signup → Node creation → UI load
   - Action execution → Vector update
   - RAG queries with cache hits

5. **Performance Optimization**
   - Vector index creation (pgvector HNSW)
   - Cache warming strategies
   - Batch embedding generation

6. **Production Deployment**
   - Vector database backup/recovery
   - Monitoring + alerting
   - Vector versioning strategy
   - Compliance (GDPR, data retention)

---

**Status**: 🟢 ARCHITECTURE COMPLETE - READY FOR IMPLEMENTATION

Document Last Updated: January 28, 2026
Created by: System Architecture Team
Auth Integration: ✅ Complete | Vectors: ⚠️ Ready for Implementation | RAG: ✅ Planned
