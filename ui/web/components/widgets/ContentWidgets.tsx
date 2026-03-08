"use client";
/**
 * ContentWidgets — utility widgets: Weather, Calendar, Countdown, Progress,
 * Stats, Notifications, Embed, TagCloud, LinkPreview, Markdown
 */
import { useEffect, useRef, useState } from "react";
import {
  Wind, Thermometer, ChevronLeft, ChevronRight,
  Bell, Code, Tag, ExternalLink, Zap, Hash, FileText,
} from "lucide-react";

// ─── 1. Weather Widget (open-meteo.com, free, no API key) ─────────────────────

interface CurrentWeather { temperature: number; windspeed: number; weathercode: number; is_day: number }

function wIcon(c: number, day: boolean) {
  if (c === 0) return day ? "☀️" : "🌙";
  if (c <= 2) return "⛅"; if (c <= 3) return "☁️";
  if (c <= 48) return "🌫️"; if (c <= 55) return "🌦️";
  if (c <= 67) return "🌧️"; if (c <= 77) return "❄️";
  if (c <= 82) return "🌦️"; return "⛈️";
}
function wDesc(c: number) {
  if (c === 0) return "Clear sky"; if (c <= 2) return "Partly cloudy"; if (c <= 3) return "Overcast";
  if (c <= 48) return "Foggy"; if (c <= 55) return "Drizzle"; if (c <= 67) return "Rain";
  if (c <= 77) return "Snow"; if (c <= 82) return "Rain showers"; return "Thunderstorm";
}

export function WeatherWidget({ config }: { config: Record<string, unknown> }) {
  const lat  = parseFloat((config.lat  as string) ?? "19.076");
  const lon  = parseFloat((config.lon  as string) ?? "72.877");
  const city = (config.city as string) ?? "Mumbai";
  const [w, setW]   = useState<CurrentWeather | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then((r) => r.json()).then((d) => setW(d.current_weather as CurrentWeather))
      .catch(() => setErr(true));
  }, [lat, lon]);

  if (err) return <div className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>Weather unavailable</div>;
  if (!w) return <div className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="text-5xl">{wIcon(w.weathercode, w.is_day === 1)}</div>
        <div>
          <div className="text-3xl font-bold">{Math.round(w.temperature)}°C</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{wDesc(w.weathercode)}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>📍 {city}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl px-3 py-2 text-xs flex items-center gap-2" style={{ background: "var(--bg)" }}>
          <Wind size={12} style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--muted)" }}>Wind</span>
          <span className="ml-auto font-semibold">{w.windspeed} km/h</span>
        </div>
        <div className="rounded-xl px-3 py-2 text-xs flex items-center gap-2" style={{ background: "var(--bg)" }}>
          <Thermometer size={12} style={{ color: "#f59e0b" }} />
          <span style={{ color: "var(--muted)" }}>Feels</span>
          <span className="ml-auto font-semibold">{Math.round(w.temperature)}°</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Calendar Widget ───────────────────────────────────────────────────────

interface CalEvent { date: string; label: string; color?: string }

