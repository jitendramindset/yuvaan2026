/**
 * Trust Engine — maps profile trust levels to wallet limits and permissions.
 *
 * Trust score is the profile completion / karma amalgamation score (0–100):
 *   Seed   (0–39)  → very limited
 *   Sprout (40–59) → basic limits
 *   Root   (60–79) → elevated limits
 *   Elder  (80–100)→ full access
 *
 * This engine is the bridge between Vanshawali (identity) and Dravyam (finance).
 */

import type { DravyamCurrency, WalletNode } from "../shared/types/payment.types.js";

// ─── Trust Levels ─────────────────────────────────────────────────────────────

export type TrustLevel = "Seed" | "Sprout" | "Root" | "Elder";

export function trustLevelFromScore(score: number): TrustLevel {
  if (score >= 80) return "Elder";
  if (score >= 60) return "Root";
  if (score >= 40) return "Sprout";
  return "Seed";
}

// ─── Wallet Limits per Trust Level ────────────────────────────────────────────

interface TrustLimits {
  daily_limit_INR: number;
  daily_limit_DRAVYAM: number;
  single_tx_limit_INR: number;
  single_tx_limit_DRAVYAM: number;
  can_send_external: boolean;   // bank transfer / UPI
  can_hold_card: boolean;
  can_create_circles: number;   // max circles
  can_share_location: boolean;
  max_lifebook_files: number;   // storage quota (items)
  max_vault_files: number;
  vault_ttl_days: number;       // default file expiry
}

const TRUST_LIMITS: Record<TrustLevel, TrustLimits> = {
  Seed: {
    daily_limit_INR: 1_000,
    daily_limit_DRAVYAM: 100,
    single_tx_limit_INR: 500,
    single_tx_limit_DRAVYAM: 50,
    can_send_external: false,
    can_hold_card: false,
    can_create_circles: 1,
    can_share_location: false,
    max_lifebook_files: 10,
    max_vault_files: 5,
    vault_ttl_days: 7,
  },
  Sprout: {
    daily_limit_INR: 10_000,
    daily_limit_DRAVYAM: 1_000,
    single_tx_limit_INR: 5_000,
    single_tx_limit_DRAVYAM: 500,
    can_send_external: false,
    can_hold_card: false,
    can_create_circles: 3,
    can_share_location: true,
    max_lifebook_files: 50,
    max_vault_files: 20,
    vault_ttl_days: 30,
  },
  Root: {
    daily_limit_INR: 100_000,
    daily_limit_DRAVYAM: 10_000,
    single_tx_limit_INR: 50_000,
    single_tx_limit_DRAVYAM: 5_000,
    can_send_external: true,
    can_hold_card: true,
    can_create_circles: 10,
    can_share_location: true,
    max_lifebook_files: 200,
    max_vault_files: 100,
    vault_ttl_days: 365,
  },
  Elder: {
    daily_limit_INR: 1_000_000,
    daily_limit_DRAVYAM: 100_000,
    single_tx_limit_INR: 500_000,
    single_tx_limit_DRAVYAM: 50_000,
    can_send_external: true,
    can_hold_card: true,
    can_create_circles: 50,
    can_share_location: true,
    max_lifebook_files: 2_000,
    max_vault_files: 1_000,
    vault_ttl_days: 3_650,  // 10 years
  },
};

export function getLimitsForScore(score: number): TrustLimits {
  return TRUST_LIMITS[trustLevelFromScore(score)];
}

export function getLimitsForLevel(level: TrustLevel): TrustLimits {
  return TRUST_LIMITS[level];
}

// ─── Permission Checks ────────────────────────────────────────────────────────

export interface TransactionPermissionResult {
  allowed: boolean;
  reason?: string;
  trust_level: TrustLevel;
  limits: TrustLimits;
}

export function checkTransactionPermission(
  amount: number,
  currency: DravyamCurrency,
  trustScore: number,
  method: string,
): TransactionPermissionResult {
  const level  = trustLevelFromScore(trustScore);
  const limits = TRUST_LIMITS[level];

  if (currency === "INR") {
    if (amount > limits.single_tx_limit_INR) {
      return {
        allowed: false,
        reason: `Single transaction limit for ${level} is ₹${limits.single_tx_limit_INR.toLocaleString()}. Your trust score (${trustScore}) must reach the next level.`,
        trust_level: level,
        limits,
      };
    }
  }
  if (currency === "DRAVYAM") {
    if (amount > limits.single_tx_limit_DRAVYAM) {
      return {
        allowed: false,
        reason: `Single transaction limit for ${level} is ⬡${limits.single_tx_limit_DRAVYAM.toLocaleString()} DRAVYAM.`,
        trust_level: level,
        limits,
      };
    }
  }
  if ((method === "bank_transfer" || method === "upi") && !limits.can_send_external) {
    return {
      allowed: false,
      reason: `External transfers (${method}) require Sprout level trust or above. Complete your profile to unlock.`,
      trust_level: level,
      limits,
    };
  }

  return { allowed: true, trust_level: level, limits };
}

// ─── Apply limits to wallet node ─────────────────────────────────────────────

export function applyTrustLimitsToWallet(wallet: WalletNode, trustScore: number): WalletNode {
  const limits = getLimitsForScore(trustScore);
  wallet.daily_limit = {
    INR: limits.daily_limit_INR,
    DRAVYAM: limits.daily_limit_DRAVYAM,
    USD: Math.floor(limits.daily_limit_INR / 85),
    AED: Math.floor(limits.daily_limit_INR / 23),
    EUR: Math.floor(limits.daily_limit_INR / 90),
  };
  return wallet;
}
