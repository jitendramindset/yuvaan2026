# NodeOS Kernel Architecture

## Overview

The **NodeOS Kernel** is the core execution engine that manages all node operations in the system.

Every object in NodeOS is a **node file**.
The kernel is responsible for:

* Loading nodes
* Validating permissions
* Executing actions
* Managing workflows
* Synchronizing state across devices
* Broadcasting updates to peer nodes
* Maintaining trust metrics (Karma & Dharma)
* Logging all events

The kernel acts like an **operating system scheduler for nodes**.

---

## Kernel Responsibilities

The kernel performs the following major tasks:

1. Node initialization
2. Permission validation
3. Workflow execution
4. Node state hashing
5. Karma scoring
6. Dharma validation
7. Peer synchronization
8. Broadcast propagation
9. Device discovery
10. Event logging

---

## Kernel Lifecycle

When NodeOS starts, the kernel runs the following sequence:

```
Boot Kernel
↓
Load system.node
↓
Detect device.node
↓
Initialize profile.node
↓
Start agent.node
↓
Load dashboard.node
↓
Start sync engine
↓
Start peer discovery
↓
Start workflow engine
```

After initialization, the kernel runs continuously.

---

## Kernel Execution Pipeline

Each node execution passes through the kernel pipeline:

```
Node Request
↓
Load Node
↓
Validate Node Schema
↓
Check Permissions
↓
Validate Dharma
↓
Execute Node Actions
↓
Compute State Hash
↓
Compute Karma
↓
Log Execution
↓
Broadcast Updates
```

---

## Node Validation

Before execution, the kernel validates:

* node schema (required fields present)
* owner identity (`owner_id` or legacy `owner`)
* node type is a known enum value
* actions array is valid
* children array is valid

Example:

```
if node.schema.invalid
    throw NodeValidationError
```

---

## Permission Engine

Each node contains permission rules in its `perm_blob`.

```yaml
permissions:
  read:    ["owner", "family"]
  write:   ["owner"]
  execute: ["agent", "owner"]
```

`perm_blob` grants support fine-grained `ALLOW`/`DENY` effects with expiry and conditions.
The kernel verifies the actor role before any execution.

**Source:** [`kernel/permission.engine.ts`](../kernel/permission.engine.ts)

---

## Dharma Engine

Dharma represents **rule compliance and ethical boundaries**.

The kernel checks Dharma rules before allowing node execution.

Blocked operations include:

* `delete_all` — mass data destruction
* `mass_transfer` — bulk economy transfer without consent
* `override_permissions` — bypassing the permission layer
* `disable_audit` — removing audit trail

Nodes tagged `restricted` in their `dna_blob.dharma_tags` are blocked unconditionally.

```
if action violates dharma_policy
    throw DharmaViolationError
```

**Source:** [`kernel/dharma.engine.ts`](../kernel/dharma.engine.ts)

---

## Karma Engine

Karma represents the **trust and reputation score** of a node or user (0–100).

**Karma increases when:**

* workflows execute successfully
* users contribute useful nodes
* nodes maintain uptime
* data integrity is preserved

**Karma decreases when:**

* nodes fail execution
* fraudulent activity is detected
* excessive errors occur

**Karma calculation formula:**

```
karma =
  success_rate     * 0.4  +
  uptime           * 0.2  +
  validation_score * 0.2  +
  contribution     * 0.2
```

Mapped to `NodeRecord` fields:

| Factor           | Source field       |
|------------------|--------------------|
| `success_rate`   | `health_score`     |
| `uptime`         | `health_score`     |
| `validation_score`| `trust_score`     |
| `contribution`   | `experience_level` |

Karma affects:

* marketplace ranking
* `reputation_level` (seed → sprout → root → elder)
* Dravyam rewards

**Source:** [`kernel/karma.engine.ts`](../kernel/karma.engine.ts)

---

## Node Hashing

Each node has a **state hash** computed deterministically.

```
state_hash = SHA3-256( canonical_json(node_data) )
```

> Keys are sorted depth-first before hashing to ensure determinism across platforms.

Hash ensures:

* data integrity
* tamper detection
* consistent sync comparison

**Source:** [`kernel/hash.engine.ts`](../kernel/hash.engine.ts)

---

## Synchronization Engine

