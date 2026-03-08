import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import {
  addHubDevice,
  listHubDevices,
  getHubDevice,
  updateHubDevice,
  removeHubDevice,
  sendCommand,
  fetchDeviceState,
  probeDevice,
  registerWSChannel,
  unregisterWSChannel,
  handleWSMessage,
  DEVICE_PRESETS,
  type DeviceCategory,
  type ConnectionProtocol,
  type DeviceCapability,
} from "../../kernel/device_hub.engine.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function ownerId(req: IncomingMessage): string {
  const parts = (req.url ?? "").split("/").filter(Boolean);
  // /hub/devices/:ownerId/...
  return parts[2] ?? "user.default";
}

// ── GET /hub/presets — catalogue of device templates ─────────────────────────

export function handleGetPresets(_req: IncomingMessage, res: ServerResponse): void {
  json(res, 200, { presets: DEVICE_PRESETS });
}

// ── GET /hub/devices/:ownerId — list all devices ──────────────────────────────

export function handleListHubDevices(req: IncomingMessage, res: ServerResponse): void {
  json(res, 200, { devices: listHubDevices(ownerId(req)) });
}

// ── POST /hub/devices/:ownerId — add a device ─────────────────────────────────

export async function handleAddHubDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const owner = ownerId(req);
  const body  = await readBody(req);

  if (!body["category"] || !body["label"]) {
    json(res, 400, { error: "category and label are required" });
    return;
  }

  const device = addHubDevice({
    owner_id:     owner,
    category:     body["category"]    as DeviceCategory,
    label:        body["label"]       as string,
    model:        body["model"]       as string | undefined,
    protocol:     (body["protocol"]   as ConnectionProtocol) ?? "websocket",
    address:      body["address"]     as string | undefined,
    port:         body["port"]        as number | undefined,
    api_key:      body["api_key"]     as string | undefined,
    room:         body["room"]        as string | undefined,
    icon:         (body["icon"]       as string) ?? "📡",
    capabilities: (body["capabilities"] as DeviceCapability[]) ?? [],
    status:       "offline",
    state:        {},
    meta:         body["meta"] as Record<string, unknown> | undefined,
  });

  json(res, 201, { device });
}

// ── PATCH /hub/devices/:ownerId/:deviceId — update device ─────────────────────

export async function handleUpdateHubDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const parts    = (req.url ?? "").split("/").filter(Boolean);
  const deviceId = parts[3] ?? "";
  const patch    = await readBody(req);
  const updated  = updateHubDevice(deviceId, patch as never);
  if (!updated) { json(res, 404, { error: "Device not found" }); return; }
  json(res, 200, { device: updated });
}

// ── DELETE /hub/devices/:ownerId/:deviceId — remove device ───────────────────

export function handleRemoveHubDevice(req: IncomingMessage, res: ServerResponse): void {
  const parts    = (req.url ?? "").split("/").filter(Boolean);
  const owner    = parts[2] ?? "";
  const deviceId = parts[3] ?? "";
  const ok = removeHubDevice(owner, deviceId);
  json(res, ok ? 200 : 404, { ok });
}

// ── POST /hub/devices/:ownerId/:deviceId/command — send command ───────────────

export async function handleSendCommand(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const parts    = (req.url ?? "").split("/").filter(Boolean);
  const owner    = parts[2] ?? "";
  const deviceId = parts[3] ?? "";
  const body     = await readBody(req);

  if (!body["capability"]) { json(res, 400, { error: "capability is required" }); return; }

  const device = getHubDevice(deviceId);
  if (!device || device.owner_id !== owner) { json(res, 404, { error: "Device not found" }); return; }

  const cmd = await sendCommand(
    deviceId,
    body["capability"] as string,
    body["params"]     as Record<string, unknown> ?? {},
    owner,
  );
  json(res, 200, { command: cmd });
}

// ── GET /hub/devices/:ownerId/:deviceId/state — fetch live state ──────────────

export async function handleGetDeviceState(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const parts    = (req.url ?? "").split("/").filter(Boolean);
  const deviceId = parts[3] ?? "";
  const state    = await fetchDeviceState(deviceId);
  if (state === null) { json(res, 404, { error: "Device not found" }); return; }
  json(res, 200, { state });
}

// ── POST /hub/probe — discover a device at an address ────────────────────────

export async function handleProbeDevice(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body     = await readBody(req);
  const address  = body["address"] as string;
  const protocol = (body["protocol"] as ConnectionProtocol) ?? "http_rest";
  if (!address) { json(res, 400, { error: "address is required" }); return; }
  const result = await probeDevice(address, protocol);
  json(res, 200, result);
}

// ── WebSocket upgrade — /hub/ws/:channelId/:deviceId ─────────────────────────
//
// Called from the HTTP server when it receives an "Upgrade: websocket" header.
// Uses the built-in node:http low-level socket API (no ws package needed for
// the handshake — devices can send raw JSON frames over a persistent TCP
// keep-alive after the 101 switch).
//
// For production, swap this with a proper ws library or Socket.IO.

export function handleDeviceWSUpgrade(
  req: IncomingMessage,
  socket: import("node:net").Socket,
  head: Buffer,
): void {
  const parts    = (req.url ?? "").split("/").filter(Boolean);
  const deviceId  = parts[2] ?? "";
  const channelId = randomUUID();

  // RFC 6455 WebSocket handshake
  const key = req.headers["sec-websocket-key"];
  if (!key) { socket.destroy(); return; }

  import("node:crypto").then(({ createHash }) => {
    const MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    const accept = createHash("sha1").update(key + MAGIC).digest("base64");

    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    );

    // Minimal WebSocket frame encoder (text frames only, payload ≤ 65535)
    function buildFrame(text: string): Buffer {
      const payload = Buffer.from(text, "utf8");
      const len     = payload.length;
      const header  = len < 126 ? Buffer.alloc(2) : Buffer.alloc(4);
      header[0] = 0x81; // FIN + text opcode
      if (len < 126) {
        header[1] = len;
      } else {
        header[1] = 126;
        header.writeUInt16BE(len, 2);
      }
      return Buffer.concat([header, payload]);
    }

    registerWSChannel(channelId, deviceId, (msg) => {
      if (!socket.destroyed) socket.write(buildFrame(msg));
    });

    // Minimal frame decoder
    let buf = Buffer.alloc(0);
    socket.on("data", (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 2) {
        const masked = (buf[1]! & 0x80) !== 0;
        let length   = buf[1]! & 0x7f;
        let offset   = 2;
        if (length === 126) { length = buf.readUInt16BE(2); offset = 4; }
        const maskEnd = masked ? offset + 4 : offset;
        if (buf.length < maskEnd + length) break;
        const maskKey = masked ? buf.slice(offset, offset + 4) : null;
        const data    = buf.slice(maskEnd, maskEnd + length);
        if (maskKey) for (let i = 0; i < data.length; i++) data[i]! ^= maskKey[i % 4]!;
        buf = buf.slice(maskEnd + length);
        const opcode = buf.length >= 0 ? (buf[0]! & 0x0f) : 0;
        const frame  = data.toString("utf8");
        if (opcode === 0x8 /* close */) { socket.end(); break; }
        handleWSMessage(channelId, frame);
      }
    });

    socket.on("close",   () => unregisterWSChannel(channelId));
    socket.on("error",   () => unregisterWSChannel(channelId));
    void head;
  }).catch(() => socket.destroy());
}
