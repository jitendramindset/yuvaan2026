"use client";
/** Feed widget — social post / activity feed. */
import React from "react";

interface FeedProps {
  config: Record<string, unknown>;
  data?:  Record<string, unknown>;
}

interface FeedItem {
  id:      string;
  author:  string;
  avatar?: string;
  content: string;
  ts:      string;
  likes?:  number;
}

export function Feed({ config, data = {} }: FeedProps): React.ReactElement {
  const title  = String(config["title"] ?? "Feed");
  const items: FeedItem[] = Array.isArray(data["items"])
    ? (data["items"] as FeedItem[])
    : [];

  return (
    <div className="h-full flex flex-col rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 text-xs font-semibold text-white/60 border-b border-white/10">
        {title}
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {items.length === 0 ? (
          <div className="p-4 text-xs text-white/30 text-center">Nothing here yet</div>
        ) : items.map((item) => (
          <div key={item.id} className="px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {item.avatar ?? item.author[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-semibold text-white">{item.author}</span>
                <span className="text-[10px] text-white/30">{item.ts}</span>
              </div>
              <p className="text-xs text-white/70 line-clamp-3">{item.content}</p>
              {typeof item.likes === "number" && (
                <div className="mt-1 text-[10px] text-white/30">❤ {item.likes}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
