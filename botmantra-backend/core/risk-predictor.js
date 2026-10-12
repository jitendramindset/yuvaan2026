/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  RISK PREDICTOR — Neural OS Kernel                          ║
 * ║  Behavioral Anomaly Detection & Risk Scoring                ║
 * ║  Predicts harmful actions BEFORE they happen                ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Risk Score Range: 0 – 100
 *   0-20   SAFE        — Normal operations
 *   21-40  LOW         — Minor deviations
 *   41-60  MODERATE    — Watch list, extra logging
 *   61-80  HIGH        — Rate-limit, require confirmation
 *   81-100 CRITICAL    — Block execution, admin alert
 *
 * Detection Signals:
 *   1. Velocity Anomaly      — Action frequency spike
 *   2. Pattern Deviation     — Unusual action types
 *   3. Time Anomaly          — Activity at unusual hours
 *   4. Cross-Brand Jumping   — Rapid brand switching
 *   5. Escalation Pattern    — Privilege escalation attempts
 *   6. Failure Cascade       — Repeated failures
 *   7. Geo/Device Anomaly    — New device or location
 *   8. Content Signals       — Prompt injection / abuse patterns
 *
 * Tables used:
 *   node_execution_log   — action patterns, frequency
 *   node_failure_log     — failure cascades
 *   node_event_queue     — event patterns
 *   node_dharma_log      — violation patterns
 *   node_karma_log       — trust delta history
 *   node_core            — current state
 */

// ─── RISK LEVELS ─────────────────────────────────────────────
const RISK_LEVELS = {
  SAFE:     { min: 0,  max: 20,  label: 'Safe',     action: 'allow',               color: '#4CAF50' },
  LOW:      { min: 21, max: 40,  label: 'Low',      action: 'allow_with_log',      color: '#8BC34A' },
  MODERATE: { min: 41, max: 60,  label: 'Moderate',  action: 'allow_with_monitor',  color: '#FF9800' },
  HIGH:     { min: 61, max: 80,  label: 'High',     action: 'require_confirmation', color: '#F44336' },
  CRITICAL: { min: 81, max: 100, label: 'Critical', action: 'block_and_alert',      color: '#B71C1C' }
};

// ─── SIGNAL WEIGHTS ──────────────────────────────────────────
const SIGNAL_WEIGHTS = {
  velocity_anomaly:     0.20,
  pattern_deviation:    0.15,
  time_anomaly:         0.10,
  cross_brand_jumping:  0.10,
  escalation_pattern:   0.15,
  failure_cascade:      0.15,
  device_anomaly:       0.05,
  content_signals:      0.10
};

// ─── VELOCITY THRESHOLDS ─────────────────────────────────────
const VELOCITY_RULES = {
  chat:            { per_minute: 10, per_hour: 100, per_day: 500 },
  data_write:      { per_minute: 5,  per_hour: 50,  per_day: 200 },
  data_delete:     { per_minute: 2,  per_hour: 10,  per_day: 30 },
  create_node:     { per_minute: 1,  per_hour: 5,   per_day: 20 },
  delete_node:     { per_minute: 1,  per_hour: 3,   per_day: 10 },
  admin:           { per_minute: 3,  per_hour: 20,  per_day: 100 },
  switch_brand:    { per_minute: 3,  per_hour: 15,  per_day: 50 },
  automation:      { per_minute: 2,  per_hour: 10,  per_day: 50 },
  prompt_update:   { per_minute: 1,  per_hour: 5,   per_day: 10 },
  default:         { per_minute: 5,  per_hour: 50,  per_day: 200 }
};

// ─── ESCALATION SEQUENCES ───────────────────────────────────
const ESCALATION_PATTERNS = [
  { sequence: ['data_read', 'data_write', 'data_delete'], risk: 30, name: 'read-write-delete chain' },
  { sequence: ['chat', 'admin', 'delete_node'], risk: 50, name: 'chat-to-admin escalation' },
  { sequence: ['switch_brand', 'switch_brand', 'switch_brand'], risk: 25, name: 'brand jumping' },
  { sequence: ['create_node', 'delete_node', 'create_node'], risk: 20, name: 'create-delete oscillation' },
  { sequence: ['data_write', 'data_write', 'data_write', 'data_write', 'data_write'], risk: 15, name: 'write flood' },
  { sequence: ['admin', 'admin', 'admin', 'admin'], risk: 35, name: 'admin hammering' }
];

