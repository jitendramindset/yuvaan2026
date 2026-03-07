import type { IncomingMessage, ServerResponse } from "node:http";
import {
  detectDevice,
  registerDevice,
  generatePairingPin,
  confirmPairing,
  listPairedDevices,
  listAllDevices,
  revokeDevice,
  heartbeat,
  registerCmdDevice,
} from "../../kernel/device.engine.js";
import { randomUUID } from "node:crypto";

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

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** POST /devices/detect — scan for a device on a given medium */
export async function handleDetectDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const medium = (body["medium"] as string) ?? "network";
  const validMediums = ["usb", "network", "bluetooth", "nfc", "cmd"] as const;
  if (!validMediums.includes(medium as never)) {
    json(res, 400, { error: `Invalid medium: ${medium}` });
    return;
  }
  const result = detectDevice(medium as "usb" | "network" | "bluetooth" | "nfc" | "cmd");
  json(res, 200, result);
}

/** POST /devices/register — register a discovered device */
export async function handleRegisterDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["owner_id"] || !body["label"]) {
    json(res, 400, { error: "owner_id and label are required" });
    return;
  }
  try {
    const record = registerDevice({
      device_id: (body["device_id"] as string | undefined) ?? randomUUID(),
      device_fingerprint: (body["device_fingerprint"] as string | undefined) ?? randomUUID(),
      owner_id: body["owner_id"] as string,
      label: body["label"] as string,
      medium: (body["medium"] as "usb" | "network" | "bluetooth" | "nfc" | "cmd") ?? "network",
      password: body["password"] as string | undefined,
      capabilities: body["capabilities"] as string[] | undefined,
      platform: body["platform"] as string | undefined,
      ip_address: body["ip_address"] as string | undefined,
    });
    json(res, 201, record);
  } catch (err) {
    json(res, 409, { error: err instanceof Error ? err.message : "Registration failed" });
  }
}

/** POST /devices/pair — generate a PIN for pairing */
export async function handlePairDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["device_id"] || !body["owner_id"]) {
    json(res, 400, { error: "device_id and owner_id are required" });
    return;
  }
  const session = generatePairingPin({
    device_id: body["device_id"] as string,
    medium: (body["medium"] as "usb" | "network" | "bluetooth" | "nfc" | "cmd") ?? "network",
    owner_id: body["owner_id"] as string,
  });
  // Return session sans the raw pin for security; pin delivered out-of-band to device screen
  json(res, 200, {
    session_id: session.session_id,
    device_id: session.device_id,
    expires_at: session.expires_at,
    // NOTE: In production, pin is shown on the device display, not in this API response.
    // Exposed here only for development/testing.
    pin: process.env["NODE_ENV"] !== "production" ? session.pin : undefined,
  });
}

/** POST /devices/confirm-pin — confirm pairing PIN and receive session token */
export async function handleConfirmPin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["session_id"] || !body["device_id"] || !body["pin"]) {
    json(res, 400, { error: "session_id, device_id and pin are required" });
    return;
  }
  try {
    const authCtx = confirmPairing({
      session_id: body["session_id"] as string,
      device_id: body["device_id"] as string,
      pin: body["pin"] as string,
      password: body["password"] as string | undefined,
    });
    json(res, 200, authCtx);
  } catch (err) {
    json(res, 401, { error: err instanceof Error ? err.message : "Pairing failed" });
  }
}

/** GET /devices/list?owner_id=xxx — list paired devices (omit owner_id for all) */
export async function handleListDevices(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const ownerId = url.searchParams.get("owner_id");
  if (ownerId) {
    // filtered by owner
    json(res, 200, { devices: listPairedDevices(ownerId) });
  } else {
    // admin: return all non-revoked devices
    json(res, 200, { devices: listAllDevices() });
  }
}

/** POST /devices/revoke — revoke a device */
export async function handleRevokeDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["device_id"]) {
    json(res, 400, { error: "device_id is required" });
    return;
  }
  try {
    revokeDevice(body["device_id"] as string);
    json(res, 200, { ok: true });
  } catch (err) {
    json(res, 404, { error: err instanceof Error ? err.message : "Revoke failed" });
  }
}

/** POST /devices/heartbeat — update last_seen_at */
export async function handleHeartbeat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["device_id"]) {
    json(res, 400, { error: "device_id is required" });
    return;
  }
  heartbeat(body["device_id"] as string);
  json(res, 200, { ok: true });
}

/** POST /devices/register-cmd — self-register a CLI device */
export async function handleRegisterCmdDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["owner_id"] || !body["label"] || !body["password"]) {
    json(res, 400, { error: "owner_id, label and password are required" });
    return;
  }
  try {
    const record = registerCmdDevice(
      body["owner_id"] as string,
      body["label"] as string,
      body["password"] as string,
    );
    json(res, 201, record);
  } catch (err) {
    json(res, 409, { error: err instanceof Error ? err.message : "CMD registration failed" });
  }
}

