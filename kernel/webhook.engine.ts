import { createHmac } from "node:crypto";
import type { WebhookPayload } from "../shared/types/payment.types.js";

const GATEWAY_WEBHOOK_SECRET = process.env["DRAVYAM_WEBHOOK_SECRET"] ?? "changeme-in-production";

/**
 * Validates an inbound webhook signature.
 * Signature = HMAC-SHA256(transaction_id + ":" + amount + ":" + timestamp, secret)
 *
 * Returns true if the signature matches, false otherwise.
 * Never throws — always returns a boolean so callers can reject cleanly.
 */
export function validateWebhookSignature(payload: WebhookPayload): boolean {
  const data = `${payload.transaction_id}:${payload.amount}:${payload.timestamp}`;
  const expected = createHmac("sha256", GATEWAY_WEBHOOK_SECRET).update(data).digest("hex");
  // Constant-time comparison via XOR to prevent timing attacks
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(payload.signature.length === expected.length ? payload.signature : expected, "hex");
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/**
 * Generates an HMAC-SHA256 signature for outbound webhook calls.
 */
export function signWebhookPayload(transactionId: string, amount: number, timestamp: string): string {
  const data = `${transactionId}:${amount}:${timestamp}`;
  return createHmac("sha256", GATEWAY_WEBHOOK_SECRET).update(data).digest("hex");
}
