import { randomUUID } from "node:crypto";
import type {
  CustomizationLayout,
  GridLayout,
  Platform,
  WidgetCatalogueEntry,
  WidgetCategory,
  WidgetConfig,
  WidgetType,
  SaveLayoutRequest,
  WidgetConfigFull,
  TemplateLibraryEntry,
} from "../shared/types/customization.types.js";

// ─── In-memory layout store ───────────────────────────────────────────────────
const layouts = new Map<string, CustomizationLayout>(); // `${owner_id}:${platform}` → layout
const publishedLayouts = new Map<string, CustomizationLayout>(); // same key, active version
const templateLibrary = new Map<string, TemplateLibraryEntry>();

// ─── All-Platform Shorthand ───────────────────────────────────────────────────
const ALL_PLATFORMS: Platform[] = [
  "vanshawali", "dravyam", "ai_dashboard", "admin", "device_hub",
  "social", "erp", "game", "workflow",
];

function forPlatforms(...p: Platform[]): Platform[] { return p; }

// ─── Complete Universal Widget Catalogue ──────────────────────────────────────
const WIDGET_CATALOGUE: WidgetCatalogueEntry[] = [

  // ── Layout ────────────────────────────────────────────────────────────────
  { widget_type: "container",      label: "Container",      description: "Flex/grid container for grouping widgets", default_size: "full", default_props: { direction: "row", gap: 16, padding: 16 }, platforms: ALL_PLATFORMS, icon: "box", category: "layout" },
  { widget_type: "grid_layout",    label: "Grid Layout",    description: "Responsive column grid for dashboards", default_size: "full", default_props: { columns: 12, gap: 16 }, platforms: ALL_PLATFORMS, icon: "layout-grid", category: "layout" },
  { widget_type: "tab_container",  label: "Tab Container",  description: "Multi-page tab navigation area", default_size: "full", default_props: { tabs: [], active_tab: 0 }, platforms: ALL_PLATFORMS, icon: "panel-top", category: "layout" },
  { widget_type: "accordion",      label: "Accordion",      description: "Expandable collapsible sections", default_size: "full", default_props: { sections: [], allow_multiple: false }, platforms: ALL_PLATFORMS, icon: "chevrons-down", category: "layout" },
  { widget_type: "split_panel",    label: "Split Panel",    description: "Resizable left/right or top/bottom panels", default_size: "full", default_props: { orientation: "horizontal", ratio: 50 }, platforms: ALL_PLATFORMS, icon: "columns", category: "layout" },
  { widget_type: "modal",          label: "Modal",          description: "Overlay dialog triggered by action", default_size: "md", default_props: { title: "Dialog", closable: true }, platforms: ALL_PLATFORMS, icon: "maximize", category: "layout" },
  { widget_type: "drawer",         label: "Drawer",         description: "Slide-in side panel", default_size: "md", default_props: { side: "right", width: 400 }, platforms: ALL_PLATFORMS, icon: "sidebar", category: "layout" },
  { widget_type: "sticky_header",  label: "Sticky Header",  description: "Fixed top navigation bar", default_size: "full", default_props: { show_logo: true, show_search: true }, platforms: ALL_PLATFORMS, icon: "navigation", category: "layout" },

  // ── Data Display ──────────────────────────────────────────────────────────
  { widget_type: "table",          label: "Table",          description: "Sortable, filterable, paginated data table", default_size: "full", default_props: { page_size: 20, sortable: true, filterable: true }, platforms: ALL_PLATFORMS, icon: "table", category: "data_display" },
  { widget_type: "list",           label: "List",           description: "Vertical item feed", default_size: "lg", default_props: { max_items: 50 }, platforms: ALL_PLATFORMS, icon: "list", category: "data_display" },
  { widget_type: "card",           label: "Card",           description: "Flexible data card", default_size: "md", default_props: { show_border: true }, platforms: ALL_PLATFORMS, icon: "credit-card", category: "data_display" },
  { widget_type: "timeline",       label: "Timeline",       description: "Chronological event stream", default_size: "lg", default_props: { direction: "vertical" }, platforms: forPlatforms("vanshawali", "social", "admin"), icon: "git-commit", category: "data_display" },
  { widget_type: "tree_view",      label: "Tree View",      description: "Hierarchical node tree", default_size: "lg", default_props: { expandable: true }, platforms: forPlatforms("admin", "vanshawali", "erp"), icon: "git-merge", category: "data_display" },
  { widget_type: "json_viewer",    label: "JSON Viewer",    description: "Pretty-print raw node state", default_size: "lg", default_props: { collapsible: true }, platforms: forPlatforms("admin"), icon: "braces", category: "data_display" },
  { widget_type: "badge",          label: "Badge",          description: "Status pill / label", default_size: "xs", default_props: { text: "Active", color: "green" }, platforms: ALL_PLATFORMS, icon: "tag", category: "data_display" },
  { widget_type: "avatar",         label: "Avatar",         description: "User avatar with status ring", default_size: "xs", default_props: { size: 40, show_status: true }, platforms: ALL_PLATFORMS, icon: "user", category: "data_display" },

  // ── Analytics ─────────────────────────────────────────────────────────────
  { widget_type: "kpi_card",       label: "KPI Card",       description: "Single metric with trend arrow", default_size: "sm", default_props: { metric: "revenue", format: "currency", show_trend: true }, platforms: forPlatforms("dravyam", "erp", "admin", "ai_dashboard"), icon: "trending-up", category: "analytics" },
  { widget_type: "stat_card",      label: "Stat Card",      description: "Icon + value + sub-label", default_size: "sm", default_props: { metric: "users", format: "number" }, platforms: ALL_PLATFORMS, icon: "bar-chart-2", category: "analytics" },
  { widget_type: "chart_line",     label: "Line Chart",     description: "Time-series line chart", default_size: "lg", default_props: { x_field: "date", y_field: "value", smooth: true }, platforms: forPlatforms("dravyam", "erp", "admin", "ai_dashboard", "vanshawali"), icon: "trending-up", category: "analytics" },
  { widget_type: "chart_bar",      label: "Bar Chart",      description: "Category bar chart", default_size: "lg", default_props: { x_field: "category", y_field: "value", stacked: false }, platforms: forPlatforms("dravyam", "erp", "admin", "ai_dashboard"), icon: "bar-chart", category: "analytics" },
  { widget_type: "chart_pie",      label: "Pie Chart",      description: "Distribution pie/donut chart", default_size: "md", default_props: { donut: false }, platforms: forPlatforms("dravyam", "erp", "admin", "ai_dashboard"), icon: "pie-chart", category: "analytics" },
  { widget_type: "chart_gauge",    label: "Gauge Chart",    description: "Radial gauge for goal/utilization", default_size: "sm", default_props: { min: 0, max: 100, value: 0, unit: "%" }, platforms: ALL_PLATFORMS, icon: "gauge", category: "analytics" },
  { widget_type: "chart_area",     label: "Area Chart",     description: "Stacked area chart", default_size: "lg", default_props: { stacked: true, filled: true }, platforms: forPlatforms("dravyam", "erp", "admin"), icon: "activity", category: "analytics" },
  { widget_type: "heatmap",        label: "Heatmap",        description: "Matrix heatmap", default_size: "lg", default_props: { color_scale: "blue" }, platforms: forPlatforms("admin", "erp"), icon: "grid", category: "analytics" },
  { widget_type: "sparkline",      label: "Sparkline",      description: "Inline mini line chart", default_size: "xs", default_props: { width: 80 }, platforms: ALL_PLATFORMS, icon: "activity", category: "analytics" },

  // ── Input / Form ──────────────────────────────────────────────────────────
  { widget_type: "text_input",     label: "Text Input",     description: "Standard text field", default_size: "md", default_props: { placeholder: "Enter text…", required: false }, platforms: ALL_PLATFORMS, icon: "type", category: "input" },
  { widget_type: "number_input",   label: "Number Input",   description: "Numeric field with validation", default_size: "sm", default_props: { min: 0, max: null, step: 1 }, platforms: ALL_PLATFORMS, icon: "hash", category: "input" },
  { widget_type: "dropdown_select",label: "Dropdown Select",description: "Single select from enum_node source", default_size: "md", default_props: { options: [], searchable: true }, platforms: ALL_PLATFORMS, icon: "chevron-down", category: "input" },
  { widget_type: "multi_select",   label: "Multi Select",   description: "Multi-value select", default_size: "md", default_props: { options: [], max_selection: null }, platforms: ALL_PLATFORMS, icon: "check-square", category: "input" },
  { widget_type: "date_picker",    label: "Date Picker",    description: "Calendar date input", default_size: "md", default_props: { format: "YYYY-MM-DD", range: false }, platforms: ALL_PLATFORMS, icon: "calendar", category: "input" },
  { widget_type: "file_upload",    label: "File Upload",    description: "Document / image upload", default_size: "md", default_props: { accept: "*/*", max_size_mb: 10, multiple: false }, platforms: ALL_PLATFORMS, icon: "upload", category: "input" },
  { widget_type: "signature_pad",  label: "Signature Pad",  description: "Capture digital signature", default_size: "md", default_props: { stroke_color: "#000000" }, platforms: forPlatforms("vanshawali", "dravyam", "erp"), icon: "pen-tool", category: "input" },
  { widget_type: "toggle",         label: "Toggle",         description: "Boolean on/off switch", default_size: "xs", default_props: { label: "Enable" }, platforms: ALL_PLATFORMS, icon: "toggle-left", category: "input" },
  { widget_type: "slider",         label: "Slider",         description: "Range input", default_size: "md", default_props: { min: 0, max: 100, step: 1 }, platforms: ALL_PLATFORMS, icon: "sliders", category: "input" },
  { widget_type: "color_picker",   label: "Color Picker",   description: "Theme color selection", default_size: "sm", default_props: { default_color: "#6366f1" }, platforms: ALL_PLATFORMS, icon: "palette", category: "input" },
  { widget_type: "search_bar",     label: "Search Bar",     description: "Full-text semantic search", default_size: "md", default_props: { placeholder: "Search…", scope: "all" }, platforms: ALL_PLATFORMS, icon: "search", category: "input" },
  { widget_type: "rich_text",      label: "Rich Text Editor",description: "WYSIWYG text editor", default_size: "full", default_props: { toolbar: ["bold","italic","link","image"] }, platforms: forPlatforms("vanshawali", "social", "erp"), icon: "edit-3", category: "input" },
  { widget_type: "code_editor",    label: "Code Editor",    description: "JS / Python / JSON code input", default_size: "full", default_props: { language: "javascript", theme: "dark" }, platforms: forPlatforms("admin", "workflow", "game"), icon: "code", category: "input" },

  // ── Social Media ──────────────────────────────────────────────────────────
  { widget_type: "post_composer",  label: "Post Composer",  description: "Create text / image / video / poll posts", default_size: "lg", default_props: { allow_image: true, allow_video: true, allow_poll: true }, platforms: forPlatforms("vanshawali", "social"), icon: "edit", category: "social" },
  { widget_type: "feed",           label: "Feed",           description: "Infinite scroll post feed", default_size: "full", default_props: { page_size: 10, show_reactions: true }, platforms: forPlatforms("vanshawali", "social", "ai_dashboard"), icon: "rss", category: "social" },
  { widget_type: "comment_thread", label: "Comment Thread", description: "Nested reply threads", default_size: "lg", default_props: { max_depth: 5 }, platforms: forPlatforms("vanshawali", "social"), icon: "message-square", category: "social" },
  { widget_type: "reaction_bar",   label: "Reaction Bar",   description: "Like / love / clap reactions", default_size: "xs", default_props: { reactions: ["like","love","clap","wow"] }, platforms: forPlatforms("vanshawali", "social"), icon: "heart", category: "social" },
  { widget_type: "profile_header", label: "Profile Header", description: "Cover + avatar + bio + stats", default_size: "full", default_props: { show_cover: true, show_stats: true }, platforms: forPlatforms("vanshawali", "social"), icon: "user-check", category: "social" },
  { widget_type: "profile_card",   label: "Profile Card",   description: "Compact user card with karma", default_size: "md", default_props: { show_karma: true, show_avatar: true }, platforms: forPlatforms("vanshawali", "social", "ai_dashboard"), icon: "user-circle", category: "social" },
  { widget_type: "follow_button",  label: "Follow Button",  description: "Follow / unfollow action button", default_size: "xs", default_props: { target_id: null }, platforms: forPlatforms("vanshawali", "social"), icon: "user-plus", category: "social" },
  { widget_type: "hashtag_cloud",  label: "Hashtag Cloud",  description: "Tag discovery cloud", default_size: "md", default_props: { max_tags: 30 }, platforms: forPlatforms("vanshawali", "social"), icon: "hash", category: "social" },
  { widget_type: "story_ring",     label: "Story Ring",     description: "Story / highlight bubbles", default_size: "sm", default_props: { size: 56 }, platforms: forPlatforms("vanshawali", "social"), icon: "circle", category: "social" },

  // ── Communication ─────────────────────────────────────────────────────────
  { widget_type: "chat_window",    label: "Chat Window",    description: "Real-time 1:1 / group messaging", default_size: "lg", default_props: { show_attachments: true, show_voice: false }, platforms: forPlatforms("vanshawali", "social", "device_hub", "admin"), icon: "message-circle", category: "communication" },
  { widget_type: "ai_chat",        label: "AI Chat",        description: "Embedded AI assistant", default_size: "md", default_props: { placeholder: "Ask anything…", max_history: 50 }, platforms: ALL_PLATFORMS, icon: "cpu", category: "communication" },
  { widget_type: "contact_list",   label: "Contact List",   description: "User directory", default_size: "md", default_props: { searchable: true }, platforms: forPlatforms("vanshawali", "social", "admin"), icon: "users", category: "communication" },
  { widget_type: "notification_panel", label: "Notification Panel", description: "Alerts and system messages", default_size: "md", default_props: { max_items: 10 }, platforms: ALL_PLATFORMS, icon: "bell", category: "communication" },
  { widget_type: "inbox",          label: "Inbox",          description: "Email-style message inbox", default_size: "full", default_props: { show_labels: true }, platforms: forPlatforms("vanshawali", "social", "erp"), icon: "inbox", category: "communication" },
  { widget_type: "voice_call",     label: "Voice Call",     description: "Audio call UI", default_size: "md", default_props: { show_mute: true }, platforms: forPlatforms("vanshawali", "device_hub"), icon: "phone", category: "communication" },

  // ── Workflow / Automation ─────────────────────────────────────────────────
  { widget_type: "node_canvas",    label: "Node Canvas",    description: "Visual workflow editor (drag + connect)", default_size: "full", default_props: { snap_to_grid: true, zoom: 1 }, platforms: forPlatforms("workflow", "admin", "ai_dashboard"), icon: "share-2", category: "workflow" },
  { widget_type: "action_button",  label: "Action Button",  description: "Triggers a kernel action on click", default_size: "xs", default_props: { label: "Run", node_id: null, action_type: "emit_log" }, platforms: ALL_PLATFORMS, icon: "play", category: "workflow" },
  { widget_type: "status_indicator", label: "Status Indicator", description: "Shows workflow / node task state", default_size: "xs", default_props: { state: "idle" }, platforms: ALL_PLATFORMS, icon: "circle", category: "workflow" },
  { widget_type: "trigger_panel",  label: "Trigger Panel",  description: "Configure workflow trigger conditions", default_size: "md", default_props: { trigger_types: ["cron","event","webhook"] }, platforms: forPlatforms("workflow", "admin"), icon: "zap", category: "workflow" },
  { widget_type: "step_list",      label: "Step List",      description: "Ordered automation step display", default_size: "md", default_props: { steps: [] }, platforms: forPlatforms("workflow", "ai_dashboard"), icon: "list-ordered", category: "workflow" },
  { widget_type: "logic_gate",     label: "Logic Gate",     description: "Condition / branch node", default_size: "sm", default_props: { condition: null }, platforms: forPlatforms("workflow", "admin"), icon: "git-branch", category: "workflow" },

  // ── Developer ─────────────────────────────────────────────────────────────
  { widget_type: "terminal",       label: "Terminal",       description: "CMD terminal widget", default_size: "lg", default_props: { theme: "dark" }, platforms: forPlatforms("admin", "device_hub"), icon: "terminal", category: "developer" },
  { widget_type: "api_console",    label: "API Console",    description: "REST API test console", default_size: "full", default_props: { base_url: "" }, platforms: forPlatforms("admin"), icon: "code-2", category: "developer" },
  { widget_type: "node_inspector", label: "Node Inspector", description: "Raw node state viewer", default_size: "lg", default_props: { editable: false }, platforms: forPlatforms("admin"), icon: "layers", category: "developer" },
  { widget_type: "json_editor",    label: "JSON Editor",    description: "Editable JSON field", default_size: "lg", default_props: { schema: null }, platforms: forPlatforms("admin", "workflow"), icon: "braces", category: "developer" },
  { widget_type: "log_viewer",     label: "Log Viewer",     description: "Real-time event log stream", default_size: "full", default_props: { max_lines: 200, filter: "" }, platforms: forPlatforms("admin", "device_hub"), icon: "scroll", category: "developer" },
  { widget_type: "diff_viewer",    label: "Diff Viewer",    description: "State change diff view", default_size: "full", default_props: { syntax_highlight: true }, platforms: forPlatforms("admin"), icon: "git-diff", category: "developer" },

  // ── Media ─────────────────────────────────────────────────────────────────
  { widget_type: "image_viewer",   label: "Image Viewer",   description: "Zoom, gallery, lightbox", default_size: "md", default_props: { zoom: true }, platforms: ALL_PLATFORMS, icon: "image", category: "media" },
  { widget_type: "video_player",   label: "Video Player",   description: "Embedded video playback", default_size: "lg", default_props: { autoplay: false, controls: true }, platforms: ALL_PLATFORMS, icon: "video", category: "media" },
  { widget_type: "audio_player",   label: "Audio Player",   description: "Audio file player", default_size: "sm", default_props: { show_waveform: false }, platforms: ALL_PLATFORMS, icon: "music", category: "media" },
  { widget_type: "media_gallery",  label: "Media Gallery",  description: "Grid photo / video gallery", default_size: "full", default_props: { columns: 3 }, platforms: forPlatforms("vanshawali", "social", "erp"), icon: "image", category: "media" },
  { widget_type: "document_viewer",label: "Document Viewer",description: "PDF / doc preview", default_size: "full", default_props: { type: "pdf" }, platforms: forPlatforms("erp", "admin", "vanshawali"), icon: "file-text", category: "media" },

  // ── Game ──────────────────────────────────────────────────────────────────
  { widget_type: "canvas",         label: "Canvas",         description: "HTML5 canvas for 2D games / drawing", default_size: "full", default_props: { width: 800, height: 600, fps: 60 }, platforms: forPlatforms("game"), icon: "square", category: "game" },
  { widget_type: "sprite",         label: "Sprite",         description: "Animated game character", default_size: "xs", default_props: { src: null, frames: 1, fps: 12 }, platforms: forPlatforms("game"), icon: "move", category: "game" },
  { widget_type: "physics",        label: "Physics Engine", description: "Game physics component", default_size: "xs", default_props: { gravity: 9.8, friction: 0.1 }, platforms: forPlatforms("game"), icon: "zap", category: "game" },
  { widget_type: "scoreboard",     label: "Scoreboard",     description: "Leaderboard / high score table", default_size: "md", default_props: { max_entries: 10 }, platforms: forPlatforms("game", "vanshawali"), icon: "trophy", category: "game" },
  { widget_type: "game_controls",  label: "Game Controls",  description: "D-pad / button controller", default_size: "md", default_props: { layout: "dpad" }, platforms: forPlatforms("game"), icon: "gamepad-2", category: "game" },
  { widget_type: "game_timer",     label: "Game Timer",     description: "Countdown / stopwatch", default_size: "sm", default_props: { mode: "countdown", seconds: 60 }, platforms: forPlatforms("game"), icon: "timer", category: "game" },

  // ── Financial ─────────────────────────────────────────────────────────────
  { widget_type: "wallet_card",    label: "Wallet Card",    description: "Balance display with currency", default_size: "sm", default_props: { currency: "INR" }, platforms: forPlatforms("dravyam", "vanshawali", "ai_dashboard"), icon: "credit-card", category: "finance" },
  { widget_type: "wallet_summary", label: "Wallet Summary", description: "Balance + hold + recent transactions", default_size: "md", default_props: { currency: "INR", show_chart: false }, platforms: forPlatforms("dravyam", "ai_dashboard"), icon: "wallet", category: "finance" },
  { widget_type: "transaction_list",label:"Transaction List",description: "Paginated transaction history", default_size: "lg", default_props: { page_size: 10, show_status: true }, platforms: forPlatforms("dravyam", "ai_dashboard", "erp"), icon: "list", category: "finance" },
  { widget_type: "payment_button", label: "Payment Button", description: "Trigger Dravyam payment flow", default_size: "xs", default_props: { label: "Pay Now", amount: 0, currency: "INR" }, platforms: forPlatforms("dravyam", "vanshawali", "erp"), icon: "credit-card", category: "finance" },
  { widget_type: "currency_converter", label: "Currency Converter", description: "Multi-currency live conversion", default_size: "sm", default_props: { from: "INR", to: "USD" }, platforms: forPlatforms("dravyam", "erp"), icon: "refresh-cw", category: "finance" },
  { widget_type: "invoice_card",   label: "Invoice Card",   description: "Invoice / receipt display", default_size: "md", default_props: { show_items: true }, platforms: forPlatforms("dravyam", "erp"), icon: "file-text", category: "finance" },

  // ── Device & Sensor ───────────────────────────────────────────────────────
  { widget_type: "device_list",    label: "Device Manager", description: "All paired devices with status", default_size: "md", default_props: { show_last_seen: true }, platforms: forPlatforms("device_hub", "admin"), icon: "cpu", category: "device" },
  { widget_type: "sensor_dashboard", label: "Sensor Dashboard", description: "Camera / mic / temp readings", default_size: "lg", default_props: { sensors: ["camera","mic"] }, platforms: forPlatforms("device_hub"), icon: "radio", category: "device" },
  { widget_type: "device_status_panel", label: "Device Status Panel", description: "Online/offline + heartbeat", default_size: "sm", default_props: { show_heartbeat: true }, platforms: forPlatforms("device_hub", "admin"), icon: "wifi", category: "device" },
  { widget_type: "camera_feed",    label: "Camera Feed",    description: "Live camera frame feed", default_size: "lg", default_props: { show_privacy_overlay: true }, platforms: forPlatforms("device_hub"), icon: "camera", category: "device" },
  { widget_type: "privacy_control",label: "Privacy Control",description: "Privacy mode toggle per node", default_size: "sm", default_props: { modes: ["public","protected","private","stealth"] }, platforms: ALL_PLATFORMS, icon: "shield", category: "device" },

  // ── Permission ────────────────────────────────────────────────────────────
  { widget_type: "role_manager",   label: "Role Manager",   description: "Assign / revoke roles", default_size: "lg", default_props: { editable: true }, platforms: forPlatforms("admin", "erp"), icon: "shield-check", category: "permission" },
  { widget_type: "permission_matrix", label: "Permission Matrix", description: "Matrix view of subject × action", default_size: "full", default_props: {}, platforms: forPlatforms("admin"), icon: "grid", category: "permission" },
  { widget_type: "audit_log",      label: "Audit Log",      description: "Immutable read-only action history", default_size: "full", default_props: { page_size: 50 }, platforms: forPlatforms("admin", "erp"), icon: "clipboard-list", category: "permission" },

  // ── Builder-only ──────────────────────────────────────────────────────────
  { widget_type: "layout_editor",  label: "Layout Editor",  description: "Adjust grid structure in builder", default_size: "full", default_props: {}, platforms: forPlatforms("admin"), icon: "layout", category: "builder" },
  { widget_type: "language_selector", label: "Language Selector", description: "Change UI language", default_size: "xs", default_props: { languages: ["en","hi","ta"] }, platforms: ALL_PLATFORMS, icon: "globe", category: "builder" },
  { widget_type: "widget_settings_panel", label: "Widget Settings", description: "Modify all widget props in builder", default_size: "md", default_props: {}, platforms: forPlatforms("admin"), icon: "settings", category: "builder" },
  { widget_type: "template_library", label: "Template Library", description: "Saved layout templates", default_size: "full", default_props: {}, platforms: forPlatforms("admin"), icon: "book-open", category: "builder" },
  { widget_type: "marketplace_browser", label: "Marketplace", description: "Browse and install marketplace widgets", default_size: "full", default_props: {}, platforms: forPlatforms("admin"), icon: "store", category: "builder" },

  // ── Misc / Profile ────────────────────────────────────────────────────────
  { widget_type: "karma_meter",    label: "Karma Meter",    description: "Visual karma score with reputation badge", default_size: "sm", default_props: { animated: true }, platforms: forPlatforms("vanshawali", "ai_dashboard"), icon: "star", category: "profile" },
  { widget_type: "activity_feed",  label: "Activity Feed",  description: "Live stream of user and system events", default_size: "lg", default_props: { max_items: 20 }, platforms: forPlatforms("vanshawali","dravyam","ai_dashboard","admin","erp"), icon: "activity", category: "misc" },
  { widget_type: "quick_actions",  label: "Quick Actions",  description: "Row of primary CTA buttons", default_size: "sm", default_props: { actions: [] }, platforms: ALL_PLATFORMS, icon: "zap", category: "misc" },
  { widget_type: "onboarding_steps", label: "Onboarding Steps", description: "Step-by-step onboarding progress", default_size: "md", default_props: { completed_steps: [] }, platforms: forPlatforms("vanshawali","erp"), icon: "check-circle", category: "profile" },
  { widget_type: "custom_html",    label: "Custom HTML",    description: "Embed raw HTML / web component", default_size: "md", default_props: { html: "<p>Hello NodeOS</p>", sandbox: true }, platforms: ALL_PLATFORMS, icon: "code", category: "misc" },
];

