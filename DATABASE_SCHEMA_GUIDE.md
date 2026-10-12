# 📋 COMPREHENSIVE DATABASE SCHEMA GUIDE

**Database**: Supabase PostgreSQL  
**Vector Extension**: pgvector (1536-dim embeddings)  
**Total Tables**: 52  
**Vector Tables**: 11  

---

## GLOBAL IDENTITY LAYER (Shared Across All Platforms)

### 1. users_core
Foundation table for all user accounts.

```sql
CREATE TABLE users_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'supabase', -- 'supabase', 'google', 'apple'
  auth_user_id TEXT, -- Link to Supabase Auth
  password_hash TEXT,
  avatar_url TEXT,
  profile_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'deleted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users_core(email);
CREATE INDEX idx_users_phone ON users_core(phone);
CREATE INDEX idx_users_auth_provider ON users_core(auth_provider);
```

### 2. node_identity
Every user/entity gets a node in the knowledge graph.

```sql
CREATE TABLE node_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_core(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL, -- 'user', 'bot', 'device', 'service'
  node_uuid TEXT UNIQUE NOT NULL,
  brand_context JSONB DEFAULT '{
    "brands": ["vanshavalli"],
    "roles": {"vanshavalli": "member"},
    "permissions": {"vanshavalli": []},
    "features": {"vanshavalli": []}
  }',
  memory_context JSONB DEFAULT '{
    "recent_actions": [],
    "preferences": {},
    "bookmarks": []
  }',
  semantic_fingerprint VECTOR(1536), -- Node's semantic representation
  trust_score FLOAT DEFAULT 0.5,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_node_user_id ON node_identity(user_id);
CREATE INDEX idx_node_uuid ON node_identity(node_uuid);
```

### 3. device_sessions
Track active sessions across devices.

```sql
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_core(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'mobile', 'tablet', 'desktop'
  device_os TEXT, -- 'iOS', 'Android', 'Windows', 'macOS'
  device_name TEXT,
  ip_address INET,
  user_agent TEXT,
  last_seen TIMESTAMP,
  token_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON device_sessions(user_id);
CREATE INDEX idx_sessions_device_id ON device_sessions(device_id);
CREATE INDEX idx_sessions_active ON device_sessions(is_active);
```

### 4. trust_state
Relationship trust levels between nodes.

```sql
CREATE TABLE trust_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID NOT NULL REFERENCES node_identity(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES node_identity(id) ON DELETE CASCADE,
  trust_level INT CHECK (trust_level >= 0 AND trust_level <= 5), -- 0-5 scale
  trust_type TEXT, -- 'family', 'colleague', 'friend', 'vendor'
  context TEXT,
  last_verified TIMESTAMP,
  verification_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trust_from_node ON trust_state(from_node_id);
CREATE INDEX idx_trust_to_node ON trust_state(to_node_id);
CREATE UNIQUE INDEX idx_trust_unique ON trust_state(from_node_id, to_node_id);
```

---

## VANSHAVALLI - Family Graph Platform

### 5. family_nodes
Individual family members as nodes.

```sql
CREATE TABLE family_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  user_id UUID REFERENCES users_core(id),
  node_id UUID NOT NULL REFERENCES node_identity(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT, -- 'M', 'F', 'Other'
  role TEXT DEFAULT 'member', -- 'head', 'elder', 'member', 'child'
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  is_invite_pending BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_family_id ON family_nodes(family_id);
CREATE INDEX idx_family_user_id ON family_nodes(user_id);
```

### 6. family_edges
Relationships between family members.

```sql
CREATE TABLE family_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  from_node_id UUID NOT NULL REFERENCES family_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES family_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'parent', 'child', 'sibling', 'spouse', 'grandparent'
  relationship_label TEXT, -- 'Mother', 'Father', 'Brother', 'Sister'
  trust_level INT DEFAULT 5,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES family_nodes(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edges_family_id ON family_edges(family_id);
CREATE INDEX idx_edges_from_node ON family_edges(from_node_id);
CREATE INDEX idx_edges_to_node ON family_edges(to_node_id);
```

### 7. family_memories
Shared family moments and stories.

```sql
CREATE TABLE family_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  created_by_node_id UUID NOT NULL REFERENCES family_nodes(id),
  title TEXT NOT NULL,
  description TEXT,
  memory_date DATE,
  media_urls TEXT[],
  media_count INT DEFAULT 0,
  tagged_nodes UUID[],
  visibility TEXT DEFAULT 'family', -- 'private', 'family', 'public'
  location TEXT,
  sentiment_score FLOAT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_memories_family_id ON family_memories(family_id);
CREATE INDEX idx_memories_created_by ON family_memories(created_by_node_id);
```

