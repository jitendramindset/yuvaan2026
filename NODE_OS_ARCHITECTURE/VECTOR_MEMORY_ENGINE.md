# VECTOR_MEMORY_ENGINE

**File:** `core/vector-manager.js` — 8 separated vector spaces. Plus per-node `node_core.vec_embedding`. Runs at pipeline **step 12** (`update_vectors`).

## Tables (reuse)
- `vector_documents` (parent docs) + `vector_chunks` (pgvector embeddings)
- `ai_knowledge_base` (RAG knowledge)
- `ai_session_memory` (chat/user memory)
- `admin_memory_vectors` (admin design memory)
- `node_ai_brain`, `node_ai_cache`, `ai_semantic_cache`, `ai_summary_cache` (AI runtime + caching)
- `node_core.memory_blob` + `vec_embedding` (per-node memory)

## 8 vector categories
| Category | Storage |
|---|---|
| layout_vectors | vector_chunks |
| widget_vectors | vector_chunks |
| permission_vectors | vector_chunks |
| relationship_vectors | vector_chunks |
| content_vectors | vector_chunks |
| knowledge_vectors | ai_knowledge_base |
| user_memory_vectors | ai_session_memory |
| admin_design_vectors | admin_memory_vectors |

## Public API
`store(nidHash, category, content, opts)` · `search(category, query, opts)` · `getByNode(nidHash)` · `deleteByNode(nidHash)` · `autoStore(nidHash, nodeType, content, opts)` · `getStats()`.

## Unified Memory Service (vision) = already present
Chat history, personal memory, family/business knowledge, documents, voice transcripts all land in the categories above. The "unified memory service" is `vector-manager` + the `ai_semantic_cache`/`ai_summary_cache` read-through caches.

## Retrieval in the kernel
- `search_knowledge_similarity` / `search_knowledge_text` action types expose RAG to chat.
- `node_ai_cache` + `ai_semantic_cache` short-circuit repeat queries (cost control).

## Gaps
- **Embedding worker**: `vec_embedding`/`memory_blob` are initialized as pending on first bootstrap; a background job to compute embeddings (`node_ai_task_queue`) closes the loop.
- Voice transcript ingestion → `ai_session_memory` (capture path is a frontend + STT gap).
