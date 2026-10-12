# Frontend-Backend Integration Guide

## Overview
Complete integration guide for connecting React UI (botmantra-ui) with Express backend (botmantra-backend).

## Port Configuration Issue ⚠️

**CRITICAL**: Frontend and backend have a port mismatch!

- **Backend Port**: `3000` (configured in `botmantra-backend/server.js`)
- **Frontend Expected Port**: `5000` (configured in `.env.local`)

### Solution Options:

#### Option 1: Update Frontend to Port 3000 (Recommended)

```bash
# In botmantra-ui/.env.local
REACT_APP_API_URL=http://localhost:3000
```

#### Option 2: Update Backend to Port 5000

```javascript
// In botmantra-backend/server.js
const PORT = process.env.PORT || 5000;
```

## Quick Setup

### 1. Backend Setup

```bash
cd botmantra-backend

# Copy environment template
copy .env.example .env

# Configure .env with your Supabase credentials
# SUPABASE_URL=your_project_url
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# SUPABASE_ANON_KEY=your_anon_key

# Install dependencies
npm install

# Start server
npm start
```

Backend will start on `http://localhost:3000`

### 2. Frontend Setup

```bash
cd botmantra-ui

# Create .env.local file
echo REACT_APP_API_URL=http://localhost:3000 > .env.local
echo REACT_APP_SUPABASE_URL=your_project_url >> .env.local
echo REACT_APP_SUPABASE_ANON_KEY=your_anon_key >> .env.local

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will start on `http://localhost:3001` (or next available port)

## New API Service Layer

### Using the API Service

```javascript
import apiService from './services/apiService';

// Example: Fetch data from template
const loadUsers = async () => {
  const result = await apiService.getData('user-list', { status: 'active' });
  console.log(result.data);
};

// Example: Generate AI embedding
const embedText = async (text) => {
  const result = await apiService.generateEmbedding(text);
  console.log(result.embedding);
};

// Example: Check permissions
const canEdit = await apiService.checkPermission('users', 'update');
console.log(canEdit.allowed);
```

### Using React Hooks

```javascript
import { useData, usePermission, useUISchema } from './hooks/useAPI';

function MyComponent() {
  // Auto-fetch data with loading/error states
  const { data, loading, error, refetch } = useData('user-list', { status: 'active' });

  // Check user permissions
  const { allowed } = usePermission('users', 'update');

  // Get UI schema for form generation
  const { schema } = useUISchema('admin', 'users');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {allowed && <button onClick={refetch}>Refresh</button>}
      {data && data.map(user => <div key={user.id}>{user.name}</div>)}
    </div>
  );
}
```

## API Endpoints Coverage

### Data Operations
- `GET /api/v1/data/:routeCode` - Fetch template data
- `POST /api/v1/data/:routeCode` - Create new record
- `PUT /api/v1/data/:routeCode/:id` - Update record
- `DELETE /api/v1/data/:routeCode/:id` - Delete record

### Business Operations
- `POST /api/v1/business/register` - Register business
- `POST /api/v1/business/initialize` - Initialize business
- `GET /api/v1/business/:businessId/users` - Get business users

### AI Features
- `POST /api/v1/ai/embedding` - Generate text embedding
- `POST /api/v1/ai/context` - Build RAG context
- `POST /api/v1/ai/prompt` - Build AI prompt
- `POST /api/v1/ai/chunk` - Chunk large text

### Query Builder
- `POST /api/v1/query/build` - Build template query
- `POST /api/v1/query/dynamic` - Execute dynamic query
- `GET /api/v1/query/kpi/:kpiCode` - Get KPI data

### Permissions
- `POST /api/v1/permissions/check` - Check table permission
- `POST /api/v1/permissions/feature` - Check feature access

### Node System
- `POST /api/v1/node/hash` - Generate node hash
- `POST /api/v1/node/karma` - Apply karma/trust
- `POST /api/v1/node/session` - Create runtime session

### UI Schema
- `GET /api/v1/ui/schema` - Get UI schema
- `GET /api/v1/ui/context` - Get UI context
- `GET /api/v1/ui/branding` - Get branding config
- `GET /api/v1/ui/widget/:widgetId` - Get widget data

### Plugins
- `POST /api/v1/plugin/execute` - Execute plugin

### Cache
- `GET /api/v1/cache/:key` - Get cached result
- `POST /api/v1/cache/:key` - Set cache value
- `DELETE /api/v1/cache/:key` - Invalidate cache

