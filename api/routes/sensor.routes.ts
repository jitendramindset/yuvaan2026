import type { IncomingMessage, ServerResponse } from "node:http";
import {
  ingestSensorEvent,
  startVRSession,
  updateVRSession,
  endVRSession,
  getVRSession,
  getSensorContext,
} from "../../kernel/sensor.engine.js";

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

/** POST /sensor/event — push a raw sensor event */
export async function handleSensorEvent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["owner_id"] || !body["type"] || body["value"] === undefined) {
    json(res, 400, { error: "owner_id, type, value required" });
    return;
  }
  const event = ingestSensorEvent({
    event_id:   `se-${Date.now()}`,
    owner_id:   body["owner_id"] as string,
    device_id:  (body["device_id"] as string | undefined) ?? "api",
    type:       body["type"] as Parameters<typeof ingestSensorEvent>[0]["type"],
    value:      body["value"],
    confidence: (body["confidence"] as number | undefined) ?? 1.0,
    timestamp:  new Date().toISOString(),
  });
  json(res, 200, { event });
}

/** GET /sensor/context/:ownerId */
export function handleGetSensorContext(req: IncomingMessage, res: ServerResponse): void {
  const parts = (req.url ?? "").split("/").filter(Boolean);
  const ownerId = parts[2];
  if (!ownerId) { json(res, 400, { error: "ownerId required" }); return; }
  json(res, 200, { context: getSensorContext(ownerId) });
}

/** POST /sensor/vr/start */
export async function handleStartVR(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body    = await readBody(req);
  const ownerId = body["owner_id"] as string | undefined;
  const mode    = (body["mode"] as string | undefined) ?? "dashboard";
  if (!ownerId) { json(res, 400, { error: "owner_id required" }); return; }
  const session = startVRSession(ownerId, mode as "dashboard" | "app" | "game" | "social" | "spatial_builder");
  json(res, 200, { session });
}

/** PATCH /sensor/vr/:ownerId */
export async function handleUpdateVR(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const parts   = (req.url ?? "").split("/").filter(Boolean);
  const ownerId = parts[2];
  const body    = await readBody(req);
  if (!ownerId) { json(res, 400, { error: "ownerId required" }); return; }
  const session = updateVRSession(ownerId, body as unknown as import("../../kernel/sensor.engine.js").VRSessionState);
  session ? json(res, 200, { session }) : json(res, 404, { error: "No active VR session" });
}

/** DELETE /sensor/vr/:ownerId */
export function handleEndVR(req: IncomingMessage, res: ServerResponse): void {
  const parts   = (req.url ?? "").split("/").filter(Boolean);
  const ownerId = parts[2];
  if (!ownerId) { json(res, 400, { error: "ownerId required" }); return; }
  endVRSession(ownerId);
  json(res, 200, { ok: true });
}

/** GET /sensor/vr/:ownerId */
export function handleGetVR(req: IncomingMessage, res: ServerResponse): void {
  const parts   = (req.url ?? "").split("/").filter(Boolean);
  const ownerId = parts[2];
  if (!ownerId) { json(res, 400, { error: "ownerId required" }); return; }
  const session = getVRSession(ownerId);
  json(res, 200, { session });
}
