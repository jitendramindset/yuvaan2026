# 🚀 QUICK START: LOGIN, LOGOUT & DASHBOARD INTEGRATION

## 5-Minute Setup Guide

### Step 1: Copy Services to UI

```bash
# Copy these files to your project:
cp src/services/AuthService.js src/services/
cp src/services/DashboardManagementService.js src/services/
cp src/components/DashboardSelector.js src/components/
cp src/styles/DashboardSelector.css src/styles/
```

### Step 2: Copy API Routes to Backend

```bash
# Copy these files to your backend:
cp routes/auth-api.js routes/
cp routes/dashboard-api.js routes/
```

### Step 3: Mount Routes in server.js

```javascript
// In your server.js or app.js

const authAPI = require('./routes/auth-api');
const dashboardAPI = require('./routes/dashboard-api');

// Mount routes BEFORE other middleware
app.use('/auth', authAPI);
app.use('/api/dashboard', dashboardAPI);
```

### Step 4: Update App.js

```javascript
// Replace your App.js with AppUpdated.js content
// OR manually integrate:

import AuthService from './services/AuthService';
import DashboardManagementService from './services/DashboardManagementService';
import DashboardSelector from './components/DashboardSelector';

function App() {
  const [user, setUser] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  // After login
  async function handleLoginSuccess(userData) {
    AuthService.setToken(userData.token);
    setUser(userData.user);
    
    // Load dashboards
    const result = await DashboardManagementService.getUserDashboards();
    if (result.defaultDashboard) {
      setSelectedDashboard(result.defaultDashboard);
    }
  }

  // Logout
  async function handleLogout() {
    await AuthService.logout();
    setUser(null);
  }

  return user ? (
    <>
      <DashboardSelector onLogout={handleLogout} />
      {/* Rest of your app */}
    </>
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
}
```

### Step 5: Create Database Tables

Run this SQL in Supabase:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  mobile_no VARCHAR(20),
  avatar_url TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dashboards
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  description TEXT,
  config JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard widgets
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id),
  type VARCHAR(100) NOT NULL,
  config JSONB,
  position INTEGER DEFAULT 0,
  size JSONB DEFAULT '{"width": 1, "height": 1}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
```

### Step 6: Set Environment Variables

**.env (Backend)**
```
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=24h
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**.env (Frontend)**
```
REACT_APP_API_URL=http://localhost:3000
```

### Step 7: Test It!

```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start frontend
npm start

# Open browser to http://localhost:3000
```

---

## 🎯 Core Features

### Login Flow
```javascript
import AuthService from './services/AuthService';

// User enters email & password
const result = await AuthService.login('user@example.com', 'password');

if (result.success) {
  console.log('✅ Logged in!');
  console.log('Token:', result.token);
  console.log('User:', result.user);
} else {
  console.log('❌ Login failed:', result.error);
}
```

### Logout Flow
```javascript
// User clicks logout
const result = await AuthService.logout();

if (result.success) {
  console.log('✅ Logged out!');
  // Redirect to login page
  navigate('/login');
}
```

### Dashboard Selection
```javascript
import DashboardManagementService from './services/DashboardManagementService';

// Get all dashboards
const result = await DashboardManagementService.getUserDashboards();
console.log('All dashboards:', result.dashboards);
console.log('Default:', result.defaultDashboard);

// Select a dashboard
DashboardManagementService.selectDashboard(dashboardId);

// Create new dashboard
const newDash = await DashboardManagementService.createDashboard('My Analytics');

// Set as default
await DashboardManagementService.setDefaultDashboard(dashboardId);

// Clone dashboard
await DashboardManagementService.cloneDashboard(dashboardId, 'Backup');

// Delete dashboard
await DashboardManagementService.deleteDashboard(dashboardId);
```

---

## 🔗 API Endpoints (All Implemented)

### Auth Endpoints
```
POST   /auth/signup               - Register
POST   /auth/login                - Login
POST   /auth/logout               - Logout ⭐
POST   /auth/refresh              - Refresh token
GET    /auth/profile              - Get profile
PUT    /auth/profile              - Update profile
POST   /auth/password/change      - Change password
POST   /auth/password/reset-request   - Request reset
POST   /auth/password/reset-confirm   - Confirm reset
```

### Dashboard Endpoints
```
GET    /api/dashboard/user/list           - Get all dashboards
GET    /api/dashboard/:id/full            - Get dashboard with widgets
POST   /api/dashboard/create              - Create dashboard
PUT    /api/dashboard/:id/update          - Update dashboard
DELETE /api/dashboard/:id/delete          - Delete dashboard
POST   /api/dashboard/:id/set-default     - Set as default ⭐
POST   /api/dashboard/:id/clone           - Clone dashboard
GET    /api/dashboard/:id/widgets         - Get widgets
POST   /api/dashboard/:id/widget/add      - Add widget
DELETE /api/dashboard/:id/widget/:widgetId - Remove widget
POST   /api/dashboard/:id/layout/save     - Save layout
```

---

## 📱 Component Usage

### DashboardSelector Component
```jsx
import DashboardSelector from './components/DashboardSelector';

function App() {
  const handleSelectDashboard = (dashboard) => {
    console.log('Selected:', dashboard);
    // Load dashboard data
  };

  const handleLogout = () => {
    // Clear user
    // Redirect to login
  };

  return (
    <DashboardSelector
      onSelectDashboard={handleSelectDashboard}
      onLogout={handleLogout}
    />
  );
}
```

---

## ✅ Verification Checklist

- [ ] AuthService imported and working
- [ ] DashboardManagementService imported and working
- [ ] DashboardSelector component displays
- [ ] Can login with email/password
- [ ] Can logout successfully
- [ ] Dashboards load after login
- [ ] Can create new dashboard
- [ ] Can select different dashboard
- [ ] Can delete dashboard
- [ ] localStorage cleared after logout
- [ ] Authorization header sent with requests
- [ ] Database tables created
- [ ] Environment variables set

---

## 🐛 Quick Fixes

**"Module not found" error**
→ Make sure you copied all service and component files to correct directories

**"Token invalid" error**
→ Check JWT_SECRET matches on backend and frontend, token not expired

**"Dashboards not loading" error**
→ Verify user has auth token in localStorage, database tables exist

**"Logout not working" error**
→ Check localStorage.clear() is called, ensure Authorization header in API call

---

**🎉 Everything is now integrated and ready to use!**
