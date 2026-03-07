/**
 * Peer Discovery Engine
 *
 * Maintains a registry of known peer nodes and implements the ping/pong
 * protocol for liveness checking.
 *
 * Connection types:
 *   local    — LAN (192.168.x.x), used for fast sync
 *   location — Bluetooth / WiFi Direct / GPS proximity, offline communication
 *   online   — Internet relay, cloud sync and remote workflows
 *   channel  — Messaging platforms (Telegram, WhatsApp, Slack, Email)
 */

export type PeerConnectionType = "local" | "location" | "online" | "channel";

export interface PeerNode {
  node_id: string;
  address: string;
  connection_type: PeerConnectionType;
  last_seen: string;
  state_hash?: string;
  is_active: boolean;
}

export interface PeerPingMessage {
  event: "peer_ping";
  node_id: string;
  timestamp: string;
  state_hash: string;
}

export interface PeerPongMessage {
  event: "peer_alive";
  node_id: string;
  timestamp: string;
}

const registry = new Map<string, PeerNode>();

/** Adds or updates a peer in the registry. */
export function registerPeer(peer: PeerNode): void {
  registry.set(peer.node_id, peer);
}

/** Returns all currently active peers. */
export function getActivePeers(): PeerNode[] {
  return Array.from(registry.values()).filter((p) => p.is_active);
}

/** Returns all peers regardless of liveness. */
export function getAllPeers(): PeerNode[] {
  return Array.from(registry.values());
}

/** Marks a peer as inactive (called when ping times out). */
export function markPeerInactive(nodeId: string): void {
  const peer = registry.get(nodeId);
  if (peer) {
    registry.set(nodeId, { ...peer, is_active: false });
  }
}

/** Builds an outbound ping message for the given node. */
export function buildPingMessage(nodeId: string, stateHash: string): PeerPingMessage {
  return {
    event: "peer_ping",
    node_id: nodeId,
    timestamp: new Date().toISOString(),
    state_hash: stateHash,
  };
}

/**
 * Handles an inbound pong response from a peer.
 * Marks the peer alive and updates last_seen.
 */
export function handlePong(message: PeerPongMessage): void {
  const peer = registry.get(message.node_id);
  if (peer) {
    registry.set(message.node_id, {
      ...peer,
      is_active: true,
      last_seen: message.timestamp,
    });
  }
}
