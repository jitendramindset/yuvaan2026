"use client";
/**
 * SettingsScreenContent — Theme customisation + AI Provider key management.
 *
 * Tabs: Theme | AI Providers
 */

import { useState } from "react";
import { useTheme, THEME_PRESETS, type ThemeVars } from "@/hooks/useTheme";
import {
  RotateCcw, Check, Palette, Key, Plus, Trash2,
  CheckCircle, XCircle, Loader, Eye, EyeOff,
} from "lucide-react";

type Tab = "theme" | "ai";

const PROVIDERS = [
  { id: "openai",    label: "OpenAI",              icon: "🟢", desc: "GPT-4o mini, GPT-4o, GPT-4 Turbo",         models: ["gpt-4o-mini","gpt-4o","gpt-4-turbo"] },
  { id: "gemini",    label: "Google Gemini",        icon: "🔵", desc: "Gemini 2.0 Flash — free tier available",    models: ["gemini-2.0-flash","gemini-1.5-pro"] },
  { id: "anthropic", label: "Anthropic Claude",     icon: "🟠", desc: "Claude 3.5 Haiku, Claude 3.5 Sonnet",      models: ["claude-3-5-haiku-20241022","claude-3-5-sonnet-20241022"] },
  { id: "groq",      label: "Groq",                 icon: "⚡", desc: "Llama 3.3 70B — extremely fast, free tier", models: ["llama-3.3-70b-versatile","mixtral-8x7b-32768"] },
  { id: "ollama",    label: "Ollama (Local)",        icon: "🖥️", desc: "Runs entirely on your device — no API key", models: ["llama3.2","mistral","phi4","gemma2"] },
] as const;

const OWNER = "user.default";
const BASE  = "/api/backend";

const VAR_LABELS: { key: keyof ThemeVars; label: string; desc: string }[] = [
  { key: "--bg",      label: "Background",     desc: "Page / canvas" },
  { key: "--surface", label: "Card Surface",   desc: "Widget cards" },
  { key: "--border",  label: "Border",         desc: "Dividers" },
  { key: "--accent",  label: "Accent Primary", desc: "Buttons, links" },
  { key: "--accent2", label: "Accent 2",       desc: "Secondary glow" },
  { key: "--text",    label: "Text",           desc: "Body text" },
  { key: "--muted",   label: "Muted Text",     desc: "Labels, captions" },
];

interface ProviderStatus {
  configured: boolean;
  testing: boolean;
  result?: "ok" | "error";
  error?: string;
}

