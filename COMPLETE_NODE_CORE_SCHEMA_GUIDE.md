# Complete Node Core Schema & Hash Flow Guide

## 📊 Overview: The Neural Operating System

The entire system is built on **3 core tables** with a node-based architecture where everything is a node:

```
┌─────────────────────────────────────────────────────────────────┐
│           🧠 NEURAL OPERATING SYSTEM (Three Core Tables)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. node_core                → Every entity = a node            │
│  2. node_relationships       → How nodes connect                │
│  3. node_vector_memory       → Semantic embeddings             │
│                                                                 │
│  NO SEPARATE TABLES FOR:                                       │
│  ❌ user_profiles  ❌ permissions  ❌ layouts                  │
│  ❌ memory/AI context  ❌ relationships                        │
│                                                                 │
│  EVERYTHING IS A NODE!                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Table 1: NODE_CORE (The Main Table)

### Complete Field Structure

```sql
CREATE TABLE node_core (
  -- ============ PRIMARY IDENTITY ============
  row_id                BIGINT PRIMARY KEY,        -- Row sequence ID
  
  -- ============ OWNER & HASH IDENTITY ============
  owner_id              UUID NOT NULL,             -- Who owns this node
  nid_hash              TEXT NOT NULL,             -- SHA256(owner_id) - Unique identifier
  parent_nid_hash       TEXT,                      -- Parent node reference (hierarchy)
  
  -- ============ BYTEA BLOB STORAGE (Data Blobs) ============
  dna_blob              BYTEA NOT NULL,            -- Structure/DNA of node (serialized object)
  field_map             BYTEA NOT NULL,            -- All metadata fields (profile data lives here!)
  perm_blob             BYTEA NOT NULL,            -- Permissions & access rights
  rule_blob             BYTEA NOT NULL,            -- Business rules
  runtime_blob          BYTEA NOT NULL,            -- Runtime state
  memory_blob           BYTEA NOT NULL,            -- AI/semantic memory
  ui_blob               BYTEA NOT NULL,            -- UI schema & layout
  sys_blob              BYTEA NOT NULL,            -- System metadata
  
  -- ============ VECTOR EMBEDDING ============
  vec_embedding         VECTOR(1536),              -- pgvector - semantic search
  
  -- ============ NODE CLASSIFICATION ============
  node_type             node_type_enum,            -- 'living', 'brand', 'user', 'post', etc.
  node_state            TEXT DEFAULT 'ACTIVE',     -- ACTIVE, ARCHIVED, DELETED, INACTIVE
  state_hash            TEXT NOT NULL,             -- Hash of current state
  
  -- ============ ACCESS CONTROL (Derived from Relationships) ============
  privacy_mode          privacy_mode_enum,         -- CORE_ONLY, LIMITED, SHARED
  permission_scope      permission_scope_enum,     -- READ, WRITE, ADMIN
  visibility            VARCHAR(20),               -- private, family, public
  
  -- ============ KARMA & REPUTATION ============
  karma_score           INTEGER DEFAULT 0,         -- Behavior score
  trust_score           INTEGER DEFAULT 50,        -- Trustworthiness (1-100)
  reputation_level      TEXT DEFAULT 'NEW',        -- NEW, TRUSTED, VERIFIED, EXPERT
  health_score          INTEGER DEFAULT 100,       -- Node health (1-100)
  
  -- ============ EXECUTION & STATE ============
  can_execute           BOOLEAN DEFAULT TRUE,      -- Can perform actions
  can_update            BOOLEAN DEFAULT TRUE,      -- Can be modified
  external_access       BOOLEAN DEFAULT TRUE,      -- Can be accessed externally
  
  -- ============ LIFECYCLE MANAGEMENT ============
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  is_archived           BOOLEAN DEFAULT FALSE,
  archived_at           TIMESTAMP,
  valid_until           TIMESTAMP,                 -- Expiry date
  
  -- ============ COLD STORAGE & WAKE ============
  is_cold               BOOLEAN DEFAULT FALSE,     -- In cold storage?
  sleep_after           TIMESTAMP,                 -- When to sleep
  wakeup_at             TIMESTAMP,                 -- When to wake
  last_check            TIMESTAMP,                 -- Last activity check
  
  -- ============ DEVICE & SECURITY ============
  device_fingerprint    TEXT,                      -- Device identifier
  pin_hash              TEXT,                      -- Hashed PIN
  pin_expiry            TIMESTAMP,                 -- PIN expiry
  qr_token_hash         TEXT,                      -- QR code hash
  qr_expiry             TIMESTAMP,                 -- QR expiry
  recovery_qr_hash      TEXT,                      -- Recovery code
  recovery_expiry       TIMESTAMP,                 -- Recovery expiry
  
  -- ============ AUTHENTICATION & ACTIVATION ============
  is_activated          BOOLEAN DEFAULT FALSE,     -- User verified?
  wallet_id             UUID,                      -- Payment wallet
  
  -- ============ SYSTEM PROMPT (for AI) ============
  node_system_prompt    TEXT,                      -- System instruction for this node's AI
  prompt_version        INTEGER DEFAULT 1,         -- Prompt version tracking
  prompt_last_update    TIMESTAMP,                 -- Last prompt update
  
  -- ============ SYNC & VERSIONING ============
  sync_version          INTEGER DEFAULT 1,         -- Multi-device sync version
  last_sync_at          TIMESTAMP,                 -- Last sync timestamp
  hot_cache             BOOLEAN DEFAULT FALSE,     -- In memory cache?
  
  -- ============ LOCATION & GEOLOCATION ============
  latitude              FLOAT,
  longitude             FLOAT,
  
  -- ============ ENCRYPTION ============
  encryption_key_ref    UUID,                      -- Reference to encryption key
  
  -- ============ TASK & TRANSACTION STATUS ============
  task_status           task_status_enum,          -- PENDING, RUNNING, COMPLETED, FAILED
  status                tx_status_enum,            -- PENDING, COMMITTED, ROLLED_BACK
  
  -- ============ EXPERIENCE & EXPOSURE ============
  experience_level      INTEGER DEFAULT 0,         -- User skill level (0-100)
  exposure_mode         TEXT DEFAULT 'PRIVATE',    -- PRIVATE, LIMITED, PUBLIC
  
  -- ============ CONSTRAINTS ============
  UNIQUE(nid_hash),
  CHECK (owner_id IS NOT NULL)
);
```

---

## 🔗 Table 2: NODE_RELATIONSHIPS (The Graph)

### How Nodes Connect

```sql
CREATE TABLE node_relationships (
  relationship_id     UUID PRIMARY KEY,
  
  parent_node         UUID REFERENCES node_core(node_id),
  child_node          UUID REFERENCES node_core(node_id),
  
  -- Semantics of the connection
  relation_type       VARCHAR(50), -- 'member_of', 'enrolled_in', 'owns', 
                                  -- 'invited', 'follows', 'creates', 'contributes'
  
  metadata            JSONB,       -- status, role, permissions, since_date
  
  created_at          TIMESTAMP,
  updated_at          TIMESTAMP,
  
  UNIQUE(parent_node, child_node, relation_type)
);
```

### Example Relationships for User Profile:

```
User Node                 User Profile Node
    ↓                          ↓
    └──relation_type: "owns"──→ [node_core with field_map containing profile]

