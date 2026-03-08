/**
 * Node Writer — persists a NodeRecord to the correct filesystem path.
 *
 * Path convention: nodes/<node_type>/<node_id>.node.json
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { NodeRecord } from "../shared/types/node.types.js";
import { NODE_FILE_SUFFIX, NODES_ROOT } from "../shared/constants.js";

function resolveNodePath(node: NodeRecord): string {
  const id   = node.nid_hash ?? node.node_id ?? `unknown-${Date.now()}`;
  const type = node.node_type ?? "system";
  // Sanitise: only allow alphanum, dash, underscore, dot
  const safeId   = id.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeType = type.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(NODES_ROOT, safeType, `${safeId}${NODE_FILE_SUFFIX}`);
}

/**
 * Write a node to disk.  Creates parent directories as needed.
 */
export async function writeNode(node: NodeRecord): Promise<string> {
  const filePath = resolveNodePath(node);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(node, null, 2), "utf8");
  return filePath;
}

/**
 * Return the resolved file path for a node without writing.
 */
export function nodeFilePath(node: NodeRecord): string {
  return resolveNodePath(node);
}
