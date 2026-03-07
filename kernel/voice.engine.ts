// ─── Voice Engine ─────────────────────────────────────────────────────────────
// Matches normalised voice transcripts to intents and routes.
// No external speech-to-text dependency — receives transcript from client.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type {
  VoiceCommand, VoiceMatch, VoiceIntent, VoiceConfidence,
  VoiceSession, VoiceResponse, VoiceNavigation, VoiceWidgetRequest,
} from "../shared/types/voice.types.js";
import type { WidgetType } from "../shared/types/customization.types.js";

// ─── In-memory session store ──────────────────────────────────────────────────
const sessions = new Map<string, VoiceSession>();

// ─── Intent grammar rules ─────────────────────────────────────────────────────
// Each rule: { patterns, intent, resolve } where resolve builds target + slots.

interface IntentRule {
  patterns:  RegExp[];
  intent:    VoiceIntent;
  resolve:   (m: RegExpMatchArray, raw: string) => { target: string; slots: Record<string, string>; reply: string };
}

const NAVIGATION_PAGES: Record<string, string> = {
  "home":                "/",
  "dashboard":           "/dashboard/main",
  "sales":               "/dashboard/sales",
  "inventory":           "/dashboard/inventory",
  "crm":                 "/dashboard/crm",
  "hr":                  "/dashboard/hr",
  "projects":            "/dashboard/projects",
  "accounting":          "/dashboard/accounting",
  "profile":             "/profile",
  "settings":            "/settings",
  "wallet":              "/wallet",
  "marketplace":         "/marketplace",
  "onboarding":          "/onboarding",
  "family":              "/vanshawali",
  "family tree":         "/vanshawali",
  "map":                 "/map",
  "people":              "/map",
  "chat":                "/chat",
  "ai":                  "/ai-chat",
  "admin":               "/admin",
  "devices":             "/devices",
};

const WIDGET_ALIASES: Record<string, WidgetType> = {
  "chart":             "chart_line",
  "line chart":        "chart_line",
  "bar chart":         "chart_bar",
  "pie chart":         "chart_pie",
  "kpi":               "kpi_card",
  "kpi card":          "kpi_card",
  "stats":             "stat_card",
  "table":             "table",
  "list":              "list",
  "feed":              "feed",
  "revenue":           "chart_bar",
  "sales chart":       "chart_bar",
  "inventory table":   "table",
  "order table":       "table",
  "employee list":     "list",
  "map":               "activity_feed",
  "location":          "activity_feed",
  "timeline":          "timeline",
  "wallet":            "wallet_card",
  "payment":           "payment_button",
  "notification":      "notification_panel",
  "calendar":          "timeline",
  "attendance":        "chart_bar",
  "tasks":             "step_list",
  "workflow":          "node_canvas",
  "chat":              "chat_window",
  "ai chat":           "ai_chat",
};

const ONBOARDING_KEYWORDS: RegExp[] = [
  /\b(start|begin|create|setup)\b.*\b(account|profile|company|business|onboard)/i,
  /\b(i am|i'm|we are|we're)\b.*\b(a |an )?(retailer|manufacturer|doctor|teacher|freelancer|startup|consultant)/i,
  /\b(my (company|business|shop|store) (is|name) )/i,
  /\b(industry|sector|type of business)\b/i,
  /\b(employee|team|staff)\b.*\b(count|size|number)/i,
  /\b(i (sell|make|produce|offer))\b/i,
  /\b(my (product|service|plan))\b/i,
  /\b(skip|next|continue|proceed)\b.*\b(step|section|onboard)/i,
];

const LOCATION_KEYWORDS: RegExp[] = [
  /\b(share|start sharing)\b.*\blocation\b/i,
  /\b(show|find|where is)\b.*\b(people|person|family|friends|members)\b/i,
  /\b(map|live location|track)\b/i,
  /\b(stop sharing|disable location)\b/i,
];

const SOCIAL_KEYWORDS: RegExp[] = [
  /\b(connect|add|invite)\b.*\b(family|friend|group|contact)\b/i,
  /\b(create|new|make)\b.*\bgroup\b/i,
  /\b(merge|combine)\b.*\bnode(s)?\b/i,
  /\bfamily tree\b/i,
  /\btimeline\b/i,
  /\bhistory\b/i,
];