User Node                 Layout Node  
    ↓                          ↓
    └──relation_type: "uses"──→ [UI schema node]

User Node                 Permission Node
    ↓                          ↓
    └─relation_type: "has"───→ [permissions & access rights]
```

---

## 🧬 Table 3: NODE_VECTOR_MEMORY (Semantic Search)

```sql
CREATE TABLE node_vector_memory (
  vector_id       UUID PRIMARY KEY,
  
  node_id         UUID REFERENCES node_core(node_id),
  
  -- Content & Context
  content         TEXT,                -- Profile text, description, etc.
  content_type    VARCHAR(50),         -- 'profile', 'post', 'course_material'
  
  -- Hierarchical Tagging
  heading         VARCHAR(255),        -- Section heading
  sub_heading     VARCHAR(255),        -- Subsection
  section         VARCHAR(100),        -- Category
  
  -- Semantic Embedding
  embedding       vector(1536),        -- OpenAI embeddings for AI search
  
  metadata        JSONB,               -- Language, author, source
  similarity_score FLOAT,               -- Search relevance
  
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
);
```

---

## 📦 BYTEA BLOB ENCODING - Data Storage Strategy

### The Blob System (Why Bytea?)

All complex data is stored as **serialized bytea blobs** instead of separate JSON columns:

```
╔═══════════════════════════════════════════════════════════════════╗
║  WHY BYTEA BLOBS?                                                 ║
├───────────────────────────────────────────────────────────────────┤
║  1. Flexible Schema: Can store any structure without migrations  ║
║  2. Compression: Binary format saves space vs JSONB              ║
║  3. Versioning: Old & new data formats coexist                   ║
║  4. Performance: Faster for large objects than JSONB             ║
║  5. Encryption: Can encrypt entire blob for privacy              ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Blob Descriptions

