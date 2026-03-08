/**
 * Order Generator — creates a signed gateway order.
 *
 * Signs the order payload with HMAC-SHA256 using the gateway secret key.
 * The signature is included in the response so the client (or merchant)
 * can independently verify the order has not been tampered with.
 */

import { createHmac, randomUUID } from "node:crypto";

// ─── Secret key (load from env in production) ─────────────────────────────────

const GATEWAY_SECRET = process.env["NODEOS_GATEWAY_SECRET"] ?? "nodeos-gateway-dev-secret-change-me";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayOrder {
  order_id:      string;
  amount:        number;
  currency:      string;
  from_wallet:   string;
  to_wallet:     string;
  payment_method: string;
  reference_id:  string;
  created_at:    string;
  expires_at:    string;    // order valid for 15 min
  signature:     string;   // HMAC-SHA256 of the canonical payload
}

// ─── Canonical payload builder ────────────────────────────────────────────────

function buildCanonical(order: Omit<GatewayOrder, "signature">): string {
  const keys = Object.keys(order).sort() as Array<keyof typeof order>;
  return keys.map((k) => `${k}=${order[k]}`).join("&");
}

// ─── Generate a signed order ──────────────────────────────────────────────────

export function generateOrder(params: {
  amount:         number;
  currency:       string;
  from_wallet:    string;
  to_wallet:      string;
  payment_method: string;
  reference_id?:  string;
}): GatewayOrder {
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60_000); // +15 min

  const base: Omit<GatewayOrder, "signature"> = {
    order_id:       `ord_${randomUUID()}`,
    amount:         params.amount,
    currency:       params.currency,
    from_wallet:    params.from_wallet,
    to_wallet:      params.to_wallet,
    payment_method: params.payment_method,
    reference_id:   params.reference_id ?? `ref_${randomUUID()}`,
    created_at:     now.toISOString(),
    expires_at:     expires.toISOString(),
  };

  const signature = createHmac("sha256", GATEWAY_SECRET)
    .update(buildCanonical(base))
    .digest("hex");

  return { ...base, signature };
}

// ─── Verify a signed order ────────────────────────────────────────────────────

export function verifyOrderSignature(order: GatewayOrder): boolean {
  const { signature, ...rest } = order;
  const expected = createHmac("sha256", GATEWAY_SECRET)
    .update(buildCanonical(rest))
    .digest("hex");
  // Constant-time comparison via hmac double-wrap
  const check = createHmac("sha256", GATEWAY_SECRET).update(signature).digest("hex");
  const expCheck = createHmac("sha256", GATEWAY_SECRET).update(expected).digest("hex");
  return check === expCheck;
}

// ─── Check order expiry ───────────────────────────────────────────────────────

export function isOrderExpired(order: GatewayOrder): boolean {
  return new Date(order.expires_at) < new Date();
}
