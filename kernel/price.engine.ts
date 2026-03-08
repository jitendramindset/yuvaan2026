/**
 * Dravyam Price Engine — token price based on supply, demand, volume, and trust.
 *
 * Price formula:
 *   base_price = total_value_in_system / circulating_supply
 *   demand_factor = recent_tx_volume / moving_average_volume   (clamped 0.5–2.0)
 *   trust_factor  = network_avg_trust / 100                    (0.0–1.0, min 0.5)
 *   price = base_price × demand_factor × trust_factor
 *
 * Stored in dravyam.market.node
 */

import { randomUUID } from "node:crypto";
import { write as ledgerWrite } from "./ledger/ledger_engine.js";

// ─── Market State ─────────────────────────────────────────────────────────────

interface PriceSnapshot {
  timestamp:         string;
  price_inr:         number;
  price_usd:         number;
  circulating_supply: number;
  market_cap_inr:    number;
  demand_factor:     number;
  trust_factor:      number;
  tx_volume_24h:     number;
}

interface MarketState {
  circulating_supply:  number;   // total DRAVYAM tokens issued
  total_value_inr:     number;   // total INR equivalent in all wallets
  tx_volume_history:   number[]; // last 24 hourly volume samples
  network_trust_sum:   number;   // sum of all node trust scores
  network_node_count:  number;
  current_price_inr:   number;
  last_updated:        string;
  history:             PriceSnapshot[];
}

const state: MarketState = {
  circulating_supply:  10_000_000, // initial issuance: 10M tokens
  total_value_inr:     50_000_000, // initial collateral: ₹5 crore
  tx_volume_history:   Array(24).fill(0),
  network_trust_sum:   0,
  network_node_count:  0,
  current_price_inr:   5,          // initial price: ₹5 per DRAVYAM
  last_updated:        new Date().toISOString(),
  history:             [],
};

// ─── USD/INR rate (would be fed from an external oracle in production) ────────
let usd_inr_rate = 83.5;

export function setUsdInrRate(rate: number): void { usd_inr_rate = rate; }

// ─── Register a transaction for volume tracking ────────────────────────────────

export function recordTransaction(amount_inr: number): void {
  const currentHourIdx = new Date().getHours();
  state.tx_volume_history[currentHourIdx] =
    (state.tx_volume_history[currentHourIdx] ?? 0) + amount_inr;
}

// ─── Update network trust (called after karma recalculation) ──────────────────

export function updateNetworkTrust(avg_trust: number, node_count: number): void {
  state.network_trust_sum  = avg_trust * node_count;
  state.network_node_count = node_count;
}

// ─── Issuance (mint new tokens on karma milestones) ───────────────────────────

export function mintTokens(amount: number): void {
  state.circulating_supply += amount;
}

// ─── Core price calculation ───────────────────────────────────────────────────

export function computePrice(): PriceSnapshot {
  const supply = Math.max(1, state.circulating_supply);

  // base price from collateral
  const base_price = state.total_value_inr / supply;

  // demand = current 24h volume vs average
  const totalVol = state.tx_volume_history.reduce((a, b) => a + b, 0);
  const avgVol   = totalVol / 24;
  const currentVol = totalVol; // last 24h
  const demand_factor = avgVol === 0 ? 1
    : Math.max(0.5, Math.min(2.0, currentVol / (avgVol * 24)));

  // trust = network average trust normalised
  const avg_trust = state.network_node_count === 0 ? 50
    : state.network_trust_sum / state.network_node_count;
  const trust_factor = Math.max(0.5, avg_trust / 100);

  const price_inr = Math.round(base_price * demand_factor * trust_factor * 100) / 100;
  const price_usd = Math.round((price_inr / usd_inr_rate) * 10000) / 10000;
  const market_cap_inr = Math.round(price_inr * supply);

  const snap: PriceSnapshot = {
    timestamp: new Date().toISOString(),
    price_inr,
    price_usd,
    circulating_supply: supply,
    market_cap_inr,
    demand_factor,
    trust_factor,
    tx_volume_24h: currentVol,
  };

  state.current_price_inr = price_inr;
  state.last_updated = snap.timestamp;
  state.history = [...state.history.slice(-719), snap]; // keep last 30 days of hourly

  ledgerWrite({
    key: `price:${randomUUID()}`,
    type: "price_snapshot",
    node_id: "dravyam.market.node",
    data: snap as unknown as Record<string, unknown>,
    timestamp: snap.timestamp,
  });

  return snap;
}

export function getCurrentPrice(): number { return state.current_price_inr; }
export function getMarketState(): Readonly<MarketState> { return state; }
export function getPriceHistory(hours = 24): PriceSnapshot[] {
  return state.history.slice(-Math.min(hours, state.history.length));
}

// ─── Auto-recalculate every hour ─────────────────────────────────────────────

let _priceTimer: ReturnType<typeof setInterval> | null = null;

export function startPriceEngine(): void {
  if (_priceTimer) return;
  computePrice(); // initial snapshot
  _priceTimer = setInterval(() => {
    // Reset current hour bucket
    const h = new Date().getHours();
    state.tx_volume_history[h] = 0;
    computePrice();
  }, 3_600_000);
}

export function stopPriceEngine(): void {
  if (_priceTimer) { clearInterval(_priceTimer); _priceTimer = null; }
}
