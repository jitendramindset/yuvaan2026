/**
 * ai_provider.engine.ts
 *
 * Multi-provider AI completion engine.
 * Supports: OpenAI, Google Gemini, Anthropic Claude, Groq, Ollama (local).
 * User API keys are stored in-memory per owner; persist via AES if needed.
 */

export interface AIMessage {
  role:    "system" | "user" | "assistant";
  content: string;
}

export type ProviderType = "openai" | "gemini" | "anthropic" | "groq" | "ollama" | "nodeos";

export interface ProviderConfig {
  provider:  ProviderType;
  apiKey?:   string;
  model?:    string;
  baseUrl?:  string;   // for Ollama / self-hosted
  label?:    string;   // display name
}

export const PROVIDER_DEFAULTS: Record<ProviderType, { model: string; label: string; freeDesc?: string }> = {
  openai:    { model: "gpt-4o-mini",                   label: "OpenAI GPT-4o mini" },
  gemini:    { model: "gemini-2.0-flash",              label: "Google Gemini 2.0 Flash", freeDesc: "Free tier available" },
  anthropic: { model: "claude-3-5-haiku-20241022",     label: "Anthropic Claude 3.5 Haiku" },
  groq:      { model: "llama-3.3-70b-versatile",       label: "Groq Llama 3.3 70B", freeDesc: "Free tier available" },
  ollama:    { model: "llama3.2",                      label: "Ollama (Local)", freeDesc: "Runs on your device" },
  nodeos:    { model: "built-in",                      label: "NodeOS Built-in (no key needed)", freeDesc: "Rule-based fallback" },
};

// ── Per-user key store (in-memory; survives process restart if persisted) ────

const providerStore = new Map<string, ProviderConfig[]>();

export function setProviderConfig(ownerId: string, cfg: ProviderConfig): void {
  const list = providerStore.get(ownerId) ?? [];
  const idx  = list.findIndex((c) => c.provider === cfg.provider);
  if (idx >= 0) list[idx] = cfg; else list.unshift(cfg); // unshift = preferred = first
  providerStore.set(ownerId, list);
}

export function getActiveProvider(ownerId: string): ProviderConfig {
  const list = providerStore.get(ownerId) ?? [];
  return list[0] ?? { provider: "nodeos" };
}

export function listProviders(ownerId: string): ProviderConfig[] {
  return providerStore.get(ownerId) ?? [];
}

export function removeProvider(ownerId: string, provider: ProviderType): void {
  const list = providerStore.get(ownerId) ?? [];
  providerStore.set(ownerId, list.filter((c) => c.provider !== provider));
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

async function openAICompletion(msgs: AIMessage[], cfg: ProviderConfig): Promise<string> {
  const model = cfg.model ?? PROVIDER_DEFAULTS.openai.model;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.apiKey ?? ""}` },
    body: JSON.stringify({ model, messages: msgs, temperature: 0.7, max_tokens: 2048, response_format: { type: "json_object" } }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return d.choices?.[0]?.message?.content ?? "{}";
}

// ── Google Gemini ─────────────────────────────────────────────────────────────

async function geminiCompletion(msgs: AIMessage[], cfg: ProviderConfig): Promise<string> {
  const model   = cfg.model ?? PROVIDER_DEFAULTS.gemini.model;
  const sysMsg  = msgs.find((m) => m.role === "system");
  const chatMs  = msgs.filter((m) => m.role !== "system");
  const contents = chatMs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048, responseMimeType: "application/json" },
  };
  if (sysMsg) body["systemInstruction"] = { parts: [{ text: sysMsg.content }] };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey ?? ""}`;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const d = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
}

// ── Anthropic Claude ──────────────────────────────────────────────────────────

async function anthropicCompletion(msgs: AIMessage[], cfg: ProviderConfig): Promise<string> {
  const model  = cfg.model ?? PROVIDER_DEFAULTS.anthropic.model;
  const sysMsg = msgs.find((m) => m.role === "system")?.content ?? "";
  const chat   = msgs.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": cfg.apiKey ?? "", "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, system: sysMsg, messages: chat, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const d = await res.json() as { content?: Array<{ text?: string }> };
  // Claude doesn't guarantee JSON, wrap in extraction
  const raw = d.content?.[0]?.text ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : raw;
}

