"use client";
/**
 * useNodeSecurity — security primitives for NodeOS content access control.
 * Provides: SHA-256 hashing, expiry checks, node score enforcement,
 * suspicious activity detection, and instance destruction.
 */
import { useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecuredItem {
  id:              string;
  hash:            string;        // SHA-256 fingerprint
  owner_id:        string;
  visibility:      "private" | "circle" | "public";
  circle_ids:      string[];
  expires_at:      string | null; // ISO string or null (never)
  node_score_min:  number;        // minimum karma required to access
  created_at:      string;
  revoked:         boolean;
  access_log:      Array<{ at: string; action: string; user_id: string }>;
}

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: "expired" | "low_score" | "permission_denied" | "revoked" | "suspicious" | "instance_destroyed" };

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ACTIVITY_KEY  = "nodeos-sec-activity";
const DESTROYED_KEY = "nodeos-sec-destroyed";

// ─── SHA-256 hash using Web Crypto API ───────────────────────────────────────

export async function hashContent(content: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback djb2 hash if Web Crypto unavailable
    let h = 5381;
    for (let i = 0; i < content.length; i++) h = ((h << 5) + h) ^ content.charCodeAt(i);
    return Math.abs(h).toString(16).padStart(16, "0");
  }
}

// ─── Access control ───────────────────────────────────────────────────────────

export function checkAccess(
  item:          SecuredItem,
  currentScore:  number,
  currentUserId: string,
  userCircleIds: string[],
): AccessResult {
  // 1. Revoked
  if (item.revoked) return { allowed: false, reason: "revoked" };

  // 2. Instance destroyed on this device
  try {
    const d = JSON.parse(localStorage.getItem(DESTROYED_KEY) ?? "[]") as string[];
    if (d.includes(item.id)) return { allowed: false, reason: "instance_destroyed" };
  } catch { /**/ }

  // 3. Expired
  if (item.expires_at && new Date(item.expires_at) < new Date()) {
    return { allowed: false, reason: "expired" };
  }

  // 4. Node score (karma) gate
  if (currentScore < item.node_score_min) {
    return { allowed: false, reason: "low_score" };
  }

  // 5. Visibility / permission
  if (item.visibility === "private" && item.owner_id !== currentUserId) {
    return { allowed: false, reason: "permission_denied" };
  }
  if (item.visibility === "circle") {
    const ok = item.owner_id === currentUserId || item.circle_ids.some((c) => userCircleIds.includes(c));
    if (!ok) return { allowed: false, reason: "permission_denied" };
  }

  return { allowed: true };
}

// ─── Activity tracking (velocity-based suspicious detection) ─────────────────

export function trackActivity(action: string, userId = "current_user"): { suspicious: boolean; velocity: number } {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const log: Array<{ t: number; a: string; u: string }> = raw ? JSON.parse(raw) : [];
    const recent = log.filter((e) => now - e.t < 3_600_000); // last hour
    recent.push({ t: now, a: action, u: userId });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(recent.slice(-500)));
    const perMin = recent.filter((e) => now - e.t < 60_000).length;
    return { suspicious: perMin > 60, velocity: perMin };
  } catch {
    return { suspicious: false, velocity: 0 };
  }
}

// ─── Destroy cached instance on this device ───────────────────────────────────

export function destroyInstance(itemId: string): void {
  try {
    const raw  = localStorage.getItem(DESTROYED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(itemId)) { list.push(itemId); localStorage.setItem(DESTROYED_KEY, JSON.stringify(list)); }
  } catch { /**/ }
}

export function restoreInstance(itemId: string): void {
  try {
    const raw  = localStorage.getItem(DESTROYED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(DESTROYED_KEY, JSON.stringify(list.filter((id) => id !== itemId)));
  } catch { /**/ }
}

// ─── Access log ───────────────────────────────────────────────────────────────

export function appendAccessLog(item: SecuredItem, action: string, userId = "current_user"): SecuredItem {
  return {
    ...item,
    access_log: [
      ...(item.access_log ?? []),
      { at: new Date().toISOString(), action, user_id: userId },
    ].slice(-100), // keep last 100 log entries
  };
}

// ─── Default factory ──────────────────────────────────────────────────────────

export function defaultSecuredItem(overrides: Partial<SecuredItem> = {}): SecuredItem {
  return {
    id:             Math.random().toString(36).slice(2, 10),
    hash:           "",
    owner_id:       "current_user",
    visibility:     "private",
    circle_ids:     [],
    expires_at:     null,
    node_score_min: 0,
    created_at:     new Date().toISOString(),
    revoked:        false,
    access_log:     [],
    ...overrides,
  };
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useNodeSecurity(currentKarma = 420) {
  const check = useCallback((item: SecuredItem): AccessResult => {
    const { suspicious } = trackActivity("check");
    if (suspicious) {
      destroyInstance(item.id);
      return { allowed: false, reason: "suspicious" };
    }
    return checkAccess(item, currentKarma, "current_user", []);
  }, [currentKarma]);

  return {
    check,
    hashContent,
    destroyInstance,
    trackActivity,
    appendAccessLog,
    defaultSecuredItem,
  };
}
