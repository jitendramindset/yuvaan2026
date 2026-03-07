import { describe, it, expect } from "vitest";
import { computeStateHash } from "../../kernel/hash.engine.js";
import { validateDharma } from "../../kernel/dharma.engine.js";
import { computeKarma, karmaToReputationLevel } from "../../kernel/karma.engine.js";
import { validateNode } from "../../kernel/node.validator.js";
import { checkPermission } from "../../kernel/permission.engine.js";
import {
  registerBroadcastHandler,
  broadcastNodeUpdate,
  type BroadcastEvent,
} from "../../kernel/broadcast.engine.js";
import {
  registerPeer,
  getActivePeers,
  markPeerInactive,
  handlePong,
  buildPingMessage,
} from "../../kernel/peer.discovery.js";
import { NodeValidationError, PermissionDeniedError, DharmaViolationError } from "../../shared/errors.js";
import type { NodeRecord } from "../../shared/types/node.types.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseNode(overrides: Partial<NodeRecord> = {}): NodeRecord {
  return {
    nid_hash: "n1",
    owner_id: "owner1",
    node_type: "system",
    state_hash: "",
    is_head: true,
    sync_version: 0,
    prompt_version: 1,
    node_depth: 0,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_archived: false,
    is_cold: false,
    hot_cache: false,
    karma_score: 70,
    trust_score: 60,
    reputation_level: "root",
    health_score: 90,
    experience_level: 40,
    can_execute: true,
    can_update: true,
    external_access: false,
    permission_scope: "self",
    privacy_mode: "protected",
    task_status: "idle",
    is_activated: true,
    owner: "owner1",
    permissions: { read: ["*"], write: ["owner1"], execute: ["owner1"] },
    actions: [],
    children: [],
    data: {},
    logs: [],
    ...overrides,
  };
}

// ─── hash.engine ─────────────────────────────────────────────────────────────

describe("hash.engine — computeStateHash()", () => {
  it("returns a 64-char hex string (SHA3-256)", () => {
    expect(computeStateHash({ a: 1 })).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic regardless of key insertion order", () => {
    const h1 = computeStateHash({ a: 1, b: 2 });
    const h2 = computeStateHash({ b: 2, a: 1 });
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different payloads", () => {
    expect(computeStateHash({ a: 1 })).not.toBe(computeStateHash({ a: 2 }));
  });
});

// ─── dharma.engine ────────────────────────────────────────────────────────────

describe("dharma.engine — validateDharma()", () => {
  it("passes a clean node", () => {
    expect(() => validateDharma(baseNode())).not.toThrow();
  });

  it("throws for dna_blob.dharma_tags=['restricted']", () => {
    const node = baseNode({
      dna_blob: {
        brand_scope: "test", archetype: "", intent_tags: [],
        dharma_tags: ["restricted"], trait_vector: [], origin_type: "organic", soul_id: "s1",
      },
    });
    expect(() => validateDharma(node)).toThrow(DharmaViolationError);
  });

  it("throws for blocked action type 'delete_all'", () => {
    const node = baseNode({ actions: [{ name: "x", type: "delete_all" }] });
    expect(() => validateDharma(node)).toThrow(DharmaViolationError);
  });

  it("throws for blocked rule_blob action type 'mass_transfer'", () => {
    const node = baseNode({
      rule_blob: {
        rules: [{
          trigger: "on_event",
          condition: {},
          action: { type: "mass_transfer" },
          priority: 1,
        }],
        can_self_modify: false,
      },
    });
    expect(() => validateDharma(node)).toThrow(DharmaViolationError);
  });
});

// ─── karma.engine ─────────────────────────────────────────────────────────────

