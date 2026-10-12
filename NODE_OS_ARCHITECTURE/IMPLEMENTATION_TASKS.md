# IMPLEMENTATION_TASKS (dependency-ordered)

Build order to complete the Vanshawali Node OS. **Reuse existing tables/engines — do not duplicate.** Each task notes what already exists vs. what's new.

Legend: 🟢 mostly exists (wire/verify) · 🟡 partial · 🔴 new build. FE = frontend, BE = backend.

---

## PHASE 0 — Stabilize the kernel (foundation, blocks everything)
1. 🟢 **Verify kernel pipeline invariants** — NODE_NOT_FOUND fix, brand-isolation default-node exemption, `_logActionLog` on ActionExecutors, v2 `action`/`action_type` acceptance. *(Done — keep as regression tests.)*
2. 🟡 **Kernel smoke-test suite** (BE) — one test per action category hitting `/api/kernel/v2/execute`. Depends on: 1.
3. 🟡 **Embedding worker** (BE) — drain `node_ai_task_queue` to compute `vec_embedding`/`memory_blob`. Depends on: vector-manager (exists).

## PHASE 1 — Layout instance + render completeness (unblocks all screens)
4. 🔴 **`clone_layout` action** (BE) — copy brand default → user-owned `dashboard_layouts` row; bind to node. Depends on: 1.
5. 🟡 **`_uiBootstrap` reads layout instance** (BE) — prefer user instance over brand default. Depends on: 4.
6. 🔴 **Widget types in WidgetRenderer** (FE) — add `tree`, `graph`, `wallet_card`, `feed`, `calendar`, `kanban`, `map`, `chat_panel`, `device_list`, `doc_grid`. Mirror `widget-engine.js`. Depends on: 1.

## PHASE 2 — Core screens (parallel once Phase 1 done)
7. 🟡 **Profile screen** (FE) — node_core field_map + karma/trust/dharma KPIs. Depends on: 6.
8. 🔴 **Family Tree screen** (FE) — `tree` widget over node_core + node_permission(family). Depends on: 6.
9. 🔴 **Network graph screen** (FE) — relationships via node_permission. Depends on: 6.
10. 🔴 **Feed/Home screen** (FE) — post nodes via `data_read`. Depends on: 6.
11. 🔴 **Wallet screen** (FE) — node_wallet/node_transaction; Send/Receive/Convert/QR (record-only, no auto-transfer). Depends on: 6. See DRAVYAM guardrail.
12. 🟡 **Full Chat screen** (FE) — promote FloatingChat to a screen; `chat` + RAG. Depends on: 6.

## PHASE 3 — Marketplace, plugins, economy wiring
13. 🟡 **Plugin manifest format** (BE) — declarative nodes/widgets/permissions a plugin provisions. Depends on: 1.
14. 🟡 **`execute_plugin` sandbox** (BE) — isolate third-party execution; risk-predictor pre-scan. Depends on: 13.
15. 🔴 **Marketplace screen** (FE) — node_marketplace/marketplace_*; install → DRAVYAM payout. Depends on: 6, 13.
16. 🔴 **Plugin Center screen** (FE) — browse/install/configure. Depends on: 15.
17. 🟡 **Dravyam payout job** (BE) — verify revenue_distribution_log + contribution_graph normalization end-to-end. Depends on: 1.

## PHASE 4 — Sync, devices, offline
18. 🟡 **Offline-queue drain worker** (FE+BE) — drain `node_offline_queue` on reconnect. Depends on: node-sync (exists).
19. 🔴 **Device Manager screen** (FE) — node_devices + trust + revoke. Depends on: 6.
20. 🟡 **Federation handshake policy** (BE) — beyond nonce; peer auth. Depends on: gossip (exists).

## PHASE 5 — Editor, chat-control, admin
21. 🔴 **Elementor edit mode** (FE) — drag/resize/rename/recolor/connect/preview/save/publish → dashboard_widgets + ui_widget_layouts. Depends on: 4, 5, 6.
22. 🔴 **Chat-controlled UI** (FE+BE) — `chat` returns preview descriptor → confirm → `execute_action`. Depends on: 12, 21.
23. 🔴 **Admin Console screen** (FE) — kernel `/schema` + `/health` introspection over nodes/queues/karma/dharma/wallet/federation. Depends on: 6.
24. 🔴 **Document Vault + Settings screens** (FE). Depends on: 6.

## PHASE 6 — Onboarding & polish
25. 🟡 **Age-based brand routing** (FE+BE) — at signup set default brand by age; dharma already enforces JuniorMantra ≤12. Depends on: 4.
26. 🔴 **Design system pass** (FE) — Glassmorphism + Material 3, dark/light, responsive, bottom/top nav. Cross-cuts all screens.

---

## Critical path
`1 → 4 → 5 → 6 → {7..12} → 21 → 22`
Everything in Phase 2+ depends on **6 (widget types)** and **5 (layout instance read)**. Do Phase 0–1 first; then screens fan out in parallel.

## Hard rules (every task)
- No new table without checking [`NODE_MAPPING_REPORT.md`](./NODE_MAPPING_REPORT.md) §5 first.
- All data flows through `/api/kernel/v2/execute` — no new bypass endpoints.
- Money movement: record/route only; never auto-execute transfers.
- New entity = `node_core` row; new relationship = `node_permission`.
