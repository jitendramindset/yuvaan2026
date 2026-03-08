import { createHash }          from "node:crypto";
import type { TransactionRecord, FraudSignal } from "../shared/types/payment.types.js";
import { write as ledgerWrite } from "./ledger/ledger_engine.js";

// ─── Extended context with trust score ───────────────────────────────────────

export interface FraudCheckContext {
  ip: string;
  device_hash: string;
  /** Number of transactions by this wallet in the last 1 hour */
  velocity_count: number;
  /** True if billing geo differs from device geo */
  geo_mismatch: boolean;
  /** Resolved from profile trust engine (0–100) */
  trust_score?: number;
}

// ─── Penalties ────────────────────────────────────────────────────────────────

const VELOCITY_THRESHOLD      = 10;
const GEO_MISMATCH_PENALTY    = 30;
const VELOCITY_PENALTY_PER_TX = 5;
const LARGE_TX_THRESHOLD      = 500_000;
const LARGE_TX_PENALTY        = 20;
const LOW_TRUST_PENALTY       = 15;  // trust < 40 (Seed) adds risk
const KNOWN_BAD_IP_PENALTY    = 40;
const KNOWN_BAD_DEVICE_PENALTY= 50;

// ─── Device/IP watchlists (production: persist to LevelDB) ───────────────────

const blockedDevices  = new Set<string>(); // device_hash → blocked
const blockedIPs      = new Set<string>(); // IP → blocked
const deviceVelocity  = new Map<string, number[]>(); // device_hash → timestamps
const destroyedHashes = new Map<string, string>(); // device_hash → reason

// ─── Track velocity per device ────────────────────────────────────────────────

export function recordDeviceEvent(device_hash: string): void {
  const now = Date.now();
  const events = (deviceVelocity.get(device_hash) ?? []).filter((t) => now - t < 3_600_000);
  events.push(now);
  deviceVelocity.set(device_hash, events);
}

export function getDeviceVelocity(device_hash: string): number {
  const now = Date.now();
  return (deviceVelocity.get(device_hash) ?? []).filter((t) => now - t < 3_600_000).length;
}

// ─── Destroy instance ─────────────────────────────────────────────────────────

/**
 * Marks a device hash as destroyed (extreme fraud).
 * The hash is a SHA3-256 of the machine fingerprint so the
 * actual device identity is never stored plain.
 */
export function destroyInstance(raw_device_hash: string, reason: string): void {
  const cryptoHash = createHash("sha256").update(raw_device_hash).digest("hex");
  blockedDevices.add(cryptoHash);
  destroyedHashes.set(cryptoHash, reason);

  ledgerWrite({
    key: `fraud:destroy:${cryptoHash.slice(0, 16)}`,
    type: "instance_destroyed",
    node_id: "fraud.engine",
    data: { device_hash: cryptoHash, reason },
    timestamp: new Date().toISOString(),
  });
}

export function isDeviceDestroyed(raw_device_hash: string): boolean {
  const cryptoHash = createHash("sha256").update(raw_device_hash).digest("hex");
  return blockedDevices.has(cryptoHash);
}

export function blockIP(ip: string): void { blockedIPs.add(ip); }
export function isIPBlocked(ip: string): boolean { return blockedIPs.has(ip); }

// ─── Compute fraud score ──────────────────────────────────────────────────────

/**
 * Computes a risk score (0–100) for a transaction.
 *
 * Score breakdown:
 *   velocity:      up to 50 pts  (5 pts per tx above threshold)
 *   geo_mismatch:  30 pts flat
 *   large_amount:  20 pts if amount > ₹5,00,000
 *   low_trust:     15 pts if trust_score < 40 (Seed level)
 *   known_bad_ip:  40 pts
 *   known_bad_dev: 50 pts (immediate block)
 *
 * Score ≥ 70 → block.  Score 40–69 → flag for review.
 */
export function computeFraudScore(tx: TransactionRecord, ctx: FraudCheckContext): FraudSignal {
  let score = 0;

  // Device velocity from our own tracker (override ctx if higher)
  const devVelocity = Math.max(ctx.velocity_count, getDeviceVelocity(ctx.device_hash));
  if (devVelocity > VELOCITY_THRESHOLD) {
    score += Math.min(50, (devVelocity - VELOCITY_THRESHOLD) * VELOCITY_PENALTY_PER_TX);
  }

  if (ctx.geo_mismatch)  score += GEO_MISMATCH_PENALTY;
  if (tx.amount > LARGE_TX_THRESHOLD) score += LARGE_TX_PENALTY;

  // Low trust penalty
  if ((ctx.trust_score ?? 100) < 40) score += LOW_TRUST_PENALTY;

  // Known bad IP / device
  if (isIPBlocked(ctx.ip)) score += KNOWN_BAD_IP_PENALTY;
  if (isDeviceDestroyed(ctx.device_hash)) score += KNOWN_BAD_DEVICE_PENALTY;

  // Record this event for future velocity checks
  recordDeviceEvent(ctx.device_hash);

  return {
    transaction_id:  tx.transaction_id,
    ip:              ctx.ip,
    device_hash:     ctx.device_hash,
    velocity_count:  devVelocity,
    geo_mismatch:    ctx.geo_mismatch,
    risk_score:      Math.min(100, score),
    flagged_at:      new Date().toISOString(),
  };
}

/**
 * Returns true if the transaction should be blocked outright.
 */
export function shouldBlockTransaction(signal: FraudSignal): boolean {
  return signal.risk_score >= 70;
}

/**
 * Returns true if the transaction should be flagged for manual review.
 */
export function shouldFlagForReview(signal: FraudSignal): boolean {
  return signal.risk_score >= 40 && signal.risk_score < 70;
}

/**
 * Returns a node-score-based action: "allow" | "flag" | "block" | "destroy"
 */
export function resolveAction(signal: FraudSignal, node_score: number): "allow" | "flag" | "block" | "destroy" {
  if (signal.risk_score >= 95) return "destroy";
  if (signal.risk_score >= 70) return "block";
  // Nodes with very low scores AND moderate fraud risk → block
  if (node_score < 20 && signal.risk_score >= 40) return "block";
  if (signal.risk_score >= 40) return "flag";
  return "allow";
}
