import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { runNode } from "../kernel/kernel.engine.js";
import {
  handleCreateOrder,
  handleCapturePayment,
  handleRefund,
  handleWebhook,
  handleTransactionStatus,
} from "./routes/dravyam.routes.js";
import {
  handleDetectDevice,
  handleRegisterDevice,
  handlePairDevice,
  handleConfirmPin,
  handleListDevices,
  handleRevokeDevice,
  handleHeartbeat,
  handleRegisterCmdDevice,
} from "./routes/device.routes.js";
import {
  handlePasswordAuth,
  handleSetPassword,
  handleBiometricAuth,
  handleEnrollBiometric,
  handleGetNonce,
  handleHardwareKeyAuth,
  handleRegisterHardwareKey,
  handleValidateSession,
  handleLogout,
} from "./routes/auth.routes.js";
import {
  handleAdminSnapshot,
  handleAdminAction,
  handleUserActivity,
  handleSetMode,
  handleTrackActivity,
  handleAnalyzeFrame,
  handleApplyPrivacy,
  handleGetPrivacyMode,
  handleClearEscalation,
  handleAnalyzeStream,
} from "./routes/admin.routes.js";
import {
  handleGetCatalogue,
  handleGetCatalogueFiltered,
  handleGetWidget,
  handleGetLayout,
  handleSaveLayout,
  handlePublishLayout,
  handleGetActiveLayout,
  handleSaveTemplate,
  handleGetTemplates,
  handleApplyTemplate,
  handleExecuteWidget,
  handleExecuteLayout,
} from "./routes/customization.routes.js";
import {
  handleGetListings,
  handleGetListing,
  handlePublishListing,
  handleApproveListing,
  handleRejectListing,
  handleInstallWidget,
  handleGetInstalled,
  handleRateListing,
} from "./routes/marketplace.routes.js";
import {
  handleChatMessage,
  handleChatHistory,
  handleAutomate,
} from "./routes/chat.routes.js";
import {
  handleVoiceCommand,
  handleGetVoiceSession,
  handleEndVoiceSession,
  handleListVoiceSessions,
} from "./routes/voice.routes.js";
import {
  handleStartOnboarding,
  handleGetOnboardingSession,
  handleSubmitStep,
  handleSkipStep,
  handleCompleteOnboarding,
  handleListUserSessions,
} from "./routes/onboarding.routes.js";
import {
  handleGetCompany,
  handleGetUserCompanies,
  handleCreateCompany,
  handleUpdateOperations,
  handleGetIndustryModules,
  handleGetIndustryWidgets,
  handleGenerateLayout,
} from "./routes/company.routes.js";
import {
  handleListAllNodes,
  handleGetNodeAdmin,
  handleUpdateNodeStatus,
  handleArchiveNode,
  handleNodeGraph,
} from "./routes/node_admin.routes.js";

const port = Number(process.env["PORT"] ?? 3000);

// ─── CORS helper ─────────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Device-Id, X-Session-Id",
  "Access-Control-Max-Age":       "86400",
};

// ─── Tiny router ─────────────────────────────────────────────────────────────

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS_HEADERS });
  res.end(JSON.stringify(body));
}

