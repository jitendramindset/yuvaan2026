import type { PrivacyMode } from "../shared/types/node.types.js";

// ─── Camera Privacy Engine ────────────────────────────────────────────────────
// On detection of multiple faces, auto-escalates privacy mode to protect data.

export interface FrameAnalysis {
  face_count: number;
  timestamp: string;
  device_id: string;
  recommended_mode: PrivacyMode;
  action_taken: "escalated" | "unchanged" | "idle";
}

// Runtime map: nodeId → current privacy mode snapshot
const privacyModeMap = new Map<string, PrivacyMode>();

// ─── Mode Decision Logic ──────────────────────────────────────────────────────

function recommendMode(faceCount: number, currentMode: PrivacyMode): PrivacyMode {
  if (faceCount === 0) return currentMode;   // no faces → no change
  if (faceCount === 1) return currentMode;   // only user → no change
  if (faceCount === 2) return "protected";   // one other person → protected
  return "stealth";                           // 3+ → stealth
}

// ─── Frame Analysis ───────────────────────────────────────────────────────────

export function analyzeFrame(deviceId: string, nodeId: string, faceCount: number): FrameAnalysis {
  const currentMode = privacyModeMap.get(nodeId) ?? "public";
  const recommended = recommendMode(faceCount, currentMode);

  let action_taken: FrameAnalysis["action_taken"] = "unchanged";

  if (faceCount === 0) {
    action_taken = "idle";
  } else if (recommended !== currentMode) {
    privacyModeMap.set(nodeId, recommended);
    action_taken = "escalated";
  }

  return {
    face_count: faceCount,
    timestamp: new Date().toISOString(),
    device_id: deviceId,
    recommended_mode: recommended,
    action_taken,
  };
}

// ─── Manual Privacy Mode ──────────────────────────────────────────────────────

export function applyPrivacyMode(nodeId: string, mode: PrivacyMode): void {
  privacyModeMap.set(nodeId, mode);
}

export function getPrivacyMode(nodeId: string): PrivacyMode {
  return privacyModeMap.get(nodeId) ?? "public";
}

// ─── Privacy Downgrade (user action clears escalation) ───────────────────────

export function clearEscalation(nodeId: string): void {
  privacyModeMap.set(nodeId, "public");
}

// ─── Batch stream analysis (multiple frames) ─────────────────────────────────

export function analyzeStream(
  deviceId: string,
  nodeId: string,
  frames: number[],
): FrameAnalysis[] {
  return frames.map((faceCount) => analyzeFrame(deviceId, nodeId, faceCount));
}
