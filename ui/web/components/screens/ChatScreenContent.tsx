"use client";
/**
 * ChatScreenContent — GitHub Copilot-style AI chat interface.
 *
 * Features:
 * - Full conversation with AI (Yunaan)
 * - Markdown rendering (bold, code, lists)
 * - AI action buttons: Navigate, Execute, Apply
 * - Suggestion chips from AI response
 * - "/" command palette for 22 built-in tools
 * - Voice input toggle
 * - Sends to POST /api/backend/chat/message
 * - Dispatches navigate events for screen switching
 */

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  Send, Mic, MicOff, Sparkles, ChevronRight, X, Terminal,
  Zap, AlertCircle, CheckCircle, Loader,
} from "lucide-react";
import { dispatchNavigate, type ScreenId } from "@/hooks/useScreenManager";

interface ChatMsg {
  id:          string;
  role:        "user" | "assistant";
  content:     string;
  actions?:    Array<{ tool: string; params: Record<string, unknown> }>;
  suggestions?: string[];
  timestamp:   string;
  loading?:    boolean;
  error?:      boolean;
}

const COMMANDS = [
  { cmd: "/navigate",     desc: "Go to a screen",          tool: "navigate" },
  { cmd: "/add-widget",   desc: "Add widget to dashboard",  tool: "add_widget" },
  { cmd: "/theme",        desc: "Change theme/colours",     tool: "update_theme" },
  { cmd: "/profile",      desc: "Update your profile",      tool: "update_profile" },
  { cmd: "/connect",      desc: "Connect a service/device", tool: "connect_api" },
  { cmd: "/errors",       desc: "Check system errors",      tool: "check_errors" },
  { cmd: "/logs",         desc: "Show recent logs",         tool: "show_logs" },
  { cmd: "/karma",        desc: "Check karma score",        tool: "check_karma" },
  { cmd: "/wallet",       desc: "Show wallet & balance",    tool: "show_wallet" },
  { cmd: "/workflow",     desc: "Create automation",        tool: "create_workflow" },
  { cmd: "/node",         desc: "Create/read/run a node",   tool: "create_node" },
  { cmd: "/marketplace",  desc: "Install a widget",         tool: "install_widget" },
];

const OWNER_ID = "user.default";
const SESSION_KEY = "nodeos-chat-session";

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    // Bold **text**
    const parsed = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                       .replace(/`(.+?)`/g, '<code class="inline-code">$1</code>');
    if (line.startsWith("- ") || line.startsWith("* ")) {
      out.push(<li key={i} dangerouslySetInnerHTML={{ __html: parsed.slice(2) }} />);
    } else if (line.startsWith("# ")) {
      out.push(<h3 key={i} className="font-bold text-sm mt-1" dangerouslySetInnerHTML={{ __html: parsed.slice(2) }} />);
    } else if (line.trim() === "") {
      out.push(<br key={i} />);
    } else {
      out.push(<p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed }} />);
    }
  });
  return out;
}

function executeAction(action: { tool: string; params: Record<string, unknown> }): void {
  const { tool, params } = action;
  if (tool === "navigate" && typeof params["route"] === "string") {
    const route = params["route"] as string;
    const screen = route.replace("/", "") as ScreenId;
    dispatchNavigate(screen || "dashboard");
  } else if (tool === "apply_theme_preset" && typeof params["preset"] === "string") {
    // Dispatch a custom event the ThemeProvider listens to
    window.dispatchEvent(new CustomEvent("nodeos:theme", { detail: { preset: params["preset"] } }));
  } else if (tool === "add_widget" && typeof params["widget_type"] === "string") {
    window.dispatchEvent(new CustomEvent("nodeos:add-widget", { detail: params }));
  }
  // Other actions are server-side — already executed by the backend
}

