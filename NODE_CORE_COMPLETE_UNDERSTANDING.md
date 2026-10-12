# NODE CORE SYSTEM - Complete Understanding (Summary)

## 🎯 The Big Picture

Your system uses a **neural operating system** where:
- **Everything is a Node** in the `node_core` table
- **No separate tables** for profiles, permissions, layouts, etc.
- **Relationships** define access control (not hardcoded ACL tables)
- **Bytea blobs** store serialized data (flexible schema, smaller storage)
- **Hash-based identity** (nid_hash) for security

---

## 📊 Three Core Tables (That's It!)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1️⃣  node_core                                                     │
│      └─ Every entity: user, profile, layout, family, etc.          │
│         └─ With 60+ fields including bytea blobs for data          │
│                                                                     │
│  2️⃣  node_relationships                                            │
│      └─ Connections between nodes                                   │
│         └─ Defines who can see what (no separate ACL table)        │
│                                                                     │
│  3️⃣  node_vector_memory                                            │
│      └─ Semantic embeddings for AI search                          │
│         └─ Content + vector + metadata                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 YOUR PROFILE STORAGE IN node_core

### Column → Field Mapping

| Field | What Goes Here | Example |
|-------|----------------|---------|
| `owner_id` | User's UUID | `550e8400-e29b-41d4...` |
| `nid_hash` | SHA256(owner_id) - Unique ID | `e3b0c442...7852b855` |
| `node_type` | Always 'living' for users | `'living'` |
| `node_state` | ACTIVE/ARCHIVED/DELETED | `'ACTIVE'` |
| `parent_nid_hash` | Parent's nid_hash (NULL for root) | `NULL` or `e3b0c442...` |
| **`field_map`** | **YOUR PROFILE DATA!** | Bytea: full_name, email, phone, bio, etc. |
| `perm_blob` | Permissions & roles | Bytea: can_create_posts, can_manage_profile |
| `ui_blob` | UI layout & widgets | Bytea: layout_type, widgets, theme |
| `dna_blob` | Node structure | Bytea: capabilities, attributes |
| `state_hash` | Integrity check | SHA256(ACTIVE + timestamp) |
| `karma_score` | Behavior score | 0 (new user) |
| `trust_score` | Trustworthiness | 50 (neutral) |
| `created_at` | Created timestamp | 2026-07-23 12:34:56 |

---

## 🔐 HASH FLOW EXPLAINED

```
User Signs Up
    ↓
userId created: "550e8400-e29b-41d4-a716-446655440000"
    ↓
Calculate hash: SHA256(userId) 
    ↓
nid_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    ↓
Stored in node_core.nid_hash (UNIQUE)
    ↓
Profile data stored in node_core.field_map (as bytea)
    ↓
Access profile: Query WHERE nid_hash = "e3b0c442..."
```

### Why Use nid_hash?
✓ **Deterministic**: Same userId → Same hash (always)
✓ **Unique**: No collisions (cryptographically secure)
✓ **One-way**: Can't reverse to get userId
✓ **Fast lookup**: Indexed in database

---

## 📦 BYTEA BLOB ENCODING

### How Data Flows

```
JavaScript Object (Memory)
    ↓
JSON.stringify()     → JSON string
    ↓
Buffer.from(*, 'utf-8')  → Buffer (binary)
    ↓
.toString('hex')     → Hex string for transmission
    ↓
INSERT into bytea    → Binary storage in DB
    ↓
SELECT bytea         → Returns binary
    ↓
Buffer.from(*, 'binary').toString('utf-8')  → JSON string
    ↓
JSON.parse()         → Back to JavaScript object
```

### Example: Storing Profile

