# 🛠️ Build Your Screen with Chat - Complete Guide

## Overview

The "Build Your Screen with Chat" feature allows you to create UI widgets and layouts using natural language commands through the chat interface.

---

## ✅ How It Works

### 1. **Chat Interface**
- Available in the Dashboard component
- Uses `/api/botmantra-ai/chat` endpoint
- AI understands your intent and generates appropriate widgets

### 2. **Supported Widget Types**

| Widget Type | Description | Example Command |
|------------|-------------|-----------------|
| **stats** | Stat cards with values and trends | "Show me dashboard stats" |
| **card** | Simple content cards | "Add a welcome card" |
| **chart** | Data visualization | "Create a bar chart" |
| **table** | Data tables with columns | "Show a table of users" |
| **form** | Input forms with fields | "Create a contact form" |
| **profile** | User profile widget | "Show Instagram profile", "Create LinkedIn profile" |
| **button** | Action buttons | "Add a submit button" |
| **text** | Text content | "Add a paragraph" |
| **header** | Section headers | "Add a header" |
| **list** | Bullet/numbered lists | "Show a list of items" |
| **container** | Widget containers | "Create a container for other widgets" |

### 3. **How the AI Detects Widget Type**

The AI analyzes your message and detects:

#### Profile Widgets
- **Trigger words**: "profile", "instagram", "facebook", "linkedin"
- **What it creates**:
  - Avatar/photo section
  - Name and role/headline
  - Bio/description
  - Custom fields (based on platform)
  - Stats (posts, followers, following)

#### Dashboard Widgets
- **Trigger words**: "dashboard", "stats", "analytics", "metrics"
- **What it creates**: Multiple stat cards showing numbers with trend indicators

#### Table Widgets
- **Trigger words**: "table", "list", "data"
- **What it creates**: Data table with columns and sample rows

#### Chart Widgets
- **Trigger words**: "chart", "graph", "visualization"
- **What it creates**: Bar/line/pie chart placeholder

---

## 🎯 Example Commands

### For Instagram Profile
```
"Show me an Instagram profile"
"Create Instagram profile widget"
"I want to display Instagram bio"
```
**Result**: Profile widget with avatar, username, bio, posts/followers/following stats

### For Dashboard
```
"Show dashboard metrics"
"Create analytics dashboard"
"I need stats for users, revenue, orders"
```
**Result**: Multiple stat cards with values and trends

### For Forms
```
"Create a contact form"
"I need a signup form with name, email, password"
"Build a registration form"
```
**Result**: Form with input fields

### For Tables
```
"Show user table"
"Display data in table format"
"Create a table with name, email, status"
```
**Result**: Data table with specified columns

---

## ⚙️ Configuration & Layout

### Widget Layout Options
The AI automatically suggests layouts based on:
- **Field count**: Few fields = vertical, many fields = grid
- **Business type**: Dashboard = grid, Form = vertical
- **Widget type**: Profile = centered, Stats = grid

### Customization
Each widget has:
- **Edit button**: Modify widget properties
- **Duplicate button**: Clone the widget
- **Delete button**: Remove from screen

---

## 🐛 Common Issues & Fixes

### Issue 1: "Widget not rendering correctly"
**Cause**: Widget type not recognized
**Fix**: Use specific keywords (see table above)
**Example**: Instead of "show profile", say "show Instagram profile"

### Issue 2: "Fields not showing"
**Cause**: Fields not mapped correctly in backend
**Fix**: 
1. Check that `data_model_registry` table exists
2. Verify field detection logic in backend
3. Use explicit field names: "Create form with name, email, phone"

### Issue 3: "Layout looks wrong"
**Cause**: Layout type mismatch
**Fix**: 
- For profile widgets: Should use `widget-profile` class
- For dashboard: Should use grid layout
- Check CSS classes are applied correctly

### Issue 4: "Chat not responding"
**Cause**: Backend endpoint not running or misconfigured
**Fix**:
1. Check backend is running on port 5000
2. Verify `/api/botmantra-ai/chat` route exists
3. Check browser console for errors
4. Test endpoint directly: `POST http://localhost:5000/api/botmantra-ai/chat`

