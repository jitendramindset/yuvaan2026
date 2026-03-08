"use client";
/**
 * CircleWidget — groups with permission, expiry, and access-log model.
 * Create circles, add members, post to circles with visibility control.
 * All posts are SHA-256 fingerprinted; access is node-score gated.
 */
import { useState } from "react";
import {
  Users, Plus, X, Lock, Globe, Timer, Shield,
  Hash as HashIcon, Check, AlertTriangle,
  UserPlus, Settings, ChevronRight, BarChart2,
} from "lucide-react";
import { hashContent, defaultSecuredItem, checkAccess, destroyInstance, type SecuredItem } from "@/hooks/useNodeSecurity";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CircleMember { id: string; name: string; role: "admin" | "member"; joined_at: string }

export interface Circle {
  id:          string;
  name:        string;
  emoji:       string;
  color:       string;
  description: string;
  members:     CircleMember[];
  created_at:  string;
}

export interface CirclePost {
  id:          string;
  circle_id:   string;
  content:     string;
  author_name: string;
  created_at:  string;
  security:    SecuredItem;
  likes:       number;
  liked:       boolean;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const CIRCLES_KEY      = "nodeos-circles";
const CIRCLE_POSTS_KEY = "nodeos-circle-posts";

function loadCircles(): Circle[] {
  try { const r = localStorage.getItem(CIRCLES_KEY); return r ? JSON.parse(r) : DEFAULT_CIRCLES; }
  catch { return DEFAULT_CIRCLES; }
}
function saveCircles(c: Circle[]) { try { localStorage.setItem(CIRCLES_KEY, JSON.stringify(c)); } catch { /**/ } }
function loadCirclePosts(): CirclePost[] {
  try { const r = localStorage.getItem(CIRCLE_POSTS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveCirclePosts(p: CirclePost[]) { try { localStorage.setItem(CIRCLE_POSTS_KEY, JSON.stringify(p)); } catch { /**/ } }

// ─── Default circles ──────────────────────────────────────────────────────────

const DEFAULT_CIRCLES: Circle[] = [
  {
    id: "c-family", name: "Family", emoji: "🏠", color: "#22c55e",
    description: "Private family circle — close family only",
    members: [{ id: "m1", name: "Arjun (Father)", role: "member", joined_at: new Date().toISOString() }],
    created_at: new Date().toISOString(),
  },
  {
    id: "c-friends", name: "Friends", emoji: "👥", color: "#6c63ff",
    description: "Close friends and trusted connections",
    members: [{ id: "m2", name: "Priya M.", role: "member", joined_at: new Date().toISOString() }],
    created_at: new Date().toISOString(),
  },
  {
    id: "c-work", name: "Work", emoji: "💼", color: "#f59e0b",
    description: "Professional colleagues and work contacts",
    members: [{ id: "m3", name: "Rahul K.", role: "member", joined_at: new Date().toISOString() }],
    created_at: new Date().toISOString(),
  },
];

// Emoji options for circle creation
const EMOJIS  = ["🏠","👥","💼","🎓","⚽","🎵","🌿","🔬","🎨","✈️","💡","🎯"];
const COLORS  = ["#6c63ff","#22c55e","#f59e0b","#ef4444","#00d2ff","#a855f7","#f97316","#ec4899"];

// ─── Circle Post Card ─────────────────────────────────────────────────────────

function CirclePostCard({ post, onDelete }: { post: CirclePost; onDelete: (id: string) => void }) {
  const result = checkAccess(post.security, 420, "current_user", []);
  const denied  = !result.allowed;
  const expired = !result.allowed && result.reason === "expired";

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg)", border: "1px solid var(--border)", opacity: denied ? 0.55 : 1 }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#6c63ff,#00d2ff)", color: "#fff" }}>
          {post.author_name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold">{post.author_name}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>{new Date(post.created_at).toLocaleTimeString()}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {post.security.expires_at && (
            <span className="text-xs rounded-full px-1.5 py-0.5 flex items-center gap-0.5"
              style={{ background: expired ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: expired ? "#ef4444" : "#f59e0b" }}>
              <Timer size={9} /> {expired ? "Expired" : "Expires"}
            </span>
          )}
          <button className="p-1" style={{ color: "var(--muted)" }} onClick={() => onDelete(post.id)}>
            <X size={11} />
          </button>
        </div>
      </div>

      {denied ? (
        <div className="text-xs text-center py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.07)", color: "#ef4444" }}>
          <AlertTriangle size={12} className="inline mr-1" />
          {expired ? "Expired — instance destroyed" : "Access denied"}
          {expired && <button className="ml-2 underline" onClick={() => destroyInstance(post.id)}>Destroy</button>}
        </div>
      ) : (
        <>
          <p className="text-xs leading-relaxed">{post.content}</p>
          <div className="flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--border)", paddingTop: 6 }}>
            <span style={{ color: "var(--muted)" }}>♥ {post.likes}</span>
            <span className="flex items-center gap-1" style={{ color: "var(--border)", fontFamily: "monospace", fontSize: 9 }}>
              <HashIcon size={8} />{post.security.hash.slice(0, 8)}…
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Circle Detail view ───────────────────────────────────────────────────────

