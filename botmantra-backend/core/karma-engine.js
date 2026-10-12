/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KARMA ENGINE — Neural OS Kernel                            ║
 * ║  Behavioral credit system                                   ║
 * ║  Karma affects: autonomy, prompt, rate limits, access       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Tables used:
 *   node_core       — karma_score (direct field)
 *   node_karma_log  — karma change history
 *   karma_logs      — legacy karma logs (routes-karma-dharma.js)
 *
 * Karma Rules:
 *   > 100  → High autonomy, proactive AI suggestions
 *   > 50   → Standard autonomy
 *   > 0    → Normal operation
 *   < 0    → Restricted operations
 *   < -50  → Blocked from write actions
 *   < -100 → Account review required
 */

// ─── IMPORTS ────────────────────────────────────────────────
const NodeFactory = require('./nodeFactory');

// ─── KARMA DELTA TABLE ───────────────────────────────────────
const KARMA_DELTAS = {
  // Positive actions
  create_helpful_content:     { delta: +5,  category: 'content' },
  invite_family:              { delta: +2,  category: 'social' },
  complete_profile:           { delta: +3,  category: 'setup' },
  teacher_create_lecture:     { delta: +3,  category: 'education' },
  child_complete_task:        { delta: +2,  category: 'education' },
  verify_identity:            { delta: +5,  category: 'trust' },
  report_issue:               { delta: +1,  category: 'community' },
  share_knowledge:            { delta: +3,  category: 'community' },
  consistent_login:           { delta: +1,  category: 'engagement' },
  help_another_user:          { delta: +4,  category: 'community' },
  complete_onboarding:        { delta: +5,  category: 'setup' },
  positive_feedback:          { delta: +2,  category: 'social' },
  create_course:              { delta: +4,  category: 'education' },
  add_family_member:          { delta: +2,  category: 'social' },
  business_milestone:         { delta: +3,  category: 'business' },

  // Neutral actions
  chat:                       { delta: 0,   category: 'interaction' },
  ui_bootstrap:               { delta: 0,   category: 'system' },
  data_read:                  { delta: 0,   category: 'data' },
  post_login:                 { delta: 0,   category: 'system' },

  // Negative actions
  spam_content:               { delta: -20, category: 'abuse' },
  abuse_system:               { delta: -10, category: 'abuse' },
  failed_login_attempt:       { delta: -1,  category: 'security' },
  violation_report_confirmed: { delta: -15, category: 'abuse' },
  unauthorized_access:        { delta: -5,  category: 'security' },
  excessive_api_calls:        { delta: -3,  category: 'abuse' },
  inappropriate_content:      { delta: -10, category: 'content' },
  harass_user:                { delta: -25, category: 'abuse' },
  data_tampering:             { delta: -30, category: 'security' },
  false_identity:             { delta: -20, category: 'trust' }
};

// ─── KARMA LEVELS ────────────────────────────────────────────
const KARMA_LEVELS = {
  ENLIGHTENED:  { min: 200,  label: 'Enlightened',  autonomy: 'maximum' },
  TRUSTED:      { min: 100,  label: 'Trusted',      autonomy: 'high' },
  ESTABLISHED:  { min: 50,   label: 'Established',  autonomy: 'standard' },
  NEUTRAL:      { min: 0,    label: 'Neutral',       autonomy: 'normal' },
  CAUTIOUS:     { min: -20,  label: 'Cautious',      autonomy: 'limited' },
  RESTRICTED:   { min: -50,  label: 'Restricted',    autonomy: 'minimal' },
  BLOCKED:      { min: -100, label: 'Blocked',       autonomy: 'none' }
};

