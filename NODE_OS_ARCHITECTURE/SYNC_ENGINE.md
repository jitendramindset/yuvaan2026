# SYNC_ENGINE

**Files:** `core/node-sync.js` (NodeSync + MultiDeviceSync) and `core/gossip-network.js`. Runs at pipeline **step 15** (`sync_nearest`).

## Tables (reuse)
`node_core` (sync_version, last_sync_at, state_hash) · `node_event_queue` · `node_replication_queue` · `node_offline_queue` · `node_federation`, `node_federation_peers`, `node_federation_queue` · `node_handshake_log` · `node_gateway_nonce`, `node_gateway_ips` · `node_load_state`, `node_region_registry` · `trusted_devices`/`node_devices`.

## NodeSync — nearest-node cascade
`syncNearestNodes(userNode, changedFields, actionType)`:
1. increment `sync_version` on changed node
2. touch parent (`updated_at`)
3. notify children (`parent_updated`)
4. update relationship graph (emit to related nodes)
5. queue async vector update → `node_event_queue`
6. broadcast to devices via Socket.io

`syncGeographicNearest(userNode, location, options)` — region-aware sync via `node_region_registry`.

## MultiDeviceSync (Socket.io)
`registerDevice`, `getDeviceTrust`, `getUserDevices`, `syncToDevice`, `revokeDevice`, `setupSocketHandlers`.
Rooms: `user:{userId}`, `node:{nidHash}`, `brand:{brandCode}`, `device:{deviceId}`.

## Gossip network (epidemic propagation)
`start()` (30s gossip / 2m anti-entropy), `pushGossip` (fanout 3), `pullSync`, `epidemicBroadcast(brand, type, payload, ttl)`, `detectConflicts`, `resolveConflict`.
- Conflict default: **LAST_WRITE_WINS** (or VECTOR_CLOCK).
- Node states: ALIVE / SUSPECT (>5m) / DEAD (>10m) / LEFT.
- Message types: DIGEST, SYNC_REQUEST/RESPONSE, POLICY_UPDATE, NODE_BIRTH/DEATH, HEARTBEAT, CONFLICT, MERGE.

## Four sync modes (vision → mechanism)
| Mode | Mechanism |
|---|---|
| Cloud sync | Supabase writes + `node_event_queue` |
| Device sync | MultiDeviceSync Socket.io rooms |
| Offline sync | `node_offline_queue` drained on reconnect |
| Peer sync | gossip-network + `node_federation_*` |

## Flow (vision spec, satisfied)
`Node updated → event created (node_event_queue) → replication queue → sync queue → device update → conflict resolution (gossip)`.

## Gaps
- Offline-queue **drain worker** on client reconnect (frontend + a small backend consumer).
- Federation peer **handshake auth** beyond nonce (`node_gateway_nonce` exists; policy is the gap).
