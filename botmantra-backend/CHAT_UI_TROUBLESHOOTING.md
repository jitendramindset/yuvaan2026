# 🔧 Troubleshooting: Build Your Screen with Chat

## Issue: Widgets Not Rendering Correctly

### Quick Diagnosis

Run the backend test to verify the API is working:

```bash
cd botmantra-backend
node test-chat-ui-builder.js
```

This will test all widget types and show you exactly what the API returns.

---

## Expected Data Flow

### 1. User Types Message
```
User: "Show me an Instagram profile"
```

### 2. Frontend Sends Request
```javascript
POST http://localhost:5000/api/botmantra-ai/chat
{
  "message": "Show me an Instagram profile",
  "context": {
    "currentWidgets": [],
    "screenTitle": "My Dashboard",
    "user": "user-id"
  }
}
```

### 3. Backend Processes Request
**File**: `routes/botmantra-ai-framework.js`

**Step 3.1**: Parse query to detect widget type
```javascript
parseQueryForFields("Show me an Instagram profile")
// Returns: { widgetType: 'profile', fields: [...] }
```

**Step 3.2**: Generate UI framework
```javascript
generateUIFramework({
  dataType: 'query',
  queryText: "Show me an Instagram profile",
  businessType: 'personal',
  preferredLayout: 'auto'
})
```

**Step 3.3**: Generate components
```javascript
generateComponents(fields, 'personal', 'auto', 'profile')
// Returns array of widget objects
```

**Step 3.4**: Return response
```json
{
  "success": true,
  "framework": {
    "components": [
      {
        "id": "profile_1234567",
        "type": "profile",
        "title": "User Profile",
        "name": "User Name",
        "role": "Member",
        "bio": "Profile bio here...",
        "fields": [...],
        "stats": {
          "posts": 0,
          "followers": 0,
          "following": 0
        }
      }
    ],
    "layout": { type: 'card', columns: 2 },
    "theme": { primary: '#EC4899', accent: '#F59E0B' }
  },
  "message": "✅ UI Framework generated...",
  "suggestions": [...]
}
```

### 4. Frontend Receives Response
**File**: `Dashboard.js` - `handleSendMessage()` function

```javascript
const data = response.data;

// Check response structure
console.log('Response:', {
  success: data.success,
  hasFramework: !!data.framework,
  componentsCount: data.framework?.components?.length
});

// Update widgets
if (data.success && data.framework) {
  const newWidgets = data.framework.components || [];
  setWidgets(prev => [...prev, ...newWidgets]);
}
```

### 5. Frontend Renders Widget
**File**: `Dashboard.js` - `renderWidget()` function

```javascript
widgets.map((widget, index) => renderWidget(widget, index))
```

**Widget Type Detection**:
```javascript
switch (widget.type) {
  case 'profile':
    // Render profile widget
    return (
      <div className="widget-profile">
        <div className="profile-avatar">...</div>
        <h3 className="profile-name">{widget.name}</h3>
        <p className="profile-bio">{widget.bio}</p>
        <div className="profile-fields">...</div>
        <div className="profile-stats">...</div>
      </div>
    );
}
```

---

## Debugging Steps

### Step 1: Check Backend is Running
```bash
# Terminal 1 - Backend
cd botmantra-backend
npm start

# Should see:
# ✅ Connected to Supabase
# 🚀 Server running on port 5000
```

### Step 2: Test Chat Endpoint Directly
```bash
cd botmantra-backend
node test-chat-ui-builder.js
```

**Expected Output**:
```
============================================================
🧪 Testing: Instagram Profile
📝 Message: "Show me an Instagram profile"
============================================================

✅ Response received!

📊 Response Structure:
{
  "success": true,
  "hasFramework": true,
  "hasComponents": true,
  "componentCount": 1,
  "message": "✅ UI Framework generated successfully!...",
  "hasSuggestions": true,
  "suggestionCount": 4
}

🎨 Generated Components:
  1. Type: profile
     ID: profile_1234567
     Title: User Profile
     Name: User Name
     Fields: 8
     Stats: {"posts":0,"followers":0,"following":0}

✅ PASS: Found expected widget type "profile"
```

If this fails, the backend has an issue.

### Step 3: Check Browser Console
Open Dashboard in browser → Press F12 → Console tab

**Look for**:
```javascript
🔍 Chat API Response: {
  success: true,
  hasFramework: true,
  componentsCount: 1,
  components: [...]
}

🎨 Adding new widgets: [{ type: 'profile', ... }]
📊 Current widgets before: []
📊 Widgets after update: [{ type: 'profile', ... }]

🎨 Rendering widget #0: {
  type: 'profile',
  id: 'profile_1234567',
  hasName: true,
  hasTitle: true,
  hasFields: true,
  fieldsCount: 8
}
```

