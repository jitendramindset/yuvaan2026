"use client";
/**
 * DevicesScreenContent — Universal Device Hub UI
 *
 * Shows all connected devices (TV, PC, mobile, gaming, watch, IoT, VR…)
 * and lets the user add, control, and monitor them in real time.
 */

import { useState, useEffect } from "react";
import {
  Plus, X, Loader, Power, Volume2, VolumeX, Play,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Wifi, WifiOff, Settings, Zap,
} from "lucide-react";

interface Device {
  device_id:    string;
  label:        string;
  category:     string;
  icon:         string;
  status:       string;
  capabilities: string[];
  room?:        string;
  model?:       string;
  state:        {
    power?: string; volume?: number; muted?: boolean;
    brightness?: number; temperature?: number; battery?: number;
    playing?: boolean; current_app?: string;
    [k: string]: unknown;
  };
}

interface Preset {
  category:            string;
  label:               string;
  icon:                string;
  desc:                string;
  defaultCapabilities: string[];
}

const OWNER = "user.default";
const BASE  = "/api/backend";

const CAT_COLOR: Record<string, string> = {
  tv:         "#6c63ff", pc:       "#3b82f6", mobile: "#22c55e",
  gaming:     "#ec4899", watch:    "#f59e0b", smart_light: "#fbbf24",
  thermostat: "#ef4444", speaker:  "#8b5cf6", vr_headset:  "#00d2ff",
  camera:     "#94a3b8", iot_sensor: "#10b981",
};

function statusColor(s: string): string {
  if (s === "online")    return "#22c55e";
  if (s === "idle")      return "#f59e0b";
  if (s === "sleeping")  return "#94a3b8";
  if (s === "error")     return "#ef4444";
  return "#94a3b8";
}

