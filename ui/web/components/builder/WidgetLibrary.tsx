"use client";
/**
 * WidgetLibrary — palette panel listing all available widgets with
 * drag-to-canvas support via HTML5 drag-and-drop API.
 */
import React from "react";
import { WIDGET_CATALOGUE, type CatalogueEntry } from "../widgets/WidgetRenderer";

const CATEGORY_COLORS: Record<string, string> = {
  Identity:  "#6c63ff",
  Finance:   "#22c55e",
  Analytics: "#f59e0b",
  AI:        "#00d2ff",
  System:    "#94a3b8",
  Data:      "#f97316",
  Device:    "#ec4899",
  Navigation:"#a78bfa",
};

interface WidgetLibraryProps {
  onAdd?: (entry: CatalogueEntry) => void;
}

export function WidgetLibrary({ onAdd }: WidgetLibraryProps): React.ReactElement {
  const categories = [...new Set(WIDGET_CATALOGUE.map((e) => e.category))];

  function handleDragStart(e: React.DragEvent, entry: CatalogueEntry) {
    e.dataTransfer.setData("application/x-widget-type", JSON.stringify(entry));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="flex flex-col h-full bg-black/30 border-r border-white/10 w-60 shrink-0 overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold text-white/50 border-b border-white/10 sticky top-0 bg-black/50 backdrop-blur">
        Widget Library
      </div>
      {categories.map((cat) => (
        <div key={cat}>
          <div
            className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold"
            style={{ color: CATEGORY_COLORS[cat] ?? "#6c63ff" }}
          >
            {cat}
          </div>
          {WIDGET_CATALOGUE.filter((e) => e.category === cat).map((entry) => (
            <div
              key={entry.type}
              draggable
              onDragStart={(e) => handleDragStart(e, entry)}
              onClick={() => onAdd?.(entry)}
              className="mx-2 mb-1 px-2 py-1.5 rounded-lg cursor-grab bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
              title={entry.desc}
            >
              <span className="text-base">{entry.icon}</span>
              <div className="min-w-0">
                <div className="text-xs text-white font-medium truncate">{entry.label}</div>
                <div className="text-[10px] text-white/40 truncate">{entry.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
