import type { IncomingMessage, ServerResponse } from "node:http";
import {
  authenticateWithPassword,
  authenticateWithBiometric,
  authenticateWithHardwareKey,
  enrollBiometric,
  registerHardwareKey,
  issueNonce,
  validateSession,
  revokeSession,
  setDevicePassword,
} from "../../kernel/auth.engine.js";

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

// ─── Auth Handlers ────────────────────────────────────────────────────────────

/** POST /auth/password — authenticate with device password */
export async function handlePasswordAuth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["owner_id"] || !body["device_id"] || !body["password"]) {
    json(res, 400, { error: "owner_id, device_id and password are required" });
    return;
  }
  try {
    const ctx = authenticateWithPassword(
      body["owner_id"] as string,
      body["device_id"] as string,
      body["password"] as string,
    );
    json(res, 200, ctx);
  } catch (err) {
    json(res, 401, { error: err instanceof Error ? err.message : "Authentication failed" });
  }
}

/** POST /auth/set-password — set password for a device */
export async function handleSetPassword(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["owner_id"] || !body["device_id"] || !body["password"]) {
    json(res, 400, { error: "owner_id, device_id and password are required" });
    return;
  }
  try {
    setDevicePassword(
      body["owner_id"] as string,
      body["device_id"] as string,
      body["password"] as string,
    );
    json(res, 200, { ok: true });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Set password failed" });
  }
}

/** POST /auth/biometric — authenticate with biometric assertion */
export async function handleBiometricAuth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["device_id"] || !body["owner_id"] || !body["template_hash"] || !body["assertion"] || !body["timestamp"]) {
    json(res, 400, { error: "device_id, owner_id, template_hash, assertion and timestamp are required" });
    return;
  }
  try {
    const ctx = authenticateWithBiometric({
      device_id: body["device_id"] as string,
      owner_id: body["owner_id"] as string,
      template_hash: body["template_hash"] as string,
      assertion: body["assertion"] as string,
      timestamp: body["timestamp"] as string,
    });
    json(res, 200, ctx);
  } catch (err) {
    json(res, 401, { error: err instanceof Error ? err.message : "Biometric auth failed" });
  }
}

/** POST /auth/enroll-biometric — enroll biometric template hash for device */
export async function handleEnrollBiometric(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["device_id"] || !body["owner_id"] || !body["template_hash"] || !body["assertion"] || !body["timestamp"]) {
    json(res, 400, { error: "device_id, owner_id, template_hash, assertion and timestamp are required" });
    return;
  }
  enrollBiometric({
    device_id: body["device_id"] as string,
    owner_id: body["owner_id"] as string,
    template_hash: body["template_hash"] as string,
    assertion: body["assertion"] as string,
    timestamp: body["timestamp"] as string,
  });
  json(res, 200, { ok: true });
}

/** GET /auth/nonce — get a challenge nonce for hardware key auth */
export function handleGetNonce(_req: IncomingMessage, res: ServerResponse): void {
  const nonce = issueNonce();
  json(res, 200, { nonce });
}

/** POST /auth/hardware-key — authenticate with hardware key signature */
export async function handleHardwareKeyAuth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["key_id"] || !body["owner_id"] || !body["device_id"] || !body["signature"] || !body["nonce"]) {
    json(res, 400, { error: "key_id, owner_id, device_id, signature and nonce are required" });
    return;
  }
  try {
    const ctx = authenticateWithHardwareKey(
      {
        device_id: body["device_id"] as string,
        owner_id: body["owner_id"] as string,
        key_id: body["key_id"] as string,
        signature: body["signature"] as string,
        nonce: body["nonce"] as string,
      },
      body["device_id"] as string,
    );
    json(res, 200, ctx);
  } catch (err) {
    json(res, 401, { error: err instanceof Error ? err.message : "Hardware key auth failed" });
  }
}

/** POST /auth/register-key — register a hardware key id for an owner */
export async function handleRegisterHardwareKey(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["key_id"] || !body["owner_id"]) {
    json(res, 400, { error: "key_id and owner_id are required" });
    return;
  }
  registerHardwareKey(body["key_id"] as string, body["owner_id"] as string);
  json(res, 200, { ok: true });
}

/** POST /auth/validate-session — validate a session token */
export async function handleValidateSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const token = body["session_token"] as string | undefined;
  if (!token) {
    json(res, 400, { error: "session_token is required" });
    return;
  }
  const ctx = validateSession(token);
  if (!ctx) {
    json(res, 401, { error: "Session invalid or expired" });
    return;
  }
  json(res, 200, ctx);
}

/** POST /auth/logout — revoke a session token */
export async function handleLogout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const token = body["session_token"] as string | undefined;
  if (!token) { json(res, 400, { error: "session_token is required" }); return; }
  revokeSession(token);
  json(res, 200, { ok: true });
}
