# 🚀 Admin Customization System - Quick Setup Guide

## 5-Minute Setup

### Step 1: Copy Files to Your Project

```bash
# Copy backend files
cp routes/admin-api.js botmantra-backend/routes/
cp middleware/adminAuth.js botmantra-backend/middleware/
cp migrations/001_admin_customization_schema.sql botmantra-backend/migrations/

# Frontend files already exist:
# - botmantra-ui/src/services/AdminService.js ✅
# - botmantra-ui/src/components/AdminCustomizationPanel.js ✅
# - botmantra-ui/src/components/AdminCustomizationPanel.css ✅
```

### Step 2: Run Database Migration

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy entire content of `001_admin_customization_schema.sql`
4. Click **Run**
5. Verify all tables created

**Or using Supabase CLI:**

```bash
supabase db push
```

### Step 3: Update Backend (`botmantra-backend/server.js`)

```javascript
// ⬇️ Add these imports at top
const adminRouter = require('./routes/admin-api');
const {
  requireAuth,
  adminRateLimit,
  errorHandler
} = require('./middleware/adminAuth');

// ⬇️ Add this route (before error handlers)
app.use('/api/admin', requireAuth, adminRateLimit, adminRouter);

// ⬇️ Ensure error handler is last
app.use(errorHandler);
```

### Step 4: Update Frontend (`botmantra-ui/src/App.js`)

```javascript
// ⬇️ Add these imports
import AdminCustomizationPanel from './components/AdminCustomizationPanel';
import AdminService from './services/AdminService';
import { useState, useEffect } from 'react';

// ⬇️ Inside your App component, add this code:
const [showAdminPanel, setShowAdminPanel] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  checkAdminStatus();
}, [user?.id]);

const checkAdminStatus = async () => {
  if (!user?.id) return;
  const status = await AdminService.checkAdminStatus(user.id);
  setIsAdmin(status.isAdmin);
};

// ⬇️ Add this button in your header/navbar:
{isAdmin && (
  <button 
    onClick={() => setShowAdminPanel(true)}
    title="Admin Panel"
    style={{ padding: '8px 12px', cursor: 'pointer' }}
  >
    ⚙️ Admin
  </button>
)}

// ⬇️ Add this modal at end of component:
{showAdminPanel && (
  <AdminCustomizationPanel
    onClose={() => setShowAdminPanel(false)}
  />
)}
```

### Step 5: Set Environment Variables

**Backend (.env):**
```env
REACT_APP_API_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_AUDIT_ENABLED=true
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3000
```

### Step 6: Make First User Admin

**Run this SQL in Supabase:**

```sql
-- Replace 'your-user-id' with actual UUID from auth.users table
UPDATE public.user_roles 
SET role = 'admin', permissions = '["*"]'::jsonb
WHERE user_id = 'your-user-id';

-- If row doesn't exist, insert it:
INSERT INTO public.user_roles (user_id, role, permissions)
VALUES ('your-user-id', 'admin', '["*"]'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

---

## ✅ Verification Checklist

- [ ] Database migration completed (5 tables created)
- [ ] Backend routes mounted (`/api/admin/*`)
- [ ] Frontend imports added
- [ ] Admin button shows for admin users
- [ ] Colors change in real-time ✨
- [ ] Widgets can be created/edited/deleted
- [ ] Layouts can be saved and loaded

---

## 🎯 What Admin Can Do Now

1. **Click ⚙️ Admin button** (visible only to admins)
2. **Pick Colors Tab**
   - Change primary, secondary, accent colors
   - See changes instantly
   - Click Save

3. **Pick Widgets Tab**
   - Create new custom widgets
   - Edit existing widgets
   - Delete widgets

4. **Pick Layouts Tab**
   - Save current widget arrangement
   - Apply saved layouts
   - Switch between layouts

---

## 🆘 Troubleshooting

### Admin button not showing
- Check user role in database: `SELECT * FROM user_roles WHERE user_id = 'your-id'`
- Ensure role = 'admin'

### API 403 Forbidden
- Verify admin authentication middleware is called
- Check Bearer token in request headers

### Colors not updating
- Verify CSS variables exist in your app
- Check browser console for errors

### Database error
- Verify migration ran successfully
- Check SUPABASE_URL and SERVICE_ROLE_KEY

---

## 📊 System Overview

```
┌─────────────────────────────┐
│    Admin User              │
│   Clicks ⚙️ Admin          │
└──────────────┬──────────────┘
               │
      ┌────────▼────────┐
      │ AdminCustom     │
      │ izationPanel.js │ (React Component)
      └────────┬────────┘
               │
    ┌──────────▼──────────┐
    │  AdminService.js   │ (Service Layer)
    │  12 API methods    │
    └──────────┬──────────┘
               │
      ┌────────▼────────┐
      │   Backend API   │
      │  admin-api.js   │ (12 Endpoints)
      └────────┬────────┘
               │
      ┌────────▼────────┐
      │   Middleware    │
      │  adminAuth.js   │ (Auth & Logging)
      └────────┬────────┘
               │
      ┌────────▼────────────────┐
      │   Supabase PostgreSQL   │
      │   5 Tables              │
      │   RLS Policies          │
      └─────────────────────────┘
```

---

## 🔗 File Locations

```
botmantra-ui/
├── src/
│   ├── components/
│   │   ├── AdminCustomizationPanel.js ✅
│   │   └── AdminCustomizationPanel.css ✅
│   ├── services/
│   │   └── AdminService.js ✅
│   └── App.js (⬅️ Update here)
└── .env (⬅️ Add API URL)

botmantra-backend/
├── routes/
│   └── admin-api.js ✅
├── middleware/
│   └── adminAuth.js ✅
├── migrations/
│   └── 001_admin_customization_schema.sql ✅
├── server.js (⬅️ Update here)
└── .env (⬅️ Add Supabase keys)
```

---

## ⏱️ Time Breakdown

- **Copy files**: 1 min
- **Database migration**: 1 min
- **Backend integration**: 1 min
- **Frontend integration**: 1 min
- **Testing**: 1 min

**Total: ~5 minutes** ⚡

---

## 🎉 You're Done!

Your admin customization system is now live! Admins can:

✅ Change colors in real-time
✅ Create custom widgets
✅ Manage layouts
✅ All changes auto-logged

**Need help?** Check `ADMIN_CUSTOMIZATION_INTEGRATION_GUIDE.md` for detailed documentation.
