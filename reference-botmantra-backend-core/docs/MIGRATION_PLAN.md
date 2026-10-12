Migration Plan — From SQL `node_core` to LevelDB Append-only Ledger

Overview
- Goal: migrate legacy PostgreSQL `node_core` table into the new LevelDB-based append-only node model while preserving provenance and allowing incremental rollout.
- Strategy: export legacy rows to newline-delimited JSON, transform each row into a `ver:` entry with deterministic `nidHash` and `versionHash`, write `ver:` + `hdr:` + `chain:` entries into LevelDB in batches, migrate blobs, and validate.

High-level steps
1. Inventory & mapping
   - Analyze `node_core` columns and map to `field_map` and `meta` fields.
   - Choose `canonicalLocalId` mapping (e.g., legacy `nid` or `id`) used for deterministic `nidHash`.
2. Export
   - Dump `node_core` table to NDJSON with necessary columns and blob references.
   - Example: `COPY (SELECT json_build_object('legacy_id', id, 'owner', owner, ... ) FROM node_core) TO stdout`.
3. Transform
   - For each row:
     - Compute `nidHash = SHA256('NODE'||owner||':'||node_type||':'||legacy_id)`
     - Build `field_map` using mapped columns.
     - Compute `stateHash` and `versionHash` per HASH_MODEL.
     - Create `ver:` JSON document with `version` set from legacy `version` or `1` if unknown.
4. Blob migration
   - If blobs were stored in DB or external, extract and write encrypted content-addressed blob files per `BLOB_ENCRYPTION` spec.
   - Leave placeholder `blob:cid` if content unavailable; mark for manual retrieval.
5. Write to LevelDB
   - Batch writes to LevelDB: per batch write `ver:<nidHash>:<version>`, update `hdr:<nidHash>`, append `chain:<ownerId>:<seq>`.
   - Keep `seq` derived from legacy `seq` or assign monotonic sequence per owner during migration.
6. Events & reputation
   - Translate legacy karma/trust/evt logs into `evt:` nodes and append them in chronological order.
7. Verification
   - After a batch, run verification comparing counts and spot-check `stateHash` and `versionHash`.
   - Run legacy application tests against a read-only adapter that reads LevelDB instead of Postgres.
8. Incremental rollout
   - Start with a single test account; perform full migration and validation.
   - Once validated, migrate in batches (e.g., by ownerId ranges).

Rollback & dual-write strategy
- During transition, run dual-write where new writes are committed to both Postgres and LevelDB until all consumers use LevelDB.
- Keep mapping table `legacy_id -> nidHash` to support fallbacks.

Automation
- Provide migration tools:
  - `export_sql_to_ndjson.js`
  - `transform_row_to_ver.js`
  - `write_batch_to_leveldb.js`
  - `migrate_blobs.js`
- Provide `verify_migration.js` to compare sample rows.

Testing
- Unit tests for hash computations and canonicalization.
- Integration test that migrates a small dataset and runs the app in read-only mode.

Security
- Ensure blob encryption keys are generated and wrapped correctly; do not store unencrypted blobs on central servers.

Notes
- Preserve legacy `nid`/`id` in a `legacy:source` field inside `field_map` for traceability.
- For complex historical chains that relied on relational joins, preserve necessary relationships as relationship nodes.
