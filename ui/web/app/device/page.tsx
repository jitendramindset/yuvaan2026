"use client";
import { useEffect, useState } from "react";
import { Smartphone, Monitor, Tablet, Cpu, Globe, Wifi, WifiOff, RefreshCw } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface BrowserDevice {
  platform: string;
  vendor: string;
  userAgent: string;
  language: string;
  online: boolean;
  cores: number;
  memory: number | null;
  screen: { width: number; height: number; dpr: number };
  isApp: boolean;
  connection: { type: string; downlink: number } | null;
  storage: { quota: number; usage: number } | null;
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--muted)" }} className="flex items-center gap-1.5">
        {icon}{label}
      </span>
      <span className="font-mono text-xs text-right max-w-56 truncate" title={value}>{value}</span>
    </div>
  );
}

export default function DevicePage() {
  const [info, setInfo] = useState<BrowserDevice | null>(null);
  const [backendDevices, setBackendDevices] = useState<unknown[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  useEffect(() => {
    const nav = navigator as typeof navigator & {
      deviceMemory?: number;
      connection?: { effectiveType: string; downlink: number };
    };

    const loadStorage = async () => {
      try {
        const est = await navigator.storage?.estimate?.();
        return est ? { quota: est.quota ?? 0, usage: est.usage ?? 0 } : null;
      } catch { return null; }
    };

    loadStorage().then((storage) => {
      setInfo({
        platform: nav.platform ?? "Unknown",
        vendor:   nav.vendor   || "Unknown",
        userAgent: nav.userAgent,
        language:  nav.language,
        online:    nav.onLine,
        cores:     nav.hardwareConcurrency ?? 1,
        memory:    nav.deviceMemory ?? null,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          dpr: window.devicePixelRatio,
        },
        isApp: window.matchMedia("(display-mode: standalone)").matches,
        connection: nav.connection
          ? { type: nav.connection.effectiveType, downlink: nav.connection.downlink }
          : null,
        storage,
      });
    });

    fetch(`${BASE}/devices/list`)
      .then((r) => r.json())
      .then((d: unknown) => {
        const data = d as { devices?: unknown[] } | unknown[];
        if (Array.isArray(data)) setBackendDevices(data);
        else if (Array.isArray((data as { devices?: unknown[] }).devices)) setBackendDevices((data as { devices: unknown[] }).devices);
        else setBackendDevices([]);
      })
      .catch(() => setBackendDevices([]))
      .finally(() => setLoadingDevices(false));
  }, []);

  const DeviceIcon = !info
    ? Monitor
    : info.screen.width < 768
    ? Smartphone
    : info.screen.width < 1200
    ? Tablet
    : Monitor;

  const fmtBytes = (n: number) =>
    n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${(n / 1e6).toFixed(0)} MB`;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DeviceIcon size={32} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Device Info</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm">
            {info?.isApp ? "Running in App Mode (PWA — installed)" : "Running in Web Mode (Browser)"}
          </p>
        </div>
        <span
          className={`badge ml-auto flex items-center gap-1 ${info?.online ? "badge-green" : "badge-yellow"}`}
        >
          {info?.online ? <><Wifi size={12} /> Online</> : <><WifiOff size={12} /> Offline</>}
        </span>
      </div>

      {info && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hardware */}
          <div className="card">
            <h2 className="font-semibold text-xs uppercase mb-3" style={{ color: "var(--muted)" }}>
              Hardware
            </h2>
            <Row label="Platform"  value={info.platform} icon={<Cpu size={13} />} />
            <Row label="Vendor"    value={info.vendor || "—"} />
            <Row label="CPU Cores" value={info.cores.toString()} />
            <Row label="RAM"       value={info.memory ? `${info.memory} GB` : "not available"} />
            <Row label="Screen"    value={`${info.screen.width}×${info.screen.height} @${info.screen.dpr}x`} />
            {info.storage && (
              <Row
                label="Storage"
                value={`${fmtBytes(info.storage.usage)} / ${fmtBytes(info.storage.quota)}`}
              />
            )}
          </div>

          {/* Network & Runtime */}
          <div className="card">
            <h2 className="font-semibold text-xs uppercase mb-3" style={{ color: "var(--muted)" }}>
              Network & Runtime
            </h2>
            <Row label="Language"    value={info.language}  icon={<Globe size={13} />} />
            <Row label="Connection"  value={info.connection?.type ?? "unknown"} />
            <Row label="Downlink"    value={info.connection ? `${info.connection.downlink} Mbps` : "—"} />
            <Row label="Mode"        value={info.isApp ? "App Mode (PWA)" : "Web Mode (Browser)"} />
            <Row label="Online"      value={info.online ? "Yes" : "No — Using cached data"} />
            <Row label="User Agent"  value={info.userAgent.slice(0, 45) + "…"} />
          </div>
        </div>
      )}

      {/* Backend devices */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Registered Devices</h2>
          <button
            className="btn btn-secondary text-xs py-1 px-2 flex items-center gap-1"
            onClick={() => {
              setLoadingDevices(true);
              fetch(`${BASE}/devices/list`)
                .then((r) => r.json())
                .then((d: unknown) => {
                  const data = d as { devices?: unknown[] } | unknown[];
                  setBackendDevices(Array.isArray(data) ? data : (data as { devices?: unknown[] }).devices ?? []);
                })
                .catch(() => setBackendDevices([]))
                .finally(() => setLoadingDevices(false));
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {loadingDevices ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading devices…</p>
        ) : backendDevices.length === 0 ? (
          <div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No devices registered in NodeOS yet.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Devices appear here after pairing via the NodeOS API. Start the backend and complete onboarding to register this device.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {backendDevices.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: "rgba(108,99,255,0.06)" }}
              >
                <Smartphone size={16} style={{ color: "var(--accent)" }} className="mt-0.5 shrink-0" />
                <pre className="text-xs flex-1 overflow-auto" style={{ color: "var(--muted)" }}>
                  {JSON.stringify(d, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
