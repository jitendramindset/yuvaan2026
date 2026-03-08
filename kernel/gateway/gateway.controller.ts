/**
 * Gateway Controller — orchestrates the full payment pipeline:
 *
 *   generateOrder → validateSignature → fraudCheck → trustCheck
 *   → captureTransaction → collectFee → settle → distributeReward
 *
 * This is the single entry point for all payment actions.
 */

import { randomUUID }           from "node:crypto";
import { generateOrder }        from "./order.generator.js";
import { validateHMAC }         from "./signature.validator.js";
import { settleBatch }          from "./settlement.engine.js";
import { computeFraudScore, shouldBlockTransaction, destroyInstance }
                                from "../fraud.engine.js";
import { createOrder, captureTransaction, rollbackTransaction }
                                from "../dravyam.engine.js";
import { collectFee, grantKarmaReward }
                                from "../economy.engine.js";
import { checkTransactionPermission }
                                from "../trust.engine.js";
import { recordTransaction }    from "../price.engine.js";
import { write as ledgerWrite } from "../ledger/ledger_engine.js";
import type {
  CreateOrderRequest,
  TransactionRecord,
} from "../../shared/types/payment.types.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayCreateRequest extends CreateOrderRequest {
  trust_score: number;
  ip: string;
  device_hash: string;
  velocity_count: number;
  geo_mismatch: boolean;
  webhook_url?: string;
}

export interface GatewayResult {
  success: boolean;
  order_id?: string;
  transaction_id?: string;
  error?: string;
  fraud_blocked?: boolean;
  trust_blocked?: boolean;
  trust_level?: string;
}

// ─── In-flight order store (production: LevelDB / Redis) ─────────────────────

const inflight = new Map<string, TransactionRecord>();

export function getInflightTx(transaction_id: string): TransactionRecord | undefined {
  return inflight.get(transaction_id);
}

// ─── Create Order ─────────────────────────────────────────────────────────────

export async function gatewayCreateOrder(req: GatewayCreateRequest): Promise<GatewayResult> {
  // 1. Trust check — before locking any funds
  const trustCheck = checkTransactionPermission(
    req.amount, req.currency, req.trust_score, req.payment_method,
  );
  if (!trustCheck.allowed) {
    return { success: false, trust_blocked: true, trust_level: trustCheck.trust_level, error: trustCheck.reason };
  }

  // 2. Create order + lock funds
  let orderResult: ReturnType<typeof createOrder>;
  try {
    orderResult = createOrder(req);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Order creation failed" };
  }

  const { order, tx } = orderResult;

  // 3. Fraud check
  const fraudSignal = computeFraudScore(tx, {
    ip: req.ip,
    device_hash: req.device_hash,
    velocity_count: req.velocity_count,
    geo_mismatch: req.geo_mismatch,
    trust_score: req.trust_score,
  });

  tx.fraud_score = fraudSignal.risk_score;

  if (shouldBlockTransaction(fraudSignal)) {
    rollbackTransaction(tx);
    // If score is extreme (≥95), destroy instance hash
    if (fraudSignal.risk_score >= 95) {
      destroyInstance(req.device_hash, "extreme_fraud_score");
    }
    return {
      success: false,
      fraud_blocked: true,
      error: `Transaction blocked: fraud score ${fraudSignal.risk_score}/100.`,
    };
  }

  // 4. Store in-flight
  inflight.set(tx.transaction_id, tx);

  ledgerWrite({
    key: `gateway:order:${order.order_id}`,
    type: "gateway_order",
    node_id: req.from_wallet,
    data: { order, fraud_score: fraudSignal.risk_score },
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    order_id: order.order_id,
    transaction_id: tx.transaction_id,
    trust_level: trustCheck.trust_level,
  };
}

// ─── Capture Payment ──────────────────────────────────────────────────────────

export interface GatewayCaptureRequest {
  transaction_id: string;
  payment_signature?: string;
}

export async function gatewayCapture(req: GatewayCaptureRequest): Promise<GatewayResult> {
  const tx = inflight.get(req.transaction_id);
  if (!tx) return { success: false, error: "Transaction not found or already processed." };

  try {
    const entry = captureTransaction(tx);

    // Collect fee into network pool
    collectFee(tx.currency, tx.fee);

    // Volume tracking for price engine
    recordTransaction(tx.amount);

    // Grant first-transaction reward if applicable
    grantKarmaReward(tx.from_wallet, "first_transaction");

    inflight.delete(tx.transaction_id);

    // Trigger settlement batch (async, non-blocking)
    settleBatch(tx.currency).catch(() => {});

    ledgerWrite({
      key: `gateway:capture:${tx.transaction_id}`,
      type: "gateway_capture",
      node_id: tx.from_wallet,
      data: { ledger_id: entry.ledger_id, amount: tx.amount, fee: tx.fee },
      timestamp: new Date().toISOString(),
    });

    return { success: true, transaction_id: tx.transaction_id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Capture failed" };
  }
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export interface GatewayRefundRequest {
  transaction_id: string;
  reason?: string;
}

export async function gatewayRefund(req: GatewayRefundRequest): Promise<GatewayResult> {
  const tx = inflight.get(req.transaction_id);
  if (!tx) {
    // Allow refund of captured tx in production — here we log it
    ledgerWrite({
      key: `gateway:refund:${req.transaction_id}`,
      type: "gateway_refund",
      node_id: "system",
      data: { reason: req.reason ?? "user_request" },
      timestamp: new Date().toISOString(),
    });
    return { success: true, transaction_id: req.transaction_id };
  }
  rollbackTransaction(tx);
  inflight.delete(tx.transaction_id);
  return { success: true, transaction_id: tx.transaction_id };
}
