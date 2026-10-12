# PHASE 6A NODE CREATION REVIEW

This review is intentionally limited to inspection and evidence collection. No database writes or schema changes were performed.

## Last routes-vanshawali change

The recent change adds a bearer-token gate to the Vanshawali family routes:

```diff
+  async function requireAuth(req, res, next) {
+    try {
+      const authHeader = req.headers.authorization;
+      if (!authHeader || !authHeader.startsWith('Bearer ')) {
+        return res.status(401).json({ success: false, error: 'Authentication required' });
+      }
+
+      const token = authHeader.slice(7);
+      const { data, error } = await supabaseClient.auth.getUser(token);
+      if (error || !data?.user) {
+        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
+      }
+
+      req.user = {
+        id: data.user.id,
+        email: data.user.email,
+        user_metadata: data.user.user_metadata || {}
+      };
+      next();
+    } catch (error) {
+      console.error('Vanshawali auth error:', error);
+      return res.status(401).json({ success: false, error: 'Authentication failed' });
+    }
+  }
+
+  router.use(requireAuth);
```

### Classification
- AUTH FIX

### Why the change was required
- The route was accepting family requests without validating the bearer token.
- The existing runtime contract in the auth middleware also expects Authorization: Bearer <token> and Supabase auth validation.
- The route change aligns the Vanshawali API with the same auth contract used elsewhere.

### Safety check
This change does NOT:
- bypass authentication
- bypass permissions
- expose another user's family via a service-role bypass
- change the API contract unnecessarily
- introduce database writes

The route only checks Authorization and validates the token via Supabase auth before the request continues.

## NodeFactory contract

The factory in [botmantra-backend/core/nodeFactory.js](../botmantra-backend/core/nodeFactory.js) exposes the runtime creation API:
- createUserNode(userId, userData)
- loadUserNode(userId)
- queryNodes(queryParams)
- updateNode(rowId, updates)
- createLiveNode(userId, nodeType, nodeData)
- createNonLiveNode(userId, nodeType, nodeData)
- createFamilyMember(userId, memberData)

Important: there is no dry-run or validation-only method in the factory.

## NodeCore contract

The creation logic is in [botmantra-backend/core/nodeCore.js](../botmantra-backend/core/nodeCore.js).

Key path:
- initializeUserNode(userId, userData)
  - creates the first user node
  - inserts additional support nodes (vector_memory, relationship_map, layout_schema, permission_set)
- createChildNode(parentUserId, nodeData)
  - resolves the parent node
  - creates a child row in node_core with parent_nid_hash set to the parent node hash

This is the canonical runtime path for node creation in the app.

## Parent relationship support

Verified support exists for a parent relationship in the single-table model:
- parent_nid_hash is defined in the schema
- buildNodeCoreRow() writes it directly
- createChildNode() passes the parent user node’s nid_hash into the child row

Evidence:
```js
parent_nid_hash: options.parent_nid_hash || null,
node_depth: options.node_depth || 0,
```

and:
```js
const childNodeData = buildNodeCoreRow(node_type, parentUserId, metadata || {}, {
  parent_nid_hash: parentNode.user_node.nid_hash,
  brand_scope: parentNode.active_brand,
  visibility: visibility || 'private',
  ui: ui_schema || {}
});
```

This means the parent-child structure is represented entirely through node_core. No second table is required.

Important caveat:
- node_depth is present but not automatically incremented in the current NodeCore path.
- The field exists structurally, but depth assignment logic is not computed automatically.

So: parent support exists, but depth semantics need explicit handling for a proper hierarchy.

## Existing test-user support

Reviewed: [botmantra-backend/setup-test-user.js](../botmantra-backend/setup-test-user.js)

Result:
- TEST_USER_CREATION = YES
- It inserts directly into the users table and assigns roles
- It does not create a NodeOS node
- It does not enforce NODE_ENV guard
- It is not a safe dev-only path

## Existing test-node support

Reviewed: [botmantra-backend/run-auth-tests.js](../botmantra-backend/run-auth-tests.js)

Result:
- TEST_NODE_CREATION = NO
- TEST_RELATIONSHIP_CREATION = NO
- ENVIRONMENT_GUARD = NO

This script is an HTTP auth test harness, not a NodeOS hierarchy seeder.

## Dry-run availability

There is no dry-run or validation-only API in the NodeFactory or NodeCore path.

Result:
- NODE_FACTORY_DRY_RUN = NOT AVAILABLE

## Auth safety

The latest change in [botmantra-backend/routes-vanshawali.js](../botmantra-backend/routes-vanshawali.js) is safe because it:
- rejects absent Authorization headers
- rejects invalid/expired Bearer tokens
- attaches req.user only after successful verification
- does not use service-role auth as user proof

Unauthenticated family requests will fail with 401, while authenticated requests continue only for the verified user context.

## Dev seed required?

Decision: B. SMALL DEV-ONLY TEST SEED REQUIRED

Reason:
- there is no existing safe NodeOS hierarchy seeding mechanism
- the current test-user scripts create users but not node hierarchy
- there is no dry-run node factory path
- the parent-child relationship is supported structurally, but the depth logic is not yet enforced automatically

## Exact next implementation step

The next step is not to perform writes yet. The next step is to design and gate a minimal dev-only seed script that:
- only runs in development/test
- requires explicit --confirm-dev-seed
- refuses production project URL values
- is idempotent
- does not delete unrelated data
- does not update unrelated data
- does not add schema or raw SQL writes
- creates a synthetic hierarchy:
  - Grandparent
  - Parent
  - Child/current user

This will be the safe proof path once the runtime contract is fully validated.

## Final status

- DATABASE WRITE PERFORMED: NO
- DATABASE MIGRATION REQUIRED: NO
- DEV SEED IMPLEMENTATION: NOT YET
