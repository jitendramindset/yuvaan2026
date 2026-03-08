"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Award, Download, Filter, Package, RefreshCw,
  Search, ShoppingBag, Star, Tag, Zap,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ─── Fallback showcase listings shown when backend has none yet ───────────────
const SHOWCASE: MarketplaceListing[] = [
  {
    listing_id: "demo_1", name: "Vanshawali Profile Card", author: "NodeOS Core",
    description: "Full family-identity profile widget with karma ring and social links.",
    price: 0, category: "Social", tags: ["vanshawali","profile","family"], rating: 4.9, install_count: 312,
  },
  {
    listing_id: "demo_2", name: "Dravyam Wallet Mini", author: "NodeOS Core",
    description: "Compact wallet widget showing DRAVYAM, INR and USD balances with QR.",
    price: 0, category: "Finance", tags: ["wallet","dravyam","payment"], rating: 4.7, install_count: 289,
  },
  {
    listing_id: "demo_3", name: "Family Tree Visualiser", author: "NodeOS Core",
    description: "Interactive D3 family tree renderer connected to family.node graph.",
    price: 49, currency: "₹", category: "Social", tags: ["family","tree","d3"], rating: 4.8, install_count: 174,
  },
  {
    listing_id: "demo_4", name: "KPI Dashboard Kit", author: "BizNode Team",
    description: "4-widget ERP starter: revenue gauge, inventory table, team heatmap, alerts.",
    price: 199, currency: "₹", category: "Analytics", tags: ["kpi","erp","charts"], rating: 4.5, install_count: 203,
  },
  {
    listing_id: "demo_5", name: "AI Chat Assistant", author: "Yunaan Labs",
    description: "Chat widget powered by the Yunaan agent — create nodes & run workflows by voice.",
    price: 0, category: "AI", tags: ["chat","yunaan","ai","voice"], rating: 4.9, install_count: 401,
  },
  {
    listing_id: "demo_6", name: "Timeline Activity Feed", author: "NodeOS Core",
    description: "Scrollable activity timeline sourced from node_event_log with type filters.",
    price: 0, category: "Social", tags: ["timeline","feed","log"], rating: 4.6, install_count: 188,
  },
  {
    listing_id: "demo_7", name: "Waiting Screen Mini-Game", author: "Playzone",
    description: "Canvas-based asteroid dodge game — keeps users engaged during long operations.",
    price: 29, currency: "₹", category: "Game", tags: ["game","canvas","loading"], rating: 4.3, install_count: 97,
  },
  {
    listing_id: "demo_8", name: "Device Status Panel", author: "NodeOS Core",
    description: "Shows all paired devices with their platform icons and heartbeat status.",
    price: 0, category: "System", tags: ["device","iot","status"], rating: 4.4, install_count: 155,
  },
  {
    listing_id: "demo_9", name: "Workflow Builder Widget", author: "AutoNode",
    description: "Embed a mini n8n-style flow canvas inside any dashboard to chain actions.",
    price: 299, currency: "₹", category: "Workflow", tags: ["workflow","automation","nodes"], rating: 4.7, install_count: 66,
  },
];

interface MarketplaceListing {
  listing_id: string;
  widget_id?: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  rating?: number;
  install_count?: number;
  author?: string;
  category?: string;
  tags?: string[];
  published_at?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Social: "#6c63ff", Finance: "#22c55e", Analytics: "#f59e0b",
  AI: "#00d2ff", Game: "#ec4899", Workflow: "#f97316",
  System: "#94a3b8", Layout: "#a855f7",
};

function getCatColor(cat?: string) {
  return CATEGORY_COLORS[cat ?? ""] ?? "#6c63ff";
}

