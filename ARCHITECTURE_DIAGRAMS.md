# 📊 SYSTEM ARCHITECTURE DIAGRAMS

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     YUVAAN COMPLETE SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FRONTEND (React)                BACKEND (Node.js)                  │
│  ┌──────────────────────┐       ┌──────────────────────┐           │
│  │      App.js          │       │    server.js         │           │
│  └──────┬───────────────┘       └──────┬───────────────┘           │
│         │                              │                            │
│         ├─→ AuthService               │                            │
│         │   ├─ login()                │                            │
│         │   ├─ logout()               │                            │
│         │   ├─ signup()               │                            │
│         │   └─ refreshToken()         │                            │
│         │                             │                            │
│         ├─→ DashboardMgmt Service    │                            │
│         │   ├─ getUserDashboards()   │                            │
│         │   ├─ selectDashboard()     │                            │
│         │   ├─ createDashboard()     │                            │
│         │   └─ deleteDashboard()     │                            │
│         │                             │                            │
│         └─→ DashboardSelector Comp   │                            │
│             ├─ Show current           │                            │
│             ├─ Dropdown list          │                            │
│             └─ Quick actions          │                            │
│                  ↓                    ↓                            │
│            HTTP API Calls        ┌─ /auth/* Routes ──────┐       │
│            (axios)               │ POST /auth/signup      │       │
│                                 │ POST /auth/login       │       │
│                ↓                 │ POST /auth/logout   ⭐ │       │
│            localStorage          │ POST /auth/refresh    │       │
│            (token, user_id)      │ GET  /auth/profile    │       │
│                                 │ PUT  /auth/profile    │       │
│                                 └────────────────────────┘       │
│                                 ┌─ /api/dashboard/* Routes ────┐ │
│                                 │ GET  /user/list               │ │
│                                 │ POST /create                  │ │
│                                 │ PUT  /:id/update             │ │
│                                 │ DELETE /:id/delete           │ │
│                                 │ POST /:id/set-default   ⭐   │ │
│                                 │ POST /:id/clone              │ │
│                                 └───────────────────────────────┘ │
│                                           ↓                       │
│                                    ┌──────────────────┐            │
│                                    │  Supabase DB     │            │
│                                    ├──────────────────┤            │
│                                    │ - users          │            │
│                                    │ - dashboards     │            │
│                                    │ - dashboard_...  │            │
│                                    │ - password_reset │            │
│                                    └──────────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Token Flow

```
┌────────────────────────────────────────────────────────────┐
│           TOKEN LIFECYCLE                                  │
└────────────────────────────────────────────────────────────┘

USER SIGNUP:
┌─────────────┐
│  Frontend   │
│  Email +    │
│  Password   │
└──────┬──────┘
       │
       │ POST /auth/signup
       ↓
┌──────────────────┐
│   Backend Auth   │
│   - Hash pwd     │
│   - Save user    │
│   - Generate JWT │
└──────┬───────────┘
       │
       │ Return {token, user}
       ↓
┌──────────────────┐
│   Frontend       │
│   localStorage   │
│   auth_token     │
└──────────────────┘


USER LOGIN:
┌─────────────┐
│  Frontend   │
│  Email +    │
│  Password   │
└──────┬──────┘
       │
       │ POST /auth/login
       ↓
┌──────────────────────┐
│   Backend Auth       │
│   - Find user        │
│   - Verify password  │
│   - Generate JWT     │
│   - Update last_login│
└──────┬───────────────┘
       │
       │ Return {token, user}
       ↓
┌──────────────────┐
│   Frontend       │
│   localStorage   │
│   auth_token     │
│   + axios header │
└──────────────────┘


TOKEN USAGE (Protected Requests):
┌──────────────────┐
│  Frontend API    │
│  Call with       │
│  Authorization:  │
│  Bearer TOKEN    │
└──────┬───────────┘
       │
       ↓
┌──────────────────────┐
│  Backend Middleware  │
│  requireAuth         │
│  - Extract token     │
│  - Verify JWT        │
│  - Check expiry      │
└──────┬───────────────┘
       │
       ├─→ Valid? ──→ Continue to route ──→ Execute
       │
       └─→ Invalid? ──→ Return 401 error ──→ Clear token


TOKEN REFRESH:
┌──────────────────┐
│  Token about to  │
│  expire          │
└──────┬───────────┘
       │
       │ POST /auth/refresh
       ↓
┌──────────────────────┐
│  Backend - Verify    │
│  old token valid     │
│  Generate new token  │
└──────┬───────────────┘
       │
       │ Return {token}
       ↓
┌──────────────────┐
│  Frontend update │
│  auth_token      │
│  in localStorage │
└──────────────────┘


LOGOUT:
┌──────────────────┐
│  Frontend        │
│  Click Logout    │
└──────┬───────────┘
       │
       │ POST /auth/logout
       │ With Bearer token
       ↓
┌──────────────────────┐
│  Backend - Optional: │
│  Invalidate session  │
│  in database         │
└──────┬───────────────┘
       │
       │ Return success
       ↓
┌──────────────────────┐
│  Frontend            │
│  localStorage.clear()│
│  - auth_token        │
│  - user_id           │
│  - all user data     │
└──────────────────────┘
```

---

## Dashboard Selection Flow

```
┌──────────────────────────────────────────────────────────┐
│           DASHBOARD SELECTION FLOW                        │
└──────────────────────────────────────────────────────────┘

1. USER LOGS IN:
   ┌─────────────────────┐
   │ Login → Get Token   │
   └────────────┬────────┘
                │
                ↓
   ┌─────────────────────────────────────┐
   │ DashboardManagementService.        │
   │ getUserDashboards()                │
   │                                     │
   │ GET /api/dashboard/user/list       │
   │ Header: Authorization: Bearer TOKEN │
   └────────────┬────────────────────────┘
                │
                ├─→ [Dashboard 1]
                ├─→ [Dashboard 2] (is_default: true)
                ├─→ [Dashboard 3]
                └─→ [Dashboard 4]
                       ↓
            Auto-select Dashboard 2


2. SHOW SELECTOR IN UI:
   ┌──────────────────────────────────┐
   │  Header Bar:                      │
   │  ┌────────────────────────────┐   │
   │  │ 📊 Dashboard 2 (Default) ▼ │   │
   │  └────────┬───────────────────┘   │
   │           │ On Click              │
   │           ↓                        │
   │  ┌───────────────────────────┐    │
   │  │ DashboardSelector Dropdown│    │
   │  ├───────────────────────────┤    │
   │  │ ➕ Create New Dashboard   │    │
   │  ├───────────────────────────┤    │
   │  │ Dashboard 1               │    │
   │  │ • Clone  🔄 Delete ❌     │    │
   │  │ Dashboard 2 ✓ [Selected]  │    │
   │  │ • Clone  🔄 Delete ❌     │    │
   │  │ Dashboard 3               │    │
   │  │ • Clone  🔄 Delete ❌     │    │
   │  │ Dashboard 4               │    │
   │  │ • Clone  🔄 Delete ❌     │    │
   │  ├───────────────────────────┤    │
   │  │ ⚙️  Settings              │    │
   │  │ 🚪 Log Out               │    │
   │  └───────────────────────────┘    │
   └──────────────────────────────────┘


3. USER ACTIONS:

   A. SELECT DIFFERENT DASHBOARD:
      Click "Dashboard 3"
         ↓
      DashboardManagementService.selectDashboard("dashboard_3_id")
         ↓
      GET /api/dashboard/dashboard_3_id/full
         ↓
      Load Dashboard 3 with its widgets
         ↓
      Close dropdown
         ↓
      Display Dashboard 3 widgets


   B. CREATE NEW DASHBOARD:
      Click "➕ Create New Dashboard"
         ↓
      Show inline form
         ↓
      Enter name: "Sales Report"
         ↓
      Click Create
         ↓
      POST /api/dashboard/create
      { name: "Sales Report", type: "custom" }
         ↓
      Backend creates dashboard
         ↓
      Add to local list
         ↓
      Auto-select new dashboard


   C. SET AS DEFAULT:
      Click ★ icon on Dashboard 3
         ↓
      POST /api/dashboard/dashboard_3_id/set-default
         ↓
      Backend:
      - Set all other dashboards is_default = false
      - Set Dashboard 3 is_default = true
         ↓
      Update UI:
      - Show "Default" badge on Dashboard 3
      - Remove from others


   D. CLONE DASHBOARD:
      Click 📋 icon on Dashboard 3
         ↓
      POST /api/dashboard/dashboard_3_id/clone
      { name: "Dashboard 3 (Copy)" }
         ↓
      Backend:
      - Copy dashboard config
      - Copy all widgets
      - Create new entry
         ↓
      Add to list
         ↓
      Notify user


   E. DELETE DASHBOARD:
      Click ❌ icon on Dashboard 4
         ↓
      Confirm deletion
         ↓
      DELETE /api/dashboard/dashboard_4_id/delete
         ↓
      Backend:
      - Delete widgets
      - Delete dashboard
         ↓
      Remove from list
         ↓
      If was selected, select another


4. LOGOUT:
   Click "🚪 Log Out"
      ↓
   POST /auth/logout (with Bearer token)
      ↓
   Backend invalidates session
      ↓
   Frontend:
   - localStorage.clear()
   - Clear auth_token
   - Reset state
   - Redirect to login
      ↓
   User sees login page
```

---

## Database Schema

```
┌─────────────────────────────────┐
│         USERS TABLE             │
├─────────────────────────────────┤
│ id (UUID PK)                    │
│ email (VARCHAR UNIQUE)          │
│ password_hash (VARCHAR)         │
│ full_name (VARCHAR)             │
│ mobile_no (VARCHAR)             │
│ avatar_url (TEXT)               │
│ mfa_enabled (BOOLEAN)           │
│ last_login (TIMESTAMP)          │
│ created_at (TIMESTAMP)          │
│ updated_at (TIMESTAMP)          │
└────────────┬────────────────────┘
             │ (1 to Many)
             │
             ↓
┌─────────────────────────────────┐
│     DASHBOARDS TABLE            │
├─────────────────────────────────┤
│ id (UUID PK)                    │
│ user_id (UUID FK) ───────────┐  │
│ name (VARCHAR)                │  │
│ type (VARCHAR)                │  │
│ description (TEXT)            │  │
│ config (JSONB)                │  │
│ is_default (BOOLEAN)     ⭐  │  │
│ created_at (TIMESTAMP)        │  │
│ updated_at (TIMESTAMP)        │  │
└────────────┬────────────────────┘
             │ (1 to Many)
             │
             ↓
┌──────────────────────────────────┐
│  DASHBOARD_WIDGETS TABLE         │
├──────────────────────────────────┤
│ id (UUID PK)                     │
│ dashboard_id (UUID FK)           │
│ type (VARCHAR)                   │
│ config (JSONB)                   │
│ position (INTEGER)               │
│ size (JSONB)                     │
│ created_at (TIMESTAMP)           │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ PASSWORD_RESET_TOKENS TABLE      │
├──────────────────────────────────┤
│ id (UUID PK)                     │
│ user_id (UUID FK)                │
│ token (TEXT UNIQUE)              │
│ expires_at (TIMESTAMP)           │
│ created_at (TIMESTAMP)           │
└──────────────────────────────────┘
```

---

## Request/Response Flow

```
┌──────────────────────────────────────────┐
│         API REQUEST FLOW                 │
└──────────────────────────────────────────┘

1. LOGIN REQUEST:

   Client                          Server
   ┌──────────────────────┐       ┌──────────────────┐
   │ POST /auth/login     │ ──→   │ Check email      │
   │ {                    │       │ Verify password  │
   │  email: "user@.com"  │       │ Generate JWT     │
   │  password: "pass123" │       │ Update last_login│
   │ }                    │       └──────────────────┘
   └──────────────────────┘                 │
                                            ↓
                         ┌──────────────────────────┐
                         │ {                        │
                         │  success: true,          │
                         │  token: "JWT...",        │
                         │  user: {                 │
                         │    id: "uuid",           │
                         │    email: "user@.com"    │
                         │  }                       │
                         │ }                        │
                         └──────────────────────────┘


2. PROTECTED REQUEST (Dashboard List):

   Client                              Server
   ┌─────────────────────────────────┐ ┌──────────────────┐
   │ GET /api/dashboard/user/list     │→│ middleware:      │
   │ Headers:                          │ │ - Extract token  │
   │ Authorization:                    │ │ - Verify JWT     │
   │ Bearer eyJhbGc...                │ │ - Get user.id    │
   └─────────────────────────────────┘ └────────┬─────────┘
                                                │
                                                ↓
                                        ┌────────────────────┐
                                        │ SELECT * FROM      │
                                        │ dashboards WHERE   │
                                        │ user_id = ?        │
                                        └────────┬───────────┘
                                                │
                         ┌──────────────────────────────────────┐
                         │ {                                    │
                         │  success: true,                      │
                         │  data: [                             │
                         │    {                                 │
                         │      id: "dash-1",                   │
                         │      name: "Sales Analytics",        │
                         │      is_default: true,               │
                         │      ...                             │
                         │    },                                │
                         │    {                                 │
                         │      id: "dash-2",                   │
                         │      name: "Reports",                │
                         │      is_default: false,              │
                         │      ...                             │
                         │    }                                 │
                         │  ]                                   │
                         │ }                                    │
                         └──────────────────────────────────────┘


3. LOGOUT REQUEST:

   Client                          Server
   ┌──────────────────────┐       ┌──────────────────┐
   │ POST /auth/logout    │ ──→   │ Invalidate       │
   │ Headers:             │       │ session (opt)    │
   │ Authorization:       │       │ Log event        │
   │ Bearer eyJhbGc...    │       └──────────────────┘
   └──────────────────────┘                 │
                                            ↓
                         ┌──────────────────────────┐
                         │ {                        │
                         │  success: true,          │
                         │  message: "Logged out"   │
                         │ }                        │
                         └──────────────────────────┘
   
   Client receives response
       ↓
   localStorage.clear()
       ↓
   Redirect to /login
```

---

## Component Hierarchy

```
App.js
├── AuthService (Service)
├── DashboardManagementService (Service)
├── Login (Component)
│   └── Handles signup/login
│   └── Calls AuthService
│
├── Dashboard (Component)
│   ├── DashboardSelector (Component) ⭐
│   │   ├── Shows current dashboard
│   │   ├── Dropdown with all dashboards
│   │   ├── Create new dashboard
│   │   ├── Select/Delete/Clone dashboard
│   │   ├── Set as default
│   │   └── Logout button
│   │
│   ├── DashboardWidgets (Component)
│   │   ├── Stats cards
│   │   ├── Charts
│   │   ├── Tables
│   │   └── Custom widgets
│   │
│   └── FloatingChat (Component)
│
├── Introduction (Component)
└── Other components...
```

---

**All flows diagrammed and ready for implementation!** ✅
