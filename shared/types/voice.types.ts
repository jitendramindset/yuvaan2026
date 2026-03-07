// ─── Voice Command System Types ──────────────────────────────────────────────

/** High-level intent categories for voice commands */
export type VoiceIntent =
  | "navigate"          // "go to sales dashboard", "open inventory"
  | "onboarding"        // "start onboarding", "I am a retailer"
  | "widget_request"    // "add a chart", "show revenue widget"
  | "action"            // "create order", "add product", "save"
  | "query"             // "show me sales this month", "how many employees"
  | "location"          // "share my location", "show people on map"
  | "social"            // "connect with family", "create a group"
  | "ai"                // "ask AI", "summarise activity"
  | "system"            // "lock screen", "logout", "settings"
  | "unknown";

/** Confidence level of a voice match */
export type VoiceConfidence = "high" | "medium" | "low";

/** A spoken command after normalisation (lowercase, punctuation stripped) */
export interface VoiceCommand {
  session_id: string;
  user_id:    string;
  raw_text:   string;          // original transcript
  normalised: string;          // lowercase, trimmed
  timestamp:  string;          // ISO-8601
  language:   string;          // e.g. "en-IN", "hi"
  device_id?: string;
}

/** Parsed result after intent matching */
export interface VoiceMatch {
  command:     VoiceCommand;
  intent:      VoiceIntent;
  confidence:  VoiceConfidence;
  /** Matched route — e.g. "/dashboard/sales", widget type, action name */
  target:      string;
  /** Extracted slots — e.g. { platform: "sales", chart_type: "bar" } */
  slots:       Record<string, string>;
  /** Spoken response the UI should deliver back to user */
  voice_reply: string;
}

/** Voice-driven navigation target */
export interface VoiceNavigation {
  destination: string;         // route path or platform key
  params:      Record<string, string>;
  push_state:  boolean;
}

/** Voice-driven widget creation request */
export interface VoiceWidgetRequest {
  widget_type: string;
  platform:    string;
  data_source?: string;
  position?:   "top" | "bottom" | "auto";
}

/** Voice session — tracks multi-turn context */
export interface VoiceSession {
  session_id:      string;
  user_id:         string;
  active:          boolean;
  current_intent:  VoiceIntent | null;
  /** Partial onboarding data collected through voice */
  onboarding_ctx:  Record<string, string>;
  /** History of the last 20 commands in this session */
  history:         VoiceMatch[];
  created_at:      string;
  last_active:     string;
}

/** Voice-profile for biometric voice authentication (future) */
export interface VoiceProfile {
  user_id:        string;
  enrolled:       boolean;
  fingerprint_id: string | null;
  created_at:     string;
}

/** Response the server sends back after processing a voice command */
export interface VoiceResponse {
  match:       VoiceMatch;
  action?:     VoiceNavigation | VoiceWidgetRequest | Record<string, unknown>;
  voice_reply: string;
  ui_event:    "navigate" | "add_widget" | "run_action" | "show_result" | "ask_user" | "none";
}
