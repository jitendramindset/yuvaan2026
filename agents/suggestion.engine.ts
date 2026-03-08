/**
 * Suggestion Engine — analyses activity patterns and produces proactive
 * `suggestion.node` recommendations for the user.
 *
 * Flow: activity_log → pattern detection → insight.node → suggestion.node
 */
import { getActivityPatterns, readRecentActivity } from "./memory.engine.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Suggestion {
  id:          string;
  title:       string;
  description: string;
  action_type: string;
  action_payload: Record<string, unknown>;
  confidence:  number;
  generated_at: string;
}

// ── Detectors ─────────────────────────────────────────────────────────────────

async function detectHighFrequencyIntents(): Promise<Suggestion[]> {
  const patterns = await getActivityPatterns();
  const suggestions: Suggestion[] = [];

  for (const p of patterns.slice(0, 3)) {
    if (p.count < 5) continue;  // ignore low-signal patterns
    if (p.intent_type === "unknown") continue;

    suggestions.push({
      id:          `sug-${p.intent_type}-${Date.now()}`,
      title:       `Quick access: ${p.intent_type.replace(/_/g, " ")}`,
      description: `You've triggered "${p.intent_type}" ${p.count} times. Add it to your dashboard?`,
      action_type: "render_widget",
      action_payload: { widget_type: p.intent_type },
      confidence:  Math.min(0.5 + p.count * 0.05, 0.95),
      generated_at: new Date().toISOString(),
    });
  }
  return suggestions;
}

async function detectTimeOfDayPatterns(): Promise<Suggestion[]> {
  const entries = await readRecentActivity(200);
  const hourCounts: Record<number, number> = {};
  for (const e of entries) {
    const h = new Date(e.ts).getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  }
  const topHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  if (!topHour || Number(topHour[1]) < 5) return [];

  const hour = Number(topHour[0]);
  const label = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return [{
    id:          `sug-timeofday-${Date.now()}`,
    title:       `You're most active in the ${label}`,
    description: `Consider scheduling important workflows during the ${label} for peak efficiency.`,
    action_type: "create_workflow",
    action_payload: { schedule_hint: label },
    confidence:  0.7,
    generated_at: new Date().toISOString(),
  }];
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateSuggestions(): Promise<Suggestion[]> {
  const [freq, tod] = await Promise.all([
    detectHighFrequencyIntents(),
    detectTimeOfDayPatterns(),
  ]);
  return [...freq, ...tod];
}