// ─── Default Layouts per Platform ────────────────────────────────────────────

function defaultGrid(platform: Platform): GridLayout {
  const typeMap: Partial<Record<Platform, WidgetType[]>> = {
    vanshawali:   ["profile_card", "karma_meter", "activity_feed", "onboarding_steps", "quick_actions"],
    dravyam:      ["wallet_summary", "transaction_list", "kpi_card", "payment_button"],
    ai_dashboard: ["ai_chat", "activity_feed", "stat_card", "search_bar", "node_canvas"],
    admin:        ["stat_card", "activity_feed", "device_list", "node_inspector", "audit_log"],
    device_hub:   ["device_list", "sensor_dashboard", "camera_feed", "ai_chat"],
    social:       ["profile_header", "post_composer", "feed", "reaction_bar"],
    erp:          ["kpi_card", "chart_line", "table", "activity_feed"],
    game:         ["canvas", "scoreboard", "game_controls", "game_timer"],
    workflow:     ["node_canvas", "trigger_panel", "step_list", "status_indicator"],
  };
  const types: WidgetType[] = typeMap[platform] ?? [];
  const widgets: WidgetConfig[] = types.map((wt, i) => {
    const cat = WIDGET_CATALOGUE.find((w) => w.widget_type === wt);
    return {
      widget_id: randomUUID(),
      widget_type: wt,
      label: cat?.label ?? wt,
      position: { col: (i % 2) * 6 + 1, row: Math.floor(i / 2) + 1, colSpan: 6, rowSpan: 2 },
      size: cat?.default_size ?? "md",
      props: { ...(cat?.default_props ?? {}) },
      visible: true,
      locked: false,
    };
  });
  return { layout_id: randomUUID(), platform, columns: 12, rows: 10, gap: 16, widgets };
}

