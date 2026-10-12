Reference: botmantra-backend core (legacy)

Purpose
- Hold a copy of the legacy `botmantra-backend/core` code and documentation for migration reference.
- Serve as the source-of-truth for mapping old SQL-based node model → new sovereign LevelDB/FAISS node OS.

Top-level structure (created by migration starter)
- core/                  Legacy code snapshot (NOT modified)
- docs/                  Migration & design docs
  - STORAGE_ENGINE.md    Storage engine design (LevelDB + FAISS)
  - LEDGER_KEYS.md       Ledger key design summary
- config/                Sample runtime & storage configs
  - storage.config.json

Usage
- Keep original files under `core/` to run legacy validation and tests independently.
- Use `docs/` as the authoritative design reference for the new kernel-based OS.

Next steps
- Implement migration scripts that read legacy SQL exports and write node chains into LevelDB.
- Implement compact FAISS indexer for embedding vectors extracted from nodes.
