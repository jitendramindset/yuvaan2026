# Vanshawali Node OS — Architecture Deliverables

Principal-architect analysis of the existing system, mapped to the Node OS vision.

**Headline finding:** the platform is **already a Node OS**. ~180 Supabase tables and 15+ kernel engines exist. `node_core` is the universal node table; `core/kernel-executor.js` is the resolver running an 18–21 step governed pipeline behind `POST /api/kernel/v2/execute`. The remaining work is **wiring + frontend screens**, not new architecture.

## Documents
| Doc | What it covers |
|---|---|
| [NODE_MAPPING_REPORT.md](./NODE_MAPPING_REPORT.md) | Every existing table → Node OS category; node_core structure; anti-duplication checklist |
| [KERNEL_ARCHITECTURE.md](./KERNEL_ARCHITECTURE.md) | Single entry point, 18–21 step pipeline, 200+ action types, engine map |
| [KARMA_ENGINE.md](./KARMA_ENGINE.md) | Behavioral credit → autonomy |
| [DHARMA_ENGINE.md](./DHARMA_ENGINE.md) | 10 non-negotiable system laws |
| [DRAVYAM_ENGINE.md](./DRAVYAM_ENGINE.md) | Token economy, 1% network, contribution graph |
| [VECTOR_MEMORY_ENGINE.md](./VECTOR_MEMORY_ENGINE.md) | 8 vector spaces, unified memory |
| [SYNC_ENGINE.md](./SYNC_ENGINE.md) | Nearest-node, multi-device, gossip, federation, offline |
| [PLUGIN_ENGINE.md](./PLUGIN_ENGINE.md) | Plugin install → node provisioning, marketplace |
| [DASHBOARD_RENDER_ENGINE.md](./DASHBOARD_RENDER_ENGINE.md) | Frontend kernel-driven render flow + widget registry |
| [FRONTEND_INTEGRATION_PLAN.md](./FRONTEND_INTEGRATION_PLAN.md) | Screen gap matrix, layout cloning, edit mode, chat-control |
| [IMPLEMENTATION_TASKS.md](./IMPLEMENTATION_TASKS.md) | **Dependency-ordered build plan** (Phase 0→6, critical path) |

## How to use
1. Read NODE_MAPPING_REPORT to know what exists before building anything.
2. Use the anti-duplication checklist on every PR.
3. Follow IMPLEMENTATION_TASKS critical path: `1 → 4 → 5 → 6 → screens → editor → chat-control`.

> Schema column lists are derived from the CSV export — verify against the live DB (`list_tables`) before any migration.
