"use client";
/**
 * OSShell — Full-screen "one view at a time" OS wrapper.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │  Top status bar (screen name, time, user, status)       │
 * ├─────────────────────────────────────────────────────────┤
 * │                                                         │
 * │     Active screen content (fills all remaining space)   │
 * │                                                         │
 * ├─────────────────────────────────────────────────────────┤
 * │  Dock / taskbar (screen icons, back button, voice btn)  │
 * └─────────────────────────────────────────────────────────┘
 *
 * Switching screens:
 * - Click dock icons
 * - AI chat dispatches window CustomEvent('nodeos:navigate', {detail:{screen}})
 * - Voice commands via the same event
 * - VR gestures (future: same event bus)
 */

import { useEffect, useState, lazy, Suspense } from "react";
import { Loader, ChevronLeft, Mic, MicOff, Moon, Sun } from "lucide-react";
import { useScreenManager, SCREENS, type ScreenId } from "@/hooks/useScreenManager";
import { profileDisplayName } from "@/hooks/useProfile";
import { useProfile } from "@/hooks/useProfile";

// Lazy load each screen to keep initial bundle small
const ChatScreenContent        = lazy(() => import("./screens/ChatScreenContent").then((m) => ({ default: m.ChatScreenContent })));
const ConnectionsScreenContent = lazy(() => import("./screens/ConnectionsScreenContent").then((m) => ({ default: m.ConnectionsScreenContent })));
const DevicesScreenContent     = lazy(() => import("./screens/DevicesScreenContent").then((m) => ({ default: m.DevicesScreenContent })));
const SettingsScreenContent    = lazy(() => import("./screens/SettingsScreenContent").then((m) => ({ default: m.SettingsScreenContent })));

// Screens that have their own inline component (rendered inside OSShell)
const INLINE_SCREENS = new Set<ScreenId>(["chat", "connections", "devices", "settings", "vr"]);

// ── VR Launch Screen ──────────────────────────────────────────────────────────
function VRLaunchScreen() {
  const [mode, setMode] = useState<"dashboard" | "app" | "spatial_builder">("dashboard");
  const [started, setStarted] = useState(false);

  function launch() {
    setStarted(true);
    // Post to sensor engine via backend
    fetch("/api/backend/sensor/vr/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_id: "user.default", mode }),
    }).catch(() => null);
    // Request WebXR if available
    if ("xr" in navigator) {
      (navigator as unknown as { xr: { isSessionSupported: (m: string) => Promise<boolean>; requestSession: (m: string) => Promise<unknown> } })
        .xr.isSessionSupported("immersive-vr")
        .then((ok) => {
          if (ok) {
            (navigator as unknown as { xr: { requestSession: (m: string) => Promise<unknown> } })
              .xr.requestSession("immersive-vr").catch(() => null);
          }
        }).catch(() => null);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4"
      style={{ background: "radial-gradient(ellipse at center, rgba(108,99,255,0.15) 0%, var(--bg) 70%)" }}>
      <div className="text-6xl animate-pulse">🥽</div>
      <div className="text-center">
        <h2 className="text-xl font-bold">VR Mode — NodeOS Spatial OS</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Put on your headset. See all dashboards &amp; apps in 3D space.<br />
          Control by voice, gaze, hand gestures, or controller.
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {([["dashboard", "📊 Dashboard"], ["app", "📱 App Mode"], ["spatial_builder", "🧱 Builder"]] as const).map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === m ? "var(--accent)"  : "var(--surface)",
              color:      mode === m ? "#fff"            : "var(--muted)",
              border:     `1px solid ${mode === m ? "var(--accent)" : "var(--border)"}`,
            }}>
              {label}            </button>
          ))}
        </div>

      {/* Capabilities */}      <div className="grid grid-cols-2 gap-3 max-w-md w-full text-xs">
        {[
          ["🎙️ Voice Control",    "Say 'open wallet', 'show dashboard', 'call Raj'"],
          ["👁️ Gaze Selection",   "Look at an app to focus, dwell to activate"],
          ["✋ Hand Tracking",    "Pinch to tap, swipe to scroll, grab to move"],
          ["📡 Device View",      "See all connected devices as 3D nodes around you"],
          ["🧠 AI Overlay",       "Yunaan appears as spatial AI assistant"],
          ["🎮 Controller",       "Use VR controllers for full navigation"],
        ].map(([title, desc]) => (
          <div key={title as string} className="rounded-xl p-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="font-semibold mb-0.5">{title}</div>
            <div style={{ color: "var(--muted)" }}>{desc}</div>
          </div>
        ))}
      </div>

      <button onClick={launch} disabled={started}
        className="btn btn-primary px-8 py-3 text-sm font-semibold flex items-center gap-2">
        {started ? "🥽 VR Session Active — put on headset" : "🚀 Launch VR Mode"}
      </button>

      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Requires WebXR-compatible browser (Chrome 90+ / Firefox Reality / Meta Browser).
        Falls back to spatial overlay on non-VR displays.
      </p>
    </div>
  );
}

