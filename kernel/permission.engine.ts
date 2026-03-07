import type { NodeRecord } from "../shared/types/node.types.js";
import { PermissionDeniedError } from "../shared/errors.js";

type PermissionMode = "read" | "write" | "execute";

function isAllowed(actorId: string, node: NodeRecord, mode: PermissionMode): boolean {
  // Accept both new-schema owner_id and legacy owner
  const owner = node.owner_id ?? node.owner;
  if (actorId === owner) {
    return true;
  }

  // New-schema: check perm_blob grants
  if (node.perm_blob) {
    const actionMap: Record<PermissionMode, string> = {
      read: "READ",
      write: "WRITE",
      execute: "EXECUTE",
    };
    const required = actionMap[mode];
    for (const grant of node.perm_blob.grants) {
      if (
        grant.effect === "ALLOW" &&
        grant.actions.includes(required as never) &&
        (grant.subject_nid_hash === "*" || grant.subject_nid_hash === actorId)
      ) {
        return true;
      }
    }
    // If perm_blob exists, its default_effect is the final word
    return node.perm_blob.default_effect === "ALLOW";
  }

  // Legacy-schema: use permissions object
  const rules = node.permissions?.[mode] ?? [];
  return rules.includes("*") || rules.includes(actorId);
}

export function checkPermission(actorId: string, node: NodeRecord, mode: PermissionMode): void {
  if (!isAllowed(actorId, node, mode)) {
    throw new PermissionDeniedError(
      `Permission denied: actor=${actorId} mode=${mode} node=${node.node_id}`,
    );
  }
}
