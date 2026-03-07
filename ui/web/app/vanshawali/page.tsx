"use client";
/**
 * Vanshawali — Family & Social Profile Node
 * - Default layout: profile hero, family tree, connections, interests, edu, work, heritage
 * - Elementor-style editor: palette | canvas | properties
 * - Add segment → workflow (configure → place → save)
 * - Save → Preview (full-page) → Activate
 */
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  BookOpen, Briefcase, Camera, Check, ChevronDown, ChevronUp,
  Edit3, Eye, EyeOff, GitBranch, Globe, Heart, Layers,
  Link2, List, MapPin, Plus, Save, Settings, Star,
  Trash2, TreePine, Trophy, User, UserPlus, Users,
  Wallet, X, Zap, Play, ArrowLeft,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Mode = "view" | "editor" | "preview";

type SegType =
  | "profile_header" | "family_tree" | "friends"
  | "interests"      | "education"   | "profession"
  | "heritage"       | "achievements"| "media_gallery"
  | "wallet_mini"    | "location"    | "wishlist";

interface Segment {
  id: string;
  type: SegType;
  label: string;
  visible: boolean;
  span: "full" | "half" | "third";   // grid column span
  config: Record<string, unknown>;
}

interface Layout {
  segments: Segment[];
  activated: boolean;
  savedAt: string;
}

// ─── Catalogue ────────────────────────────────────────────────────────────────

const CATALOGUE: {
  type: SegType; label: string; icon: React.ElementType;
  desc: string; defaultSpan: "full" | "half" | "third";
  defaultConfig: Record<string, unknown>;
}[] = [
  {
    type: "profile_header", label: "Profile Header", icon: User,
    desc: "Hero section with avatar, bio, karma & social links",
    defaultSpan: "full",
    defaultConfig: { variant: "gradient", showKarma: true, showSocial: true },
  },
  {
    type: "family_tree", label: "Family Tree", icon: TreePine,
    desc: "Parents, siblings, spouse & children connections",
    defaultSpan: "half",
    defaultConfig: { maxDepth: 2, showGotra: true },
  },
  {
    type: "friends", label: "Friends & Connections", icon: Users,
    desc: "Connected people with mutual interest badges",
    defaultSpan: "full",
    defaultConfig: { maxItems: 8, showMutual: true },
  },
  {
    type: "interests", label: "Interests & Hobbies", icon: Heart,
    desc: "Tag cloud of hobbies and passions",
    defaultSpan: "half",
    defaultConfig: { colorful: true, maxTags: 20 },
  },
  {
    type: "education", label: "Education", icon: BookOpen,
    desc: "Education timeline from school to highest degree",
    defaultSpan: "half",
    defaultConfig: { showGrade: true, timeline: true },
  },
  {
    type: "profession", label: "Profession & Jobs", icon: Briefcase,
    desc: "Career journey, current role & achievements",
    defaultSpan: "half",
    defaultConfig: { showCurrent: true, timeline: true },
  },
  {
    type: "heritage", label: "Heritage & Gotra", icon: GitBranch,
    desc: "Gotra, caste, religion, native place & traditions",
    defaultSpan: "third",
    defaultConfig: { showReligion: true, showNativePlace: true },
  },
  {
    type: "achievements", label: "Achievements", icon: Trophy,
    desc: "Milestones, karma badges & recognitions",
    defaultSpan: "third",
    defaultConfig: { maxItems: 6 },
  },
  {
    type: "media_gallery", label: "Media Gallery", icon: Camera,
    desc: "Photos, videos and memories grid",
    defaultSpan: "third",
    defaultConfig: { cols: 3, maxItems: 9 },
  },
  {
    type: "wallet_mini", label: "Dravyam Wallet", icon: Wallet,
    desc: "Mini balance widget linked to Dravyam engine",
    defaultSpan: "third",
    defaultConfig: { showTransactions: 3 },
  },
  {
    type: "location", label: "Location", icon: MapPin,
    desc: "Current city, native place & region info",
    defaultSpan: "third",
    defaultConfig: { showMap: false, showAddress: true },
  },
  {
    type: "wishlist", label: "Wishlist / Goals", icon: List,
    desc: "Bucket list, goals and aspirations",
    defaultSpan: "half",
    defaultConfig: { maxItems: 10 },
  },
];

// ─── Default layout ───────────────────────────────────────────────────────────

