# 🧠 NEURAL OS - ARCHITECTURE DIAGRAMS

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NEURAL OS SYSTEM                             │
│                     (2,050+ lines of code)                          │
└─────────────────────────────────────────────────────────────────────┘

                              FRONTEND
                          (React Dashboard)
                                 ▲
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              REST API                  WebSocket
            (40+ endpoints)             (real-time)
                    │                         │
                    ▼                         ▼
        ┌───────────────────────────────────────────┐
        │      RUNTIME ORCHESTRATOR                 │
        │  (runtimeOrchestrator.js - 250+ lines)    │
        │                                           │
        │  Orchestrates all flows:                  │
        │  • Boot  • Signup  • Login                │
        │  • Dashboard Load  • User Actions         │
        │  • Brand Switching  • Voice Commands      │
        └───────┬───────────┬───────────┬───────────┘
                │           │           │
        ┌───────▼─┐  ┌──────▼───┐  ┌───▼────────────┐
        │          │  │          │  │                │
        ▼          ▼  ▼          ▼  ▼                ▼

    ┌──────────────────┐  ┌──────────────────┐
    │   NODE CORE      │  │   BRAND ROUTER   │
    │ (350+ lines)     │  │  (350+ lines)    │
    │                  │  │                  │
    │ • Init user node │  │ • Age-based      │
    │ • 5 containers   │  │   routing        │
    │ • Relationships  │  │ • 4 brands       │
    │ • Query/Update   │  │ • Feature gate   │
    │ • Vector hooks   │  │ • Permissions    │
    └──────────────────┘  └──────────────────┘

    ┌──────────────────┐  ┌──────────────────┐
    │ DASHBOARD LOADER │  │  NODE FACTORY    │
    │ (350+ lines)     │  │  (400+ lines)    │
    │                  │  │                  │
    │ • 7-step boot    │  │ • 8 LIVE types   │
    │ • Load nodes     │  │ • 8 NON-LIVE     │
    │ • Load vector    │  │   types          │
    │ • Build schema   │  │ • Type validation│
    │ • Refresh UI     │  │ • Bulk create    │
    └──────────────────┘  └──────────────────┘

    ┌──────────────────────────────────────────┐
    │      KERNEL INTEGRATION                  │
    │      (kernelIntegration.js - 350+ lines) │
    │                                          │
    │  MCP Chat-Driven Control:                │
    │  • 9 MCP Tools                           │
    │  • Voice/text processing                 │
    │  • OpenAI integration                    │
    │  • Tool execution                        │
    │  • UI update generation                  │
    └──────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    ┌──────────┐          ┌──────────┐
    │  OPENAI  │          │ PINECONE │
    │ (Kernel) │          │(Vector)  │
    └──────────┘          └──────────┘

        │
        │
        ▼
    DATABASE (Supabase)
    ┌────────────────────────────────┐
    │  Table: nodes                  │
    │  • node_id (PK)                │
    │  • node_type                   │
    │  • owner_node (FK)             │
    │  • parent_node (FK)            │
    │  • metadata (JSONB)            │
    │  • relationships (JSONB)       │
    │  • vector_id                   │
    │  • created_at, updated_at      │
    └────────────────────────────────┘
