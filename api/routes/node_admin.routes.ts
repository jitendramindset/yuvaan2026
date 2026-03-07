import type { IncomingMessage, ServerResponse } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODES_ROOT = path.resolve(__dirname, "../../nodes");

// ── Helpers ──────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}") as Record<string, unknown>;
}

async function walkNodes(dir: string, found: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkNodes(full, found);
    else if (e.name.endsWith(".node.json")) found.push(full);
  }
  return found;
}

async function loadAllNodes(): Promise<Array<Record<string, unknown> & { _file: string }>> {
  const files = await walkNodes(NODES_ROOT);
  const nodes = await Promise.all(
    files.map(async (f) => {
      try {
        const raw = await fs.readFile(f, "utf8");
        const n = JSON.parse(raw) as Record<string, unknown>;
        n._file = path.relative(NODES_ROOT, f);
        return n;
      } catch {
        return null;
      }
    })
  );
  return nodes.filter(Boolean) as Array<Record<string, unknown> & { _file: string }>;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

/** GET /admin/nodes — list all nodes with minimal fields */
export async function handleListAllNodes(_req: IncomingMessage, res: ServerResponse) {
  const nodes = await loadAllNodes();
  const summary = nodes.map((n) => ({
    node_id:    n.node_id    ?? n.nid_hash ?? path.basename(n._file, ".node.json"),
    node_type:  n.node_type  ?? "unknown",
    owner:      n.owner      ?? n.owner_id ?? "unknown",
    status:     n.status     ?? "active",
    created_at: n.created_at ?? null,
    updated_at: n.updated_at ?? null,
    karma_score:n.karma_score ?? 0,
    children:   Array.isArray(n.children) ? (n.children as string[]) : [],
    parent:     n.parent     ?? n.parent_nid_hash ?? null,
    _file:      n._file,
    // relation edges: parent + children
    relations: [
      ...(n.parent          ? [{ type: "parent",   target: n.parent }]          : []),
      ...(n.parent_nid_hash ? [{ type: "parent",   target: n.parent_nid_hash }] : []),
      ...((Array.isArray(n.children) ? n.children as string[] : []).map((c) => ({
        type: "child", target: c,
      }))),
      ...((Array.isArray(n.related) ? n.related as string[] : []).map((r) => ({
        type: "related", target: r,
      }))),
    ],
  }));
  json(res, 200, { count: summary.length, nodes: summary });
}

/** GET /admin/nodes/:nodeId — full node data */
export async function handleGetNodeAdmin(req: IncomingMessage, res: ServerResponse) {
  const nodeId = (req.url ?? "").split("/").pop() ?? "";
  const nodes  = await loadAllNodes();
  const node   = nodes.find((n) =>
    n.node_id === nodeId || n.nid_hash === nodeId || path.basename(n._file, ".node.json") === nodeId
  );
  if (!node) return json(res, 404, { error: `Node not found: ${nodeId}` });
  json(res, 200, node);
}

/** PATCH /admin/nodes/:nodeId/status — update status field in the JSON file */
export async function handleUpdateNodeStatus(req: IncomingMessage, res: ServerResponse) {
  const parts  = (req.url ?? "").split("/");
  const nodeId = parts[parts.length - 2] ?? "";
  const body   = await readBody(req);
  const { status } = body as { status?: string };
  if (!status) return json(res, 400, { error: "body.status required" });

  const nodes = await loadAllNodes();
  const node  = nodes.find((n) => n.node_id === nodeId || n.nid_hash === nodeId);
  if (!node) return json(res, 404, { error: `Node not found: ${nodeId}` });

  node.status     = status;
  node.updated_at = new Date().toISOString();
  const filePath  = path.join(NODES_ROOT, node._file);
  const { _file, ...rest } = node;
  void _file; // not written to disk
  await fs.writeFile(filePath, JSON.stringify(rest, null, 2), "utf8");
  json(res, 200, { ok: true, node_id: nodeId, status });
}

/** PATCH /admin/nodes/:nodeId/archive — set is_archived=true */
export async function handleArchiveNode(req: IncomingMessage, res: ServerResponse) {
  const parts  = (req.url ?? "").split("/");
  const nodeId = parts[parts.length - 2] ?? "";
  const nodes  = await loadAllNodes();
  const node   = nodes.find((n) => n.node_id === nodeId || n.nid_hash === nodeId);
  if (!node) return json(res, 404, { error: `Node not found: ${nodeId}` });

  node.is_archived = true;
  node.archived_at = new Date().toISOString();
  node.status      = "archived";
  node.updated_at  = new Date().toISOString();
  const filePath   = path.join(NODES_ROOT, node._file);
  const { _file, ...rest } = node;
  void _file;
  await fs.writeFile(filePath, JSON.stringify(rest, null, 2), "utf8");
  json(res, 200, { ok: true, node_id: nodeId, archived: true });
}

/** GET /admin/graph — returns nodes + edges for graph rendering */
export async function handleNodeGraph(_req: IncomingMessage, res: ServerResponse) {
  const nodes = await loadAllNodes();

  const graphNodes = nodes.map((n) => ({
    id:    (n.node_id ?? n.nid_hash ?? path.basename(n._file, ".node.json")) as string,
    label: (n.node_id ?? n.nid_hash ?? path.basename(n._file, ".node.json")) as string,
    type:  (n.node_type ?? "unknown") as string,
    owner: (n.owner ?? n.owner_id ?? "unknown") as string,
    status:(n.status ?? "active") as string,
    karma: (n.karma_score ?? 0) as number,
    file:  n._file as string,
  }));

  const idSet = new Set(graphNodes.map((n) => n.id));

  const edges: Array<{ source: string; target: string; type: string }> = [];
  for (const n of nodes) {
    const src = (n.node_id ?? n.nid_hash ?? path.basename(n._file, ".node.json")) as string;
    if (Array.isArray(n.children)) {
      for (const c of n.children as string[]) {
        if (idSet.has(c)) edges.push({ source: src, target: c, type: "child" });
      }
    }
    if (n.parent && idSet.has(n.parent as string)) {
      edges.push({ source: src, target: n.parent as string, type: "parent" });
    }
    if (n.parent_nid_hash && idSet.has(n.parent_nid_hash as string)) {
      edges.push({ source: src, target: n.parent_nid_hash as string, type: "parent" });
    }
    if (Array.isArray(n.related)) {
      for (const r of n.related as string[]) {
        if (idSet.has(r)) edges.push({ source: src, target: r, type: "related" });
      }
    }
  }

  json(res, 200, {
    nodes: graphNodes,
    edges,
    stats: {
      total: graphNodes.length,
      by_type: graphNodes.reduce<Record<string, number>>((acc, n) => {
        acc[n.type] = (acc[n.type] ?? 0) + 1;
        return acc;
      }, {}),
      by_status: graphNodes.reduce<Record<string, number>>((acc, n) => {
        acc[n.status] = (acc[n.status] ?? 0) + 1;
        return acc;
      }, {}),
    },
  });
}
