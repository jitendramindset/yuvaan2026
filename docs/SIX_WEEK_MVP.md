# Six-Week MVP Plan

## Goal

Create a focused, production-credible MVP by aligning the workspace to the canonical implementation and removing ambiguity without rebuilding the app from scratch.

## Week 1: Canonical source freeze

- confirm the canonical backend, frontend, database, and NodeOS files
- document runtime ownership and archive rules
- ensure all active routes point to a single authoritative architecture

## Week 2: Contract cleanup

- lock the auth and session flow
- validate `App.js` and FamilyOS flow against backend endpoints
- confirm the family model and node graph semantics are aligned

## Week 3: Database hardening

- validate schema consistency across NodeOS tables and family lineage tables
- confirm index and RLS rules are coherent
- remove or isolate duplicate SQL artifacts

## Week 4: AI + permissions validation

- validate the kernel execution flow
- verify permission checks match the user model
- test vector memory and NodeCore chat flow with real calls

## Week 5: UI + family flow testing

- validate the home dashboard, profile, and family tree UI flow
- test navigation, profile capture, and lineage retrieval
- verify the FamilyOS shell matches the backend contract

## Week 6: Production polish

- finalize the canonical route list
- resolve remaining compatibility edges
- prepare deployment checklists, monitoring, and rollback steps

## KPI targets

- all auth flows working against a single session model
- all family tree queries routed through the canonical API path
- NodeOS actions using a single kernel contract
- no ambiguous duplicate runtime route ownership

## Decision

The six-week MVP should be a consolidation and validation sprint, not a feature rewrite. The architectural direction is already visible in the codebase; the focus is alignment, proof, and production stability.
