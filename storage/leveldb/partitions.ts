export type PartitionName =
  | "nodes"
  | "ledger"
  | "blobs"
  | "permissions"
  | "sessions";

export function prefixFor(partition: PartitionName): string {
  return `${partition}:`;
}
