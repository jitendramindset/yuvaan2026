# 🚀 UI Extension Pack - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Register Routes (Already Done ✅)
Routes are already registered in `server.js`:
```javascript
const uiExtensionsRoutes = require('./routes/ui-extensions');
app.use('/api/ui-extensions', uiExtensionsRoutes);
```

### Step 2: Run Database Migrations
```bash
cd botmantra-backend

# Option A: Via Supabase SQL Editor
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Copy/paste each migration file in order:
#    - 20260203_ui_extension_pack_part1_marketplace.sql
#    - 20260203_ui_extension_pack_part2_user_custom.sql
#    - 20260203_ui_extension_pack_part3_drag_drop.sql
#    - 20260203_ui_extension_pack_part4_theme_editor.sql
#    - 20260203_ui_extension_pack_part5_white_label.sql

# Option B: Via PostgreSQL CLI (if direct access)
psql -h api.mantravat.cloud -U supabase -d postgres -f db-migrations/20260203_ui_extension_pack_part1_marketplace.sql
psql -h api.mantravat.cloud -U supabase -d postgres -f db-migrations/20260203_ui_extension_pack_part2_user_custom.sql
psql -h api.mantravat.cloud -U supabase -d postgres -f db-migrations/20260203_ui_extension_pack_part3_drag_drop.sql
psql -h api.mantravat.cloud -U supabase -d postgres -f db-migrations/20260203_ui_extension_pack_part4_theme_editor.sql
psql -h api.mantravat.cloud -U supabase -d postgres -f db-migrations/20260203_ui_extension_pack_part5_white_label.sql
```

### Step 3: Restart Backend
```bash
# Stop current server (Ctrl+C)
node server.js
```

### Step 4: Validate Installation
```bash
node validate-ui-extensions.js
```

**Expected Output:**
```
🏬 Marketplace Dashboards:
  ✅ Browse templates
  ✅ Install template

👤 User Custom Dashboards:
  ✅ Get user template
  ✅ Duplicate template
  ✅ Set default template

🧩 Drag & Drop Layouts:
  ✅ Save layout
  ✅ Bulk save layouts
  ✅ Get versions

🎨 Theme Editor:
  ✅ Get branding
  ✅ Save branding
  ✅ Preview theme

🌐 White Label Onboarding:
  ✅ Create client
  ✅ Resolve domain
  ✅ Get permissions

TOTAL: 14/14 tests passed (100.0%)
🎉 ALL SYSTEMS OPERATIONAL
```

### Step 5: Test API Endpoints
```bash
# Test marketplace templates
curl http://localhost:5000/api/ui-extensions/marketplace/templates

# Test branding
curl http://localhost:5000/api/ui-extensions/branding/BOTMANTRA
```

---

## 📋 What You Can Do Now

### 🏬 Browse Marketplace Templates
```javascript
fetch('/api/ui-extensions/marketplace/templates?category=crm')
  .then(r => r.json())
  .then(data => console.log(data.templates));
```

### 🎨 Customize Brand Theme
```javascript
fetch('/api/ui-extensions/branding/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brand_code: 'MYBRAND',
    theme_config: {
      primary_color: '#FF5722',
      secondary_color: '#00BCD4',
      font_family: 'Roboto, sans-serif'
    }
  })
}).then(r => r.json()).then(console.log);
```

### 🧩 Save Drag & Drop Layout
```javascript
fetch('/api/ui-extensions/layouts/save-bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-123',
    template_id: 'template-456',
    layouts: [
      { widget_id: 'widget-1', x: 0, y: 0, w: 6, h: 4 },
      { widget_id: 'widget-2', x: 6, y: 0, w: 6, h: 4 }
    ]
  })
}).then(r => r.json()).then(console.log);
```

### 🌐 Create White-Label Client
```javascript
fetch('/api/ui-extensions/white-label/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    business_id: 'biz-123',
    client_name: 'Acme Corp',
    brand_code: 'ACME',
    subdomain: 'acme',
    theme_config: {
      primary_color: '#9C27B0',
      secondary_color: '#4CAF50'
    }
  })
}).then(r => r.json()).then(console.log);
```

---

## ✅ Success Checklist

- [ ] Routes registered in server.js
- [ ] All 5 migrations executed successfully
- [ ] Backend restarted
- [ ] Validation script passes 100%
- [ ] API endpoints responding
- [ ] Sample data seeded

---

## 📖 Full Documentation

See [UI_EXTENSION_PACK_IMPLEMENTATION.md](./UI_EXTENSION_PACK_IMPLEMENTATION.md) for:
- Complete API reference
- Database schema details
- Security considerations
- Advanced usage examples

---

## 🎯 Status

**🟢 PRODUCTION READY**

You now have:
- ✅ Marketplace dashboards
- ✅ User customization
- ✅ Drag & drop layouts
- ✅ Theme editor
- ✅ White-label SaaS

**Ready to transform BotMantra into a full SaaS platform!**
