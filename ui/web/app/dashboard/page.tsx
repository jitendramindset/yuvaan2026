"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, CustomizationLayout } from "@/lib/api";
import { LayoutGrid, RefreshCw } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  analytics:     "#6c63ff",
  ecommerce:     "#00d2ff",
  communication: "#22c55e",
  media:         "#f59e0b",
  navigation:    "#a855f7",
  productivity:  "#ef4444",
  social:        "#ec4899",
  finance:       "#10b981",
  maps:          "#06b6d4",
  forms:         "#8b5cf6",
  data:          "#f97316",
  developer:     "#64748b",
  ai:            "#6366f1",
};

function DashboardContent() {
  const params   = useSearchParams();
  const userId   = params.get("userId")   ?? "demo_user";
  const industry = params.get("industry") ?? "retail";
  const modules  = (params.get("modules") ?? "sales,inventory,crm").split(",");

  const [layout,  setLayout]  = useState<CustomizationLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = () => {
    setLoading(true); setError(null);
    api.company
      .generateLayout(userId, industry, modules)
      .then(setLayout)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId, industry, modules.join(",")]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3">
      <RefreshCw size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
      <span style={{ color: "var(--muted)" }}>Generating dashboard…</span>
    </div>
  );
  if (error) return (
    <div className="text-center py-24 space-y-3">
      <p style={{ color: "#ef4444" }}>{error}</p>
      <button className="btn btn-secondary" onClick={load}>Retry</button>
    </div>
  );
  if (!layout) return null;

  const widgets = layout.grid?.widgets ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <LayoutGrid size={26} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Generated Dashboard</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {industry} · {widgets.length} widgets · {layout.platform}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="badge badge-purple">{layout.status ?? "active"}</span>
          <button className="btn btn-secondary text-xs py-1 px-2 flex items-center gap-1" onClick={load}>
            <RefreshCw size={12} /> Regenerate
          </button>
        </div>
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((w, i) => {
          const col = CATEGORY_COLORS[""] ?? "#6c63ff"; // widgets don't have category here
          const accent = "#6c63ff";
          return (
            <div
              key={i}
              className="card group hover:scale-[1.02] transition-transform cursor-default"
              style={{ borderLeft: `3px solid ${accent}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-sm">{w.label}</span>
                <span
                  className="badge text-xs"
                  style={{ background: `${accent}20`, color: accent }}
                >
                  {w.size}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                {w.widget_type}
              </p>
              <div
                className="h-16 rounded flex items-center justify-center text-xs font-mono"
                style={{ background: `${accent}0d`, color: accent }}
              >
                {w.widget_type}
              </div>
              <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                pos: col {w.position.col}, row {w.position.row} · {w.position.colSpan}×{w.position.rowSpan}
              </div>
            </div>
          );
        })}
      </div>

      {/* Layout meta */}
      <details className="text-xs">
        <summary className="cursor-pointer text-sm font-medium">Layout JSON</summary>
        <pre
          className="p-3 mt-2 rounded overflow-auto"
          style={{ background: "var(--bg)", fontSize: 11, color: "var(--muted)" }}
        >
          {JSON.stringify(layout, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3">
          <RefreshCw size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--muted)" }}>Loading…</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
