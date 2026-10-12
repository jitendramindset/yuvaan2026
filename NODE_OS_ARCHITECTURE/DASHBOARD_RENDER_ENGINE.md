# DASHBOARD_RENDER_ENGINE

**Frontend render pipeline — `botmantra-ui/src`.** No hardcoded dashboards; everything renders from kernel JSON.

## Flow
```
AppRenderEngine.tsx (mount)
  → UIProvider (brand + theme init)
  → Renderer.tsx
     → getAuthToken() — if null → redirect /login
     → uiBootstrap()  [core/KernelClient.ts]
        POST /api/kernel/v2/execute  { action: 'ui_bootstrap', payload: { brand? } }
        headers: Authorization, X-Client-Domain, X-Host-Name, X-Host-Type, device
     → unwrap nested result envelopes (while result && !layout && !widgets)
     → setUIState(ui)  [core/UIStateManager.tsx]
     → applyTheme(theme) [themes/themeEngine.ts]
     → LayoutRenderer (grid/flex-row/flex-column/table/stack)
        → WidgetRenderer per widget (respects position.width grid span)
     → FloatingChat
```

## Widget registry (`renderers/WidgetRenderer.tsx`)
Supported `widget_type`: `kpi`, `table`, `chart`, `form`, `actions`, `floating_chat`, `text`, `stats`, `hero`, `feature_list`, `screen_grid`.
- Normalizes both shapes: legacy `{type,...}` and kernel `{widget_type, widget_config}`.
- Unknown type → yellow fallback card with JSON (dev aid).
- Wrapper applies `gridColumn: span position.width`; `hero` spans full row.

## Layout (`renderers/LayoutRenderer.tsx`)
Accepts a layout-type string **or** the kernel layout object `{ layout_config: { type, columns } }`. Grid honors `columns`.

## Brands (`themes/brandRegistry.ts`)
BOTMANTRA · MANTRAVAT · JEETMANTRA · JUNER · VANSHAWALI. Detection: hostname → header → `localStorage.brand`/`tenant`. BrandSwitcher persists brand and reloads so the kernel re-bootstraps that brand's widgets.

## Backend dashboard source (`_uiBootstrap`)
1. `dashboard_layouts` + `dashboard_widgets` filtered by `business_id` + `brand` (user-customized).
2. Fallback: `_getBrandDashboard(brand)` — per-brand default (hero + feature_list + screen_grid + functions).
3. Always appends `floating_chat`.

## Realtime (`core/RealtimeClient.ts`)
Socket.io `join_node(nidHash)`; on `kernel_update` → `setUIState(payload)` for live updates (ties into [`SYNC_ENGINE.md`](./SYNC_ENGINE.md)).

## Gaps → see FRONTEND_INTEGRATION_PLAN
Layout-instance persistence (clone brand default → user-owned row), Elementor edit mode (drag/resize/save/publish), and the missing screens.