const routes: Array<{ method: string; path: string | RegExp; handler: Handler }> = [
  // ── Health ──────────────────────────────────────────────────────────────────
  { method: "GET",  path: "/health", handler: (_req, res) => json(res, 200, { status: "ok", version: "0.1.0" }) },

  // ── Kernel smoke test ────────────────────────────────────────────────────────
  { method: "POST", path: "/kernel/run", handler: async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}") as { nodeId?: string; actorId?: string };
    try {
      const result = await runNode({ nodeId: body.nodeId ?? "system.root", actorId: body.actorId ?? "system" });
      json(res, 200, result);
    } catch (err) {
      json(res, 400, { error: err instanceof Error ? err.message : "Unknown error" });
    }
  }},

  // ── Dravyam payment gateway ──────────────────────────────────────────────────
  { method: "POST", path: "/dravyam/create-order",       handler: handleCreateOrder },
  { method: "POST", path: "/dravyam/capture-payment",    handler: handleCapturePayment },
  { method: "POST", path: "/dravyam/refund",             handler: handleRefund },
  { method: "POST", path: "/dravyam/webhook",            handler: handleWebhook },
  { method: "GET",  path: "/dravyam/transaction-status", handler: handleTransactionStatus },

  // ── Device management ────────────────────────────────────────────────────────
  { method: "POST", path: "/devices/detect",       handler: handleDetectDevice },
  { method: "POST", path: "/devices/register",     handler: handleRegisterDevice },
  { method: "POST", path: "/devices/pair",         handler: handlePairDevice },
  { method: "POST", path: "/devices/confirm-pin",  handler: handleConfirmPin },
  { method: "GET",  path: "/devices/list",         handler: handleListDevices },
  { method: "POST", path: "/devices/revoke",       handler: handleRevokeDevice },
  { method: "POST", path: "/devices/heartbeat",    handler: handleHeartbeat },
  { method: "POST", path: "/devices/register-cmd", handler: handleRegisterCmdDevice },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  { method: "POST", path: "/auth/password",          handler: handlePasswordAuth },
  { method: "POST", path: "/auth/set-password",      handler: handleSetPassword },
  { method: "POST", path: "/auth/biometric",         handler: handleBiometricAuth },
  { method: "POST", path: "/auth/enroll-biometric",  handler: handleEnrollBiometric },
  { method: "GET",  path: "/auth/nonce",             handler: handleGetNonce },
  { method: "POST", path: "/auth/hardware-key",      handler: handleHardwareKeyAuth },
  { method: "POST", path: "/auth/register-key",      handler: handleRegisterHardwareKey },
  { method: "POST", path: "/auth/validate-session",  handler: handleValidateSession },
  { method: "POST", path: "/auth/logout",            handler: handleLogout },

  // ── Admin & Camera Privacy ───────────────────────────────────────────────────
  { method: "GET",  path: "/admin/snapshot",              handler: handleAdminSnapshot },
  { method: "POST", path: "/admin/action",                handler: handleAdminAction },
  { method: "GET",  path: /^\/admin\/activity\/.+$/,      handler: handleUserActivity },
  { method: "POST", path: "/admin/mode",                  handler: handleSetMode },
  { method: "POST", path: "/admin/track",                 handler: handleTrackActivity },
  { method: "POST", path: "/privacy/analyze",             handler: handleAnalyzeFrame },
  { method: "POST", path: "/privacy/apply",               handler: handleApplyPrivacy },
  { method: "GET",  path: "/privacy/mode",               handler: handleGetPrivacyMode },
  { method: "POST", path: "/privacy/clear",               handler: handleClearEscalation },
  { method: "POST", path: "/privacy/analyze-stream",      handler: handleAnalyzeStream },

  // ── Customization ────────────────────────────────────────────────────────────
  { method: "GET",  path: "/customize/widgets",                                 handler: handleGetCatalogueFiltered },
  { method: "GET",  path: /^\/customize\/widget\/[a-z_]+$/,                    handler: handleGetWidget },
  { method: "GET",  path: /^\/customize\/layout\/[a-z_]+$/,                    handler: handleGetLayout },
  { method: "POST", path: /^\/customize\/layout\/[a-z_]+\/save$/,              handler: handleSaveLayout },
  { method: "POST", path: /^\/customize\/layout\/[a-z_]+\/publish$/,           handler: handlePublishLayout },
  { method: "GET",  path: /^\/customize\/layout\/[a-z_]+\/active$/,            handler: handleGetActiveLayout },
  { method: "GET",  path: "/customize/templates",                              handler: handleGetTemplates },
  { method: "POST", path: /^\/customize\/templates\/[a-z_]+\/save$/,           handler: handleSaveTemplate },
  { method: "POST", path: "/customize/templates/apply",                        handler: handleApplyTemplate },
  { method: "POST", path: /^\/customize\/execute\/[a-z_]+\/widget$/,           handler: handleExecuteWidget },
  { method: "POST", path: /^\/customize\/execute\/[a-z_]+\/layout$/,           handler: handleExecuteLayout },

  // ── Marketplace ───────────────────────────────────────────────────────────────
  { method: "GET",  path: "/marketplace/listings",                             handler: handleGetListings },
  { method: "GET",  path: /^\/marketplace\/listings\/.+$/,                     handler: handleGetListing },
  { method: "POST", path: "/marketplace/publish",                              handler: handlePublishListing },
  { method: "POST", path: "/marketplace/approve",                              handler: handleApproveListing },
  { method: "POST", path: "/marketplace/reject",                               handler: handleRejectListing },
  { method: "POST", path: "/marketplace/install",                              handler: handleInstallWidget },
  { method: "GET",  path: "/marketplace/installed",                            handler: handleGetInstalled },
  { method: "POST", path: "/marketplace/rate",                                 handler: handleRateListing },

  // ── AI Chat ──────────────────────────────────────────────────────────────────
  { method: "POST", path: "/chat/message",               handler: handleChatMessage },
  { method: "GET",  path: /^\/chat\/history\/.+$/,       handler: handleChatHistory },
  { method: "POST", path: "/chat/automate",              handler: handleAutomate },

  // ── Voice Control ─────────────────────────────────────────────────────────────
  { method: "POST", path: "/voice/command",              handler: handleVoiceCommand },
  { method: "GET",  path: /^\/voice\/session\/.+$/,      handler: handleGetVoiceSession },
  { method: "POST", path: "/voice/session/end",          handler: handleEndVoiceSession },
  { method: "GET",  path: "/voice/sessions",             handler: handleListVoiceSessions },

  // ── Onboarding ────────────────────────────────────────────────────────────────
  { method: "POST", path: "/onboarding/start",                        handler: handleStartOnboarding },
  { method: "GET",  path: /^\/onboarding\/session\/.+$/,              handler: handleGetOnboardingSession },
  { method: "POST", path: "/onboarding/step",                         handler: handleSubmitStep },
  { method: "POST", path: "/onboarding/skip",                         handler: handleSkipStep },
  { method: "POST", path: "/onboarding/complete",                     handler: handleCompleteOnboarding },
  { method: "GET",  path: /^\/onboarding\/sessions\/user\/.+$/,       handler: handleListUserSessions },

  // ── Company ───────────────────────────────────────────────────────────────────
  { method: "POST", path: "/company/create",                          handler: handleCreateCompany },
  { method: "GET",  path: "/company/layout/generate",                 handler: handleGenerateLayout },
  { method: "POST", path: "/company/layout/generate",                 handler: handleGenerateLayout },
  { method: "GET",  path: /^\/company\/industry\/[a-z_]+\/modules$/,  handler: handleGetIndustryModules },
  { method: "GET",  path: /^\/company\/industry\/[a-z_]+\/widgets$/,  handler: handleGetIndustryWidgets },
  { method: "GET",  path: /^\/company\/user\/.+$/,                    handler: handleGetUserCompanies },
  { method: "POST", path: /^\/company\/[^/]+\/operations$/,           handler: handleUpdateOperations },
  { method: "GET",  path: /^\/company\/.+$/,                          handler: handleGetCompany },

  // ── Admin Node Graph ──────────────────────────────────────────────────────────
  { method: "GET",  path: "/admin/nodes",                             handler: handleListAllNodes },
  { method: "GET",  path: "/admin/graph",                             handler: handleNodeGraph },
  { method: "GET",  path: /^\/admin\/nodes\/.+\/json$/,               handler: handleGetNodeAdmin },
  { method: "PATCH",path: /^\/admin\/nodes\/.+\/status$/,             handler: handleUpdateNodeStatus },
  { method: "PATCH",path: /^\/admin\/nodes\/.+\/archive$/,            handler: handleArchiveNode },

  // ── Devices aliases ───────────────────────────────────────────────────────────
  { method: "GET",  path: "/devices",                                 handler: handleListDevices },
  { method: "GET",  path: "/devices/list",                            handler: handleListDevices },
];

