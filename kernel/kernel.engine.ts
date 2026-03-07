import { randomUUID } from "node:crypto";
import { computeStateHash } from "./hash.engine.js";
import { appendLog } from "./log.engine.js";
import { loadNodeById } from "./node.loader.js";
import { executeActions } from "./node.executor.js";
import { checkPermission } from "./permission.engine.js";
import { validateNode } from "./node.validator.js";
import { validateDharma } from "./dharma.engine.js";
import { computeKarma, karmaToReputationLevel } from "./karma.engine.js";
import { broadcastNodeUpdate } from "./broadcast.engine.js";
import type { KernelExecutionRequest, KernelExecutionResult } from "../shared/types/node.types.js";

export async function runNode(request: KernelExecutionRequest): Promise<KernelExecutionResult> {
  const { nodeId, actorId, deviceId = "unknown" } = request;
  const node = await loadNodeById(nodeId);

  // 1. Schema validation
  validateNode(node);

  // 2. Permission check
  checkPermission(actorId, node, "execute");

  // 3. Dharma compliance check (ethical / rule boundaries)
  validateDharma(node);

  // 4. Execute node actions
  const actionResults = executeActions(node);

  // 5. Compute new state hash
  const stateHash = computeStateHash(node);
  node.state_hash = stateHash;

  // 6. Compute Karma and update node scores
  const karmaScore = computeKarma(node);
  node.karma_score = karmaScore;
  node.reputation_level = karmaToReputationLevel(karmaScore);

  // 7. Log execution event
  const nodeId_ = node.nid_hash ?? node.node_id ?? "unknown";
  await appendLog({
    event_id: randomUUID(),
    node_id: nodeId_,
    action: `executed:${actionResults.join(",")}`,
    timestamp: new Date().toISOString(),
    result: "success",
    device_id: deviceId,
  });

  // 8. Broadcast state update to all registered targets
  broadcastNodeUpdate(node);

  return {
    nodeId: nodeId_,
    success: true,
    message: `Executed ${actionResults.length} action(s)`,
    stateHash,
    karmaScore,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNode({ nodeId: "system.root", actorId: "system" })
    .then((result) => {
      // Keep CLI output minimal for fast smoke checks.
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      process.stderr.write(`Kernel execution failed: ${message}\n`);
      process.exitCode = 1;
    });
}
