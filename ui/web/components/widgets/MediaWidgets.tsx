"use client";
/**
 * MediaWidgets — Map, Camera, Video, Audio, QR, Post/Social, Image Gallery
 * All accept { config: Record<string, unknown> }
 */
import { useEffect, useState, useRef } from "react";
import { MapPin, Camera, Video, Music, QrCode, Heart,
         Share2, MessageCircle, Play, Pause, SkipBack,
         SkipForward, Grid, Image as ImageIcon, Radio } from "lucide-react";

// ─── 1. Map Widget ────────────────────────────────────────────────────────────
export function MapWidget({ config }: { config: Record<string, unknown> }) {
  const lat   = (config.lat  as string) || "19.076";
  const lon   = (config.lon  as string) || "72.8777";
  const zoom  = (config.zoom as string) || "13";
  const label = (config.label as string) || "Location";
  const showMap = config.showMap !== false;

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lon)-0.05},${Number(lat)-0.05},${Number(lon)+0.05},${Number(lat)+0.05}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-xs">
        <MapPin size={13} style={{ color: "var(--accent)" }} />
        <span className="font-semibold">{label}</span>
        <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>{lat}, {lon}</span>
      </div>
      {showMap ? (
        <div className="flex-1 rounded-xl overflow-hidden" style={{ minHeight: 140, border: "1px solid var(--border)" }}>
          <iframe
            title="Map"
            src={src}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: 140 }}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-xl"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", minHeight: 80 }}>
          <div className="text-center text-xs" style={{ color: "var(--muted)" }}>
            <MapPin size={20} className="mx-auto mb-1 opacity-40" />
            Enable map in widget settings
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2. Camera Feed ───────────────────────────────────────────────────────────
export function CameraWidget({ config }: { config: Record<string, unknown> }) {
  const url       = config.url as string | undefined;
  const autoRefresh = config.autoRefresh as boolean | undefined;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!autoRefresh || !url) return;
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, [autoRefresh, url]);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-xs">
        <Radio size={12} style={{ color: "#ef4444" }} />
        <span className="font-semibold">{(config.title as string) || "Camera Feed"}</span>
        <span className="ml-auto text-xs badge badge-red">● LIVE</span>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: "#000", border: "1px solid var(--border)", minHeight: 100 }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${url}${autoRefresh ? `?t=${tick}` : ""}`}
            alt="camera"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="text-center">
            <Camera size={28} style={{ color: "#666" }} className="mx-auto mb-2" />
            <div className="text-xs" style={{ color: "#888" }}>No camera configured</div>
            <div className="text-xs mt-1" style={{ color: "#555" }}>Set camera URL in widget settings</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. Video Player ──────────────────────────────────────────────────────────
export function VideoWidget({ config }: { config: Record<string, unknown> }) {
  const url   = (config.url as string) || "";
  const title = (config.title as string) || "Video";

  // Build YouTube embed URL if it's a YouTube link
  function getEmbedUrl(raw: string): string | null {
    if (!raw) return null;
    const ytMatch = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    if (raw.startsWith("http")) return raw;
    return null;
  }

  const embedUrl = getEmbedUrl(url);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-xs">
        <Video size={12} style={{ color: "#ef4444" }} />
        <span className="font-semibold truncate">{title}</span>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: "#000", minHeight: 100, border: "1px solid var(--border)" }}>
        {embedUrl ? (
          <iframe
            title={title}
            src={embedUrl}
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: 0, minHeight: 120 }}
          />
        ) : (
          <div className="text-center">
            <Play size={28} style={{ color: "#555" }} className="mx-auto mb-2" />
            <div className="text-xs" style={{ color: "#888" }}>Add a YouTube URL or video URL in settings</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 4. Audio Player ──────────────────────────────────────────────────────────
export function AudioWidget({ config }: { config: Record<string, unknown> }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const url     = config.url     as string | undefined;
  const title   = (config.title  as string) || "Audio";
  const artist  = (config.artist as string) || "";
  const albumArt = config.albumArt as string | undefined;

  function toggle() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  }

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const update = () => setProgress((el.currentTime / (el.duration || 1)) * 100);
    el.addEventListener("timeupdate", update);
    return () => el.removeEventListener("timeupdate", update);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {url && <audio ref={audioRef} src={url} />}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: albumArt ? `url(${albumArt})` : "linear-gradient(135deg,#6c63ff,#00d2ff)", backgroundSize: "cover" }}>
          {!albumArt && <Music size={20} style={{ color: "#fff" }} />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">{title}</div>
          {artist && <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{artist}</div>}
        </div>
      </div>
      <div className="rounded-full overflow-hidden h-1" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "var(--accent)" }} />
      </div>
      <div className="flex items-center justify-center gap-4">
        <button className="p-1.5 rounded-full" style={{ color: "var(--muted)" }} onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}>
          <SkipBack size={14} />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent)", color: "#fff" }} onClick={toggle}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button className="p-1.5 rounded-full" style={{ color: "var(--muted)" }}>
          <SkipForward size={14} />
        </button>
      </div>
      {!url && (
        <div className="text-xs text-center" style={{ color: "var(--muted)" }}>Set audio URL in widget settings</div>
      )}
    </div>
  );
}

// ─── 5. QR Code Widget ────────────────────────────────────────────────────────
export function QRWidget({ config }: { config: Record<string, unknown> }) {
  const text  = (config.text  as string) || "https://nodeos.app";
  const label = (config.label as string) || "Scan QR";
  const size  = 120;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=14182a&color=6c63ff&format=svg`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl overflow-hidden p-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="QR" width={size} height={size} style={{ display: "block" }} />
      </div>
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-xs text-center break-all px-2" style={{ color: "var(--muted)", fontSize: 10 }}>{text}</div>
    </div>
  );
}

