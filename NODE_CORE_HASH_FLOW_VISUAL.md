# NODE CORE HASH FLOW & BYTEA ENCODING - Visual Reference

## 🔐 Complete Hash Flow Diagram

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                   🔐 COMPLETE HASH IDENTITY CHAIN                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

STEP 1: USER SIGNUP
┌─────────────────────────────────────────────────────────────────────────┐
│ Browser:                                                                │
│   User clicks "Sign Up"                                                 │
│   → Supabase Auth creates: userId (UUID)                               │
│   → "550e8400-e29b-41d4-a716-446655440000"                            │
│                                                                         │
│ Backend Receives:                                                       │
│   userData = { email, name, age, phone, ... }                          │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
STEP 2: GENERATE NID_HASH
┌─────────────────────────────────────────────────────────────────────────┐
│ NodeFactory.initializeUserNode(userId, userData)                       │
│                                                                         │
│   const nid_hash = crypto                                              │
│     .createHash('sha256')                                              │
│     .update(userId)      // Input: "550e8400-e29b-41d4..."             │
│     .digest('hex');      // Output: Hex string                         │
│                                                                         │
│   Result: nid_hash = 
│   "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" │
│                                                                         │
│   Properties:                                                           │
│   ✓ Deterministic: Same userId → Same nid_hash (always)               │
│   ✓ Unique: No two userIds produce same hash                          │
│   ✓ One-way: Can't reverse hash to get userId                         │
│   ✓ Fixed length: Always 64 hex characters                            │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
STEP 3: SERIALIZE PROFILE DATA
┌─────────────────────────────────────────────────────────────────────────┐
│ Profile Object (JavaScript):                                            │
│   {                                                                     │
│     full_name: "John Doe",                                              │
│     email: "john@example.com",                                          │
│     phone: "+1-234-567-8900",                                           │
│     bio: "Family genealogy enthusiast",                                 │
│     avatar_url: "https://...",                                          │
│     preferences: {                                                      │
│       theme: "dark",                                                    │
│       notifications: true,                                              │
│       language: "en"                                                    │
│     },                                                                  │
│     social_links: {                                                     │
│       twitter: "@johndoe",                                              │
│       linkedin: "johndoe"                                               │
│     }                                                                   │
│   }                                                                     │
│                                                                         │
│ ↓ JSON.stringify()                                                      │
│                                                                         │
│ "{\"full_name\":\"John Doe\",\"email\":\"john@example.com\",...}"      │
│ Size: ~450 bytes                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
STEP 4: ENCODE TO BYTEA
┌─────────────────────────────────────────────────────────────────────────┐
│ Convert JSON string to BYTEA (PostgreSQL binary format):               │
│                                                                         │
│   Buffer.from(jsonString, 'utf-8').toString('hex')                    │
│                                                                         │
│   Result: "7b226675...6c6c5f6e616d65223a22..." (hex encoding)         │
│   Size: ~900 characters (450 bytes × 2 for hex)                       │
│                                                                         │
│   Stored in PostgreSQL as:                                             │
│   bytea (Binary data - optimized storage)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
STEP 5: INSERT INTO node_core
┌─────────────────────────────────────────────────────────────────────────┐
│ INSERT INTO node_core (                                                 │
│   owner_id,                  → "550e8400-e29b-41d4-a716-446655440000" │
│   nid_hash,                  → "e3b0c442...7852b855" (64 chars)        │
│   node_type,                 → 'living'                                 │
│   node_state,                → 'ACTIVE'                                 │
│   field_map,                 → <bytea blob of profile>                 │
│   perm_blob,                 → <bytea blob of permissions>             │
│   ui_blob,                   → <bytea blob of UI layout>               │
│   dna_blob,                  → <bytea blob of structure>               │
│   created_at,                → NOW()                                    │
│   updated_at,                → NOW()                                    │
│   created_at                 → NOW()                                    │
│ ) VALUES (...)                                                          │
│                                                                         │
│ Database creates row:                                                   │
│ ┌──────────┬──────────┬───────────────────┬────────────┬──────────┐  │
│ │ owner_id │ nid_hash │ node_type         │ field_map  │ created  │  │
│ ├──────────┼──────────┼───────────────────┼────────────┼──────────┤  │
│ │ 550e84.. │ e3b0c44..│ living            │ <bytea>    │ 2026... │  │
│ └──────────┴──────────┴───────────────────┴────────────┴──────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
STEP 6: HIERARCHY - CREATE CHILD NODES
┌─────────────────────────────────────────────────────────────────────────┐
│ For Profile, Layout, Permissions, etc., create child nodes:            │
│                                                                         │
│ CREATE USER PROFILE NODE:                                              │
│   parent_nid_hash = "e3b0c442...7852b855"  ← Same as parent!           │
│   node_type = 'profile'                                                │
│   field_map = <bytea with extended profile>                           │
│                                                                         │
│ CREATE LAYOUT NODE:                                                    │
│   parent_nid_hash = "e3b0c442...7852b855"  ← Links to parent           │
│   node_type = 'layout'                                                 │
│   ui_blob = <bytea with UI schema>                                     │
│                                                                         │
│ CREATE PERMISSION NODE:                                                │
│   parent_nid_hash = "e3b0c442...7852b855"  ← Links to parent           │
│   node_type = 'permission_set'                                         │
│   perm_blob = <bytea with access rights>                              │
│                                                                         │
│ HIERARCHY ESTABLISHED:                                                 │
│                                                                         │
│         Main User Node                                                 │
│    nid_hash: e3b0c442...                                               │
│              │                                                         │
│      ┌───────┼───────┬──────────┐                                      │
│      ↓       ↓       ↓          ↓                                       │
│    [PEN]  [LAY]  [PERM]      [FAM]                                     │
│   parent   parent  parent    parent                                    │
│  =e3b0c.. =e3b0c..=e3b0c..  =e3b0c..                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
STEP 7: STATE HASH FOR INTEGRITY
┌─────────────────────────────────────────────────────────────────────────┐
│ Calculate state hash to verify node integrity:                         │
│                                                                         │
│   state_hash = SHA256(                                                 │
│     node_state + 
│     "|" + 
│     updated_at                                                         │
│   )                                                                     │
│                                                                         │
│   Example:                                                              │
│   state_hash = SHA256("ACTIVE|2026-07-23T12:34:56Z")                  │
│   = "f7a9b3e2c5d8e1f4g9h2i5j8k1l4m7n0o3p6q9r2s5t8u1v4w7x0y3z6"      │
│                                                                         │
│   Purpose: Detect tampering or corruption                             │
│   ✓ Changes to node_state → Different hash                            │
│   ✓ Updates to updated_at → Different hash                            │
└─────────────────────────────────────────────────────────────────────────┘
                                 ↓
