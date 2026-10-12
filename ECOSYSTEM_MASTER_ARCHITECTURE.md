# 🌐 YUVAAN ECOSYSTEM - MASTER ARCHITECTURE

**Version**: 1.0  
**Date**: February 2026  
**Status**: Blueprint Ready for Implementation  

---

## 🎯 EXECUTIVE SUMMARY

Yuvaan is a **multi-platform AI ecosystem** built on:
- **Single Identity Layer** (Supabase Auth + Node Core)
- **Universal Kernel** (Intent → Function → Data → UI)
- **Vector-First Knowledge** (pgvector for all intelligence)
- **Dynamic UI Engine** (Template-driven, AI-generated)

### Five Interconnected Platforms

| Platform | Purpose | Users | Core Tech |
|----------|---------|-------|-----------|
| **Vanshavalli** | Digital Family Graph + Trusted Social | Families | Graph DB + Vectors |
| **MantraVat** | Business Control OS + Module Builder | Business Owners | Dynamic Schema + RBAC |
| **BotMantra** | AI Automation + Knowledge Studio | Everyone | RAG + Workflows |
| **JeetMantra** | AI-Powered Education Platform | Students/Teachers | LMS + Vector Learning |
| **JuniorMantra** | Safe AI Learning for Kids | Children/Parents | Gamified + Monitored |

---

## 🔐 GLOBAL IDENTITY LAYER

### Core Tables (Shared Across All Platforms)

```
supabase_auth.users
├── id (UUID)
├── email
├── phone
└── metadata

users_core (Custom)
├── id (user_id from auth)
├── full_name
├── avatar_url
├── default_node_id
├── trust_score
├── verification_status
├── created_at

node_identity
├── id (node_id) - UUID
├── user_id (from users_core)
├── node_type ('human', 'bot', 'org')
├── public_address
├── trust_level
├── karma_score
├── brand_context (JSONB)
├── role_context (JSONB)
├── permission_context (JSONB)
└── memory_context (JSONB - Vector references)

device_sessions
├── session_id
├── user_id
├── device_type
├── device_os
├── ip_address
├── last_activity
├── active

trust_state
├── from_node_id
├── to_node_id
├── trust_level (1-100)
├── relationship_type
└── verified_at
```

### Login Flow (All Platforms)

```
1. User logs in (Email/Phone/Social)
   ↓
2. Supabase Auth validates
   ↓
3. Create/Load user_core record
   ↓
4. Create/Load node_identity
   ↓
5. Detect brand_context (domain → brand)
   ↓
6. Load role_context (user roles)
   ↓
7. Load permission_context (feature flags)
   ↓
8. Initialize memory_context (vector pointers)
   ↓
9. Redirect to platform (vanshavalli/mantravat/botmantra/etc)
```

---

## 🧠 UNIVERSAL KERNEL

### Kernel Entry Point

```
POST /kernel/execute
```

**Request**:
```json
{
  "brand": "vanshavalli|mantravat|botmantra|jeetmantra|juniormantra",
  "action": "view_family|create_business|run_rag|load_course|start_game",
  "context": {
    "user_id": "uuid",
    "node_id": "uuid",
    "platform_id": "uuid",
    "memory_references": ["vector_id_1", "vector_id_2"]
  },
  "payload": {}
}
```

**Processing Pipeline**:
```
1. Validate brand → Brand middleware
2. Check role → Role resolver
3. Interpret action → Intent classifier
4. Map to function → Function registry
5. Load context data → Context builder
6. Execute function → Database layer
7. Generate UI → UI template engine
8. Return response
```

**Response**:
```json
{
  "success": true,
  "data": {},
  "ui": {
    "template": "dashboard",
    "layout": "grid",
    "widgets": []
  },
  "memory_updates": ["vector_id_1", "vector_id_2"]
}
```

---

## 📊 HYBRID DATA STORAGE

### Storage Decision Tree

```
Data Type                    → Storage Choice
────────────────────────────────────────────
System config/Setup          → SQL Tables
User permissions             → SQL (fast lookup)
Business rules               → SQL
Relational connections       → SQL

Knowledge/Content            → Vector DB
Semantic search              → Vector DB
Recommendations              → Vector DB
Memory/Context               → Vector DB
Document embeddings          → Vector DB

Real-time state              → Redis (optional)
Session data                 → Redis (optional)
```

### Vector Namespaces (pgvector)