```

---

## Data Flow - User Signup to Dashboard

```
USER SIGNS UP
│
├─ Enter: email, password, name, DOB
│
├─ Backend receives /api/auth/signup
│
├─ signupNewUser() called [runtimeOrchestrator]
│       │
│       ├─► CREATE NODE CORE [nodeCore.js]
│       │       │
│       │       ├─ Create user node
│       │       ├─ Create vector_memory container
│       │       ├─ Create relationship_map container
│       │       ├─ Create layout_schema container
│       │       └─ Create permission_set container
│       │
│       ├─► DETECT AGE & BRAND [runtimeOrchestrator]
│       │       │
│       │       ├─ age < 10 → junior_mantra 🟨
│       │       ├─ 10-18 → jeetmantra 🔵
│       │       ├─ 18+ → mantravat 🟢
│       │       └─ All → vanshawali 🟣
│       │
│       ├─► INITIALIZE BRAND [brandRouter]
│       │       │
│       │       ├─ Create brand root node
│       │       ├─ Set permissions
│       │       ├─ Set layouts
│       │       └─ Set age gates
│       │
│       ├─► LOAD DASHBOARD [dashboardLoader]
│       │       │
│       │       ├─ Step 1: Load user node
│       │       ├─ Step 2: Detect active brand
│       │       ├─ Step 3: Load brand root
│       │       ├─ Step 4: Load layout schema
│       │       ├─ Step 5: Load child layouts
│       │       ├─ Step 6: Load vector context
│       │       └─ Step 7: Assemble render schema
│       │
│       └─► RETURN render_schema
│
└─ Frontend renders dashboard with widgets
```

---

## Node Graph Structure

```
┌──────────────────────────────────────────────────────┐
│                    USER NODE                         │
│         (node_type: "user", owner_node: self)        │
│                                                      │
│  metadata: { name, email, age, profile_pic, bio }   │
│  relationships: {                                    │
│    family: [FAMILY_1, FAMILY_2],                    │
│    friends: [FRIEND_1, FRIEND_2],                   │
│    groups: [GROUP_1, GROUP_2]                       │
│  }                                                   │
└──────────────────────────────────────────────────────┘
         │
         ├─ 5 CHILD CONTAINERS
         │  (all have parent_node = user_id)
         │
         ├─────────────────────────────────────────────┐
         │                                             │
         ▼                                             ▼
    VECTOR_MEMORY                          RELATIONSHIP_MAP
    - embeddings                           - family links
    - recent_memories                      - friend links
    - suggestions                          - group links
         │                                             │
         │                                             ▼
         │                                        FAMILY_MEMBER
         │                                        (LIVE NODE)
         │                                        - relation_type
         │
         ├─────────────────────────────────────────────┐
         │                                             │
         ▼                                             ▼
    LAYOUT_SCHEMA                          PERMISSION_SET
    - primary_layout                       - brand permissions
    - secondary_layout                     - age gates
    - widgets list                         - safe mode
    - theme                                - screen time limits

OTHER NODES (created by user actions):

POST (NON-LIVE)                    TASK (NON-LIVE)
- parent_node: user_id             - parent_node: company_id
- visibility                        - assigned_to: user_id
- content                           - deadline
- timestamp                         - status

HOMEWORK (NON-LIVE)                FRIEND (LIVE)
- parent_node: teacher_id           - parent_node: user_id
- subject                           - relation_type: "friend"
- instructions                      - linked to: user
- deadline
- status

COMPANY (LIVE)                     GROUP (LIVE)
- owner: user_id                   - owner: user_id
- employees: [...]                 - members: [...]
- metadata                          - type: "family|school|company"
```

---

## Brand Routing Logic

```
USER LOADS APP
│
├─ Get user's age from user node
│
├─ ROUTER DECISION:
│   │
│   ├─ age < 10
│   │  ├─ Default Brand: junior_mantra 🟨
│   │  ├─ Safe Mode: ENFORCED
│   │  ├─ Features: video_feed, games, learning, parent
│   │  └─ Screen Time: 2 hours/day
│   │
│   ├─ 10 ≤ age < 18
│   │  ├─ Default Brand: jeetmantra 🔵
│   │  ├─ Safe Mode: OPTIONAL
│   │  ├─ Features: assignments, classes, grades
│   │  └─ Role-based: teacher or student
│   │
│   └─ age ≥ 18
│      ├─ Default Brand: mantravat 🟢
│      ├─ Safe Mode: OFF
│      ├─ Features: company, tasks, workflows
│      └─ No restrictions
│
├─ ALL USERS
│   ├─ Always attached to: vanshawali 🟣
│   ├─ Social identity
│   ├─ Family connections
│   └─ Memory system
│
└─ User can access ANY brand within age range
   └─ Other brands hidden until eligible
