// ─── Device Connection Types ─────────────────────────────────────────────────

export type DeviceMedium = "usb" | "network" | "bluetooth" | "nfc" | "cmd";

export type DeviceStatus = "pending" | "paired" | "active" | "suspended" | "revoked";

export type AuthMethod = "password" | "biometric" | "hardware_key" | "pin" | "session_token";

export interface DeviceRecord {
  device_id: string;            // UUID
  device_fingerprint: string;   // SHA3-256 of hardware identifiers
  owner_id: string;
  label: string;
  medium: DeviceMedium;
  status: DeviceStatus;
  auth_methods: AuthMethod[];
  paired_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  capabilities: string[];       // e.g. ["camera","mic","biometric","usb"]
  ip_address?: string;
  platform?: string;            // "android" | "ios" | "linux" | "win32" | "cmd"
}

export interface PairingSession {
  session_id: string;
  device_id: string;
  pin: string;
  pin_hash: string;
  expires_at: number;           // Unix ms
  confirmed: boolean;
  medium: DeviceMedium;
}

export interface DeviceRegistrationRequest {
  device_id: string;
  device_fingerprint: string;
  owner_id: string;
  label: string;
  medium: DeviceMedium;
  password?: string;
  capabilities?: string[];
  platform?: string;
  ip_address?: string;
}

export interface DevicePairRequest {
  device_id: string;
  medium: DeviceMedium;
  owner_id: string;
}

export interface PinConfirmRequest {
  session_id: string;
  device_id: string;
  pin: string;
  password?: string;
}

export interface DeviceAuthContext {
  device_id: string;
  owner_id: string;
  session_token: string;
  expires_at: number;
  method: AuthMethod;
}

export interface BiometricToken {
  device_id: string;
  owner_id: string;
  template_hash: string;       // SHA3-256 of biometric template (never raw)
  assertion: string;           // Challenge-response assertion
  timestamp: string;
}

export interface HardwareKeyAuth {
  device_id: string;
  owner_id: string;
  key_id: string;
  signature: string;           // HMAC-SHA256 of nonce signed by hardware key
  nonce: string;
}
