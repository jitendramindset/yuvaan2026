# 🔧 EXACT CODE CHANGES NEEDED

## For Existing Files

### 1. Update `server.js` or `app.js`

**ADD these lines:**

```javascript
// At the top with other imports
const authAPI = require('./routes/auth-api');
const dashboardAPI = require('./routes/dashboard-api');

// In your app.use() middleware section
// IMPORTANT: Mount BEFORE your error handler

// ✅ Add these routes
app.use('/auth', authAPI);
app.use('/api/dashboard', dashboardAPI);

// Your existing routes continue below...
app.use('/kernel', kernelExecute);
app.use('/api', apiRoutes);
// etc...
```

**Complete Example:**
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ NEW: Authentication & Dashboard Routes
const authAPI = require('./routes/auth-api');
const dashboardAPI = require('./routes/dashboard-api');

app.use('/auth', authAPI);
app.use('/api/dashboard', dashboardAPI);

// Your existing routes
const kernelExecute = require('./routes/kernel-execute');
app.use('/kernel/execute', kernelExecute);

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
```

---

### 2. Update `package.json`

**ADD to dependencies:**

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  }
}
```

**Install:**
```bash
npm install bcryptjs jsonwebtoken
```

---

### 3. Update Frontend `package.json`

**Already installed?** Check:
```bash
npm list axios
npm list react
```

If missing:
```bash
npm install axios
```

---

### 4. Create `.env` files

**Backend `.env`:**
```
# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRE=24h

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend
FRONTEND_URL=http://localhost:3001
```

**Frontend `.env`:**
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_AUTH_ENABLED=true
```

---

### 5. Update Frontend `App.js` (Full Replace)

**Option A: Full Replace** (use AppUpdated.js)
```javascript
// Replace entire content of App.js with AppUpdated.js
```

**Option B: Minimal Changes** (if you want to keep existing App.js)

Add these imports at top:
```javascript
import AuthService from './services/AuthService';
import DashboardManagementService from './services/DashboardManagementService';
import DashboardSelector from './components/DashboardSelector';
```

Add state after existing useState calls:
```javascript
const [selectedDashboard, setSelectedDashboard] = useState(null);
const [showDashboardSelector, setShowDashboardSelector] = useState(false);
```

Add these functions:
```javascript
async function handleLoginSuccess(userData) {
  AuthService.setToken(userData.token);
  AuthService.setUserId(userData.user.id);
  DashboardManagementService.setAuthToken(userData.token);
  DashboardManagementService.setUserId(userData.user.id);
  
  setUser(userData.user);
  
  // Load dashboards
  const result = await DashboardManagementService.getUserDashboards();
  if (result.defaultDashboard) {
    setSelectedDashboard(result.defaultDashboard);
  }
  
  setCurrentScreen('dashboard');
}

async function handleLogout() {
  await AuthService.logout();
  setUser(null);
  setSelectedDashboard(null);
  setCurrentScreen('introduction');
}
```

In your JSX render, add after login:
```javascript
{user && currentScreen === 'dashboard' && (
  <DashboardSelector
    onSelectDashboard={setSelectedDashboard}
    onLogout={handleLogout}
  />
)}
```

---

### 6. Update Frontend Login Component

In your `login.js` or wherever you handle login success:

```javascript
// After successful login, call:
const handleLoginSuccess = async (userData) => {
  // Store token & user
  localStorage.setItem('auth_token', userData.token);
  localStorage.setItem('user_id', userData.user.id);
  localStorage.setItem('user_email', userData.user.email);
  localStorage.setItem('autoLogin', 'true');
  
  // Initialize services
  AuthService.setToken(userData.token);
  AuthService.setUserId(userData.user.id);
  
  DashboardManagementService.setAuthToken(userData.token);
  DashboardManagementService.setUserId(userData.user.id);
  
  // Call parent callback
  onLoginSuccess(userData);
};
```

---

### 7. Database Setup (Supabase)

Run this SQL in Supabase SQL Editor:

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
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

-- Dashboards Table
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  description TEXT,
  config JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard Widgets Table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  config JSONB,
  position INTEGER DEFAULT 0,
  size JSONB DEFAULT '{"width": 1, "height": 1}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_default ON dashboards(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Enable RLS (if using Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Users RLS Policy (users can only see their own data)
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::uuid = id);

-- Dashboards RLS Policy
CREATE POLICY "Users can manage their own dashboards" ON dashboards
  FOR ALL USING (auth.uid()::uuid = user_id);

-- Dashboard Widgets RLS Policy
CREATE POLICY "Users can manage widgets of their dashboards" ON dashboard_widgets
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE user_id = auth.uid()::uuid
    )
  );
```

---

### 8. Update Middleware (if using auth-permission.js)

Ensure your middleware looks like:

```javascript
// middleware/auth-permission.js

const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No authorization header'
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId, email: decoded.email };
    } catch (error) {
      // Token invalid, continue without auth
    }
  }
  
  next();
};

module.exports = {
  requireAuth,
  optionalAuth
};
```

---

## ✅ Verification Steps

After all changes:

```bash
# 1. Install dependencies
npm install

# 2. Check environment variables
echo $JWT_SECRET
echo $SUPABASE_URL

# 3. Start backend
npm start
# Should see: ✅ Server running on port 3000

# 4. In another terminal, start frontend
cd botmantra-ui
npm start
# Should see: ✅ Compiled successfully

# 5. Test signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "full_name": "Test User"
  }'

# 6. Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 7. Test logout (replace TOKEN)
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer TOKEN"

# 8. Test dashboards (replace TOKEN)
curl -X GET http://localhost:3000/api/dashboard/user/list \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎯 Summary of Changes

| File | Changes | Type |
|------|---------|------|
| server.js | Add auth/dashboard routes | Mount |
| package.json | Add bcryptjs, jsonwebtoken | Dependencies |
| .env | Add JWT_SECRET, DB credentials | Config |
| App.js | Add dashboard selector, logout | Update |
| login.js | Initialize services | Update |
| middleware/auth-permission.js | JWT validation | Ensure exists |
| Supabase | Create tables + RLS | SQL |

---

## 🚀 You're Ready!

After these changes, you have:
✅ Secure authentication  
✅ User session management  
✅ Dashboard selection  
✅ Widget management  
✅ Password reset  
✅ Profile management  

**Next**: Open browser and test the flow!

---

*All exact code changes provided above*
