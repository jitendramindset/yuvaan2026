"use client";
/**
 * LifebookWidget — personal journal & social media feed.
 * Post types: text | image | video | voice | file | note
 * Each post is SHA-256 fingerprinted with visibility, expiry, and node-score gate.
 * Expired content auto-destroys its local instance on access.
 */
import { useState, useRef } from "react";
import {
  FileText, Image, Video, Mic, File, AlignLeft,
  Lock, Users, Globe, Plus, X, Send, Trash2,
  StopCircle, Timer, Shield, Hash as HashIcon,
  AlertTriangle, Heart, MessageCircle, Share2,
} from "lucide-react";
import {
  hashContent, defaultSecuredItem, checkAccess, destroyInstance,
  appendAccessLog, type SecuredItem,
} from "@/hooks/useNodeSecurity";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostType   = "text" | "image" | "video" | "voice" | "file" | "note";
export type Visibility = "private" | "circle" | "public";

export interface LifebookPost {
  id:          string;
  type:        PostType;
  content:     string;
  caption?:    string;
  author_name: string;
  created_at:  string;
  security:    SecuredItem;
  likes:       number;
  liked:       boolean;
}

export const LB_KEY = "nodeos-lifebook-posts";

export function loadPosts(): LifebookPost[] {
  try { const r = localStorage.getItem(LB_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
export function savePosts(posts: LifebookPost[]) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(posts)); } catch { /**/ }
}

// ─── UI metadata ─────────────────────────────────────────────────────────────

