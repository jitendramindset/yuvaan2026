// ─── NodeOS API Client ────────────────────────────────────────────────────────
// All fetch calls to the backend API (localhost:3000)

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Health ────────────────────────────────────────────────────────────────────
export const api = {
  health: () => get<{ status: string; version: string }>("/health"),

  // ── Voice ──────────────────────────────────────────────────────────────────
  voice: {
    command: (text: string, userId: string, sessionId?: string) =>
      post<VoiceResponse>("/voice/command", { text, user_id: userId, session_id: sessionId }),
    session: (sessionId: string) =>
      get<VoiceSession>(`/voice/session/${sessionId}`),
    sessions: () =>
      get<{ count: number; sessions: VoiceSession[] }>("/voice/sessions"),
    end: (sessionId: string) =>
      post<{ ok: boolean }>("/voice/session/end", { session_id: sessionId }),
  },

  // ── Onboarding ──────────────────────────────────────────────────────────────
  onboarding: {
    start: (userId: string, voiceMode = false) =>
      post<{ session_id: string; current_step: string; voice_prompt: string }>(
        "/onboarding/start", { user_id: userId, voice_mode: voiceMode }),
    get: (sessionId: string) =>
      get<OnboardingSession>(`/onboarding/session/${sessionId}`),
    step: (sessionId: string, step: string, payload: unknown) =>
      post<{ session_id: string; current_step: string; completed: boolean; voice_prompt: string }>(
        "/onboarding/step", { session_id: sessionId, step, payload }),
    skip: (sessionId: string) =>
      post<{ session_id: string; current_step: string; voice_prompt: string }>(
        "/onboarding/skip", { session_id: sessionId }),
    complete: (sessionId: string) =>
      post<OnboardingResult>("/onboarding/complete", { session_id: sessionId }),
  },

  // ── Company ──────────────────────────────────────────────────────────────────
  company: {
    industryModules: (industry: string) =>
      get<{ industry: string; title: string; modules: string[] }>(
        `/company/industry/${industry}/modules`),
    generateLayout: (userId: string, industry: string, modules: string[]) =>
      post<CustomizationLayout>("/company/layout/generate", { user_id: userId, industry, modules }),
  },

  // ── Customization ─────────────────────────────────────────────────────────
  customize: {
    widgets: (platform?: string, category?: string) => {
      const q = new URLSearchParams();
      if (platform)  q.set("platform", platform);
      if (category)  q.set("category", category);
      return get<{ count: number; widgets: WidgetCatalogueEntry[] }>(
        `/customize/widgets${q.toString() ? "?" + q.toString() : ""}`);
    },
  },

  // ── Marketplace ───────────────────────────────────────────────────────────
  marketplace: {
    listings: () =>
      get<{ listings: MarketplaceListing[] }>("/marketplace/listings"),
    install: (listingId: string, userId: string) =>
      post<{ ok: boolean; widget_id: string }>("/marketplace/install", { listing_id: listingId, user_id: userId }),
    publish: (payload: Record<string, unknown>) =>
      post<{ listing_id: string }>("/marketplace/publish", payload),
  },

  // ── Devices ───────────────────────────────────────────────────────────────
  devices: {
    list: () =>
      get<{ devices: DeviceRecord[] }>("/devices/list"),
    get: (deviceId: string) =>
      get<DeviceRecord>(`/devices/${deviceId}`),
    pair: (deviceId: string, deviceKey: string) =>
      post<{ ok: boolean }>("/devices/pair", { device_id: deviceId, device_key: deviceKey }),
  },

  // ── Admin Nodes ───────────────────────────────────────────────────────────
  admin: {
    nodes: () =>
      get<{ count: number; nodes: AdminNodeSummary[] }>("/admin/nodes"),
    graph: () =>
      get<NodeGraph>("/admin/graph"),
    nodeJson: (nodeId: string) =>
      get<Record<string, unknown>>(`/admin/nodes/${encodeURIComponent(nodeId)}/json`),
    setStatus: (nodeId: string, status: string) => {
      const body = JSON.stringify({ status });
      return fetch(`${BASE}/admin/nodes/${encodeURIComponent(nodeId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      }).then((r) => r.json()) as Promise<{ ok: boolean }>;
    },
    archive: (nodeId: string) => {
      return fetch(`${BASE}/admin/nodes/${encodeURIComponent(nodeId)}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).then((r) => r.json()) as Promise<{ ok: boolean }>;
    },
  },
};

// ─── Lightweight types mirroring the backend ─────────────────────────────────

export interface VoiceResponse {
  match: {
    intent: string;
    confidence: string;
    target: string;
    slots: Record<string, string>;
    voice_reply: string;
    command: { raw_text: string; normalised: string; timestamp: string };
  };
  action?: Record<string, unknown>;
  voice_reply: string;
  ui_event: string;
}

export interface VoiceSession {
  session_id: string;
  user_id: string;
  active: boolean;
  current_intent: string | null;
  history: VoiceResponse["match"][];
  created_at: string;
  last_active: string;
}

export interface OnboardingSession {
  session_id: string;
  user_id: string;
  current_step: string;
  completed: boolean;
  voice_mode: boolean;
  data: Record<string, unknown>;
  generated_nodes: string[];
  created_at: string;
  updated_at: string;
}

export interface OnboardingResult {
  user_id: string;
  company_id?: string;
  nodes_created: { type: string; node_id: string; description: string }[];
  dashboard_id: string;
  ui_schema: { platform: string; widget_count: number; layout_id: string };
  workflows_created: string[];
  voice_prompt: string;
  layout: CustomizationLayout;
}

export interface CustomizationLayout {
  layout_id: string;
  owner_id: string;
  platform: string;
  status: string;
  grid: {
    columns: number;
    rows: number;
    gap: number;
    widgets: WidgetConfig[];
  };
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface WidgetConfig {
  widget_id: string;
  widget_type: string;
  label: string;
  size: string;
  position: { col: number; row: number; colSpan: number; rowSpan: number };
  props: Record<string, unknown>;
  visible: boolean;
}

export interface WidgetCatalogueEntry {
  widget_type: string;
  label: string;
  description: string;
  default_size: string;
  platforms: string[];
  icon: string;
  category: string;
}

export interface MarketplaceListing {
  listing_id: string;
  widget_id?: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  rating?: number;
  install_count?: number;
  author?: string;
  category?: string;
  tags?: string[];
  published_at?: string;
}

export interface DeviceRecord {
  device_id: string;
  device_name?: string;
  platform?: string;
  last_seen?: string;
  paired_at?: string;
  status?: string;
}

export interface AdminNodeSummary {
  node_id: string;
  node_type: string;
  owner: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  karma_score: number;
  children: string[];
  parent: string | null;
  _file: string;
  relations: Array<{ type: string; target: string }>;
}

export interface NodeGraphNode {
  id: string;
  label: string;
  type: string;
  owner: string;
  status: string;
  karma: number;
  file: string;
}

export interface NodeGraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface NodeGraph {
  nodes: NodeGraphNode[];
  edges: NodeGraphEdge[];
  stats: {
    total: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  };
}
