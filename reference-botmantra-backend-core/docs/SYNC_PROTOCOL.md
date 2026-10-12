Sync Protocol — Deterministic Hash-based Sync

Design goals
- Efficiently sync append-only data between peers (devices and central server).
- Deterministic, resumable, and minimal transfer of new `ver:` and `blob` data.
- Support device revocation and remote wipe.

Core concepts
- Manifest: compact summary of local heads and owner chains.
  - `MANIFEST = { deviceId, epoch, heads: [{nidHash, versionHash, seq}], chains: [{ownerId, lastSeq}] }`
- Deltas: list of `ver:` entries (versions) and `blob` CIDs that the requester lacks.
- Anchors: owner-anchored sequences (`chain:<ownerId>:<seq>`) used to request ranges deterministically.

Protocol messages (over TLS, optional mutual auth)
1. HELLO / SYN
   - peerA -> peerB: `MANIFEST_A`
   - peerB compares with local manifest and computes `WANT_LIST`.
2. WANT_REQUEST
   - peerB -> peerA: request list of `ver:` keys (nid:versionHash) and `blob` CIDs missing.
3. PUSH / PULL
   - Transfer requested `ver:` entries and associated `blob` ciphertexts (or blob placeholders if server-only storage).
   - Each `ver:` is validated locally (canonicalization, signature, prevVersion presence or chain gap detection).
4. ACK / APPLY
   - peerA -> peerB: ack for successfully applied entries; peerB marks them as replicated.

Optimizations
- Use owner sequence ranges to request contiguous ranges instead of per-version requests.
- Use compressed packfiles for bulk transfer (tar+zstd of `ver:` JSON + blob files) with a manifest and signature.
- Deduplicate by CID; transfer blobs only if the peer lacks the CID.
- For FAISS: transfer `emb:<nidHash>` entries only, index rebuild done locally.

Conflict resolution
- Owner-anchored sequences are authoritative for writes by that owner. For conflicts across owners (e.g., multiple people editing same object), resolve deterministically:
  - Prefer higher `versionHash` lexicographically only if `prevVersionHash` chain matches; otherwise, flag for manual reconciliation.
  - Provide merge tools that create new versions referencing both parents (DAG merge) with clear provenance.

Revocation & Remote Wipe
- Server maintains `revoked_devices` signed list. On sync, peers exchange `revoked_devices` and if local device is revoked, the kernel must perform remote wipe flow per policy.
- Remote wipe: server sends signed wipe token; client verifies and purges KEKs and optionally overwrites LevelDB (policy-driven).

Security
- All transport over TLS; optional mutual TLS for servers.
- Peers sign packed manifests to prevent tampering.
- Use compact Merkle-root over selected heads when proving large manifests.

Resilience
- Support resumable transfers via chunk offsets and per-file checksums.
- Apply idempotency: re-applying same `ver:` is a no-op if `ver:` exists.

Example sync flow
1. Device A starts, sends MANIFEST_A to Device B.
2. Device B computes WANT_LIST_B (missing entries) and requests ranges using owner sequences.
3. Device A streams packfile containing `ver:` JSON and blobs; Device B verifies and writes atomically.
4. Both devices ACK and update their manifests.

Notes
- Central server primarily stores encrypted backups and can act as a relay for peers that are offline.
- To minimize server trust, clients should verify signatures and only accept data with valid provenance.
