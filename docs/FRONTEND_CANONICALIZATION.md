# Canonical Frontend Selection

## Scope

This document identifies the frontend implementation that best reflects the current production intent and active runtime architecture for the family application.

## Selected canonical frontend

Primary files:

- `botmantra-ui/src/App.js`
- `botmantra-ui/src/modules/FamilyOS.js`
- `botmantra-ui/src/modules/FamilyTreeScreen.js`
- `botmantra-ui/src/modules/HomeDashboard.js`
- `botmantra-ui/src/modules/ProfileScreen.js`
- `botmantra-ui/src/components/Navigation.js`

## Why this is canonical

### 1. App shell is the active runtime entry

`App.js` is the top-level React application logic. It handles:

- login/session verification
- admin detection
- NodeCore loading
- onboarding flow
- chat-driven navigation
- dynamic screen updates

This makes it the strongest evidence for the actual front-end control plane.

### 2. FamilyOS is the active product shell

`FamilyOS.js` is the user-facing application shell. It maps navigation actions to core screens:

- home
- profile
- family_tree
- life_book
- gallery
- circles
- messages
- feed
- events
- trips
- maps
- notifications
- search

This is the closest match to the intended family OS / family web application product.

### 3. Family tree screen is the product’s core domain flow

`FamilyTreeScreen.js` is the clearest evidence of the real genealogical feature. It exposes relationship logic and family-centric visuals, and it is the most relevant UI artifact for the product domain.

## Canonical design rules

- The frontend should follow the app shell and navigation architecture defined by `App.js` and `FamilyOS.js`.
- Authenticated user flows go through the kernel-backed chat and execution layer.
- Family features should render through `FamilyTreeScreen` and related module paths instead of through independent duplicate front-end projects.
- Navigation and session state should stay central and not be duplicated across multiple app shells.

## Non-canonical frontend candidates

These should be treated as archived or compatibility material unless explicitly recovered:

- older app shells in the workspace root or generated UI folders
- duplicate frontend variants under worktree folders
- transitional or experimental dashboard modules not wired into the active FamilyOS flow

## Recommended canonical path

Use the following as the source-of-truth front-end path:

- `botmantra-ui/src/App.js` for runtime orchestration
- `botmantra-ui/src/modules/FamilyOS.js` for shell navigation
- `botmantra-ui/src/modules/*` for domain modules
- `botmantra-ui/src/components/*` for shared UI shell elements

## Decision

The active Family OS React app in `botmantra-ui` is the canonical frontend implementation for this workspace, with `App.js` as the runtime coordinator and `FamilyOS.js` as the domain shell.
