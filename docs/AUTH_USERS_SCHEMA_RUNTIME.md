# AUTH_USERS_SCHEMA_RUNTIME

## Scope
This document records the live runtime contract for the public.users table as inspected in the active environment. It intentionally excludes password, token, and secret values.

## Safe runtime inspection result
The active schema contains these fields in public.users:

- id
- telegram_id
- email
- full_name
- business_name
- industry
- created_at
- business_id
- user_type
- mobile
- whatsapp
- password
- updated_at
- created_by
- changed_by
- role
- email_hash
- mobile_hash
- is_verified
- last_login
- bio_hash
- pass_hash
- auth_method
- first_name
- last_name

## Safe fields actually used for identity/auth contract

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary identity for user row |
| email | text | active login identifier |
| mobile | text | secondary login identifier |
| full_name | text | displayed profile name |
| created_at | timestamptz | row timestamp |
| updated_at | timestamptz | row update timestamp |
| is_verified | boolean | verification status |
| auth_method | text | login method label |
| role | text | access role label |
| first_name | text | optional profile value |
| last_name | text | optional profile value |
| business_id | uuid | tenant/business linkage |

## Sensitive fields present but not printed in runtime output
The live table also contains sensitive credential fields such as password and pass_hash. These were not printed in the runtime output and were not used as evidence beyond confirming their presence in the schema.

## Runtime conclusion
The actual local auth contract is built around the existing users table fields, not a separate password_hash field. The query failure for password_hash was a stale-column mismatch in the code or test script, not evidence that the user table is unusable.

## Final rule
No schema change is required. The system should use the existing users columns that are actually present in the runtime schema and should prefer the canonical login flow already implemented in the application.

DATABASE MIGRATION REQUIRED: NO
DATABASE WRITE REQUIRED: NO
