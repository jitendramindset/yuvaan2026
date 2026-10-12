# Vanshawali Development Environment

## Production

- Production target: api.mantravat.cloud
- Status: NEVER seed this target.
- Reason: deployment documentation classifies it as production.

## Development

- Use a dedicated Supabase project that is explicitly designated for Vanshawali development or testing.
- This must be a separate project from the production target.
- Do not reuse production credentials.

## Required Variables

The local environment must provide the following variables:

- NODE_ENV
- VANSHAVALI_ENV
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Safety

Production must always be rejected.

The seed system only allows a development seed when both conditions are true:

1. environment is development/test
2. target is explicitly recognized as a development or test Supabase target

## Setup Process

1. Create/provide dedicated DEV Supabase project
2. Add credentials locally in a private environment file
3. Run the environment check
4. Verify SAFE_FOR_DEV_SEED = YES
5. Run the seed dry-run
6. Only then consider --confirm-dev-seed

## Important Guardrails

- Do not connect to api.mantravat.cloud.
- Do not guess a Supabase URL.
- Do not use production keys in development.
- Do not perform database writes without an approved development target.
