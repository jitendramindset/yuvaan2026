# NodeOS / Yuvaan2026 — System Architecture

## 1. System Vision

NodeOS is a **node-driven operating environment** that runs as:

- Web application (Next.js 15)
- Desktop OS layer
- Mobile app
- Server platform

It combines: Identity OS · Social profile (Vanshawali) · Visual UI builder · Workflow automation · AI agent · Wallet/Dravyam economy · Plugin ecosystem.

Everything in the system is represented as **nodes executed by the kernel**.

---

## 2. Architecture Layers

```
┌──────────────────────────────┐
│        UI Renderer           │
│  (React / Next.js 15 / PWA) │
└──────────────┬───────────────┘
               │
       Widget Engine (95+ types)
               │
┌──────────────┴───────────────┐
│    Layout Builder UI         │
│  (Elementor-style 3-panel)   │
└──────────────┬───────────────┘
               │
          Node Engine
               │
┌─────────────┴──────────────┐
│       Kernel Engine        │
│ permission · karma · sync  │
│ dharma · logs · workflow   │
└─────────────┬──────────────┘
               │
 ┌─────────────┼─────────────┐
 │             │             │
Wallet      AI Agent      Peer Network
(Dravyam)   (Yunaan)     Sync/Broadcast
 │             │             │
 └─────────── Data Node Store ──────────┘
```

---

## 3. Entry Flow

```
App boot → Kernel boot → Device detection
→ User onboarding (8 steps)
→ generateNodes() creates:
     profile.vanshawali.<userId>  (root)
     + 11 Vanshawali sub-nodes
     + wallet.<userId>
     + agent.<userId>
     + dashboard.<userId>
     + industry module nodes
     + default workflow nodes
→ UI renderer loads dashboard
```

---

## 4. Kernel Pipeline

Every node execution passes through this 9-stage pipeline:

```
loadNode
  → validateSchema       (node.schema.json)
  → checkPermissions     (permission.engine.ts — ACL perm_blob)
  → validateDharma       (dharma.engine.ts — blocks destructive ops)
  → executeActions       (node.executor.ts — set_data / run_workflow / emit_log)
  → computeStateHash     (hash.engine.ts — SHA3-256 deterministic)
  → computeKarma         (karma.engine.ts — health×0.6 + trust×0.2 + contribution×0.2)
  → appendLog            (log.engine.ts → logs/node_event_log.json append-only)
  → broadcastNodeUpdate  (broadcast.engine.ts → devices, peers, agents, UI)
```

---

## 5. Vanshawali Profile System

The Vanshawali profile is the user identity graph rooted at `profile.vanshawali.<userId>`.

### Sub-nodes (11 total)

| Sub-node ID | Component | Key data |
|-------------|-----------|----------|
| `personal.vanshawali.<uid>` | PersonalInfoCard | name, dob, gender, blood_group, religion, gotra, community, languages |
| `contact.vanshawali.<uid>` | ContactCard | phone, email, whatsapp, telegram (with `ContactPrivacy`) |
| `location.vanshawali.<uid>` | LocationCard | current_address, permanent_address, geo, migration_history |
| `social.vanshawali.<uid>` | SocialLinksCard | linkedin, instagram, facebook, twitter_x, github, youtube, website |
| `family.vanshawali.<uid>` | FamilyGraphCard | members[] — 13 relation types |
| `education.vanshawali.<uid>` | EducationCard | school→university timeline |
| `profession.vanshawali.<uid>` | ProfessionCard | occupation, company, role, experience, certifications |
| `preference.vanshawali.<uid>` | PreferenceCard | hobbies, interests, food, lifestyle, goals |
| `property.vanshawali.<uid>` | PropertyCard | house, land, vehicles, investments |
| `media.vanshawali.<uid>` | MediaGallery | profile_photo, certificates, family_photos |
| `trust.vanshawali.<uid>` | TrustScoreCard | completion score (0–100), breakdown by 8 sections |

### Trust / Completion Score

Computed by `kernel/profile.engine.ts`:

| Section | Weight |
|---------|--------|
| basic_info | 20% |
| contact | 10% |
| location | 10% |
| education | 10% |
| profession | 10% |
| family | 20% |
| preferences | 10% |
| media | 10% |

Levels: **Seed** (0–39) → **Sprout** (40–59) → **Root** (60–79) → **Elder** (80–100).

Wallet limit multiplier: ≥80% → 3×, ≥50% → 1.5×, <50% → 1×.

---

## 6. Two UI Modes

### Dashboard View (`/dashboard`)
- Loads `widget.nodes` defined in `dashboard.node`.
- 12-column grid rendered by `WidgetRenderer.tsx`.
- Layout persisted to `localStorage` key `nodeos-dashboard-layout`.

### Builder / Customization View (`/builder`)
- Elementor-style 3-panel: **Palette | Canvas | Properties**.
- Drag widgets → creates `widget.node` → bind data → bind actions → save `layout.node`.
- Persisted to `localStorage` key `nodeos-builder-layout`.

### Vanshawali View (`/vanshawali`)
- Segment-based layout with 15 available segment types.
- Each segment maps to a Vanshawali sub-node.
- Inline editor mode mirrors the builder pattern.
- Trust ring SVG driven by `computeOBCompletion()`.

---

## 7. Widget System

95+ widget types across 14 categories defined in `shared/types/customization.types.ts`.