| Blob | Contains | Size | Access Pattern |
|------|----------|------|-----------------|
| **field_map** | All metadata fields (profile data!) | ~5-50 KB | DESERIALIZE on read, UPDATE on modify |
| **dna_blob** | Node structure/DNA | ~1-10 KB | Rarely accessed, structural info |
| **perm_blob** | Permissions matrix | ~1-5 KB | Used on every access check |
| **rule_blob** | Business rules | ~2-20 KB | Evaluated on operations |
| **runtime_blob** | Current execution state | ~1-10 KB | Read/update frequently |
| **memory_blob** | AI context & memory | ~10-100 KB | Used for LLM context |
| **ui_blob** | UI schema/layout | ~2-20 KB | Sent to frontend |
| **sys_blob** | System metadata | ~1-5 KB | Used for logging, audit |

---

## 🔐 HASH FLOW - Identity & Hierarchy

### The Hashing System

```
╔════════════════════════════════════════════════════════════════╗
║                      HASH IDENTITY CHAIN                      ║
├────────────────────────────────────────────────────────────────┤
║                                                                ║
║  1️⃣  USER SIGNUP                                              ║
║      ↓                                                         ║
║      userId (UUID) → [SHA256] → nid_hash (64 chars)           ║
║                      ↓                                        ║
║                   Stored in node_core.nid_hash                ║
║                   UNIQUE CONSTRAINT on nid_hash              ║
║                                                                ║
║  2️⃣  HIERARCHY - PARENT_NID_HASH                              ║
║      ↓                                                         ║
║      Parent Node nid_hash → Stored in child.parent_nid_hash   ║
║                                                                ║
║      Example:                                                 ║
║      - User Node: nid_hash = "abc123..."                      ║
║      - Profile Node: parent_nid_hash = "abc123..."            ║
║      - Layout Node: parent_nid_hash = "abc123..."             ║
║                                                                ║
║  3️⃣  STATE HASH - INTEGRITY CHECK                             ║
║      ↓                                                         ║
║      state_hash = SHA256(node_state + updated_at)             ║
║      Used to verify node hasn't been tampered with            ║
║                                                                ║
║  4️⃣  VERIFICATION CHAIN                                       ║
║      ↓                                                         ║
║      nid_hash + parent_nid_hash + state_hash                  ║
║      = Complete identity chain (no centralized ACL)           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Hash Calculation

```javascript
// Calculate nid_hash on user creation
const crypto = require('crypto');
const nid_hash = crypto
  .createHash('sha256')
  .update(userId)
  .digest('hex');
// Example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

// Store in node_core:
// INSERT INTO node_core (owner_id, nid_hash, field_map, ...)
// VALUES (userId, nid_hash, serialized_profile_data, ...)
```

---

## 📋 REAL EXAMPLE: User Profile Storage & Retrieval

### 1. USER SIGNUP CREATES NODES

```javascript
// Step 1: Create Main User Node
const userData = {
  owner_id: userId,                    // "550e8400-e29b-41d4-a716-446655440000"
  nid_hash: SHA256(userId),             // "e3b0c442..."
  node_type: 'living',
  node_state: 'ACTIVE',
  
  // Profile data stored in field_map BYTEA
  field_map: serialize({
    full_name: "John Doe",
    email: "john@example.com",
    phone: "+1-234-567-8900",
    bio: "Family genealogy enthusiast",
    avatar_url: "https://...",
    preferences: { theme: 'dark', ... },
    social_links: { twitter: "@johndoe", ... }
  }),
  
  // Permissions stored in perm_blob
  perm_blob: serialize({
    can_create_posts: true,
    can_invite_friends: true,
    can_manage_profile: true,
    role: 'basic_user'
  }),
  
  // UI layout stored in ui_blob
  ui_blob: serialize({
    brand: 'vanshawali',
    layout_type: 'genealogy_dashboard',
    widgets: [
      { type: 'family_tree', position: 0 },
      { type: 'lineage_summary', position: 1 }
    ]
  }),
  
  created_at: NOW(),
  updated_at: NOW()
};

// Step 2: INSERT into node_core
await supabase
  .from('node_core')
  .insert(userData)
  .select()
  .single();

// Returns:
{
  row_id: 12345,
  owner_id: "550e8400...",
  nid_hash: "e3b0c442...",
  node_type: 'living',
  field_map: <bytea>,  // Binary encoded profile
  // ... all other fields
}
```

### 2. PROFILE DATA RETRIEVAL

```javascript
// Fetch user's profile from node_core
const { data: userNode } = await supabase
  .from('node_core')
  .select('*')
  .eq('nid_hash', userNidHash)
  .single();

