"use client";
import { useEffect, useState } from "react";
import { ShoppingBag, Star, Download, RefreshCw } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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

export default function MarketplacePage() {
  const [listings, setListings]   = useState<MarketplaceListing[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed,  setInstalled]  = useState<Set<string>>(new Set());

  const load = () => {
    setLoading(true); setError(null);
    fetch(`${BASE}/marketplace/listings`)
      .then((r) => r.json())
      .then((d) => {
        const arr: MarketplaceListing[] = Array.isArray(d)
          ? d
          : Array.isArray(d?.listings)
          ? d.listings
          : [];
        setListings(arr);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      // silent — still mark as attempted
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag size={26} style={{ color: "var(--accent)" }} />
          <div>
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {loading ? "Loading listings…" : `${listings.length} community widgets available`}
            </p>
          </div>
        </div>
        <button className="btn btn-secondary flex items-center gap-2" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && !error && (
        <div className="text-center py-16 card" style={{ color: "var(--muted)" }}>
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No listings yet</p>
          <p className="text-sm">
            Publish and approve widgets via the NodeOS API to see them here.
          </p>
        </div>
      )}

      {/* Listings grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((item) => {
          const isInstalled = installed.has(item.listing_id);
          const isInstalling = installing === item.listing_id;
          return (
            <div key={item.listing_id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  {item.author && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>by {item.author}</p>
                  )}
                </div>
                {item.category && (
                  <span className="badge badge-purple text-xs">{item.category}</span>
                )}
              </div>

              <p className="text-xs line-clamp-2 flex-1" style={{ color: "var(--muted)" }}>
                {item.description}
              </p>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 4).map((t) => (
                    <span key={t} className="badge text-xs" style={{ color: "var(--muted)" }}>#{t}</span>
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
                    <Download size={12} /> {item.install_count}
                  </span>
                )}
                <span className="ml-auto font-semibold" style={{ color: "var(--accent)" }}>
                  {item.price === 0 ? "Free" : `${item.currency ?? "₹"}${item.price}`}
                </span>
              </div>

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
