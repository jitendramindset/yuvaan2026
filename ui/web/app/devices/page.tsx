"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Tv, Monitor, Smartphone, Camera, Mic, Gamepad2, Watch, Lightbulb,
  Plug, Thermometer, Speaker, Glasses, Radio, Lock, Cpu, Car,
  Wifi, WifiOff, PlusCircle, Trash2, Send, RefreshCw, Zap,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Circle,
  Home, RotateCcw, Menu, Volume2, VolumeX, Play, Pause, Square,
  SkipForward, SkipBack, Maximize2, Power, Settings2, Search,
  ToggleLeft, Thermometer as ThermoIcon, Eye, X, Check, Loader2,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type DeviceCategory =
  | "tv" | "pc" | "mobile" | "camera" | "microphone" | "gaming"
  | "watch" | "iot_sensor" | "smart_light" | "smart_plug" | "thermostat"
  | "speaker" | "vr_headset" | "streaming" | "robot" | "lock"
  | "display" | "car" | "wearable" | "custom";

type DeviceStatus = "online" | "offline" | "idle" | "busy" | "pairing" | "error" | "sleeping";

interface DeviceState {
  power?: "on" | "off" | "standby";
  volume?: number;
  muted?: boolean;
  playing?: boolean;
  brightness?: number;
  color_hex?: string;
  temperature?: number;
  humidity?: number;
  locked?: boolean;
  switch_on?: boolean;
  battery?: number;
  heart_rate?: number;
  cpu_usage?: number;
  current_app?: string;
  [k: string]: unknown;
}

interface HubDevice {
  device_id: string;
  category: DeviceCategory;
  label: string;
  model?: string;
  icon: string;
  protocol: string;
  address?: string;
  status: DeviceStatus;
  capabilities: string[];
  state: DeviceState;
  room?: string;
  last_seen?: string;
}

interface Preset {
  category: DeviceCategory;
  icon: string;
  label: string;
  protocol: string;
  capabilities: string[];
  defaultPort?: number;
  setupHint: string;
}

// ── Category metadata ──────────────────────────────────────────────────────────

const CAT_ICON: Record<string, React.ElementType> = {
  tv: Tv, pc: Monitor, mobile: Smartphone, camera: Camera, microphone: Mic,
  gaming: Gamepad2, watch: Watch, iot_sensor: Cpu, smart_light: Lightbulb,
  smart_plug: Plug, thermostat: Thermometer, speaker: Speaker,
  vr_headset: Glasses, streaming: Radio, lock: Lock, car: Car, custom: Settings2,
};

const STATUS_COLOR: Record<DeviceStatus, string> = {
  online:  "bg-green-400",
  idle:    "bg-yellow-400",
  busy:    "bg-blue-400",
  pairing: "bg-purple-400",
  error:   "bg-red-400",
  sleeping:"bg-gray-400",
  offline: "bg-gray-600",
};

const OWNER = "user.default";
const API   = "/api/backend/hub";

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

// ── Remote-control panel (per device) ─────────────────────────────────────────

