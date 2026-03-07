"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Mic, UserPlus, Building2, Puzzle,
  ShoppingBag, Download, Smartphone, Activity, ShieldCheck,
  LayoutDashboard, Wrench, TreePine,
} from "lucide-react";
import { PwaInstall } from "@/components/PwaInstall";

const NAV = [
  { href: "/",             label: "Home",       icon: Home },
  { href: "/dashboard",    label: "Dashboard",  icon: LayoutDashboard },
  { href: "/builder",      label: "Builder",    icon: Wrench },
  { href: "/vanshawali",   label: "Vanshawali", icon: TreePine },
  { href: "/voice",        label: "Voice",      icon: Mic },
  { href: "/onboarding",  label: "Onboard",   icon: UserPlus },
  { href: "/company",     label: "Company",   icon: Building2 },
  { href: "/widgets",     label: "Widgets",   icon: Puzzle },
  { href: "/marketplace", label: "Market",    icon: ShoppingBag },
  { href: "/services",    label: "Services",  icon: Activity },
  { href: "/device",      label: "Device",    icon: Smartphone },
  { href: "/install",     label: "Install",   icon: Download },
  { href: "/admin",       label: "Admin",     icon: ShieldCheck },
];

export function Navbar() {
  const path = usePathname();
  return (
    <nav
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-0.5 h-14 overflow-x-auto">
        <Link
          href="/"
          className="font-bold text-base mr-3 shrink-0"
          style={{ color: "var(--accent)" }}
        >
          NodeOS
        </Link>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
            style={{
              background: path === href ? "rgba(108,99,255,0.15)" : "transparent",
              color: path === href ? "var(--accent)" : "var(--muted)",
            }}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
        <div className="ml-auto pl-2 shrink-0">
          <PwaInstall />
        </div>
      </div>
    </nav>
  );
}
