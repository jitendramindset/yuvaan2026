# Canonical Runtime Blockers

| ID | Area | Problem | Severity | Evidence | Recommended fix |
|---|---|---|---|---|---|
| B1 | Backend | Existing backend test suite fails with 23 failed tests | HIGH | `npm test -- --runInBand` returned 0 passed / 23 failed | Fix the failing API test contract and ensure service is running before validation |
| B2 | Frontend | Production build fails on syntax error in `src/i18n/translations/as.js` | CRITICAL | `npm run build` failed on `Unexpected token, expected ","` | Repair the invalid translation syntax before any frontend runtime validation |
| B3 | Security | Secrets and service-role values are committed in `.env` | CRITICAL | `botmantra-backend/.env` contains Supabase service-role key and email password | Remove secret values from repo, rotate credentials, and use environment injection only |
| B4 | Runtime | Family tree E2E is not executable in current state | HIGH | No authenticated family flow was executed; frontend build is broken | Restore a valid frontend build and prove auth + family API flow |
| B5 | Auth | No single canonical session model was proven live | HIGH | Multiple auth-related systems exist in source (`App.js`, `routes-auth.js`, Supabase env) | Lock the canonical auth/session path and validate one token model end-to-end |
| B6 | Kernel | No live authenticated action execution was proven | HIGH | Kernel route responded, but no real authenticated `execute` payload was validated | Validate a real action from a logged-in identity through the kernel path |
| B7 | NodeOS | Some runtime components are not directly exercised | MEDIUM | `runtimeOrchestrator.js` and `node-graph.js` were not run end-to-end | Add minimal execution proofs for major NodeOS modules |
| B8 | Database | Full live schema introspection was not completed | MEDIUM | `/api/kernel/v2/health` proves connectivity, but not all columns were queried | Run a targeted live schema query against `node_core`, `node_relationships`, and `node_vector_memory` |
| B9 | Family DB | Family API flow is not runtime-validated | MEDIUM | Source exists, but no real family response was tested | Run a real family lineage call using a valid user/session |
| B10 | App shell | UI runtime is blocked by build failure | HIGH | React build cannot compile | Fix syntax error and rebuild before runtime UI checks |
| B11 | AI | BotMantra permission-safe execution is not proven | MEDIUM | Route/mount exists, but no live protected request was executed | Validate a real request with auth and permission assertions |
| B12 | Test quality | The backend suite is failing before a meaningful runtime result can be gathered | MEDIUM | Test output shows 23 failures with no pass evidence | Separate canonical smoke checks from legacy broad suite until the failure set is understood |
| B13 | Dependency health | No canonical smoke test exists for the active runtime path | MEDIUM | Existing tests are broad and failing; no minimal contract check is defined | Add a minimal smoke harness that proves startup, DB, auth, kernel, family API, UI build |
| B14 | Validation completeness | No authenticated frontend login proof exists in current environment | MEDIUM | UI not compiling; no session proven | Use a valid browser or buildable frontend session to validate login and family screen rendering |

## Summary

The blockers are not architectural rewrite blockers; they are runtime validation blockers. The canonical path exists, but it is not yet fully green under real execution.
