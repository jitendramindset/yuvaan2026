# 🔐 Auth + OpenAI + Node Core Flow - Quick Reference

**Last Updated**: January 28, 2026  
**Status**: Complete System Flow Documented

---

## 🎯 5-Step Complete User Journey

### 1️⃣ LOGIN (User Exists)
```
Email/Phone Input 
  ↓
Check User Exists
  ↓ YES → Continue
  ↓ NO → Go to Signup
  ↓
Select Auth Method:
  • Password
  • Biometric (Face/Fingerprint)
  ↓
Validate Credentials
  ↓
Check if node_core exists
  ↓
Create Session Token
  ↓
Load Dashboard from node_core
```

### 2️⃣ SIGNUP FLOW (New User + AI)
```
Step 1: Email/Phone Collection
Step 2: Personal Info (Name, Password, DOB, Address)
  └─ IF OPENAI: Get AI guidance
Step 3: Biometric Registration (Face/Fingerprint)
Step 4: Create core_node
  └─ IF OPENAI: 
     - Generate system prompt
     - Create node context
     - Store in database
Step 5: Initialize UI (Next section)
```

### 3️⃣ CORE NODE CREATION
```
✅ Create user record in users table
✅ Generate nid_hash (node identity hash)
✅ Create system prompt
  └─ Template: "You are a Node Core for {name}..."
✅ IF OPENAI:
   ├─ Send system prompt to GPT-4
   ├─ Get personalized context
   └─ Store in node_core.node_context
✅ Create node_core record with:
   ├─ nid_hash
   ├─ system_prompt
   ├─ node_context (from AI if available)
   ├─ is_activated = true
   ├─ can_execute = true
   ├─ is_initialized = false (set to true after UI init)
   └─ reputation_level = 0
```

### 4️⃣ UI TABLE INITIALIZATION
```
FOR EACH UI TABLE:
  ├─ ui_templates
  ├─ dashboard_layouts
  ├─ dashboard_widgets
  ├─ dashboard_kpis
  ├─ ui_themes
  ├─ ui_components
  ├─ permission_groups
  └─ user_preferences
  
FOR EACH TABLE:
  ├─ ✅ Check existing fields
  ├─ ✅ Add missing fields:
  │  ├─ module (text)        - App section
  │  ├─ table (text)         - Source table
  │  ├─ fields (jsonb)       - Column mapping
  │  ├─ layout (text)        - grid/flex/stack
  │  ├─ widget (text)        - button/card/chart
  │  └─ config (jsonb)       - UI config
  ├─ ✅ Load default records
  └─ ✅ Insert into table
```

### 5️⃣ SAVE & SYNC TO NODE CORE
```
✅ Compile all UI data:
   ├─ templates: [...]
   ├─ dashboards: [...]
   ├─ widgets: [...]
   ├─ kpis: [...]
   ├─ themes: [...]
   ├─ permissions: [...]
   └─ metadata: {...}

✅ Update node_core.ui_config with all data

✅ Mark as initialized:
   ├─ is_initialized = true
   ├─ initialization_step = "complete"
   └─ last_synced = NOW()

✅ Create event:
   └─ node_event_queue: 'ui_sync_complete'
```

---

## 🔑 Authentication Methods

### Email/Phone + Password
```javascript
// 1. Check exists
POST /api/auth/check-exists
{ email, phone }

// 2. Login
POST /api/auth/login
{ email/phone, password, login_method: 'password' }

// 3. Validate credentials
// - Hash check
// - Rate limiting
// - Login logging

// 4. Create session
// - Generate JWT
// - Store in database
// - Set cookie
```

### Biometric (Face/Fingerprint)
```javascript
// 1. Scan biometric
// - Request permission
// - Capture face or fingerprint
// - Extract template

// 2. Match in database
POST /api/auth/biometric-login
{ biometric_type, biometric_template, confidence }

// 3. Compare similarity
// - Fuzzy matching (>95% threshold)
// - Multiple attempts support
// - Template verification

// 4. Login if matched
// - Create session
// - Return JWT
```

