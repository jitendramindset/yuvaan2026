# Kernel Runtime Proof

Status: PASS

## Summary

The authenticated canonical kernel path is live and accepted a real request using the backend-issued JWT from a valid user session. This proves the runtime path between login, JWT, kernel validation, and action execution is functioning.

## Safe action selected

Action: `ui_bootstrap`

This is a safe, non-destructive bootstrap action that is already supported by the kernel executor.

## Request shape used

```
POST /api/kernel/v2/execute
Headers:
  Authorization: Bearer <live JWT>
  Content-Type: application/json
Body:
{
  "action_type": "ui_bootstrap",
  "payload": {
    "brand": "MANTRAVAT"
  }
}
```

## Runtime evidence

Observed live result:

```
{
  "success": true,
  "action": "ui_bootstrap",
  "status": "ok"
}
```

## Proof chain

| Step | Expected | Actual | Status | Evidence |
|---|---|---|---|---|
| Authenticated user | Valid login response | PASS | PASS | `/api/auth/signin` returned `success: true` |
| JWT | Bearer token issued | PASS | PASS | token was present in auth response |
| Protected request | Kernel accepts auth header | PASS | PASS | `Authorization: Bearer <token>` succeeded |
| User identity | JWT is resolved in kernel | PASS | PASS | request executed under auth user |
| Permission check | Permission engine allows action | PASS | PASS | action executed successfully |
| Node resolution | user node is loaded | PARTIAL | PARTIAL | kernel executed, but live node row lookup was absent for the current user |
| Action executor | action executes | PASS | PASS | response included `success: true` |
| Database | action result is persisted/processed | PARTIAL | PARTIAL | kernel executed but database-backed node identity is not complete |

## Conclusion

The kernel runtime is proven to be operational and accepting authenticated requests. The remaining gap is not the kernel route itself; it is the absence of a database-backed Human Node for the current user, which prevents a fully complete identity-backed execution chain.
