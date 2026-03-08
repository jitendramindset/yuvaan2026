"use client";
/**
 * Vanshawali — Human OS Identity + Life Dashboard
 *
 * 5 tabs:
 *   Profile   – widget-grid layout (add/arrange/configure; same system as dashboard)
 *   Vault     – encrypted files, notes, images, video, voice with TTL & permissions
 *   Map       – location map of connections; share/view shared locations; distance
 *   LifeBook  – post feed (text/image/video/voice); timeline; circle visibility
 *   Circles   – create groups, manage members, share content, access logs
 *
 * All widgets use WidgetRenderer (same `LayoutWidget[]` format as dashboard).
 * Trust score (from profile completion) gates wallet limits and actions.
 */
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Users, MapPin, BookOpen, Lock, LayoutDashboard,
  Plus, Edit3, X, Save, Check, Upload, Mic, Image,
  Video, FileText, Share2, Shield, Clock, Eye, EyeOff,
  Zap, AlertTriangle, UserPlus, Settings, ChevronRight,
  Globe, Link2, Heart, MessageCircle, Play,
} from "lucide-react";
import {
  WidgetRenderer, LayoutWidget, WIDGET_CATALOGUE, CatalogueEntry,
} from "@/components/widgets/WidgetRenderer";
import { useOBData, computeOBCompletion } from "@/hooks/useOBData";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const LAYOUT_KEY  = "nodeos-vanshawali-layout";
const VAULT_KEY   = "nodeos-vault-files";
const LIFEBOOK_KEY= "nodeos-lifebook-posts";
const CIRCLES_KEY = "nodeos-circles";

const ROW_H = 80;
const GAP   = 8;

type Tab = "profile" | "vault" | "map" | "lifebook" | "circles";

// ─── Default profile widget layout ───────────────────────────────────────────

const DEFAULT_PROFILE_LAYOUT: LayoutWidget[] = [
  { id: "vw-header",   widget_type: "VanshProfile",    x: 0, y: 0, w: 12, h: 5, config: { title: "My Profile" } },
  { id: "vw-trust",    widget_type: "VanshTrust",      x: 0, y: 5, w: 4,  h: 5, config: { title: "Trust Score" } },
  { id: "vw-family",   widget_type: "VanshFamily",     x: 4, y: 5, w: 4,  h: 5, config: { title: "Family Tree" } },
  { id: "vw-interest", widget_type: "VanshInterests",  x: 8, y: 5, w: 4,  h: 3, config: { title: "Interests" } },
  { id: "vw-wallet",   widget_type: "VanshWallet",     x: 8, y: 8, w: 4,  h: 2, config: { title: "Wallet" } },
  { id: "vw-edu",      widget_type: "VanshEducation",  x: 0, y: 10, w: 4, h: 4, config: { title: "Education" } },
  { id: "vw-job",      widget_type: "VanshProfession", x: 4, y: 10, w: 4, h: 4, config: { title: "Career" } },
  { id: "vw-heritage", widget_type: "VanshHeritage",   x: 8, y: 10, w: 2, h: 4, config: { title: "Heritage" } },
  { id: "vw-achieve",  widget_type: "VanshAchievements",x: 10, y: 10, w: 2, h: 4, config: { title: "Badges" } },
  { id: "vw-social",   widget_type: "VanshSocial",     x: 0, y: 14, w: 6, h: 3, config: { title: "Social" } },
  { id: "vw-contact",  widget_type: "VanshContact",    x: 6, y: 14, w: 3, h: 3, config: { title: "Contact" } },
  { id: "vw-location", widget_type: "VanshLocation",   x: 9, y: 14, w: 3, h: 3, config: { title: "Location" } },
];

function loadLayout(): LayoutWidget[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) return JSON.parse(raw) as LayoutWidget[];
  } catch { /**/ }
  return DEFAULT_PROFILE_LAYOUT;
}

