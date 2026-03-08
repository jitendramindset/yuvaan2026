/**
 * learning.engine.ts
 *
 * The "baby brain" of NodeOS.
 *
 * Every user interaction — chat message, navigation, widget click, node creation,
 * payment, voice command — is recorded as a MemoryNode. Over time these nodes form
 * an experience graph that is summarised into the AI system prompt, allowing Yunaan
 * to understand the user's habits, preferences, goals, and skill level exactly like
 * a human brain builds neural connections from experience.
 *
 * Key ideas:
 *  - Short-term memory: last 50 events kept in RAM per user (rolling window)
 *  - Long-term memory: compressed summaries stored as nodes
 *  - Skill tracking: each domain (finance, dev, social…) has an XP score
 *  - Pattern detection: recurring sequences → proactive suggestions
 *  - Karma contribution: positive actions raise karma; errors lower it slightly
 */

import { randomUUID } from "node:crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MemoryCategory =
  | "navigation"   // went to a page
  | "widget"       // added/removed/resized widget
  | "node_action"  // created/updated/deleted node
  | "chat"         // sent a message to Yunaan
  | "voice"        // used voice command
  | "payment"      // sent/received Dravyam payment
  | "connection"   // connected/disconnected service
  | "profile"      // updated profile field
  | "error"        // encountered an error
  | "vr"           // VR/AR interaction
  | "sensor"       // sensor event (gesture, proximity, gaze)
  | "app_launch"   // launched an app/game
  | "achievement"  // completed something notable
  | "learning";    // explicitly learned something (onboarding, tutorial)

export interface MemoryNode {
  id:        string;
  owner_id:  string;
  category:  MemoryCategory;
  action:    string;          // short verb: "navigated", "created_node", "paid"
  details:   Record<string, unknown>;
  emotion?:  "happy" | "frustrated" | "curious" | "neutral"; // inferred tone
  context?:  string;          // free-text enriched summary
  karma_delta: number;         // how much this affected karma
  timestamp: string;
  session_id?: string;
}

export interface SkillXP {
  domain: string; // "finance" | "dev" | "social" | "ai" | "vr" | "node" | "voice"
  xp: number;
  level: number;  // 1–10
}

export interface UserMemoryState {
  owner_id:      string;
  short_term:    MemoryNode[];   // last 50, fast access
  skill_map:     Map<string, SkillXP>;
  total_events:  number;
  last_active:   string;
  daily_summary: string;         // compressed yesterday summary
  patterns:      string[];       // detected habit patterns
}

// ── In-memory state ────────────────────────────────────────────────────────────

const memoryStore = new Map<string, UserMemoryState>();
const SHORT_TERM_LIMIT = 50;

const DOMAIN_MAP: Partial<Record<MemoryCategory, string>> = {
  payment:    "finance",
  node_action:"node",
  chat:       "ai",
  voice:      "voice",
  vr:         "vr",
  connection: "ai",
  navigation: "ux",
  widget:     "ux",
  profile:    "social",
};

const XP_PER_CATEGORY: Partial<Record<MemoryCategory, number>> = {
  payment:     3,
  node_action: 2,
  chat:        1,
  voice:       2,
  vr:          3,
  connection:  2,
  profile:     1,
  achievement: 10,
  learning:    5,
  error:       -1,
};

function initState(ownerId: string): UserMemoryState {
  return {
    owner_id:     ownerId,
    short_term:   [],
    skill_map:    new Map(),
    total_events: 0,
    last_active:  new Date().toISOString(),
    daily_summary:"",
    patterns:     [],
  };
}

function getState(ownerId: string): UserMemoryState {
  if (!memoryStore.has(ownerId)) memoryStore.set(ownerId, initState(ownerId));
  return memoryStore.get(ownerId)!;
}

// ── Core learn function ────────────────────────────────────────────────────────

/**
 * Record an interaction. Call this from every chat message, navigation event,
 * node action, voice command, VR event, etc.
 */
export function learn(
  ownerId: string,
  category: MemoryCategory,
  action: string,
  details: Record<string, unknown> = {},
  opts: { emotion?: MemoryNode["emotion"]; sessionId?: string } = {},
): MemoryNode {
  const state      = getState(ownerId);
  const karmaDelta = XP_PER_CATEGORY[category] ?? 0;

  const node: MemoryNode = {
    id:          randomUUID(),
    owner_id:    ownerId,
    category,
    action,
    details,
    emotion:     opts.emotion,
    karma_delta: karmaDelta,
    timestamp:   new Date().toISOString(),
    session_id:  opts.sessionId,
  };

  // Maintain rolling short-term window
  state.short_term.push(node);
  if (state.short_term.length > SHORT_TERM_LIMIT)
    state.short_term.shift();

  // Update skill XP
  const domain = DOMAIN_MAP[category];
  if (domain) updateSkill(state, domain, Math.abs(karmaDelta) || 1);

  state.total_events++;
  state.last_active = node.timestamp;

  // Detect patterns every 10 events
  if (state.total_events % 10 === 0) detectPatterns(state);

  return node;
}

