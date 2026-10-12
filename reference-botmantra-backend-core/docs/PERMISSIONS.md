Permission Resolution Flow — Permissions as Nodes

Design Principles
- Permissions are modeled as nodes to preserve provenance, auditability, and time-bound policies.
- Permission nodes describe `subject` (who), `object` (what), `actions` (what operations), `effect` (allow/deny), and constraints (time, conditions).

Permission node example (`ver:` content):
{
  "nidHash":"<hex>",
  "version":1,
  "field_map":{
    "entity_type":"permission",
    "subject": { "type":"node", "nidHash":"<subject-nid>" },
    "object": { "type":"node", "nidHash":"<object-nid>" },
    "actions": ["read","update","execute"],
    "effect": "allow",
    "conditions": { "time_window": { "from":"...","to":"..." } }
  },
  "meta": { "nodeType":"permission","category":"SYSTEM" }
}

Resolution algorithm (evaluated by kernel on access request)
1. Collect candidate permission nodes:
   - Direct permissions attached to `object` (via `permissions_ref`).
   - Permissions attached to relationships (e.g., role membership nodes, group nodes).
   - Inherited permissions via ancestor chain (follow `relationships` nodes of type `parent` or `membership`).
2. Filter by subject matching:
   - Exact match on `subject.nidHash`.
   - Role-based match: if `subject` is a role node and requester is a member of that role.
3. Evaluate conditions:
   - Time windows, location, matching tags, or other constraints.
4. Resolve conflicts:
   - Deny overrides allow. If any matching permission has `effect: deny`, deny.
   - Otherwise, if any `allow` found, permit.
   - If none match, fallback to `default_policy` (usually deny).
5. Cache the result with a signed proof token for short TTL to avoid repeated graph evaluations.

Performance optimizations
- Maintain a permission index mapping `object -> permission_nid` and `subject -> membership_nid` for quick lookup.
- Cache resolved effective permissions per `(subject,object,action)` with a TTL and revocation counter.

Auditing & Proofs
- Each permission evaluation can emit an `evt:` node recording the decision with a list of permission nodes used; useful for audits.
- Proof tokens include `requester`, `object`, `action`, `decision`, `proof_nodes` (list), and signature.

Notes
- By modeling permissions as first-class nodes, policies can be versioned and rolled back.
- For complex policies, consider adding a small policy language node type executed in a sandbox by kernel.
