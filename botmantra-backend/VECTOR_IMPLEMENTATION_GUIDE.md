# 🔧 VECTOR IMPLEMENTATION GUIDE
**How to Add Vectors to Your Existing Auth + Node Core System**

**Status**: Implementation roadmap  
**Complexity**: Medium (7-10 days for full integration)  
**Dependencies**: OpenAI API key, pgvector extension

---

## 📦 WHAT YOU NEED

### Database Setup
```sql
-- Enable pgvector extension (if not exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embedding_type TEXT NOT NULL,              -- 'node_core', 'user_profile', 'business', 'permission', 'cache', etc
  reference_id UUID NOT NULL,                -- The ID of what this vector represents
  reference_table TEXT NOT NULL,             -- 'node_core', 'users', 'businesses', etc
  content TEXT NOT NULL,                     -- Original text that was embedded
  embedding vector(1536) NOT NULL,           -- The 1536D vector from OpenAI
  similarity_score FLOAT,                    -- For caching search results
  auth_level TEXT DEFAULT 'business',        -- 'node_only', 'user_only', 'role_based', 'business'
  owner_id UUID NOT NULL,                    -- User who created/owns this
  business_id UUID NOT NULL,                 -- Business context
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ttl INTERVAL,                              -- Time to live (for cache vectors)
  metadata JSONB,                            -- Additional context
  
  CONSTRAINT fk_business FOREIGN KEY (business_id) 
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_owner FOREIGN KEY (owner_id) 
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create vector index for fast similarity search
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);

-- Create semantic cache table
CREATE TABLE semantic_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,                  -- The user query
  query_embedding vector(1536) NOT NULL,     -- Embedding of query
  cached_answer TEXT NOT NULL,               -- The cached result
  similarity_threshold FLOAT DEFAULT 0.85,   -- Minimum similarity for cache hit
  hit_count INT DEFAULT 0,                   -- How many times used
  business_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  accessed_at TIMESTAMP,
  ttl INTERVAL DEFAULT '7 days'::interval,   -- Cache validity
  expires_at TIMESTAMP,
  is_valid BOOLEAN DEFAULT true,
  
  CONSTRAINT fk_business FOREIGN KEY (business_id) 
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_owner FOREIGN KEY (owner_id) 
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ON semantic_cache USING hnsw (query_embedding vector_cosine_ops);

-- Create vector references table
CREATE TABLE vector_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT NOT NULL,                     -- nid_hash
  embedding_id UUID NOT NULL,                -- Reference to embeddings table
  embedding_type TEXT NOT NULL,              -- Type of embedding
  auth_required BOOLEAN DEFAULT true,
  permission_level TEXT,                     -- 'owner', 'role', 'business'
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT fk_embedding FOREIGN KEY (embedding_id) 
    REFERENCES embeddings(id) ON DELETE CASCADE
);

-- RLS Policy: Users can only see their own business vectors
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY embeddings_business_isolation ON embeddings
  FOR SELECT
  USING (
    business_id = (SELECT business_id FROM users WHERE id = current_user_id)
  );

CREATE POLICY embeddings_owner_access ON embeddings
  FOR SELECT
  USING (
    owner_id = current_user_id OR 
    auth_level = 'business' OR
    (auth_level = 'role_based' AND can_user_role_access())  -- Your permission function
  );

-- RLS Policy: Semantic cache
ALTER TABLE semantic_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY cache_business_isolation ON semantic_cache
  FOR SELECT
  USING (
    business_id = (SELECT business_id FROM users WHERE id = current_user_id)
  );
```

### Node.js Dependencies
```bash
npm install openai dotenv
```

---

## 🔑 ENVIRONMENT SETUP

**.env file**:
```env
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
OPENAI_CHAT_MODEL=gpt-4-turbo
VECTOR_CACHE_TTL=604800  # 7 days in seconds
SIMILARITY_THRESHOLD=0.85
```

---

## 💻 IMPLEMENTATION CODE

### 1. CREATE VECTOR SERVICE

**File**: `services/vector-service.js`

