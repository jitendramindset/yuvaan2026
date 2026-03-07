import { createHash, randomUUID } from "node:crypto";
import type {
  DeviceRecord,
  DeviceMedium,
  PairingSession,
  DeviceRegistrationRequest,
  DevicePairRequest,
  PinConfirmRequest,
  DeviceAuthContext,
} from "../shared/types/device.types.js";

// ─── In-memory stores (replace with LevelDB partitions in production) ─────────
const deviceRegistry = new Map<string, DeviceRecord>();
const pairingSessions = new Map<string, PairingSession>();
const authSessions = new Map<string, DeviceAuthContext>();

const PIN_TTL_MS = 60_000; // 60 s
const SESSION_TTL_MS = 8 * 60 * 60 * 1_000; // 8 h

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashValue(value: string): string {
  return createHash("sha3-256").update(value).digest("hex");
}

function generatePin(): string {
  // Cryptographically random 6-digit PIN
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0]! % 1_000_000).padStart(6, "0");
}

// ─── Device Detection ─────────────────────────────────────────────────────────

/**
 * Simulate device detection on a given medium.
 * In production this would call platform-specific discovery APIs (USB HID,
 * mDNS, Bluetooth LE scan, etc.).  Here we return a synthetic device stub.
 */
export function detectDevice(medium: DeviceMedium): {
  found: boolean;
  device_id: string;
  fingerprint: string;
  medium: DeviceMedium;
  capabilities: string[];
} {
  const device_id = randomUUID();
  const fingerprint = hashValue(`${medium}:${device_id}:${Date.now()}`);
  const capabilityMap: Record<DeviceMedium, string[]> = {
    usb:       ["storage", "cmd"],
    network:   ["stream", "cmd", "camera", "mic"],
    bluetooth: ["audio", "input"],
    nfc:       ["identity", "payment"],
    cmd:       ["cmd"],
  };
  return {
    found: true,
    device_id,
    fingerprint,
    medium,
    capabilities: capabilityMap[medium],
  };
}

// ─── Device Registration ──────────────────────────────────────────────────────

export function registerDevice(req: DeviceRegistrationRequest): DeviceRecord {
  if (deviceRegistry.has(req.device_fingerprint)) {
    throw new Error(`Device already registered: ${req.device_fingerprint}`);
  }

  const record: DeviceRecord = {
    device_id: req.device_id ?? randomUUID(),
    device_fingerprint: req.device_fingerprint,
    owner_id: req.owner_id,
    label: req.label,
    medium: req.medium,
    status: "pending",
    auth_methods: req.password ? ["password"] : [],
    paired_at: null,
    last_seen_at: null,
    created_at: new Date().toISOString(),
    capabilities: req.capabilities ?? [],
    ip_address: req.ip_address,
    platform: req.platform,
  };

  deviceRegistry.set(req.device_fingerprint, record);
  return record;
}

// ─── PIN Pairing ──────────────────────────────────────────────────────────────

export function generatePairingPin(req: DevicePairRequest): PairingSession {
  const pin = generatePin();
  const session: PairingSession = {
    session_id: randomUUID(),
    device_id: req.device_id,
    pin,
    pin_hash: hashValue(pin),
    expires_at: Date.now() + PIN_TTL_MS,
    confirmed: false,
    medium: req.medium,
  };
  pairingSessions.set(session.session_id, session);
  // Return session — caller must display pin to user; do NOT log pin in production
  return session;
}

export function confirmPairing(req: PinConfirmRequest): DeviceAuthContext {
  const session = pairingSessions.get(req.session_id);
  if (!session) throw new Error("Pairing session not found");
  if (session.device_id !== req.device_id) throw new Error("Device ID mismatch");
  if (Date.now() > session.expires_at) {
    pairingSessions.delete(req.session_id);
    throw new Error("Pairing PIN expired");
  }

  const providedHash = hashValue(req.pin);
  if (providedHash !== session.pin_hash) throw new Error("Invalid PIN");

  // Mark device as paired
  const device = [...deviceRegistry.values()].find((d) => d.device_id === req.device_id);
  if (device) {
    device.status = "active";
    device.paired_at = new Date().toISOString();
    device.last_seen_at = new Date().toISOString();
    if (!device.auth_methods.includes("pin")) device.auth_methods.push("pin");
  }

  pairingSessions.delete(req.session_id);

  // Issue auth session
  const authCtx: DeviceAuthContext = {
    device_id: req.device_id,
    owner_id: device?.owner_id ?? "unknown",
    session_token: randomUUID(),
    expires_at: Date.now() + SESSION_TTL_MS,
    method: "pin",
  };
  authSessions.set(authCtx.session_token, authCtx);
  return authCtx;
}

// ─── Device Lookup ────────────────────────────────────────────────────────────

export function listPairedDevices(ownerId: string): DeviceRecord[] {
  return [...deviceRegistry.values()].filter(
    (d) => d.owner_id === ownerId && d.status !== "revoked",
  );
}

export function listAllDevices(): DeviceRecord[] {
  return [...deviceRegistry.values()].filter((d) => d.status !== "revoked");
}

export function getDeviceByFingerprint(fingerprint: string): DeviceRecord | null {
  return deviceRegistry.get(fingerprint) ?? null;
}

export function getDeviceById(deviceId: string): DeviceRecord | null {
  return [...deviceRegistry.values()].find((d) => d.device_id === deviceId) ?? null;
}

export function revokeDevice(deviceId: string): void {
  const device = getDeviceById(deviceId);
  if (!device) throw new Error(`Device not found: ${deviceId}`);
  device.status = "revoked";
}

export function heartbeat(deviceId: string): void {
  const device = getDeviceById(deviceId);
  if (device) device.last_seen_at = new Date().toISOString();
}

// ─── CMD device self-registration ────────────────────────────────────────────

export function registerCmdDevice(ownerId: string, label: string, password: string): DeviceRecord {
  const device_id = randomUUID();
  const fingerprint = hashValue(`cmd:${ownerId}:${label}:${Date.now()}`);
  return registerDevice({
    device_id,
    device_fingerprint: fingerprint,
    owner_id: ownerId,
    label,
    medium: "cmd",
    password,
    capabilities: ["cmd"],
    platform: "cli",
  });
}
