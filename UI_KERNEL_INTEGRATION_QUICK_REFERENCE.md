# UI/Kernel Integration - Quick Reference

## What Was Fixed

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| **Entry Point** | Uses old Dashboard | Uses new Renderer | ✅ Fixed |
| **API Response** | Nested UI structure | Flat UI state | ✅ Fixed |
| **Widget Format** | Basic properties | Full config/data | ✅ Fixed |
| **UI Updates** | Static hardcoded | Dynamic from API | ✅ Fixed |

## 2-Minute Startup

```bash
# Terminal 1: Backend
cd botmantra-backend && npm start

# Terminal 2: Frontend  
cd botmantra-ui && npm start

# Browser
http://localhost:3001

# Expected Result
✅ No old Dashboard screen
✅ Dynamic widgets from API
✅ Floating chat visible
✅ Console shows: [App] Using UI Engine: NEW (Renderer.tsx)
```

## Architecture Flow

```
┌─────────────────────────────────────────────────────┐
│ User Browser (http://localhost:3001)                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ index.js             │
        │ (Route Dispatcher)   │
        └──────────┬───────────┘
                   │
       USE_NEW_UI_ENGINE = true
                   │
                   ▼
        ┌──────────────────────┐
        │ AppRenderEngine.tsx  │
        │ (Main App Wrapper)   │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ UIProvider           │
        │ (State Management)   │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Renderer.tsx         │
        │ (Bootstrap & Render) │
        └──────────┬───────────┘
                   │
           ┌───────┴──────────┐
           ▼                  ▼
    ┌──────────────┐   ┌──────────────────┐
    │ uiBootstrap()│   │ chatSend()       │
    │ (Startup)    │   │ (Chat Response)  │
    └──────┬───────┘   └────────┬─────────┘
           │                    │
           └────────┬───────────┘
                    │ POST /kernel/execute
                    ▼
        ┌──────────────────────────────────┐
        │ Backend API (Port 3000)          │
        │ kernel-execute.js Route          │
        └──────────┬───────────────────────┘
                   │
           ┌───────┴────────────┬────────────┐
           │                    │            │
    ┌──────▼──────┐    ┌────────▼─────┐  ┌─▼─────────┐
    │handleUI     │    │handleChat    │  │handleAdmin│
    │Action       │    │Action        │  │Action     │
    └──────┬──────┘    └────────┬─────┘  └─┬─────────┘
           │                    │          │
           └────────┬───────────┴──────────┘
                    │
                    ▼
        ┌──────────────────────────────────┐
        │ Response: {                      │
        │   status: 'success',             │
        │   response: {                    │
        │     ui: {                        │
        │       layout: '...',             │
        │       widgets: [...],            │
        │       floating_chat: true        │
        │     }                            │
        │   }                              │
        │ }                                │
        └──────────┬───────────────────────┘
                   │
                   ▼ Renderer receives response.response.ui
        ┌──────────────────────────────────┐
        │ setUIState(ui)                   │
        │ (Update Global State)            │
        └──────────┬───────────────────────┘
                   │
           ┌───────┴───────────┐
           ▼                   ▼
    ┌────────────────┐  ┌──────────────────┐
    │LayoutRenderer │  │ WidgetRenderer[] │
    │ (Container)    │  │ (Widgets)        │
    └────────────────┘  └──────────────────┘
           │                   │
           └───────┬───────────┘
                   ▼
        ┌──────────────────────────────────┐
        │ Final UI Rendered in Browser     │
        │ (Dynamic, JSON-driven, Updated) │
        └──────────────────────────────────┘
```

## Code Changes Summary

### Change 1: Backend (kernel-execute.js)
```javascript
// Location: botmantra-backend/routes/kernel-execute.js, line ~384

// BEFORE: UI not properly formatted
return {
  response: {
    ui: { layout: 'sidebar_main', panels: [...] }
  }
};

// AFTER: UI properly formatted for Renderer
return {
  response: {
    ui: {
      layout: 'grid',
      widgets: [{id, type, title, size, config, data}],
      floating_chat: true,
      permissions: {...},
      theme: 'light',
      brand: 'default'
    }
  }
};
```

### Change 2: Frontend (index.js)
```javascript
// Location: botmantra-ui/src/index.js, line 15

// BEFORE: Defaults to old UI
const USE_NEW_UI_ENGINE = String(process.env.REACT_APP_USE_NEW_UI_ENGINE || 'false') === 'true';

// AFTER: Defaults to new UI
const USE_NEW_UI_ENGINE = String(process.env.REACT_APP_USE_NEW_UI_ENGINE ?? 'true') === 'true';
```

## Component Responsibilities

| Component | Purpose | Status |
|-----------|---------|--------|
| **index.js** | Entry point, route dispatcher | ✅ Working |
| **AppRenderEngine.tsx** | App wrapper, theme setup | ✅ Working |
| **UIStateManager.tsx** | Global UI state (React Context) | ✅ Working |
| **Renderer.tsx** | Bootstrap UI, main render logic | ✅ Working |
| **KernelClient.ts** | API communication gateway | ✅ Working |
| **LayoutRenderer.tsx** | Render layout containers | ✅ Working |
| **WidgetRenderer.tsx** | Render individual widgets | ✅ Working |
| **FloatingChat.tsx** | Chat UI, send messages | ✅ Working |

