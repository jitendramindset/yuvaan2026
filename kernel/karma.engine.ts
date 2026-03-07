import type { NodeRecord } from "../shared/types/node.types.js";

/**
 * Computes the Karma score for a node based on its current health, trust,
 * and experience metrics.
 *
 * Formula (all factors normalised to 0–100):
 *   karma = success_rate * 0.4 + uptime * 0.2 + validation_score * 0.2 + contribution * 0.2
 *
 * Factor mapping:
 *   success_rate     ← health_score
 *   uptime           ← health_score
 *   validation_score ← trust_score
 *   contribution     ← experience_level (capped at 100)
 *
 * The result is an integer in the range [0, 100].
 * The score cannot drop more than 10 points in a single execution to prevent
 * karma cliff-falls from transient errors.
 */
export function computeKarma(node: NodeRecord): number {
  const current = node.karma_score ?? 0;
  const health = Math.min(100, Math.max(0, node.health_score ?? 100));
  const trust = Math.min(100, Math.max(0, node.trust_score ?? 50));
  const contribution = Math.min(100, Math.max(0, node.experience_level ?? 0));

  const computed = Math.round(
    health * 0.4 +   // success_rate + uptime combined
    trust * 0.2 +    // validation_score
    contribution * 0.2 +
    health * 0.2,    // uptime (second factor, same source as success_rate)
  );

  // Prevent cliff-falls: karma cannot decrease by more than 10 per execution
  const floor = Math.max(0, current - 10);
  return Math.max(floor, Math.min(100, computed));
}

/**
 * Maps a raw karma score to the reputation level enum.
 */
export function karmaToReputationLevel(score: number): "seed" | "sprout" | "root" | "elder" {
  if (score >= 80) return "elder";
  if (score >= 60) return "root";
  if (score >= 30) return "sprout";
  return "seed";
}
