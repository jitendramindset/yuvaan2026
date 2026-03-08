/**
 * Signature Validator — HMAC-SHA256 webhook + request signature verification.
 *
 * Used for:
 *   • Validating incoming webhook payloads from payment providers
 *   • Verifying signed gateway order objects
 *   • Client-signed API requests (future)
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const GATEWAY_SECRET = process.env["NODEOS_GATEWAY_SECRET"] ?? "nodeos-gateway-dev-secret-change-me";
const WEBHOOK_SECRET = process.env["NODEOS_WEBHOOK_SECRET"] ?? "nodeos-webhook-dev-secret-change-me";

// ─── HMAC helpers ─────────────────────────────────────────────────────────────

function hmacSha256(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch { return false; }
}

// ─── Validate Webhook signature (Razorpay-compatible format) ──────────────────

/**
 * Validates a webhook payload using `X-NodeOS-Signature` header.
 * Header format: `sha256=<hmac_hex>`
 */
export function validateHMAC(
  rawBody: string,
  signatureHeader: string,
  secret = WEBHOOK_SECRET,
): boolean {
  if (!signatureHeader) return false;
  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;
  const expected = hmacSha256(secret, rawBody);
  return safeEqual(provided, expected);
}

/**
 * Generates a webhook signature for outgoing webhook dispatch.
 */
export function signPayload(payload: string, secret = WEBHOOK_SECRET): string {
  return `sha256=${hmacSha256(secret, payload)}`;
}

// ─── Validate gateway order signature ─────────────────────────────────────────

export function validateOrderSignature(
  canonical: string,
  signature: string,
): boolean {
  const expected = hmacSha256(GATEWAY_SECRET, canonical);
  return safeEqual(signature, expected);
}

// ─── Build canonical string from object ───────────────────────────────────────

export function buildCanonical(obj: Record<string, unknown>): string {
  return Object.keys(obj)
    .sort()
    .map((k) => `${k}=${String(obj[k])}`)
    .join("&");
}