FINAL STATE: Node stored with complete identity chain
┌─────────────────────────────────────────────────────────────────────────┐
│ node_core table row:                                                    │
│                                                                         │
│ row_id            │ 12345                                               │
│ owner_id          │ 550e8400-e29b-41d4-a716-446655440000              │
│ nid_hash          │ e3b0c44298fc1c149afbf4c8996fb92427ae41e...        │
│ parent_nid_hash   │ NULL (this is the root)                           │
│ node_type         │ 'living'                                           │
│ node_state        │ 'ACTIVE'                                           │
│ state_hash        │ f7a9b3e2c5d8e1f4g9h2i5j8k1l4m7n0o3p6q9...        │
│ field_map         │ <bytea: profile JSON>                             │
│ perm_blob         │ <bytea: permissions>                              │
│ ui_blob           │ <bytea: UI layout>                                │
│ dna_blob          │ <bytea: structure>                                │
│ created_at        │ 2026-07-23 12:34:56+00                            │
│ updated_at        │ 2026-07-23 12:34:56+00                            │
│ karma_score       │ 0                                                   │
│ trust_score       │ 50                                                  │
│ health_score      │ 100                                                 │
│ ...               │ ... (40+ other fields)                             │
│                                                                         │
│ IDENTITY CHAIN COMPLETE ✓                                              │
│ ┌─────────────────────────────────────────────────────────────┐       │
│ │ nid_hash (owner identity)                                   │       │
│ │ parent_nid_hash (hierarchy)                                 │       │
│ │ state_hash (integrity)                                      │       │
│ │ owner_id (backup)                                           │       │
│ └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 BYTEA ENCODING/DECODING CYCLE