const RULES: IntentRule[] = [
  // ── Navigation ────────────────────────────────────────────────────────────
  {
    patterns: [
      /\b(go to|open|navigate to|show|take me to|switch to)\b\s+(.+)/i,
      /\b(show me)\b\s+(.+)\b(dashboard|page|screen)\b/i,
    ],
    intent: "navigate",
    resolve: (m, raw) => {
      const dest = (m[2] ?? "").toLowerCase().trim();
      const route = NAVIGATION_PAGES[dest]
        ?? Object.entries(NAVIGATION_PAGES).find(([k]) => dest.includes(k))?.[1]
        ?? "/";
      return {
        target:  route,
        slots:   { destination: dest },
        reply:   `Navigating to ${dest}.`,
      };
    },
  },

  // ── Widget request ────────────────────────────────────────────────────────
  {
    patterns: [
      /\b(add|create|show|give me|insert)\b\s+(a |an )?(.+?)\s*(widget|chart|table|card|list)?\s*(for|on|in)?\s*(.+)?\b/i,
    ],
    intent: "widget_request",
    resolve: (m, raw) => {
      const widgetHint = ((m[3] ?? "") + " " + (m[4] ?? "")).toLowerCase().trim();
      const platform   = (m[6] ?? "main").toLowerCase().trim();
      const widgetType = WIDGET_ALIASES[widgetHint]
        ?? Object.entries(WIDGET_ALIASES).find(([k]) => widgetHint.includes(k))?.[1]
        ?? "kpi_card";
      return {
        target: widgetType,
        slots:  { widget_type: widgetType, platform },
        reply:  `Adding a ${widgetHint} widget.`,
      };
    },
  },

  // ── Location ──────────────────────────────────────────────────────────────
  {
    patterns: LOCATION_KEYWORDS,
    intent: "location",
    resolve: (_m, raw) => ({
      target: "/map",
      slots:  { action: raw.toLowerCase().includes("stop") ? "stop_sharing" : "share" },
      reply:  raw.toLowerCase().includes("stop") ? "Stopping location sharing." : "Opening map and sharing your location.",
    }),
  },

  // ── Social / Family ───────────────────────────────────────────────────────
  {
    patterns: SOCIAL_KEYWORDS,
    intent: "social",
    resolve: (_m, raw): { target: string; slots: Record<string, string>; reply: string } => {
      const lower = raw.toLowerCase();
      if (lower.includes("family tree"))  return { target: "/vanshawali",        slots: { view: "tree" },     reply: "Opening your family tree." };
      if (lower.includes("timeline"))    return { target: "/timeline",          slots: { view: "timeline" }, reply: "Opening your timeline." };
      if (lower.includes("merge"))       return { target: "/nodes/merge",       slots: {},                   reply: "Opening node merge tool." };
      if (lower.includes("group"))       return { target: "/social/groups/new", slots: {},                   reply: "Creating a new group." };
      return { target: "/vanshawali", slots: {}, reply: "Opening Vanshawali." };
    },
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  {
    patterns: ONBOARDING_KEYWORDS,
    intent: "onboarding",
    resolve: (_m, raw) => ({
      target: "/onboarding",
      slots:  { hint: raw },
      reply:  "Let's set up your account. I'll guide you through each step.",
    }),
  },

  // ── AI query ──────────────────────────────────────────────────────────────
  {
    patterns: [
      /\b(ask|tell|what|how|why|summarise|summarize|analyse|analyze)\b/i,
    ],
    intent: "ai",
    resolve: (_m, raw) => ({
      target: "/ai-chat",
      slots:  { query: raw },
      reply:  "Let me find that for you.",
    }),
  },

  // ── System ────────────────────────────────────────────────────────────────
  {
    patterns: [
      /\b(logout|sign out|lock|settings|help)\b/i,
    ],
    intent: "system",
    resolve: (m, raw) => {
      const action = (m[1] ?? "help").toLowerCase();
      const routes: Record<string, string> = {
        logout: "/auth/logout", "sign out": "/auth/logout",
        lock: "/lock", settings: "/settings", help: "/help",
      };
      return {
        target: routes[action] ?? "/settings",
        slots:  { action },
        reply:  `${action.charAt(0).toUpperCase() + action.slice(1)}.`,
      };
    },
  },
];

// ─── Core matching logic ──────────────────────────────────────────────────────

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function matchIntent(cmd: VoiceCommand): Omit<VoiceMatch, "command"> {
  const n = cmd.normalised;

  for (const rule of RULES) {
    for (const pat of rule.patterns) {
      const m = n.match(pat);
      if (m) {
        const { target, slots, reply } = rule.resolve(m, n);
        return {
          intent:      rule.intent,
          confidence:  "high",
          target,
          slots,
          voice_reply: reply,
        };
      }
    }
  }

  // Fallback: pure keyword scan for navigation
  for (const [keyword, route] of Object.entries(NAVIGATION_PAGES)) {
    if (n.includes(keyword)) {
      return {
        intent:      "navigate",
        confidence:  "medium",
        target:      route,
        slots:       { destination: keyword },
        voice_reply: `Navigating to ${keyword}.`,
      };
    }
  }

  return {
    intent:      "unknown",
    confidence:  "low",
    target:      "",
    slots:       {},
    voice_reply: "Sorry, I didn't understand that. Can you say it again?",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Process a raw transcript from the client. Returns full VoiceResponse. */
export function processVoiceCommand(
  rawText:  string,
  userId:   string,
  options?: { sessionId?: string; deviceId?: string; language?: string },
): VoiceResponse {
  const sessionId = options?.sessionId ?? randomUUID();
  const command: VoiceCommand = {
    session_id: sessionId,
    user_id:    userId,
    raw_text:   rawText,
    normalised: normalise(rawText),
    timestamp:  new Date().toISOString(),
    language:   options?.language ?? "en",
    device_id:  options?.deviceId,
  };

  const matchResult = matchIntent(command);
  const match: VoiceMatch = { command, ...matchResult };

  // Update session history
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      session_id:     sessionId,
      user_id:        userId,
      active:         true,
      current_intent: null,
      onboarding_ctx: {},
      history:        [],
      created_at:     new Date().toISOString(),
      last_active:    new Date().toISOString(),
    };
    sessions.set(sessionId, session);
  }
  session.current_intent = match.intent;
  session.last_active    = new Date().toISOString();
  session.history = [...session.history.slice(-19), match]; // keep last 20

  // Build action payload
  let action: VoiceResponse["action"];
  let uiEvent: VoiceResponse["ui_event"] = "none";

  if (match.intent === "navigate") {
    const nav: VoiceNavigation = {
      destination: match.target,
      params:      match.slots,
      push_state:  true,
    };
    action   = nav;
    uiEvent  = "navigate";
  } else if (match.intent === "widget_request") {
    const req: VoiceWidgetRequest = {
      widget_type: match.slots["widget_type"] ?? match.target,
      platform:    match.slots["platform"] ?? "main",
      position:    "auto",
    };
    action   = req;
    uiEvent  = "add_widget";
  } else if (match.intent === "onboarding") {
    action   = { step: "user_identity", hint: match.slots["hint"] };
    uiEvent  = "navigate";
  } else if (match.intent === "ai") {
    action   = { query: match.slots["query"] };
    uiEvent  = "run_action";
  } else if (match.intent === "location" || match.intent === "social") {
    action   = { route: match.target, slots: match.slots };
    uiEvent  = "navigate";
  } else if (match.intent === "system") {
    action   = { action: match.slots["action"] };
    uiEvent  = "run_action";
  } else {
    uiEvent  = "ask_user";
  }

  return { match, action, voice_reply: match.voice_reply, ui_event: uiEvent };
}

/** Get or create a voice session for a user. */
export function getVoiceSession(sessionId: string): VoiceSession | undefined {
  return sessions.get(sessionId);
}

/** End a voice session. */
export function endVoiceSession(sessionId: string): void {
  const s = sessions.get(sessionId);
  if (s) { s.active = false; }
}

/** List all active sessions (admin). */
export function listActiveSessions(): VoiceSession[] {
  return [...sessions.values()].filter((s) => s.active);
}

/** Extract onboarding context from voice session history. */
export function extractOnboardingContext(sessionId: string): Record<string, string> {
  return sessions.get(sessionId)?.onboarding_ctx ?? {};
}

/** Store a slot captured during voice-driven onboarding. */
export function setOnboardingSlot(sessionId: string, key: string, value: string): void {
  const s = sessions.get(sessionId);
  if (s) { s.onboarding_ctx[key] = value; }
}
