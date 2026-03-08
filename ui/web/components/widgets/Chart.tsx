"use client";
/**
 * Chart widget — lightweight bar chart using pure CSS / SVG.
 * No external chart library dependency.
 */
import React from "react";

interface ChartProps {
  config: Record<string, unknown>;
  data?:  Record<string, unknown>;
}

interface SeriesPoint { label: string; value: number }

export function Chart({ config, data = {} }: ChartProps): React.ReactElement {
  const title  = String(config["title"]  ?? "Chart");
  const type   = String(config["type"]   ?? "bar");    // bar | line (line rendered as bar for now)
  const accent = String(config["accent"] ?? "#6c63ff");

  const series: SeriesPoint[] = Array.isArray(data["series"])
    ? (data["series"] as SeriesPoint[])
    : [];

  const max = Math.max(...series.map((s) => s.value), 1);

  return (
    <div className="h-full flex flex-col rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 flex items-center justify-between text-xs text-white/60 border-b border-white/10">
        <span className="font-semibold">{title}</span>
        <span className="uppercase text-white/30">{type}</span>
      </div>
      <div className="flex-1 flex items-end gap-1 px-4 pb-4 pt-2 overflow-x-auto">
        {series.length === 0 ? (
          <div className="w-full text-center text-xs text-white/30 self-center">No data</div>
        ) : series.map((point, i) => {
          const pct = (point.value / max) * 100;
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
              <span className="text-[10px] text-white/50">{point.value}</span>
              <div
                className="w-full rounded-t transition-all"
                style={{ height: `${Math.max(pct, 4)}%`, background: accent }}
              />
              <span className="text-[10px] text-white/40 truncate w-full text-center">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