---

## 🤖 OpenAI Integration Points

### ✅ Point 1: Signup Step 2 (Info Collection)
```
User enters personal info
  ↓
IF openai_key available:
  ├─ Call GPT-4 with context
  ├─ Get guidance on:
  │  ├─ Password requirements
  │  ├─ Security best practices
  │  └─ Required information
  └─ Show AI suggestions to user
ELSE:
  └─ Show basic requirements
```

### ✅ Point 2: Node Core Creation
```
NEW SYSTEM PROMPT:
"You are a personal Node Core AI Assistant.
You are helping {name} manage their work.

User Profile:
- Name: {name}
- Email: {email}
- Business: {business}
- Role: {role}

Responsibilities:
1. Manage tasks
2. Provide insights
3. Help decisions
4. Maintain security
5. Ensure privacy"

CALL GPT-4:
POST /api/ai/init-node-context
{
  system_prompt: "...",
  user_info: {...}
}

RESPONSE:
{
  ai_context: "Personalized node context",
  initial_instructions: [...],
  capabilities: [...]
}

STORE:
node_core.node_context = {
  ai_initialized: true,
  ai_context: "...",
  system_prompt: "...",
  created_with_ai: true
}
```

### ✅ Point 3: AI Assistant Chat
```
User: "What's my dashboard status?"
  ↓
Frontend: Use system prompt from node_core
  ├─ Get: node_core.node_context
  ├─ Load: system_prompt
  ├─ Get: user_preferences
  └─ Format request
  ↓
Call OpenAI Chat API:
{
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'What is my dashboard status?' }
  ]
}
  ↓
GPT-4 Response:
"Based on your profile, here's your status..."
```

### ✅ Point 4: RAG (Retrieval Augmented Generation)
```
Query: "Show me Q1 sales data"
  ↓
Backend RAG Pipeline:
1. Embed query (OpenAI embeddings)
2. Search semantic_cache (vector similarity)
3. If miss → Query database
4. Get context: relevant data
5. Call GPT-4 with context + query
6. Cache result

System Prompt for RAG:
"You have context about this business's data.
Answer the user's question based on this context:
{context}"
```

### ✅ Point 5: Template Generation
```
User: "Create a sales dashboard"
  ↓
1. Extract intent: "create_dashboard"
2. Identify data: "sales"
3. Call GPT-4:
   "Create a dashboard template for {business_type}
    with widgets for: revenue, orders, customers"
  ↓
GPT-4 suggests:
- Layout: grid (3 cols, 4 rows)
- Widgets:
  - KPI Card: Total Revenue
  - Line Chart: Revenue Trend
  - Table: Recent Orders
  ↓
4. Create widgets
5. Save template
6. Load in dashboard
```

---

## 📊 UI Tables & Fields

### Standard UI Fields (Added to All UI Tables)

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| module | text | App section | "dashboard", "template", "form" |
| table | text | Source table | "sales", "products", "users" |
| fields | jsonb | Column mapping | `{"id": "product_id", "name": "product_name"}` |
| layout | text | Grid type | "grid", "flex", "stack" |
| widget | text | Component type | "card", "chart", "button", "input" |
| config | jsonb | UI config | `{"responsive": true, "color": "blue"}` |

### UI Tables to Initialize

