# Kernel Authentication & Execution Flow
**Complete Data Flow: auth-api → kernel-v2-api → kernel-executor**

---

## 1️⃣ AUTHENTICATION FLOW (auth-api.js)

### POST `/api/auth/login`
```javascript
// Request
{
  email: "user@example.com",
  password: "***"
}

// Response (on success)
{
  success: true,
  data: {
    token: "eyJhbGc...",  // JWT with userId
    user: {
      id: "uuid-of-user",
      email: "user@example.com",
      full_name: "John Doe"
    },
    node_core: {
      root_node_id: "core_node_id",
      node_code: "USR_abc123_timestamp",
      nid_hash: "sha256(user_id)"  // Key identifier
    }
  }
}
```

### What Happens at Login:
1. **Validate** email/password against `users` table
2. **Initialize NodeCore** (if new user):
   - Create root node (`core_node`) - type: `living`, category: `root`
   - Create profile child node - type: `living`, category: `child`
   - Create relationships: root → profile
   - Create permissions: owner full-access
   - Create default roles: owner, friend, viewer
   - Store profile in vector_documents (RAG vector DB)

3. **Return token** with node_core reference data (nid_hash, root_node_id, node_code)

### Key Data in Response:
- **token**: JWT signed by JWT_SECRET, contains `sub` (userId)
- **nid_hash**: SHA256(user_id) - unique node identifier used throughout kernel
- **root_node_id**: Reference to root core_node in database

---

## 2️⃣ KERNEL API VALIDATION (kernel-v2-api.js)

### POST `/api/kernel/v2/execute`
```javascript
// Request
{
  authorization: "Bearer eyJhbGc...",  // Same token from login
  action_type: "chat",  // or "data_read", "data_write", "admin", etc.
  payload: {
    message: "Hello",
    // ... action-specific data
  },
  device_id: "optional-device-uuid"
}
```

### Step 1: JWT Validation
```javascript
const authHeader = req.headers.authorization;
const token = authHeader.substring(7);
const jwtPayload = jwt.decode(token);
const userId = jwtPayload.sub || jwtPayload.userId || jwtPayload.id;
```

### Step 2: Load node_core Data
```javascript
const result = await kernel.execute({
  user_node_id: userId,    // From JWT payload.sub
  action_type,
  payload,
  device_id,
  session_token: req.headers.authorization
});
```

**Flow passes userId to KernelExecutor.execute()**

---

## 3️⃣ KERNEL EXECUTION (kernel-executor.js)

### Main Pipeline: 18 Steps

#### **STEP 1: VALIDATE SESSION** ✓
- Check userId is present
- If device_id provided, verify device trust

#### **STEP 2: LOAD USER NODE** ✓
```javascript
// Load from node_core by owner_id
const userNode = await this._loadUserNode(user_node_id);
// Returns: { nid_hash, owner_id, _fieldMap, _dna, ... }
```

#### **STEP 2A: CHECK VECTOR NODE** ✓
**Location**: node_core table - columns `memory_blob` (bytea) and `vec_embedding` (pgvector)

```javascript
const { data: nodeWithVector } = await this.db
  .from('node_core')
  .select('memory_blob, vec_embedding')
  .eq('nid_hash', userNode.nid_hash)
  .single();

// Check if data exists
if (nodeWithVector.memory_blob || nodeWithVector.vec_embedding) {
  vectorValid = true;  // Vector node exists
} else {
  // Need to create vector node
}
```

**Vector Node Structure in memory_blob (bytea):**
```json
{
  "memory_type": "user_context",
  "user_id": "uuid",
  "nid_hash": "sha256_hash",
  "created_at": "ISO-8601",
  "embeddings": [],
  "last_updated": "ISO-8601"
}
```

