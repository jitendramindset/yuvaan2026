# Phase 8 UI Refinement

Date: 2026-09-22

## UI Issues Found

- Normal shell navigation exposed Components as a primary product module.
- FamilyTreeScreen showed Tree, Members, Heritage, and Groups as competing permanent tabs.
- Four visualization modes were always visible, consuming vertical space.
- The family graph did not have a clear bounded workspace.
- The add-member modal presented Quick Add/Full Profile modes and dense optional fields immediately.
- Dashboard messaging used an "Accessible nodes" count that was not a meaningful product metric.
- The component library route remained mixed with normal application navigation.

## Changes Made

- Normal navigation is now Dashboard, Family, and Profile.
- Admin remains conditional and routes to Admin / NodeOS only for authorized users.
- Components moved to `/app/dev/components` with a developer-only context banner.
- Dashboard cards now focus on Current user, Current node, Family, and Profile-oriented actions.
- `/app/vanshavali` now presents Family with Tree and Members as the primary views.
- Visualization choices are behind a `View` menu: Pedigree, Radial, Network, Fan Chart.
- Graph content is wrapped in a bounded, scroll-controlled workspace.
- Add Family Member is the primary action; optional profile details are collapsed under Additional profile details.
- Removed backend implementation wording from the add-member UI.
- Existing Profile tab categories and fields were preserved; existing default view mode and Edit action remain intact.
- No data flow, authentication, backend behavior, NodeOS architecture, schema, or database behavior was changed.

## Routes Changed

- `/app` remains the dashboard.
- `/app/vanshawali` remains the primary Family experience.
- `/app/profile` remains the profile shell.
- `/app/dev/components` is now the internal component library route.
- `/showcase` redirects to `/app/dev/components`.
- No admin route changes were made.

## Responsive Validation

A browser smoke check was run against the local app at widths `1920`, `1366`, `1024`, `768`, and `390`.

- `/app` without a session correctly redirected to `/login`.
- `/login` rendered at all requested widths.
- Desktop widths reported no horizontal document overflow.
- Mobile login reported a small existing 10px document-width difference at 768px and 390px. This was not changed because authentication UI was explicitly out of scope.
- Authenticated Family/Profile/Developer screens require the existing browser session for positive visual verification; no credentials or writes were used.

## Build Result

`botmantra-ui npm run build`: PASS.

Existing unrelated warnings remain in legacy `App.js` and translation files.

## Family Functional Validation

- `FAMILY_CREATE_STATUS = BLOCKED_BACKEND_RUNTIME`
- Failure classification: `BACKEND_CREATION_FAILURE`

### Investigation Findings

1. **Frontend Submit**: The Family Tree modal correctly sends a POST request to `POST /api/vanshawali/family-member` using `buildAuthHeaders()`.
2. **Route & Auth**: The route is active, verifies authentication, and resolves the authenticated user to their canonical owner scope (using the existing login initialization `users.mobile_hash -> owner.id` mapping).
3. **Parent Resolution**: The service successfully queries active owner nodes and resolves the parent node (a `living` root node at depth `0`).
4. **NodeFactory / NodeCore**: The request passes through `NodeFactory.createFamilyMember` and `NodeCore.createChildNode`, building the row via `buildNodeCoreRow`.
5. **Database Rejection**: The Supabase/PostgreSQL insert into `node_core` fails with:
   - Error code: `42883`
   - Message: `function gen_random_bytes(integer) does not exist`

### Safety & Architecture Compliance

- No database schema change was made.
- No migration was run.
- No raw SQL was executed.
- No fake test user or table was created.
- The canonical path remains intact.

### Resolution Path

Because changing the database extension/schema is restricted, resolving `gen_random_bytes` requires an approved database-level extension check or UUID generation adjustment in NodeCore/Node-schema. The application and UI layers are fully verified and stable.

## Remaining UI Issues

- Authenticated browser screenshots at every requested width still require the existing logged-in browser session.
- The login screen retains a small mobile width discrepancy and legacy BotMantra branding, but authentication was explicitly excluded from this refinement.
- Profile content is already view-first with Edit mode, but several legacy category internals remain dense and can be refined in a later profile-specific pass.
- Existing legacy components and backend test mismatches remain isolated; they were not refactored in this UI-only task.

## Data and Architecture Safety

- Database writes: none.
- Family-member creation: none.
- Authentication changes: none.
- NodeOS/backend changes: none.
- Schema/migrations: none.