// ── Groq ──────────────────────────────────────────────────────────────────────

async function groqCompletion(msgs: AIMessage[], cfg: ProviderConfig): Promise<string> {
  const model = cfg.model ?? PROVIDER_DEFAULTS.groq.model;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.apiKey ?? ""}` },
    body: JSON.stringify({ model, messages: msgs, temperature: 0.7, max_tokens: 2048, response_format: { type: "json_object" } }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const d = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return d.choices?.[0]?.message?.content ?? "{}";
}

// ── Ollama (local) ────────────────────────────────────────────────────────────

async function ollamaCompletion(msgs: AIMessage[], cfg: ProviderConfig): Promise<string> {
  const base  = (cfg.baseUrl ?? "http://localhost:11434").replace(/\/$/, "");
  const model = cfg.model ?? PROVIDER_DEFAULTS.ollama.model;
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: msgs, stream: false, format: "json" }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const d = await res.json() as { message?: { content?: string } };
  return d.message?.content ?? "{}";
}

// ── NodeOS built-in fallback (no key required) ───────────────────────────────

function nodeOSFallback(msgs: AIMessage[]): string {
  const last = msgs.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const lower = last.toLowerCase();

  // Simple intent detection
  let reply = `I'm running in **offline / local mode** (no AI API key configured).\n\n`;
  let actions: unknown[] = [{ tool: "navigate", params: { route: "/settings" } }];

  if (/dashboard|widget/.test(lower))    reply += "I can help with your dashboard. Go to `/builder` to add or rearrange widgets.";
  else if (/connect|mcp|api/.test(lower)) reply += "I can connect external services. Open the **Connections** page to add MCPs, APIs, or devices.";
  else if (/karma|score|level/.test(lower)) reply += "Your karma grows as you complete your profile, add nodes, and use the system.";
  else if (/theme|color|colour/.test(lower)) { reply += "Go to **Settings** to change theme colours."; actions = [{ tool: "navigate", params: { route: "/settings" } }]; }
  else reply += `You said: *"${last.slice(0, 120)}"*. To unlock full AI (natural language), add an API key in **Settings → AI Providers**.`;

  return JSON.stringify({
    reply,
    intent: "general",
    confidence: 0.4,
    actions,
    node_updates: [],
    suggestions: [
      "Add an OpenAI key in Settings → AI Providers",
      "Groq has a free API key — fast and powerful",
      "Gemini 2.0 Flash has a free tier with generous limits",
    ],
    learning: "User interacted without AI provider configured.",
    karma_delta: 0,
  });
}

// ── Validate API key by making a minimal test call ───────────────────────────

export async function testProvider(cfg: ProviderConfig): Promise<{ ok: boolean; error?: string }> {
  const testMsg: AIMessage[] = [
    { role: "system", content: "Respond with exactly: {\"ok\":true}" },
    { role: "user",   content: "ping" },
  ];
  try {
    await chatCompletion(testMsg, cfg);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

export async function chatCompletion(msgs: AIMessage[], cfg: ProviderConfig): Promise<string> {
  if (!cfg.apiKey && cfg.provider !== "ollama" && cfg.provider !== "nodeos") {
    return nodeOSFallback(msgs);
  }
  try {
    switch (cfg.provider) {
      case "openai":    return await openAICompletion(msgs, cfg);
      case "gemini":    return await geminiCompletion(msgs, cfg);
      case "anthropic": return await anthropicCompletion(msgs, cfg);
      case "groq":      return await groqCompletion(msgs, cfg);
      case "ollama":    return await ollamaCompletion(msgs, cfg);
      default:          return nodeOSFallback(msgs);
    }
  } catch (err) {
    // Bubble up with provider info for better error messages
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`[${cfg.provider}] ${msg}`);
  }
}
