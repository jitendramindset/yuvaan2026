# FRONTEND_INTEGRATION_PLAN

How to turn the existing kernel-driven render engine into the full Vanshawali Node OS UI. **The backend already serves the data; this is mostly frontend.**

## Current state
- Generic kernel-driven engine works (`AppRenderEngine` → `Renderer` → `LayoutRenderer`/`WidgetRenderer`).
- 5 brand dashboards render distinctly (verified in browser).
- Routes today: `/`, `/login`, `/intro`, `/api-tester`, `/onboarding`, `/dashboard`, `/dashboard-engine`, `/old`.

## Screen gap matrix
| Screen | Backend ready? | Frontend work |
|---|---|---|
| Home / Feed | data_read on `node_core` (post) | feed widget + screen |
| Family Tree | node_core + node_permission(family) | `tree` widget (graph) |
| Network graph | node_permission relationships | `map`/graph widget |
| Profile | node_core field_map + scores | profile screen + KPI (karma/trust/dharma) |
| Wallet | node_wallet/node_transaction | wallet screen (Send/Receive/Convert/QR) |
| Chat | `chat` action + FloatingChat | full chat screen |
| Marketplace | node_marketplace/marketplace_* | marketplace screen |
| Plugin Center | node_plugin_store + execute_plugin | plugin browse/install |
| Device Manager | node_devices/device_registry | device list + trust |
| Document Vault | business_documents/node_core(document) | vault screen + upload |
| Settings | ui_user_preferences | settings screen |
| Admin Console | admin_* + kernel introspection | admin screen |
| Onboarding | runtimeOrchestrator.signup | exists — extend age-routing |

## Widget types to add (extend WidgetRenderer)
`tree` (family/org), `graph`/`network`, `wallet_card`, `feed`, `calendar`, `kanban`, `map`, `chat_panel`, `device_list`, `doc_grid`. (`widget-engine.js` already defines 12 backend widget types — mirror them.)

## Three foundational pieces
1. **Layout-instance cloning** — new action `clone_layout(brand)` copies a brand default into a user-owned `dashboard_layouts` row; render reads the instance. Satisfies "never modify default layouts."
2. **Elementor edit mode** — drag/resize/rename/recolor/connect-data/preview/save-draft/publish; persists to `dashboard_widgets`. `ui_widget_layouts` stores breakpoints.
3. **Chat-controlled UI** — `chat` action returns a `preview` action descriptor → frontend shows preview → confirm → `execute_action`. "Create business", "Add wallet widget" etc.

## Age-based routing (onboarding)
At signup, route default brand by age (dharma already enforces JuniorMantra ≤12): `<6 → JUNER`, `6–18 → JEETMANTRA`, `18+ → VANSHAWALI`, business → MANTRAVAT, automation → BOTMANTRA. Set `localStorage.brand` + node DNA `brand_scope`.

## UI system (from UI master prompt)
Glassmorphism + Material 3, dark/light, responsive (mobile/tablet/desktop). Bottom nav: Home / Chat / Network / Marketplace / Profile. Top: Search / Notifications / Voice / Settings. Every node card opens to Details / Relationships / Permissions / History / Actions / AI Summary.

## Sequence
See [`IMPLEMENTATION_TASKS.md`](./IMPLEMENTATION_TASKS.md) for dependency-ordered build order.
