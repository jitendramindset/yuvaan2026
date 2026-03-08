"use client";
/**
 * ThemeProvider — re-applies saved CSS vars on mount so the user's
 * custom theme persists across page navigations.
 */
import { useEffect } from "react";

const LS_KEY = "nodeos-theme";

export function ThemeProvider() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const vars = JSON.parse(raw) as Record<string, string>;
      const root = document.documentElement;
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    } catch { /* ignore */ }
  }, []);
  return null;
}
