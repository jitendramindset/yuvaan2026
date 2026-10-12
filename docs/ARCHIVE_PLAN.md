# Archive and Compatibility Plan

## Goal

Separate authoritative implementation from duplicate, legacy, and generated artifacts without deleting them from the workspace.

## Canonical path

The canonical sources are as follows:

- Backend: `botmantra-backend/server.js` + underling core/route files
- Frontend: `botmantra-ui/src/App.js` + module shell
- Database: Supabase migration files under `supabase/migrations/`
- Node runtime: `botmantra-backend/core/*.js`
- Family model: `routes-vanshawali.js` + lineage tables + node graph projection

## Archive candidates

These should be marked as archive/compatibility only:

- duplicate route files in `botmantra-backend/routes/` that overlap the flagship runtime
- generated CRUD routes and helper scripts not mounted in the active production path
- worktree copies under `botmantra-ui.worktrees/`
- older app shells or earlier implementations not in the active runtime route
- large documentation sets not tied to the current runtime contract

## Recommended classification

Use the following labels when organizing future work:

- canonical
- archive
- compatibility
- experimental
- generated

## Merge strategy

If a compatibility module is needed later:

1. validate whether it is mounted by `server.js`
2. compare its contract against `kernel-v2-api.js` and `routes-vanshawali.js`
3. migrate to the canonical path only if it improves or matches the active model
4. keep the original code in the archive path until final validation is complete

## Principle

Do not delete code during canonicalization. Instead, isolate duplicates and keep the real runtime path authoritative.
