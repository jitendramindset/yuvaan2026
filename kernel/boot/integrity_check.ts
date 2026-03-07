import { computeStateHash } from "../hash.engine.js";
import type { NodeRecord } from "../../shared/types/node.types.js";

export async function checkIntegrity(nodes: NodeRecord[]): Promise<boolean> {
  for (const node of nodes) {
    const expectedHash = computeStateHash(node);
    if (node.state_hash && node.state_hash !== "" && node.state_hash !== expectedHash) {
      return false;
    }
  }
  return true;
}
