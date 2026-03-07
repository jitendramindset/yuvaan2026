"use client";
import { useEffect, useState } from "react";
import { Network } from "lucide-react";
import Link from "next/link";

interface Props { config: Record<string, unknown> }

const TYPE_COLORS: Record<string, string> = {
  system:     "#6c63ff",
  profile:    "#a855f7",
  widget:     "#00d2ff",
  workflow:   "#22c55e",
  data:       "#f59e0b",
  economy:    "#10b981",
  wallet:     "#06b6d4",
  device:     "#64748b",
  agent:      "#ec4899",
  trust:      "#ef4444",
  relation:   "#f97316",
  layout:     "#8b5cf6",
  media:      "#e879f9",
  risk:       "#fb923c",
  transaction: "#34d399",
};

export function NodeStats({ config }: Props) {
  const [byType, setByType] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [edges, setEdges] = useState(0);

  useEffect(() => {
    fetch("/api/backend/admin/graph")
      .then((r) => r.json())
      .then((d: { stats?: { total?: number; by_type?: Record<string, number> }; edges?: unknown[] }) => {
        setByType(d.stats?.by_type ?? {});
        setTotal(d.stats?.total ?? 0);
        setEdges(d.edges?.length ?? 0);
      })
      .catch(() => {});
  }, []);

  const entries = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9);

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Network size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold">Node Graph</span>
        </div>
        <div className="flex gap-1.5">
          <span className="badge badge-purple text-xs">{total} nodes</span>
          <span className="badge badge-blue text-xs">{edges} edges</span>
        </div>
      </div>

      {/* Type bars */}
      <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 content-start overflow-hidden">
        {entries.map(([type, count]) => {
          const color = TYPE_COLORS[type] ?? "#6c63ff";
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={type}>
              <div className="flex justify-between text-xs mb-0.5">
                <span style={{ color: "var(--muted)" }}>{type}</span>
                <span className="font-semibold" style={{ color }}>{count}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/admin" className="btn btn-secondary text-xs py-1.5 mt-auto justify-center shrink-0">
        View Full Graph →
      </Link>
    </div>
  );
}