// ─── Widget Execution Pipeline ────────────────────────────────────────────────

export interface WidgetRenderEvent {
  widget_id: string;
  widget_type: WidgetType;
  platform: Platform;
  owner_id: string;
  data_resolved: boolean;
  permissions_ok: boolean;
  rendered_at: string;
}

/** Simulate the widget execution pipeline: permission → data fetch → style → render */
export function executeWidgetPipeline(
  widget: WidgetConfigFull,
  ownerId: string,
  platform: Platform,
): WidgetRenderEvent {
  // 1. Permission check (simplified: permissions array must include owner or "*")
  const perms = widget.permissions ?? [];
  const permissions_ok = perms.length === 0 || perms.includes(ownerId) || perms.includes("*");

  // 2. Data binding check
  const data_resolved = !!(widget.data_binding ?? widget.props["data_source"] !== undefined);

  // 3. Log render event
  const event: WidgetRenderEvent = {
    widget_id: widget.widget_id,
    widget_type: widget.widget_type,
    platform,
    owner_id: ownerId,
    data_resolved,
    permissions_ok,
    rendered_at: new Date().toISOString(),
  };
  return event;
}

/** Execute all widgets in a layout and return render events */
export function executeLayoutPipeline(
  layout: CustomizationLayout,
  ownerId: string,
): WidgetRenderEvent[] {
  return layout.grid.widgets.map((w) =>
    executeWidgetPipeline(w as WidgetConfigFull, ownerId, layout.platform),
  );
}

