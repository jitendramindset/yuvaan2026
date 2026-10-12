# Canonical Family Model

## Scope

This document resolves the family-tree architecture question: whether the family model is the root system or a projection of the larger NodeOS graph.

## Conclusion

The family model is a projection of the larger node-based architecture, not the root model.

## Evidence

### 1. NodeOS is broader than family data

`botmantra-backend/core/node-schema.js` defines a full node system covering users, roles, widgets, layouts, themes, and permissions. This indicates the platform is not fundamentally a standalone family table model.

### 2. Family tables are explicit but domain-specific

`supabase/migrations/20260209_add_vanshawali_tables.sql` creates:

- `family_tree`
- `user_family_lineage`

These are concrete genealogy tables, but they are not the sole system source of truth.

### 3. UI treats the family tree as a view

`botmantra-ui/src/modules/FamilyTreeScreen.js` uses family-relationship logic to render a family tree for the user. The UI acts on a domain projection rather than on a separate universal data model.

### 4. The backend routes are family API wrappers

`botmantra-backend/routes-vanshawali.js` exposes APIs such as:

- `/api/vanshawali/user-lineage/:userId`
- `/api/vanshawali/family-tree/:familyId`
- `/api/vanshawali/create-lineage`

These are important domain endpoints but not the underlying canonical object model.

## Canonical interpretation

The correct model is:

- identity + entity state live in NodeOS (`node_core` and related graph runtime)
- family membership and lineage are stored in family-specific tables for genealogical queries
- family tree views are derived from relationship and lineage data

In other words:

- Family tree is a domain view
- Node graph is the structural system model

## Recommended product rule

When designing new family features:

- store person and entity identity in the node model
- store family relationship metadata in lineage/relationship tables
- render family tree as a projection or query result
- avoid creating a family-only architecture that duplicates the node graph

## Final decision

The canonical family model is a NodeOS-backed, relationship-derived family view. The concrete family tables remain important and must be preserved, but they are not the sole or primary system root.
