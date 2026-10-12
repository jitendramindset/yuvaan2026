# Canonical Scorecard

## Backend

| Area | Status |
|---|---|
| Build | PASS |
| Runtime | PARTIAL |
| Database | PASS |
| Routes | PARTIAL |

## NodeOS

| Area | Status |
|---|---|
| Schema | PARTIAL |
| Graph | UNKNOWN |
| Kernel | PARTIAL |
| Permissions | PARTIAL |
| Vector | PARTIAL |

## Family

| Area | Status |
|---|---|
| Family creation | UNKNOWN |
| Members | UNKNOWN |
| Relationships | UNKNOWN |
| Lineage | PARTIAL |
| Tree | BLOCKED |

## Frontend

| Area | Status |
|---|---|
| Build | FAIL |
| Auth | PARTIAL |
| Dashboard | UNKNOWN |
| Profile | PARTIAL |
| FamilyOS | PARTIAL |
| Family Tree | BLOCKED |

## AI

| Area | Status |
|---|---|
| BotMantra | PARTIAL |
| NodeCore chat | PARTIAL |
| Kernel execution | PARTIAL |

## Security

| Area | Status |
|---|---|
| Authentication | PARTIAL |
| Authorization | PARTIAL |
| RLS | UNKNOWN |
| Secrets | FAIL |

## Deployment

| Area | Status |
|---|---|
| Web | PARTIAL |
| Backend | PARTIAL |
| Database | PASS |
| Mobile | UNKNOWN |

## Notes

- Backend build is effectively "startup success" rather than full app health because the test suite is failing.
- Frontend build is failing on parse error in translation file; this blocks any client-side runtime proof.
- Family flows are source-complete but not runtime-proven.
- Security posture is currently not production-safe because repo credentials are exposed in `.env`.