Nodes can exist on multiple devices. The sync engine ensures consistency.

```
compare local_hash vs remote_hash
↓
if mismatch
    log sync:hash_mismatch event
    pull event logs
    replay events
    recalculate state hash
    resolve conflicts
```

**Sync operations:**

* profile sync
* wallet sync
* workflow sync
* dashboard sync

**Conflict resolution priority:**

1. Latest timestamp wins
2. Higher karma score wins
3. Owner priority as tie-breaker

**Source:** [`kernel/sync.engine.ts`](../kernel/sync.engine.ts)

---

## Broadcast Engine

When node state changes, the kernel broadcasts a `node_update` event.

**Broadcast targets:**

* `devices` — connected own devices
* `peers` — peer nodes on the network
* `agents` — subscribed agent nodes
* `ui` — UI renderer / dashboard

**Broadcast event shape:**

```json
{
  "event": "node_update",
  "node_id": "<nid_hash>",
  "timestamp": "<iso8601>",
  "state_hash": "<sha3-256>"
}
```

Transports are pluggable via `registerBroadcastHandler()`.

**Source:** [`kernel/broadcast.engine.ts`](../kernel/broadcast.engine.ts)

---

## Peer Discovery Engine

Nodes discover other nodes through multiple channels.

**Discovery methods:**

1. Local network scan (LAN)
2. GPS / location proximity
3. Known contact graph
4. Online presence (relay)
5. Messaging channels

**Peer connection types:**

| Type       | Transport                    | Use case              |
|------------|------------------------------|-----------------------|
| `local`    | LAN (`192.168.x.x`)          | Fast local sync       |
| `location` | Bluetooth / WiFi Direct / GPS | Offline communication |
| `online`   | Internet relay               | Cloud sync, remote workflows |
| `channel`  | Telegram / WhatsApp / Slack / Email | Message-driven automation |

**Source:** [`kernel/peer.discovery.ts`](../kernel/peer.discovery.ts)

---

## Peer Ping Protocol

The kernel periodically pings peers to verify liveness.

**Ping message:**

```json
{
  "event": "peer_ping",
  "node_id": "<nid_hash>",
  "timestamp": "<iso8601>",
  "state_hash": "<sha3-256>"
}
```

**Live response:**

```json
{ "event": "peer_alive", "node_id": "<nid_hash>", "timestamp": "<iso8601>" }
```

If no response is received, the peer is marked inactive in the registry.

---

## Workflow Engine

The kernel executes declarative workflows authored by the user.

**Workflow step structure:**

```json
{
  "trigger": "new_message",
  "condition": { "==": [{"var": "role"}, "admin"] },
  "action": { "type": "send_notification" },
  "priority": 1
}
```

Workflow nodes can call other nodes. Triggers include:
`on_update`, `on_access`, `on_schedule`, `on_event`.

**Source:** [`kernel/workflow.engine.ts`](../kernel/workflow.engine.ts)

---

## Event Logging

Every kernel operation is logged to an append-only event log.

**Log entry fields:**

| Field       | Description                         |
|-------------|-------------------------------------|
| `event_id`  | UUID for this log entry             |
| `node_id`   | `nid_hash` of the executing node    |
| `action`    | Action performed                    |
| `timestamp` | ISO-8601 timestamp                  |
| `result`    | `success` / `error` / `blocked`     |
| `device_id` | Device that triggered the execution |

Log file location:

```
/logs/node_event_log.json
```

Logs enable auditing, debugging, and state replay.

**Source:** [`kernel/log.engine.ts`](../kernel/log.engine.ts)

---

## Device Management

Each device running NodeOS registers a `device.node` that contains:

* `device_fingerprint` — unique hardware fingerprint
* hardware capabilities (camera, microphone, location, filesystem)
* sensor permissions
* `latitude` / `longitude` for location-based peer discovery

Agents interact with device nodes to access sensors and local resources.

---

## Node Schema Overview

Each node is stored as `NodeRecord` and maps to the `node_core` production table.

**Node types:** `user`, `device`, `organization`, `bot`, `post`, `comment`, `media`,
`document`, `relation`, `permission`, `trust`, `gossip`, `event`, `vector`,
`checkpoint`, `migration`, `widget`, `layout`, `risk`, `dharma`, `wallet`, `task`

