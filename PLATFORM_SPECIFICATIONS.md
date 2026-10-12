# 🎯 PLATFORM SPECIFICATIONS

**Status**: Ready for Development  
**Created**: February 2026  

---

## 1️⃣ VANSHAVALLI - Digital Family Graph + Social Trust Platform

### Purpose
Connect families, map relationships, preserve memories, establish trust delegation.

### User Roles
- **Family Head** - Manage family structure
- **Family Member** - View family, share memories
- **Guardian** - Emergency access delegation
- **Guest** - Limited view (invited)

---

### Frontend Screens

#### 1. Family Home (Dashboard)
```
┌─────────────────────────────────────┐
│  👨‍👩‍👧‍👦 Vanshavalli Family Home       │
├─────────────────────────────────────┤
│                                     │
│  Your Family Tree                   │
│  [Visual graph of connected people] │
│                                     │
│  Trusted Circle (5)                 │
│  [Avatar row: Mom, Dad, Sis, ...]   │
│                                     │
│  Recent Activity                    │
│  • Mom shared: "Birthday Party"    │
│  • Dad added photo to "Memories"   │
│  • Sis joined family                │
│                                     │
│  Quick Actions                      │
│  [+ Add Member] [📷 Share] [💬]   │
│                                     │
└─────────────────────────────────────┘
```

**Data Loaded**:
```graphql
{
  family_nodes {
    id, name, avatar, role, status
  }
  family_edges {
    from, to, relationship_type
  }
  trust_state {
    from_node, to_node, trust_level
  }
  recent_activity {
    type, user, timestamp, content
  }
}
```

---

#### 2. Add Family Member Screen
```
┌──────────────────────────────────────┐
│  ➕ Add Family Member                 │
├──────────────────────────────────────┤
│                                      │
│  How do you know them?               │
│  [✓] Phone/Email                     │
│  [ ] Scan QR Code                    │
│  [ ] Search existing user            │
│                                      │
│  IF Phone/Email:                     │
│  [Enter phone or email...]           │
│  [Send invite]                       │
│                                      │
│  IF QR Code:                         │
│  [📷 Camera reader...]               │
│                                      │
│  IF Search:                          │
│  [Search database...]                │
│  Results:                            │
│  • John Doe (john@email.com)        │
│  • John Smith (john.s@email.com)    │
│                                      │
│  [Cancel] [Invite]                  │
│                                      │
└──────────────────────────────────────┘
```

**API Call**:
```javascript
await apiService.createFamilyInvite({
  phone_or_email: "mom@email.com",
  relationship: "Mother",
  message: "Join our family"
})
```

---

#### 3. Relationship Editor
```
┌──────────────────────────────────────┐
│  👥 Relationship Editor               │
├──────────────────────────────────────┤
│                                      │
│  Your Relationship to Mom:           │
│  [▼ Mother        ]                  │
│     Father                           │
│     Sibling                          │
│     Spouse                           │
│     Child                            │
│     Guardian                         │
│     Friend                           │
│     Other                            │
│                                      │
│  Trust Level:                        │
│  [★★★★★] 5 / 5                      │
│                                      │
│  Can Access:                         │
│  ✓ View my calendar                  │
│  ✓ See my location                   │
│  ☐ Access my files                   │
│  ☐ Emergency override                │
│                                      │
│  [Save] [Delete relation]            │
│                                      │
└──────────────────────────────────────┘
```

**Function Call**:
```javascript
await apiService.updateFamilyRelation({
  from_node_id: user.node_id,
  to_node_id: other_node_id,
  relationship_type: "Mother",
  trust_level: 5,
  permissions: ["view_calendar", "see_location"]
})
```

---

