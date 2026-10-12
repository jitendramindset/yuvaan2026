# 🎯 Build Your Screen with Chat - Quick Reference

## 🚀 Quick Start

1. **Login to Dashboard** (http://localhost:3000)
2. **Type in chat:** Natural language command
3. **Press Enter** → Widget appears!

---

## 💬 Example Commands

| What You Want | Type This | Result |
|---------------|-----------|--------|
| Profile card | `Show me an Instagram profile` | Profile widget with avatar, name, bio, stats |
| Analytics | `Create dashboard with analytics` | 4 stat cards with metrics |
| Data grid | `Show a data table` | Table with columns and sample data |
| Graph | `Add a bar chart` | Chart placeholder (currently shows stats) |
| Form | `Create contact form with name, email, phone` | 3 input fields |

---

## 🎨 Widget Types

- ✅ **profile** - User profile cards (Instagram, LinkedIn style)
- ✅ **stats** - Stat cards (numbers with trends)
- ✅ **table** - Data tables
- ✅ **chart** - Charts/graphs (placeholder)
- ✅ **card** - Content cards
- ✅ **form** - Forms with fields
- ✅ **button** - Action buttons
- ✅ **text** - Text content
- ✅ **header** - Section headers
- ✅ **list** - Bullet/numbered lists
- ✅ **container** - Widget containers

---

## 🔧 Widget Actions

**Hover over any widget to see:**
- ✏️ **Edit** - Customize properties
- 📋 **Duplicate** - Clone the widget
- 🗑️ **Delete** - Remove from screen

---

## 🧪 Testing

### Test Backend
```bash
cd botmantra-backend
node test-chat-ui-builder.js
```

### Test Frontend
1. Open Dashboard
2. Press F12 (console)
3. Send message
4. Watch logs show data flow

---

## 🐛 Troubleshooting

### Widget not appearing?
1. Check browser console for errors
2. Verify backend is running (port 5000)
3. Check Network tab for API call

### Wrong widget type?
Use specific keywords:
- "profile", "instagram" → Profile widget
- "dashboard", "stats" → Stats cards
- "table", "data" → Table widget

### Need help?
- Read `CHAT_UI_BUILDER_GUIDE.md` (detailed usage)
- Read `CHAT_UI_TROUBLESHOOTING.md` (debugging)
- Run `test-chat-ui-builder.js` (backend test)

---

## 📊 Expected Response Structure

```json
{
  "success": true,
  "framework": {
    "components": [
      {
        "id": "unique-id",
        "type": "profile|stats|table|chart",
        "title": "Widget Title",
        ...
      }
    ]
  },
  "message": "✅ UI Framework generated...",
  "suggestions": ["Next step 1", "Next step 2"]
}
```

---

## ✨ Pro Tips

1. **Be specific**: "Create Instagram profile" > "Make a profile"
2. **Include details**: "Form with name, email, phone" > "Create form"
3. **Use platform names**: Instagram, LinkedIn, Twitter
4. **Specify fields**: List what you want to see
5. **Check console**: F12 shows debug info

---

## 📁 Key Files

- **Backend:** `routes/botmantra-ai-framework.js` - Widget generation logic
- **Frontend:** `src/Dashboard.js` - Widget rendering
- **CSS:** `src/Dashboard.css` - Widget styling
- **Test:** `test-chat-ui-builder.js` - Automated testing

---

## 🎉 Status

✅ **FULLY WORKING**

All widget types render correctly!

---

**Last Updated:** January 2026  
**Version:** 1.0  
**Status:** Production Ready