export function CalendarWidget({ config }: { config: Record<string, unknown> }) {
  const events = (config.events as CalEvent[]) ?? [];
  const [view, setView] = useState(() => new Date());
  const today = new Date();
  const year = view.getFullYear(), month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const evMap = new Map<number, string>();
  events.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) evMap.set(d.getDate(), e.color ?? "var(--accent)");
  });

  const cells: Array<number | null> = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setView(new Date(year, month - 1, 1))} className="p-1 rounded-lg hover:bg-white/5"><ChevronLeft size={13} /></button>
        <span className="text-xs font-semibold">{MONTHS[month]} {year}</span>
        <button onClick={() => setView(new Date(year, month + 1, 1))} className="p-1 rounded-lg hover:bg-white/5"><ChevronRight size={13} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS.map((d) => <div key={d} className="text-xs py-0.5 font-semibold" style={{ color: "var(--muted)" }}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
          return (
            <div key={day} className="relative flex items-center justify-center aspect-square rounded-lg text-xs"
              style={{ background: isToday ? "var(--accent)" : "transparent", color: isToday ? "#fff" : "inherit", fontWeight: isToday ? "bold" : "normal" }}>
              {day}
              {evMap.has(day) && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: evMap.get(day) }} />
              )}
            </div>
          );
        })}
      </div>
      {events.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; }).slice(0, 3).map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-xs mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color ?? "var(--accent)" }} />
          <span className="truncate" style={{ color: "var(--muted)" }}>{e.date.slice(8, 10)} – {e.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 3. Countdown Widget ──────────────────────────────────────────────────────

export function CountdownWidget({ config }: { config: Record<string, unknown> }) {
  const target = (config.target as string) ?? new Date(Date.now() + 7 * 86400_000).toISOString();
  const label  = (config.label  as string) ?? "Countdown";
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400_000);
  const h = Math.floor((diff % 86400_000) / 3600_000);
  const m = Math.floor((diff % 3600_000)  / 60_000);
  const s = Math.floor((diff % 60_000)    / 1000);

  return (
    <div className="text-center space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</div>
      {diff === 0 ? <div className="text-xl font-bold" style={{ color: "var(--accent)" }}>🎉 Time&apos;s up!</div> : (
        <div className="flex items-center justify-center gap-2">
          {[{ v: d, l: "D" }, { v: h, l: "H" }, { v: m, l: "M" }, { v: s, l: "S" }].map(({ v, l }) => (
            <div key={l} className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}>{String(v).padStart(2, "0")}</div>
              <span className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{l}</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs" style={{ color: "var(--muted)" }}>{new Date(target).toLocaleDateString()}</div>
    </div>
  );
}

// ─── 4. Progress Widget ───────────────────────────────────────────────────────

export function ProgressWidget({ config }: { config: Record<string, unknown> }) {
  const value    = Math.min(100, Math.max(0, (config.value    as number) ?? 65));
  const label    = (config.label    as string) ?? "Progress";
  const subtitle = (config.subtitle as string) ?? "";
  const mode     = (config.mode     as string) ?? "ring";
  const color    = (config.color    as string) ?? "var(--accent)";
  const R = 38, C = 2 * Math.PI * R;
  const dash = (value / 100) * C;

  if (mode === "bar") return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      {subtitle && <div className="text-xs" style={{ color: "var(--muted)" }}>{subtitle}</div>}
      <div className="rounded-full h-3 overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-4">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={R} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle cx="45" cy="45" r={R} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${C}`} strokeLinecap="round" transform="rotate(-90 45 45)" />
        <text x="45" y="50" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>{value}%</text>
      </svg>
      <div>
        <div className="font-semibold text-sm">{label}</div>
        {subtitle && <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ─── 5. Stats Counter Widget ──────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

export function StatsWidget({ config }: { config: Record<string, unknown> }) {
  const value  = (config.value  as number) ?? 1234;
  const label  = (config.label  as string) ?? "Total Nodes";
  const unit   = (config.unit   as string) ?? "";
  const change = (config.change as number) ?? 0;
  const icon   = (config.icon   as string) ?? "⚡";
  const count  = useCountUp(value);

  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: "rgba(108,99,255,0.15)" }}>{icon}</div>
      <div>
        <div className="text-2xl font-bold">{unit}{count.toLocaleString()}</div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
        {change !== 0 && (
          <div className="text-xs mt-0.5" style={{ color: change > 0 ? "#22c55e" : "#ef4444" }}>
            {change > 0 ? "↑" : "↓"} {Math.abs(change)}% this week
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 6. Notification Feed Widget ─────────────────────────────────────────────

type NType = "info" | "success" | "warn" | "error";
interface NotifItem { id: string; type: NType; message: string; at: string; read: boolean }
const NC: Record<NType, string> = { info: "#00d2ff", success: "#22c55e", warn: "#f59e0b", error: "#ef4444" };
const NOTIF_KEY = "nodeos-notifications";

const DEFAULT_NOTIFS: NotifItem[] = [
  { id: "n1", type: "success", message: "Profile node created", at: new Date(Date.now() - 60_000).toISOString(), read: false },
  { id: "n2", type: "info",    message: "New connection request from Arjun", at: new Date(Date.now() - 180_000).toISOString(), read: false },
  { id: "n3", type: "warn",    message: "Wallet below ₹100", at: new Date(Date.now() - 600_000).toISOString(), read: true },
];

export function NotificationWidget() {
  const [items, setItems] = useState<NotifItem[]>(() => {
    try { const r = localStorage.getItem(NOTIF_KEY); return r ? JSON.parse(r) : DEFAULT_NOTIFS; } catch { return DEFAULT_NOTIFS; }
  });

  function markRead(id: string) {
    const next = items.map((n) => n.id === id ? { ...n, read: true } : n);
    setItems(next);
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch { /**/ }
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold flex items-center gap-1">
          <Bell size={12} /> Notifications
          {unread > 0 && <span className="badge badge-red text-xs">{unread}</span>}
        </span>
        <button className="text-xs" style={{ color: "var(--muted)" }}
          onClick={() => setItems((p) => p.map((n) => ({ ...n, read: true })))}>Clear all</button>
      </div>
      {items.slice(0, 5).map((n) => (
        <div key={n.id} className="flex items-start gap-2 rounded-xl px-2 py-1.5 cursor-pointer"
          style={{ background: n.read ? "transparent" : `${NC[n.type]}10`, border: `1px solid ${n.read ? "var(--border)" : NC[n.type] + "33"}`, opacity: n.read ? 0.55 : 1 }}
          onClick={() => markRead(n.id)}>
          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: NC[n.type] }} />
          <div className="min-w-0">
            <div className="text-xs">{n.message}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{new Date(n.at).toLocaleTimeString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 7. Embed Widget ──────────────────────────────────────────────────────────

export function EmbedWidget({ config }: { config: Record<string, unknown> }) {
  const url    = config.url    as string | undefined;
  const height = (config.height as number) ?? 200;
  const title  = (config.title  as string) ?? "Embedded Content";

  if (!url) return (
    <div className="flex items-center justify-center rounded-xl py-8"
      style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
      <div className="text-center text-xs" style={{ color: "var(--muted)" }}>
        <Code size={20} className="mx-auto mb-2 opacity-40" /> Set URL in widget settings
      </div>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <iframe title={title} src={url} width="100%" height={height} style={{ border: 0, display: "block" }}
        sandbox="allow-scripts allow-same-origin allow-forms" />
    </div>
  );
}

// ─── 8. Tag Cloud Widget ──────────────────────────────────────────────────────

const HC = ["#6c63ff","#00d2ff","#22c55e","#f59e0b","#ef4444","#a855f7","#06b6d4","#f97316","#ec4899","#84cc16"];
const DEFAULT_TAGS = ["NodeOS","Family","Tech","India","Cricket","Blockchain","Music","Travel","AI","Yoga"].map((l, i) => ({ label: l, count: 40 - i * 3, color: HC[i] }));

export function TagCloudWidget({ config }: { config: Record<string, unknown> }) {
  const tags = (config.tags as Array<{ label: string; count?: number; color?: string }>) ?? DEFAULT_TAGS;
  const max  = Math.max(...tags.map((t) => t.count ?? 10));
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => {
        const scale = 0.65 + 0.6 * ((t.count ?? 10) / max);
        const c = t.color ?? HC[i % HC.length];
        return (
          <span key={t.label} className="px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80"
            style={{ fontSize: `${scale * 0.75}rem`, background: c + "20", color: c, border: `1px solid ${c}44` }}>
            <Tag size={9} className="inline mr-1" />{t.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── 9. Link Preview Widget ───────────────────────────────────────────────────

export function LinkPreviewWidget({ config }: { config: Record<string, unknown> }) {
  const url   = (config.url   as string) ?? "";
  const title = (config.title as string) ?? "NodeOS — Human Operating System";
  const desc  = (config.desc  as string) ?? "Everything is a node";
  const image = config.image  as string | undefined;

  if (!url) return <div className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>Set URL in settings</div>;

  let hostname = url;
  try { hostname = new URL(url).hostname; } catch { /**/ }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex gap-3 rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
      style={{ background: "var(--bg)", border: "1px solid var(--border)", textDecoration: "none" }}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" style={{ width: 72, flexShrink: 0, objectFit: "cover" }} />
      )}
      <div className="p-3 min-w-0">
        <div className="text-xs mb-1 truncate" style={{ color: "var(--muted)" }}>{hostname}</div>
        <div className="text-xs font-semibold truncate">{title}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--muted)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{desc}</div>
      </div>
      <div className="p-2 self-center shrink-0"><ExternalLink size={12} style={{ color: "var(--muted)" }} /></div>
    </a>
  );
}

// ─── 10. Markdown Notes Widget ────────────────────────────────────────────────

export function MarkdownWidget({ config }: { config: Record<string, unknown> }) {
  const source = (config.source as string) ?? "## NodeOS Notes\n\nWrite **markdown** content here.\n\n- Item one\n- Item two\n\n> *Quotes are styled automatically*";

  function render(md: string): string {
    return md
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/^### (.+)$/gm, "<h4 style='font-size:.8rem;font-weight:700;margin:6px 0 2px'>$1</h4>")
      .replace(/^## (.+)$/gm,  "<h3 style='font-size:.9rem;font-weight:700;margin:8px 0 3px'>$1</h3>")
      .replace(/^# (.+)$/gm,   "<h2 style='font-size:1rem;font-weight:700;margin:8px 0 3px'>$1</h2>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em style='color:var(--muted)'>$1</em>")
      .replace(/`(.+?)`/g, "<code style='font-family:monospace;background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;font-size:0.8em'>$1</code>")
      .replace(/^> (.+)$/gm, "<blockquote style='border-left:3px solid var(--accent);padding-left:8px;color:var(--muted);margin:3px 0'>$1</blockquote>")
      .replace(/^- (.+)$/gm, "<li style='margin:2px 0 2px 14px;list-style:disc'>$1</li>")
      .replace(/\n\n/g, "<br/>");
  }

  return (
    <div className="text-xs leading-relaxed overflow-auto" style={{ maxHeight: 240 }}
      dangerouslySetInnerHTML={{ __html: render(source) }} />
  );
}

// ─── Notification widget needs no config prop ─────────────────────────────────
// Export a config-accepting version too
export function NotificationWidgetC({ config: _c }: { config: Record<string, unknown> }) {
  return <NotificationWidget />;
}

export { Zap, Hash, FileText }; // re-export for convenience
