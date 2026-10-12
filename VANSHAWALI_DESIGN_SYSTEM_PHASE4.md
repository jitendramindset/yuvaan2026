# Vanshawali Design System Blueprint (Phase 4)

Date: 2026-08-03
Scope: Frontend design system standardization using existing backend only.

## 1. Principles
- Consistent: no screen-level hardcoded design values.
- Token-driven: all UI values originate from design tokens.
- Brand-aware: compatible with existing multi-brand registry.
- Accessible: WCAG 2.2 AA baseline.
- Responsive-first: mobile, tablet, desktop, wide screens.

## 2. Token Taxonomy

### Color
- semantic.bg.canvas
- semantic.bg.surface
- semantic.bg.elevated
- semantic.text.primary
- semantic.text.secondary
- semantic.border.default
- semantic.status.success
- semantic.status.warning
- semantic.status.error
- semantic.interactive.primary
- semantic.interactive.primaryHover

### Typography
- font.family.primary
- font.family.mono
- font.size.xs, sm, md, lg, xl, xxl
- font.weight.regular, medium, semibold, bold
- line.height.tight, normal, relaxed

### Spacing
- spacing.0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16

### Radius
- radius.none, sm, md, lg, xl, full

### Border
- border.width.hairline, thin, regular
- border.style.solid, dashed

### Elevation
- shadow.none, sm, md, lg, xl

### Breakpoints
- breakpoint.xs 360
- breakpoint.sm 576
- breakpoint.md 768
- breakpoint.lg 1024
- breakpoint.xl 1280
- breakpoint.2xl 1536

### Motion
- motion.duration.fast, normal, slow
- motion.easing.standard, emphasized
- motion.reduced toggles

### Layout Grid
- grid.container.maxWidth
- grid.columns.mobile/tablet/desktop
- grid.gap.default

### Z-index
- z.base, sticky, dropdown, modal, toast, overlay

## 3. Theme Provider Contract

ThemeProvider must provide:
- resolved token map
- color mode (light/dark)
- brand context
- reduced motion preference
- direction (ltr/rtl)

## 4. Consumption Rules
- No literal hex values in component styles.
- No hardcoded spacing in widgets.
- Use semantic tokens in widgets; brand maps to semantic layer.
- Legacy CSS migration allowed only behind alias variables.

## 5. Component Compliance Matrix

Each widget must implement:
- Token usage: required
- Responsive behavior: required
- Loading and skeleton: required
- Empty and error states: required
- Accessibility labels/roles: required
- Permission gate: required
- Localization text keys: required

## 6. Migration Steps
1. Freeze new hardcoded styles.
2. Map legacy vars to token aliases.
3. Enforce lint check for hardcoded style anti-patterns in widget folders.
4. Move high-traffic screens first: Home, Auth, Dashboard tabs.

## 7. Validation Gates
- Visual regression snapshots
- Contrast checks
- Keyboard tab path checks
- Reduced motion checks
- Responsive snapshots (mobile/tablet/desktop)

## 8. Deliverables
- Token dictionary and semantic mapping
- ThemeProvider usage guide
- Widget compliance checklist
- Screen-level token audit reports