```
┌─ ui_templates
│  ├─ purpose: Reusable UI templates
│  ├─ fields: module, table, fields, layout, widget, config
│  └─ defaults: 5-10 standard templates
│
├─ dashboard_layouts
│  ├─ purpose: Dashboard grid layouts
│  ├─ fields: module, table, fields, layout, widget, config
│  └─ defaults: light, dark, compact layouts
│
├─ dashboard_widgets
│  ├─ purpose: Individual dashboard widgets
│  ├─ fields: module, table, fields, layout, widget, config
│  └─ defaults: KPI, Chart, Table, Gauge widgets
│
├─ dashboard_kpis
│  ├─ purpose: KPI definitions and calculations
│  ├─ fields: module, table, fields, layout, widget, config
│  └─ defaults: Revenue, Orders, Users, Profit KPIs
│
├─ ui_themes
│  ├─ purpose: Color and styling themes
│  ├─ fields: module, table, fields, layout, widget, config
│  └─ defaults: Light, Dark, Professional, Creative themes
│
├─ ui_components
│  ├─ purpose: Reusable UI components library
│  ├─ fields: module, table, fields, layout, widget, config
│  └─ defaults: Button, Card, Input, Select, Modal
│
├─ permission_groups
│  ├─ purpose: Role-based access control
│  ├─ fields: module, table, fields, layout, widget, config
│  └─ defaults: Admin, Manager, User, Viewer roles
│
└─ user_preferences
   ├─ purpose: Per-user settings and preferences
   ├─ fields: module, table, fields, layout, widget, config
   └─ defaults: theme, language, timezone, layout_mode
```

---

## 💾 Node Core Structure

```json
{
  "id": "uuid",
  "nid_hash": "hash_of_user_id_and_email",
  "node_name": "User's Node",
  "user_id": "uuid",
  "business_id": "uuid",
  
  // System Prompt (Text)
  "system_prompt": "You are a Node Core...",
  
  // Node Context (JSON - From OpenAI)
  "node_context": {
    "ai_initialized": true,
    "ai_context": "Personalized context...",
    "ai_model": "gpt-4",
    "system_prompt": "...",
    "created_with_ai": true,
    "initial_instructions": [...]
  },
  
  // UI Configuration (JSON - Complete)
  "ui_config": {
    "templates": [{...}, {...}],
    "dashboards": [{...}, {...}],
    "widgets": [{...}, {...}],
    "kpis": [{...}, {...}],
    "themes": [{...}, {...}],
    "components": [{...}, {...}],
    "permissions": [{...}, {...}],
    "preferences": [{...}, {...}],
    "metadata": {
      "fields_initialized": true,
      "ui_version": "1.0",
      "schema_version": "2.0",
      "last_synced": "2026-01-28T...",
      "initialized_at": "2026-01-28T..."
    }
  },
  
  // Status Flags
  "is_activated": true,
  "can_execute": true,
  "is_initialized": true,
  "is_archived": false,
  "is_cold": false,
  
  // Reputation & Trust
  "reputation_level": 0,
  "trust_score": 50,
  "karma": 0,
  
  // Timestamps
  "created_at": "2026-01-28T...",
  "updated_at": "2026-01-28T...",
  "valid_until": null
}
```

---

## 🔄 Complete Request Flows

### LOGIN REQUEST
```
1. Frontend → POST /api/auth/check-exists
   { email, phone }
   
2. Backend: Query users table
   → User exists? YES → Continue : Go to Signup
   
3. Frontend → POST /api/auth/login
   { email/phone, password, login_method }
   
4. Backend: Validate password
   → Generate JWT
   → Return token + user + node_core_id
   
5. Frontend: Store token
   localStorage.setItem('authToken', token)
   
6. Frontend → GET /api/node/core/{nidHash}
   
7. Backend: Load node_core + ui_config
   
8. Frontend: Load UI from node_core
   
✅ App Ready
```

### SIGNUP FLOW (With OpenAI)
```
Step 1: POST /api/auth/check-exists
Step 2: POST /api/auth/signup-step1
        { email, phone }
        
Step 2B: POST /api/ai/signup-guidance (IF OPENAI)
         { email, openai_key }
         → Get suggestions
         
Step 3: POST /api/auth/signup-step2
        { personal_data }
        
Step 4: POST /api/biometric/register
        { biometric_type, biometric_data }
        
Step 5: POST /api/auth/create-node-core
        { user_data, openai_key }
        ├─ Create user record
        ├─ Generate nid_hash
        ├─ IF OPENAI: Call GPT-4 for context
        ├─ Create node_core record
        └─ Return node_core_id
        
Step 6: POST /api/ui/initialize
        { user_id, node_core_id, business_id }
        ├─ For each UI table:
        │  ├─ Add missing fields
        │  └─ Load defaults
        └─ Return success
        
Step 7: POST /api/node/{nodeId}/sync-ui
        { ui_config }
        ├─ Compile all UI data
        ├─ Update node_core
        └─ Create sync event
        
✅ User Ready
```

