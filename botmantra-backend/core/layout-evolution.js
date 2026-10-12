/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYOUT EVOLUTION ENGINE — Neural OS Kernel                 ║
 * ║  AI-Driven Autonomous UI Redesign Based on Usage Patterns   ║
 * ║  The UI evolves. Not designed. Evolved.                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * How it works:
 *   1. Track every widget interaction (click, view, dismiss, resize)
 *   2. Compute usage heatmap per user/brand/role
 *   3. Detect underused widgets → suggest removal
 *   4. Detect high-frequency actions → suggest widget promotion
 *   5. Brand presets evolve per deployment, not per release
 *   6. AI proposes layout mutations → admin approves or auto-deploys
 *
 * Evolution Cycle:
 *   OBSERVE → ANALYZE → PROPOSE → (APPROVE?) → MUTATE → DEPLOY
 *
 * Tables used:
 *   dashboard_layouts    — grid_json, business_id, role_id
 *   dashboard_widgets    — widget_type, config, position
 *   node_execution_log   — action frequency per user
 *   node_event_queue     — mutation events
 *   node_core            — user role, brand, karma
 *
 * In-memory tracking (no analytics table needed):
 *   Widget interaction counts, session heatmaps, evolution proposals
 */

const { WIDGET_TYPES, WIDGET_PRESETS, getBrandDefaultLayout } = require('./widget-engine');

// ─── EVOLUTION CONFIG ────────────────────────────────────────
const EVOLUTION_CONFIG = {
  min_interactions_for_analysis: 20,    // Min interactions before evolving
  underuse_threshold: 0.05,             // <5% interaction share = underused
  hotspot_threshold: 0.30,              // >30% interaction share = hotspot
  evolution_cooldown_ms: 3600_000,      // 1 hour between evolutions per user
  max_proposals_per_cycle: 5,           // Max mutations proposed at once
  auto_deploy_threshold: 0.85,          // 85%+ confidence = auto-deploy
  widget_decay_days: 14,                // Decay unused widget score after 14 days
  layout_version_limit: 50              // Max versions per user/brand
};

// ─── INTERACTION TYPES ───────────────────────────────────────
const INTERACTION_TYPES = {
  view:       { weight: 1,  label: 'Viewed' },
  click:      { weight: 3,  label: 'Clicked' },
  interact:   { weight: 5,  label: 'Interacted' },
  submit:     { weight: 8,  label: 'Submitted data' },
  resize:     { weight: 2,  label: 'Resized' },
  drag:       { weight: 2,  label: 'Repositioned' },
  dismiss:    { weight: -3, label: 'Dismissed' },
  collapse:   { weight: -1, label: 'Collapsed' },
  expand:     { weight: 1,  label: 'Expanded' },
  scroll:     { weight: 0.5, label: 'Scrolled within' }
};

// ─── MUTATION TYPES ──────────────────────────────────────────
const MUTATION_TYPES = {
  PROMOTE:    { label: 'Promote widget (larger, higher)',     impact: 'positive' },
  DEMOTE:     { label: 'Demote widget (smaller, lower)',      impact: 'negative' },
  ADD:        { label: 'Add new widget',                       impact: 'additive' },
  REMOVE:     { label: 'Remove underused widget',             impact: 'subtractive' },
  REPOSITION: { label: 'Move widget to better position',     impact: 'neutral' },
  RESIZE:     { label: 'Resize widget based on usage',       impact: 'neutral' },
  SWAP:       { label: 'Swap two widgets positions',          impact: 'neutral' },
  THEME:      { label: 'Adjust widget theme/style',          impact: 'cosmetic' }
};

// ─── POSITION ZONES (priority zones on the grid) ─────────────
const GRID_ZONES = {
  HERO:    { row: 0, col: 0, maxW: 12, maxH: 4, priority: 1, label: 'Top hero area' },
  PRIMARY: { row: 0, col: 0, maxW: 8,  maxH: 4, priority: 2, label: 'Primary content' },
  SIDEBAR: { row: 0, col: 8, maxW: 4,  maxH: 6, priority: 3, label: 'Side panel' },
  MIDDLE:  { row: 4, col: 0, maxW: 12, maxH: 4, priority: 4, label: 'Middle section' },
  FOOTER:  { row: 8, col: 0, maxW: 12, maxH: 3, priority: 5, label: 'Bottom area' }
};

