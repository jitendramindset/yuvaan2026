# AUTH_RUNTIME_CONTRACT

## Runtime flow
The application is using a mixed local-user + Supabase-auth flow. The actual runtime path is as follows:

1. Frontend login form submits emailOrPhone + password to /api/auth/signin.
2. Backend routes-auth.js handles the request in handleSignin.
3. It looks for a local users row by email or mobile.
4. If no local user row is found or the row lacks a password, it falls back to supabase.auth.signInWithPassword.
5. After successful verification, it hashes the password with SHA-256 and checks against users.password or users.pass_hash.
6. It generates a JWT with generateToken.
7. It attaches the token to the Authorization header for subsequent calls.
8. The auth middleware validates the bearer token.
9. req.user is attached and used by protected routes.

## File-by-file contract

| Step | File | Function | Actual field / logic | Status |
| --- | --- | --- | --- | --- |
| Login request | botmantra-ui/src/login.js | login flow | emailOrPhone + password posted to /api/auth/signin | Active |
| Server entry | botmantra-backend/server.js | app setup | app.use('/api/auth', ...) via setupAuthRoutes | Active |
| User lookup | botmantra-backend/routes-auth.js | handleSignin | users table filtered by email or mobile | Active |
| Password verification | botmantra-backend/routes-auth.js | handleSignin | compares SHA-256 hash against users.password or users.pass_hash | Active |
| Supabase fallback | botmantra-backend/routes-auth.js | handleSignin | supabase.auth.signInWithPassword | Active |
| JWT generation | botmantra-backend/routes-auth.js | generateToken | userId, email, fullName, mobile, deviceId | Active |
| Session persistence | botmantra-ui/src/login.js | localStorage set | auth_token, user_id, user_name, autoLogin | Active |
| Authorization | botmantra-backend/middleware/auth.js | authenticate | Authorization: Bearer <token> | Active |
| User population | botmantra-backend/middleware/ensureUserExists.js | ensureUserExists | decodes JWT and ensures users row exists | Active |

## Key runtime observation
The current local password contract is based on the actual users table fields that exist in the runtime schema. The stale query pattern using password_hash is not the active auth contract and is not required for the runtime implementation.

## Conclusion
The application does have a real auth flow, but the current development environment has not yet produced a proven successful login for a family-aware runtime account. The code path is valid, but the live auth dataset is not yet proven to satisfy the expected family test scenario.

DATABASE MIGRATION REQUIRED: NO
DATABASE WRITE REQUIRED: NO
