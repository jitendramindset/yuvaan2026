"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Mic, UserPlus, Building2, Puzzle, ShoppingBag,
  Database, RefreshCw, Server, GitBranch, Search, Shield
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface ServiceDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  endpoint: string;
  description: string;
  href: string;
}

const SERVICES: ServiceDef[] = [
  { id: "api",        label: "API Server",        icon: Server,     endpoint: "/health",                          description: "Core HTTP gateway · port 3000",          href: "/" },
  { id: "voice",      label: "Voice Engine",       icon: Mic,        endpoint: "/voice/sessions",                  description: "NLP intent matcher & session store",     href: "/voice" },
  { id: "onboarding", label: "Onboarding Engine",  icon: UserPlus,   endpoint: "/onboarding/session/probe",        description: "8-step user + company setup wizard",     href: "/onboarding" },
  { id: "company",    label: "Company Engine",     icon: Building2,  endpoint: "/company/industry/retail/modules", description: "Industry → module → widget mapper",     href: "/company" },
  { id: "widgets",    label: "Widget Catalogue",   icon: Puzzle,     endpoint: "/customize/widgets",               description: "95+ universal widget registry",          href: "/widgets" },
  { id: "marketplace",label: "Marketplace",        icon: ShoppingBag,endpoint: "/marketplace/listings",            description: "Community widget store & installer",     href: "/marketplace" },
  { id: "nodes",      label: "Node Registry",      icon: Database,   endpoint: "/nodes",                           description: "Universal node storage & ledger",        href: "/" },
  { id: "search",     label: "Search / FAISS",     icon: Search,     endpoint: "/search?q=ping",                   description: "Vector similarity search engine",        href: "/" },
  { id: "sync",       label: "Sync Engine",        icon: RefreshCw,  endpoint: "/sync/status",                     description: "Multi-device real-time sync layer",      href: "/" },
  { id: "auth",       label: "Auth & Permissions", icon: Shield,     endpoint: "/permissions",                     description: "Device keys & permission graph",         href: "/" },
  { id: "ledger",     label: "Ledger Engine",      icon: GitBranch,  endpoint: "/nodes",                           description: "Immutable audit & karma ledger",         href: "/" },
];

type ServiceStatus = "checking" | "online" | "offline" | "degraded";

interface ServiceState {
  status: ServiceStatus;
  latency: number | null;
  httpStatus: number | null;
  error?: string;
  checkedAt: string | null;
}

export default function ServicesPage() {
  const [states, setStates] = useState<Record<string, ServiceState>>(
    Object.fromEntries(
      SERVICES.map((s) => [s.id, { status: "checking", latency: null, httpStatus: null, checkedAt: null }])
    )
  );
  const [lastRun, setLastRun] = useState<string | null>(null);

  const checkService = useCallback(async (svc: ServiceDef): Promise<ServiceState> => {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE}${svc.endpoint}`, {
        method: "GET",
        signal: AbortSignal.timeout(4000),
      });
      const latency = Date.now() - t0;
      const ok = res.ok || res.status === 400 || res.status === 404 || res.status === 405;
      const status: ServiceStatus = ok
        ? latency > 2500 ? "degraded" : "online"
        : res.status >= 500 ? "degraded" : "online";
      return { status, latency, httpStatus: res.status, checkedAt: new Date().toLocaleTimeString() };
    } catch (e: unknown) {
      return {
        status: "offline",
        latency: null,
        httpStatus: null,
        error: e instanceof Error ? e.message : String(e),
        checkedAt: new Date().toLocaleTimeString(),
      };
    }
  }, []);

  const checkAll = useCallback(async () => {
    setStates(
      Object.fromEntries(
        SERVICES.map((s) => [s.id, { status: "checking", latency: null, httpStatus: null, checkedAt: null }])
      )
    );
    for (const svc of SERVICES) {
      const state = await checkService(svc);
      setStates((prev) => ({ ...prev, [svc.id]: state }));
    }
    setLastRun(new Date().toLocaleTimeString());
  }, [checkService]);

  useEffect(() => { checkAll(); }, [checkAll]);

  const statusColor = (s: ServiceStatus) =>
    ({ online: "#22c55e", degraded: "#f59e0b", offline: "#ef4444", checking: "var(--muted)" })[s];

  const statusDot = (s: ServiceStatus) => (
    <span
      style={{
        display: "inline-block",
        width: 8, height: 8,
        borderRadius: "50%",
        background: statusColor(s),
        boxShadow: s === "online" ? `0 0 6px ${statusColor(s)}80` : "none",
        flexShrink: 0,
      }}
    />
  );

  const online  = Object.values(states).filter((s) => s.status === "online").length;
  const offline = Object.values(states).filter((s) => s.status === "offline").length;
  const total   = SERVICES.length;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-0.5">
            {online}/{total} online
            {offline > 0 && <span style={{ color: "#ef4444" }}> · {offline} offline</span>}
            {lastRun && <span> · checked {lastRun}</span>}
          </p>
        </div>
        <button
          className="btn btn-secondary flex items-center gap-2"
          onClick={checkAll}
        >
          <RefreshCw size={14} /> Refresh All
        </button>
      </div>

      {/* Health bar */}
      <div className="card py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-3 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(online / total) * 100}%`,
                background:
                  online === total ? "#22c55e" : online > total * 0.6 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <span className="text-sm font-mono w-10 text-right">
            {Math.round((online / total) * 100)}%
          </span>
        </div>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--muted)" }}>
          <span style={{ color: "#22c55e" }}>● {online} online</span>
          {offline > 0 && <span style={{ color: "#ef4444" }}>● {offline} offline</span>}
          <span>● {Object.values(states).filter((s) => s.status === "checking").length} checking</span>
          <span>● {Object.values(states).filter((s) => s.status === "degraded").length} degraded</span>
        </div>
      </div>

      {/* Service list */}
      <div className="space-y-2">
        {SERVICES.map((svc) => {
          const state = states[svc.id];
          const Icon  = svc.icon;
          return (
            <div
              key={svc.id}
              className="card flex items-center gap-4 py-3"
              style={{ opacity: state.status === "offline" ? 0.7 : 1 }}
            >
              <Icon size={20} style={{ color: statusColor(state.status), flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {statusDot(state.status)}
                  <span className="font-medium text-sm">{svc.label}</span>
                  <span
                    className="badge text-xs"
                    style={{
                      background: `${statusColor(state.status)}18`,
                      color: statusColor(state.status),
                    }}
                  >
                    {state.status}
                  </span>
                  {state.httpStatus !== null && (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      HTTP {state.httpStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                  {svc.description}
                </p>
                {state.error && (
                  <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>
                    {state.error.slice(0, 80)}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {state.latency !== null && (
                  <span
                    className="text-sm font-mono"
                    style={{
                      color: state.latency < 200 ? "#22c55e" : state.latency < 1000 ? "#f59e0b" : "#ef4444",
                    }}
                  >
                    {state.latency}ms
                  </span>
                )}
                {state.checkedAt && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{state.checkedAt}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
