# 🎯 PHASE 1: Identity Layer Implementation

**Status**: Backend ✅ + Frontend ✅ Running  
**Start Time**: February 4, 2026  
**Estimated Duration**: 3 weeks (Weeks 1-3)  
**Team Size**: 2-3 developers  

---

## ✅ COMPLETED

- [x] Backend server running on port 3000
- [x] React app built and serving from backend
- [x] Supabase credentials configured
- [x] OpenAI API key configured
- [x] Health check endpoint working
- [x] Architecture documentation complete
- [x] Database schema guide created
- [x] Implementation roadmap defined

---

## 🔧 IMMEDIATE NEXT STEPS (This Week)

### TASK 1: Create Identity Layer Tables (4 hours)

Run these SQL migrations in Supabase:

```sql
-- 1. users_core table
CREATE TABLE users_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'supabase',
  auth_user_id TEXT,
  password_hash TEXT,
  avatar_url TEXT,
  profile_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 2. node_identity table
CREATE TABLE node_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_core(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  node_uuid TEXT UNIQUE NOT NULL,
  brand_context JSONB DEFAULT '{"brands": ["vanshavalli"], "roles": {}, "permissions": {}, "features": {}}',
  memory_context JSONB DEFAULT '{"recent_actions": [], "preferences": {}, "bookmarks": []}',
  semantic_fingerprint VECTOR(1536),
  trust_score FLOAT DEFAULT 0.5,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. device_sessions table
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_core(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_os TEXT,
  device_name TEXT,
  ip_address INET,
  user_agent TEXT,
  last_seen TIMESTAMP,
  token_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- 4. trust_state table
CREATE TABLE trust_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID NOT NULL REFERENCES node_identity(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES node_identity(id) ON DELETE CASCADE,
  trust_level INT CHECK (trust_level >= 0 AND trust_level <= 5),
  trust_type TEXT,
  context TEXT,
  last_verified TIMESTAMP,
  verification_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users_core(email);
CREATE INDEX idx_users_phone ON users_core(phone);
CREATE INDEX idx_node_user_id ON node_identity(user_id);
CREATE INDEX idx_sessions_user_id ON device_sessions(user_id);
CREATE INDEX idx_trust_from_node ON trust_state(from_node_id);
CREATE INDEX idx_trust_to_node ON trust_state(to_node_id);
```