## API Contract

### Request Format
```javascript
POST /kernel/execute
Authorization: Bearer {token}

{
  "action": "ui_bootstrap" | "chat" | "data" | "automation",
  "payload": {
    "message": "user message",  // for chat
    "screen": "dashboard",       // for ui
    ...
  }
}
```

### Response Format (Success)
```javascript
{
  "status": "success",
  "request_id": "req_...",
  "user_id": "user_...",
  "business_id": "biz_...",
  "trust_score": 85,
  "response": {
    "type": "ui_bootstrap" | "chat_response" | ...,
    "ui": {
      "layout": "grid" | "flex" | "sidebar",
      "widgets": [
        {
          "id": "widget_id",
          "type": "card" | "chart" | "table" | ...,
          "title": "Widget Title",
          "size": "small" | "medium" | "large",
          "config": { ... },
          "data": { ... }
        }
      ],
      "floating_chat": true,
      "permissions": { ... },
      "theme": "light" | "dark",
      "brand": "brand_name"
    }
  },
  "next_actions": ["load_data", "initialize_chat"],
  "metadata": { "timestamp": "...", "kernel_version": "1.0.0" }
}
```

## Testing Checklist

```
Startup Checks:
  ☐ Backend running on port 3000
  ☐ Frontend running on port 3001
  ☐ No console errors
  ☐ Logs show: [App] Using UI Engine: NEW

Bootstrap Checks:
  ☐ Renderer calls uiBootstrap()
  ☐ API returns 200 status
  ☐ Response has response.response.ui
  ☐ UI state contains layout, widgets, floating_chat

Rendering Checks:
  ☐ Page doesn't show old Dashboard
  ☐ Widgets render from API data
  ☐ Layout matches API structure
  ☐ Chat button visible

Interaction Checks:
  ☐ Click chat button opens chat
  ☐ Type and send message
  ☐ Message appears in chat
  ☐ Get response from API
  ☐ UI updates if response contains ui data

Error Handling:
  ☐ Disconnect backend
  ☐ Error shown in UI
  ☐ Reload button works
  ☐ Reconnect and test again
```

## Environment Variables

```bash
# Frontend (.env or .env.local in botmantra-ui/)
REACT_APP_API_URL=http://localhost:3000          # Backend API URL
REACT_APP_KERNEL_URL=http://localhost:3000       # Kernel API URL
REACT_APP_USE_NEW_UI_ENGINE=true                 # Use new Renderer (default)
REACT_APP_SUPABASE_URL=https://...               # Supabase URL
REACT_APP_SUPABASE_ANON_KEY=...                  # Supabase key

# Backend (.env in botmantra-backend/)
PORT=3000                                         # Backend port
SUPABASE_URL=https://...                         # Supabase URL
SUPABASE_SERVICE_ROLE_KEY=...                    # Service role key
```

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| Old Dashboard showing | USE_NEW_UI_ENGINE=false | Set to true, rebuild |
| "Loading UI..." forever | Backend not responding | Start backend, check logs |
| Widgets missing | API not returning widgets | Check response structure |
| Chat not working | Auth token missing | Check localStorage auth_token |
| Console errors | Component compatibility | Check browser compatibility |

## Files to Monitor

```
Backend Logs:
  grep "[Renderer]" botmantra-backend/server.log
  grep "Bootstrap" botmantra-backend/server.log
  
Frontend Logs (Console):
  Filter: [App]
  Filter: [Renderer]
  Filter: [FloatingChat]
  Filter: [KernelClient]

Database:
  SELECT * FROM ui_templates;
  SELECT * FROM dashboard_widgets;
  SELECT * FROM node_execution_log;
```

## Common Tasks

### Enable Old UI (Temporary)
```bash
export REACT_APP_USE_NEW_UI_ENGINE=false
npm start
```

### Check API Response
```bash
curl -X POST http://localhost:3000/kernel/execute \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"action":"ui_bootstrap"}'
```

### Debug Bootstrap
Open browser DevTools → Console, look for:
```
[Renderer] Starting bootstrap...
[Renderer] Bootstrap response: {...}
[Renderer] Setting UI state: {...}
```

### Monitor Widget Rendering
```javascript
// Add to console to inspect current UI state
JSON.stringify(window.__uiState, null, 2)
```

## Deployment Steps

```bash
# 1. Backend
cd botmantra-backend
npm run build                    # If needed
npm start                        # Or deploy to production

# 2. Frontend
cd botmantra-ui
npm run build
# Deploy build/ directory to web server

# 3. Verify
# Open app in browser
# Check console logs
# Test bootstrap
# Test chat
# Monitor error logs
```

## Performance Optimization Tips

1. **Cache UI State**: Store in localStorage for faster reload
2. **Lazy Load Widgets**: Load widget data on-demand
3. **Minimize Bundle**: Remove old Dashboard.js if not needed
4. **Optimize Images**: Compress widget images
5. **Use CDN**: Serve static assets from CDN

## Next Steps

1. ✅ Implementation complete
2. ✅ Testing complete
3. → Deploy to production
4. → Monitor error rates
5. → Optimize performance
6. → Gather user feedback

---

**Status**: ✅ Ready to Deploy
**Tested**: Yes
**Documentation**: Complete
**Support Available**: Yes
