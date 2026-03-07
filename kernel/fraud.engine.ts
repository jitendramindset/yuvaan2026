import type { TransactionRecord, FraudSignal } from "../shared/types/payment.types.js";

interface FraudCheckContext {
  ip: string;
  device_hash: string;
  /** Number of transactions by this wallet in the last 1 hour */
  velocity_count: number;
  /** True if billing geo differs from device geo */
  geo_mismatch: boolean;
}

const VELOCITY_THRESHOLD = 10;
const GEO_MISMATCH_PENALTY = 30;
const VELOCITY_PENALTY_PER_TX = 5;
const LARGE_TX_THRESHOLD = 500000;
const LARGE_TX_PENALTY = 20;

/**
 * Computes a fraud risk score (0–100) for a transaction.
 *
 * Score breakdown:
 *   velocity:    up to 50 points  (5 pts per tx above threshold)
 *   geo_mismatch: 30 points flat
 *   large_amount: 20 points if amount > 500 000 INR equivalent
 *
 * Score ≥ 70 should be blocked.
 * Score 40–69 should be flagged for review.
 */
export function computeFraudScore(tx: TransactionRecord, ctx: FraudCheckContext): FraudSignal {
  let score = 0;

  if (ctx.velocity_count > VELOCITY_THRESHOLD) {
    score += Math.min(50, (ctx.velocity_count - VELOCITY_THRESHOLD) * VELOCITY_PENALTY_PER_TX);
  }
  if (ctx.geo_mismatch) {
    score += GEO_MISMATCH_PENALTY;
  }
  if (tx.amount > LARGE_TX_THRESHOLD) {
    score += LARGE_TX_PENALTY;
  }

  return {
    transaction_id: tx.transaction_id,
    ip: ctx.ip,
    device_hash: ctx.device_hash,
    velocity_count: ctx.velocity_count,
    geo_mismatch: ctx.geo_mismatch,
    risk_score: Math.min(100, score),
    flagged_at: new Date().toISOString(),
  };
}

/**
 * Returns true if the transaction should be blocked outright.
 */
export function shouldBlockTransaction(signal: FraudSignal): boolean {
  return signal.risk_score >= 70;
}
