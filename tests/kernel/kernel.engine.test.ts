import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runNode } from "../../kernel/kernel.engine.js";
import * as nodeLoader from "../../kernel/node.loader.js";
import * as logEngine from "../../kernel/log.engine.js";
import * as broadcastEngine from "../../kernel/broadcast.engine.js";
import type { NodeRecord } from "../../shared/types/node.types.js";

// ─── Shared test fixture ──────────────────────────────────────────────────────

function makeNode(overrides: Partial<NodeRecord> = {}): NodeRecord {
  return {
    nid_hash: "test.node",
    owner_id: "system",
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
    karma_score: 80,
    trust_score: 80,
    reputation_level: "root",
    health_score: 80,
    experience_level: 50,
    can_execute: true,
    can_update: true,
    external_access: false,
    permission_scope: "self",
    privacy_mode: "protected",
    task_status: "idle",
    is_activated: true,
    // legacy compat
    owner: "system",
    permissions: { read: ["*"], write: ["system"], execute: ["system"] },
    actions: [{ name: "noop", type: "emit_log" }],
    children: [],
    data: {},
    logs: [],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("kernel.engine — runNode()", () => {
  beforeEach(() => {
    vi.spyOn(logEngine, "appendLog").mockResolvedValue(undefined);
    vi.spyOn(broadcastEngine, "broadcastNodeUpdate").mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("executes a valid node and returns success", async () => {
    vi.spyOn(nodeLoader, "loadNodeById").mockResolvedValue(makeNode());
    const result = await runNode({ nodeId: "test.node", actorId: "system" });
    expect(result.success).toBe(true);
    expect(result.stateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof result.karmaScore).toBe("number");
  });

  it("logs the event with event_id and device_id", async () => {
    vi.spyOn(nodeLoader, "loadNodeById").mockResolvedValue(makeNode());
    await runNode({ nodeId: "test.node", actorId: "system", deviceId: "device-42" });
    const [logEvent] = (logEngine.appendLog as ReturnType<typeof vi.fn>).mock.calls[0] as [Parameters<typeof logEngine.appendLog>[0]];
    expect(logEvent.event_id).toBeTruthy();
    expect(logEvent.device_id).toBe("device-42");
  });

  it("broadcasts a node_update after execution", async () => {
    vi.spyOn(nodeLoader, "loadNodeById").mockResolvedValue(makeNode());
    await runNode({ nodeId: "test.node", actorId: "system" });
    expect(broadcastEngine.broadcastNodeUpdate).toHaveBeenCalledOnce();
  });

  it("throws PermissionDeniedError when actor lacks execute permission", async () => {
    vi.spyOn(nodeLoader, "loadNodeById").mockResolvedValue(makeNode({
      permissions: { read: ["*"], write: ["system"], execute: ["system"] },
    }));
    await expect(runNode({ nodeId: "test.node", actorId: "attacker" })).rejects.toThrow("Permission denied");
  });

  it("throws DharmaViolationError for restricted nodes", async () => {
    vi.spyOn(nodeLoader, "loadNodeById").mockResolvedValue(
      makeNode({ dna_blob: { brand_scope: "test", archetype: "", intent_tags: [], dharma_tags: ["restricted"], trait_vector: [], origin_type: "organic", soul_id: "s1" } }),
    );
    await expect(runNode({ nodeId: "test.node", actorId: "system" })).rejects.toThrow("restricted");
  });

  it("throws DharmaViolationError for blocked action types", async () => {
    vi.spyOn(nodeLoader, "loadNodeById").mockResolvedValue(
      makeNode({ actions: [{ name: "danger", type: "delete_all" }] }),
    );
    await expect(runNode({ nodeId: "test.node", actorId: "system" })).rejects.toThrow("Dharma");
  });
});
