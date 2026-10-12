# UI/Kernel Integration - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER (Port 3001)                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      React Application                          │  │
│  │                                                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ src/index.js                                             │  │  │
│  │  │ - Route dispatcher                                       │  │  │
│  │  │ - USE_NEW_UI_ENGINE = true (DEFAULT)                     │  │  │
│  │  └─────────────────────┬──────────────────────────────────┘  │  │
│  │                        │                                      │  │
│  │                        ▼                                      │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ AppRenderEngine.tsx                                      │  │  │
│  │  │ - Wraps with UIProvider                                  │  │  │
│  │  │ - Applies theme & branding                               │  │  │
│  │  └─────────────────────┬──────────────────────────────────┘  │  │
│  │                        │                                      │  │
│  │                        ▼                                      │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ UIProvider (UIStateManager.tsx)                          │  │  │
│  │  │ - Global React Context                                   │  │  │
│  │  │ - Manages uiState: { layout, widgets, floating_chat }    │  │  │
│  │  │ - Detects brand from domain                              │  │  │
│  │  │ - Initializes theme                                      │  │  │
│  │  └─────────────────────┬──────────────────────────────────┘  │  │
│  │                        │                                      │  │
│  │                        ▼                                      │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ Renderer.tsx (Master Renderer)                           │  │  │
│  │  │ - On mount: calls uiBootstrap()                          │  │  │
│  │  │ - Receives: response.response.ui                         │  │  │
│  │  │ - Updates: setUIState()                                  │  │  │
│  │  │ - Renders: LayoutRenderer + WidgetRenderer[]             │  │  │
│  │  └─────────────────────┬──────────────────────────────────┘  │  │
│  │                    ┌───┴────────────┬──────────────────┐      │  │
│  │                    │                │                  │      │  │
│  │                    ▼                ▼                  ▼      │  │
│  │  ┌──────────────────────┐ ┌──────────────────┐ ┌──────────┐  │  │
│  │  │ LayoutRenderer.tsx   │ │ WidgetRenderer   │ │FloatingChat
│  │  │                      │ │ .tsx             │ │.tsx      │  │  │
│  │  │ - Renders container  │ │                  │ │          │  │  │
│  │  │ - grid/flex/sidebar  │ │ - Renders each   │ │ - Chat   │  │  │
│  │  └──────────────────────┘ │   widget         │ │ - Sends  │  │  │
│  │                           │ - Supports 9+    │ │   msg to │  │  │
│  │                           │   widget types   │ │ /kernel/ │  │  │
│  │                           └──────────────────┘ │ execute  │  │  │
│  │                                                └──────────┘  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ KernelClient.ts (API Gateway)                               │  │
│  │                                                              │  │
│  │ Exported Functions:                                         │  │
│  │ - kernelExecute(payload) → KernelResponse                  │  │
│  │ - uiBootstrap() → KernelResponse                           │  │
│  │ - chatSend(message) → KernelResponse                       │  │
│  │ - formSubmit(formId, data) → KernelResponse                │  │
│  │ - executeAction(actionId, params) → KernelResponse        │  │
│  │ - tableQuery(tableId, filters) → KernelResponse            │  │
│  │                                                              │  │
│  │ Handles:                                                     │  │
│  │ - Auth token from localStorage                              │  │
│  │ - Device fingerprint                                        │  │
│  │ - Error handling                                            │  │
│  │ - Request logging                                           │  │
│  │                                                              │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
│                         │                                            │
│                         │ HTTP/JSON                                  │
│                         │                                            │
└─────────────────────────┼────────────────────────────────────────────┘
                          │
                          │ POST /kernel/execute
                          │ Authorization: Bearer {token}
                          │ {
                          │   action: 'ui_bootstrap' | 'chat' | ...
                          │   payload: {...}
                          │ }
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND API (Port 3000)                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ kernel-execute.js Route Handler                                │  │
│  │                                                                 │  │
│  │ POST /kernel/execute                                           │  │
│  │                                                                 │  │
│  │ 1. JWT Validation                                              │  │
│  │    └─ Decode token, validate                                   │  │
│  │                                                                 │  │
│  │ 2. User + Business Resolution                                  │  │
│  │    └─ Query: users, business_users tables                      │  │
│  │                                                                 │  │
│  │ 3. Permission Check                                            │  │
│  │    └─ RPC: check_action_permission()                           │  │
│  │                                                                 │  │
│  │ 4. Trust Score Gate                                            │  │
│  │    └─ Query: node_trust_state table                            │  │
│  │                                                                 │  │
│  │ 5. Action Router                                               │  │
│  │    │                                                            │  │
│  │    ├─ 'ui_bootstrap' ─► handleUIAction()                       │  │
│  │    │                                                            │  │
│  │    ├─ 'chat' ──────────► handleChatAction()                    │  │
│  │    │                                                            │  │
│  │    ├─ 'data' ──────────► handleDataAction()                    │  │
│  │    │                                                            │  │
│  │    └─ 'admin' ────────► handleAdminAction()                    │  │
│  │                                                                 │  │
│  │ 6. Logging + Queuing                                           │  │
│  │    ├─ Insert: ai_execution_log                                 │  │
│  │    ├─ Insert: node_execution_log                               │  │
│  │    └─ Queue: node_event_queue                                  │  │
│  │                                                                 │  │
│  │ 7. Response                                                     │  │
│  │    └─ {                                                         │  │
│  │      "status": "success",                                       │  │
│  │      "response": {...},                                         │  │
│  │      "next_actions": [...],                                     │  │
│  │      "metadata": {...}                                          │  │
│  │    }                                                             │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Action Handlers                                                │  │
│  │                                                                 │  │
│  │ ┌────────────────────────────────────────────────────────────┐ │  │
│  │ │ handleUIAction(userId, businessId, payload, supabase)     │ │  │
│  │ │ ─────────────────────────────────────────────────────────  │ │  │
│  │ │ 1. Get active template from ui_templates                  │ │  │
│  │ │ 2. Get dashboard widgets from dashboard_widgets           │ │  │
│  │ │ 3. Transform widgets: add config, data                    │ │  │
│  │ │ 4. Build layout schema                                    │ │  │
│  │ │ 5. Return uiState:                                         │ │  │
│  │ │    {                                                        │ │  │
│  │ │      layout: '...',                                         │ │  │
│  │ │      widgets: [{id, type, title, size, config, data}...], │ │  │
│  │ │      floating_chat: true,                                  │ │  │
│  │ │      permissions: {...},                                   │ │  │
│  │ │      theme: 'light',                                        │ │  │
│  │ │      brand: 'default'                                       │ │  │
│  │ │    }                                                         │ │  │
│  │ └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                 │  │
│  │ ┌────────────────────────────────────────────────────────────┐ │  │
│  │ │ handleChatAction(userId, businessId, payload, supabase)   │ │  │
│  │ │ ─────────────────────────────────────────────────────────  │ │  │
│  │ │ 1. Get RAG context                                         │ │  │
│  │ │ 2. Queue AI task to node_ai_task_queue                    │ │  │
│  │ │ 3. Return response:                                         │ │  │
│  │ │    {                                                         │ │  │
│  │ │      type: 'chat_async_queued',                             │ │  │
│  │ │      text: 'Your request is queued...',                     │ │  │
│  │ │      task_id: 'task_...',                                   │ │  │
│  │ │      ui: {...} // Optional: update UI                      │ │  │
│  │ │    }                                                         │ │  │
│  │ └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                 │  │
│  │ ┌────────────────────────────────────────────────────────────┐ │  │
│  │ │ handleDataAction(userId, businessId, payload, supabase)   │ │  │
│  │ │ ─────────────────────────────────────────────────────────  │ │  │
│  │ │ 1. Execute template query via RPC                         │ │  │
│  │ │ 2. Apply RLS filters                                      │ │  │
│  │ │ 3. Cache results                                          │ │  │
│  │ │ 4. Return paginated data                                  │ │  │
│  │ └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Database (Supabase PostgreSQL)                                 │  │
│  │                                                                 │  │
│  │ Tables Used:                                                    │  │
│  │ ├─ users: user records                                         │  │
│  │ ├─ business_users: user-business mapping                       │  │
│  │ ├─ ui_templates: UI layout templates                           │  │
│  │ ├─ dashboard_widgets: widget definitions                       │  │
│  │ ├─ node_trust_state: user trust scores                         │  │
│  │ ├─ node_ai_task_queue: AI processing queue                     │  │
│  │ ├─ ai_execution_log: API call logs                             │  │
│  │ ├─ node_execution_log: execution logs                          │  │
│  │ └─ node_event_queue: async events                              │  │
│  │                                                                 │  │
│  │ RPCs Used:                                                      │  │
│  │ ├─ check_action_permission(business_id, user_id, permission)  │  │
│  │ ├─ build_rag_context(query_text, business_id)                │  │
│  │ └─ run_template_query_cached(...)                              │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Complete Request/Response Cycle