```javascript
// Profile object
profile = {
  full_name: "John Doe",
  email: "john@example.com",
  phone: "+1-234-567-8900"
}

// Encode
profileJSON = JSON.stringify(profile)
// "{"full_name":"John Doe","email":"john@example.com","phone":"+1..."}"

fieldMapBytea = Buffer.from(profileJSON, 'utf-8')
// <Buffer 7b 22 66 75 6c 6c 5f ...>

// Store in database
INSERT INTO node_core (field_map) VALUES (fieldMapBytea)

// Retrieve
SELECT field_map FROM node_core WHERE nid_hash = ...
// <Buffer 7b 22 66 75 6c 6c 5f ...>

// Decode
decoded = Buffer.from(fieldMapBytea, 'binary').toString('utf-8')
// "{"full_name":"John Doe","email":"john@example.com",...}"

profileObject = JSON.parse(decoded)
// Back to original object!
```

---

## 🔗 RELATIONSHIPS (No ASL Table Needed!)

### Instead of:
```
❌ user_profiles table
❌ user_permissions table
❌ user_roles table
❌ hardcoded ACL table
```

### We Use:
```sql
-- node_relationships table
SELECT relation_type, metadata 
FROM node_relationships 
WHERE parent_node = user_nid_hash;

-- Returns relationships showing permissions
-- relation_type: 'owns', 'member_of', 'has_admin', 'invited'
-- metadata: { status, role, permissions, ... }
```

### Example Relationships:

```
User Node (nid_hash: "abc123...")
    ├─ relation_type: "owns"
    │  ├─ child_node: Profile Node
    │  └─ metadata: { status: 'active', role: 'owner' }
    │
    ├─ relation_type: "member_of"
    │  ├─ child_node: Family Group
    │  └─ metadata: { status: 'active', can_see_genealogy: true }
    │
    ├─ relation_type: "has_admin"
    │  ├─ child_node: Admin Role
    │  └─ metadata: { granted_at: timestamp, expires: null }
    │
    └─ relation_type: "uses"
       ├─ child_node: Layout Node
       └─ metadata: { theme: 'dark', layout_type: 'genealogy' }
```

---

## 🎯 PROFILE PERSISTENCE FLOW (Your App)

```
┌───────────────────────────────────────────────────────────────────┐
│ 1. User fills onboarding form in React                           │
│    → ProfileOnboarding.js collects data                          │
│    → POST to /api/onboarding/user-profile/save                  │
└───────────────────────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────────────────────┐
│ 2. Backend receives profile                                       │
│    → Calculate nid_hash = SHA256(userId)                         │
│    → Serialize profile to JSON                                   │
│    → Encode as bytea                                             │
│    → INSERT/UPDATE node_core                                     │
└───────────────────────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────────────────────┐
│ 3. Database stores profile                                        │
│    → node_core table with field_map = bytea profile             │
│    → nid_hash indexed for fast lookup                            │
│    → All relationships intact                                    │
│    → RLS enforces privacy                                        │
└───────────────────────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────────────────────┐
│ 4. Frontend also saves locally                                    │
│    → localStorage.setItem(`userProfile_${userId}`, JSON)         │
│    → localStorage.setItem(`profileComplete_${userId}`, 'true')   │
│    → Graceful fallback if backend unavailable                    │
└───────────────────────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────────────────────┐
│ 5. User refreshes page or reopens app                            │
│    → Check localStorage first (fast!)                            │
│    → If not found, GET /api/onboarding/user-profile/get          │
│    → Decode field_map from bytea                                 │
│    → Onboarding modal NOT shown (profile exists!)                │
└───────────────────────────────────────────────────────────────────┘
              ↓
         ✅ PROFILE PERSISTS!
    (Not lost, accessible across devices)
```

---

## 📝 Complete Field Breakdown

### Identity & Hash Fields
- `owner_id` - Who owns this node (UUID)
- `nid_hash` - SHA256 identifier (64 hex chars)
- `parent_nid_hash` - Parent node reference (hierarchy)
- `state_hash` - Integrity verification hash

### Data Blobs (BYTEA)
- **`field_map`** - Profile data (JSON serialized)
- `perm_blob` - Permissions & roles
- `ui_blob` - UI layout & schema
- `dna_blob` - Node structure/DNA
- `rule_blob` - Business rules
- `runtime_blob` - Execution state
- `memory_blob` - AI context
- `sys_blob` - System metadata

