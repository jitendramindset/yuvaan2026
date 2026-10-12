# Vanshawali API Node Graph Migration

## Goal

Determine whether the family API can be moved from direct family table reads to Node graph reads without breaking the public API contract.

## Current state

`botmantra-backend/routes-vanshawali.js` reads directly from:

- `user_family_lineage`
- `family_tree`

This is a legacy family-table contract.

## Can this be changed to Node graph?

### Potentially yes, but only as a projection adapter

The frontend does not require the raw storage table names to remain unchanged if the public contract stays the same. The family API can expose an equivalent JSON structure such as:

- user data
- family members
- parents
- children
- siblings
- ancestors
- descendants

This is compatible with the UI logic in `FamilyTreeScreen.js` because the UI mostly consumes a member list and relationship labels.

## Why this is not a direct drop-in today

The existing route is strongly bound to family table fields such as:

- `family_name`
- `gotra`
- `ancestor_names`
- `generation`
- `details`
- `members`

Those are specific to the family projection layer. They are not the canonical Node contract.

## Minimal change required if migration were approved

The minimum migration would be:

1. keep the public endpoints and response schema stable
2. change the data source from family tables to graph-derived node relationships
3. project relationship metadata into the same UI-shaped JSON contract
4. keep only the required output subset used by `FamilyTreeScreen.js`

## Final conclusion

The family API can be adapted to the node graph as a projection, but not without a response-shaping layer. The public API may remain stable while the storage model changes underneath.

This is an adapter problem, not a proof that family tables are canonical.