#### 4. Shared Feed (Family Timeline)
```
┌──────────────────────────────────────┐
│  📸 Family Feed                       │
├──────────────────────────────────────┤
│                                      │
│  👩 Mom - 2 hours ago                │
│  [Photo of garden]                   │
│  "Spring blooms are here! 🌸"        │
│  ❤️ 5  💬 2  📤                     │
│                                      │
│  👨 Dad - 1 day ago                  │
│  [Photo of fishing trip]             │
│  "Great catch this weekend!"         │
│  ❤️ 8  💬 3  📤                     │
│                                      │
│  📌 Anniversary - 2 days ago         │
│  "Celebrating 30 years! 💕"          │
│  ❤️ 12  💬 5  📤                     │
│                                      │
│  [+ Create Post]                     │
│                                      │
└──────────────────────────────────────┘
```

---

### Database Schema

**Core Tables**:
```sql
-- Family structure
CREATE TABLE family_nodes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users_core(id),
  family_id UUID,
  name TEXT,
  avatar_url TEXT,
  role TEXT ('Family Head', 'Member', 'Guardian'),
  birth_date DATE,
  phone TEXT,
  email TEXT,
  status TEXT ('active', 'invited', 'archived'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Relationships between family members
CREATE TABLE family_edges (
  id UUID PRIMARY KEY,
  from_node_id UUID REFERENCES family_nodes(id),
  to_node_id UUID REFERENCES family_nodes(id),
  relationship_type TEXT ('Father', 'Mother', 'Sibling', 'Spouse', 'Child', 'Friend'),
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Trust state
CREATE TABLE trust_state (
  id UUID PRIMARY KEY,
  from_node_id UUID,
  to_node_id UUID,
  trust_level INT (1-100),
  permissions JSONB,
  verified_at TIMESTAMP
);

-- Shared memories
CREATE TABLE family_memories (
  id UUID PRIMARY KEY,
  family_id UUID,
  created_by UUID REFERENCES family_nodes(id),
  title TEXT,
  description TEXT,
  media_urls TEXT[],
  tagged_people UUID[],
  visibility TEXT ('private', 'family', 'public'),
  created_at TIMESTAMP
);

-- Invitations
CREATE TABLE family_invites (
  id UUID PRIMARY KEY,
  family_id UUID,
  invited_by UUID REFERENCES family_nodes(id),
  phone_or_email TEXT UNIQUE,
  relationship TEXT,
  token TEXT UNIQUE,
  status TEXT ('pending', 'accepted', 'declined'),
  created_at TIMESTAMP,
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

**Vector Tables**:
```sql
CREATE TABLE family_memories_vectors (
  id UUID PRIMARY KEY,
  memory_id UUID REFERENCES family_memories(id),
  content_type TEXT ('photo', 'text', 'video'),
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE TABLE conversation_history_vectors (
  id UUID PRIMARY KEY,
  family_id UUID,
  conversation_text TEXT,
  speaker_id UUID,
  embedding vector(1536),
  timestamp TIMESTAMP
);
```

---

### Core Kernel Functions

```javascript
// Create family node
async function create_family_node(user_id, family_info) {
  // Create node_identity if new user
  // Create family_node record
  // Return node_id
}

// Add family relation
async function add_family_relation(from_node_id, to_node_id, relationship_type) {
  // Create family_edges record
  // Initialize trust_state
  // Send notification
}

// Send invite
async function send_family_invite(phone_or_email, relationship, message) {
  // Create invite token
  // Send SMS/Email
  // Create family_invites record
}

// Accept invite
async function accept_family_invite(token) {
  // Verify token
  // Create family_edges
  // Link to existing user or create new
  // Update family_invites status
}

// Get family graph
async function get_family_graph(family_id) {
  // Return family_nodes, family_edges, trust_state
  // With user permissions applied
}

// Save memory with embedding
async function save_family_memory(memory_data) {
  // Insert family_memories
  // Generate embedding (text + image)
  // Insert into family_memories_vectors
  // Tag mentioned people
}

// Search family memory
async function search_family_memory(query, family_id) {
  // Vector search on query
  // Rank by similarity
  // Apply visibility filters
  // Return results with context
}
```

---

## 2️⃣ MANTRAVAT - Business Control OS

### Purpose
Enable business owners to build custom business systems with modules, dynamic schemas, and RBAC.

### User Roles
- **Business Owner** - Full control
- **Admin** - Manage settings
- **Manager** - Manage team
- **Employee** - Use assigned features
- **Guest** - View only

---

### Business Onboarding Flow

```
Step 1: Business Info
  ├─ Name
  ├─ Industry
  ├─ Country
  ├─ Team Size
  └─ Business Type

Step 2: Module Selection
  ├─ CRM (Leads, Pipeline, Deals)
  ├─ HR (Employees, Payroll, Leave)
  ├─ Finance (Invoices, Expenses, Reports)
  ├─ Inventory (Stock, Orders, Suppliers)
  ├─ Support (Tickets, Knowledge Base)
  ├─ Marketing (Campaigns, Analytics)
  ├─ Education (Courses, Students)
  └─ Custom AI

Step 3: Feature Selection
  └─ Per module: Pick specific features

Step 4: UI Template
  ├─ Admin Dashboard
  ├─ Sales Dashboard
  ├─ Team Dashboard
  └─ Custom Widget Builder
```

---

### Database Schema

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users_core(id),
  name TEXT,
  industry TEXT,
  country TEXT,
  team_size INT,
  status TEXT ('active', 'setup', 'paused'),
  created_at TIMESTAMP
);

CREATE TABLE business_modules (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  module_name TEXT ('crm', 'hr', 'finance', 'inventory', 'support', 'marketing', 'education'),
  enabled BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE business_features (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES business_modules(id),
  feature_name TEXT,
  enabled BOOLEAN,
  config JSONB
);

CREATE TABLE business_schemas (
  id UUID PRIMARY KEY,
  business_id UUID,
  schema_name TEXT,
  schema_definition JSONB,
  created_from_template TEXT,
  created_at TIMESTAMP
);

CREATE TABLE business_users (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users_core(id),
  role TEXT ('owner', 'admin', 'manager', 'employee', 'guest'),
  permissions JSONB,
  created_at TIMESTAMP
);
```

---

### Kernel Functions

```javascript
async function fn_register_business_v1(business_info) {
  // Create businesses record
  // Create business_modules entries
  // Create default RBAC
  // Return business_id
}

async function fn_initialize_business_v1(business_id, module_selections) {
  // For each selected module:
  //   - Create business_modules record
  //   - Generate default schema
  //   - Create default tables
  //   - Create default UI templates
}

async function fn_create_business_tables(business_id, schema_blueprint) {
  // Receive schema definition
  // Generate SQL for new tables
  // Execute migrations
  // Register schema
  // Return table creation status
}

async function sync_data_model_registry(business_id) {
  // Scan all business tables
  // Update data_model_registry
  // Generate API routes
  // Update permissions matrix
}

async function sync_template_registry(business_id, module_id) {
  // Load templates for module
  // Customize with business data
  // Update ui_templates table
  // Cache for fast loading
}

async function resolve_business_context(user_id, business_id) {
  // Load user role in business
  // Load permissions
  // Load feature flags
  // Load memory context
  // Return full context
}

async function check_feature_access(user_id, business_id, feature_key) {
  // Check role → feature mapping
  // Return true/false
}

async function check_action_permission(user_id, table_name, action) {
  // Check role has permission for table+action
  // Return true/false with details
}
```

---

## 3️⃣ BOTMANTRA - AI Automation Studio

### Purpose
Build AI agents, upload knowledge, create workflows, generate dashboards.

### Core Features

**AI Studio**:
- Chat with custom AI
- Build AI agents
- Manage prompts
- Version control

**Knowledge Base**:
- Upload PDFs, documents, images
- Index with embeddings
- Web scraping
- YouTube transcripts

**Workflow Builder**:
- Drag-drop workflow
- Triggers: Time, API, User action
- Actions: API call, Database write, AI step
- Conditions, loops

**Dashboard Generator**:
- AI creates widgets
- Drag-drop customization
- Real-time metrics

---

### Database Schema

```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name TEXT,
  description TEXT,
  system_prompt TEXT,
  model TEXT,
  temperature FLOAT,
  max_tokens INT,
  created_at TIMESTAMP
);

CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES ai_agents(id),
  prompt_text TEXT,
  version INT,
  created_at TIMESTAMP
);

CREATE TABLE vector_documents (
  id UUID PRIMARY KEY,
  business_id UUID,
  document_name TEXT,
  document_type TEXT ('pdf', 'docx', 'image', 'text', 'youtube'),
  source_url TEXT,
  file_path TEXT,
  uploaded_at TIMESTAMP
);

CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES vector_documents(id),
  chunk_text TEXT,
  page_number INT,
  start_char INT,
  end_char INT,
  created_at TIMESTAMP
);

CREATE TABLE rag_chunks_vectors (
  id UUID PRIMARY KEY,
  chunk_id UUID REFERENCES rag_chunks(id),
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE TABLE ai_workflows (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES ai_agents(id),
  name TEXT,
  definition JSONB,
  active BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE ai_tasks (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES ai_workflows(id),
  task_order INT,
  task_type TEXT ('trigger', 'action', 'ai_step', 'api_call', 'db_write', 'condition'),
  config JSONB,
  created_at TIMESTAMP
);

CREATE TABLE semantic_cache (
  id UUID PRIMARY KEY,
  query_embedding vector(1536),
  response TEXT,
  ttl INT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

### Kernel Functions

```javascript
async function run_rag_engine(query, document_ids) {
  // Vector search on query
  // Find similar chunks from documents
  // Rank by relevance
  // Return top-K chunks with scores
}

async function build_ai_context(query_embedding) {
  // Vector search
  // Fetch related chunks
  // Format for LLM context
  // Return context string
}

async function build_ai_prompt(agent_id, user_prompt) {
  // Load agent system_prompt
  // Append user_prompt
  // Add RAG context
  // Format for API
  // Return full prompt
}

async function save_semantic_cache(query, response, ttl) {
  // Generate embedding of query
  // Insert into semantic_cache
  // Set expiration
}

async function execute_ai_action(agent_id, workflow_id, input) {
  // Load workflow definition
  // Execute triggers
  // Execute actions in sequence
  // Update task status
  // Return results
}

async function execute_plugin(plugin_code, payload) {
  // Load plugin code
  // Execute in sandbox
  // Return result
}
```

---

## 4️⃣ JEETMANTRA - AI Education Platform

### Purpose
AI-powered LMS for teachers and students.

### Features

**Teacher Portal**:
- Create courses
- Schedule live classes
- Upload materials
- Create assignments
- Conduct exams
- Monitor progress

**Student Portal**:
- Attend classes
- Submit homework
- Take exams
- AI tutor chat
- Progress dashboard

---

### Database Schema

```sql
CREATE TABLE institutes (
  id UUID PRIMARY KEY,
  name TEXT,
  principal_id UUID,
  country TEXT,
  created_at TIMESTAMP
);

CREATE TABLE courses (
  id UUID PRIMARY KEY,
  institute_id UUID REFERENCES institutes(id),
  course_name TEXT,
  course_code TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP
);

CREATE TABLE students (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users_core(id),
  institute_id UUID REFERENCES institutes(id),
  roll_number TEXT,
  enrollment_date TIMESTAMP
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  enrollment_date TIMESTAMP,
  status TEXT ('active', 'completed', 'dropped')
);

CREATE TABLE class_schedule (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  class_date TIMESTAMP,
  duration INT,
  teacher_id UUID,
  room_link TEXT,
  recording_url TEXT
);

CREATE TABLE homework (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title TEXT,
  description TEXT,
  due_date TIMESTAMP,
  max_score INT,
  created_at TIMESTAMP
);

CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY,
  homework_id UUID REFERENCES homework(id),
  student_id UUID REFERENCES students(id),
  submission_text TEXT,
  file_url TEXT,
  submitted_at TIMESTAMP,
  score INT
);

