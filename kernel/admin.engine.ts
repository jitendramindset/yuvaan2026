import { createHash, timingSafeEqual } from "node:crypto";

// ─── Admin Engine ─────────────────────────────────────────────────────────────
// One super-admin key, 7-day activity tracking, production mode gating.

type AdminAction = "warn" | "suspend" | "revoke" | "reset_karma" | "force_sync";
type AdminMode = "development" | "production";

export interface ActivityEvent {
  event_id: string;
  user_id: string;
  action: string;
  timestamp: string;
  device_id?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminActionRecord {
  record_id: string;
  target_user_id: string;
  action: AdminAction;
  reason: string;
  performed_by: string;
  timestamp: string;
}

// ─── State ────────────────────────────────────────────────────────────────────
const MASTER_KEY_HASH = hashKey(
  process.env["ADMIN_MASTER_KEY"] ?? "default-insecure-key-change-in-prod",
);
let currentMode: AdminMode = (process.env["NODE_ENV"] === "production") ? "production" : "development";

// 7-day rolling window — keyed by user_id
const activityLog = new Map<string, ActivityEvent[]>();
const adminActions = new Map<string, AdminActionRecord[]>(); // target_user_id → records
const suspendedUsers = new Set<string>();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashKey(k: string): string {
  return createHash("sha3-256").update(k).digest("hex");
}

function timeSafeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Still run comparison to prevent timing oracle; result is always false
    timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1));
    return false;
  }
  return timingSafeEqual(ba, bb);
}

function newId(): string {
  return crypto.randomUUID();
}

function pruneActivity(userId: string): void {
  const now = Date.now();
  const events = activityLog.get(userId) ?? [];
  activityLog.set(
    userId,
    events.filter((e) => now - Date.parse(e.timestamp) < SEVEN_DAYS_MS),
  );
}

// ─── Key Validation ───────────────────────────────────────────────────────────

export function validateAdminKey(key: string): boolean {
  return timeSafeEquals(hashKey(key), MASTER_KEY_HASH);
}

export function requireAdminKey(key: string): void {
  if (!validateAdminKey(key)) throw new Error("Invalid admin key");
}

// ─── Mode ─────────────────────────────────────────────────────────────────────

export function getMode(): AdminMode {
  return currentMode;
}

export function setMode(key: string, mode: AdminMode): void {
  requireAdminKey(key);
  currentMode = mode;
}

// ─── Activity Tracking ────────────────────────────────────────────────────────

export function trackActivity(event: Omit<ActivityEvent, "event_id">): ActivityEvent {
  const e: ActivityEvent = { event_id: newId(), ...event };
  pruneActivity(e.user_id);
  const events = activityLog.get(e.user_id) ?? [];
  events.push(e);
  activityLog.set(e.user_id, events);
  return e;
}

export function getUserActivity(userId: string): ActivityEvent[] {
  pruneActivity(userId);
  return [...(activityLog.get(userId) ?? [])];
}

export function isUserSuspended(userId: string): boolean {
  return suspendedUsers.has(userId);
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

export function performAdminAction(
  adminKey: string,
  targetUserId: string,
  action: AdminAction,
  reason: string,
  performedBy = "system",
): AdminActionRecord {
  requireAdminKey(adminKey);

  const record: AdminActionRecord = {
    record_id: newId(),
    target_user_id: targetUserId,
    action,
    reason,
    performed_by: performedBy,
    timestamp: new Date().toISOString(),
  };

  const records = adminActions.get(targetUserId) ?? [];
  records.push(record);
  adminActions.set(targetUserId, records);

  if (action === "suspend") suspendedUsers.add(targetUserId);
  if (action === "revoke")  suspendedUsers.add(targetUserId); // treat revoke as suspended
  if (action === "warn")    { /* warn only, no suspension */ }

  return record;
}

export function getAdminActionsForUser(userId: string): AdminActionRecord[] {
  return [...(adminActions.get(userId) ?? [])];
}

// ─── System Health (admin-only read) ─────────────────────────────────────────

export function getSystemSnapshot(adminKey: string): {
  mode: AdminMode;
  total_tracked_users: number;
  suspended_count: number;
  total_actions: number;
} {
  requireAdminKey(adminKey);
  return {
    mode: currentMode,
    total_tracked_users: activityLog.size,
    suspended_count: suspendedUsers.size,
    total_actions: [...adminActions.values()].reduce((n, a) => n + a.length, 0),
  };
}
