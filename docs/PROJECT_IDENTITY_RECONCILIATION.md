# Project Identity Reconciliation

## Safe configuration review

Source files inspected:

- `botmantra-backend/.env`
- `botmantra-ui/.env`
- `botmantra-backend/config/supabase.js`
- repo-level docs and deployment references that mention the runtime URL

## Safe identifiers only

| Source | URL / identity | Environment | Status |
|---|---|---|---|
| backend `.env` | `https://api.mantravat.cloud` | development | Active runtime target |
| frontend `.env` | `https://api.mantravat.cloud` | development | Active frontend target |
| backend config | `https://api.mantravat.cloud` | development | Default fallback |
| custom API host | `api.mantravat.cloud` | development | Domain used by app runtime |
| Supabase project reference | not explicitly exposed in repo config | unknown | not derivable safely from public config |

## What this tells us

The application is consistently pointed at the domain `api.mantravat.cloud`.

That does not prove the domain is the raw Supabase project URL in the sense of a canonical `https://<project-ref>.supabase.co` host. It may instead be:

- a custom domain fronting Supabase
- a reverse proxy
- a gateway
- a custom API service layer
- a deployment wrapper around the Supabase project

The repo itself never exposes a project ref that can be independently validated without live infrastructure access and project metadata.

## Relationship to Supabase

Evidence from the repo and app runtime:

- the backend uses Supabase client configuration with `SUPABASE_URL` set to `https://api.mantravat.cloud`
- the frontend points to the same host for API calls
- runtime verification confirms the app is connected to `api.mantravat.cloud`
- the canonical migrations are stored in the repo and describe a Supabase/Postgres schema, but the live project metadata does not expose the standard migration tables

This means the app is clearly connected to a live Postgres-based runtime behind `api.mantravat.cloud`, but the precise project id / internal Supabase project ref is not safely derivable from source files alone.

## Environment classification

- Environment: development
- Runtime target: custom API host / hosted backend URL
- Supabase project identity: not directly recoverable from the repository without access to the live project metadata

## Conclusion

The repository is aligned on a single runtime target: `api.mantravat.cloud`.

The unresolved question is not the app’s target URL; it is whether that host is the direct Supabase project endpoint or a custom front end to it. The live schema evidence indicates the app is connected to a working Postgres runtime, but it is missing the canonical Vanshawali and Node OS tables.

### Safe status

- LOCAL SUPABASE URL: `https://api.mantravat.cloud`
- BACKEND SUPABASE URL: `https://api.mantravat.cloud`
- FRONTEND SUPABASE URL: `https://api.mantravat.cloud`
- CUSTOM API HOST: `api.mantravat.cloud`
- PROJECT REFERENCE: not safely derivable from source alone
- ENVIRONMENT: development
- RELATIONSHIP: active runtime host; may be a custom domain / gateway / proxy in front of Supabase
