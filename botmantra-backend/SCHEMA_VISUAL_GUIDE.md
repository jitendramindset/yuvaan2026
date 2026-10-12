# Node Schema Architecture - Visual Guide

## Three Conflicting Node Systems

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION LAYER (auth-api.js)            │
│                                                                      │
│  POST /login → validates credentials                               │
│             → creates core_node row                                │
│             → populates metadata.nid_hash = SHA256(user_id)       │
│             → stores in vector_documents for RAG                  │
│                                                                    │
│   TABLE: core_node                                                │
│   ├─ id (PK)                                                      │
│   ├─ owner_id (UUID)                                              │
│   ├─ node_code (human-readable)                                   │
│   ├─ metadata.nid_hash (in JSONB!)  ⚠️ NOT INDEXED               │
│   ├─ status                                                       │
│   └─ created_at                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ❌ INCOMPATIBLE
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LEGACY NODE OPERATIONS                          │
│                                                                      │
│  nodeCore.js:     .from('nodes').insert({...})                      │
│  nodeFactory.js:  .from('nodes').insert({...})                      │
│                                                                      │
│   TABLE: nodes (Legacy)                                            │
│   ├─ node_id (PK, UUID)                                            │
│   ├─ owner_node (UUID) ⚠️ Called "owner_node" not "owner_id"       │
│   ├─ node_type (enum)                                              │
│   ├─ metadata (JSONB)                                              │
│   ├─ permissions (JSONB)                                           │
│   ├─ parent_node (nullable)                                        │
│   └─ status ('active', 'archived')                                │
│                                                                      │
│   ❌ NOT USED by kernel-executor!                                  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ❌ INCOMPATIBLE
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MODERN KERNEL (kernel-executor.js)               │
│                                                                      │
│  POST /api/kernel/v2/execute → Loads user node                      │
│                              → Queries node_core                    │
│                              → Checks memory_blob + vec_embedding   │
│                              → Executes 18-step pipeline            │
│                                                                      │
│   TABLE: node_core (Modern Kernel Schema)                           │
│   ├─ row_id (PK, SERIAL bigint) ✓ INDEXED                          │
│   ├─ owner_id (UUID)                                               │
│   ├─ nid_hash (text, SHA256) ✓ DIRECT COLUMN, UNIQUE               │
│   ├─ dna_blob (bytea) - binary serialized                          │
│   ├─ field_map (bytea) - replaces metadata                         │
│   ├─ perm_blob (bytea) - replaces permissions                      │
│   ├─ memory_blob (bytea) ✓ VECTOR MEMORY                           │
│   ├─ vec_embedding (pgvector) ✓ VECTOR EMBEDDING                   │
│   ├─ karma_score (integer)                                         │
│   ├─ trust_score (integer)                                         │
│   ├─ node_state ('ACTIVE', 'ARCHIVED')                            │
│   ├─ parent_nid_hash (text reference)                              │
│   └─ created_at, updated_at                                        │
│                                                                      │
│   ✓ BEST DESIGN (indexed, efficient, vector-native)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Field Name Inconsistencies

```
CONCEPT           | nodes              | core_node              | node_core
──────────────────┼────────────────────┼────────────────────────┼──────────────────
Owner Reference   | owner_node         | owner_id               | owner_id
                  | ❌ Different name   | ✓                      | ✓
──────────────────┼────────────────────┼────────────────────────┼──────────────────
Node ID           | node_id (UUID)     | id (UUID)              | nid_hash (TEXT)
                  | ❌ Different PK     | ❌ Different PK         | ✓ Optimized
──────────────────┼────────────────────┼────────────────────────┼──────────────────
Node Identifier   | No nid_hash        | metadata.nid_hash (JSONB) ⚠️ | nid_hash column ✓
                  | ❌                 | ❌ Not indexed         | ✓ Indexed
──────────────────┼────────────────────┼────────────────────────┼──────────────────
Parent Ref        | parent_node (UUID) | parent_node_id (UUID)  | parent_nid_hash
                  | ❌ By UUID         | ❌ By UUID             | ✓ By nid_hash
──────────────────┼────────────────────┼────────────────────────┼──────────────────
State Field       | status             | status                 | node_state
                  | ❌ Different name   | ❌ Different name       | ✓ Consistent
──────────────────┼────────────────────┼────────────────────────┼──────────────────
Metadata          | metadata (JSONB)   | metadata (JSONB)       | field_map (bytea)
                  | ❌ Slow queries    | ❌ Slow queries        | ✓ Binary efficient
──────────────────┼────────────────────┼────────────────────────┼──────────────────
Permissions       | permissions (JSONB)| node_permission table  | perm_blob (bytea)
                  | ❌ Outdated        | ✓                      | ✓ Binary efficient
──────────────────┼────────────────────┼────────────────────────┼──────────────────
Vector Data       | ❌ None            | vector_documents table | memory_blob + ✓
                  |                    | + vector_chunks        | vec_embedding ✓
```