```
┌──────────────────────────────────────────────────────────────────────┐
│                   WRITE CYCLE (Save Profile)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  JavaScript Object (Memory)                                         │
│  ┌──────────────────────────────────────┐                           │
│  │ {                                    │                           │
│  │   full_name: "John Doe",            │                           │
│  │   email: "john@example.com",        │                           │
│  │   phone: "+1-234-567-8900"          │                           │
│  │ }                                    │                           │
│  └──────────────────────────────────────┘                           │
│           ↓ JSON.stringify()                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ "{\"full_name\":\"John Doe\",\"email\":\"john@example.com\","│  │
│  │ \"phone\":\"+1-234-567-8900\"}"                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ Buffer.from(..., 'utf-8')                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ <Buffer 7b 22 66 75 6c 6c 5f 6e 61 6d 65...>                │  │
│  │ (Raw bytes in memory)                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ .toString('hex')  OR .toString('base64')                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ "7b22666f6c6c5f6e616d65223a22 4a6f 686e 20446f 65222c222" │  │
│  │ (Hex-encoded string for transmission)                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ HTTP POST to backend                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ POST /api/onboarding/user-profile/save                      │  │
│  │ { field_map: "7b22666f6c6c5f..." }                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ INSERT INTO node_core                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ PostgreSQL: field_map = BYTEA (binary storage)              │  │
│  │ Storage optimized, no quotes needed                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ Database stores                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ node_core table:                                             │  │
│  │ field_map: BYTEA (compressed binary)                        │  │
│  │ Size: ~450 bytes (much better than JSONB!)                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   READ CYCLE (Load Profile)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SELECT from database                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SELECT field_map FROM node_core WHERE nid_hash = ...        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ Returns BYTEA                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ <Buffer 7b 22 66 75 6c 6c 5f 6e 61 6d 65...>                │  │
│  │ (Raw bytes from database)                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ Buffer.from(bytea).toString('utf-8')                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ "{\"full_name\":\"John Doe\",\"email\":\"john@example.com\""│  │
│  │ (JSON string)                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ JSON.parse()                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ {                                                            │  │
│  │   full_name: "John Doe",                                    │  │
│  │   email: "john@example.com",                                │  │
│  │   phone: "+1-234-567-8900"                                  │  │
│  │ }                                                            │  │
│  │ (Back to JavaScript object)                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓ Return to React component                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Display profile on dashboard                                │  │
│  │ ✅ Ready to use!                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📦 BYTEA BLOB CONTENTS BREAKDOWN

### 1. field_map BYTEA - Profile Data

```
┌─────────────────────────────────────────────────────────────┐
│ field_map BYTEA contains:                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ {                                                           │
│   // Basic Profile                                         │
│   full_name: "John Doe",                                   │
│   email: "john@example.com",                               │
│   phone: "+1-234-567-8900",                                │
│   age: 32,                                                 │
│   gender: "M",                                             │
│   avatar_url: "https://...",                               │
│                                                             │
│   // Social                                                │
│   bio: "Family genealogy enthusiast",                      │
│   social_links: {                                          │
│     twitter: "@johndoe",                                   │
│     linkedin: "johndoe",                                   │
│     instagram: "johndoe"                                   │
│   },                                                        │
│                                                             │
│   // Preferences                                           │
│   preferences: {                                           │
│     theme: "dark",                                         │
│     notifications: true,                                   │
│     language: "en",                                        │
│     newsletter: true                                       │
│   },                                                        │
│                                                             │
│   // Location                                              │
│   city: "San Francisco",                                   │
│   state: "CA",                                             │
│   country: "USA",                                          │
│                                                             │
│   // Genealogy                                             │
│   genealogy: {                                             │
│     family_name: "Sharma",                                 │
│     gotra: "Bhardwaj",                                     │
│     caste: "Brahmin",                                      │
│     ancestors: ["Raj Sharma", "Priya Sharma"]              │
│   },                                                        │
│                                                             │
│   // Metadata                                              │
│   updated_at: "2026-07-23T12:34:56Z",                      │
│   profile_complete: true                                   │
│ }                                                           │
│                                                             │
│ Size: 5-20 KB (typical)                                    │
│ Compression: Excellent (BYTEA vs JSONB)                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. perm_blob BYTEA - Permissions