// Deserialize profile from field_map
const profile = deserialize(userNode.field_map);
// Returns: { full_name, email, phone, bio, ... }

// Get all nodes for user (profile, layout, permissions)
const { data: userNodes } = await supabase
  .from('node_core')
  .select('*')
  .eq('owner_id', userId);

// Results:
[
  { 
    node_type: 'living',
    nid_hash: "e3b0c442...",
    field_map: <profile data>,  // User profile
  },
  {
    node_type: 'layout',
    parent_nid_hash: "e3b0c442...",  // Parent = main user node
    ui_blob: <layout data>,
  },
  {
    node_type: 'permission_set',
    parent_nid_hash: "e3b0c442...",
    perm_blob: <permissions>,
  }
]
```

### 3. PROFILE UPDATE FLOW

```javascript
// Get current node
const { data: node } = await supabase
  .from('node_core')
  .select('*')
  .eq('nid_hash', nidHash)
  .single();

// Update profile in field_map
const updatedProfile = {
  ...deserialize(node.field_map),
  full_name: "John Updated",
  bio: "Updated bio text"
};

// Serialize and save back
const { data: updated } = await supabase
  .from('node_core')
  .update({
    field_map: serialize(updatedProfile),
    updated_at: NOW(),
    state_hash: SHA256(JSON.stringify(updatedProfile))
  })
  .eq('nid_hash', nidHash)
  .select()
  .single();
```

---

## 🔄 RELATIONSHIP-BASED ACCESS CONTROL

### How Permissions Work (No ASL Table!)

```
instead of:
┌────────────┐
│ ASL Table  │  ❌ Separate permission table
└────────────┘

We use relationships:
┌──────────────────┐     relation_type      ┌──────────────────┐
│   User Node      │ ─── "has_admin" ────→ │ Admin Role Node  │
│ nid_hash: abc123 │                       │ nid_hash: xyz789 │
└──────────────────┘                       └──────────────────┘
         ↓
       metadata: {
         role: 'admin',
         granted_at: timestamp,
         expires_at: timestamp
       }

┌──────────────────┐     relation_type      ┌──────────────────┐
│   User Node      │ ─── "member_of" ────→ │  Family Group    │
│ nid_hash: abc123 │                       │ nid_hash: fam456 │
└──────────────────┘                       └──────────────────┘
         ↓
       metadata: {
         status: 'active',
         role: 'family_member',
         can_see_genealogy: true
       }
```

### Checking User Permissions

```javascript
// Instead of: SELECT * FROM ASL WHERE user_id = ?

// We query: SELECT * FROM node_relationships 
//           WHERE parent_node = user_nid_hash 
//           AND relation_type IN ['has_read', 'has_admin']

const { data: permissions } = await supabase
  .from('node_relationships')
  .select('relation_type, metadata')
  .eq('parent_node', userNidHash);

// Returns all relationships showing what this user can access
// No hardcoded ACL - everything defined by relationships!
```

---

## 🌳 HIERARCHY EXAMPLE: Complete Family Tree

```
User Profile Node (MAIN)
│ nid_hash: "user_abc123..."
│ field_map: { full_name, email, profile_data }
│
├─── [relation_type: "owns"] ──→ Family Genealogy Node
│                               parent_nid_hash: "user_abc123..."
│                               field_map: { family_name, gotra, ancestors }
│
├─── [relation_type: "has_layout"] ──→ UI Schema Node
│                                       parent_nid_hash: "user_abc123..."
│                                       ui_blob: { widgets, theme }
│
├─── [relation_type: "has_permissions"] ──→ Permission Node
│                                           parent_nid_hash: "user_abc123..."
│                                           perm_blob: { role, access_level }
│
└─── [relation_type: "is_member"] ──→ Family Group Node
                                       field_map: { members: [...] }
                                       metadata: { status: "active" }
