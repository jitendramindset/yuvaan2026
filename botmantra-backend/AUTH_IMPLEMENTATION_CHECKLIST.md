# 📋 Auth + OpenAI + Node Core - Implementation Checklist

**Status**: Complete Flow Architecture Documented  
**Date**: January 28, 2026  
**Next Step**: Implementation

---

## PHASE 1: Database Schema & Field Setup

### 1.1 Create Missing Tables (If Not Exist)
- [ ] **semantic_cache**
  ```sql
  CREATE TABLE semantic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT NOT NULL,
    embedding VECTOR(1536),
    result JSONB,
    ttl INTEGER DEFAULT 3600,
    created_at TIMESTAMP DEFAULT NOW(),
    business_id UUID
  );
  ```
  
- [ ] **embeddings**
  ```sql
  CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    business_id UUID
  );
  ```
  
- [ ] **chat_history**
  ```sql
  CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant'
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    session_id TEXT,
    business_id UUID
  );
  ```
  
- [ ] **ai_context_cache**
  ```sql
  CREATE TABLE ai_context_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT NOT NULL,
    context JSONB,
    sources JSONB,
    ttl INTEGER DEFAULT 3600,
    created_at TIMESTAMP DEFAULT NOW(),
    business_id UUID
  );
  ```

### 1.2 Add Fields to UI Tables
- [ ] **ui_templates**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT) - Default: 'grid'
  - [ ] Add: widget (TEXT) - Default: 'card'
  - [ ] Add: config (JSONB)

- [ ] **dashboard_layouts**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT) - Default: 'grid'
  - [ ] Add: widget (TEXT) - Default: 'container'
  - [ ] Add: config (JSONB)

- [ ] **dashboard_widgets**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT)
  - [ ] Add: widget (TEXT)
  - [ ] Add: config (JSONB)

- [ ] **dashboard_kpis**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT)
  - [ ] Add: widget (TEXT)
  - [ ] Add: config (JSONB)

- [ ] **ui_themes**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT)
  - [ ] Add: widget (TEXT)
  - [ ] Add: config (JSONB)

- [ ] **ui_components**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT)
  - [ ] Add: widget (TEXT)
  - [ ] Add: config (JSONB)

- [ ] **permission_groups**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT)
  - [ ] Add: widget (TEXT)
  - [ ] Add: config (JSONB)

- [ ] **user_preferences**
  - [ ] Add: module (TEXT)
  - [ ] Add: table (TEXT)
  - [ ] Add: fields (JSONB)
  - [ ] Add: layout (TEXT)
  - [ ] Add: widget (TEXT)
  - [ ] Add: config (JSONB)

### 1.3 Verify node_core Fields
- [ ] node_core has: **system_prompt** (TEXT)
- [ ] node_core has: **node_context** (JSONB)
- [ ] node_core has: **ui_config** (JSONB)
- [ ] node_core has: **is_initialized** (BOOLEAN)
- [ ] node_core has: **initialization_step** (TEXT)

### 1.4 Enable Extensions
- [ ] Enable vector extension (pgvector)
- [ ] Enable full text search
- [ ] Enable UUID generation

---

## PHASE 2: Authentication Backend

### 2.1 Login Endpoints

- [ ] **POST /api/auth/check-exists**
  ```javascript
  Input: { email, phone }
  Output: { exists, user, action }
  Logic: Query users table by email OR phone
  ```

- [ ] **POST /api/auth/login**
  ```javascript
  Input: { email/phone, password, login_method }
  Output: { token, user, node_core_id }
  Logic:
    1. Find user by email or phone
    2. Compare password hash (bcrypt)
    3. Generate JWT
    4. Create session
    5. Return token
  ```

- [ ] **POST /api/auth/biometric-login**
  ```javascript
  Input: { biometric_type, biometric_template, confidence }
  Output: { token, user, node_core_id, matched }
  Logic:
    1. Query biometric_store by type
    2. Compare templates (fuzzy match >95%)
    3. If matched: Create session and JWT
    4. Return success
  ```

### 2.2 Signup Endpoints

- [ ] **POST /api/auth/signup-step1**
  ```javascript
  Input: { email, phone }
  Output: { success, message }
  Logic:
    1. Validate email/phone format
    2. Check if user exists
    3. If exists: Return error
    4. If new: Continue
  ```

- [ ] **POST /api/auth/signup-step2**
  ```javascript
  Input: { email, phone, name, password, dob, address, location }
  Output: { success, user_id }
  Logic:
    1. Validate all fields
    2. Hash password
    3. Create user record (not yet node_core)
    4. Return user_id for next step
  ```

