import type { NodeRecord } from "../shared/types/node.types.js";
import { NodeValidationError } from "../shared/errors.js";

export function validateNode(node: NodeRecord): void {
  // Accept both new-schema (nid_hash / owner_id) and legacy (node_id / owner)
  const id = node.nid_hash ?? node.node_id;
  const owner = node.owner_id ?? node.owner;

  if (!id) {
    throw new NodeValidationError("Node must have nid_hash or node_id");
  }
  if (!node.node_type) {
    throw new NodeValidationError("Missing required field: node_type");
  }
  if (!owner) {
    throw new NodeValidationError("Node must have owner_id or owner");
  }

  // actions / children are optional in new-schema nodes but must be arrays when present
  if ("actions" in node && !Array.isArray(node.actions)) {
    throw new NodeValidationError("Node actions must be an array");
  }
  if ("children" in node && !Array.isArray(node.children)) {
    throw new NodeValidationError("Node children must be an array");
  }
}
