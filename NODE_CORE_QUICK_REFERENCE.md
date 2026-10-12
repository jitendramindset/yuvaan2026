# NODE CORE QUICK REFERENCE - Field Mappings & Code Examples

## 🎯 At-a-Glance Field Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE_CORE FIELDS QUICK MAP                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ IDENTITY FIELDS:                                                        │
│   row_id              → SERIAL PK (read-only)                          │
│   owner_id            → UUID (who owns)                                 │
│   nid_hash            → SHA256(owner_id) - UNIQUE                      │
│   parent_nid_hash     → SHA256(parent owner_id) - hierarchy            │
│                                                                         │
│ DATA BLOBS (BYTEA):                                                     │
│   field_map           → 📋 PROFILE DATA HERE (JSON serialized)         │
│   perm_blob           → 🔐 Permissions & roles                         │
│   ui_blob             → 🎨 UI Layout & schema                          │
│   dna_blob            → 🧬 Node structure/capabilities                 │
│   rule_blob           → ⚙️ Business rules                              │
│   runtime_blob        → ⏱️ Execution state                             │
│   memory_blob         → 🧠 AI context & memory                         │
│   sys_blob            → 🔧 System metadata                             │
│                                                                         │
│ SEMANTIC:                                                               │
│   vec_embedding       → VECTOR(1536) pgvector embedding               │
│   state_hash          → SHA256(state + updated_at) for integrity      │
│                                                                         │
│ CLASSIFICATION:                                                         │
│   node_type           → 'living', 'post', 'brand', 'family', etc.    │
│   node_state          → 'ACTIVE', 'ARCHIVED', 'DELETED'              │
│   privacy_mode        → 'CORE_ONLY', 'LIMITED', 'SHARED'             │
│   permission_scope    → 'READ', 'WRITE', 'ADMIN'                     │
│   visibility          → 'private', 'family', 'public'                │
│                                                                         │
│ SCORES & REPUTATION:                                                    │
│   karma_score         → -1000 to +1000 (behavior)                     │
│   trust_score         → 1-100 (trustworthiness)                       │
│   reputation_level    → 'NEW', 'TRUSTED', 'VERIFIED', 'EXPERT'       │
│   health_score        → 1-100 (system health)                         │
│   experience_level    → 0-100 (user skill)                            │
│                                                                         │
│ EXECUTION:                                                              │
│   can_execute         → Boolean (can perform actions)                  │
│   can_update          → Boolean (can be modified)                      │
│   external_access     → Boolean (accessible externally)                │
│                                                                         │
│ LIFECYCLE:                                                              │
│   created_at          → TIMESTAMP (immutable creation)                │
│   updated_at          → TIMESTAMP (last modification)                 │
│   is_archived         → Boolean (soft delete)                         │
│   archived_at         → TIMESTAMP (when archived)                     │
│   valid_until         → TIMESTAMP (expiry)                            │
│                                                                         │
│ COLD STORAGE:                                                           │
│   is_cold             → Boolean (in cold storage)                     │
│   sleep_after         → TIMESTAMP (when to sleep)                     │
│   wakeup_at           → TIMESTAMP (when to wake)                      │
│   last_check          → TIMESTAMP (last activity)                     │
│   hot_cache           → Boolean (in memory cache)                     │
│                                                                         │
│ SECURITY & VERIFICATION:                                                │
│   device_fingerprint  → Device identifier                             │
│   pin_hash            → Hashed PIN                                     │
│   pin_expiry          → PIN validity                                   │
│   qr_token_hash       → QR code hash                                   │
│   qr_expiry           → QR validity                                    │
│   recovery_qr_hash    → Recovery code                                  │
│   recovery_expiry     → Recovery validity                              │
│   is_activated        → Boolean (verified)                            │
│   encryption_key_ref  → UUID (key reference)                          │
│                                                                         │
│ LOCATION & DEVICE:                                                      │
│   latitude            → Geo latitude                                   │
│   longitude           → Geo longitude                                  │
│   wallet_id           → Payment wallet                                 │
│                                                                         │
│ AI & SYNC:                                                              │
│   node_system_prompt  → System instruction for AI                      │
│   prompt_version      → Tracking AI prompt version                     │
│   prompt_last_update  → When prompt changed                           │
│   sync_version        → Multi-device sync version                     │
│   last_sync_at        → Last sync timestamp                           │
│                                                                         │
│ STATUS:                                                                 │
│   task_status         → 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'  │
│   status              → 'PENDING', 'COMMITTED', 'ROLLED_BACK'        │
│   exposure_mode       → 'PRIVATE', 'LIMITED', 'PUBLIC'               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Code Examples - Save Profile

