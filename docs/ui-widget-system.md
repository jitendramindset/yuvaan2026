# Universal UI Widget System — NodeOS

> Version 1.0.0 · Every screen is a graph of widget nodes.

---

## Core Concept

Every screen in NodeOS is generated from **widget nodes**.

```
layout.node
   ↓
container.widget
   ↓
widget.children[]
   ↓
data binding + actions
```

A screen is just a `layout.node` (platform + grid) containing an array of `WidgetConfig` objects.  
Each widget binds to a **data node**, applies **permissions**, and triggers **kernel actions**.

---

## Widget Execution Flow

When a widget loads the kernel runs this pipeline:

```
load widget.node
  ↓ fetch data_source node   (kernel read, permission-gated)
  ↓ apply style + theme
  ↓ bind actions              (action_button → runNode)
  ↓ check permissions         (perm_blob.grants)
  ↓ render UI
  ↓ emit_log (widget_render event)
```

Each step is tagged in the node event log with:
```json
{
  "event_id": "<uuid>",
  "node_id": "<widget_nid_hash>",
  "action": "widget_render",
  "device_id": "<device_id>",
  "timestamp": "...",
  "result": { "widget_type": "...", "platform": "..." }
}
```

---

## Widget Node Schema

```json
{
  "nid_hash": "<unique_hash>",
  "node_type": "widget",
  "widget_type": "<see catalogue>",
  "owner_id": "<owner>",
  "label": "Human label",
  "dna_blob": {
    "brand_scope": "ui",
    "archetype": "widget",
    "intent_tags": ["display", "data_binding"],
    "dharma_tags": []
  },
  "perm_blob": {
    "grants": [{ "subject_nid_hash": "*", "scope": "self", "actions": ["read"], "effect": "ALLOW" }]
  },
  "runtime_blob": {
    "active_widgets": [],
    "state": {
      "widget_type": "",
      "container": "",
      "style": {},
      "data_source": "",
      "actions": [],
      "permissions": []
    }
  }
}
```

---

## Universal Widget Customization Capabilities

Every widget supports all of the following:

| Feature             | Description                                   |
|---------------------|-----------------------------------------------|
| Drag & Drop         | Move widgets on the grid canvas               |
| Resize              | Adjust colSpan / rowSpan                      |
| Container nesting   | Widgets inside containers inside layouts      |
| Color themes        | background, border, text, hover colors        |
| Language support    | i18n label map per widget                     |
| Action binding      | Button / event → runNode(action)              |
| Data binding        | data_source → node nid_hash                   |
| Field editing       | Edit props at runtime in builder panel        |
| Permission binding  | perm_blob restricts visibility per role       |
| Workflow triggers   | widget event → workflow.node execution        |
| Animation           | entrance / idle / exit CSS animation class    |

---

## Platform Registry

| Platform      | Description                             |
|---------------|-----------------------------------------|
| `vanshawali`  | Identity, social, family graph          |
| `dravyam`     | Payments, wallet, transactions          |
| `ai_dashboard`| AI chat, analytics, automation          |
| `admin`       | System management, user control         |
| `device_hub`  | Device monitoring, sensor feeds         |
| `social`      | Social media, feeds, posts, communities |
| `erp`         | ERP dashboards, inventory, HR           |
| `game`        | Games, canvas, scoreboard               |
| `workflow`    | Automation builder, node canvas         |

---

## Widget Categories

### 1 — Layout Widgets

Structure and contain other widgets.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `container`       | Flex/grid container for grouping      |
| `grid_layout`     | Responsive dashboard grid             |
| `tab_container`   | Multi-page tab UI                     |
| `accordion`       | Expandable panel sections             |
| `split_panel`     | Resizable left/right or top/bottom    |
| `modal`           | Overlay dialog                        |
| `drawer`          | Slide-in panel                        |
| `sticky_header`   | Fixed top bar                         |

---

### 2 — Data Display Widgets

Render data from node sources.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `table`           | Sortable, filterable, paginated table |
| `list`            | Vertical item feed                    |
| `card`            | Flexible data card                    |
| `timeline`        | Chronological event stream            |
| `tree_view`       | Hierarchical node tree                |
| `json_viewer`     | Pretty-print raw node state           |
| `badge`           | Status pill / label                   |
| `avatar`          | User/bot avatar with status ring      |

