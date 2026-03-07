"use client";
import { useEffect, useState } from "react";
import { LayoutDashboard, Edit3 } from "lucide-react";
import Link from "next/link";
import {
  WidgetRenderer,
  LayoutWidget,
  DEFAULT_LAYOUT,
  LAYOUT_STORAGE_KEY,
} from "@/components/widgets/WidgetRenderer";

const ROW_HEIGHT = 80;
const GAP        = 8;

function widgetStyle(w: LayoutWidget): React.CSSProperties {
  const h = w.h * ROW_HEIGHT + (w.h - 1) * GAP;
  return {
    gridColumnStart: w.x + 1,
    gridColumnEnd:   `span ${w.w}`,
    gridRowStart:    w.y + 1,
    gridRowEnd:      `span ${w.h}`,
    height: h,
    minHeight: h,
  };
}

export default function DashboardPage() {
  const [layout, setLayout]   = useState<LayoutWidget[]>(DEFAULT_LAYOUT);
  const [hour, setHour]       = useState(new Date().getHours());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) setLayout(JSON.parse(saved) as LayoutWidget[]);
    } catch { /* use defaults */ }
    const t = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(t);
  }, []);

  const greeting =
    hour < 5  ? "Good night"      :
    hour < 12 ? "Good morning"    :
    hour < 17 ? "Good afternoon"  :
    hour < 21 ? "Good evening"    : "Good night";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-4 pb-8">
      {/* OS Status bar */}
      <div
        className="flex items-center gap-3 flex-wrap rounded-2xl px-4 py-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <LayoutDashboard size={18} style={{ color: "var(--accent)" }} />
        <div>
          <span className="font-semibold text-sm">{greeting}, Jitendra 👋</span>
          <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>{today}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="badge badge-green text-xs">● NodeOS Online</span>
          <span className="badge badge-purple text-xs">{layout.length} widgets</span>
          <Link href="/builder" className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <Edit3 size={12} /> Customize Layout
          </Link>
        </div>
      </div>

      {/* Widget Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridAutoRows: `${ROW_HEIGHT}px`,
          gap: `${GAP}px`,
        }}
      >
        {layout.map((w) => (
          <div key={w.id} style={widgetStyle(w)}>
            <WidgetRenderer widget={w} />
          </div>
        ))}
      </div>

      {/* OS Architecture accordion */}
      <details style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <summary className="text-xs cursor-pointer font-medium" style={{ color: "var(--muted)" }}>
          How NodeOS works ▸
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: "🧠", title: "Node Kernel",      text: "Every entity — profile, wallet, device, workflow — is a Node. Kernel validates via node.schema, resolves permissions, executes actions." },
            { icon: "🔐", title: "Permission Engine", text: "Each node carries read/write/execute ACLs plus role-based access. The kernel gate rejects unauthorised operations before they touch data." },
            { icon: "🎛️", title: "Widget System",    text: "Widgets are node-bound React components. Kernel resolves ui_schema.component → renders the widget with that node's live data." },
            { icon: "🤖", title: "AI + Voice",        text: "Voice engine maps natural language to intents. AI node (system_chat_root_v1) has memory, tool list, and MCP/webhook connectors." },
            { icon: "💰", title: "Dravyam Economy",   text: "Wallet, balance, ledger and fraud detection are economy nodes. Transactions run through Dravyam engine with karma-weighted scoring." },
            { icon: "📱", title: "Multi-Device",      text: "Any device pairing creates a device node. OS syncs state across all connected devices in real-time via the sync engine." },
            { icon: "🔌", title: "MCP & Automation",  text: "Connect n8n, Make, webhook triggers or MCP tools as automation nodes. Each appears as a callable action in the OS." },
            { icon: "🌐", title: "Brand OS",           text: "Users switch brands, install marketplace plugins, or build custom dashboards — all saved as nodes you own and control." },
          ].map(({ icon, title, text }) => (
            <div key={title} className="rounded-xl p-3 text-xs" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="text-lg mb-1">{icon}</div>
              <div className="font-semibold mb-1">{title}</div>
              <div style={{ color: "var(--muted)", lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

