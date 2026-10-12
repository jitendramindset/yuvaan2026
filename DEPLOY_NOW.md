# 🎯 DEPLOYMENT EXECUTION SCRIPT - START NOW

**Execute these commands in order. Copy-paste each block.**

---

## ⚡ STEP 1: Verify What You Have (2 minutes)

```powershell
# Navigate to project root
cd "d:\React App\Yuvaan-v1"

# Check backend exists
Test-Path ".\botmantra-backend\routes-onboarding-kernel.js"
# Should output: True

# Check frontend exists  
Test-Path ".\botmantra-ui\src\core\UnifiedOnboardingEngine.ts"
# Should output: True

# Check database migrations exist
Get-ChildItem ".\botmantra-backend\supabase\migrations\" -Filter "*.sql"
# Should list 7 migration files

# If all True, continue. If False, STOP and report issue.
```

---

## ⚡ STEP 2: Setup Supabase Project (5 minutes)

### Option A: Use Existing Project

If you already have a Supabase project:

```powershell
# Set environment variables (UPDATE WITH YOUR VALUES)
$env:SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_ANON_KEY = "your_anon_key_here"
$env:SUPABASE_SERVICE_ROLE_KEY = "your_service_role_key_here"

# Save to .env file
@"
SUPABASE_URL=$env:SUPABASE_URL
SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY
PORT=3001
NODE_ENV=development
"@ | Out-File -FilePath ".\botmantra-backend\.env" -Encoding UTF8

Write-Host "✅ Environment variables saved to botmantra-backend\.env" -ForegroundColor Green
```

### Option B: Create New Project

1. Open browser: https://supabase.com/dashboard
2. Click "New Project"
3. Name: `botmantra-production`
4. Database Password: Generate strong password (SAVE IT!)
5. Region: Choose closest to your users
6. Click "Create new project"
7. Wait 2 minutes for provisioning
8. Copy Project URL and API keys
9. Run Option A commands above with your new credentials

---

## ⚡ STEP 3: Deploy Database Schema (15 minutes)

### Method 1: Using Supabase Dashboard (RECOMMENDED)

```powershell
# 1. Open Supabase Dashboard SQL Editor
Start-Process "https://supabase.com/dashboard/project/$YOUR_PROJECT_REF/sql/new"

# 2. Get migration file contents
Write-Host "`n=== COPY THIS FILE CONTENT ===`n" -ForegroundColor Yellow
Get-Content ".\botmantra-backend\supabase\migrations\000_extensions.sql"
```

**In Supabase SQL Editor:**
1. Paste the content
2. Click "Run"
3. Wait for success message

**Repeat for each migration file IN ORDER:**

```powershell
# Migration 001 - Core Node System
Get-Content ".\botmantra-backend\supabase\migrations\001_core_node_system.sql"
# Copy, paste to SQL Editor, run

# Migration 002 - Roles & Permissions
Get-Content ".\botmantra-backend\supabase\migrations\002_roles_permissions.sql"
# Copy, paste to SQL Editor, run

# Migration 003 - Two API System
Get-Content ".\botmantra-backend\supabase\migrations\003_two_api_system.sql"
# Copy, paste to SQL Editor, run

# Migration 004 - Karma Dharma
Get-Content ".\botmantra-backend\supabase\migrations\004_karma_dharma.sql"
# Copy, paste to SQL Editor, run

# Migration 005 - Economy
Get-Content ".\botmantra-backend\supabase\migrations\005_economy.sql"
# Copy, paste to SQL Editor, run

# Migration 006 - Contribution Graph
Get-Content ".\botmantra-backend\supabase\migrations\006_contribution_graph.sql"
# Copy, paste to SQL Editor, run
```

### Verify Deployment

```powershell
# Open Table Editor
Start-Process "https://supabase.com/dashboard/project/$YOUR_PROJECT_REF/editor"

# You should see these tables:
# ✅ users
# ✅ core_node
# ✅ node_relationship
# ✅ roles
# ✅ permissions
# ✅ role_permissions
# ✅ karma_ledger
# ✅ wallet_accounts
# ... and 20+ more tables
```

---

## ⚡ STEP 4: Deploy RLS Policies (5 minutes)

```powershell
# Get RLS policy content
Get-Content ".\botmantra-backend\supabase\policies\complete-rls-setup.sql"

# Copy output, paste to Supabase SQL Editor, run
```

---

## ⚡ STEP 5: Deploy Seed Data (10 minutes)

```powershell
# Seed 001 - Core data
Get-Content ".\botmantra-backend\supabase\seed\001_core_seed.sql"
# Copy, paste to SQL Editor, run

# Seed 002 - Roles
Get-Content ".\botmantra-backend\supabase\seed\002_roles_seed.sql"
# Copy, paste to SQL Editor, run

# Seed 003 - Templates
Get-Content ".\botmantra-backend\supabase\seed\003_templates_seed.sql"
# Copy, paste to SQL Editor, run

# Seed 004 - Widgets
Get-Content ".\botmantra-backend\supabase\seed\004_widgets_seed.sql"
# Copy, paste to SQL Editor, run

# Seed 020 - System Bootstrap
Get-Content ".\botmantra-backend\supabase\seed\020_system_bootstrap.sql"
# Copy, paste to SQL Editor, run
```