---

### 3 — Analytics Widgets

For dashboards, KPIs, and monitoring.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `kpi_card`        | Single metric + trend arrow           |
| `stat_card`       | Icon + value + sub-label              |
| `chart_line`      | Time-series line chart                |
| `chart_bar`       | Category bar chart                    |
| `chart_pie`       | Distribution pie / donut chart        |
| `chart_gauge`     | Radial gauge (goal % / utilization)   |
| `chart_area`      | Stacked area chart                    |
| `heatmap`         | Matrix heatmap                        |
| `sparkline`       | Inline mini line chart                |

---

### 4 — Input / Form Widgets

For onboarding, settings, and data entry.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `text_input`      | Standard text field                   |
| `number_input`    | Numeric field with min/max validation |
| `dropdown_select` | Single select (enum_node source)      |
| `multi_select`    | Multi-value select                    |
| `date_picker`     | Calendar date input                   |
| `file_upload`     | Document / image upload               |
| `signature_pad`   | Capture digital signature             |
| `toggle`          | Boolean on/off                        |
| `slider`          | Range input                           |
| `color_picker`    | Theme color selection                 |
| `search_bar`      | Full-text node search                 |
| `rich_text`       | WYSIWYG text editor                   |
| `code_editor`     | JS / Python / JSON code input         |

---

### 5 — Social Media Widgets

For Vanshawali and community apps.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `post_composer`   | Create text / image / video / poll    |
| `feed`            | Infinite scroll post feed             |
| `comment_thread`  | Nested reply threads                  |
| `reaction_bar`    | Like / love / clap reactions          |
| `profile_header`  | Cover + avatar + bio + stats          |
| `profile_card`    | Compact user card                     |
| `follow_button`   | Follow / unfollow action              |
| `hashtag_cloud`   | Tag discovery cloud                   |
| `story_ring`      | Story / highlight bubbles             |

---

### 6 — Communication Widgets

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `chat_window`     | Real-time 1:1 / group messaging       |
| `ai_chat`         | AI assistant embedded chat            |
| `contact_list`    | User directory                        |
| `notification_panel` | Alerts and system messages         |
| `inbox`           | Email-style message inbox             |
| `voice_call`      | Audio call UI                         |

---

### 7 — Workflow / Automation Widgets

For automation builders (n8n style).

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `node_canvas`     | Visual workflow editor (drag + connect)|
| `action_button`   | Triggers a kernel action on click     |
| `status_indicator`| Shows workflow / node task state      |
| `trigger_panel`   | Configure workflow trigger conditions |
| `step_list`       | Ordered automation step display       |
| `logic_gate`      | Condition / branch node               |

---

### 8 — Developer / Power User Widgets

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `terminal`        | CMD terminal widget                   |
| `api_console`     | REST API test console                 |
| `node_inspector`  | Raw node state debugger               |
| `json_editor`     | Editable JSON field                   |
| `log_viewer`      | Real-time event log stream            |
| `diff_viewer`     | State change diff view                |

---

### 9 — Media Widgets

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `image_viewer`    | Zoom / gallery / lightbox             |
| `video_player`    | Embedded video playback               |
| `audio_player`    | Audio file player                     |
| `media_gallery`   | Grid photo / video gallery            |
| `document_viewer` | PDF / doc preview                     |

---

### 10 — Game Widgets

For simple NodeOS games.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `canvas`          | HTML5 canvas for 2D drawing / games   |
| `sprite`          | Animated game character               |
| `physics`         | Game physics component                |
| `scoreboard`      | Leaderboard / high score table        |
| `game_controls`   | D-pad / button controller             |
| `game_timer`      | Countdown / stopwatch                 |

---

### 11 — Financial Widgets

For Dravyam and wallets.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `wallet_card`     | Balance display with currency         |
| `wallet_summary`  | Balance + hold + recent transactions  |
| `transaction_list`| Paginated transaction history         |
| `payment_button`  | Trigger Dravyam payment flow          |
| `currency_converter` | Multi-currency live conversion     |
| `invoice_card`    | Invoice / receipt display             |
| `chart_gauge`     | Budget utilization gauge              |

