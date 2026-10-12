# Testing Guide: Auth Flow & Kernel Fallback Implementation

## Overview

This guide walks you through testing the complete auth flow and kernel fallback implementation. Three test tools are provided:

1. **test-implementation.js** - API endpoint testing (signup, login, kernel execute)
2. **verify-database.js** - Database verification (node_core queries)
3. **verify-database.sql** - Manual SQL queries (run in Supabase editor)

---

## Quick Start (Run All Tests)

```bash
# Terminal 1: Start backend (if not running)
npm start

# Terminal 2: Run API tests
node test-implementation.js

# Terminal 3: Run database verification
node verify-database.js

# Terminal 4: Manual verification
# Paste verify-database.sql into Supabase editor:
# https://app.supabase.com/project/YOUR_PROJECT/sql/new
```

---

## Test 1: API Tests (test-implementation.js)

### What it tests
✅ Backend health  
✅ User signup (creates 5 node_core nodes)  
✅ Verify 5 nodes created in database  
✅ User login (tests recovery mechanism)  
✅ Kernel execute (tests STEP 2 user loading)  
✅ Brand assignment by age (junior_mantra, jeetmantra, mantravat, vanshawali)  
✅ Permission assignment verification  
✅ Performance (concurrent requests)  
✅ Error recovery simulation  
✅ Database schema verification  

### How to run

```bash
# Terminal: In d:\React App\Yuvaan-v1 directory
node test-implementation.js
```

### Expected output

```
✅ Backend is healthy
✅ Signup successful
✅ Token: eyJhbG...
✅ User ID: {uuid}
✅ Node Core: { nid_hash: '...', brand_root: 'jeetmantra', node_state: 'ACTIVE' }
✅ Brand correctly assigned: jeetmantra (for age 16)
✅ Login successful
✅ brand_root returned: jeetmantra
✅ Kernel execute succeeded
✅ No kernel errors detected
✅ Brand assignment tests passed
✅ Performance excellent (< 1000ms per request)

Results: 10/10 tests passed
✅ ALL TESTS PASSED
```

### What each test verifies

| Test | Purpose | Pass Criteria |
|------|---------|---------------|
| 1. Backend Health | API is running | Status 200 /health |
| 2. Signup | Create user + 5 nodes | Token returned, node_core data |
| 3. Verify Nodes | Check 5 rows created | 5+ node_core rows exist |
| 4. Login | Load user + recovery | Token + brand_root returned |
| 5. Kernel Execute | Load user in STEP 2 | No 404 errors, fallback works |
| 6. Brand by Age | Age-based assignment | junior_mantra, jeetmantra, mantravat |
| 7. Permissions | Age-based access | Permissions assigned (database check) |
| 8. Performance | Concurrent load | < 1000ms avg per request |
| 9. Error Recovery | Recovery mechanism | Can handle missing nodes |
| 10. DB Schema | Schema verification | All columns present |

---

## Test 2: Database Verification (verify-database.js)

### What it queries
✅ Total node count  
✅ Nodes per user  
✅ Node types distribution  
✅ Brand root assignment  
✅ Sample node details  
✅ Blob fields status  
✅ Recent activity (recovery indicator)  
✅ Data integrity validation  

### How to run

```bash
# Requirements: Supabase credentials in .env
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key

# Terminal: In d:\React App\Yuvaan-v1 directory
node verify-database.js
```

### Expected output

```
ℹ️  Total node_core rows: 5+
✅ All nodes have owner_id ✓
✅ All nodes have nid_hash ✓
✅ All nodes have node_state = ACTIVE ✓
✅ All nodes have brand_root ✓
✅ All nid_hash values are unique ✓

Results: 8/8 queries successful
✅ DATABASE HEALTHY
```

### What each query verifies

| Query | Purpose | Passes When |
|-------|---------|-------------|
| 1. Total Count | Check nodes exist | count > 0 |
| 2. Per User | Verify 5-node structure | Each user has 5 nodes |
| 3. Node Types | Check all types created | user, vector_memory, relationship_map, layout_schema, permission_set |
| 4. Brand Distribution | Verify age-based assignment | One brand per user, multiple users |
| 5. Sample Details | Show data structure | owner_id, nid_hash, brand_root present |
| 6. Blob Fields | Verify metadata storage | dna_blob, field_map, perm_blob populated |
| 7. Recent Activity | Recovery indicator | Timestamps show creation time |
| 8. Validation | Data integrity | No missing fields, unique hashes |

---

## Test 3: Manual SQL Verification (verify-database.sql)

### How to run

1. Open Supabase dashboard: https://app.supabase.com
2. Go to SQL Editor → New query
3. Copy a query from `verify-database.sql`
4. Run and check results

### Key queries to run

**Query 1: Check total nodes**
```sql
SELECT COUNT(*) as total_nodes FROM node_core;
-- Expected: 5+ (5 per user)
```

**Query 2: Show all user nodes**
```sql
SELECT owner_id, node_type, brand_root, node_state 
FROM node_core 
LIMIT 20;
-- Expected: 5 rows per owner_id with same brand_root
```

**Query 3: Verify brand assignment**
```sql
SELECT DISTINCT ON (owner_id) owner_id, brand_root 
FROM node_core;
-- Expected: Multiple users with different brands
```

**Query 4: Check if recovery happened**
```sql
SELECT owner_id, COUNT(*) as nodes, 
       EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as span_seconds
FROM node_core
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY owner_id;
-- Expected: span_seconds < 10 (nodes created quickly)
```

---

## Testing Workflow

