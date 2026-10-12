# Node Schema Relationship Guide
## Understanding `node_core` vs `core_node` vs `nodes`

---

## 🔴 THE PROBLEM: THREE DIFFERENT TABLE SCHEMAS

Your codebase has **THREE conflicting node representations**:

### 1. **`nodes`** (Legacy - nodeCore.js & nodeFactory.js)
```javascript
// File: nodeCore.js, nodeFactory.js
.from('nodes')
  .insert({
    node_type: 'user',           // 'user', 'post', 'family_member', etc.
    owner_node: userId,          // UUID field name (NOT owner_id)
    parent_node: null,           // Parent reference
    visibility: 'private',       // Permission string
    metadata: { ... },           // JSONB flexible storage
    permissions: { ... },        // JSONB
    status: 'active',            // 'active', 'archived'
    created_at: timestamp,
    updated_at: timestamp
  })
```

**Fields:**
- `node_id` (PK) - UUID
- `owner_node` - UUID (note: not owner_id)
- `node_type` - Enum
- `metadata` - JSONB
- `permissions` - JSONB
- `parent_node` - UUID nullable
- `visibility` - String

---

### 2. **`core_node`** (Auth Service - auth-api.js)
```javascript
// File: auth-api.js
.from('core_node')
  .insert({
    node_code: 'USR_abc123_timestamp',  // Human-readable code
    node_type: 'living',                // 'living', 'nonliving'
    node_category: 'root',              // 'root', 'child'
    owner_id: userId,                   // UUID (different from 'nodes')
    parent_node_id: null,               // Parent reference
    name: 'User Name',
    description: 'description',
    status: 'active',
    is_default: true,
    metadata: {
      nid_hash: SHA256(owner_id),
      initialized_at: timestamp,
      node_version: 1
    }
  })
```

**Fields:**
- `id` (PK) - UUID or bigint (different from nodes)
- `owner_id` - UUID (matches nodes.owner_node)
- `node_code` - String
- `node_type` - Enum
- `node_category` - Enum
- `parent_node_id` - UUID nullable
- `metadata` - JSONB (includes nid_hash!)
- `is_default` - Boolean

---

### 3. **`node_core`** (Modern Kernel - kernel-executor.js)
```javascript
// File: kernel-executor.js
.from('node_core')
  .select('*')
  .eq('owner_id', userNode.owner_id)
  .eq('node_state', 'ACTIVE')
```

**Fields:**
- `row_id` (PK) - bigint SERIAL
- `owner_id` - UUID (matches core_node.owner_id)
- `nid_hash` - text UNIQUE (SHA256 stored as STRING, not in metadata!)
- `dna_blob` - bytea (serialized)
- `field_map` - bytea (replaces metadata JSONB)
- `perm_blob` - bytea (replaces permissions JSONB)
- `memory_blob` - bytea (VECTOR DATA!)
- `vec_embedding` - pgvector (VECTOR EMBEDDING!)
- `karma_score` - integer
- `trust_score` - integer
- `node_state` - text (not status!)
- `node_type` - enum
- `parent_nid_hash` - text
- `created_at`, `updated_at` - timestamp

---

## 📊 Field Mapping Table

| Concept | `nodes` | `core_node` | `node_core` |
|---------|---------|-----------|-----------|
| **Primary Key** | `node_id` (UUID) | `id` (UUID) | `row_id` (bigint) |
| **Owner Reference** | `owner_node` | `owner_id` | `owner_id` |
| **Node Identifier** | `node_id` | `node_code` + metadata.nid_hash | `nid_hash` (stored directly!) |
| **Parent Reference** | `parent_node` | `parent_node_id` | `parent_nid_hash` |
| **Node Type** | Flexible enum | Enum (living/nonliving) | Enum |
| **Metadata Storage** | `metadata` JSONB | `metadata` JSONB | `field_map` bytea |
| **Permissions** | `permissions` JSONB | via node_permission table | `perm_blob` bytea |
| **Vector Data** | ❌ None | In vector_documents table | `memory_blob` + `vec_embedding` |
| **State Field** | `status` | `status` | `node_state` |
| **Serialization** | JSONB (readable) | JSONB (readable) | Bytea (encoded) |

---

## 🔄 WHERE EACH IS USED

### **`nodes` (Legacy)**
```
✓ nodeCore.js      - Node initialization
✓ nodeFactory.js   - Node creation (live & non-live)
✗ kernel-executor.js - NOT used (uses node_core)
```