```
╔═══════════════════════════════════════════════════════════════════════╗
║           DATA FLOW: UI Bootstrap Request/Response                    ║
╚═══════════════════════════════════════════════════════════════════════╝

FRONTEND SIDE
─────────────

  App Startup
  │
  └─► index.js routes to AppRenderEngine
      │
      └─► UIProvider initializes
          │
          └─► Renderer mounts
              │
              useEffect(() => {
                const response = await uiBootstrap();
                setUIState(response.response.ui);
              }, [])
              │
              └─► KernelClient.uiBootstrap()
                  │
                  POST /kernel/execute
                  Authorization: Bearer {token}
                  {
                    "action": "ui_bootstrap",
                    "payload": { "brand": "default" }
                  }
                  │
                  └──► [NETWORK REQUEST]

                        ║
                        ║ BACKEND SIDE
                        ║ ────────────
                        ║
                        └──► kernel-execute.js
                             │
                             1. JWT Validation
                             │  └─ jwt.decode(token)
                             │
                             2. User Resolution
                             │  └─ SELECT FROM users WHERE id = ?
                             │
                             3. Business Resolution
                             │  └─ SELECT FROM business_users WHERE user_id = ?
                             │
                             4. Permission Check
                             │  └─ RPC: check_action_permission()
                             │
                             5. Trust Score Check
                             │  └─ SELECT FROM node_trust_state WHERE nid_hash = ?
                             │
                             6. Route Action
                             │  └─ action === 'ui_bootstrap'
                             │      └─► handleUIAction()
                             │          │
                             │          1. SELECT FROM ui_templates
                             │          2. SELECT FROM dashboard_widgets
                             │          3. Transform widgets
                             │          4. Build uiState
                             │          │
                             │          return {
                             │            response: {
                             │              ui: {
                             │                layout: 'grid',
                             │                widgets: [{...}, {...}],
                             │                floating_chat: true,
                             │                permissions: {...},
                             │                theme: 'light',
                             │                brand: 'default'
                             │              }
                             │            },
                             │            nextActions: [...],
                             │            asyncEvents: [...]
                             │          }
                             │
                             7. Logging
                             │  ├─ INSERT ai_execution_log
                             │  ├─ INSERT node_execution_log
                             │  └─ INSERT node_event_queue
                             │
                             8. Return Response
                             │  {
                             │    "status": "success",
                             │    "request_id": "req_...",
                             │    "user_id": "...",
                             │    "business_id": "...",
                             │    "trust_score": 85,
                             │    "response": {
                             │      "type": "ui_bootstrap",
                             │      "ui": {
                             │        "layout": "grid",
                             │        "widgets": [{...}, {...}],
                             │        "floating_chat": true,
                             │        "permissions": {...},
                             │        "theme": "light",
                             │        "brand": "default"
                             │      }
                             │    },
                             │    "next_actions": [...],
                             │    "metadata": {...}
                             │  }
                             │
                             └──► [NETWORK RESPONSE]
                        ║
                        ║
                        └──► [BACK TO FRONTEND]

FRONTEND SIDE (CONTINUED)
────────────────────────

  KernelClient receives response
  │
  └─► Parse response
      │
      └─► Check: response.success && response.response?.ui
          │
          └─► Renderer.bootstrapUI() completes
              │
              setUIState(response.response.ui)
              │
              └─► UIStateManager updates global state
                  │
                  setUIState({
                    layout: 'grid',
                    widgets: [{id, type, title, size, config, data}, ...],
                    floating_chat: true,
                    permissions: {...},
                    theme: 'light',
                    brand: 'default'
                  })
                  │
                  └─► Context subscribers notified
                      │
                      └─► Renderer re-renders
                          │
                          └─► Return (
                                <div>
                                  <LayoutRenderer layout={uiState.layout}>
                                    {uiState.widgets.map(widget => (
                                      <WidgetRenderer key={widget.id} widget={widget} />
                                    ))}
                                  </LayoutRenderer>
                                  {uiState.floating_chat && <FloatingChat />}
                                </div>
                              )
                          │
                          └─► Browser renders final UI
                              │
                              ✓ Dashboard with dynamic widgets
                              ✓ Floating chat button
                              ✓ All data from API

END OF CYCLE
```