**Encrypted blobs (AES-256-GCM stored as `bytea`):**

| Blob          | Purpose                              |
|---------------|--------------------------------------|
| `dna_blob`    | Identity fingerprint, trait vector   |
| `field_map`   | Dynamic field schema registry        |
| `perm_blob`   | Fine-grained permission grants       |
| `rule_blob`   | Business logic / execution rules     |
| `runtime_blob`| Active UI, kernel flags, sessions    |
| `memory_blob` | Short-term working memory (LRU)      |
| `ui_blob`     | Theme, layout, widget configuration  |
| `sys_blob`    | Kernel version, boot count, integrity|

**Score fields:**

| Field              | Range  | Description                |
|--------------------|--------|----------------------------|
| `karma_score`      | 0–100  | Trust & reputation score   |
| `trust_score`      | 0–100  | Validation confidence       |
| `health_score`     | 0–100  | Node / uptime health        |
| `reputation_level` | enum   | seed → sprout → root → elder|
| `experience_level` | 0+     | Contribution accumulator    |

**Source:** [`shared/types/node.types.ts`](../shared/types/node.types.ts)

---

## Kernel Modules

```
kernel/
  kernel.engine.ts        — core orchestration (load → validate → execute → log → broadcast)
  node.executor.ts        — action dispatch (set_data, run_workflow, emit_log)
  node.loader.ts          — node file discovery and loading
  node.validator.ts       — schema + required-field validation
  permission.engine.ts    — role-based access control
  hash.engine.ts          — SHA3-256 deterministic state hashing
  dharma.engine.ts        — ethical rule compliance validation
  karma.engine.ts         — trust/reputation score computation
  sync.engine.ts          — cross-device hash comparison and replay
  broadcast.engine.ts     — pluggable node_update event broadcast
  peer.discovery.ts       — peer registry, ping protocol, connection types
  workflow.engine.ts      — declarative workflow step execution
  log.engine.ts           — append-only event log writer
  ledger/
    ledger_engine.ts      — event ledger
    ledger_compaction.ts  — log compaction
    ledger_key.ts         — key management
  boot/
    init.ts               — kernel bootstrap sequence
    integrity_check.ts    — startup hash validation
    subsystem_registry.ts — module registration
  blob/
    blob_cipher.ts        — AES-256-GCM blob encryption/decryption
    blob_store.ts         — blob I/O
```

---

## Kernel Security

| Mechanism                  | Implementation                          |
|----------------------------|-----------------------------------------|
| Permission validation      | `permission.engine.ts` (RBAC)           |
| Dharma rule enforcement    | `dharma.engine.ts` (policy check)       |
| Sandboxed node execution   | Action allow-list in `node.executor.ts` |
| Cryptographic state hashes | SHA3-256 in `hash.engine.ts`            |
| Immutable audit logs       | Append-only JSON in `log.engine.ts`     |
| Peer authentication        | `nid_hash` + `state_hash` in ping       |
| Blob encryption            | AES-256-GCM in `blob/blob_cipher.ts`    |

---

## Kernel Communication Protocol

| Protocol      | Use case                        |
|---------------|---------------------------------|
| WebSocket     | Real-time broadcast to UI/peers |
| Local IPC     | Same-device module communication|
| P2P messages  | Cross-node sync and ping        |
| REST API      | External integrations via `api/`|

---

## Kernel Scalability

| Mode                 | Description                            |
|----------------------|----------------------------------------|
| Local desktop        | Single-device, offline-capable         |
| Server mode          | Hosted, multi-user, REST-accessible    |
| Distributed network  | Fully decentralized peer mesh          |

Each node instance syncs with others regardless of deployment mode.

---

## Kernel Role in NodeOS

The kernel acts as:

```
Node scheduler        — loads and queues node execution
Workflow executor     — runs trigger/condition/action chains
Trust validator       — enforces Karma & Dharma
Sync coordinator      — reconciles state across devices
Peer network manager  — discovers and pings connected nodes
Event logger          — writes an immutable audit trail
```

Without the kernel, nodes cannot run.

---

## Final Kernel Philosophy

NodeOS kernel creates a **living node ecosystem**.

Each node:

* stores data
* executes logic
* communicates with peers
* contributes to network trust

**Karma** and **Dharma** maintain balance between *freedom* and *responsibility* in the system.