- [ ] **POST /api/biometric/register**
  ```javascript
  Input: { user_id, biometric_type, biometric_data }
  Output: { success, template_stored }
  Logic:
    1. Encrypt biometric data (AES-256)
    2. Extract/store biometric template
    3. Save to biometric_store table
    4. Return success
  ```

- [ ] **POST /api/auth/create-node-core**
  ```javascript
  Input: { user_data, email, phone, name, openai_key, has_openai }
  Output: { success, node_core_id, nid_hash }
  Logic:
    1. Create/update user record
    2. Generate nid_hash
    3. Create system prompt
    4. IF has_openai:
       - Call OpenAI GPT-4
       - Get node context
    5. Create node_core record
    6. Link user to node_core
    7. Create initial event
    8. Return node_core_id
  ```

### 2.3 Middleware

- [ ] **Auth Middleware**
  ```javascript
  // Verify JWT token
  // Extract user_id and nid_hash
  // Check permissions
  // Attach to request
  ```

- [ ] **Rate Limiting**
  ```javascript
  // Login attempts: 5 per 15 minutes
  // API calls: 100 per minute
  // OpenAI calls: 10 per minute
  ```

- [ ] **Session Management**
  ```javascript
  // Create session on login
  // Verify session on request
  // Timeout after 30 minutes
  // Logout clears session
  ```

---

## PHASE 3: UI Initialization

### 3.1 UI Init Endpoint

- [ ] **POST /api/ui/initialize**
  ```javascript
  Input: { user_id, node_core_id, business_id }
  Output: { success, initialized, fields_added, errors }
  Logic:
    1. For each UI table:
       a. Check table structure
       b. Get required fields
       c. Add missing fields (ALTER TABLE)
       d. Load default records
       e. Insert into table
    2. Return results
  ```

### 3.2 Field Initialization

- [ ] Create FieldInitializer utility
  ```javascript
  class FieldInitializer {
    static async initializeTable(tableName, business_id)
    static async addFieldIfMissing(tableName, fieldName, fieldType)
    static mapFieldType(pgType)
  }
  ```

- [ ] Define field maps for each table:
  - [ ] ui_templates fields
  - [ ] dashboard_layouts fields
  - [ ] dashboard_widgets fields
  - [ ] dashboard_kpis fields
  - [ ] ui_themes fields
  - [ ] ui_components fields
  - [ ] permission_groups fields
  - [ ] user_preferences fields

### 3.3 Default Data Loading

- [ ] Create default records tables (or seed data):
  - [ ] ui_templates_defaults
  - [ ] dashboard_layouts_defaults
  - [ ] dashboard_widgets_defaults
  - [ ] dashboard_kpis_defaults
  - [ ] ui_themes_defaults
  - [ ] ui_components_defaults
  - [ ] permission_groups_defaults
  - [ ] user_preferences_defaults

- [ ] Or implement seed functions:
  ```javascript
  async function seedUIDefaults(business_id) {
    // Insert default records for all tables
  }
  ```

---

## PHASE 4: Node Core Sync

### 4.1 Sync Endpoint

- [ ] **POST /api/node/:nodeId/sync-ui**
  ```javascript
  Input: { ui_config, user_id, business_id }
  Output: { success, ui_items_count }
  Logic:
    1. Collect all UI data:
       - templates
       - dashboards
       - widgets
       - kpis
       - themes
       - components
       - permissions
       - preferences
    2. Build full ui_config object
    3. Update node_core.ui_config
    4. Set is_initialized = true
    5. Create sync event
    6. Return success
  ```

### 4.2 Helper Functions

- [ ] getTemplateData()
- [ ] getDashboardData()
- [ ] getWidgetData()
- [ ] getKPIData()
- [ ] getThemeData()
- [ ] getComponentData()
- [ ] getPermissionData()
- [ ] getUserPreferences()

### 4.3 State Saving

- [ ] **POST /api/node/:nodeId/save-state**
  ```javascript
  Input: { state }
  Output: { success }
  Logic:
    1. Update node_core with state
    2. Set last_opened timestamp
    3. Return success
  ```

---

## PHASE 5: App Load

### 5.1 Load Endpoint

- [ ] **GET /api/node/core/:nidHash**
  ```javascript
  Output: { data: node_core }
  Logic:
    1. Verify JWT token
    2. Get node_core by nidHash
    3. Check RLS (user can only access own node)
    4. Return complete node_core object
  ```

### 5.2 Field Validation

- [ ] **POST /api/ui/validate-fields**
  ```javascript
  Input: { node_id, business_id, ui_config }
  Output: { missing, added }
  Logic:
    1. Compare node ui_config with current DB state
    2. Identify missing fields
    3. Add missing fields if needed
    4. Return what was added
  ```

