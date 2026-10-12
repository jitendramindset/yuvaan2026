Core Migration Map — Legacy -> singleCore targets

Source: `botmantra-backend/core`
Reference folder: `reference-botmantra-backend-core/core` (keep untouched snapshots)

Format: `legacy_file` => `suggested_target` — `action`

Priority migration targets
- `nodeCore.js` => `singleCore/core/node-core-manager.js` — migrate core node lifecycle and atomic write logic (done/verify)
- `nodeFactory.js` => `singleCore/core/node-factory.js` — adapt factory to use `NodeOperations` and NodeBuilder (migrated)
- `node-schema.js` => `singleCore/core/node-schema.js` — canonical schema definitions and validation (migrated)
- `trust-engine.js` => `singleCore/engines/trust-engine.js` — migrate trust scoring, integrate with kernel events
- `karma-engine.js` => `singleCore/engines/karma-engine.js` — migrate karma scoring
- `permission-engine.js` => `singleCore/engines/permission-engine.js` — permission evaluation as nodes
- `node-sync.js` => `singleCore/core/sync-protocol.js` — implement deterministic manifest-based sync
- `node-graph.js` => `singleCore/core/node-graph.js` — graph utilities mapped to node relationships-as-nodes
- `node-cache.js` => `singleCore/core/node-cache.js` — lightweight in-memory caches with sign/ttl
- `node-discovery.js` => `singleCore/core/node-discovery.js` — peer discovery and gossip integration
- `vector-manager.js` => `singleCore/engines/vector-manager.js` — FAISS indexing + embedding pipeline
- `ai-*` files => `singleCore/ai/*` — move AI adapters to `ai/` with pluggable model router
- `kernel-executor.js` => `singleCore/kernel/executor.js` — execution sandbox and action dispatcher
- `kernelIntegration.js` => `singleCore/kernel/integration.js` — external integration glue

Other utilities (review & migrate)
- `api-keys.js` => `singleCore/api/keys.js` — API key lifecycle
- `api-logs.js`, `api-rate-limit.js` — monitoring & rate-limiting
- `dashboardLoader.js`, `brandRouter.js`, `brand-router-unified.js` — frontend routing adapters
- `dharma-validator.js` => `singleCore/core/validation.js` — migrated validation utilities
- `gossip-network.js` => `singleCore/net/gossip.js` — gossip-based replication
- `prompt-evolution.js`, `ai-session-memory.js` => `singleCore/ai/session/*`
- `runtimeOrchestrator.js` => `singleCore/runtime/orchestrator.js`
- `widget-engine.js`, `layout-evolution.js` — UI integration adapters (migrate later)

Migration actions per file
- COPY to `reference-botmantra-backend-core/core/` (snapshot) — preserve original
- CREATE target file under `singleCore/` with skeleton adapted to LevelDB/FAISS design
- IMPLEMENT: replace direct Postgres calls with `Ledger` abstractions and `NodeOperations`
- TEST: unit tests for hash/serialization and integration test using local LevelDB

Notes
- Maintain `legacy_id` in migrated `field_map` for traceability.
- Prioritize `nodeCore`, `node-schema`, `nodeFactory`, `trust-engine`, `permission-engine`, and `vector-manager` to get core read/write/search working.
- For any file using `pg`/Postgres, replace DB calls with `ledger` interface or migration adapter.

Next recommended step
1. Snapshot `botmantra-backend/core` into `reference-botmantra-backend-core/core/` (if not already done).
2. Generate skeletons for the mapped `singleCore` targets (one per high-priority file) and run quick sanity tests.

If you want, I can now:
- (A) Create skeleton target files for the high-priority list and implement one small prototype (write ver entry into LevelDB), or
- (B) Start migrating specific files (pick which).

Tell me which option you prefer.