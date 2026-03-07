/**
 * Dravyam Payment Engine — TypeScript types
 * Maps to nodes/economy/ node files
 */

// ─── Supported Currencies ─────────────────────────────────────────────────────

export type DravyamCurrency = "DRAVYAM" | "INR" | "USD" | "AED" | "EUR";

// ─── Transaction Status ───────────────────────────────────────────────────────

export type TransactionStatus =
  | "initiated"
  | "pending"
  | "success"
  | "failed"
  | "rolled_back";

// ─── Payment Methods ──────────────────────────────────────────────────────────

export type PaymentMethod = "internal" | "upi" | "bank_transfer" | "card" | "dravyam_token";

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type KycStatus = "pending" | "submitted" | "verified" | "rejected";

export interface CurrencyBalance {
  available: number;
  locked: number;
}

export interface WalletNode {
  wallet_id: string;
  owner_id: string;
  kyc_status: KycStatus;
  balances: Record<DravyamCurrency, CurrencyBalance>;
  linked_banks: string[];
  linked_cards: string[];
  daily_limit: Partial<Record<DravyamCurrency, number>>;
  is_frozen: boolean;
}

// ─── Bank Account ─────────────────────────────────────────────────────────────

export interface BankAccount {
  account_id: string;
  bank_name: string;
  account_number_masked: string;    // always store masked, e.g. "XXXX1234"
  ifsc: string;
  upi_id: string;
  verified: boolean;
  is_primary: boolean;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export type CardType = "debit" | "credit" | "prepaid";
export type CardNetwork = "visa" | "mastercard" | "rupay" | "amex";

export interface CardNode {
  card_id: string;
  card_type: CardType;
  network: CardNetwork;
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  token: string;                    // PCI-DSS tokenized, never raw PAN
  is_active: boolean;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface TransactionRecord {
  transaction_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  currency: DravyamCurrency;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  timestamp: string;                // ISO-8601
  reference_id: string;
  fee: number;
  fee_percent: number;              // e.g. 1 = 1%
  rollback_after_seconds: number;
  fraud_score: number;              // 0–100 from fraud.engine
}

// ─── Ledger ──────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  ledger_id: string;
  transaction_id: string;
  debit_wallet: string;
  credit_wallet: string;
  amount: number;
  currency: DravyamCurrency;
  balance_after: Partial<Record<DravyamCurrency, number>>;
  timestamp: string;
}

// ─── Fraud Monitor ────────────────────────────────────────────────────────────

export interface FraudSignal {
  transaction_id: string;
  ip: string;
  device_hash: string;
  velocity_count: number;
  geo_mismatch: boolean;
  risk_score: number;
  flagged_at: string;
}

// ─── Gateway API ──────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  from_wallet: string;
  to_wallet: string;
  amount: number;
  currency: DravyamCurrency;
  payment_method: PaymentMethod;
  reference_id?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  transaction_id: string;
  status: TransactionStatus;
  amount: number;
  currency: DravyamCurrency;
  fee: number;
}

export interface CapturePaymentRequest {
  transaction_id: string;
  order_id: string;
}

export interface RefundRequest {
  transaction_id: string;
  amount?: number;                  // partial refund if provided
  reason: string;
}

export interface WebhookPayload {
  event: "payment.success" | "payment.failed" | "payment.pending" | "refund.success";
  transaction_id: string;
  amount: number;
  currency: DravyamCurrency;
  signature: string;                // HMAC-SHA256 for validation
  timestamp: string;
}

// ─── Dravyam Distribution ─────────────────────────────────────────────────────

export interface DravyamDistributionRecord {
  pool_cycle: string;
  total_fees_collected: number;
  distributed_to: Array<{
    wallet_id: string;
    karma_score: number;
    amount: number;
  }>;
  timestamp: string;
}
