import type { IncomingMessage, ServerResponse } from "node:http";
import {
  validateAdminKey,
  setMode,
  trackActivity,
  getUserActivity,
  isUserSuspended,
  performAdminAction,
  getAdminActionsForUser,
  getSystemSnapshot,
} from "../../kernel/admin.engine.js";
import { analyzeFrame, applyPrivacyMode, getPrivacyMode, clearEscalation, analyzeStream } from "../../kernel/camera.engine.js";
import type { PrivacyMode } from "../../shared/types/node.types.js";

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

function requireAdminHeader(req: IncomingMessage): string | null {
  const key = req.headers["x-admin-key"];
  return typeof key === "string" ? key : null;
}

// ─── Admin Handlers ────────────────────────────────────────────────────────────

/** GET /admin/snapshot — system health snapshot (admin key required) */
export function handleAdminSnapshot(req: IncomingMessage, res: ServerResponse): void {
  const key = requireAdminHeader(req);
  if (!key) { json(res, 401, { error: "x-admin-key header required" }); return; }
  try {
    json(res, 200, getSystemSnapshot(key));
  } catch (err) {
    json(res, 403, { error: err instanceof Error ? err.message : "Forbidden" });
  }
}

/** POST /admin/action — perform admin action on a user */
export async function handleAdminAction(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const key = requireAdminHeader(req);
  if (!key) { json(res, 401, { error: "x-admin-key header required" }); return; }
  const body = await readBody(req);
  if (!body["target_user_id"] || !body["action"] || !body["reason"]) {
    json(res, 400, { error: "target_user_id, action and reason are required" });
    return;
  }
  try {
    const record = performAdminAction(
      key,
      body["target_user_id"] as string,
      body["action"] as "warn" | "suspend" | "revoke" | "reset_karma" | "force_sync",
      body["reason"] as string,
      (body["performed_by"] as string | undefined) ?? "admin",
    );
    json(res, 200, record);
  } catch (err) {
    json(res, 403, { error: err instanceof Error ? err.message : "Action failed" });
  }
}

/** GET /admin/activity/:userId — get 7-day activity for user */
export function handleUserActivity(req: IncomingMessage, res: ServerResponse): void {
  const key = requireAdminHeader(req);
  if (!key) { json(res, 401, { error: "x-admin-key header required" }); return; }
  if (!validateAdminKey(key)) { json(res, 403, { error: "Invalid admin key" }); return; }

  const url = new URL(req.url ?? "/", "http://localhost");
  // path: /admin/activity/:userId
  const parts = url.pathname.split("/").filter(Boolean);
  const userId = parts[2]; // ["admin","activity","<userId>"]
  if (!userId) { json(res, 400, { error: "userId path param required" }); return; }

  json(res, 200, {
    user_id: userId,
    suspended: isUserSuspended(userId),
    actions: getAdminActionsForUser(userId),
    activity: getUserActivity(userId),
  });
}

/** POST /admin/mode — set dev/production mode */
export async function handleSetMode(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const key = requireAdminHeader(req);
  if (!key) { json(res, 401, { error: "x-admin-key header required" }); return; }
  const body = await readBody(req);
  if (!body["mode"]) { json(res, 400, { error: "mode is required (development|production)" }); return; }
  try {
    setMode(key, body["mode"] as "development" | "production");
    json(res, 200, { ok: true, mode: body["mode"] });
  } catch (err) {
    json(res, 403, { error: err instanceof Error ? err.message : "Forbidden" });
  }
}

/** POST /admin/track — track user activity event */
export async function handleTrackActivity(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["user_id"] || !body["action"]) {
    json(res, 400, { error: "user_id and action are required" });
    return;
  }
  const event = trackActivity({
    user_id: body["user_id"] as string,
    action: body["action"] as string,
    timestamp: (body["timestamp"] as string | undefined) ?? new Date().toISOString(),
    device_id: body["device_id"] as string | undefined,
    metadata: body["metadata"] as Record<string, unknown> | undefined,
  });
  json(res, 200, event);
}

// ─── Camera / Privacy Handlers ────────────────────────────────────────────────

/** POST /privacy/analyze — analyze frame face count and apply privacy mode */
export async function handleAnalyzeFrame(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (body["face_count"] === undefined || !body["device_id"] || !body["node_id"]) {
    json(res, 400, { error: "face_count, device_id and node_id are required" });
    return;
  }
  const result = analyzeFrame(
    body["device_id"] as string,
    body["node_id"] as string,
    Number(body["face_count"]),
  );
  json(res, 200, result);
}

/** POST /privacy/apply — manually apply a privacy mode to a node */
export async function handleApplyPrivacy(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["node_id"] || !body["mode"]) {
    json(res, 400, { error: "node_id and mode are required" });
    return;
  }
  const valid: PrivacyMode[] = ["public", "protected", "private", "stealth", "encrypted"];
  if (!valid.includes(body["mode"] as PrivacyMode)) {
    json(res, 400, { error: `Invalid mode: ${String(body["mode"])}` });
    return;
  }
  applyPrivacyMode(body["node_id"] as string, body["mode"] as PrivacyMode);
  json(res, 200, { ok: true, mode: body["mode"] });
}

/** GET /privacy/mode?node_id=xxx — get current privacy mode for a node */
export function handleGetPrivacyMode(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const nodeId = url.searchParams.get("node_id");
  if (!nodeId) { json(res, 400, { error: "node_id query param required" }); return; }
  json(res, 200, { node_id: nodeId, mode: getPrivacyMode(nodeId) });
}

/** POST /privacy/clear — clear privacy escalation back to public */
export async function handleClearEscalation(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["node_id"]) { json(res, 400, { error: "node_id is required" }); return; }
  clearEscalation(body["node_id"] as string);
  json(res, 200, { ok: true });
}

/** POST /privacy/analyze-stream — analyze multiple frames at once */
export async function handleAnalyzeStream(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["device_id"] || !body["node_id"] || !Array.isArray(body["frames"])) {
    json(res, 400, { error: "device_id, node_id and frames[] are required" });
    return;
  }
  const results = analyzeStream(
    body["device_id"] as string,
    body["node_id"] as string,
    (body["frames"] as unknown[]).map(Number),
  );
  json(res, 200, { results });
}