---

## ⚡ STEP 6: Configure Backend Environment (3 minutes)

```powershell
cd ".\botmantra-backend"

# Create complete .env file (UPDATE WITH YOUR VALUES)
@"
# Supabase Configuration
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# OpenAI Configuration (Optional - for AI chat)
OPENAI_API_KEY=sk-your_openai_key_here

# Whisper API (Optional - for voice)
WHISPER_API_URL=https://api.openai.com/v1/audio/transcriptions
WHISPER_API_KEY=sk-your_openai_key_here

# ElevenLabs (Optional - for voice synthesis)
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your_super_secret_jwt_key_$(Get-Random -Minimum 1000 -Maximum 9999)

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Session Configuration
SESSION_SECRET=your_session_secret_$(Get-Random -Minimum 1000 -Maximum 9999)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
"@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Backend .env created" -ForegroundColor Green
```

---

## ⚡ STEP 7: Install Backend Dependencies & Start (5 minutes)

```powershell
# Still in botmantra-backend directory

# Install dependencies
npm install

# Start server
npm start
```

**Expected Output:**
```
🚀 Server running on port 3001
✅ Database connected
✅ Routes loaded
✅ Ready to accept requests
```

**If you see errors:**
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is running
- Check Node.js version (should be 18+)

---

## ⚡ STEP 8: Test Backend (2 minutes)

**Open NEW PowerShell terminal (keep server running):**

```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get

# Should return: {"status":"ok","database":"connected"}

# Test bootstrap endpoint
$body = @{
    userId = "test-user-123"
    domain = "botmantra.ai"
    deviceFingerprint = "test-device-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/kernel/post-login-bootstrap" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"

# Should return: JSON object with nodeIdentity, trustState, etc.
```

**If successful, backend is WORKING! ✅**

---

## ⚡ STEP 9: Configure Frontend (3 minutes)

```powershell
# Navigate to frontend
cd "d:\React App\Yuvaan-v1\botmantra-ui"

# Create .env file
@"
REACT_APP_KERNEL_URL=http://localhost:3001
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_BRAND=botmantra
"@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Frontend .env created" -ForegroundColor Green
```

---

## ⚡ STEP 10: Install Frontend Dependencies & Start (5 minutes)

```powershell
# Still in botmantra-ui directory

# Install dependencies
npm install

# Start development server
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view botmantra-ui in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Browser should auto-open to http://localhost:3000**

---

## ⚡ STEP 11: Test Complete Flow (5 minutes)

**In browser:**

1. Go to http://localhost:3000
2. You should see onboarding screen
3. Try completing onboarding flow
4. Check browser console for errors
5. Check backend terminal for API calls

**If you see UI and can interact, SUCCESS! 🎉**

---

## 🚨 TROUBLESHOOTING

### Backend won't start

```powershell
# Check Node version
node --version
# Should be v18 or higher

# Check if port 3001 is in use
netstat -ano | findstr :3001
# If in use, kill the process or change PORT in .env

# Check .env file exists
Test-Path ".\.env"

# View .env content
Get-Content ".\.env"
```

### Database connection fails

```powershell
# Test Supabase URL directly
Invoke-RestMethod -Uri "https://YOUR_PROJECT_REF.supabase.co/rest/v1/" `
  -Headers @{
    "apikey" = "your_anon_key_here"
  }

# Should return: 404 or schema info (not 500 error)
```

### Frontend won't load

```powershell
# Check if backend is running
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

---

## ✅ COMPLETION CHECKLIST

After running all steps, verify:

- [ ] Supabase project created
- [ ] All 7 migration files deployed
- [ ] RLS policies deployed
- [ ] Seed data deployed
- [ ] Backend .env configured
- [ ] Backend server running on port 3001
- [ ] Backend health endpoint responds
- [ ] Backend bootstrap endpoint works
- [ ] Frontend .env configured
- [ ] Frontend running on port 3000
- [ ] Frontend loads in browser
- [ ] No critical errors in console

**If all checked, you're at 50% completion of Day 1! 🎯**

---

## 📊 ESTIMATED TIME

| Step | Time | Running Total |
|------|------|---------------|
| 1. Verify files | 2 min | 2 min |
| 2. Setup Supabase | 5 min | 7 min |
| 3. Deploy schema | 15 min | 22 min |
| 4. Deploy RLS | 5 min | 27 min |
| 5. Deploy seeds | 10 min | 37 min |
| 6. Backend .env | 3 min | 40 min |
| 7. Backend start | 5 min | 45 min |
| 8. Test backend | 2 min | 47 min |
| 9. Frontend .env | 3 min | 50 min |
| 10. Frontend start | 5 min | 55 min |
| 11. Test flow | 5 min | **60 min** |

**Total: 1 hour to get running locally! ⚡**

---

## 🚀 NEXT STEPS AFTER THIS

Once everything is running locally:

**Day 1 Evening:**
- Run more comprehensive tests
- Document any bugs
- Fix critical issues

**Day 2:**
- Deploy to staging environment
- Configure production Supabase
- Setup hosting (Vercel/Railway)

**Day 3-7:**
- Follow ONE_WEEK_PRODUCTION_PLAN.md

---

**START NOW! Copy and paste commands one by one. Report progress. 🎯**
