# Phase 7D Relationship Model

Date: 2026-09-18
Branch: `feature/vanshawali-single-node`

## Existing Node Model

The inspected implementation uses these relationship-relevant fields:

- `node_core.nid_hash`: node identity.
- `node_core.owner_id`: server-owned node owner.
- `node_core.node_type`: mapped by `buildNodeCoreRow` to the existing database type (`living` or `nonliving`).
- `node_core.parent_nid_hash`: structural parent reference.
- `node_core.node_depth`: stored hierarchy depth.
- `node_core.node_state`: active/archive state.
- `field_map`: existing serialized metadata blob.
- `dna_blob`: existing serialized node DNA, including node type and brand metadata.

No implemented canonical `node_subtype`, `parent_id`, `children`, or standalone family relationship field was found. `node_relationships` exists in the broader NodeOS codebase, but it is not used as the Vanshavali family projection source and was not changed.

## Structural Hierarchy

`parent_nid_hash` and `node_depth` represent the one-parent tree:

`grandparent -> parent -> user -> child`

NodeCore derives child depth from the stored parent depth. Clients cannot author the parent hash or depth.

## Relationship Semantics

Added `services/family-relationship-model.js` with the canonical vocabulary:

`parent`, `child`, `spouse`, `sibling`, `grandparent`, `grandchild`, `guardian`, `uncle`, `aunt`, `cousin`.

Existing UI aliases are normalized: `father` and `mother` become `parent`; `son` and `daughter` become `child`; `brother` and `sister` become `sibling`.

## Parent/Child

Child creation remains supported through the existing path:

`Vanshavali API -> family-member-service -> NodeFactory -> NodeCore -> buildNodeCoreRow -> node_core`

The service currently permits `child` only. A parent cannot be safely added as a child because doing so would corrupt the existing hierarchy or require a separately approved reparenting operation.

## Spouse

A spouse is not a child. The existing model has no established symmetric relationship-reference structure used by Vanshavali. The projection understands an optional existing `field_map.relationships` array containing `{ node_id, relationship }` references and projects `spouse` references without adding parent edges.

Creation of spouse links remains intentionally unsupported until a bidirectional persistence protocol is approved. No speculative field or table was added.

## Sibling

Siblings are derived structurally as active nodes sharing the same `parent_nid_hash`, excluding the current node. They are projected as `sibling` and are never emitted as children of the current user.

The existing NodeGraph already derives sibling edges for graph exports; no duplicate traversal implementation was added there.

## Extended Family

Ancestors and descendants are derived from parent and child hierarchy. `parents`, `siblings`, `children`, `ancestors`, `descendants`, `spouse`, and `extendedFamily` are now present in the projection response. Uncle, aunt, cousin, and guardian semantics are documented vocabulary only until the existing NodeOS model provides approved references for them.

## Graph Traversal

The existing recursive descendant traversal remains cycle-protected and depth-limited. Parent traversal follows `parent_nid_hash`. Sibling derivation queries the current parent’s children. Semantic references are resolved by `nid_hash` only when present in existing metadata.

## Projection

`projectFamilyLineage` preserves the existing `family_id`, `familyName`, `gotra`, `ancestors`, `descendants`, `connectedAncestors`, and `details` fields. It additionally returns stable relationship groups. Empty/error projections return the same group keys with empty arrays.

`projectFamilyTree` includes the expanded groups in its deduplicated public member projection.

## API

The Phase 7C creation endpoint remains:

`POST /api/vanshawali/family-member`

It accepts a relationship and profile metadata, but currently accepts only `child`. Server-controlled fields are owner, node identity, parent hash, depth, type, and state. Duplicate child relationships return `409`.

## Tests

- Relationship vocabulary and aliases: PASS.
- Symmetric relationship reference parsing: PASS.
- Parent projection: PASS.
- Sibling projection: PASS.
- Spouse projection without child edge: PASS.
- Child projection and descendant compatibility: PASS.
- Duplicate protection: PASS.
- Client owner/parent spoofing rejection: PASS.
- Required NodeOS and route syntax checks: PASS.
- Frontend build: PASS with existing unrelated warnings.
- Live database write: NOT PERFORMED.

## Frontend

`FamilyTreeScreen` continues consuming the existing `/api/vanshawali/nodes` response and can render relationship labels from decoded metadata. No complete relationship UI was added. Existing loading, empty, success, and error behavior was preserved.

## Schema Decision

`DATABASE_SCHEMA_CHANGE_REQUIRED = NO`

Existing `parent_nid_hash`, `node_depth`, and `field_map` are sufficient for the safe hierarchy and for reading an optional semantic reference convention. The current implementation does not claim that spouse, guardian, uncle, aunt, or cousin creation is supported because the existing model does not provide an approved bidirectional reference write protocol.

No migration, table, column, or database structure was created or changed.

## Live Write Gate

`LIVE_WRITE = NO`

No `POST /api/vanshawali/family-member` request was sent against the real database. Phase 7C's approval gate remains in force for the first live child creation. Before any future symmetric relationship write, an explicit NodeOS-compatible reference protocol must also be approved.
