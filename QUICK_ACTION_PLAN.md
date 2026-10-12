# Quick Action Plan - UI Integration

## ⚡ Immediate Actions (5 minutes)

### 1. Fix Port Mismatch
```powershell
# In botmantra-ui directory
"REACT_APP_API_URL=http://localhost:3000" | Out-File -FilePath .env.local -Encoding UTF8
"REACT_APP_SUPABASE_URL=your_project_url_here" | Out-File -FilePath .env.local -Append -Encoding UTF8
"REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here" | Out-File -FilePath .env.local -Append -Encoding UTF8
```

### 2. Start Backend
```powershell
cd botmantra-backend
npm start
```

### 3. Start Frontend
```powershell
cd botmantra-ui  
npm start
```

## 🎯 Next Development Tasks

### Task 1: Remove Dead Code (2 minutes)
```powershell
# Delete misplaced server file
Remove-Item botmantra-ui\src\api\chat.js
```

### Task 2: Create Example Component (10 minutes)
Create `botmantra-ui/src/components/APIExample.jsx`:

```javascript
import { useData, usePermission } from '../hooks/useAPI';
import apiService from '../services/apiService';

export default function APIExample() {
  // Example 1: Auto-fetch data
  const { data, loading, error } = useData('user-list');
  
  // Example 2: Check permissions
  const { allowed } = usePermission('users', 'read');

  // Example 3: Manual API call
  const handleChat = async () => {
    const response = await apiService.chat('Hello!');
    console.log(response);
  };

  if (!allowed) return <div>No permission</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users ({data?.length})</h2>
      <button onClick={handleChat}>Test Chat</button>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Task 3: Update App.js (20 minutes)

Replace scattered fetch() calls with apiService:

**Before**:
```javascript
const response = await fetch(
  `${process.env.REACT_APP_API_URL}/api/kernel/onboarding-status`,
  { headers: { 'Authorization': `Bearer ${token}` }}
);
const data = await response.json();
```

**After**:
```javascript
import apiService from './services/apiService';

const data = await apiService.getData('onboarding-status');
```

### Task 4: Test Integration (10 minutes)

Create simple test page:

```javascript
// botmantra-ui/src/pages/TestAPI.jsx
import { useState } from 'react';
import apiService from '../services/apiService';

export default function TestAPI() {
  const [result, setResult] = useState('');

  const tests = [
    { name: 'Get UI Context', fn: () => apiService.getUIContext() },
    { name: 'Get Branding', fn: () => apiService.getBranding() },
    { name: 'Check Permission', fn: () => apiService.checkPermission('users', 'read') },
  ];

  const runTest = async (test) => {
    try {
      const res = await test.fn();
      setResult(JSON.stringify(res, null, 2));
      console.log('✅', test.name, res);
    } catch (err) {
      setResult(`❌ ${err.message}`);
      console.error('❌', test.name, err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>API Integration Tests</h2>
      {tests.map(test => (
        <button 
          key={test.name}
          onClick={() => runTest(test)}
          style={{ margin: 5 }}
        >
          {test.name}
        </button>
      ))}
      <pre>{result}</pre>
    </div>
  );
}
```

Add route in App.js:
```javascript
import TestAPI from './pages/TestAPI';
// ...
<Route path="/test-api" element={<TestAPI />} />
```

Visit: `http://localhost:3001/test-api`

## 📋 Migration Checklist

### Phase 1: Environment ✅
- [x] Create apiService.js
- [x] Create useAPI.js hooks
- [x] Create documentation
- [ ] Fix .env.local port configuration
- [ ] Add Supabase credentials

### Phase 2: Cleanup
- [ ] Delete `src/api/chat.js`
- [ ] Archive `src/api/uiToolsApi.js` (backup before deletion)

### Phase 3: Integration
- [ ] Create test page (TestAPI.jsx)
- [ ] Test backend connectivity
- [ ] Verify authentication flow
- [ ] Test sample endpoints

### Phase 4: Migration
- [ ] Identify all fetch() calls in App.js
- [ ] Replace with apiService methods
- [ ] Update imports
- [ ] Test each migrated feature

### Phase 5: Enhancement
- [ ] Add error boundaries
- [ ] Add loading indicators
- [ ] Add retry logic
- [ ] Add caching strategy

## 🐛 Debugging

### If Backend Won't Connect:

```powershell
# Check backend is running
curl http://localhost:3000/health

# Check environment loaded
cd botmantra-backend
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"

# Check API route exists
curl http://localhost:3000/api/v1/ui/context -H "Authorization: Bearer test_token"
```

### If Frontend API Fails:

```javascript
// In browser console
import apiService from './services/apiService';

// Check base URL
console.log(apiService.baseURL); // Should be http://localhost:3000

// Check token
console.log(apiService.getToken());

// Test simple call
apiService.getBranding()
  .then(r => console.log('✅ Success:', r))
  .catch(e => console.error('❌ Failed:', e));
```

### If CORS Error:

Backend `server.js` should have:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3001', // React app URL
  credentials: true
}));
```

## 📊 Progress Tracking

| Task | Status | Time | Priority |
|------|--------|------|----------|
| Create apiService.js | ✅ Done | - | High |
| Create useAPI.js hooks | ✅ Done | - | High |
| Fix port config | ⏳ Pending | 2 min | High |
| Remove chat.js | ⏳ Pending | 1 min | Medium |
| Create test page | ⏳ Pending | 10 min | High |
| Migrate App.js | ⏳ Pending | 20 min | High |
| Test integration | ⏳ Pending | 10 min | High |
| Add error handling | ⏳ Pending | 15 min | Medium |

**Total Estimated Time**: ~1 hour

## 🎉 Success Criteria

✅ Backend running on port 3000
✅ Frontend connecting to backend
✅ Authentication working
✅ API service covering all endpoints
✅ React hooks providing easy integration
✅ No CORS errors
✅ Error handling working
✅ Loading states working
✅ All old API calls migrated

## 📞 Need Help?

Check these files:
1. [FRONTEND_BACKEND_INTEGRATION.md](./FRONTEND_BACKEND_INTEGRATION.md) - Complete integration guide
2. [UI_ENHANCEMENT_COMPLETE.md](./UI_ENHANCEMENT_COMPLETE.md) - What was added
3. [API_IMPLEMENTATION_GUIDE.md](./botmantra-backend/API_IMPLEMENTATION_GUIDE.md) - Backend API reference
4. [QUICK_START.md](./botmantra-backend/QUICK_START.md) - Backend setup

## 🚀 Ready to Go!

Your integration is ready. Just:
1. Fix the `.env.local` port (2 minutes)
2. Start both servers (1 minute)
3. Create test page (10 minutes)
4. Start migrating components (20+ minutes)

All the infrastructure is in place! 🎊
