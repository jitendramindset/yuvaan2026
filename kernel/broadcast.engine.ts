import { computeStateHash } from "./hash.engine.js";
import type { NodeRecord } from "../shared/types/node.types.js";

/**
 * A node_update broadcast event emitted after every successful node execution.
 */
export interface BroadcastEvent {
  event: "node_update";
  node_id: string;
  timestamp: string;
  state_hash: string;
}

/**
 * Registered broadcast targets.
 * Concrete transport implementations (WebSocket, IPC, P2P, REST) are
 * registered at boot time via registerBroadcastHandler().
 */
export type BroadcastTarget = "devices" | "peers" | "agents" | "ui";

export interface BroadcastOptions {
  /** Subset of targets to broadcast to. Defaults to all four. */
  targets?: BroadcastTarget[];
}

const handlers = new Map<BroadcastTarget, (event: BroadcastEvent) => void>();

/**
 * Registers a transport handler for a broadcast target.
 * Call at kernel boot time from each subsystem (WebSocket server, IPC bridge, etc.).
 */
export function registerBroadcastHandler(
  target: BroadcastTarget,
  handler: (event: BroadcastEvent) => void,
): void {
  handlers.set(target, handler);
}

/**
 * Broadcasts a node_update event to all registered targets.
 * Targets without a registered handler are silently skipped.
 */
export function broadcastNodeUpdate(node: NodeRecord, options: BroadcastOptions = {}): void {
  const targets: BroadcastTarget[] =
    options.targets ?? ["devices", "peers", "agents", "ui"];

  const event: BroadcastEvent = {
    event: "node_update",
    node_id: node.nid_hash ?? node.node_id ?? "unknown",
    timestamp: new Date().toISOString(),
    state_hash: computeStateHash(node),
  };

  for (const target of targets) {
    handlers.get(target)?.(event);
  }
}

/**
 * Lightweight event broadcast — use when you don't have a full NodeRecord.
 * Accepts a node id string and any serialisable payload.
 */
export function broadcastEvent(
  nodeId: string,
  eventType: string,
  data?: unknown,
  options: BroadcastOptions = {},
): void {
  const targets: BroadcastTarget[] =
    options.targets ?? ["devices", "peers", "agents", "ui"];

  const event: BroadcastEvent = {
    event:      "node_update",
    node_id:    nodeId,
    timestamp:  new Date().toISOString(),
    state_hash: `${nodeId}:${eventType}:${Date.now()}`,
  };

  // Attach extra data for UI consumers that read the raw event
  (event as unknown as Record<string, unknown>)["event_type"] = eventType;
  (event as unknown as Record<string, unknown>)["data"]       = data;

  for (const target of targets) {
    handlers.get(target)?.(event);
  }
}