```
┌─────────────────────────────────────────────────────────────┐
│ perm_blob BYTEA contains:                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ {                                                           │
│   role: "basic_user",                                      │
│   level: 1,                                                │
│   can_create_posts: true,                                  │
│   can_edit_posts: true,                                    │
│   can_delete_posts: true,                                  │
│   can_invite_friends: true,                                │
│   can_manage_profile: true,                                │
│   can_view_genealogy: true,                                │
│   can_edit_genealogy: true,                                │
│   can_create_family: true,                                 │
│   can_upload_files: true,                                  │
│   can_comment: true,                                       │
│   can_like: true,                                          │
│   restrictions: {                                          │
│     max_posts_per_day: 10,                                 │
│     max_upload_size: "100MB",                              │
│     can_access_premium: false                              │
│   }                                                        │
│ }                                                           │
│                                                             │
│ Size: 1-2 KB (small!)                                      │
│ Checked on: Every operation                                │
└─────────────────────────────────────────────────────────────┘
```

### 3. ui_blob BYTEA - UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ui_blob BYTEA contains:                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ {                                                           │
│   brand: "vanshawali",                                     │
│   theme: "dark",                                           │
│   layout_type: "genealogy_dashboard",                      │
│   widgets: [                                               │
│     {                                                      │
│       id: "widget_1",                                      │
│       type: "family_tree",                                 │
│       title: "Your Family Tree",                           │
│       position: { x: 0, y: 0 },                            │
│       size: { width: 600, height: 400 },                   │
│       config: { depth: 3, mode: "vertical" }               │
│     },                                                      │
│     {                                                      │
│       id: "widget_2",                                      │
│       type: "lineage_summary",                             │
│       title: "Lineage Info",                               │
│       position: { x: 600, y: 0 },                          │
│       size: { width: 300, height: 400 }                    │
│     },                                                      │
│     {                                                      │
│       id: "widget_3",                                      │
│       type: "stats",                                       │
│       title: "Family Statistics",                          │
│       position: { x: 0, y: 400 },                          │
│       size: { width: 900, height: 200 }                    │
│     }                                                      │
│   ],                                                        │
│   color_scheme: {                                          │
│     primary: "#667eea",                                    │
│     secondary: "#764ba2",                                  │
│     accent: "#fbbf24"                                      │
│   }                                                         │
│ }                                                           │
│                                                             │
│ Size: 5-10 KB (moderate)                                   │
│ Sent to: Frontend on page load                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. dna_blob BYTEA - Node Structure

