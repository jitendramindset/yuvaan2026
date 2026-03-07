"use client";
import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[NodeOS] Service worker registered:", reg.scope);
          // Subscribe to background sync when back online
          window.addEventListener("online", () => {
            if ("sync" in reg) {
              (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } })
                .sync.register("nodeos-sync").catch(() => {});
            }
          });
        })
        .catch((err) => console.warn("[NodeOS] SW registration failed:", err));
    }
  }, []);

  return null;
}
