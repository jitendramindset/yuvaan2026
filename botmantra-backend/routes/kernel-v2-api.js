/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KERNEL API ROUTES — Neural OS Unified Kernel               ║
 * ║  Single entry point for ALL governed actions                ║
 * ║  Mount: /api/kernel/v2                                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Replaces:
 *   /api/kernel/*  (routes-kernel.js — kept for backward compat)
 *   /kernel/*      (routes/kernel-execute.js — kept for compat)
 *
 * This is the CANONICAL kernel API going forward.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
module.exports = function setupKernelV2Routes(app, supabaseClient, io) {
  const { KernelExecutor } = require('../core/kernel-executor');
  const kernel = new KernelExecutor(supabaseClient, io);

  // Store kernel on app for access by other routes
  app.set('kernel', kernel);

  // Setup enhanced Socket.io handlers
  kernel.getMultiDeviceSync().setupSocketHandlers();

  // ═══════════════════════════════════════════════════════════
  // MAIN EXECUTE — THE SINGLE ENTRY POINT
  // POST /api/kernel/v2/execute
  // ═══════════════════════════════════════════════════════════
  router.post('/execute', async (req, res) => {
    try {
      // Accept either `action` (frontend convention) or `action_type` (legacy/internal)
      const action_type = req.body.action_type || req.body.action;
      const payload = req.body.payload || {};
      const device_id = req.body.device_id;
          // ========================================================================
          // STEP 1: JWT VALIDATION
          // ========================================================================
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
              success: false,
              status: 'error',
              code: 'MISSING_AUTH_HEADER',
              message: 'Authorization header required'
            });
          }
      
          const token = authHeader.substring(7);
          let jwtPayload;
          try {
            jwtPayload = jwt.decode(token); // Trust Supabase to verify in middleware
            if (!jwtPayload || !(jwtPayload.sub || jwtPayload.userId || jwtPayload.id)) {
              throw new Error('Invalid JWT');
            }
          } catch (error) {
            return res.status(401).json({
              success: false,
              status: 'error',
              code: 'INVALID_JWT',
              message: 'Authentication failed'
            });
          }
          const userId = jwtPayload.sub || jwtPayload.userId || jwtPayload.id;
      // user_node_id comes from JWT middleware or body
      // const userId = req.user?.id || req.body.user_node_id || req.body.user_id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'User authentication required' }
        });
      }

      if (!action_type) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_ACTION', message: 'action or action_type is required' }
        });
      }

      const result = await kernel.execute({
        user_node_id: userId,
        action_type,
        payload,
        device_id,
        session_token: req.headers.authorization
      });

      const httpStatus = result.httpStatus || (result.success ? 200 : 400);
      delete result.httpStatus;

      res.status(httpStatus).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'KERNEL_CRASH', message: error.message }
      });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // PERMISSION ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/kernel/v2/permissions/:nidHash */
  router.get('/permissions/:nidHash', async (req, res) => {
    try {
      const { data } = await supabaseClient
        .from('node_permission')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .eq('is_revoked', false);

      res.json({ success: true, permissions: data || [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/kernel/v2/permissions/check */
  router.post('/permissions/check', async (req, res) => {
    try {
      const { user_id, action_type, payload } = req.body;

      const userNode = await kernel._loadUserNode(user_id);
      if (!userNode) return res.status(404).json({ error: 'User node not found' });

      const result = await kernel.getPermissionEngine().validatePermission(
        userNode, action_type, payload || {}
      );

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/kernel/v2/permissions/grant */
  router.post('/permissions/grant', async (req, res) => {
    try {
      const userId = req.user?.id || req.body.granter_id;
      const userNode = await kernel._loadUserNode(userId);
      if (!userNode) return res.status(404).json({ error: 'Granter node not found' });

      const result = await kernel.getPermissionEngine().grantPermission(
        userNode,
        req.body.target_nid_hash,
        req.body.target_user_id,
        req.body.permissions || {}
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // KARMA ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/kernel/v2/karma/:nidHash */
  router.get('/karma/:nidHash', async (req, res) => {
    try {
      const score = await kernel.getKarmaEngine().getKarmaScore(req.params.nidHash);
      if (!score) return res.status(404).json({ error: 'Node not found' });
      res.json({ success: true, ...score });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/kernel/v2/karma/:nidHash/history */
  router.get('/karma/:nidHash/history', async (req, res) => {
    try {
      const history = await kernel.getKarmaEngine().getKarmaHistory(
        req.params.nidHash, parseInt(req.query.limit) || 50
      );
      res.json({ success: true, history });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // DHARMA ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** POST /api/kernel/v2/dharma/validate */
  router.post('/dharma/validate', async (req, res) => {
    try {
      const userId = req.user?.id || req.body.user_id;
      const userNode = await kernel._loadUserNode(userId);
      if (!userNode) return res.status(404).json({ error: 'User node not found' });

      const result = await kernel.getDharmaValidator().validate(
        userNode, req.body.action_type, req.body.payload || {}
      );

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // PROMPT EVOLUTION ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/kernel/v2/prompt/brand-defaults — MUST be before /:nidHash */
  router.get('/prompt/brand-defaults', (req, res) => {
    const { BRAND_PROMPTS, BASE_SYSTEM_PROMPT } = require('../core/prompt-evolution');
    const defaults = {};
    for (const [brand, config] of Object.entries(BRAND_PROMPTS)) {
      defaults[brand] = {
        name: config.name,
        prompt_preview: config.base.substring(0, 200) + '...',
        modifiers: Object.keys(config.modifiers)
      };
    }
    res.json({ success: true, base_prompt_length: BASE_SYSTEM_PROMPT.length, brands: defaults });
  });

  /** GET /api/kernel/v2/prompt/:nidHash */
  router.get('/prompt/:nidHash', async (req, res) => {
    try {
      const { data } = await supabaseClient
        .from('node_core')
        .select('node_system_prompt, prompt_version, prompt_last_update, karma_score')
        .eq('nid_hash', req.params.nidHash)
        .single();

      if (!data) return res.status(404).json({ error: 'Node not found' });

      res.json({
        success: true,
        prompt: data.node_system_prompt,
        version: data.prompt_version,
        last_update: data.prompt_last_update,
        autonomy: kernel.getKarmaEngine().getAutonomyLevel(data.karma_score)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/kernel/v2/prompt/evolve */
  router.post('/prompt/evolve', async (req, res) => {
    try {
      const { nid_hash, brand_code } = req.body;

      const node = await kernel._loadNode(nid_hash);
      if (!node) return res.status(404).json({ error: 'Node not found' });

      const result = await kernel.getPromptEvolution().evolveNodePrompt(
        nid_hash,
        node.karma_score || 0,
        brand_code || node._dna?.brand_scope || 'BOTMANTRA'
      );

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** PUT /api/kernel/v2/prompt/admin-update */
  router.put('/prompt/admin-update', async (req, res) => {
    try {
      const adminId = req.user?.id || req.body.admin_id;
      const result = await kernel.getPromptEvolution().adminUpdatePrompt(
        req.body.nid_hash, req.body.prompt, adminId
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // DEVICE SYNC ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** POST /api/kernel/v2/devices/register */
  router.post('/devices/register', async (req, res) => {
    try {
      const userId = req.user?.id || req.body.user_id;
      const result = await kernel.getMultiDeviceSync().registerDevice(
        userId, req.body.device_id, req.body.device_info || {}
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/kernel/v2/devices/:userId */
  router.get('/devices/:userId', async (req, res) => {
    try {
      const devices = await kernel.getMultiDeviceSync().getUserDevices(req.params.userId);
      res.json({ success: true, devices });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** DELETE /api/kernel/v2/devices/revoke */
  router.delete('/devices/revoke', async (req, res) => {
    try {
      const userId = req.user?.id || req.body.user_id;
      const result = await kernel.getMultiDeviceSync().revokeDevice(
        userId, req.body.device_id
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // NODE SYNC ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** POST /api/kernel/v2/sync/trigger */
  router.post('/sync/trigger', async (req, res) => {
    try {
      const node = await kernel._loadNode(req.body.nid_hash);
      if (!node) return res.status(404).json({ error: 'Node not found' });

      const result = await kernel.getNodeSync().syncNearestNodes(
        node, req.body.changed_fields || {}, req.body.action_type || 'manual_sync'
      );

      res.json({ success: true, sync: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TRUST ENGINE ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/kernel/v2/trust/levels — all trust levels & capabilities (BEFORE :nidHash!) */
  router.get('/trust/levels', (req, res) => {
    const { TRUST_LEVELS, TRUST_EVENTS, TRUST_DECAY } = require('../core/trust-engine');
    res.json({ trust_levels: TRUST_LEVELS, trust_events: Object.keys(TRUST_EVENTS), decay_rules: TRUST_DECAY });
  });

  /** GET /api/kernel/v2/trust/:nidHash — full multi-factor trust computation */
  router.get('/trust/:nidHash', async (req, res) => {
    try {
      const result = await kernel.getTrustEngine().computeTrustScore(req.params.nidHash);
      if (!result) return res.status(404).json({ error: 'Node not found' });
      res.json({ success: true, trust: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/kernel/v2/trust/:nidHash/quick — cached trust (fast, no recompute) */
  router.get('/trust/:nidHash/quick', async (req, res) => {
    try {
      const result = await kernel.getTrustEngine().getQuickTrust(req.params.nidHash);
      if (!result) return res.status(404).json({ error: 'Node not found' });
      res.json({ success: true, trust: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/kernel/v2/trust/:nidHash/history — trust change timeline */
  router.get('/trust/:nidHash/history', async (req, res) => {
    try {
      const history = await kernel.getTrustEngine().getTrustHistory(req.params.nidHash);
      res.json({ success: true, history, count: history.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/kernel/v2/trust/event — apply a trust event */
  router.post('/trust/event', async (req, res) => {
    try {
      const { nid_hash, event_type, metadata } = req.body;
      if (!nid_hash || !event_type) {
        return res.status(400).json({ error: 'nid_hash and event_type required' });
      }
      const result = await kernel.getTrustEngine().applyTrustEvent(nid_hash, event_type, metadata);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/kernel/v2/trust/persist — full recompute + save to DB */
  router.post('/trust/persist', async (req, res) => {
    try {
      const { nid_hash } = req.body;
      if (!nid_hash) return res.status(400).json({ error: 'nid_hash required' });
      const result = await kernel.getTrustEngine().persistTrust(nid_hash);
      if (!result) return res.status(404).json({ error: 'Node not found' });
      res.json({ success: true, trust: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // RISK PREDICTOR ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  /** GET /api/kernel/v2/risk/schema — risk levels, signals, velocity rules (BEFORE :nidHash!) */
  router.get('/risk/schema', (req, res) => {
    const { RISK_LEVELS, SIGNAL_WEIGHTS, VELOCITY_RULES, ESCALATION_PATTERNS } = require('../core/risk-predictor');
    res.json({ risk_levels: RISK_LEVELS, signal_weights: SIGNAL_WEIGHTS, velocity_rules: VELOCITY_RULES, escalation_patterns: ESCALATION_PATTERNS.map(p => p.name) });
  });

  /** POST /api/kernel/v2/risk/assess — real-time risk assessment */
  router.post('/risk/assess', async (req, res) => {
    try {
      const { nid_hash, action, payload } = req.body;
      if (!nid_hash || !action) {
        return res.status(400).json({ error: 'nid_hash and action required' });
      }
      const result = await kernel.getRiskPredictor().assessRisk(nid_hash, action, payload);
      res.json({ success: true, risk: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** POST /api/kernel/v2/risk/scan-content — content risk analysis */
  router.post('/risk/scan-content', (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'text required' });
      const result = kernel.getRiskPredictor().scanContent(text);
      res.json({ success: true, scan: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/kernel/v2/risk/:nidHash/profile — full risk history profile */
  router.get('/risk/:nidHash/profile', async (req, res) => {
    try {
      const result = await kernel.getRiskPredictor().getRiskProfile(req.params.nidHash);
      res.json({ success: true, profile: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /** GET /api/kernel/v2/risk/:nidHash/predict — predict next risk from action sequence */
  router.get('/risk/:nidHash/predict', (req, res) => {
    try {
      const result = kernel.getRiskPredictor().predictNextRisk(req.params.nidHash);
      res.json({ success: true, prediction: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // INTROSPECTION / HEALTH
  // ═══════════════════════════════════════════════════════════

  /** GET /api/kernel/v2/health */
  router.get('/health', async (req, res) => {
    try {
      const { count: nodeCount } = await supabaseClient
        .from('node_core')
        .select('*', { count: 'exact', head: true });

      const { count: permCount } = await supabaseClient
        .from('node_permission')
        .select('*', { count: 'exact', head: true });

      res.json({
        kernel: 'operational',
        version: '2.2.0',
        timestamp: new Date().toISOString(),
        engines: {
          permission: 'active',
          karma: 'active',
          dharma: 'active',
          trust: 'active',
          risk_predictor: 'active',
          sync: 'active',
          prompt_evolution: 'active',
          vector: 'active',
          rate_limiter: 'active',
          multi_device: 'active',
          layout_evolution: 'active',
          node_graph: 'active',
          gossip_network: 'active'
        },
        stats: {
          nodes: nodeCount || 0,
          permissions: permCount || 0,
          rate_limiter_entries: kernel.rateLimiter.hits.size
        },
        socket_io: io ? 'connected' : 'not_available',
        pipeline_steps: 16
      });
    } catch (error) {
      res.status(500).json({ kernel: 'error', error: error.message });
    }
  });

  /** GET /api/kernel/v2/schema — permission codes, karma deltas, dharma rules */
  router.get('/schema', (req, res) => {
    const { PERMISSION_CODES, ROLE_HIERARCHY } = require('../core/permission-engine');
    const { KARMA_DELTAS, KARMA_LEVELS } = require('../core/karma-engine');
    const { DHARMA_RULES, BRAND_AGE_RULES } = require('../core/dharma-validator');
    const { TRUST_LEVELS: TL } = require('../core/trust-engine');
    const { RISK_LEVELS: RL } = require('../core/risk-predictor');

    res.json({
      permission_codes: PERMISSION_CODES,
      role_hierarchy: ROLE_HIERARCHY,
      karma_deltas: KARMA_DELTAS,
      karma_levels: KARMA_LEVELS,
      dharma_rules: Object.keys(DHARMA_RULES),
      brand_age_rules: BRAND_AGE_RULES,
      trust_levels: TL,
      risk_levels: RL
    });
  });

  // Mount
  app.use('/api/kernel/v2', router);
  console.log('⚡ Kernel V2.2 mounted at /api/kernel/v2');
  console.log('   13 engines: perm + karma + dharma + trust + risk + sync + prompt + vector + rate + mds + layout_evo + graph + gossip');
  console.log('   Pipeline: 16 steps | B) Layout Evolution | C) Node Graph | D) Gossip Network');
};
