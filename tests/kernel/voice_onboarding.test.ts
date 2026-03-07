// ─── Voice + Onboarding + Company System Tests ───────────────────────────────
import { describe, it, expect, beforeEach } from "vitest";
import { processVoiceCommand, getVoiceSession, endVoiceSession } from "../../kernel/voice.engine.js";
import {
  createOnboardingSession,
  getOnboardingSession,
  submitStep,
  skipStep,
  generateNodes,
  getStepPrompt,
} from "../../kernel/onboarding.engine.js";
import {
  createCompany,
  getCompany,
  getUserCompanies,
  getIndustryModules,
  getModuleWidgets,
} from "../../kernel/company.engine.js";
import { generateDashboardLayout, generatePersonalLayout, generateDefaultWorkflow } from "../../kernel/ui.generator.js";

// ─────────────────────────────────────────────────────────────────────────────
// VOICE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

describe("Voice Engine", () => {
  const USER = "voice_test_user";

  it("recognises navigation intent — 'go to sales'", () => {
    const resp = processVoiceCommand("go to sales", USER);
    expect(resp.match.intent).toBe("navigate");
    expect(resp.match.target).toBe("/dashboard/sales");
    expect(resp.ui_event).toBe("navigate");
  });

  it("recognises navigation intent — 'open inventory'", () => {
    const resp = processVoiceCommand("open inventory", USER);
    expect(resp.match.intent).toBe("navigate");
    expect(resp.match.target).toBe("/dashboard/inventory");
  });

  it("recognises widget_request intent — 'add a bar chart for sales'", () => {
    const resp = processVoiceCommand("add a bar chart for sales", USER);
    expect(resp.match.intent).toBe("widget_request");
    expect(resp.ui_event).toBe("add_widget");
    expect(resp.action).toBeDefined();
  });

  it("recognises onboarding intent — 'start onboarding'", () => {
    const resp = processVoiceCommand("start my account setup", USER);
    expect(resp.match.intent).toBe("onboarding");
    expect(resp.match.target).toBe("/onboarding");
  });

  it("recognises social / family tree", () => {
    const resp = processVoiceCommand("show my family tree", USER);
    // family tree navigates to /vanshawali — intent may be navigate or social
    expect(resp.match.target).toBe("/vanshawali");
    expect(resp.ui_event).toBe("navigate");
  });

  it("recognises location sharing", () => {
    const resp = processVoiceCommand("share my location", USER);
    expect(resp.match.intent).toBe("location");
  });

  it("handles unknown command gracefully", () => {
    const resp = processVoiceCommand("xyzzy frob qwux", USER);
    expect(resp.match.intent).toBe("unknown");
    expect(resp.match.confidence).toBe("low");
    expect(resp.ui_event).toBe("ask_user");
  });

  it("stores session history across commands", () => {
    const sid = "session_hist_" + Date.now();
    processVoiceCommand("go to sales", USER, { sessionId: sid });
    processVoiceCommand("add a chart widget", USER, { sessionId: sid });
    const session = getVoiceSession(sid);
    expect(session).toBeDefined();
    expect(session!.history.length).toBe(2);
  });

  it("ends a session", () => {
    const sid = "end_session_" + Date.now();
    processVoiceCommand("go to home", USER, { sessionId: sid });
    endVoiceSession(sid);
    const session = getVoiceSession(sid);
    expect(session?.active).toBe(false);
  });

  it("includes voice_reply in every response", () => {
    const resp = processVoiceCommand("show wallet", USER);
    expect(typeof resp.voice_reply).toBe("string");
    expect(resp.voice_reply.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

describe("Onboarding Engine", () => {
  const USER = "ob_test_user_" + Date.now();

  it("creates an onboarding session", () => {
    const session = createOnboardingSession(USER);
    expect(session.session_id).toBeDefined();
    expect(session.current_step).toBe("user_identity");
    expect(session.completed).toBe(false);
  });

  it("retrieves created session", () => {
    const session = createOnboardingSession(USER + "_get");
    const found   = getOnboardingSession(session.session_id);
    expect(found).toBeDefined();
    expect(found!.user_id).toBe(USER + "_get");
  });

  it("creates voice-mode session", () => {
    const session = createOnboardingSession(USER + "_v", true);
    expect(session.voice_mode).toBe(true);
  });

  it("returns step prompts", () => {
    const prompt = getStepPrompt("user_identity");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("advances through steps correctly", () => {
    const session = createOnboardingSession(USER + "_steps");
    const r1 = submitStep(session.session_id, "user_identity", {
      full_name: "Jitendra", phone: "9999999999", email: "j@test.com",
      language: "en", timezone: "Asia/Kolkata", country: "India",
    });
    expect(r1.session.current_step).toBe("company_setup");
    expect(r1.completed).toBe(false);
  });

  it("skips optional step", () => {
    const session = createOnboardingSession(USER + "_skip");
    submitStep(session.session_id, "user_identity", {
      full_name: "Test", phone: "0000", email: "t@t.com",
      language: "en", timezone: "UTC", country: "India",
    });
    const r = skipStep(session.session_id);
    expect(r.session.current_step).toBe("industry_selection");
  });

  it("marks session complete after all steps", () => {
    const sid = createOnboardingSession(USER + "_complete").session_id;
    const identity = { full_name: "T", phone: "0", email: "t@t.com", language: "en", timezone: "UTC", country: "India" };
    submitStep(sid, "user_identity",   identity);
    submitStep(sid, "company_setup",   { business_type: "company", company_name: "TestCo" });
    submitStep(sid, "industry_selection", { industry: "retail" });
    submitStep(sid, "business_size",   { size: "small" });
    submitStep(sid, "operations",      { modules: ["sales", "inventory"] });
    submitStep(sid, "team_structure",  { departments: ["Sales"], roles: [] });
    submitStep(sid, "product_service", { products: [], services: [], pricing_model: "one_time" });
    const last = submitStep(sid, "data_preferences", { preferences: ["customers", "orders"] });
    expect(last.completed).toBe(true);
    expect(last.session.current_step).toBe("complete");
  });

  it("generates node manifest from complete session", () => {
    const userId = USER + "_gen";
    const sid    = createOnboardingSession(userId).session_id;
    submitStep(sid, "user_identity",   { full_name: "G", phone: "0", email: "g@t.com", language: "en", timezone: "UTC", country: "India" });
    submitStep(sid, "company_setup",   { business_type: "company", company_name: "GenCo" });
    submitStep(sid, "industry_selection", { industry: "retail" });
    submitStep(sid, "business_size",   { size: "small" });
    submitStep(sid, "operations",      { modules: ["sales", "crm"] });
    submitStep(sid, "team_structure",  { departments: ["Sales"], roles: [] });
    submitStep(sid, "product_service", { products: [{ name: "Widget A" }], services: [], pricing_model: "one_time" });
    submitStep(sid, "data_preferences", { preferences: ["customers"] });

    const result = generateNodes(sid);
    expect(result.nodes_created.length).toBeGreaterThan(5);
    expect(result.dashboard_id).toContain(userId);
    expect(result.voice_prompt).toContain("ready");
  });

  it("throws on unknown step", () => {
    const session = createOnboardingSession(USER + "_err");
    expect(() => submitStep(session.session_id, "complete" as never, {})).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY ENGINE
// ─────────────────────────────────────────────────────────────────────────────

describe("Company Engine", () => {
  const OWNER = "company_test_" + Date.now();

  it("creates a company node", () => {
    const company = createCompany({
      ownerId:     OWNER,
      companyName: "Acme Retail",
      businessType:"company",
      industry:    "retail",
      size:        "small",
      operations:  ["sales", "inventory"],
    });
    expect(company.node_id).toContain("company.acme_retail");
    expect(company.industry).toBe("retail");
    expect(company.operations).toContain("sales");
  });

  it("retrieves created company", () => {
    const c1 = createCompany({ ownerId: OWNER, companyName: "RetrieveCo", businessType: "company", industry: "software", size: "medium", operations: [] });
    const c2 = getCompany(c1.node_id);
    expect(c2).toBeDefined();
    expect(c2!.company_name).toBe("RetrieveCo");
  });

  it("lists companies by owner", () => {
    const owner = "list_owner_" + Date.now();
    createCompany({ ownerId: owner, companyName: "Alpha", businessType: "company", industry: "retail",  size: "solo", operations: [] });
    createCompany({ ownerId: owner, companyName: "Beta",  businessType: "startup",  industry: "software", size: "solo", operations: [] });
    const list = getUserCompanies(owner);
    expect(list.length).toBe(2);
  });

  it("returns industry default modules", () => {
    const modules = getIndustryModules("retail");
    expect(modules).toContain("sales");
    expect(modules).toContain("inventory");
  });

  it("returns module widget types", () => {
    const widgets = getModuleWidgets("sales");
    expect(widgets).toContain("kpi_card");
    expect(widgets.length).toBeGreaterThan(0);
  });

  it("returns empty operations for personal industry", () => {
    const mods = getIndustryModules("personal");
    expect(mods).toContain("tasks");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UI GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

describe("UI Generator", () => {
  const USER = "ui_gen_test_" + Date.now();

  it("generates a retail dashboard layout with widgets", () => {
    const layout = generateDashboardLayout({ userId: USER, industry: "retail", modules: ["sales", "inventory"] });
    expect(layout.grid.widgets.length).toBeGreaterThan(2);
    expect(layout.owner_id).toBe(USER);
    expect(layout.status).toBe("draft");
  });

  it("generates a personal layout", () => {
    const layout = generatePersonalLayout(USER);
    expect(layout.grid.widgets.length).toBeGreaterThan(0);
    expect(layout.platform).toBe("vanshawali");
  });

  it("generates a software / workflow platform layout", () => {
    const layout = generateDashboardLayout({ userId: USER, industry: "software", modules: ["project_management", "crm"] });
    expect(layout.platform).toBe("workflow");
  });

  it("widget positions have valid col and row", () => {
    const layout = generateDashboardLayout({ userId: USER, industry: "retail", modules: ["sales"] });
    for (const w of layout.grid.widgets) {
      expect(w.position.col).toBeGreaterThan(0);
      expect(w.position.row).toBeGreaterThan(0);
      expect(w.position.colSpan).toBeGreaterThan(0);
    }
  });

  it("generates a default workflow for sales module", () => {
    const wf = generateDefaultWorkflow("sales", USER);
    expect((wf as { steps: unknown[] }).steps.length).toBeGreaterThan(0);
    expect(String(wf["node_id"])).toContain("workflow");
  });

  it("generates default workflows for all major modules", () => {
    const modules = ["sales", "inventory", "hr", "crm"] as const;
    for (const mod of modules) {
      const wf = generateDefaultWorkflow(mod, USER);
      expect(wf["node_type"]).toBe("workflow");
    }
  });
});
