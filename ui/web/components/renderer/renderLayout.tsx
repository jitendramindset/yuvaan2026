"use client";
/**
 * renderLayout — converts a dashboard layout descriptor into a 12-column
 * CSS grid of rendered widgets.
 *
 * Each widget in the layout must have:
 *   { id, widget_type, x, y, w, h, config }
 * where x/y/w/h are grid coordinates (1-indexed, max 12 columns).
 */
import React from "react";
import { renderWidget } from "./renderWidget";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LayoutItem {
  id:          string;
  widget_type: string;
  x:           number;  // 1–12
  y:           number;  // grid row start
  w:           number;  // column span
  h:           number;  // row span (each unit = 80 px)
  config:      Record<string, unknown>;
  data?:       Record<string, unknown>;
}

export interface LayoutDescriptor {
  layout_id: string;
  title?:    string;
  cols?:     number;  // default 12
  items:     LayoutItem[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RenderLayout({ layout }: { layout: LayoutDescriptor }): React.ReactElement {
  const cols = layout.cols ?? 12;

  return (
    <div
      className="w-full"
      style={{
        display:             "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap:                 "12px",
      }}
    >
      {layout.items.map((item) => (
        <div
          key={item.id}
          style={{
            gridColumnStart: item.x,
            gridColumnEnd:   item.x + item.w,
            gridRowStart:    item.y,
            gridRowEnd:      item.y + item.h,
            minHeight:       `${item.h * 80}px`,
          }}
        >
          {renderWidget({
            widget_type: item.widget_type,
            config:      item.config,
            data:        item.data,
            node_id:     item.id,
          })}
        </div>
      ))}
    </div>
  );
}
