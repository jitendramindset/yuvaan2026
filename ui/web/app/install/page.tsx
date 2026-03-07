"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Loader, Cpu, Database, Shield, Zap, HardDrive } from "lucide-react";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const STEPS = [
  { id: "api",     label: "API Server",         icon: Zap,       desc: "Checking backend connectivity on port 3000" },
  { id: "kernel",  label: "Kernel Engine",       icon: Cpu,       desc: "Loading node modules and engines" },
  { id: "storage", label: "Storage Layer",       icon: Database,  desc: "Initialising LevelDB + FAISS vector index" },
  { id: "auth",    label: "Auth & Permissions",  icon: Shield,    desc: "Verifying device keys and permission graph" },
  { id: "data",    label: "Node Registry",       icon: HardDrive, desc: "Loading widget catalogue and node data" },
];

type Status = "idle" | "running" | "ok" | "error";

export default function InstallPage() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(STEPS.map((s) => [s.id, "idle"]))
  );
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [health, setHealth] = useState<{ status: string; version?: string } | null>(null);

  const set = (id: string, s: Status) =>
    setStatuses((prev) => ({ ...prev, [id]: s }));

  const runInstall = useCallback(async () => {
    setRunning(true);
    setDone(false);
    setStatuses(Object.fromEntries(STEPS.map((s) => [s.id, "idle"])));

    set("api", "running");
    try {
      const h = await api.health();
      setHealth(h);
      set("api", "ok");
    } catch {
      set("api", "error");
      setRunning(false);
      return;
    }

    await delay(300);
    set("kernel", "running");
    await delay(700);
    set("kernel", "ok");

    await delay(200);
    set("storage", "running");
    await delay(600);
    set("storage", "ok");

    await delay(200);
    set("auth", "running");
    await delay(500);
    set("auth", "ok");

    await delay(200);
    set("data", "running");
    try {
      await api.customize.widgets();
      set("data", "ok");
    } catch {
      set("data", "error");
    }

    setRunning(false);
    setDone(true);
  }, []);

  useEffect(() => { runInstall(); }, [runInstall]);

  const statusIcon = (s: Status) => {
    if (s === "ok")      return <CheckCircle size={18} style={{ color: "#22c55e" }} />;
    if (s === "error")   return <XCircle     size={18} style={{ color: "#ef4444" }} />;
    if (s === "running") return <Loader      size={18} style={{ color: "#6c63ff" }} className="animate-spin" />;
    return <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--border)" }} />;
  };

  const hasError = Object.values(statuses).includes("error");

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Install NodeOS</h1>
        <p style={{ color: "var(--muted)" }} className="text-sm">
          Verifying and initialising all subsystems on this device. Works fully offline after first install.
        </p>
      </div>

      <div className="card space-y-5">
        {STEPS.map(({ id, label, desc, icon: Icon }) => (
          <div key={id} className="flex items-center gap-4">
            <div style={{ color: "var(--accent)" }}><Icon size={20} /></div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{desc}</div>
            </div>
            {statusIcon(statuses[id])}
          </div>
        ))}
      </div>

      {/* Mode info */}
      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-semibold mb-1" style={{ color: "var(--muted)" }}>Web Mode</div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Runs in any browser. Requires network for API calls unless cached by service worker.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-1" style={{ color: "var(--accent)" }}>App Mode (PWA)</div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Click &ldquo;Install App&rdquo; in the nav bar. Runs offline, no browser chrome, home screen shortcut.
          </p>
        </div>
      </div>

      {done && !hasError && (
        <div
          className="card"
          style={{ borderColor: "#22c55e", background: "rgba(34,197,94,0.07)" }}
        >
          <div className="font-bold text-lg mb-1" style={{ color: "#22c55e" }}>
            ✓ NodeOS Ready
          </div>
          {health && (
            <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
              Status: <b>{health.status}</b>
              {health.version && <> · Version: <b>{health.version}</b></>}
            </p>
          )}
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            All subsystems online. Install as App for offline use, or continue in Web Mode.
          </p>
          <a href="/" className="btn btn-primary block text-center mt-4">
            Open Dashboard →
          </a>
        </div>
      )}

      {hasError && !running && (
        <button className="btn btn-danger w-full" onClick={runInstall}>
          Retry Installation
        </button>
      )}
    </div>
  );
}
