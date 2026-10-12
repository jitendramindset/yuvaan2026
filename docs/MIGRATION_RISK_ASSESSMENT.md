# Migration Risk Assessment

## Required migration review

| Migration | Can apply directly? | Dependencies | Data risk | Existing objects | Conflicts | Rollback possibility | Recommendation |
|---|---|---|---|---|---|---|---|
| `20260209_add_vanshawali_tables.sql` | Not yet | Family data model, Supabase auth users | HIGH if live application data exists | `family_tree` and `user_family_lineage` are absent in live DB | None visible yet, but possible with existing family tables | Medium if applied to clean project; limited if data exists | Use only after schema reconciliation |
| `20260210_node_core_vector_architecture.sql` | Not yet | `node_core`, vector extensions, graph semantics | HIGH if partially initialized DB is active | `node_core` exists, graph/vector tables absent | High risk if this is a mixed/partial schema state | Medium | Use only after confirming migration history and project identity |
| Full schema baseline + 20260207 fixes | Not yet | Auth, onboarding, dashboard, views | MEDIUM | unknown | possible conflicts with existing active schema | Medium | review only after project identity is confirmed |

## Assessment

### `20260209_add_vanshawali_tables.sql`

- Purpose: create family projection tables and lineage model.
- Risk: Medium to High, because the live database may contain real development data and no family tables are currently present.
- Dependency: auth users and family tree use cases.
- Recommendation: do not apply blindly; first confirm project identity and migration history.

### `20260210_node_core_vector_architecture.sql`

- Purpose: define the Node OS core graph and vector memory layer.
- Risk: High, because `node_core` already exists while `node_relationships` and `node_vector_memory` do not.
- Dependency: pgvector extension and node identities.
- Recommendation: do not apply blindly until the project’s schema history is reconciled.

### General risk summary

- The live project appears active and authenticated.
- It contains at least one `node_core` row.
- The missing tables are required by the canonical schema but absent from the live database.
- This is a schema drift / migration-history issue, not a code rewrite or feature issue.

## Recommendation

Do not execute any migration in this phase.

The safest next database action is to reconcile the connected Supabase project with the intended migration history before applying the canonical schema objects.
