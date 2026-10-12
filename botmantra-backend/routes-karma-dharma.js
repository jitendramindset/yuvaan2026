/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KARMA/DHARMA LOGGING ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 * Handles all karma/dharma logging and evaluation
 * 
 * Endpoints:
 * - POST /api/karma-dharma/log-batch - Log multiple actions
 * - GET  /api/karma-dharma/scores/:userId - Get current scores
 * - POST /api/karma-dharma/evaluate - Evaluate action impact
 * - GET  /api/karma-dharma/history/:userId - Get action history
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

/**
 * ═════════════════════════════════════════════════════════════════════════
 * POST /api/karma-dharma/log-batch
 * Log multiple actions in batch
 * ═════════════════════════════════════════════════════════════════════════
 */
router.post('/log-batch', async (req, res) => {
  const { supabase } = req;
  const { logs, userId, sessionId } = req.body;

  if (!logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: 'logs array required' });
  }

  try {
    // Insert all logs into node_logs table
    const formattedLogs = logs.map(log => ({
      node_id: log.nodeId || null,
      user_id: userId,
      event_type: log.category || 'general',
      event_action: log.action,
      description: JSON.stringify(log.metadata || {}),
      success: log.granted !== false,
      metadata: {
        session_id: sessionId,
        original_log: log,
        logged_at: new Date().toISOString()
      }
    }));

    const { data, error } = await supabase
      .from('node_logs')
      .insert(formattedLogs)
      .select();

    if (error) throw error;

    // Evaluate karma/dharma impact
    const evaluation = await evaluateLogsForKarmaDharma(logs, userId, supabase);

    res.json({
      success: true,
      logsInserted: data?.length || 0,
      evaluation
    });

  } catch (error) {
    console.error('Error logging batch:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════════════
 * GET /api/karma-dharma/scores/:userId
 * Get current karma/dharma scores
 * ═════════════════════════════════════════════════════════════════════════
 */
router.get('/scores/:userId', async (req, res) => {
  const { supabase } = req;
  const { userId } = req.params;

  try {
    // Get latest karma score
    const { data: karmaData } = await supabase
      .from('karma_logs')
      .select('karma_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get latest dharma score
    const { data: dharmaData } = await supabase
      .from('dharma_logs')
      .select('dharma_alignment, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const karma = karmaData?.karma_score || 50;
    const dharma = dharmaData?.dharma_alignment || 50;

    // Calculate access level
    const weightedScore = (karma * 0.6) + (dharma * 0.4);
    let accessLevel = 'MINIMAL_ACCESS';
    
    if (weightedScore >= 80) accessLevel = 'FULL_ACCESS';
    else if (weightedScore >= 60) accessLevel = 'STANDARD_ACCESS';
    else if (weightedScore >= 40) accessLevel = 'LIMITED_ACCESS';
    else if (weightedScore >= 20) accessLevel = 'RESTRICTED_ACCESS';

    res.json({
      karma,
      dharma,
      weightedScore,
      accessLevel,
      lastUpdated: {
        karma: karmaData?.created_at,
        dharma: dharmaData?.created_at
      }
    });

  } catch (error) {
    console.error('Error getting scores:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════════════
 * POST /api/karma-dharma/evaluate
 * Evaluate action for karma/dharma impact
 * ═════════════════════════════════════════════════════════════════════════
 */
router.post('/evaluate', async (req, res) => {
  const { supabase } = req;
  const { userId, action } = req.body;

  try {
    // Get current scores
    const { data: karmaData } = await supabase
      .from('karma_logs')
      .select('karma_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentKarma = karmaData?.karma_score || 50;

    // Evaluate action
    const impact = evaluateActionImpact(action);

    // Calculate new karma
    const newKarma = Math.max(0, Math.min(100, currentKarma + impact.karmaDelta));

    // Insert karma log
    const { error: karmaError } = await supabase
      .from('karma_logs')
      .insert({
        user_id: userId,
        karma_score: newKarma,
        previous_score: currentKarma,
        change_reason: impact.reason,
        change_amount: impact.karmaDelta,
        activity_type: action.category || 'general',
        activity_description: JSON.stringify(action)
      });

    if (karmaError) throw karmaError;

    res.json({
      success: true,
      oldKarma: currentKarma,
      newKarma,
      karmaDelta: impact.karmaDelta,
      reason: impact.reason,
      impact
    });

  } catch (error) {
    console.error('Error evaluating action:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════════════
 * GET /api/karma-dharma/history/:userId
 * Get action history
 * ═════════════════════════════════════════════════════════════════════════
 */
router.get('/history/:userId', async (req, res) => {
  const { supabase } = req;
  const { userId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const { data, error, count } = await supabase
      .from('node_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      history: data || [],
      total: count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═════════════════════════════════════════════════════════════════════════
 */

/**
 * Evaluate logs for karma/dharma impact
 */
async function evaluateLogsForKarmaDharma(logs, userId, supabase) {
  let totalKarmaDelta = 0;
  let totalDharmaDelta = 0;
  const evaluations = [];

  for (const log of logs) {
    const impact = evaluateActionImpact(log);
    totalKarmaDelta += impact.karmaDelta;
    totalDharmaDelta += impact.dharmaDelta;
    evaluations.push(impact);
  }

  // Update karma if significant change
  if (Math.abs(totalKarmaDelta) >= 1) {
    const { data: karmaData } = await supabase
      .from('karma_logs')
      .select('karma_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentKarma = karmaData?.karma_score || 50;
    const newKarma = Math.max(0, Math.min(100, currentKarma + totalKarmaDelta));

    await supabase.from('karma_logs').insert({
      user_id: userId,
      karma_score: newKarma,
      previous_score: currentKarma,
      change_reason: `Batch evaluation: ${logs.length} actions`,
      change_amount: totalKarmaDelta,
      activity_type: 'batch_evaluation'
    });
  }

  // Update dharma if significant change
  if (Math.abs(totalDharmaDelta) >= 1) {
    const { data: dharmaData } = await supabase
      .from('dharma_logs')
      .select('dharma_alignment')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentDharma = dharmaData?.dharma_alignment || 50;
    const newDharma = Math.max(0, Math.min(100, currentDharma + totalDharmaDelta));

    await supabase.from('dharma_logs').insert({
      user_id: userId,
      dharma_alignment: newDharma,
      previous_alignment: currentDharma,
      change_reason: `Batch evaluation: ${logs.length} actions`,
      change_amount: totalDharmaDelta,
      activity_type: 'batch_evaluation'
    });
  }

  return {
    totalKarmaDelta,
    totalDharmaDelta,
    evaluations
  };
}

/**
 * Evaluate single action impact
 */
function evaluateActionImpact(action) {
  let karmaDelta = 0;
  let dharmaDelta = 0;
  let reason = '';

  const category = action.category || '';
  const actionType = action.action || '';
  const granted = action.granted !== false;

  // Device access
  if (category === 'device_access') {
    if (granted) {
      karmaDelta = -1; // Slightly negative for privacy concerns
      dharmaDelta = 0;
      reason = `Device access granted: ${actionType}`;
    } else {
      dharmaDelta = +1; // Positive for respecting privacy
      reason = `Device access denied: ${actionType}`;
    }
  }

  // Communication
  else if (category === 'communication') {
    karmaDelta = +1; // Positive for engagement
    dharmaDelta = +1; // Positive for communication
    reason = `Communication action: ${actionType}`;
  }

  // Node navigation
  else if (category === 'node_navigation') {
    karmaDelta = +0.5; // Small positive for exploration
    reason = `Node navigation: ${actionType}`;
  }

  // Permissions
  else if (category === 'permissions') {
    if (granted) {
      karmaDelta = -0.5; // Slight negative for permission grants
      dharmaDelta = +1; // Positive for appropriate permission use
      reason = `Permission granted: ${action.permission}`;
    } else {
      dharmaDelta = +2; // Strong positive for denying unnecessary permissions
      reason = `Permission denied: ${action.permission}`;
    }
  }

  // Filesystem
  else if (category === 'filesystem') {
    if (actionType === 'read') {
      karmaDelta = +0.5;
    } else if (actionType === 'write' || actionType === 'upload') {
      karmaDelta = +1;
    } else if (actionType === 'delete') {
      karmaDelta = -1;
      dharmaDelta = -1;
    }
    reason = `Filesystem ${actionType}`;
  }

  return {
    karmaDelta,
    dharmaDelta,
    reason,
    category,
    action: actionType
  };
}

module.exports = router;
