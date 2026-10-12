/**
 * 🔥 PRODUCTION KERNEL ENGINE
 * Core business logic for node runtime execution
 * Implements: Validation → Dharma → Karma → Events → Execution
 */

const { createClient } = require('@supabase/supabase-js');

class KernelEngine {
  constructor(supabaseUrl, serviceRoleKey) {
    this.client = createClient(supabaseUrl, serviceRoleKey);
    this.logger = console; // Replace with proper logger
  }

  /**
   * 1️⃣ VALIDATE NODE ACTION
   * Checks: Active status, permissions, lifespan, trust threshold
   */
  async validateNodeAction(nidHash, targetOwnerId, actionType, requesterUuid) {
    try {
      // Fetch node_core record
      const { data: nodeCore, error: nodeError } = await this.client
        .from('node_core')
        .select('*')
        .eq('nid_hash', nidHash)
        .single();

      if (nodeError || !nodeCore) {
        return { valid: false, reason: 'Node not found' };
      }

      // Check 1: Node is not archived
      if (nodeCore.is_archived) {
        return { valid: false, reason: 'Node is archived' };
      }

      // Check 2: Node has valid_until timestamp
      if (nodeCore.valid_until && new Date(nodeCore.valid_until) < new Date()) {
        return { valid: false, reason: 'Node expired' };
      }

      // Check 3: Node is activated
      if (!nodeCore.is_activated) {
        return { valid: false, reason: 'Node not activated' };
      }

      // Check 4: Node state is not cold (unless wakeup_at passed)
      if (nodeCore.is_cold && nodeCore.wakeup_at && new Date(nodeCore.wakeup_at) > new Date()) {
        return { valid: false, reason: 'Node is in cold state, waiting for wakeup' };
      }

      // Check 5: Check effective permissions
      const { data: perms, error: permError } = await this.client
        .from('node_permission_effective')
        .select('*')
        .eq('nid_hash', nidHash)
        .eq('target_owner_id', targetOwnerId)
        .single();

      if (permError && permError.code !== 'PGRST116') { // PGRST116 = not found
        return { valid: false, reason: 'Permission check failed' };
      }

      // Check permission based on action type
      let hasPermission = false;
      if (actionType === 'read' && perms?.can_read) hasPermission = true;
      if (actionType === 'write' && perms?.can_write) hasPermission = true;
      if (actionType === 'delete' && perms?.can_delete) hasPermission = true;
      if (actionType === 'execute' && nodeCore.can_execute) hasPermission = true;

      if (!hasPermission) {
        return { valid: false, reason: 'Permission denied' };
      }

      // Check 6: Trust threshold
      if (nodeCore.trust_score < 0) {
        return { valid: false, reason: 'Insufficient trust score' };
      }

      return {
        valid: true,
        nodeCore,
        permissions: perms || {}
      };

    } catch (error) {
      this.logger.error('validateNodeAction error:', error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * 2️⃣ EVALUATE DHARMA
   * Checks ethical rules and calculates karma/trust impact
   */
  async evaluateDharma(nidHash, actionType, principle) {
    try {
      // Get dharma profile for this node
      const { data: profile, error: profileError } = await this.client
        .from('node_dharma_profile')
        .select('*')
        .eq('nid_hash', nidHash)
        .order('priority_weight', { ascending: false })
        .limit(10);

      if (profileError) {
        return { karma_impact: 0, trust_impact: 0, reason: 'No dharma profile' };
      }

      // Get applicable dharma rules
      const ruleIds = profile.map(p => p.rule_id);
      if (ruleIds.length === 0) {
        return { karma_impact: 0, trust_impact: 0, reason: 'No dharma rules' };
      }

      const { data: rules, error: rulesError } = await this.client
        .from('dharma_rules')
        .select('*')
        .in('rule_id', ruleIds)
        .filter('principle', 'like', `%${principle}%`)
        .single();

      if (rulesError) {
        return { karma_impact: 0, trust_impact: 0, reason: 'No matching rules' };
      }

      // Log the evaluation
      const { data: logEntry, error: logError } = await this.client
        .from('node_dharma_log')
        .insert({
          nid_hash: nidHash,
          action_type: actionType,
          matched_principle: principle,
          karma_applied: rules.karma_impact,
          trust_applied: rules.trust_impact,
          verdict: 'approved', // Can be 'approved', 'warned', 'blocked'
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return {
        karma_impact: rules.karma_impact,
        trust_impact: rules.trust_impact,
        verdict: 'approved',
        dharmaLogId: logEntry?.id
      };

    } catch (error) {
      this.logger.error('evaluateDharma error:', error);
      return { karma_impact: 0, trust_impact: 0, reason: error.message };
    }
  }

  /**
   * 3️⃣ APPLY KARMA
   * Updates karma_score, trust_score, and records in logs
   */
  async applyKarma(nidHash, actorOwnerId, actionType, karmaDelta, trustDelta, reason) {
    try {
      // Get current karma/trust state
      const { data: current, error: currentError } = await this.client
        .from('node_trust_state')
        .select('*')
        .eq('nid_hash', nidHash)
        .single();

      const currentKarma = current?.karma_score || 0;
      const currentTrust = current?.trust_score || 0;
      const newKarma = Math.max(0, currentKarma + karmaDelta); // Don't go below 0
      const newTrust = Math.max(0, Math.min(10000, currentTrust + trustDelta)); // 0-10000 range

      // Record in karma log
      const { error: logError } = await this.client
        .from('node_karma_log')
        .insert({
          nid_hash: nidHash,
          actor_owner_id: actorOwnerId,
          action_type: actionType,
          karma_delta: karmaDelta,
          trust_delta: trustDelta,
          reason: reason,
          created_at: new Date().toISOString()
        });

      if (logError) throw logError;

      // Update node_trust_state
      const { data: updated, error: updateError } = await this.client
        .from('node_trust_state')
        .upsert({
          nid_hash: nidHash,
          karma_score: newKarma,
          trust_score: newTrust,
          last_update: new Date().toISOString()
        })
        .select()
        .single();

      if (updateError) throw updateError;

      // Update reputation level based on scores
      const reputationLevel = this.calculateReputation(newKarma, newTrust);

      return {
        success: true,
        newKarma,
        newTrust,
        reputationLevel,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('applyKarma error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate reputation level based on karma and trust
   */
  calculateReputation(karma, trust) {
    if (trust < 1000) return 'untrusted';
    if (trust < 3000) return 'novice';
    if (trust < 5000) return 'trusted';
    if (trust < 7000) return 'expert';
    if (trust < 9000) return 'master';
    return 'guardian';
  }

  /**
   * 4️⃣ NODE EVENT INGEST
   * Adds event to queue for async processing
   */
  async nodeEventIngest(nidHash, eventType, payload, prevHash = null) {
    try {
      // Generate event hash
      const crypto = require('crypto');
      const eventHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ nidHash, eventType, payload, timestamp: Date.now() }))
        .digest('hex');

      // Optionally encrypt payload
      const payloadEnc = null; // Implement encryption if needed

      // Insert into event queue
      const { data: event, error: eventError } = await this.client
        .from('node_event_queue')
        .insert({
          nid_hash: nidHash,
          event_type: eventType,
          payload: payload,
          payload_enc: payloadEnc,
          prev_hash: prevHash,
          event_hash: eventHash,
          processed: false,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (eventError) throw eventError;

      return {
        success: true,
        eventId: event.event_id,
        eventHash,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('nodeEventIngest error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 5️⃣ NODE RUNTIME EXECUTE (CORE KERNEL)
   * Main execution flow combining all steps
   */
  async nodeRuntimeExecute(params) {
    const {
      nidHash,
      requesterUuid,
      targetOwnerId,
      actionType,
      principle = 'default',
      payload = {},
      actionName = 'system_action'
    } = params;

    const executionId = require('crypto').randomBytes(16).toString('hex');

    try {
      this.logger.log(`[KERNEL] Starting execution: ${executionId}`);

      // Step 1: VALIDATE
      const validation = await this.validateNodeAction(
        nidHash,
        targetOwnerId,
        actionType,
        requesterUuid
      );

      if (!validation.valid) {
        // Log failure
        await this.client
          .from('node_failure_log')
          .insert({
            nid_hash: nidHash,
            error_msg: `Validation failed: ${validation.reason}`,
            occurred_at: new Date().toISOString()
          });

        return { success: false, reason: validation.reason, executionId };
      }

      this.logger.log(`[KERNEL] ✅ Validation passed`);

      // Step 2: EVALUATE DHARMA
      const dharma = await this.evaluateDharma(nidHash, actionType, principle);
      this.logger.log(`[KERNEL] 💎 Dharma evaluated: karma=${dharma.karma_impact}, trust=${dharma.trust_impact}`);

      // Step 3: APPLY KARMA
      const karma = await this.applyKarma(
        nidHash,
        targetOwnerId,
        actionType,
        dharma.karma_impact,
        dharma.trust_impact,
        `Action: ${actionType} - Principle: ${principle}`
      );

      if (!karma.success) {
        throw new Error(`Failed to apply karma: ${karma.error}`);
      }

      this.logger.log(`[KERNEL] 🎯 Karma applied: karma=${karma.newKarma}, trust=${karma.newTrust}`);

      // Step 4: INGEST EVENT
      const event = await this.nodeEventIngest(nidHash, actionType, payload);

      if (!event.success) {
        throw new Error(`Failed to ingest event: ${event.error}`);
      }

      this.logger.log(`[KERNEL] 📤 Event queued: ${event.eventId}`);

      // Step 5: EXECUTE ACTION & LOG
      const { data: execLog, error: logError } = await this.client
        .from('node_execution_log')
        .insert({
          exec_id: executionId,
          nid_hash: nidHash,
          action_name: actionName,
          requester: requesterUuid,
          execution_type: actionType,
          status: 'success',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (logError) throw logError;

      // Step 6: UPDATE RUNTIME SESSION
      const { data: session, error: sessionError } = await this.client
        .from('node_runtime_session')
        .insert({
          session_id: executionId,
          nid_hash: nidHash,
          device_fingerprint: validation.nodeCore.device_fingerprint || 'unknown',
          ip_address: '0.0.0.0', // Should come from request
          trust_snapshot: karma.newTrust,
          karma_snapshot: karma.newKarma,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          active: true
        })
        .select()
        .single();

      this.logger.log(`[KERNEL] ✅ Execution complete: ${executionId}`);

      return {
        success: true,
        executionId,
        eventId: event.eventId,
        dharmaVerdict: dharma.verdict,
        newKarmaScore: karma.newKarma,
        newTrustScore: karma.newTrust,
        reputation: karma.reputationLevel,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`[KERNEL] ❌ Execution failed: ${executionId}`, error);

      // Log failure
      await this.client
        .from('node_failure_log')
        .insert({
          nid_hash: nidHash,
          error_msg: error.message,
          occurred_at: new Date().toISOString()
        })
        .catch(e => this.logger.error('Failed to log failure:', e));

      return {
        success: false,
        error: error.message,
        executionId
      };
    }
  }

  /**
   * HELPER: Update node_core reputation
   */
  async updateReputation(nidHash, reputationLevel, karma, trust) {
    try {
      const { error } = await this.client
        .from('node_core')
        .update({
          reputation_level: reputationLevel,
          karma_score: karma,
          trust_score: trust,
          updated_at: new Date().toISOString()
        })
        .eq('nid_hash', nidHash);

      return !error;
    } catch (e) {
      this.logger.error('updateReputation error:', e);
      return false;
    }
  }

  /**
   * 🔐 VALIDATE SESSION
   * Used by interaction classifier for authentication
   * Returns node context for routing decisions
   */
  async validateSession(token) {
    try {
      // Validate session token against Supabase auth
      const { data: { user }, error } = await this.client.auth.getUser(token);
      
      if (error || !user) {
        return { valid: false, reason: 'Invalid session token' };
      }

      // Get node context from node_core
      const { data: nodeCore, error: nodeError } = await this.client
        .from('node_core')
        .select('nid_hash, trust_score, authority_level, is_activated')
        .eq('owner_id', user.id)
        .single();

      if (nodeError || !nodeCore) {
        return { valid: false, reason: 'Node not found for user' };
      }

      if (!nodeCore.is_activated) {
        return { valid: false, reason: 'Node not activated' };
      }

      return {
        valid: true,
        node_id: nodeCore.nid_hash,
        trust_score: nodeCore.trust_score || 0,
        authority_level: nodeCore.authority_level || 1,
        user_id: user.id
      };

    } catch (e) {
      this.logger.error('validateSession error:', e);
      return { valid: false, reason: e.message };
    }
  }
}

module.exports = KernelEngine;
