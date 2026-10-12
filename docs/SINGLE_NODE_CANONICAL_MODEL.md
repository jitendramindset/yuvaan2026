# Single Node Canonical Model

## Executive conclusion

The canonical model is a single logical Node abstraction centered on `node_core`.

The Node is the durable identity and state unit. Supporting tables such as relationship edges, vector memory, and family projections are implementation details used to query, traverse, or render the graph, but they are not independent canonical domain roots.

## Canonical node definition

A Node is:

- an entity identity in the system
- a stateful runtime object
- a container for metadata, permissions, trust, and lifecycle
- a graph vertex that can be connected to other nodes
- a source for projections such as family tree views or workflow views

## What belongs to the Node

### 1. NODE IDENTITY

Represents:

- unique node identifier
- owner linkage
- node type
- node code/name
- provenance / lifecycle ownership

Canonical storage:

- `node_core.node_id`
- `node_core.owner_node`
- `node_core.node_type`
- `node_core.node_code`
- `node_core.node_name`
- `node_core.node_description`

Status:

- Current storage: `node_core`
- Canonical Node representation: yes
- Missing: no
- Duplicate: no

### 2. NODE STATE

Represents:

- active / locked / suspended / sleeping / archived state
- trust and karma
- runtime status and flags
- permission gating state
- execution capability and update capability

Canonical storage:

- `node_core.node_state`
- `node_core.trust_score`
- `node_core.karma_score`
- `node_core.can_execute`
- `node_core.can_update`
- `node_core.external_access`
- `node_core.health_score`
- `node_core.is_archived`
- `node_core.is_cold`

Status:

- Current storage: `node_core`
- Canonical Node representation: yes
- Missing: no
- Duplicate: no

### 3. NODE DATA / METADATA

Represents:

- structured metadata
- UI schema
- permission blob or runtime blob
- configuration and business data
- core identity fields

Canonical storage:

- `node_core.metadata`
- `node_core.ui_schema`
- `node_core.permissions`
- `node_core.dna_blob`
- `node_core.field_map`
- `node_core.runtime_blob`
- `node_core.rule_blob`
- `node_core.sys_blob`

Status:

- Current storage: `node_core`
- Canonical Node representation: yes
- Missing: no
- Duplicate: no

### 4. NODE RELATIONSHIPS

Represents:

- graph relationships and edges
- child/parent membership
- relationship type semantics
- link metadata

Canonical storage:

- `node_core.parent_node` as primary direct-parent pointer
- supporting relationship graph if needed as infrastructure

Status:

- Current storage: `node_core.parent_node` and optional graph edge infrastructure
- Canonical Node representation: yes, the Node is the graph vertex
- Missing: not required as a standalone canonical domain table
- Duplicate: if modeled as a separate domain table, it is infrastructure only

### 5. NODE PERMISSIONS

Represents:

- access rules
- capability rules
- role and scope checks
- permissions that affect execution

Canonical storage:

- `node_core.permissions`
- `permission-engine.js` runtime evaluation
- optional permission tables are infrastructure, not the canonical domain model

Status:

- Current storage: `node_core` + runtime permission engine
- Canonical Node representation: yes
- Missing: no
- Duplicate: permission tables are auxiliary, not primary

### 6. NODE ACTIONS

Represents:

- executable actions
- orchestrated runtime behavior
- kernel execution instructions

Canonical storage:

- event/action logic in runtime orchestration
- node state and permission evaluation in runtime layer

Status:

- Current storage: runtime modules, not a domain table
- Canonical Node representation: yes, as executable actions on the Node
- Missing: not a root table
- Duplicate: no distinct domain table is required

### 7. NODE HISTORY

Represents:

- audit trail
- change history
- execution history
- trust and events

Canonical storage:

- `node_core.updated_at`, lifecycle state
- audit/event table if used for operational review

Status:

- Current storage: partly in `node_core`, partly external infrastructure tables
- Canonical Node representation: yes, the Node owns its history
- Missing: no
- Duplicate: history tables are operational, not canonical business entities

### 8. NODE MEMORY

Represents:

- semantic memory
- user memory
- AI memory context
- relationship/context memory

Canonical storage:

- node-owned metadata and runtime memory blobs
- optional vector memory storage for retrieval and similarity search

Status:

- Current storage: `node_core.memory_blob` + optional `node_vector_memory` infrastructure
- Canonical Node representation: yes, node memory is conceptual part of the Node
- Missing: no
- Duplicate: vector memory is infrastructure, not an independent domain table

### 9. NODE RUNTIME

Represents:

- kernel execution
- orchestration
- permission checks
- graph operations
- AI memory retrieval

Canonical storage:

- runtime modules under `core/`
- node fields in `node_core`

Status:

- Current storage: runtime service layer
- Canonical Node representation: yes
- Missing: no
- Duplicate: no

### 10. NODE LIFECYCLE

Represents:

- create
- activate
- sleep / wake
- archive
- update
- trust changes
- permission changes

Canonical storage:

- `node_core.created_at`
- `node_core.updated_at`
- `node_core.deleted_at`
- `node_core.is_archived`
- `node_core.archived_at`
- `node_core.valid_until`
- `node_core.last_sync_at`
- `node_core.sync_version`

Status:

- Current storage: `node_core`
- Canonical Node representation: yes
- Missing: no
- Duplicate: no

## Canonical design rule

The Node is the primary domain entity.

Everything else is either:

- infrastructure used to support the Node
- a projection built from that Node graph
- a compatibility or legacy representation

## Conclusion

The canonical model is:

- One logical Node
- One primary durable record set in `node_core`
- Supporting infrastructure is allowed when necessary
- Family tree and lineage are projections, not independent domain roots