---

## 🛡️ Security Measures

### Password Authentication
- [ ] Hash with bcrypt (10 rounds)
- [ ] Validate strength (min 8 chars, uppercase, number, special)
- [ ] Rate limiting (5 attempts, 15 min lockout)
- [ ] Failed login logging
- [ ] Session timeout (30 min)

### Biometric Authentication
- [ ] Biometric template encrypted (AES-256)
- [ ] Confidence threshold >95%
- [ ] Fallback to password
- [ ] Biometric data NOT logged in audit trail
- [ ] FIPS 140-2 compliant storage

### OpenAI Integration
- [ ] API key stored encrypted in database
- [ ] Key validation on startup
- [ ] Rate limiting per user
- [ ] Request logging (without sensitive data)
- [ ] Fallback to basic mode if API fails

### Node Core
- [ ] RLS enabled on node_core table
- [ ] Users can only access their own nodes
- [ ] System prompt protected from user modification
- [ ] Execution permissions verified before action
- [ ] All operations logged in node_event_queue

---

## ⚠️ Missing Components to Implement

1. **semantic_cache table**
   - For vector similarity search caching
   - Fields: query_hash, embedding, result, ttl, created_at

2. **embeddings table**
   - For storing vector embeddings
   - Fields: text, embedding (vector), created_at, business_id

3. **chat_history table**
   - For conversation logging
   - Fields: user_id, role, message, timestamp, session_id

4. **ai_context_cache table**
   - For RAG context caching
   - Fields: query_hash, context, sources, ttl, created_at

5. **OpenAI Error Handling**
   - Fallback responses
   - Retry logic
   - Quota management

6. **System Prompt Templates**
   - Different templates for different node types
   - Business role-specific prompts
   - Multi-language support

7. **Field Validation Schema**
   - JSON schema for each table
   - Field type validation
   - Required field validation

---

## 🚀 Testing Checklist

### Login Flow
- [ ] Email + Password login
- [ ] Phone + Password login
- [ ] Face biometric login
- [ ] Fingerprint biometric login
- [ ] User not found → Signup redirect
- [ ] Wrong password → Error message
- [ ] Biometric not matched → Fallback to password

### Signup Flow
- [ ] Email/Phone validation
- [ ] Personal info collection
- [ ] Biometric registration (optional)
- [ ] Core node creation
- [ ] OpenAI integration (if available)
- [ ] UI initialization
- [ ] Node sync

### Node Core
- [ ] Node created with all fields
- [ ] System prompt stored
- [ ] UI config populated
- [ ] Node marked as initialized
- [ ] Event logged in queue

### UI Tables
- [ ] All 8 tables initialized
- [ ] Missing fields added
- [ ] Default records inserted
- [ ] All records have: module, table, fields, layout, widget, config
- [ ] RLS policies applied

### App Load
- [ ] Load from token
- [ ] Fetch node_core
- [ ] Load ui_config
- [ ] Save state
- [ ] Validate fields
- [ ] Render dashboard
- [ ] All components load

---

## 📞 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/auth/check-exists | POST | Check if user exists |
| /api/auth/login | POST | Login with password |
| /api/auth/biometric-login | POST | Login with biometric |
| /api/auth/signup-step1 | POST | Signup step 1 |
| /api/auth/create-node-core | POST | Create core node |
| /api/ai/signup-guidance | POST | Get AI signup tips |
| /api/biometric/register | POST | Register biometric |
| /api/ui/initialize | POST | Initialize UI tables |
| /api/node/:id/sync-ui | POST | Sync UI to node |
| /api/dashboard/load | POST | Load dashboard |
| /api/node/core/:nidHash | GET | Get node core |

