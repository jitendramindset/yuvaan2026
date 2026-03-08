/**
 * Economy Engine — Dravyam fee collection, karma-weighted distribution, reward rules.
 *
 * Rules:
 *   • Every transaction incurs a 1% platform fee.
 *   • Collected fees flow into the network pool.
 *   • The pool is distributed every DISTRIBUTION_INTERVAL_MS to active nodes
 *     weighted by their karma score:
 *       share = (node_karma / total_karma) × pool_amount
 *   • Karma-based reward events (onboarding complete, daily activity, etc.)
 *     grant a small token bonus directly to the node's wallet.
 */

import { randomUUID }       from "node:crypto";
import type { DravyamCurrency } from "../shared/types/payment.types.js";
import { getWallet }         from "./dravyam.engine.js";
import { write as ledgerWrite } from "./ledger/ledger_engine.js";

// ─── Constants ────────────────────────────────────────────────────────────────

export const FEE_PERCENT        = 1;        // 1% on every transaction
const DISTRIBUTION_INTERVAL_MS  = 3_600_000; // distribute every 1 h
const MIN_KARMA_TO_RECEIVE      = 40;        // Sprout level minimum

// ─── Karma reward amounts (in DRAVYAM tokens) ─────────────────────────────────

export const KARMA_REWARDS: Record<string, number> = {
  onboarding_complete:   100,
  profile_photo_added:    20,
  email_verified:         15,
  phone_verified:         15,
  family_member_added:    25,
  first_transaction:      50,
  daily_active:           10,
  referral_joined:       200,
  kyc_verified:          150,
  trust_elder:           500,   // reaches Elder trust level
};

// ─── Network Pool ─────────────────────────────────────────────────────────────

interface PoolEntry {
  currency: DravyamCurrency;
  amount:   number;
}

const networkPool = new Map<DravyamCurrency, number>();

// ─── Active Node Registry ─────────────────────────────────────────────────────

interface NodeEntry {
  node_id:    string;
  wallet_id:  string;
  karma:      number;
  last_active: string; // ISO
}

const activeNodes = new Map<string, NodeEntry>();

export function registerNode(entry: NodeEntry): void {
  activeNodes.set(entry.node_id, entry);
}

export function updateNodeKarma(node_id: string, karma: number): void {
  const n = activeNodes.get(node_id);
  if (n) { n.karma = karma; n.last_active = new Date().toISOString(); }
}

// ─── Fee Collection ───────────────────────────────────────────────────────────

/**
 * Called after every successful transaction capture.
 * Deposits `feeAmount` into the network pool for the given currency.
 */
export function collectFee(currency: DravyamCurrency, feeAmount: number): void {
  const current = networkPool.get(currency) ?? 0;
  networkPool.set(currency, current + feeAmount);
}

export function getNetworkPool(): Record<string, number> {
  return Object.fromEntries(networkPool);
}

// ─── Karma-Weighted Distribution ──────────────────────────────────────────────

interface DistributionResult {
  distributed_at: string;
  currency: DravyamCurrency;
  total_distributed: number;
  recipients: Array<{ node_id: string; wallet_id: string; share: number }>;
}

/**
 * Distributes the entire pool balance for a given currency to eligible nodes,
 * weighted by their karma score.
 */
export function distributePool(currency: DravyamCurrency): DistributionResult {
  const pool = networkPool.get(currency) ?? 0;
  if (pool === 0) {
    return {
      distributed_at: new Date().toISOString(),
      currency,
      total_distributed: 0,
      recipients: [],
    };
  }

  const eligible = [...activeNodes.values()].filter(
    (n) => n.karma >= MIN_KARMA_TO_RECEIVE,
  );

  const totalKarma = eligible.reduce((s, n) => s + n.karma, 0);
  if (totalKarma === 0) {
    return { distributed_at: new Date().toISOString(), currency, total_distributed: 0, recipients: [] };
  }

  const recipients: DistributionResult["recipients"] = [];

  for (const node of eligible) {
    const share = Math.floor((node.karma / totalKarma) * pool * 100) / 100;
    if (share <= 0) continue;

    try {
      const wallet = getWallet(node.wallet_id);
      wallet.balances[currency] = wallet.balances[currency] ?? { available: 0, locked: 0 };
      wallet.balances[currency].available += share;
      recipients.push({ node_id: node.node_id, wallet_id: node.wallet_id, share });

      ledgerWrite({
        key: `distribution:${randomUUID()}`,
        type: "distribution",
        node_id: node.node_id,
        data: { currency, amount: share, reason: "karma_distribution" },
        timestamp: new Date().toISOString(),
      });
    } catch { /* wallet not loaded — skip */ }
  }

  networkPool.set(currency, 0); // clear pool after distribution

  return {
    distributed_at: new Date().toISOString(),
    currency,
    total_distributed: pool,
    recipients,
  };
}

// ─── Karma Event Rewards ──────────────────────────────────────────────────────

/**
 * Grant a one-time karma reward to a wallet for completing a milestone.
 * Idempotency enforced by checking `awardedEvents` set per wallet.
 */
const awardedEvents = new Map<string, Set<string>>(); // walletId → Set<eventKey>

export function grantKarmaReward(
  walletId: string,
  event: keyof typeof KARMA_REWARDS,
): { granted: boolean; amount: number } {
  const amount = KARMA_REWARDS[event] ?? 0;
  if (!amount) return { granted: false, amount: 0 };

  const wallet_events = awardedEvents.get(walletId) ?? new Set<string>();
  if (wallet_events.has(event)) return { granted: false, amount: 0 }; // already awarded

  try {
    const wallet = getWallet(walletId);
    wallet.balances["DRAVYAM"] = wallet.balances["DRAVYAM"] ?? { available: 0, locked: 0 };
    wallet.balances["DRAVYAM"].available += amount;

    wallet_events.add(event);
    awardedEvents.set(walletId, wallet_events);

    ledgerWrite({
      key: `reward:${randomUUID()}`,
      type: "karma_reward",
      node_id: walletId,
      data: { event, amount, currency: "DRAVYAM" },
      timestamp: new Date().toISOString(),
    });

    return { granted: true, amount };
  } catch { /* wallet not loaded */ }
  return { granted: false, amount: 0 };
}

// ─── Scheduled distribution (auto-start in production) ────────────────────────

let _distributionTimer: ReturnType<typeof setInterval> | null = null;

export function startDistributionScheduler(): void {
  if (_distributionTimer) return;
  _distributionTimer = setInterval(() => {
    for (const currency of (["DRAVYAM", "INR"] as DravyamCurrency[])) {
      distributePool(currency);
    }
  }, DISTRIBUTION_INTERVAL_MS);
}

export function stopDistributionScheduler(): void {
  if (_distributionTimer) { clearInterval(_distributionTimer); _distributionTimer = null; }
}
