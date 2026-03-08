"use client";
/**
 * PropertyPanel — right-hand panel for editing the selected widget's
 * config and layout properties.
 */
import React from "react";
import type { LayoutWidget } from "../widgets/WidgetRenderer";

interface PropertyPanelProps {
  selected:  LayoutWidget | null;
  onChange:  (updated: LayoutWidget) => void;
  onDelete?: (id: string) => void;
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-white/40 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/10 border border-white/10 rounded-md px-2 py-1 text-xs text-white"
      />
    </div>
  );
}

export function PropertyPanel({ selected, onChange, onDelete }: PropertyPanelProps): React.ReactElement {
  if (!selected) {
    return (
      <div className="w-56 shrink-0 bg-black/30 border-l border-white/10 flex items-center justify-center">
        <p className="text-xs text-white/30 text-center px-4">Select a widget to edit its properties</p>
      </div>
    );
  }

  function update(patch: Partial<LayoutWidget>) {
    onChange({ ...selected!, ...patch });
  }

  function updateConfig(key: string, value: string) {
    onChange({ ...selected!, config: { ...selected!.config, [key]: value } });
  }

  return (
    <div className="w-56 shrink-0 bg-black/30 border-l border-white/10 flex flex-col overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold text-white/50 border-b border-white/10 sticky top-0 bg-black/50 backdrop-blur flex justify-between items-center">
        <span>Properties</span>
        <span className="text-white/30 font-normal">{selected.widget_type}</span>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Layout */}
        <div className="text-[10px] text-white/40 uppercase tracking-wider pt-1">Layout</div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Col" value={selected.x} type="number" onChange={(v) => update({ x: Number(v) })} />
          <Field label="Row" value={selected.y} type="number" onChange={(v) => update({ y: Number(v) })} />
          <Field label="Width" value={selected.w} type="number" onChange={(v) => update({ w: Number(v) })} />
          <Field label="Height" value={selected.h} type="number" onChange={(v) => update({ h: Number(v) })} />
        </div>

        {/* Config */}
        <div className="text-[10px] text-white/40 uppercase tracking-wider pt-1">Config</div>
        <Field
          label="Title"
          value={String(selected.config["title"] ?? "")}
          onChange={(v) => updateConfig("title", v)}
        />
        <Field
          label="Accent color"
          value={String(selected.config["accent"] ?? "#6c63ff")}
          type="color"
          onChange={(v) => updateConfig("accent", v)}
        />

        {/* ID */}
        <div className="text-[10px] text-white/20 font-mono mt-2">id: {selected.id}</div>

        {/* Delete */}
        {onDelete && (
          <button
            onClick={() => onDelete(selected.id)}
            className="mt-2 rounded-lg border border-red-500/30 text-red-400 text-xs py-1.5 hover:bg-red-500/10 transition-colors"
          >
            Remove widget
          </button>
        )}
      </div>
    </div>
  );
}
