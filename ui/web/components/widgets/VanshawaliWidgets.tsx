"use client";
/**
 * VanshawaliWidgets — all 15 vanshawali-profile segment widgets.
 * Each component reads from onboarding localStorage via useOBData().
 * Interface: ({ config: Record<string, unknown> }) => JSX
 */
import { BookOpen, Briefcase, Camera, Phone, Mail, Globe, Link2,
         MapPin, Wallet, Share2, Star, GitBranch, UserPlus, Plus,
         Heart, Users, Zap } from "lucide-react";
import { useOBData, computeOBCompletion, OBData } from "@/hooks/useOBData";

// ─── Palette of hobby colors ──────────────────────────────────────────────────
const HC = [
  "#6c63ff","#00d2ff","#22c55e","#f59e0b","#ef4444",
  "#a855f7","#06b6d4","#84cc16","#f97316","#ec4899",
];

// ─── 1. Profile Header ────────────────────────────────────────────────────────
export function VanshProfile({ config }: { config: Record<string, unknown> }) {
  const ob = useOBData();
  const name     = ob.name || "Your Name";
  const city     = ob.addresses?.[0]?.city || "";
  const showSocial = config.showSocial !== false;
  const showKarma  = config.showKarma  !== false;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="h-20 relative" style={{
        background: "linear-gradient(120deg,rgba(108,99,255,0.4),rgba(0,210,255,0.3))",
      }}>
        <div className="absolute -bottom-7 left-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-4"
            style={{ background: "var(--accent)", borderColor: "var(--bg)", color: "#fff" }}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      <div className="pt-10 px-4 pb-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-base font-bold">{name}</h3>
            <div className="text-xs mt-0.5 flex gap-2 flex-wrap" style={{ color: "var(--muted)" }}>
              {ob.gender && <span>{ob.gender}</span>}
              {city && <span>📍 {city}</span>}
              {ob.dob && <span>🎂 {ob.dob}</span>}
            </div>
          </div>
          {showKarma && (
            <div className="text-right">
              <div className="text-xs" style={{ color: "var(--muted)" }}>Karma</div>
              <div className="text-lg font-bold" style={{ color: "var(--accent)" }}>⚡ 420</div>
            </div>
          )}
        </div>
        {showSocial && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {["NodeOS", "Family", "Verified"].map((t) => (
              <span key={t} className="badge badge-purple text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. Family Tree ───────────────────────────────────────────────────────────
export function VanshFamily({ config }: { config: Record<string, unknown> }) {
  const showGotra = config.showGotra !== false;
  const DEMO = [
    { rel: "Father",  emoji: "👨" }, { rel: "Mother",  emoji: "👩" },
    { rel: "Spouse",  emoji: "💑" }, { rel: "Child",   emoji: "👶" },
    { rel: "Sibling", emoji: "🧑" }, { rel: "Grandpa", emoji: "👴" },
  ];
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {DEMO.map((m) => (
          <button key={m.rel} className="rounded-xl p-2 text-center transition-all hover:scale-105"
            style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
            <div className="text-xl mb-0.5">{m.emoji}</div>
            <div className="text-xs font-medium">{m.rel}</div>
            <div className="text-xs" style={{ color: "var(--accent)" }}>+ Add</div>
          </button>
        ))}
      </div>
      {showGotra && (
        <div className="mt-2 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5"
          style={{ background: "var(--bg)", color: "var(--muted)" }}>
          <GitBranch size={10} /> Connect gotra &amp; lineage from Heritage widget
        </div>
      )}
    </div>
  );
}

// ─── 3. Friends / Network ─────────────────────────────────────────────────────
export function VanshFriends() {
  const MOCK = [
    { n: "Arjun S.",  k: 380, tags: ["Cricket", "Code"] },
    { n: "Priya M.",  k: 510, tags: ["Music", "Travel"] },
    { n: "Rahul K.",  k: 290, tags: ["Chess", "Gaming"] },
    { n: "Sneha T.",  k: 445, tags: ["Yoga", "Photo"] },
    { n: "Vikram D.", k: 320, tags: ["Reading", "Art"] },
    { n: "Anjali R.", k: 480, tags: ["Dance", "Cook"] },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {MOCK.map((p, i) => (
          <div key={i} className="rounded-xl p-2.5 flex items-center gap-2"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: HC[i % HC.length] + "33", color: HC[i % HC.length] }}>
              {p.n.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{p.n}</div>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {p.tags.slice(0, 1).map((t) => (
                  <span key={t} style={{ fontSize: 9, background: "rgba(108,99,255,0.15)", color: "var(--accent)", borderRadius: 4, padding: "1px 4px" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-secondary text-xs w-full mt-2 gap-1">
        <UserPlus size={11} /> Find &amp; Connect
      </button>
    </div>
  );
}

// ─── 4. Interests ─────────────────────────────────────────────────────────────
export function VanshInterests() {
  const ob = useOBData();
  const hobbies = ob.hobbies?.length ? ob.hobbies
    : ["Reading", "Music", "Travel", "Coding", "Cricket", "Photography", "Cooking", "Yoga"];
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {hobbies.map((h, i) => (
          <span key={h} className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: HC[i % HC.length] + "22",
              color: HC[i % HC.length],
              border: `1px solid ${HC[i % HC.length]}44`,
            }}>
            {h}
          </span>
        ))}
        <button className="px-2.5 py-1 rounded-full text-xs" style={{ border: "1px dashed var(--border)", color: "var(--muted)" }}>
          + Add
        </button>
      </div>
    </div>
  );
}

// ─── 5. Education Timeline ────────────────────────────────────────────────────
export function VanshEducation() {
  const ob = useOBData();
  const list = ob.education?.filter((e) => e.institution) ?? [];
  if (!list.length) return (
    <div className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>
      Complete onboarding to see education details.
    </div>
  );
  return (
    <div className="space-y-2">
      {list.map((e, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(108,99,255,0.15)", color: "var(--accent)" }}>
            <BookOpen size={12} />
          </div>
          <div>
            <div className="text-xs font-semibold">{e.institution}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {e.level}{e.field ? ` · ${e.field}` : ""}
              {(e.start_year || e.end_year) && <> · {e.start_year}–{e.end_year || "present"}</>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 6. Profession Timeline ───────────────────────────────────────────────────
export function VanshProfession() {
  const ob = useOBData();
  const list = ob.jobs?.filter((j) => j.company) ?? [];
  if (!list.length) return (
    <div className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>
      Complete onboarding to see work history.
    </div>
  );
  return (
    <div className="space-y-2">
      {list.map((j, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(0,210,255,0.12)", color: "#00d2ff" }}>
            <Briefcase size={12} />
          </div>
          <div>
            <div className="text-xs font-semibold">{j.company}</div>
            <div className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: "var(--muted)" }}>
              {j.role}
              {j.current && <span className="badge badge-green text-xs">Current</span>}
              {(j.start_year) && <span>{j.start_year}–{j.current ? "present" : j.end_year}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 7. Heritage ──────────────────────────────────────────────────────────────
export function VanshHeritage() {
  const ob = useOBData();
  const rows = [
    { k: "Gotra",       v: ob.gotra },
    { k: "Caste",       v: ob.cast },
    { k: "Religion",    v: ob.religion },
    { k: "Blood Group", v: ob.blood_group },
    { k: "Nationality", v: ob.nationality },
  ].filter((r) => r.v);
  if (!rows.length) return (
    <div className="text-xs text-center py-2" style={{ color: "var(--muted)" }}>
      Fill onboarding profile to see heritage.
    </div>
  );
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.k} className="flex justify-between text-xs">
          <span style={{ color: "var(--muted)" }}>{r.k}</span>
          <span className="font-semibold">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 8. Achievements ──────────────────────────────────────────────────────────
export function VanshAchievements() {
  const BADGES = [
    { icon: "⚡", label: "Early Adopter",  color: "#f59e0b" },
    { icon: "🌟", label: "Karma Pioneer",  color: "#6c63ff" },
    { icon: "🔗", label: "Connected",      color: "#22c55e" },
    { icon: "🛡️", label: "Verified ID",   color: "#00d2ff" },
    { icon: "📚", label: "Knowledge",      color: "#a855f7" },
    { icon: "💼", label: "Professional",   color: "#f97316" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {BADGES.map((b) => (
        <div key={b.label} className="rounded-xl p-2 flex items-center gap-1.5"
          style={{ background: b.color + "14", border: `1px solid ${b.color}33` }}>
          <span className="text-base">{b.icon}</span>
          <span className="text-xs font-semibold" style={{ color: b.color }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 9. Media Gallery ─────────────────────────────────────────────────────────
export function VanshGallery() {
  const slots = Array.from({ length: 6 });
  return (
    <div className="grid grid-cols-3 gap-1">
      {slots.map((_, i) => (
        <div key={i} className="aspect-square rounded-lg flex items-center justify-center"
          style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
          {i === 0 ? (
            <div className="text-center">
              <Camera size={14} style={{ color: "var(--muted)" }} className="mx-auto mb-0.5" />
              <span className="text-xs" style={{ color: "var(--muted)" }}>Add</span>
            </div>
          ) : (
            <Camera size={12} style={{ color: "var(--border)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 10. Mini Wallet ──────────────────────────────────────────────────────────
export function VanshWallet() {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bg)" }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Dravyam</span>
        <Wallet size={13} style={{ color: "var(--accent)" }} />
      </div>
      <div className="text-xl font-bold" style={{ color: "var(--accent)" }}>₹ 2,480</div>
      <div className="flex gap-3 mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
        <span style={{ color: "#22c55e" }}>↑ ₹500</span>
        <span style={{ color: "#ef4444" }}>↓ ₹120</span>
      </div>
    </div>
  );
}

// ─── 11. Location ─────────────────────────────────────────────────────────────
export function VanshLocation() {
  const ob = useOBData();
  const addr = ob.addresses?.[0];
  return (
    <div className="space-y-1.5">
      {addr ? (
        <>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <MapPin size={12} style={{ color: "var(--accent)" }} />
            {addr.city || "—"}, {addr.state || "—"}
          </div>
          {addr.line1 && <div className="text-xs" style={{ color: "var(--muted)" }}>{addr.line1}</div>}
          <div className="text-xs" style={{ color: "var(--muted)" }}>{addr.country} {addr.pincode}</div>
        </>
      ) : (
        <div className="text-xs text-center py-2" style={{ color: "var(--muted)" }}>
          Add address in onboarding to see location.
        </div>
      )}
    </div>
  );
}

// ─── 12. Wishlist / Goals ─────────────────────────────────────────────────────
export function VanshWishlist() {
  const DEMO = [
    { text: "Visit 20 countries", done: false },
    { text: "Learn new language", done: true },
    { text: "Start a business",   done: false },
    { text: "Write a book",       done: false },
  ];
  return (
    <div className="space-y-1.5">
      {DEMO.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
            style={{
              background: item.done ? "rgba(34,197,94,0.15)" : "var(--bg)",
              border: `1px solid ${item.done ? "#22c55e" : "var(--border)"}`,
              color: "#22c55e",
            }}>
            {item.done && "✓"}
          </div>
          <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--muted)" : "inherit" }}>
            {item.text}
          </span>
        </div>
      ))}
      <button className="text-xs w-full text-left mt-1" style={{ color: "var(--accent)" }}>
        <Plus size={10} className="inline mr-1" /> Add goal
      </button>
    </div>
  );
}

// ─── 13. Social Links ─────────────────────────────────────────────────────────
export function VanshSocial() {
  const ob = useOBData();
  const links = [
    { key: "linkedin",  label: "LinkedIn",  val: ob.linkedin,  icon: "💼", color: "#0077b5" },
    { key: "instagram", label: "Instagram", val: ob.instagram, icon: "📸", color: "#e1306c" },
    { key: "github",    label: "GitHub",    val: ob.github,    icon: "🐙", color: "#6e40c9" },
    { key: "twitter",   label: "X/Twitter", val: ob.twitter,   icon: "🐦", color: "#1da1f2" },
    { key: "youtube",   label: "YouTube",   val: ob.youtube,   icon: "▶️", color: "#ff0000" },
    { key: "website",   label: "Website",   val: ob.website,   icon: "🌐", color: "#22c55e" },
  ].filter((l) => l.val);

  if (!links.length) return (
    <div className="text-xs text-center py-3 space-y-1.5" style={{ color: "var(--muted)" }}>
      <Globe size={18} className="mx-auto opacity-40" />
      No social links. Update onboarding profile.
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {links.map((l) => (
        <a key={l.key}
          href={l.val!.startsWith("http") ? l.val! : `https://${l.val}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium"
          style={{ background: l.color + "18", border: `1px solid ${l.color}33`, color: l.color, textDecoration: "none" }}>
          <span>{l.icon}</span>
          <span className="truncate">{l.label}</span>
          <Link2 size={9} className="ml-auto shrink-0" />
        </a>
      ))}
    </div>
  );
}

// ─── 14. Contact Info ─────────────────────────────────────────────────────────
export function VanshContact() {
  const ob = useOBData();
  const rows = [
    { icon: <Phone size={12} />,  label: "Phone",    val: ob.mobile,   href: `tel:${ob.mobile}`,   color: "#22c55e" },
    { icon: <Mail size={12} />,   label: "Email",    val: ob.email,    href: `mailto:${ob.email}`, color: "#6c63ff" },
    { icon: <span>💬</span>,      label: "WhatsApp", val: ob.whatsapp, href: `https://wa.me/${(ob.whatsapp ?? "").replace(/\D/g, "")}`, color: "#25d366" },
    { icon: <span>✈️</span>,      label: "Telegram", val: ob.telegram, href: `https://t.me/${ob.telegram}`, color: "#229ed9" },
  ].filter((r) => r.val);

  if (!rows.length) return (
    <div className="text-xs text-center py-2" style={{ color: "var(--muted)" }}>
      Complete onboarding to see contact details.
    </div>
  );

  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <a key={i} href={r.href} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
          style={{ background: r.color + "10", border: `1px solid ${r.color}22`, color: r.color, textDecoration: "none" }}>
          {r.icon} <span>{r.label}</span>
          <span className="ml-auto font-mono text-xs truncate" style={{ color: "var(--text)", maxWidth: 110 }}>{r.val}</span>
        </a>
      ))}
    </div>
  );
}

// ─── 15. Trust Score Ring ─────────────────────────────────────────────────────
export function VanshTrust() {
  const ob = useOBData();
  const { score, breakdown } = computeOBCompletion(ob);
  const R = 38, C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  const levelColor = score >= 80 ? "#f59e0b" : score >= 60 ? "#6c63ff" : score >= 40 ? "#22c55e" : "#94a3b8";
  const levelLabel = score >= 80 ? "Elder" : score >= 60 ? "Root" : score >= 40 ? "Sprout" : "Seed";

  return (
    <div>
      <div className="flex items-center gap-4">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="45" cy="45" r={R} fill="none" stroke={levelColor} strokeWidth="6"
            strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
            transform="rotate(-90 45 45)" />
          <text x="45" y="49" textAnchor="middle" fontSize="14" fontWeight="bold" fill={levelColor}>{score}%</text>
        </svg>
        <div>
          <div className="text-sm font-bold">{levelLabel}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Profile Completion</div>
          <div className="flex items-center gap-1 mt-1.5">
            <Zap size={11} style={{ color: levelColor }} />
            <span className="text-xs" style={{ color: levelColor }}>Karma Active</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1">
        {Object.entries(breakdown).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full flex items-center justify-center"
              style={{ background: v ? "rgba(34,197,94,0.2)" : "var(--bg)", border: `1px solid ${v ? "#22c55e" : "var(--border)"}`, color: "#22c55e", fontSize: 8 }}>
              {v && "✓"}
            </div>
            <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{k.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