#### **STEP 2B: CREATE VECTOR NODE IF MISSING** ✓
```javascript
const vectorData = {
  memory_type: 'user_context',
  user_id: userNode.owner_id,
  nid_hash: userNode.nid_hash,
  created_at: new Date().toISOString(),
  embedding_status: 'pending'
};

// Encode to memory_blob (bytea)
const memoryBlob = encodeToBlob(vectorData);

// Update node_core
await this.db.from('node_core').update({
  memory_blob: memoryBlob,
  vec_embedding: null,  // Will be populated by vector-manager after embedding
  updated_at: new Date().toISOString()
}).eq('nid_hash', userNode.nid_hash);
```

**Result:** Vector node now stored in node_core.memory_blob and ready for embedding generation

#### **STEP 2C: ADMIN AI TOOLS INITIALIZATION** ✓
```javascript
const adminToolExecutor = new AdminToolExecutor(this.db);
const adminCheck = await adminToolExecutor._checkAdminPermission(userNode.owner_id);

if (adminCheck.allowed) {
  // Log to admin_node_audit for monitoring
  await this.db.from('admin_node_audit').insert({
    admin_id: userNode.owner_id,
    target_nid_hash: userNode.nid_hash,
    action: 'node_access_watch',
    metadata: {
      vector_node_valid: vectorValid,
      vector_check_passed: !!vectorNode
    }
  });
}
```

#### **STEP 3: IDENTIFY TARGET BRAND** (from nid_hash)
- Priority: payload.brand_scope > DNA brand > BOTMANTRA

#### **STEP 4: TRUST ASSESSMENT** (cached by nid_hash)
- Query trustEngine.getQuickTrust(nid_hash)
- Cache result in nodeCache

#### **STEP 5: RISK PREDICTION**
- Behavioral anomaly detection
- Block if risk score too high

#### **STEP 6: RESOLVE PERMISSION** (cached by nid_hash)
- permissionEngine.validatePermission(userNode, action_type)
- Deny if not allowed

#### **STEP 7: KARMA CHECK**
- karmaEngine.validate(userNode, action_type)
- Check karma_score from node_core

#### **STEP 8: DHARMA VALIDATION**
- dharmaValidator.validate(userNode, action_type)
- Ethical principle checks

#### **STEP 9: RATE LIMIT CHECK**
- rateLimiter.check(owner_id, action_type)
- Non-critical failure

#### **STEP 10: RESOLVE TARGET NODE**
- Load second node if needed (payload.target_nid_hash)

#### **STEP 11: EXECUTE ACTION**
- Call actionExecutors.execute(action_type, userNode, payload, context)
- Chat, data read/write, node creation, admin actions, etc.

#### **STEP 12: UPDATE VECTOR STATE**
- vectorManager.autoStore(nid_hash, action_type, payload_data)
- Stores in memory_blob and generates vec_embedding

#### **STEP 13: UPDATE KARMA + TRUST EVENTS**
- karmaEngine.updateKarma(userNode, action_type)
- trustEngine.applyTrustEvent()

#### **STEP 14: LOG EVENT**
- node_execution_log OR ai_execution_log
- Record execution trace + duration

#### **STEP 15: SYNC NEAREST NODES**
- nodeSync.syncNearestNodes() - gossip protocol
- Notify parent/children nodes of state change

#### **STEP 16: PROMPT EVOLUTION CHECK**
- If karma changed, update system_prompt
- promptEvolution.evolveNodePrompt()

#### **STEP 17: BUILD UI RESPONSE**
```javascript
{
  success: true,
  execution_id: "exec_...",
  action: "action_type",
  brand: "BOTMANTRA",
  result: { /* action result */ },
  karma: { score, delta, level },
  trust: { score, level },
  risk: { score, level, warnings },
  sync: { version, nodes_notified },
  meta: { duration_ms, steps_completed, dharma_warnings, rate_remaining }
}
```

#### **STEP 18: RETURN RESPONSE**
- Status 200 for success
- Status 40x or 50x for errors

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│   POST /login   │
│  (auth-api.js)  │
└────────┬────────┘
         │
         │ Returns: token + nid_hash
         │
         ▼