**How to run**:
1. Go to [Supabase Dashboard](https://supabase.com)
2. Open SQL Editor
3. Paste the above SQL
4. Click "Run"

---

### TASK 2: Create Node Core Service (6 hours)

Create file: `botmantra-backend/services/node-core.js`

```javascript
/**
 * Node Core Identity System
 * Manages user identity, node creation, and trust relationships
 */

const { supabase } = require('../config/supabase');

class NodeCoreService {
  /**
   * Create a new user account and their node identity
   * @param {Object} userData - { email, full_name, phone, password }
   * @returns {Object} - { success, user_id, node_id, error }
   */
  async createUser(userData) {
    try {
      const { email, full_name, phone, password } = userData;

      // 1. Create user in users_core table
      const { data: user, error: userError } = await supabase
        .from('users_core')
        .insert({
          email,
          full_name,
          phone,
          status: 'active'
        })
        .select()
        .single();

      if (userError) throw userError;

      // 2. Create node identity for user
      const nodeUuid = `user_${user.id.substring(0, 8)}`;
      const { data: node, error: nodeError } = await supabase
        .from('node_identity')
        .insert({
          user_id: user.id,
          node_type: 'user',
          node_uuid: nodeUuid,
          brand_context: {
            brands: ['vanshavalli'],
            roles: { vanshavalli: 'member' },
            permissions: { vanshavalli: [] },
            features: { vanshavalli: [] }
          }
        })
        .select()
        .single();

      if (nodeError) throw nodeError;

      return {
        success: true,
        user_id: user.id,
        node_id: node.id,
        message: 'User and node created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a user's node identity with context
   * @param {string} userId - User ID
   * @returns {Object} - Complete node context
   */
  async getNodeContext(userId) {
    try {
      const { data: user } = await supabase
        .from('users_core')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: node } = await supabase
        .from('node_identity')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: devices } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      return {
        user,
        node,
        devices,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to load node context: ${error.message}`);
    }
  }

  /**
   * Add a trust relationship between two nodes
   * @param {string} fromNodeId - Source node ID
   * @param {string} toNodeId - Target node ID
   * @param {number} trustLevel - 0-5 scale
   * @param {string} trustType - 'family', 'colleague', etc.
   */
  async addTrustRelationship(fromNodeId, toNodeId, trustLevel, trustType) {
    try {
      const { data, error } = await supabase
        .from('trust_state')
        .insert({
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
          trust_level: trustLevel,
          trust_type: trustType,
          last_verified: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        trust_relationship: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get trust level between two nodes
   */
  async getTrustLevel(fromNodeId, toNodeId) {
    try {
      const { data, error } = await supabase
        .from('trust_state')
        .select('trust_level, trust_type')
        .eq('from_node_id', fromNodeId)
        .eq('to_node_id', toNodeId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Record device session
   */
  async createDeviceSession(userId, deviceInfo) {
    try {
      const { data, error } = await supabase
        .from('device_sessions')
        .insert({
          user_id: userId,
          device_id: deviceInfo.device_id,
          device_type: deviceInfo.device_type,
          device_os: deviceInfo.device_os,
          ip_address: deviceInfo.ip_address,
          user_agent: deviceInfo.user_agent,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        session: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NodeCoreService();
```

**Steps**:
1. Create the file above
2. Test with this endpoint (add to `server.js`):

```javascript
const nodeCoreService = require('./services/node-core');

app.post('/api/v1/node/create-user', async (req, res) => {
  try {
    const result = await nodeCoreService.createUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/node/context/:userId', async (req, res) => {
  try {
    const context = await nodeCoreService.getNodeContext(req.params.userId);
    res.json(context);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

---

### TASK 3: Build Kernel API Entry Point (5 hours)

Create file: `botmantra-backend/routes/routes-kernel-unified.js`

```javascript
/**
 * 🧠 UNIFIED KERNEL API
 * Universal entry point for all platforms
 * POST /kernel/execute
 */

const express = require('express');
const router = express.Router();

/**
 * Kernel Request Format:
 * {
 *   brand: "vanshavalli|mantravat|botmantra|jeetmantra|juniormantra",
 *   action: "function_name",
 *   context: { user_id, node_id, ... },
 *   payload: { ...action-specific data }
 * }
 */

router.post('/execute', async (req, res) => {
  try {
    const { brand, action, context, payload } = req.body;

    // Validation
    if (!brand || !action || !context) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Missing required: brand, action, context'
      });
    }

    // Route to appropriate handler
    const handler = getHandler(brand, action);
    if (!handler) {
      return res.status(404).json({
        success: false,
        error: 'UNKNOWN_ACTION',
        message: `No handler for ${brand}/${action}`
      });
    }

    // Execute
    const result = await handler(context, payload, req.supabase);

    res.json({
      success: true,
      status_code: 200,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status_code: 500,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

function getHandler(brand, action) {
  const handlers = {
    vanshavalli: {
      create_family_node: require('./handlers/vanshavalli/create-family-node'),
      add_family_relation: require('./handlers/vanshavalli/add-family-relation'),
      get_family_graph: require('./handlers/vanshavalli/get-family-graph'),
      save_family_memory: require('./handlers/vanshavalli/save-family-memory'),
      search_family_memory: require('./handlers/vanshavalli/search-family-memory')
    },
    mantravat: {
      register_business: require('./handlers/mantravat/register-business'),
      initialize_business: require('./handlers/mantravat/initialize-business')
    }
    // More platforms...
  };

  return handlers[brand]?.[action];
}

module.exports = router;
```

Add to `server.js`:

```javascript
const kernelRoutes = require('./routes/routes-kernel-unified');
app.use('/kernel', kernelRoutes);
```

---

### TASK 4: Build Vanshavalli Schema (3 hours)

Create file: `botmantra-backend/migrations/001-vanshavalli-schema.sql`

Run in Supabase SQL Editor:

```sql
-- Family Nodes
CREATE TABLE family_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  user_id UUID REFERENCES users_core(id),
  node_id UUID NOT NULL REFERENCES node_identity(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  role TEXT DEFAULT 'member',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Family Edges (Relationships)
CREATE TABLE family_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  from_node_id UUID NOT NULL REFERENCES family_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES family_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  relationship_label TEXT,
  trust_level INT DEFAULT 5,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Family Memories
CREATE TABLE family_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  created_by_node_id UUID NOT NULL REFERENCES family_nodes(id),
  title TEXT NOT NULL,
  description TEXT,
  memory_date DATE,
  media_urls TEXT[],
  tagged_nodes UUID[],
  visibility TEXT DEFAULT 'family',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_family_nodes_family_id ON family_nodes(family_id);
CREATE INDEX idx_family_edges_family_id ON family_edges(family_id);
CREATE INDEX idx_family_memories_family_id ON family_memories(family_id);
```

---

## 📋 CHECKLIST FOR THIS WEEK

- [ ] Create users_core table in Supabase
- [ ] Create node_identity table in Supabase
- [ ] Create device_sessions table in Supabase
- [ ] Create trust_state table in Supabase
- [ ] Create Node Core Service (node-core.js)
- [ ] Test Node Core functions via API
- [ ] Create Kernel API entry point
- [ ] Test Kernel with simple request
- [ ] Create Vanshavalli schema in Supabase
- [ ] Test family node creation
- [ ] Document any issues found

---

## 🧪 HOW TO TEST

### Test 1: Create User
```bash
curl -X POST http://localhost:3000/api/v1/node/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890"
  }'
```

### Test 2: Get Node Context
```bash
curl http://localhost:3000/api/v1/node/context/USER_ID_HERE
```

### Test 3: Kernel API
```bash
curl -X POST http://localhost:3000/kernel/execute \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "vanshavalli",
    "action": "create_family_node",
    "context": {
      "user_id": "USER_ID",
      "node_id": "NODE_ID"
    },
    "payload": {
      "name": "John",
      "role": "Family Head"
    }
  }'
```

---

## 📚 REFERENCES

- Full Database Schema: [DATABASE_SCHEMA_GUIDE.md](DATABASE_SCHEMA_GUIDE.md)
- Kernel Specification: [KERNEL_API_SPECIFICATION.md](KERNEL_API_SPECIFICATION.md)
- Implementation Roadmap: [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)
- Platform Specs: [PLATFORM_SPECIFICATIONS.md](PLATFORM_SPECIFICATIONS.md)

---

## 🆘 HELP

If you get stuck:
1. Check error message carefully
2. Review the referenced documentation
3. Check database for table existence: `SELECT * FROM information_schema.tables WHERE table_schema='public'`
4. Run health check: `curl http://localhost:3000/health`

---

**Ready to start Phase 1?** Follow the tasks above in order!