## Component Dependency Graph

```
                              App Entry
                              │
                    ┌─────────┘
                    │
        ┌───────────────────────┐
        │  index.js             │
        │  (Route Dispatcher)   │
        └───────────┬───────────┘
                    │
        ┌───────────────────────────┐
        │  AppRenderEngine.tsx      │
        │  (Main App Wrapper)       │
        └───────────┬───────────────┘
                    │
        ┌───────────────────────────┐
        │  UIProvider               │
        │  (UIStateManager.tsx)     │
        └───────────┬───────────────┘
                    │
        ┌───────────────────────────┐
        │  Renderer.tsx             │
        │  (Master Renderer)        │
        └─────────┬───────┬──────────┘
                  │       │
        ┌─────────┴┐    ┌─┴──────┐
        │           │    │         │
    ┌───┴──┐  ┌────┴───┐ │  ┌────┴────┐
    │       │  │        │ │  │         │
Layout   Widget   Floating  KernelClient
Renderer Renderer  Chat      │
                            │
                    ┌───────┴─────────┐
                    │                 │
              uiBootstrap()      chatSend()
                    │                 │
                    └────────┬────────┘
                             │
                    POST /kernel/execute
                             │
                    ┌────────────────┐
                    │  Backend API   │
                    │ kernel-execute │
                    └────────────────┘
```

