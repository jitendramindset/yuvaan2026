export interface SyncRequest {
  deviceId: string;
  knownRootHash: string;
}

export interface SyncDelta {
  missingHashes: string[];
  updatedNodes: string[];
}