function CircleDetail({ circle, onBack }: { circle: Circle; onBack: () => void }) {
  const [posts, setPosts]       = useState<CirclePost[]>(() => loadCirclePosts().filter((p) => p.circle_id === circle.id));
  const [content, setContent]   = useState("");
  const [expiry, setExpiry]     = useState("");
  const [scoreMin, setScoreMin] = useState(0);
  const [showAdv, setShowAdv]   = useState(false);
  const [addMember, setAddMember] = useState(false);
  const [newName, setNewName]   = useState("");
  const [members, setMembers]   = useState<CircleMember[]>(circle.members);

  async function postToCircle() {
    if (!content.trim()) return;
    const h = await hashContent(content + circle.id + Date.now());
    const security: SecuredItem = {
      ...defaultSecuredItem(),
      hash: h,
      visibility: "circle",
      circle_ids: [circle.id],
      expires_at: expiry || null,
      node_score_min: scoreMin,
    };
    const p: CirclePost = {
      id: `cp-${Date.now()}`, circle_id: circle.id,
      content, author_name: "You",
      created_at: new Date().toISOString(),
      security, likes: 0, liked: false,
    };
    const allPosts = [p, ...loadCirclePosts()];
    saveCirclePosts(allPosts);
    setPosts(allPosts.filter((x) => x.circle_id === circle.id));
    setContent(""); setExpiry(""); setScoreMin(0);
  }

  function deletePost(id: string) {
    const all = loadCirclePosts().filter((p) => p.id !== id);
    saveCirclePosts(all);
    setPosts(all.filter((p) => p.circle_id === circle.id));
    destroyInstance(id);
  }

  function addMemberFn() {
    if (!newName.trim()) return;
    const m: CircleMember = { id: `m-${Date.now()}`, name: newName, role: "member", joined_at: new Date().toISOString() };
    const updated = [...members, m];
    setMembers(updated);
    circle.members = updated;
    const all = loadCircles().map((c) => c.id === circle.id ? { ...c, members: updated } : c);
    saveCircles(all);
    setNewName(""); setAddMember(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <ChevronRight size={13} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: circle.color + "20", border: `1px solid ${circle.color}44` }}>{circle.emoji}</div>
        <div>
          <div className="font-semibold text-sm">{circle.name}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>{members.length} members · {posts.length} posts</div>
        </div>
        <button className="ml-auto p-2 rounded-xl text-xs flex items-center gap-1"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}
          onClick={() => setAddMember(true)}>
          <UserPlus size={12} /> Add
        </button>
      </div>

      {/* Members strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {members.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: circle.color + "22", color: circle.color }}>{m.name.charAt(0)}</div>
            <div className="text-xs truncate" style={{ maxWidth: 50, color: "var(--muted)", fontSize: 9 }}>{m.name.split(" ")[0]}</div>
          </div>
        ))}
        <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--bg)", border: "1px dashed var(--border)", color: "var(--muted)" }}
          onClick={() => setAddMember(true)}><Plus size={12} /></button>
      </div>

      {/* Add member form */}
      {addMember && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            className="flex-1 text-xs" style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)" }}
            placeholder="Member name…" onKeyDown={(e) => e.key === "Enter" && addMemberFn()} />
          <button className="btn btn-primary text-xs py-1 px-2" onClick={addMemberFn}><Check size={11} /></button>
          <button className="p-1" style={{ color: "var(--muted)" }} onClick={() => setAddMember(false)}><X size={11} /></button>
        </div>
      )}

      {/* Composer */}
      <div className="rounded-xl p-3 space-y-2.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <textarea className="w-full rounded-lg px-3 py-2 text-xs resize-none"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", minHeight: 70, color: "var(--text)" }}
          placeholder={`Post to ${circle.name} circle…`} value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
            <Lock size={10} /> Circle only
          </div>
          <button className="text-xs flex items-center gap-1 ml-auto" style={{ color: "var(--muted)" }}
            onClick={() => setShowAdv((v) => !v)}>
            <Shield size={10} /> Security
          </button>
        </div>
        {showAdv && (
          <div className="space-y-2 rounded-xl px-3 py-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 text-xs">
              <Timer size={10} style={{ color: "var(--muted)" }} />
              <span style={{ color: "var(--muted)" }}>Expires:</span>
              <input type="date" className="ml-auto text-xs rounded px-2 py-0.5"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                value={expiry ? expiry.slice(0, 10) : ""}
                onChange={(e) => setExpiry(e.target.value ? new Date(e.target.value).toISOString() : "")} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <BarChart2 size={10} style={{ color: "var(--muted)" }} />
              <span style={{ color: "var(--muted)" }}>Min karma:</span>
              <input type="number" min={0} max={1000}
                className="ml-auto text-xs rounded px-2 py-0.5 w-16 text-center"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                value={scoreMin} onChange={(e) => setScoreMin(Number(e.target.value))} />
            </div>
          </div>
        )}
        <button className="btn btn-primary text-xs w-full gap-1" onClick={postToCircle} disabled={!content.trim()}>
          <Globe size={11} /> Post to Circle
        </button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
          <div className="text-2xl mb-1">{circle.emoji}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>No posts in this circle yet</div>
        </div>
      ) : (
        <div className="space-y-2">{posts.map((p) => <CirclePostCard key={p.id} post={p} onDelete={deletePost} />)}</div>
      )}
    </div>
  );
}

