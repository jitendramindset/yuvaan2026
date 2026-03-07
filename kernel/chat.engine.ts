import { randomUUID } from "node:crypto";
import { runNode } from "./kernel.engine.js";
import type {
  ChatMessage,
  ChatSession,
  ChatRequest,
  ChatResponse,
  ResolvedIntent,
  ChatIntentType,
  AutomationPlan,
  AutomationStep,
  WidgetRenderRequest,
  NavigationRequest,
} from "../shared/types/chat.types.js";

// ─── In-memory sessions ────────────────────────────────────────────────────────
const chatSessions = new Map<string, ChatSession>();

// ─── Intent Detection ─────────────────────────────────────────────────────────

const INTENT_PATTERNS: Array<{ pattern: RegExp; type: ChatIntentType }> = [
  { pattern: /show|render|display|open|load\s+(?:the\s+)?(\w+)\s+widget/i,   type: "render_widget" },
  { pattern: /go\s+to|navigate\s+to|open\s+(?:the\s+)?(\w+)\s+(?:page|screen|tab)/i, type: "navigate" },
  { pattern: /run|execute|trigger|start\s+(?:the\s+)?(\w+)/i,                type: "run_action" },
  { pattern: /what\s+is|tell\s+me|show\s+me|get|fetch|find\s+(?:my\s+)?(\w+)/i, type: "query_data" },
  { pattern: /automate|batch|sequence|workflow/i,                             type: "run_automation" },
  { pattern: /help|how\s+do\s+i|what\s+can\s+you|commands/i,                 type: "show_help" },
];

function detectIntent(message: string): ResolvedIntent {
  for (const { pattern, type } of INTENT_PATTERNS) {
    const match = pattern.exec(message);
    if (match) {
      return {
        type,
        confidence: 0.85,
        params: { raw_match: match[0], keyword: match[1] ?? null },
      };
    }
  }
  return { type: "unknown", confidence: 0.4, params: {} };
}

// ─── Intent Handlers ──────────────────────────────────────────────────────────

async function handleRenderWidget(
  intent: ResolvedIntent,
  session: ChatSession,
): Promise<{ reply: string; action_result: WidgetRenderRequest }> {
  const keyword = String(intent.params["keyword"] ?? "profile_card");
  const widgetReq: WidgetRenderRequest = {
    widget_type: keyword.toLowerCase().replace(/\s+/g, "_"),
    platform: session.platform,
    props: {},
  };
  return {
    reply: `Rendering **${widgetReq.widget_type}** on ${session.platform}. The widget has been added to your layout.`,
    action_result: widgetReq,
  };
}

function handleNavigate(
  intent: ResolvedIntent,
  session: ChatSession,
): { reply: string; action_result: NavigationRequest } {
  const keyword = String(intent.params["keyword"] ?? "dashboard");
  const navReq: NavigationRequest = {
    platform: session.platform,
    route: `/${keyword.toLowerCase().replace(/\s+/g, "-")}`,
    params: {},
  };
  return {
    reply: `Navigating to **${navReq.route}** on ${session.platform}.`,
    action_result: navReq,
  };
}

async function handleRunAction(
  intent: ResolvedIntent,
  session: ChatSession,
): Promise<{ reply: string; action_result: unknown }> {
  const keyword = String(intent.params["keyword"] ?? "system");
  try {
    const result = await runNode({
      nodeId: keyword,
      actorId: session.owner_id,
      deviceId: session.device_id,
    });
    return { reply: `Action **${keyword}** executed. Karma score: ${result.karmaScore ?? 0}.`, action_result: result };
  } catch {
    return { reply: `Could not run action **${keyword}**. Node may not exist.`, action_result: null };
  }
}

function handleQueryData(
  intent: ResolvedIntent,
  _session: ChatSession,
): { reply: string; action_result: unknown } {
  const keyword = String(intent.params["keyword"] ?? "data");
  return {
    reply: `Querying **${keyword}**. In a full implementation this would fetch live node data.`,
    action_result: { queried: keyword, status: "stub" },
  };
}

