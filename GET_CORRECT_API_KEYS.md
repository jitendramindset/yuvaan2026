# 🔑 GET CORRECT API KEYS FROM YOUR WORKING SUPABASE

**Problem:** Login works, tables exist, but .env files have WRONG API keys!

**Solution:** Get the CORRECT keys from your Supabase admin panel (5 minutes)

---

## 🎯 STEP-BY-STEP GUIDE

### Step 1: Access Supabase Admin Dashboard

**Try these URLs in your browser (one should work):**

```
http://72.61.248.216:8000
http://72.61.248.216:8000/project/default
https://api.mantravat.cloud
https://api.mantravat.cloud/project/default
```

**Expected:** You should see Supabase login page or dashboard

---

### Step 2: Login to Dashboard

**If you see login page:**
- Username: Usually `supabase` or your admin email
- Password: Your Supabase admin password

**If you see dashboard directly:**
- Great! You're already logged in

---

### Step 3: Navigate to API Settings

**Once logged in, follow this path:**

1. Look for **"Project Settings"** or gear icon (⚙️) in sidebar
2. Click on **"API"** section
3. You should see a page with API credentials

---

### Step 4: Copy the Correct API Keys

**You need THREE things from the API page:**

**1. Project URL** (top of page)
```
Example: http://72.61.248.216:8000
OR: https://api.mantravat.cloud
```

**2. anon public key** (labeled as "anon public" or "anon key")
```
Starts with: eyJhbGci...
Length: Very long string (200+ characters)
```

**3. service_role key** (labeled as "service_role" - may need to reveal/unhide)
```
Starts with: eyJhbGci...
Length: Very long string (200+ characters)
WARNING: This is SECRET - don't share publicly
```

---

### Step 5: Update Backend .env File

**Open:** `d:\React App\Yuvaan-v1\botmantra-backend\.env`

**Replace these lines with your CORRECT values:**

```env
# Supabase Configuration
SUPABASE_URL=<PASTE_PROJECT_URL_HERE>
ANON_KEY=<PASTE_ANON_KEY_HERE>
SERVICE_ROLE_KEY=<PASTE_SERVICE_ROLE_KEY_HERE>

# Also update these if using PostgreSQL directly:
POSTGRES_HOST=<IP_OR_DOMAIN>  # Example: db.yourid.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<YOUR_DB_PASSWORD>
POSTGRES_PORT=5432
```

---

### Step 6: Update Frontend .env Files

**File 1:** `d:\React App\Yuvaan-v1\botmantra-ui\.env`

```env
REACT_APP_SUPABASE_URL=<PASTE_PROJECT_URL_HERE>
REACT_APP_SUPABASE_ANON_KEY=<PASTE_ANON_KEY_HERE>
```

**File 2:** `d:\React App\Yuvaan-v1\yuvaan-nextjs\.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=<PASTE_PROJECT_URL_HERE>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PASTE_ANON_KEY_HERE>
```

---

### Step 7: Test Connection

**Run this command:**

```powershell
cd "d:\React App\Yuvaan-v1\botmantra-backend"
node test-ip-database.js
```

**Expected Output:**
```
✅ Connection Successful!
✅ Tables accessible: 9/9
🎉 DATABASE IS READY!
```

---

## 🚨 IF YOU CAN'T ACCESS DASHBOARD

### Option 1: Check if Dashboard is on Different Port

**Try these other common ports:**

```
http://72.61.248.216:3000
http://72.61.248.216:8080
http://72.61.248.216:54321
```

---

### Option 2: Use Docker to Get Keys (If you have server access)

**SSH to the server:**

```bash
ssh user@72.61.248.216
```

**Find Supabase containers:**

```bash
docker ps | grep supabase
```

**Check environment variables:**

```bash
docker exec -it <supabase-container-id> env | grep JWT
docker exec -it <supabase-container-id> env | grep ANON
docker exec -it <supabase-container-id> env | grep SERVICE_ROLE
```

**Look for:**
- `ANON_KEY=...`
- `SERVICE_ROLE_KEY=...`
- `JWT_SECRET=...`

---

### Option 3: Check Supabase Config Files

**If you have server access, check these files:**

```bash
# Common Supabase config locations:
cat /opt/supabase/.env
cat ~/supabase/.env
cat /var/lib/supabase/.env
cat /etc/supabase/config.toml
```

**Look for API keys in the config**

---

## 🔍 TROUBLESHOOTING

### Issue: Can't find API keys in dashboard

**Solution:**
1. Go to Project Settings → API
2. Scroll down to "Project API keys" section
3. Click "Reveal" or "Show" buttons next to keys
4. Copy the full keys (they're very long)

---

### Issue: Dashboard won't load

**Possible causes:**
1. Wrong URL - try all variations above
2. Firewall blocking - try from different network
3. Self-hosted instance configuration issue

**Quick fix:**
```powershell
# Test if web interface is accessible
Invoke-WebRequest -Uri "http://72.61.248.216:8000" -UseBasicParsing
```

---

### Issue: Login credentials unknown

**Options:**
1. Check your password manager
2. Check server config files (if you have access)
3. Reset admin password via server console
4. Contact whoever set up the Supabase instance

---

## 📝 ALTERNATIVE: Use Existing Working Keys

**You mentioned login is working. Where is it working?**

1. **Check browser dev tools:**
   - Open your working app
   - Open browser DevTools (F12)
   - Go to Network tab
   - Look for requests to Supabase
   - Check request headers for `apikey` header
   - **That's your ANON_KEY!** Copy it

2. **Check local storage:**
   - In DevTools, go to Application tab
   - Look at Local Storage
   - Find Supabase session data
   - The API key might be visible there

3. **Check existing working code:**
   - Search your codebase for `createClient`
   - Check what URL and key are being used there
   - Use those same values

---

## 🎯 QUICK TEST: Find Working Credentials

Run this to search for Supabase credentials in your code:

```powershell
cd "d:\React App\Yuvaan-v1"
Get-ChildItem -Recurse -Include "*.js","*.ts","*.tsx","*.jsx" | Select-String -Pattern "createClient|supabase" | Select-Object -First 20
```

**Look for lines like:**
```javascript
createClient('URL_HERE', 'KEY_HERE')
```

**Use those exact URL and KEY in your .env files!**

---

## ✅ ONCE YOU HAVE THE KEYS

**Update these 3 files:**

1. `botmantra-backend/.env`
2. `botmantra-ui/.env`
3. `yuvaan-nextjs/.env.local`

**Then run:**

```powershell
cd "d:\React App\Yuvaan-v1\botmantra-backend"
node test-ip-database.js
```

**Should show:**
```
✅ Database Connected!
✅ Tables accessible
🎉 DATABASE IS READY!
```

---

## 🚀 AFTER CONNECTION WORKS

**Next steps:**
1. ✅ Verify all tables exist
2. ✅ Test backend API endpoints
3. ✅ Start frontend development
4. ✅ Complete Week 1 integration

**You're just one correct API key away from being fully operational!** 🎯

---

**Which method will you try first?**
- A) Access dashboard and get keys
- B) Use browser DevTools to find working keys
- C) Search codebase for existing credentials
- D) SSH to server and check config files
