# Family API Runtime Proof

Status: BLOCKED

## Summary

The family API route exists in source and is mounted by the backend, but the live connected database is missing the family tables required to return real family lineage data. Because the canonical tables are absent, the actual family API cannot be proven end-to-end in the current connected runtime.

## Existing endpoint under inspection

- `GET /api/vanshawali/user-lineage/:userId`
- Source: [botmantra-backend/routes-vanshawali.js](botmantra-backend/routes-vanshawali.js)

## Required runtime path

Authenticated user
↓
JWT
↓
Vanshawali route
↓
`user_family_lineage` / `family_tree`
↓
JSON response

## Actual live evidence

- Authentication succeeded via `/api/auth/signin`
- JWT-based kernel request succeeded
- The family route is present in source and mounted by the server
- The connected schema does not contain the required family tables:
  - `user_family_lineage` missing
  - `family_tree` missing

Evidence from the live DB connection:

```
"user_family_lineage": { "exists": false, "error": "Could not find the table 'public.user_family_lineage' in the schema cache" }
"family_tree": { "exists": false, "error": "Could not find the table 'public.family_tree' in the schema cache" }
```

## Conclusion

The family API contract is implemented, but it is blocked by missing live database tables. This is not a code-path failure; it is a live schema contract gap.