### Express.js Backend (POST save profile)

```javascript
// routes-onboarding.js - POST /api/onboarding/user-profile/save

app.post('/api/onboarding/user-profile/save', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;  // From JWT token
    const profileData = req.body; // { fullName, email, phone, bio, ... }

    // Step 1: Calculate nid_hash
    const nid_hash = crypto
      .createHash('sha256')
      .update(userId)
      .digest('hex');

    // Step 2: Serialize profile to JSON
    const profileJSON = JSON.stringify(profileData);

    // Step 3: Encode to bytea (hex string for transmission)
    const field_map = Buffer.from(profileJSON, 'utf-8').toString('hex');

    // Step 4: Build complete node data
    const nodeData = {
      owner_id: userId,
      nid_hash: nid_hash,
      node_type: 'living',
      node_state: 'ACTIVE',
      state_hash: crypto
        .createHash('sha256')
        .update('ACTIVE' + new Date().toISOString())
        .digest('hex'),
      
      // Profile in field_map
      field_map: Buffer.from(field_map, 'hex'),
      
      // Permissions
      perm_blob: Buffer.from(
        JSON.stringify({
          role: 'basic_user',
          can_create_posts: true,
          can_manage_profile: true,
          can_view_genealogy: true
        }),
        'utf-8'
      ),
      
      // UI Layout
      ui_blob: Buffer.from(
        JSON.stringify({
          brand: 'vanshawali',
          layout_type: 'genealogy_dashboard',
          widgets: [
            { type: 'family_tree', position: 0 },
            { type: 'lineage_summary', position: 1 }
          ]
        }),
        'utf-8'
      ),
      
      // Other blobs
      dna_blob: Buffer.from('{}', 'utf-8'),
      rule_blob: Buffer.from('{}', 'utf-8'),
      runtime_blob: Buffer.from('{}', 'utf-8'),
      memory_blob: Buffer.from('[]', 'utf-8'),
      sys_blob: Buffer.from('{}', 'utf-8'),
      
      karma_score: 0,
      trust_score: 50,
      reputation_level: 'NEW',
      health_score: 100
    };

    // Step 5: Fetch or create node
    const { data: existingNode, error: fetchError } = await supabase
      .from('node_core')
      .select('*')
      .eq('nid_hash', nid_hash)
      .single();

    let result;
    if (existingNode) {
      // UPDATE existing
      const { data: updated, error: updateError } = await supabase
        .from('node_core')
        .update(nodeData)
        .eq('nid_hash', nid_hash)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updated;
    } else {
      // INSERT new
      const { data: inserted, error: insertError } = await supabase
        .from('node_core')
        .insert(nodeData)
        .select()
        .single();

      if (insertError) throw insertError;
      result = inserted;
    }

    // Step 6: Return success
    res.json({
      success: true,
      message: 'Profile saved to node system',
      node_id: result.row_id,
      nid_hash: result.nid_hash,
      profile: profileData
    });

  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### React Frontend (Send profile)

```javascript
// ProfileOnboarding.js - handleSaveProfile()