const server = createServer((req, res) => {
  const method = req.method ?? "GET";
  const url    = (req.url ?? "/").split("?")[0] ?? "/";

  // ── Handle CORS preflight ─────────────────────────────────────────────────
  if (method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const route = routes.find((r) =>
    r.method === method &&
    (typeof r.path === "string" ? r.path === url : r.path.test(url)),
  );
  if (route) {
    Promise.resolve(route.handler(req, res)).catch((err: unknown) => {
      json(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
    });
    return;
  }

  json(res, 404, { error: "Not found", path: url });
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(port, () => {
    process.stdout.write(`\nNodeOS API  http://localhost:${port}\n`);
    process.stdout.write(`  GET  /health\n`);
    process.stdout.write(`  POST /kernel/run\n`);
    process.stdout.write(`  POST /dravyam/create-order\n`);
    process.stdout.write(`  — Device   POST /devices/detect | /devices/pair | /devices/confirm-pin\n`);
    process.stdout.write(`  — Auth     POST /auth/password | /auth/biometric | /auth/hardware-key\n`);
    process.stdout.write(`  — Admin    GET  /admin/snapshot | POST /admin/action\n`);
    process.stdout.write(`  — Privacy  POST /privacy/analyze | /privacy/apply\n`);
    process.stdout.write(`  — Custom   GET  /customize/widgets | /customize/layout/:platform\n`);
    process.stdout.write(`  — Chat     POST /chat/message | GET /chat/history/:sessionId\n\n`);
  });
}

export { server };