## State Flow Diagram

```
┌──────────────────────────────┐
│  Global UIState              │
│  (React Context)             │
│                              │
│  {                           │
│    layout: string,           │
│    widgets: Widget[],        │
│    floating_chat: boolean,   │
│    permissions: Object,      │
│    theme: string,            │
│    brand: string,            │
│    metadata: Object          │
│  }                           │
└──────┬───────────────────────┘
       │
       │ setUIState(newState)
       │
       ├─ From: Renderer.bootstrapUI()
       │       └─ response.response.ui from /kernel/execute
       │
       ├─ From: FloatingChat chat response
       │       └─ response.response.ui
       │
       ├─ From: WidgetRenderer action
       │       └─ response.response.ui
       │
       └─ From: WebSocket RealtimeClient
               └─ kernel_update event

       │
       ├──► Context subscribers re-render
       │    ├─ Renderer.tsx
       │    ├─ FloatingChat.tsx
       │    └─ WidgetRenderer.tsx
       │
       └──► UI updates reflect new state
```

## Widget Lifecycle

```
1. Bootstrap
   └─ Renderer calls uiBootstrap()
      └─ API returns widgets array
         └─ setUIState({..., widgets: []})

2. Render
   └─ uiState.widgets.map(widget =>
        <WidgetRenderer widget={widget} />
     )
      └─ WidgetRenderer renders based on type

3. Interactive
   └─ User interacts with widget
      └─ Widget sends request via KernelClient
         └─ /kernel/execute response includes new ui
            └─ setUIState(response.response.ui)
               └─ Widget re-renders

4. Cleanup
   └─ Component unmounts
      └─ Event listeners removed
         └─ State references cleared
```

## Authentication Flow

```
1. User logs in via /login
   └─ Receives JWT token
      └─ Stored in localStorage

2. App startup
   └─ Check localStorage for token
      └─ Store in memory for requests

3. API requests
   └─ KernelClient adds:
      ├─ Authorization: Bearer {token}
      ├─ X-Client-Domain: {domain}
      └─ Device fingerprint

4. Backend validates
   └─ jwt.decode(token)
      └─ Extract user_id, business_id
         └─ Verify permissions

5. Response returned
   └─ If valid: execute request
      └─ If invalid: 401 Unauthorized
```

---

**Diagram Version**: 1.0
**Last Updated**: 2024
**Status**: Complete
