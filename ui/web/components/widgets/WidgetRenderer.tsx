"use client";
import { ProfileCard }  from "./ProfileCard";
import { WalletCard }   from "./WalletCard";
import { OsStatus }     from "./OsStatus";
import { NodeStats }    from "./NodeStats";
import { QuickActions } from "./QuickActions";
import { Timeline }     from "./Timeline";
import { ChatWidget }   from "./ChatWidget";
import { DeviceStatus } from "./DeviceStatus";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface WidgetConfig {
  title?: string;
  [key: string]: unknown;
}

export interface LayoutWidget {
  id:          string;
  widget_type: string;
  /** CSS grid column start (0-indexed) */
  x: number;
  /** CSS grid row start (0-indexed) */
  y: number;
  /** column span */
  w: number;
  /** row span */
  h: number;
  config: WidgetConfig;
}

// ─── Widget catalogue (shown in builder palette) ──────────────────────────────

export interface CatalogueEntry {
  type:     string;
  label:    string;
  icon:     string;
  category: string;
  desc:     string;
  defaultW: number;
  defaultH: number;
}

export const WIDGET_CATALOGUE: CatalogueEntry[] = [
  { type: "ProfileCard",  label: "Profile Card",   icon: "👤", category: "Identity",    desc: "User profile, karma and roles",          defaultW: 4, defaultH: 4 },
  { type: "WalletCard",   label: "Wallet",          icon: "💰", category: "Finance",     desc: "Dravyam balance & transactions",          defaultW: 4, defaultH: 4 },
  { type: "OsStatus",     label: "OS Status",       icon: "⚡", category: "System",      desc: "NodeOS engine health and uptime",         defaultW: 4, defaultH: 4 },
  { type: "NodeStats",    label: "Node Graph",      icon: "🔗", category: "System",      desc: "Node graph stats by type",               defaultW: 6, defaultH: 4 },
  { type: "QuickActions", label: "Quick Actions",   icon: "⚙️", category: "Navigation",  desc: "Shortcut grid to all OS sections",        defaultW: 6, defaultH: 3 },
  { type: "Timeline",     label: "Activity Feed",   icon: "📋", category: "Data",        desc: "Recent node events & system activity",   defaultW: 4, defaultH: 5 },
  { type: "ChatWidget",   label: "AI Chat",         icon: "🤖", category: "AI",          desc: "Chat with NodeOS AI assistant",          defaultW: 8, defaultH: 5 },
  { type: "DeviceStatus", label: "Devices",         icon: "📱", category: "Device",      desc: "Connected device status",                defaultW: 4, defaultH: 4 },
];

// ─── Default dashboard layout ─────────────────────────────────────────────────

export const DEFAULT_LAYOUT: LayoutWidget[] = [
  { id: "w-profile",  widget_type: "ProfileCard",  x: 0, y: 0,  w: 4, h: 4, config: { title: "My Profile" } },
  { id: "w-wallet",   widget_type: "WalletCard",   x: 4, y: 0,  w: 4, h: 4, config: { title: "Dravyam Wallet" } },
  { id: "w-os",       widget_type: "OsStatus",     x: 8, y: 0,  w: 4, h: 4, config: { title: "OS Status" } },
  { id: "w-actions",  widget_type: "QuickActions", x: 0, y: 4,  w: 6, h: 3, config: { title: "Quick Actions" } },
  { id: "w-nodes",    widget_type: "NodeStats",    x: 6, y: 4,  w: 6, h: 3, config: { title: "Node Graph" } },
  { id: "w-chat",     widget_type: "ChatWidget",   x: 0, y: 7,  w: 8, h: 5, config: { title: "AI Assistant" } },
  { id: "w-devices",  widget_type: "DeviceStatus", x: 8, y: 7,  w: 4, h: 3, config: { title: "Devices" } },
  { id: "w-timeline", widget_type: "Timeline",     x: 8, y: 10, w: 4, h: 2, config: { title: "Activity" } },
];

export const LAYOUT_STORAGE_KEY = "nodeos-dashboard-layout";

// ─── Component registry ───────────────────────────────────────────────────────

type WidgetComponent = React.ComponentType<{ config: Record<string, unknown> }>;

const REGISTRY: Record<string, WidgetComponent> = {
  ProfileCard:  ProfileCard,
  WalletCard:   WalletCard,
  OsStatus:     OsStatus,
  NodeStats:    NodeStats,
  QuickActions: QuickActions,
  Timeline:     Timeline,
  ChatWidget:   ChatWidget,
  DeviceStatus: DeviceStatus,
};

// ─── WidgetRenderer ───────────────────────────────────────────────────────────

interface RendererProps {
  widget:     LayoutWidget;
  editMode?:  boolean;
  selected?:  boolean;
  onSelect?:  (id: string) => void;
  onDelete?:  (id: string) => void;
  onDragStart?: (e: React.MouseEvent, id: string) => void;
}

export function WidgetRenderer({
  widget,
  editMode,
  selected,
  onSelect,
  onDelete,
  onDragStart,
}: RendererProps) {
  const Component = REGISTRY[widget.widget_type];
  const title     = widget.config.title ?? widget.widget_type;

  return (
    <div
      className="card flex flex-col overflow-hidden"
      style={{
        height: "100%",
        padding: 0,
        cursor: editMode ? "grab" : "default",
        outline: selected ? "2px solid var(--accent)" : undefined,
        outlineOffset: selected ? "2px" : undefined,
        transition: "outline 0.1s ease",
      }}
      onClick={() => editMode && onSelect?.(widget.id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0 select-none"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.02)",
          cursor: editMode ? "grab" : "default",
        }}
        onMouseDown={(e) => editMode && onDragStart?.(e, widget.id)}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          {String(title)}
        </span>

        {editMode && (
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: "var(--muted)" }}>⠿</span>
            <button
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ color: "var(--danger)", background: "rgba(239,68,68,0.12)" }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete?.(widget.id); }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0 p-3">
        {Component
          ? <Component config={widget.config} />
          : (
            <div className="h-full flex items-center justify-center flex-col gap-2">
              <span className="text-2xl">🧩</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Unknown: {widget.widget_type}
              </span>
            </div>
          )
        }
      </div>
    </div>
  );
}
