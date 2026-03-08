/**
 * Webhook Handler — processes inbound webhook events from payment providers.
 *
 * Supports:
 *   • NodeOS gateway webhooks (self-generated)
 *   • Razorpay-compatible webhook events
 *   • UPI callback events
 *
 * Every inbound webhook is signature-verified before processing.
 * All events are appended to the ledger.
 */

import { randomUUID }         from "node:crypto";
import { validateHMAC }       from "./signature.validator.js";
import { gatewayCapture, gatewayRefund }
                              from "./gateway.controller.js";
import { write as ledgerWrite } from "../ledger/ledger_engine.js";

// ─── Webhook event types ──────────────────────────────────────────────────────

export type WebhookEvent =
  | "payment.authorized"
  | "payment.captured"
  | "payment.failed"
  | "refund.created"
  | "refund.processed"
  | "order.paid"
  | "settlement.processed"
  | "upi.callback";

export interface InboundWebhook {
  event: WebhookEvent;
  payload: Record<string, unknown>;
  signature: string;         // X-NodeOS-Signature or X-Razorpay-Signature
  provider?: string;         // "nodeos" | "razorpay" | "upi"
  received_at?: string;
}

export interface WebhookResult {
  processed: boolean;
  event: WebhookEvent;
  action_taken: string;
  error?: string;
}

// ─── Processed event dedup (production: use Redis SETEX) ─────────────────────

const processedEvents = new Set<string>();

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleInboundWebhook(
  rawBody: string,
  signatureHeader: string,
  provider = "nodeos",
): Promise<WebhookResult> {
  // 1. Verify signature
  if (!validateHMAC(rawBody, signatureHeader)) {
    return { processed: false, event: "payment.failed", action_taken: "rejected", error: "Invalid signature" };
  }

  // 2. Parse
  let webhook: InboundWebhook;
  try {
    webhook = JSON.parse(rawBody) as InboundWebhook;
  } catch {
    return { processed: false, event: "payment.failed", action_taken: "rejected", error: "Invalid JSON" };
  }

  // 3. Dedup
  const eventKey = `${webhook.event}:${JSON.stringify(webhook.payload).slice(0, 120)}`;
  if (processedEvents.has(eventKey)) {
    return { processed: true, event: webhook.event, action_taken: "duplicate_skipped" };
  }
  processedEvents.add(eventKey);

  // 4. Route by event type
  let action_taken = "noop";

  try {
    switch (webhook.event) {
      case "payment.authorized":
      case "payment.captured": {
        const tx_id = webhook.payload["transaction_id"] as string | undefined;
        if (tx_id) {
          const result = await gatewayCapture({ transaction_id: tx_id });
          action_taken = result.success ? "captured" : `capture_failed:${result.error}`;
        }
        break;
      }
      case "payment.failed": {
        action_taken = "logged_failure";
        break;
      }
      case "refund.created": {
        const tx_id = webhook.payload["transaction_id"] as string | undefined;
        const reason = webhook.payload["reason"] as string | undefined;
        if (tx_id) {
          await gatewayRefund({ transaction_id: tx_id, reason });
          action_taken = "refund_processed";
        }
        break;
      }
      case "order.paid":
        action_taken = "order_paid_logged";
        break;
      case "settlement.processed":
        action_taken = "settlement_logged";
        break;
      case "upi.callback":
        action_taken = "upi_callback_logged";
        break;
      default:
        action_taken = "unknown_event";
    }
  } catch (e) {
    action_taken = `error:${e instanceof Error ? e.message : "unknown"}`;
  }

  // 5. Append to ledger (immutable audit trail)
  ledgerWrite({
    key: `webhook:${randomUUID()}`,
    type: "webhook_event",
    node_id: "gateway",
    data: {
      event: webhook.event,
      provider,
      action_taken,
      payload_hash: rawBody.length,
    },
    timestamp: new Date().toISOString(),
  });

  return { processed: true, event: webhook.event, action_taken };
}
