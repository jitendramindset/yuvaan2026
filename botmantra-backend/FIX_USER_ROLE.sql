-- ═══════════════════════════════════════════════════════════════
-- USER ROLE ASSIGNMENT - FIX FOR prasadjitendra9@gmail.com
-- ═══════════════════════════════════════════════════════════════
-- Run this SQL in your Supabase SQL Editor
-- Or via Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Verify user exists
SELECT id, email, full_name, created_at 
FROM users 
WHERE email = 'prasadjitendra9@gmail.com';

-- Step 2: Check current roles
SELECT 
  ur.user_id,
  ur.role_id,
  r.role_code,
  r.role_name,
  ur.assigned_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '64a39f9d-e2ca-4773-ab18-cb00f0f88875';

-- Step 3: Assign owner role (MAIN FIX)
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
  '64a39f9d-e2ca-4773-ab18-cb00f0f88875' AS user_id,
  r.id AS role_id,
  NOW() AS assigned_at
FROM roles r
WHERE r.role_code = 'owner'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Step 4: Verify role assignment
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.role_code,
  r.role_name,
  ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'prasadjitendra9@gmail.com';

-- ═══════════════════════════════════════════════════════════════
-- Expected Result After Running:
-- ═══════════════════════════════════════════════════════════════
-- id                                   | email                      | full_name  | role_code | role_name | assigned_at
-- 64a39f9d-e2ca-4773-ab18-cb00f0f88875 | prasadjitendra9@gmail.com | Test User  | owner     | Owner     | 2026-02-03...
-- ═══════════════════════════════════════════════════════════════

-- After running this, you can:
-- 1. Test NodeCore create: POST /api/nodecore-chat/create
-- 2. Test dashboard saves
-- 3. Test widget creation
-- All previously blocked features should now work!
