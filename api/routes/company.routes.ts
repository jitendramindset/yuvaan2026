// ─── Company Routes ───────────────────────────────────────────────────────────

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createCompany,
  getCompany,
  getUserCompanies,
  updateOperations,
  getIndustryModules,
  getModuleWidgets,
  getIndustryTitle,
} from "../../kernel/company.engine.js";
import { generateDashboardLayout } from "../../kernel/ui.generator.js";
import type { Industry, OperationModule, CompanyNode } from "../../shared/types/onboarding.types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}") as Record<string, unknown>;
}

// ─── GET /company/:companyId ──────────────────────────────────────────────────
export function handleGetCompany(req: IncomingMessage, res: ServerResponse): void {
  const url       = req.url ?? "";
  const companyId = url.split("/").slice(2).join("/");
  const company   = getCompany(companyId);
  if (!company) { json(res, 404, { error: "Company not found" }); return; }
  json(res, 200, company);
}

// ─── GET /company/user/:userId ────────────────────────────────────────────────
export function handleGetUserCompanies(req: IncomingMessage, res: ServerResponse): void {
  const url    = req.url ?? "";
  const userId = url.split("/").pop() ?? "";
  const list   = getUserCompanies(userId);
  json(res, 200, { count: list.length, companies: list });
}

// ─── POST /company/create ─────────────────────────────────────────────────────
export async function handleCreateCompany(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req);
    const ownerId     = String(body["owner_id"] ?? "");
    const companyName = String(body["company_name"] ?? "");
    const industry    = String(body["industry"] ?? "retail") as Industry;

    if (!ownerId || !companyName) {
      json(res, 400, { error: "owner_id and company_name are required" });
      return;
    }

    const company = createCompany({
      ownerId,
      companyName,
      businessType:  String(body["business_type"] ?? "company") as CompanyNode["business_type"],
      industry,
      subIndustry:   body["sub_industry"] ? String(body["sub_industry"]) : undefined,
      size:          String(body["size"] ?? "small") as CompanyNode["size"],
      operations:    (body["operations"] as OperationModule[] | undefined) ?? getIndustryModules(industry),
      departments:   (body["departments"] as string[] | undefined) ?? [],
      products:      (body["products"] as string[] | undefined) ?? [],
      services:      (body["services"] as string[] | undefined) ?? [],
      dataPrefs:     (body["data_preferences"] as CompanyNode["data_preferences"] | undefined) ?? [],
    });

    json(res, 201, company);
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
  }
}

// ─── POST /company/:companyId/operations ─────────────────────────────────────
export async function handleUpdateOperations(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url       = req.url ?? "";
    const parts     = url.split("/");
    const companyId = parts[2] ?? "";
    const body      = await readBody(req);
    const modules   = body["modules"] as OperationModule[];

    if (!modules?.length) { json(res, 400, { error: "modules array required" }); return; }
    const company = updateOperations(companyId, modules);
    json(res, 200, company);
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Bad request" });
  }
}

// ─── GET /company/industry/:industry/modules ──────────────────────────────────
export function handleGetIndustryModules(req: IncomingMessage, res: ServerResponse): void {
  const url      = req.url ?? "";
  const parts    = url.split("/");
  const industry = parts[3] as Industry ?? "retail";
  const modules  = getIndustryModules(industry);
  const title    = getIndustryTitle(industry);
  json(res, 200, { industry, title, modules });
}

// ─── GET /company/industry/:industry/widgets ──────────────────────────────────
export function handleGetIndustryWidgets(req: IncomingMessage, res: ServerResponse): void {
  const url      = req.url ?? "";
  const parts    = url.split("/");
  const industry = parts[3] as Industry ?? "retail";
  const modules  = getIndustryModules(industry);
  const allWidgets = [...new Set(modules.flatMap((m) => getModuleWidgets(m)))];
  json(res, 200, { industry, modules, widgets: allWidgets });
}

// ─── POST /company/layout/generate ───────────────────────────────────────────
// Body: { user_id, industry, modules?: [] }
export async function handleGenerateLayout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body     = await readBody(req);
    const userId   = String(body["user_id"] ?? "");
    const industry = String(body["industry"] ?? "retail") as Industry;
    const modules  = (body["modules"] as OperationModule[] | undefined) ?? getIndustryModules(industry);

    if (!userId) { json(res, 400, { error: "user_id required" }); return; }
    const layout = generateDashboardLayout({ userId, industry, modules });
    json(res, 200, layout);
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
  }
}
