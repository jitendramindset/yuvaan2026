import type { TrustNode, VanshawaliProfile } from "../shared/types/profile.types.js";

/**
 * Completion weights — must sum to 100.
 */
const WEIGHTS = {
  basic_info:  20,
  contact:     10,
  location:    10,
  education:   10,
  profession:  10,
  family:      20,
  preferences: 10,
  media:       10,
} as const;

/**
 * Determines whether each section of a Vanshawali profile is meaningfully filled.
 */
function evaluateSections(profile: VanshawaliProfile): Record<keyof typeof WEIGHTS, boolean> {
  return {
    basic_info:  Boolean(profile.personal.full_name && profile.personal.date_of_birth),
    contact:     Boolean(profile.contact.phone.value || profile.contact.email.value),
    location:    Boolean(profile.location.current_address.city),
    education:   Boolean(profile.education.highest_qualification),
    profession:  Boolean(profile.profession.occupation),
    family:      profile.family.members.length > 0,
    preferences: profile.preference.interests.length > 0 || profile.preference.hobbies.length > 0,
    media:       Boolean(profile.media.profile_photo),
  };
}

/**
 * Computes the profile completion score (0–100) and updates the trust node.
 *
 * Also computes the wallet limit multiplier:
 *   - ≥ 80% completion → 3× base limit
 *   - ≥ 50% → 1.5× base limit
 *   - < 50% → 1× base limit
 */
export function computeProfileCompletion(
  profile: VanshawaliProfile,
  existingTrust: TrustNode,
): TrustNode {
  const filled = evaluateSections(profile);
  let total = 0;

  const breakdown = { ...existingTrust.completion_breakdown };
  for (const [key, weight] of Object.entries(WEIGHTS) as Array<[keyof typeof WEIGHTS, number]>) {
    const section = filled[key];
    breakdown[key] = { weight, filled: section };
    if (section) total += weight;
  }

  return {
    ...existingTrust,
    profile_completion_score: total,
    completion_breakdown: breakdown,
  };
}

/**
 * Returns the wallet transaction limit multiplier based on profile completion.
 */
export function walletLimitMultiplier(completionScore: number): number {
  if (completionScore >= 80) return 3;
  if (completionScore >= 50) return 1.5;
  return 1;
}