async function handleAutomation(
  _intent: ResolvedIntent,
  session: ChatSession,
): Promise<{ reply: string; action_result: AutomationPlan }> {
  const plan: AutomationPlan = {
    plan_id: randomUUID(),
    session_id: session.session_id,
    steps: [],
    created_at: new Date().toISOString(),
  };
  return {
    reply: "Automation plan created. Provide steps to execute (or use the /chat/automate endpoint for structured plans).",
    action_result: plan,
  };
}

export async function executeAutomationPlan(plan: AutomationPlan, actorId: string): Promise<unknown[]> {
  const results: unknown[] = [];
  for (const step of plan.steps) {
    try {
      const result = await runNode({
        nodeId: step.node_id,
        actorId,
        deviceId: undefined,
      });
      results.push({ step_id: step.step_id, ok: true, result });
    } catch (err) {
      results.push({ step_id: step.step_id, ok: false, error: err instanceof Error ? err.message : "unknown" });
    }
  }
  return results;
}

function handleHelp(): { reply: string } {
  return {
    reply: [
      "**NodeOS AI Dashboard** — things I can do:",
      "- *Show me the wallet widget* → renders a widget",
      "- *Go to the profile page* → navigates",
      "- *Run system node* → executes a kernel action",
      "- *What is my karma score* → queries data",
      "- *Automate sync workflow* → creates automation plan",
    ].join("\n"),
  };
}

// ─── Session Management ───────────────────────────────────────────────────────

function getOrCreateSession(req: ChatRequest): ChatSession {
  const existing = req.session_id ? chatSessions.get(req.session_id) : undefined;
  if (existing) {
    existing.last_active_at = new Date().toISOString();
    return existing;
  }
  const session: ChatSession = {
    session_id: randomUUID(),
    owner_id: req.owner_id,
    device_id: req.device_id,
    platform: req.platform,
    messages: [],
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  };
  chatSessions.set(session.session_id, session);
  return session;
}

export function getChatHistory(sessionId: string): ChatMessage[] {
  return chatSessions.get(sessionId)?.messages ?? [];
}

// ─── Main Processing ──────────────────────────────────────────────────────────

export async function processMessage(req: ChatRequest): Promise<ChatResponse> {
  const session = getOrCreateSession(req);
  const intent = detectIntent(req.message);

  // Append user message to history
  const userMsg: ChatMessage = {
    message_id: randomUUID(),
    session_id: session.session_id,
    role: "user",
    content: req.message,
    intent,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(userMsg);

  let reply = "I didn't understand that. Try asking me to show a widget, navigate somewhere, or run an action.";
  let action_result: unknown = undefined;

  switch (intent.type) {
    case "render_widget": {
      const r = await handleRenderWidget(intent, session);
      reply = r.reply; action_result = r.action_result; break;
    }
    case "navigate": {
      const r = handleNavigate(intent, session);
      reply = r.reply; action_result = r.action_result; break;
    }
    case "run_action": {
      const r = await handleRunAction(intent, session);
      reply = r.reply; action_result = r.action_result; break;
    }
    case "query_data": {
      const r = handleQueryData(intent, session);
      reply = r.reply; action_result = r.action_result; break;
    }
    case "run_automation": {
      const r = await handleAutomation(intent, session);
      reply = r.reply; action_result = r.action_result; break;
    }
    case "show_help": {
      reply = handleHelp().reply; break;
    }
  }

  const assistantMsg: ChatMessage = {
    message_id: randomUUID(),
    session_id: session.session_id,
    role: "assistant",
    content: reply,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(assistantMsg);

  return {
    message_id: assistantMsg.message_id,
    session_id: session.session_id,
    reply,
    intent,
    action_result,
    timestamp: assistantMsg.timestamp,
  };
}
