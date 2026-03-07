// ─── Customization / Elementor-like Layout Types ────────────────────────────

export type WidgetSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

// ─── Complete Universal Widget Type Registry ──────────────────────────────────
export type WidgetType =
  // Layout
  | "container" | "grid_layout" | "tab_container" | "accordion" | "split_panel"
  | "modal" | "drawer" | "sticky_header"
  // Data Display
  | "table" | "list" | "card" | "timeline" | "tree_view"
  | "json_viewer" | "badge" | "avatar"
  // Analytics
  | "kpi_card" | "stat_card" | "chart_line" | "chart_bar" | "chart_pie"
  | "chart_gauge" | "chart_area" | "heatmap" | "sparkline"
  // Input / Form
  | "text_input" | "number_input" | "dropdown_select" | "multi_select"
  | "date_picker" | "file_upload" | "signature_pad" | "toggle" | "slider"
  | "color_picker" | "search_bar" | "rich_text" | "code_editor"
  // Social Media
  | "post_composer" | "feed" | "comment_thread" | "reaction_bar"
  | "profile_header" | "profile_card" | "follow_button"
  | "hashtag_cloud" | "story_ring"
  // Communication
  | "chat_window" | "ai_chat" | "contact_list" | "notification_panel"
  | "inbox" | "voice_call"
  // Workflow / Automation
  | "node_canvas" | "action_button" | "status_indicator"
  | "trigger_panel" | "step_list" | "logic_gate"
  // Developer
  | "terminal" | "api_console" | "node_inspector"
  | "json_editor" | "log_viewer" | "diff_viewer"
  // Media
  | "image_viewer" | "video_player" | "audio_player"
  | "media_gallery" | "document_viewer"
  // Game
  | "canvas" | "sprite" | "physics" | "scoreboard"
  | "game_controls" | "game_timer"
  // Financial
  | "wallet_card" | "wallet_summary" | "transaction_list" | "payment_button"
  | "currency_converter" | "invoice_card"
  // Device & Sensor
  | "device_list" | "sensor_dashboard" | "device_status_panel"
  | "camera_feed" | "privacy_control"
  // Permission
  | "role_manager" | "permission_matrix" | "audit_log"
  // Builder-Only
  | "layout_editor" | "language_selector" | "widget_settings_panel"
  | "template_library" | "marketplace_browser"
  // Misc (legacy + misc)
  | "karma_meter" | "activity_feed" | "quick_actions" | "onboarding_steps"
  | "custom_html";

export type WidgetCategory =
  | "layout" | "data_display" | "analytics" | "input" | "social"
  | "communication" | "workflow" | "developer" | "media" | "game"
  | "finance" | "device" | "permission" | "builder" | "profile" | "misc";

export type Platform =
  | "vanshawali" | "dravyam" | "ai_dashboard" | "admin" | "device_hub"
  | "social" | "erp" | "game" | "workflow";

export type LayoutStatus = "draft" | "active" | "archived";

export interface WidgetPosition {
  col: number;   // 1-12 grid column start
  row: number;   // row index
  colSpan: number;
  rowSpan: number;
}

export interface WidgetConfig {
  widget_id: string;            // UUID per placement
  widget_type: WidgetType;
  label: string;
  position: WidgetPosition;
  size: WidgetSize;
  props: Record<string, unknown>; // widget-specific config
  visible: boolean;
  locked: boolean;
}

export interface GridLayout {
  layout_id: string;
  platform: Platform;
  columns: number;              // default 12
  rows: number;
  gap: number;                  // px
  widgets: WidgetConfig[];
}

export interface CustomizationLayout {
  layout_id: string;
  owner_id: string;
  platform: Platform;
  status: LayoutStatus;
  grid: GridLayout;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface WidgetCatalogueEntry {
  widget_type: WidgetType;
  label: string;
  description: string;
  default_size: WidgetSize;
  default_props: Record<string, unknown>;
  platforms: Platform[];
  icon: string;
  category: WidgetCategory;
}

export interface DragDropState {
  active_widget_id: string | null;
  dragging: boolean;
  hover_cell: { col: number; row: number } | null;
}

export interface SaveLayoutRequest {
  owner_id: string;
  platform: Platform;
  grid: GridLayout;
}

export interface PublishLayoutRequest {
  owner_id: string;
  platform: Platform;
}

// ─── Widget Style (Theming) ───────────────────────────────────────────────────
export interface WidgetStyle {
  background?: string;
  border_radius?: number;
  border_color?: string;
  text_color?: string;
  accent_color?: string;
  font_size?: number;
  padding?: number;
  shadow?: "none" | "xs" | "sm" | "md" | "lg";
  animation?: "none" | "fade-in" | "slide-up" | "bounce" | "pulse";
}

// ─── i18n Labels ─────────────────────────────────────────────────────────────
export type LanguageCode = "en" | "hi" | "ta" | "te" | "mr" | "bn" | "gu" | "kn";
export type WidgetLabels = Partial<Record<LanguageCode, Record<string, string>>>;

// ─── Action Binding ───────────────────────────────────────────────────────────
export type ActionTrigger = "click" | "submit" | "change" | "mount" | "unmount" | "interval";

export interface WidgetActionBinding {
  trigger: ActionTrigger;
  node_id: string;              // kernel node to invoke
  action_type: string;          // kernel action (run_workflow, emit_log, etc.)
  payload?: Record<string, unknown>;
  debounce_ms?: number;
}

// ─── Data Binding ─────────────────────────────────────────────────────────────
export interface WidgetDataBinding {
  data_source: string;          // nid_hash of the source node
  field_path?: string;          // e.g. "runtime_blob.state.balance"
  refresh_ms?: number;          // polling interval (0 = static)
  transform?: string;           // JS expression applied to raw value
}

// ─── Extended Widget Config (with style, i18n, data/action bindings) ─────────
export interface WidgetConfigFull extends WidgetConfig {
  style?: WidgetStyle;
  labels?: WidgetLabels;
  data_binding?: WidgetDataBinding;
  action_bindings?: WidgetActionBinding[];
  children?: WidgetConfigFull[];  // nested widget support
  permissions?: string[];         // nid_hashes that can view this widget
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
export interface MarketplaceWidgetListing {
  listing_id: string;
  widget_type: string;           // may be a custom slug
  name: string;
  description: string;
  creator_id: string;            // owner nid_hash
  price_inr: number;             // 0 = free
  royalty_pct: number;           // 0-100
  installs: number;
  rating: number;                // 0–5
  version: string;
  platforms: Platform[];
  icon: string;
  category: WidgetCategory;
  preview_image?: string;
  published_at: string | null;
  updated_at: string;
  approved: boolean;
}

export interface MarketplaceInstall {
  install_id: string;
  listing_id: string;
  buyer_id: string;
  device_id?: string;
  installed_at: string;
  transaction_id?: string;       // Dravyam tx if paid
}

export interface TemplateLibraryEntry {
  template_id: string;
  name: string;
  description: string;
  platform: Platform;
  owner_id: string;
  grid: GridLayout;
  thumbnail?: string;
  downloads: number;
  created_at: string;
  is_public: boolean;
}