| Category | Key types |
|----------|-----------|
| Layout | container, grid, column, tab, accordion, split_panel |
| Data display | table, list, card, timeline, tree_view |
| Analytics | kpi_card, line_chart, bar_chart, pie_chart, gauge_chart |
| Social | post_composer, feed, comment_thread, profile_header |
| Communication | chat_window, contact_list, notification_panel |
| Forms | text_input, dropdown, multi_select, file_upload, date_picker |
| Finance | wallet_balance, transaction_list, dravyam_ticker |
| Game | canvas, sprite, scoreboard, physics_engine |
| Developer | code_editor, terminal, api_console |
| AI | chat_widget, intent_log, voice_control |
| Workflow | workflow_builder, trigger_editor, step_list |
| Device | device_status, camera_view, sensor_panel |
| Media | image_gallery, video_player, document_viewer |
| Builder | segment_palette, properties_panel, layout_canvas |

All custom widget logic must be **JavaScript** to enable user-authored widgets, games, and mini-apps.

---

## 8. Kernel Engines

| Engine | File | Purpose |
|--------|------|---------|
| Main pipeline | `kernel.engine.ts` | Orchestrates all 9 stages |
| Node executor | `node.executor.ts` | set_data, run_workflow, emit_log |
| Permission | `permission.engine.ts` | ALLOW/DENY ACL (perm_blob + legacy) |
| Dharma | `dharma.engine.ts` | Blocks: delete_all, mass_transfer, override_permissions |
| Karma | `karma.engine.ts` | health×0.6 + trust×0.2 + contribution×0.2 |
| Hash | `hash.engine.ts` | SHA3-256 over sorted-key JSON |
| Auth | `auth.engine.ts` | Sessions (8h), password, biometric, hardware key |
| Fraud | `fraud.engine.ts` | velocity/geo/amount scoring; block at ≥70 |
| Dravyam | `dravyam.engine.ts` | Wallet, 1% fee, orders, capture, rollback |
| Profile | `profile.engine.ts` | Vanshawali completion score, wallet multiplier |
| Onboarding | `onboarding.engine.ts` | 8-step wizard + generateNodes() |
| Chat | `chat.engine.ts` | Intent detection via regex → dispatch |
| Workflow | `workflow.engine.ts` | Declarative trigger→action step executor |
| Broadcast | `broadcast.engine.ts` | node_update events to devices/peers/agents/UI |
| Sync | `sync.engine.ts` | P2P hash comparison, mismatch replay |
| Log | `log.engine.ts` | Append-only JSON event log |

---

## 9. AI Agent (Yunaan)

Default node: `agent.yunaan.default`. Tools: `["shell","browser","api","device_monitor"]`.

Intent routing in `kernel/chat.engine.ts`:

| Intent | Trigger example |
|--------|----------------|
| `render_widget` | "Add a sales chart" |
| `navigate` | "Open the dashboard" |
| `run_action` | "Create an invoice for Raj" |
| `create_workflow` | "When a new order arrives, notify me" |
| `social_connect` | "Connect my Facebook account" |

---

## 10. Wallet & Dravyam Economy

```
create transaction.node
  → fraud.engine.ts scores transaction
  → if score < 70: lock balance
  → execute payment (1% fee to economy.dravyam)
  → update ledger (append-only)
  → release lock
  → broadcast balance update
```

Currencies: `DRAVYAM · INR · USD · AED · EUR`.

---

## 11. Peer Network

Nodes sync across devices via `sync.engine.ts` + `peer.discovery.ts`.

Connection types: `local_network · location_proximity · known_contacts · messaging_channel`.

Conflict resolution: latest timestamp → higher karma → owner priority.

---

## 12. Security Model (OWASP)

| Threat | Mitigation |
|--------|-----------|
| Broken Access Control | `permission.engine.ts` ACL + dharma guard |
| Cryptographic Failures | AES-256-GCM blobs (`blob_cipher.ts`), SHA3-256 hashes |
| Injection | Parameterised queries only; no `eval()` on user strings |
| XSS | React escapes by default; sanitise before `dangerouslySetInnerHTML` |
| Auth Failures | session TTL 8h, HMAC biometric, timing-safe master key compare |
| SSRF | External URLs validated before fetch in webhook/connector engines |
| Fraud | `fraud.engine.ts` scores every Dravyam transaction pre-execution |
| Integrity | Append-only log, SHA3-256 state hash, ledger compaction guard |

---

## 13. Repository Structure

```
kernel/           TypeScript engines (30 files)
api/              Express REST server + 16 route files
nodes/            .node.json files (schema, profiles, widgets, economy…)
shared/           Types + constants + errors
ui/web/           Next.js 15 frontend (App Router)
  app/            Page routes: dashboard, builder, vanshawali, marketplace…
  components/     Navbar, widgets, PWA install, service worker
agents/           yunaan.agent.node.json
wallet/           wallet.node.json, transaction.node.json
backup/           Encrypted backup scheduler + rotator
config/           crypto, device, kernel config
docs/             kernel-architecture.md, ui-widget-system.md, system-architecture.md
logs/             node_event_log.json (append-only)
```

---

## 14. Development Commands

```sh
# Backend (from repo root)
npm run dev          # tsx api/server.ts  →  http://localhost:3000

# Frontend (from ui/web/)
npm run dev          # Next.js dev server  →  http://localhost:3001

# Type-check everything
npx tsc --noEmit

# Tests
npm test             # vitest
```
