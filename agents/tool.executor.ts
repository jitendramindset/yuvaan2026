/**
 * Tool Executor — dispatch layer for Yunaan agent tools.
 *
 * Each tool maps to a handler that performs a safe, sandboxed operation.
 * Tools are registered in the TOOL_REGISTRY and executed by name.
 * Unknown or disallowed tools throw a ToolNotFoundError.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToolInput {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  output: unknown;
  error?: string;
}

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function handleApiCall(args: Record<string, unknown>): Promise<unknown> {
  const url    = String(args["url"] ?? "");
  const method = String(args["method"] ?? "GET").toUpperCase();
  // Only allow relative API calls to prevent SSRF
  if (!url.startsWith("/api/")) {
    throw new Error("SSRF guard: only /api/* paths are allowed");
  }
  const baseUrl = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? JSON.stringify(args["body"] ?? {}) : undefined,
  });
  return res.json();
}

async function handleDeviceMonitor(_args: Record<string, unknown>): Promise<unknown> {
  // Returns a lightweight status summary — no privilege escalation
  return {
    uptime_s:   Math.floor(process.uptime()),
    memory_mb:  Math.round(process.memoryUsage().rss / 1024 / 1024),
    node_v:     process.version,
    ts:         new Date().toISOString(),
  };
}

async function handleEcho(args: Record<string, unknown>): Promise<unknown> {
  return { echo: args["text"] ?? "" };
}

// ── Registry ──────────────────────────────────────────────────────────────────

const TOOL_REGISTRY: Record<string, ToolHandler> = {
  api:            handleApiCall,
  device_monitor: handleDeviceMonitor,
  echo:           handleEcho,
};

// ── Public API ────────────────────────────────────────────────────────────────

export async function executeTool(input: ToolInput): Promise<ToolResult> {
  const handler = TOOL_REGISTRY[input.name];
  if (!handler) {
    return { tool: input.name, success: false, output: null, error: `Unknown tool: ${input.name}` };
  }
  try {
    const output = await handler(input.args);
    return { tool: input.name, success: true, output };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { tool: input.name, success: false, output: null, error: msg };
  }
}

export function listTools(): string[] {
  return Object.keys(TOOL_REGISTRY);
}
