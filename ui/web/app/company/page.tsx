"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2, RefreshCw, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  "retail", "healthcare", "education", "finance", "logistics",
  "hospitality", "manufacturing", "real_estate", "media",
  "agriculture", "technology", "construction", "legal", "non_profit", "government",
];

export default function CompanyPage() {
  const router = useRouter();
  const [industry,  setIndustry]  = useState("retail");
  const [modules,   setModules]   = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [generating,setGenerating]= useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.company
      .industryModules(industry)
      .then((res) => {
        setAvailable(res.modules);
        setModules(res.modules.slice(0, 4));
      })
      .catch(() => setAvailable([]))
      .finally(() => setLoading(false));
  }, [industry]);

  async function generate() {
    if (modules.length === 0) return;
    setGenerating(true); setError(null);
    try {
      const userId = `demo_${Date.now()}`;
      const layout = await api.company.generateLayout(userId, industry, modules);
      router.push(
        `/dashboard?userId=${userId}&industry=${industry}&modules=${modules.join(",")}&layoutId=${layout.layout_id}`
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setGenerating(false);
    }
  }

  const toggle = (m: string) =>
    setModules((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 size={28} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-2xl font-bold">Company Setup</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Select your industry and modules to generate a customised dashboard.
          </p>
        </div>
      </div>

      {/* Industry selector */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-sm">1. Select Industry</h2>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor: industry === ind ? "var(--accent)" : "var(--border)",
                background:  industry === ind ? "rgba(108,99,255,0.15)" : "transparent",
                color:       industry === ind ? "var(--accent)" : "var(--muted)",
              }}
              onClick={() => setIndustry(ind)}
            >
              {ind.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Module selector */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">
            2. Choose Modules
            {loading && <RefreshCw size={13} className="inline ml-2 animate-spin" style={{ color: "var(--muted)" }} />}
          </h2>
          <div className="flex gap-2">
            <button
              className="text-xs"
              style={{ color: "var(--accent)" }}
              onClick={() => setModules(available)}
            >
              All
            </button>
            <button
              className="text-xs"
              style={{ color: "var(--muted)" }}
              onClick={() => setModules([])}
            >
              None
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {available.map((m) => {
            const sel = modules.includes(m);
            return (
              <button
                key={m}
                className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
                style={{
                  borderColor: sel ? "var(--accent)" : "var(--border)",
                  background:  sel ? "rgba(108,99,255,0.15)" : "transparent",
                  color:       sel ? "var(--accent)" : "var(--muted)",
                }}
                onClick={() => toggle(m)}
              >
                {m.replace(/_/g, " ")}
              </button>
            );
          })}
          {!loading && available.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No modules found for this industry.
            </p>
          )}
        </div>

        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {modules.length} module{modules.length !== 1 ? "s" : ""} selected
        </p>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}
        >
          {error}
        </div>
      )}

      <button
        className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
        disabled={modules.length === 0 || generating}
        onClick={generate}
      >
        <LayoutGrid size={18} />
        {generating ? "Generating Dashboard…" : "Generate Dashboard →"}
      </button>
    </div>
  );
}