const DEFAULT_SEGMENTS: Segment[] = [
  { id: "seg_header",   type: "profile_header", label: "Profile Header",       visible: true, span: "full",  config: { variant: "gradient", showKarma: true, showSocial: true } },
  { id: "seg_family",   type: "family_tree",    label: "Family Tree",          visible: true, span: "half",  config: { maxDepth: 2, showGotra: true } },
  { id: "seg_interest", type: "interests",      label: "Interests & Hobbies",  visible: true, span: "half",  config: { colorful: true, maxTags: 20 } },
  { id: "seg_friends",  type: "friends",        label: "Friends & Connections", visible: true, span: "full",  config: { maxItems: 8, showMutual: true } },
  { id: "seg_edu",      type: "education",      label: "Education",            visible: true, span: "half",  config: { showGrade: true, timeline: true } },
  { id: "seg_work",     type: "profession",     label: "Profession & Jobs",    visible: true, span: "half",  config: { showCurrent: true, timeline: true } },
  { id: "seg_heritage", type: "heritage",       label: "Heritage & Gotra",     visible: true, span: "third", config: { showReligion: true, showNativePlace: true } },
  { id: "seg_achieve",  type: "achievements",   label: "Achievements",         visible: true, span: "third", config: { maxItems: 6 } },
  { id: "seg_media",    type: "media_gallery",  label: "Media Gallery",        visible: true, span: "third", config: { cols: 3, maxItems: 9 } },
];

const LS_KEY = "nodeos-vanshawali-layout";
const OB_KEY = "nodeos-onboarding";

// ─── Persist ──────────────────────────────────────────────────────────────────

function loadLayout(): Layout {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Layout;
  } catch { /**/ }
  return { segments: DEFAULT_SEGMENTS, activated: false, savedAt: "" };
}

function saveLayout(segs: Segment[], activated = false): Layout {
  const layout: Layout = { segments: segs, activated, savedAt: new Date().toISOString() };
  try { localStorage.setItem(LS_KEY, JSON.stringify(layout)); } catch { /**/ }
  return layout;
}

// ─── Onboarding data ─────────────────────────────────────────────────────────

interface OBData {
  flow?: "personal" | "company";
  name?: string; mobile?: string; email?: string;
  cast?: string; gotra?: string; religion?: string; blood_group?: string;
  hobbies?: string[];
  education?: Array<{ level: string; institution: string; field: string; start_year: string; end_year: string; grade: string }>;
  jobs?: Array<{ company: string; role: string; start_year: string; end_year: string; current: boolean; location: string }>;
  addresses?: Array<{ label: string; city: string; state: string; country: string; line1: string; pincode: string }>;
  nationality?: string; dob?: string; gender?: string;
}

function useOBData(): OBData {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem(OB_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);
}

// ─── Segment Renderers ────────────────────────────────────────────────────────

const HOBBY_COLORS = [
  "#6c63ff","#00d2ff","#22c55e","#f59e0b","#ef4444",
  "#a855f7","#06b6d4","#84cc16","#f97316","#ec4899",
];

