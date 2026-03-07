// ─── AI Chat Engine Types ────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant" | "system";

export type ChatIntentType =
  | "render_widget"
  | "navigate"
  | "run_action"
  | "query_data"
  | "run_automation"
  | "show_help"
  | "unknown";

export interface ChatMessage {
  message_id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  intent?: ResolvedIntent;
  timestamp: string;
}

export interface ResolvedIntent {
  type: ChatIntentType;
  confidence: number;           // 0–1
  params: Record<string, unknown>;
}

export interface WidgetRenderRequest {
  widget_type: string;
  platform: string;
  props?: Record<string, unknown>;
  position?: { col: number; row: number };
}

export interface NavigationRequest {
  platform: string;
  route: string;
  params?: Record<string, unknown>;
}

export interface AutomationStep {
  step_id: string;
  action: string;               // kernel action type
  node_id: string;
  payload: Record<string, unknown>;
  depends_on?: string[];        // step_ids
}

export interface AutomationPlan {
  plan_id: string;
  session_id: string;
  steps: AutomationStep[];
  created_at: string;
}

export interface ChatSession {
  session_id: string;
  owner_id: string;
  device_id: string;
  platform: string;
  messages: ChatMessage[];
  created_at: string;
  last_active_at: string;
}

export interface ChatRequest {
  session_id?: string;
  owner_id: string;
  device_id: string;
  platform: string;
  message: string;
}

export interface ChatResponse {
  message_id: string;
  session_id: string;
  reply: string;
  intent: ResolvedIntent;
  action_result?: unknown;
  timestamp: string;
}
