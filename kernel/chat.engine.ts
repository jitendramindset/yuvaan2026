import { randomUUID } from "node:crypto";
import { runNode } from "./kernel.engine.js";
import { buildSystemPrompt, type SystemPromptContext } from "./system_prompt.engine.js";
import { chatCompletion, getActiveProvider, type AIMessage } from "./ai_provider.engine.js";
import { getConnectionTools } from "./connection.engine.js";
import { learnChatMessage, getMemorySummary } from "./learning.engine.js";
import { inferIntention, buildSafetySuggestions } from "./intention.engine.js";
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

  // ── Record learning event ────────────────────────────────────────────────
  learnChatMessage(req.owner_id, req.message, session.session_id);

  // ── Infer intention (danger check + context enrichment) ─────────────────
  const memorySummary = getMemorySummary(req.owner_id);
  const intention     = inferIntention({
    owner_id:       req.owner_id,
    message:        req.message,
    current_route:  (req as unknown as Record<string, unknown>)["current_route"] as string | undefined,
  });
  const safetySuggestions = buildSafetySuggestions(intention);

  // ── Build system prompt ──────────────────────────────────────────────────
  const promptCtx: SystemPromptContext = {
    ownerId:         req.owner_id,
    connectedTools:  getConnectionTools(req.owner_id),
    recentActivity:  memorySummary.recentActivity,
    incompleteTasks: memorySummary.incompleteTasks,
  };
  const systemPrompt = buildSystemPrompt(promptCtx);

  // ── Build AI message history (last 10 turns) ─────────────────────────────
  const historyMsgs: AIMessage[] = session.messages.slice(-10).map((m) => ({
    role:    m.role === "system" ? "system" : m.role,
    content: m.content,
  }));

  const aiMessages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...historyMsgs,
    { role: "user", content: req.message },
  ];

  // ── Append user message to session history ───────────────────────────────
  const detectedIntent = detectIntent(req.message);
  const userMsg: ChatMessage = {
    message_id: randomUUID(),
    session_id: session.session_id,
    role:       "user",
    content:    req.message,
    intent:     detectedIntent,
    timestamp:  new Date().toISOString(),
  };
  session.messages.push(userMsg);

  // ── Call AI (falls back to NodeOS built-in if no key) ────────────────────
  let aiResponseRaw = "{}";
  let parseError    = false;
  try {
    const provider   = getActiveProvider(req.owner_id);
    aiResponseRaw    = await chatCompletion(aiMessages, provider);
  } catch {
    parseError = true;
  }

  // ── Parse JSON response from AI ───────────────────────────────────────────
  interface AIJsonResponse {
    reply?:        string;
    intent?:       string;
    confidence?:   number;
    actions?:      Array<{ tool: string; params?: Record<string, unknown> }>;
    node_updates?: Array<{ node_id: string; patch: Record<string, unknown> }>;
    suggestions?:  string[];
    learning?:     string;
    karma_delta?:  number;
  }

  let parsed: AIJsonResponse = {};
  try {
    parsed = JSON.parse(aiResponseRaw) as AIJsonResponse;
  } catch {
    parseError = true;
  }

  const reply = parsed.reply
    ?? (parseError
      ? "I'm having trouble connecting to the AI right now. Check **Settings → AI Providers** to configure your key."
      : "I processed your request but got an unexpected response.");

  // ── Append safety suggestions to reply if danger detected ────────────────
  const fullReply = safetySuggestions.length > 0
    ? `${reply}\n\n${safetySuggestions.join("\n")}`
    : reply;

  // ── Merge suggestions from AI + safety ───────────────────────────────────
  const suggestions: string[] = [
    ...(parsed.suggestions ?? []),
    ...memorySummary.patterns.slice(0, 2),
  ];

  // ── Execute server-side AI actions (create_node, run_node, etc.) ─────────
  let action_result: unknown = undefined;
  if (parsed.actions?.length) {
    const serverActions = parsed.actions.filter((a) =>
      ["create_node", "read_node", "list_nodes", "run_node"].includes(a.tool),
    );
    if (serverActions.length > 0) {
      const results = [];
      for (const act of serverActions) {
        try {
          if (act.tool === "run_node") {
            const r = await runNode({ nodeId: String(act.params?.["node_id"] ?? ""), actorId: req.owner_id });
            results.push({ tool: act.tool, ok: true, result: r });
          } else {
            results.push({ tool: act.tool, ok: true, result: "stub" });
          }
        } catch (err) {
          results.push({ tool: act.tool, ok: false, error: err instanceof Error ? err.message : "unknown" });
        }
      }
      action_result = results;
    }
  }

  // ── Record AI response to session ─────────────────────────────────────────
  const assistantMsg: ChatMessage = {
    message_id: randomUUID(),
    session_id: session.session_id,
    role:       "assistant",
    content:    fullReply,
    timestamp:  new Date().toISOString(),
  };
  session.messages.push(assistantMsg);

  return {
    message_id:   assistantMsg.message_id,
    session_id:   session.session_id,
    reply:        fullReply,
    intent: {
      type:       (parsed.intent as ChatIntentType) ?? detectedIntent.type,
      confidence: parsed.confidence ?? detectedIntent.confidence,
      params:     {},
    },
    action_result,
    actions:      parsed.actions,
    suggestions,
    node_updates: parsed.node_updates,
    karma_delta:  parsed.karma_delta,
    timestamp:    assistantMsg.timestamp,
  } as ChatResponse & {
    actions?: unknown[];
    suggestions?: string[];
    node_updates?: unknown[];
    karma_delta?: number;
  };
}
