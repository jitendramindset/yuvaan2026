"use client";
import { useEffect, useState } from "react";
import { api, WidgetCatalogueEntry } from "@/lib/api";
import { Puzzle, Search, Filter, Eye, EyeOff } from "lucide-react";
import {
  WIDGET_CATALOGUE,
  WidgetRenderer,
  LayoutWidget,
} from "@/components/widgets/WidgetRenderer";
import { useRouter } from "next/navigation";

const CATEGORY_COLORS: Record<string, string> = {
  analytics: "#6c63ff", ecommerce: "#00d2ff", communication: "#22c55e",
  media: "#f59e0b", navigation: "#a855f7", productivity: "#ef4444",
  social: "#ec4899", finance: "#10b981", maps: "#06b6d4",
  forms: "#8b5cf6", data: "#f97316", developer: "#64748b", ai: "#6366f1",
  identity: "#a855f7", system: "#6c63ff", device: "#64748b",
};

const PLATFORMS  = ["", "mobile", "web", "desktop", "tablet", "tv", "watch"];
const CATEGORIES = [
  "", "analytics", "ecommerce", "communication", "media", "navigation",
  "productivity", "social", "finance", "maps", "forms", "data", "developer", "ai",
];

/** A live widget placed in a fixed preview container */
function LivePreview({ type }: { type: string }) {
  const entry = WIDGET_CATALOGUE.find((e) => e.type === type);
  if (!entry) return null;
  const w: LayoutWidget = {
    id: `prev-${type}`, widget_type: type,
    x: 0, y: 0,
    w: entry.defaultW, h: entry.defaultH,
    config: { title: entry.label },
  };
  return (
    <div style={{ height: 220, overflow: "hidden" }}>
      <WidgetRenderer widget={w} />
    </div>
  );
}

export default function WidgetsPage() {
  const router = useRouter();
  const [apiWidgets, setApiWidgets] = useState<WidgetCatalogueEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [platform,   setPlatform]   = useState("");
  const [category,   setCategory]   = useState("");
  const [query,      setQuery]      = useState("");
  const [showLive,   setShowLive]   = useState(true);

  useEffect(() => {
    setLoading(true); setError(null);
    api.customize
      .widgets(platform || undefined, category || undefined)
      .then((res) => setApiWidgets(res.widgets))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [platform, category]);

  const filteredApi = apiWidgets.filter((w) =>
    !query ||
    w.label.toLowerCase().includes(query.toLowerCase()) ||
    w.widget_type.toLowerCase().includes(query.toLowerCase()) ||
    (w.description ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const filteredLive = WIDGET_CATALOGUE.filter((e) =>
    !query ||
    e.label.toLowerCase().includes(query.toLowerCase()) ||
    e.type.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Puzzle size={24} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Widget Library</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {WIDGET_CATALOGUE.length} live widgets · {loading ? "…" : filteredApi.length} catalogue entries
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowLive((v) => !v)}
            className="btn btn-secondary text-xs py-1.5 px-3 gap-1"
          >
            {showLive ? <EyeOff size={13} /> : <Eye size={13} />}
            {showLive ? "Hide" : "Show"} Live UI
          </button>
          <button
            onClick={() => router.push("/builder")}
            className="btn btn-primary text-xs py-1.5 px-3"
          >
            Open Builder →
          </button>
        </div>
      </div>

      {/* ── Live Widget Section ── */}
      {showLive && (
        <section>
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
            LIVE WIDGET PREVIEWS — rendered with real data
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredLive.map((entry) => (
              <div
                key={entry.type}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {/* Preview */}
                <div style={{ background: "var(--bg)", padding: 12 }}>
                  <LivePreview type={entry.type} />
                </div>
                {/* Meta */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{entry.icon}</span>
                    <div>
                      <div className="text-xs font-semibold">{entry.label}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{entry.category}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/builder`)}
                    className="badge badge-purple text-xs"
                    style={{ cursor: "pointer" }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Catalogue section ── */}
      <section>
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
          FULL WIDGET CATALOGUE — all available widget types
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap gap-3 items-center py-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-40">
            <Search size={14} style={{ color: "var(--muted)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search widgets…"
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: "var(--text)", border: "none", padding: 0 }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} style={{ color: "var(--muted)" }} />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="text-sm rounded-lg px-2 py-1 border outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {PLATFORMS.map((p) => <option key={p} value={p}>{p || "All Platforms"}</option>)}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm rounded-lg px-2 py-1 border outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c || "All Categories"}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-sm mb-4" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
            {error} — <button className="underline" onClick={() => window.location.reload()}>retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredApi.map((w) => {
            const col = CATEGORY_COLORS[w.category] ?? "#6c63ff";
            return (
              <div
                key={w.widget_type}
                className="card hover:scale-[1.02] transition-transform"
                style={{ borderTop: `2px solid ${col}`, cursor: "default" }}
              >
                <div className="text-2xl mb-2">{w.icon}</div>
                <div className="font-medium text-sm mb-0.5">{w.label}</div>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--muted)" }}>
                  {w.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  <span className="badge text-xs" style={{ background: `${col}18`, color: col }}>{w.category}</span>
                  <span className="badge text-xs" style={{ color: "var(--muted)" }}>{w.default_size}</span>
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

        {!loading && filteredApi.length === 0 && (
          <div className="text-center py-16" style={{ color: "var(--muted)" }}>
            <Puzzle size={36} className="mx-auto mb-3 opacity-30" />
            <p>No widgets match your filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}

