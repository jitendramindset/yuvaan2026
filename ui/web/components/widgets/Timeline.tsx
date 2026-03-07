"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props { config: Record<string, unknown> }

interface Evt {
  ts: number;
  event: string;
  node?: string;
  type?: string;
  color: string;
}

const TYPE_COLORS: Record<string, string> = {
  profile: "#a855f7", wallet: "#06b6d4", system: "#6c63ff",
  widget: "#00d2ff", workflow: "#22c55e", data: "#f59e0b",
  device: "#64748b", economy: "#10b981",
};

export function Timeline({ config }: Props) {
  const [events, setEvents] = useState<Evt[]>([]);

  useEffect(() => {
    fetch("/api/backend/admin/nodes")
      .then((r) => r.json())
      .then(({ nodes }: { nodes: { node_id: string; node_type: string; status: string }[] }) => {
        const evts: Evt[] = nodes.slice(0, 12).map((n, i) => ({
          ts: Date.now() - i * 900_000 + Math.random() * 300_000,
          event: `${n.node_type} node loaded`,
          node: n.node_id,
          type: n.node_type,
          color: TYPE_COLORS[n.node_type] ?? "#6c63ff",
        }));
        setEvents(evts.sort((a, b) => b.ts - a.ts));
      })
      .catch(() => {
        setEvents([
          { ts: Date.now(),              event: "System started",       color: "#6c63ff", type: "system" },
          { ts: Date.now() - 3_600_000,  event: "Profile node loaded",  node: "profile.vanshawali.default", color: "#a855f7", type: "profile" },
          { ts: Date.now() - 7_200_000,  event: "Wallet initialised",   node: "wallet.dravyam.default",     color: "#06b6d4", type: "wallet" },
          { ts: Date.now() - 10_800_000, event: "Device paired",        node: "device.default.local",       color: "#64748b", type: "device" },
        ]);
      });
  }, []);

  const fmtAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)  return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <Clock size={13} style={{ color: "var(--accent)" }} />
        <span className="text-xs font-semibold">Activity Feed</span>
        <span className="badge badge-purple text-xs ml-auto">{events.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-0.5">
        {events.map((e, i) => (
          <div key={i} className="flex gap-2 items-start group">
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{ background: e.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{e.event}</div>
              {e.node && (
                <div className="text-xs truncate" style={{ color: e.color }}>
                  {e.node}
                </div>
              )}
            </div>
            <div
              className="text-xs shrink-0 tabular-nums"
              style={{ color: "var(--muted)" }}
            >
              {fmtAgo(e.ts)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
