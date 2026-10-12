# DHARMA_ENGINE

**File:** `core/dharma-validator.js` — already implemented. Dharma = non-negotiable system law. Where karma is earned and flexible, dharma is structural and absolute. Runs at pipeline **step 8** (after karma, before rate limit).

## Tables (reuse)
- `node_dharma_log` — evaluation results (violations, activity_type)
- `node_dharma_profile` — current alignment, level, badges, learning_path
- `dharma_rules` — rule definitions (rule_code, alignment_change, condition_json)
- `node_policies` — per-node rule overlays (min_karma/min_dharma, prompt modifiers)

## Public API
- `validate(userNode, actionType, payload)` → `{ valid, violations[] }`. Any `critical` violation blocks (403 `DHARMA_VIOLATION`).

## The 10 rules
| Rule | Severity | Enforces |
|---|---|---|
| BRAND_ISOLATION | critical | no cross-brand data mutation |
| ROOT_PROTECTION | critical | brand_root nodes immutable |
| AGE_RESTRICTION | critical | JuniorMantra ≤ age 12 |
| CHILD_SAFETY | critical | no unsupervised child actions |
| PERMISSION_ESCALATION | critical | cannot self-promote |
| TYPE_MUTATION | critical | node_type immutable post-create |
| PARENT_CHILD | error | living node needs valid parent |
| DATA_INTEGRITY | error | required fields present |
| ORPHAN_PREVENTION | error | cannot delete parent with children |
| HIERARCHY_DEPTH | warning | max depth 20 |

## Brand age rules
JUNIOR max 12 (strict) · JEETMANTRA 10–25 · MANTRAVAT 18+ (strict) · VANSHAWALI 0–150 · BOTMANTRA 0–150.

## Child-safety blocked actions
`grant_permission`, `delete_node`, `update_prompt`, `admin_execute`, `automation`, `plugin`, `data_delete`, `permission_grant`, `switch_brand`.

## Known integration note
Brand isolation is enforced in `permission-engine.js` (step 6) too; default/fallback nodes (`row_id===0`) are exempted so first-touch users aren't blocked. Keep that exemption when extending.

## Extend safely
New invariant → add a rule with explicit severity in `DHARMA_RULES` + a row in `dharma_rules`. Per-tenant variation goes in `node_policies`, not new code branches.