---

### 12 — Device & Sensor Widgets

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `device_list`     | All paired devices + status           |
| `sensor_dashboard`| Camera / mic / temp readings          |
| `device_status_panel` | Online/offline + heartbeat        |
| `camera_feed`     | Live camera frame feed                |
| `privacy_control` | Privacy mode toggle per node          |

---

### 13 — Permission & Access Widgets

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `role_manager`    | Assign / revoke roles                 |
| `privacy_control` | Node visibility control               |
| `permission_matrix` | Matrix view of subject × action     |
| `audit_log`       | Immutable read-only action history    |

---

### 14 — Builder / Customization Panel Widgets

These widgets only appear in the builder UI.

| Widget Type       | Use Case                              |
|-------------------|---------------------------------------|
| `color_picker`    | Choose theme colors                   |
| `layout_editor`   | Adjust grid structure                 |
| `language_selector` | Change UI language                  |
| `widget_settings_panel` | Modify all widget props          |
| `template_library`  | Saved/published layout templates     |
| `marketplace_browser` | Browse and install marketplace widgets |

---

## Example Screens

### Sales Dashboard (ERP)
```
grid_layout
  ├── kpi_card        (Revenue)
  ├── kpi_card        (Orders)
  ├── kpi_card        (Active users)
  ├── chart_line      (Sales trend)
  ├── table           (Inventory)
  └── feed            (Order feed)
```

### Social Media Feed (Vanshawali)
```
profile_header
post_composer
feed
  └── comment_thread
      └── reaction_bar
```

### Game Screen
```
canvas
  └── sprite[]
scoreboard
game_controls
game_timer
```

### AI Assistant Dashboard
```
ai_chat
activity_feed
stat_card[]
search_bar
quick_actions
```

### Workflow Builder
```
node_canvas
  └── trigger_panel
      └── logic_gate
          └── action_button
status_indicator
step_list
```

---

## Widget Marketplace

Users can publish widgets to the NodeOS marketplace.  
Marketplace is powered by **Dravyam** payments.

Widget listing metadata:
```json
{
  "widget_type": "custom_sales_chart",
  "name": "Advanced Sales Chart",
  "creator_id": "<owner_nid_hash>",
  "price_inr": 299,
  "royalty_pct": 10,
  "installs": 0,
  "rating": 0,
  "version": "1.0.0",
  "platforms": ["dravyam", "erp"],
  "preview_url": "...",
  "published_at": "..."
}
```

---

## Builder UI Philosophy

The NodeOS builder follows **n8n + Notion + Elementor** principles:

| Feature              | Implementation                          |
|----------------------|-----------------------------------------|
| Drag widget          | `DragDropState` + grid snap             |
| Connect data         | `data_source` → node nid_hash           |
| Add action           | `actions[]` → kernel `runNode` call     |
| Test execution       | Preview mode with mock node data        |
| Save template        | `saveLayout()` → draft                  |
| Publish              | `publishLayout()` → active broadcast    |
| Share / sell         | Marketplace listing via Dravyam         |

---

## Data Binding Model

Every widget can bind to any node:
```
widget.data_source = "<nid_hash>"
  → kernel fetches node
  → permission check (perm_blob)
  → widget receives JSON payload
  → renders bound fields
```

Field path syntax: `node.data_blob.<field>` or `node.runtime_blob.state.<key>`

---

## Action Binding Model

```
widget.actions = [
  {
    "trigger": "click",
    "node_id": "system.action",
    "action_type": "run_workflow",
    "payload": {}
  }
]
```

On trigger → `runNode({ nodeId, actorId, deviceId })` → kernel pipeline executes.

---

## Theming

Each widget supports a `style` prop:
```json
{
  "background": "#ffffff",
  "border_radius": 8,
  "border_color": "#e2e8f0",
  "text_color": "#1a202c",
  "accent_color": "#6366f1",
  "font_size": 14,
  "padding": 16,
  "shadow": "sm",
  "animation": "fade-in"
}
```

---

## i18n Support

```json
{
  "labels": {
    "en": { "title": "Sales Overview" },
    "hi": { "title": "बिक्री सारांश" },
    "ta": { "title": "விற்பனை மேலோட்டம்" }
  }
}
```
