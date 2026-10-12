Backend API Structure — Kernel & Node Service

Principles
- APIs are thin wrappers for kernel operations; kernel enforces immutability and permissions.
- Minimal surface: node CRUD (append-only), search, sync, blobs, admin/migration.
- Auth: mutual TLS or bearer tokens representing device identities; every write must be signed by device private key.

API Endpoints

1. Node operations
- POST /api/node/create
  - Body: `{ ownerId, nodeType, field_map, blobs?, relationships?, permissions_ref? }`
  - Behavior: kernel validates, writes new `ver:` entry, returns `{ success, nidHash, versionHash }`.

- GET /api/node/:nidHash
  - Returns header and latest version or specific version if query param `versionHash` provided.

- POST /api/node/update
  - Body: `{ nidHash, updaterId, updates (partial field_map), prevVersionHash? }`
  - Behavior: create new version referencing prevVersionHash; kernel validates permissions.

- POST /api/node/search
  - Body: search params, free-text and vector optional; delegates to FAISS + metadata filters.

2. Blob operations
- POST /api/blob/upload
  - Multipart/form-data to upload ciphertext blob; server stores and returns `cid` and `blob:cid` metadata entry only if central backup component is used.

- GET /api/blob/:cid/metadata
  - Returns blob metadata (no wrapped keys unless requester authorized).

- GET /api/blob/:cid/download
  - Returns encrypted blob bytes (server acts as relay if central storage enabled).

3. Kernel & sync
- POST /api/sync/manifest
  - Body: `MANIFEST`; returns WANT_LIST; used by peers for sync negotiation.

- POST /api/sync/push
  - Body: packfile or list of `ver:` entries + blobs; server validates and stores backup copy.

4. Permissions & kernel queries
- GET /api/kernel/permissions/:nidHash?targetOwnerId=
  - Returns resolved permission proof and list of permission nodes used.

- GET /api/kernel/reputation/:nidHash
  - Returns karma/trust metrics and recent events.

5. Admin & migration
- POST /api/admin/migrate/start
  - Body: migration job params (source connection, batch range); returns job id.

- GET /api/admin/migrate/status/:jobId
  - Returns progress and errors.

Auth & Signing
- All modifying requests must include a `signature` header (ed25519) over canonicalized request body and a `publicKeyId`.
- Server verifies signature against registered device public key before accepting.

CLI / Local daemon commands
- `kernelctl start|stop|status`
- `kernelctl backup --upload`
- `kernelctl sync --peer <url>`
- `kernelctl migrate --from-sql <conn> --batch-size 1000`

Notes
- API should be as small as possible; policy and permission evaluation occurs inside kernel and returns decision proofs to callers.
- For public endpoints, return proof tokens that clients can present to other peers to avoid re-evaluation.
