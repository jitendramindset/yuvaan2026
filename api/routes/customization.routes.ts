import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getDefaultLayout,
  saveLayout,
  publishLayout,
  getWidgetCatalogue,
  getWidgetByType,
  getActiveLayout,
  saveTemplate,
  getTemplates,
  applyTemplate,
  executeWidgetPipeline,
  executeLayoutPipeline,
} from "../../kernel/customization.engine.js";
import type { Platform, WidgetCategory, WidgetConfigFull } from "../../shared/types/customization.types.js";

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

const VALID_PLATFORMS: Platform[] = [
  "vanshawali", "dravyam", "ai_dashboard", "admin", "device_hub",
  "social", "erp", "game", "workflow",
];

function parsePlatform(req: IncomingMessage): Platform | null {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const platform = parts[2] as Platform | undefined;
  return platform && VALID_PLATFORMS.includes(platform) ? platform : null;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** GET /customize/widgets[?platform=xxx] — list widget catalogue */
export function handleGetCatalogue(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const platform = url.searchParams.get("platform") as Platform | null;
  json(res, 200, { widgets: getWidgetCatalogue(platform ?? undefined) });
}

/** GET /customize/layout/:platform?owner_id=xxx — get layout for platform */
export function handleGetLayout(req: IncomingMessage, res: ServerResponse): void {
  const platform = parsePlatform(req);
  if (!platform) { json(res, 400, { error: "Invalid or missing platform" }); return; }
  const url = new URL(req.url ?? "/", "http://localhost");
  const ownerId = url.searchParams.get("owner_id");
  if (!ownerId) { json(res, 400, { error: "owner_id query param required" }); return; }
  json(res, 200, getDefaultLayout(ownerId, platform));
}

/** POST /customize/layout/:platform/save — save a draft layout */
export async function handleSaveLayout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const platform = parsePlatform(req);
  if (!platform) { json(res, 400, { error: "Invalid or missing platform" }); return; }
  const body = await readBody(req);
  if (!body["owner_id"] || !body["grid"]) {
    json(res, 400, { error: "owner_id and grid are required" });
    return;
  }
  const layout = saveLayout({
    owner_id: body["owner_id"] as string,
    platform,
    grid: body["grid"] as import("../../shared/types/customization.types.js").GridLayout,
  });
  json(res, 200, layout);
}

/** POST /customize/layout/:platform/publish — publish the draft layout */
export async function handlePublishLayout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const platform = parsePlatform(req);
  if (!platform) { json(res, 400, { error: "Invalid or missing platform" }); return; }
  const body = await readBody(req);
  if (!body["owner_id"]) { json(res, 400, { error: "owner_id is required" }); return; }
  try {
    const layout = publishLayout(body["owner_id"] as string, platform);
    json(res, 200, layout);
  } catch (err) {
    json(res, 404, { error: err instanceof Error ? err.message : "Publish failed" });
  }
}

/** GET /customize/layout/:platform/active?owner_id=xxx — get active published layout */
export function handleGetActiveLayout(req: IncomingMessage, res: ServerResponse): void {
  const platform = parsePlatform(req);
  if (!platform) { json(res, 400, { error: "Invalid or missing platform" }); return; }
  const url = new URL(req.url ?? "/", "http://localhost");
  const ownerId = url.searchParams.get("owner_id");
  if (!ownerId) { json(res, 400, { error: "owner_id query param required" }); return; }
  const layout = getActiveLayout(ownerId, platform);
  if (!layout) {
    json(res, 404, { error: "No published layout found. Save and publish a layout first." });
    return;
  }
  json(res, 200, layout);
}

/** GET /customize/widget/:type — get catalogue entry for a single widget type */
export function handleGetWidget(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const widgetType = parts[2];
  if (!widgetType) { json(res, 400, { error: "widget type path param required" }); return; }
  const entry = getWidgetByType(widgetType as never);
  if (!entry) { json(res, 404, { error: `Widget type not found: ${widgetType}` }); return; }
  json(res, 200, entry);
}

/** GET /customize/widgets?platform=&category= — filtered widget catalogue */
export function handleGetCatalogueFiltered(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const platform = url.searchParams.get("platform") as Platform | null;
  const category = url.searchParams.get("category") as WidgetCategory | null;
  json(res, 200, { widgets: getWidgetCatalogue(platform ?? undefined, category ?? undefined) });
}

// ─── Template Library Handlers ────────────────────────────────────────────────

/** POST /customize/templates/save — save a layout as a template */
export async function handleSaveTemplate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const platform = parsePlatform(req);
  if (!platform) { json(res, 400, { error: "Invalid or missing platform" }); return; }
  const body = await readBody(req);
  if (!body["owner_id"] || !body["name"] || !body["grid"]) {
    json(res, 400, { error: "owner_id, name and grid are required" }); return;
  }
  const tmpl = saveTemplate(
    body["owner_id"] as string,
    body["name"] as string,
    (body["description"] as string | undefined) ?? "",
    platform,
    body["grid"] as import("../../shared/types/customization.types.js").GridLayout,
    Boolean(body["is_public"] ?? false),
  );
  json(res, 201, tmpl);
}

/** GET /customize/templates?platform= — list templates */
export function handleGetTemplates(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const platform = url.searchParams.get("platform") as Platform | null;
  const ownerId = url.searchParams.get("owner_id") ?? undefined;
  json(res, 200, { templates: getTemplates(platform ?? undefined, true, ownerId) });
}

/** POST /customize/templates/apply — apply a template to a user's layout */
export async function handleApplyTemplate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["template_id"] || !body["owner_id"]) {
    json(res, 400, { error: "template_id and owner_id are required" }); return;
  }
  try {
    const layout = applyTemplate(body["template_id"] as string, body["owner_id"] as string);
    json(res, 200, layout);
  } catch (err) {
    json(res, 404, { error: err instanceof Error ? err.message : "Apply failed" });
  }
}

// ─── Widget Execution Pipeline Handlers ──────────────────────────────────────

/** POST /customize/execute/widget — run widget execution pipeline */
export async function handleExecuteWidget(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const platform = parsePlatform(req);
  if (!platform) { json(res, 400, { error: "Invalid or missing platform" }); return; }
  const body = await readBody(req);
  if (!body["widget"] || !body["owner_id"]) {
    json(res, 400, { error: "widget config and owner_id are required" }); return;
  }
  const event = executeWidgetPipeline(
    body["widget"] as WidgetConfigFull,
    body["owner_id"] as string,
    platform,
  );
  json(res, 200, event);
}

/** POST /customize/execute/layout — run full layout execution pipeline */
export async function handleExecuteLayout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["layout"] || !body["owner_id"]) {
    json(res, 400, { error: "layout and owner_id are required" }); return;
  }
  const events = executeLayoutPipeline(
    body["layout"] as import("../../shared/types/customization.types.js").CustomizationLayout,
    body["owner_id"] as string,
  );
  json(res, 200, { events });
}