### Step 4: Check Network Tab
F12 → Network tab → Send chat message

**Look for**:
- Request: `POST http://localhost:5000/api/botmantra-ai/chat`
- Status: `200 OK`
- Response tab should show JSON with `success: true`

**Common Issues**:
- **Status 404**: Backend route not registered
- **Status 500**: Backend error (check terminal)
- **CORS error**: Backend CORS not configured
- **Timeout**: Backend taking too long (increase timeout)

### Step 5: Check Widget Array
Add breakpoint in Dashboard.js after `setWidgets`:

```javascript
setWidgets(prev => {
  const updated = [...prev, ...newWidgets];
  debugger; // Breakpoint here
  return updated;
});
```

**Inspect**:
- `prev`: Previous widgets array
- `newWidgets`: New widgets from API
- `updated`: Combined array

### Step 6: Check Render Function
Add breakpoint in `renderWidget`:

```javascript
const renderWidget = (widget, index) => {
  debugger; // Breakpoint here
  console.log('Rendering:', widget);
  // ...
}
```

**Verify**:
- Function is called for each widget
- `widget.type` matches expected value
- Widget has all required properties

---

## Common Problems & Solutions

### Problem 1: "Nothing renders after sending message"

**Cause**: Response structure mismatch

**Fix**:
1. Check console logs for response structure
2. Verify `data.framework.components` exists
3. Check if `setWidgets` is being called

**Test**:
```javascript
// In handleSendMessage
console.log('Framework:', data.framework);
console.log('Components:', data.framework?.components);
```

---

### Problem 2: "Widget renders but looks broken"

**Cause**: Missing widget properties or CSS

**Fix**:
1. Check widget has all required fields:
   - Profile: `name`, `bio`, `fields`, `stats`
   - Stats: `label`, `value`, `trend`
   - Table: `columns`, `rows`
2. Verify CSS classes are applied
3. Check Dashboard.css is loaded

**Test**:
```javascript
// In renderWidget
console.log('Widget properties:', {
  type: widget.type,
  name: widget.name,
  fields: widget.fields,
  stats: widget.stats
});
```

---

### Problem 3: "Wrong widget type renders"

**Cause**: Backend detecting wrong widget type

**Fix**:
1. Use specific keywords:
   - Profile: "instagram", "profile", "linkedin"
   - Dashboard: "dashboard", "stats", "analytics"
   - Table: "table", "data", "list"
2. Check `parseQueryForFields` logic
3. Add more trigger words

**Test**:
```bash
# Test various messages
node test-chat-ui-builder.js
```

---

### Problem 4: "API returns error"

**Cause**: Backend error or database issue

**Fix**:
1. Check backend terminal for errors
2. Verify Supabase connection
3. Check `dbSchema` is populated
4. Test database query manually

**Test**:
```javascript
// In backend terminal
console.log('DB Schema:', Object.keys(dbSchema));
```

---

### Problem 5: "Widgets disappear on refresh"

**Cause**: Widgets not saved to database/localStorage

**Fix**:
1. Implement save dashboard functionality
2. Save to localStorage as backup
3. Load from localStorage on mount

**Implementation**:
```javascript
// Save to localStorage
useEffect(() => {
  localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
}, [widgets]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('dashboard-widgets');
  if (saved) setWidgets(JSON.parse(saved));
}, []);
```

---

## Response Format Validation

### Expected Response Structure
```json
{
  "success": true,
  "framework": {
    "components": [
      {
        "id": "unique-id",
        "type": "profile|stats|table|chart|form",
        "title": "Widget Title",
        // Type-specific properties
      }
    ],
    "layout": {
      "type": "grid|vertical|card",
      "columns": 2,
      "responsive": true
    },
    "theme": {
      "primary": "#color",
      "accent": "#color",
      "style": "modern|professional|minimal"
    }
  },
  "message": "Success message",
  "suggestions": ["suggestion 1", "suggestion 2"]
}
```

### Widget Type Structures

#### Profile Widget
```json
{
  "id": "profile_123",
  "type": "profile",
  "title": "User Profile",
  "name": "User Name",
  "role": "Member",
  "bio": "Bio text",
  "fields": [
    { "id": 0, "name": "username", "type": "text", "label": "Username" }
  ],
  "stats": {
    "posts": 0,
    "followers": 0,
    "following": 0
  }
}
```

#### Stats Widget
```json
{
  "id": "stat_0",
  "type": "stats",
  "label": "Total Users",
  "value": "1,234",
  "trend": "up"
}
```

