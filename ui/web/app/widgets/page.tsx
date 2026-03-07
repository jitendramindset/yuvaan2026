"use client";
import { useEffect, useState } from "react";
import { api, WidgetCatalogueEntry } from "@/lib/api";
import { Puzzle, Search, Filter } from "lucide-react";

const PLATFORMS = ["", "mobile", "web", "desktop", "tablet", "tv", "watch"];
const CATEGORIES = [
  "", "analytics", "ecommerce", "communication", "media", "navigation",
  "productivity", "social", "finance", "maps", "forms", "data", "developer", "ai",
];

const CATEGORY_COLORS: Record<string, string> = {
  analytics: "#6c63ff", ecommerce: "#00d2ff", communication: "#22c55e",
  media: "#f59e0b", navigation: "#a855f7", productivity: "#ef4444",
  social: "#ec4899", finance: "#10b981", maps: "#06b6d4",
  forms: "#8b5cf6", data: "#f97316", developer: "#64748b", ai: "#6366f1",
};

export default function WidgetsPage() {
  const [widgets,   setWidgets]   = useState<WidgetCatalogueEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [platform,  setPlatform]  = useState("");
  const [category,  setCategory]  = useState("");
  const [query,     setQuery]     = useState("");

  useEffect(() => {
    setLoading(true); setError(null);
    api.customize
      .widgets(platform || undefined, category || undefined)
      .then((res) => setWidgets(res.widgets))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [platform, category]);

  const filtered = widgets.filter((w) =>
    !query ||
    w.label.toLowerCase().includes(query.toLowerCase()) ||
    w.widget_type.toLowerCase().includes(query.toLowerCase()) ||
    w.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Puzzle size={26} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Widget Catalogue</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {loading ? "Loading…" : `${filtered.length} of ${widgets.length} widgets`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center py-3">
        <div className="flex items-center gap-2 flex-1 min-w-40">
          <Search size={15} style={{ color: "var(--muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search widgets…"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: "var(--text)" }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "var(--muted)" }} />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="text-sm rounded-lg px-2 py-1 border outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p || "All Platforms"}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm rounded-lg px-2 py-1 border outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c || "All Categories"}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
          {error} — <button className="underline" onClick={() => window.location.reload()}>retry</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((w) => {
          const col = CATEGORY_COLORS[w.category] ?? "#6c63ff";
          return (
            <div
              key={w.widget_type}
              className="card hover:scale-[1.02] transition-transform cursor-default"
              style={{ borderTop: `2px solid ${col}` }}
            >
              <div className="text-2xl mb-2">{w.icon}</div>
              <div className="font-medium text-sm mb-0.5">{w.label}</div>
              <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--muted)" }}>
                {w.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-auto">
                <span
                  className="badge text-xs"
                  style={{ background: `${col}18`, color: col }}
                >
                  {w.category}
                </span>
                <span className="badge text-xs" style={{ color: "var(--muted)" }}>
                  {w.default_size}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {w.platforms?.slice(0, 3).map((p) => (
                  <span key={p} className="badge text-xs" style={{ color: "var(--muted)" }}>{p}</span>
                ))}
                {w.platforms?.length > 3 && (
                  <span className="badge text-xs" style={{ color: "var(--muted)" }}>+{w.platforms.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--muted)" }}>
          <Puzzle size={36} className="mx-auto mb-3 opacity-30" />
          <p>No widgets match your filters.</p>
        </div>
      )}
    </div>
  );
}
