"use client";
/**
 * VaultWidget — three sub-views:
 *   1. Files — encrypted secure file store (hash-verified, expiry-gated)
 *   2. Map   — connection radar with distances + location sharing
 *   3. Family Tree — SVG family tree builder
 */
import { useState, useEffect } from "react";
import {
  Lock, FileText, Image, File, Key, Award, Trash2, Plus,
  MapPin, Navigation, Share2, Eye, EyeOff, Users,
  UserPlus, GitBranch, AlertTriangle, Shield, Hash as HashIcon,
  Timer, X, Check, ChevronDown,
} from "lucide-react";
import { hashContent, defaultSecuredItem, checkAccess, destroyInstance, type SecuredItem } from "@/hooks/useNodeSecurity";

// ─── Types ────────────────────────────────────────────────────────────────────

type FileType = "document" | "photo" | "certificate" | "id_card" | "note" | "key";

interface VaultEntry {
  id:            string;
  label:         string;
  type:          FileType;
  hash:          string;
  size_label:    string;
  created_at:    string;
  security:      SecuredItem;
  encrypted:     boolean;
}

interface Connection {
  id:               string;
  name:             string;
  karma:            number;
  city:             string;
  lat:              number;
  lon:              number;
  relation:         string;
  online:           boolean;
  shared_location:  boolean;
}

type FamilyRelation = "Father" | "Mother" | "Spouse" | "Child" | "Sibling" | "Grandpa" | "Grandma" | "Uncle" | "Aunt";
interface FamilyMember { id: string; name: string; relation: FamilyRelation; emoji: string; dob?: string }

// ─── Storage ──────────────────────────────────────────────────────────────────

const VAULT_KEY    = "nodeos-vault-files";
const FAMILY_KEY   = "nodeos-vault-family";
const LOCATION_KEY = "nodeos-vault-location";

