# Auth Runtime Proof

Status: PASS

## Summary

The canonical authentication flow is working in the live runtime for an existing development account. The session is created by the backend auth route, the JWT is issued to the client, and the user identity is resolved and accepted by the protected kernel route.

## Runtime evidence

Executed against the live backend:

- Login endpoint: `POST /api/auth/signin`
- Live account used: `admin@botmantra.local`
- Result: `success: true`
- User ID resolved: `48de0c21-01f3-4a1e-b74f-c7c3ae8309ba`
- JWT present in response: `true`

Observed response summary:

```
{
  "auth": {
    "success": true,
    "userId": "48de0c21-01f3-4a1e-b74f-c7c3ae8309ba"
  }
}
```

## Contract proof

| Step | Expected | Actual | Status | Evidence |
|---|---|---|---|---|
| Login | Valid credentials return user + JWT | PASS | PASS | `/api/auth/signin` returned `success: true` with userId and token |
| Session/token | Token is issued to client | PASS | PASS | Response included a token and `tokenPresent: true` |
| Backend auth | JWT is accepted by protected API | PASS | PASS | Authenticated call to `/api/kernel/v2/execute` succeeded |
| User identity | User ID is extracted and used | PASS | PASS | Kernel request accepted with user identity from backend login |
| Node identity | User node is expected to resolve | PARTIAL | PARTIAL | User login succeeded, but no live `node_core` row was found for this user |
| Authenticated API call | Protected request succeeds | PASS | PASS | Kernel request returned success with action `ui_bootstrap` |

## Canonical flow

Frontend
↓
`POST /api/auth/signin`
↓
backend validates credentials
↓
backend generates JWT
↓
client stores token in local/session storage
↓
`Authorization: Bearer <token>` is sent to protected endpoints
↓
backend extracts user identity from JWT
↓
kernel accepts request

## Root cause / caveat

Authentication itself is proven to work. The remaining issue is not login; it is the separate Human Node identity gap: the authenticated user is valid, but the database does not currently contain a live `node_core` row for that user, so the system is using the kernel fallback path rather than a database-backed human node.