```javascript
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');

class VectorService {
  constructor(supabaseUrl, serviceRoleKey, openaiApiKey) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.embeddingDimensions = 1536;
  }

  /**
   * Generate embedding for text (OpenAI)
   */
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text,
        dimensions: this.embeddingDimensions,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Store embedding in database
   */
  async storeEmbedding({
    type,              // 'node_core', 'user_profile', 'permission_matrix', etc
    content,           // Text that was embedded
    embedding,         // The vector [1536D]
    referenceId,       // UUID of what this represents
    referenceTable,    // Table name (node_core, users, etc)
    businessId,
    ownerId,
    authLevel = 'business',
    metadata = {}
  }) {
    try {
      const { data, error } = await this.supabase
        .from('embeddings')
        .insert([{
          embedding_type: type,
          reference_id: referenceId,
          reference_table: referenceTable,
          content,
          embedding,
          business_id: businessId,
          owner_id: ownerId,
          auth_level: authLevel,
          metadata,
          created_at: new Date(),
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Failed to store embedding:', error);
      throw error;
    }
  }

  /**
   * Vector similarity search
   */
  async similaritySearch({
    queryEmbedding,
    businessId,
    limit = 10,
    threshold = 0.85,
    embeddingType = null
  }) {
    try {
      let query = this.supabase
        .from('embeddings')
        .select('*, similarity: (embedding <=> $1) as similarity')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .gte('similarity', threshold)
        .order('similarity', { ascending: false })
        .limit(limit);

      if (embeddingType) {
        query = query.eq('embedding_type', embeddingType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Similarity search failed:', error);
      throw error;
    }
  }

  /**
   * Create + store embedding in one call
   */
  async embedAndStore({
    type,
    content,
    referenceId,
    referenceTable,
    businessId,
    ownerId,
    authLevel = 'business'
  }) {
    try {
      // Step 1: Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Step 2: Store embedding
      const result = await this.storeEmbedding({
        type,
        content,
        embedding,
        referenceId,
        referenceTable,
        businessId,
        ownerId,
        authLevel
      });

      return result;
    } catch (error) {
      console.error('embedAndStore failed:', error);
      throw error;
    }
  }

  /**
   * Cache lookup: Find similar query in cache
   */
  async cacheHitLookup(queryEmbedding, businessId, threshold = 0.85) {
    try {
      const { data, error } = await this.supabase
        .from('semantic_cache')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_valid', true)
        .gte('(query_embedding <=> $1)', 1 - threshold)  // Similarity >= threshold
        .order('(query_embedding <=> $1)', { ascending: true })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        // Update hit count
        await this.supabase
          .from('semantic_cache')
          .update({ 
            hit_count: data[0].hit_count + 1,
            accessed_at: new Date()
          })
          .eq('id', data[0].id);

        return data[0];
      }

      return null;
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return null;  // On error, just skip cache
    }
  }

  /**
   * Save query + response to semantic cache
   */
  async saveCacheEntry({
    queryText,
    queryEmbedding,
    answer,
    businessId,
    ownerId
  }) {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (process.env.VECTOR_CACHE_TTL || 604800));

      const { data, error } = await this.supabase
        .from('semantic_cache')
        .insert([{
          query_text: queryText,
          query_embedding: queryEmbedding,
          cached_answer: answer,
          business_id: businessId,
          owner_id: ownerId,
          expires_at: expiresAt,
          is_valid: true,
          created_at: new Date()
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Failed to save cache entry:', error);
      // Don't fail the request just because cache failed
      return null;
    }
  }

  /**
   * Invalidate cache entries similar to a query
   */
  async invalidateSimilarCache(queryEmbedding, businessId, threshold = 0.85) {
    try {
      const similar = await this.similaritySearch({
        queryEmbedding,
        businessId,
        threshold,
        embeddingType: null
      });

      if (similar && similar.length > 0) {
        const ids = similar.map(item => item.id);
        await this.supabase
          .from('semantic_cache')
          .update({ is_valid: false })
          .in('id', ids);
      }

      return { invalidated: similar ? similar.length : 0 };
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      return { invalidated: 0 };
    }
  }

  /**
   * Register vector reference (link vector to node)
   */
  async registerVectorReference({
    nodeId,        // nid_hash
    embeddingId,   // ID from embeddings table
    embeddingType,
    permissionLevel = 'role'
  }) {
    try {
      const { data, error } = await this.supabase
        .from('vector_references')
        .insert([{
          node_id: nodeId,
          embedding_id: embeddingId,
          embedding_type: embeddingType,
          permission_level: permissionLevel,
          is_active: true,
          created_at: new Date()
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Failed to register vector reference:', error);
      throw error;
    }
  }

  /**
   * Get all vectors for a node
   */
  async getNodeVectors(nodeId) {
    try {
      const { data, error } = await this.supabase
        .from('vector_references')
        .select(`
          id,
          embedding_type,
          permission_level,
          embeddings (id, embedding_type, content, created_at)
        `)
        .eq('node_id', nodeId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get node vectors:', error);
      return [];
    }
  }
}

module.exports = VectorService;
```