### 8. family_memories_vectors
Vector embeddings for semantic search on memories.

```sql
CREATE TABLE family_memories_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_memory_vectors_embedding ON family_memories_vectors USING ivfflat (embedding vector_cosine_ops);
```

### 9. family_invites
Pending and accepted invitations.

```sql
CREATE TABLE family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  invited_by_node_id UUID NOT NULL REFERENCES family_nodes(id),
  invite_email TEXT NOT NULL,
  invite_phone TEXT,
  relationship TEXT, -- Expected relationship (Mother, Brother, etc.)
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  accepted_node_id UUID REFERENCES family_nodes(id),
  message TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_invites_family_id ON family_invites(family_id);
CREATE INDEX idx_invites_status ON family_invites(status);
```

### 10. conversation_history_vectors
Vector embeddings for family chat/conversation search.

```sql
CREATE TABLE conversation_history_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  speaker_node_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conv_vectors_embedding ON conversation_history_vectors USING ivfflat (embedding vector_cosine_ops);
```

---

## MANTRAVAT - Business OS Platform

### 11. businesses
Business account registry.

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  business_name TEXT NOT NULL,
  industry TEXT,
  country TEXT,
  team_size INT,
  logo_url TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'archived'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_businesses_created_by ON businesses(created_by_node_id);
