# KERNEL_ARCHITECTURE

**The Vanshawali Node OS Kernel — already implemented in `core/kernel-executor.js`.**

Everything resolves through one entry point. No screen, action, or data read bypasses the kernel.

---

## 1. Single entry point

```
POST /api/kernel/v2/execute     (routes/kernel-v2-api.js — CANONICAL)
POST /api/kernel/execute        (routes-kernel.js — legacy, kept for compat)
POST /kernel/execute            (routes/kernel-execute.js — legacy)
```

**Request:**
```json
{ "action": "ui_bootstrap", "payload": { "brand": "VANSHAWALI" }, "device_id": "..." }
```
- Accepts `action` (frontend) or `action_type` (internal). Auth via `Authorization: Bearer <jwt>`.

**Response envelope** (built by `kernel-executor.execute()`):
```json
{
  "success": true,
  "execution_id": "exec_...",
  "action": "ui_bootstrap",
  "brand": "VANSHAWALI",
  "result": { "...action-specific..." },
  "karma": { "score": 0, "delta": 0, "level": {...} },
  "trust": { "score": 50, "level": "Verified" },
  "risk":  { "score": 2, "level": "Safe", "warnings": [] },
  "sync":  { "version": null, "nodes_notified": 0 },
  "meta":  { "duration_ms": 0, "steps_completed": 21, "rate_remaining": 59 }
}
```

---

## 2. The 18–21 step pipeline (`execute()`)

Every call runs the governed pipeline. Steps are recorded in `trace.steps`.

| # | Step | Engine | Tables |
|---|---|---|---|
| 1 | `validate_session` | JWT decode + device | node_mobile_session |
| 2 | `load_user_node` | `_loadUserNode` (cache→factory→recovery→default) | node_core |
| 2A | `check_vector_node` | NodeFactory | node_core.memory_blob |
| 2B | `create_vector_node` | vector init | node_core |
| 2C | `admin_tools_init` | AdminToolExecutor | admin_node_audit |
| 3 | `identify_brand` | `_resolveBrand` | node_core DNA |
| 4 | `trust_assessment` | trust-engine (cached) | node_trust_state |
| 5 | `risk_prediction` | risk-predictor | node_execution_log, node_failure_log |
| 6 | `validate_permission` | permission-engine (cached) | node_permission, node_permission_effective |
| 7 | `karma_check` | karma-engine | node_core.karma_score |
| 8 | `dharma_validation` | dharma-validator | node_dharma_log |
| 9 | `rate_limit` | rate-limiter | (in-memory) |
| 10 | `resolve_target` | `_loadNode` | node_core |
| 11 | `execute_action` | ActionExecutors dispatch | (action-specific) |
| 12 | `update_vectors` | vector-manager | vector_chunks |
| 13 | `update_karma_trust` | karma + trust | node_karma_log, node_trust_state |
| 14 | `log_event` | `_logExecution` | node_execution_log |
| 15 | `sync_nearest` | node-sync + gossip | node_core, node_event_queue |
| 16 | `prompt_evolution` | prompt-evolution | node_core.node_system_prompt |
| 17 | build UI response | — | — |
| 18 | return | — | — |

**Failure short-circuits** return `_buildErrorResponse(code, detail, trace, httpStatus)` with the step that failed and `steps_completed`. Codes seen in practice: `SESSION_INVALID` (401), `NODE_NOT_FOUND` (404), `RISK_BLOCKED` (403), `PERMISSION_DENIED` (403), `KARMA_TOO_LOW` (403), `DHARMA_VIOLATION` (403), `RATE_LIMITED` (429), `KERNEL_ERROR` (500).

---

## 3. Action dispatch (`ActionExecutors.execute()`)

200+ action types are already wired. Categories:

