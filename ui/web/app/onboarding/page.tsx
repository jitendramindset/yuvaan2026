"use client";
import { useState } from "react";
import { api, OnboardingResult } from "@/lib/api";
import { CheckCircle, ChevronRight, SkipForward, UserPlus } from "lucide-react";

const STEPS = [
  {
    id: "user_identity",
    label: "Your Identity",
    fields: [
      { key: "name",     label: "Full Name",     type: "text",   placeholder: "Jitendra Sharma" },
      { key: "phone",    label: "Phone",         type: "tel",    placeholder: "+91 98765 43210" },
      { key: "email",    label: "Email",         type: "email",  placeholder: "you@example.com" },
      { key: "country",  label: "Country",       type: "text",   placeholder: "India" },
      { key: "language", label: "Language",      type: "text",   placeholder: "en" },
      { key: "timezone", label: "Timezone",      type: "text",   placeholder: "Asia/Kolkata" },
    ],
  },
  {
    id: "company_setup",
    label: "Business Type",
    options: ["company", "freelancer", "startup", "personal", "ngo"],
  },
  {
    id: "industry_selection",
    label: "Industry",
    options: [
      "retail", "healthcare", "education", "finance", "logistics",
      "hospitality", "manufacturing", "real_estate", "media",
      "agriculture", "technology", "construction", "legal", "non_profit", "government",
    ],
  },
  {
    id: "business_size",
    label: "Business Size",
    options: ["solo", "micro_2_10", "small_11_50", "medium_51_250", "large_250_plus"],
  },
  {
    id: "operations",
    label: "Core Modules",
    multi: ["sales", "inventory", "crm", "hr", "accounting", "logistics", "delivery", "support", "analytics", "cms"],
  },
  {
    id: "team_structure",
    label: "Team Departments",
    multi: ["sales_team", "operations", "marketing", "hr_department", "tech_team", "management", "finance_team"],
  },
  {
    id: "product_service",
    label: "Product / Service",
    fields: [
      { key: "primary_offering",  label: "What do you offer?",     type: "text", placeholder: "e.g. SaaS platform" },
      { key: "value_proposition", label: "Your key value",         type: "text", placeholder: "e.g. saves 2h/day" },
      { key: "target_customer",   label: "Target customer",        type: "text", placeholder: "e.g. SME businesses" },
    ],
  },
  {
    id: "data_preferences",
    label: "Data & Privacy",
    multi: ["local_only", "cloud_sync", "encrypted_backup", "analytics_enabled", "gdpr_mode"],
  },
] as const;

type StepDef = typeof STEPS[number];

