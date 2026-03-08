"use client";
/**
 * ConnectionsScreenContent — manage all external connections.
 *
 * Integrates with: POST/GET/DELETE /api/backend/connections/user.default
 * Shows presets, add form, status grid.
 */

import { useState, useEffect } from "react";
import { Plus, X, CheckCircle, XCircle, Clock, RefreshCw, Link2, Loader } from "lucide-react";

interface Connection {
  connection_id: string;
  name:          string;
  type:          string;
  url?:          string;
  capabilities:  string[];
  status:        "connected" | "disconnected" | "error" | "pending";
  icon?:         string;
}

interface Preset {
  type: string;
  name: string;
  icon: string;
  desc: string;
  urlPlaceholder?: string;
  requiresApiKey: boolean;
  defaultCapabilities: string[];
}

const OWNER = "user.default";
const BASE  = "/api/backend";

const STATUS_COLOR: Record<string, string> = {
  connected:    "#22c55e",
  disconnected: "#94a3b8",
  error:        "#ef4444",
  pending:      "#f59e0b",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  connected:    <CheckCircle size={12} />,
  disconnected: <Clock size={12} />,
  error:        <XCircle size={12} />,
  pending:      <RefreshCw size={12} className="animate-spin" />,
};

export function ConnectionsScreenContent() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [presets,     setPresets]     = useState<Preset[]>([]);
  const [adding,      setAdding]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [testing,     setTesting]     = useState<string | null>(null);

  // Add form state
  const [form, setForm] = useState({
    type: "rest_api", name: "", url: "", api_key: "", capabilities: "", icon: "🔌",
  });

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [conRes, preRes] = await Promise.all([
        fetch(`${BASE}/connections/${OWNER}`),
        fetch(`${BASE}/connections/presets`),
      ]);
      if (conRes.ok) {
        const d = await conRes.json() as { connections?: Connection[] };
        setConnections(d.connections ?? []);
      }
      if (preRes.ok) {
        const d = await preRes.json() as { presets?: Preset[] };
        setPresets(d.presets ?? []);
      }
    } catch { /* offline mode */ }
    setLoading(false);
  }

  async function addConnection() {
    if (!form.name.trim()) return;
    try {
      const res = await fetch(`${BASE}/connections/${OWNER}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:         form.type,
          name:         form.name,
          url:          form.url || undefined,
          api_key:      form.api_key || undefined,
          capabilities: form.capabilities ? form.capabilities.split(",").map((s) => s.trim()) : [],
          icon:         form.icon,
          status:       "pending",
          owner_id:     OWNER,
        }),
      });
      if (res.ok) {
        const d = await res.json() as { connection?: Connection };
        if (d.connection) setConnections((p) => [d.connection!, ...p]);
        setAdding(false);
        setForm({ type: "rest_api", name: "", url: "", api_key: "", capabilities: "", icon: "🔌" });
      }
    } catch { /* ignore */ }
  }

  async function testConnection(id: string) {
    setTesting(id);
    try {
      const res = await fetch(`${BASE}/connections/${OWNER}/${id}/test`, { method: "POST" });
      if (res.ok) {
        const d = await res.json() as { ok?: boolean };
        setConnections((p) => p.map((c) =>
          c.connection_id === id ? { ...c, status: d.ok ? "connected" : "error" } : c,
        ));
      }
    } catch { /* ignore */ }
    setTesting(null);
  }

  async function removeConnection(id: string) {
    try {
      await fetch(`${BASE}/connections/${OWNER}/${id}`, { method: "DELETE" });
      setConnections((p) => p.filter((c) => c.connection_id !== id));
    } catch { /* ignore */ }
  }

  function applyPreset(p: Preset) {
    setForm({
      type: p.type,
      name: p.name,
      url: p.urlPlaceholder ?? "",
      api_key: "",
      capabilities: p.defaultCapabilities.join(", "),
      icon: p.icon,
    });
    setAdding(true);
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Link2 size={16} style={{ color: "var(--accent)" }} /> Connections
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            MCP servers, REST APIs, OAuth apps, devices — each becomes a tool for Yunaan
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">New Connection</span>
            <button onClick={() => setAdding(false)}><X size={14} style={{ color: "var(--muted)" }} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Icon</label>
              <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="input text-xl w-14 text-center" maxLength={2} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input w-full">
                {["rest_api","mcp","oauth","device","webhook","github","google","notion","slack","database","custom"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My GitHub" className="input w-full" />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>URL / Endpoint</label>
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://api.example.com" className="input w-full" />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>API Key / Token</label>
            <input type="password" value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
              placeholder="sk-…" className="input w-full" />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Capabilities (comma-separated)</label>
            <input value={form.capabilities} onChange={(e) => setForm((f) => ({ ...f, capabilities: e.target.value }))}
              placeholder="read_repo, create_issue, send_email" className="input w-full" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="btn btn-secondary text-xs py-1.5 px-3">Cancel</button>
            <button onClick={addConnection} className="btn btn-primary text-xs py-1.5 px-3">Connect</button>
          </div>
        </div>
      )}

      {/* Presets (shown when no connections or not adding) */}
      {!adding && presets.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>QUICK CONNECT</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {presets.map((p) => (
              <button key={p.type} onClick={() => applyPreset(p)}
                className="rounded-xl p-3 text-left transition-all"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
              >
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className="text-xs font-semibold">{p.name}</div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: "var(--muted)" }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Connected services */}
      <div>
        <div className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>
          CONNECTED SERVICES ({connections.length})
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={24} className="animate-spin" style={{ color: "var(--muted)" }} />
          </div>
        ) : connections.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
            <div className="text-3xl mb-2">🔌</div>
            <div className="text-sm font-medium">No connections yet</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Connect GitHub, Notion, REST APIs, MCP servers, and more
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connections.map((c) => (
              <div key={c.connection_id} className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.icon ?? "🔌"}</span>
                    <div>
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{c.type}</div>
                    </div>
                  </div>
                  <button onClick={() => removeConnection(c.connection_id)}
                    className="shrink-0" style={{ color: "var(--muted)" }}>
                    <X size={12} />
                  </button>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 mt-3"
                  style={{ color: STATUS_COLOR[c.status] ?? "#94a3b8", fontSize: 11 }}>
                  {STATUS_ICON[c.status]}
                  <span className="capitalize">{c.status}</span>
                </div>

                {/* Capabilities */}
                {c.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.capabilities.slice(0, 4).map((cap) => (
                      <span key={cap} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                        {cap}
                      </span>
                    ))}
                    {c.capabilities.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg)", color: "var(--muted)" }}>
                        +{c.capabilities.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Test button */}
                <button
                  onClick={() => testConnection(c.connection_id)}
                  disabled={testing === c.connection_id}
                  className="mt-3 text-xs px-3 py-1.5 rounded-lg w-full"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}
                >
                  {testing === c.connection_id
                    ? <span className="flex items-center gap-1 justify-center"><Loader size={11} className="animate-spin" /> Testing…</span>
                    : "Test Connection"
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
