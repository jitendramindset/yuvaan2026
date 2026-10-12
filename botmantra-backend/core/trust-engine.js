/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  TRUST ENGINE — Neural OS Kernel                            ║
 * ║  Multi-Factor Trust Score Computation & Lifecycle           ║
 * ║  Trust = weighted sum of behavioral signals over time       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Trust Score Range: 0 – 100
 * Composed of 7 weighted factors:
 *   1. Identity Verification   (20%)
 *   2. Behavior History        (25%)
 *   3. Karma Score              (15%)
 *   4. Session Consistency      (10%)
 *   5. Device Reputation        (10%)
 *   6. Dharma Compliance        (10%)
 *   7. Time & Tenure            (10%)
 *
 * Tables used:
 *   node_core           — trust_score, karma_score, reputation_level, health_score
 *   node_trust_state    — nid_hash, trust_score, karma_score, last_update
 *   node_karma_log      — trust_delta tracking
 *   node_dharma_log     — trust_applied tracking
 *   node_execution_log  — action history
 *   node_failure_log    — failure count
 *   node_event_queue    — event patterns
 *
 * Trust Levels:
 *   SOVEREIGN   (90-100)  Full autonomy, can grant trust to others
 *   TRUSTED     (70-89)   Admin-capable, automation unlocked
 *   VERIFIED    (50-69)   Standard operations, write access
 *   CAUTIOUS    (30-49)   Limited writes, monitored
 *   UNTRUSTED   (10-29)   Read-only, rate-limited
 *   BLACKLISTED (0-9)     Locked out, admin review required
 */

const { decodeFromBlob } = require('./node-schema');

// ─── TRUST LEVELS ────────────────────────────────────────────
const TRUST_LEVELS = {
  SOVEREIGN:   { min: 90, max: 100, label: 'Sovereign',   color: '#FFD700', capabilities: ['grant_trust', 'admin', 'automation', 'prompt_update', 'all'] },
  TRUSTED:     { min: 70, max: 89,  label: 'Trusted',     color: '#4CAF50', capabilities: ['admin', 'automation', 'data_delete', 'plugin'] },
  VERIFIED:    { min: 50, max: 69,  label: 'Verified',    color: '#2196F3', capabilities: ['data_write', 'create_node', 'switch_brand'] },
  CAUTIOUS:    { min: 30, max: 49,  label: 'Cautious',    color: '#FF9800', capabilities: ['data_write_limited', 'chat'] },
  UNTRUSTED:   { min: 10, max: 29,  label: 'Untrusted',   color: '#F44336', capabilities: ['data_read', 'chat'] },
  BLACKLISTED: { min: 0,  max: 9,   label: 'Blacklisted', color: '#000000', capabilities: [] }
};

// ─── FACTOR WEIGHTS ──────────────────────────────────────────
const TRUST_WEIGHTS = {
  identity_verification: 0.20,
  behavior_history:      0.25,
  karma_factor:          0.15,
  session_consistency:   0.10,
  device_reputation:     0.10,
  dharma_compliance:     0.10,
  time_tenure:           0.10
};

// ─── TRUST DECAY RULES ──────────────────────────────────────
const TRUST_DECAY = {
  idle_days_threshold: 30,       // Start decay after 30 days inactive
  decay_rate_per_day: 0.5,       // Lose 0.5 trust per idle day
  max_decay: 20,                 // Maximum trust lost to decay
  recovery_rate: 1.0,            // Gain 1.0 trust per active day after return
  min_floor: 10                  // Trust never decays below 10 (not blacklisted)
};

// ─── TRUST EVENT DELTAS ──────────────────────────────────────
const TRUST_EVENTS = {
  // Positive
  email_verified:         { delta: +10, max_once: true,  category: 'identity' },
  phone_verified:         { delta: +8,  max_once: true,  category: 'identity' },
  kyc_completed:          { delta: +15, max_once: true,  category: 'identity' },
  profile_completed:      { delta: +5,  max_once: true,  category: 'identity' },
  two_factor_enabled:     { delta: +8,  max_once: true,  category: 'identity' },
  successful_login:       { delta: +0.5, max_once: false, category: 'session' },
  consistent_session:     { delta: +1,  max_once: false, category: 'session' },
  positive_karma_action:  { delta: +0.5, max_once: false, category: 'behavior' },
  dharma_pass:            { delta: +0.2, max_once: false, category: 'dharma' },
  content_endorsed:       { delta: +2,  max_once: false, category: 'community' },
  admin_trust_boost:      { delta: +10, max_once: false, category: 'admin' },
  first_week_active:      { delta: +5,  max_once: true,  category: 'tenure' },
  first_month_active:     { delta: +5,  max_once: true,  category: 'tenure' },
  first_year_active:      { delta: +10, max_once: true,  category: 'tenure' },

  // Negative
  failed_login:           { delta: -2,  max_once: false, category: 'session' },
  dharma_violation:       { delta: -5,  max_once: false, category: 'dharma' },
  spam_detected:          { delta: -10, max_once: false, category: 'abuse' },
  rate_limit_hit:         { delta: -3,  max_once: false, category: 'abuse' },
  unauthorized_access:    { delta: -8,  max_once: false, category: 'security' },
  data_tampering:         { delta: -15, max_once: false, category: 'security' },
  abuse_report_confirmed: { delta: -20, max_once: false, category: 'abuse' },
  suspicious_device:      { delta: -5,  max_once: false, category: 'device' },
  admin_trust_penalty:    { delta: -15, max_once: false, category: 'admin' },
  prompt_injection:       { delta: -10, max_once: false, category: 'security' },
  cross_brand_violation:  { delta: -8,  max_once: false, category: 'dharma' }
};

