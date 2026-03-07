"use client";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface Props { config: Record<string, unknown> }

export function OsStatus({ config }: Props) {
  const [version, setVersion] = useState("1.0");
  const [engineStatus, setEngineStatus] = useState("running");
  const [nodeTotal, setNodeTotal] = useState(0);
  const [nodeActive, setNodeActive] = useState(0);
  const [edges, setEdges] = useState(0);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    fetch("/api/backend/health")
      .then((r) => r.json())
      .then((d: { status?: string; version?: string }) => {
        setEngineStatus(d.status ?? "running");
        setVersion(d.version ?? "1.0");
      })
      .catch(() => {});

    fetch("/api/backend/admin/graph")
      .then((r) => r.json())
      .then((d: { nodes?: unknown[]; edges?: unknown[]; stats?: { total?: number } }) => {
        setNodeTotal(d.stats?.total ?? d.nodes?.length ?? 0);
        setNodeActive(d.nodes?.length ?? 0);
        setEdges(d.edges?.length ?? 0);
      })
      .catch(() => {});

    const start = Date.now();
    const t = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const mem = 48; // mock

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} style={{ color: "var(--success)" }} />
          <span className="font-semibold text-sm">NodeOS v{version}</span>
        </div>
        <span className="badge badge-green text-xs capitalize">{engineStatus}</span>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {[
          { label: "Engine",   value: "kernel.engine", color: "var(--accent)" },
          { label: "Nodes",    value: `${nodeActive} active / ${nodeTotal} total`, color: "var(--text)" },
          { label: "Edges",    value: `${edges} connections`, color: "var(--text)" },
          { label: "Session",  value: fmt(uptime), color: "var(--accent2)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex justify-between text-xs">
            <span style={{ color: "var(--muted)" }}>{label}</span>
            <span className="font-medium" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Memory */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: "var(--muted)" }}>Memory</span>
          <span className="font-medium">{mem}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${mem}%`,
              background: "linear-gradient(90deg,var(--accent2),var(--accent))",
            }}
          />
        </div>
      </div>

      {/* CPU */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: "var(--muted)" }}>CPU</span>
          <span className="font-medium">12%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full w-[12%]" style={{ background: "var(--success)" }} />
        </div>
      </div>

      <div className="mt-auto text-xs" style={{ color: "var(--muted)" }}>
        Built: NodeOS · {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
