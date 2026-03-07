// ─── Company Engine ───────────────────────────────────────────────────────────
// Creates and manages company nodes from onboarding data.
// Provides industry templates, operations → widget mapping, and UI generation.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type { CompanyNode, Industry, OperationModule } from "../shared/types/onboarding.types.js";
import type { WidgetType } from "../shared/types/customization.types.js";

// ─── In-memory store ──────────────────────────────────────────────────────────
const companies = new Map<string, CompanyNode>();

// ─── Industry → default modules mapping ───────────────────────────────────────
const INDUSTRY_MODULES: Record<Industry, OperationModule[]> = {
  retail:          ["sales", "inventory", "crm", "ecommerce", "accounting"],
  manufacturing:   ["inventory", "manufacturing", "accounting", "hr", "sales"],
  software:        ["project_management", "crm", "customer_support", "hr", "marketing"],
  education:       ["hr", "project_management", "documents", "tasks"],
  healthcare:      ["crm", "hr", "documents", "customer_support"],
  finance:         ["accounting", "crm", "analytics", "customer_support"],
  consulting:      ["project_management", "crm", "documents", "hr", "accounting"],
  restaurant:      ["inventory", "sales", "accounting", "marketing"],
  logistics:       ["inventory", "sales", "hr", "manufacturing"],
  construction:    ["project_management", "inventory", "hr", "accounting"],
  agriculture:     ["inventory", "sales", "accounting"],
  media:           ["marketing", "project_management", "documents", "crm"],
  real_estate:     ["crm", "documents", "accounting", "project_management"],
  travel:          ["crm", "sales", "customer_support", "marketing"],
  personal:        ["tasks", "documents", "analytics"],
};

// ─── Operations → widgets mapping ─────────────────────────────────────────────
const OPERATION_WIDGETS: Record<OperationModule, WidgetType[]> = {
  sales:              ["kpi_card", "chart_bar", "table", "list"],          // revenue, orders, customer list
  inventory:          ["table", "kpi_card", "list", "stat_card"],          // stock, SKUs, supplier list
  accounting:         ["chart_line", "kpi_card", "table", "chart_pie"],    // P&L, cash flow, invoices
  hr:                 ["list", "chart_bar", "table", "chart_gauge"],        // headcount, attendance, payroll
  project_management: ["step_list", "timeline", "kpi_card", "chart_line"],// tasks, milestones
  crm:                ["list", "timeline", "kpi_card", "chart_bar"],        // leads, pipeline, contacts
  customer_support:   ["list", "kpi_card", "chart_line", "notification_panel"],
  marketing:          ["chart_bar", "chart_pie", "kpi_card", "heatmap"],    // campaign reach
  manufacturing:      ["chart_gauge", "kpi_card", "table", "chart_line"],   // production
  ecommerce:          ["kpi_card", "chart_bar", "table", "chart_pie"],      // GMV, carts
  analytics:          ["chart_line", "heatmap", "chart_bar", "kpi_card"],
  documents:          ["list", "table", "tree_view"],
  tasks:              ["step_list", "timeline", "kpi_card"],
};

// ─── Industry UI templates (column structure per platform) ────────────────────
const INDUSTRY_TEMPLATE_TITLE: Record<Industry, string> = {
  retail:          "Retail Command Centre",
  manufacturing:   "Production Control",
  software:        "Engineering Hub",
  education:       "Academic Dashboard",
  healthcare:      "Patient Management",
  finance:         "Financial Overview",
  consulting:      "Client Portal",
  restaurant:      "Restaurant Manager",
  logistics:       "Logistics Control",
  construction:    "Site Manager",
  agriculture:     "Farm Dashboard",
  media:           "Content Studio",
  real_estate:     "Property Manager",
  travel:          "Booking Hub",
  personal:        "Personal Dashboard",
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Create a company node from onboarding result. */
export function createCompany(params: {
  ownerId:       string;
  companyName:   string;
  businessType:  CompanyNode["business_type"];
  industry:      Industry;
  subIndustry?:  string;
  size:          CompanyNode["size"];
  operations?:   OperationModule[];
  departments?:  string[];
  products?:     string[];
  services?:     string[];
  dataPrefs?:    CompanyNode["data_preferences"];
}): CompanyNode {
  const slug      = params.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const companyId = `company.${slug}.${params.ownerId.slice(0, 8)}`;
  const ops       = params.operations ?? INDUSTRY_MODULES[params.industry] ?? [];
  const layoutId  = `layout.${params.industry}.${params.ownerId.slice(0, 8)}`;

  const node: CompanyNode = {
    node_id:          companyId,
    node_type:        "company",
    owner_id:         params.ownerId,
    company_name:     params.companyName,
    business_type:    params.businessType,
    industry:         params.industry,
    sub_industry:     params.subIndustry,
    size:             params.size,
    operations:       ops,
    departments:      params.departments ?? [],
    products:         params.products ?? [],
    services:         params.services ?? [],
    data_preferences: params.dataPrefs ?? [],
    ui_layout_id:     layoutId,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  };

  companies.set(companyId, node);
  return node;
}

/** Get a company node by ID. */
export function getCompany(companyId: string): CompanyNode | undefined {
  return companies.get(companyId);
}

/** Get all companies owned by a user. */
export function getUserCompanies(userId: string): CompanyNode[] {
  return [...companies.values()].filter((c) => c.owner_id === userId);
}

/** Update company operations list. */
export function updateOperations(companyId: string, modules: OperationModule[]): CompanyNode {
  const company = companies.get(companyId);
  if (!company) throw new Error(`Company not found: ${companyId}`);
  company.operations  = modules;
  company.updated_at  = new Date().toISOString();
  return company;
}

/** Return the default modules for an industry. */
export function getIndustryModules(industry: Industry): OperationModule[] {
  return INDUSTRY_MODULES[industry] ?? [];
}

/** Return the widget types for a given operation module. */
export function getModuleWidgets(module: OperationModule): WidgetType[] {
  return OPERATION_WIDGETS[module] ?? [];
}

/** Return the dashboard title for an industry. */
export function getIndustryTitle(industry: Industry): string {
  return INDUSTRY_TEMPLATE_TITLE[industry] ?? "Dashboard";
}
