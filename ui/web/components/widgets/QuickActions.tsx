"use client";
import {
  MessageCircle, Mic, Plus, ShoppingBag,
  RefreshCw, Settings, Users, Smartphone,
  Globe, Zap, Shield, Download,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Props { config: Record<string, unknown> }

const ACTIONS = [
  { icon: MessageCircle, label: "Chat AI",   color: "#6c63ff", href: "/voice" },
  { icon: Mic,           label: "Voice",     color: "#a855f7", href: "/voice" },
  { icon: Plus,          label: "Add Node",  color: "#22c55e", href: "/admin" },
  { icon: ShoppingBag,   label: "Market",    color: "#00d2ff", href: "/marketplace" },
  { icon: Globe,         label: "Builder",   color: "#8b5cf6", href: "/builder" },
  { icon: Users,         label: "Company",   color: "#ec4899", href: "/company" },
  { icon: Smartphone,    label: "Device",    color: "#06b6d4", href: "/device" },
  { icon: Shield,        label: "Admin",     color: "#f59e0b", href: "/admin" },
  { icon: Zap,           label: "Automate",  color: "#10b981", href: "/services" },
  { icon: Download,      label: "Install",   color: "#ef4444", href: "/install" },
];

export function QuickActions({ config }: Props) {
  const router = useRouter();
  const cols = (config.cols as number) ?? 5;

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {ACTIONS.map(({ icon: Icon, label, color, href }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all"
            style={{
              background: `${color}12`,
              border: `1px solid ${color}28`,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = `${color}22`;
              (e.currentTarget as HTMLElement).style.transform  = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = `${color}12`;
              (e.currentTarget as HTMLElement).style.transform  = "scale(1)";
            }}
          >
            <Icon size={17} style={{ color }} />
            <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