describe("karma.engine — computeKarma()", () => {
  it("returns a number in [0, 100]", () => {
    const score = computeKarma(baseNode());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("yields higher karma for healthier nodes", () => {
    const high = computeKarma(baseNode({ health_score: 100, trust_score: 100, experience_level: 100 }));
    const low = computeKarma(baseNode({ health_score: 10, trust_score: 10, experience_level: 0, karma_score: 0 }));
    expect(high).toBeGreaterThan(low);
  });

  it("does not drop more than 10 points in one step", () => {
    const node = baseNode({ karma_score: 80, health_score: 0, trust_score: 0, experience_level: 0 });
    const score = computeKarma(node);
    expect(score).toBeGreaterThanOrEqual(70);
  });
});

describe("karma.engine — karmaToReputationLevel()", () => {
  it("maps 0–29 → seed", ()  => expect(karmaToReputationLevel(0)).toBe("seed"));
  it("maps 30–59 → sprout", () => expect(karmaToReputationLevel(45)).toBe("sprout"));
  it("maps 60–79 → root",   () => expect(karmaToReputationLevel(70)).toBe("root"));
  it("maps 80–100 → elder", () => expect(karmaToReputationLevel(90)).toBe("elder"));
});

// ─── node.validator ───────────────────────────────────────────────────────────

describe("node.validator — validateNode()", () => {
  it("passes a valid new-schema node (nid_hash + owner_id)", () => {
    expect(() => validateNode(baseNode())).not.toThrow();
  });

  it("passes a valid legacy-schema node (node_id + owner)", () => {
    const node = { ...baseNode(), nid_hash: undefined, node_id: "n1", owner_id: undefined, owner: "o1" } as unknown as NodeRecord;
    expect(() => validateNode(node)).not.toThrow();
  });

  it("throws if neither nid_hash nor node_id present", () => {
    const node = { ...baseNode(), nid_hash: undefined, node_id: undefined } as unknown as NodeRecord;
    expect(() => validateNode(node)).toThrow(NodeValidationError);
  });

  it("throws if node_type missing", () => {
    const node = { ...baseNode(), node_type: undefined } as unknown as NodeRecord;
    expect(() => validateNode(node)).toThrow(NodeValidationError);
  });

  it("throws if actions is not an array (when present)", () => {
    const node = { ...baseNode(), actions: "bad" } as unknown as NodeRecord;
    expect(() => validateNode(node)).toThrow(NodeValidationError);
  });
});

// ─── permission.engine ────────────────────────────────────────────────────────

describe("permission.engine — checkPermission()", () => {
  it("allows owner_id to execute", () => {
    expect(() => checkPermission("owner1", baseNode(), "execute")).not.toThrow();
  });

  it("allows actor listed in legacy permissions.execute", () => {
    expect(() => checkPermission("owner1", baseNode(), "execute")).not.toThrow();
  });

  it("allows wildcard '*' in legacy permissions.read", () => {
    expect(() => checkPermission("anyone", baseNode(), "read")).not.toThrow();
  });

  it("throws PermissionDeniedError for unlisted actor", () => {
    expect(() => checkPermission("stranger", baseNode(), "write")).toThrow(PermissionDeniedError);
  });

  it("uses perm_blob when present (ALLOW grant)", () => {
    const node = baseNode({
      perm_blob: {
        grants: [{ subject_nid_hash: "agent1", actions: ["EXECUTE"], effect: "ALLOW", conditions: {}, expires_at: null }],
        default_effect: "DENY",
      },
    });
    expect(() => checkPermission("agent1", node, "execute")).not.toThrow();
  });

  it("uses perm_blob default_effect DENY for unlisted actor", () => {
    const node = baseNode({
      perm_blob: {
        grants: [],
        default_effect: "DENY",
      },
    });
    expect(() => checkPermission("stranger", node, "execute")).toThrow(PermissionDeniedError);
  });
});

// ─── broadcast.engine ─────────────────────────────────────────────────────────

describe("broadcast.engine — broadcastNodeUpdate()", () => {
  it("calls registered handler with correct event shape", () => {
    const received: BroadcastEvent[] = [];
    registerBroadcastHandler("ui", (e) => received.push(e));

    broadcastNodeUpdate(baseNode(), { targets: ["ui"] });

    expect(received).toHaveLength(1);
    expect(received[0].event).toBe("node_update");
    expect(received[0].node_id).toBe("n1");
    expect(received[0].state_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("skips targets without a registered handler silently", () => {
    expect(() => broadcastNodeUpdate(baseNode(), { targets: ["peers"] })).not.toThrow();
  });
});

// ─── peer.discovery ───────────────────────────────────────────────────────────

describe("peer.discovery", () => {
  it("registers a peer and lists it as active", () => {
    registerPeer({ node_id: "peer1", address: "192.168.1.2", connection_type: "local", last_seen: new Date().toISOString(), is_active: true });
    const peers = getActivePeers();
    expect(peers.some((p) => p.node_id === "peer1")).toBe(true);
  });

  it("markPeerInactive removes peer from active list", () => {
    registerPeer({ node_id: "peer2", address: "192.168.1.3", connection_type: "local", last_seen: new Date().toISOString(), is_active: true });
    markPeerInactive("peer2");
    const active = getActivePeers();
    expect(active.some((p) => p.node_id === "peer2")).toBe(false);
  });

  it("handlePong marks peer alive again", () => {
    registerPeer({ node_id: "peer3", address: "10.0.0.1", connection_type: "online", last_seen: new Date().toISOString(), is_active: false });
    handlePong({ event: "peer_alive", node_id: "peer3", timestamp: new Date().toISOString() });
    const active = getActivePeers();
    expect(active.some((p) => p.node_id === "peer3")).toBe(true);
  });

  it("buildPingMessage returns correct shape", () => {
    const ping = buildPingMessage("mynode", "abc123");
    expect(ping.event).toBe("peer_ping");
    expect(ping.node_id).toBe("mynode");
    expect(ping.state_hash).toBe("abc123");
  });
});
