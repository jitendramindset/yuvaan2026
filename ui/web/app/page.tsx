"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Mic, LayoutGrid, UserPlus, Building2, Puzzle,
  ShoppingBag, Download, Smartphone, Activity, Zap, ShieldCheck,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const TILES = [
  { href: "/voice",       label: "Voice Control",    desc: "Speak or type any command",        icon: Mic,          color: "#6c63ff" },
  { href: "/onboarding",  label: "Onboarding",       desc: "Set up user + company in 8 steps", icon: UserPlus,     color: "#00d2ff" },
  { href: "/company",     label: "Company",          desc: "Generate dashboard by industry",   icon: Building2,    color: "#22c55e" },
  { href: "/dashboard",   label: "Dashboard",        desc: "Live generated widget layout",     icon: LayoutGrid,   color: "#a855f7" },
  { href: "/widgets",     label: "Widget Catalogue", desc: "Browse all 95+ widgets",           icon: Puzzle,       color: "#f59e0b" },
  { href: "/marketplace", label: "Marketplace",      desc: "Install community widgets",        icon: ShoppingBag,  color: "#ec4899" },
  { href: "/services",    label: "Services",         desc: "All NodeOS service health",        icon: Activity,     color: "#10b981" },
  { href: "/device",      label: "Device Info",      desc: "Hardware + registered devices",    icon: Smartphone,   color: "#06b6d4" },
  { href: "/install",     label: "Install NodeOS",   desc: "Verify + initialise subsystems",   icon: Download,     color: "#f97316" },  { href: "/admin",       label: "Admin",             desc: "Node graph · manage all nodes",    icon: ShieldCheck,  color: "#dc2626" },];

export default function HomePage() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [isApp,  setIsApp]  = useState(false);

  useEffect(() => {
    setIsApp(window.matchMedia("(display-mode: standalone)").matches);
    fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => setOnline(r.ok))
      .catch(() => setOnline(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* Hero */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #6c63ff, #00d2ff)" }}
        >
          N
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NodeOS</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-0.5">
            Universal Node Operating System — works offline, in Web Mode or App Mode
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`badge flex items-center gap-1 ${
              online === null ? "" : online ? "badge-green" : "badge-yellow"
            }`}
          >
            <Zap size={11} />
            {online === null ? "Connecting…" : online ? "API Online" : "Offline Mode"}
          </span>
          {isApp && (
            <span className="badge badge-purple flex items-center gap-1">
              <Smartphone size={11} /> App Mode
            </span>
          )}
        </div>
      </div>

      {/* Offline banner */}
      {online === false && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: "rgba(245,158,11,0.10)", borderLeft: "3px solid #f59e0b", color: "var(--text)" }}
        >
          <b style={{ color: "#f59e0b" }}>Running Offline</b> — NodeOS is fully functional.
          Cached data is served from the service worker. Connect to the backend on port 3000 to sync.
        </div>
      )}

      {/* Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map(({ href, label, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="card group flex items-start gap-4 hover:scale-[1.02] transition-transform"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div className="font-semibold text-sm mb-0.5">{label}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
        NodeOS runs on your device. Install as App for full offline support.
        Backend API on <code>localhost:3000</code> · UI on <code>localhost:3001</code>
      </p>
    </div>
  );
}
