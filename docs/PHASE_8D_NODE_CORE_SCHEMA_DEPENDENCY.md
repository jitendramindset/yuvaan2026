# Phase 8D Node Core Schema Dependency

Date: 2026-09-22

## Decision Table

| Finding | Result |
|--------|--------|
| Exact column | Unknown from remote metadata / or a column default relying on cryptographic functions |
| Exact default/trigger | `gen_random_bytes(integer)` |
| Function schema | Unqualified `gen_random_bytes` (expected in `extensions` or `public` schema via `pgcrypto`) |
| PGCRYPTO installed | NO (in the target remote instance) |
| gen_random_bytes available | NO |
| Existing migration dependency | Expected by certain cryptographic/UUID column defaults or legacy snippets, while the primary architecture migration (`20260210_node_core_vector_architecture.sql`) uses `uuid-ossp` (`uuid_generate_v4()`) |
| Existing rows | Created via prior runtime/migration paths or different default states |
| Application supplies field | Application provides standard JSON/binary blobs and hashes, but the remote table schema evaluates server-side defaults |
| Database supplies field | Database defaults/triggers evaluating `gen_random_bytes` |
| Root cause | Missing `pgcrypto` extension on the target Supabase database instance |
| Correct fix layer | DATABASE / SCHEMA (Enabling `pgcrypto` extension in Supabase, or aligning table defaults to `gen_random_uuid()` / `uuid_generate_v4()`) |

---

## Analysis & Facts

1. **Error**: PostgreSQL `42883`: `function gen_random_bytes(integer) does not exist`.
2. **Source**: PostgreSQL function call invoked during `node_core` insert evaluation.
3. **Migration Evidence**: `20260210_node_core_vector_architecture.sql` explicitly calls `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` but does not include `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`, whereas certain table columns or helper functions in the project expect `gen_random_bytes` for cryptographic key generation or secure token hashing.
4. **Conclusion**: The dependency is an incomplete extension enablement in the target remote Supabase database instance where `pgcrypto` was not enabled alongside `uuid-ossp`.

## Next Step

Once extension enablement or schema alignment is approved, the database will support `gen_random_bytes(integer)`. No database modification or migration was executed in this phase.