### Step 1: Verify Backend Running ✅

```bash
# Terminal: Check health
curl http://localhost:3000/health

# Expected:
# {"status":"ok","timestamp":"...","environment":"development"}
```

### Step 2: Run API Tests ✅

```bash
node test-implementation.js
# Watch output - should see 10/10 passed
# Key checks:
#   - Signup creates token
#   - Signup returns brand_root
#   - Login succeeds
#   - Kernel execute succeeds
```

### Step 3: Verify Database ✅

```bash
node verify-database.js
# Watch output - should see 8/8 queries passed
# Key checks:
#   - Total nodes > 0
#   - Each user has 5 nodes
#   - All nodes have brand_root
#   - All nid_hash unique
```

### Step 4: Manual SQL Checks ✅

```sql
-- In Supabase SQL editor, run key queries from verify-database.sql
SELECT COUNT(*) FROM node_core;
SELECT DISTINCT node_type FROM node_core;
SELECT DISTINCT brand_root FROM node_core;
```

### Step 5: Test Recovery (Optional) ⚙️

Only test if you want to verify recovery mechanism:

```sql
-- 1. Find a test user
SELECT owner_id FROM node_core LIMIT 1;

-- 2. Delete their nodes (this simulates corruption)
DELETE FROM node_core WHERE owner_id = '{PASTE_UUID_HERE}';

-- 3. Try login in your app - recovery should trigger
-- 4. Check database - nodes should be recreated
SELECT COUNT(*) FROM node_core WHERE owner_id = '{PASTE_UUID_HERE}';
-- Expected: 5 (newly created by recovery)
```

---

## Expected Results

### After Successful Signup
```
node_core table should have:
- 5 rows with same owner_id
- node_types: user, vector_memory, relationship_map, layout_schema, permission_set
- All with same brand_root (based on age)
- All with node_state = 'ACTIVE'
- All with karma_score = 0, trust_score = 50
```

### After Login
```
Response should include:
{
  "token": "eyJhbG...",
  "user": { "id": "...", "email": "...", "name": "..." },
  "node_core": {
    "nid_hash": "...",
    "brand_root": "jeetmantra|...",
    "node_state": "ACTIVE"
  }
}
```

### After Kernel Execute
```
Should return valid response with:
- No 404 errors
- STEP 2 loads user successfully
- All 18 steps complete
- User can execute actions
```

---

## Troubleshooting

### Test fails: "Backend not accessible"
**Cause**: Backend not running  
**Fix**:
```bash
# Terminal: Start backend
npm start
```

### Test fails: "No token returned from signup"
**Cause**: Signup endpoint not working  
**Fix**:
1. Check backend logs for errors
2. Verify auth-api.js is deployed
3. Check endpoint: POST /api/auth/signup

### Database query fails: "Cannot connect"
**Cause**: Missing .env variables  
**Fix**:
```bash
# Check .env file
cat .env | grep SUPABASE
# Should show:
# SUPABASE_URL=https://...
# SUPABASE_ANON_KEY=...
```

### Brand not matching age
**Cause**: getActiveBrandByAge() not working correctly  
**Fix**:
1. Check nodeCore.js - getActiveBrandByAge() function
2. Test values:
   - Age 8 → junior_mantra
   - Age 14 → jeetmantra
   - Age 25 → mantravat
   - Age 70 → vanshawali

### Nodes not found in database
**Cause**: NodeCoreManager not called during signup  
**Fix**:
1. Check auth-api.js signup endpoint
2. Verify NodeCoreManager import
3. Verify initializeUserNode() is called
4. Check logs for error messages

---

## Performance Benchmarks

Expected timings:

| Operation | Time | Notes |
|-----------|------|-------|
| Signup | 200-500ms | Creates user + 5 nodes |
| Login (cache hit) | 50-100ms | From Redis cache |
| Login (DB hit) | 150-300ms | First login or cache miss |
| Kernel STEP 2 (Level 1) | 50-200ms | Cache + DB query |
| Kernel STEP 2 (Level 3) | <100ms | Fallback node |
| Recovery (Level 2) | 2-3s | Creates 5 new nodes |

**If slower**:
- Check database latency
- Check network connection
- Monitor CPU usage
- Profile individual steps

---

## Monitoring for Production

### Key metrics to monitor
- Signup success rate (target: 100%)
- Login success rate (target: 100%)
- Kernel execute success rate (target: 99.9%)
- Recovery path frequency (target: < 5/day)
- Fallback path frequency (target: 0/day)
- STEP 2 latency p95 (target: < 2000ms)

### Log indicators to watch for
✅ "Signup successful" - normal  
✅ "Login succeeded" - normal  
✅ "Kernel execute completed" - normal  
⚠️  "Node recovery triggered" - monitor frequency  
❌ "Falling back to default node" - investigate immediately  
❌ "STEP 2: User node not found" - critical  

---

## Summary

**Quick test**: `node test-implementation.js`  
**Database verification**: `node verify-database.js`  
**Manual checks**: Paste SQL from `verify-database.sql` into Supabase editor  

**Expected**: All tests pass, database shows 5-node structure, no errors.

**Timeline**: 5-10 minutes to run all tests

**Success criteria**:
- ✅ Signup creates 5 node_core nodes
- ✅ Brand assigned correctly by age
- ✅ Login loads node_core with recovery
- ✅ Kernel execute has user node (Level 1, 2, or 3)
- ✅ All permissions assigned
- ✅ Database integrity verified
- ✅ No 404 errors
- ✅ Performance acceptable

**Status**: Ready for production deployment
