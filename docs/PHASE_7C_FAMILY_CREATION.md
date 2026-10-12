# Phase 7C Family Creation

Date: 2026-09-18
Branch: `feature/vanshawali-single-node`

## Current NodeOS Relationship Model

`node_core.parent_nid_hash` is the canonical structural hierarchy. Nodes are stored with server-controlled `owner_id`, `nid_hash`, `node_type`, `node_depth`, `parent_nid_hash`, and `node_state`.

Family members use the existing `family_member` NodeFactory type, which maps to the existing `living` node type in `node_core`. Relationship metadata is stored in the node's existing `field_map` blob.

The current model can represent a child directly below the authenticated user's canonical node. A parent insertion would require reparenting the existing user, and spouse, sibling, and guardian are non-hierarchical relationships that cannot be represented accurately by `parent_nid_hash` alone. Phase 7C therefore rejects those relationships with `400` rather than creating incorrect graph data. No speculative schema or relationship table was added.

## Family Creation API

`POST /api/vanshawali/family-member`

Accepted request fields:

- `relationship`: currently `child`
- `name`: required
- Optional profile metadata: `age`, `profile_picture`, `city`, `gotra`, `village`, `gender`, `occupation`, `company`

The client cannot control `owner_id`, `nid_hash`, `node_depth`, `parent_nid_hash`, or `node_state`.

Successful response: `201` with a public node shape containing `node_id`, `node_type`, `owner_id`, `parent_node`, `node_depth`, `node_state`, and decoded `metadata`.

## Authorization

The authenticated request identity is the authority. The service resolves the user's canonical active node from `node_core` and always uses that owner. Request body ownership and parent fields are ignored.

Anonymous requests return `401`; invalid tokens return `401`. Existing application JWTs and Supabase JWTs are verified. The route does not use a raw SQL insert.

## Duplicate Handling

Before creation, active owner nodes are checked for the same normalized name and relationship under the canonical parent. A duplicate returns `409` and no creation call is made.

## Node Depth Calculation

`NodeCore.createChildNode()` resolves the parent node and calculates `node_depth` as `parent.node_depth + 1`. The frontend does not calculate or submit depth.

## NodeFactory Integration

The path is:

`Vanshavali API -> family-member-service -> NodeFactory.createFamilyMember -> NodeFactory.createLiveNode -> NodeCore.createChildNode -> buildNodeCoreRow -> node_core`

The existing NodeCore gateway was extended to accept a server-selected `parent_nid_hash`; it still performs the sole persistence operation.

## Graph Projection

The existing family projection reads `node_core`, follows `parent_nid_hash`, and recursively traverses descendants with cycle protection. A successful child creation will appear in the projection on the next read.

## Test Results

- Backend syntax checks: PASS.
- Mocked family creation tests: PASS.
- Invalid relationship: PASS (`400`).
- Missing name: PASS (`400`).
- Missing canonical node: PASS (`404`).
- Duplicate relationship: PASS (`409`).
- Client ownership/parent spoofing ignored: PASS.
- Server-controlled parent and depth response: PASS.
- Frontend build: PASS with existing unrelated ESLint warnings.
- No live family-member insert was performed.

## Live Write Gate

`LIVE_WRITE_REQUEST`

- Authenticated user/node: not requested for live insertion; no production identity is disclosed.
- Operation: create one family member through `POST /api/vanshawali/family-member`.
- Relationship: must be explicitly supplied and currently limited to `child`.
- Parent node: authenticated user's canonical node, resolved server-side.
- Fields written: server-generated node identity/state/depth plus submitted name and optional profile metadata.
- Existing data affected: one additive `node_core` row; no existing rows modified.
- Rollback: use the existing NodeOS soft-archive/delete workflow for the created node after verifying its returned `nid_hash`; do not issue raw SQL.

Live insertion is intentionally STOPPED pending explicit approval.

## Remaining Blockers

- Explicit approval is required before the first live write.
- Real runtime data is mostly flat, so a multi-generation live graph cannot yet be demonstrated.
- Parent/spouse/sibling/guardian creation needs a separately approved NodeOS-compatible relationship design.
- The legacy full backend suite still targets obsolete `/api/v1` behavior and is not a Phase 7C acceptance test.
