/**
 * intention.engine.ts
 *
 * Analyses the full context (message, history, time, location, sensor state,
 * open apps) to infer the user's INTENTION before they even finish speaking.
 * If a dangerous or problematic situation is detected, the engine prepares
 * a safety response and optionally switches to emergency AI mode.
 *
 * This is the "instinct layer" of the Human OS — like a reflex arc that fires
 * before conscious thought to protect the user and guide them.
 */

import type { MemoryNode } from "./learning.engine.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type IntentionCategory =
  | "productive"    // working on something useful
  | "exploratory"   // browsing / learning
  | "social"        // communicating with others
  | "transactional" // money / payments / finance
  | "entertainment" // games, media, VR
  | "emergency"     // detected danger / panic
  | "idle"          // no clear goal
  | "confused";     // unclear / contradictory signals

export type DangerLevel = "none" | "low" | "medium" | "high" | "critical";

export interface IntentionResult {
  category:      IntentionCategory;
  confidence:    number;       // 0–1
  goal:          string;       // inferred goal in plain English
  next_actions:  string[];     // suggested next steps
  danger_level:  DangerLevel;
  danger_reason?: string;
  switch_to_ai?: boolean;      // force emergency AI mode
  emergency_msg?: string;      // message to show user immediately
}

export interface IntentionContext {
  owner_id:        string;
  message?:        string;      // current chat/voice message
  current_route?:  string;
  open_app?:       string;
  sensor_data?:    Record<string, unknown>;
  recent_memory?:  MemoryNode[];
  time_of_day?:    "morning" | "afternoon" | "evening" | "night";
  karma_score?:    number;
  balance?:        number;
}

// ── Danger patterns (OWASP-aware: no injection, rate limit, SSRF) ────────────