- **UI:** `ui_bootstrap`, `post_login_bootstrap`, `ui`, `switch_brand`
- **Data:** `data_read`, `data_write`, `form_submit`, `data_delete`
- **Nodes:** `create_node`, `delete_node`
- **Chat/AI:** `chat`, `create_chat_message`, `get_conversation_history`, `create_chat_session`
- **Agents:** `create_agent_rule`, `evaluate_agent_rules`, `create_agent_template`, `instantiate_agent_template`
- **Plugins:** `create_plugin`, `execute_plugin`, `query_plugins`
- **Templates/Dashboards:** `create_dashboard_request`, `process_dashboard_request`, `create_generated_template`, `clone_template`
- **Knowledge/Vector:** `create_knowledge_entry`, `search_knowledge_similarity`, `search_knowledge_text`
- **Model routing:** `route_ai_request`, `create_model_router`
- **Geo/Sync:** `find_nearest_nodes`, `select_best_node`, `sync_geographic`
- **Admin/API:** `admin_execute`, `create_api_key`, `check_rate_limit`, `create_api_route`

**To add a screen/feature:** add an action case (or reuse `data_read`/`ui_bootstrap`), not a new endpoint.

---

## 4. Engine map (all in `core/`)

| Engine | File | Role |
|---|---|---|
| Kernel Executor | `kernel-executor.js` | the pipeline + ActionExecutors |
| Karma | `karma-engine.js` | behavioral credit → autonomy |
| Dharma | `dharma-validator.js` | non-negotiable system law (10 rules) |
| Trust | `trust-engine.js` | 7-factor weighted score |
| Permission | `permission-engine.js` | executable permission codes + roles |
| Risk | `risk-predictor.js` | 8-signal anomaly detection |
| Node Sync | `node-sync.js` | nearest-node + multi-device (Socket.io) |
| Gossip | `gossip-network.js` | epidemic state propagation |
| Node Cache | `node-cache.js` | 8-tier LRU+TTL |
| Node Factory | `nodeFactory.js` | live/non-live node creation |
| Node Discovery | `node-discovery.js` | geo/semantic nearest |
| Vector Manager | `vector-manager.js` | 8 vector spaces |
| Widget Engine | `widget-engine.js` | widget JSON + brand layouts |
| Prompt Evolution | `prompt-evolution.js` | karma-driven prompt versions |
| Runtime Orchestrator | `runtimeOrchestrator.js` | boot/signup/login/dashboard flow |

Details per engine: [`KARMA_ENGINE.md`](./KARMA_ENGINE.md), [`DHARMA_ENGINE.md`](./DHARMA_ENGINE.md), [`SYNC_ENGINE.md`](./SYNC_ENGINE.md), [`VECTOR_MEMORY_ENGINE.md`](./VECTOR_MEMORY_ENGINE.md), [`DRAVYAM_ENGINE.md`](./DRAVYAM_ENGINE.md), [`PLUGIN_ENGINE.md`](./PLUGIN_ENGINE.md).

---

## 5. Login → Render flow (kernel-driven, no hardcoded screens)

```
User login (/api/auth/signin)
  → JWT issued, node_core ensured (lazy init)
Frontend AppRenderEngine mounts
  → token check → POST /api/kernel/v2/execute { action: ui_bootstrap }
Kernel pipeline (steps 1–18)
  → _uiBootstrap resolves brand → dashboard_layouts (or brand default) + dashboard_widgets
  → response { result: { layout, widgets, brand, theme } }
Renderer unwraps → setUIState → LayoutRenderer + WidgetRenderer
```

See [`DASHBOARD_RENDER_ENGINE.md`](./DASHBOARD_RENDER_ENGINE.md).

---

## 6. Known correctness fixes already applied

- `_loadUserNode` returns the node row directly; caller tolerates `.node` and flat shapes (NODE_NOT_FOUND fixed).
- Brand isolation skipped for default/fallback nodes (`row_id===0`).
- `ActionExecutors._chat` had a missing `_logActionLog` → added to the class; logging is non-critical (swallowed).
- v2 route accepts both `action` and `action_type`.

These are baseline invariants — keep them when extending the pipeline.
