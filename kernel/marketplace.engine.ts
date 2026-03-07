import { randomUUID } from "node:crypto";
import type {
  MarketplaceWidgetListing,
  MarketplaceInstall,
  Platform,
  WidgetCategory,
} from "../shared/types/customization.types.js";

// ─── In-memory marketplace store ─────────────────────────────────────────────
const listings = new Map<string, MarketplaceWidgetListing>();
const installs = new Map<string, MarketplaceInstall[]>(); // buyer_id → installs

// ─── List & Search ────────────────────────────────────────────────────────────

export function getListings(opts?: {
  platform?: Platform;
  category?: WidgetCategory;
  free_only?: boolean;
  approved_only?: boolean;
}): MarketplaceWidgetListing[] {
  let results = [...listings.values()];
  if (opts?.platform)       results = results.filter((l) => l.platforms.includes(opts.platform!));
  if (opts?.category)       results = results.filter((l) => l.category === opts.category);
  if (opts?.free_only)      results = results.filter((l) => l.price_inr === 0);
  if (opts?.approved_only !== false) results = results.filter((l) => l.approved);
  return results;
}

export function getListing(listingId: string): MarketplaceWidgetListing | null {
  return listings.get(listingId) ?? null;
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export interface PublishListingRequest {
  widget_type: string;
  name: string;
  description: string;
  creator_id: string;
  price_inr: number;
  royalty_pct?: number;
  version?: string;
  platforms: Platform[];
  icon?: string;
  category: WidgetCategory;
  preview_image?: string;
}

export function publishListing(req: PublishListingRequest): MarketplaceWidgetListing {
  if (req.price_inr < 0) throw new Error("Price cannot be negative");
  if ((req.royalty_pct ?? 0) < 0 || (req.royalty_pct ?? 0) > 100) {
    throw new Error("Royalty must be 0–100");
  }
  const listing: MarketplaceWidgetListing = {
    listing_id: randomUUID(),
    widget_type: req.widget_type,
    name: req.name,
    description: req.description,
    creator_id: req.creator_id,
    price_inr: req.price_inr,
    royalty_pct: req.royalty_pct ?? 10,
    installs: 0,
    rating: 0,
    version: req.version ?? "1.0.0",
    platforms: req.platforms,
    icon: req.icon ?? "package",
    category: req.category,
    preview_image: req.preview_image,
    published_at: null,      // set when approved
    updated_at: new Date().toISOString(),
    approved: false,          // requires admin approval
  };
  listings.set(listing.listing_id, listing);
  return listing;
}

// ─── Admin Approval ───────────────────────────────────────────────────────────

export function approveListing(listingId: string): MarketplaceWidgetListing {
  const listing = listings.get(listingId);
  if (!listing) throw new Error(`Listing not found: ${listingId}`);
  listing.approved = true;
  listing.published_at = new Date().toISOString();
  listing.updated_at = new Date().toISOString();
  return listing;
}

export function rejectListing(listingId: string): void {
  const listing = listings.get(listingId);
  if (!listing) throw new Error(`Listing not found: ${listingId}`);
  listings.delete(listingId);
}

// ─── Install ──────────────────────────────────────────────────────────────────

export interface InstallRequest {
  listing_id: string;
  buyer_id: string;
  device_id?: string;
  transaction_id?: string;
}

export function installWidget(req: InstallRequest): MarketplaceInstall {
  const listing = listings.get(req.listing_id);
  if (!listing) throw new Error(`Listing not found: ${req.listing_id}`);
  if (!listing.approved) throw new Error("This widget is not yet approved");

  // Check if already installed
  const existing = (installs.get(req.buyer_id) ?? []).find((i) => i.listing_id === req.listing_id);
  if (existing) return existing; // idempotent

  if (listing.price_inr > 0 && !req.transaction_id) {
    throw new Error("transaction_id required for paid widgets");
  }

  const install: MarketplaceInstall = {
    install_id: randomUUID(),
    listing_id: req.listing_id,
    buyer_id: req.buyer_id,
    device_id: req.device_id,
    installed_at: new Date().toISOString(),
    transaction_id: req.transaction_id,
  };

  const userInstalls = installs.get(req.buyer_id) ?? [];
  userInstalls.push(install);
  installs.set(req.buyer_id, userInstalls);
  listing.installs += 1;
  return install;
}

export function getInstalledWidgets(buyerId: string): Array<{
  install: MarketplaceInstall;
  listing: MarketplaceWidgetListing;
}> {
  return (installs.get(buyerId) ?? []).flatMap((install) => {
    const listing = listings.get(install.listing_id);
    return listing ? [{ install, listing }] : [];
  });
}

// ─── Rating ───────────────────────────────────────────────────────────────────

export function rateListing(listingId: string, rating: number): MarketplaceWidgetListing {
  if (rating < 1 || rating > 5) throw new Error("Rating must be 1–5");
  const listing = listings.get(listingId);
  if (!listing) throw new Error(`Listing not found: ${listingId}`);
  // Incremental moving average (simplified)
  listing.rating = listing.installs === 0
    ? rating
    : (listing.rating * (listing.installs - 1) + rating) / listing.installs;
  return listing;
}
