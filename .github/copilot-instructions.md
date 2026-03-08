# NodeOS / Yuvaan2026 — GitHub Copilot Instructions

## System Identity
This repository implements **NodeOS**, a node-driven operating environment.
Everything is represented as a **node** executed through the **kernel engine**.

---

## Core Architecture Rules

1. **Node-driven architecture**: every feature, UI component, data model, and automation is a node with `node_id`, `node_type`, `owner`, `permissions`, `data`, `actions`, and `children`.
2. **Kernel pipeline** must be respected: `loadNode → validateSchema → checkPermissions → validateDharma → executeActions → computeStateHash → computeKarma → appendLog → broadcastNodeUpdate`.
3. **All nodes are files** stored as `.node.json` in `nodes/<category>/`. The schema is in `nodes/schema/node.schema.json`.
4. **TypeScript everywhere** in the backend (`kernel/`, `api/`, `shared/`). Next.js 15 + Tailwind in `ui/web/`.
5. **Vanshawali is the default identity profile** — every user has `profile.vanshawali.<userId>` as the root node with 11 sub-nodes: personal, contact, location, social, family, education, profession, preference, property, media, trust.

---

## Vanshawali (वंशावली) Profile System

The Vanshawali profile is the **user identity graph**. It must include:

- Personal info (name, dob, gender, blood group, religion, gotra, community, languages)
- Contact (phone, email, WhatsApp, Telegram — each with privacy level)
- Location (current address, permanent address, geo co-ordinates, migration history)
- Social links (LinkedIn, Instagram, Facebook, X/Twitter, GitHub, YouTube, website)
- Family tree (members with relation, name, age, profession — up to 13 relation types)
- Education timeline
- Profession / career timeline
- Preferences (hobbies, interests, food, lifestyle, goals)
- Property & assets
- Media gallery (profile photo, family photos, certificates)
- Trust score / profile completion ring (computed by `kernel/profile.engine.ts`)

Trust score levels: `Seed` (0–39) → `Sprout` (40–59) → `Root` (60–79) → `Elder` (80–100).

---

## UI Rules

### Two Modes
1. **Dashboard view** — loads widget nodes from `dashboard.node` and renders them in a 12-column grid.
2. **Builder / Customization view** — Elementor-style 3-panel editor (palette | canvas | properties). Save layout to `localStorage` keyed by `nodeos-*-layout`.

### Vanshawali Page (`/vanshawali`)
- Segment-based layout: each segment is a `SegType` with `id`, `type`, `visible`, `span`, `config`.
- Required segments: `profile_header`, `family_tree`, `friends`, `interests`, `education`, `profession`, `heritage`, `achievements`, `media_gallery`, `social_links`, `contact_info`, `trust_score`, `wallet_mini`, `location`, `wishlist`.
- Trust score ring is an SVG circle with `stroke-dasharray` driven by `computeOBCompletion()`.
- Profile completion must reflect the 8 weights from `kernel/profile.engine.ts`.

### Widgets
Every UI widget is a widget node. Widget categories:

| Category | Examples |
|----------|---------|
| Layout | container, grid, column, tab, accordion |
| Data display | table, list, card, timeline, tree |
| Analytics | KPI card, line chart, bar chart, gauge |
| Social | post composer, feed, comment thread, profile header |
| Communication | chat window, contact list, notification panel |
| Finance | wallet balance, transaction list, Dravyam ticker |
| Game | canvas, sprite, scoreboard, physics engine |
| Developer | code editor, terminal, API console |

All custom logic inside widgets must be **JavaScript** (not TypeScript) to allow user-authored code.

---

## Onboarding Flow

8 steps: `user_identity → company_setup → industry_selection → business_size → operations → team_structure → product_service → data_preferences → complete`.

On completion (`generateNodes()`), the following nodes **must** be created:
- `profile.vanshawali.<userId>` (root)
- All 11 Vanshawali sub-nodes
- `wallet.<userId>`
- `agent.<userId>` (Yunaan AI agent)
- `dashboard.<userId>`
- Industry-specific module nodes
- Default workflow nodes

---

## Kernel Rules

- `dharma.engine.ts` blocks: `delete_all`, `mass_transfer`, `override_permissions`, `disable_audit`, nodes tagged `"restricted"`.
- `karma.engine.ts` formula: `health×0.6 + trust×0.2 + contribution×0.2`. Levels: Seed / Sprout / Root / Elder.
- `fraud.engine.ts` thresholds: velocity > 10 tx/hr (+5 pts each), geo_mismatch (+30), tx > ₹500,000 (+20). Block at score ≥ 70.
- `permission.engine.ts`: ALLOW/DENY ACL from `perm_blob`. Legacy `permissions` object also supported.
- All node actions must be logged via `log.engine.ts` to `logs/node_event_log.json` (append-only).
- Node state hash: deterministic SHA3-256 over sorted-key JSON (`hash.engine.ts`).

---

## API Rules

- Backend is an Express server at `api/server.ts`, port 3000.
- Frontend proxies `/api/backend/*` → `http://localhost:3000/*` (`ui/web/next.config.ts`).
- All routes use `kernel_guard.ts` middleware for authentication.
- Rate limiter applies globally.

---

## Marketplace

The marketplace lists community widgets as `MarketplaceListing` objects. Each listing maps to a `widget.node.json`. Listings support: name, description, price (0 = free), category, tags, rating, install_count, author.

Category colour map: `Social=#6c63ff, Finance=#22c55e, Analytics=#f59e0b, AI=#00d2ff, Game=#ec4899, Workflow=#f97316, System=#94a3b8`.

---

## Chat / AI Agent (Yunaan)

The Yunaan agent (`agent.yunaan.default`) accepts natural-language commands that map to intents:

| Intent | Example |
|--------|---------|
| `render_widget` | "Add a sales chart" |
| `navigate` | "Open the dashboard" |
| `run_action` | "Create an invoice for Raj" |
| `create_workflow` | "When a new order arrives, notify me" |
| `social_connect` | "Connect my Facebook account" |

Intent detection happens in `kernel/chat.engine.ts` via regex rules, then dispatched to the relevant engine.

---

## File Naming Conventions

| Path | Convention |
|------|-----------|
| `kernel/*.engine.ts` | lowercase with dot before `engine` |
| `nodes/**/*.node.json` | lowercase with dot before `node` |
| `api/routes/*.routes.ts` | lowercase with dot before `routes` |
| `shared/types/*.types.ts` | lowercase with dot before `types` |
| `ui/web/app/*/page.tsx` | Next.js App Router convention |

---

## Security Requirements (OWASP Top 10)

- **No SQL injection**: all queries must use parameterised statements.
- **No XSS**: sanitise any user-supplied content rendered as HTML.
- **Auth**: all kernel actions check session validity via `auth.engine.ts`. Sessions expire in 8 h.
- **Rate limiting**: applied via `api/middleware/rate_limiter.ts`.
- **Dharma guard**: blocks destructive actions even for authenticated users.
- **Blob encryption**: all blobs stored via AES-256-GCM (`kernel/blob/blob_cipher.ts`).
- **Webhook signatures**: HMAC-SHA256 (`kernel/webhook.engine.ts`).
- **Fraud detection**: every Dravyam transaction is scored before execution.

---

## Development Commands

```sh
# Start backend
npm run dev            # tsx api/server.ts

# Run tests
npm test               # vitest

# Type-check
npx tsc --noEmit
```

Frontend (`ui/web/`) is a separate Next.js 15 app — run `npm run dev` inside that directory.
