# Single Node Family MVP Path

## Target flow

LOGIN
 ↓
AUTH USER
 ↓
HUMAN NODE
 ↓
NODE GRAPH
 ↓
RELATIONSHIPS
 ↓
FAMILY PROJECTION
 ↓
FAMILY TREE UI

## Step-by-step evidence

### 1. LOGIN

Exists in the runtime and auth layer.

Status: EXISTS

### 2. AUTH USER

Authenticated user identity is the system baseline; the app uses user session and auth flow.

Status: EXISTS

### 3. HUMAN NODE

The NodeOS runtime defines user and human-like entities as nodes in `node_core`.

Status: EXISTS

Evidence:

- `node-schema.js` defines `user_node` as a Node type
- `runtimeOrchestrator.js` creates user nodes during signup/login

### 4. NODE GRAPH

The runtime graph builder reads and traverses nodes using parent/child relationships and graph semantics.

Status: EXISTS

### 5. RELATIONSHIPS

The graph uses derived relationship edges and node links.

Status: PARTIAL / inferred infrastructure

### 6. FAMILY PROJECTION

The family tree is a projection of connected nodes and relationship metadata.

Status: PARTIAL (currently represented via legacy family tables)

### 7. FAMILY TREE UI

`botmantra-ui/src/modules/FamilyTreeScreen.js` is the UI consuming the family view.

Status: EXISTS

## Required component classification

| Step | Status |
|---|---|
| login auth | EXISTS |
| user identity | EXISTS |
| human node | EXISTS |
| graph traversal | EXISTS |
| relationship model | EXISTS as infrastructure |
| family projection | PARTIAL |
| family UI | EXISTS |

## Conclusion

The family MVP path is already aligned to the Node-first architecture; the main gap is not a missing root model but a need to reconcile family projection logic around the Node graph, without elevating family tables to canonical domain status.
