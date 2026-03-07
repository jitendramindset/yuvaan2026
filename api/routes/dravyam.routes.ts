import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createOrder,
  captureTransaction,
  rollbackTransaction,
  getLedger,
} from "../../kernel/dravyam.engine.js";
import { validateWebhookSignature } from "../../kernel/webhook.engine.js";
import type {
  CreateOrderRequest,
  CapturePaymentRequest,
  RefundRequest,
  WebhookPayload,
} from "../../shared/types/payment.types.js";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end", () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

/**
 * POST /dravyam/create-order
 * Body: CreateOrderRequest
 */
export async function handleCreateOrder(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req) as CreateOrderRequest;
    const { order, tx } = createOrder(body);
    // Store tx in-flight (production: persist to LevelDB/Supabase)
    json(res, 201, { order, transaction: tx });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Unknown error" });
  }
}

/**
 * POST /dravyam/capture-payment
 * Body: CapturePaymentRequest
 * In production the tx would be loaded from persistence by transaction_id.
 */
export async function handleCapturePayment(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req) as CapturePaymentRequest & { tx: ReturnType<typeof createOrder>["tx"] };
    const entry = captureTransaction(body.tx);
    json(res, 200, { status: "success", ledger_entry: entry });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Unknown error" });
  }
}

/**
 * POST /dravyam/refund
 * Body: RefundRequest + tx object (production would load from DB)
 */
export async function handleRefund(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req) as RefundRequest & { tx: ReturnType<typeof createOrder>["tx"] };
    rollbackTransaction(body.tx);
    json(res, 200, { status: "rolled_back", transaction_id: body.transaction_id });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Unknown error" });
  }
}

/**
 * POST /dravyam/webhook
 * Validates HMAC-SHA256 signature before processing.
 */
export async function handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const payload = await readBody(req) as WebhookPayload;
    if (!validateWebhookSignature(payload)) {
      json(res, 401, { error: "Invalid webhook signature" });
      return;
    }
    // Process event (production: enqueue, update DB status)
    json(res, 200, { received: true, event: payload.event });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Unknown error" });
  }
}

/**
 * GET /dravyam/transaction-status?id=<transaction_id>
 * (Stub — production: query DB)
 */
export function handleTransactionStatus(_req: IncomingMessage, res: ServerResponse): void {
  const entries = getLedger().slice(-50);
  json(res, 200, { ledger: entries });
}

/**
 * Returns the list of route descriptors (used by server.ts route table).
 */
export function registerDravyamRoutes(): string[] {
  return [
    "POST /dravyam/create-order",
    "POST /dravyam/capture-payment",
    "POST /dravyam/refund",
    "POST /dravyam/webhook",
    "GET  /dravyam/transaction-status",
  ];
}
