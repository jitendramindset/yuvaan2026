/**
 * connection.engine.ts
 *
 * Manages external connections: MCP servers, REST APIs, OAuth apps, devices,
 * webhooks, and any other integration. Each connection becomes a set of tools
 * available in the AI system prompt, allowing Yunaan to call them on the user's
 * behalf.
 */

import { randomUUID } from "node:crypto";

export type ConnectionType =
  | "mcp"       // MCP server (Model Context Protocol)
  | "rest_api"  // arbitrary REST API with key
  | "oauth"     // OAuth 2.0 app (Google, GitHub, Notion, etc.)
  | "device"    // physical / virtual device
  | "webhook"   // inbound webhook
  | "database"  // database connector
  | "github"    // GitHub shortcut
  | "google"    // Google Workspace
  | "notion"    // Notion
  | "slack"     // Slack
  | "custom";   // user-defined

export interface Connection {
  connection_id: string;
  owner_id:      string;
  type:          ConnectionType;
  name:          string;
  url?:          string;
  api_key?:      string;
  access_token?: string;
  capabilities:  string[];
  status:        "connected" | "disconnected" | "error" | "pending";
  last_tested?:  string;
  created_at:    string;
  error?:        string;
  metadata?:     Record<string, unknown>;
  icon?:         string;
}

// ── In-memory store ───────────────────────────────────────────────────────────
// TODO: persist to nodes/connections/<id>.node.json for durability

const store = new Map<string, Connection[]>();

function bucket(ownerId: string): Connection[] {
  if (!store.has(ownerId)) store.set(ownerId, []);
  return store.get(ownerId)!;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function addConnection(conn: Omit<Connection, "connection_id" | "created_at">): Connection {
  const full: Connection = {
    ...conn,
    connection_id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  bucket(conn.owner_id).push(full);
  return full;
}

export function listConnections(ownerId: string): Connection[] {
  return bucket(ownerId);
}

export function getConnection(ownerId: string, id: string): Connection | undefined {
  return bucket(ownerId).find((c) => c.connection_id === id);
}

export function updateConnection(ownerId: string, id: string, patch: Partial<Connection>): Connection | null {
  const b = bucket(ownerId);
  const idx = b.findIndex((c) => c.connection_id === id);
  if (idx < 0) return null;
  b[idx] = { ...b[idx]!, ...patch };
  return b[idx]!;
}

export function removeConnection(ownerId: string, id: string): boolean {
  const b   = bucket(ownerId);
  const idx = b.findIndex((c) => c.connection_id === id);
  if (idx < 0) return false;
  b.splice(idx, 1);
  return true;
}

// ── Tool generation for system prompt ────────────────────────────────────────

export function getConnectionTools(ownerId: string): string[] {
  return bucket(ownerId)
    .filter((c) => c.status === "connected")
    .flatMap((c) =>
      c.capabilities.map((cap) => `[${c.type.toUpperCase()}:${c.name}] ${cap}`),
    );
}

// ── Connection testing ────────────────────────────────────────────────────────

export async function testConnection(conn: Connection): Promise<{ ok: boolean; capabilities: string[]; error?: string }> {
  if (conn.type === "mcp" && conn.url) {
    return testMCPServer(conn.url);
  }
  if ((conn.type === "rest_api" || conn.type === "custom") && conn.url) {
    return testRESTEndpoint(conn.url, conn.api_key);
  }
  // For OAuth / device — just mark as connected (requires UI OAuth flow)
  return { ok: true, capabilities: conn.capabilities };
}

async function testMCPServer(url: string): Promise<{ ok: boolean; capabilities: string[]; error?: string }> {
  // Try MCP well-known endpoint first
  const endpoints = [
    `${url.replace(/\/$/, "")}/.well-known/mcp`,
    `${url.replace(/\/$/, "")}/mcp`,
    url,
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        try {
          const data = await res.json() as { capabilities?: string[]; tools?: Array<{ name: string }> };
          const caps = data.capabilities ?? data.tools?.map((t) => t.name) ?? ["mcp_generic"];
          return { ok: true, capabilities: caps };
        } catch {
          return { ok: true, capabilities: ["http"] };
        }
      }
    } catch { /* try next */ }
  }
  return { ok: false, capabilities: [], error: "Could not reach MCP server" };
}

async function testRESTEndpoint(url: string, apiKey?: string): Promise<{ ok: boolean; capabilities: string[]; error?: string }> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const res = await fetch(url, { method: "HEAD", headers, signal: AbortSignal.timeout(4000) });
    return { ok: res.ok || res.status < 500, capabilities: ["http_rest"] };
  } catch (err) {
    return { ok: false, capabilities: [], error: err instanceof Error ? err.message : "Unreachable" };
  }
}

// ── Preset connection templates ───────────────────────────────────────────────

export const CONNECTION_PRESETS: Array<{
  type: ConnectionType;
  name: string;
  icon: string;
  desc: string;
  urlPlaceholder?: string;
  requiresApiKey: boolean;
  defaultCapabilities: string[];
}> = [
  {
    type: "github",
    name: "GitHub",
    icon: "🐙",
    desc: "Access repos, issues, PRs, Gists, and Actions",
    requiresApiKey: true,
    urlPlaceholder: "https://api.github.com",
    defaultCapabilities: ["list_repos", "read_file", "create_issue", "create_pr", "run_workflow"],
  },
  {
    type: "google",
    name: "Google Workspace",
    icon: "🔵",
    desc: "Gmail, Calendar, Drive, Sheets, Docs",
    requiresApiKey: true,
    defaultCapabilities: ["read_email", "send_email", "read_calendar", "read_drive"],
  },
  {
    type: "notion",
    name: "Notion",
    icon: "📝",
    desc: "Read/write pages, databases, and blocks",
    requiresApiKey: true,
    urlPlaceholder: "https://api.notion.com",
    defaultCapabilities: ["read_page", "create_page", "update_page", "query_database"],
  },
  {
    type: "slack",
    name: "Slack",
    icon: "💬",
    desc: "Send messages, read channels, manage workspaces",
    requiresApiKey: true,
    defaultCapabilities: ["send_message", "read_channel", "list_channels"],
  },
  {
    type: "mcp",
    name: "Custom MCP Server",
    icon: "🔌",
    desc: "Any Model Context Protocol server (self-hosted or cloud)",
    requiresApiKey: false,
    urlPlaceholder: "https://your-mcp-server.com",
    defaultCapabilities: [],
  },
  {
    type: "rest_api",
    name: "Custom REST API",
    icon: "🌐",
    desc: "Any HTTP REST API endpoint",
    requiresApiKey: false,
    urlPlaceholder: "https://api.example.com/v1",
    defaultCapabilities: ["http_get", "http_post"],
  },
  {
    type: "database",
    name: "Database",
    icon: "🗄️",
    desc: "PostgreSQL, MySQL, MongoDB, Supabase, Firebase",
    requiresApiKey: true,
    urlPlaceholder: "postgresql://user:pass@host:5432/db",
    defaultCapabilities: ["query", "insert", "update", "delete"],
  },
  {
    type: "webhook",
    name: "Inbound Webhook",
    icon: "🪝",
    desc: "Receive events from any external service",
    requiresApiKey: false,
    defaultCapabilities: ["receive_event"],
  },
  {
    type: "device",
    name: "IoT / Smart Device",
    icon: "📱",
    desc: "Camera, sensor, smart home device, or mobile",
    requiresApiKey: false,
    defaultCapabilities: ["read_sensor", "send_command"],
  },
];
