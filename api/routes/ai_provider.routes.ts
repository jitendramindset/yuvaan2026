import type { IncomingMessage, ServerResponse } from "node:http";
import {
  setProviderConfig,
  listProviders,
  removeProvider,
  testProvider,
  getActiveProvider,
  type ProviderType,
  type ProviderConfig,
} from "../../kernel/ai_provider.engine.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

/** Redact API keys for safe client-side display */
function redactKey(cfg: ProviderConfig): ProviderConfig {
  if (!cfg.apiKey) return cfg;
  const k = cfg.apiKey;
  return { ...cfg, apiKey: k.length > 8 ? `${k.slice(0, 4)}${"*".repeat(k.length - 8)}${k.slice(-4)}` : "****" };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /ai-providers/:ownerId
 * Body: { provider, apiKey?, model?, baseUrl?, label? }
 * Adds or replaces provider config for the user.
 */
export async function handleSetAIProvider(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId = parts[1];
  if (!ownerId) { json(res, 400, { error: "ownerId required in path" }); return; }

  const body = await readBody(req);
  const provider = body["provider"] as ProviderType;
  if (!provider) { json(res, 400, { error: "provider field required" }); return; }

  const cfg: ProviderConfig = {
    provider,
    apiKey:  body["apiKey"]  as string | undefined,
    model:   body["model"]   as string | undefined,
    baseUrl: body["baseUrl"] as string | undefined,
    label:   body["label"]   as string | undefined,
  };
  setProviderConfig(ownerId, cfg);

  json(res, 200, { ok: true, active: redactKey(getActiveProvider(ownerId)) });
}

/**
 * GET /ai-providers/:ownerId
 * Returns all configured providers (API keys redacted).
 */
export function handleListAIProviders(req: IncomingMessage, res: ServerResponse): void {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId = parts[1];
  if (!ownerId) { json(res, 400, { error: "ownerId required in path" }); return; }

  const providers = listProviders(ownerId).map(redactKey);
  const active    = redactKey(getActiveProvider(ownerId));
  json(res, 200, { providers, active });
}

/**
 * DELETE /ai-providers/:ownerId/:provider
 * Removes a provider config.
 */
export function handleRemoveAIProvider(req: IncomingMessage, res: ServerResponse): void {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId  = parts[1];
  const provider = parts[2] as ProviderType;
  if (!ownerId || !provider) { json(res, 400, { error: "ownerId and provider required in path" }); return; }

  removeProvider(ownerId, provider);
  json(res, 200, { ok: true });
}

/**
 * POST /ai-providers/:ownerId/test
 * Body: { provider, apiKey, model? }
 * Tests the API key without saving it.
 */
export async function handleTestAIProvider(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId = parts[1];
  if (!ownerId) { json(res, 400, { error: "ownerId required in path" }); return; }

  const body = await readBody(req);
  const provider = body["provider"] as ProviderType;
  if (!provider) { json(res, 400, { error: "provider field required" }); return; }

  const cfg: ProviderConfig = {
    provider,
    apiKey:  body["apiKey"]  as string | undefined,
    model:   body["model"]   as string | undefined,
    baseUrl: body["baseUrl"] as string | undefined,
  };

  const result = await testProvider(cfg);
  json(res, result.ok ? 200 : 400, result);
}

/**
 * GET /ai-providers/:ownerId/active
 * Returns the currently active provider (redacted).
 */
export function handleGetActiveProvider(req: IncomingMessage, res: ServerResponse): void {
  const url   = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId = parts[1];
  if (!ownerId) { json(res, 400, { error: "ownerId required in path" }); return; }
  json(res, 200, redactKey(getActiveProvider(ownerId)));
}