// ─── Catalogue API ────────────────────────────────────────────────────────────

export function getWidgetCatalogue(platform?: Platform, category?: WidgetCategory): WidgetCatalogueEntry[] {
  let results = WIDGET_CATALOGUE;
  if (platform) results = results.filter((w) => w.platforms.includes(platform));
  if (category) results = results.filter((w) => w.category === category);
  return results;
}

export function getWidgetByType(type: WidgetType): WidgetCatalogueEntry | null {
  return WIDGET_CATALOGUE.find((w) => w.widget_type === type) ?? null;
}

// ─── Layout CRUD API ─────────────────────────────────────────────────────────

export function getDefaultLayout(ownerId: string, platform: Platform): CustomizationLayout {
  const key = `${ownerId}:${platform}`;
  return (
    publishedLayouts.get(key) ??
    layouts.get(key) ?? {
      layout_id: randomUUID(),
      owner_id: ownerId,
      platform,
      status: "draft",
      grid: defaultGrid(platform),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null,
    }
  );
}

export function saveLayout(req: SaveLayoutRequest): CustomizationLayout {
  const key = `${req.owner_id}:${req.platform}`;
  const existing = layouts.get(key);
  const now = new Date().toISOString();
  const layout: CustomizationLayout = {
    layout_id: existing?.layout_id ?? randomUUID(),
    owner_id: req.owner_id,
    platform: req.platform,
    status: "draft",
    grid: req.grid,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    published_at: existing?.published_at ?? null,
  };
  layouts.set(key, layout);
  return layout;
}

