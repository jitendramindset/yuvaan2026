# Frontend Application Consolidation

Date: 2026-09-22
Branch: `feature/vanshawali-single-node`

## 1. Old Entry Point

React `src/index.js` was the active entry point, but `/`, `/dashboard`, `/dashboard-engine`, and unknown paths routed into multiple legacy experiences. `App.js` defaulted to `Introduction.js` and used internal `currentScreen` state for dashboard, profile, showcase, onboarding, and admin. This caused the old BotMantra/table-builder experience to appear before the intended authenticated application flow.

## 2. New Entry Point

The public application entry is now `/login`. The authenticated application entry is `/app/*`. The root and unknown paths redirect to `/login`; legacy dashboard, engine, showcase, and admin paths redirect into the new shell routes.

## 3. Authentication Flow

The existing `login.js` implementation remains the authentication screen and continues using the existing backend authentication mechanisms. Successful login redirects to `/app`. The shell reads the existing application token through `serviceClient`, requires `user_id`, and redirects missing sessions to `/login`. Logout clears the existing auth/session keys and returns to `/login`.

No fake auth, service-role key, automatic user creation, or frontend database credential was added.

## 4. Route Map

- `/login` -> existing supported login screen.
- `/app` -> authenticated dashboard.
- `/app/vanshavali` -> existing `FamilyTreeScreen` inside the authenticated shell.
- `/app/components` -> existing `ComponentShowcase` development area.
- `/app/profile` -> existing `ProfileScreen`.
- `/app/admin/nodeos` -> read-only NodeOS admin screen, backend-enforced.
- `/`, unknown paths -> `/login`.
- `/dashboard`, `/dashboard-engine` -> `/app`.
- `/showcase` -> `/app/components`.
- `/admin/*` -> `/app/admin/nodeos`.

## 5. Application Shell

Added `ApplicationShell` with one responsive header, sidebar navigation, user/logout control, page container, and mobile navigation collapse. Normal users see Dashboard, Vanshavali, Components, and Profile. Admin navigation is added only after an authenticated admin bootstrap check succeeds.

## 6. Vanshavali Integration

The existing Family Tree remains the domain UI. It calls the authenticated Vanshavali API and preserves the Phase 7C/7D node_core, graph, projection, and relationship model. No family table or direct Supabase access was introduced.

## 7. Admin NodeOS Screen

Added a read-only `/app/admin/nodeos` screen with search, type filtering, refresh, node list, safe masked identifiers, hierarchy fields, relationship metadata, permissions, and decoded metadata.

Added backend routes:

- `GET /api/admin/nodeos/nodes`
- `GET /api/admin/nodeos/nodes/:nidHash`

The routes verify Supabase or existing application JWTs, enforce admin access using existing `users.business_role` or `admin_permissions`, and return safe node projections without `row_id` or authentication secrets.

## 8. Kernel-Only Backend Flow

The shell and Vanshavali UI use HTTP application APIs. The dashboard node summary uses `/api/vanshawali/nodes`; admin uses `/api/admin/nodeos`; family operations use the existing Vanshavali API and Kernel ingest path. No new React component queries Supabase directly.

## 9. Direct Database Calls Removed/Moved

No broad legacy refactor was attempted. Existing direct/fallback database code remains isolated in legacy `Dashboard.js`, `utils/DashboardService.js`, database inspection/setup scripts, and development-only routes. These are no longer the default application shell. The new admin NodeOS API keeps repository access on the backend and frontend receives only HTTP responses.

## 10. Legacy Screens Isolated

The old Introduction/table-builder flow is no longer a default entry. Legacy dashboard and engine routes redirect to `/app`; the ComponentShowcase remains available only under `/app/components`. The old inline admin customization control room is no longer the primary admin route; NodeOS mapping is the primary admin destination.

## 11. Responsive Fixes

The new shell uses a shared max-width/padding system, CSS grid for summary/detail layouts, bounded scroll containers for NodeOS lists and metadata, responsive mobile navigation, and two-column-to-one-column admin layout behavior. Normal layout does not depend on negative margins or absolute positioning.

## 12. Tests

- Admin NodeOS service safe projection/search test: PASS.
- Family creation test: PASS.
- Family relationship/projection test: PASS.
- Backend syntax checks: PASS.
- Frontend editor diagnostics: PASS.
- Existing backend suite: `3` passed, `20` failed, `1` skipped. These are legacy `/api/v1` endpoint and response-shape expectations; they are classified separately and were not used to drive new shell behavior.

## 13. Build Result

`botmantra-ui npm run build`: PASS. Existing unrelated ESLint warnings remain in legacy `App.js` and translation files.

## 14. Runtime Verification

Local runtime smoke checks:

- Backend `/health`: `200`.
- Frontend `/login`: `200`.
- Frontend `/app`: `200` host response.
- Anonymous `/api/admin/nodeos/nodes`: `401`.

Authenticated browser verification requires a valid existing user session. No test user or fake token was created.

## 15. Remaining Issues

- A real authenticated admin session is still required to verify the positive NodeOS screen path.
- Existing legacy backend tests need separate modernization or classification cleanup; no obsolete route behavior was restored.
- Legacy direct Supabase fallback utilities remain in the repository but are outside the new default shell.
- Existing build warnings in translation files and legacy `App.js` remain.
- No database schema change, migration, or family data write was performed.
