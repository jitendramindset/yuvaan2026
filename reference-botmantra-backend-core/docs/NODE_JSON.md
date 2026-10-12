Node JSON Structure — Sovereign Kernel Personal Data OS

Principles
- Every entity is a `node` (content, relationship, permission, event).
- Nodes are append-only versions; each version is immutable and referenced by a `versionHash`.
- Each node has a persistent identifier `nidHash` (node identifier) derived deterministically.
- References between nodes use `nidHash` and `versionHash` where appropriate.
- Use canonical JSON (stable key ordering) when hashing.

Top-level shape (version document stored at `ver:<nidHash>:<version>`):
{
  "nidHash": "<hex>",             // deterministic node id
  "version": 3,                    // incremental version number
  "versionHash": "<hex>",        // hash for this version (immutable)
  "ownerId": "<uuid>",           // owner (device/account)
  "prevVersionHash": "<hex|null>",
  "stateHash": "<hex>",          // content-state hash (field_map canonicalized)
  "field_map": {                   // semantic payload (node-specific)
    "entity_type": "post",
    "title": "...",
    "content": "...",
    "tags": ["x","y"]
  },
  "meta": {                        // kernel-managed metadata
    "category": "RUNTIME|SYSTEM|CONFIG",
    "nodeType": "post",
    "is_live": false,
    "has_relationships": false,
    "created_at": "2026-02-18T12:00:00Z",
    "updated_at": "2026-02-18T12:00:00Z",
    "seq": 12345                    // owner-anchored sequence number
  },
  "relationships": [               // optional; list of relationship references
    { "rel": "parent", "nidHash": "<hex>", "versionHash": "<hex>" }
  ],
  "blobs": [                        // content-addressed encrypted blob references
    { "cid": "sha256:<hex>", "role": "attachment", "size": 12345 }
  ],
  "permissions_ref": "<nidHash>", // Permissions node controlling this node
  "emb_id": "faiss:<shard>:<int>",// optional embedding id for vector search
  "signature": "<ed25519 sig over versionHash>",
  "kernel_flags": {                 // kernel annotations (immutable after commit)
    "archived": false,
    "deleted": false
  }
}

Notes
- `hdr:<nidHash>` stores a compact header with latest `version`, `versionHash`, `stateHash`, and pointers; used for quick lookup.
- `ver:` entries are immutable and never overwritten; new versions add new `ver:` entries and update `hdr:` atomically.
- Permissions, relationships, and events are modeled as nodes to preserve full provenance.
- Use stable JSON canonicalization (e.g., lexicographic key ordering) before hashing to avoid cross-language mismatches.

Example: minimal `post` version
{
  "nidHash":"ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50",
  "version":1,
  "versionHash":"a1b2...",
  "ownerId":"c75d0110-9085-4411-8e2d-f1c5274d7f07",
  "prevVersionHash":null,
  "stateHash":"9f8e...",
  "field_map":{"entity_type":"post","title":"Hello"},
  "meta":{"category":"RUNTIME","nodeType":"post","is_live":false,"created_at":"2026-02-18T12:00:00Z","seq":1},
  "blobs":[],
  "signature":"...",
  "kernel_flags":{"archived":false}
}
