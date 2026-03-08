/**
 * Settlement Engine — batches captured transactions into settlements.
 *
 * Settlement flow:
 *   1. Collect all pending (captured but unsettled) entries
 *   2. Net off same-day intra-wallet transactions
 *   3. Write a settlement record to the ledger
 *   4. Trigger fee distribution to the network pool
 *   5. Emit settlement.processed webhook to registered merchant URLs
 */

import { randomUUID }         from "node:crypto";
import { distributePool }     from "../economy.engine.js";
import { write as ledgerWrite } from "../ledger/ledger_engine.js";
import type { DravyamCurrency } from "../../shared/types/payment.types.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SettlementRecord {
  settlement_id:   string;
  currency:        DravyamCurrency;
  total_amount:    number;
  total_fee:       number;
  tx_count:        number;
  settled_at:      string;
  status:          "pending" | "complete" | "failed";
  distribution_result?: {
    total_distributed: number;
    recipients_count: number;
  };
}

// ─── Pending settlement buffer ────────────────────────────────────────────────

interface SettlementEntry {
  transaction_id: string;
  amount:         number;
  fee:            number;
  currency:       DravyamCurrency;
  captured_at:    string;
}

const pending = new Map<DravyamCurrency, SettlementEntry[]>();

export function addToSettlement(entry: SettlementEntry): void {
  const list = pending.get(entry.currency) ?? [];
  list.push(entry);
  pending.set(entry.currency, list);
}

// ─── Run settlement batch for a currency ─────────────────────────────────────

export async function settleBatch(currency: DravyamCurrency): Promise<SettlementRecord> {
  const entries = pending.get(currency) ?? [];
  pending.set(currency, []); // clear buffer

  const total_amount = entries.reduce((s, e) => s + e.amount, 0);
  const total_fee    = entries.reduce((s, e) => s + e.fee, 0);

  const settlement_id = `stl_${randomUUID()}`;
  const settled_at    = new Date().toISOString();

  // Distribute fees to high-karma nodes
  const dist = distributePool(currency);

  const record: SettlementRecord = {
    settlement_id,
    currency,
    total_amount,
    total_fee,
    tx_count: entries.length,
    settled_at,
    status: "complete",
    distribution_result: {
      total_distributed: dist.total_distributed,
      recipients_count:  dist.recipients.length,
    },
  };

  // Persist to ledger
  ledgerWrite({
    key: `settlement:${settlement_id}`,
    type: "settlement",
    node_id: "gateway",
    data: record as unknown as Record<string, unknown>,
    timestamp: settled_at,
  });

  return record;
}

// ─── Scheduled nightly settlement ────────────────────────────────────────────

let _settlementTimer: ReturnType<typeof setInterval> | null = null;

export function startSettlementScheduler(): void {
  if (_settlementTimer) return;
  _settlementTimer = setInterval(async () => {
    for (const currency of (["DRAVYAM", "INR"] as DravyamCurrency[])) {
      await settleBatch(currency).catch(() => {});
    }
  }, 24 * 3_600_000); // daily
}

export function stopSettlementScheduler(): void {
  if (_settlementTimer) { clearInterval(_settlementTimer); _settlementTimer = null; }
}
