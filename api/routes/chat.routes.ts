import type { IncomingMessage, ServerResponse } from "node:http";
import { processMessage, getChatHistory, executeAutomationPlan } from "../../kernel/chat.engine.js";
import type { AutomationPlan } from "../../shared/types/chat.types.js";

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

/** POST /chat/message — send a message to the AI assistant */
export async function handleChatMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["owner_id"] || !body["message"]) {
    json(res, 400, { error: "owner_id and message are required" });
    return;
  }
  const response = await processMessage({
    session_id: body["session_id"] as string | undefined,
    owner_id: body["owner_id"] as string,
    device_id: (body["device_id"] as string | undefined) ?? "unknown",
    platform: (body["platform"] as string | undefined) ?? "ai_dashboard",
    message: body["message"] as string,
  });
  json(res, 200, response);
}

/** GET /chat/history/:sessionId — get chat history for a session */
export function handleChatHistory(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const sessionId = parts[2]; // ["chat","history","<sessionId>"]
  if (!sessionId) { json(res, 400, { error: "sessionId path param required" }); return; }
  json(res, 200, { session_id: sessionId, messages: getChatHistory(sessionId) });
}

/** POST /chat/automate — execute a structured automation plan */
export async function handleAutomate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body["plan"] || !body["actor_id"]) {
    json(res, 400, { error: "plan and actor_id are required" });
    return;
  }
  const results = await executeAutomationPlan(
    body["plan"] as AutomationPlan,
    body["actor_id"] as string,
  );
  json(res, 200, { results });
}