export function SettingsScreenContent() {
  const [tab,  setTab]  = useState<Tab>("theme");
  const { theme, applyTheme, updateVar, resetTheme } = useTheme();

  // AI provider state
  const [keys,    setKeys]    = useState<Record<string, string>>({});
  const [models,  setModels]  = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [status,  setStatus]  = useState<Record<string, ProviderStatus>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  async function saveProvider(providerId: string) {
    const key  = keys[providerId];
    const model = models[providerId] ?? PROVIDERS.find((p) => p.id === providerId)?.models[0];
    setStatus((s) => ({ ...s, [providerId]: { configured: false, testing: true } }));
    try {
      const res = await fetch(`${BASE}/ai-providers/${OWNER}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, apiKey: key || undefined, model, baseUrl: baseUrls[providerId] || undefined }),
      });
      setStatus((s) => ({
        ...s,
        [providerId]: { configured: res.ok, testing: false, result: res.ok ? "ok" : "error" },
      }));
    } catch {
      setStatus((s) => ({ ...s, [providerId]: { configured: false, testing: false, result: "error" } }));
    }
  }

  async function testProvider(providerId: string) {
    setStatus((s) => ({ ...s, [providerId]: { ...(s[providerId] ?? { configured: false }), testing: true } }));
    try {
      const res  = await fetch(`${BASE}/ai-providers/${OWNER}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      setStatus((s) => ({
        ...s,
        [providerId]: { configured: !!data.ok, testing: false, result: data.ok ? "ok" : "error", error: data.error },
      }));
    } catch {
      setStatus((s) => ({ ...s, [providerId]: { configured: false, testing: false, result: "error" } }));
    }
  }

  async function removeProvider(providerId: string) {
    try {
      await fetch(`${BASE}/ai-providers/${OWNER}/${providerId}`, { method: "DELETE" });
      setStatus((s) => ({ ...s, [providerId]: { configured: false, testing: false } }));
      setKeys((k) => { const n = { ...k }; delete n[providerId]; return n; });
    } catch { /* ignore */ }
  }

  return (
    <div className="h-full overflow-y-auto p-4 max-w-2xl mx-auto pb-12">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", display: "inline-flex" }}>
        {([["theme", "🎨  Theme"], ["ai", "🤖  AI Providers"]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="text-xs px-4 py-2 rounded-lg transition-all font-medium"
            style={{
              background: tab === id ? "var(--accent)" : "transparent",
              color:      tab === id ? "#fff" : "var(--muted)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* === THEME TAB === */}
      {tab === "theme" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Palette size={16} style={{ color: "var(--accent)" }} /> Theme &amp; Appearance
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Applied instantly across all screens. Saved to your browser.
              </p>
            </div>
            <button onClick={resetTheme} className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Presets */}
          <div className="card space-y-3">
            <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>PRESETS</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = preset.vars["--accent"] === theme["--accent"] && preset.vars["--bg"] === theme["--bg"];
                return (
                  <button key={preset.label} onClick={() => applyTheme(preset.vars)}
                    className="rounded-xl p-3 text-left transition-all"
                    style={{
                      background: preset.vars["--surface"],
                      border: `2px solid ${isActive ? preset.vars["--accent"] : preset.vars["--border"]}`,
                    }}>
                    <div className="flex gap-1 mb-2">
                      {[preset.vars["--bg"], preset.vars["--surface"], preset.vars["--accent"], preset.vars["--accent2"]].map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border" style={{ background: c, borderColor: preset.vars["--border"] }} />
                      ))}
                    </div>
                    <div className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: preset.vars["--text"] }}>
                      {isActive && <Check size={10} style={{ color: preset.vars["--accent"] }} />}
                      {preset.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fine-tune */}
          <div className="card space-y-4">
            <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>FINE-TUNE COLOURS</div>
            {VAR_LABELS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg border shrink-0"
                  style={{ background: theme[key] ?? "#000", borderColor: "var(--border)" }} />
                <div className="flex-1">
                  <div className="text-xs font-medium">{label}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{desc}</div>
                </div>
                <input type="color" value={theme[key] ?? "#000000"}
                  onChange={(e) => updateVar(key, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                <input type="text" value={theme[key] ?? ""}
                  onChange={(e) => updateVar(key, e.target.value)}
                  className="input w-24 text-xs font-mono" placeholder="#000000" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === AI PROVIDERS TAB === */}
      {tab === "ai" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Key size={16} style={{ color: "var(--accent)" }} /> AI Providers
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Add your own API keys. Keys are stored per-session in the NodeOS backend.
              Without a key, Yunaan uses the built-in rule-based fallback.
            </p>
          </div>

          {PROVIDERS.map((p) => {
            const s = status[p.id];
            return (
              <div key={p.id} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {p.label}
                      {s?.result === "ok"    && <CheckCircle size={12} color="#22c55e" />}
                      {s?.result === "error" && <XCircle    size={12} color="#ef4444" />}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{p.desc}</div>
                  </div>
                  {s?.configured && (
                    <button onClick={() => removeProvider(p.id)}
                      className="p-1.5 rounded-lg" style={{ color: "#ef4444" }} title="Remove">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* API key input (not needed for ollama) */}
                {p.id !== "ollama" && (
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>API Key</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKey[p.id] ? "text" : "password"}
                          value={keys[p.id] ?? ""}
                          onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                          placeholder={`Enter ${p.label} API key`}
                          className="input w-full pr-8 font-mono text-xs"
                        />
                        <button
                          onClick={() => setShowKey((s) => ({ ...s, [p.id]: !s[p.id] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--muted)" }}
                        >
                          {showKey[p.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ollama base URL */}
                {p.id === "ollama" && (
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Base URL (default: http://localhost:11434)</label>
                    <input
                      value={baseUrls[p.id] ?? ""}
                      onChange={(e) => setBaseUrls((b) => ({ ...b, [p.id]: e.target.value }))}
                      placeholder="http://localhost:11434"
                      className="input w-full text-xs font-mono"
                    />
                  </div>
                )}

                {/* Model selector */}
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Model</label>
                  <select
                    value={models[p.id] ?? p.models[0]}
                    onChange={(e) => setModels((m) => ({ ...m, [p.id]: e.target.value }))}
                    className="input w-full text-xs"
                  >
                    {p.models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Error detail */}
                {s?.error && (
                  <div className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {s.error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => saveProvider(p.id)}
                    disabled={s?.testing}
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1 flex-1">
                    {s?.testing ? <Loader size={11} className="animate-spin" /> : <Plus size={11} />}
                    Save &amp; Activate
                  </button>
                  <button onClick={() => testProvider(p.id)}
                    disabled={s?.testing}
                    className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    {s?.testing ? <Loader size={11} className="animate-spin" /> : "Test"}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl p-4 text-xs" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            <strong>🔒 Security note:</strong> Keys are held in-memory in the NodeOS backend process.
            They are never written to disk or logged. Add persistent encryption in{" "}
            <code>kernel/blob/blob_cipher.ts</code> for production deployments.
          </div>
        </div>
      )}
    </div>
  );
}
