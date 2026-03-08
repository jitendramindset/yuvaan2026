/**
 * Agent Runtime — the main entry point for Yunaan AI.
 *
 * Receives a chat message, extracts intent, invokes the kernel or tools,
 * logs the exchange to memory, and returns a structured response.
 *
 * Integration path:
 *   chat.interface.ts → agent.runtime.ts → kernel.engine.ts / tool.executor.ts
 */
import { parseIntent }       from "./intent.parser.js";
import { executeTool }       from "./tool.executor.js";
import { remember, logActivity } from "./memory.engine.js";
import { generateSuggestions }   from "./suggestion.engine.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentMessage {
  session_id: string;
  owner_id:   string;
  text:       string;
}

export interface AgentResponse {
  session_id:  string;
  reply:       string;
  intent_type: string;
  confidence:  number;
  action?:     Record<string, unknown>;
  suggestions?: Array<{ title: string; description: string }>;
}

// ── Intent → action map ───────────────────────────────────────────────────────

function buildReply(intentType: string, keyword: string | null): { reply: string; action: Record<string, unknown> } {
  switch (intentType) {
    case "render_widget":
      return {
        reply:  `Rendering **${keyword ?? "widget"}** on your dashboard.`,
        action: { type: "render_widget", widget_type: keyword?.toLowerCase().replace(/\s+/g, "_") ?? "card_widget" },
      };
    case "navigate":
      return {
        reply:  `Navigating to **/${keyword ?? "dashboard"}**.`,
        action: { type: "navigate", route: `/${keyword?.toLowerCase().replace(/\s+/g, "-") ?? "dashboard"}` },
      };
    case "run_action":
      return {
        reply:  `Running action: **${keyword ?? "task"}**.`,
        action: { type: "run_node", node_id: keyword ?? "system.root" },
      };
    case "create_node":
      return {
        reply:  `Creating a new **${keyword ?? "node"}**.`,
        action: { type: "create_node", node_type: keyword?.toLowerCase().replace(/\s+/g, "_") ?? "system" },
      };
    case "create_workflow":
      return {
        reply:  "I'll set up that workflow for you. You can review it in the Workflows section.",
        action: { type: "create_workflow" },
      };
    case "query_data":
      return {
        reply:  `Fetching **${keyword ?? "data"}** for you...`,
        action: { type: "query", keyword },
      };
    case "social_connect":
      return {
        reply:  `Connecting your **${keyword ?? "account"}**. You'll be redirected to the auth flow.`,
        action: { type: "social_connect", platform: keyword },
      };
    case "show_help":
      return {
        reply: [
          "Here's what I can do:",
          "• **Render widgets** — _show orders chart_",
          "• **Navigate** — _go to vanshawali_",
          "• **Run actions** — _execute invoice workflow_",
          "• **Create nodes** — _create a new product node_",
          "• **Query data** — _show my wallet balance_",
          "• **Connect accounts** — _connect my LinkedIn account_",
        ].join("\n"),
        action: { type: "show_help" },
      };
    default:
      return {
        reply:  "I'm not sure I understood that. Try asking for help to see what I can do.",
        action: { type: "unknown" },
      };
  }
}

// ── Main processor ────────────────────────────────────────────────────────────

export async function processMessage(msg: AgentMessage): Promise<AgentResponse> {
  const intent = parseIntent(msg.text);

  // Log to short-term + long-term memory
  const entry = {
    ts:          new Date().toISOString(),
    session_id:  msg.session_id,
    role:        "user" as const,
    content:     msg.text,
    intent_type: intent.type,
  };
  remember(entry);
  await logActivity(entry);

  // Special case: tool invocations embedded in the intent params
  if (intent.params["tool"]) {
    const result = await executeTool({
      name: String(intent.params["tool"]),
      args: intent.params,
    });
    return {
      session_id:  msg.session_id,
      intent_type: intent.type,
      confidence:  intent.confidence,
      reply:       result.success
        ? `Tool **${result.tool}** executed successfully.`
        : `Tool **${result.tool}** failed: ${result.error}`,
      action: { type: "tool_result", result },
    };
  }

  const { reply, action } = buildReply(intent.type, intent.keyword);

  // Optionally attach proactive suggestions
  let suggestions: Array<{ title: string; description: string }> | undefined;
  if (Math.random() < 0.25) {  // ~25 % chance to surface suggestions
    const raw = await generateSuggestions();
    if (raw.length > 0) {
      suggestions = raw.slice(0, 2).map((s) => ({ title: s.title, description: s.description }));
    }
  }

  return {
    session_id:  msg.session_id,
    intent_type: intent.type,
    confidence:  intent.confidence,
    reply,
    action,
    suggestions,
  };
}
