"use client";
/**
 * CanvasEditor — the central 12-column drag-and-drop editor canvas.
 *
 * Widgets can be:
 *  • dragged from the WidgetLibrary palette
 *  • clicked and moved within the canvas
 *  • selected (click) → editable in PropertyPanel
 *
 * Layout state is stored in component state and synced to localStorage.
 */
import React, { useState, useCallback, useRef } from "react";
import { renderWidget }                      from "../renderer/renderWidget";
import type { LayoutWidget, CatalogueEntry } from "../widgets/WidgetRenderer";
import { LAYOUT_STORAGE_KEY }               from "../widgets/WidgetRenderer";

// ── Types local to editor ─────────────────────────────────────────────────────

interface CanvasEditorProps {
  initialLayout: LayoutWidget[];
  onSelect?:    (widget: LayoutWidget | null) => void;
  onLayoutChange?: (layout: LayoutWidget[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return `w-${Math.random().toString(36).slice(2, 8)}`;
}

const COLS = 12;
const COL_PCT = 100 / COLS;

// ── Component ─────────────────────────────────────────────────────────────────

export function CanvasEditor({ initialLayout, onSelect, onLayoutChange }: CanvasEditorProps): React.ReactElement {
  const [layout,   setLayout]   = useState<LayoutWidget[]>(initialLayout);
  const [selected, setSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateLayout = useCallback((next: LayoutWidget[]) => {
    setLayout(next);
    try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
    onLayoutChange?.(next);
  }, [onLayoutChange]);

  // ── Drop from palette ──────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-widget-type");
    if (!raw) return;
    const entry: CatalogueEntry = JSON.parse(raw);
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? Math.max(1, Math.ceil(((e.clientX - rect.left) / rect.width) * COLS) - entry.defaultW + 1) : 1;
    const y = rect ? Math.max(1, Math.ceil((e.clientY - rect.top) / 80)) : 1;

    const widget: LayoutWidget = {
      id:          uid(),
      widget_type: entry.type,
      x:           Math.min(x, COLS - entry.defaultW + 1),
      y,
      w:           entry.defaultW,
      h:           entry.defaultH,
      config:      { title: entry.label },
    };
    updateLayout([...layout, widget]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  // ── Select ─────────────────────────────────────────────────────────────────

  function handleClick(id: string) {
    const next = selected === id ? null : id;
    setSelected(next);
    onSelect?.(next ? (layout.find((w) => w.id === next) ?? null) : null);
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-auto bg-black/10 rounded-xl border border-white/10"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid guide lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent calc(${COL_PCT}% - 1px), rgba(255,255,255,0.03) calc(${COL_PCT}% - 1px), rgba(255,255,255,0.03) ${COL_PCT}%)`,
      }} />

      {/* Widgets */}
      <div className="relative" style={{
        display:             "grid",
        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
        gap:                 "8px",
        padding:             "16px",
      }}>
        {layout.map((widget) => (
          <div
            key={widget.id}
            onClick={() => handleClick(widget.id)}
            className={`relative cursor-pointer rounded-xl transition-all ${
              selected === widget.id
                ? "ring-2 ring-[#6c63ff] ring-offset-1 ring-offset-transparent"
                : "hover:ring-1 hover:ring-white/20"
            }`}
            style={{
              gridColumnStart: widget.x,
              gridColumnEnd:   widget.x + widget.w,
              gridRowStart:    widget.y,
              gridRowEnd:      widget.y + widget.h,
              minHeight:       `${widget.h * 80}px`,
            }}
          >
            {renderWidget({ widget_type: widget.widget_type, config: widget.config })}
            {selected === widget.id && (
              <div className="absolute top-1 right-1 text-[10px] bg-[#6c63ff] text-white px-1.5 py-0.5 rounded font-mono z-10">
                {widget.widget_type}
              </div>
            )}
          </div>
        ))}
      </div>

      {layout.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
          <div className="text-4xl opacity-20">🎨</div>
          <p className="text-sm text-white/20">Drag widgets from the library</p>
        </div>
      )}
    </div>
  );
}