#### Table Widget
```json
{
  "id": "table_123",
  "type": "table",
  "title": "Data Table",
  "columns": ["Name", "Email", "Status"]
}
```

#### Chart Widget
```json
{
  "id": "chart_123",
  "type": "chart",
  "title": "Analytics",
  "chartType": "Bar",
  "data": [
    { "label": "Jan", "value": 100 },
    { "label": "Feb", "value": 150 }
  ]
}
```

---

## Backend Code Verification

### Check parseQueryForFields
**File**: `routes/botmantra-ai-framework.js` line ~240

```javascript
function parseQueryForFields(query) {
  const lower = query.toLowerCase();
  
  // Profile detection
  if (lower.includes('profile') || 
      lower.includes('instagram') || 
      lower.includes('facebook')) {
    return {
      widgetType: 'profile',
      fields: ['username', 'bio', 'avatar', ...]
    };
  }
  
  // Dashboard detection
  if (lower.includes('dashboard') || 
      lower.includes('stats')) {
    return {
      widgetType: 'dashboard',
      fields: ['users', 'revenue', 'orders']
    };
  }
  
  // ... more cases
}
```

### Check generateComponents
**File**: `routes/botmantra-ai-framework.js` line ~304

```javascript
function generateComponents(fields, businessType, layout, widgetType) {
  const components = [];

  if (widgetType === 'profile') {
    components.push({
      id: `profile_${Date.now()}`,
      type: 'profile', // ← This MUST match
      // ... other properties
    });
    return components;
  }
  
  // ... other widget types
}
```

### Check /chat endpoint
**File**: `routes/botmantra-ai-framework.js` line ~496

```javascript
router.post('/chat', async (req, res) => {
  const framework = await generateUIFramework(/* ... */);
  
  res.json({
    ...framework, // Should have success & framework properties
    message: responseMessage,
    suggestions
  });
});
```

---

## Frontend Code Verification

### Check handleSendMessage
**File**: `Dashboard.js` line ~233

```javascript
const response = await axios.post(`${apiUrl}/api/botmantra-ai/chat`, {
  message,
  context: { currentWidgets: widgets, ... }
});

const data = response.data;

if (data.success && data.framework) {
  const newWidgets = data.framework.components || [];
  setWidgets(prev => [...prev, ...newWidgets]); // ← Updates state
}
```

### Check renderWidget
**File**: `Dashboard.js` line ~442

```javascript
const renderWidget = (widget, index) => {
  switch (widget.type) {
    case 'profile':
      return (
        <div className="widget-profile">
          {/* Profile content */}
        </div>
      );
    // ... other cases
  }
};
```

### Check widgets.map
**File**: `Dashboard.js` (search for widgets.map)

```javascript
{widgets.map((widget, index) => renderWidget(widget, index))}
```

---

## Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Database connected (check terminal)
- [ ] Run `node test-chat-ui-builder.js` - all tests pass
- [ ] Open Dashboard in browser
- [ ] F12 Console open (to see logs)
- [ ] Send message: "Show Instagram profile"
- [ ] Check console for response logs
- [ ] Verify widget appears in grid
- [ ] Widget has correct styling
- [ ] Can edit/delete/duplicate widget

---

## Still Not Working?

### Enable Full Debug Mode

**Backend** - Add to `routes/botmantra-ai-framework.js`:
```javascript
router.post('/chat', async (req, res) => {
  console.log('📥 Received message:', req.body.message);
  
  const framework = await generateUIFramework(/* ... */);
  console.log('📤 Sending framework:', JSON.stringify(framework, null, 2));
  
  res.json({ ...framework, ... });
});
```

**Frontend** - Add to `Dashboard.js`:
```javascript
const handleSendMessage = async (message) => {
  console.log('📤 Sending message:', message);
  
  const response = await axios.post(/* ... */);
  console.log('📥 Received response:', response.data);
  
  const newWidgets = response.data.framework?.components;
  console.log('🎨 New widgets:', newWidgets);
  
  setWidgets(prev => {
    const updated = [...prev, ...newWidgets];
    console.log('📊 Updated widgets:', updated);
    return updated;
  });
};
```

### Share Debug Output

Copy all console logs and share:
1. Backend terminal output
2. Browser console logs
3. Network tab response
4. Widget state from React DevTools

---

## Contact & Support

- Check `CHAT_UI_BUILDER_GUIDE.md` for usage examples
- Review test results from `test-chat-ui-builder.js`
- Inspect database schema with `db-schema-*.sql` files
- Check API documentation in `POSTMAN_TESTING_GUIDE.md`