---

## 🔧 Technical Details

### API Flow
```
1. User types message in chat
2. Frontend sends POST to /api/botmantra-ai/chat
3. Backend analyzes message (detectWidgetType function)
4. Backend generates component structure
5. Returns framework with components array
6. Frontend renders widgets using renderWidget function
```

### Request Format
```json
{
  "message": "Show Instagram profile",
  "context": {
    "currentWidgets": [...],
    "screenTitle": "My Dashboard",
    "user": "user-id"
  }
}
```

### Response Format
```json
{
  "success": true,
  "message": "Created profile widget",
  "framework": {
    "title": "Instagram Profile",
    "components": [
      {
        "id": "profile_123",
        "type": "profile",
        "name": "User Name",
        "bio": "Bio text",
        "fields": [...],
        "stats": {
          "posts": 0,
          "followers": 0,
          "following": 0
        }
      }
    ]
  },
  "suggestions": ["Customize colors", "Add more fields"]
}
```

---

## 📝 Testing Checklist

### ✅ Before Testing
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Database tables exist (data_model_registry, core_node)
- [ ] Chat interface visible in Dashboard

### ✅ Test Each Widget Type
- [ ] Profile: "Show Instagram profile"
- [ ] Stats: "Create dashboard stats"
- [ ] Table: "Show user table"
- [ ] Chart: "Add a bar chart"
- [ ] Form: "Create contact form"

### ✅ Verify Functionality
- [ ] Widget appears in grid
- [ ] Edit button opens customizer
- [ ] Delete button removes widget
- [ ] Duplicate creates copy
- [ ] Layout looks correct
- [ ] All fields visible

---

## 🎨 CSS Classes Reference

### Widget Container
```css
.dashboard-widget - Base widget class
.widget-profile - Profile widget specific
.widget-stats - Stats card
.widget-table - Table widget
.widget-full-width - Full width widgets
```

### Profile Widget Structure
```html
<div class="dashboard-widget widget-profile">
  <div class="profile-avatar">...</div>
  <h3 class="profile-name">...</h3>
  <p class="profile-title">...</p>
  <p class="profile-bio">...</p>
  <div class="profile-fields">...</div>
  <div class="profile-stats">...</div>
</div>
```

---

## 🚀 Quick Start

1. **Open Dashboard** (logged in user)
2. **Type in chat**: "Show me an Instagram profile"
3. **Press Enter**
4. **Wait for response** (2-3 seconds)
5. **Widget appears** in the grid below
6. **Click Edit** to customize
7. **Continue building** with more commands

---

## 💡 Best Practices

1. **Be specific** with your requests
   - ✅ "Create Instagram profile with bio and followers"
   - ❌ "Make a profile"

2. **Use platform names** for social profiles
   - Instagram, Facebook, LinkedIn, Twitter

3. **Specify fields** for forms/tables
   - "Create form with name, email, phone, message"

4. **Test incrementally**
   - Add one widget at a time
   - Verify it renders before adding more

5. **Save your work**
   - Use "Save dashboard" button
   - Export configuration for backup

---

## 📊 Troubleshooting Steps

### If widgets don't appear:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify response has `framework.components` array
5. Check `renderWidget` function is called

### If layout is broken:
1. Inspect widget element
2. Verify CSS classes are applied
3. Check Dashboard.css is loaded
4. Clear browser cache
5. Restart React dev server

### If chat doesn't respond:
1. Check backend terminal for errors
2. Test endpoint with Postman
3. Verify OpenAI API key (if using AI)
4. Check CORS settings
5. Restart backend server

---

## 🔗 Related Files

- **Frontend**: `src/Dashboard.js` - Main component
- **Backend**: `routes/botmantra-ai-framework.js` - AI logic
- **CSS**: `src/Dashboard.css` - Widget styles
- **API**: `server.js` - Route registration

---

## ✨ Next Steps

After getting basic widgets working:
1. Connect to real data from Supabase
2. Add custom styling/themes
3. Save layouts to database
4. Share dashboards with team
5. Export as standalone components