┌─────────────────────────────┐
│  POST /api/kernel/v2/execute │
│  (kernel-v2-api.js)          │
│  Authorization: Bearer token  │
└────────┬────────────────────┘
         │
         │ Extracts userId from token
         │
         ▼
┌──────────────────────────────────┐
│  kernel.execute(userid)          │
│  (kernel-executor.js)            │
│                                  │
│  STEP 1: Validate Session        │
│  STEP 2: Load User Node (node_core) │
│  STEP 2A: Check Vector (memory_blob) │
│  STEP 2B: Create if Missing      │
│  STEP 2C: Admin Tools Init       │
│  STEP 3-17: Other Checks         │
│  STEP 18: Return Response        │
└──────────────────────────────────┘
         │
         │ All checks based on:
         │ - nid_hash (user identifier)
         │ - node_core row (node data)
         │ - memory_blob (vector data)
         │ - vec_embedding (pgvector)
         │
         ▼
┌─────────────────────┐
│ Response to Client  │
│ (200 or 40x/50x)    │
└─────────────────────┘
```

---

## 🗄️ Database Schema (node_core)

```sql
CREATE TABLE node_core (
  row_id bigint PRIMARY KEY,
  owner_id uuid NOT NULL,           -- User UUID
  nid_hash text NOT NULL UNIQUE,    -- sha256(owner_id)
  dna_blob bytea,                   -- Node DNA
  field_map bytea,                  -- Node metadata
  perm_blob bytea,                  -- Permissions
  memory_blob bytea,                -- Vector memory ⭐
  vec_embedding vector,             -- PgVector embedding ⭐
  karma_score integer DEFAULT 0,
  trust_score integer DEFAULT 50,
  node_state text DEFAULT 'ACTIVE',
  created_at timestamp,
  updated_at timestamp,
  -- ... other fields
);
```

**Vector Node Columns:**
- `memory_blob` (bytea): Serialized vector memory data from Step 2B
- `vec_embedding` (pgvector): AI-generated embedding for similarity search

---

## 🔐 Key Identifiers

| Field | Source | Used In | Example |
|-------|--------|---------|---------|
| **user_id / owner_id** |users table| Token (jwt.sub) | `550e8400-e29b-41d4-a716-446655440000` |
| **nid_hash** | SHA256(owner_id) | kernel-executor (all checks) | `a1b2c3d4e5f6...` |
| **node_core row** | Inserted at signup | All state lookups | row_id pk |
| **root_node_id** | Created at signup | Parent reference | node_core.row_id |

---

## ✅ Vector Node Lifecycle

```
Login (auth-api)
  ↓
initializeNodeCore()
  ↓
1. Create root node (core_node)
2. Create vector_documents entry (RAG)
3. No memory_blob yet
  ↓
First Request (kernel-v2-api)
  ↓
KernelExecutor.execute()
  ↓
STEP 2A: Check memory_blob → Not found
STEP 2B: Create vector node → Encode vectorData to memory_blob
  ↓
STEP 12: Update Vector State
  ↓
vectorManager.autoStore()
  ↓
1. Encode action to memory_blob ✓
2. Generate embedding → vec_embedding ✓
3. Store in pgvector DB ✓
  ↓
All subsequent requests
  ↓
STEP 2A: memory_blob + vec_embedding present ✓
STEP 2B: Skipped (already valid)
```

---

## 🎯 Summary

**The complete flow ensures:**

1. ✅ **Authentication**: Token validated in kernel-v2-api
2. ✅ **User Loading**: Found by owner_id in node_core
3. ✅ **Vector Node Check**: memory_blob & vec_embedding verified
4. ✅ **Vector Creation**: Auto-created if missing with proper encoding
5. ✅ **Admin Auditing**: All access logged for admin monitoring
6. ✅ **Unified Execution**: 18-step pipeline with all checks based on nid_hash
7. ✅ **Vector Storage**: Persisted in node_core for RAG & similarity search

---

**Last Updated:** Feb 14, 2026  
**Version:** 1.0 (Complete vector node integration)