### 5.3 Dashboard Load

- [ ] **POST /api/dashboard/load**
  ```javascript
  Input: { node_id, business_id, ui_config }
  Output: { dashboard, widgets, kpis }
  Logic:
    1. Get dashboard layout
    2. Load all widgets
    3. Load all KPIs
    4. Compile data
    5. Return complete dashboard
  ```

---

## PHASE 6: OpenAI Integration

### 6.1 OpenAI Setup

- [ ] Install OpenAI package
  ```bash
  npm install openai
  ```

- [ ] Create OpenAI client wrapper
  ```javascript
  class OpenAIClient {
    constructor(apiKey)
    async chat(messages, systemPrompt)
    async embedText(text)
    async createSignupGuidance(email, phone)
    async initializeNodeContext(userData)
  }
  ```

### 6.2 Signup Guidance Endpoint

- [ ] **POST /api/ai/signup-guidance**
  ```javascript
  Input: { email, phone, openai_key }
  Output: { suggestions, guidelines }
  Logic:
    1. If !openai_key: return empty
    2. Call OpenAI with system prompt
    3. Get guidance on password, security, info
    4. Parse response into guidelines
    5. Return to frontend
  ```

### 6.3 Node Context Initialization

- [ ] **POST /api/ai/init-node-context**
  ```javascript
  Input: { system_prompt, user_info, openai_key }
  Output: { ai_context, initial_instructions }
  Logic:
    1. Build system prompt with user data
    2. Call OpenAI GPT-4
    3. Get personalized context
    4. Extract instructions
    5. Return for node_core storage
  ```

### 6.4 Error Handling

- [ ] Handle OpenAI API failures
  - [ ] If API down: Fallback to basic mode
  - [ ] If rate limited: Queue for retry
  - [ ] If invalid key: Warn user
  - [ ] Log all errors

### 6.5 System Prompts

- [ ] Create system prompt templates:
  - [ ] Standard user node prompt
  - [ ] Business owner prompt
  - [ ] Manager prompt
  - [ ] AI assistant prompt
  - [ ] Template generator prompt

---

## PHASE 7: Frontend Implementation

### 7.1 Login Components

- [ ] **AuthLogin.js**
  - [ ] Email/Phone input
  - [ ] Password input
  - [ ] Login button
  - [ ] Remember me checkbox
  - [ ] Forgot password link

- [ ] **AuthBiometric.js**
  - [ ] Face scan UI
  - [ ] Fingerprint UI
  - [ ] Scan progress bar
  - [ ] Success/Error messages
  - [ ] Fallback to password

### 7.2 Signup Components

- [ ] **SignupStep1.js** - Email/Phone
- [ ] **SignupStep2.js** - Personal Info
  - [ ] With AI suggestions if OpenAI available
- [ ] **SignupStep3_Biometric.js** - Biometric Registration
- [ ] **SignupStep4_NodeCreation.js** - Core Node Creation
- [ ] **SignupStep5_UIInitialization.js** - UI Setup

### 7.3 App Component

- [ ] **App.js**
  - [ ] Check auth token
  - [ ] Load node_core
  - [ ] Load ui_config
  - [ ] Save state
  - [ ] Validate fields
  - [ ] Render dashboard

### 7.4 Utilities

- [ ] **authService.js**
  - [ ] Login functions
  - [ ] Signup functions
  - [ ] Token management
  - [ ] Session management

- [ ] **nodeService.js**
  - [ ] Get node_core
  - [ ] Sync UI
  - [ ] Save state
  - [ ] Get ui_config

---

## PHASE 8: Testing

### 8.1 Database Tests

- [ ] Verify all tables exist
- [ ] Verify all fields added
- [ ] Test RLS policies
- [ ] Test default data loading
- [ ] Test foreign key relationships

### 8.2 API Tests

- [ ] Test /api/auth/check-exists
  - [ ] Existing user
  - [ ] New user
  - [ ] Invalid email/phone

- [ ] Test /api/auth/login
  - [ ] Correct password
  - [ ] Wrong password
  - [ ] User not found
  - [ ] Rate limiting

- [ ] Test /api/auth/biometric-login
  - [ ] Valid biometric
  - [ ] Invalid biometric
  - [ ] No biometric match

- [ ] Test signup flow
  - [ ] All steps complete
  - [ ] With OpenAI
  - [ ] Without OpenAI
  - [ ] Biometric optional

- [ ] Test /api/ui/initialize
  - [ ] Fields added
  - [ ] Defaults loaded
  - [ ] All tables initialized

