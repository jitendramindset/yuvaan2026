# 🎯 ONBOARDING SYSTEM - INTEGRATION CHECKLIST

## 📋 PRE-DEPLOYMENT CHECKLIST

### Database Setup
- [ ] Create Supabase project (if not done)
- [ ] Copy entire `db-schema-core-node-system.sql` to Supabase SQL Editor
- [ ] Run schema creation (should create 13 tables)
- [ ] Verify tables created: users, core_node, node_relationship, node_permission, node_function, node_role, ui_template, node_selected_fields, node_module_config, onboarding_session, transaction_log, website_scrape_data, session
- [ ] Copy `seed-data-model-registry-business-common.sql` to SQL Editor
- [ ] Run data seed (should insert 350+ records)
- [ ] Verify data_model_registry has 18 modules with fields

### Backend Setup
- [ ] Navigate to `botmantra-backend` folder
- [ ] Run `npm install` (if dependencies not installed)
- [ ] Install additional packages:
  ```bash
  npm install axios cheerio bcryptjs jsonwebtoken
  ```
- [ ] Create/update `.env` file with:
  ```
  JWT_SECRET=your-very-long-random-secret-key
  SUPABASE_URL=your-supabase-url
  SUPABASE_KEY=your-supabase-key
  NODE_ENV=development
  PORT=5000
  ```
- [ ] Copy `routes-onboarding.js` to `botmantra-backend` folder
- [ ] Update `server.js` to include onboarding routes:
  ```javascript
  const onboardingRoutes = require('./routes-onboarding');
  app.use('/api/onboarding', onboardingRoutes);
  ```
- [ ] Test start: `npm start`
- [ ] Verify: "Server running on port 5000" message

