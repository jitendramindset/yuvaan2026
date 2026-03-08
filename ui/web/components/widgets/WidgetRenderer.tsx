"use client";
import { ProfileCard }  from "./ProfileCard";
import { WalletCard }   from "./WalletCard";
import { OsStatus }     from "./OsStatus";
import { NodeStats }    from "./NodeStats";
import { QuickActions } from "./QuickActions";
import { Timeline }     from "./Timeline";
import { ChatWidget }   from "./ChatWidget";
import { DeviceStatus } from "./DeviceStatus";
import { Card }         from "./Card";
import { Table }        from "./Table";
import { Chart }        from "./Chart";
import { Feed }         from "./Feed";
import { Form }         from "./Form";
import { Canvas }       from "./Canvas";
// Vanshawali profile widgets
import {
  VanshProfile, VanshFamily, VanshFriends, VanshInterests,
  VanshEducation, VanshProfession, VanshHeritage, VanshAchievements,
  VanshGallery, VanshWallet, VanshLocation, VanshWishlist,
  VanshSocial, VanshContact, VanshTrust,
} from "./VanshawaliWidgets";
// Media widgets
import {
  MapWidget, CameraWidget, VideoWidget, AudioWidget,
  QRWidget, PostWidget, ImageGalleryWidget,
} from "./MediaWidgets";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Convert #rrggbb to "r,g,b" for use in rgba() */
function hexToRgb(hex: string): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

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
  // Identity
  { type: "ProfileCard",  label: "Profile Card",   icon: "👤", category: "Identity",    desc: "User profile, karma and roles",          defaultW: 4, defaultH: 4 },
  // Finance
  { type: "WalletCard",   label: "Wallet",          icon: "💰", category: "Finance",     desc: "Dravyam balance & transactions",          defaultW: 4, defaultH: 4 },
  // System
  { type: "OsStatus",     label: "OS Status",       icon: "⚡", category: "System",      desc: "NodeOS engine health and uptime",         defaultW: 4, defaultH: 4 },
  { type: "NodeStats",    label: "Node Graph",      icon: "🔗", category: "System",      desc: "Node graph stats by type",               defaultW: 6, defaultH: 4 },
  // Navigation
  { type: "QuickActions", label: "Quick Actions",   icon: "⚙️", category: "Navigation",  desc: "Shortcut grid to all OS sections",        defaultW: 6, defaultH: 3 },
  // Data
  { type: "Timeline",     label: "Activity Feed",   icon: "📋", category: "Data",        desc: "Recent node events & system activity",   defaultW: 4, defaultH: 5 },
  { type: "Table",        label: "Data Table",      icon: "📊", category: "Data",        desc: "Tabular rows from any node dataset",      defaultW: 6, defaultH: 4 },
  { type: "Feed",         label: "Social Feed",     icon: "📰", category: "Data",        desc: "Community posts and activity feed",       defaultW: 4, defaultH: 5 },
  // Analytics
  { type: "Chart",        label: "Bar Chart",       icon: "📈", category: "Analytics",   desc: "Bar chart from series data",              defaultW: 6, defaultH: 4 },
  { type: "Card",         label: "KPI Card",        icon: "🎯", category: "Analytics",   desc: "Single metric with value and subtitle",   defaultW: 2, defaultH: 2 },
  // AI
  { type: "ChatWidget",   label: "AI Chat",         icon: "🤖", category: "AI",          desc: "Chat with Yunaan AI assistant",           defaultW: 8, defaultH: 5 },
  // Device
  { type: "DeviceStatus", label: "Devices",         icon: "📱", category: "Device",      desc: "Connected device status",                defaultW: 4, defaultH: 4 },
  // Builder
  { type: "Form",         label: "Form",            icon: "📝", category: "Builder",     desc: "Dynamic form from a field schema",        defaultW: 4, defaultH: 5 },
  { type: "Canvas",       label: "Canvas",          icon: "🎨", category: "Builder",     desc: "Programmable 2D canvas",                  defaultW: 6, defaultH: 5 },
  // ── Vanshawali Profile widgets ───────────────────────────────────────────────
  { type: "VanshProfile",    label: "Profile Header",    icon: "👤", category: "Vanshawali", desc: "Name, avatar, karma, city",               defaultW: 12, defaultH: 5 },
  { type: "VanshFamily",     label: "Family Tree",       icon: "🌳", category: "Vanshawali", desc: "Family member cards with add/link",        defaultW: 6, defaultH: 4 },
  { type: "VanshFriends",    label: "Network",           icon: "🤝", category: "Vanshawali", desc: "Connections and friends grid",             defaultW: 6, defaultH: 4 },
  { type: "VanshInterests",  label: "Interests",         icon: "🎯", category: "Vanshawali", desc: "Hobbies and interest tags",                defaultW: 4, defaultH: 3 },
  { type: "VanshEducation",  label: "Education",         icon: "📚", category: "Vanshawali", desc: "Education timeline from onboarding",       defaultW: 4, defaultH: 4 },
  { type: "VanshProfession", label: "Profession",        icon: "💼", category: "Vanshawali", desc: "Work / career timeline",                   defaultW: 4, defaultH: 4 },
  { type: "VanshHeritage",   label: "Heritage",          icon: "🏛️", category: "Vanshawali", desc: "Gotra, caste, religion, nationality",      defaultW: 3, defaultH: 3 },
  { type: "VanshAchievements", label: "Achievements",   icon: "🏆", category: "Vanshawali", desc: "Earned badges and milestones",             defaultW: 3, defaultH: 3 },
  { type: "VanshGallery",    label: "Media Gallery",     icon: "🖼️", category: "Vanshawali", desc: "Photos and media grid",                   defaultW: 4, defaultH: 4 },
  { type: "VanshWallet",     label: "Dravyam Mini",      icon: "💰", category: "Vanshawali", desc: "Minimal wallet balance widget",            defaultW: 3, defaultH: 2 },
  { type: "VanshLocation",   label: "Location",          icon: "📍", category: "Vanshawali", desc: "Current city and address",                 defaultW: 3, defaultH: 3 },
  { type: "VanshWishlist",   label: "Wishlist",          icon: "✨", category: "Vanshawali", desc: "Goals and bucket list",                    defaultW: 4, defaultH: 3 },
  { type: "VanshSocial",     label: "Social Links",      icon: "🔗", category: "Vanshawali", desc: "LinkedIn, GitHub, Instagram etc.",         defaultW: 4, defaultH: 3 },
  { type: "VanshContact",    label: "Contact Info",      icon: "📞", category: "Vanshawali", desc: "Phone, email, WhatsApp, Telegram",         defaultW: 3, defaultH: 3 },
  { type: "VanshTrust",      label: "Trust Ring",        icon: "⭐", category: "Vanshawali", desc: "Profile completion ring + karma level",    defaultW: 4, defaultH: 4 },
  // ── Media widgets ────────────────────────────────────────────────────────────
  { type: "MapWidget",      label: "Live Map",         icon: "🗺️", category: "Media",    desc: "OpenStreetMap embed with coordinates",      defaultW: 6, defaultH: 5 },
  { type: "CameraWidget",   label: "Camera Feed",      icon: "📷", category: "Media",    desc: "MJPEG / IP camera live stream",             defaultW: 4, defaultH: 4 },
  { type: "VideoWidget",    label: "Video Player",     icon: "🎬", category: "Media",    desc: "YouTube or direct video embed",             defaultW: 6, defaultH: 5 },
  { type: "AudioWidget",    label: "Audio Player",     icon: "🎵", category: "Media",    desc: "Music / podcast player with controls",      defaultW: 4, defaultH: 4 },
  { type: "QRWidget",       label: "QR Code",          icon: "📱", category: "Media",    desc: "QR code generator for any text or URL",     defaultW: 3, defaultH: 4 },
  { type: "PostWidget",     label: "Social Post",      icon: "📢", category: "Social",   desc: "Post card with likes, comments, share",     defaultW: 4, defaultH: 4 },
  { type: "ImageGallery",   label: "Image Gallery",    icon: "🖼️", category: "Media",    desc: "Responsive image grid with lightbox",       defaultW: 6, defaultH: 5 },
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
  // Core
  ProfileCard:  ProfileCard,
  WalletCard:   WalletCard,
  OsStatus:     OsStatus,
  NodeStats:    NodeStats,
  QuickActions: QuickActions,
  Timeline:     Timeline,
  ChatWidget:   ChatWidget,
  DeviceStatus: DeviceStatus,
  // New
  Card,
  Table,
  Chart,
  Feed,
  Form,
  Canvas,
  // Vanshawali
  VanshProfile,
  VanshFamily,
  VanshFriends,
  VanshInterests,
  VanshEducation,
  VanshProfession,
  VanshHeritage,
  VanshAchievements,
  VanshGallery,
  VanshWallet,
  VanshLocation,
  VanshWishlist,
  VanshSocial,
  VanshContact,
  VanshTrust,
  // Media
  MapWidget,
  CameraWidget,
  VideoWidget,
  AudioWidget,
  QRWidget,
  PostWidget,
  ImageGallery: ImageGalleryWidget,
  ImageGalleryWidget,
  // snake_case aliases
  card_widget:     Card,
  table_widget:    Table,
  chart_widget:    Chart,
  feed_widget:     Feed,
  form_widget:     Form,
  canvas_widget:   Canvas,
  timeline_widget: Timeline,
  chat_widget:     ChatWidget,
  map_widget:      MapWidget,
  camera_widget:   CameraWidget,
  video_widget:    VideoWidget,
  audio_widget:    AudioWidget,
  qr_widget:       QRWidget,
  post_widget:     PostWidget,
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
  const accent    = widget.config.accent as string | undefined;

  // If user set a custom accent via builder, override the CSS var scoped to this card
  const accentOverride = accent
    ? ({ "--accent": accent, "--accent-rgb": hexToRgb(accent) } as React.CSSProperties)
    : {};

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
        ...accentOverride,
      }}
      onClick={() => editMode && onSelect?.(widget.id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0 select-none"
        style={{
          borderBottom: "1px solid var(--border)",
          background: accent ? `rgba(${hexToRgb(accent)},0.08)` : "rgba(255,255,255,0.02)",
          borderLeft: accent ? `3px solid ${accent}` : undefined,
          cursor: editMode ? "grab" : "default",
        }}
        onMouseDown={(e) => editMode && onDragStart?.(e, widget.id)}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent ?? "var(--muted)" }}>
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