export function ChatScreenContent() {
  const [messages, setMessages]       = useState<ChatMsg[]>([]);
  const [input, setInput]             = useState("");
  const [sessionId, setSessionId]     = useState<string | undefined>(undefined);
  const [loading, setLoading]         = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState("");
  const [listening, setListening]     = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setSessionId(s);
    } catch { /* ignore */ }

    // Welcome message
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "**Namaste! I'm Yunaan, your NodeOS AI.**\n\nI can control the entire OS — switch screens, manage widgets, connect services, run nodes, check errors, update your profile, and anything else you need.\n\nType `/` to see all commands, or just ask me anything naturally.",
      suggestions: ["Show my dashboard", "Connect GitHub", "Check my karma", "Add a chart widget"],
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const loadingMsg: ChatMsg = {
      id: `l-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      loading: true,
    };
    setMessages((p) => [...p, userMsg, loadingMsg]);
    setInput("");
    setLoading(true);
    setShowCommands(false);

    try {
      const res = await fetch("/api/backend/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: OWNER_ID,
          message: text.trim(),
          session_id: sessionId,
          platform: "web_chat",
          device_id: "browser",
        }),
      });
      const data = await res.json() as {
        reply?: string;
        session_id?: string;
        actions?: Array<{ tool: string; params: Record<string, unknown> }>;
        suggestions?: string[];
        error?: string;
      };

      if (data.session_id) {
        setSessionId(data.session_id);
        try { localStorage.setItem(SESSION_KEY, data.session_id); } catch { /* ignore */ }
      }

      const aiMsg: ChatMsg = {
        id:          `a-${Date.now()}`,
        role:        "assistant",
        content:     data.error ? `Error: ${data.error}` : (data.reply ?? "No response"),
        actions:     data.actions,
        suggestions: data.suggestions,
        timestamp:   new Date().toISOString(),
        error:       !!data.error,
      };

      setMessages((p) => p.slice(0, -1).concat(aiMsg));

      // Auto-execute non-destructive navigate actions
      if (data.actions) {
        for (const a of data.actions) {
          if (a.tool === "navigate") executeAction(a);
        }
      }
    } catch {
      setMessages((p) => p.slice(0, -1).concat({
        id: `e-${Date.now()}`,
        role: "assistant",
        content: "Connection error. Make sure the NodeOS backend is running on port 3000.",
        timestamp: new Date().toISOString(),
        error: true,
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
    if (e.key === "Escape") { setShowCommands(false); }
  }

  function handleInputChange(v: string) {
    setInput(v);
    if (v.startsWith("/")) {
      setShowCommands(true);
      setCommandFilter(v.slice(1).toLowerCase());
    } else {
      setShowCommands(false);
    }
  }

  const filteredCommands = COMMANDS.filter(
    (c) => c.cmd.includes(commandFilter) || c.desc.toLowerCase().includes(commandFilter),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ background: "rgba(108,99,255,0.15)" }}>🤖</div>
        <div>
          <div className="text-sm font-semibold">Yunaan AI</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Personal AI · learns from your actions · controls NodeOS
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="badge badge-green text-xs">● Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
              style={{
                background: msg.role === "user"
                  ? "rgba(108,99,255,0.2)"
                  : msg.error ? "rgba(239,68,68,0.15)" : "rgba(0,210,255,0.15)",
              }}
            >
              {msg.role === "user" ? "U" : msg.error ? "!" : "Y"}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: "76%" }}>
              <div
                className="rounded-2xl px-4 py-3 text-sm"
                style={{
                  background: msg.role === "user"
                    ? "rgba(108,99,255,0.18)"
                    : msg.error ? "rgba(239,68,68,0.08)" : "var(--surface)",
                  border: `1px solid ${msg.error ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                }}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2" style={{ color: "var(--muted)" }}>
                    <Loader size={14} className="animate-spin" />
                    <span className="text-xs">Yunaan is thinking…</span>
                  </div>
                ) : (
                  <div className="space-y-1 leading-relaxed" style={{ fontSize: 13 }}>
                    {renderMarkdown(msg.content)}
                  </div>
                )}
              </div>

              {/* Actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.actions.map((a, ai) => (
                    <button
                      key={ai}
                      onClick={() => executeAction(a)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.3)", color: "var(--accent)" }}
                    >
                      <Zap size={11} />
                      {a.tool.replace(/_/g, " ")}
                      {a.params["route"] ? ` → ${a.params["route"]}` : ""}
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-2.5 py-1 rounded-full transition-all"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Command palette */}
      {showCommands && filteredCommands.length > 0 && (
        <div
          className="mx-4 rounded-xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: 220, overflowY: "auto" }}
        >
          {filteredCommands.map((c) => (
            <button
              key={c.cmd}
              onClick={() => { setInput(c.cmd + " "); setShowCommands(false); inputRef.current?.focus(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-left transition-all"
              style={{ borderBottom: "1px solid var(--border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Terminal size={12} style={{ color: "var(--accent)" }} />
              <code style={{ color: "var(--accent)", minWidth: 130 }}>{c.cmd}</code>
              <span style={{ color: "var(--muted)" }}>{c.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-2"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Yunaan anything… or type / for commands"
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
            style={{ minHeight: 24, maxHeight: 120, color: "var(--text)", fontSize: 13 }}
          />
          <button
            onClick={() => setListening((v) => !v)}
            className="p-1.5 rounded-lg transition-all shrink-0"
            style={{ color: listening ? "var(--accent)" : "var(--muted)" }}
            title="Voice input"
          >
            {listening ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg shrink-0 transition-all"
            style={{ background: input.trim() ? "var(--accent)" : "var(--border)", color: "#fff" }}
          >
            {loading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "var(--muted)" }}>
          <Sparkles size={10} className="inline mr-1" />
          Yunaan learns from every interaction and builds your personal node memory.
        </p>
      </div>
    </div>
  );
}