```
┌─────────────────────────────────────────────────────────────┐
│ dna_blob BYTEA contains:                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ {                                                           │
│   structure: {                                             │
│     type: "living_entity",                                 │
│     category: "user",                                      │
│     version: 1                                             │
│   },                                                        │
│   capabilities: {                                          │
│     has_relationships: true,                               │
│     has_permissions: true,                                 │
│     has_identity: true,                                    │
│     searchable: true,                                      │
│     archivable: true                                       │
│   },                                                        │
│   attributes: [                                            │
│     "profile",                                             │
│     "genealogy",                                           │
│     "layout",                                              │
│     "permissions"                                          │
│   ]                                                        │
│ }                                                           │
│                                                             │
│ Size: 2-5 KB (small)                                       │
│ Rarely changed: Immutable structure                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Relationship Metadata Examples

```
┌──────────────────────────────────────────────────────────────┐
│         node_relationships metadata JSONB                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ // User owns their profile                                  │
│ {                                                            │
│   "status": "active",                                       │
│   "created_at": "2026-07-23T12:34:56Z",                     │
│   "role": "owner"                                           │
│ }                                                            │
│                                                              │
│ // User is member of family                                 │
│ {                                                            │
│   "status": "active",                                       │
│   "joined_at": "2026-01-15",                                │
│   "role": "family_member",                                  │
│   "permissions": ["view", "edit_own", "add_members"]        │
│ }                                                            │
│                                                              │
│ // User invited to event                                    │
│ {                                                            │
│   "status": "pending",                                      │
│   "invited_at": "2026-07-23",                               │
│   "invited_by": "friend_uuid",                              │
│   "response": "waiting"                                     │
│ }                                                            │
│                                                              │
│ // User follows brand                                       │
│ {                                                            │
│   "status": "active",                                       │
│   "followed_at": "2026-06-15",                              │
│   "notifications": true                                     │
│ }                                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧮 Hash Collision & Safety

```
HASH UNIQUENESS GUARANTEE:

SHA256 Output Space: 2^256 = 1.16 × 10^77 possible values
Collision Probability: Extremely low (cryptographically secure)

Example:
├─ userID 1: "550e8400..." → SHA256 → "e3b0c442..."
├─ userID 2: "660f9511..." → SHA256 → "f4c1d553..." (completely different)
└─ Even tiny changes in userID → Completely different hash

Profile Data Integrity:
├─ Same nid_hash + same field_map = Same data
├─ If field_map modified → Update both field_map AND state_hash
├─ Verification: Recalculate nid_hash from owner_id
└─ If recalculated ≠ stored → Data corruption detected ⚠️
```

---

## 🎯 Summary: Hash Flow Components

| Component | Purpose | Format | Immutable |
|-----------|---------|--------|-----------|
| **nid_hash** | Node identity | SHA256(owner_id) = 64 hex chars | ✓ Yes |
| **parent_nid_hash** | Parent reference | SHA256 of parent's owner_id | ✓ Yes (hierarchy) |
| **state_hash** | Integrity check | SHA256(state + timestamp) | ✗ Changes with updates |
| **owner_id** | Backup identifier | UUID | ✓ Yes |
| **field_map** | Profile data | BYTEA (binary) | ✗ Updates allowed |
| **created_at** | Birth timestamp | TIMESTAMP | ✓ Yes |
| **updated_at** | Last update | TIMESTAMP | ✗ Changes on update |

---

## ✅ Your Profile Storage Map

```
Your Yuvaan App Profile Persistence:

┌─────────────────────────────────────────────────────────────┐
│  User Fills Onboarding Form                                │
│  ├─ fullName, email, phone, bio, preferences               │
│  └─ Sends via ProfileOnboarding.js                         │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend POST /api/onboarding/user-profile/save             │
│  ├─ Receives profile JSON                                   │
│  ├─ Serializes to BYTEA                                     │
│  └─ Stores in node_core.field_map                          │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│  Database Storage (node_core table)                         │
│  ├─ nid_hash: "e3b0c442..."                                │
│  ├─ field_map: <bytea profile>                            │
│  ├─ parent_nid_hash: NULL (root)                           │
│  └─ created_at: 2026-07-23T12:34:56Z                       │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│  Profile Persists! ✅                                        │
│  ├─ Not lost on page refresh                               │
│  ├─ Not lost on logout                                      │
│  ├─ Available across devices                               │
│  ├─ Synced via NodeSync                                    │
│  └─ Searchable via vector memory                           │
└─────────────────────────────────────────────────────────────┘
```

This is the complete picture! 🚀
