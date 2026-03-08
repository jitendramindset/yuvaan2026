/**
 * Node Hash — deterministic SHA3-256 content hash for a NodeRecord.
 *
 * Identical to kernel/hash.engine.ts but exposed here so storage-layer
 * code has no circular dependency on the kernel package.
 *
 * The hash excludes mutable metadata fields that change on every write
 * (state_hash, updated_at, last_sync_at) so the hash is stable for the
 * same logical content.
 */
import { createHash } from "node:crypto";
import type { NodeRecord } from "../shared/types/node.types.js";

const EXCLUDE_KEYS = new Set([
  "state_hash",
  "version_hash",
  "previous_version_hash",
  "updated_at",
  "last_sync_at",
  "last_check",
]);

/**
 * Returns a hex-encoded SHA3-256 digest of the node's stable fields.
 */
export function hashNode(node: NodeRecord): string {
  const stable: Record<string, unknown> = {};
  for (const key of Object.keys(node).sort()) {
    if (!EXCLUDE_KEYS.has(key)) {
      stable[key] = (node as Record<string, unknown>)[key];
    }
  }
  return createHash("sha3-256")
    .update(JSON.stringify(stable))
    .digest("hex");
}