// ─── 6. Post / Social Card ────────────────────────────────────────────────────
export function PostWidget({ config }: { config: Record<string, unknown> }) {
  const [liked, setLiked] = useState(false);
  const author    = (config.author  as string) || "NodeOS User";
  const content   = (config.content as string) || "Share your thoughts with the NodeOS community...";
  const likeCount = (config.likes   as number) || 42;
  const time      = (config.time    as string) || "2 min ago";
  const image     = config.image    as string | undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "linear-gradient(135deg,#6c63ff,#00d2ff)", color: "#fff" }}>
          {author.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xs font-semibold">{author}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>{time}</div>
        </div>
      </div>
      <p className="text-xs leading-relaxed">{content}</p>
      {image && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="post" style={{ width: "100%", maxHeight: 160, objectFit: "cover" }} />
        </div>
      )}
      <div className="flex items-center gap-4 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
        <button className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: liked ? "#ef4444" : "var(--muted)" }}
          onClick={() => setLiked((v) => !v)}>
          <Heart size={13} fill={liked ? "#ef4444" : "none"} />
          {likeCount + (liked ? 1 : 0)}
        </button>
        <button className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
          <MessageCircle size={13} /> Reply
        </button>
        <button className="flex items-center gap-1 text-xs ml-auto" style={{ color: "var(--muted)" }}>
          <Share2 size={13} /> Share
        </button>
      </div>
    </div>
  );
}

// ─── 7. Image Gallery ─────────────────────────────────────────────────────────
export function ImageGalleryWidget({ config }: { config: Record<string, unknown> }) {
  const images  = (config.images as string[]) || [];
  const cols    = (config.cols   as number)   || 3;
  const maxShow = (config.max    as number)   || 9;
  const [selected, setSelected] = useState<string | null>(null);

  const shown = images.slice(0, maxShow);
  const placeholders = shown.length < 3 ? Array.from({ length: 3 - shown.length }) : [];

  return (
    <div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setSelected(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected} alt="full" style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 12 }} />
        </div>
      )}
      <div className={`grid grid-cols-${cols} gap-1.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {shown.map((src, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelected(src)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`gallery-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
        {placeholders.map((_, i) => (
          <div key={`ph-${i}`} className="aspect-square rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
            <ImageIcon size={14} style={{ color: "var(--muted)" }} />
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-3 rounded-xl p-6 text-center"
            style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
            <Grid size={24} className="mx-auto mb-2 opacity-40" style={{ color: "var(--muted)" }} />
            <div className="text-xs" style={{ color: "var(--muted)" }}>Add image URLs in widget settings</div>
          </div>
        )}
      </div>
    </div>
  );
}