export default function OnboardingPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [form,      setForm]      = useState<Record<string, unknown>>({});
  const [result,    setResult]    = useState<OnboardingResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [userId]                  = useState(() => `user_${Date.now()}`);

  async function start() {
    setLoading(true); setError(null);
    try {
      const s = await api.onboarding.start(userId);
      setSessionId(s.session_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  async function next() {
    if (!sessionId) return;
    setLoading(true); setError(null);
    try {
      const step = STEPS[stepIndex];
      await api.onboarding.step(sessionId, step.id, form);
      if (stepIndex >= STEPS.length - 1) {
        const r = await api.onboarding.complete(sessionId);
        setResult(r);
      } else {
        setStepIndex((i) => i + 1);
        setForm({});
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  async function skip() {
    if (!sessionId) return;
    setLoading(true); setError(null);
    try {
      await api.onboarding.skip(sessionId);
    } catch {
      // skip errors are non-fatal
    }
    if (stepIndex >= STEPS.length - 1) {
      try {
        const r = await api.onboarding.complete(sessionId);
        setResult(r);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      setStepIndex((i) => i + 1);
      setForm({});
    }
    setLoading(false);
  }

  // ── Complete screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-5">
        <CheckCircle size={40} style={{ color: "#22c55e" }} />
        <h1 className="text-2xl font-bold">Onboarding Complete!</h1>
        <p className="text-sm" style={{ color: "#22c55e" }}>{result.voice_prompt}</p>

        <div className="card grid grid-cols-2 gap-4 text-sm">
          <Stat label="Nodes Created"  value={result.nodes_created.length.toString()} />
          <Stat label="Workflows"      value={result.workflows_created.length.toString()} />
          <Stat label="Widgets"        value={result.ui_schema.widget_count.toString()} />
          <Stat label="Platform"       value={result.ui_schema.platform} />
        </div>

        {result.nodes_created.length > 0 && (
          <div className="card space-y-2">
            <h3 className="font-semibold text-sm">Created Nodes</h3>
            {result.nodes_created.map((n, i) => (
              <div key={i} className="text-xs flex gap-2">
                <span className="badge badge-purple">{n.type}</span>
                <span style={{ color: "var(--muted)" }}>{n.description}</span>
              </div>
            ))}
          </div>
        )}

        <details className="text-xs">
          <summary className="cursor-pointer text-sm font-medium mb-2">Full result JSON</summary>
          <pre className="p-3 rounded overflow-auto" style={{ background: "var(--bg)", fontSize: 11 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>

        <div className="flex gap-3">
          <a href="/dashboard" className="btn btn-primary flex-1 text-center">Open Dashboard →</a>
          <a href="/services"  className="btn btn-secondary flex-1 text-center">View Services</a>
        </div>
      </div>
    );
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!sessionId) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <UserPlus size={48} style={{ color: "var(--accent)" }} className="mx-auto" />
        <h1 className="text-2xl font-bold">NodeOS Onboarding</h1>
        <p style={{ color: "var(--muted)" }}>
          Set up your user profile and company configuration in 8 guided steps.
          Your data stays on-device by default.
        </p>
        {error && <p style={{ color: "#ef4444" }} className="text-sm">{error}</p>}
        <button
          className="btn btn-primary text-base px-10 py-3"
          onClick={start}
          disabled={loading}
        >
          {loading ? "Starting…" : "Begin Setup →"}
        </button>
      </div>
    );
  }

  // ── Step screen ───────────────────────────────────────────────────────────
  const step    = STEPS[stepIndex] as StepDef;
  const progress = ((stepIndex) / STEPS.length) * 100;
  const isLast   = stepIndex === STEPS.length - 1;

  return (
    <div className="max-w-lg mx-auto py-8 space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span>
          Step <b>{stepIndex + 1}</b> of {STEPS.length} — <b>{step.label}</b>
        </span>
        <span style={{ color: "var(--muted)" }}>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, background: "var(--accent)" }}
        />
      </div>

      {/* Step pills */}
      <div className="flex gap-1.5 flex-wrap">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background:
                i < stepIndex  ? "rgba(34,197,94,0.18)"  :
                i === stepIndex ? "rgba(108,99,255,0.20)" : "var(--border)",
              color:
                i < stepIndex  ? "#22c55e"        :
                i === stepIndex ? "var(--accent)"  : "var(--muted)",
            }}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* Step form */}
      <div className="card space-y-4">
        <h2 className="font-semibold">{step.label}</h2>

        {"fields" in step && step.fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs uppercase tracking-wide mb-1 block" style={{ color: "var(--muted)" }}>
              {f.label}
            </label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              value={(form[f.key] as string) ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}

        {"options" in step && (
          <div className="flex flex-wrap gap-2">
            {(step.options as readonly string[]).map((opt) => {
              const sel = form.value === opt;
              return (
                <button
                  key={opt}
                  className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
                  style={{
                    borderColor: sel ? "var(--accent)" : "var(--border)",
                    background:  sel ? "rgba(108,99,255,0.15)" : "transparent",
                    color:       sel ? "var(--accent)" : "var(--muted)",
                  }}
                  onClick={() => setForm({ value: opt })}
                >
                  {opt.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        )}

        {"multi" in step && (
          <div className="flex flex-wrap gap-2">
            {(step.multi as readonly string[]).map((opt) => {
              const arr = (form.values as string[]) ?? [];
              const sel = arr.includes(opt);
              return (
                <button
                  key={opt}
                  className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                  style={{
                    borderColor: sel ? "var(--accent)" : "var(--border)",
                    background:  sel ? "rgba(108,99,255,0.15)" : "transparent",
                    color:       sel ? "var(--accent)" : "var(--muted)",
                  }}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      values: sel ? arr.filter((v) => v !== opt) : [...arr, opt],
                    }))
                  }
                >
                  {opt.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            className="btn btn-secondary flex items-center gap-1.5"
            onClick={skip}
            disabled={loading}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button
            className="btn btn-primary flex-1 flex items-center justify-center gap-1.5"
            onClick={next}
            disabled={loading}
          >
            {loading ? "…" : isLast
              ? "Complete Setup ✓"
              : <><ChevronRight size={14} /> Next</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg)" }}>
      <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