CREATE TABLE exams (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  exam_name TEXT,
  exam_date TIMESTAMP,
  duration INT,
  total_marks INT
);

CREATE TABLE exam_results (
  id UUID PRIMARY KEY,
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES students(id),
  score INT,
  grade TEXT,
  completed_at TIMESTAMP
);

CREATE TABLE learning_progress (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  lessons_completed INT,
  average_score FLOAT,
  last_activity TIMESTAMP
);
```

---

## 5️⃣ JUNIORMANTRA - Kids Learning Platform

### Purpose
Safe, gamified AI learning for children with parental controls.

### Features

**Kid UI**:
- Learning videos
- Interactive games
- Stories
- Drawing/creativity tools
- Reward points

**Parent UI**:
- Screen time limits
- Content filters
- Learning level management
- Progress reports

---

### Database Schema

```sql
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY,
  guardian_id UUID REFERENCES users_core(id),
  child_name TEXT,
  age INT,
  grade INT,
  learning_level TEXT,
  interests TEXT[],
  created_at TIMESTAMP
);

CREATE TABLE guardian_map (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id),
  guardian_id UUID REFERENCES users_core(id),
  relationship TEXT ('Parent', 'Grandparent', 'Teacher'),
  control_level TEXT ('full', 'limited', 'view_only')
);

