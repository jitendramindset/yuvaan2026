import { randomUUID } from "node:crypto";
import { computeStateHash } from "./hash.engine.js";
import { appendLog } from "./log.engine.js";
import type { NodeRecord } from "../shared/types/node.types.js";

export interface SyncRequest {
  localNode: NodeRecord;
  remoteStateHash: string;
  deviceId?: string;
}

export interface SyncResult {
  synced: boolean;
  localHash: string;
  remoteHash: string;
  /** True when hashes diverged and conflict resolution is needed. */
  conflict: boolean;
}

/**
 * Compares local state hash against the remote hash received from a peer.
 *
 * If hashes match → already in sync.
 * If hashes differ → logs a mismatch event; caller is responsible for
 *   pulling the remote event log and replaying events.
 *
 * Conflict resolution priority (applied by caller after replay):
 *   1. Latest timestamp
 *   2. Higher karma_score
 *   3. Owner node priority
 */
export async function syncNode(request: SyncRequest): Promise<SyncResult> {
  const { localNode, remoteStateHash, deviceId = "unknown" } = request;
  const localHash = computeStateHash(localNode);

  if (localHash === remoteStateHash) {
    return { synced: true, localHash, remoteHash: remoteStateHash, conflict: false };
  }

  await appendLog({
    event_id: randomUUID(),
    node_id: localNode.nid_hash ?? localNode.node_id ?? "unknown",
    action: "sync:hash_mismatch",
    timestamp: new Date().toISOString(),
    result: "requires_replay",
    device_id: deviceId,
  });

  return { synced: false, localHash, remoteHash: remoteStateHash, conflict: true };
}
