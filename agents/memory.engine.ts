/**
 * Agent Memory Engine — short-term conversation memory + long-term activity log.
 *
 * Short-term:   circular buffer of the last N messages/entries per session.
 * Long-term:    append-only activity log persisted to disk (JSON lines).
 * Vector store: FAISS index wire-up is left as a stub for the embedding layer.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemoryEntry {
  ts: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  intent_type?: string;
}

export interface ActivityPattern {
  intent_type: string;
  count: number;
  first_seen: string;
  last_seen: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const SHORT_TERM_LIMIT = 50;
const ACTIVITY_LOG_PATH = path.join("logs", "agent_activity.jsonl");

// ── In-memory short-term store ────────────────────────────────────────────────

const shortTermStore = new Map<string, MemoryEntry[]>();

export function remember(entry: MemoryEntry): void {
  const buf = shortTermStore.get(entry.session_id) ?? [];
  buf.push(entry);
  if (buf.length > SHORT_TERM_LIMIT) buf.splice(0, buf.length - SHORT_TERM_LIMIT);
  shortTermStore.set(entry.session_id, buf);
}

export function recallSession(sessionId: string): MemoryEntry[] {
  return shortTermStore.get(sessionId) ?? [];
}

export function clearSession(sessionId: string): void {
  shortTermStore.delete(sessionId);
}

// ── Long-term activity log ────────────────────────────────────────────────────

export async function logActivity(entry: MemoryEntry): Promise<void> {
  await fs.mkdir(path.dirname(ACTIVITY_LOG_PATH), { recursive: true });
  await fs.appendFile(ACTIVITY_LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
}

/**
 * Read the last `limit` activity entries for a given agent owner.
 * Used by suggestion.engine.ts to detect patterns.
 */
export async function readRecentActivity(
  limit = 100,
): Promise<MemoryEntry[]> {
  try {
    const raw   = await fs.readFile(ACTIVITY_LOG_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    return lines
      .slice(-limit)
      .map((l) => JSON.parse(l) as MemoryEntry);
  } catch {
    return [];
  }
}

/**
 * Aggregate activity by intent type — used to surface usage patterns.
 */
export async function getActivityPatterns(): Promise<ActivityPattern[]> {
  const entries = await readRecentActivity(500);
  const map = new Map<string, ActivityPattern>();
  for (const e of entries) {
    const it = e.intent_type ?? "unknown";
    const existing = map.get(it);
    if (existing) {
      existing.count++;
      existing.last_seen = e.ts;
    } else {
      map.set(it, { intent_type: it, count: 1, first_seen: e.ts, last_seen: e.ts });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
