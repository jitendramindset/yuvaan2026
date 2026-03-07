import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createHash } from "node:crypto";
import type {
  DeviceAuthContext,
  BiometricToken,
  HardwareKeyAuth,
  AuthMethod,
} from "../shared/types/device.types.js";

// ─── In-memory session store ───────────────────────────────────────────────────
const sessions = new Map<string, DeviceAuthContext>();
const biometricEnrollments = new Map<string, string>(); // device_id:owner_id → template_hash
const hardwareKeys = new Map<string, string>(); // key_id → owner_id
const nonces = new Set<string>();

const SESSION_TTL_MS = 8 * 60 * 60 * 1_000; // 8 h
const NONCE_TTL_MS = 30_000;                  // 30 s nonce window

// ─── Helpers ──────────────────────────────────────────────────────────────────
const HW_KEY_SECRET = process.env["HW_KEY_SECRET"] ?? "hw-key-secret-change-in-prod";

function sha3(value: string): string {
  return createHash("sha3-256").update(value).digest("hex");
}

function timeSafeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function issueSession(deviceId: string, ownerId: string, method: AuthMethod): DeviceAuthContext {
  const ctx: DeviceAuthContext = {
    device_id: deviceId,
    owner_id: ownerId,
    session_token: randomUUID(),
    expires_at: Date.now() + SESSION_TTL_MS,
    method,
  };
  sessions.set(ctx.session_token, ctx);
  return ctx;
}

// ─── Session Validation ────────────────────────────────────────────────────────

export function validateSession(token: string): DeviceAuthContext | null {
  const ctx = sessions.get(token);
  if (!ctx) return null;
  if (Date.now() > ctx.expires_at) {
    sessions.delete(token);
    return null;
  }
  return ctx;
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

// ─── Password Authentication ───────────────────────────────────────────────────
// Stored passwords are SHA3-256 hashed; raw passwords never stored.
const passwordStore = new Map<string, string>(); // `${owner_id}:${device_id}` → hash

export function setDevicePassword(ownerId: string, deviceId: string, rawPassword: string): void {
  if (rawPassword.length < 8) throw new Error("Password must be at least 8 characters");
  passwordStore.set(`${ownerId}:${deviceId}`, sha3(rawPassword));
}

export function authenticateWithPassword(
  ownerId: string,
  deviceId: string,
  rawPassword: string,
): DeviceAuthContext {
  const stored = passwordStore.get(`${ownerId}:${deviceId}`);
  if (!stored) throw new Error("No password set for this device");
  if (!timeSafeEquals(stored, sha3(rawPassword))) throw new Error("Invalid password");
  return issueSession(deviceId, ownerId, "password");
}

// ─── Biometric Authentication ──────────────────────────────────────────────────

export function enrollBiometric(token: BiometricToken): void {
  const key = `${token.device_id}:${token.owner_id}`;
  biometricEnrollments.set(key, token.template_hash);
}

export function authenticateWithBiometric(token: BiometricToken): DeviceAuthContext {
  const key = `${token.device_id}:${token.owner_id}`;
  const enrolled = biometricEnrollments.get(key);
  if (!enrolled) throw new Error("Biometric not enrolled for this device");

  // Validate assertion: HMAC-SHA256(template_hash + timestamp, HW_KEY_SECRET)
  const base = `${token.template_hash}:${token.timestamp}`;
  const expected = createHmac("sha256", HW_KEY_SECRET).update(base).digest("hex");
  if (!timeSafeEquals(expected, token.assertion)) {
    throw new Error("Biometric assertion invalid");
  }

  // Template hash must match enrolled
  if (!timeSafeEquals(enrolled, token.template_hash)) {
    throw new Error("Biometric template mismatch");
  }

  return issueSession(token.device_id, token.owner_id, "biometric");
}

// ─── Hardware Key Authentication ───────────────────────────────────────────────

export function registerHardwareKey(keyId: string, ownerId: string): void {
  hardwareKeys.set(keyId, ownerId);
}

export function issueNonce(): string {
  const nonce = randomUUID();
  nonces.add(nonce);
  // Auto-expire nonce
  setTimeout(() => nonces.delete(nonce), NONCE_TTL_MS);
  return nonce;
}

export function authenticateWithHardwareKey(auth: HardwareKeyAuth, deviceId: string): DeviceAuthContext {
  if (!nonces.has(auth.nonce)) throw new Error("Nonce invalid or expired");
  nonces.delete(auth.nonce); // single-use

  const ownerId = hardwareKeys.get(auth.key_id);
  if (!ownerId) throw new Error("Hardware key not registered");
  if (ownerId !== auth.owner_id) throw new Error("Key owner mismatch");

  // Validate: signature = HMAC-SHA256(nonce, HW_KEY_SECRET)
  const expected = createHmac("sha256", HW_KEY_SECRET).update(auth.nonce).digest("hex");
  if (!timeSafeEquals(expected, auth.signature)) {
    throw new Error("Hardware key signature invalid");
  }

  return issueSession(deviceId, ownerId, "hardware_key");
}

// ─── Middleware helper ─────────────────────────────────────────────────────────
export function extractAndValidateToken(authHeader: string | undefined): DeviceAuthContext | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return validateSession(token);
}