```

---

## 7-Step Dashboard Loading Sequence

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Load User Node Core                            │
│  ├─ Fetch user node from database                       │
│  ├─ Load all 5 child containers                         │
│  └─ Time: ~50ms                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  STEP 2: Detect Active Brand                            │
│  ├─ Check layout_schema_node.active_brand               │
│  ├─ Or get default brand by age                         │
│  └─ Time: ~10ms                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  STEP 3: Load Brand Root Node                           │
│  ├─ Fetch brand definition                              │
│  ├─ Load brand colors, icons                            │
│  ├─ Load brand features list                            │
│  └─ Time: ~20ms                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  STEP 4: Load Layout Schema                             │
│  ├─ Get primary layout type (social_feed, etc.)         │
│  ├─ Get secondary layout                                │
│  ├─ Get widget list for layout                          │
│  └─ Time: ~15ms                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  STEP 5: Load Child Layout Nodes                        │
│  ├─ For each widget in layout:                          │
│  │  ├─ Query nodes for widget's data_source             │
│  │  ├─ Example: query POST nodes for posts_feed widget  │
│  │  └─ Load up to 20 items per widget                   │
│  └─ Time: ~100-200ms (depends on content)               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  STEP 6: Load Vector Context (AI)                       │
│  ├─ Get embeddings from vector memory                   │
│  ├─ Load recent memories                                │
│  ├─ Generate suggestions                                │
│  ├─ Calculate personalization scores                    │
│  └─ Time: ~50ms                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  STEP 7: Assemble Render Schema                         │
│  ├─ Combine all above components                        │
│  ├─ Generate final UI definition                        │
│  ├─ Include theme colors                                │
│  ├─ Include feature flags                               │
│  ├─ Include vector hints                                │
│  └─ Time: ~20ms                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
            RETURN: render_schema
            (Total time: 250-350ms)
            │
            ├─ brand: "vanshawali"
            ├─ widgets: [{ id, type, data, config }, ...]
            ├─ theme: { color, icon }
            ├─ features: [...]
            └─ vector_hints: { uses: [...], enabled: true }
```

---

## MCP Tool Execution Flow

```
USER SPEAKS: "Show my homework"
│
├─ Floating Chat captures audio
├─ Converts to text: "Show my homework"
│
├─ POST /api/chat/command { input: "Show my homework" }
│
├─ handleVoiceCommand() [runtimeOrchestrator]
│       │
│       ├─► kernelIntegration.processMCPRequest(userId, input)
│       │       │
│       │       ├─ BUILD CONTEXT
│       │       │  ├─ Load user node
│       │       │  ├─ Get active brand
│       │       │  ├─ Get recent activity
│       │       │  └─ Get vector hints
│       │       │
│       │       ├─ CALL OPENAI (with tools)
│       │       │  ├─ Input: "Show my homework"
│       │       │  ├─ Available tools: [9 MCP tools]
│       │       │  └─ AI decides: [
│       │       │      { tool: "switch_brand", params: { brand_key: "jeetmantra" } },
│       │       │      { tool: "fetch_node", params: { node_type: "homework" } }
│       │       │    ]
│       │       │
│       │       ├─ EXECUTE TOOLS
│       │       │  ├─ Execute: switch_brand("jeetmantra")
│       │       │  │  └─ Update layout_schema_node.active_brand
│       │       │  ├─ Execute: fetch_node("homework")
│       │       │  │  └─ Query all homework for user
│       │       │  └─ Return: { success: true, results: [...] }
│       │       │
│       │       └─ GENERATE UI UPDATE
│       │          ├─ Check: was brand switched? YES
│       │          ├─ UI Update: { type: "full_reload" }
│       │          └─ Load new brand dashboard
│       │
│       └─ RETURN: { type: "full_reload", render_schema: {...} }
│
└─ FRONTEND: Re-render with new brand and homework data
```

---

## Permission & Age Gating System

```
USER NODE
│
├─ metadata.age = 15
│
└─ permission_set_node.permissions = {
    
    vanshawali (SOCIAL): {
      features: ["social_feed", "family_tree", "posts", ...],
      safe_mode: false,
      content_rating: "PG-13",
      screen_time_limit: null
    },
    
    junior_mantra (KIDS - blocked, age 15): {
      features: [...],
      safe_mode: true (ENFORCED),
      content_rating: "G",
      screen_time_limit: 120
    },
    
    jeetmantra (EDUCATION - AVAILABLE): {
      features: ["assignments", "classes", "grades", ...],
      safe_mode: false,
      content_rating: "PG",
      role_based: true (can be teacher or student)
    },
    
    mantravat (BUSINESS - blocked, age 15): {
      features: [...],
      safe_mode: false,
      content_rating: "PG-13"
    }
}

ROUTER DECISIONS:
├─ Can user access junior_mantra? → NO (age 15 > max 10)
├─ Can user access jeetmantra? → YES (10 ≤ 15 < 18)
└─ Can user access mantravat? → NO (age 15 < min 18)

SAFE MODE ENFORCEMENT:
├─ If safe_mode: true
│  ├─ Filter all content to content_rating: "G"
│  ├─ Enforce screen_time_limit: 120 minutes/day
│  ├─ Enforce bedtime: 9 PM - 7 AM
│  └─ Require parent approval for actions
│
└─ If safe_mode: false
   ├─ Show all age-appropriate content
   ├─ No time restrictions
   └─ No approval needed
```