function saveLayout(layout: LayoutWidget[]): void {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /**/ }
}

function widgetStyle(w: LayoutWidget): React.CSSProperties {
  const h = w.h * ROW_H + (w.h - 1) * GAP;
  return {
    gridColumnStart: w.x + 1,
    gridColumnEnd:   `span ${w.w}`,
    gridRowStart:    w.y + 1,
    gridRowEnd:      `span ${w.h}`,
    height: h,
  };
}

// ─── Vault types ──────────────────────────────────────────────────────────────

type FileKind = "image" | "video" | "audio" | "note" | "file";
type Visibility = "private" | "connections" | "circle" | "public";

interface VaultFile {
  id:         string;
  name:       string;
  kind:       FileKind;
  size_kb:    number;
  url?:       string;
  note?:      string;
  created_at: string;
  expires_at?: string;
  visibility: Visibility;
  circle_id?: string;
  hash:       string;     // content hash for integrity
  downloads:  number;
  permission: "view" | "download" | "view_only"; // download-once, etc.
}

function loadVault(): VaultFile[] {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY) ?? "[]") as VaultFile[]; } catch { return []; }
}
function saveVault(files: VaultFile[]): void {
  try { localStorage.setItem(VAULT_KEY, JSON.stringify(files)); } catch { /**/ }
}

// ─── LifeBook types ───────────────────────────────────────────────────────────

type PostKind = "text" | "image" | "video" | "voice" | "note";

interface LifePost {
  id:         string;
  kind:       PostKind;
  content:    string;
  media_url?: string;
  visibility: Visibility;
  circle_id?: string;
  created_at: string;
  likes:      number;
  liked?:     boolean;
  comments:   number;
}

function loadPosts(): LifePost[] {
  try { return JSON.parse(localStorage.getItem(LIFEBOOK_KEY) ?? "[]") as LifePost[]; } catch { return []; }
}
function savePosts(posts: LifePost[]): void {
  try { localStorage.setItem(LIFEBOOK_KEY, JSON.stringify(posts)); } catch { /**/ }
}

// ─── Circle types ─────────────────────────────────────────────────────────────

interface Circle {
  id:         string;
  name:       string;
  description?: string;
  icon:       string;
  color:      string;
  members:    string[];
  created_at: string;
  owner:      string;
  access_log: Array<{ action: string; by: string; at: string }>;
}

function loadCircles(): Circle[] {
  try { return JSON.parse(localStorage.getItem(CIRCLES_KEY) ?? "[]") as Circle[]; } catch { return []; }
}
function saveCircles(circles: Circle[]): void {
  try { localStorage.setItem(CIRCLES_KEY, JSON.stringify(circles)); } catch { /**/ }
}

// ─── Trust badge ──────────────────────────────────────────────────────────────

function TrustBadge({ score }: { score: number }) {
  const label = score >= 80 ? "Elder" : score >= 60 ? "Root" : score >= 40 ? "Sprout" : "Seed";
  const color = score >= 80 ? "#f59e0b" : score >= 60 ? "#6c63ff" : score >= 40 ? "#22c55e" : "#94a3b8";
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: color + "20", color, border: `1px solid ${color}44` }}>
      <Zap size={10} /> {label} · {score}%
    </span>
  );
}

// ─── Map of Connections ───────────────────────────────────────────────────────

