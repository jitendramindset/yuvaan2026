import { randomUUID } from "node:crypto";
import type {
  WalletNode,
  TransactionRecord,
  LedgerEntry,
  CreateOrderRequest,
  CreateOrderResponse,
  DravyamCurrency,
} from "../shared/types/payment.types.js";

const DRAVYAM_FEE_PERCENT = 1; // 1% platform fee
const ROLLBACK_AFTER_SECONDS = 60;

// In-memory balance store (replace with LevelDB/Supabase in production)
const wallets = new Map<string, WalletNode>();
const ledger: LedgerEntry[] = [];

/**
 * Register a wallet in the engine (called at node load time).
 */
export function registerWallet(wallet: WalletNode): void {
  wallets.set(wallet.wallet_id, wallet);
}

/**
 * Returns the registered wallet or throws.
 */
export function getWallet(walletId: string): WalletNode {
  const w = wallets.get(walletId);
  if (!w) throw new Error(`Wallet not found: ${walletId}`);
  return w;
}

/**
 * Creates an order (initiates a transaction).
 *
 * Flow:
 *   1. Validate wallet balances
 *   2. Lock funds on sender
 *   3. Return transaction record in "initiated" state
 *
 * Caller must invoke captureTransaction() to complete.
 */
export function createOrder(req: CreateOrderRequest): { order: CreateOrderResponse; tx: TransactionRecord } {
  const sender = getWallet(req.from_wallet);

  if (sender.is_frozen) {
    throw new Error(`Wallet ${req.from_wallet} is frozen.`);
  }

  const currency = req.currency as DravyamCurrency;
  const balance = sender.balances[currency];
  const fee = Math.round(req.amount * DRAVYAM_FEE_PERCENT) / 100;
  const total = req.amount + fee;

  if (balance.available < total) {
    throw new Error(`Insufficient balance: needed ${total} ${currency}, available ${balance.available}`);
  }

  // Lock funds
  balance.available -= total;
  balance.locked += total;

  const transactionId = `tx_${randomUUID()}`;
  const orderId = `ord_${randomUUID()}`;

  const tx: TransactionRecord = {
    transaction_id: transactionId,
    from_wallet: req.from_wallet,
    to_wallet: req.to_wallet,
    amount: req.amount,
    currency,
    payment_method: req.payment_method,
    status: "initiated",
    timestamp: new Date().toISOString(),
    reference_id: req.reference_id ?? orderId,
    fee,
    fee_percent: DRAVYAM_FEE_PERCENT,
    rollback_after_seconds: ROLLBACK_AFTER_SECONDS,
    fraud_score: 0,
  };

  return {
    order: { order_id: orderId, transaction_id: transactionId, status: "initiated", amount: req.amount, currency, fee },
    tx,
  };
}

/**
 * Captures a previously initiated transaction.
 * Releases locked funds from sender and credits receiver.
 */
export function captureTransaction(tx: TransactionRecord): LedgerEntry {
  const sender = getWallet(tx.from_wallet);
  const receiver = getWallet(tx.to_wallet);
  const currency = tx.currency;
  const total = tx.amount + tx.fee;

  // Release lock and deduct from sender
  sender.balances[currency].locked -= total;

  // Credit receiver (net of fee)
  receiver.balances[currency].available += tx.amount;

  tx.status = "success";

  const entry: LedgerEntry = {
    ledger_id: `ldg_${randomUUID()}`,
    transaction_id: tx.transaction_id,
    debit_wallet: tx.from_wallet,
    credit_wallet: tx.to_wallet,
    amount: tx.amount,
    currency,
    balance_after: {
      [currency]: sender.balances[currency].available,
    },
    timestamp: new Date().toISOString(),
  };

  ledger.push(entry);
  return entry;
}

/**
 * Rolls back a transaction — restores locked funds to sender.
 */
export function rollbackTransaction(tx: TransactionRecord): void {
  const sender = getWallet(tx.from_wallet);
  const currency = tx.currency;
  const total = tx.amount + tx.fee;

  sender.balances[currency].locked -= total;
  sender.balances[currency].available += total;
  tx.status = "rolled_back";
}

/**
 * Returns the immutable ledger (read-only copy).
 */
export function getLedger(): Readonly<LedgerEntry[]> {
  return ledger;
}
