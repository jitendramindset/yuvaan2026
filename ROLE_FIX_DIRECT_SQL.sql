-- Direct SQL to assign role - Run this in any SQL client or via backend
-- This bypasses Supabase schema issues

-- First, verify the user exists
SELECT id, email, full_name FROM users WHERE email = 'prasadjitendra9@gmail.com';

-- Second, verify the owner role exists  
SELECT id, role_code, role_name FROM roles WHERE role_code = 'owner';

-- Third, insert the role assignment (this is the fix!)
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  r.id,
  CURRENT_TIMESTAMP
FROM users u
CROSS JOIN roles r
WHERE u.email = 'prasadjitendra9@gmail.com'
  AND r.role_code = 'owner'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Fourth, verify it worked
SELECT 
  u.email,
  r.role_code,
  r.role_name,
  ur.assigned_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'prasadjitendra9@gmail.com';