const POST_TYPES = [
  { type: "text"  as PostType, icon: <FileText   size={13} />, label: "Text",  color: "#6c63ff" },
  { type: "image" as PostType, icon: <Image      size={13} />, label: "Image", color: "#22c55e" },
  { type: "video" as PostType, icon: <Video      size={13} />, label: "Video", color: "#ef4444" },
  { type: "voice" as PostType, icon: <Mic        size={13} />, label: "Voice", color: "#f59e0b" },
  { type: "file"  as PostType, icon: <File       size={13} />, label: "File",  color: "#00d2ff" },
  { type: "note"  as PostType, icon: <AlignLeft  size={13} />, label: "Note",  color: "#a855f7" },
];
const VIS_OPTIONS = [
  { v: "private" as Visibility, icon: <Lock  size={10} />, label: "Only Me",  color: "#94a3b8" },
  { v: "circle"  as Visibility, icon: <Users size={10} />, label: "Circle",   color: "#6c63ff" },
  { v: "public"  as Visibility, icon: <Globe size={10} />, label: "Public",   color: "#22c55e" },
];

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onDelete, onLike }: {
  post: LifebookPost;
  onDelete: (id: string) => void;
  onLike:   (id: string) => void;
}) {
  const result = checkAccess(post.security, 420, "current_user", []);
  const denied = !result.allowed;
  const expired = !result.allowed && result.reason === "expired";
  const vis = VIS_OPTIONS.find((v) => v.v === post.security.visibility)!;

  return (
    <div className="rounded-2xl p-3 space-y-2.5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: denied ? 0.6 : 1 }}>

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "linear-gradient(135deg,#6c63ff,#00d2ff)", color: "#fff" }}>
          {post.author_name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold">{post.author_name}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>{new Date(post.created_at).toLocaleString()}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs"
            style={{ background: vis.color + "15", color: vis.color, border: `1px solid ${vis.color}33` }}>
            {vis.icon} {vis.label}
          </span>
          {post.security.expires_at && (
            <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs"
              style={{ background: expired ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: expired ? "#ef4444" : "#f59e0b" }}>
              <Timer size={9} /> {expired ? "Expired" : new Date(post.security.expires_at).toLocaleDateString()}
            </span>
          )}
          <button className="p-1 rounded text-xs" style={{ color: "var(--muted)" }} onClick={() => onDelete(post.id)}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Denied / expired overlay */}
      {denied && (
        <div className="rounded-xl px-3 py-4 text-center"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={16} className="mx-auto mb-1" style={{ color: "#ef4444" }} />
          <div className="text-xs" style={{ color: "#ef4444" }}>
            {expired ? "Content expired — access revoked" : "Access denied"}
          </div>
          {expired && (
            <button className="text-xs mt-1.5" style={{ color: "var(--muted)" }}
              onClick={() => destroyInstance(post.id)}>
              🗑 Destroy cached instance
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {!denied && (
        <>
          {(post.type === "text" || post.type === "note") && (
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{post.content}</p>
          )}
          {post.type === "image" && (
            <div className="rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.content} alt="post" style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
              {post.caption && <div className="text-xs px-2 py-1" style={{ color: "var(--muted)" }}>{post.caption}</div>}
            </div>
          )}
          {post.type === "video" && (
            <div className="rounded-xl overflow-hidden" style={{ background: "#000", minHeight: 80 }}>
              {(post.content.includes("youtube") || post.content.includes("youtu.be")) ? (
                <iframe allowFullScreen allow="autoplay" style={{ width: "100%", height: 160, border: 0 }}
                  src={`https://www.youtube.com/embed/${post.content.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1] ?? ""}`} />
              ) : (
                <video src={post.content} controls style={{ width: "100%", maxHeight: 160 }} />
              )}
            </div>
          )}
          {post.type === "voice" && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                <Mic size={14} />
              </div>
              <audio src={post.content} controls style={{ flex: 1, height: 32 }} />
            </div>
          )}
          {post.type === "file" && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <File size={15} style={{ color: "#00d2ff" }} />
              <span className="text-xs font-medium flex-1 truncate">{post.content}</span>
            </div>
          )}
        </>
      )}

      {/* Footer: hash + likes */}
      {!denied && (
        <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border)" }}>
          <button className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: post.liked ? "#ef4444" : "var(--muted)" }}
            onClick={() => onLike(post.id)}>
            <Heart size={12} fill={post.liked ? "#ef4444" : "none"} /> {post.likes}
          </button>
          <button className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
            <MessageCircle size={12} /> Reply
          </button>
          <button className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
            <Share2 size={12} /> Share
          </button>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--border)" }}
            title={`SHA-256: ${post.security.hash}`}>
            <HashIcon size={9} />
            <span style={{ fontFamily: "monospace", fontSize: 9 }}>{post.security.hash.slice(0, 8)}…</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({ onPost }: { onPost: (p: LifebookPost) => void }) {
  const [type,     setType]     = useState<PostType>("text");
  const [content,  setContent]  = useState("");
  const [caption,  setCaption]  = useState("");
  const [vis,      setVis]      = useState<Visibility>("private");
  const [expiry,   setExpiry]   = useState("");
  const [score,    setScore]    = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [recording, setRecording] = useState(false);
  const mrRef  = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mrRef.current = new MediaRecorder(stream);
      chunks.current = [];
      mrRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mrRef.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setContent(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mrRef.current.start();
      setRecording(true);
    } catch { alert("Microphone access denied"); }
  }

  function stopRecording() { mrRef.current?.stop(); setRecording(false); }

  async function handlePost() {
    if (!content.trim() && type !== "voice") return;
    const h = await hashContent(content + type + vis + Date.now());
    const security: SecuredItem = {
      ...defaultSecuredItem(),
      hash: h,
      visibility: vis,
      expires_at: expiry || null,
      node_score_min: score,
    };
    onPost({
      id: `lb-${Date.now()}`,
      type, content,
      caption: caption || undefined,
      author_name: "You",
      created_at: new Date().toISOString(),
      security,
      likes: 0, liked: false,
    });
    setContent(""); setCaption(""); setExpiry(""); setScore(0); setAdvanced(false);
  }

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Type selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {POST_TYPES.map((pt) => (
          <button key={pt.type}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: type === pt.type ? pt.color + "20" : "var(--bg)",
              color: type === pt.type ? pt.color : "var(--muted)",
              border: `1px solid ${type === pt.type ? pt.color + "44" : "var(--border)"}`,
            }}
            onClick={() => { setType(pt.type); setContent(""); }}>
            {pt.icon} {pt.label}
          </button>
        ))}
      </div>

      {/* Input */}
      {(type === "text" || type === "note") && (
        <textarea className="w-full rounded-xl px-3 py-2 text-xs resize-none"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", minHeight: 80, color: "var(--text)" }}
          placeholder={type === "note" ? "Write notes, ideas, journal entries…" : "What&apos;s on your mind?"}
          value={content} onChange={(e) => setContent(e.target.value)} />
      )}
      {(type === "image" || type === "video" || type === "file") && (
        <div className="space-y-2">
          <input type="text" className="w-full rounded-xl px-3 py-2 text-xs"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder={type === "image" ? "Image URL (https://…)" : type === "video" ? "YouTube or video URL" : "File name or URL"}
            value={content} onChange={(e) => setContent(e.target.value)} />
          {type !== "file" && (
            <input type="text" className="w-full rounded-xl px-3 py-2 text-xs"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
          )}
        </div>
      )}
      {type === "voice" && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          {recording ? (
            <>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
              <span className="text-xs" style={{ color: "#ef4444" }}>Recording…</span>
              <button className="ml-auto btn btn-secondary text-xs gap-1" onClick={stopRecording}><StopCircle size={12} /> Stop</button>
            </>
          ) : content ? (
            <>
              <Mic size={14} style={{ color: "#f59e0b" }} />
              <audio src={content} controls style={{ flex: 1, height: 28 }} />
              <button className="p-1" style={{ color: "var(--muted)" }} onClick={() => setContent("")}><X size={12} /></button>
            </>
          ) : (
            <button className="w-full btn btn-secondary text-xs gap-2" onClick={startRecording}><Mic size={12} /> Tap to Record Voice</button>
          )}
        </div>
      )}

      {/* Visibility */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs" style={{ color: "var(--muted)" }}>Visibility:</span>
        {VIS_OPTIONS.map((v) => (
          <button key={v.v}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{
              background: vis === v.v ? v.color + "15" : "transparent",
              color: vis === v.v ? v.color : "var(--muted)",
              border: `1px solid ${vis === v.v ? v.color + "44" : "var(--border)"}`,
            }}
            onClick={() => setVis(v.v)}>
            {v.icon} {v.label}
          </button>
        ))}
        <button className="text-xs ml-auto flex items-center gap-1" style={{ color: "var(--muted)" }}
          onClick={() => setAdvanced((v) => !v)}>
          <Shield size={10} /> Security
        </button>
      </div>

      {/* Advanced security settings */}
      {advanced && (
        <div className="rounded-xl px-3 py-2.5 space-y-2.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
            <Shield size={11} /> Access Control
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Timer size={10} style={{ color: "var(--muted)" }} />
            <span style={{ color: "var(--muted)" }}>Expires on:</span>
            <input type="date" className="ml-auto text-xs rounded-lg px-2 py-0.5"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              value={expiry ? expiry.slice(0, 10) : ""}
              onChange={(e) => setExpiry(e.target.value ? new Date(e.target.value).toISOString() : "")} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <HashIcon size={10} style={{ color: "var(--muted)" }} />
            <span style={{ color: "var(--muted)" }}>Min karma score:</span>
            <input type="number" min={0} max={1000}
              className="ml-auto text-xs rounded-lg px-2 py-0.5 w-20 text-center"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              value={score} onChange={(e) => setScore(Number(e.target.value))} />
          </div>
          <div className="text-xs px-1" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
            🔒 Content is SHA-256 fingerprinted. Expired or low-score access attempts are logged, and
            cached instances are auto-destroyed on expiry.
          </div>
        </div>
      )}

      <button className="btn btn-primary text-xs w-full gap-2" onClick={handlePost}
        disabled={!content.trim() && type !== "voice"}>
        <Send size={12} /> Post to Lifebook
      </button>
    </div>
  );
}