export function publishLayout(ownerId: string, platform: Platform): CustomizationLayout {
  const key = `${ownerId}:${platform}`;
  const draft = layouts.get(key);
  if (!draft) throw new Error(`No draft layout found for platform: ${platform}`);
  const now = new Date().toISOString();
  const active: CustomizationLayout = { ...draft, status: "active", published_at: now, updated_at: now };
  publishedLayouts.set(key, active);
  layouts.set(key, active);
  return active;
}

export function getActiveLayout(ownerId: string, platform: Platform): CustomizationLayout | null {
  return publishedLayouts.get(`${ownerId}:${platform}`) ?? null;
}

// ─── Template Library API ─────────────────────────────────────────────────────

export function saveTemplate(
  ownerId: string,
  name: string,
  description: string,
  platform: Platform,
  grid: GridLayout,
  isPublic = false,
): TemplateLibraryEntry {
  const entry: TemplateLibraryEntry = {
    template_id: randomUUID(),
    name,
    description,
    platform,
    owner_id: ownerId,
    grid,
    downloads: 0,
    created_at: new Date().toISOString(),
    is_public: isPublic,
  };
  templateLibrary.set(entry.template_id, entry);
  return entry;
}

export function getTemplates(
  platform?: Platform,
  publicOnly = true,
  ownerId?: string,
): TemplateLibraryEntry[] {
  return [...templateLibrary.values()].filter((t) => {
    if (platform && t.platform !== platform) return false;
    if (publicOnly && !t.is_public && t.owner_id !== ownerId) return false;
    return true;
  });
}

export function applyTemplate(
  templateId: string,
  ownerId: string,
): CustomizationLayout {
  const tmpl = templateLibrary.get(templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);
  tmpl.downloads += 1;
  return saveLayout({ owner_id: ownerId, platform: tmpl.platform, grid: { ...tmpl.grid, layout_id: randomUUID() } });
}
