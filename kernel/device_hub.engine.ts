/**
 * device_hub.engine.ts
 *
 * Central hub for ALL device types — TV, PC, mobile, camera, mic, laptop,
 * gaming console, smartwatch, IoT sensor, smart home, VR headset, streaming
 * stick, smart speaker (Alexa / Google Home), etc.
 *
 * Each device connects via the most appropriate protocol:
 *   - WebSocket  → real-time bidirectional (preferred for smart TVs, PCs, mobile)
 *   - HTTP REST  → polling / command devices (IP cameras, smart lights)
 *   - MQTT stub  → IoT sensors, smart-home
 *   - WebRTC     → camera stream, mic, P2P (handled client-side, hub stores SDP)
 *   - BLE/USB    → routed through the local NodeOS agent on the host machine
 *
 * Once paired the device is a full **node** in the graph and the AI can
 * list it as a tool, send commands, read sensor data, and trigger automations.
 */

import { randomUUID } from "node:crypto";
import { broadcastEvent } from "./broadcast.engine.js";

// ── Device catalogue ─────────────────────────────────────────────────────────

export type DeviceCategory =
  | "tv"            // Smart TV (LG ThinQ, Samsung Tizen, Sony Bravia, Android TV)
  | "pc"            // Windows / Linux / Mac desktop or laptop
  | "mobile"        // iOS / Android phone or tablet
  | "camera"        // IP camera, webcam, security cam
  | "microphone"    // standalone mic / array mic
  | "gaming"        // PS5, Xbox, Nintendo Switch, Steam Deck
  | "watch"         // Apple Watch, Wear OS, Fitbit
  | "iot_sensor"    // temperature, humidity, motion, door, smoke, etc.
  | "smart_light"   // Philips Hue, LIFX, Govee, Yeelight
  | "smart_plug"    // Tasmota, TP-Link Kasa, Shelly
  | "thermostat"    // Nest, ecobee, Honeywell
  | "speaker"       // Alexa Echo, Google Nest, Sonos
  | "vr_headset"    // Meta Quest, HTC Vive, Apple Vision Pro
  | "streaming"     // Chromecast, Roku, Fire TV Stick, Apple TV
  | "robot"         // vacuum robot, lawn mower bot
  | "lock"          // smart lock / deadbolt
  | "display"       // secondary monitor, digital sign, e-ink display
  | "car"           // Android Auto, Apple CarPlay, OBD-II dongle
  | "wearable"      // fitness band, ring, AR glasses
  | "custom";

export type ConnectionProtocol =
  | "websocket"   // ws:// or wss://
  | "http_rest"   // polling or REST commands
  | "mqtt"        // MQTT broker
  | "webrtc"      // P2P media (camera/mic stream)
  | "bluetooth"   // Web Bluetooth / BLE
  | "usb"         // USB HID or CDC
  | "mdns"        // local network mDNS discovery
  | "upnp"        // UPnP / DLNA
  | "alexa_skill" // Amazon Alexa Smart Home skill
  | "google_home" // Google Home Action
  | "homekit"     // Apple HomeKit (HAP over TCP)
  | "zigbee"      // Zigbee (via local hub)
  | "zwave"       // Z-Wave (via local hub)
  | "wol"         // Wake-on-LAN magic packet
  | "rtsp"        // camera stream
  | "cast"        // Chromecast protocol
  | "samsung_tizen"   // Samsung Smart TV
  | "lg_webos"        // LG WebOS TV
  | "android_tv"      // Android TV / Google TV
  | "hdmi_cec";       // HDMI-CEC via network adapter

export type DeviceStatus = "online" | "offline" | "idle" | "busy" | "pairing" | "error" | "sleeping";

