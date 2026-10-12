# Phase 7B Runtime and API Validation

Date: 2026-09-18
Branch: `feature/vanshawali-single-node`
Target: `https://api.mantravat.cloud`

## Server Health

Local backend started with the existing `npm start` command on port `3000`.

- `GET /health`: `200`, valid JSON health response.
- Live target without credentials: `401 Unauthorized`; no public health claim was made for the protected deployment.

## Kernel Health

- Local `GET /api/kernel/v2/health` without credentials: `401 Unauthorized`.
- This endpoint is protected by the existing Kernel auth boundary.

## Vanshavali Routes

Registered routes:

- `GET /api/vanshawali/user-lineage/:userId`
- `GET /api/vanshawali/family-tree/:familyId`
- `GET /api/vanshawali/nodes`
- `POST /api/vanshawali/create-lineage`
- `GET /api/vanshawali/search`
- `GET /api/vanshawali/statistics`
- `PUT /api/vanshawali/update-lineage/:userId`

## Anonymous Auth Test

`GET /api/vanshawali/nodes`, lineage, and family-tree routes without Authorization returned `401 Authentication required`. No family data was returned. PASS.

## Invalid Token Test

The same protected routes with `Bearer invalid-token` returned `401 Invalid or expired token`. PASS.

## Authenticated API Test

A short-lived application-signed JWT was created in memory from an existing owner ID read from `node_core`; it was not printed or persisted.

- `GET /api/vanshawali/nodes?type=relation`: `200`, `23` owner-scoped nodes.
- `GET /api/vanshawali/user-lineage/:ownerId`: `200`, self projection present, metadata present.
- `GET /api/vanshawali/family-tree/:nidHash`: `200`, family ID present, one self member.
- Internal `row_id` was not exposed.
- The existing app JWT is now accepted after signature and expiry verification, alongside Supabase JWTs.

PASS for local authenticated execution.

## Real Node Resolution

The selected real active node resolved with `node_type`, `node_state`, `node_depth`, `nid_hash`, `owner_id`, and `parent_nid_hash` inspected read-only. The sample node was a depth-0 `circle_node` without a parent.

## Family Projection

The real selected owner projected as:

- self: `1`
- ancestors: `0`
- descendants: `0`

This matches the existing mostly-flat data. No synthetic family members were inserted.

The recursive projection was also tested with an in-memory graph containing a parent and two descendant levels; it passed.

## Owner Authorization

A request by User A for User B's lineage returned `403`. PASS.

## Frontend Integration

`FamilyTreeScreen` uses the authenticated Kernel client and `/api/vanshawali/nodes`; it does not hard-code family members. Existing loading, empty, and error rendering paths remain in place. No frontend source change was needed.

## Backend Tests

- Canonical focused graph/projection checks: PASS.
- Backend syntax checks: PASS.
- Existing full backend suite: `3` passed, `20` failed, `1` skipped. The failures are legacy `/api/v1` endpoint expectations and health-shape/auth assumptions, not Vanshavali route failures. No application behavior was changed to satisfy them.

## Frontend Build

`botmantra-ui npm run build`: PASS. Existing ESLint warnings remain in `App.js` and translation files.

## Database Changes

- Database write: NO
- Schema change: NO
- Migration: NO
- Seed/fake data: NO
- Production reset: NO

All Phase 7B node and projection checks were read-only.

## Remaining Blockers

- Live authenticated validation against `api.mantravat.cloud` still requires an authorized token; no production token was available or exposed.
- Existing runtime data is too flat to prove a real multi-generation family tree.
- The full backend suite remains legacy and mostly incompatible with the currently mounted route set.
- Deployment is not approved by this validation phase.