const DANGER_KEYWORDS = [
  // Financial distress
  { pattern: /urgent|emergency|scam|fraud|hack|stolen|lost|police|accident/, level: "high",   reason: "Distress signal detected" },
  { pattern: /transfer all|send all|empty wallet|all funds/,                  level: "high",   reason: "Mass transfer request — dharma guard active" },
  // Privacy
  { pattern: /share my password|give my key|reveal.*secret|export.*private/,  level: "high",   reason: "Credential exposure risk" },
  // Physical
  { pattern: /hurt|pain|medical|hospital|help me|can't breathe/,              level: "critical", reason: "Physical safety concern" },
  // Low
  { pattern: /delete everything|wipe all|reset all nodes/,                    level: "medium", reason: "Destructive operation requested" },
  { pattern: /blocked|can't login|locked out/,                                level: "low",    reason: "Access issue detected" },
] as Array<{ pattern: RegExp; level: DangerLevel; reason: string }>;

// ── Intent patterns ─────────────────────────────────────────────────────────

const INTENT_PATTERNS: Array<{ pattern: RegExp; category: IntentionCategory; goal: string; actions: string[] }> = [
  { pattern: /pay|send|transfer|wallet|balance|transaction/i,    category: "transactional", goal: "Financial operation",    actions: ["show_wallet", "check_balance"] },
  { pattern: /connect|link|integrate|api|mcp|service/i,          category: "productive",    goal: "Service integration",    actions: ["navigate:/connections", "connect_api"] },
  { pattern: /build|create|make|design|add widget|add node/i,    category: "productive",    goal: "Building / creating",    actions: ["navigate:/builder", "create_node"] },
  { pattern: /game|play|launch|vr|headset|immersive/i,           category: "entertainment", goal: "Entertainment / VR mode", actions: ["navigate:/vr", "app_launch"] },
  { pattern: /post|share|friend|family|social|vanshawali/i,      category: "social",        goal: "Social interaction",     actions: ["navigate:/vanshawali"] },
  { pattern: /learn|tutorial|how to|guide|help|explain/i,        category: "exploratory",   goal: "Learning about system",  actions: ["show_help", "check_karma"] },
  { pattern: /dashboard|widget|customize|theme|settings/i,       category: "productive",    goal: "Customizing environment", actions: ["navigate:/dashboard", "update_theme"] },
  { pattern: /error|bug|problem|fix|broken|not working/i,        category: "productive",    goal: "Debugging",              actions: ["check_errors", "show_logs"] },
  { pattern: /voice|speak|listen|microphone/i,                   category: "productive",    goal: "Voice control",          actions: ["navigate:/voice"] },
];

// ── Main inference ────────────────────────────────────────────────────────────

export function inferIntention(ctx: IntentionContext): IntentionResult {
  const text = [ctx.message ?? "", ctx.open_app ?? ""].join(" ").toLowerCase();

  // 1. Danger scan
  let dangerLevel: DangerLevel = "none";
  let dangerReason: string | undefined;
  for (const d of DANGER_KEYWORDS) {
    if (d.pattern.test(text)) {
      // Take highest severity
      if (compareDanger(d.level, dangerLevel) > 0) {
        dangerLevel  = d.level;
        dangerReason = d.reason;
      }
    }
  }

  // 2. Balance danger: very low balance + payment intent
  if (ctx.balance !== undefined && ctx.balance < 100) {
    const hasPaymentIntent = /pay|send|transfer/i.test(text);
    if (hasPaymentIntent && compareDanger("medium", dangerLevel) > 0) {
      dangerLevel  = "medium";
      dangerReason = "Low balance — payment may fail";
    }
  }

  // 3. Emergency switch
  const switchToAI = dangerLevel === "critical" || dangerLevel === "high";
  const emergencyMsg = switchToAI
    ? `⚠️ ${dangerReason}. Yunaan has activated emergency AI mode. Please confirm the action or type a safe word to cancel.`
    : undefined;

  // 4. Intent classification
  for (const ip of INTENT_PATTERNS) {
    if (ip.pattern.test(text)) {
      // Check recent memory for pattern reinforcement
      const recentMatches = (ctx.recent_memory ?? [])
        .filter((m) => ip.pattern.test(m.action + " " + JSON.stringify(m.details)))
        .length;
      const confidence = Math.min(0.95, 0.7 + recentMatches * 0.05);

      return {
        category:     ip.category,
        confidence,
        goal:         ip.goal,
        next_actions: ip.actions,
        danger_level: dangerLevel,
        danger_reason: dangerReason,
        switch_to_ai: switchToAI,
        emergency_msg: emergencyMsg,
      };
    }
  }

  // 5. Time-of-day heuristic
  const tod = ctx.time_of_day ?? getTimeOfDay();
  if (tod === "morning")   return result("productive",    "Morning task",     ["check_karma", "show_wallet"],    dangerLevel, dangerReason, switchToAI, emergencyMsg);
  if (tod === "evening")   return result("social",        "End-of-day review", ["navigate:/vanshawali"],         dangerLevel, dangerReason, switchToAI, emergencyMsg);
  if (tod === "night")     return result("entertainment", "Night relaxation",  ["navigate:/vr"],                 dangerLevel, dangerReason, switchToAI, emergencyMsg);

  // 6. Fall through to confused / idle
  const category: IntentionCategory = (ctx.recent_memory?.length ?? 0) === 0 ? "idle" : "confused";
  return result(category, "No clear goal detected", ["check_karma", "show_help"], dangerLevel, dangerReason, switchToAI, emergencyMsg);
}

function result(
  category: IntentionCategory,
  goal: string,
  next_actions: string[],
  danger_level: DangerLevel,
  danger_reason: string | undefined,
  switch_to_ai: boolean,
  emergency_msg: string | undefined,
): IntentionResult {
  return { category, confidence: 0.5, goal, next_actions, danger_level, danger_reason, switch_to_ai, emergency_msg };
}

function compareDanger(a: DangerLevel, b: DangerLevel): number {
  const order: DangerLevel[] = ["none", "low", "medium", "high", "critical"];
  return order.indexOf(a) - order.indexOf(b);
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

// ── Safety suggestion builder ─────────────────────────────────────────────────

export function buildSafetySuggestions(result: IntentionResult): string[] {
  if (result.danger_level === "none") return [];
  const base = [`⚠️ ${result.danger_reason}`];
  if (result.danger_level === "critical") {
    base.push("📞 Emergency contacts: call 112 / local emergency");
    base.push("🛑 NodeOS has paused all financial transactions");
  } else if (result.danger_level === "high") {
    base.push("🔒 Confirm your identity before proceeding");
    base.push("❌ Destructive operations are blocked by Dharma Guard");
  } else if (result.danger_level === "medium") {
    base.push("💡 Double-check this action before proceeding");
  }
  return base;
}