---

### 2. INTEGRATE WITH SIGNUP (Phase 3)

**File**: `routes/auth.js` (modified)

```javascript
const VectorService = require('../services/vector-service');

const vectorService = new VectorService(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.OPENAI_API_KEY
);

/**
 * SIGNUP endpoint - Create user + node_core + vectors
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      fullName,
      dob,
      address,
      businessId,
      timezone
    } = req.body;

    // Step 1: Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Step 2: Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email,
        phone,
        password_hash: passwordHash,
        full_name: fullName,
        dob,
        address,
        timezone,
        business_id: businessId,
        is_active: true
      }])
      .select()
      .single();

    if (userError) throw userError;
    const userId = newUser.id;

    // Step 3: Create node_core record
    const nidHash = `node_${userId.substring(0, 8)}_${Date.now()}`;
    
    // Generate system prompt + context with OpenAI
    const systemPromptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{
        role: 'system',
        content: 'Generate a system prompt for a Node Core (AI assistant) for this user.'
      }, {
        role: 'user',
        content: `User: ${fullName}, Role: Admin, Business: ${businessId || 'Default'}`
      }],
      temperature: 0.3,
      max_tokens: 500
    });

    const systemPrompt = systemPromptResponse.choices[0].message.content;

    // Create node_core
    const { data: nodeCore, error: nodeError } = await supabase
      .from('node_core')
      .insert([{
        nid_hash: nidHash,
        node_name: `${fullName}'s Node Core`,
        owner_id: userId,
        business_id: businessId,
        system_prompt: systemPrompt,
        node_context: {
          user: { id: userId, name: fullName },
          created_at: new Date()
        },
        is_activated: true,
        can_execute: true,
        trust_score: 0,
        reputation_level: 0,
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }])
      .select()
      .single();

    if (nodeError) throw nodeError;

    // ✨ PHASE 3: CREATE VECTORS ✨
    // Vector 1: Node Core Identity
    const nodeEmbedding = await vectorService.embedAndStore({
      type: 'node_core',
      content: systemPrompt,
      referenceId: nidHash,
      referenceTable: 'node_core',
      businessId,
      ownerId: userId,
      authLevel: 'node_only'
    });

    // Vector 2: User Profile
    const userProfileText = `User: ${fullName}, Role: Admin, Timezone: ${timezone}`;
    const userEmbedding = await vectorService.embedAndStore({
      type: 'user_profile',
      content: userProfileText,
      referenceId: userId,
      referenceTable: 'users',
      businessId,
      ownerId: userId,
      authLevel: 'user_only'
    });

    // Vector 3: Permission Matrix
    const permissionText = JSON.stringify({
      canRead: ['all'],
      canWrite: ['users', 'profiles'],
      canDelete: ['own_records'],
      role: 'admin'
    });
    const permissionEmbedding = await vectorService.embedAndStore({
      type: 'permission_matrix',
      content: permissionText,
      referenceId: userId,
      referenceTable: 'users',
      businessId,
      ownerId: userId,
      authLevel: 'role_based'
    });

    // Register vectors with node
    await vectorService.registerVectorReference({
      nodeId: nidHash,
      embeddingId: nodeEmbedding.id,
      embeddingType: 'node_core',
      permissionLevel: 'owner'
    });

    await vectorService.registerVectorReference({
      nodeId: nidHash,
      embeddingId: userEmbedding.id,
      embeddingType: 'user_profile',
      permissionLevel: 'owner'
    });

    await vectorService.registerVectorReference({
      nodeId: nidHash,
      embeddingId: permissionEmbedding.id,
      embeddingType: 'permission_matrix',
      permissionLevel: 'role'
    });

    // Step 4: Update user with node_core_id
    await supabase
      .from('users')
      .update({ node_core_id: nidHash })
      .eq('id', userId);

    // Generate JWT
    const token = jwt.sign({
      userId,
      businessId,
      nodeId: nidHash
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: newUser,
      nodeId: nidHash,
      vectorsCreated: 3,
      message: 'User created with vectors initialized'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### 3. INTEGRATE WITH UI LOAD (Phase 4)

**File**: `routes/ui.js` (new endpoint)

```javascript
router.get('/config', async (req, res) => {
  try {
    const { businessId, userId } = req.query;

    // Load UI templates
    const { data: templates } = await supabase
      .from('ui_template_layouts')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    // Load schemas
    const { data: schemas } = await supabase
      .from('data_model_registry')
      .select('*')
      .eq('business_id', businessId);

    const uiConfig = {
      templates,
      schemas,
      loadedAt: new Date()
    };

    // ✨ CREATE UI STATE SNAPSHOT VECTOR ✨
    const uiSnapshot = await vectorService.embedAndStore({
      type: 'ui_state_snapshot',
      content: JSON.stringify(uiConfig),
      referenceId: userId,
      referenceTable: 'users',
      businessId,
      ownerId: userId,
      authLevel: 'user_only'
    });

    // Get user's node and register vector
    const { data: user } = await supabase
      .from('users')
      .select('node_core_id')
      .eq('id', userId)
      .single();

    if (user && user.node_core_id) {
      await vectorService.registerVectorReference({
        nodeId: user.node_core_id,
        embeddingId: uiSnapshot.id,
        embeddingType: 'ui_state_snapshot'
      });
    }

    // Return config + vector info
    res.json({
      config: uiConfig,
      vector: {
        id: uiSnapshot.id,
        type: 'ui_state_snapshot'
      }
    });

  } catch (error) {
    console.error('UI config error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### 4. INTEGRATE WITH RAG (Phase 5-6)

**File**: `routes/rag.js` (new)

```javascript
router.post('/query', async (req, res) => {
  try {
    const { question, businessId, userId } = req.body;

    // Step 1: Generate embedding for question
    const queryEmbedding = await vectorService.generateEmbedding(question);

    // Step 2: Check semantic cache first
    const cacheHit = await vectorService.cacheHitLookup(queryEmbedding, businessId);
    
    if (cacheHit) {
      return res.json({
        answer: cacheHit.cached_answer,
        source: 'cache',
        similarity: cacheHit.hit_count
      });
    }

    // Step 3: Search knowledge base (vector similarity)
    const contextDocs = await vectorService.similaritySearch({
      queryEmbedding,
      businessId,
      embeddingType: 'knowledge_base',
      limit: 5,
      threshold: 0.85
    });

    // Step 4: Call OpenAI with context
    const context = contextDocs.map(d => d.content).join('\n\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{
        role: 'system',
        content: 'You are a helpful AI assistant with access to company knowledge.'
      }, {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`
      }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const answer = response.choices[0].message.content;

    // Step 5: Save to semantic cache
    await vectorService.saveCacheEntry({
      queryText: question,
      queryEmbedding,
      answer,
      businessId,
      ownerId: userId
    });

    // Step 6: Create embedding for this query (audit trail)
    await vectorService.embedAndStore({
      type: 'query_record',
      content: `Question: ${question}\nAnswer: ${answer}`,
      referenceId: userId,
      referenceTable: 'users',
      businessId,
      ownerId: userId,
      authLevel: 'user_only',
      metadata: {
        question,
        answer,
        contextDocs: contextDocs.length
      }
    });

    res.json({
      answer,
      source: 'openai',
      contextDocs: contextDocs.length,
      cached: false
    });

  } catch (error) {
    console.error('RAG query error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🧪 TESTING CHECKLIST

```javascript
// Test Vector Creation
async function testVectorCreation() {
  const embedding = await vectorService.generateEmbedding('Test text');
  console.log('✓ Embedding generated:', embedding.length, 'dimensions');
  
  const stored = await vectorService.storeEmbedding({...});
  console.log('✓ Embedding stored:', stored.id);
}

// Test Similarity Search
async function testSimilaritySearch() {
  const results = await vectorService.similaritySearch({
    queryEmbedding: [...],
    businessId: 'uuid',
    limit: 5,
    threshold: 0.85
  });
  console.log('✓ Found', results.length, 'similar vectors');
}

// Test Cache Hit
async function testCache() {
  const hit = await vectorService.cacheHitLookup([...], 'business-uuid');
  if (hit) {
    console.log('✓ Cache hit:', hit.cached_answer);
  } else {
    console.log('✓ No cache hit (expected on first query)');
  }
}

// Test Full Flow
async function testSignupWithVectors() {
  // Signup creates 3 vectors
  // Check: embeddings table has 3 new rows
  // Check: vector_references has 3 new rows
  // Check: user.node_core_id is set
  console.log('✓ Full signup flow with vectors complete');
}
```

---

## ⚡ PERFORMANCE TIPS

```javascript
// 1. Batch embedding generation (multiple texts at once)
async function batchEmbed(texts) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts  // Array of strings
  });
  return response.data.map(d => d.embedding);
}

// 2. Cache embeddings in memory
const embeddingCache = new Map();
async function cachedEmbed(text) {
  const key = crypto.createHash('md5').update(text).digest('hex');
  if (embeddingCache.has(key)) {
    return embeddingCache.get(key);
  }
  const embedding = await vectorService.generateEmbedding(text);
  embeddingCache.set(key, embedding);
  return embedding;
}

// 3. Use pgvector index
// Already done in schema (HNSW index)
// pgvector automatically uses for similarity search

// 4. Lazy load vectors
// Only embed when needed, not for every field
// Example: Embed title + description, not individual fields
```

---

## 📝 MIGRATION STRATEGY

If you have existing data:

```javascript
async function migrateExistingData() {
  // Get all users without vectors
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, business_id')
    .is('vectors_migrated', null);

  for (const user of users) {
    try {
      // Create vectors for existing user
      const userText = `User: ${user.full_name}`;
      await vectorService.embedAndStore({
        type: 'user_profile',
        content: userText,
        referenceId: user.id,
        referenceTable: 'users',
        businessId: user.business_id,
        ownerId: user.id,
        authLevel: 'user_only'
      });

      // Mark migrated
      await supabase
        .from('users')
        .update({ vectors_migrated: true })
        .eq('id', user.id);

      console.log(`✓ Migrated vectors for ${user.full_name}`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${user.id}:`, error.message);
    }
  }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Add `vector` extension to Supabase
- [ ] Run database schema creation SQL
- [ ] Add OpenAI API key to environment
- [ ] Install `openai` npm package
- [ ] Create VectorService class
- [ ] Update signup endpoint to create vectors
- [ ] Update UI load endpoint to create snapshots
- [ ] Create RAG endpoints (query, search)
- [ ] Test signup → vectors → cache flow
- [ ] Monitor OpenAI API usage + costs
- [ ] Set up logging for vector operations
- [ ] Create backup strategy for embeddings
- [ ] Document vector naming conventions
- [ ] Train team on vector permissions

---

**Next**: Run database migrations → Update signup → Test complete flow

Document Created: January 28, 2026
Estimated Implementation Time: 7-10 days
Complexity: Medium | Risk: Low | Impact: High