```
vector_family_memory
├── Family memories
├── Relationship narratives
├── Conversation history
└── Shared moments

vector_business_docs
├── Business documents
├── Knowledge base
├── Policies
└── Training materials

vector_ai_knowledge
├── Uploaded documents (PDFs, images)
├── Web content
├── Video transcripts
└── RAG chunks

vector_learning_content
├── Lecture notes
├── Study materials
├── Homework explanations
└── Exam prep

vector_kids_content
├── Stories
├── Learning videos
├── Educational games
└── Progress tracking

vector_youtube_transcripts
├── Video metadata
├── Indexed transcripts
└── Recommendations
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (2-3 weeks)
- [ ] Identity Layer complete
- [ ] Node Core system
- [ ] Kernel API scaffolding
- [ ] Vanshavalli Graph DB

### Phase 2: Business OS (3-4 weeks)
- [ ] MantraVat platform
- [ ] Dynamic schema generation
- [ ] RBAC system
- [ ] Module library

### Phase 3: AI Automation (4-5 weeks)
- [ ] BotMantra Studio
- [ ] RAG engine
- [ ] Workflow builder
- [ ] Vector knowledge layer

### Phase 4: Education (3-4 weeks)
- [ ] JeetMantra LMS
- [ ] Classroom system
- [ ] Assessment engine
- [ ] Learning vectors

### Phase 5: Kids Platform (2-3 weeks)
- [ ] JuniorMantra UI
- [ ] Parent controls
- [ ] Gamification
- [ ] Safe content library

---

## 🔗 CROSS-PLATFORM CONNECTIONS

### Single User Journey

```
User registers
  ↓
Gets user_id + node_id
  ↓
Can access:
  ├── Vanshavalli (Social/Family)
  ├── MantraVat (If business owner)
  ├── BotMantra (AI automation)
  ├── JeetMantra (If enrolled)
  └── JuniorMantra (If parent)
  
All tied by:
  ├── user_id (Supabase Auth)
  ├── node_id (Universal identity)
  ├── Trust score (shared)
  ├── Memory context (shared vectors)
  └── Permission context (shared RBAC)
```

### Data Sharing Rules

```
Vanshavalli → MantraVat
  • Family members can be invited to business
  • Trust levels carry over
  • Relationship context available

MantraVat → BotMantra
  • Business documents uploaded to knowledge base
  • Business AI agents created
  • Business users share context

BotMantra → JeetMantra
  • Teachers use BotMantra for curriculum
  • Students use BotMantra for homework help
  • Vectors tagged by course

JeetMantra → JuniorMantra
  • Parent enrolled kids get curated content
  • Progress tracked across platforms
  • Learning style shared
```

---

## 🎯 SUCCESS METRICS

By end of Phase 5:

**Platform Metrics**:
- 5 platforms fully operational
- Single login across all
- Shared memory/trust system
- Vector-first recommendations

**Performance Metrics**:
- API response: <200ms
- Vector search: <500ms
- Kernel execution: <1s
- UI generation: <500ms

**User Metrics**:
- Family graph: 100+ family members per user
- Business OS: Support 10+ modules
- AI agents: 100+ documents uploadable
- Education: 1000+ students per class
- Kids: 50+ content items per child

---

## 📁 REPOSITORY STRUCTURE

```
yuvaan-ecosystem/
├── backend/
│   ├── kernel/
│   │   ├── kernel.js (Universal entry)
│   │   ├── intent-classifier.js
│   │   └── function-registry.js
│   ├── platforms/
│   │   ├── vanshavalli/
│   │   ├── mantravat/
│   │   ├── botmantra/
│   │   ├── jeetmantra/
│   │   └── juniormantra/
│   ├── services/
│   │   ├── vector-service.js
│   │   ├── auth-service.js
│   │   └── ui-engine.js
│   └── migrations/
│       └── schema.sql
├── frontend/
│   ├── platforms/
│   │   ├── vanshavalli-ui/
│   │   ├── mantravat-ui/
│   │   ├── botmantra-ui/ (current)
│   │   ├── jeetmantra-ui/
│   │   └── juniormantra-ui/
│   └── shared/
│       ├── components/
│       └── services/
└── docs/
    ├── ARCHITECTURE.md
    ├── PLATFORMS.md
    ├── DATABASE.md
    ├── KERNEL.md
    └── IMPLEMENTATION.md
```

---

## 🔄 NEXT STEPS

1. ✅ **Review this document** - Ensure alignment on vision
2. ⏳ **Create detailed platform specs** - One per platform
3. ⏳ **Design database schema** - All tables + vectors
4. ⏳ **Build identity layer** - Auth + Node Core
5. ⏳ **Implement kernel** - Universal API entry
6. ⏳ **Build Vanshavalli** - First platform
7. ⏳ **Build remaining platforms** - In priority order

---

## 📝 RELATED DOCUMENTS

- [PLATFORM_SPECIFICATIONS.md](./PLATFORM_SPECIFICATIONS.md) - Detailed per-platform requirements
- [DATABASE_SCHEMA_DESIGN.md](./DATABASE_SCHEMA_DESIGN.md) - Complete schema
- [KERNEL_API_SPECIFICATION.md](./KERNEL_API_SPECIFICATION.md) - Kernel endpoints
- [VECTOR_STRATEGY.md](./VECTOR_STRATEGY.md) - pgvector design
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Phase-by-phase tasks

---

**Prepared for**: GitHub Copilot / Development Team  
**Maintainer**: Yuvaan Architecture Council  
**Last Updated**: February 4, 2026
