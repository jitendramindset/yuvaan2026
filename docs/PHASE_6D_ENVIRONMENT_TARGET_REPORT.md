# PHASE 6D ENVIRONMENT TARGET REPORT

## Repository Environments

This inventory is read-only and intentionally excludes secret material.

| Source | Environment name | Target | Credentials exist |
|---|---|---|---|
| [.env](../botmantra-backend/.env) | development | api.mantravat.cloud | YES |
| [.env.example](../botmantra-backend/.env.example) | development | your-project.supabase.co | NO |
| [botmantra-ui/.env](../botmantra-ui/.env) | not clearly declared | local frontend target | unknown |
| [botmantra-ui/.env.example](../botmantra-ui/.env.example) | development | local app target | NO |
| [botmantra-ui.worktrees/copilot-worktree-2026-02-11T09-17-11/.env](../botmantra-ui.worktrees/copilot-worktree-2026-02-11T09-17-11/.env) | not clearly declared | local dev target | unknown |
| staging template in [botmantra-backend/KERNEL_API_DEPLOYMENT_CHECKLIST.md](../botmantra-backend/KERNEL_API_DEPLOYMENT_CHECKLIST.md) | staging | <staging_url> | NO |

## Supabase Targets

| Environment | Target | Classification | Safe for seed? |
|---|---|---|---|
| development | api.mantravat.cloud | PRODUCTION | NO |
| development example | your-project.supabase.co | UNKNOWN | NO |
| staging template | <staging_url> | STAGING template only | UNKNOWN |
| local frontend env | localhost / local app target | DEVELOPMENT | NO for backend seed |
| repo-wide production docs | api.mantravat.cloud | PRODUCTION | NO |

## api.mantravat.cloud Classification

The repository consistently treats api.mantravat.cloud as a production deployment target, not a development or staging database.

Evidence from deployment docs:
- [botmantra-backend/QUICK_DEPLOYMENT_REFERENCE.md](../botmantra-backend/QUICK_DEPLOYMENT_REFERENCE.md) says: "Select Project: api.mantravat.cloud" and instructs running SQL directly in the Supabase dashboard.
- [botmantra-backend/DEPLOYMENT_START_HERE.md](../botmantra-backend/DEPLOYMENT_START_HERE.md) labels the package as a production deployment package.
- [botmantra-backend/MASTER_DEPLOYMENT_CHECKLIST.md](../botmantra-backend/MASTER_DEPLOYMENT_CHECKLIST.md) says to navigate to project api.mantravat.cloud.
- [botmantra-backend/DEPLOYMENT_EXECUTION_SUMMARY.md](../botmantra-backend/DEPLOYMENT_EXECUTION_SUMMARY.md) describes deployment readiness and production workflow.

This is a hosted production deployment target and is correctly rejected by the seed safety logic.

## Existing Development Target

No repository-resident Supabase development target was found.

The repository includes a generic environment template but no actual development project identifier.

Status: not available.

## Existing Test Target

No actual Supabase test project was found in the repository configuration.

Only generic template references appear, such as examples and placeholder values.

Status: not available.

## Existing Staging Target

The repository shows staging as a deployment concept in [botmantra-backend/KERNEL_API_DEPLOYMENT_CHECKLIST.md](../botmantra-backend/KERNEL_API_DEPLOYMENT_CHECKLIST.md), but it is a template placeholder, not a configured project target.

Status: not configured in repo.

## Seed Safety Status

The seed logic in [scripts/dev/seed-vanshawali-family.js](../scripts/dev/seed-vanshawali-family.js) correctly rejects api.mantravat.cloud because it is a production-like hosted target.

This is the correct behavior and must remain in place until a project owner explicitly classifies a dedicated development or test Supabase project and updates the safety policy intentionally.

## Required Next Action

The minimum external action is:

Create/provide a dedicated development Supabase project for Vanshawali E2E testing.

This should be a project intentionally classified as DEVELOPMENT or TEST, separate from the production deployment target.

No database migration is required for the canonical single-node family architecture. The current blocker is environment selection, not schema design.

## Final decision

DEV_TARGET_NOT_AVAILABLE

## Final system status

DATABASE WRITE PERFORMED: NO
DATABASE MIGRATION REQUIRED: NO