### Classification
- `node_type` - 'living', 'post', 'family', 'layout', etc.
- `node_state` - ACTIVE, ARCHIVED, DELETED
- `privacy_mode` - CORE_ONLY, LIMITED, SHARED
- `visibility` - private, family, public

### Scores & Reputation
- `karma_score` - Behavior (-1000 to +1000)
- `trust_score` - Trustworthiness (1-100)
- `reputation_level` - NEW, TRUSTED, VERIFIED, EXPERT
- `health_score` - System health (1-100)

### Lifecycle
- `created_at` - Creation timestamp (immutable)
- `updated_at` - Last modification
- `is_archived` - Soft delete flag
- `valid_until` - Expiry timestamp

### Security
- `device_fingerprint` - Device ID
- `pin_hash` - Hashed PIN
- `qr_token_hash` - QR code hash
- `is_activated` - Verified flag
- `encryption_key_ref` - Key reference

### Performance
- `vec_embedding` - VECTOR(1536) for AI search
- `hot_cache` - In-memory cache flag
- `is_cold` - Cold storage flag
- `sync_version` - Multi-device sync

---

## 💾 Data Size Example

```
Single User Node:
├─ Basic fields: ~500 bytes
├─ field_map (profile): ~10-20 KB
├─ perm_blob: ~1-2 KB
├─ ui_blob: ~5-10 KB
├─ dna_blob: ~2-5 KB
├─ memory_blob: ~5-10 KB
├─ sys_blob: ~1 KB
└─ vec_embedding (1536d): ~6 KB
─────────────────────────
Total: ~35-55 KB per node

Storage is EFFICIENT compared to separate JSONB columns!
```

---

## 🚀 Key Takeaways

| Concept | What It Means | For You |
|---------|--------------|---------|
| **Everything = Node** | All data types stored same way | No schema migrations needed |
| **nid_hash** | Unique identifier | Query: WHERE nid_hash = ? |
| **field_map** | Where profile lives | Serialize/deserialize JSON ↔ bytea |
| **parent_nid_hash** | Parent reference | Hierarchy & relationships |
| **node_relationships** | Permission system | No separate ACL table |
| **Bytea blobs** | Flexible storage | JSON → Buffer → Bytea → DB |
| **No separate tables** | Unified schema | Profile stored in field_map blob |
| **RLS policies** | Row-level security | Privacy enforced by relationships |

---

## 📚 Document Reference

You now have 3 documents:

1. **COMPLETE_NODE_CORE_SCHEMA_GUIDE.md**
   - All 60+ fields explained
   - Complete table structures
   - Relationship examples
   - Real profile storage example

2. **NODE_CORE_HASH_FLOW_VISUAL.md**
   - Step-by-step hash calculation
   - Bytea encoding/decoding cycle
   - Blob contents breakdown
   - Real flow diagrams

3. **NODE_CORE_QUICK_REFERENCE.md**
   - Field quick map
   - Code examples (backend & frontend)
   - SQL queries
   - Debugging checklist

---

## ✅ Your Implementation Status

```
✓ Profile stored in field_map (bytea in node_core)
✓ nid_hash calculated correctly (SHA256)
✓ Backend endpoints use NodeFactory
✓ Frontend saves to localStorage + backend
✓ Hybrid persistence (cache + persistent)
✓ No separate tables needed
✓ Everything through node system
✓ Relationships define access control
✓ RLS enforces privacy
✓ Complete architecture understood
```

---

## 🎓 Quick Memory Aid

```
Remember: HASH → BLOB → RELATIONSHIP

1. Hash identifies node (nid_hash = SHA256(owner_id))
2. Blob stores data (field_map = serialized profile)
3. Relationship grants access (parent → child via relation_type)

No separate tables. No hardcoded ACL. Just nodes and relationships!
```

That's your complete understanding of the node_core system! 🎉