export interface HubDevice {
  device_id:     string;
  owner_id:      string;
  category:      DeviceCategory;
  label:         string;
  model?:        string;       // e.g. "Samsung QN90B", "PS5", "Meta Quest 3"
  icon:          string;       // emoji
  protocol:      ConnectionProtocol;
  address?:      string;       // IP, MAC, hostname, or token endpoint
  port?:         number;
  api_key?:      string;       // device token / PAT
  status:        DeviceStatus;
  capabilities:  DeviceCapability[];
  state:         DeviceState;  // last known sensor/media state
  room?:         string;       // "Living Room", "Bedroom", etc.
  added_at:      string;
  last_seen?:    string;
  ws_channel_id?: string;      // active WebSocket channel key
  meta?:         Record<string, unknown>;
}

export type DeviceCapability =
  // Media
  | "play" | "pause" | "stop" | "seek" | "volume" | "mute"
  | "next" | "prev" | "fullscreen" | "cast_receive" | "cast_send"
  // Navigation (TV / streaming)
  | "nav_up" | "nav_down" | "nav_left" | "nav_right" | "nav_select"
  | "nav_back" | "nav_home" | "nav_menu" | "nav_exit"
  // App launcher
  | "launch_app" | "list_apps" | "close_app"
  // Power
  | "power_on" | "power_off" | "reboot" | "sleep" | "wake" | "wol"
  // Home Automation
  | "light_on" | "light_off" | "light_dim" | "light_color"
  | "thermostat_set" | "thermostat_read"
  | "lock" | "unlock" | "door_status"
  | "plug_on" | "plug_off" | "plug_energy_read"
  // Camera / Mic
  | "camera_stream" | "camera_snapshot" | "camera_ptz"
  | "mic_listen" | "mic_stop"
  // Gaming
  | "gamepad_input" | "screenshot" | "record_clip"
  // PC
  | "keyboard" | "mouse" | "clipboard" | "open_url" | "run_command"
  // Sensors
  | "read_sensor" | "read_health" | "read_location"
  // Notifications
  | "push_notification" | "tts_speak";

export interface DeviceState {
  power?:          "on" | "off" | "standby";
  volume?:         number;       // 0–100
  muted?:          boolean;
  playing?:        boolean;
  current_app?:    string;
  current_media?:  string;
  brightness?:     number;       // light 0–100
  color_hex?:      string;       // smart light colour
  temperature?:    number;       // thermostat or sensor (°C)
  humidity?:       number;       // IoT sensor
  locked?:         boolean;      // smart lock
  switch_on?:      boolean;      // smart plug
  battery?:        number;       // wearable / watch (%)
  steps?:          number;
  heart_rate?:     number;
  cpu_usage?:      number;       // PC
  mem_usage?:      number;       // PC
  network_mbps?:   number;       // router / PC
  signal_pct?:     number;       // WiFi / BLE signal
  [k: string]:     unknown;
}

export interface DeviceCommand {
  command_id:  string;
  device_id:   string;
  capability:  DeviceCapability | string;
  params?:     Record<string, unknown>;
  issued_by:   string;           // owner_id or "ai_agent"
  issued_at:   string;
  response?:   unknown;
  status:      "pending" | "sent" | "ack" | "error";
}

// ── In-memory stores ──────────────────────────────────────────────────────────

const deviceStore  = new Map<string, HubDevice>();   // device_id → device
const commandQueue = new Map<string, DeviceCommand[]>(); // device_id → pending cmds
const wsChannels   = new Map<string, { send: (msg: string) => void; deviceId: string }>();

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function addHubDevice(d: Omit<HubDevice, "device_id" | "added_at">): HubDevice {
  const device: HubDevice = {
    ...d,
    device_id: randomUUID(),
    added_at:  new Date().toISOString(),
    state:     d.state ?? {},
  };
  deviceStore.set(device.device_id, device);
  return device;
}

export function listHubDevices(ownerId: string): HubDevice[] {
  return Array.from(deviceStore.values()).filter((d) => d.owner_id === ownerId);
}

export function getHubDevice(deviceId: string): HubDevice | undefined {
  return deviceStore.get(deviceId);
}

