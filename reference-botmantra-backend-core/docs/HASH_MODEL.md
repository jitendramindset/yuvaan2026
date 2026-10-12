Hash Model — Canonicalization and Versioning

Goals
- Provide deterministic, collision-resistant identifiers and version hashes for node immutability and sync.
- Make hashes canonical across languages and platforms.

Canonicalization
- Use stable JSON serialization: keys sorted lexicographically, no insignificant whitespace, UTF-8.
- For binary blobs, use raw bytes; when included in JSON use hex or base64 canonical form.

Identifiers
- `nidHash` (node id): deterministic node id derived from owner and a stable local identifier.
  - Option A (recommended): `nidHash = SHA256("NODE" || ownerId || ":" || nodeType || ":" || canonicalLocalId)`
  - `canonicalLocalId` can be a stable UUIDv5 derived from legacy primary key or a sequential owner `seq` encoded as fixed-width decimal.

State hash
- `stateHash` = SHA256( canonicalizeJSON(field_map) || canonicalizeJSON(metaRelevant) || concat(sorted blob cids) )
  - `metaRelevant` includes fields that affect state (nodeType, category, is_live) but excludes signature, version numbers, and kernel_flags.

Version hash
- `versionHash` = SHA256( stateHash || prevVersionHash || ownerId || timestamp || nonce )
  - `nonce` provides uniqueness for concurrent commits from same owner where seq is not used.

Commit signature
- Sign `versionHash` using device `signing_key` (ed25519). Signature placed in `signature`.

Deterministic sequence (owner-anchored)
- For strict linear history per owner, include `seq` in meta and require monotonic increment per owner.
- `seq` can be the authoritative tiebreaker during sync for owner-originated forks.

Examples
- Compute `stateHash` by canonicalizing `field_map` and `metaRelevant`, then SHA256.
- `versionHash` = SHA256(stateHash + prevVersionHash + ownerId + isoTimestamp + nonce)

Collision and attack mitigations
- Use SHA-256 (or SHA-3-256) for general hashing; reserve stronger KDFs for key derivation only.
- Sign all versions; kernel rejects unsigned or invalidly signed commits.

Compatibility with legacy SQL
- When migrating rows from `node_core`, derive `canonicalLocalId` from the original primary key (e.g., `nid` or `id`) and compute `nidHash` deterministically so migrated nodes map consistently.
