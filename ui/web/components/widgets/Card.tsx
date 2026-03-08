"use client";
/** Card widget — generic info card with title, value, subtitle and an icon. */
import React from "react";

interface CardProps {
  config: Record<string, unknown>;
  data?:  Record<string, unknown>;
}

export function Card({ config, data = {} }: CardProps): React.ReactElement {
  const title    = String(config["title"]    ?? data["title"]    ?? "Card");
  const value    = String(data["value"]      ?? data["count"]    ?? "—");
  const subtitle = String(config["subtitle"] ?? data["subtitle"] ?? "");
  const icon     = String(config["icon"]     ?? data["icon"]     ?? "📦");
  const accent   = String(config["accent"]   ?? "#6c63ff");

  return (
    <div className="h-full rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-2 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between text-white/60 text-xs">
        <span>{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white" style={{ color: accent }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-white/40">{subtitle}</div>
      )}
    </div>
  );
}
