# Live Schema Validation

Status: PARTIAL

## Canonical tables under validation

| Table | Expected by code | Actual database | Status | Evidence |
|---|---|---|---|---|
| `node_core` | Yes | Exists in live schema | PASS | `SELECT * FROM node_core LIMIT 1` returned a row |
| `node_relationships` | Yes | Missing in live schema | FAIL | `Could not find the table 'public.node_relationships' in the schema cache` |
| `node_vector_memory` | Yes | Missing in live schema | FAIL | `Could not find the table 'public.node_vector_memory' in the schema cache` |
| `family_tree` | Yes | Missing in live schema | FAIL | `Could not find the table 'public.family_tree' in the schema cache` |
| `user_family_lineage` | Yes | Missing in live schema | FAIL | `Could not find the table 'public.user_family_lineage' in the schema cache` |

## Runtime evidence

The live DB connection was queried directly through the Supabase client used by the backend. The result was:

```
{
  "schema": {
    "node_core": { "exists": true, "count": 1 },
    "node_relationships": { "exists": false, "error": "Could not find the table 'public.node_relationships' in the schema cache" },
    "node_vector_memory": { "exists": false, "error": "Could not find the table 'public.node_vector_memory' in the schema cache" },
    "family_tree": { "exists": false, "error": "Could not find the table 'public.family_tree' in the schema cache" },
    "user_family_lineage": { "exists": false, "error": "Could not find the table 'public.user_family_lineage' in the schema cache" }
  }
}
```

## Code expectation vs live database

### Expected by canonical runtime

- `node_core` must hold user and system node identity
- `node_relationships` must hold relationships among nodes
- `node_vector_memory` must hold semantic memory/vector records
- `family_tree` and `user_family_lineage` must supply family data for Vanshawali

### Actual live database

- `node_core` exists and is reachable
- the remaining canonical family and node graph tables are not present in the live schema the backend is currently using

## Conclusion

The canonical runtime is partially validated: the core identity table is present, but the family and relationship tables required for the Vanshawali path are not in the live connected schema. This is a live database contract mismatch, not a migration task for this phase.