export function DevicesScreenContent() {
  const [devices,  setDevices]  = useState<Device[]>([]);
  const [presets,  setPresets]  = useState<Preset[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);
  const [cmdSending, setCmdSending] = useState<string | null>(null);

  const [form, setForm] = useState({
    category: "tv", label: "", model: "", address: "", room: "",
    api_key: "", protocol: "websocket", icon: "📺",
  });

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([
        fetch(`${BASE}/hub/devices/${OWNER}`),
        fetch(`${BASE}/hub/presets`),
      ]);
      if (dRes.ok) { const d = await dRes.json() as { devices?: Device[] }; setDevices(d.devices ?? []); }
      if (pRes.ok) { const d = await pRes.json() as { presets?: Preset[] }; setPresets(d.presets ?? []); }
    } catch { /* offline */ }
    setLoading(false);
  }

  async function addDevice() {
    if (!form.label.trim()) return;
    try {
      const res = await fetch(`${BASE}/hub/devices/${OWNER}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category:  form.category,
          label:     form.label,
          model:     form.model || undefined,
          address:   form.address || undefined,
          room:      form.room || undefined,
          api_key:   form.api_key || undefined,
          protocol:  form.protocol,
          icon:      form.icon,
          capabilities: presets.find((p) => p.category === form.category)?.defaultCapabilities ?? [],
        }),
      });
      if (res.ok) {
        const d = await res.json() as { device?: Device };
        if (d.device) setDevices((p) => [d.device!, ...p]);
        setAdding(false);
      }
    } catch { /* ignore */ }
  }

  async function sendCmd(deviceId: string, capability: string, params: Record<string, unknown> = {}) {
    setCmdSending(`${deviceId}-${capability}`);
    try {
      const res = await fetch(`${BASE}/hub/devices/${OWNER}/${deviceId}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capability, params }),
      });
      if (res.ok) {
        // Optimistically update state
        setDevices((p) => p.map((d) => {
          if (d.device_id !== deviceId) return d;
          if (capability === "power_on")  return { ...d, state: { ...d.state, power: "on" } };
          if (capability === "power_off") return { ...d, state: { ...d.state, power: "off" } };
          if (capability === "mute")      return { ...d, state: { ...d.state, muted: !d.state.muted } };
          if (capability === "volume" && typeof params["value"] === "number")
            return { ...d, state: { ...d.state, volume: params["value"] as number } };
          if (capability === "light_on")  return { ...d, state: { ...d.state, power: "on" } };
          if (capability === "light_off") return { ...d, state: { ...d.state, power: "off" } };
          return d;
        }));
        if (selected?.device_id === deviceId) {
          setSelected((p) => p ? { ...p, state: { ...p.state } } : null);
        }
      }
    } catch { /* ignore */ }
    setCmdSending(null);
  }

  async function removeDevice(id: string) {
    try {
      await fetch(`${BASE}/hub/devices/${OWNER}/${id}`, { method: "DELETE" });
      setDevices((p) => p.filter((d) => d.device_id !== id));
      if (selected?.device_id === id) setSelected(null);
    } catch { /* ignore */ }
  }

  function applyPreset(p: Preset) {
    setForm((f) => ({ ...f, category: p.category, label: p.label, icon: p.icon }));
    setAdding(true);
  }

  const hasCapability = (d: Device, cap: string) => d.capabilities.includes(cap);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: device grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>📡</span> Device Hub
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Control every device — TV, PC, gaming, IoT, VR, smart home
            </p>
          </div>
          <button onClick={() => setAdding((v) => !v)}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <Plus size={12} /> Add Device
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Add Device</span>
              <button onClick={() => setAdding(false)}><X size={14} style={{ color: "var(--muted)" }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Icon</label>
                <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="input w-14 text-center text-xl" maxLength={2} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input w-full">
                  {["tv","pc","mobile","gaming","watch","camera","microphone","iot_sensor","smart_light","smart_plug","thermostat","speaker","vr_headset","streaming","robot","lock","car","wearable","custom"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Label *</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Living Room TV" className="input w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>IP / Address</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="192.168.1.100" className="input w-full" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Room</label>
                <input value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="Living Room" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Protocol</label>
              <select value={form.protocol} onChange={(e) => setForm((f) => ({ ...f, protocol: e.target.value }))} className="input w-full">
                {["websocket","http_rest","mqtt","bluetooth","cast","samsung_tizen","lg_webos","android_tv","homekit","wol"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="btn btn-secondary text-xs py-1.5 px-3">Cancel</button>
              <button onClick={addDevice} className="btn btn-primary text-xs py-1.5 px-3">Add Device</button>
            </div>
          </div>
        )}

        {/* Presets */}
        {!adding && presets.length > 0 && devices.length === 0 && (
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>QUICK ADD</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.slice(0, 9).map((p) => (
                <button key={p.category} onClick={() => applyPreset(p)}
                  className="rounded-xl p-3 text-left"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="text-2xl">{p.icon}</div>
                  <div className="text-xs font-semibold mt-1">{p.label}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Device grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={24} className="animate-spin" style={{ color: "var(--muted)" }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {devices.map((d) => (
              <button key={d.device_id}
                onClick={() => setSelected(d === selected ? null : d)}
                className="rounded-2xl p-4 text-left transition-all"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${selected?.device_id === d.device_id ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-1">
                  <span className="text-3xl">{d.icon}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${statusColor(d.status)}22`, color: statusColor(d.status) }}>
                    ● {d.status}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-semibold truncate">{d.label}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{d.category}{d.room ? ` · ${d.room}` : ""}</div>
                </div>
                {/* Quick state */}
                {d.state.power && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs"
                    style={{ color: d.state.power === "on" ? "#22c55e" : "var(--muted)" }}>
                    <Power size={10} />
                    <span className="capitalize">{d.state.power}</span>
                    {typeof d.state.volume === "number" && (
                      <span className="ml-2">🔊 {d.state.volume}%</span>
                    )}
                    {typeof d.state.battery === "number" && (
                      <span className="ml-2">🔋 {d.state.battery}%</span>
                    )}
                  </div>
                )}
                {/* Quick actions */}
                <div className="mt-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {hasCapability(d, "power_on") && (
                    <button onClick={() => sendCmd(d.device_id, d.state.power === "on" ? "power_off" : "power_on")}
                      disabled={cmdSending === `${d.device_id}-${d.state.power === "on" ? "power_off" : "power_on"}`}
                      className="p-1.5 rounded-lg text-xs"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                      title="Power">
                      <Power size={12} style={{ color: d.state.power === "on" ? "#22c55e" : "var(--muted)" }} />
                    </button>
                  )}
                  {hasCapability(d, "light_on") && (
                    <button onClick={() => sendCmd(d.device_id, d.state.power === "on" ? "light_off" : "light_on")}
                      className="p-1.5 rounded-lg text-xs"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                      title="Light">
                      <Zap size={12} style={{ color: d.state.power === "on" ? "#fbbf24" : "var(--muted)" }} />
                    </button>
                  )}
                  {hasCapability(d, "mute") && (
                    <button onClick={() => sendCmd(d.device_id, "mute")}
                      className="p-1.5 rounded-lg"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      {d.state.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: selected device controller */}
      {selected && (
        <div className="w-72 shrink-0 border-l overflow-y-auto p-4 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span>{selected.icon}</span> {selected.label}
            </h3>
            <button onClick={() => setSelected(null)}><X size={14} style={{ color: "var(--muted)" }} /></button>
          </div>

          {selected.model && (
            <div className="text-xs" style={{ color: "var(--muted)" }}>{selected.model}</div>
          )}

          {/* Remote control for TV/streaming */}
          {(hasCapability(selected, "nav_up") || hasCapability(selected, "play")) && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>REMOTE</div>
              <div className="space-y-2">
                {/* D-Pad */}
                <div className="grid grid-cols-3 gap-1 w-28 mx-auto">
                  <div />
                  <button onClick={() => sendCmd(selected.device_id, "nav_up")}
                    className="p-2 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <ChevronUp size={14} />
                  </button>
                  <div />
                  <button onClick={() => sendCmd(selected.device_id, "nav_left")}
                    className="p-2 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => sendCmd(selected.device_id, "nav_select")}
                    className="p-2 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    OK
                  </button>
                  <button onClick={() => sendCmd(selected.device_id, "nav_right")}
                    className="p-2 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <ChevronRight size={14} />
                  </button>
                  <div />
                  <button onClick={() => sendCmd(selected.device_id, "nav_down")}
                    className="p-2 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <ChevronDown size={14} />
                  </button>
                  <div />
                </div>
                {/* Playback */}
                <div className="flex gap-2 justify-center">
                  <button onClick={() => sendCmd(selected.device_id, "prev")}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>⏮</button>
                  <button onClick={() => sendCmd(selected.device_id, selected.state.playing ? "pause" : "play")}
                    className="px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    {selected.state.playing ? "⏸" : <Play size={12} />}
                  </button>
                  <button onClick={() => sendCmd(selected.device_id, "next")}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>⏭</button>
                </div>
              </div>
            </div>
          )}

          {/* Volume */}
          {hasCapability(selected, "volume") && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>VOLUME</div>
              <div className="flex items-center gap-2">
                <button onClick={() => sendCmd(selected.device_id, "volume", { value: Math.max(0, (selected.state.volume ?? 50) - 10) })}
                  className="p-1.5 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <ChevronDown size={12} />
                </button>
                <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${selected.state.volume ?? 50}%`, background: "var(--accent)" }} />
                </div>
                <button onClick={() => sendCmd(selected.device_id, "volume", { value: Math.min(100, (selected.state.volume ?? 50) + 10) })}
                  className="p-1.5 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <ChevronUp size={12} />
                </button>
                <span className="text-xs w-8 text-right" style={{ color: "var(--muted)" }}>{selected.state.volume ?? 50}%</span>
              </div>
            </div>
          )}

          {/* Light brightness */}
          {hasCapability(selected, "light_dim") && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>BRIGHTNESS</div>
              <input type="range" min={0} max={100} value={selected.state.brightness ?? 80}
                onChange={(e) => sendCmd(selected.device_id, "light_dim", { value: Number(e.target.value) })}
                className="w-full accent-yellow-400" />
            </div>
          )}

          {/* All capabilities */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>ALL ACTIONS</div>
            <div className="flex flex-wrap gap-1">
              {selected.capabilities.map((cap) => (
                <button key={cap}
                  onClick={() => sendCmd(selected.device_id, cap)}
                  disabled={cmdSending?.startsWith(selected.device_id)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                  {cap.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Remove device */}
          <button onClick={() => removeDevice(selected.device_id)}
            className="w-full text-xs py-2 rounded-xl mt-2"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
            Remove Device
          </button>
        </div>
      )}
    </div>
  );
}
