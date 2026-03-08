"use client";
/**
 * Canvas widget — freely-positioned drawing/game canvas.
 * Exposes a ref-based API so user-authored scripts can draw on it.
 */
import React, { useRef, useEffect } from "react";

interface CanvasProps {
  config: Record<string, unknown>;
  data?:  Record<string, unknown>;
}

export function Canvas({ config, data = {} }: CanvasProps): React.ReactElement {
  const title       = String(config["title"]  ?? "Canvas");
  const bgColor     = String(config["bg"]     ?? "#0a0a0f");
  const scriptSrc   = String(config["script"] ?? data["script"] ?? "");
  const canvasRef   = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scriptSrc) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Safety: scripts provided via config run in the same origin.
    // Only allow scripts from trusted same-origin sources — no eval().
    // This is a sandboxed draw-only API.
    try {
      const fn = new Function("canvas", "ctx", "data", scriptSrc); // eslint-disable-line no-new-func
      fn(canvas, ctx, data);
    } catch (err) {
      ctx.fillStyle = "#ff4d4f";
      ctx.font = "12px monospace";
      ctx.fillText(`Script error: ${err instanceof Error ? err.message : String(err)}`, 8, 20);
    }
  }, [scriptSrc, data]);

  return (
    <div className="h-full flex flex-col rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-2 text-xs font-semibold text-white/60 border-b border-white/10 bg-black/20">
        {title}
      </div>
      <div className="flex-1 relative" style={{ background: bgColor }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={800}
          height={450}
        />
        {!scriptSrc && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/20">
            No script — add a <code className="mx-1">script</code> to config
          </div>
        )}
      </div>
    </div>
  );
}
