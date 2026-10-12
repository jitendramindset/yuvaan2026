Kernel Boot Sequence — Device-local Kernel

Objective
- Describe a deterministic bootstrap and integrity check for the kernel that ensures local ledger consistency and index readiness.

High-level steps
1. Key material and config
   - Load device config (`hdr:device:<deviceId>`), device salt, and `root_kek` source (secure enclave or passphrase prompt).
   - Unlock `signing_key` via `root_kek`.

2. Open stores
   - Open LevelDB ledger at configured path.
   - Load `idx:meta` and FAISS shard files from `faiss/` path if `faiss.enabled`.
   - Mount blob store directory and verify accessibility.

3. Quick integrity validation
   - Read `hdr:` keys sample (heads) and verify referenced `ver:` entries exist.
   - For each `hdr` head, verify signature on `versionHash` with stored owner public key (if owner is this device or known remote).
   - Check for missing `ver:` entries referenced by `hdr`; if missing, mark for repair from peers or backups.

4. Rebuild/Resume indexing
   - Load `idx:meta` to determine last indexed `emb:` sequence/epoch.
   - Scan LevelDB `emb:` keys newer than last epoch and queue for FAISS insertion.
   - If FAISS files missing or corrupted, rebuild from scratch using `emb:` keys.

5. Event replay and checkpoint
   - Read last checkpoint event (stored in `evt:checkpoint`) and replay kernel `evt:` entries since then to rebuild transient state (e.g., reputation caches, permission caches).
   - Write a new checkpoint after successful replay.

6. Background workers
   - Start writer worker (serializes write batches to LevelDB), indexer, backup snapshot worker (rolling 7-day), and sync listener (peer connections).

7. Health checks
   - Publish readiness if LevelDB has no missing heads and FAISS is loaded.
   - Expose diagnostics endpoints for `ledger:status`, `index:status`, `backups:status`.

8. Recovery modes
   - Offline start: skip index rebuild; only allow read operations.
   - Repair start: attempt to fetch missing `ver:` entries from central backup or peers using `sync` manifest.

Atomicity guarantees
- All node commits must be written with an atomic LevelDB batch covering `ver:`, `hdr:`, and `chain:` updates.
- Indexer writes to FAISS are idempotent and tolerant of repeats; IDempotency guaranteed by mapping `emb:<nidHash>` to FAISS id.

Notes
- Kernel must refuse to accept unsigned or malformed `ver:` entries.
- Boot sequence should be deterministic; any non-deterministic repairs are logged and gated behind operator approval.