export default function MarketplacePage() {
  const [listings,   setListings]   = useState<MarketplaceListing[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed,  setInstalled]  = useState<Set<string>>(new Set());
  const [search,     setSearch]     = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const load = () => {
    setLoading(true); setError(null);
    fetch(`${BASE}/marketplace/listings`)
      .then((r) => r.json())
      .then((d) => {
        const arr: MarketplaceListing[] = Array.isArray(d)
          ? d : Array.isArray(d?.listings) ? d.listings : [];
        setListings(arr);
      })
      .catch(() => setListings([]))   // fall through to showcase
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Use backend listings when available, else show the in-code showcase
  const source = listings.length > 0 ? listings : SHOWCASE;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    source.forEach((l) => { if (l.category) cats.add(l.category); });
    return ["All", ...Array.from(cats).sort()];
  }, [source]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return source.filter((l) => {
      const matchCat  = activeCategory === "All" || l.category === activeCategory;
      const matchSearch = !q
        || l.name.toLowerCase().includes(q)
        || l.description.toLowerCase().includes(q)
        || l.tags?.some((t) => t.toLowerCase().includes(q))
        || l.author?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [source, activeCategory, search]);

  // Top item per category used as "featured"
  const featuredId = useMemo(
    () => source.find((l) => (l.rating ?? 0) >= 4.8)?.listing_id,
    [source],
  );

  async function install(id: string) {
    setInstalling(id);
    try {
      await fetch(`${BASE}/marketplace/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: id, user_id: "demo_user" }),
      });
      setInstalled((prev) => new Set([...prev, id]));
    } catch {
      setInstalled((prev) => new Set([...prev, id]));
    } finally {
      setInstalling(null);
    }
  }

  const isFallback = listings.length === 0 && !loading;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShoppingBag size={26} style={{ color: "var(--accent)" }} />
          <div>
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {loading
                ? "Loading listings…"
                : `${filtered.length} of ${source.length} widgets`}
              {isFallback && (
                <span className="ml-2 badge badge-purple text-xs">Showcase mode</span>
              )}
            </p>
          </div>
        </div>
        <button className="btn btn-secondary flex items-center gap-2 text-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets, authors, tags…"
            style={{ paddingLeft: 32, fontSize: 13 }}
          />
        </div>
        {/* Category chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} style={{ color: "var(--muted)" }} />
          {categories.map((cat) => {
            const active = cat === activeCategory;
            const col    = getCatColor(cat === "All" ? undefined : cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={{
                  background: active ? col + "22" : "var(--bg)",
                  border: `1px solid ${active ? col : "var(--border)"}`,
                  color: active ? col : "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Statistics bar ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {[
          { icon: <Package size={16} />, label: "Total Widgets", val: source.length, col: "#6c63ff" },
          { icon: <Download size={16} />, label: "Installs", val: source.reduce((a, l) => a + (l.install_count ?? 0), 0), col: "#22c55e" },
          { icon: <Star size={16} />, label: "Avg Rating", val: (source.filter((l) => l.rating).reduce((a, l) => a + (l.rating ?? 0), 0) / (source.filter((l) => l.rating).length || 1)).toFixed(1), col: "#f59e0b" },
          { icon: <Tag size={16} />, label: "Free Widgets", val: source.filter((l) => l.price === 0).length, col: "#00d2ff" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3 py-3">
            <span style={{ color: s.col }}>{s.icon}</span>
            <div>
              <div className="text-base font-bold">{s.val}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Featured banner ── */}
      {featuredId && (() => {
        const f = source.find((l) => l.listing_id === featuredId)!;
        const col = getCatColor(f.category);
        return (
          <div className="rounded-3xl px-6 py-5 flex items-center gap-5 flex-wrap"
            style={{ background: `linear-gradient(135deg, ${col}22 0%, rgba(0,210,255,0.10) 100%)`, border: `1px solid ${col}44` }}>
            <div className="flex items-center gap-3">
              <Award size={32} style={{ color: col }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: col }}>
                  ⭐ Featured Widget
                </div>
                <div className="font-bold text-lg">{f.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  by {f.author ?? "Unknown"} · {f.category}
                </div>
              </div>
            </div>
            <p className="text-sm flex-1 min-w-0" style={{ color: "var(--muted)" }}>
              {f.description}
            </p>
            <button
              className={`btn shrink-0 gap-2 ${installed.has(f.listing_id) ? "btn-secondary" : "btn-primary"}`}
              disabled={installed.has(f.listing_id) || installing === f.listing_id}
              onClick={() => install(f.listing_id)}
            >
              <Zap size={14} />
              {installed.has(f.listing_id) ? "Installed" : "Get It Free"}
            </button>
          </div>
        );
      })()}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 card" style={{ color: "var(--muted)" }}>
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">
            {search || activeCategory !== "All" ? "No widgets match your search" : "No listings yet"}
          </p>
          <p className="text-sm">
            {search
              ? <button className="btn btn-secondary text-xs mt-2" onClick={() => { setSearch(""); setActiveCategory("All"); }}>Clear filters</button>
              : "Publish and approve widgets via the NodeOS API to see them here."}
          </p>
        </div>
      )}

      {/* ── Listings grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isInstalled  = installed.has(item.listing_id);
          const isInstalling = installing === item.listing_id;
          const catColor     = getCatColor(item.category);
          const isFeatured   = item.listing_id === featuredId;

          return (
            <div
              key={item.listing_id}
              className="card flex flex-col gap-3 relative overflow-hidden"
              style={isFeatured ? { border: `1px solid ${catColor}66` } : {}}
            >
              {isFeatured && (
                <div className="absolute top-0 right-0 px-2 py-0.5 text-xs font-semibold rounded-bl-xl"
                  style={{ background: catColor + "22", color: catColor, fontSize: 10 }}>
                  ★ Featured
                </div>
              )}

              <div className="flex items-start justify-between pr-12">
                <div>
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  {item.author && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>by {item.author}</p>
                  )}
                </div>
                {item.category && (
                  <span className="badge text-xs shrink-0"
                    style={{ background: catColor + "18", color: catColor, border: `1px solid ${catColor}33` }}>
                    {item.category}
                  </span>
                )}
              </div>

              <p className="text-xs line-clamp-2 flex-1" style={{ color: "var(--muted)" }}>
                {item.description}
              </p>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="badge text-xs cursor-pointer"
                      style={{ color: "var(--muted)", cursor: "pointer" }}
                      onClick={() => setSearch(t)}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                {item.rating !== undefined && (
                  <span className="flex items-center gap-0.5">
                    <Star size={12} style={{ color: "#f59e0b" }} fill="#f59e0b" />
                    {item.rating.toFixed(1)}
                  </span>
                )}
                {item.install_count !== undefined && (
                  <span className="flex items-center gap-0.5">
                    <Download size={12} /> {item.install_count.toLocaleString()}
                  </span>
                )}
                <span className="ml-auto font-semibold" style={{ color: "var(--accent)" }}>
                  {item.price === 0 ? "Free" : `${item.currency ?? "₹"}${item.price}`}
                </span>
              </div>

              {/* Node ID badge */}
              {item.widget_id && (
                <div className="text-xs rounded-lg px-2 py-1"
                  style={{ background: "var(--bg)", color: "var(--muted)", fontFamily: "monospace", fontSize: 10 }}>
                  node: {item.widget_id}
                </div>
              )}

              <button
                className={`btn w-full flex items-center justify-center gap-2 ${
                  isInstalled ? "btn-secondary" : "btn-primary"
                }`}
                disabled={isInstalled || isInstalling}
                onClick={() => install(item.listing_id)}
              >
                <Download size={14} />
                {isInstalled ? "Installed" : isInstalling ? "Installing…" : "Install"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
