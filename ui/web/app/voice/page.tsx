"use client";
import { useRef, useState } from "react";
import { api, VoiceResponse } from "@/lib/api";
import { Mic, Send, X, Zap, Clock } from "lucide-react";

const QUICK_CMDS = [
  "go to dashboard", "add a sales chart", "show my profile", "open onboarding",
  "share location", "create inventory widget", "show all services", "generate company layout",
  "go to marketplace", "add calendar widget", "check device info", "install nodeos",
];

const INTENT_COLORS: Record<string, string> = {
  navigate:       "#6c63ff",
  widget_request: "#00d2ff",
  onboarding:     "#22c55e",
  location:       "#f59e0b",
  social:         "#a855f7",
  ai:             "#ec4899",
  system:         "#64748b",
};

type HistoryItem = VoiceResponse & { text: string; ts: string };

export default function VoicePage() {
  const [text,      setText]      = useState("");
  const [userId]                  = useState(() => `user_${Date.now()}`);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [history,   setHistory]   = useState<HistoryItem[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send(cmd = text.trim()) {
    if (!cmd || loading) return;
    setText("");
    setLoading(true);
    setError(null);
    try {
      const res = await api.voice.command(cmd, userId, sessionId);
      const sid = (res.action?.session_id as string | undefined) ?? sessionId;
      setSessionId(sid);
      setHistory((h) => [{ ...res, text: cmd, ts: new Date().toLocaleTimeString() }, ...h].slice(0, 20));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mic size={28} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Voice Control</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Type any command — NodeOS interprets intent and responds.
            Works offline with cached session data.
          </p>
        </div>
      </div>

      {/* Input bar */}
      <div className="card flex gap-3 items-center py-3 px-4">
        <Mic size={18} style={{ color: "var(--accent)" }} />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder='Type a command… e.g. "go to dashboard"'
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text)" }}
          autoFocus
        />
        {text && (
          <button onClick={() => setText("")} style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        )}
        <button
          className="btn btn-primary flex items-center gap-1.5 shrink-0"
          onClick={() => send()}
          disabled={loading || !text.trim()}
        >
          {loading ? "…" : <><Send size={14} /> Send</>}
        </button>
      </div>

      {/* Quick commands */}
      <div>
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Quick commands:</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_CMDS.map((q) => (
            <button
              key={q}
              className="btn btn-secondary text-xs py-1 px-2.5"
              onClick={() => send(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}
        >
          <X size={16} /> {error}
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        {history.length === 0 && (
          <div className="text-center py-12" style={{ color: "var(--muted)" }}>
            <Mic size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Send a command to see the response here.</p>
          </div>
        )}

        {history.map((item, i) => {
          const col = INTENT_COLORS[item.match?.intent] ?? "#6c63ff";
          return (
            <div key={i} className="card space-y-2.5">
              {/* Command row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Zap size={13} style={{ color: "var(--muted)" }} />
                <span className="font-medium text-sm flex-1">{item.text}</span>
                <span
                  className="badge text-xs"
                  style={{ background: `${col}20`, color: col }}
                >
                  {item.match?.intent ?? "unknown"}
                </span>
                <span className="badge text-xs" style={{ color: "var(--muted)" }}>
                  {item.match?.confidence}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                  <Clock size={11} />{item.ts}
                </span>
              </div>

              {/* Voice reply */}
              <p className="text-sm italic" style={{ color: "#00d2ff" }}>
                &ldquo;{item.voice_reply}&rdquo;
              </p>

              {/* Target */}
              {item.match?.target && item.match.target !== "unknown" && (
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  → <span style={{ color: "var(--accent)" }}>{item.match.target}</span>
                  {item.match.slots && Object.keys(item.match.slots).length > 0 && (
                    <span className="ml-2">
                      {Object.entries(item.match.slots).map(([k, v]) => (
                        <span key={k} className="mr-1">
                          <b>{k}</b>: {v}
                        </span>
                      ))}
                    </span>
                  )}
                </p>
              )}

              {/* Action payload */}
              {item.action && Object.keys(item.action).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer" style={{ color: "var(--muted)" }}>
                    Payload ({Object.keys(item.action).length} keys)
                  </summary>
                  <pre
                    className="mt-1 p-2 rounded overflow-auto"
                    style={{ background: "var(--bg)", fontSize: 11, color: "var(--muted)" }}
                  >
                    {JSON.stringify(item.action, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
