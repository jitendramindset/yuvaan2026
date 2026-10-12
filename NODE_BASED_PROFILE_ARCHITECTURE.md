# Yuvaan v1 - Node-Based Profile Persistence Architecture

## 🏗️ Architecture Overview

Instead of a traditional `user_profiles` table, **all profile data is stored as nodes** in the existing `node_core` table. This leverages your neural OS architecture where:

- **Everything is a node** - Users, profiles, layouts, permissions, all exist as node entries
- **Relationships define access** - Node relationships and metadata handle permissions (no separate ACL table)
- **Kernel manages flow** - NodeFactory, NodeSync, NodeDiscovery orchestrate data flow
- **Field mapping is flexible** - Profile data stored in node's `field_map` (bytea JSONB blob)

---

## 📊 Implementation

### 1. Profile Data Storage (Node-Based)

**Instead of:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID,
  profile_data JSONB
);
```

**We use:**
```
node_core table:
├── node_type = 'user_node'
├── owner_id = user_id
├── field_map = bytea (contains JSON profile data)
├── dna_blob = bytea (contains node type, relationships, metadata)
└── parent_nid_hash = parent node reference
```

### 2. Backend API Endpoints (Node-Based)

**POST `/api/onboarding/user-profile/save`**
- Accepts: `{ userId, profileData, timestamp }`
- Uses: `NodeFactory.updateNode()` to update user node's `field_map`
- Store profile data in the node's field_map (JSONB blob)
- Kernel handles all access control via node relationships

**GET `/api/onboarding/user-profile/get`**
- Uses: `NodeFactory.queryNodes()` to fetch user's node
- Extracts profile data from user node's `field_map`
- Returns: `{ profile: { node_id, node_nid_hash, profile_data } }`

### 3. Frontend Flow (ProfileOnboarding → Node System)

**Profile Onboarding Component:**
```javascript
handleSaveProfile() {
  1. Save to localStorage (fast)
  2. POST profile data to /api/onboarding/user-profile/save
     - Uses NodeFactory to update user node
     - Profile stored in node's field_map
  3. Set profileComplete_${userId} flag
  4. Call onComplete() callback
}
```

**Dashboard Profile Check:**
```javascript
checkUserProfile() {
  1. Check localStorage first (fast path)
  2. If not found, fetch from node system
     - GET /api/onboarding/user-profile/get
     - NodeFactory retrieves user node and extracts profile
  3. Sync node profile back to localStorage
  4. Show/hide onboarding modal based on profile state
}
```

---

## 🔗 Node-Based Relationships

**User node relationships:**
```
user_node (owner_id = userId)
├── field_map = { fullName, email, phone, bio, ... }
├── dna_blob = { node_type: 'user_node', brand: 'BOTMANTRA', ... }
├── parent_nid_hash → brand_root node
├── nid_hash → unique node identifier
└── permissions = { read: [], write: [], admin: [] }
```

**Permission checking via node system:**
- No hardcoded ACLs
- All checks via `node_relationships` table
- `relation_type` values: 'member_of', 'owns', 'invited', 'follows', etc.
- `metadata` in relationship stores role, status, since_date

---

## 📝 Code Changes

### Backend (routes-onboarding.js)

```javascript
// POST /api/onboarding/user-profile/save
- Uses NodeFactory.updateNode() to update user node
- Stores profileData in node's field_map
- Returns: { success: true, profile: { node_id, nid_hash, profile_data } }

// GET /api/onboarding/user-profile/get  
- Uses NodeFactory.queryNodes() to fetch user node
- Extracts profile from field_map
- Returns: { success: true, profile: { ... } }
```

### Frontend (ProfileOnboarding.js)

```javascript
// handleSaveProfile()
- POST to /api/onboarding/user-profile/save (uses node system)
- localStorage as fallback/cache
- Graceful error handling - continues with localStorage if backend fails
```

### Frontend (Dashboard.js)

```javascript
// checkUserProfile()
- Check localStorage first (fast)
- Fall back to node system via GET /api/onboarding/user-profile/get
- Sync node profile back to localStorage
- Hide onboarding if profile found anywhere
```

---

## 🔐 Security (Via Node System)

**Row Level Security (RLS):**
- User can only see their own user_node (checked via owner_id)
- Relationships define who can access what
- Node metadata stores permission rules
- Kernel validates all access

**No separate ACL table needed:**
- Everything enforced via node_relationships
- Permission checks in NodeFactory
- Kernel flow validates permissions

---

## 🚀 Advantages

✅ **No separate tables** - Uses existing node_core architecture
✅ **Flexible data** - Profile stored as JSONB in node's field_map
✅ **Built-in access control** - Relationships handle permissions
✅ **Scalable** - Node graph handles many users/relationships
✅ **Kernel integrated** - NodeSync, NodeDiscovery, NodeGraph all work together
✅ **No ASL needed** - Relationship types and metadata define access
✅ **Vector-ready** - Profiles can be embedded and searched via node_vector_memory

---

## 🧪 Testing Checklist

- [ ] ProfileOnboarding saves profile to localStorage
- [ ] ProfileOnboarding POSTs to `/api/onboarding/user-profile/save`
- [ ] Backend creates/updates user node with profile in field_map
- [ ] Dashboard fetches profile from node system
- [ ] Profile data appears in node_core table (field_map column)
- [ ] Page refresh maintains profile (synced from node to localStorage)
- [ ] Onboarding modal doesn't reappear after completion
- [ ] Dashboard shows Vanshawali UI only (no builder)

---

## 📚 Key Files

**Backend:**
- `/botmantra-backend/routes-onboarding.js` - Profile endpoints (node-based)
- `/botmantra-backend/core/nodeFactory.js` - Node creation/update logic
- `/botmantra-backend/core/node-schema.js` - Node structure definitions
- `/botmantra-backend/core/nodeCore.js` - Core node management

**Frontend:**
- `/botmantra-ui/src/components/ProfileOnboarding.js` - Profile collection
- `/botmantra-ui/src/Dashboard.js` - Profile verification & display

---

## 🔄 Data Flow Diagram

```
User Fills Onboarding Form
         ↓
ProfileOnboarding.handleSaveProfile()
         ↓
Save to localStorage (immediate)
         ↓
POST /api/onboarding/user-profile/save
         ↓
Backend: NodeFactory.updateNode()
         ↓
Update user_node's field_map with profile data
         ↓
Store in node_core table (field_map = bytea with JSON)
         ↓
Return success response
         ↓
Dashboard.checkUserProfile()
         ↓
GET /api/onboarding/user-profile/get
         ↓
Backend: NodeFactory.queryNodes()
         ↓
Fetch user_node and extract field_map
         ↓
Return profile data
         ↓
Sync to localStorage, hide onboarding modal
         ↓
Show Vanshawali UI (no builder by default)
```

---

## 🎯 Next Steps

1. ✅ Backend endpoints updated to use NodeFactory
2. ✅ Frontend updated to call node-based endpoints
3. ✅ Dashboard default view = Vanshawali (no builder)
4. 🔄 **Test end-to-end profile persistence**
5. 🔄 Verify profile appears in node_core table
6. 🔄 Test page reload maintains profile
7. 🔄 Fix signup email confirmation redirect

---

## 📌 Notes

- Profile data **not** in separate `user_profiles` table
- Profile stored as **node_core entry** with field_map containing JSON
- All permission checking via **node_relationships** 
- No hardcoded ACLs - uses node metadata and relationship semantics
- Kernel orchestrates all data flow between nodes
- Vector embeddings via node_vector_memory (for future RAG)

