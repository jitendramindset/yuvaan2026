/**
 * Intent Parser — extracts machine-readable intent from a natural language
 * chat message.  This module is the canonical intent layer used by both the
 * chat.engine.ts (kernel-side) and the agent runtime (agents-side).
 *
 * Supported intents mirror the `ChatIntentType` in shared/types/chat.types.ts.
 */

export type IntentType =
  | "render_widget"
  | "navigate"
  | "run_action"
  | "query_data"
  | "create_node"
  | "create_workflow"
  | "social_connect"
  | "run_automation"
  | "show_help"
  | "open_file"
  | "unknown";

export interface ParsedIntent {
  type: IntentType;
  confidence: number;       // 0–1
  keyword: string | null;   // primary extracted entity
  params: Record<string, string | null>;
  raw: string;
}

// ── Pattern table ─────────────────────────────────────────────────────────────

const PATTERNS: Array<{ re: RegExp; type: IntentType }> = [
  // widget rendering
  { re: /\b(?:show|render|display|add|open|load)\s+(?:the\s+)?(\w[\w\s]*?)\s+widget\b/i,           type: "render_widget" },
  { re: /\badd\s+(?:a\s+)?(\w[\w\s]*?)\s+(?:chart|card|table|feed|dashboard)\b/i,                  type: "render_widget" },
  // navigation
  { re: /\b(?:go\s+to|navigate\s+to|open)\s+(?:the\s+)?(\w[\w\s]*?)(?:\s+page|\s+screen|\s+tab)?\b/i, type: "navigate" },
  // kernel action
  { re: /\b(?:run|execute|trigger|start)\s+(?:the\s+)?(\w[\w\s]*)\b/i,                             type: "run_action" },
  // node creation
  { re: /\bcreate\s+(?:a\s+|an\s+)?(\w[\w\s]*?)\s+node\b/i,                                        type: "create_node" },
  { re: /\bnew\s+(?:invoice|order|customer|employee|product|task|project)\b/i,                      type: "create_node" },
  // workflow creation
  { re: /\b(?:automate|schedule|when\s+.+?,?\s+(?:notify|send|run|create))\b/i,                     type: "create_workflow" },
  // social connect
  { re: /\bconnect\s+(?:my\s+)?(\w+)\s+account\b/i,                                                type: "social_connect" },
  // query / search
  { re: /\b(?:what\s+is|tell\s+me|show\s+me|get|fetch|find)\s+(?:my\s+)?(\w[\w\s]*)\b/i,           type: "query_data" },
  // file
  { re: /\bopen\s+(?:file|document)\s+([\w./\\-]+)\b/i,                                            type: "open_file" },
  // help
  { re: /\b(?:help|how\s+do\s+i|what\s+can\s+you|commands)\b/i,                                    type: "show_help" },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parse a chat message into a structured intent.
 */
export function parseIntent(message: string): ParsedIntent {
  const trimmed = message.trim();
  for (const { re, type } of PATTERNS) {
    const m = re.exec(trimmed);
    if (m) {
      const keyword = (m[1] ?? "").trim() || null;
      return {
        type,
        confidence: 0.85,
        keyword,
        params: { keyword, raw_match: m[0] },
        raw: trimmed,
      };
    }
  }
  return { type: "unknown", confidence: 0.3, keyword: null, params: {}, raw: trimmed };
}

/**
 * Extract a list of entity tokens (nouns / identifiers) from the message.
 */
export function extractEntities(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}