export function updateHubDevice(deviceId: string, patch: Partial<HubDevice>): HubDevice | null {
  const d = deviceStore.get(deviceId);
  if (!d) return null;
  const updated = { ...d, ...patch };
  deviceStore.set(deviceId, updated);
  return updated;
}

export function removeHubDevice(ownerId: string, deviceId: string): boolean {
  const d = deviceStore.get(deviceId);
  if (!d || d.owner_id !== ownerId) return false;
  deviceStore.delete(deviceId);
  return true;
}

// ── Command dispatch ──────────────────────────────────────────────────────────

export async function sendCommand(
  deviceId: string,
  capability: DeviceCapability | string,
  params: Record<string, unknown> = {},
  issuedBy = "user",
): Promise<DeviceCommand> {
  const cmd: DeviceCommand = {
    command_id: randomUUID(),
    device_id:  deviceId,
    capability,
    params,
    issued_by:  issuedBy,
    issued_at:  new Date().toISOString(),
    status:     "pending",
  };

  const device = deviceStore.get(deviceId);
  if (!device) {
    cmd.status = "error";
    cmd.response = "Device not found";
    return cmd;
  }

  // Try WebSocket channel first (real-time)
  const ws = wsChannels.get(device.ws_channel_id ?? "");
  if (ws) {
    try {
      ws.send(JSON.stringify({ type: "command", command: cmd }));
      cmd.status = "sent";
      updateHubDevice(deviceId, { last_seen: new Date().toISOString() });
      broadcastEvent(deviceId, "device_command", cmd);
      return cmd;
    } catch {
      cmd.status = "error";
      cmd.response = "WebSocket send failed";
    }
  }

  // HTTP REST fallback
  if (device.protocol === "http_rest" && device.address) {
    try {
      const resp = await dispatchHTTPCommand(device, cmd);
      cmd.status   = "ack";
      cmd.response = resp;
      return cmd;
    } catch (err) {
      cmd.status   = "error";
      cmd.response = err instanceof Error ? err.message : "HTTP error";
    }
  }

  // Queue command for when device reconnects
  const q = commandQueue.get(deviceId) ?? [];
  q.push(cmd);
  commandQueue.set(deviceId, q.slice(-50)); // keep last 50
  return cmd;
}

// ── Protocol implementations ──────────────────────────────────────────────────