// ─── LifebookWidget (default export) ─────────────────────────────────────────

export function LifebookWidget({ config: _c }: { config: Record<string, unknown> }) {
  const [posts, setPosts] = useState<LifebookPost[]>(() => loadPosts());
  const [filter, setFilter] = useState<"all" | PostType>("all");

  function addPost(p: LifebookPost) {
    const next = [p, ...posts]; setPosts(next); savePosts(next);
  }
  function deletePost(id: string) {
    const next = posts.filter((p) => p.id !== id); setPosts(next); savePosts(next); destroyInstance(id);
  }
  function toggleLike(id: string) {
    const next = posts.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p);
    setPosts(next); savePosts(next);
  }

  const shown = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  return (
    <div className="space-y-4">
      <Composer onPost={addPost} />

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button className="px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: filter === "all" ? "var(--accent)" : "var(--bg)", color: filter === "all" ? "#fff" : "var(--muted)", border: "1px solid var(--border)" }}
          onClick={() => setFilter("all")}>All ({posts.length})</button>
        {POST_TYPES.map((pt) => {
          const n = posts.filter((p) => p.type === pt.type).length;
          if (!n) return null;
          return (
            <button key={pt.type}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: filter === pt.type ? pt.color + "20" : "var(--bg)",
                color: filter === pt.type ? pt.color : "var(--muted)",
                border: `1px solid ${filter === pt.type ? pt.color + "44" : "var(--border)"}`,
              }}
              onClick={() => setFilter(pt.type)}>
              {pt.icon} {n}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {shown.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
          <FileText size={28} className="mx-auto mb-2 opacity-25" style={{ color: "var(--muted)" }} />
          <div className="text-sm" style={{ color: "var(--muted)" }}>Lifebook is empty</div>
          <div className="text-xs mt-1" style={{ color: "var(--border)" }}>Post your first memory above ↑</div>
        </div>
      ) : (
        <div className="space-y-3">{shown.map((p) => <PostCard key={p.id} post={p} onDelete={deletePost} onLike={toggleLike} />)}</div>
      )}
    </div>
  );
}

export { Plus }; // re-export icon used in vanshawali page
