# KARMA_ENGINE

**File:** `core/karma-engine.js` — already implemented. Behavioral credit that controls autonomy, rate limits, prompt evolution, and gated actions.

## Tables (reuse — do not duplicate)
- `node_core.karma_score` — live score
- `node_karma_log` — every delta (node_id, change_amount, change_reason, activity_type, previous_score)
- `node_reputation` — composite standing

## Public API
| Method | Purpose |
|---|---|
| `validate(userNode, actionType)` | gate: is action allowed at current karma? |
| `updateKarma(userNode, actionType, result)` | apply delta after execution |
| `getKarmaLevel(score)` | score → level |
| `getAutonomyLevel(karmaScore)` | level consumed by prompt-evolution |
| `getKarmaHistory(nidHash, limit=50)` | timeline |
| `getKarmaScore(nidHash)` | full object (karma + trust + reputation) |

## Levels → autonomy
| Level | Min | Autonomy |
|---|---|---|
| ENLIGHTENED | 200 | maximum |
| TRUSTED | 100 | high |
| ESTABLISHED | 50 | standard |
| NEUTRAL | 0 | normal |
| CAUTIOUS | -20 | limited |
| RESTRICTED | -50 | minimal |
| BLOCKED | -100 | none |

## Deltas (sample)
`create_helpful_content +5`, `verify_identity +5`, `invite_family +2`, `abuse_system -10`, `spam_content -20`, `harass_user -25`, `data_tampering -30`.

## Gated-action minimums
`update_prompt` 50 · `admin_execute` 40 · `grant_permission` 30 · `create_admin_node` 20 · `automation` 20 · `delete_node` 10.

## Pipeline position
Step 7 (`karma_check`) gates; step 13 (`update_karma_trust`) applies the delta and, if the autonomy band changes, triggers `prompt-evolution` (step 16). Karma feeds the Trust formula (weight 0.15) — see [`DHARMA_ENGINE.md`](./DHARMA_ENGINE.md) and DRAVYAM (karma multiplier on payouts).

## Extend safely
New behavior signal → add a delta entry + reason; never add a parallel score table. Read karma via `getKarmaScore`, never by raw `node_core` select on hot paths (use node-cache).
