import type { NodeRecord } from "../shared/types/node.types.js";
import { DharmaViolationError } from "../shared/errors.js";

/**
 * Action types that are unconditionally blocked by Dharma policy.
 * These represent dangerous, unethical, or destructive operations.
 */
const BLOCKED_ACTION_TYPES = new Set([
  "delete_all",
  "mass_transfer",
  "override_permissions",
  "disable_audit",
]);

/**
 * Validates that a node and its actions comply with Dharma policy
 * (rule compliance and ethical boundaries).
 *
 * Checks:
 *   1. dna_blob.dharma_tags — nodes tagged "restricted" are blocked unconditionally.
 *   2. rule_blob.rules      — rule action types are checked against the blocked list.
 *   3. actions (legacy)     — legacy action types are checked against the blocked list.
 *
 * @throws DharmaViolationError if any policy is violated.
 */
export function validateDharma(node: NodeRecord): void {
  const nodeRef = node.nid_hash ?? node.node_id ?? "unknown";

  // 1. Check Dharma classification tags
  const dharmaTags = node.dna_blob?.dharma_tags ?? [];
  if (dharmaTags.includes("restricted")) {
    throw new DharmaViolationError(
      `Node ${nodeRef} is marked "restricted" by Dharma policy and cannot execute.`,
    );
  }

  // 2. Check rule_blob actions
  for (const rule of node.rule_blob?.rules ?? []) {
    const actionType = (rule.action as Record<string, unknown>)?.type as string | undefined;
    if (actionType && BLOCKED_ACTION_TYPES.has(actionType)) {
      throw new DharmaViolationError(
        `Rule action type "${actionType}" violates Dharma policy for node ${nodeRef}.`,
      );
    }
  }

  // 3. Check legacy actions array
  for (const action of node.actions ?? []) {
    if (BLOCKED_ACTION_TYPES.has(action.type)) {
      throw new DharmaViolationError(
        `Action "${action.type}" violates Dharma policy for node ${nodeRef}.`,
      );
    }
  }
}
