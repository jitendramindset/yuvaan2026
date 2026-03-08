/**
 * Node Store — unified read / write facade.
 *
 * All kernel engines and API routes go through this module.
 * Under the hood it delegates to the file-based loader (kernel/node.loader.ts)
 * and the writer below, keeping the index warm for fast lookups.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { NodeRecord } from "../shared/types/node.types.js";
import { NODE_FILE_SUFFIX, NODES_ROOT } from "../shared/constants.js";
import { NodeIndex }  from "./node.index.js";
import { writeNode }  from "./node.writer.js";
import { hashNode }   from "./node.hash.js";

// ── helpers ──────────────────────────────────────────────────────────────────

async function walk(dir: string, found: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(full, found); continue; }
    if (entry.isFile() && entry.name.endsWith(NODE_FILE_SUFFIX)) found.push(full);
  }
  return found;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Load a single node by its `node_id` (legacy) or `nid_hash` (new).
 * First checks the in-memory index, then scans the filesystem.
 */
export async function loadNode(nodeId: string): Promise<NodeRecord> {
  const cached = NodeIndex.get(nodeId);
  if (cached) return cached;

  const files = await walk(NODES_ROOT);
  for (const file of files) {
    const raw  = await fs.readFile(file, "utf8");
    const node = JSON.parse(raw) as NodeRecord;
    const id   = node.nid_hash ?? node.node_id ?? "";
    NodeIndex.set(id, node);
    if (id === nodeId) return node;
  }
  throw new Error(`Node not found: ${nodeId}`);
}

/**
 * List all nodes of a given type.
 */
export async function listNodesByType(nodeType: string): Promise<NodeRecord[]> {
  const files  = await walk(NODES_ROOT);
  const result: NodeRecord[] = [];
  for (const file of files) {
    const raw  = await fs.readFile(file, "utf8");
    const node = JSON.parse(raw) as NodeRecord;
    if (node.node_type === nodeType) result.push(node);
  }
  return result;
}

/**
 * Persist a node.  Computes a content hash before writing.
 */
export async function saveNode(node: NodeRecord): Promise<string> {
  node.state_hash = hashNode(node);
  node.updated_at = new Date().toISOString();
  await writeNode(node);
  const id = node.nid_hash ?? node.node_id ?? "";
  if (id) NodeIndex.set(id, node);
  return node.state_hash;
}

/**
 * Delete a node file from disk and evict it from the index.
 */
export async function deleteNode(nodeId: string): Promise<void> {
  const files = await walk(NODES_ROOT);
  for (const file of files) {
    const raw  = await fs.readFile(file, "utf8");
    const node = JSON.parse(raw) as NodeRecord;
    const id   = node.nid_hash ?? node.node_id ?? "";
    if (id === nodeId) {
      await fs.unlink(file);
      NodeIndex.delete(nodeId);
      return;
    }
  }
}