---

## Execution Flow Problem

```
USER LOGIN
  │
  ├─ auth-api.js creates: core_node row
  │   └─ metadata.nid_hash = SHA256(user_id)
  │   └─ ⚠️ nid_hash NESTED in JSONB (not indexed!)
  │
  └─ Returns: token + node info
        │
        │ (user makes request with token)
        │
        ▼
KERNEL EXECUTE REQUEST (kernel-v2-api.js)
  │
  ├─ Decode JWT → extract userId
  │
  └─ Call kernel.execute(userId)
        │
        ▼
KERNEL EXECUTOR (kernel-executor.js)
  │
  ├─ STEP 2: Load User Node
  │   │
  │   └─ Query: SELECT * FROM node_core
  │       WHERE owner_id = userId    ← Uses modern schema ✓
  │
  ├─ STEP 2A: Check Vector
  │   │
  │   └─ Query: SELECT memory_blob, vec_embedding FROM node_core
  │       WHERE nid_hash = ?         ← Looks for nid_hash COLUMN
  │           ⚠️ BUT core_node only has metadata.nid_hash (nested!)
  │
  └─ ❌ MISMATCH!

THE PROBLEM:
  core_node stores: nid_hash in metadata.nid_hash (JSONB, not indexed)
  node_core expects: nid_hash as direct column (indexed)
  nodes table: doesn't have nid_hash at all!
```

---

## How Data Should Flow (Unified)

```
┌─────────────────────────────────────────────────────────────────┐
│ UNIFIED SCHEMA: ALL OPERATIONS USE node_core                   │
└─────────────────────────────────────────────────────────────────┘

Step 1: USER SIGNUP/LOGIN (auth-api.js should do this)
  │
  └─────────────────────────────────────────────────────┐
                                                        │
                                                        ▼
                                  .from('node_core').insert({
                                    owner_id: userId,
                                    nid_hash: SHA256(userId),
                                    memory_blob: encodeVector(...),
                                    node_state: 'ACTIVE'
                                  })
                                  ✓ Stores in node_core directly
                                  ✓ nid_hash indexed
                                  ✓ Vector ready

Step 2: NODE FACTORY OPERATIONS (nodeFactory.js)
  │
  └─────────────────────────────────────────────────────┐
                                                        │
                                                        ▼
                                  .from('node_core').insert({
                                    owner_id: ownerID,
                                    nid_hash: SHA256(ownerID),
                                    parent_nid_hash: parent,
                                    node_type: 'vector_memory',
                                    memory_blob: vectorData
                                  })
                                  ✓ Consistent schema
                                  ✓ All data in one place

Step 3: KERNEL EXECUTION (kernel-executor.js) ← ALREADY CORRECT
  │
  └─────────────────────────────────────────────────────┐
                                                        │
                                                        ▼
                                  const userNode = await this.db
                                    .from('node_core')
                                    .select('*')
                                    .eq('owner_id', userId)
                                    .single();
                                  
                                  const { memory_blob, vec_embedding }
                                    = await this.db
                                      .from('node_core')
                                      .select('memory_blob, vec_embedding')
                                      .eq('nid_hash', userNode.nid_hash)
                                  
                                  ✓ All queries consistent
                                  ✓ nid_hash available
                                  ✓ Vector data accessible
```

---

## MIGRATION CHECKLIST

To unify everything on `node_core`:

```
☐ nodeCore.js
  └─ Change: .from('nodes') → .from('node_core')
  └─ Change field names: owner_node → owner_id
  └─ Change: metadata JSONB → field_map bytea
  
☐ nodeFactory.js
  └─ Change: .from('nodes') → .from('node_core')
  └─ Change field names: owner_node → owner_id
  └─ Change: metadata JSONB → field_map bytea
  
☐ auth-api.js
  └─ Change: .from('core_node') → .from('node_core')
  └─ Store nid_hash as direct column (not in metadata)
  └─ Initialize memory_blob at signup
  
☐ Verify
  └─ kernel-executor.js already queries node_core ✓
  └─ kernel-v2-api.js already validates JWT ✓
  └─ All vector operations use node_core ✓
```

---

**Result:** One canonical schema, consistent queries, full vector support! 🎯
