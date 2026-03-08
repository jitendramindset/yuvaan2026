"use client";
/**
 * Form widget — renders a dynamic form from a fields schema.
 * Submissions are sent to the kernel via the /api/backend/nodes route.
 */
import React, { useState } from "react";

interface FieldDef {
  name:        string;
  label?:      string;
  type?:       "text" | "number" | "email" | "date" | "select";
  options?:    string[];
  required?:   boolean;
  placeholder?: string;
}

interface FormProps {
  config: Record<string, unknown>;
  data?:  Record<string, unknown>;
}

export function Form({ config, data = {} }: FormProps): React.ReactElement {
  const title:  string     = String(config["title"]  ?? "Form");
  const fields: FieldDef[] = Array.isArray(config["fields"])
    ? (config["fields"] as FieldDef[])
    : [];
  const submitLabel = String(config["submit_label"] ?? "Submit");

  const initValues = fields.reduce<Record<string, string>>((acc, f) => {
    acc[f.name] = String(data[f.name] ?? "");
    return acc;
  }, {});

  const [values, setValues]   = useState<Record<string, string>>(initValues);
  const [status, setStatus]   = useState<"idle" | "ok" | "err">("idle");

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/backend/nodes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ form_id: config["form_id"], values }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className="h-full flex flex-col rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-2 text-xs font-semibold text-white/60 border-b border-white/10">
        {title}
      </div>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="text-[11px] text-white/50">
              {field.label ?? field.name}
              {field.required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {field.type === "select" ? (
              <select
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                value={values[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">— Select —</option>
                {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20"
                value={values[field.name] ?? ""}
                placeholder={field.placeholder ?? ""}
                required={field.required}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          className="mt-auto rounded-lg bg-[#6c63ff] hover:bg-[#7c73ff] transition-colors text-white text-xs font-semibold py-2"
        >
          {submitLabel}
        </button>
        {status === "ok"  && <p className="text-xs text-green-400 text-center">Saved ✓</p>}
        {status === "err" && <p className="text-xs text-red-400 text-center">Error — please retry</p>}
      </form>
    </div>
  );
}