async function dispatchHTTPCommand(device: HubDevice, cmd: DeviceCommand): Promise<unknown> {
  const base = `${device.address}`.replace(/\/$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (device.api_key) headers["Authorization"] = `Bearer ${device.api_key}`;

  // Map capability → HTTP method + path (device-specific adapters)
  const { method, path, body } = buildHTTPPayload(device, cmd);
  const url = `${base}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
}

function buildHTTPPayload(
  device: HubDevice,
  cmd: DeviceCommand,
): { method: string; path: string; body?: unknown } {
  const cap    = cmd.capability;
  const params = cmd.params ?? {};

  // Generic REST adapters (can be extended per brand)
  switch (device.category) {
    case "smart_light":
      if (cap === "light_on")     return { method: "PUT", path: "/api/state",  body: { on: true } };
      if (cap === "light_off")    return { method: "PUT", path: "/api/state",  body: { on: false } };
      if (cap === "light_dim")    return { method: "PUT", path: "/api/state",  body: { brightness: params["brightness"] } };
      if (cap === "light_color")  return { method: "PUT", path: "/api/state",  body: { color: params["color"] } };
      break;
    case "smart_plug":
      if (cap === "plug_on")   return { method: "POST", path: "/relay/0/command", body: { turn: "on" } };
      if (cap === "plug_off")  return { method: "POST", path: "/relay/0/command", body: { turn: "off" } };
      break;
    case "thermostat":
      if (cap === "thermostat_set")  return { method: "POST", path: "/v1/thermostat", body: { target: params["temp"] } };
      if (cap === "thermostat_read") return { method: "GET",  path: "/v1/thermostat", body: undefined };
      break;
    case "tv":
    case "streaming":
      // Generic keypress API (works for many Android TV / Roku devices)
      return { method: "POST", path: "/input/key",  body: { key: cap, ...params } };
    case "lock":
      if (cap === "lock")   return { method: "PUT", path: "/v1/locks/lock", body: {} };
      if (cap === "unlock") return { method: "PUT", path: "/v1/locks/unlock", body: {} };
      break;
  }

  // Default: POST to /command
  return { method: "POST", path: "/command", body: { capability: cap, params } };
}

// ── WebSocket channel management ──────────────────────────────────────────────

export function registerWSChannel(
  channelId: string,
  deviceId: string,
  sendFn: (msg: string) => void,
): void {
  wsChannels.set(channelId, { send: sendFn, deviceId });
  updateHubDevice(deviceId, {
    ws_channel_id: channelId,
    status:        "online",
    last_seen:     new Date().toISOString(),
  });
  broadcastEvent(deviceId, "device_connected", { deviceId });

  // Flush any queued commands
  const queued = commandQueue.get(deviceId) ?? [];
  queued.filter((c) => c.status === "pending").forEach((c) => {
    sendFn(JSON.stringify({ type: "command", command: c }));
    c.status = "sent";
  });
}

export function unregisterWSChannel(channelId: string): void {
  const ch = wsChannels.get(channelId);
  if (ch) {
    updateHubDevice(ch.deviceId, { status: "offline", ws_channel_id: undefined });
    broadcastEvent(ch.deviceId, "device_disconnected", { deviceId: ch.deviceId });
  }
  wsChannels.delete(channelId);
}

export function handleWSMessage(channelId: string, raw: string): void {
  const ch = wsChannels.get(channelId);
  if (!ch) return;

  try {
    const msg = JSON.parse(raw) as { type: string; state?: Partial<DeviceState>; ack?: string; sensor?: unknown };

    if (msg.type === "state_update" && msg.state) {
      updateHubDevice(ch.deviceId, { state: { ...(getHubDevice(ch.deviceId)?.state ?? {}), ...msg.state }, last_seen: new Date().toISOString() });
      broadcastEvent(ch.deviceId, "device_state_update", msg.state);
    }

    if (msg.type === "ack" && msg.ack) {
      // Mark command acknowledged
      const q = commandQueue.get(ch.deviceId) ?? [];
      const c = q.find((x) => x.command_id === msg.ack);
      if (c) c.status = "ack";
    }
  } catch { /* ignore malformed */ }
}

// ── State query ───────────────────────────────────────────────────────────────

export async function fetchDeviceState(deviceId: string): Promise<DeviceState | null> {
  const d = deviceStore.get(deviceId);
  if (!d) return null;

  // If live WebSocket, ask device for state
  const ws = wsChannels.get(d.ws_channel_id ?? "");
  if (ws) {
    ws.send(JSON.stringify({ type: "get_state" }));
  } else if (d.protocol === "http_rest" && d.address) {
    try {
      const headers: Record<string, string> = {};
      if (d.api_key) headers["Authorization"] = `Bearer ${d.api_key}`;
      const res = await fetch(`${d.address}/api/state`, { headers, signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const fresh = await res.json() as DeviceState;
        updateHubDevice(deviceId, { state: fresh, last_seen: new Date().toISOString() });
        return fresh;
      }
    } catch { /* return cached */ }
  }
  return d.state;
}

// ── Device discovery probes ───────────────────────────────────────────────────

export async function probeDevice(
  address: string,
  protocol: ConnectionProtocol,
): Promise<{ reachable: boolean; category?: DeviceCategory; capabilities?: DeviceCapability[]; model?: string }> {
  if (protocol === "http_rest" || protocol === "cast") {
    // Try common discovery endpoints
    const probes: Array<[string, DeviceCategory, DeviceCapability[]]> = [
      // Philips Hue bridge
      ["/api/0/config",        "smart_light", ["light_on", "light_off", "light_dim", "light_color"]],
      // Chromecast / Google Home
      ["/setup/eureka_info",   "streaming",   ["cast_receive", "volume", "play", "pause"]],
      // Samsung TV
      ["/api/v2/",             "tv",          ["power_on", "power_off", "volume", "nav_up", "nav_down", "launch_app"]],
      // Generic NodeOS agent
      ["/nodeos/ping",         "pc",          ["keyboard", "mouse", "open_url", "run_command", "push_notification"]],
      // Shelly smart plug
      ["/shelly",              "smart_plug",  ["plug_on", "plug_off", "plug_energy_read"]]
    ];
    for (const [path, cat, caps] of probes) {
      try {
        const res = await fetch(`http://${address}${path}`, { signal: AbortSignal.timeout(1500) });
        if (res.ok) {
          const data = await res.json().catch(() => ({})) as Record<string, unknown>;
          return { reachable: true, category: cat, capabilities: caps, model: String(data["model"] ?? data["name"] ?? "") };
        }
      } catch { /* next probe */ }
    }
  }
  // Blind TCP ping via HEAD
  try {
    await fetch(`http://${address}`, { method: "HEAD", signal: AbortSignal.timeout(1000) });
    return { reachable: true };
  } catch {
    return { reachable: false };
  }
}