// ─── REPUTATION LEVELS (read-only, based on composite score) ─
const REPUTATION_LEVELS = {
  LEGENDARY:  { min_karma: 500, min_trust: 90, min_tenure_days: 365 },
  VETERAN:    { min_karma: 200, min_trust: 70, min_tenure_days: 180 },
  ESTABLISHED:{ min_karma: 50,  min_trust: 50, min_tenure_days: 30 },
  ACTIVE:     { min_karma: 0,   min_trust: 30, min_tenure_days: 7 },
  NEW:        { min_karma: -100, min_trust: 0,  min_tenure_days: 0 }
};

class TrustEngine {
  constructor(supabaseClient, nodeFactory) {
    this.db = supabaseClient;
    this.nodeFactory = nodeFactory;
  }

  // ═══════════════════════════════════════════════════════════
  // COMPUTE FULL TRUST SCORE — multi-factor weighted
  // ═══════════════════════════════════════════════════════════
  async computeTrustScore(nidHash) {
    const factors = {};

    // Load node core using NodeFactory
    const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: nidHash });
    const node = nodeQuery && nodeQuery.length > 0 ? nodeQuery[0] : null;

    if (!node) return null;

    const fieldMap = decodeFromBlob(node.field_map) || {};

    // Factor 1: Identity Verification (0–100)
    factors.identity_verification = this._computeIdentityScore(fieldMap, node);

    // Factor 2: Behavior History (0–100)
    factors.behavior_history = await this._computeBehaviorScore(nidHash);

    // Factor 3: Karma Factor (0–100)
    factors.karma_factor = this._karmaToTrustFactor(node.karma_score || 0);

    // Factor 4: Session Consistency (0–100)
    factors.session_consistency = await this._computeSessionScore(nidHash, node);

    // Factor 5: Device Reputation (0–100)
    factors.device_reputation = await this._computeDeviceScore(node.owner_id);

    // Factor 6: Dharma Compliance (0–100)
    factors.dharma_compliance = await this._computeDharmaScore(nidHash);

    // Factor 7: Time & Tenure (0–100)
    factors.time_tenure = this._computeTenureScore(node.created_at);

    // Weighted composite
    let composite = 0;
    for (const [factor, weight] of Object.entries(TRUST_WEIGHTS)) {
      composite += (factors[factor] || 0) * weight;
    }

    // Apply decay
    const decayPenalty = this._computeDecay(node.last_check || node.updated_at);
    composite = Math.max(0, Math.min(100, composite - decayPenalty));

    const level = this.getTrustLevel(composite);
    const reputation = this._computeReputation(node.karma_score || 0, composite, node.created_at);

    return {
      trust_score: Math.round(composite * 10) / 10,
      level,
      reputation,
      factors,
      decay_penalty: decayPenalty,
      computed_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // QUICK TRUST CHECK (does NOT recompute — reads cached)
  // ═══════════════════════════════════════════════════════════
  async getQuickTrust(nidHash) {
    const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: nidHash });
    const data = nodeQuery && nodeQuery.length > 0 ? nodeQuery[0] : null;

    if (!data) return null;
    return {
      trust_score: data.trust_score,
      level: this.getTrustLevel(data.trust_score),
      karma: data.karma_score,
      reputation: data.reputation_level,
      health: data.health_score
    };
  }

  // ═══════════════════════════════════════════════════════════
  // APPLY TRUST EVENT — change trust based on an event
  // ═══════════════════════════════════════════════════════════
  async applyTrustEvent(nidHash, eventType, metadata = {}) {
    const eventDef = TRUST_EVENTS[eventType];
    if (!eventDef) return { applied: false, reason: `Unknown event: ${eventType}` };

    const nodeQuery = await this.nodeFactory.queryNodes({ nid_hash: nidHash });
    const node = nodeQuery && nodeQuery.length > 0 ? nodeQuery[0] : null;

    if (!node) return { applied: false, reason: 'Node not found' };

    // Check max_once constraint
    if (eventDef.max_once) {
      const applied = await this._hasEventBeenApplied(nidHash, eventType);
      if (applied) return { applied: false, reason: 'Already applied (one-time event)' };
    }

    const oldScore = node.trust_score || 50;
    const newScore = Math.max(0, Math.min(100, oldScore + eventDef.delta));

    // Update node_core using NodeFactory
    await this.nodeFactory.updateNode(nidHash, {
      trust_score: newScore,
      reputation_level: this._computeReputation(null, newScore, null).level,
      updated_at: new Date().toISOString()
    });

    // Update node_trust_state
    await this.db
      .from('node_trust_state')
      .upsert({
        nid_hash: nidHash,
        trust_score: newScore,
        last_update: new Date().toISOString()
      }, { onConflict: 'nid_hash' });

    // Log to node_karma_log (has trust_delta column)
    await this._logTrustChange(nidHash, node.owner_id, eventType, eventDef.delta, oldScore, newScore, metadata);

    return {
      applied: true,
      event: eventType,
      delta: eventDef.delta,
      previous: oldScore,
      current: newScore,
      level: this.getTrustLevel(newScore)
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PERSIST COMPUTED TRUST — write full computation back to DB
  // ═══════════════════════════════════════════════════════════
  async persistTrust(nidHash) {
    const computed = await this.computeTrustScore(nidHash);
    if (!computed) return null;

    // Update node_core using NodeFactory
    await this.nodeFactory.updateNode(nidHash, {
      trust_score: computed.trust_score,
      reputation_level: computed.reputation.level,
      health_score: Math.round(computed.trust_score * 0.8 + 20), // trust contributes to health
      updated_at: new Date().toISOString()
    });

    await this.db
      .from('node_trust_state')
      .upsert({
        nid_hash: nidHash,
        trust_score: computed.trust_score,
        karma_score: computed.factors.karma_factor,
        last_update: new Date().toISOString()
      }, { onConflict: 'nid_hash' });

    return computed;
  }

  // ═══════════════════════════════════════════════════════════
  // TRUST HISTORY — timeline of trust changes
  // ═══════════════════════════════════════════════════════════
  async getTrustHistory(nidHash, limit = 50) {
    const { data } = await this.db
      .from('node_karma_log')
      .select('*')
      .eq('nid_hash', nidHash)
      .not('trust_delta', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  // ═══════════════════════════════════════════════════════════
  // TRUST LEVEL RESOLVER
  // ═══════════════════════════════════════════════════════════
  getTrustLevel(score) {
    if (score >= TRUST_LEVELS.SOVEREIGN.min) return TRUST_LEVELS.SOVEREIGN;
    if (score >= TRUST_LEVELS.TRUSTED.min) return TRUST_LEVELS.TRUSTED;
    if (score >= TRUST_LEVELS.VERIFIED.min) return TRUST_LEVELS.VERIFIED;
    if (score >= TRUST_LEVELS.CAUTIOUS.min) return TRUST_LEVELS.CAUTIOUS;
    if (score >= TRUST_LEVELS.UNTRUSTED.min) return TRUST_LEVELS.UNTRUSTED;
    return TRUST_LEVELS.BLACKLISTED;
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNAL — Individual Factor Computations
  // ═══════════════════════════════════════════════════════════

  _computeIdentityScore(fieldMap, node) {
    let score = 20; // Base for having an account
    if (fieldMap.email) score += 15;
    if (fieldMap.mobile || fieldMap.phone) score += 15;
    if (fieldMap.name && fieldMap.name.length > 2) score += 10;
    if (fieldMap.avatar_url) score += 5;
    if (fieldMap.age !== null && fieldMap.age !== undefined) score += 5;
    if (fieldMap.gender) score += 5;
    if (node.pin_hash) score += 10;
    if (node.device_fingerprint) score += 5;
    if (fieldMap.kyc_verified) score += 10;
    return Math.min(100, score);
  }

  async _computeBehaviorScore(nidHash) {
    let score = 50; // Neutral start

    // Count successful executions
    const { count: successCount } = await this.db
      .from('node_execution_log')
      .select('*', { count: 'exact', head: true })
      .eq('nid_hash', nidHash)
      .eq('status', 'success');

    // Count failures
    const { count: failCount } = await this.db
      .from('node_failure_log')
      .select('*', { count: 'exact', head: true })
      .eq('nid_hash', nidHash);

    const totalActions = (successCount || 0) + (failCount || 0);
    if (totalActions === 0) return 50; // No history = neutral

    const successRate = (successCount || 0) / Math.max(totalActions, 1);
    score = Math.round(successRate * 80 + 20); // 20-100 range

    // Bonus for volume (more actions = more data = more trust)
    if (totalActions > 100) score = Math.min(100, score + 5);
    if (totalActions > 500) score = Math.min(100, score + 5);

    // Penalty for high failure rate
    if (failCount && failCount > 10) score = Math.max(0, score - 10);

    return Math.max(0, Math.min(100, score));
  }

  _karmaToTrustFactor(karmaScore) {
    // Map karma [-500, 1000] to trust factor [0, 100]
    if (karmaScore >= 200) return 100;
    if (karmaScore >= 100) return 85;
    if (karmaScore >= 50) return 70;
    if (karmaScore >= 20) return 60;
    if (karmaScore >= 0) return 50;
    if (karmaScore >= -20) return 35;
    if (karmaScore >= -50) return 20;
    if (karmaScore >= -100) return 10;
    return 0;
  }

  async _computeSessionScore(nidHash, node) {
    let score = 50;

    // Check last activity recency
    const lastActive = new Date(node.updated_at || node.created_at);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive < 1) score += 20;
    else if (daysSinceActive < 7) score += 10;
    else if (daysSinceActive > 30) score -= 15;
    else if (daysSinceActive > 90) score -= 30;

    // Check sync_version (higher = more consistent activity)
    const syncVersion = node.sync_version || 0;
    if (syncVersion > 50) score += 15;
    else if (syncVersion > 10) score += 10;
    else if (syncVersion > 3) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  async _computeDeviceScore(ownerId) {
    // Since trusted_devices table doesn't exist, derive from node_core fields
    // In future: query trusted_devices
    return 50; // Neutral — device trust table not yet populated
  }

  async _computeDharmaScore(nidHash) {
    let score = 70; // Default good standing

    // Count dharma violations
    const { data: violations } = await this.db
      .from('node_dharma_log')
      .select('verdict, trust_applied')
      .eq('nid_hash', nidHash)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!violations || violations.length === 0) return 70;

    let passes = 0;
    let fails = 0;
    for (const v of violations) {
      if (v.verdict === 'pass' || v.verdict === true) passes++;
      else fails++;
    }

    const total = passes + fails;
    if (total === 0) return 70;

    score = Math.round((passes / total) * 100);
    return Math.max(0, Math.min(100, score));
  }

  _computeTenureScore(createdAt) {
    if (!createdAt) return 10;
    const daysSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation >= 365) return 100;
    if (daysSinceCreation >= 180) return 80;
    if (daysSinceCreation >= 90) return 65;
    if (daysSinceCreation >= 30) return 50;
    if (daysSinceCreation >= 7) return 35;
    return 20;
  }

  _computeDecay(lastCheck) {
    if (!lastCheck) return 0;
    const daysSince = (Date.now() - new Date(lastCheck).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= TRUST_DECAY.idle_days_threshold) return 0;

    const idleDays = daysSince - TRUST_DECAY.idle_days_threshold;
    return Math.min(TRUST_DECAY.max_decay, idleDays * TRUST_DECAY.decay_rate_per_day);
  }

  _computeReputation(karmaScore, trustScore, createdAt) {
    const karma = karmaScore ?? 0;
    const trust = trustScore ?? 50;
    const tenureDays = createdAt
      ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    for (const [level, req] of Object.entries(REPUTATION_LEVELS)) {
      if (karma >= req.min_karma && trust >= req.min_trust && tenureDays >= req.min_tenure_days) {
        return { level, ...req };
      }
    }
    return { level: 'NEW', ...REPUTATION_LEVELS.NEW };
  }

  async _hasEventBeenApplied(nidHash, eventType) {
    const { count } = await this.db
      .from('node_karma_log')
      .select('*', { count: 'exact', head: true })
      .eq('nid_hash', nidHash)
      .eq('reason', `trust_event:${eventType}`);

    return (count || 0) > 0;
  }

  async _logTrustChange(nidHash, ownerId, eventType, delta, oldScore, newScore, metadata) {
    try {
      await this.db
        .from('node_karma_log')
        .insert({
          nid_hash: nidHash,
          actor_owner_id: ownerId,
          action_type: 'trust_update',
          karma_delta: 0,
          trust_delta: delta,
          reason: `trust_event:${eventType}`,
          created_at: new Date().toISOString()
        });
    } catch { /* table schema mismatch — silent */ }
  }
}

module.exports = {
  TrustEngine,
  TRUST_LEVELS,
  TRUST_WEIGHTS,
  TRUST_EVENTS,
  TRUST_DECAY,
  REPUTATION_LEVELS
};