### Security
- `POST /api/v1/security/encrypt` - Encrypt data
- `POST /api/v1/security/decrypt` - Decrypt data
- `POST /api/v1/security/hash` - Hash data

### GDPR
- `POST /api/v1/gdpr/delete/:nodeId` - Delete node data

## Authentication Flow

### Login Process

```javascript
import apiService from './services/apiService';

const login = async (email, password) => {
  try {
    // Login returns token
    const result = await apiService.login({ email, password });
    
    // Token is automatically stored in localStorage
    // All subsequent API calls will include it
    
    return result.user;
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Protected Route Example

```javascript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from './services/apiService';

function ProtectedPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = apiService.getToken();
    if (!token) {
      navigate('/login');
    } else {
      // Verify token by fetching user data
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const result = await apiService.getUIContext();
      setUser(result.user);
    } catch (error) {
      // Token invalid, redirect to login
      navigate('/login');
    }
  };

  return user ? <div>Welcome, {user.name}</div> : <div>Loading...</div>;
}
```

## Migration from Old API

### Before (Direct Fetch Calls)

```javascript
// Old way - scattered fetch calls
const response = await fetch(`${process.env.REACT_APP_API_URL}/api/kernel/onboarding-status`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
```

### After (Using API Service)

```javascript
// New way - centralized service
import apiService from './services/apiService';

const data = await apiService.getData('onboarding-status');
```

### Before (Using uiToolsApi.js)

```javascript
import UIToolsAPI from './api/uiToolsApi';

const api = new UIToolsAPI();
await api.login(username, password);
const result = await api.chat(message, conversationId);
```

### After (Using New API Service)

```javascript
import apiService from './services/apiService';

await apiService.login({ username, password });
const result = await apiService.chat(message, conversationId);
```

## Files to Remove

### ❌ Dead Code (To Be Removed)

- `botmantra-ui/src/api/chat.js` - Express router code (server-side) mistakenly in frontend
- Any old API utility files once migration is complete

## Testing the Integration

### 1. Test Backend API

```bash
cd botmantra-backend
npm test
```

### 2. Test Individual Endpoints

```bash
# Get data
curl http://localhost:3000/api/v1/ui/context \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check permissions
curl -X POST http://localhost:3000/api/v1/permissions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table":"users","action":"read"}'
```

### 3. Test from React

```javascript
import { useEffect } from 'react';
import apiService from './services/apiService';

function TestComponent() {
  useEffect(() => {
    const test = async () => {
      try {
        // Test connection
        const context = await apiService.getUIContext();
        console.log('✅ API connected:', context);

        // Test permissions
        const perm = await apiService.checkPermission('users', 'read');
        console.log('✅ Permissions:', perm);

        // Test data fetch
        const data = await apiService.getData('test-route');
        console.log('✅ Data fetched:', data);
      } catch (error) {
        console.error('❌ API test failed:', error);
      }
    };

    test();
  }, []);

  return <div>Check console for test results</div>;
}
```

## Environment Variables Reference

### Backend (.env)

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Test Configuration
TEST_USER_TOKEN=test_token_here
TEST_BUSINESS_ID=00000000-0000-0000-0000-000000000000
```

### Frontend (.env.local)

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

## Common Issues

### Issue: CORS Errors

**Solution**: Backend already has CORS enabled in `server.js`. Ensure:
```javascript
app.use(cors({
  origin: 'http://localhost:3001', // Your React app port
  credentials: true
}));
```

### Issue: 401 Unauthorized

**Solution**: Check that token is stored and being sent:
```javascript
// Check token exists
console.log(apiService.getToken());

// Manually set token if needed
apiService.setToken('your_token_here');
```

### Issue: Network Error

**Solution**: Verify both servers are running:
```bash
# Check backend
curl http://localhost:3000/health

# Check frontend
curl http://localhost:3001
```

## Next Steps

1. ✅ **Port Configuration** - Align frontend/backend ports
2. ✅ **Environment Setup** - Configure .env files
3. 🔄 **Migrate App.js** - Replace fetch calls with apiService
4. 🔄 **Test Integration** - Verify all endpoints work
5. 🔄 **Remove Dead Code** - Delete chat.js and old utilities
6. 🔄 **Add Error Handling** - Implement global error boundaries
7. 🔄 **Add Loading States** - Use React hooks for better UX

## Support

For issues, check:
- [API Implementation Guide](./botmantra-backend/API_IMPLEMENTATION_GUIDE.md)
- [Supabase RPC Docs](./botmantra-backend/SUPABASE_RPC_API_DOCS.md)
- [Quick Start](./botmantra-backend/QUICK_START.md)