```

---

## 🔢 Data Size Examples

```
Single User Node in node_core:
├─ row_id: 8 bytes
├─ owner_id: 16 bytes (UUID)
├─ nid_hash: ~64 bytes (text)
├─ field_map (profile): ~10-20 KB
├─ perm_blob: ~1-2 KB
├─ ui_blob: ~5-10 KB
├─ dna_blob: ~2-5 KB
├─ Other bytea: ~5-10 KB
├─ vec_embedding (1536d): ~6 KB
└─ Metadata fields: ~1 KB
─────────────────────────────────
Total per node: ~35-50 KB
```

---

## 🔐 Key Concepts Summary

| Concept | Purpose | Example |
|---------|---------|---------|
| **nid_hash** | Unique node identifier (SHA256 of owner_id) | "e3b0c442..." |
| **parent_nid_hash** | Hierarchy - points to parent node | "e3b0c442..." (same as parent's nid_hash) |
| **state_hash** | Integrity verification | "a7f5c9e1..." |
| **field_map (bytea)** | **Profile data storage** (MAIN for user info!) | Serialized JSON of profile |
| **perm_blob (bytea)** | Access rights & roles | Serialized permissions object |
| **ui_blob (bytea)** | UI layout/schema | Serialized widget config |
| **node_relationships** | Connection between nodes | user → "owns" → profile |
| **relation_type** | Type of connection | "owns", "member_of", "invited", etc. |
| **metadata (JSONB in relationships)** | Relationship data | status, role, permissions |

---

## ✅ Profile Persistence Flow in Your App

```
┌─────────────────────────────────────────────────────────────────┐
│                  PROFILE PERSISTENCE FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Fills Onboarding Form in React                         │
│     ├─ POST /api/onboarding/user-profile/save                  │
│     │  with { fullName, email, phone, bio, ... }              │
│     │                                                           │
│  2. Backend (NodeFactory) Receives Data                         │
│     ├─ Serialize profile to JSON                               │
│     ├─ Encode JSON as BYTEA                                     │
│     ├─ Store in field_map column of node_core                  │
│     │  INSERT INTO node_core (owner_id, nid_hash,              │
│     │    field_map, ...) VALUES (userId, hash, ...)            │
│     │                                                           │
│  3. Database Stores (Persistent)                               │
│     ├─ node_core table with complete profile                   │
│     ├─ All relationships intact                                │
│     ├─ Row Level Security enforces privacy                     │
│     │                                                           │
│  4. Frontend Also Saves Locally (Cache)                         │
│     ├─ localStorage.setItem(`userProfile_${userId}`, JSON)     │
│     ├─ localStorage.setItem(`profileComplete_${userId}`, true) │
│     │                                                           │
│  5. User Refreshes or Reopens App                              │
│     ├─ Check localStorage first (fast!)                        │
│     ├─ If not found, GET /api/onboarding/user-profile/get      │
│     │  ├─ Query node_core WHERE nid_hash = ...                │
│     │  ├─ Decode field_map from BYTEA                          │
│     │  ├─ Return profile JSON                                  │
│     ├─ Onboarding modal NOT shown (profileComplete flag set)   │
│     │                                                           │
│  ✅ RESULT: Profile persists across sessions!                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 SQL Queries Reference

### Get User Profile
```sql
SELECT field_map FROM node_core 
WHERE owner_id = $1 
  AND node_type = 'living'
LIMIT 1;
```

### Check All User Nodes
```sql
SELECT nid_hash, node_type, field_map, parent_nid_hash
FROM node_core 
WHERE owner_id = $1
ORDER BY created_at DESC;
```

### Get User's Relationships
```sql
SELECT relation_type, metadata 
FROM node_relationships 
WHERE parent_node = $1;
```

### Search by Vector Similarity
```sql
SELECT node_id, content, similarity 
FROM node_vector_memory 
WHERE node_id IN (SELECT node_id FROM node_core WHERE owner_id = $1)
ORDER BY embedding <-> $2  -- Cosine distance
LIMIT 10;
```

### Update Profile
```sql
UPDATE node_core 
SET field_map = $1, 
    updated_at = NOW(),
    state_hash = $2
WHERE nid_hash = $3;
```

---

## 🎯 Your Setup in This System

**Profile Storage for User:**
- ✅ User Node created on signup (node_type = 'living')
- ✅ Profile data stored in **field_map** bytea blob
- ✅ Permissions stored in **perm_blob**
- ✅ UI Layout stored in **ui_blob**
- ✅ All accessible via **nid_hash** (no separate table)
- ✅ Relationships in **node_relationships** table
- ✅ Vector memory in **node_vector_memory** for AI

**Vanshawali (Genealogy):**
- ✅ Separate Family Tree nodes (node_type = 'genealogy')
- ✅ Child nodes for family members
- ✅ Relationships: "member_of", "ancestor_of", etc.
- ✅ Metadata stored in field_map of each family node

This is the complete picture! Everything flows through the node system with no separate tables needed. 🚀