class KarmaEngine {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = NodeFactory;
  }

  // ═══════════════════════════════════════════════════════════
  // PRE-ACTION KARMA VALIDATION
  // ═══════════════════════════════════════════════════════════
  validate(userNode, actionType) {
    const karmaScore = userNode.karma_score || 0;

    // Hard block at very negative karma
    if (karmaScore < -100) {
      return {
        allowed: false,
        code: 'KARMA_ACCOUNT_REVIEW',
        message: 'Account requires review due to extremely low karma',
        karma: karmaScore,
        level: this.getKarmaLevel(karmaScore)
      };
    }

    if (karmaScore < -50) {
      // Allow only read + chat
      const readOnlyActions = ['chat', 'ui_bootstrap', 'data_read', 'post_login'];
      if (!readOnlyActions.includes(actionType)) {
        return {
          allowed: false,
          code: 'KARMA_BLOCKED',
          message: `Karma too low (${karmaScore}) for action: ${actionType}`,
          karma: karmaScore,
          level: this.getKarmaLevel(karmaScore)
        };
      }
    }

    // Special action karma thresholds
    const specialThresholds = {
      create_admin_node:  20,
      grant_permission:   30,
      update_prompt:      50,
      admin_execute:      40,
      automation:         20,
      delete_node:        10,
      create_node:        -10
    };

    const threshold = specialThresholds[actionType];
    if (threshold !== undefined && karmaScore < threshold) {
      return {
        allowed: false,
        code: 'INSUFFICIENT_KARMA',
        message: `Karma ${karmaScore} < required ${threshold} for ${actionType}`,
        karma: karmaScore,
        required: threshold,
        level: this.getKarmaLevel(karmaScore)
      };
    }

    return {
      allowed: true,
      karma: karmaScore,
      level: this.getKarmaLevel(karmaScore)
    };
  }

  // ═══════════════════════════════════════════════════════════
  // POST-ACTION KARMA UPDATE
  // ═══════════════════════════════════════════════════════════
  async updateKarma(userNode, actionType, result = {}) {
    const delta = this._calculateDelta(actionType, result);
    if (delta === 0) return { updated: false, karma: userNode.karma_score };

    const newKarma = (userNode.karma_score || 0) + delta;

    // Clamp karma to [-500, 1000]
    const clampedKarma = Math.max(-500, Math.min(1000, newKarma));

    // Update node_core
    const updateResult = await this.nodeFactory.updateNode(userNode.nid_hash, {
      karma_score: clampedKarma,
      updated_at: new Date().toISOString()
    });

    if (!updateResult.success) {
      console.error('[KARMA] Update error:', updateResult.error);
    }

    // Log to node_karma_log
    await this._logKarmaChange(userNode, actionType, delta, clampedKarma, result);

    return {
      updated: true,
      previous: userNode.karma_score || 0,
      delta,
      karma: clampedKarma,
      level: this.getKarmaLevel(clampedKarma)
    };
  }

  // ═══════════════════════════════════════════════════════════
  // KARMA LEVEL RESOLVER
  // ═══════════════════════════════════════════════════════════
  getKarmaLevel(score) {
    if (score >= KARMA_LEVELS.ENLIGHTENED.min) return KARMA_LEVELS.ENLIGHTENED;
    if (score >= KARMA_LEVELS.TRUSTED.min) return KARMA_LEVELS.TRUSTED;
    if (score >= KARMA_LEVELS.ESTABLISHED.min) return KARMA_LEVELS.ESTABLISHED;
    if (score >= KARMA_LEVELS.NEUTRAL.min) return KARMA_LEVELS.NEUTRAL;
    if (score >= KARMA_LEVELS.CAUTIOUS.min) return KARMA_LEVELS.CAUTIOUS;
    if (score >= KARMA_LEVELS.RESTRICTED.min) return KARMA_LEVELS.RESTRICTED;
    return KARMA_LEVELS.BLOCKED;
  }

  // ═══════════════════════════════════════════════════════════
  // KARMA → AUTONOMY LEVEL (used by prompt evolution)
  // ═══════════════════════════════════════════════════════════
  getAutonomyLevel(karmaScore) {
    const level = this.getKarmaLevel(karmaScore);
    return level.autonomy;
  }

  // ═══════════════════════════════════════════════════════════
  // KARMA HISTORY
  // ═══════════════════════════════════════════════════════════
  async getKarmaHistory(nidHash, limit = 50) {
    const { data } = await this.db
      .from('node_karma_log')
      .select('*')
      .eq('nid_hash', nidHash)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getKarmaScore(nidHash) {
    const node = await this.nodeFactory.loadUserNode(nidHash);

    if (!node) return null;
    return {
      karma: node.karma_score,
      trust: node.trust_score,
      reputation: node.reputation_level,
      level: this.getKarmaLevel(node.karma_score)
    };
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNAL — delta calculation
  // ═══════════════════════════════════════════════════════════
  _calculateDelta(actionType, result = {}) {
    // Explicit delta in result
    if (result.karma_delta !== undefined) return result.karma_delta;

    // Map action to delta
    const entry = KARMA_DELTAS[actionType];
    if (entry) return entry.delta;

    // Result-based inference
    if (result.success === false || result.error) return -1;
    if (result.created || result.updated) return +1;

    return 0;
  }

  async _logKarmaChange(userNode, actionType, delta, newKarma, result) {
    try {
      await this.db
        .from('node_karma_log')
        .insert({
          nid_hash: userNode.nid_hash,
          owner_id: userNode.owner_id,
          action_type: actionType,
          karma_delta: delta,
          karma_before: userNode.karma_score || 0,
          karma_after: newKarma,
          category: KARMA_DELTAS[actionType]?.category || 'general',
          metadata: { result_summary: result.success !== undefined ? result.success : null },
          created_at: new Date().toISOString()
        });
    } catch (err) {
      // Fallback to karma_logs table
      try {
        await this.db
          .from('karma_logs')
          .insert({
            user_id: userNode.owner_id,
            action: actionType,
            delta,
            score_before: userNode.karma_score || 0,
            score_after: newKarma,
            category: KARMA_DELTAS[actionType]?.category || 'general',
            created_at: new Date().toISOString()
          });
      } catch { /* both tables missing — silent fail */ }
    }
  }
}

module.exports = {
  KarmaEngine,
  KARMA_DELTAS,
  KARMA_LEVELS
};
