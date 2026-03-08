"use client";
/**
 * useTheme — global theme customizer.
 *
 * Persists colour tokens to localStorage("nodeos-theme") and
 * applies them as CSS custom properties on <html>.
 */
import { useCallback, useEffect, useState } from "react";

export interface ThemeVars {
  "--bg":      string;
  "--surface": string;
  "--border":  string;
  "--accent":  string;
  "--accent2": string;
  "--text":    string;
  "--muted":   string;
}

export const THEME_PRESETS: { label: string; vars: ThemeVars }[] = [
  {
    label: "Dark (default)",
    vars: {
      "--bg":      "#0f1117",
      "--surface": "#1a1d27",
      "--border":  "#2a2d3e",
      "--accent":  "#6c63ff",
      "--accent2": "#00d2ff",
      "--text":    "#e8e9f0",
      "--muted":   "#6b7280",
    },
  },
  {
    label: "Midnight Blue",
    vars: {
      "--bg":      "#07090f",
      "--surface": "#0e1428",
      "--border":  "#1a2040",
      "--accent":  "#3b82f6",
      "--accent2": "#8b5cf6",
      "--text":    "#dde3f0",
      "--muted":   "#5b6887",
    },
  },
  {
    label: "Forest",
    vars: {
      "--bg":      "#071410",
      "--surface": "#0f211a",
      "--border":  "#1c3328",
      "--accent":  "#22c55e",
      "--accent2": "#06b6d4",
      "--text":    "#d4edd9",
      "--muted":   "#5e7a67",
    },
  },
  {
    label: "Amber",
    vars: {
      "--bg":      "#110e05",
      "--surface": "#1d1808",
      "--border":  "#2d2510",
      "--accent":  "#f59e0b",
      "--accent2": "#f97316",
      "--text":    "#f0e8d0",
      "--muted":   "#857350",
    },
  },
  {
    label: "Rose",
    vars: {
      "--bg":      "#110709",
      "--surface": "#1e0d10",
      "--border":  "#321520",
      "--accent":  "#ec4899",
      "--accent2": "#a855f7",
      "--text":    "#f0d5de",
      "--muted":   "#845a65",
    },
  },
  {
    label: "Light",
    vars: {
      "--bg":      "#f8f9fc",
      "--surface": "#ffffff",
      "--border":  "#e2e5ed",
      "--accent":  "#6c63ff",
      "--accent2": "#00d2ff",
      "--text":    "#1a1d27",
      "--muted":   "#6b7280",
    },
  },
];

const LS_KEY = "nodeos-theme";

function applyVars(vars: Partial<ThemeVars>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeVars>(() => THEME_PRESETS[0].vars);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ThemeVars;
        applyVars(saved);
        setTheme(saved);
      }
    } catch { /* ignore */ }
  }, []);

  const applyTheme = useCallback((vars: ThemeVars) => {
    applyVars(vars);
    setTheme(vars);
    try { localStorage.setItem(LS_KEY, JSON.stringify(vars)); } catch { /* ignore */ }
  }, []);

  const updateVar = useCallback((key: keyof ThemeVars, value: string) => {
    setTheme((prev) => {
      const next = { ...prev, [key]: value };
      applyVars({ [key]: value });
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetTheme = useCallback(() => {
    applyTheme(THEME_PRESETS[0].vars);
  }, [applyTheme]);

  return { theme, applyTheme, updateVar, resetTheme };
}
