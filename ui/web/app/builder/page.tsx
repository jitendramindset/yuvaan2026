"use client";
/**
 * NodeOS Dashboard Builder — Elementor-style UI
 *
 * Left panel  : Widget palette (categorised)
 * Centre      : 12-column drag-drop canvas
 * Right panel : Selected-widget property editor
 *
 * Layout is persisted to localStorage under LAYOUT_STORAGE_KEY.
 * Dashboard page reads the same key → changes appear immediately.
 */
import {
  useCallback, useEffect, useRef, useState,
} from "react";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, Eye, ChevronLeft, Plus, Minus } from "lucide-react";
import {
  WidgetRenderer,
  LayoutWidget,
  WIDGET_CATALOGUE,
  DEFAULT_LAYOUT,
  LAYOUT_STORAGE_KEY,
  CatalogueEntry,
} from "@/components/widgets/WidgetRenderer";

// ─── Grid constants ────────────────────────────────────────────────────────────
const COLS       = 12;
const ROW_H      = 80;   // px per row unit
const GAP        = 8;    // px between cells

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `w-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function gridPos(
  e: React.MouseEvent | MouseEvent,
  canvasEl: HTMLElement,
  colWidth: number,
): { col: number; row: number } {
  const rect = canvasEl.getBoundingClientRect();
  const col  = clamp(Math.floor((e.clientX - rect.left) / colWidth), 0, COLS - 1);
  const row  = clamp(Math.floor((e.clientY - rect.top)  / (ROW_H + GAP)), 0, 99);
  return { col, row };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const router = useRouter();
  const canvasRef   = useRef<HTMLDivElement>(null);
  const colWidthRef = useRef<number>(100);

  const [layout, setLayout]     = useState<LayoutWidget[]>(DEFAULT_LAYOUT);
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);
  const [palCat, setPalCat]     = useState<string>("all");

  // Drag state
  const dragIdRef     = useRef<string | null>(null);
  const dragOffColRef = useRef<number>(0); // column offset within dragged widget
  const dragOffRowRef = useRef<number>(0); // row offset within dragged widget
  const [ghostPos, setGhostPos] = useState<{ col: number; row: number } | null>(null);
  const [ghostSize, setGhostSize] = useState<{ w: number; h: number }>({ w: 4, h: 3 });

  // Recalculate column width when canvas resizes
  useEffect(() => {
    const update = () => {
      if (canvasRef.current) {
        colWidthRef.current = (canvasRef.current.clientWidth + GAP) / COLS;
      }
    };
    update();
    const obs = new ResizeObserver(update);
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, []);

  // Load saved layout
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) setLayout(JSON.parse(raw) as LayoutWidget[]);
    } catch { /* use defaults */ }
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────────

  const onWidgetDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const w = layout.find((x) => x.id === id);
    if (!w) return;
    dragIdRef.current = id;
    // compute offset: which column/row within the widget was clicked
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      dragOffColRef.current = clamp(Math.floor((e.clientX - rect.left) / colWidthRef.current) - w.x, 0, w.w - 1);
      dragOffRowRef.current = clamp(Math.floor((e.clientY - rect.top) / (ROW_H + GAP)) - w.y, 0, w.h - 1);
    }
    setGhostSize({ w: w.w, h: w.h });
  }, [layout]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragIdRef.current || !canvasRef.current) return;
    const { col, row } = gridPos(e, canvasRef.current, colWidthRef.current);
    const newCol = clamp(col - dragOffColRef.current, 0, COLS - ghostSize.w);
    const newRow = clamp(row - dragOffRowRef.current, 0, 99);
    setGhostPos({ col: newCol, row: newRow });
  }, [ghostSize.w]);

  const onMouseUp = useCallback(() => {
    const id = dragIdRef.current;
    if (id && ghostPos) {
      setLayout((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, x: ghostPos.col, y: ghostPos.row } : w,
        ),
      );
    }
    dragIdRef.current = null;
    setGhostPos(null);
  }, [ghostPos]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── Layout mutations ──────────────────────────────────────────────────────────

  const addWidget = (entry: CatalogueEntry) => {
    const maxY = layout.reduce((m, w) => Math.max(m, w.y + w.h), 0);
    const newW: LayoutWidget = {
      id:          uid(),
      widget_type: entry.type,
      x: 0, y: maxY,
      w: entry.defaultW, h: entry.defaultH,
      config: { title: entry.label },
    };
    setLayout((p) => [...p, newW]);
    setSelected(newW.id);
  };

  const deleteWidget = (id: string) => {
    setLayout((p) => p.filter((w) => w.id !== id));
    if (selected === id) setSelected(null);
  };

  const updateConfig = (id: string, patch: Partial<LayoutWidget["config"]>) => {
    setLayout((p) =>
      p.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...patch } } : w)),
    );
  };

  const resizeWidget = (id: string, dw: number, dh: number) => {
    setLayout((p) =>
      p.map((w) =>
        w.id === id
          ? { ...w, w: clamp(w.w + dw, 1, COLS), h: clamp(w.h + dh, 1, 12) }
          : w,
      ),
    );
  };

  const save = () => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    setLayout(DEFAULT_LAYOUT);
    setSelected(null);
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const selectedWidget = layout.find((w) => w.id === selected) ?? null;
  const maxRow         = layout.reduce((m, w) => Math.max(m, w.y + w.h), 0) + 2;
  const categories     = ["all", ...Array.from(new Set(WIDGET_CATALOGUE.map((e) => e.category)))];
  const palette        = palCat === "all" ? WIDGET_CATALOGUE : WIDGET_CATALOGUE.filter((e) => e.category === palCat);

  // ── Grid style helpers ────────────────────────────────────────────────────────

  const cellStyle = (w: LayoutWidget, ghost: boolean): React.CSSProperties => {
    const px = w.h * ROW_H + (w.h - 1) * GAP;
    const isBeingDragged = dragIdRef.current === w.id;
    return {
      gridColumnStart: w.x + 1,
      gridColumnEnd:   `span ${w.w}`,
      gridRowStart:    w.y + 1,
      gridRowEnd:      `span ${w.h}`,
      height: px,
      minHeight: px,
      opacity: ghost ? 0.4 : isBeingDragged ? 0.35 : 1,
      transition: ghost ? "none" : "opacity 0.1s ease",
      pointerEvents: isBeingDragged ? "none" : "auto",
    };
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 56px)",
        margin: "0 -1rem",            // break out of px-4 wrapper
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="btn btn-secondary text-xs py-1 px-2 gap-1"
        >
          <ChevronLeft size={13} /> Dashboard
        </button>

        <div className="text-sm font-semibold ml-1">Dashboard Builder</div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-secondary text-xs py-1 px-2 gap-1"
          >
            <Eye size={13} /> Preview
          </button>
          <button
            onClick={reset}
            className="btn btn-secondary text-xs py-1 px-2 gap-1"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={save}
            className="btn btn-primary text-xs py-1 px-3 gap-1"
            style={saved ? { background: "var(--success)" } : {}}
          >
            <Save size={13} /> {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left: Widget Palette ── */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div className="px-3 py-2 text-xs font-semibold" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
            WIDGET PALETTE
          </div>

          {/* Category tabs */}
          <div
            className="flex gap-1 flex-wrap px-2 py-2 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setPalCat(c)}
                className="badge text-xs capitalize"
                style={{
                  cursor: "pointer",
                  background: palCat === c ? "rgba(108,99,255,0.25)" : "var(--bg)",
                  color: palCat === c ? "var(--accent)" : "var(--muted)",
                  border: "1px solid var(--border)",
                  fontWeight: palCat === c ? 700 : 500,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Widget list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {palette.map((entry) => (
              <button
                key={entry.type}
                onClick={() => addWidget(entry)}
                className="w-full text-left p-2.5 rounded-xl transition-all"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.background   = "rgba(108,99,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background   = "var(--bg)";
                }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base">{entry.icon}</span>
                  <span className="text-xs font-semibold">{entry.label}</span>
                  <span
                    className="badge text-xs ml-auto"
                    style={{ background: "var(--border)", color: "var(--muted)" }}
                  >
                    {entry.defaultW}×{entry.defaultH}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "var(--muted)", lineHeight: 1.4 }}>
                  {entry.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Centre: Grid Canvas ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: GAP }}>
          {/* Instructions */}
          <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>
            Click a widget in the palette to add · Drag the title bar to move · Select a widget to edit properties
          </div>

          <div
            ref={canvasRef}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows:    `repeat(${maxRow}, ${ROW_H}px)`,
              gap: `${GAP}px`,
              minHeight: maxRow * (ROW_H + GAP),
            }}
          >
            {/* Drop-zone background cells */}
            {Array.from({ length: maxRow }).map((_, row) =>
              Array.from({ length: COLS }).map((__, col) => (
                <div
                  key={`cell-${row}-${col}`}
                  style={{
                    gridColumn: col + 1,
                    gridRow: row + 1,
                    border: "1px dashed",
                    borderColor: "rgba(108,99,255,0.08)",
                    borderRadius: 6,
                  }}
                />
              )),
            )}

            {/* Ghost placeholder while dragging */}
            {ghostPos && (
              <div
                style={{
                  gridColumnStart: ghostPos.col + 1,
                  gridColumnEnd:   `span ${ghostSize.w}`,
                  gridRowStart:    ghostPos.row + 1,
                  gridRowEnd:      `span ${ghostSize.h}`,
                  border: "2px dashed var(--accent)",
                  borderRadius: 12,
                  background: "rgba(108,99,255,0.10)",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Widgets */}
            {layout.map((w) => (
              <div
                key={w.id}
                style={cellStyle(w, false)}
              >
                <WidgetRenderer
                  widget={w}
                  editMode
                  selected={selected === w.id}
                  onSelect={setSelected}
                  onDelete={deleteWidget}
                  onDragStart={onWidgetDragStart}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Properties ── */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            className="px-3 py-2 text-xs font-semibold shrink-0"
            style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
          >
            PROPERTIES
          </div>

          {!selectedWidget ? (
            <div
              className="flex-1 flex items-center justify-center text-xs text-center p-4"
              style={{ color: "var(--muted)" }}
            >
              Select a widget on the canvas to edit its properties
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">

              {/* Type & ID */}
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>WIDGET</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {WIDGET_CATALOGUE.find((e) => e.type === selectedWidget.widget_type)?.icon ?? "🧩"}
                  </span>
                  <div>
                    <div className="text-xs font-semibold">{selectedWidget.widget_type}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>id: {selectedWidget.id}</div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted)" }}>TITLE</label>
                <input
                  type="text"
                  value={String(selectedWidget.config.title ?? "")}
                  onChange={(e) => updateConfig(selectedWidget.id, { title: e.target.value })}
                  placeholder="Widget title…"
                  className="text-xs"
                  style={{ padding: "6px 8px" }}
                />
              </div>

              {/* Accent color */}
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted)" }}>ACCENT COLOR</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={String(selectedWidget.config.accent ?? "#6c63ff")}
                    onChange={(e) => updateConfig(selectedWidget.id, { accent: e.target.value })}
                    style={{ width: 36, height: 28, padding: 2, borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", background: "var(--bg)" }}
                  />
                  <input
                    type="text"
                    value={String(selectedWidget.config.accent ?? "#6c63ff")}
                    onChange={(e) => {
                      if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                        updateConfig(selectedWidget.id, { accent: e.target.value });
                    }}
                    placeholder="#6c63ff"
                    className="text-xs flex-1"
                    style={{ padding: "4px 8px", fontFamily: "monospace" }}
                  />
                  <button
                    className="text-xs"
                    style={{ color: "var(--muted)", fontSize: 10, padding: "2px 4px" }}
                    onClick={() => updateConfig(selectedWidget.id, { accent: undefined })}
                    title="Reset to default"
                  >
                    ↺
                  </button>
                </div>
                {/* Quick palette */}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {["#6c63ff","#a855f7","#22c55e","#f59e0b","#00d2ff","#ec4899","#f97316","#ef4444","#3b82f6"].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateConfig(selectedWidget.id, { accent: c })}
                      title={c}
                      style={{
                        width: 18, height: 18, borderRadius: 4, background: c,
                        border: selectedWidget.config.accent === c ? "2px solid white" : "2px solid transparent",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>POSITION</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Column (x)", key: "x", max: COLS - 1 },
                    { label: "Row (y)", key: "y", max: 99 },
                  ].map(({ label, key, max }) => (
                    <div key={key}>
                      <div style={{ color: "var(--muted)" }} className="mb-1">{label}</div>
                      <input
                        type="number"
                        min="0"
                        max={max}
                        value={(selectedWidget as unknown as Record<string, number>)[key]}
                        onChange={(e) =>
                          setLayout((p) =>
                            p.map((w) =>
                              w.id === selectedWidget.id
                                ? { ...w, [key]: clamp(Number(e.target.value), 0, max) }
                                : w,
                            ),
                          )
                        }
                        style={{ padding: "4px 8px", fontSize: 12 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>SIZE</div>
                {[
                  { label: "Width (cols)", dim: "w" as const, min: 1, max: COLS },
                  { label: "Height (rows)", dim: "h" as const, min: 1, max: 12 },
                ].map(({ label, dim, min, max }) => (
                  <div key={dim} className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: "var(--muted)" }}>{label}</span>
                      <span className="font-semibold">{selectedWidget[dim]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "2px 8px", fontSize: 14 }}
                        onClick={() => resizeWidget(selectedWidget.id, dim === "w" ? -1 : 0, dim === "h" ? -1 : 0)}
                        disabled={selectedWidget[dim] <= min}
                      >
                        <Minus size={12} />
                      </button>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${((selectedWidget[dim] - min) / (max - min)) * 100}%`,
                            background: "var(--accent)",
                          }}
                        />
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "2px 8px", fontSize: 14 }}
                        onClick={() => resizeWidget(selectedWidget.id, dim === "w" ? 1 : 0, dim === "h" ? 1 : 0)}
                        disabled={selectedWidget[dim] >= max}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra config (JSON freeform) */}
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>EXTRA CONFIG (JSON)</div>
                <textarea
                  rows={4}
                  value={JSON.stringify({ ...selectedWidget.config, title: undefined }, null, 2)}
                  onChange={(e) => {
                    try {
                      const extra = JSON.parse(e.target.value) as Record<string, unknown>;
                      updateConfig(selectedWidget.id, extra);
                    } catch { /* ignore invalid JSON */ }
                  }}
                  style={{ fontSize: 11, fontFamily: "monospace", resize: "vertical" }}
                />
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteWidget(selectedWidget.id)}
                className="btn btn-danger w-full justify-center text-xs"
              >
                Remove Widget
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