function updateSkill(state: UserMemoryState, domain: string, xpGain: number) {
  const existing = state.skill_map.get(domain) ?? { domain, xp: 0, level: 1 };
  existing.xp += xpGain;
  existing.level = Math.min(10, Math.floor(existing.xp / 20) + 1);
  state.skill_map.set(domain, existing);
}

// ── Pattern detection ─────────────────────────────────────────────────────────

function detectPatterns(state: UserMemoryState) {
  const actions = state.short_term.map((m) => m.action);
  const patterns: string[] = [];

  // Frequency analysis
  const counts = new Map<string, number>();
  for (const a of actions) counts.set(a, (counts.get(a) ?? 0) + 1);
  for (const [action, count] of counts) {
    if (count >= 3) patterns.push(`Frequently: ${action} (${count}x)`);
  }

  // Sequence detection
  const recent5 = actions.slice(-5).join(" → ");
  if (recent5.includes("chat → navigate")) patterns.push("Pattern: Ask then navigate");
  if (recent5.includes("error → chat"))    patterns.push("Pattern: Error triggers help-seeking");

  state.patterns = patterns;
}

// ── Memory summary for system prompt ─────────────────────────────────────────

export interface MemorySummary {
  recentActivity:  string[];
  topSkills:       string[];
  patterns:        string[];
  totalInteractions: number;
  emotionTrend:    string;
  incompleteTasks: string[];
}

export function getMemorySummary(ownerId: string): MemorySummary {
  const state = getState(ownerId);
  const recent = state.short_term.slice(-10);

  // Top 3 skills
  const topSkills = [...state.skill_map.values()]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 3)
    .map((s) => `${s.domain} Lv${s.level} (${s.xp}xp)`);

  // Recent activity descriptions
  const recentActivity = recent.map((m) =>
    `[${m.category}] ${m.action}${m.details["target"] ? ` → ${m.details["target"]}` : ""}`,
  );

  // Emotion trend
  const emotions = recent.map((m) => m.emotion).filter(Boolean);
  const frustrations = emotions.filter((e) => e === "frustrated").length;
  const emotionTrend = frustrations > 2
    ? "User appears frustrated — be extra helpful and concise"
    : emotions.filter((e) => e === "happy").length > 3
    ? "User is engaged and positive"
    : "Neutral";

  return {
    recentActivity,
    topSkills,
    patterns: state.patterns,
    totalInteractions: state.total_events,
    emotionTrend,
    incompleteTasks: [], // TODO: wire to workflow engine
  };
}

// ── Skill scores for trust / karma ────────────────────────────────────────────

export function getSkillMap(ownerId: string): Map<string, SkillXP> {
  return getState(ownerId).skill_map;
}

export function getShortTermMemory(ownerId: string): MemoryNode[] {
  return getState(ownerId).short_term;
}

export function getTotalEvents(ownerId: string): number {
  return getState(ownerId).total_events;
}

// ── Convenience wrappers ─────────────────────────────────────────────────────

export const learnNavigation = (ownerId: string, route: string, sessionId?: string) =>
  learn(ownerId, "navigation", "navigated", { target: route }, { sessionId });

export const learnChatMessage = (ownerId: string, message: string, sessionId?: string) =>
  learn(ownerId, "chat", "sent_message", { preview: message.slice(0, 60) }, { sessionId });

export const learnNodeAction = (ownerId: string, action: string, nodeType: string) =>
  learn(ownerId, "node_action", action, { node_type: nodeType });

export const learnVoiceCommand = (ownerId: string, transcript: string) =>
  learn(ownerId, "voice", "voice_command", { transcript: transcript.slice(0, 80) });

export const learnVRInteraction = (ownerId: string, event: string, details: Record<string, unknown> = {}) =>
  learn(ownerId, "vr", event, details);

export const learnSensorEvent = (ownerId: string, sensorType: string, data: Record<string, unknown>) =>
  learn(ownerId, "sensor", sensorType, data);

export const learnError = (ownerId: string, errorType: string, details: Record<string, unknown> = {}) =>
  learn(ownerId, "error", errorType, details, { emotion: "frustrated" });

export const learnAchievement = (ownerId: string, achievement: string) =>
  learn(ownerId, "achievement", achievement, {}, { emotion: "happy" });
