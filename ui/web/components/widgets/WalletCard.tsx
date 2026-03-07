"use client";
import { useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, QrCode } from "lucide-react";

interface Props { config: Record<string, unknown> }

export function WalletCard({ config }: Props) {
  const [showQr, setShowQr] = useState(false);

  const currency = (config.currency as string) ?? "₹";
  const balance  = (config.balance  as number) ?? 12450.0;
  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Balance */}
      <div>
        <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Dravyam Wallet</div>
        <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          {currency}&nbsp;{fmt(balance)}
        </div>
        <div className="text-xs" style={{ color: "var(--success)" }}>+2.4% this week</div>
      </div>

      {/* Income / Spent */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div className="text-xs mb-0.5" style={{ color: "var(--success)" }}>↑ Income</div>
          <div className="font-semibold text-sm">{currency} 4,200</div>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div className="text-xs mb-0.5" style={{ color: "var(--danger)" }}>↓ Spent</div>
          <div className="font-semibold text-sm">{currency} 1,750</div>
        </div>
      </div>

      {/* Last transaction */}
      <div className="text-xs p-2 rounded-lg" style={{ background: "var(--bg)" }}>
        <span style={{ color: "var(--muted)" }}>Last: </span>
        <span>₹ 450 — Grocery</span>
        <span className="float-right" style={{ color: "var(--muted)" }}>Today</span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        <button className="btn btn-secondary text-xs py-1 px-2 flex-1 justify-center gap-1">
          <ArrowUpRight size={12} /> Send
        </button>
        <button className="btn btn-secondary text-xs py-1 px-2 flex-1 justify-center gap-1">
          <ArrowDownLeft size={12} /> Receive
        </button>
        <button
          onClick={() => setShowQr((v) => !v)}
          className="btn btn-secondary text-xs py-1 px-2 justify-center"
        >
          <QrCode size={12} />
        </button>
      </div>

      {showQr && (
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ background: "var(--bg)", height: 80 }}
        >
          <span className="text-xs" style={{ color: "var(--muted)" }}>QR Code — {username(config)}</span>
        </div>
      )}
    </div>
  );
}

function username(config: Record<string, unknown>) {
  return (config.username as string) ?? "user.default";
}