// ─── Create Circle form ───────────────────────────────────────────────────────

function CreateCircleForm({ onDone }: { onDone: (c: Circle) => void }) {
  const [name, setName]   = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [color, setColor] = useState(COLORS[0]);
  const [desc, setDesc]   = useState("");

  function create() {
    if (!name.trim()) return;
    const c: Circle = {
      id: `c-${Date.now()}`, name, emoji, color, description: desc,
      members: [{ id: "me", name: "You", role: "admin", joined_at: new Date().toISOString() }],
      created_at: new Date().toISOString(),
    };
    const all = [...loadCircles(), c];
    saveCircles(all);
    onDone(c);
  }

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="text-sm font-semibold flex items-center gap-2"><Users size={14} style={{ color: "var(--accent)" }} /> New Circle</div>
      <div className="flex gap-2">
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button key={e} className="w-8 h-8 rounded-lg text-lg flex items-center justify-center"
              style={{ background: emoji === e ? "var(--accent)" : "var(--bg)", border: `1px solid ${emoji === e ? "var(--accent)" : "var(--border)"}` }}
              onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>
      </div>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-xs"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
        placeholder="Circle name" />
      <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-xs"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
        placeholder="Description (optional)" />
      <div className="flex gap-1.5 flex-wrap">
        {COLORS.map((c) => (
          <button key={c} className="w-6 h-6 rounded-full transition-all"
            style={{ background: c, outline: color === c ? `2px solid #fff` : "none", outlineOffset: 2 }}
            onClick={() => setColor(c)} />
        ))}
      </div>
      <button className="btn btn-primary text-xs w-full gap-1" onClick={create} disabled={!name.trim()}>
        <Plus size={12} /> Create Circle
      </button>
    </div>
  );
}

// ─── CircleWidget (default export) ───────────────────────────────────────────

export function CircleWidget({ config: _c }: { config: Record<string, unknown> }) {
  const [circles, setCircles]   = useState<Circle[]>(() => loadCircles());
  const [selected, setSelected] = useState<Circle | null>(null);
  const [creating, setCreating] = useState(false);

  function onCreated(c: Circle) { setCircles(loadCircles()); setCreating(false); setSelected(c); }

  if (selected) return <CircleDetail circle={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center gap-2"><Users size={14} style={{ color: "var(--accent)" }} /> Circles</span>
        <button className="btn btn-primary text-xs gap-1" onClick={() => setCreating((v) => !v)}>
          {creating ? <X size={11} /> : <Plus size={11} />} {creating ? "Cancel" : "New Circle"}
        </button>
      </div>

      {creating && <CreateCircleForm onDone={onCreated} />}

      <div className="grid grid-cols-1 gap-3">
        {circles.map((c) => {
          const postCount = loadCirclePosts().filter((p) => p.circle_id === c.id).length;
          return (
            <button key={c.id}
              className="rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
              style={{ background: "var(--surface)", border: `1px solid ${c.color}33`, cursor: "pointer" }}
              onClick={() => setSelected(c)}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: c.color + "18", border: `1px solid ${c.color}33` }}>{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.description}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs flex items-center gap-1" style={{ color: c.color }}>
                      <Users size={10} /> {c.members.length} members
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                      🗒 {postCount} posts
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                      <Lock size={9} /> Circle only
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
              </div>
            </button>
          );
        })}
      </div>

      {circles.length === 0 && !creating && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
          <Users size={28} className="mx-auto mb-2 opacity-25" style={{ color: "var(--muted)" }} />
          <div className="text-sm" style={{ color: "var(--muted)" }}>No circles yet</div>
          <div className="text-xs mt-1" style={{ color: "var(--border)" }}>Create your first circle above</div>
        </div>
      )}
    </div>
  );
}

export { Settings };