- [ ] Test /api/node/:id/sync-ui
  - [ ] UI config saved
  - [ ] Node marked initialized
  - [ ] Event logged

### 8.3 OpenAI Tests

- [ ] Test API key validation
- [ ] Test signup guidance
- [ ] Test node context generation
- [ ] Test error handling
- [ ] Test fallback mode

### 8.4 Frontend Tests

- [ ] Test login flow
- [ ] Test signup flow
- [ ] Test biometric (mock)
- [ ] Test app load
- [ ] Test error handling
- [ ] Test token refresh

### 8.5 End-to-End Tests

- [ ] Complete signup flow (new user)
- [ ] Complete login flow (existing user)
- [ ] Node core creation
- [ ] UI initialization
- [ ] App load from node_core
- [ ] With OpenAI enabled
- [ ] Without OpenAI

---

## PHASE 9: Deployment

### 9.1 Environment Setup

- [ ] Set OPENAI_API_KEY environment variable
- [ ] Configure database connection
- [ ] Set JWT secret
- [ ] Configure CORS for frontend
- [ ] Enable rate limiting in production

### 9.2 Database Migration

- [ ] Create migration files
- [ ] Test migrations in dev
- [ ] Backup production database
- [ ] Run migrations in production
- [ ] Verify schema changes

### 9.3 Documentation

- [ ] Update README with new endpoints
- [ ] Document system prompt templates
- [ ] Document UI field initialization
- [ ] Document OpenAI integration points
- [ ] Create troubleshooting guide

### 9.4 Monitoring

- [ ] Set up error logging
- [ ] Monitor OpenAI API usage
- [ ] Monitor database performance
- [ ] Set up alerts
- [ ] Create dashboard for monitoring

---

## PHASE 10: Production Readiness

### 10.1 Security

- [ ] [ ] Password hashing (bcrypt, 10 rounds)
- [ ] [ ] JWT token signing
- [ ] [ ] Biometric data encryption (AES-256)
- [ ] [ ] OpenAI key encryption in database
- [ ] [ ] RLS policies enforced
- [ ] [ ] CORS properly configured
- [ ] [ ] Rate limiting enabled
- [ ] [ ] SQL injection prevention (parameterized queries)

### 10.2 Performance

- [ ] [ ] Caching layer for ui_config
- [ ] [ ] Query optimization (indexes on nid_hash, user_id)
- [ ] [ ] Connection pooling
- [ ] [ ] CDN for static assets
- [ ] [ ] Load testing passed

### 10.3 Reliability

- [ ] [ ] Error handling in all endpoints
- [ ] [ ] Fallback for OpenAI failures
- [ ] [ ] Graceful degradation
- [ ] [ ] Database backups
- [ ] [ ] Disaster recovery plan

### 10.4 Compliance

- [ ] [ ] GDPR compliance (data deletion)
- [ ] [ ] Privacy policy updated
- [ ] [ ] Terms of service updated
- [ ] [ ] Biometric consent collected
- [ ] [ ] Data retention policy implemented

---

## Summary of New Files to Create/Modify

### New Files
- [ ] semantic_cache table migration
- [ ] embeddings table migration
- [ ] chat_history table migration
- [ ] ai_context_cache table migration
- [ ] routes-auth.js (authentication endpoints)
- [ ] routes-ui-init.js (UI initialization)
- [ ] routes-node-sync.js (Node core sync)
- [ ] routes-ai.js (OpenAI integration)
- [ ] utils/field-initializer.js
- [ ] utils/openai-client.js
- [ ] utils/biometric-utils.js
- [ ] frontend/components/AuthLogin.js
- [ ] frontend/components/SignupFlow.js
- [ ] frontend/services/authService.js
- [ ] frontend/services/nodeService.js

### Modified Files
- [ ] server.js (register new routes)
- [ ] kernel-engine.js (add node validation)
- [ ] routes-kernel.js (add node endpoints)
- [ ] App.js (load from node_core)
- [ ] package.json (add dependencies)
- [ ] .env.example (add OpenAI key)

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Database Setup | 1 day | ⏳ |
| 2. Auth Backend | 2 days | ⏳ |
| 3. UI Initialization | 1 day | ⏳ |
| 4. Node Sync | 1 day | ⏳ |
| 5. App Load | 1 day | ⏳ |
| 6. OpenAI Integration | 1 day | ⏳ |
| 7. Frontend | 2 days | ⏳ |
| 8. Testing | 2 days | ⏳ |
| 9. Deployment | 1 day | ⏳ |
| 10. Production Ready | 1 day | ⏳ |
| **Total** | **13 days** | ⏳ |

---

**Next Step**: Start with PHASE 1 (Database Schema Setup)

