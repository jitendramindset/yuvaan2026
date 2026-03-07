// ─── Onboarding Routes ────────────────────────────────────────────────────────

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createOnboardingSession,
  getOnboardingSession,
  submitStep,
  skipStep,
  generateNodes,
  listUserSessions,
  getStepPrompt,
} from "../../kernel/onboarding.engine.js";
import { createCompany } from "../../kernel/company.engine.js";
import { generateDashboardLayout, generatePersonalLayout } from "../../kernel/ui.generator.js";
import type { OnboardingStep, Industry, OperationModule } from "../../shared/types/onboarding.types.js";

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

// ─── POST /onboarding/start ───────────────────────────────────────────────────
// Body: { user_id: string, voice_mode?: boolean }
export async function handleStartOnboarding(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body      = await readBody(req);
    const userId    = String(body["user_id"] ?? "").trim();
    const voiceMode = Boolean(body["voice_mode"] ?? false);
    if (!userId) { json(res, 400, { error: "user_id required" }); return; }

    const session = createOnboardingSession(userId, voiceMode);
    json(res, 201, {
      session_id:   session.session_id,
      current_step: session.current_step,
      voice_prompt: getStepPrompt(session.current_step),
    });
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
  }
}

// ─── GET /onboarding/session/:sessionId ──────────────────────────────────────
export function handleGetOnboardingSession(req: IncomingMessage, res: ServerResponse): void {
  const url       = req.url ?? "";
  const sessionId = url.split("/").pop() ?? "";
  const session   = getOnboardingSession(sessionId);
  if (!session) { json(res, 404, { error: "Session not found" }); return; }
  json(res, 200, session);
}

// ─── POST /onboarding/step ────────────────────────────────────────────────────
// Body: { session_id, step, payload }
export async function handleSubmitStep(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body      = await readBody(req);
    const sessionId = String(body["session_id"] ?? "");
    const step      = String(body["step"] ?? "") as OnboardingStep;
    const payload   = body["payload"] as unknown;

    if (!sessionId || !step || !payload) {
      json(res, 400, { error: "session_id, step, and payload are required" });
      return;
    }

    const result = submitStep(sessionId, step, payload);
    json(res, 200, {
      session_id:   result.session.session_id,
      current_step: result.session.current_step,
      completed:    result.completed,
      voice_prompt: result.voice_prompt,
    });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Bad request" });
  }
}

// ─── POST /onboarding/skip ────────────────────────────────────────────────────
// Body: { session_id }
export async function handleSkipStep(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body      = await readBody(req);
    const sessionId = String(body["session_id"] ?? "");
    if (!sessionId) { json(res, 400, { error: "session_id required" }); return; }

    const result = skipStep(sessionId);
    json(res, 200, {
      session_id:   result.session.session_id,
      current_step: result.session.current_step,
      voice_prompt: result.voice_prompt,
    });
  } catch (err) {
    json(res, 400, { error: err instanceof Error ? err.message : "Bad request" });
  }
}

// ─── POST /onboarding/complete ────────────────────────────────────────────────
// Generates all nodes + dashboard + workflows from a completed session.
// Body: { session_id }
export async function handleCompleteOnboarding(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body      = await readBody(req);
    const sessionId = String(body["session_id"] ?? "");
    if (!sessionId) { json(res, 400, { error: "session_id required" }); return; }

    const session = getOnboardingSession(sessionId);
    if (!session) { json(res, 404, { error: "Session not found" }); return; }

    // Generate result manifest
    const result = generateNodes(sessionId);

    // Create company node if business type is not personal
    const companyData = session.data.company_setup;
    const industryData = session.data.industry;
    const sizeData     = session.data.business_size;
    const opsData      = session.data.operations;

    if (companyData && companyData.business_type !== "personal" && companyData.company_name) {
      createCompany({
        ownerId:      session.user_id,
        companyName:  companyData.company_name,
        businessType: companyData.business_type,
        industry:     (industryData?.industry ?? "retail") as Industry,
        subIndustry:  industryData?.sub_industry,
        size:         sizeData?.size ?? "small",
        operations:   opsData?.modules ?? [],
        departments:  session.data.team_structure?.departments ?? [],
        products:     session.data.product_service?.products.map((p) => p.name) ?? [],
        services:     session.data.product_service?.services.map((s) => s.name) ?? [],
        dataPrefs:    session.data.data_preferences?.preferences ?? [],
      });
    }

    // Generate dashboard layout
    const layout = (companyData?.business_type === "personal" || !companyData)
      ? generatePersonalLayout(session.user_id)
      : generateDashboardLayout({
          userId:   session.user_id,
          industry: (industryData?.industry ?? "retail") as Industry,
          modules:  (opsData?.modules ?? []) as OperationModule[],
        });

    json(res, 200, {
      ...result,
      layout,
    });
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
  }
}

// ─── GET /onboarding/sessions/:userId ────────────────────────────────────────
export function handleListUserSessions(req: IncomingMessage, res: ServerResponse): void {
  const url    = req.url ?? "";
  const userId = url.split("/").pop() ?? "";
  const list   = listUserSessions(userId);
  json(res, 200, { count: list.length, sessions: list });
}
