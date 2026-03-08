export interface LedgerRecord {
  key:       string;
  /** Discriminator for the event type (e.g. "distribution", "karma_reward", "gateway_order") */
  type?:     string;
  /** Source node that generated this record */
  node_id?:  string;
  /** Structured payload for this record type */
  data?:     Record<string, unknown>;
  /** Legacy flat value field — kept for back-compat */
  value?:    Record<string, unknown>;
  timestamp: string;
}
