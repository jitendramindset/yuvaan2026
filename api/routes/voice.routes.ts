// ─── Voice Routes ─────────────────────────────────────────────────────────────

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  processVoiceCommand,
  getVoiceSession,
  endVoiceSession,
  listActiveSessions,
} from "../../kernel/voice.engine.js";

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

// ─── POST /voice/command ──────────────────────────────────────────────────────
// Body: { text: string, user_id: string, session_id?: string, language?: string, device_id?: string }
export async function handleVoiceCommand(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req);
    const text     = String(body["text"] ?? "").trim();
    const userId   = String(body["user_id"] ?? "anonymous");
    const sessionId = body["session_id"] ? String(body["session_id"]) : undefined;
    const language  = body["language"] ? String(body["language"]) : undefined;
    const deviceId  = body["device_id"] ? String(body["device_id"]) : undefined;

    if (!text) {
      json(res, 400, { error: "text is required" });
      return;
    }

    const response = processVoiceCommand(text, userId, { sessionId, language, deviceId });
    json(res, 200, response);
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : "Internal error" });
  }
}

// ─── GET /voice/session/:sessionId ───────────────────────────────────────────
export function handleGetVoiceSession(req: IncomingMessage, res: ServerResponse): void {
  const url       = req.url ?? "";
  const sessionId = url.split("/").pop() ?? "";
  const session   = getVoiceSession(sessionId);
  if (!session) { json(res, 404, { error: "Session not found" }); return; }
  json(res, 200, session);
}

// ─── POST /voice/session/end ──────────────────────────────────────────────────
export async function handleEndVoiceSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body      = await readBody(req);
  const sessionId = String(body["session_id"] ?? "");
  if (!sessionId) { json(res, 400, { error: "session_id required" }); return; }
  endVoiceSession(sessionId);
  json(res, 200, { ok: true });
}

// ─── GET /voice/sessions (admin) ──────────────────────────────────────────────
export function handleListVoiceSessions(_req: IncomingMessage, res: ServerResponse): void {
  const sessions = listActiveSessions();
  json(res, 200, { count: sessions.length, sessions });
}