interface OSShellProps {
  /** Dashboard widget grid content — rendered when active screen === 'dashboard' */
  dashboardContent: React.ReactNode;
  /** Pages that have their own URL — rendered when active but no inline component */
  fallbackContent?: React.ReactNode;
}

function ScreenLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader size={28} className="animate-spin" style={{ color: "var(--muted)" }} />
    </div>
  );
}

const DOCK_SCREENS: ScreenId[] = [
  "dashboard", "chat", "connections", "devices",
  "builder", "vanshawali", "settings", "marketplace",
  "admin", "voice", "vr",
];

export function OSShell({ dashboardContent }: OSShellProps) {
  const { active, meta, history, navigate, goBack, ready } = useScreenManager();
  const profile = useProfile();
  const [time, setTime]       = useState("");
  const [voiceOn, setVoiceOn] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  if (!ready) return <ScreenLoader />;

  function renderScreen() {
    if (active === "dashboard") return <>{dashboardContent}</>;
    if (active === "chat")        return <Suspense fallback={<ScreenLoader />}><ChatScreenContent /></Suspense>;
    if (active === "connections") return <Suspense fallback={<ScreenLoader />}><ConnectionsScreenContent /></Suspense>;
    if (active === "devices")     return <Suspense fallback={<ScreenLoader />}><DevicesScreenContent /></Suspense>;
    if (active === "settings")    return <Suspense fallback={<ScreenLoader />}><SettingsScreenContent /></Suspense>;
    if (active === "vr")          return <VRLaunchScreen />;

    // For screens with dedicated pages (builder, marketplace, admin, vanshawali, voice…)
    // render an in-shell iframe-free redirect hint
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-5xl">{meta.icon}</div>
        <div className="text-lg font-bold">{meta.label}</div>
        <p className="text-sm text-center" style={{ color: "var(--muted)", maxWidth: 320 }}>
          This screen is available as a full page. Navigate using the top menu or click below.
        </p>
        <a href={meta.path}
          className="btn btn-primary text-sm px-6 py-2"
          onClick={(e) => {
            // If we can render inline, prevent navigation
            if (INLINE_SCREENS.has(active)) e.preventDefault();
          }}>
          Open {meta.label}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]" style={{ background: "var(--bg)" }}>
      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-2 text-xs"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        {/* Back */}
        <button
          onClick={goBack}
          disabled={history.length === 0}
          className="p-1 rounded-lg transition-all"
          style={{ opacity: history.length === 0 ? 0.3 : 1, color: "var(--muted)" }}
          title="Back"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Breadcrumb */}
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {meta.icon} {meta.label}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User */}
        <span style={{ color: "var(--muted)" }}>
          {profileDisplayName(profile)}
        </span>

        {/* Time */}
        <span className="font-mono" style={{ color: "var(--muted)" }}>{time}</span>

        {/* NodeOS status dot */}
        <span className="badge badge-green" style={{ fontSize: 10 }}>● Live</span>

        {/* Voice toggle */}
        <button
          onClick={() => setVoiceOn((v) => !v)}
          className="p-1 rounded-lg transition-all"
          style={{ color: voiceOn ? "var(--accent)" : "var(--muted)" }}
          title="Voice control"
        >
          {voiceOn ? <Mic size={14} /> : <MicOff size={14} />}
        </button>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" key={active}>
        {renderScreen()}
      </div>

      {/* ── Dock / Taskbar ───────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-1 px-4 py-2 overflow-x-auto"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      >
        {DOCK_SCREENS.map((id) => {
          const s = SCREENS.find((s) => s.id === id)!;
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all shrink-0 relative"
              style={{
                background: isActive ? "rgba(108,99,255,0.15)" : "transparent",
                border: `1px solid ${isActive ? "var(--accent)" : "transparent"}`,
                minWidth: 48,
              }}
              title={s.label}
            >
              <span className="text-base leading-none">{s.icon}</span>
              <span className="text-xs leading-none" style={{ color: isActive ? "var(--accent)" : "var(--muted)", fontSize: 9 }}>
                {s.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "var(--accent)" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