### **`core_node` (Auth Service)**
```
✓ auth-api.js      - User signup/login
✓ core-nodes.js    - Legacy node operations
✓ onboarding       - Account setup
✓ revenue-engine   - Billing queries
✗ kernel-executor.js - NOT used (uses node_core)
```

### **`node_core` (Modern Kernel)**
```
✓ kernel-executor.js - Main execution pipeline
✓ kernel-v2-api.js   - Modern API
✓ recommendation-engine.js - Recommendations
✓ brand-routing.js    - Brand selection
✓ node-related utilities - Vector operations
```

---

## 🔗 RELATIONSHIPS

### The Data Flow Problem:

```
Login (auth-api.js)
  ↓
Creates: core_node row + vector_documents entry
  ↓
Metadata.nid_hash = SHA256(user_id)
  ↓
  ❌ PROBLEM: nid_hash is stored in metadata, NOT in a dedicated column
  
↓↓↓

Kernel Execute (kernel-executor.js)
  ↓
Loads: node_core row (uses owner_id to find)
  ↓
Uses: nid_hash column directly from node_core
  ↓
✓ WORKS because node_core stores nid_hash directly
```

### The Bridge Problem:

**nodeCore.js creates nodes in `nodes` table**
```javascript
await supabase.from('nodes').insert({ ... })
```

**kernel-executor.js queries `node_core` table**
```javascript
await this.db.from('node_core').select('*').eq('owner_id', owner_id)
```

**These are TWO different tables!** ❌

---

## ✅ WHAT SHOULD HAPPEN (Unified Schema)

To make them compatible, you need to choose ONE canonical schema:

### **Option A: Use `node_core` Everywhere (RECOMMENDED)**
```
nodeCore.js   → Insert/Update node_core
nodeFactory.js → Insert/Update node_core
kernel-executor.js → Query node_core ✓ (already does)
auth-api.js → Create node_core for new users
```

**Change `nodeCore.js` line 63:**
```javascript
// Before
const { data: userNode } = await supabase.from('nodes').insert({...})

// After
const { data: userNode } = await supabase.from('node_core').insert({...})
```

**Change `nodeFactory.js` line 151:**
```javascript
// Before
const { data: userNode } = await supabase.from('nodes').insert({...})

// After
const { data: userNode } = await supabase.from('node_core').insert({...})
```

---

## 📌 CURRENT STATE (Why It Breaks)

1. **auth-api.js** creates `core_node` rows ✓
2. **nodeCore.js** creates `nodes` rows ✓
3. **nodeFactory.js** creates `nodes` rows ✓
4. **kernel-executor.js** queries `node_core` rows ✓

**Result:** Three different tables with overlapping data! 🎭

### When You Call kernel-executor:
```javascript
await kernel.execute({
  user_node_id: userId  // User from login
})

// Inside kernel-executor.js:
const userNodeDetails = await this._loadUserNode(user_node_id);
// .from('node_core')
// .select('*')
// .eq('owner_id', user_node_id)

// ✓ WORKS if node_core was populated at login
// ❌ FAILS if only core_node was populated
```

### When You Call nodeFactory:
```javascript
const result = await NodeFactory.createLiveNode(userId, 'vector_memory', {...})

// Inside nodeFactory.js:
const { data: userNode } = await supabase
  .from('nodes')  // ❌ WRONG TABLE (should be node_core)
  .insert(node)
  .select()
  .single();

// ❌ Creates in 'nodes' table
// ❌ kernel-executor won't find it (looks in 'node_core')
```

---

## 🎯 SUMMARY OF RELATIONSHIPS

| Layer | Table | Purpose | Fields | Issue |
|-------|-------|---------|--------|-------|
| **Auth** | `core_node` | User signup/login | owner_id, nid_hash (in metadata) | nid_hash not indexed |
| **Legacy Node Ops** | `nodes` | Old node creation | owner_node, metadata (JSONB) | Not used by kernel |
| **Modern Kernel** | `node_core` | Execution pipeline | owner_id, nid_hash (direct column), bytea blobs | Best design ✓ |

---

## 🔧 RECOMMENDATION

**Migrate everything to `node_core`:**

1. ✅ Keep kernel-executor using `node_core` (already correct)
2. ❌ Change nodeCore.js to use `node_core` instead of `nodes`
3. ❌ Change nodeFactory.js to use `node_core` instead of `nodes`
4. ❌ Update auth-api.js to create `node_core` rows (not just `core_node`)
5. ✅ Keep vector operations in `node_core.memory_blob` + `vec_embedding`

**Result:** Single source of truth for all node operations! 🎯

---

**Last Updated:** Feb 14, 2026  
**Status:** Schema Unification Required