async handleSaveProfile() {
  const userId = this.getUserIdFromAuth();
  const profileData = {
    full_name: this.state.fullName,
    email: this.state.email,
    phone: this.state.phone,
    bio: this.state.bio,
    avatar_url: this.state.avatarUrl,
    preferences: this.state.preferences,
    social_links: this.state.socialLinks,
    genealogy: this.state.genealogy
  };

  // Step 1: Save to localStorage immediately (fast response)
  localStorage.setItem(
    `userProfile_${userId}`,
    JSON.stringify(profileData)
  );
  localStorage.setItem(`profileComplete_${userId}`, 'true');
  localStorage.setItem(`auth_token`, this.state.token);

  // Step 2: Sync to backend (persistent storage)
  try {
    const response = await fetch('/api/onboarding/user-profile/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.state.token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('Profile saved to node system:', data.nid_hash);
      this.onComplete(profileData); // Callback
    } else {
      console.warn('Backend sync failed, using localStorage:', data.error);
      this.onComplete(profileData); // Continue anyway
    }
  } catch (error) {
    console.error('Profile sync error:', error);
    // Graceful fallback to localStorage
    this.onComplete(profileData);
  }
}
```

---

## 💻 Code Examples - Retrieve Profile

### Express.js Backend (GET profile)

```javascript
// routes-onboarding.js - GET /api/onboarding/user-profile/get