// ─── CONTENT RISK PATTERNS ──────────────────────────────────
const CONTENT_RISK_PATTERNS = [
  { pattern: /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i, risk: 40, label: 'prompt_injection' },
  { pattern: /you\s+are\s+(now|actually|really)\s+/i, risk: 30, label: 'role_override' },
  { pattern: /system\s*:\s*/i, risk: 25, label: 'system_prompt_injection' },
  { pattern: /\bDAN\b|jailbreak/i, risk: 35, label: 'jailbreak_attempt' },
  { pattern: /DROP\s+TABLE|DELETE\s+FROM|TRUNCATE/i, risk: 50, label: 'sql_injection' },
  { pattern: /<script|javascript:|on\w+\s*=/i, risk: 45, label: 'xss_attempt' },
  { pattern: /\b(hack|exploit|bypass|crack)\s+(the\s+)?(system|server|admin|auth)/i, risk: 30, label: 'attack_intent' }
];

class RiskPredictor {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    // In-memory action buffer for velocity detection (per user)
    this._actionBuffer = new Map();
    this._bufferCleanupInterval = setInterval(() => this._cleanupBuffer(), 5 * 60 * 1000);
  }

  // ═══════════════════════════════════════════════════════════
  // ASSESS RISK — full multi-signal analysis before execution
  // ═══════════════════════════════════════════════════════════
  async assessRisk(nidHash, action, payload = {}) {
    const signals = {};
    const warnings = [];

    // Signal 1: Velocity Anomaly
    signals.velocity_anomaly = this._assessVelocity(nidHash, action);
    if (signals.velocity_anomaly > 50) warnings.push('High action frequency detected');

    // Signal 2: Pattern Deviation
    signals.pattern_deviation = await this._assessPatternDeviation(nidHash, action);
    if (signals.pattern_deviation > 50) warnings.push('Unusual action pattern');

    // Signal 3: Time Anomaly
    signals.time_anomaly = this._assessTimeAnomaly();

    // Signal 4: Cross-Brand Jumping
    signals.cross_brand_jumping = this._assessBrandJumping(nidHash, payload.brand_scope);
    if (signals.cross_brand_jumping > 50) warnings.push('Rapid brand switching');

    // Signal 5: Escalation Pattern
    signals.escalation_pattern = this._assessEscalation(nidHash, action);
    if (signals.escalation_pattern > 40) warnings.push('Possible privilege escalation');

    // Signal 6: Failure Cascade
    signals.failure_cascade = await this._assessFailureCascade(nidHash);
    if (signals.failure_cascade > 60) warnings.push('Elevated failure rate');

    // Signal 7: Device Anomaly
    signals.device_anomaly = this._assessDeviceAnomaly(payload);

    // Signal 8: Content Signals
    signals.content_signals = this._assessContentRisk(payload);
    if (signals.content_signals > 30) warnings.push('Suspicious content patterns');

    // Weighted composite
    let riskScore = 0;
    for (const [signal, weight] of Object.entries(SIGNAL_WEIGHTS)) {
      riskScore += (signals[signal] || 0) * weight;
    }
    riskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

    // Record action in velocity buffer
    this._recordAction(nidHash, action);

    const riskLevel = this.getRiskLevel(riskScore);

    return {
      risk_score: riskScore,
      risk_level: riskLevel,
      signals,
      warnings,
      recommendation: riskLevel.action,
      should_block: riskScore >= RISK_LEVELS.HIGH.min,
      requires_confirmation: riskScore >= RISK_LEVELS.HIGH.min && riskScore < RISK_LEVELS.CRITICAL.min,
      assessed_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SCAN CONTENT — deep content risk analysis
  // ═══════════════════════════════════════════════════════════
  scanContent(text) {
    if (!text || typeof text !== 'string') return { risk: 0, patterns: [] };

    const detected = [];
    let maxRisk = 0;

    for (const rule of CONTENT_RISK_PATTERNS) {
      if (rule.pattern.test(text)) {
        detected.push({ label: rule.label, risk: rule.risk });
        maxRisk = Math.max(maxRisk, rule.risk);
      }
    }

    return {
      risk: maxRisk,
      patterns: detected,
      flagged: detected.length > 0
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GET RISK PROFILE — full historical risk analysis for a node
  // ═══════════════════════════════════════════════════════════
  async getRiskProfile(nidHash) {
    const [execHistory, failHistory, dharmaHistory] = await Promise.all([
      this.db.from('node_execution_log')
        .select('action_name, status, created_at')
        .eq('nid_hash', nidHash)
        .order('created_at', { ascending: false })
        .limit(100),
      this.db.from('node_failure_log')
        .select('error_msg, occurred_at')
        .eq('nid_hash', nidHash)
        .order('occurred_at', { ascending: false })
        .limit(50),
      this.db.from('node_dharma_log')
        .select('action_type, verdict, matched_principle, created_at')
        .eq('nid_hash', nidHash)
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    const execData = execHistory.data || [];
    const failData = failHistory.data || [];
    const dharmaData = dharmaHistory.data || [];

    // Action distribution
    const actionCounts = {};
    for (const e of execData) {
      actionCounts[e.action_name] = (actionCounts[e.action_name] || 0) + 1;
    }

    // Failure analysis
    const recentFailures = failData.filter(f => {
      const age = Date.now() - new Date(f.occurred_at).getTime();
      return age < 24 * 60 * 60 * 1000; // last 24h
    });

    // Dharma violations
    const dharmaViolations = dharmaData.filter(d => d.verdict !== 'pass' && d.verdict !== true);

    // Overall risk assessment
    const failureRate = execData.length > 0 ? failData.length / execData.length : 0;
    const dharmaViolationRate = dharmaData.length > 0 ? dharmaViolations.length / dharmaData.length : 0;

    let profileRisk = 0;
    profileRisk += failureRate * 30;
    profileRisk += dharmaViolationRate * 40;
    profileRisk += Math.min(recentFailures.length * 5, 30);
    profileRisk = Math.min(100, Math.round(profileRisk));

    return {
      overall_risk: profileRisk,
      risk_level: this.getRiskLevel(profileRisk),
      action_distribution: actionCounts,
      total_actions: execData.length,
      total_failures: failData.length,
      failure_rate: Math.round(failureRate * 1000) / 10, // percentage
      recent_failures_24h: recentFailures.length,
      dharma_violations: dharmaViolations.length,
      dharma_violation_rate: Math.round(dharmaViolationRate * 1000) / 10,
      most_common_action: Object.entries(actionCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || 'none',
      profiled_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PREDICT NEXT RISK — based on action sequence
  // ═══════════════════════════════════════════════════════════
  predictNextRisk(nidHash) {
    const buffer = this._actionBuffer.get(nidHash);
    if (!buffer || buffer.actions.length < 2) {
      return { predicted_risk: 0, reason: 'Insufficient data' };
    }

    const recentActions = buffer.actions.slice(-5).map(a => a.action);
    let maxPatternRisk = 0;
    let matchedPattern = null;

    for (const pattern of ESCALATION_PATTERNS) {
      if (this._isSubsequence(pattern.sequence, recentActions)) {
        if (pattern.risk > maxPatternRisk) {
          maxPatternRisk = pattern.risk;
          matchedPattern = pattern.name;
        }
      }
    }

    return {
      predicted_risk: maxPatternRisk,
      matched_pattern: matchedPattern,
      recent_actions: recentActions,
      assessed_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // RISK LEVEL RESOLVER
  // ═══════════════════════════════════════════════════════════
  getRiskLevel(score) {
    if (score <= RISK_LEVELS.SAFE.max) return RISK_LEVELS.SAFE;
    if (score <= RISK_LEVELS.LOW.max) return RISK_LEVELS.LOW;
    if (score <= RISK_LEVELS.MODERATE.max) return RISK_LEVELS.MODERATE;
    if (score <= RISK_LEVELS.HIGH.max) return RISK_LEVELS.HIGH;
    return RISK_LEVELS.CRITICAL;
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNAL — Signal Assessment Functions
  // ═══════════════════════════════════════════════════════════

  _assessVelocity(nidHash, action) {
    const buffer = this._actionBuffer.get(nidHash);
    if (!buffer) return 0;

    const now = Date.now();
    const rules = VELOCITY_RULES[action] || VELOCITY_RULES.default;
    const recentActions = buffer.actions.filter(a => a.action === action);

    const lastMinute = recentActions.filter(a => now - a.ts < 60000).length;
    const lastHour = recentActions.filter(a => now - a.ts < 3600000).length;

    let velocity = 0;
    if (lastMinute >= rules.per_minute) velocity = Math.min(100, 60 + (lastMinute - rules.per_minute) * 10);
    else if (lastHour >= rules.per_hour) velocity = Math.min(80, 40 + (lastHour - rules.per_hour) * 2);

    return velocity;
  }

  async _assessPatternDeviation(nidHash, action) {
    // Check if this action type is unusual for this node
    const { data } = await this.db
      .from('node_execution_log')
      .select('action_name')
      .eq('nid_hash', nidHash)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data || data.length < 5) return 0; // Not enough history

    const actionCounts = {};
    for (const row of data) {
      actionCounts[row.action_name] = (actionCounts[row.action_name] || 0) + 1;
    }

    const total = data.length;
    const thisActionCount = actionCounts[action] || 0;
    const frequency = thisActionCount / total;

    // If action never done before, moderate risk
    if (frequency === 0) return 40;
    // If action rarely done (<5%), low risk
    if (frequency < 0.05) return 25;

    return 0;
  }

  _assessTimeAnomaly() {
    const hour = new Date().getHours();
    // Late night (1am-5am) is slightly unusual for most users
    if (hour >= 1 && hour <= 5) return 15;
    return 0;
  }

  _assessBrandJumping(nidHash, currentBrand) {
    const buffer = this._actionBuffer.get(nidHash);
    if (!buffer || !currentBrand) return 0;

    const recentBrands = buffer.actions
      .filter(a => a.ts > Date.now() - 300000) // last 5 min
      .filter(a => a.brand)
      .map(a => a.brand);

    const uniqueBrands = new Set(recentBrands);
    if (uniqueBrands.size >= 4) return 60;
    if (uniqueBrands.size >= 3) return 30;
    return 0;
  }

  _assessEscalation(nidHash, currentAction) {
    const buffer = this._actionBuffer.get(nidHash);
    if (!buffer || buffer.actions.length < 2) return 0;

    const recentActions = buffer.actions.slice(-6).map(a => a.action);
    recentActions.push(currentAction);

    let maxRisk = 0;
    for (const pattern of ESCALATION_PATTERNS) {
      if (this._isSubsequence(pattern.sequence, recentActions)) {
        maxRisk = Math.max(maxRisk, pattern.risk);
      }
    }

    return maxRisk;
  }

  async _assessFailureCascade(nidHash) {
    const { data } = await this.db
      .from('node_failure_log')
      .select('occurred_at')
      .eq('nid_hash', nidHash)
      .order('occurred_at', { ascending: false })
      .limit(10);

    if (!data || data.length < 3) return 0;

    // Count failures in last 10 minutes
    const recentFailures = data.filter(f =>
      Date.now() - new Date(f.occurred_at).getTime() < 10 * 60 * 1000
    );

    if (recentFailures.length >= 5) return 80;
    if (recentFailures.length >= 3) return 50;
    if (recentFailures.length >= 1) return 15;

    return 0;
  }

  _assessDeviceAnomaly(payload) {
    // Future: compare device_fingerprint against known devices
    // For now, flag if payload contains no device info
    if (!payload.device_id && !payload.device_fingerprint) return 10;
    return 0;
  }

  _assessContentRisk(payload) {
    const message = payload.message || payload.prompt || payload.content || '';
    if (!message) return 0;

    const scan = this.scanContent(message);
    return scan.risk;
  }

  // ─── VELOCITY BUFFER MANAGEMENT ────────────────────────────

  _recordAction(nidHash, action, brand) {
    if (!this._actionBuffer.has(nidHash)) {
      this._actionBuffer.set(nidHash, { actions: [] });
    }
    const buffer = this._actionBuffer.get(nidHash);
    buffer.actions.push({ action, brand, ts: Date.now() });

    // Keep only last 200 actions per user
    if (buffer.actions.length > 200) {
      buffer.actions = buffer.actions.slice(-100);
    }
  }

  _cleanupBuffer() {
    const cutoff = Date.now() - 30 * 60 * 1000; // 30 min
    for (const [nidHash, buffer] of this._actionBuffer) {
      buffer.actions = buffer.actions.filter(a => a.ts > cutoff);
      if (buffer.actions.length === 0) {
        this._actionBuffer.delete(nidHash);
      }
    }
  }

  _isSubsequence(pattern, actions) {
    let pi = 0;
    for (let i = 0; i < actions.length && pi < pattern.length; i++) {
      if (actions[i] === pattern[pi]) pi++;
    }
    return pi === pattern.length;
  }

  // ─── CLEANUP ───────────────────────────────────────────────
  destroy() {
    if (this._bufferCleanupInterval) {
      clearInterval(this._bufferCleanupInterval);
    }
    this._actionBuffer.clear();
  }
}

module.exports = {
  RiskPredictor,
  RISK_LEVELS,
  SIGNAL_WEIGHTS,
  VELOCITY_RULES,
  ESCALATION_PATTERNS,
  CONTENT_RISK_PATTERNS
};
