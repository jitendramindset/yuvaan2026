# NODE CREATION RUNTIME CONTRACT

This document traces the actual NodeOS creation path used by the repository and confirms where the canonical hierarchy fields are populated.

## 1) NodeFactory method

The public factory entry points are in [botmantra-backend/core/nodeFactory.js](../botmantra-backend/core/nodeFactory.js).

Key methods:
- createUserNode(userId, userData)
- createLiveNode(userId, nodeType, nodeData)
- createNonLiveNode(userId, nodeType, nodeData)
- createFamilyMember(userId, memberData)

The method used for child nodes is:
- createLiveNode() -> nodeCore.createChildNode()
- createNonLiveNode() -> nodeCore.createChildNode()

The factory does not include a dry-run or preview mode.

## 2) NodeCore method

The runtime creation logic is in [botmantra-backend/core/nodeCore.js](../botmantra-backend/core/nodeCore.js).

Relevant path:
- initializeUserNode(userId, userData)
  - builds a root user row with buildNodeCoreRow('user', ...)
  - inserts into node_core
  - then creates related child nodes for vector_memory, relationship_map, layout_schema, permission_set

- createChildNode(parentUserId, nodeData)
  - loads the parent user node via loadUserNode(parentUserId)
  - then calls buildNodeCoreRow(node_type, parentUserId, metadata || {}, { parent_nid_hash: parentNode.user_node.nid_hash, brand_scope: parentNode.active_brand, visibility, ui })
  - inserts into node_core

This is the canonical parent-child creation path used by the app.

## 3) node-schema builder

The field population happens in [botmantra-backend/core/node-schema.js](../botmantra-backend/core/node-schema.js).

Critical functions:
- generateNidHash(ownerId, nodeType = 'user_node')
- buildNodeCoreRow(nodeType, ownerId, metadata, options = {})

The builder does this:

```js
const nidHash = options.nid_hash || generateNidHash(ownerId, nodeType);
```

And then returns a row that contains:

```js
return {
  owner_id: ownerId,
  nid_hash: nidHash,
  dna_blob: encodeToBlob(dna),
  field_map: encodeToBlob(fieldMap),
  perm_blob: encodeToBlob(permBlob),
  rule_blob: encodeToBlob(ruleBlob),
  runtime_blob: encodeToBlob(runtimeBlob),
  memory_blob: encodeToBlob(memoryBlob),
  ui_blob: encodeToBlob(uiBlob),
  sys_blob: encodeToBlob(sysBlob),
  state_hash: stateHash,
  parent_nid_hash: options.parent_nid_hash || null,
  node_depth: options.node_depth || 0,
  node_type: typeDef.db_node_type,
  node_state: options.node_state || 'ACTIVE',
  ...
};
```

This is the single canonical place where the hierarchy fields are assigned.

## 4) Where each field is generated/populated

### nid_hash
Generated in:
- [botmantra-backend/core/node-schema.js](../botmantra-backend/core/node-schema.js)

Implementation:
```js
function generateNidHash(ownerId, nodeType = 'user_node') {
  return crypto.createHash('sha256')
    .update(`${ownerId}:${nodeType}:${Date.now()}:${Math.random()}`)
    .digest('hex');
}
```

Then used by buildNodeCoreRow() as:
```js
const nidHash = options.nid_hash || generateNidHash(ownerId, nodeType);
```

### node_type
Set by:
- nodeFactory.createLiveNode()/createNonLiveNode() with the requested node_type
- buildNodeCoreRow(nodeType, ...) receives that value
- typeDef.db_node_type is then assigned to the final row

Example:
```js
node_type: typeDef.db_node_type
```

### node_depth
Set in buildNodeCoreRow() as:
```js
node_depth: options.node_depth || 0,
```

Important: there is no automatic depth increment in the factory or createChildNode implementation. The child row defaults to 0 unless the caller provides a value.

### parent_nid_hash
Set in buildNodeCoreRow() as:
```js
parent_nid_hash: options.parent_nid_hash || null,
```

And passed by the parent-aware creation path here:
```js
const childNodeData = buildNodeCoreRow(node_type, parentUserId, metadata || {}, {
  parent_nid_hash: parentNode.user_node.nid_hash,
  brand_scope: parentNode.active_brand,
  visibility: visibility || 'private',
  ui: ui_schema || {}
});
```

### owner_id
Set directly in buildNodeCoreRow():
```js
owner_id: ownerId,
```

### node_state
Set in buildNodeCoreRow():
```js
node_state: options.node_state || 'ACTIVE',
```

## 5) Supabase insert/update path

The actual database write is performed in:
- initializeUserNode() -> supabase.from('node_core').insert(userNodeData)
- createChildNode() -> supabase.from('node_core').insert(childNodeData)

The code path is:

```js
const { data: userNode, error: nodeError } = await supabase
  .from('node_core')
  .insert(userNodeData)
  .select()
  .single();
```

and for child nodes:

```js
const { data: childNode, error } = await supabase
  .from('node_core')
  .insert(childNodeData)
  .select()
  .single();
```

There is no dry-run insert path in NodeFactory or NodeCore.

## 6) Parent relationship support conclusion

The system does support a parent-child hierarchy using a single node_core row model because:
- parent_nid_hash is explicitly stored on each node
- parent reference is supplied from the parent node’s nid_hash
- child nodes are inserted into node_core, not another table

However, the actual depth is not automatically derived. The runtime contract provides the field, but it does not compute it automatically. This means node_depth is structurally supported but not yet enforced as a proper incrementing hierarchy value by the current creation path.

This is a missing runtime logic issue, not a missing table issue.

## 7) Dry-run availability

The repository does not show any dry-run, preview, validate-only, or build-only method in the NodeFactory/NodeCore path.

Status:
- NODE_FACTORY_DRY_RUN = NOT AVAILABLE

## 8) Final contract summary

Canonical creation path:

NodeFactory method
  ↓
NodeCore method
  ↓
buildNodeCoreRow()
  ↓
Supabase insert into node_core

The data model is built around a single node_core table with hierarchy represented using:
- owner_id
- nid_hash
- parent_nid_hash
- node_depth
- node_type
- node_state

No schema migration is required to express the hierarchy itself.
