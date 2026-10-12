/**
 * 🚀 KERNEL API ROUTES
 * REST endpoints for node runtime operations
 */

const express = require('express');
const KernelEngine = require('./kernel-engine');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const Redis = require('ioredis');

module.exports = function(app, supabaseClient, io) {
  const router = express.Router();
  const engine = new KernelEngine(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  const redisUrl = process.env.REDIS_URL;
  const redisClient = redisUrl ? new Redis(redisUrl, { maxRetriesPerRequest: 2 }) : null;
  const limiter = redisClient
    ? new RateLimiterRedis({
        storeClient: redisClient,
        points: 50,
        duration: 60,
        keyPrefix: 'kernel'
      })
    : new RateLimiterMemory({
        points: 50,
        duration: 60,
        keyPrefix: 'kernel'
      });

  const unsafePromptPatterns = [
    /ignore previous/i,
    /system prompt/i,
    /developer message/i,
    /jailbreak/i
  ];

  const isUnsafePrompt = (text = '') => unsafePromptPatterns.some((rx) => rx.test(text));

  const auditExecution = async ({
    userId,
    nidHash,
    action,
    success,
    ip,
    device
  }) => {
    try {
      if (!supabaseClient) return;
      await supabaseClient.from('node_execution_log').insert([
        {
          user_id: userId || null,
          nid_hash: nidHash || null,
          action,
          success,
          ip,
          device
        }
      ]);
    } catch (error) {
      console.error('[AUDIT] Failed to log execution:', error.message);
    }
  };

  const emitKernelUpdate = (nidHash, payload) => {
    if (!io) return;
    const room = nidHash || 'public';
    io.to(room).emit('kernel_update', payload);
  };

  /**
   * POST /api/kernel/execute
   * Main kernel execution endpoint - handles both Node OS and UI actions
   */
  router.post('/kernel/execute', async (req, res) => {
    try {
      const { action, payload, domain } = req.body;
      const nidHash = payload?.nid_hash || payload?.nidHash || null;
      const userId = payload?.user_id || payload?.userId || null;
      const device = payload?.device || {};
      const ip = req.ip;

      // Rate limiting
      const rateKey = nidHash || userId || ip;
      try {
        await limiter.consume(rateKey);
      } catch (rateError) {
        await auditExecution({ userId, nidHash, action, success: false, ip, device: device?.fingerprint || null });
        return res.status(429).json({
          success: false,
          error: 'Too Many Requests'
        });
      }

      // Device trust check (if userId provided)
      if (userId && device?.fingerprint) {
        const { data: trustedDevices, error } = await supabaseClient
          .from('trusted_devices')
          .select('id, is_blocked')
          .eq('user_id', userId)
          .eq('fingerprint', device.fingerprint)
          .limit(1);

        if (error) {
          console.error('[DEVICE TRUST] Lookup failed:', error.message);
        } else if (!trustedDevices || trustedDevices.length === 0) {
          await auditExecution({ userId, nidHash, action, success: false, ip, device: device?.fingerprint || null });
          return res.status(403).json({
            success: false,
            error: 'Untrusted device. OTP required.',
            code: 'DEVICE_UNTRUSTED'
          });
        } else if (trustedDevices[0]?.is_blocked) {
          await auditExecution({ userId, nidHash, action, success: false, ip, device: device?.fingerprint || null });
          return res.status(403).json({
            success: false,
            error: 'Device blocked',
            code: 'DEVICE_BLOCKED'
          });
        }
      }

      // AI safety gate for prompt content
      const promptText = payload?.message || payload?.prompt || '';
      if (typeof promptText === 'string') {
        if (promptText.length > 4000) {
          await auditExecution({ userId, nidHash, action, success: false, ip, device: device?.fingerprint || null });
          return res.status(400).json({ success: false, error: 'Prompt too long' });
        }
        if (isUnsafePrompt(promptText)) {
          await auditExecution({ userId, nidHash, action, success: false, ip, device: device?.fingerprint || null });
          return res.status(400).json({ success: false, error: 'Unsafe prompt detected' });
        }
      }

      // Handle UI-specific actions
      if (action === 'ui_bootstrap') {
        const rawDomain = (req.headers['x-client-domain'] || '').toString().toLowerCase();
        const rawBrand = payload?.brand || payload?.tenant || payload?.company || '';
        const requestedBrand = String(rawBrand).toLowerCase();
        const brandKey = requestedBrand || rawDomain || 'botmantra';

        const brandMap = {
          botmantra: {
            name: 'BotMantra',
            primary: '#6B5BFF',
            secondary: '#FF6B9D',
            mission: 'Make AI usable by everyone — not just developers.',
            vision: 'Become the operating system for AI-powered companies.'
          },
          mantravat: {
            name: 'MantraVat',
            primary: '#0EA5E9',
            secondary: '#22D3EE',
            mission: 'Deliver operational clarity across enterprise systems.',
            vision: 'A unified command center for modern businesses.'
          },
          jeetmantra: {
            name: 'JeetMantra',
            primary: '#10B981',
            secondary: '#34D399',
            mission: 'Empower learners with actionable insights.',
            vision: 'Personalized education at global scale.'
          },
          juniormantra: {
            name: 'JuniorMantra',
            primary: '#F97316',
            secondary: '#FDBA74',
            mission: 'Make learning joyful and safe for kids.',
            vision: 'A playful platform for curiosity-driven growth.'
          }
        };

        const resolvedBrand = Object.entries(brandMap).find(([key]) => brandKey.includes(key));
        const brand = resolvedBrand?.[1] || brandMap.botmantra;

        const response = {
          success: true,
          response: {
            ui: {
              brand: brand.name,
              theme: {
                primary: brand.primary,
                secondary: brand.secondary
              },
              layout: 'grid',
              widgets: [
                {
                  id: 'welcome',
                  type: 'kpi',
                  title: `👋 Welcome to ${brand.name}`,
                  value: 'Multi-Brand UI Active',
                  trend: 100,
                  color: brand.primary
                },
                {
                  id: 'mission',
                  type: 'kpi',
                  title: 'Mission',
                  value: brand.mission,
                  trend: 1,
                  color: brand.secondary
                },
                {
                  id: 'vision',
                  type: 'kpi',
                  title: 'Vision',
                  value: brand.vision,
                  trend: 1,
                  color: brand.primary
                },
                {
                  id: 'system_status',
                  type: 'kpi',
                  title: 'System Status',
                  value: 'Online',
                  trend: 5,
                  color: '#28a745'
                },
                {
                  id: 'quick_links',
                  type: 'actions',
                  title: 'Quick Links',
                  actions: [
                    { label: 'Platform Intro', value: '/intro', description: 'Mission & vision overview' },
                    { label: 'API Tester', value: '/api-tester', description: 'Test endpoints' }
                  ]
                },
                {
                  id: 'quick_actions',
                  type: 'form',
                  title: 'Quick Actions',
                  submitLabel: 'Run Action',
                  fields: [
                    {
                      id: 'action',
                      label: 'Select Action',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Open Dashboard', value: 'dashboard' },
                        { label: 'Open API Tester', value: 'api-tester' }
                      ]
                    },
                    {
                      id: 'notes',
                      label: 'Notes',
                      type: 'textarea',
                      placeholder: 'Add optional notes...'
                    }
                  ]
                },
                {
                  id: 'recent_activity',
                  type: 'table',
                  title: 'Recent Activity',
                  columns: [
                    { id: 'action', label: 'Action' },
                    { id: 'status', label: 'Status' },
                    { id: 'time', label: 'Time' }
                  ],
                  data: [
                    { action: 'UI Bootstrap', status: 'Success', time: 'Just now' },
                    { action: 'Brand Loaded', status: 'Success', time: '1m ago' },
                    { action: 'Theme Applied', status: 'Ready', time: '2m ago' }
                  ]
                }
              ],
              floating_chat: true,
              permissions: {
                'dashboard.view': true,
                'chat.send': true
              }
            }
          }
        };
        emitKernelUpdate(nidHash, { type: 'ui_refresh', payload: response.response.ui });
        await auditExecution({ userId, nidHash, action, success: true, ip, device: device?.fingerprint || null });
        return res.json(response);
      }

      if (action === 'post_login_bootstrap') {
        const response = {
          success: true,
          response: {
            text: 'Post-login bootstrap completed',
            data: {
              initialized: true,
              trust_score: 0,
              role: 'user'
            }
          }
        };
        return res.json(response);
      }

      // Handle form submissions (demo)
      if (action === 'form_submit') {
        const selected = payload?.data?.action;
        let navigate = null;
        if (selected === 'dashboard') navigate = '/dashboard';
        if (selected === 'login') navigate = '/login';
        if (selected === 'api-tester') navigate = '/api-tester';
        if (selected === 'onboarding') navigate = '/onboarding';

        const response = {
          success: true,
          response: {
            text: navigate ? `Navigating to ${navigate}...` : 'Form submitted successfully.',
            navigate
          }
        };
        if (navigate) {
          emitKernelUpdate(nidHash, { type: 'notification', payload: { message: response.response.text } });
        }
        await auditExecution({ userId, nidHash, action, success: true, ip, device: device?.fingerprint || null });
        return res.json(response);
      }

      // Handle chat actions
      if (action === 'chat') {
        const response = {
          success: true,
          response: {
            text: `Echo: ${payload?.message || 'No message'}`,
            ui: {
              // Optionally return UI updates
            }
          }
        };
        emitKernelUpdate(nidHash, { type: 'notification', payload: { message: response.response.text } });
        await auditExecution({ userId, nidHash, action, success: true, ip, device: device?.fingerprint || null });
        return res.json(response);
      }

      // For Node OS actions, use the kernel engine
      const result = await engine.nodeRuntimeExecute(req.body);
      await auditExecution({ userId, nidHash, action, success: !!result?.success, ip, device: device?.fingerprint || null });
      emitKernelUpdate(nidHash, { type: 'kernel_update', payload: result?.response?.ui || null });
      res.json(result);
    } catch (error) {
      const { action, payload } = req.body || {};
      const nidHash = payload?.nid_hash || payload?.nidHash || null;
      const userId = payload?.user_id || payload?.userId || null;
      const device = payload?.device || {};
      const ip = req.ip;
      await auditExecution({ userId, nidHash, action, success: false, ip, device: device?.fingerprint || null });
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/kernel/validate
   * Validate node action without executing
   */
  router.post('/kernel/validate', async (req, res) => {
    try {
      const { nidHash, targetOwnerId, actionType, requesterUuid } = req.body;
      const result = await engine.validateNodeAction(
        nidHash,
        targetOwnerId,
        actionType,
        requesterUuid
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/evaluate-dharma
   * Evaluate dharma for an action
   */
  router.post('/kernel/evaluate-dharma', async (req, res) => {
    try {
      const { nidHash, actionType, principle } = req.body;
      const result = await engine.evaluateDharma(nidHash, actionType, principle);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/apply-karma
   * Apply karma delta to node
   */
  router.post('/kernel/apply-karma', async (req, res) => {
    try {
      const { nidHash, actorOwnerId, actionType, karmaDelta, trustDelta, reason } = req.body;
      const result = await engine.applyKarma(
        nidHash,
        actorOwnerId,
        actionType,
        karmaDelta,
        trustDelta,
        reason
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/event-ingest
   * Queue an event for processing
   */
  router.post('/kernel/event-ingest', async (req, res) => {
    try {
      const { nidHash, eventType, payload, prevHash } = req.body;
      const result = await engine.nodeEventIngest(nidHash, eventType, payload, prevHash);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/session/:sessionId
   * Get session details - supports UUID or string hash
   */
  router.get('/kernel/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Try as session_id (string) first
      const query1 = await supabaseClient
        .from('node_runtime_session')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (!query1.error) {
        return res.json(query1.data);
      }

      // If not found and looks like UUID, try as id
      if (sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const query2 = await supabaseClient
          .from('node_runtime_session')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (!query2.error) {
          return res.json(query2.data);
        }
      }

      res.json({ message: 'Session not found', sessionId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/execution/:executionId
   * Get execution log - supports UUID or string hash
   */
  router.get('/kernel/execution/:executionId', async (req, res) => {
    try {
      const { executionId } = req.params;
      
      // Try as exec_id (UUID)
      const query1 = await supabaseClient
        .from('node_execution_log')
        .select('*')
        .eq('exec_id', executionId)
        .single();
      
      if (!query1.error) {
        return res.json(query1.data);
      }

      // Try as nid_hash
      const query2 = await supabaseClient
        .from('node_execution_log')
        .select('*')
        .eq('nid_hash', executionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!query2.error && query2.data && query2.data.length > 0) {
        return res.json(query2.data[0]);
      }

      res.json({ message: 'No execution log found', executionId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/kernel/calculate-reputation
   * Calculate reputation score for a node
   */
  router.post('/kernel/calculate-reputation', async (req, res) => {
    try {
      const { nidHash } = req.body;
      const result = await engine.calculateReputation(nidHash);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/reputation/:nidHash
   * Get node reputation and karma
   */
  router.get('/kernel/reputation/:nidHash', async (req, res) => {
    try {
      const { data, error } = await supabaseClient
        .from('node_trust_state')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/permissions/:nidHash
   * Get effective permissions for a node
   */
  router.get('/kernel/permissions/:nidHash', async (req, res) => {
    try {
      const { targetOwnerId } = req.query;
      const { data, error } = await supabaseClient
        .from('node_permission_effective')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .eq('target_owner_id', targetOwnerId);

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/events/:nidHash
   * Get event history for a node
   */
  router.get('/kernel/events/:nidHash', async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const { data, error } = await supabaseClient
        .from('node_event_queue')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/failures/:nidHash
   * Get failure log for a node
   */
  router.get('/kernel/failures/:nidHash', async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const { data, error } = await supabaseClient
        .from('node_failure_log')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/dharma-logs/:nidHash
   * Get dharma evaluation logs
   */
  router.get('/kernel/dharma-logs/:nidHash', async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const { data, error } = await supabaseClient
        .from('node_dharma_log')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/kernel/karma-logs/:nidHash
   * Get karma change history
   */
  router.get('/kernel/karma-logs/:nidHash', async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const { data, error } = await supabaseClient
        .from('node_karma_log')
        .select('*')
        .eq('nid_hash', req.params.nidHash)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api', router);
};