class LayoutEvolution {
  constructor(supabaseClient) {
    this.db = supabaseClient;

    // In-memory interaction tracking
    // Map<userId, Map<widgetId, { views, clicks, submits, score, lastInteraction }>>
    this._interactions = new Map();

    // Evolution history — Map<userId, { lastEvolution, proposals, versions }>
    this._evolutionState = new Map();

    // Cleanup old interaction data every 30 minutes
    this._cleanupInterval = setInterval(() => this._cleanup(), 30 * 60 * 1000);
  }

  // ═══════════════════════════════════════════════════════════
  // TRACK — Record widget interaction
  // ═══════════════════════════════════════════════════════════
  trackInteraction(userId, widgetId, interactionType, metadata = {}) {
    const interDef = INTERACTION_TYPES[interactionType];
    if (!interDef) return { tracked: false, reason: `Unknown interaction: ${interactionType}` };

    if (!this._interactions.has(userId)) {
      this._interactions.set(userId, new Map());
    }
    const userMap = this._interactions.get(userId);

    if (!userMap.has(widgetId)) {
      userMap.set(widgetId, {
        views: 0, clicks: 0, submits: 0, dismissals: 0,
        total_score: 0, interaction_count: 0,
        first_interaction: Date.now(), last_interaction: 0,
        widget_type: metadata.widget_type || 'unknown',
        brand: metadata.brand || 'BOTMANTRA'
      });
    }

    const entry = userMap.get(widgetId);
    entry.interaction_count++;
    entry.total_score += interDef.weight;
    entry.last_interaction = Date.now();

    // Track specific counters
    if (interactionType === 'view') entry.views++;
    if (interactionType === 'click') entry.clicks++;
    if (interactionType === 'submit') entry.submits++;
    if (interactionType === 'dismiss') entry.dismissals++;

    return {
      tracked: true,
      widget: widgetId,
      interaction: interactionType,
      weight: interDef.weight,
      cumulative_score: entry.total_score,
      total_interactions: entry.interaction_count
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ANALYZE — Compute usage heatmap for a user
  // ═══════════════════════════════════════════════════════════
  analyzeUsage(userId) {
    const userMap = this._interactions.get(userId);
    if (!userMap || userMap.size === 0) {
      return { analyzed: false, reason: 'No interaction data', heatmap: [] };
    }

    const totalScore = Array.from(userMap.values())
      .reduce((sum, e) => sum + Math.max(0, e.total_score), 0);

    if (totalScore === 0) {
      return { analyzed: false, reason: 'No positive interactions', heatmap: [] };
    }

    const heatmap = [];
    for (const [widgetId, entry] of userMap) {
      const share = Math.max(0, entry.total_score) / totalScore;
      const daysSinceLast = (Date.now() - entry.last_interaction) / (1000 * 60 * 60 * 24);

      // Apply decay for staleness
      const decayFactor = daysSinceLast > EVOLUTION_CONFIG.widget_decay_days
        ? Math.max(0.1, 1 - (daysSinceLast - EVOLUTION_CONFIG.widget_decay_days) * 0.05)
        : 1;

      heatmap.push({
        widget_id: widgetId,
        widget_type: entry.widget_type,
        brand: entry.brand,
        raw_score: entry.total_score,
        interaction_count: entry.interaction_count,
        share: Math.round(share * 1000) / 10, // percentage with 1 decimal
        decayed_share: Math.round(share * decayFactor * 1000) / 10,
        views: entry.views,
        clicks: entry.clicks,
        submits: entry.submits,
        dismissals: entry.dismissals,
        classification: share >= EVOLUTION_CONFIG.hotspot_threshold ? 'HOTSPOT'
          : share <= EVOLUTION_CONFIG.underuse_threshold ? 'UNDERUSED'
          : 'NORMAL',
        days_since_interaction: Math.round(daysSinceLast * 10) / 10
      });
    }

    // Sort by decayed_share descending
    heatmap.sort((a, b) => b.decayed_share - a.decayed_share);

    return {
      analyzed: true,
      user_id: userId,
      total_widgets: heatmap.length,
      total_interactions: Array.from(userMap.values()).reduce((s, e) => s + e.interaction_count, 0),
      hotspots: heatmap.filter(h => h.classification === 'HOTSPOT').length,
      underused: heatmap.filter(h => h.classification === 'UNDERUSED').length,
      heatmap,
      analyzed_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PROPOSE — Generate evolution mutations from analysis
  // ═══════════════════════════════════════════════════════════
  propose(userId, currentLayout = null) {
    const analysis = this.analyzeUsage(userId);
    if (!analysis.analyzed) return { proposals: [], reason: analysis.reason };

    // Cooldown check
    const state = this._evolutionState.get(userId);
    if (state?.lastEvolution) {
      const elapsed = Date.now() - state.lastEvolution;
      if (elapsed < EVOLUTION_CONFIG.evolution_cooldown_ms) {
        return {
          proposals: [],
          reason: 'Cooldown active',
          retry_after_ms: EVOLUTION_CONFIG.evolution_cooldown_ms - elapsed
        };
      }
    }

    if (analysis.total_interactions < EVOLUTION_CONFIG.min_interactions_for_analysis) {
      return {
        proposals: [],
        reason: `Need ${EVOLUTION_CONFIG.min_interactions_for_analysis} interactions, have ${analysis.total_interactions}`
      };
    }

    const proposals = [];
    const heatmap = analysis.heatmap;

    // Rule 1: Promote hotspots — move to higher priority zone
    for (const h of heatmap.filter(x => x.classification === 'HOTSPOT')) {
      proposals.push({
        id: `prop_${Date.now()}_${proposals.length}`,
        type: 'PROMOTE',
        widget_id: h.widget_id,
        widget_type: h.widget_type,
        reason: `High usage (${h.share}% of interactions)`,
        confidence: Math.min(0.95, 0.5 + h.share / 100),
        suggested_zone: 'PRIMARY',
        suggested_size: this._suggestSize(h.widget_type, 'promote')
      });
    }

    // Rule 2: Demote/remove underused
    for (const h of heatmap.filter(x => x.classification === 'UNDERUSED')) {
      if (h.dismissals > h.clicks) {
        // More dismissals than clicks → remove
        proposals.push({
          id: `prop_${Date.now()}_${proposals.length}`,
          type: 'REMOVE',
          widget_id: h.widget_id,
          widget_type: h.widget_type,
          reason: `Dismissed more than clicked (${h.dismissals}d vs ${h.clicks}c)`,
          confidence: Math.min(0.9, 0.4 + h.dismissals * 0.1)
        });
      } else {
        proposals.push({
          id: `prop_${Date.now()}_${proposals.length}`,
          type: 'DEMOTE',
          widget_id: h.widget_id,
          widget_type: h.widget_type,
          reason: `Low usage (${h.share}% of interactions)`,
          confidence: Math.min(0.8, 0.3 + (1 - h.share / 100) * 0.5),
          suggested_zone: 'FOOTER',
          suggested_size: this._suggestSize(h.widget_type, 'demote')
        });
      }
    }

    // Rule 3: Suggest new widgets based on action patterns
    const userActions = this._getRecentActionTypes(userId);
    const missingWidgets = this._detectMissingWidgets(heatmap, userActions);
    for (const mw of missingWidgets.slice(0, 2)) {
      proposals.push({
        id: `prop_${Date.now()}_${proposals.length}`,
        type: 'ADD',
        widget_type: mw.widget_type,
        reason: mw.reason,
        confidence: mw.confidence,
        suggested_zone: 'MIDDLE',
        suggested_size: this._suggestSize(mw.widget_type, 'normal')
      });
    }

    // Rule 4: Swap detection — if two adjacent widgets have inverted usage
    if (heatmap.length >= 2) {
      const top = heatmap[0];
      const bottom = heatmap[heatmap.length - 1];
      if (top.share > 25 && bottom.share < 3 && bottom.interaction_count > 5) {
        proposals.push({
          id: `prop_${Date.now()}_${proposals.length}`,
          type: 'SWAP',
          widget_a: top.widget_id,
          widget_b: bottom.widget_id,
          reason: `Swap most-used (${top.widget_type}) with least-used (${bottom.widget_type})`,
          confidence: 0.6
        });
      }
    }

    // Limit proposals
    const limited = proposals
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, EVOLUTION_CONFIG.max_proposals_per_cycle);

    return {
      proposals: limited,
      total_proposed: limited.length,
      analysis_summary: {
        total_widgets: analysis.total_widgets,
        total_interactions: analysis.total_interactions,
        hotspots: analysis.hotspots,
        underused: analysis.underused
      },
      auto_deployable: limited.filter(p => p.confidence >= EVOLUTION_CONFIG.auto_deploy_threshold),
      proposed_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // MUTATE — Apply an evolution proposal to the layout
  // ═══════════════════════════════════════════════════════════
  async mutate(userId, proposalId, brand = 'BOTMANTRA', force = false) {
    const state = this._evolutionState.get(userId);
    if (!state) return { mutated: false, reason: 'No proposals found — call propose() first' };

    const proposal = state.proposals?.find(p => p.id === proposalId);
    if (!proposal) return { mutated: false, reason: `Proposal ${proposalId} not found` };

    // Confidence gate (unless forced by admin)
    if (!force && proposal.confidence < 0.5) {
      return { mutated: false, reason: 'Confidence too low', confidence: proposal.confidence };
    }

    // Load current layout
    const { data: currentLayout } = await this.db
      .from('dashboard_layouts')
      .select('*')
      .eq('business_id', userId)
      .limit(1)
      .single();

    let gridJson = currentLayout?.grid_json || { widgets: [], columns: 12 };
    if (typeof gridJson === 'string') gridJson = JSON.parse(gridJson);

    // Apply mutation
    const mutation = this._applyMutation(gridJson, proposal);

    // Save new version
    const newVersion = (state.version || 0) + 1;

    if (currentLayout) {
      // Update existing
      await this.db
        .from('dashboard_layouts')
        .update({
          grid_json: mutation.grid,
          created_at: new Date().toISOString()
        })
        .eq('id', currentLayout.id);
    } else {
      // Create new
      await this.db
        .from('dashboard_layouts')
        .insert({
          business_id: userId,
          layout_name: `evolved_v${newVersion}`,
          grid_json: mutation.grid,
          is_default: true,
          created_at: new Date().toISOString()
        });
    }

    // Update evolution state
    if (!this._evolutionState.has(userId)) {
      this._evolutionState.set(userId, {});
    }
    const evolState = this._evolutionState.get(userId);
    evolState.lastEvolution = Date.now();
    evolState.version = newVersion;
    evolState.lastMutation = {
      proposal_id: proposalId,
      type: proposal.type,
      applied_at: new Date().toISOString()
    };

    // Log to event queue
    try {
      await this.db.from('node_event_queue').insert({
        nid_hash: userId,
        event_type: 'layout_evolution',
        payload: { proposal, version: newVersion, brand },
        status: 'processed',
        processed: true,
        created_at: new Date().toISOString()
      });
    } catch { /* non-critical */ }

    return {
      mutated: true,
      version: newVersion,
      mutation_type: proposal.type,
      confidence: proposal.confidence,
      grid: mutation.grid,
      changes: mutation.changes
    };
  }

  // ═══════════════════════════════════════════════════════════
  // AUTO-EVOLVE — Full cycle: analyze → propose → auto-deploy
  // ═══════════════════════════════════════════════════════════
  async autoEvolve(userId, brand = 'BOTMANTRA') {
    const result = this.propose(userId);
    if (result.proposals.length === 0) {
      return { evolved: false, reason: result.reason || 'No proposals generated' };
    }

    // Store proposals in state
    if (!this._evolutionState.has(userId)) {
      this._evolutionState.set(userId, {});
    }
    this._evolutionState.get(userId).proposals = result.proposals;

    // Auto-deploy high-confidence proposals
    const autoDeployable = result.auto_deployable || [];
    const applied = [];

    for (const proposal of autoDeployable) {
      const mutResult = await this.mutate(userId, proposal.id, brand, false);
      if (mutResult.mutated) {
        applied.push({
          proposal_id: proposal.id,
          type: proposal.type,
          confidence: proposal.confidence
        });
      }
    }

    return {
      evolved: applied.length > 0,
      proposals_generated: result.total_proposed,
      auto_deployed: applied.length,
      applied,
      pending_approval: result.proposals.filter(
        p => !autoDeployable.find(a => a.id === p.id)
      ).length,
      analysis: result.analysis_summary
    };
  }

  // ═══════════════════════════════════════════════════════════
  // BRAND EVOLUTION — Aggregate all users of a brand
  // ═══════════════════════════════════════════════════════════
  analyzeBrandUsage(brand) {
    const brandHeatmap = {};

    for (const [userId, userMap] of this._interactions) {
      for (const [widgetId, entry] of userMap) {
        if (entry.brand !== brand) continue;
        const type = entry.widget_type;
        if (!brandHeatmap[type]) {
          brandHeatmap[type] = {
            widget_type: type,
            total_score: 0, total_interactions: 0,
            users: 0, views: 0, clicks: 0, submits: 0, dismissals: 0
          };
        }
        brandHeatmap[type].total_score += entry.total_score;
        brandHeatmap[type].total_interactions += entry.interaction_count;
        brandHeatmap[type].users++;
        brandHeatmap[type].views += entry.views;
        brandHeatmap[type].clicks += entry.clicks;
        brandHeatmap[type].submits += entry.submits;
        brandHeatmap[type].dismissals += entry.dismissals;
      }
    }

    const widgets = Object.values(brandHeatmap)
      .sort((a, b) => b.total_score - a.total_score);

    const totalScore = widgets.reduce((s, w) => s + Math.max(0, w.total_score), 0);

    return {
      brand,
      widgets: widgets.map(w => ({
        ...w,
        share: totalScore > 0 ? Math.round(Math.max(0, w.total_score) / totalScore * 1000) / 10 : 0,
        avg_score_per_user: w.users > 0 ? Math.round(w.total_score / w.users * 10) / 10 : 0
      })),
      total_widget_types: widgets.length,
      total_users_tracked: new Set(
        Array.from(this._interactions.entries())
          .filter(([, m]) => Array.from(m.values()).some(e => e.brand === brand))
          .map(([uid]) => uid)
      ).size,
      analyzed_at: new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GET EVOLUTION HISTORY for a user
  // ═══════════════════════════════════════════════════════════
  getEvolutionState(userId) {
    const state = this._evolutionState.get(userId);
    if (!state) return { exists: false };
    return {
      exists: true,
      version: state.version || 0,
      last_evolution: state.lastEvolution ? new Date(state.lastEvolution).toISOString() : null,
      last_mutation: state.lastMutation || null,
      pending_proposals: state.proposals?.length || 0
    };
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════

  _suggestSize(widgetType, mode) {
    const base = WIDGET_TYPES[widgetType]?.defaultSize || { w: 4, h: 3 };
    switch (mode) {
      case 'promote':  return { w: Math.min(12, base.w + 2), h: Math.min(8, base.h + 1) };
      case 'demote':   return { w: Math.max(2, base.w - 1), h: Math.max(2, base.h - 1) };
      default:         return base;
    }
  }

  _applyMutation(gridJson, proposal) {
    const grid = { ...gridJson, widgets: [...(gridJson.widgets || [])] };
    const changes = [];

    switch (proposal.type) {
      case 'PROMOTE': {
        const idx = grid.widgets.findIndex(w => w.id === proposal.widget_id || w.widget_type === proposal.widget_type);
        if (idx >= 0) {
          const zone = GRID_ZONES[proposal.suggested_zone] || GRID_ZONES.PRIMARY;
          grid.widgets[idx] = {
            ...grid.widgets[idx],
            x: zone.col, y: zone.row,
            w: proposal.suggested_size?.w || grid.widgets[idx].w,
            h: proposal.suggested_size?.h || grid.widgets[idx].h
          };
          changes.push(`Promoted ${proposal.widget_type} to ${proposal.suggested_zone}`);
        }
        break;
      }
      case 'DEMOTE': {
        const idx = grid.widgets.findIndex(w => w.id === proposal.widget_id || w.widget_type === proposal.widget_type);
        if (idx >= 0) {
          const zone = GRID_ZONES.FOOTER;
          grid.widgets[idx] = {
            ...grid.widgets[idx],
            x: zone.col, y: zone.row,
            w: proposal.suggested_size?.w || grid.widgets[idx].w,
            h: proposal.suggested_size?.h || grid.widgets[idx].h
          };
          changes.push(`Demoted ${proposal.widget_type} to footer`);
        }
        break;
      }
      case 'REMOVE': {
        const idx = grid.widgets.findIndex(w => w.id === proposal.widget_id || w.widget_type === proposal.widget_type);
        if (idx >= 0) {
          const removed = grid.widgets.splice(idx, 1)[0];
          changes.push(`Removed ${removed.widget_type || proposal.widget_type}`);
        }
        break;
      }
      case 'ADD': {
        const size = proposal.suggested_size || { w: 4, h: 3 };
        const zone = GRID_ZONES[proposal.suggested_zone] || GRID_ZONES.MIDDLE;
        grid.widgets.push({
          id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          widget_type: proposal.widget_type,
          x: zone.col, y: zone.row,
          w: size.w, h: size.h,
          config: {}
        });
        changes.push(`Added ${proposal.widget_type} in ${proposal.suggested_zone}`);
        break;
      }
      case 'SWAP': {
        const idxA = grid.widgets.findIndex(w => w.id === proposal.widget_a);
        const idxB = grid.widgets.findIndex(w => w.id === proposal.widget_b);
        if (idxA >= 0 && idxB >= 0) {
          const posA = { x: grid.widgets[idxA].x, y: grid.widgets[idxA].y };
          grid.widgets[idxA].x = grid.widgets[idxB].x;
          grid.widgets[idxA].y = grid.widgets[idxB].y;
          grid.widgets[idxB].x = posA.x;
          grid.widgets[idxB].y = posA.y;
          changes.push(`Swapped positions of widgets ${proposal.widget_a} and ${proposal.widget_b}`);
        }
        break;
      }
    }

    return { grid, changes };
  }

  _getRecentActionTypes(userId) {
    // Derive from tracked interactions
    const userMap = this._interactions.get(userId);
    if (!userMap) return [];
    return Array.from(userMap.values()).map(e => e.widget_type);
  }

  _detectMissingWidgets(heatmap, userActions) {
    const existing = new Set(heatmap.map(h => h.widget_type));
    const suggestions = [];

    // If user uses 'table' a lot but no 'chart' → suggest chart
    if (existing.has('table') && !existing.has('chart')) {
      suggestions.push({
        widget_type: 'chart',
        reason: 'Heavy table usage suggests data visualization would help',
        confidence: 0.7
      });
    }

    // If user uses 'chat' but no 'feed' → suggest feed
    if (existing.has('chat') && !existing.has('feed')) {
      suggestions.push({
        widget_type: 'feed',
        reason: 'Active chat user may benefit from activity feed',
        confidence: 0.6
      });
    }

    // If user uses 'kanban' but no 'calendar' → suggest calendar
    if (existing.has('kanban') && !existing.has('calendar')) {
      suggestions.push({
        widget_type: 'calendar',
        reason: 'Task management user may benefit from calendar view',
        confidence: 0.65
      });
    }

    // If 'stats' heavily used but no 'chart' → suggest chart
    if (existing.has('stats') && !existing.has('chart')) {
      suggestions.push({
        widget_type: 'chart',
        reason: 'Stats-heavy usage suggests deeper chart insights',
        confidence: 0.75
      });
    }

    return suggestions;
  }

  _cleanup() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    for (const [userId, userMap] of this._interactions) {
      for (const [widgetId, entry] of userMap) {
        if (entry.last_interaction < cutoff && entry.interaction_count < 3) {
          userMap.delete(widgetId);
        }
      }
      if (userMap.size === 0) this._interactions.delete(userId);
    }
  }

  destroy() {
    if (this._cleanupInterval) clearInterval(this._cleanupInterval);
    this._interactions.clear();
    this._evolutionState.clear();
  }
}

module.exports = {
  LayoutEvolution,
  EVOLUTION_CONFIG,
  INTERACTION_TYPES,
  MUTATION_TYPES,
  GRID_ZONES
};
