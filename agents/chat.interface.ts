/**
 * Chat Interface — thin Express-compatible handler that bridges the HTTP
 * chat route (api/routes/chat.routes.ts) to the agent runtime.
 *
 * This module has no direct dependency on Express so it can also be
 * used in tests and CLI tools.
 */
import { processMessage } from "./agent.runtime.js";
import { recallSession, clearSession } from "./memory.engine.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatRequest {
  session_id: string;
  owner_id:   string;
  message:    string;
  /** Optionally include conversation history on the first call */
  history?:   Array<{ role: string; content: string }>;
}

export interface ChatReply {
  session_id:  string;
  reply:       string;
  intent_type: string;
  confidence:  number;
  action?:     Record<string, unknown>;
  suggestions?: Array<{ title: string; description: string }>;
  /** Last N messages of this session for context */
  context?:    Array<{ role: string; content: string; ts: string }>;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function handleChatMessage(req: ChatRequest): Promise<ChatReply> {
  const response = await processMessage({
    session_id: req.session_id,
    owner_id:   req.owner_id,
    text:       req.message,
  });

  // Attach last 10 entries from short-term memory for the client
  const history = recallSession(req.session_id)
    .slice(-10)
    .map((e) => ({ role: e.role, content: e.content, ts: e.ts }));

  return {
    ...response,
    context: history,
  };
}

export async function endSession(sessionId: string): Promise<void> {
  clearSession(sessionId);
}