function SegProfileHeader({ seg, ob }: { seg: Segment; ob: OBData }) {
  const name = ob.name || "Your Name";
  const city = ob.addresses?.[0]?.city || "—";
  const gradient = seg.config.variant === "gradient"
    ? "linear-gradient(135deg, rgba(108,99,255,0.25) 0%, rgba(0,210,255,0.15) 100%)"
    : "var(--surface)";
  const karma = 420;

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: gradient, border: "1px solid var(--border)" }}>
      {/* Banner */}
      <div className="h-24 relative" style={{ background: "linear-gradient(120deg,rgba(108,99,255,0.4),rgba(0,210,255,0.3))" }}>
        <div className="absolute -bottom-8 left-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4"
            style={{ background: "var(--accent)", borderColor: "var(--surface)", color: "#fff" }}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      <div className="pt-12 px-6 pb-5">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold">{name}</h2>
            <div className="flex items-center gap-3 text-xs mt-1 flex-wrap" style={{ color: "var(--muted)" }}>
              {ob.gender && <span>{ob.gender}</span>}
              {city && <span>📍 {city}</span>}
              {ob.nationality && <span>🌏 {ob.nationality}</span>}
            </div>
          </div>
          {!!seg.config.showKarma && (
            <div className="text-right">
              <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Karma Score</div>
              <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>⚡ {karma}</div>
            </div>
          )}
        </div>
        {!!seg.config.showSocial && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {["NodeOS", "Family", "Community"].map((tag) => (
              <span key={tag} className="badge badge-purple text-xs">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SegFamilyTree({ seg }: { seg: Segment }) {
  const DEMO = [
    { rel: "Father",   name: "Add Father",   emoji: "👨", added: false },
    { rel: "Mother",   name: "Add Mother",   emoji: "👩", added: false },
    { rel: "Spouse",   name: "Add Spouse",   emoji: "💑", added: false },
    { rel: "Sibling",  name: "Add Sibling",  emoji: "🧑", added: false },
    { rel: "Child",    name: "Add Child",    emoji: "👶", added: false },
  ];
  return (
    <div>
      <div className="text-center mb-3 text-xs" style={{ color: "var(--muted)" }}>
        Connect your family members to build the Vanshawali tree
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DEMO.map((m) => (
          <button
            key={m.rel}
            className="rounded-xl p-3 text-center transition-all hover:scale-105"
            style={{ background: "var(--bg)", border: "1px dashed var(--border)", cursor: "pointer" }}
          >
            <div className="text-2xl mb-1">{m.emoji}</div>
            <div className="text-xs font-medium">{m.rel}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>+ Add</div>
          </button>
        ))}
      </div>
      {!!seg.config.showGotra && (
        <div className="mt-3 rounded-xl px-3 py-2 text-xs text-center" style={{ background: "var(--bg)", color: "var(--muted)" }}>
          <GitBranch size={10} className="inline mr-1" />
          Link gotra &amp; lineage from Heritage segment
        </div>
      )}
    </div>
  );
}

function SegFriends() {
  const MOCK = [
    { name: "Arjun S.",  mutual: ["Cricket", "Coding"],    karma: 380 },
    { name: "Priya M.",  mutual: ["Music", "Travel"],      karma: 510 },
    { name: "Rahul K.",  mutual: ["Chess", "Gaming"],      karma: 290 },
    { name: "Sneha T.",  mutual: ["Yoga", "Photography"],  karma: 445 },
    { name: "Vikram D.", mutual: ["Reading", "Art"],       karma: 320 },
    { name: "Anjali R.", mutual: ["Dance", "Cooking"],     karma: 480 },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MOCK.map((p, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: HOBBY_COLORS[i % HOBBY_COLORS.length] + "33", color: HOBBY_COLORS[i % HOBBY_COLORS.length] }}>
              {p.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{p.name}</div>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {p.mutual.slice(0, 2).map((m) => (
                  <span key={m} className="text-xs rounded-full px-1.5 py-0.5"
                    style={{ background: "rgba(108,99,255,0.15)", color: "var(--accent)", fontSize: 10 }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-secondary text-xs w-full mt-3 gap-1">
        <UserPlus size={12} /> Find &amp; Connect People
      </button>
    </div>
  );
}

function SegInterests({ ob }: { ob: OBData }) {
  const hobbies = ob.hobbies?.length ? ob.hobbies
    : ["Reading", "Music", "Travel", "Coding", "Cricket", "Photography", "Cooking", "Yoga"];
  return (
    <div className="flex flex-wrap gap-2">
      {hobbies.map((h, i) => (
        <span key={h} className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: HOBBY_COLORS[i % HOBBY_COLORS.length] + "22",
            color: HOBBY_COLORS[i % HOBBY_COLORS.length],
            border: `1px solid ${HOBBY_COLORS[i % HOBBY_COLORS.length]}44`,
          }}>
          {h}
        </span>
      ))}
      <button className="px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ borderStyle: "dashed", border: "1px dashed var(--border)", color: "var(--muted)" }}>
        + Add interest
      </button>
    </div>
  );
}

function SegEducation({ ob }: { ob: OBData }) {
  const list = ob.education?.filter((e) => e.institution) ?? [];
  if (!list.length) return (
    <div className="text-center py-4 text-xs" style={{ color: "var(--muted)" }}>
      No education added yet. Complete onboarding to populate this section.
    </div>
  );
  return (
    <div className="space-y-3">
      {list.map((e, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(108,99,255,0.15)", color: "var(--accent)" }}>
            <BookOpen size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold">{e.institution}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {e.level}{e.field ? ` · ${e.field}` : ""}{e.grade ? ` · ${e.grade}` : ""}
            </div>
            {(e.start_year || e.end_year) && (
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {e.start_year}–{e.end_year || "present"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SegProfession({ ob }: { ob: OBData }) {
  const list = ob.jobs?.filter((j) => j.company) ?? [];
  if (!list.length) return (
    <div className="text-center py-4 text-xs" style={{ color: "var(--muted)" }}>
      No employment added yet. Complete onboarding to populate this section.
    </div>
  );
  return (
    <div className="space-y-3">
      {list.map((j, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(0,210,255,0.12)", color: "var(--accent2)" }}>
            <Briefcase size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold">{j.company}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {j.role}{j.location ? ` · ${j.location}` : ""}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {j.current && <span className="badge badge-green text-xs">Current</span>}
              {(j.start_year || j.end_year) && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {j.start_year}–{j.current ? "present" : j.end_year}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SegHeritage({ ob }: { ob: OBData }) {
  const rows = [
    { k: "Gotra",       v: ob.gotra },
    { k: "Caste",       v: ob.cast },
    { k: "Religion",    v: ob.religion },
    { k: "Blood Group", v: ob.blood_group },
    { k: "Nationality", v: ob.nationality },
  ].filter((r) => r.v);
  if (!rows.length) return (
    <div className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>
      Fill Personal Profile in onboarding to see heritage data.
    </div>
  );
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.k} className="flex justify-between text-xs">
          <span style={{ color: "var(--muted)" }}>{r.k}</span>
          <span className="font-semibold">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function SegAchievements() {
  const BADGES = [
    { icon: "⚡", label: "Early Adopter",    color: "#f59e0b" },
    { icon: "🌟", label: "Karma Pioneer",   color: "#6c63ff" },
    { icon: "🔗", label: "Connected",        color: "#22c55e" },
    { icon: "🛡️", label: "Verified ID",     color: "#00d2ff" },
    { icon: "📚", label: "Knowledge Node",  color: "#a855f7" },
    { icon: "💼", label: "Professional",    color: "#f97316" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {BADGES.map((b) => (
        <div key={b.label} className="rounded-xl p-2 flex items-center gap-2"
          style={{ background: b.color + "14", border: `1px solid ${b.color}33` }}>
          <span className="text-lg">{b.icon}</span>
          <span className="text-xs font-semibold" style={{ color: b.color }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function SegMediaGallery() {
  const slots = Array.from({ length: 6 });
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {slots.map((_, i) => (
        <div key={i} className="aspect-square rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg)", border: "1px dashed var(--border)", cursor: "pointer" }}>
          {i === 0
            ? <div className="text-center"><Camera size={16} style={{ color: "var(--muted)" }} className="mx-auto mb-1" /><span className="text-xs" style={{ color: "var(--muted)" }}>Add</span></div>
            : <Camera size={14} style={{ color: "var(--border)" }} />}
        </div>
      ))}
    </div>
  );
}

function SegWalletMini() {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bg)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Dravyam Balance</span>
        <Wallet size={14} style={{ color: "var(--accent)" }} />
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>₹ 2,480</div>
      <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--success)" }}>↑ ₹500 in</span>
        <span style={{ color: "var(--danger)" }}>↓ ₹120 out</span>
      </div>
    </div>
  );
}

function SegLocation({ ob }: { ob: OBData }) {
  const addr = ob.addresses?.[0];
  return (
    <div className="space-y-2">
      {addr ? (
        <>
          <div className="flex items-center gap-2 text-sm"><MapPin size={14} style={{ color: "var(--accent)" }} /><span className="font-semibold">{addr.city || "—"}, {addr.state || "—"}</span></div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>{addr.line1}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>{addr.country} {addr.pincode}</div>
        </>
      ) : (
        <div className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>Add address in onboarding to see location.</div>
      )}
    </div>
  );
}

function SegWishlist() {
  const items = ["Visit Japan 🗾", "Learn Sanskrit 📜", "Build my own product 🚀", "Publish a book 📖", "Run a marathon 🏃"];
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded-full border shrink-0" style={{ borderColor: "var(--border)" }} />
          <span>{item}</span>
        </div>
      ))}
      <button className="btn btn-secondary text-xs mt-1 gap-1 w-full"><Plus size={11} /> Add goal</button>
    </div>
  );
}

// ─── Segment dispatcher ───────────────────────────────────────────────────────

function SegmentRenderer({ seg, ob }: { seg: Segment; ob: OBData }) {
  switch (seg.type) {
    case "profile_header":  return <SegProfileHeader seg={seg} ob={ob} />;
    case "family_tree":     return <SegFamilyTree seg={seg} />;
    case "friends":         return <SegFriends />;
    case "interests":       return <SegInterests ob={ob} />;
    case "education":       return <SegEducation ob={ob} />;
    case "profession":      return <SegProfession ob={ob} />;
    case "heritage":        return <SegHeritage ob={ob} />;
    case "achievements":    return <SegAchievements />;
    case "media_gallery":   return <SegMediaGallery />;
    case "wallet_mini":     return <SegWalletMini />;
    case "location":        return <SegLocation ob={ob} />;
    case "wishlist":        return <SegWishlist />;
    default:                return null;
  }
}

const SEG_ICONS: Record<SegType, React.ElementType> = {
  profile_header: User, family_tree: TreePine, friends: Users,
  interests: Heart, education: BookOpen, profession: Briefcase,
  heritage: GitBranch, achievements: Trophy, media_gallery: Camera,
  wallet_mini: Wallet, location: MapPin, wishlist: List,
};

// ─── Add-segment workflow modal ───────────────────────────────────────────────

interface AddWorkflowProps {
  onClose: () => void;
  onAdd: (seg: Segment) => void;
  existingTypes: SegType[];
}

function AddWorkflowModal({ onClose, onAdd, existingTypes }: AddWorkflowProps) {
  const [wfStep, setWfStep] = useState<1 | 2>(1);
  const [chosen, setChosen] = useState<(typeof CATALOGUE)[0] | null>(null);
  const [label, setLabel]   = useState("");
  const [span, setSpan]     = useState<Segment["span"]>("half");
  const [position, setPosition] = useState<"top" | "bottom">("bottom");

  const available = CATALOGUE.filter((c) => !existingTypes.includes(c.type));

  const confirm = () => {
    if (!chosen) return;
    const seg: Segment = {
      id: `seg_${Date.now()}`,
      type: chosen.type,
      label: label || chosen.label,
      visible: true,
      span,
      config: { ...chosen.defaultConfig },
    };
    onAdd({ ...seg, _position: position } as Segment & { _position: string });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Add Segment Workflow</div>
            <div className="font-bold">Step {wfStep} of 2 — {wfStep === 1 ? "Choose Segment" : "Configure"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Progress */}
          <div className="flex gap-2 mb-5">
            {[1, 2].map((n) => (
              <div key={n} className="flex-1 h-1.5 rounded-full"
                style={{ background: n <= wfStep ? "var(--accent)" : "var(--border)" }} />
            ))}
          </div>

          {wfStep === 1 ? (
            /* Step 1 — pick type */
            <div>
              <div className="text-sm font-medium mb-3">Select a segment to add to your Vanshawali profile:</div>
              {available.length === 0 ? (
                <div className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>
                  All available segments are already added to your layout.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {available.map((c) => {
                    const Icon = c.icon;
                    const sel = chosen?.type === c.type;
                    return (
                      <button
                        key={c.type}
                        onClick={() => { setChosen(c); setLabel(c.label); setSpan(c.defaultSpan); }}
                        className="text-left rounded-2xl p-3 transition-all"
                        style={{
                          background: sel ? "rgba(108,99,255,0.18)" : "var(--bg)",
                          border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                          cursor: "pointer",
                        }}
                      >
                        <Icon size={18} style={{ color: sel ? "var(--accent)" : "var(--muted)" }} className="mb-1.5" />
                        <div className="text-xs font-semibold">{c.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--muted)", fontSize: 10 }}>{c.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setWfStep(2)}
                  disabled={!chosen}
                  className="btn btn-primary text-sm gap-2"
                >
                  Next: Configure →
                </button>
              </div>
            </div>
          ) : (
            /* Step 2 — configure */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>
                  Segment Label
                </label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                  style={{ fontSize: 13 }} placeholder="Custom display name" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "var(--muted)" }}>
                  Width / Span
                </label>
                <div className="flex gap-2">
                  {(["full","half","third"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpan(s)}
                      className="flex-1 text-xs py-2 rounded-xl"
                      style={{
                        background: span === s ? "rgba(108,99,255,0.18)" : "var(--bg)",
                        border: `1px solid ${span === s ? "var(--accent)" : "var(--border)"}`,
                        color: span === s ? "var(--accent)" : "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      {s === "full" ? "Full (12)" : s === "half" ? "Half (6)" : "Third (4)"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "var(--muted)" }}>
                  Insert Position
                </label>
                <div className="flex gap-2">
                  {(["top","bottom"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      className="flex-1 text-xs py-2 rounded-xl capitalize"
                      style={{
                        background: position === p ? "rgba(108,99,255,0.18)" : "var(--bg)",
                        border: `1px solid ${position === p ? "var(--accent)" : "var(--border)"}`,
                        color: position === p ? "var(--accent)" : "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      {p === "top" ? "⬆ Top" : "⬇ Bottom"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setWfStep(1)} className="btn btn-secondary text-sm flex-1">← Back</button>
                <button onClick={confirm} disabled={!label.trim()} className="btn btn-primary text-sm flex-1 gap-2">
                  <Plus size={14} /> Add Segment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Properties panel ─────────────────────────────────────────────────────────

function PropertiesPanel({ seg, onUpdate }: { seg: Segment | null; onUpdate: (id: string, patch: Partial<Segment>) => void }) {
  if (!seg) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <Settings size={28} style={{ color: "var(--border)" }} className="mx-auto mb-3" />
          <div className="text-sm font-medium" style={{ color: "var(--muted)" }}>Select a segment</div>
          <div className="text-xs mt-1" style={{ color: "var(--border)" }}>Click any segment in the canvas to configure it</div>
        </div>
      </div>
    );
  }

  const Icon = SEG_ICONS[seg.type];

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center gap-2 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <Icon size={16} style={{ color: "var(--accent)" }} />
        <span className="font-semibold text-sm">{seg.label}</span>
      </div>

      {/* Label */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>Display Label</label>
        <input
          type="text" value={seg.label}
          onChange={(e) => onUpdate(seg.id, { label: e.target.value })}
          style={{ fontSize: 12 }}
        />
      </div>

      {/* Span */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "var(--muted)" }}>Width</label>
        <div className="flex gap-1">
          {(["full","half","third"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdate(seg.id, { span: s })}
              className="flex-1 text-xs py-1.5 rounded-lg"
              style={{
                background: seg.span === s ? "rgba(108,99,255,0.18)" : "var(--bg)",
                border: `1px solid ${seg.span === s ? "var(--accent)" : "var(--border)"}`,
                color: seg.span === s ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                fontSize: 10,
              }}
            >
              {s === "full" ? "Full" : s === "half" ? "½" : "⅓"}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Visibility</span>
        <button
          onClick={() => onUpdate(seg.id, { visible: !seg.visible })}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: seg.visible ? "rgba(34,197,94,0.15)" : "var(--bg)",
            color: seg.visible ? "var(--success)" : "var(--muted)",
            border: `1px solid ${seg.visible ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
            cursor: "pointer",
          }}
        >
          {seg.visible ? <><Eye size={11} /> Visible</> : <><EyeOff size={11} /> Hidden</>}
        </button>
      </div>

      {/* Type-specific config */}
      {(seg.type === "profile_header") && (
        <>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "var(--muted)" }}>Variant</label>
            <div className="flex gap-1">
              {["gradient", "minimal", "dark"].map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdate(seg.id, { config: { ...seg.config, variant: v } })}
                  className="flex-1 text-xs py-1.5 rounded-lg capitalize"
                  style={{
                    background: seg.config.variant === v ? "rgba(108,99,255,0.18)" : "var(--bg)",
                    border: `1px solid ${seg.config.variant === v ? "var(--accent)" : "var(--border)"}`,
                    color: seg.config.variant === v ? "var(--accent)" : "var(--muted)",
                    cursor: "pointer",
                    fontSize: 10,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={!!seg.config.showKarma}
              onChange={(e) => onUpdate(seg.id, { config: { ...seg.config, showKarma: e.target.checked } })} />
            Show Karma Score
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={!!seg.config.showSocial}
              onChange={(e) => onUpdate(seg.id, { config: { ...seg.config, showSocial: e.target.checked } })} />
            Show Social Tags
          </label>
        </>
      )}

      {(seg.type === "friends") && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>Max Items Shown</label>
          <input
            type="number" min={2} max={20}
            value={String(seg.config.maxItems ?? 8)}
            onChange={(e) => onUpdate(seg.id, { config: { ...seg.config, maxItems: Number(e.target.value) } })}
            style={{ fontSize: 12 }}
          />
        </div>
      )}

      <div className="text-xs rounded-xl p-3" style={{ background: "var(--bg)", color: "var(--muted)", marginTop: 8 }}>
        <strong style={{ color: "var(--text)" }}>{seg.type}</strong><br />
        Node: profile.vanshawali.{seg.id}
      </div>
    </div>
  );
}

// ─── Editor Canvas ────────────────────────────────────────────────────────────

function EditorCanvas({
  segments, selectedId, onSelect, onUpdate, onReorder, onDelete, onToggle,
}: {
  segments: Segment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Segment>) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const Icon = (type: SegType) => {
    const I = SEG_ICONS[type];
    return <I size={14} />;
  };

  return (
    <div className="space-y-2 p-4 overflow-y-auto h-full">
      {segments.map((seg, idx) => {
        const sel = seg.id === selectedId;
        return (
          <div
            key={seg.id}
            onClick={() => onSelect(seg.id)}
            className="rounded-2xl transition-all cursor-pointer"
            style={{
              background: sel ? "rgba(108,99,255,0.12)" : "var(--bg)",
              border: `2px solid ${sel ? "var(--accent)" : seg.visible ? "var(--border)" : "rgba(107,114,128,0.3)"}`,
              opacity: seg.visible ? 1 : 0.5,
            }}
          >
            {/* Segment bar */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div style={{ color: sel ? "var(--accent)" : "var(--muted)" }}>{Icon(seg.type)}</div>
              <span className="text-xs font-semibold flex-1 truncate">{seg.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "var(--surface)", color: "var(--muted)", fontSize: 10 }}>
                {seg.span}
              </span>
              {/* Controls */}
              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onReorder(seg.id, "up")} disabled={idx === 0}
                  className="p-1 rounded" style={{ color: "var(--muted)", background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}>
                  <ChevronUp size={12} />
                </button>
                <button onClick={() => onReorder(seg.id, "down")} disabled={idx === segments.length - 1}
                  className="p-1 rounded" style={{ color: "var(--muted)", background: "none", border: "none", cursor: idx === segments.length - 1 ? "not-allowed" : "pointer", opacity: idx === segments.length - 1 ? 0.3 : 1 }}>
                  <ChevronDown size={12} />
                </button>
                <button onClick={() => onToggle(seg.id)}
                  className="p-1 rounded" style={{ color: seg.visible ? "var(--success)" : "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                  {seg.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => onDelete(seg.id)}
                  className="p-1 rounded" style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Mini preview hint */}
            {sel && (
              <div className="px-3 pb-2.5">
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                  ↗ Properties panel on the right to configure this segment
                </div>
              </div>
            )}
          </div>
        );
      })}

      {segments.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed p-8 text-center"
          style={{ borderColor: "var(--border)" }}>
          <Layers size={24} className="mx-auto mb-2" style={{ color: "var(--border)" }} />
          <div className="text-sm" style={{ color: "var(--muted)" }}>No segments added</div>
          <div className="text-xs mt-1" style={{ color: "var(--border)" }}>Click "+ Add Segment" to build your layout</div>
        </div>
      )}
    </div>
  );
}

// ─── Profile layout renderer (view + preview) ─────────────────────────────────

function ProfileLayout({ segments, ob }: { segments: Segment[]; ob: OBData }) {
  const visible = segments.filter((s) => s.visible);
  return (
    <div className="grid grid-cols-6 gap-4">
      {visible.map((seg) => {
        const colSpan =
          seg.span === "full"  ? "col-span-6" :
          seg.span === "half"  ? "col-span-6 sm:col-span-3" :
          "col-span-6 sm:col-span-2";
        const Icon = SEG_ICONS[seg.type];
        return (
          <div key={seg.id} className={`${colSpan} card`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {seg.label}
              </span>
            </div>
            <SegmentRenderer seg={seg} ob={ob} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VanshawaliPage() {
  const [mode, setMode]           = useState<Mode>("view");
  const [layout, setLayout]       = useState<Layout>(() => loadLayout());
  const [segments, setSegments]   = useState<Segment[]>(() => loadLayout().segments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [saveMsg, setSaveMsg]     = useState<string | null>(null);
  const ob = useOBData();

  const selectedSeg = useMemo(() => segments.find((s) => s.id === selectedId) ?? null, [segments, selectedId]);

  const updateSeg = useCallback((id: string, patch: Partial<Segment>) => {
    setSegments((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const reorder = useCallback((id: string, dir: "up" | "down") => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  const deleteSeg = useCallback((id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((prev) => prev === id ? null : prev);
  }, []);

  const toggleSeg = useCallback((id: string) => {
    setSegments((prev) => prev.map((s) => s.id === id ? { ...s, visible: !s.visible } : s));
  }, []);

  const addSegment = useCallback((seg: Segment & { _position?: string }) => {
    const { _position, ...clean } = seg as Segment & { _position?: string };
    setSegments((prev) => _position === "top" ? [clean, ...prev] : [...prev, clean]);
    setShowAdd(false);
    setSelectedId(clean.id);
  }, []);

  const handleSave = () => {
    const saved = saveLayout(segments, false);
    setLayout(saved);
    setSaveMsg("Saved!");
    setTimeout(() => setSaveMsg(null), 2000);
  };

  const handleActivate = () => {
    const saved = saveLayout(segments, true);
    setLayout(saved);
    setMode("view");
    setSaveMsg("Profile activated!");
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const existingTypes = segments.map((s) => s.type);

  // ── View mode ────────────────────────────────────────────────────────────────
  if (mode === "view") {
    const visCount = segments.filter((s) => s.visible).length;
    return (
      <div className="max-w-5xl mx-auto py-6 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">वंशावली Profile</h1>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {layout.activated ? (
                <span style={{ color: "var(--success)" }}>✓ Activated · </span>
              ) : (
                <span style={{ color: "var(--warn)" }}>⚠ Not activated · </span>
              )}
              {visCount} visible segments
              {layout.savedAt && (
                <> · Saved {new Date(layout.savedAt).toLocaleDateString()}</>
              )}
            </div>
          </div>
          <button
            onClick={() => setMode("editor")}
            className="btn btn-primary gap-2 text-sm"
          >
            <Edit3 size={14} /> Edit Layout
          </button>
        </div>

        {!layout.activated && (
          <div className="rounded-2xl px-4 py-3 text-sm flex items-center gap-3"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--warn)" }}>
            <Star size={14} />
            This is the default layout. Click <strong>Edit Layout</strong> to customise, then <strong>Activate</strong> to publish.
          </div>
        )}

        <ProfileLayout segments={segments} ob={ob} />
      </div>
    );
  }

  // ── Preview mode ─────────────────────────────────────────────────────────────
  if (mode === "preview") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--bg)" }}>
        {/* Preview bar */}
        <div className="sticky top-0 z-10 px-6 py-3 flex items-center gap-3"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => setMode("editor")} className="btn btn-secondary text-xs gap-1">
            <ArrowLeft size={12} /> Back to Editor
          </button>
          <span className="badge badge-purple text-xs">Preview — Full Page</span>
          <div className="ml-auto flex gap-2">
            <button onClick={handleSave} className="btn btn-secondary text-xs gap-1"><Save size={12} /> Save</button>
            <button onClick={handleActivate} className="btn btn-primary text-xs gap-1"><Check size={12} /> Activate</button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto py-6 px-4">
          <div className="mb-4 text-xs text-center" style={{ color: "var(--muted)" }}>
            This is exactly how your Vanshawali profile will appear to visitors
          </div>
          <ProfileLayout segments={segments} ob={ob} />
        </div>
      </div>
    );
  }

  // ── Editor mode ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "var(--bg)" }}>

      {/* Editor top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setMode("view")} className="btn btn-secondary text-xs gap-1 py-1.5">
          <ArrowLeft size={12} /> Exit
        </button>
        <div className="flex items-center gap-1.5">
          <Layers size={14} style={{ color: "var(--accent)" }} />
          <span className="font-semibold text-sm">Vanshawali Editor</span>
        </div>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {segments.length} segments · {segments.filter((s) => s.visible).length} visible
        </span>
        <div className="ml-auto flex items-center gap-2">
          {saveMsg && (
            <span className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(34,197,94,0.15)", color: "var(--success)" }}>
              {saveMsg}
            </span>
          )}
          <button onClick={handleSave} className="btn btn-secondary text-xs gap-1 py-1.5">
            <Save size={12} /> Save
          </button>
          <button onClick={() => setMode("preview")} className="btn btn-secondary text-xs gap-1 py-1.5">
            <Play size={12} /> Preview
          </button>
          <button onClick={handleActivate} className="btn btn-primary text-xs gap-1 py-1.5">
            <Check size={12} /> Activate
          </button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT — Segment palette */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden"
          style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
          <div className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
            <span>Segments</span>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
              style={{ background: "rgba(108,99,255,0.18)", color: "var(--accent)", border: "none", cursor: "pointer" }}>
              <Plus size={11} /> Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {CATALOGUE.map((c) => {
              const used = existingTypes.includes(c.type);
              const Icon = c.icon;
              return (
                <div
                  key={c.type}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs cursor-pointer"
                  style={{
                    opacity: used ? 0.4 : 1,
                    background: "transparent",
                    color: used ? "var(--muted)" : "var(--text)",
                  }}
                  onClick={() => !used && setShowAdd(true)}
                  title={used ? "Already added" : `Add ${c.label}`}
                >
                  <Icon size={13} style={{ color: used ? "var(--muted)" : "var(--accent)", shrink: 0 }} />
                  <span className="truncate">{c.label}</span>
                  {used
                    ? <Check size={10} className="ml-auto shrink-0" style={{ color: "var(--success)" }} />
                    : <Plus size={10} className="ml-auto shrink-0" style={{ color: "var(--muted)" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER — Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 text-xs font-semibold flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
            <Layers size={12} />
            Layout Canvas — Reorder, hide or configure each segment
          </div>
          <div className="flex-1 overflow-y-auto">
            <EditorCanvas
              segments={segments}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdate={updateSeg}
              onReorder={reorder}
              onDelete={deleteSeg}
              onToggle={toggleSeg}
            />
          </div>
          <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => setShowAdd(true)} className="btn btn-secondary text-xs w-full gap-1">
              <Plus size={12} /> Add Segment
            </button>
          </div>
        </div>

        {/* RIGHT — Properties */}
        <div className="w-64 shrink-0 flex flex-col overflow-hidden"
          style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
          <div className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide"
            style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
            Properties
          </div>
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel seg={selectedSeg} onUpdate={updateSeg} />
          </div>
        </div>
      </div>

      {/* Add Segment Workflow modal */}
      {showAdd && (
        <AddWorkflowModal
          onClose={() => setShowAdd(false)}
          onAdd={addSegment}
          existingTypes={existingTypes}
        />
      )}
    </div>
  );
}
