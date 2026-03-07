import type { LedgerRecord } from "../../shared/types/ledger.types.js";

const ledger: LedgerRecord[] = [];

export function write(record: LedgerRecord): void {
  ledger.push(record);
}

export function read(key: string): LedgerRecord | undefined {
  return ledger.filter((r) => r.key === key).at(-1);
}

export function all(): LedgerRecord[] {
  return [...ledger];
}
