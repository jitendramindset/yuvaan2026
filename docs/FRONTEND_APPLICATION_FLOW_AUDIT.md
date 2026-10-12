# Frontend Application Flow Audit

Date: 2026-09-22

## Current Entry Point

The active browser entry is `botmantra-ui/src/index.js`, rendered through React 19 and `BrowserRouter`. `public/index.html` is only the CRA HTML host; no `login.html` exists in the active public folder. The old "Create a table for my data" experience is produced by the legacy `Introduction`/`App` flow, not by a separate static login page.

## Current Routes

- `/login` -> `login.js`, the reusable application authentication screen.
- `/` -> legacy `App`.
- `/dashboard` -> `AppRenderEngine` by runtime flag or legacy `App` fallback.
- `/dashboard-engine` -> kernel renderer.
- Unknown paths -> legacy `App`.
- Legacy `App` internally switches among introduction, dashboard, profile, showcase, onboarding, and admin customization using `currentScreen` state rather than URL routes.
- `FamilyOS` exists as a separate module shell but was not mounted from the active `index.js` route map.

## Authentication Flow

`login.js` uses the existing backend `/api/auth/signin` and signup/OTP flows, stores the returned application token through `tokenManager`, and historically redirected to `/dashboard`. `App` separately reads `auth_token`, `user_id`, and `autoLogin`; when `autoLogin` is enabled it restores the session and otherwise falls back to the public introduction screen. This allowed the marketing/legacy UI to be the default before authentication.

No service-role key or database credential is intentionally used by the active login screen. Some legacy development/database utility files contain Supabase imports and must remain isolated from the application shell.

## Dashboard Flow

The legacy default dashboard is `Dashboard.js`, a chat-driven builder whose menu includes the old table-generation workflow. `AppRenderEngine` is a separate kernel-driven renderer. `FamilyOS` has a product dashboard in `modules/HomeDashboard.js`, but it was not the active route.

## Vanshavali Flow

`FamilyTreeScreen` is mounted inside `FamilyOS`, which uses `Navigation` and calls the authenticated `/api/vanshawali/nodes` API. The active legacy `App` did not mount `FamilyOS`; the family experience was therefore fragmented from the main route flow.

## Admin Flow

The legacy `App` can render `AdminCustomizationPanel`, and `App` also contains a second inline Admin MCP control room. The existing admin actions use `/api/kernel/v2/execute` with `admin_bootstrap` and `admin_chat_control`. The requested read-only NodeOS mapping screen did not exist.

## Legacy Screens

- `Introduction.js`: marketing/old BotMantra landing screen.
- `Dashboard.js`: chat-driven table/dashboard builder.
- `AppRenderEngine.tsx`: alternate kernel UI entry.
- `AdminCustomizationPanel.js`: customization UI, not NodeOS mapping.
- `ComponentShowcase.js`: development/demo area.
- `AppUpdated.js`, old dashboard selectors, and several duplicate chat/onboarding flows.

## Direct Backend/Database Calls

Kernel/API-mediated application calls include auth, Kernel execute, NodeCore chat, Vanshavali API, dashboard service endpoints, and admin services. Legacy direct or fallback database access remains in `Dashboard.js`, `utils/DashboardService.js`, `supabaseClient.js`, `routes/databaseApi.js`, and development database inspection/setup utilities. These are not used by the new application shell and should be isolated or migrated separately rather than refactored blindly.

## Routing Problems

1. `/` and unknown paths rendered the legacy `App` introduction.
2. `/dashboard` selected between two dashboard implementations.
3. Login fallback redirected to `/dashboard`, returning users to the fragmented legacy runtime.
4. Authenticated navigation was floating state inside `App`, not a single URL-based shell.
5. FamilyOS was not the canonical authenticated route.
6. Admin controls were duplicated and not represented by one read-only NodeOS screen.
7. Frontend access control depended partly on hiding buttons; backend admin authorization needed a dedicated read API.

## Consolidation Decision

Make `/login` the single unauthenticated entry and `/app/*` the authenticated application shell. Preserve existing auth and NodeOS APIs, mount the existing Family Tree inside `/app/vanshavali`, isolate Components under `/app/components`, and expose `/app/admin/nodeos` only after backend admin authorization.