function loadVault():  VaultEntry[]   { try { const r = localStorage.getItem(VAULT_KEY);  return r ? JSON.parse(r) : []; } catch { return []; } }
function saveVault(v: VaultEntry[])   { try { localStorage.setItem(VAULT_KEY,  JSON.stringify(v)); } catch { /**/ } }
function loadFamily(): FamilyMember[] { try { const r = localStorage.getItem(FAMILY_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveFamily(f: FamilyMember[]) { try { localStorage.setItem(FAMILY_KEY, JSON.stringify(f)); } catch { /**/ } }

// ─── Haversine distance (km) ──────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dO = (lon2 - lon1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Mock connections (with Indian cities) ───────────────────────────────────

const MOCK_CONNECTIONS: Connection[] = [
  { id: "c1", name: "Arjun S.",  karma: 380, city: "Mumbai",    lat: 19.076, lon: 72.877, relation: "Friend",    online: true,  shared_location: true  },
  { id: "c2", name: "Priya M.",  karma: 510, city: "Delhi",     lat: 28.679, lon: 77.209, relation: "Friend",    online: false, shared_location: false },
  { id: "c3", name: "Rahul K.",  karma: 290, city: "Bangalore", lat: 12.972, lon: 77.594, relation: "Colleague", online: true,  shared_location: true  },
  { id: "c4", name: "Sneha T.",  karma: 445, city: "Pune",      lat: 18.520, lon: 73.856, relation: "Friend",    online: false, shared_location: false },
  { id: "c5", name: "Vikram D.", karma: 320, city: "Chennai",   lat: 13.082, lon: 80.270, relation: "Family",    online: true,  shared_location: true  },
];

// ─── FILE TYPE META ───────────────────────────────────────────────────────────

const FILE_ICONS: Record<FileType, { icon: React.ReactNode; color: string }> = {
  document:    { icon: <FileText size={14} />, color: "#6c63ff" },
  photo:       { icon: <Image    size={14} />, color: "#22c55e" },
  certificate: { icon: <Award    size={14} />, color: "#f59e0b" },
  id_card:     { icon: <Shield   size={14} />, color: "#00d2ff" },
  note:        { icon: <FileText size={14} />, color: "#a855f7" },
  key:         { icon: <Key      size={14} />, color: "#ef4444" },
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 1 — Files
// ═══════════════════════════════════════════════════════════════════════════

function FilesView() {
  const [files, setFiles]   = useState<VaultEntry[]>(() => loadVault());
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ label: "", type: "document" as FileType, expiry: "", score: 0 });

  async function addFile() {
    if (!form.label.trim()) return;
    const h = await hashContent(form.label + form.type + Date.now());
    const entry: VaultEntry = {
      id:         `vf-${Date.now()}`,
      label:      form.label,
      type:       form.type,
      hash:       h,
      size_label: "—",
      created_at: new Date().toISOString(),
      encrypted:  true,
      security: {
        ...defaultSecuredItem(),
        hash: h,
        expires_at: form.expiry || null,
        node_score_min: form.score,
      },
    };
    const next = [entry, ...files];
    setFiles(next); saveVault(next);
    setForm({ label: "", type: "document", expiry: "", score: 0 }); setAdding(false);
  }

  function deleteFile(id: string) {
    const next = files.filter((f) => f.id !== id);
    setFiles(next); saveVault(next); destroyInstance(id);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
          <Lock size={11} /> {files.length} encrypted files
        </span>
        <button className="btn btn-primary text-xs gap-1 py-1" onClick={() => setAdding((v) => !v)}>
          {adding ? <X size={11} /> : <Plus size={11} />} {adding ? "Cancel" : "Add File"}
        </button>
      </div>

      {adding && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full rounded-lg px-3 py-1.5 text-xs"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="File / document name" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FileType })}
            className="w-full rounded-lg px-3 py-1.5 text-xs"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {(Object.keys(FILE_ICONS) as FileType[]).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={form.expiry ? form.expiry.slice(0, 10) : ""}
              onChange={(e) => setForm({ ...form, expiry: e.target.value ? new Date(e.target.value).toISOString() : "" })}
              className="flex-1 rounded-lg px-2 py-1.5 text-xs"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Expires (optional)" />
            <input type="number" min={0} max={1000} value={form.score}
              onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              className="w-24 rounded-lg px-2 py-1.5 text-xs text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Min karma" />
          </div>
          <button className="btn btn-primary text-xs w-full gap-1" onClick={addFile}><Lock size={11} /> Encrypt & Save</button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
          <Lock size={24} className="mx-auto mb-2 opacity-25" style={{ color: "var(--muted)" }} />
          <div className="text-xs" style={{ color: "var(--muted)" }}>Vault is empty. Add encrypted files above.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const result  = checkAccess(f.security, 420, "current_user", []);
            const denied  = !result.allowed;
            const expired = !result.allowed && result.reason === "expired";
            const meta    = FILE_ICONS[f.type];
            return (
              <div key={f.id} className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: "var(--bg)", border: `1px solid ${denied ? "rgba(239,68,68,0.3)" : "var(--border)"}`, opacity: denied ? 0.65 : 1 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: meta.color + "18", color: meta.color }}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{f.label}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs flex items-center gap-0.5" style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 9 }}>
                      <HashIcon size={8} />{f.hash.slice(0, 12)}…
                    </span>
                    {f.security.expires_at && (
                      <span className="text-xs flex items-center gap-0.5"
                        style={{ color: expired ? "#ef4444" : "#f59e0b" }}>
                        <Timer size={8} />{expired ? "Expired" : new Date(f.security.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {f.security.node_score_min > 0 && (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>⚡ {f.security.node_score_min}+ karma</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {denied ? (
                    <AlertTriangle size={13} style={{ color: "#ef4444" }} />
                  ) : (
                    <span className="badge badge-green text-xs flex items-center gap-0.5"><Lock size={8} /> Encrypted</span>
                  )}
                  <button className="p-1 rounded" style={{ color: "var(--muted)" }} onClick={() => deleteFile(f.id)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 2 — Connection Map / Radar
// ═══════════════════════════════════════════════════════════════════════════

function MapView() {
  const [myLat, setMyLat]         = useState<number | null>(null);
  const [myLon, setMyLon]         = useState<number | null>(null);
  const [sharing, setSharing]     = useState(false);
  const [locationError, setLocErr] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCATION_KEY);
      if (stored) { const d = JSON.parse(stored); setMyLat(d.lat); setMyLon(d.lon); setSharing(d.sharing); }
    } catch { /**/ }
  }, []);

  function shareLocation() {
    if (!navigator.geolocation) { setLocErr(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setMyLat(lat); setMyLon(lon); setSharing(true);
        try { localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lon, sharing: true })); } catch { /**/ }
      },
      () => setLocErr(true),
    );
  }

  function stopSharing() {
    setSharing(false);
    try {
      const stored = localStorage.getItem(LOCATION_KEY);
      if (stored) { const d = JSON.parse(stored); localStorage.setItem(LOCATION_KEY, JSON.stringify({ ...d, sharing: false })); }
    } catch { /**/ }
  }

  const baseLat = myLat ?? 19.076;
  const baseLon = myLon ?? 72.877;

  const withDist = MOCK_CONNECTIONS.map((c) => ({
    ...c,
    distance: Math.round(haversine(baseLat, baseLon, c.lat, c.lon)),
  })).sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-4">
      {/* Location sharing bar */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: sharing ? "rgba(34,197,94,0.1)" : "var(--bg)", border: `1px solid ${sharing ? "rgba(34,197,94,0.3)" : "var(--border)"}` }}>
        <Navigation size={14} style={{ color: sharing ? "#22c55e" : "var(--muted)" }} />
        <div className="flex-1">
          <div className="text-xs font-semibold">{sharing ? "Sharing location" : "Location not shared"}</div>
          {myLat && myLon && (
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {myLat.toFixed(3)}, {myLon.toFixed(3)}
            </div>
          )}
          {locationError && <div className="text-xs" style={{ color: "#ef4444" }}>Location access denied</div>}
        </div>
        {sharing ? (
          <button className="btn btn-secondary text-xs gap-1 py-1" onClick={stopSharing}><EyeOff size={11} /> Stop</button>
        ) : (
          <button className="btn btn-primary text-xs gap-1 py-1" onClick={shareLocation}><Share2 size={11} /> Share</button>
        )}
      </div>

      {/* Connection list with distances */}
      <div className="text-xs font-semibold flex items-center gap-1.5 mb-1" style={{ color: "var(--muted)" }}>
        <Users size={11} /> Connections ({withDist.length})
      </div>
      <div className="space-y-2">
        {withDist.map((c) => (
          <div key={c.id} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: c.online ? "rgba(34,197,94,0.15)" : "var(--surface)", color: c.online ? "#22c55e" : "var(--muted)" }}>
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{c.name}</span>
                <span className="badge badge-purple text-xs">{c.relation}</span>
                {c.online && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                <span className="flex items-center gap-0.5"><MapPin size={9} />{c.city}</span>
                <span>⚡ {c.karma}</span>
                {c.shared_location && (
                  <span className="flex items-center gap-0.5" style={{ color: "#22c55e" }}>
                    <Navigation size={9} /> {c.distance.toLocaleString()} km
                  </span>
                )}
              </div>
            </div>
            {c.shared_location ? (
              <span className="text-xs flex items-center gap-0.5" style={{ color: "#22c55e" }}>
                <Eye size={10} /> {c.distance.toLocaleString()} km
              </span>
            ) : (
              <span className="text-xs" style={{ color: "var(--muted)" }}>Location hidden</span>
            )}
          </div>
        ))}
      </div>

      {/* Simple SVG network / radar */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="text-xs px-3 pt-2 pb-1 font-semibold" style={{ color: "var(--muted)" }}>Network Radar</div>
        <svg viewBox="0 0 240 180" width="100%" style={{ display: "block" }}>
          {/* Rings */}
          {[40, 70, 100].map((r) => (
            <circle key={r} cx="120" cy="90" r={r} fill="none" stroke="var(--border)" strokeWidth="0.5" />
          ))}
          {/* Axes */}
          {[0, 60, 120, 180, 240, 300].map((a) => {
            const rad = (a * Math.PI) / 180;
            return <line key={a} x1="120" y1="90" x2={120 + 100 * Math.cos(rad)} y2={90 + 100 * Math.sin(rad)} stroke="var(--border)" strokeWidth="0.5" />;
          })}
          {/* Connection nodes */}
          {withDist.slice(0, 5).map((c, i) => {
            const angle = (i / 5) * 2 * Math.PI;
            const r = Math.min(95, 20 + c.distance / 30);
            const x = 120 + r * Math.cos(angle);
            const y = 90  + r * Math.sin(angle);
            return (
              <g key={c.id}>
                <line x1="120" y1="90" x2={x} y2={y} stroke={c.online ? "#22c55e33" : "var(--border)"} strokeWidth="1" strokeDasharray="3 2" />
                <circle cx={x} cy={y} r="6" fill={c.online ? "#22c55e" : "#94a3b8"} opacity="0.8" />
                <text x={x} y={y + 16} textAnchor="middle" fontSize="7" fill="var(--muted)">{c.name.split(" ")[0]}</text>
              </g>
            );
          })}
          {/* Me */}
          <circle cx="120" cy="90" r="8" fill="var(--accent)" />
          <text x="120" y="107" textAnchor="middle" fontSize="7" fill="var(--muted)">You</text>
        </svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 3 — Family Tree
// ═══════════════════════════════════════════════════════════════════════════

const REL_OPTIONS: Array<{ rel: FamilyRelation; emoji: string }> = [
  { rel: "Father",  emoji: "👨" }, { rel: "Mother",  emoji: "👩" },
  { rel: "Grandpa", emoji: "👴" }, { rel: "Grandma", emoji: "👵" },
  { rel: "Spouse",  emoji: "💑" }, { rel: "Sibling", emoji: "🧑" },
  { rel: "Child",   emoji: "👶" }, { rel: "Uncle",   emoji: "🧔" },
  { rel: "Aunt",    emoji: "👩" },
];

const ROW_ORDER: FamilyRelation[][] = [
  ["Grandpa", "Grandma"],
  ["Father", "Mother", "Uncle", "Aunt"],
  ["Sibling", "Spouse"],
  ["Child"],
];

function FamilyView() {
  const [members, setMembers] = useState<FamilyMember[]>(() => loadFamily());
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState<{ name: string; rel: FamilyRelation; dob: string }>({ name: "", rel: "Father", dob: "" });

  function addMember() {
    if (!form.name.trim()) return;
    const rel  = REL_OPTIONS.find((r) => r.rel === form.rel)!;
    const next: FamilyMember = { id: `fm-${Date.now()}`, name: form.name, relation: form.rel, emoji: rel.emoji, dob: form.dob || undefined };
    const updated = [...members, next]; setMembers(updated); saveFamily(updated);
    setForm({ name: "", rel: "Father", dob: "" }); setAdding(false);
  }

  function remove(id: string) { const n = members.filter((m) => m.id !== id); setMembers(n); saveFamily(n); }

  // Group members into tree rows
  const rows = ROW_ORDER.map((rels) => members.filter((m) => rels.includes(m.relation)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
          <GitBranch size={11} /> {members.length} family members
        </span>
        <button className="btn btn-primary text-xs gap-1 py-1" onClick={() => setAdding((v) => !v)}>
          {adding ? <X size={11} /> : <UserPlus size={11} />} {adding ? "Cancel" : "Add Member"}
        </button>
      </div>

      {adding && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg px-3 py-1.5 text-xs"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="Full name" />
          <div className="flex gap-2">
            <select value={form.rel} onChange={(e) => setForm({ ...form, rel: e.target.value as FamilyRelation })}
              className="flex-1 rounded-lg px-2 py-1.5 text-xs"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              {REL_OPTIONS.map((r) => <option key={r.rel} value={r.rel}>{r.emoji} {r.rel}</option>)}
            </select>
            <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="flex-1 rounded-lg px-2 py-1.5 text-xs"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <button className="btn btn-primary text-xs w-full gap-1" onClick={addMember}><Check size={11} /> Add to Family Tree</button>
        </div>
      )}

      {/* SVG Family Tree */}
      <div className="rounded-2xl overflow-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="p-4 space-y-4 min-w-max">
          {/* You — always first */}
          <div className="flex justify-center">
            <div className="rounded-2xl px-4 py-2 text-center"
              style={{ background: "var(--accent)", color: "#fff", border: "2px solid var(--accent)" }}>
              <div className="text-lg">⭐</div>
              <div className="text-xs font-bold">You</div>
              <div className="text-xs opacity-70">Profile Owner</div>
            </div>
          </div>

          {rows.map((row, ri) => row.length === 0 ? null : (
            <div key={ri}>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {row.map((m) => {
                  const relMeta = REL_OPTIONS.find((r) => r.rel === m.relation)!;
                  return (
                    <div key={m.id} className="rounded-xl px-3 py-2 text-center relative group"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 80 }}>
                      <div className="text-xl">{relMeta.emoji}</div>
                      <div className="text-xs font-semibold truncate">{m.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{m.relation}</div>
                      {m.dob && <div className="text-xs" style={{ color: "var(--muted)", fontSize: 9 }}>🎂 {m.dob}</div>}
                      <button
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded"
                        style={{ color: "var(--muted)" }} onClick={() => remove(m.id)}>
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-6">
              <GitBranch size={24} className="mx-auto mb-2 opacity-25" style={{ color: "var(--muted)" }} />
              <div className="text-xs" style={{ color: "var(--muted)" }}>Add family members to build your Vanshawali tree</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VaultWidget — main export with sub-tab navigation
// ═══════════════════════════════════════════════════════════════════════════

type VaultTab = "files" | "map" | "family";

const VAULT_TABS: Array<{ id: VaultTab; label: string; icon: React.ReactNode }> = [
  { id: "files",  label: "Vault",      icon: <Lock       size={12} /> },
  { id: "map",    label: "Map",        icon: <MapPin     size={12} /> },
  { id: "family", label: "Family Tree", icon: <GitBranch  size={12} /> },
];

export function VaultWidget({ config: _c }: { config: Record<string, unknown> }) {
  const [tab, setTab] = useState<VaultTab>("files");

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--bg)" }}>
        {VAULT_TABS.map((t) => (
          <button key={t.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: tab === t.id ? "var(--surface)" : "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--muted)",
              border: tab === t.id ? "1px solid var(--border)" : "1px solid transparent",
            }}
            onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "files"  && <FilesView />}
      {tab === "map"    && <MapView />}
      {tab === "family" && <FamilyView />}
    </div>
  );
}

export { ChevronDown };
