Blob Encryption Model — Content-addressed, Encrypted Blobs

Goals
- Store blobs encrypted at rest, referenced by content ID (CID = sha256(ciphertext) or sha256(plaintext) depending on policy).
- Support per-blob key wrapping with device `root_kek` for local access and re-wrapping for remote revocation.

Recommended approach
- On blob write:
  1. Generate `blob_key` (random 32 bytes, AES-256-GCM).
  2. Encrypt plaintext with AES-256-GCM using a random 12-byte IV.
  3. Compute `cid` = SHA256( ciphertext ) and use hex label `sha256:<hex>`.
  4. Store ciphertext in file `blobs/<cid[0:2]>/<cid[2:4]>/<cid>`.
  5. Wrap `blob_key` with device `root_kek` using AES-KW or encrypt-then-MAC and store `wrapped_blob_key` in LevelDB `blob:cid` metadata with IV, tag, size, original filename, mime-type, and created_at.

- Why hash(ciphertext) for CID?
  - Using ciphertext as input prevents disclosure of plaintext-deterministic equalities across devices that have different keys.
  - If same plaintext encrypted with same blob_key and IV, ciphertext will collide; use random blob_key and IV so collisions are unlikely and CID is content-addressed for the stored ciphertext.

Metadata stored in LevelDB `blob:cid`:
{
  "cid": "sha256:<hex>",
  "size": 12345,
  "wrapped_blob_key": "base64...",
  "iv": "base64...",
  "tag": "base64...",
  "mime_type": "image/png",
  "ownerId": "...",
  "created_at": "...",
  "kek_epoch": 1
}

Access flow
- To read: fetch `blob:cid` metadata, unwrap `wrapped_blob_key` with `root_kek`, then decrypt ciphertext from file.
- To share with another device: re-wrap `blob_key` with recipient device `public_key` via an envelope encryption scheme (create `wrapped_for_recipient`).

Key rotation & remote wipe
- Re-wrap `blob_key` with new `root_kek` epoch lazily when blob is accessed or in a background re-wrap pass.
- For remote wipe: server revocation causes devices to delete their `root_kek` handle; without KEK, wrapped keys cannot be unwrapped and blobs are effectively unreadable. Optionally clients can purge blob files.

Garbage collection
- Blobs are only eligible for deletion after no `ver:` references exist and retention policy allows; deletion must be an explicit kernel operation that creates a tombstone version.

Notes
- Consider adding per-blob access-control list nodes (permission nodes) to reference which principals can be given wrapped keys.
- Consider KMS integration for centralized backup key wrapping only for backup encryption.
