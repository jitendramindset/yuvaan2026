# PHASE_5E_RUNTIME_STATUS

## Users Schema
Status: PASS

Evidence:
- The live public.users table contains actual runtime identity fields such as id, email, mobile, full_name, created_at, auth_method, and related safe fields.
- The earlier password_hash error was a stale query issue, not a proof that the users table is unusable.

## Authentication Contract
Status: PASS

Evidence:
- routes-auth.js contains an active signin path.
- handleSignin validates local user rows and falls back to Supabase auth.
- generateToken returns a JWT.
- middleware/auth.js verifies Authorization: Bearer <token>.
- middleware/ensureUserExists.js attaches the user context to the request.

## Real Login
Status: BLOCKED

Evidence:
- the real backend login endpoint was hit against known runtime accounts.
- the response was 401 Invalid email or password for the candidate account attempts.
- no authenticated session could be proven from the active development dataset.

## Authenticated Family API
Status: BLOCKED

Evidence:
- a valid family API call could not be proven through a real authenticated session.
- no confirmed JWT-backed login existed for a family-aware account in the active runtime state.

## Unauthenticated API
Status: BLOCKED

Evidence:
- the family endpoint is exposed without a proven auth gate in the current runtime state.
- this is a security blocker for the family route and prevents authenticated family access from being trusted.

## Permission Boundary
Status: BLOCKED

Evidence:
- the permission engine is present and structurally valid.
- no live user pair or unrelated-node dataset was available to prove the expected own-node allowed / unrelated-node denied behavior.

## Human Family Test Data
Status: UNAVAILABLE

Evidence:
- live node_core contains 80 nodes, 76 roots, and only 4 parent-linked records.
- no proven human parent-child-grandchild lineage exists in the runtime data.
- no valid family test-data set is ready for E2E usage.

## Node Graph
Status: NOT TESTABLE

Evidence:
- the graph implementation is structurally valid.
- there is no proven human family hierarchy in the active data to test parent -> child or child -> parent behavior.
- this is a data-readiness blocker, not a graph implementation failure.

## Family Projection
Status: PASS

Evidence:
- the projection layer handles empty and partial lineage safely.
- it does not fabricate a family tree in the absence of a valid chain.

## Frontend Build
Status: PASS

Evidence:
- npm run build in botmantra-ui completed successfully.
- build output was generated with warnings only.

## Canonical Smoke Environment
Status: BLOCKED

Evidence:
- the canonical smoke test is blocked by workspace/module resolution issues around @supabase/supabase-js.
- the dependency is declared in botmantra-backend/package.json, but the test environment is not consistently resolving it.

## Final decision
FAMILY_RUNTIME_DATA_BLOCKED

DATABASE MIGRATION REQUIRED: NO
DATABASE WRITE REQUIRED: NO
