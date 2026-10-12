# Phase 7 Node Core Baseline

Date: 2026-09-18
Target: `https://api.mantravat.cloud`
Branch: `feature/vanshawali-single-node`

## Runtime

- `GET /health`: returned `401 Unauthorized` without an Authorization header.
- `GET /api/kernel/v2/health`: returned `401 Unauthorized` without an Authorization header.
- Authenticated live health validation was not run because no token was supplied.
- The backend environment check fails closed because `botmantra-backend/.env.development` is absent. No production fallback was used.

## Existing Node Core Data

Read-only Supabase inspection of the configured runtime found:

- Total `node_core` rows: `80`
- Active rows: `75`
- Node types: `12`
- Active node types: `12`
- Rows with `owner_id`: `80/80` total, `75/75` active
- Rows with `parent_nid_hash`: `4` total
- Depth distribution: `79` rows at depth `0`, `1` row at depth `1`
- Active depth distribution: `74` rows at depth `0`, `1` row at depth `1`

Observed node types include `family_node`, `living`, `user_node`, `relationship_node`, `post_node`, `circle_node`, `group_node`, `event_node`, `board_node`, `invite_node`, `notification_node`, and `permission_node`.

## Findings

The runtime contains real canonical nodes, but the current data is mostly flat. It does not currently provide a deep, usable family graph for validation. No synthetic family members were inserted and no database mutation was performed.

The canonical read path is therefore validated structurally and against an existing owner, where projection returned a self node with zero ancestors and zero descendants.
