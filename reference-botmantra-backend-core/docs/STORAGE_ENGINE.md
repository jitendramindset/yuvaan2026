Storage Engine Design — Sovereign Kernel Personal Data OS

Goals
- Append-only, tamper-evident local ledger per device using LevelDB.
- Vector search via FAISS; index persisted to disk and sharded for scale.
- Blobs stored encrypted and content-addressable (SHA-256), retrievable by CID.
- No relational DBs — everything is a `node` (including relationships & permissions).

High-level components
- LevelDB ledger: primary authoritative append-only store for node commits.
  - Stores node headers, versions, signed commits, events, and pointers to blobs.
  - Key namespaces (prefixes) documented below.
- FAISS index: ON-DISK vector index for embeddings used in similarity search.
  - Embeddings computed at node-write time and batched into FAISS.
  - Index shards persisted alongside LevelDB with epoching.
- Blob store: file-backed content-addressed encrypted blobs.
  - Blobs referenced from nodes by CID (sha256) and size.
  - Stored in `blobs/<first2>/<next2>/<cid>` for filesystem friendliness.

LevelDB Layout (namespaces)
- `hdr:<nidHash>` -> JSON header for latest commit of node (not the full payload)
- `ver:<nidHash>:<version>` -> full node version payload (immutable)
- `chain:<ownerId>:<seq>` -> owner-anchored append chain entries (references nidHash:version)
- `evt:<eventHash>` -> kernel events (exec, karma, permission changes)
- `emb:<nidHash>` -> serialized embedding vector (binary) and FAISS id mapping
- `idx:meta` -> FAISS index metadata (shard ids, epoch)
- `blob:cid` -> pointer to encrypted blob file metadata (size, iv, tag)

Write flow (append-only)
1. Build node payload (field_map, metadata).
2. Compute payload CID and state hash (see Hash Model doc).
3. Encrypt and store any blobs (if present) — write blob file and `blob:cid` metadata.
4. Persist full version at `ver:<nidHash>:<version>`.
5. Update `hdr:<nidHash>` to point to the new version (atomic LevelDB batch).
6. Append chain entry `chain:<ownerId>:<seq>` referencing the new nidHash/version.
7. If content has text/embedding, enqueue embedding for FAISS indexing.
8. Kernel publishes an `evt:<eventHash>` describing the commit.

FAISS Indexing
- Client computes embedding (or uses local embedding service), then writes to LevelDB `emb:<nidHash>`.
- A background indexer reads `emb:` keys and inserts vectors into FAISS shards.
- FAISS persistence: store index files under `faiss/<shard>-<epoch>.index` and metadata in `idx:meta`.
- On device startup, indexer loads latest shard files and applies missed vectors from LevelDB.

Backup & Retention
- Central server stores encrypted 7-day rolling backups: snapshots of LevelDB sst files + FAISS index files.
- Snapshots are client-side encrypted with a rotating backup key; central server stores only ciphertext and retention metadata.

Security and Keying
- Master device key (`root_kek`) stored in secure enclave or OS keystore where available.
- Per-device signing keypair for commit signatures (ed25519 recommended).
- Per-blob symmetric keys (AES-256-GCM) encrypted with device KEK and stored in `blob:cid` metadata.
- Key rotation: blobs keep KEK epoch metadata so revocation re-wrap or re-encrypt can occur.

Notes
- LevelDB is used as append-only by never deleting `ver:` entries; compaction only removes tombstones for deleted blobs after re-encryption/retention protocols.
- All writes are batched to LevelDB to guarantee atomic header+version+chain updates.