CREATE INDEX idx_businesses_status ON businesses(status);
```

### 12. business_modules
Available modules per business (CRM, HR, Finance, etc.).

```sql
CREATE TABLE business_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL, -- 'crm', 'hr', 'finance', 'inventory', 'project'
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modules_business_id ON business_modules(business_id);
```

### 13. business_features
Features available within each module.

```sql
CREATE TABLE business_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES business_modules(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_name TEXT,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  access_level TEXT DEFAULT 'all', -- 'all', 'admin', 'premium'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_features_module_id ON business_features(module_id);
```

### 14. business_users
User access to businesses.

```sql
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES node_identity(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  permissions TEXT[],
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_business_user_unique ON business_users(business_id, node_id);
CREATE INDEX idx_business_users_role ON business_users(role);
```

### 15. business_tables (Dynamic Schema Registry)
Tracks all dynamically created tables for a business.

```sql
CREATE TABLE business_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  schema_definition JSONB NOT NULL, -- Table structure
  sql_name TEXT UNIQUE NOT NULL, -- Actual SQL table name
  row_count INT DEFAULT 0,
  created_by_node_id UUID REFERENCES node_identity(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_business_tables_business ON business_tables(business_id);
```

### 16. business_schema_history
Version history for schema changes.

```sql
CREATE TABLE business_schema_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_table_id UUID NOT NULL REFERENCES business_tables(id),
  change_type TEXT, -- 'created', 'added_column', 'removed_column', 'modified_column'
  change_details JSONB,
  changed_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schema_history_table ON business_schema_history(business_table_id);
```

---

## BOTMANTRA - AI Automation Platform

### 17. ai_agents
AI agent definitions.

```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  created_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  agent_name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  personality JSONB DEFAULT '{}',
  knowledge_namespace TEXT, -- Namespace in vector DB
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_business_id ON ai_agents(business_id);
CREATE INDEX idx_agents_active ON ai_agents(is_active);
```

### 18. ai_prompts
Prompt templates and versions.

```sql
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  prompt_title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prompts_agent_id ON ai_prompts(agent_id);
```

### 19. ai_documents
Uploaded documents for RAG (Retrieval Augmented Generation).

```sql
CREATE TABLE ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT, -- 'pdf', 'doc', 'txt', 'url'
  document_url TEXT,
  file_size INT,
  chunk_count INT DEFAULT 0,
  is_indexed BOOLEAN DEFAULT false,
  uploaded_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_agent_id ON ai_documents(agent_id);
```

### 20. rag_chunks
Document chunks for vector search.

```sql
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
  chunk_index INT,
  chunk_text TEXT NOT NULL,
  chunk_tokens INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON rag_chunks(document_id);
```

### 21. rag_chunks_vectors
Vector embeddings for document chunks.

```sql
CREATE TABLE rag_chunks_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES rag_chunks(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  namespace TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chunk_vectors_embedding ON rag_chunks_vectors USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chunk_vectors_namespace ON rag_chunks_vectors(namespace);
```

### 22. ai_workflows
Automation workflows.

```sql
CREATE TABLE ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  workflow_definition JSONB NOT NULL, -- Task sequence
  is_active BOOLEAN DEFAULT true,
  execution_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  created_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflows_agent_id ON ai_workflows(agent_id);
```

### 23. ai_tasks
Individual tasks within workflows.

```sql
CREATE TABLE ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES ai_workflows(id) ON DELETE CASCADE,
  task_order INT,
  task_name TEXT NOT NULL,
  task_type TEXT, -- 'execute_ai', 'send_email', 'webhook', 'database'
  task_config JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_workflow_id ON ai_tasks(workflow_id);
```

### 24. semantic_cache
Cache for expensive operations (cost optimization).

```sql
CREATE TABLE semantic_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_embedding VECTOR(1536) NOT NULL,
  query_text TEXT,
  response_text TEXT NOT NULL,
  cost_tokens INT,
  hit_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_cache_embedding ON semantic_cache USING ivfflat (query_embedding vector_cosine_ops);
CREATE INDEX idx_cache_expires ON semantic_cache(expires_at);
```

---

## JEETMANTRA - Education Platform

### 25. institutes
Educational institutions.

```sql
CREATE TABLE institutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  institute_name TEXT NOT NULL,
  institute_code TEXT UNIQUE,
  country TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_institutes_business_id ON institutes(business_id);
```

### 26. courses
Course definitions.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_code TEXT,
  grade_level INT,
  description TEXT,
  instructor_id UUID REFERENCES node_identity(id),
  course_material_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_institute_id ON courses(institute_id);
```

### 27. enrollments
Student enrollments.

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  student_node_id UUID NOT NULL REFERENCES node_identity(id),
  enrollment_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'dropped'
  grade TEXT,
  total_score FLOAT,
  passed BOOLEAN
);

CREATE UNIQUE INDEX idx_enrollment_unique ON enrollments(course_id, student_node_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
```

### 28. homework_assignments
Homework assignments.

```sql
CREATE TABLE homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  assigned_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  max_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_homework_course_id ON homework_assignments(course_id);
```

### 29. homework_submissions
Student homework submissions.

```sql
CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES homework_assignments(id),
  student_node_id UUID NOT NULL REFERENCES node_identity(id),
  submission_text TEXT,
  submission_file_url TEXT,
  submitted_at TIMESTAMP,
  score FLOAT,
  feedback TEXT,
  graded_by_node_id UUID REFERENCES node_identity(id),
  graded_at TIMESTAMP
);

CREATE INDEX idx_submissions_assignment ON homework_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON homework_submissions(student_node_id);
```

### 30. exams
Exam/test definitions.

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  exam_name TEXT NOT NULL,
  exam_date DATE,
  duration_minutes INT,
  total_questions INT,
  max_score FLOAT,
  exam_type TEXT, -- 'quiz', 'midterm', 'final', 'practice'
  created_by_node_id UUID NOT NULL REFERENCES node_identity(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exams_course_id ON exams(course_id);
```

### 31. exam_results
Student exam results.

```sql
CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id),
  student_node_id UUID NOT NULL REFERENCES node_identity(id),
  score FLOAT,
  total_questions INT,
  correct_answers INT,
  time_taken_minutes INT,
  completed_at TIMESTAMP,
  is_passed BOOLEAN
);

CREATE UNIQUE INDEX idx_exam_result_unique ON exam_results(exam_id, student_node_id);
```

### 32. learning_progress
Aggregated student progress.

```sql
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_node_id UUID NOT NULL REFERENCES node_identity(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  assignments_completed INT DEFAULT 0,
  assignments_total INT DEFAULT 0,
  average_score FLOAT DEFAULT 0,
  hours_studied INT DEFAULT 0,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_progress_unique ON learning_progress(student_node_id, course_id);
```

### 33. lecture_notes_vectors
Vector embeddings for course materials.

```sql
CREATE TABLE lecture_notes_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  note_title TEXT,
  note_content TEXT,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_vectors_embedding ON lecture_notes_vectors USING ivfflat (embedding vector_cosine_ops);
```

---

## JUNIORMANTRA - Kids Learning Platform

### 34. child_profiles
Child account information.

```sql
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_core(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  date_of_birth DATE,
  avatar_url TEXT,
  grade_level INT,
  interests TEXT[],
  learning_style TEXT, -- 'visual', 'auditory', 'kinesthetic'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_child_user_id ON child_profiles(user_id);
```

### 35. guardian_map
Relationship between guardians and children.

```sql
CREATE TABLE guardian_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_node_id UUID NOT NULL REFERENCES node_identity(id),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id),
  relationship TEXT, -- 'parent', 'teacher', 'sibling'
  permissions JSONB DEFAULT '{"view_progress": true, "set_limits": true}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_guardian_map_unique ON guardian_map(guardian_node_id, child_profile_id);
```

### 36. content_library
Curated learning content for kids.

```sql
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_title TEXT NOT NULL,
  content_type TEXT, -- 'video', 'story', 'game', 'quiz'
  description TEXT,
  thumbnail_url TEXT,
  content_url TEXT,
  age_range_min INT,
  age_range_max INT,
  duration_minutes INT,
  subject TEXT, -- 'math', 'science', 'language', 'creativity'
  difficulty_level INT, -- 1-5
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_age_range ON content_library(age_range_min, age_range_max);
```

### 37. activity_log
Track child activities for engagement.

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id),
  content_id UUID REFERENCES content_library(id),
  activity_type TEXT, -- 'viewed', 'completed', 'shared', 'liked'
  duration_minutes INT,
  score INT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_child_id ON activity_log(child_profile_id);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp);
```

### 38. reward_points
Gamification and reward tracking.

```sql
CREATE TABLE reward_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id),
  points_earned INT,
  reason TEXT, -- 'completed_activity', 'daily_login', 'achievement'
  achievement_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_child_id ON reward_points(child_profile_id);