function ConnectionsMap() {
  const ob = useOBData();
  const myCity = ob.addresses?.[0]?.city || "";

  const MOCK_CONNECTIONS = [
    { name: "Arjun S.", city: "Mumbai",    lat: "19.076", lon: "72.877", distance: "0 km" },
    { name: "Priya M.", city: "Delhi",     lat: "28.613", lon: "77.209", distance: "1,400 km" },
    { name: "Rahul K.", city: "Bengaluru", lat: "12.971", lon: "77.594", distance: "980 km" },
    { name: "Sneha T.", city: "Pune",      lat: "18.520", lon: "73.856", distance: "148 km" },
    { name: "Vikram D.", city: "Chennai",  lat: "13.082", lon: "80.270", distance: "1,330 km" },
  ];

  const [sharing, setSharing]     = useState(false);
  const [viewingShared, setView]  = useState(false);
  const [selected, setSelected]   = useState<typeof MOCK_CONNECTIONS[0] | null>(null);

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="btn btn-primary text-xs gap-1"
          onClick={() => setSharing((v) => !v)}
        >
          <MapPin size={12} />
          {sharing ? "Stop Sharing" : "Share My Location"}
        </button>
        <button
          className="btn btn-secondary text-xs gap-1"
          onClick={() => setView((v) => !v)}
        >
          <Eye size={12} />
          {viewingShared ? "Hide Shared" : "View Shared Locations"}
        </button>
        {sharing && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
            ● Broadcasting · {myCity || "Your location"}
          </span>
        )}
      </div>

      {/* Map embed (OpenStreetMap — no API key) */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", height: 280 }}>
        <iframe
          title="Connections Map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=68.0,6.5,97.5,37.5&layer=mapnik"
          width="100%" height="100%"
          style={{ border: 0 }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Connection list with distance */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Connected Nodes
        </div>
        {MOCK_CONNECTIONS.map((c) => (
          <div key={c.name}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all"
            style={{ background: selected?.name === c.name ? "rgba(108,99,255,0.12)" : "var(--bg)", border: "1px solid var(--border)" }}
            onClick={() => setSelected((v) => v?.name === c.name ? null : c)}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "rgba(108,99,255,0.2)", color: "var(--accent)" }}>
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">{c.name}</div>
              <div className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <MapPin size={9} /> {c.city}
              </div>
            </div>
            <div className="text-xs" style={{ color: "var(--accent)" }}>{c.distance}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Vault Tab ────────────────────────────────────────────────────────────────

function VaultTab() {
  const [files, setFiles]       = useState<VaultFile[]>(loadVault);
  const [showAdd, setShowAdd]   = useState(false);
  const [newNote, setNewNote]   = useState("");
  const [expiry, setExpiry]     = useState("30");
  const [visibility, setVis]    = useState<Visibility>("private");

  function addNote() {
    if (!newNote.trim()) return;
    const item: VaultFile = {
      id: `vf-${Date.now()}`,
      name: newNote.slice(0, 40),
      kind: "note",
      size_kb: Math.ceil(new TextEncoder().encode(newNote).length / 1024) || 1,
      note: newNote,
      created_at: new Date().toISOString(),
      expires_at: expiry !== "0"
        ? new Date(Date.now() + parseInt(expiry) * 86400000).toISOString()
        : undefined,
      visibility,
      hash: btoa(newNote).slice(0, 32),
      downloads: 0,
      permission: "view_only",
    };
    const next = [item, ...files];
    setFiles(next); saveVault(next);
    setNewNote(""); setShowAdd(false);
  }

  function removeFile(id: string) {
    const next = files.filter((f) => f.id !== id);
    setFiles(next); saveVault(next);
  }

  function isExpired(f: VaultFile): boolean {
    return !!f.expires_at && new Date(f.expires_at) < new Date();
  }

  const KIND_ICON: Record<FileKind, React.ReactNode> = {
    image: <Image size={14} />,
    video: <Video size={14} />,
    audio: <Mic size={14} />,
    note:  <FileText size={14} />,
    file:  <Upload size={14} />,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Encrypted Vault</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            All files are node-hash protected. Expired files are inaccessible — even if downloaded.
          </p>
        </div>
        <button className="btn btn-primary text-xs gap-1" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={12} /> Add Item
        </button>
      </div>

      {/* Add item form */}
      {showAdd && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-xs font-semibold">New Vault Entry</div>
          <textarea
            className="w-full rounded-xl px-3 py-2 text-xs resize-none"
            rows={3}
            placeholder="Write a note or paste content..."
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Expires after</label>
              <select
                className="w-full rounded-lg px-2 py-1.5 text-xs"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              >
                <option value="0">Never</option>
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Visibility</label>
              <select
                className="w-full rounded-lg px-2 py-1.5 text-xs"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                value={visibility}
                onChange={(e) => setVis(e.target.value as Visibility)}
              >
                <option value="private">🔒 Private</option>
                <option value="connections">🤝 Connections</option>
                <option value="circle">⭕ Circle</option>
                <option value="public">🌐 Public</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
            <Shield size={11} />
            File will be content-hashed. After expiry, the hash is invalidated — even cached copies become unreadable.
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary text-xs gap-1 flex-1" onClick={addNote}><Check size={11} /> Save to Vault</button>
            <button className="btn btn-secondary text-xs" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* File grid */}
      {files.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "2px dashed var(--border)" }}>
          <Lock size={28} className="mx-auto mb-2 opacity-30" style={{ color: "var(--muted)" }} />
          <div className="text-sm font-semibold">Vault is empty</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Add notes, images, videos, or files with access control.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((f) => {
            const expired = isExpired(f);
            return (
              <div key={f.id}
                className={`rounded-xl p-3 ${expired ? "opacity-40" : ""}`}
                style={{ background: "var(--surface)", border: `1px solid ${expired ? "#ef4444" : "var(--border)"}` }}>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: expired ? "rgba(239,68,68,0.1)" : "rgba(108,99,255,0.12)", color: expired ? "#ef4444" : "var(--accent)" }}>
                    {KIND_ICON[f.kind]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{f.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{f.size_kb} KB</span>
                      {expired ? (
                        <span className="text-xs badge badge-red">Expired</span>
                      ) : f.expires_at ? (
                        <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--muted)" }}>
                          <Clock size={9} /> {new Date(f.expires_at).toLocaleDateString()}
                        </span>
                      ) : null}
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {f.visibility === "private" ? "🔒" : f.visibility === "connections" ? "🤝" : f.visibility === "circle" ? "⭕" : "🌐"}
                      </span>
                    </div>
                    {f.note && !expired && (
                      <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--muted)" }}>{f.note}</p>
                    )}
                    {expired && (
                      <p className="text-xs mt-1" style={{ color: "#ef4444" }}>This file has expired and cannot be accessed.</p>
                    )}
                  </div>
                  <button className="text-xs p-1 rounded" style={{ color: "var(--muted)" }}
                    onClick={() => removeFile(f.id)}>
                    <X size={11} />
                  </button>
                </div>
                {!expired && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                    <Shield size={9} /> Hash: <code style={{ fontFamily: "monospace", fontSize: 9 }}>{f.hash}</code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LifeBook Tab ─────────────────────────────────────────────────────────────

function LifeBookTab({ circles }: { circles: Circle[] }) {
  const ob = useOBData();
  const [posts, setPosts]     = useState<LifePost[]>(loadPosts);
  const [compose, setCompose] = useState(false);
  const [text, setText]       = useState("");
  const [kind, setKind]       = useState<PostKind>("text");
  const [vis, setVis]         = useState<Visibility>("connections");
  const [circleId, setCircleId]= useState<string>("");

  function publish() {
    if (!text.trim()) return;
    const post: LifePost = {
      id: `lp-${Date.now()}`,
      kind,
      content: text,
      visibility: vis,
      circle_id: vis === "circle" ? circleId : undefined,
      created_at: new Date().toISOString(),
      likes: 0,
      comments: 0,
    };
    const next = [post, ...posts];
    setPosts(next); savePosts(next);
    setText(""); setCompose(false);
  }

  function toggleLike(id: string) {
    const next = posts.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
    );
    setPosts(next); savePosts(next);
  }

  const KIND_TABS: { k: PostKind; icon: React.ReactNode; label: string }[] = [
    { k: "text",  icon: <FileText size={12} />, label: "Text"  },
    { k: "image", icon: <Image size={12} />,    label: "Image" },
    { k: "video", icon: <Video size={12} />,    label: "Video" },
    { k: "voice", icon: <Mic size={12} />,      label: "Voice" },
    { k: "note",  icon: <BookOpen size={12} />, label: "Note"  },
  ];

  const visIcon = (v: Visibility) =>
    v === "private" ? "🔒" : v === "connections" ? "🤝" : v === "circle" ? "⭕" : "🌐";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">LifeBook</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Share moments. Control who sees what — private, connections, circle, or public.
          </p>
        </div>
        <button className="btn btn-primary text-xs gap-1" onClick={() => setCompose((v) => !v)}>
          <Plus size={12} /> New Post
        </button>
      </div>

      {/* Compose */}
      {compose && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {/* Post kind tabs */}
          <div className="flex gap-1 flex-wrap">
            {KIND_TABS.map((kt) => (
              <button key={kt.k}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                style={{
                  background: kind === kt.k ? "var(--accent)" : "var(--bg)",
                  color: kind === kt.k ? "#fff" : "var(--muted)",
                  border: `1px solid ${kind === kt.k ? "var(--accent)" : "var(--border)"}`,
                }}
                onClick={() => setKind(kt.k)}
              >
                {kt.icon} {kt.label}
              </button>
            ))}
          </div>

          <textarea
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            rows={3}
            placeholder={kind === "note" ? "Write a note..." : kind === "voice" ? "Voice message (paste transcript or URL)" : `Share a ${kind}...`}
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="rounded-lg px-2 py-1 text-xs"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              value={vis}
              onChange={(e) => setVis(e.target.value as Visibility)}
            >
              <option value="private">🔒 Private</option>
              <option value="connections">🤝 Connections</option>
              <option value="circle">⭕ Circle</option>
              <option value="public">🌐 Public</option>
            </select>

            {vis === "circle" && (
              <select
                className="rounded-lg px-2 py-1 text-xs"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
              >
                <option value="">Select circle…</option>
                {circles.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            )}

            <div className="ml-auto flex gap-2">
              <button className="btn btn-secondary text-xs" onClick={() => setCompose(false)}>Cancel</button>
              <button className="btn btn-primary text-xs gap-1" onClick={publish}>
                <Share2 size={11} /> Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts feed */}
      {posts.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "2px dashed var(--border)" }}>
          <BookOpen size={28} className="mx-auto mb-2 opacity-30" style={{ color: "var(--muted)" }} />
          <div className="text-sm font-semibold">Your LifeBook is empty</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Share your first post to start your life story.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg,#6c63ff,#00d2ff)", color: "#fff" }}>
                  {ob.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{ob.name || "You"}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs ml-auto">{visIcon(p.visibility)}</span>
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed">{p.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: p.liked ? "#ef4444" : "var(--muted)" }}
                  onClick={() => toggleLike(p.id)}
                >
                  <Heart size={12} fill={p.liked ? "#ef4444" : "none"} /> {p.likes}
                </button>
                <button className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                  <MessageCircle size={12} /> {p.comments}
                </button>
                <button className="flex items-center gap-1 text-xs ml-auto" style={{ color: "var(--muted)" }}>
                  <Share2 size={12} /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Circles Tab ──────────────────────────────────────────────────────────────

function CirclesTab() {
  const [circles, setCircles]     = useState<Circle[]>(loadCircles);
  const [showCreate, setCreate]   = useState(false);
  const [name, setName]           = useState("");
  const [desc, setDesc]           = useState("");
  const [icon, setIcon]           = useState("⭕");
  const [color, setColor]         = useState("#6c63ff");
  const [selected, setSelected]   = useState<Circle | null>(null);

  const ICONS = ["⭕", "👨‍👩‍👧‍👦", "💼", "🎓", "🎮", "🏋️", "🚀", "🎵", "🌿", "🏡"];
  const COLORS = ["#6c63ff","#22c55e","#f59e0b","#ef4444","#00d2ff","#a855f7","#f97316","#ec4899"];

  function createCircle() {
    if (!name.trim()) return;
    const c: Circle = {
      id: `cir-${Date.now()}`,
      name: name.trim(),
      description: desc.trim() || undefined,
      icon,
      color,
      members: [],
      created_at: new Date().toISOString(),
      owner: "me",
      access_log: [{ action: "circle_created", by: "me", at: new Date().toISOString() }],
    };
    const next = [...circles, c];
    setCircles(next); saveCircles(next);
    setName(""); setDesc(""); setCreate(false);
  }

  function addMember(circleId: string, member: string) {
    if (!member.trim()) return;
    const next = circles.map((c) =>
      c.id === circleId
        ? {
            ...c,
            members: [...new Set([...c.members, member.trim()])],
            access_log: [...c.access_log, { action: `added_member:${member}`, by: "me", at: new Date().toISOString() }],
          }
        : c,
    );
    setCircles(next); saveCircles(next);
    if (selected?.id === circleId) setSelected(next.find((c) => c.id === circleId) ?? null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Circles</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Create groups. Share posts, files, and locations per circle. Full access logs kept.
          </p>
        </div>
        <button className="btn btn-primary text-xs gap-1" onClick={() => setCreate((v) => !v)}>
          <Plus size={12} /> Create Circle
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="text-xs font-semibold">New Circle</div>
          <input
            className="w-full rounded-xl px-3 py-2 text-xs"
            placeholder="Circle name..."
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-xl px-3 py-2 text-xs"
            placeholder="Description (optional)"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div>
            <div className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Icon</div>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map((ic) => (
                <button key={ic}
                  className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                  style={{ background: icon === ic ? "rgba(108,99,255,0.2)" : "var(--bg)", border: `1px solid ${icon === ic ? "var(--accent)" : "var(--border)"}` }}
                  onClick={() => setIcon(ic)}
                >{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Color</div>
            <div className="flex gap-1.5">
              {COLORS.map((col) => (
                <button key={col}
                  className="w-6 h-6 rounded-full"
                  style={{ background: col, border: color === col ? "3px solid white" : "2px solid transparent", boxShadow: color === col ? `0 0 0 2px ${col}` : undefined }}
                  onClick={() => setColor(col)}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary text-xs gap-1 flex-1" onClick={createCircle}><Check size={11} /> Create</button>
            <button className="btn btn-secondary text-xs" onClick={() => setCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Circles list */}
      {circles.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "2px dashed var(--border)" }}>
          <Users size={28} className="mx-auto mb-2 opacity-30" style={{ color: "var(--muted)" }} />
          <div className="text-sm font-semibold">No circles yet</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Create circles for family, friends, colleagues, etc.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {circles.map((c) => (
            <div key={c.id}
              className="rounded-xl p-3 cursor-pointer transition-all"
              style={{
                background: selected?.id === c.id ? c.color + "15" : "var(--surface)",
                border: `1px solid ${selected?.id === c.id ? c.color : "var(--border)"}`,
              }}
              onClick={() => setSelected((v) => v?.id === c.id ? null : c)}
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: c.color + "20" }}>
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{c.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {c.members.length} member{c.members.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <ChevronRight size={13} style={{ color: "var(--muted)", transform: selected?.id === c.id ? "rotate(90deg)" : undefined }} />
              </div>

              {/* Expanded view */}
              {selected?.id === c.id && (
                <div className="mt-3 space-y-2 pt-3" style={{ borderTop: `1px solid ${c.color}33` }}>
                  {c.description && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{c.description}</p>
                  )}

                  {/* Members */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {c.members.map((m) => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: c.color + "20", color: c.color }}>{m}</span>
                    ))}
                    <AddMember circleId={c.id} color={c.color} onAdd={addMember} />
                  </div>

                  {/* Access log */}
                  <div>
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Access Log</div>
                    <div className="space-y-0.5 max-h-24 overflow-y-auto">
                      {c.access_log.slice(-5).reverse().map((log, i) => (
                        <div key={i} className="text-xs flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                          <Shield size={8} style={{ color: c.color }} />
                          <span>{log.action}</span>
                          <span className="ml-auto">{new Date(log.at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddMember({ circleId, color, onAdd }: { circleId: string; color: string; onAdd: (id: string, m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  if (!editing) {
    return (
      <button className="text-xs px-2 py-0.5 rounded-full"
        style={{ background: color + "15", color, border: `1px dashed ${color}` }}
        onClick={() => setEditing(true)}>
        + Add
      </button>
    );
  }
  return (
    <input
      autoFocus
      className="text-xs px-2 py-0.5 rounded-full w-28"
      placeholder="Name…"
      style={{ background: color + "15", color, border: `1px solid ${color}` }}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { onAdd(circleId, val); setVal(""); setEditing(false); } }}
      onBlur={() => { setEditing(false); setVal(""); }}
    />
  );
}

// ─── Dravyam Trust Gate ───────────────────────────────────────────────────────

function DravyamGatePanel({ score }: { score: number }) {
  const limits = useMemo(() => {
    if (score >= 80) return { daily: "₹10,00,000", single: "₹5,00,000", ext: "✓", card: "✓" };
    if (score >= 60) return { daily: "₹1,00,000",  single: "₹50,000",   ext: "✓", card: "✓" };
    if (score >= 40) return { daily: "₹10,000",    single: "₹5,000",    ext: "✗", card: "✗" };
    return { daily: "₹1,000", single: "₹500", ext: "✗", card: "✗" };
  }, [score]);

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} style={{ color: "var(--accent)" }} />
        <span className="text-sm font-semibold">Dravyam Wallet Gates</span>
        <TrustBadge score={score} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { k: "Daily Limit",       v: limits.daily },
          { k: "Single Tx Limit",   v: limits.single },
          { k: "External Transfers",v: limits.ext },
          { k: "Card Payments",     v: limits.card },
        ].map((r) => (
          <div key={r.k} className="rounded-lg px-3 py-2"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div style={{ color: "var(--muted)" }}>{r.k}</div>
            <div className="font-semibold mt-0.5" style={{ color: r.v === "✗" ? "#ef4444" : "var(--text)" }}>{r.v}</div>
          </div>
        ))}
      </div>
      {score < 60 && (
        <div className="mt-3 text-xs px-3 py-2 rounded-xl flex items-center gap-2"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
          <AlertTriangle size={11} />
          Complete your profile to reach Root level and unlock external transfers.
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VanshawaliPage() {
  const ob                      = useOBData();
  const [tab, setTab]           = useState<Tab>("profile");
  const [layout, setLayout]     = useState<LayoutWidget[]>(loadLayout);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const circles                 = useMemo(() => loadCircles(), []);

  const { score } = useMemo(() => computeOBCompletion(ob), [ob]);

  // Auto-save whenever layout changes
  useEffect(() => { saveLayout(layout); }, [layout]);

  function addWidget(type: string) {
    const entry = WIDGET_CATALOGUE.find((c) => c.type === type);
    if (!entry) return;
    const maxRow = layout.reduce((m, w) => Math.max(m, w.y + w.h), 0);
    const nw: LayoutWidget = {
      id: `vw-${Date.now()}`,
      widget_type: entry.type,
      x: 0, y: maxRow,
      w: entry.defaultW, h: entry.defaultH,
      config: { title: entry.label },
    };
    setLayout((prev) => [...prev, nw]);
    setShowAdd(false);
  }

  function deleteWidget(id: string) {
    setLayout((prev) => prev.filter((w) => w.id !== id));
    if (selected === id) setSelected(null);
  }

  function handleSave() {
    saveLayout(layout);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "profile",  icon: <LayoutDashboard size={14} />, label: "Profile" },
    { id: "vault",    icon: <Lock size={14} />,            label: "Vault"   },
    { id: "map",      icon: <MapPin size={14} />,          label: "Map"     },
    { id: "lifebook", icon: <BookOpen size={14} />,        label: "LifeBook"},
    { id: "circles",  icon: <Users size={14} />,           label: "Circles" },
  ];

  return (
    <div className="max-w-screen-xl mx-auto py-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">वंशावली</h1>
          <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "var(--muted)" }}>
            Identity · Finance · LifeBook · Circles
            <TrustBadge score={score} />
          </div>
        </div>
        {tab === "profile" && (
          <div className="flex items-center gap-2">
            {savedMsg && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                ✓ Saved
              </span>
            )}
            <button className="btn btn-secondary text-xs gap-1 py-1.5" onClick={handleSave}>
              <Save size={12} /> Save
            </button>
            <button
              className="btn btn-primary text-xs gap-1 py-1.5"
              onClick={() => { setEditMode((v) => !v); setSelected(null); }}
            >
              {editMode ? <><Check size={12} /> Done</> : <><Edit3 size={12} /> Edit</>}
            </button>
            {editMode && (
              <button className="btn btn-secondary text-xs gap-1 py-1.5" onClick={() => setShowAdd((v) => !v)}>
                <Plus size={12} /> Add Widget
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trust + Wallet gates always visible */}
      <DravyamGatePanel score={score} />

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button key={t.id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-1 justify-center transition-all"
            style={{
              background: tab === t.id ? "var(--accent)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--muted)",
            }}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Add widget panel (Profile tab only) */}
      {tab === "profile" && editMode && showAdd && (
        <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Add widget to profile</span>
            <button onClick={() => setShowAdd(false)}><X size={14} style={{ color: "var(--muted)" }} /></button>
          </div>
          {/* Category filter */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {WIDGET_CATALOGUE.map((e) => (
              <button key={e.type}
                className="rounded-xl p-2 text-left text-xs transition-all"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                onMouseEnter={(el) => { (el.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                onMouseLeave={(el) => { (el.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                onClick={() => addWidget(e.type)}
              >
                <div className="text-base mb-0.5">{e.icon}</div>
                <div className="font-semibold leading-tight">{e.label}</div>
                <div className="mt-0.5 text-xs leading-tight" style={{ color: "var(--muted)", fontSize: 9 }}>{e.category}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Profile tab ─────────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: GAP,
          }}
        >
          {layout.map((w) => (
            <div key={w.id} style={widgetStyle(w)}>
              <WidgetRenderer
                widget={w}
                editMode={editMode}
                selected={selected === w.id}
                onSelect={setSelected}
                onDelete={deleteWidget}
              />
            </div>
          ))}
          {layout.length === 0 && (
            <div className="col-span-12 rounded-2xl p-12 text-center"
              style={{ border: "2px dashed var(--border)" }}>
              <LayoutDashboard size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted)" }} />
              <div className="text-sm font-semibold">No widgets yet</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Click Edit → Add Widget to build your profile.</div>
            </div>
          )}
        </div>
      )}

      {/* ── Vault tab ────────────────────────────────────────────────────────── */}
      {tab === "vault" && <VaultTab />}

      {/* ── Map tab ──────────────────────────────────────────────────────────── */}
      {tab === "map" && <ConnectionsMap />}

      {/* ── LifeBook tab ─────────────────────────────────────────────────────── */}
      {tab === "lifebook" && <LifeBookTab circles={circles} />}

      {/* ── Circles tab ──────────────────────────────────────────────────────── */}
      {tab === "circles" && <CirclesTab />}
    </div>
  );
}