app.get('/api/onboarding/user-profile/get', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Calculate nid_hash
    const nid_hash = crypto
      .createHash('sha256')
      .update(userId)
      .digest('hex');

    // Step 2: Query node_core
    const { data: node, error: queryError } = await supabase
      .from('node_core')
      .select('*')
      .eq('nid_hash', nid_hash)
      .eq('node_type', 'living')
      .single();

    if (queryError) {
      console.warn('Node not found for user:', userId);
      return res.json({ success: false, profile: null });
    }

    // Step 3: Decode field_map from BYTEA
    const profileJSON = Buffer.from(node.field_map, 'binary').toString('utf-8');
    const profile = JSON.parse(profileJSON);

    // Step 4: Return profile
    res.json({
      success: true,
      profile: {
        node_id: node.row_id,
        nid_hash: node.nid_hash,
        created_at: node.created_at,
        updated_at: node.updated_at,
        ...profile  // Spread profile data
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### React Frontend (Load profile)

```javascript
// Dashboard.js - checkUserProfile()

async checkUserProfile() {
  const userId = this.getUserIdFromAuth();

  // Step 1: Check localStorage first (fast)
  const cachedProfile = localStorage.getItem(`userProfile_${userId}`);
  const isProfileComplete = localStorage.getItem(`profileComplete_${userId}`);

  if (cachedProfile && isProfileComplete === 'true') {
    console.log('Profile found in cache');
    this.setState({
      userProfile: JSON.parse(cachedProfile),
      profileComplete: true
    });
    return; // Use cache, no need to fetch
  }

  // Step 2: Fetch from backend (persistent)
  try {
    const response = await fetch('/api/onboarding/user-profile/get', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    const data = await response.json();

    if (data.success && data.profile) {
      const profile = data.profile;

      // Save to localStorage for next time
      localStorage.setItem(`userProfile_${userId}`, JSON.stringify(profile));
      localStorage.setItem(`profileComplete_${userId}`, 'true');

      // Update state
      this.setState({
        userProfile: profile,
        profileComplete: true
      });

      console.log('Profile synced from backend:', profile.nid_hash);
    } else {
      console.warn('No profile found, show onboarding');
      this.setState({ profileComplete: false });
    }
  } catch (error) {
    console.error('Profile fetch failed:', error);
    // Continue with cache if available
    if (cachedProfile) {
      this.setState({
        userProfile: JSON.parse(cachedProfile),
        profileComplete: true
      });
    }
  }
}
```

---

## 📊 SQL Query Examples

### Create User Node

```sql
INSERT INTO node_core (
  owner_id,
  nid_hash,
  node_type,
  node_state,
  state_hash,
  field_map,
  perm_blob,
  ui_blob,
  dna_blob,
  rule_blob,
  runtime_blob,
  memory_blob,
  sys_blob,
  karma_score,
  trust_score,
  health_score,
  created_at,
  updated_at
) VALUES (
  'user-uuid-here',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'living',
  'ACTIVE',
  'state-hash-here',
  E'\\x7b226675...', -- bytea profile
  E'\\x7b226...', -- bytea permissions
  E'\\x7b227...',  -- bytea ui
  E'\\x7b227...',  -- bytea dna
  E'\\x7b227...',  -- bytea rules
  E'\\x7b227...',  -- bytea runtime
  E'\\x5b5d',      -- bytea memory (empty array [])
  E'\\x7b227...',  -- bytea sys
  0,
  50,
  100,
  NOW(),
  NOW()
)
RETURNING *;
```

### Fetch User Profile

```sql
-- Get user node with all data
SELECT 
  row_id,
  owner_id,
  nid_hash,
  node_type,
  node_state,
  field_map,           -- Profile data
  perm_blob,          -- Permissions
  ui_blob,            -- UI layout
  karma_score,
  trust_score,
  created_at,
  updated_at
FROM node_core
WHERE nid_hash = 'e3b0c442...'
  AND node_type = 'living'
LIMIT 1;
```

### Update Profile

```sql
UPDATE node_core
SET 
  field_map = E'\\x7b226675...', -- Updated profile bytea
  updated_at = NOW(),
  state_hash = 'new-state-hash'
WHERE nid_hash = 'e3b0c442...'
RETURNING *;
```

### Get User's Relationships

```sql
-- See what user has access to
SELECT 
  relation_type,
  metadata,
  created_at
FROM node_relationships
WHERE parent_node = (
  SELECT row_id FROM node_core 
  WHERE nid_hash = 'e3b0c442...'
)
ORDER BY created_at DESC;
```

### Search by Vector Similarity

```sql
-- Find similar profiles
SELECT 
  nc.row_id,
  nc.nid_hash,
  nc.node_type,
  nvm.content,
  nvm.embedding <-> ARRAY[0.1, 0.2, ...]::vector AS distance
FROM node_vector_memory nvm
JOIN node_core nc ON nvm.node_id = nc.row_id
WHERE nc.owner_id = 'user-uuid'
ORDER BY nvm.embedding <-> ARRAY[0.1, 0.2, ...]::vector
LIMIT 10;
```

---

## 🔍 Debugging Checklist

```
When profile doesn't persist, check:

☐ Is nid_hash calculated correctly?
  SELECT SHA256(owner_id) = nid_hash FROM node_core

☐ Is field_map stored?
  SELECT LENGTH(field_map), field_map FROM node_core WHERE nid_hash = ?

☐ Can we decode field_map?
  SELECT convert_from(field_map, 'UTF-8') FROM node_core

☐ Is node_state ACTIVE?
  SELECT node_state FROM node_core WHERE nid_hash = ?

☐ Is localStorage set?
  console.log(localStorage.getItem(`userProfile_${userId}`))

☐ Can we fetch it back?
  SELECT field_map FROM node_core WHERE nid_hash = ?

☐ Is RLS blocking access?
  SELECT * FROM node_core WHERE owner_id = current_user_id()

☐ Is Supabase JWT valid?
  console.log(decode JWT token from localStorage)
```

---

## 🎓 Summary

```
┌──────────────────────────────────────────────────────────┐
│ QUICK MEMORY JOGGER:                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 1. Profile goes in: field_map (bytea in node_core)      │
│                                                          │
│ 2. Calculation:    nid_hash = SHA256(owner_id)          │
│                                                          │
│ 3. Hierarchy:      parent_nid_hash = parent's nid_hash  │
│                                                          │
│ 4. Encoding:       JSON → Buffer → hex → BYTEA          │
│                                                          │
│ 5. Decoding:       BYTEA → Buffer → hex → JSON          │
│                                                          │
│ 6. Access:         Query by nid_hash (unique index)     │
│                                                          │
│ 7. Relationships:  Define who can see what              │
│                                                          │
│ 8. No ASL table:   All permissions via relationships    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

This is your complete reference for node_core! 🚀