CREATE TABLE content_library (
  id UUID PRIMARY KEY,
  content_type TEXT ('video', 'game', 'story', 'exercise'),
  title TEXT,
  description TEXT,
  age_range INT[],
  learning_level TEXT,
  content_url TEXT,
  duration_minutes INT,
  created_at TIMESTAMP
);

CREATE TABLE kid_activity_log (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id),
  content_id UUID REFERENCES content_library(id),
  activity_type TEXT ('watch', 'play', 'read'),
  duration_minutes INT,
  activity_date TIMESTAMP
);

CREATE TABLE reward_points (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id),
  points INT,
  reason TEXT,
  created_at TIMESTAMP
);

CREATE TABLE parent_controls (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id),
  daily_screen_time_limit INT,
  content_filter_level TEXT ('strict', 'moderate', 'open'),
  allowed_content_types TEXT[],
  created_at TIMESTAMP
);
```

---

## 🔄 Cross-Platform Data Flow

```
User Login
  ↓
Load user_core + node_identity
  ↓
Detect brand (domain)
  ↓
Load brand_context, role_context, permission_context
  ↓
Route to appropriate platform:
  ├─ /vanshavalli → Load family_nodes, family_edges
  ├─ /mantravat → Load businesses, modules, features
  ├─ /botmantra → Load ai_agents, documents, workflows
  ├─ /jeetmantra → Load courses, enrollments, progress
  └─ /juniormantra → Load child_profiles, content
  ↓
Load memory_context (vector references)
  ↓
Return UI + Data to frontend
```

---

## 📊 Summary Table

| Platform | Tables | Core Entity | Key Vector Storage | Auth Model |
|----------|--------|-------------|-------------------|------------|
| Vanshavalli | 6 | family_nodes | family_memories_vectors | Share via invites |
| MantraVat | 8 | businesses | (SQL-only) | Business RBAC |
| BotMantra | 8 | ai_agents | rag_chunks_vectors | Hybrid |
| JeetMantra | 10 | courses | lecture_vectors | Institute roles |
| JuniorMantra | 6 | child_profiles | learning_vectors | Parental controls |

---

**Next**: Read KERNEL_API_SPECIFICATION.md for endpoint details.