### Frontend Setup
- [ ] Navigate to `botmantra-ui` folder
- [ ] Run `npm install` (if dependencies not installed)
- [ ] Verify React is installed
- [ ] Create folder: `src/pages/` (if doesn't exist)
- [ ] Copy `OnboardingFlow.jsx` to `src/pages/`
- [ ] Copy `OnboardingFlow.css` to `src/pages/`
- [ ] Update `src/App.jsx`:
  ```javascript
  import OnboardingFlow from './pages/OnboardingFlow';
  
  // Add route:
  <Route path="/onboarding" element={<OnboardingFlow />} />
  
  // Add navigation logic:
  const token = localStorage.getItem('token');
  if (!token && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }
  ```
- [ ] Create `src/pages/` directory if needed
- [ ] Verify React Router is installed
- [ ] Test start: `npm start`
- [ ] Verify: App opens without errors on localhost:3000

### Environment Configuration
- [ ] Frontend `.env` or config:
  ```javascript
  REACT_APP_API_URL=http://localhost:5000
  ```
- [ ] Backend `.env`:
  ```
  JWT_SECRET=long-random-secret-key
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_KEY=your-key
  CORS_ORIGIN=http://localhost:3000
  ```

---

## 🧪 TESTING CHECKLIST

### Test Step 1: Signup
- [ ] Open `http://localhost:3000/onboarding`
- [ ] Fill signup form:
  - Email: test@example.com
  - Password: TestPass123 (must have uppercase + number)
  - First Name: John
  - Last Name: Doe
  - Phone: +1-555-0123
- [ ] Click "Create Account"
- [ ] Verify: Progress bar updates to 16%
- [ ] Verify: Form clears and moves to Step 2
- [ ] Check database: `users` table should have new record

### Test Step 2: Create Profile
- [ ] Verify: "Create Your Profile" page loads
- [ ] Enter Profile Name: "My First Profile"
- [ ] Select 3-5 fields (optional)
- [ ] Click "Next: Set Up Company"
- [ ] Verify: Progress bar at 32%
- [ ] Check database: `core_node` should have profile record (node_type='profile')

### Test Step 3: Company Setup
- [ ] Verify: "Tell Us About Your Business" form loads
- [ ] Fill company details:
  - Company Name: "Acme Corp"
  - Business Type: "Retail Store" (or software, medical, etc.)
  - Industry: "Retail"
  - Website: "https://www.example.com" (optional)
  - Phone: +1-555-0100
  - Email: info@acme.com
  - Address: 123 Main St
  - City: Springfield
  - State: IL
  - Postal Code: 62701
  - Country: USA
- [ ] Click "Next: Select Modules"
- [ ] Verify: Progress bar at 50%
- [ ] Check database: 
  - `core_node` should have company record (node_type='business')
  - `node_relationship` should link profile to company
  - `website_scrape_data` should have entry (if website provided)

### Test Step 4: Module Selection
- [ ] Verify: Recommended modules displayed
- [ ] Modules shown should match business type selected
  - Retail: PRODUCTS, INVENTORY, ORDERS, CUSTOMERS, FINANCE ✓
  - Medical: CUSTOMERS, SERVICES, APPOINTMENTS, EMPLOYEES, FINANCE ✓
  - Software: SERVICES, CUSTOMERS, ORDERS, FINANCE, TEAM, PROJECT ✓
- [ ] All modules should be checked by default
- [ ] Module cards show field counts
- [ ] Click "Next: Choose Layout"
- [ ] Verify: Progress bar at 66%
- [ ] Check database: `node_module_config` records should exist

### Test Step 5: Choose Layout
- [ ] Verify: 4 layout cards visible (Dashboard, Table, Kanban, Calendar)
- [ ] Each card should be clickable
- [ ] Click "Dashboard"
- [ ] Verify: Layout creates successfully
- [ ] Check database: `ui_template` record created
- [ ] Move to confirmation page

### Test Step 6: Confirmation
- [ ] Verify: Summary shows:
  - Company: "Acme Corp" ✓
  - Type: "Retail Store" ✓
  - Modules: Count displayed ✓
  - Fields: Count displayed ✓
- [ ] Click "Start Using Yuvaan"
- [ ] Verify: User redirected to dashboard OR shows dashboard content
- [ ] Check localStorage:
  - `token` should exist
  - `activeNodeId` should exist
- [ ] Check database: `onboarding_session` status should be 'completed'

### End-to-End Test
- [ ] Complete full onboarding (all 6 steps)
- [ ] Verify token in localStorage
- [ ] Refresh page - should NOT go back to onboarding
- [ ] Check all database records created correctly
- [ ] Test with different business types
- [ ] Test with and without website URL

---

## 🔍 DATABASE VERIFICATION

After completing onboarding, verify records:

### Users Table
```sql
SELECT * FROM users WHERE email = 'test@example.com';
-- Should show: 1 record with hashed password
```

### Core Node Table
```sql
SELECT * FROM core_node WHERE owner_id = 'user-id';
-- Should show: 2 records (profile + company)
```

### Node Relationship Table
```sql
SELECT * FROM node_relationship WHERE source_node_id = 'profile-node-id';
-- Should show: 1 record (profile owns company)
```

### Node Module Config Table
```sql
SELECT * FROM node_module_config WHERE node_id = 'company-node-id';
-- Should show: 5+ records (selected modules)
```

### Node Selected Fields Table
```sql
SELECT COUNT(*) FROM node_selected_fields WHERE node_id = 'company-node-id';
-- Should show: 20+ records (selected fields from modules)
```

### Onboarding Session Table
```sql
SELECT * FROM onboarding_session WHERE user_id = 'user-id';
-- Should show: 1 record with status='completed'
```

### Website Scrape Data Table (if website provided)
```sql
SELECT * FROM website_scrape_data WHERE website_url LIKE '%example.com%';
-- Should show: scrape_status='success'
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "No token provided" Error
**Cause**: Authorization header not sent
**Fix**: 
```javascript
// In OnboardingFlow.jsx, verify headers:
headers: { Authorization: `Bearer ${token}` }
```
**Verify**: Token exists in state and was saved from Step 1

### Issue: "Module fields not loading"
**Cause**: data_model_registry table empty
**Fix**: Run seed-data-model-registry-business-common.sql
**Verify**: 
```sql
SELECT COUNT(*) FROM data_model_registry;
-- Should return: 350+
```

### Issue: "Website scrape failed"
**Cause**: Invalid URL or website not accessible
**Fix**: 
- Try URL without https://www (just https://example.com)
- Try a public website (google.com, github.com)
- Check firewall/CORS settings
**Verify**: Website is publicly accessible in browser

### Issue: "CORS Error"
**Cause**: Backend CORS not configured
**Fix**: Add to server.js:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```
**Verify**: CORS headers in response

### Issue: "localStorage.token undefined"
**Cause**: Token not saved after signup
**Fix**: Check Step 1 response:
```javascript
console.log('Token:', response.data.token);
localStorage.setItem('token', response.data.token);
```
**Verify**: localStorage in browser DevTools

### Issue: "User can't see modules after company setup"
**Cause**: Module suggestion API not called
**Fix**: Verify Step 4 POST request completes
**Verify**: suggestedModules array populated

### Issue: "Dashboard doesn't load after onboarding"
**Cause**: Dashboard component not created
**Fix**: Create basic Dashboard component:
```javascript
const Dashboard = () => {
  const token = localStorage.getItem('token');
  return <div>Welcome to Dashboard!</div>;
};
```

---

## 📊 PERFORMANCE CHECKLIST

- [ ] Page load time < 3 seconds
- [ ] Form submission < 2 seconds
- [ ] Module suggestion < 1 second
- [ ] Website scrape < 5 seconds
- [ ] Database queries < 500ms
- [ ] No console errors
- [ ] No console warnings
- [ ] Network tab shows successful requests

---

## 🔐 SECURITY VERIFICATION

- [ ] Passwords hashed with bcrypt (not plain text)
- [ ] JWT tokens have expiry (30 days)
- [ ] HTTPS enabled in production
- [ ] CORS restricted to frontend domain
- [ ] No sensitive data in localStorage (except token)
- [ ] No SQL injection vulnerabilities (using Supabase client)
- [ ] Email validation implemented
- [ ] Password strength validation (min 8 chars, uppercase, number)
- [ ] Rate limiting on signup (prevent abuse)

---

## 📱 RESPONSIVE DESIGN TEST

- [ ] Test on Desktop (1920x1080) - Full layout
- [ ] Test on Tablet (768px) - Single column
- [ ] Test on Mobile (375px) - Stacked layout
- [ ] Form inputs readable on mobile
- [ ] Buttons clickable on mobile
- [ ] Progress bar visible on all sizes
- [ ] Error messages display correctly
- [ ] No horizontal scroll on mobile

---

## 🚀 PRODUCTION DEPLOYMENT

### Pre-Production
- [ ] All tests pass
- [ ] Code reviewed
- [ ] No console errors/warnings
- [ ] Environment variables set correctly
- [ ] Database backups created

### Deployment Steps
- [ ] Deploy frontend to hosting (Vercel, Netlify, etc.)
- [ ] Deploy backend to hosting (Heroku, Railway, etc.)
- [ ] Update environment variables on hosting
- [ ] Set REACT_APP_API_URL to production API
- [ ] Enable HTTPS
- [ ] Set up SSL certificate
- [ ] Configure CORS for production domain
- [ ] Test onboarding on production
- [ ] Monitor error logs

### Post-Deployment
- [ ] Verify onboarding flow works
- [ ] Test with real email
- [ ] Check database records created
- [ ] Monitor API response times
- [ ] Check error logs for issues
- [ ] Get user feedback
- [ ] Plan Phase 2 improvements

---

## 📞 SUPPORT RESOURCES

### Documentation
- `ONBOARDING_COMPLETE_GUIDE.md` - Full technical guide
- `ONBOARDING_IMPLEMENTATION_SUMMARY.md` - Quick start
- `README.md` - Project overview

### Key Files
- Backend: `routes-onboarding.js`
- Frontend: `OnboardingFlow.jsx`, `OnboardingFlow.css`
- Database: `db-schema-core-node-system.sql`
- Data Model: `seed-data-model-registry-business-common.sql`

### Testing
- Use Postman for API testing
- Use browser DevTools for frontend debugging
- Check Supabase Dashboard for database queries
- Use console.log for debugging

---

## ✅ FINAL SIGN-OFF

- [ ] All checklist items completed
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Team trained on system
- [ ] Ready for user testing
- [ ] Ready for production deployment

**Status**: ✅ **READY TO DEPLOY**

---

**Last Updated**: February 1, 2026
**Version**: 1.0
**Created By**: Yuvaan Development Team
