"use client";
/**
 * useScreenManager
 *
 * Implements "one view at a time" OS behaviour.
 *
 * - Only ONE screen is active at any given moment (like a phone OS)
 * - The last screen is remembered in localStorage so it restores on reload
 * - AI chat / voice commands can call `navigate(screen)` to switch views
 * - Any component can subscribe via `useScreenManager()` to know which screen is active
 * - The dashboard shell renders the active screen's content instead of navigating away
 *
 * Screens:
 *   dashboard | chat | connections | devices | builder | vanshawali |
 *   settings | marketplace | admin | voice | onboarding | company | widgets
 *
 * Window-level event: dispatch CustomEvent('nodeos:navigate', { detail: { screen } })
 * to switch screen from anywhere (AI actions, device commands, VR gestures).
 */

import { useState, useEffect, useCallback } from "react";

export type ScreenId =
  | "dashboard"
  | "chat"
  | "connections"
  | "devices"
  | "builder"
  | "vanshawali"
  | "settings"
  | "marketplace"
  | "admin"
  | "voice"
  | "onboarding"
  | "company"
  | "widgets"
  | "vr";

export interface ScreenMeta {
  id:    ScreenId;
  label: string;
  icon:  string;
  path:  string;
}

export const SCREENS: ScreenMeta[] = [
  { id: "dashboard",   label: "Dashboard",   icon: "🏠",  path: "/dashboard"   },
  { id: "chat",        label: "AI Chat",     icon: "🤖",  path: "/chat"        },
  { id: "connections", label: "Connections", icon: "🔌",  path: "/connections" },
  { id: "devices",     label: "Devices",     icon: "📡",  path: "/devices"     },
  { id: "builder",     label: "Builder",     icon: "🛠️",  path: "/builder"     },
  { id: "vanshawali",  label: "Vanshawali",  icon: "🌳",  path: "/vanshawali"  },
  { id: "settings",    label: "Settings",    icon: "⚙️",  path: "/settings"    },
  { id: "marketplace", label: "Marketplace", icon: "🛒",  path: "/marketplace" },
  { id: "admin",       label: "Admin",       icon: "🛡️",  path: "/admin"       },
  { id: "voice",       label: "Voice",       icon: "🎙️",  path: "/voice"       },
  { id: "onboarding",  label: "Onboard",     icon: "👋",  path: "/onboarding"  },
  { id: "company",     label: "Company",     icon: "🏢",  path: "/company"     },
  { id: "widgets",     label: "Widgets",     icon: "🧩",  path: "/widgets"     },
  { id: "vr",          label: "VR Mode",     icon: "🥽",  path: "/vr"          },
];

const STORAGE_KEY = "nodeos-active-screen";
const HISTORY_KEY = "nodeos-screen-history";
const NAV_EVENT   = "nodeos:navigate";

function readStored(): ScreenId {
  if (typeof window === "undefined") return "dashboard";
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ScreenId | null;
    if (v && SCREENS.some((s) => s.id === v)) return v;
  } catch { /* ignore */ }
  return "dashboard";
}

function readHistory(): ScreenId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ScreenId[]) : [];
  } catch { return []; }
}

function writeHistory(h: ScreenId[]): void {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-20))); } catch { /* ignore */ }
}

export function useScreenManager() {
  const [active, setActive]   = useState<ScreenId>("dashboard");
  const [history, setHistory] = useState<ScreenId[]>([]);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    const stored = readStored();
    setActive(stored);
    setHistory(readHistory());
    setReady(true);
  }, []);

  const navigate = useCallback((screen: ScreenId) => {
    setActive((prev) => {
      if (prev === screen) return prev;
      const h = readHistory();
      h.push(prev);
      writeHistory(h);
      setHistory([...h]);
      try { localStorage.setItem(STORAGE_KEY, screen); } catch { /* ignore */ }
      return screen;
    });
  }, []);

  const goBack = useCallback(() => {
    const h = readHistory();
    const prev = h.pop();
    if (prev) {
      writeHistory(h);
      setHistory([...h]);
      setActive(prev);
      try { localStorage.setItem(STORAGE_KEY, prev); } catch { /* ignore */ }
    }
  }, []);

  // Listen for global navigate events (from AI actions, voice, device gestures)
  useEffect(() => {
    const handler = (e: Event) => {
      const screen = (e as CustomEvent<{ screen: ScreenId }>).detail?.screen;
      if (screen) navigate(screen);
    };
    window.addEventListener(NAV_EVENT, handler);
    return () => window.removeEventListener(NAV_EVENT, handler);
  }, [navigate]);

  const meta = SCREENS.find((s) => s.id === active) ?? SCREENS[0]!;

  return { active, meta, history, navigate, goBack, ready };
}

/** Dispatch a navigation event from anywhere (AI actions, voice engine, etc.) */
export function dispatchNavigate(screen: ScreenId): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: { screen } }));
}