---

## Frontend Render Flow

```
render_schema = {
  brand: 'vanshawali',
  widgets: [
    { id: 'w1', type: 'posts_feed', data: [...] },
    { id: 'w2', type: 'family_tree', data: [...] },
    { id: 'w3', type: 'memories', data: [...] }
  ],
  theme: { color: '#8B5CF6', icon: 'users' }
}
│
├─ <Dashboard brand={render_schema.brand}>
│  ├─ <Header theme={render_schema.theme}>
│  ├─ <WidgetContainer>
│  │  ├─ {render_schema.widgets.map(widget =>
│  │  │   <Widget type={widget.type} data={widget.data} />
│  │  │ )}
│  │  └─ For each widget in render_schema.widgets:
│  │     ├─ PostsFeed renders post nodes
│  │     ├─ FamilyTree renders family relationships
│  │     ├─ Memories renders vector suggestions
│  │     └─ Other widgets render respective data
│  └─ <FloatingChat>
│     └─ User can speak commands
│
└─ User interacts:
   ├─ Clicks widget → Widget click event
   ├─ Switches brand → Brand switch event
   ├─ Creates post → POST /api/nodes/create
   ├─ Speaks to chat → POST /api/chat/command
   └─ All trigger UI updates
```

---

## File Dependencies

```
runtimeOrchestrator.js (250+ lines)
├─ requires: nodeCore.js
├─ requires: dashboardLoader.js
├─ requires: brandRouter.js
├─ requires: nodeFactory.js
└─ requires: kernelIntegration.js

dashboardLoader.js (350+ lines)
├─ requires: nodeCore.js
├─ requires: brandRouter.js
└─ requires: nodeFactory.js

brandRouter.js (350+ lines)
├─ requires: nodeCore.js
└─ BRAND_DEFINITIONS (static)

nodeFactory.js (400+ lines)
├─ requires: nodeCore.js
└─ NODE_TYPE_DEFINITIONS (static)

kernelIntegration.js (350+ lines)
├─ requires: nodeCore.js
├─ requires: brandRouter.js
├─ requires: dashboardLoader.js
└─ requires: nodeFactory.js

nodeCore.js (350+ lines)
├─ requires: Supabase client
└─ NODE_SCHEMA (validation)
```

---

## Summary Statistics

```
CORE RUNTIME FILES
├─ nodeCore.js ................... 350+ lines
├─ brandRouter.js ................ 350+ lines
├─ dashboardLoader.js ............ 350+ lines
├─ nodeFactory.js ................ 400+ lines
├─ kernelIntegration.js .......... 350+ lines
├─ runtimeOrchestrator.js ........ 250+ lines
└─ Total .......................... 2,050+ lines

DOCUMENTATION
├─ RUNTIME_FLOW_COMPLETE.md (comprehensive)
├─ NEURAL_OS_IMPLEMENTATION_COMPLETE.md (status)
├─ DEVELOPER_QUICK_REFERENCE.js (quick start)
├─ API endpoints.specification.js (40+ endpoints)
└─ This file (architecture diagrams)

NODE TYPES
├─ LIVE nodes ..................... 8 types
├─ NON-LIVE nodes ................ 8 types
└─ Total ......................... 16 types

BRANDS
├─ Vanshawali (Social) ........... All ages
├─ Junior Mantra (Kids) ......... 0-10 years
├─ JeetMantra (Education) ....... 10-18 years
├─ Mantravat (Business) ......... 18+ years
└─ Total .......................... 4 + universal

MCP TOOLS
├─ query_vector
├─ modify_layout
├─ fetch_node
├─ create_relationship
├─ update_node_metadata
├─ switch_brand
├─ create_node
├─ search_nodes
├─ get_recommendations
└─ Total .......................... 9 tools

PHASES
├─ Boot
├─ Signup
├─ Login
├─ Dashboard Load (7 steps)
├─ Interactions
├─ Voice/Chat (MCP)
├─ Node System
└─ Permissions & Age Gating
└─ Total .......................... 8 phases
```

---

**STATUS**: 🟢 ALL ARCHITECTURE COMPLETE AND DOCUMENTED
