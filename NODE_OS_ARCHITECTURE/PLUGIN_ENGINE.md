# PLUGIN_ENGINE

**Action types:** `create_plugin`, `query_plugins`, `update_plugin`, `execute_plugin`, `get_plugin_stats`, `clone_plugin`, `delete_plugin` (all in `ActionExecutors`). Marketplace via `node_marketplace` + `marketplace_*`.

## Tables (reuse)
- `node_plugin_store` — installed plugin (nid_hash, plugin_code, version, status, config)
- `node_plugin_access` — per-node access level
- `ai_plugins` — plugin catalog/definitions
- `plugin_permissions` — resource/action/required_role per plugin
- `node_marketplace`, `marketplace_templates`, `marketplace_installs`, `marketplace_public`, `template_reviews`

## On install → plugin creates nodes
A plugin installation is a `node_core` node (`node_type='plugin'`) plus side-effect nodes it provisions. Per the vision, an installed plugin can create:
- **Nodes** → `node_core` rows (owner = installing user)
- **Widgets** → `dashboard_widgets` / `ui_template_widgets`
- **Permissions** → `node_permission` + `plugin_permissions`
- **Menus/Actions** → `node_internal_actions` / `node_external_actions`
- **AI Tools** → `ai_agent_templates`

All through the kernel — `execute_plugin` runs under the full pipeline (permission, karma, dharma, risk).

## Example plugin → provisioned nodes
| Plugin | Creates |
|---|---|
| CRM | `company` + `client` nodes, table+kanban widgets, sales permissions |
| AI Tutor | `agent` (ai_agent_templates) + course nodes, chat widget |
| WhatsApp/Telegram | `automation` (node_external_actions) + webhook route |
| Accounting | invoice/payment nodes, stats widgets |

## Economy hook
Marketplace installs flow through DRAVYAM: paid plugin → `node_transaction` + `contribution_graph` (royalty to creator). See [`DRAVYAM_ENGINE.md`](./DRAVYAM_ENGINE.md).

## Gaps
- **Plugin Center UI** (browse/install/configure) — frontend screen.
- **Sandboxing** for `execute_plugin` of third-party code (risk-predictor scans content; an execution sandbox is the missing safety layer).
- A declarative **plugin manifest** (what nodes/widgets/permissions it provisions) to make install idempotent.
