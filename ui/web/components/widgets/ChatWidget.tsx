"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";

interface Props { config: Record<string, unknown> }
interface Msg { role: "user" | "ai"; text: string }

export function ChatWidget({ config }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hello! I'm your NodeOS AI. Ask me anything or say a command like 'show my nodes' or 'open wallet'." },
  ]);
  const [input, setInput]   = useState("");
  const [busy, setBusy]     = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/backend/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: "user.default", message: text, session_id: "dashboard-chat" }),
      });
      const data = await res.json() as { reply?: string; suggestions?: string[] };
      const reply = data.reply ?? "Done.";
      const suggestions = data.suggestions ?? [];
      setMsgs((m) => [
        ...m,
        { role: "ai", text: reply },
        ...(suggestions.length > 0 ? [{ role: "ai" as const, text: `💡 ${suggestions.join("  ·  ")}` }] : []),
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "AI engine offline. Check backend." }]);
    } finally {
      setBusy(false);
    }
  }, [input, busy]);

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-0.5"
        ref={scrollRef}
      >
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: m.role === "ai"
                  ? "rgba(108,99,255,0.2)"
                  : "rgba(168,85,247,0.2)",
              }}
            >
              {m.role === "ai"
                ? <Bot size={12} style={{ color: "var(--accent)" }} />
                : <UserIcon size={12} style={{ color: "#a855f7" }} />}
            </div>
            <div
              className="max-w-[85%] text-xs rounded-2xl px-3 py-2 leading-relaxed"
              style={{
                background: m.role === "ai"
                  ? "var(--border)"
                  : "rgba(108,99,255,0.25)",
                color: "var(--text)",
                borderBottomLeftRadius:  m.role === "ai"   ? 4 : undefined,
                borderBottomRightRadius: m.role === "user" ? 4 : undefined,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(108,99,255,0.2)" }}>
              <Bot size={12} style={{ color: "var(--accent)" }} />
            </div>
            <div className="text-xs rounded-2xl px-3 py-2" style={{ background: "var(--border)" }}>
              <span style={{ color: "var(--muted)" }}>●●●</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask or command…"
          className="flex-1"
          style={{ fontSize: "12px", padding: "6px 10px" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || busy}
          className="btn btn-primary"
          style={{ padding: "6px 10px", opacity: !input.trim() || busy ? 0.45 : 1 }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
