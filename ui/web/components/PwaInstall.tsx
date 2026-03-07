"use client";
import { useEffect, useState } from "react";
import { Download, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isApp, setIsApp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setIsApp(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isApp) {
    return (
      <span
        className="badge badge-purple flex items-center gap-1 text-xs py-0.5 px-2"
        title="Running as installed app"
      >
        <Smartphone size={11} /> App Mode
      </span>
    );
  }

  if (installed) {
    return (
      <span className="badge badge-green flex items-center gap-1 text-xs py-0.5 px-2">
        <Smartphone size={11} /> Installed
      </span>
    );
  }

  if (!prompt) {
    return (
      <span
        className="flex items-center gap-1 text-xs py-0.5 px-2 rounded"
        style={{ color: "var(--muted)" }}
        title="Open in browser — install for App Mode"
      >
        <Monitor size={11} /> Web Mode
      </span>
    );
  }

  return (
    <button
      className="btn btn-primary flex items-center gap-1 text-xs py-1 px-2.5"
      title="Install NodeOS as an app on this device"
      onClick={async () => {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setPrompt(null);
      }}
    >
      <Download size={12} /> Install App
    </button>
  );
}