```

### 39. parental_controls
Settings for screen time and content filters.

```sql
CREATE TABLE parental_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id),
  guardian_node_id UUID NOT NULL REFERENCES node_identity(id),
  daily_limit_minutes INT DEFAULT 120,
  bedtime_start TIME,
  bedtime_end TIME,
  content_filter_level INT DEFAULT 3, -- 1(open) to 5(strict)
  allowed_subjects TEXT[],
  blocked_keywords TEXT[],
  enable_purchases BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_controls_unique ON parental_controls(child_profile_id, guardian_node_id);
```

---

## VECTOR NAMESPACES (pgvector Strategy)

All vector embeddings use these namespaces:

```
vector_family_memories       - Vanshavalli family photos/stories
vector_family_conversations  - Vanshavalli chat history
vector_business_docs         - MantraVat knowledge base
vector_ai_rag               - BotMantra documents
vector_education_materials   - JeetMantra course content
vector_kids_content         - JuniorMantra story/game embeddings
```

---

## KEY INDEXES FOR PERFORMANCE

```sql
-- Fast user lookups
CREATE INDEX idx_users_email ON users_core(email);
CREATE INDEX idx_users_phone ON users_core(phone);

-- Fast family tree traversal
CREATE INDEX idx_family_edges_family ON family_edges(family_id);
CREATE INDEX idx_family_edges_graph ON family_edges(from_node_id, to_node_id);

-- Fast business queries
CREATE INDEX idx_business_tables_lookup ON business_tables(business_id, table_name);
CREATE INDEX idx_business_users_access ON business_users(business_id, node_id);

-- Vector similarity search
CREATE INDEX idx_memory_vectors_embedding ON family_memories_vectors USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chunk_vectors_embedding ON rag_chunks_vectors USING ivfflat (embedding vector_cosine_ops);

-- Temporal queries
CREATE INDEX idx_memory_date ON family_memories(memory_date);
CREATE INDEX idx_activity_date ON activity_log(timestamp);
```

---

## MIGRATION STRATEGY

**Phase 1**: Create identity layer tables (users_core, node_identity, device_sessions, trust_state)

**Phase 2**: Add Vanshavalli tables (family_nodes, family_edges, family_memories, vectors)

**Phase 3**: Add MantraVat tables (businesses, modules, features, users, schemas)

**Phase 4**: Add BotMantra tables (agents, documents, vectors, workflows, cache)

**Phase 5**: Add JeetMantra tables (institutes, courses, enrollments, exams, progress)

**Phase 6**: Add JuniorMantra tables (child_profiles, content, activities, controls)

---

## SAMPLE QUERIES

### Get User's Family Graph
```sql
SELECT 
  fe.relationship_label,
  fn.name,
  fn.email
FROM family_edges fe
JOIN family_nodes fn ON fe.to_node_id = fn.id
WHERE fe.from_node_id = (
  SELECT id FROM family_nodes WHERE user_id = $1
);
```

### Search Family Memories by Similarity
```sql
SELECT 
  fm.title,
  fm.description,
  fm.memory_date,
  1 - (fmv.embedding <=> query_embedding) as similarity
FROM family_memories fm
JOIN family_memories_vectors fmv ON fm.id = fmv.memory_id
WHERE 1 - (fmv.embedding <=> query_embedding) > 0.7
ORDER BY similarity DESC;
```

### Get Business User's Accessible Modules
```sql
SELECT 
  bm.module_name,
  array_agg(bf.feature_key) as features
FROM business_modules bm
LEFT JOIN business_features bf ON bm.id = bf.module_id
WHERE bm.business_id = (
  SELECT business_id FROM business_users 
  WHERE node_id = $1
)
AND bm.is_enabled = true
GROUP BY bm.module_name;
```

---

**Total Design**: 52 tables, 11 vector tables, 40+ indexes, pgvector for semantic search

**Prepared for**: Database architects and developers to implement
