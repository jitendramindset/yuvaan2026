import type { IncomingMessage, ServerResponse } from "node:http";
import {
  addConnection,
  listConnections,
  getConnection,
  removeConnection,
  updateConnection,
  testConnection,
  getConnectionTools,
  CONNECTION_PRESETS,
  type Connection,
} from "../../kernel/connection.engine.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

/** Redact sensitive fields for client */
function redact(c: Connection): Connection {
  const masked = { ...c };
  if (masked.api_key)      masked.api_key      = "****";
  if (masked.access_token) masked.access_token = "****";
  return masked;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function ownerIdFromPath(req: IncomingMessage): string | null {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[1] ?? null; // /connections/:ownerId
}

/**
 * POST /connections/:ownerId
 * Body: { type, name, url?, api_key?, access_token?, capabilities? }
 */
export async function handleAddConnection(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ownerId = ownerIdFromPath(req);
  if (!ownerId) { json(res, 400, { error: "ownerId required in path" }); return; }

  const body = await readBody(req);
  if (!body["type"] || !body["name"]) {
    json(res, 400, { error: "type and name are required" });
    return;
  }
  const conn = addConnection({
    owner_id:     ownerId,
    type:         body["type"]         as Connection["type"],
    name:         body["name"]         as string,
    url:          body["url"]          as string | undefined,
    api_key:      body["api_key"]      as string | undefined,
    access_token: body["access_token"] as string | undefined,
    capabilities: (body["capabilities"] as string[] | undefined) ?? [],
    status: "pending",
    icon: body["icon"] as string | undefined,
    metadata: body["metadata"] as Record<string, unknown> | undefined,
  });
  json(res, 201, redact(conn));
}

/**
 * GET /connections/:ownerId
 */
export function handleListConnections(req: IncomingMessage, res: ServerResponse): void {
  const ownerId = ownerIdFromPath(req);
  if (!ownerId) { json(res, 400, { error: "ownerId required in path" }); return; }
  json(res, 200, { connections: listConnections(ownerId).map(redact) });
}

/**
 * DELETE /connections/:ownerId/:connectionId
 */
export function handleRemoveConnection(req: IncomingMessage, res: ServerResponse): void {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId      = parts[1];
  const connectionId = parts[2];
  if (!ownerId || !connectionId) { json(res, 400, { error: "ownerId and connectionId required" }); return; }
  const ok = removeConnection(ownerId, connectionId);
  json(res, ok ? 200 : 404, { ok });
}

/**
 * POST /connections/:ownerId/:connectionId/test
 * Tests the connection and updates its status + capabilities.
 */
export async function handleTestConnectionRoute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId      = parts[1];
  const connectionId = parts[2];
  if (!ownerId || !connectionId) { json(res, 400, { error: "ownerId and connectionId required" }); return; }

  const conn = getConnection(ownerId, connectionId);
  if (!conn) { json(res, 404, { error: "Connection not found" }); return; }

  const result = await testConnection(conn);
  const status: Connection["status"] = result.ok ? "connected" : "error";
  updateConnection(ownerId, connectionId, {
    status,
    capabilities: result.ok && result.capabilities.length > 0 ? result.capabilities : conn.capabilities,
    last_tested: new Date().toISOString(),
    error: result.error,
  });
  json(res, result.ok ? 200 : 400, { ...result, status });
}

/**
 * PATCH /connections/:ownerId/:connectionId
 * Update name, url, api_key, capabilities, etc.
 */
export async function handleUpdateConnectionRoute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId      = parts[1];
  const connectionId = parts[2];
  if (!ownerId || !connectionId) { json(res, 400, { error: "ownerId and connectionId required" }); return; }

  const body    = await readBody(req);
  const updated = updateConnection(ownerId, connectionId, body as Partial<Connection>);
  if (!updated) { json(res, 404, { error: "Connection not found" }); return; }
  json(res, 200, redact(updated));
}

/**
 * GET /connections/:ownerId/tools
 * Returns the list of active tool strings from all connected services
 * (used by the AI system prompt).
 */
export function handleGetConnectionTools(req: IncomingMessage, res: ServerResponse): void {
  const ownerId = ownerIdFromPath(req);
  if (!ownerId) { json(res, 400, { error: "ownerId required in path" }); return; }
  json(res, 200, { tools: getConnectionTools(ownerId) });
}

/**
 * GET /connections/presets
 * Returns the connection type catalog for the UI to render "Add Connection" options.
 */
export function handleGetConnectionPresets(_req: IncomingMessage, res: ServerResponse): void {
  json(res, 200, CONNECTION_PRESETS);
}
