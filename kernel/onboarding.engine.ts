// ─── Onboarding Engine ────────────────────────────────────────────────────────
// 8-step guided flow (voice or form) that collects user + company information
// and emits a node-generation manifest at completion.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type {
  OnboardingSession, OnboardingStep,
  UserIdentityPayload, CompanySetupPayload, IndustryPayload,
  BusinessSizePayload, OperationsPayload, TeamStructurePayload,
  ProductServicePayload, DataPreferencesPayload,
  OnboardingResult,
} from "../shared/types/onboarding.types.js";

// ─── In-memory store ──────────────────────────────────────────────────────────
const sessions = new Map<string, OnboardingSession>();

// ─── Step ordering ────────────────────────────────────────────────────────────
const STEPS: OnboardingStep[] = [
  "user_identity",
  "company_setup",
  "industry_selection",
  "business_size",
  "operations",
  "team_structure",
  "product_service",
  "data_preferences",
  "complete",
];

function nextStep(current: OnboardingStep): OnboardingStep {
  const idx = STEPS.indexOf(current);
  return STEPS[Math.min(idx + 1, STEPS.length - 1)] as OnboardingStep;
}

// ─── Voice prompts for each step ──────────────────────────────────────────────
const STEP_PROMPTS: Record<OnboardingStep, string> = {
  user_identity:      "Welcome! Let's start with your name. What's your full name?",
  company_setup:      "Great! Are you setting up a company, or are you a freelancer or solo user?",
  industry_selection: "What industry or sector does your business belong to? For example, retail, healthcare, software.",
  business_size:      "How many people are on your team? One, small team, or larger organization?",
  operations:         "Which modules do you need? For example: sales, inventory, HR, CRM, accounting.",
  team_structure:     "Tell me about your teams. What departments do you have?",
  product_service:    "What products or services do you offer?",
  data_preferences:   "What kind of data do you want to manage — customers, invoices, projects, tasks?",
  complete:           "Excellent! Your workspace is being generated. One moment...",
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Create a new onboarding session for a user. */
export function createOnboardingSession(userId: string, voiceMode = false): OnboardingSession {
  const session: OnboardingSession = {
    session_id:      randomUUID(),
    user_id:         userId,
    current_step:    "user_identity",
    completed:       false,
    voice_mode:      voiceMode,
    data:            {},
    generated_nodes: [],
    created_at:      new Date().toISOString(),
    updated_at:      new Date().toISOString(),
  };
  sessions.set(session.session_id, session);
  return session;
}

/** Get an existing session. */
export function getOnboardingSession(sessionId: string): OnboardingSession | undefined {
  return sessions.get(sessionId);
}

/** Get the voice prompt for the current step. */
export function getStepPrompt(step: OnboardingStep): string {
  return STEP_PROMPTS[step];
}

/** Submit data for a specific step. Advances to next step on success. */
export function submitStep(
  sessionId: string,
  step: OnboardingStep,
  payload: unknown,
): { session: OnboardingSession; voice_prompt: string; completed: boolean } {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Onboarding session not found: ${sessionId}`);
  if (session.completed) throw new Error("Onboarding already completed.");

  switch (step) {
    case "user_identity":
      session.data.user_identity = payload as UserIdentityPayload;
      break;
    case "company_setup":
      session.data.company_setup = payload as CompanySetupPayload;
      break;
    case "industry_selection":
      session.data.industry = payload as IndustryPayload;
      break;
    case "business_size":
      session.data.business_size = payload as BusinessSizePayload;
      break;
    case "operations":
      session.data.operations = payload as OperationsPayload;
      break;
    case "team_structure":
      session.data.team_structure = payload as TeamStructurePayload;
      break;
    case "product_service":
      session.data.product_service = payload as ProductServicePayload;
      break;
    case "data_preferences":
      session.data.data_preferences = payload as DataPreferencesPayload;
      break;
    default:
      throw new Error(`Unknown step: ${step}`);
  }

  session.current_step = nextStep(step);
  session.updated_at   = new Date().toISOString();

  const isComplete = session.current_step === "complete";
  if (isComplete) {
    session.completed = true;
  }

  return {
    session,
    voice_prompt: STEP_PROMPTS[session.current_step],
    completed:    isComplete,
  };
}

/** Skip the current optional step and advance. */
export function skipStep(sessionId: string): { session: OnboardingSession; voice_prompt: string } {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Onboarding session not found: ${sessionId}`);
  session.current_step = nextStep(session.current_step);
  session.updated_at   = new Date().toISOString();
  if (session.current_step === "complete") session.completed = true;
  return { session, voice_prompt: STEP_PROMPTS[session.current_step] };
}