function RemotePanel({ device, onClose }: { device: HubDevice; onClose: () => void }) {
  const [vol, setVol]     = useState(device.state.volume ?? 50);
  const [sending, send]   = useState("");

  const cmd = useCallback(async (capability: string, params?: Record<string, unknown>) => {
    send(capability);
    try {
      await api(`/devices/${OWNER}/${device.device_id}/command`, {
        method: "POST",
        body: JSON.stringify({ capability, params }),
      });
    } catch { /* show error later */ }
    setTimeout(() => send(""), 600);
  }, [device.device_id]);

  const has = (cap: string) => device.capabilities.includes(cap);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-[var(--muted)] hover:text-[var(--text)]"><X size={16}/></button>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{device.icon}</span>
          <div>
            <p className="font-semibold text-[var(--text)]">{device.label}</p>
            <p className="text-xs text-[var(--muted)]">{device.model ?? device.category}</p>
          </div>
          <span className={`ml-auto w-2.5 h-2.5 rounded-full ${STATUS_COLOR[device.status]}`}/>
        </div>

        {/* Power */}
        {(has("power_on") || has("power_off")) && (
          <div className="flex justify-center gap-3 mb-4">
            <button onClick={() => cmd("power_on")}  className={`p-2 rounded-full bg-green-500/20 hover:bg-green-500/40 ${sending==="power_on"?"opacity-50 animate-pulse":""}`}><Power size={18} className="text-green-400"/></button>
            <button onClick={() => cmd("power_off")} className={`p-2 rounded-full bg-red-500/20   hover:bg-red-500/40   ${sending==="power_off"?"opacity-50 animate-pulse":""}`}><Power size={18} className="text-red-400"/></button>
          </div>
        )}

        {/* Media controls */}
        {(has("play")||has("pause")||has("stop")) && (
          <div className="flex justify-center gap-3 mb-4">
            {has("prev")     && <button onClick={() => cmd("prev")}     className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--border)]"><SkipBack    size={16}/></button>}
            {has("play")     && <button onClick={() => cmd("play")}     className={`p-2 rounded-full bg-[var(--accent)]/20 hover:bg-[var(--accent)]/40 ${sending==="play"?"animate-pulse":""}`}><Play       size={16} className="text-[var(--accent)]"/></button>}
            {has("pause")    && <button onClick={() => cmd("pause")}    className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--border)]"><Pause       size={16}/></button>}
            {has("stop")     && <button onClick={() => cmd("stop")}     className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--border)]"><Square      size={16}/></button>}
            {has("next")     && <button onClick={() => cmd("next")}     className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--border)]"><SkipForward size={16}/></button>}
            {has("fullscreen")&&<button onClick={() => cmd("fullscreen")} className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--border)]"><Maximize2 size={16}/></button>}
          </div>
        )}

        {/* Volume */}
        {has("volume") && (
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => { const v = Math.max(0, vol-10); setVol(v); cmd("volume", {level: v}); }} className="p-1 rounded hover:bg-[var(--border)]"><VolumeX size={14}/></button>
            <input type="range" min={0} max={100} value={vol} onChange={(e) => { setVol(+e.target.value); cmd("volume", {level: +e.target.value}); }} className="flex-1 accent-[var(--accent)]"/>
            <button onClick={() => { const v = Math.min(100, vol+10); setVol(v); cmd("volume", {level: v}); }} className="p-1 rounded hover:bg-[var(--border)]"><Volume2 size={14}/></button>
            <span className="text-xs w-8 text-[var(--muted)]">{vol}%</span>
          </div>
        )}

        {/* Navigation D-pad */}
        {has("nav_up") && (
          <div className="grid grid-cols-3 gap-1 w-28 mx-auto mb-4">
            <div/>
            <button onClick={() => cmd("nav_up")}     className="p-1.5 rounded bg-[var(--bg)] hover:bg-[var(--border)] flex justify-center"><ChevronUp    size={14}/></button>
            <div/>
            <button onClick={() => cmd("nav_left")}   className="p-1.5 rounded bg-[var(--bg)] hover:bg-[var(--border)] flex justify-center"><ChevronLeft  size={14}/></button>
            <button onClick={() => cmd("nav_select")} className="p-1.5 rounded bg-[var(--accent)]/30 flex justify-center"><Circle size={10} className="text-[var(--accent)]"/></button>
            <button onClick={() => cmd("nav_right")}  className="p-1.5 rounded bg-[var(--bg)] hover:bg-[var(--border)] flex justify-center"><ChevronRight size={14}/></button>
            <div/>
            <button onClick={() => cmd("nav_down")}   className="p-1.5 rounded bg-[var(--bg)] hover:bg-[var(--border)] flex justify-center"><ChevronDown  size={14}/></button>
            <div/>
          </div>
        )}

        {/* Nav shortcuts */}
        {(has("nav_home")||has("nav_back")||has("nav_menu")) && (
          <div className="flex justify-center gap-2 mb-4">
            {has("nav_back")  && <button onClick={() => cmd("nav_back")}  className="px-3 py-1 rounded text-xs bg-[var(--bg)] hover:bg-[var(--border)]">Back</button>}
            {has("nav_home")  && <button onClick={() => cmd("nav_home")}  className="px-3 py-1 rounded text-xs bg-[var(--bg)] hover:bg-[var(--border)]"><Home size={12}/></button>}
            {has("nav_menu")  && <button onClick={() => cmd("nav_menu")}  className="px-3 py-1 rounded text-xs bg-[var(--bg)] hover:bg-[var(--border)]"><Menu size={12}/></button>}
          </div>
        )}

        {/* Smart light */}
        {has("light_on") && (
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-yellow-400"/>
            <button onClick={() => cmd("light_on")}  className="px-3 py-1 rounded text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300">On</button>
            <button onClick={() => cmd("light_off")} className="px-3 py-1 rounded text-xs bg-gray-500/20  hover:bg-gray-500/40">Off</button>
            <input type="color" defaultValue={device.state.color_hex ?? "#ffffff"} onChange={(e) => cmd("light_color", {color: e.target.value})} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"/>
          </div>
        )}

        {/* Lock */}
        {has("lock") && (
          <div className="flex justify-center gap-3 mb-3">
            <button onClick={() => cmd("lock")}   className="px-4 py-1.5 rounded-lg text-sm bg-red-500/20   hover:bg-red-500/40   text-red-300 flex items-center gap-1"><Lock     size={12}/> Lock</button>
            <button onClick={() => cmd("unlock")} className="px-4 py-1.5 rounded-lg text-sm bg-green-500/20 hover:bg-green-500/40 text-green-300 flex items-center gap-1"><Eye      size={12}/> Unlock</button>
          </div>
        )}

        {/* Smart plug */}
        {has("plug_on") && (
          <div className="flex justify-center gap-3 mb-3">
            <button onClick={() => cmd("plug_on")}  className="px-4 py-1.5 rounded-lg text-sm bg-green-500/20 hover:bg-green-500/40 text-green-300">Turn On</button>
            <button onClick={() => cmd("plug_off")} className="px-4 py-1.5 rounded-lg text-sm bg-red-500/20   hover:bg-red-500/40   text-red-300">Turn Off</button>
          </div>
        )}

        {/* PC keyboard shortcut */}
        {has("keyboard") && (
          <div className="flex gap-2 mb-3">
            <input id="kbInput" type="text" placeholder="Type to send keystroke…" className="flex-1 text-xs bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1"/>
            <button onClick={() => { const v = (document.getElementById("kbInput") as HTMLInputElement).value; cmd("keyboard", {keys: v}); }} className="px-2 py-1 rounded bg-[var(--accent)]/20 text-[var(--accent)] text-xs">Send</button>
          </div>
        )}

        {/* TTS */}
        {has("tts_speak") && (
          <div className="flex gap-2">
            <input id="ttsInput" type="text" placeholder="Say something…" className="flex-1 text-xs bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1"/>
            <button onClick={() => { const v = (document.getElementById("ttsInput") as HTMLInputElement).value; cmd("tts_speak", {text: v}); }} className="px-2 py-1 rounded bg-[var(--accent)]/20 text-[var(--accent)] text-xs flex items-center gap-1"><Send size={12}/>Speak</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add-device modal ──────────────────────────────────────────────────────────

function AddDeviceModal({ presets, onAdd, onClose }: { presets: Preset[]; onAdd: (d: Omit<HubDevice,"device_id">) => void; onClose: () => void }) {
  const [step, setStep]       = useState<"pick"|"config">("pick");
  const [preset, setPreset]   = useState<Preset | null>(null);
  const [label, setLabel]     = useState("");
  const [address, setAddress] = useState("");
  const [room, setRoom]       = useState("");
  const [apiKey, setApiKey]   = useState("");
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{reachable?: boolean; model?: string} | null>(null);

  const probe = async () => {
    if (!address) return;
    setProbing(true);
    try {
      const r = await api<{reachable: boolean; model?: string}>(`/probe`, {
        method: "POST",
        body: JSON.stringify({ address, protocol: preset?.protocol }),
      });
      setProbeResult(r);
    } catch { setProbeResult({ reachable: false }); }
    setProbing(false);
  };

  const submit = () => {
    if (!preset) return;
    onAdd({
      owner_id:     OWNER,
      category:     preset.category,
      label:        label || preset.label,
      model:        probeResult?.model,
      icon:         preset.icon,
      protocol:     preset.protocol,
      address:      address || undefined,
      api_key:      apiKey || undefined,
      room:         room   || undefined,
      capabilities: preset.capabilities,
      status:       "offline",
      state:        {},
    } as never);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text)]">{step === "pick" ? "Add Device" : `Configure: ${preset?.label}`}</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]"><X size={16}/></button>
        </div>

        {step === "pick" && (
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button key={p.category} onClick={() => { setPreset(p); setStep("config"); }} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--accent)]/10 border border-[var(--border)] hover:border-[var(--accent)] transition-all">
                <span className="text-2xl">{p.icon}</span>
                <span className="text-xs text-[var(--text)] text-center leading-tight">{p.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === "config" && preset && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)] bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">{preset.setupHint}</p>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Device Name</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={preset.label} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"/>
            </div>
            {preset.protocol !== "bluetooth" && (
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">IP Address / URL</label>
                <div className="flex gap-2">
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={`192.168.1.x${preset.defaultPort ? `:${preset.defaultPort}` : ""}`} className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"/>
                  <button onClick={probe} disabled={probing || !address} className="px-3 py-2 rounded-lg text-xs bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/40 disabled:opacity-40 flex items-center gap-1">
                    {probing ? <Loader2 size={12} className="animate-spin"/> : <Search size={12}/>} Probe
                  </button>
                </div>
                {probeResult && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${probeResult.reachable ? "text-green-400" : "text-red-400"}`}>
                    {probeResult.reachable ? <Check size={12}/> : <X size={12}/>}
                    {probeResult.reachable ? `Reachable${probeResult.model ? ` — ${probeResult.model}` : ""}` : "Not reachable"}
                  </p>
                )}
              </div>
            )}
            {preset.protocol !== "bluetooth" && (
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">API Key / Token (optional)</label>
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="sk-…" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"/>
              </div>
            )}
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Room (optional)</label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Living Room" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"/>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep("pick")} className="flex-1 py-2 rounded-lg text-sm bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--border)]">Back</button>
              <button onClick={submit} className="flex-1 py-2 rounded-lg text-sm bg-[var(--accent)] text-white hover:opacity-90">Add Device</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Device Card ───────────────────────────────────────────────────────────────

function DeviceCard({ device, onControl, onRemove }: { device: HubDevice; onControl: () => void; onRemove: () => void }) {
  const Icon   = CAT_ICON[device.category] ?? Cpu;
  const online = device.status === "online" || device.status === "idle";

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 hover:border-[var(--accent)]/50 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{device.icon}</span>
          <div>
            <p className="font-medium text-sm text-[var(--text)] leading-tight">{device.label}</p>
            {device.model && <p className="text-xs text-[var(--muted)]">{device.model}</p>}
            {device.room  && <p className="text-xs text-[var(--muted)]">{device.room}</p>}
          </div>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full mt-1 ${STATUS_COLOR[device.status]}`}/>
      </div>

      {/* State preview */}
      <div className="text-xs text-[var(--muted)] space-y-0.5">
        {device.state.power       !== undefined && <p>Power: <span className="text-[var(--text)]">{device.state.power}</span></p>}
        {device.state.volume      !== undefined && <p>Volume: <span className="text-[var(--text)]">{device.state.volume}%</span></p>}
        {device.state.brightness  !== undefined && <p>Brightness: <span className="text-[var(--text)]">{device.state.brightness}%</span></p>}
        {device.state.temperature !== undefined && <p>Temp: <span className="text-[var(--text)]">{device.state.temperature}°C</span></p>}
        {device.state.switch_on   !== undefined && <p>Switch: <span className={device.state.switch_on ? "text-green-400" : "text-[var(--muted)]"}>{device.state.switch_on ? "ON" : "OFF"}</span></p>}
        {device.state.locked      !== undefined && <p>Lock: <span className={device.state.locked ? "text-red-400" : "text-green-400"}>{device.state.locked ? "Locked" : "Unlocked"}</span></p>}
        {device.state.battery     !== undefined && <p>Battery: <span className="text-[var(--text)]">{device.state.battery}%</span></p>}
        {device.state.heart_rate  !== undefined && <p>HR: <span className="text-[var(--text)]">{device.state.heart_rate} bpm</span></p>}
        {device.state.current_app && <p>App: <span className="text-[var(--text)] truncate">{device.state.current_app}</span></p>}
        {!online && <p className="text-[var(--muted)] italic">Offline — last seen: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : "never"}</p>}
      </div>

      {/* Capabilities chips */}
      <div className="flex flex-wrap gap-1">
        {device.capabilities.slice(0, 4).map((c) => (
          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--muted)]">{c.replace(/_/g," ")}</span>
        ))}
        {device.capabilities.length > 4 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--muted)]">+{device.capabilities.length - 4}</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button onClick={onControl} className="flex-1 py-1.5 rounded-lg text-xs bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/40 flex items-center justify-center gap-1">
          <Zap size={12}/> Control
        </button>
        <button onClick={onRemove} className="p-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DevicesPage() {
  const [devices,  setDevices]  = useState<HubDevice[]>([]);
  const [presets,  setPresets]  = useState<Preset[]>([]);
  const [controlled, setControlled] = useState<HubDevice | null>(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [filter,   setFilter]   = useState<string>("all");
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);

  // Load presets + devices
  useEffect(() => {
    Promise.all([
      api<{ presets: Preset[] }>("/presets").then((r) => setPresets(r.presets)),
      api<{ devices: HubDevice[] }>(`/devices/${OWNER}`).then((r) => setDevices(r.devices)),
    ]).finally(() => setLoading(false));
  }, []);

  // Demo: add sample devices for first-time visitors
  useEffect(() => {
    if (!loading && devices.length === 0) {
      const demo: HubDevice[] = [
        { device_id:"demo-tv",  category:"tv",          icon:"📺", label:"Living Room TV",  model:"Samsung QN90B",   protocol:"websocket",  capabilities:["power_on","power_off","volume","mute","nav_up","nav_down","play","pause","launch_app"], status:"idle",    state:{ power:"on", volume:40, current_app:"Netflix" }, room:"Living Room", last_seen: new Date().toISOString() },
        { device_id:"demo-pc",  category:"pc",          icon:"🖥️", label:"Office PC",       model:"Windows 11",      protocol:"websocket",  capabilities:["keyboard","mouse","open_url","screenshot","power_off","sleep"],                         status:"online",  state:{ cpu_usage:32, power:"on" },                      room:"Office",       last_seen: new Date().toISOString() },
        { device_id:"demo-mob", category:"mobile",      icon:"📱", label:"My Phone",        model:"Pixel 9 Pro",     protocol:"websocket",  capabilities:["push_notification","tts_speak","camera_stream","read_location","read_health"],          status:"online",  state:{ battery:78, heart_rate:72 },                     room:"Pocket",       last_seen: new Date().toISOString() },
        { device_id:"demo-lt",  category:"smart_light", icon:"💡", label:"Hue Lamp",        model:"Philips Hue",     protocol:"http_rest",  capabilities:["light_on","light_off","light_dim","light_color"],                                       status:"online",  state:{ switch_on:true, brightness:70, color_hex:"#ffd6a0" }, room:"Bedroom",   last_seen: new Date().toISOString() },
        { device_id:"demo-gm",  category:"gaming",      icon:"🎮", label:"PlayStation 5",   model:"PS5",             protocol:"websocket",  capabilities:["power_on","power_off","launch_app","nav_home","screenshot","gamepad_input"],             status:"idle",    state:{ power:"standby" },                               room:"Living Room", last_seen: new Date().toISOString() },
        { device_id:"demo-wch", category:"watch",       icon:"⌚", label:"Apple Watch",     model:"Series 10",       protocol:"bluetooth",  capabilities:["read_health","read_location","push_notification","tts_speak"],                          status:"online",  state:{ battery:91, heart_rate:68, steps:4200 },        room:"Wrist",        last_seen: new Date().toISOString() },
        { device_id:"demo-tk",  category:"thermostat",  icon:"🌡️", label:"Nest Thermostat", model:"Google Nest 3rd", protocol:"http_rest",  capabilities:["thermostat_set","thermostat_read","read_sensor"],                                       status:"online",  state:{ temperature:22.5, humidity:48 },                 room:"Hallway",      last_seen: new Date().toISOString() },
        { device_id:"demo-lk",  category:"lock",        icon:"🔒", label:"Front Door",      model:"August Smart Lock",protocol:"http_rest", capabilities:["lock","unlock","door_status"],                                                          status:"online",  state:{ locked:true },                                   room:"Entrance",     last_seen: new Date().toISOString() },
      ];
      setDevices(demo);
    }
  }, [loading, devices.length]);

  const categories = ["all", ...Array.from(new Set(devices.map((d) => d.category)))];

  const filtered = devices.filter((d) => {
    const matchCat  = filter === "all" || d.category === filter;
    const matchSearch = !search || d.label.toLowerCase().includes(search.toLowerCase()) || d.room?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const rooms = Array.from(new Set(devices.map((d) => d.room).filter(Boolean)));

  const addDevice = async (d: Omit<HubDevice, "device_id">) => {
    try {
      const r = await api<{ device: HubDevice }>(`/devices/${OWNER}`, { method: "POST", body: JSON.stringify(d) });
      setDevices((prev) => [...prev, r.device]);
    } catch {
      // Optimistic add with temp ID
      setDevices((prev) => [...prev, { ...d, device_id: `temp-${Date.now()}` } as HubDevice]);
    }
  };

  const removeDevice = async (id: string) => {
    setDevices((prev) => prev.filter((d) => d.device_id !== id));
    try { await api(`/devices/${OWNER}/${id}`, { method: "DELETE" }); } catch { /**/ }
  };

  const onlineCount = devices.filter((d) => d.status === "online" || d.status === "idle").length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wifi size={20} className="text-[var(--accent)]"/>
            <h1 className="text-lg font-semibold">Device Hub</h1>
            <span className="text-xs text-[var(--muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--border)]">{onlineCount}/{devices.length} online</span>
          </div>
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search devices, rooms…" className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"/>
          </div>
          <button onClick={() => setShowAdd(true)} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm hover:opacity-90">
            <PlusCircle size={14}/> Add Device
          </button>
          <Link href="/dashboard" className="text-[var(--muted)] hover:text-[var(--text)] text-sm">← Dashboard</Link>
        </div>

        {/* Category filter tabs */}
        <div className="max-w-7xl mx-auto px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-all ${filter === cat ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]"}`}>
              {cat === "all" ? "All" : cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-[var(--muted)]">
            <Loader2 size={24} className="animate-spin mr-2"/> Loading devices…
          </div>
        )}

        {!loading && devices.length === 0 && (
          <div className="text-center py-20">
            <WifiOff size={48} className="mx-auto text-[var(--muted)] mb-4"/>
            <p className="text-[var(--muted)] mb-4">No devices connected yet</p>
            <button onClick={() => setShowAdd(true)} className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90">Add Your First Device</button>
          </div>
        )}

        {/* By room */}
        {filter === "all" && rooms.length > 0 && !search ? (
          rooms.map((room) => (
            <div key={room} className="mb-8">
              <h2 className="text-sm font-medium text-[var(--muted)] mb-3 uppercase tracking-wide">{room}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {devices.filter((d) => d.room === room && (filter === "all" || d.category === filter)).map((d) => (
                  <DeviceCard key={d.device_id} device={d} onControl={() => setControlled(d)} onRemove={() => removeDevice(d.device_id)}/>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((d) => (
              <DeviceCard key={d.device_id} device={d} onControl={() => setControlled(d)} onRemove={() => removeDevice(d.device_id)}/>
            ))}
          </div>
        )}

        {/* Protocol legend */}
        <div className="mt-10 border-t border-[var(--border)] pt-6">
          <h3 className="text-xs text-[var(--muted)] uppercase tracking-wide mb-3">Supported Protocols</h3>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            {["WebSocket (real-time)","HTTP REST","MQTT (IoT)","WebRTC (camera/mic)","Bluetooth / BLE","RTSP (camera streams)","Chromecast","Alexa Skill","Google Home","Samsung Tizen","LG WebOS","HDMI-CEC","Wake-on-LAN","mDNS Discovery"].map((p) => (
              <span key={p} className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">{p}</span>
            ))}
          </div>
        </div>

        {/* WebSocket setup guide */}
        <div className="mt-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2"><Zap size={14} className="text-[var(--accent)]"/> Real-time Device Connection</h3>
          <p className="text-xs text-[var(--muted)] mb-2">Devices connect via WebSocket to: <code className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--accent)]">ws://your-server:3000/hub/ws/&#123;deviceId&#125;</code></p>
          <p className="text-xs text-[var(--muted)]">Once connected, the AI can control your device via voice: <span className="italic">"Turn on the TV", "Dim the bedroom lights to 40%", "Lock the front door"</span></p>
        </div>
      </div>

      {/* Modals */}
      {controlled && <RemotePanel device={controlled} onClose={() => setControlled(null)}/>}
      {showAdd     && <AddDeviceModal presets={presets} onAdd={addDevice} onClose={() => setShowAdd(false)}/>}
    </div>
  );
}
