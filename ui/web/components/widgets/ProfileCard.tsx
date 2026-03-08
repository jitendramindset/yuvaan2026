"use client";
import { useEffect, useState } from "react";
import { Edit3, Shield } from "lucide-react";
import Link from "next/link";
import { useProfile, profileDisplayName, profileRole } from "@/hooks/useProfile";

interface Props { config: Record<string, unknown> }

export function ProfileCard({ config }: Props) {
  const profile = useProfile();
  const [karma, setKarma] = useState<number>(850);
  const [nodeCount, setNodeCount] = useState(0);

  useEffect(() => {
    fetch("/api/backend/admin/nodes")
      .then((r) => r.json())
      .then(({ nodes, count }) => {
        const node = (nodes as { node_type: string; karma_score: number }[]).find(
          (n) => n.node_type === "profile"
        );
        if (node?.karma_score) setKarma(node.karma_score || 850);
        setNodeCount(count ?? nodes.length);
      })
      .catch(() => {});
  }, []);

  // config overrides take priority, otherwise use onboarding profile data
  const name     = (config.name     as string) || profileDisplayName(profile);
  const role     = (config.role     as string) || profileRole(profile);
  const username = (config.username as string) || profile.email || "user.default";
  const roles    = ["Admin", "User", "Premium"];

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ background: "linear-gradient(135deg,#6c63ff,#a855f7)" }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{name}</div>
          <div className="text-xs truncate" style={{ color: "var(--accent)" }}>{role}</div>
          <div className="text-xs truncate" style={{ color: "var(--muted)" }}>@{username}</div>
          <span className="badge badge-green text-xs">● Online</span>
        </div>
      </div>

      {/* Karma bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: "var(--muted)" }}>Karma</span>
          <span style={{ color: "var(--accent)" }} className="font-semibold">{karma} / 1000</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min((karma / 1000) * 100, 100)}%`,
              background: "linear-gradient(90deg,#6c63ff,#a855f7)",
            }}
          />
        </div>
      </div>

      {/* Roles */}
      <div className="flex flex-wrap gap-1">
        {roles.map((r) => (
          <span key={r} className="badge badge-purple text-xs">{r}</span>
        ))}
        <span className="badge badge-blue text-xs">{nodeCount} nodes</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1 text-center">
        {[
          { label: "Nodes",    value: nodeCount },
          { label: "Karma",    value: karma },
          { label: "Devices",  value: 1 },
        ].map(({ label, value }) => (
          <div key={label} className="py-1 rounded-lg" style={{ background: "var(--bg)" }}>
            <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-2">
        <Link href="/onboarding" className="btn btn-secondary text-xs py-1 px-2 flex-1 justify-center gap-1">
          <Edit3 size={11} /> Edit Profile
        </Link>
        <Link href="/admin" className="btn btn-secondary text-xs py-1 px-2 justify-center">
          <Shield size={11} />
        </Link>
      </div>
    </div>
  );
}