/** Generate all nodes from a completed session. Returns the result manifest. */
export function generateNodes(sessionId: string): OnboardingResult {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Onboarding session not found: ${sessionId}`);

  const userId    = session.user_id;
  const identity  = session.data.user_identity;
  const company   = session.data.company_setup;
  const industry  = session.data.industry;
  const ops       = session.data.operations;
  const teams     = session.data.team_structure;
  const prods     = session.data.product_service;
  const dataPrefs = session.data.data_preferences;

  const nodes: OnboardingResult["nodes_created"] = [];

  // ── Core identity nodes ────────────────────────────────────────────────────
  const profileId = `profile.${userId}`;
  const walletId  = `wallet.${userId}`;
  const agentId   = `agent.${userId}`;

  nodes.push({ type: "profile", node_id: profileId, description: "Vanshawali root profile" });
  nodes.push({ type: "wallet",  node_id: walletId,  description: "Dravyam wallet" });
  nodes.push({ type: "agent",   node_id: agentId,   description: "Personal AI agent (Yunaan)" });

  // ── Vanshawali sub-nodes (11 profile sections) ────────────────────────────
  const vanshawaliSubnodes: Array<[string, string]> = [
    ["personal",   "Personal identity (name, dob, gender, religion)"],
    ["contact",    "Contact (phone, email, WhatsApp, Telegram)"],
    ["location",   "Address & geo location"],
    ["social",     "Social links (LinkedIn, Instagram, GitHub…)"],
    ["family",     "Family tree — parents, spouse, children"],
    ["education",  "Education timeline"],
    ["profession", "Career & profession timeline"],
    ["preference", "Interests, hobbies & lifestyle preferences"],
    ["property",   "Assets, properties & investments"],
    ["media",      "Profile photo, gallery & documents"],
    ["trust",      "Trust score & profile completion ring"],
  ];
  for (const [section, desc] of vanshawaliSubnodes) {
    nodes.push({
      type:        section,
      node_id:     `${section}.vanshawali.${userId}`,
      description: desc,
    });
  }

  // ── Pre-populate personal data from onboarding identity step ─────────────
  if (identity) {
    // The profile.engine.ts computeProfileCompletion will pick these up when
    // the profile node is hydrated from storage.
    nodes.push({
      type:        "profile_seed",
      node_id:     `profile_seed.${userId}`,
      description: `Seed: name=${identity.full_name ?? ""}, email=${identity.email ?? ""}, phone=${identity.phone ?? ""}`,
    });
  }

  // ── Company node ───────────────────────────────────────────────────────────
  let companyId: string | undefined;
  if (company && company.business_type !== "personal") {
    const slug     = (company.company_name ?? userId).toLowerCase().replace(/\s+/g, "_");
    companyId      = `company.${slug}`;
    nodes.push({ type: "company", node_id: companyId, description: `${company.company_name ?? "Company"} node` });
  }

  // ── Department + Role nodes (from team structure) ──────────────────────────
  if (teams) {
    for (const dept of teams.departments) {
      const deptId = `dept.${dept.toLowerCase().replace(/\s+/g, "_")}.${userId}`;
      nodes.push({ type: "department", node_id: deptId, description: `${dept} department` });
    }
    for (const role of teams.roles) {
      const roleId = `role.${role.title.toLowerCase().replace(/\s+/g, "_")}.${userId}`;
      nodes.push({ type: "role", node_id: roleId, description: `${role.title} role` });
    }
  }

  // ── Operation module nodes ─────────────────────────────────────────────────
  const modules = ops?.modules ?? [];
  for (const mod of modules) {
    nodes.push({ type: "module", node_id: `${mod}.${userId}`, description: `${mod} module` });
  }

  // ── Data nodes based on preferences ───────────────────────────────────────
  const dataPreferences = dataPrefs?.preferences ?? inferDataPreferences(modules);
  const dataNodeMap: Record<string, string> = {
    customers:  "customer",
    suppliers:  "supplier",
    inventory:  "inventory",
    projects:   "project",
    tasks:      "task",
    documents:  "document",
    analytics:  "analytics",
    employees:  "employee",
    orders:     "order",
    invoices:   "invoice",
  };
  for (const pref of dataPreferences) {
    const nodeType = dataNodeMap[pref] ?? pref;
    nodes.push({ type: nodeType, node_id: `${nodeType}_store.${userId}`, description: `${pref} data` });
  }

  // ── Product nodes ─────────────────────────────────────────────────────────
  if (prods) {
    for (const p of prods.products.slice(0, 5)) {   // max 5 at onboarding
      const slug = p.name.toLowerCase().replace(/\s+/g, "_");
      nodes.push({ type: "product", node_id: `product.${slug}.${userId}`, description: p.name });
    }
  }

  // ── Dashboard node ────────────────────────────────────────────────────────
  const dashboardId  = `dashboard.${userId}`;
  const layoutId     = `layout.${industry?.industry ?? "general"}.${userId}`;
  nodes.push({ type: "dashboard", node_id: dashboardId, description: "Auto-generated dashboard" });

  // ── Default workflow nodes ─────────────────────────────────────────────────
  const workflowIds: string[] = [];
  const workflowTemplates = inferWorkflows(modules);
  for (const wf of workflowTemplates) {
    const wfId = `workflow.${wf}.${userId}`;
    nodes.push({ type: "workflow", node_id: wfId, description: `${wf} automation workflow` });
    workflowIds.push(wfId);
  }

  // ── Store generated node list in session ──────────────────────────────────
  session.generated_nodes = nodes.map((n) => n.node_id);

  const widgetCount = estimateWidgets(modules);

  const result: OnboardingResult = {
    user_id:       userId,
    company_id:    companyId,
    nodes_created: nodes,
    dashboard_id:  dashboardId,
    ui_schema: {
      platform:     industry?.industry ?? "general",
      widget_count: widgetCount,
      layout_id:    layoutId,
    },
    workflows_created: workflowIds,
    voice_prompt:  `Your workspace is ready! I've created ${nodes.length} nodes and ${widgetCount} widgets for your ${industry?.industry ?? "general"} dashboard. Say "open dashboard" to begin.`,
  };

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferDataPreferences(modules: string[]): string[] {
  const map: Record<string, string[]> = {
    sales:              ["customers", "orders", "invoices"],
    inventory:          ["inventory", "suppliers"],
    hr:                 ["employees"],
    crm:                ["customers"],
    accounting:         ["invoices", "orders"],
    project_management: ["projects", "tasks"],
    ecommerce:          ["customers", "orders", "inventory"],
    manufacturing:      ["inventory", "suppliers"],
  };
  const prefs = new Set<string>();
  for (const mod of modules) {
    for (const p of map[mod] ?? []) prefs.add(p);
  }
  return [...prefs];
}

function inferWorkflows(modules: string[]): string[] {
  const map: Record<string, string> = {
    sales:              "new_order_to_invoice",
    inventory:          "low_stock_alert",
    hr:                 "employee_onboarding",
    crm:                "lead_to_customer",
    accounting:         "invoice_approval",
    project_management: "task_assignment",
    ecommerce:          "order_fulfillment",
    customer_support:   "ticket_escalation",
    marketing:          "campaign_launch",
  };
  return modules.filter((m) => map[m]).map((m) => map[m]!);
}

function estimateWidgets(modules: string[]): number {
  const perModule: Record<string, number> = {
    sales: 4, inventory: 3, hr: 4, crm: 3, accounting: 3,
    project_management: 3, ecommerce: 4, marketing: 3, analytics: 3,
  };
  return modules.reduce((acc, m) => acc + (perModule[m] ?? 2), 2); // +2 base KPIs
}

/** List all sessions for a user (admin / debug). */
export function listUserSessions(userId: string): OnboardingSession[] {
  return [...sessions.values()].filter((s) => s.user_id === userId);
}
