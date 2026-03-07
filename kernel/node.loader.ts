import { promises as fs } from "node:fs";
import path from "node:path";
import type { NodeRecord } from "../shared/types/node.types.js";
import { NODE_FILE_SUFFIX } from "../shared/constants.js";

async function walk(dir: string, found: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, found);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(NODE_FILE_SUFFIX)) {
      found.push(fullPath);
    }
  }
  return found;
}

export async function loadNodeByPath(filePath: string): Promise<NodeRecord> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as NodeRecord;
}

export async function loadNodeById(nodeId: string, nodesRoot = "nodes"): Promise<NodeRecord> {
  const files = await walk(nodesRoot);
  for (const file of files) {
    const node = await loadNodeByPath(file);
    if (node.node_id === nodeId) {
      return node;
    }
  }
  throw new Error(`Node not found for node_id=${nodeId}`);
}
