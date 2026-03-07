import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getListings,
  getListing,
  publishListing,
  approveListing,
  rejectListing,
  installWidget,
  getInstalledWidgets,
  rateListing,
} from "../../kernel/marketplace.engine.js";
import type { Platform, WidgetCategory } from "../../shared/types/customization.types.js";

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

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** GET /marketplace/listings[?platform=&category=&free=] */
export function handleGetListings(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  json(res, 200, {
    listings: getListings({
      platform: url.searchParams.get("platform") as Platform | null ?? undefined,
      category: url.searchParams.get("category") as WidgetCategory | null ?? undefined,
      free_only: url.searchParams.get("free") === "1",
    }),
  });
}

/** GET /marketplace/listings/:id */
export function handleGetListing(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const listingId = parts[2];
  if (!listingId) { json(res, 400, { error: "listing id required" }); return; }
  const listing = getListing(listingId);
  if (!listing) { json(res, 404, { error: "Listing not found" }); return; }
  json(res, 200, listing);
}

/** POST /marketplace/publish — publish a new widget listing */
export async function handlePublishListing(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["widget_type"] || !body["name"] || !body["creator_id"] || !body["platforms"] || !body["category"]) {
    json(res, 400, { error: "widget_type, name, creator_id, platforms and category are required" });
    return;
  }
  try {
    const listing = publishListing({
      widget_type: body["widget_type"] as string,
      name: body["name"] as string,
      description: (body["description"] as string | undefined) ?? "",
      creator_id: body["creator_id"] as string,
      price_inr: (body["price_inr"] as number | undefined) ?? 0,
      royalty_pct: body["royalty_pct"] as number | undefined,
      version: body["version"] as string | undefined,
      platforms: body["platforms"] as Platform[],
      icon: body["icon"] as string | undefined,
      category: body["category"] as WidgetCategory,
      preview_image: body["preview_image"] as string | undefined,
    });
    json(res, 201, listing);
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Publish failed" });
  }
}

/** POST /marketplace/approve — approve a listing (admin only) */
export async function handleApproveListing(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["listing_id"]) { json(res, 400, { error: "listing_id is required" }); return; }
  try {
    json(res, 200, approveListing(body["listing_id"] as string));
  } catch (err) {
    json(res, 404, { error: err instanceof Error ? err.message : "Approve failed" });
  }
}

/** POST /marketplace/reject — reject a listing (admin only) */
export async function handleRejectListing(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["listing_id"]) { json(res, 400, { error: "listing_id is required" }); return; }
  try {
    rejectListing(body["listing_id"] as string);
    json(res, 200, { ok: true });
  } catch (err) {
    json(res, 404, { error: err instanceof Error ? err.message : "Reject failed" });
  }
}

/** POST /marketplace/install — install a widget */
export async function handleInstallWidget(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["listing_id"] || !body["buyer_id"]) {
    json(res, 400, { error: "listing_id and buyer_id are required" });
    return;
  }
  try {
    const install = installWidget({
      listing_id: body["listing_id"] as string,
      buyer_id: body["buyer_id"] as string,
      device_id: body["device_id"] as string | undefined,
      transaction_id: body["transaction_id"] as string | undefined,
    });
    json(res, 200, install);
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Install failed" });
  }
}

/** GET /marketplace/installed?buyer_id=xxx */
export function handleGetInstalled(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const buyerId = url.searchParams.get("buyer_id");
  if (!buyerId) { json(res, 400, { error: "buyer_id query param required" }); return; }
  json(res, 200, { installed: getInstalledWidgets(buyerId) });
}

/** POST /marketplace/rate — rate a listing */
export async function handleRateListing(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["listing_id"] || body["rating"] === undefined) {
    json(res, 400, { error: "listing_id and rating (1-5) are required" });
    return;
  }
  try {
    json(res, 200, rateListing(body["listing_id"] as string, Number(body["rating"])));
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Rate failed" });
  }
}
