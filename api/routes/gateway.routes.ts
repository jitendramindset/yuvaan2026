/**
 * Gateway Routes — Razorpay-style payment gateway API
 *
 * POST /gateway/create-order      → initiate a signed order
 * POST /gateway/capture           → capture / settle payment
 * POST /gateway/refund            → refund a transaction
 * POST /gateway/webhook           → inbound webhook (signature-verified)
 * GET  /gateway/status/:txId      → transaction status
 * GET  /gateway/market            → current DRAVYAM price & market state
 * POST /gateway/distribute        → trigger manual pool distribution (admin)
 * GET  /gateway/pool              → network pool balances
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  gatewayCreateOrder,
  gatewayCapture,
  gatewayRefund,
  getInflightTx,
} from "../../kernel/gateway/gateway.controller.js";
import { handleInboundWebhook }  from "../../kernel/gateway/webhook.handler.js";
import { generateOrder }         from "../../kernel/gateway/order.generator.js";
import { computePrice, getMarketState, getPriceHistory }
                                 from "../../kernel/price.engine.js";
import { distributePool, getNetworkPool }
                                 from "../../kernel/economy.engine.js";
import type {
  GatewayCreateOrderRequest,
  DravyamCurrency,
} from "../../shared/types/payment.types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end",  () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

async function readRaw(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end",  () => resolve(data));
    req.on("error", reject);
  });
}

function getIP(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim() ?? "0.0.0.0";
  return req.socket.remoteAddress ?? "0.0.0.0";
}

// ─── POST /gateway/create-order ──────────────────────────────────────────────

export async function handleGatewayCreateOrder(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req) as GatewayCreateOrderRequest;
    const ip   = getIP(req);

    // Generate a signed order first
    const signedOrder = generateOrder({
      amount:         body.amount,
      currency:       body.currency,
      from_wallet:    body.from_wallet,
      to_wallet:      body.to_wallet,
      payment_method: body.payment_method,
      reference_id:   body.reference_id,
    });

    // Feed into gateway controller (handles fraud + trust + fund lock)
    const result = await gatewayCreateOrder({
      ...body,
      ip,
      device_hash:    body.device_hash    ?? req.headers["x-device-hash"] as string ?? "unknown",
      velocity_count: body.velocity_count ?? 0,
      geo_mismatch:   body.geo_mismatch   ?? false,
      trust_score:    body.trust_score    ?? 50,
    });

    if (!result.success) {
      json(res, result.fraud_blocked || result.trust_blocked ? 403 : 400, {
        ...result,
        signed_order: signedOrder,
      });
      return;
    }

    json(res, 201, {
      ...result,
      signed_order: signedOrder,
    });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Order creation failed" });
  }
}

// ─── POST /gateway/capture ────────────────────────────────────────────────────

export async function handleGatewayCapture(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req) as { transaction_id: string; payment_signature?: string };
    const result = await gatewayCapture(body);
    json(res, result.success ? 200 : 400, result);
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Capture failed" });
  }
}

// ─── POST /gateway/refund ─────────────────────────────────────────────────────

export async function handleGatewayRefund(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req) as { transaction_id: string; reason?: string };
    const result = await gatewayRefund(body);
    json(res, result.success ? 200 : 400, result);
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Refund failed" });
  }
}

// ─── POST /gateway/webhook ────────────────────────────────────────────────────

export async function handleGatewayWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const rawBody  = await readRaw(req);
    const sigHeader = (req.headers["x-nodeos-signature"] ?? req.headers["x-razorpay-signature"] ?? "") as string;
    const provider  = (req.headers["x-provider"] ?? "nodeos") as string;

    const result = await handleInboundWebhook(rawBody, sigHeader, provider);
    json(res, result.processed ? 200 : 400, result);
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Webhook processing failed" });
  }
}

// ─── GET /gateway/status/:txId ────────────────────────────────────────────────

export function handleGatewayStatus(req: IncomingMessage, res: ServerResponse): void {
  const txId = (req.url ?? "").split("/").pop() ?? "";
  const tx   = getInflightTx(txId);
  if (!tx) {
    // Not in-flight → may be already captured; return a generic response
    json(res, 200, {
      transaction_id: txId,
      status: "completed_or_not_found",
      message: "Transaction was captured, rolled back, or the id is invalid.",
    });
    return;
  }
  json(res, 200, {
    transaction_id: tx.transaction_id,
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    fee: tx.fee,
    fraud_score: tx.fraud_score,
    timestamp: tx.timestamp,
  });
}

// ─── GET /gateway/market ──────────────────────────────────────────────────────

export function handleMarketPrice(req: IncomingMessage, res: ServerResponse): void {
  const snap  = computePrice();
  const url   = req.url ?? "";
  const hours = parseInt(new URL(`http://x${url}`).searchParams.get("hours") ?? "24", 10);
  const history = getPriceHistory(isNaN(hours) ? 24 : hours);
  json(res, 200, { snapshot: snap, history });
}

// ─── POST /gateway/distribute ─────────────────────────────────────────────────

export async function handleDistribute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req) as { currency?: DravyamCurrency };
    const currency = body.currency ?? "DRAVYAM";
    const result = distributePool(currency);
    json(res, 200, result);
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Distribution failed" });
  }
}

// ─── GET /gateway/pool ────────────────────────────────────────────────────────

export function handleGetPool(_req: IncomingMessage, res: ServerResponse): void {
  json(res, 200, { pool: getNetworkPool() });
}