// ── Device presets (for quick-add) ────────────────────────────────────────────

export const DEVICE_PRESETS: Array<{
  category:      DeviceCategory;
  icon:          string;
  label:         string;
  protocol:      ConnectionProtocol;
  capabilities:  DeviceCapability[];
  defaultPort?:  number;
  setupHint:     string;
}> = [
  {
    category:     "tv",
    icon:         "📺",
    label:        "Smart TV",
    protocol:     "websocket",
    capabilities: ["power_on","power_off","volume","mute","nav_up","nav_down","nav_left","nav_right","nav_select","nav_back","nav_home","launch_app","cast_receive","play","pause","stop","fullscreen"],
    defaultPort:  8001,
    setupHint:    "Enter your TV's IP address. Samsung: port 8001; LG: port 3000; Android TV: port 6466.",
  },
  {
    category:     "pc",
    icon:         "🖥️",
    label:        "PC / Laptop",
    protocol:     "websocket",
    capabilities: ["keyboard","mouse","clipboard","open_url","run_command","screenshot","push_notification","power_off","sleep","wake","wol"],
    defaultPort:  9001,
    setupHint:    "Install the NodeOS Desktop Agent on your PC and it will appear here automatically.",
  },
  {
    category:     "mobile",
    icon:         "📱",
    label:        "Phone / Tablet",
    protocol:     "websocket",
    capabilities: ["push_notification","tts_speak","camera_stream","mic_listen","read_location","read_health","read_sensor"],
    defaultPort:  9002,
    setupHint:    "Open the NodeOS Mobile app and tap 'Connect to Dashboard'.",
  },
  {
    category:     "camera",
    icon:         "📷",
    label:        "IP Camera",
    protocol:     "rtsp",
    capabilities: ["camera_stream","camera_snapshot","camera_ptz"],
    defaultPort:  554,
    setupHint:    "Enter the RTSP URL of your IP camera (e.g. rtsp://192.168.1.x:554/stream).",
  },
  {
    category:     "microphone",
    icon:         "🎙️",
    label:        "Smart Mic / Array",
    protocol:     "websocket",
    capabilities: ["mic_listen","mic_stop"],
    defaultPort:  9003,
    setupHint:    "Browser microphone or external mic via NodeOS agent.",
  },
  {
    category:     "gaming",
    icon:         "🎮",
    label:        "Gaming Console",
    protocol:     "websocket",
    capabilities: ["power_on","power_off","nav_up","nav_down","nav_left","nav_right","nav_select","nav_back","nav_home","launch_app","screenshot","record_clip","gamepad_input"],
    defaultPort:  9295,
    setupHint:    "PS5: enable Remote Play. Xbox: enable remote features. Switch: use local IP bridge.",
  },
  {
    category:     "watch",
    icon:         "⌚",
    label:        "Smartwatch",
    protocol:     "bluetooth",
    capabilities: ["read_health","read_location","push_notification","tts_speak"],
    setupHint:    "Pair via Bluetooth — your watch will auto-sync health data and receive notifications.",
  },
  {
    category:     "smart_light",
    icon:         "💡",
    label:        "Smart Light",
    protocol:     "http_rest",
    capabilities: ["light_on","light_off","light_dim","light_color","power_on","power_off"],
    defaultPort:  80,
    setupHint:    "Philips Hue: enter bridge IP. LIFX: enter bulb IP. Govee / Yeelight: use LAN API.",
  },
  {
    category:     "smart_plug",
    icon:         "🔌",
    label:        "Smart Plug / Outlet",
    protocol:     "http_rest",
    capabilities: ["plug_on","plug_off","plug_energy_read","power_on","power_off"],
    defaultPort:  80,
    setupHint:    "Shelly: enter device IP. TP-Link Kasa: enter token. Tasmota: enter device IP.",
  },
  {
    category:     "thermostat",
    icon:         "🌡️",
    label:        "Smart Thermostat",
    protocol:     "http_rest",
    capabilities: ["thermostat_set","thermostat_read","read_sensor"],
    setupHint:    "Nest: OAuth via Google. ecobee: enter API key. Honeywell: enter credentials.",
  },
  {
    category:     "speaker",
    icon:         "🔊",
    label:        "Smart Speaker",
    protocol:     "alexa_skill",
    capabilities: ["tts_speak","volume","play","pause","next","prev","push_notification"],
    setupHint:    "Connect Amazon Alexa or Google Home via the Connections page first.",
  },
  {
    category:     "vr_headset",
    icon:         "🥽",
    label:        "VR Headset",
    protocol:     "websocket",
    capabilities: ["nav_home","launch_app","gamepad_input","camera_stream","read_sensor"],
    defaultPort:  9004,
    setupHint:    "Meta Quest: enable developer mode + install NodeOS Companion. Vision Pro: AirPlay bridge.",
  },
  {
    category:     "streaming",
    icon:         "📡",
    label:        "Streaming Stick",
    protocol:     "cast",
    capabilities: ["cast_receive","play","pause","stop","volume","launch_app","nav_up","nav_down","nav_left","nav_right","nav_select","nav_back","nav_home"],
    setupHint:    "Chromecast: auto-discovered on local network. Roku: enter device IP. Fire TV: enable ADB.",
  },
  {
    category:     "lock",
    icon:         "🔒",
    label:        "Smart Lock",
    protocol:     "http_rest",
    capabilities: ["lock","unlock","door_status"],
    setupHint:    "August/Schlage/Yale: enter API key from manufacturer app.",
  },
  {
    category:     "iot_sensor",
    icon:         "📟",
    label:        "IoT Sensor",
    protocol:     "mqtt",
    capabilities: ["read_sensor"],
    setupHint:    "Enter MQTT broker address and topic for your sensor.",
  },
  {
    category:     "car",
    icon:         "🚗",
    label:        "Car / Vehicle",
    protocol:     "http_rest",
    capabilities: ["read_sensor","read_location","push_notification"],
    setupHint:    "Tesla API / OBD-II dongle / Android Auto bridge.",
  },
];

// ── Helper: get AI tool descriptions for system prompt ───────────────────────

export function getDeviceTools(ownerId: string): string[] {
  return listHubDevices(ownerId)
    .filter((d) => d.status === "online" || d.status === "idle")
    .map((d) => {
      const caps = d.capabilities.slice(0, 6).join(", ");
      return `[DEVICE:${d.category.toUpperCase()}:${d.label}] capabilities: ${caps}`;
    });
}
