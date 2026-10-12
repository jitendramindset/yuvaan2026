# Vanshawali Widget Engine Architecture (Phase 5)

Date: 2026-08-03
Scope: Widget-first frontend architecture with full backend compatibility.

## 1. Engine Flow

Page Definition JSON
-> Screen Composer
-> Widget Renderer
-> Widget Registry
-> Widget Component
-> Service Layer (API)
-> DTO Mapper
-> UI State

## 2. Core Contracts

### Page Schema
- pageId
- titleKey
- layout
- permissions
- widgets[]

### Widget Schema
- widgetId
- widgetType
- props
- dataBinding
- permission
- states (loading/empty/error)
- realtime subscription config

### Data Binding Schema
- service
- operation
- request model
- response model
- mapper
- cache policy
- retry policy

## 3. Runtime Responsibilities

### Widget Registry
- type-to-component resolution
- lazy loading support
- capability metadata

### Widget Renderer
- permission checks
- state fallback selection
- error boundary per widget
- telemetry hook points

### Screen Composer
- validates page schema
- resolves layouts
- injects navigation context

## 4. Service Layer Rules
- No API requests in widgets.
- All data calls in widget.service modules.
- Mapper transforms backend DTO to UI model.
- Retry and timeout centralized.

## 5. Required Widget Capabilities
- Theme token support
- Light/dark mode
- Responsive rendering
- i18n keys
- Accessibility hooks
- Loading/skeleton/empty/error
- Optional realtime subscription

## 6. Caching Strategy
- Query-level cache key by widget+params
- stale-while-revalidate for dashboard tabs
- offline fallback for last known response when allowed

## 7. Realtime Strategy
- subscribe on mount if configured
- patch UI model through mapper
- unsubscribe on unmount

## 8. Widget Module Standard
Each widget module should include:
- Widget.tsx
- Widget.types.ts
- Widget.schema.ts
- Widget.model.ts
- Widget.mapper.ts
- Widget.service.ts
- Widget.hooks.ts
- Widget.theme.ts
- Widget.animation.ts
- Widget.validation.ts
- Widget.config.ts
- Widget.constants.ts
- Widget.test.tsx
- Widget.stories.tsx
- README.md

## 9. Initial Vanshawali Widgets
- HomeHeroWidget
- AuthFormWidget
- FamilyActivityWidget
- PostsFeedWidget
- DravyamWalletWidget
- ProfileOverviewWidget
- PoseWallWidget

## 10. Execution Sequence
1. Build core registry and renderer contracts.
2. Scaffold widget modules.
3. Wire page schemas for Home/Auth/Dashboard.
4. Integrate existing services and APIs through mapper/service files.
5. Add tests and stories per widget.
