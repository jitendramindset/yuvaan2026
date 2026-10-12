# 🧪 Onboarding API Testing Guide - UI Tester

## Access the API Tester UI

### Open in Browser
**URL:** http://localhost:3000/api-tester

This interactive UI lets you test all 7 onboarding steps without Postman!

---

## Test Flow

### ✅ Step 1: Signup
1. Pre-filled test data is already loaded
2. Click "▶️ Test Step 1"
3. On success, auth token will auto-populate
4. Check the green success result below

**Endpoint:** `POST /api/onboarding/step1/signup`

**Test Data:**
```json
{
  "email": "test@example.com",
  "password": "Test@1234",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

---

### ✅ Step 2: Create Profile
1. Requires auth token from Step 1
2. Click "▶️ Test Step 2"
3. Verify profile creation in response

**Endpoint:** `POST /api/onboarding/step2/create-profile`

**Test Data:**
```json
{
  "profileName": "My Business Profile",
  "selectedFields": ["name", "email", "phone"]
}
```

---

### ✅ Step 3: Setup Company
1. Enter company details (pre-filled)
2. Click "▶️ Test Step 3"
3. Company ID will auto-populate for next steps

**Endpoint:** `POST /api/onboarding/step3/setup-company`

**Test Data:**
```json
{
  "companyName": "Test Company Ltd",
  "businessType": "retail",
  "industry": "ecommerce",
  "website": "https://testcompany.com",
  "phone": "+1234567890",
  "email": "info@testcompany.com"
}
```

---

### ✅ Step 4: Suggest Modules
1. Uses business type & industry from Step 3
2. Click "▶️ Test Step 4"
3. See suggested modules in response

**Endpoint:** `POST /api/onboarding/step4/suggest-modules`

**Test Data:**
```json
{
  "businessType": "retail",
  "industry": "ecommerce"
}
```

---

### ✅ Step 5: Configure Modules
1. Company ID auto-filled from Step 3
2. Edit module configuration JSON if needed
3. Click "▶️ Test Step 5"

**Endpoint:** `POST /api/onboarding/step5/configure-modules`

**Test Data:**
```json
{
  "companyId": "<auto-filled>",
  "selectedModules": [
    {
      "moduleId": "1",
      "moduleName": "Inventory",
      "selectedFieldIds": ["1", "2", "3"]
    }
  ]
}
```

---

### ✅ Step 6: Create Layout
1. Company ID auto-filled
2. Select layout type (dashboard/table/kanban/calendar)
3. Click "▶️ Test Step 6"

**Endpoint:** `POST /api/onboarding/step6/create-layout`

**Test Data:**
```json
{
  "companyId": "<auto-filled>",
  "layoutType": "dashboard"
}
```

---

### ✅ Step 7: Finalize
1. Company ID auto-filled
2. Click "▶️ Test Step 7"
3. Onboarding complete!

**Endpoint:** `POST /api/onboarding/step7/finalize`

**Test Data:**
```json
{
  "companyId": "<auto-filled>"
}
```

---

## 🚀 Quick Test All

Click the **"🚀 Run All Steps (Sequential)"** button at the bottom to test the complete flow automatically!

---

## 📊 What to Check

### Database Tables Used
Each step will interact with these tables:
- ✅ `auth.users` - User signup
- ✅ `core_node` - Profile & company nodes  
- ✅ `business_modules` - Available modules
- ✅ `business_functions` - Module functions
- ✅ `data_model_registry` - Field definitions
- ✅ `node_selected_fields` - User field selections
- ✅ `ui_templates` - Layout templates
- ✅ `ui_template_widgets` - Widget configs
- ✅ `node_module_config` - Module settings

### Expected Results
Each API should return:
```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "company": { "id": "...", "name": "..." }
}
```

### Common Errors to Fix
1. **401 Unauthorized** - Run Step 1 first to get token
2. **Missing companyId** - Run Step 3 first
3. **Database errors** - Check table schema matches queries
4. **CORS errors** - Backend running on port 5000?
5. **Table not found** - Run schema verification queries first

---

## 🔧 Features of the UI Tester

✅ **Auto Token Management** - Token from Step 1 auto-fills for subsequent steps
✅ **Auto CompanyId Propagation** - Company ID from Step 3 auto-fills in Steps 5-7
✅ **Color-Coded Results** - Green for success, Red for errors
✅ **JSON Editor** - Edit request payloads directly in the UI
✅ **Timestamp Tracking** - See when each test ran
✅ **Pretty JSON Display** - Formatted response data
✅ **One-Click Sequential Test** - Run all steps with one button

---

## 🎯 Success Criteria

✅ All 7 steps return success (200 status)
✅ Token persists across steps
✅ Company ID auto-propagates  
✅ Data flows: signup → profile → company → modules → layout → finalize
✅ No database errors
✅ Response data structure is correct

---

## 📝 Next Steps After Testing

### If all tests pass:
1. Map table columns using `schema-verification-queries.sql`
2. Update API routes to use exact column names from your schema
3. Test with real Supabase database
4. Integrate with chat AI for conversational onboarding

### If tests fail:
1. Check error messages in red result panels
2. Verify database tables exist in Supabase
3. Check Supabase connection in `.env`
4. Review browser console for detailed errors
5. Check backend terminal for server errors

---

## 🌐 URLs

- **Frontend (UI Tester):** http://localhost:3000/api-tester
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **DB Status:** http://localhost:5000/api/db-status

---

## 💡 Tips

1. **Test in order** - Run Step 1 first, then 2, 3, etc.
2. **Check responses** - Expand the green/red result boxes to see full API responses
3. **Edit test data** - Customize the form fields to test different scenarios
4. **Save results** - Copy response JSON for documentation
5. **Use browser DevTools** - Open Network tab to see raw HTTP requests
