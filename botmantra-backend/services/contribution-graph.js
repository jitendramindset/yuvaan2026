// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTION GRAPH BUILDER - Node OS Economic Participation Mapper
// ═══════════════════════════════════════════════════════════════════════════════
// Purpose: Build economic participation graph for revenue distribution
// Creates weighted contribution map for each transaction

const { supabase } = require('../config/supabase');

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONTRIBUTION WEIGHTS (Node OS Standard v1)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_WEIGHTS = {
  owner: 0.30,        // Transaction owner/initiator
  serving: 0.30,      // Node serving the transaction
  relay: 0.15,        // Node relaying/routing
  device: 0.15,       // Device owner/operator
  cache: 0.10,        // Data cache provider
  ui_renderer: 0.05,  // UI rendering node
  data_source: 0.05,  // Data source provider
  validator: 0.03,    // Transaction validator
  aggregator: 0.02    // Data aggregator
};

// Weighting formula factors
const FORMULA_FACTORS = {
  time_weight: 0.30,      // Impact of time_spent on final weight
  role_weight: 0.30,      // Impact of node_role on final weight
  device_weight: 0.20,    // Impact of device_touch on final weight
  activity_weight: 0.20   // Impact of refresh_activity on final weight
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Build Contribution Graph
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build contribution graph for a transaction
 * 
 * @param {string} transactionId - Transaction UUID
 * @param {object} options - Optional configuration
 * @returns {object} - Graph build result with entries and metadata
 */
async function buildContributionGraph(transactionId, options = {}) {
  try {
    console.log(`[ContributionGraph] Building graph for transaction: ${transactionId}`);

    // Step 1: Fetch transaction details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    // Step 2: Check if graph already exists
    const { data: existingGraph } = await supabase
      .from('contribution_graph')
      .select('id')
      .eq('transaction_id', transactionId)
      .limit(1);

    if (existingGraph && existingGraph.length > 0) {
      console.log(`[ContributionGraph] Graph already exists for transaction ${transactionId}`);
      return {
        success: true,
        transaction_id: transactionId,
        entries: existingGraph.length,
        status: 'already_exists'
      };
    }

    // Step 3: Identify participating nodes
    const participants = await identifyParticipants(transaction, options);

    if (participants.length === 0) {
      console.warn(`[ContributionGraph] No participants identified for transaction ${transactionId}`);
      return {
        success: false,
        transaction_id: transactionId,
        error: 'No participants identified'
      };
    }

    // Step 4: Create contribution graph entries
    const graphEntries = [];

    for (const participant of participants) {
      const entry = {
        transaction_id: transactionId,
        node_id: participant.node_id,
        user_id: participant.user_id,
        contribution_type: participant.type,
        contribution_role: participant.role || 'secondary',
        base_weight: DEFAULT_WEIGHTS[participant.type] || 0.0,
        time_spent: participant.time_spent || 0,
        device_touch_count: participant.device_touches || 1,
        refresh_activity: participant.refresh_count || 0,
        node_role: participant.node_role || 'consumer',
        authority_level: participant.authority_level || 1,
        trust_score: participant.trust_score || 0.0,
        device_id: participant.device_id || null,
        device_type: participant.device_type || 'unknown',
        session_id: participant.session_id || null,
        metadata: participant.metadata || {}
      };

      // Calculate normalized weight using formula
      entry.normalized_weight = calculateNormalizedWeight(entry);
      entry.weight_formula = buildWeightFormula(entry);

      graphEntries.push(entry);
    }

    // Step 5: Normalize weights to sum to 1.0
    const totalWeight = graphEntries.reduce((sum, entry) => sum + entry.normalized_weight, 0);
    const normalizationFactor = totalWeight > 0 ? 1.0 / totalWeight : 1.0;

    graphEntries.forEach(entry => {
      entry.normalized_weight = parseFloat((entry.normalized_weight * normalizationFactor).toFixed(4));
    });

    // Step 6: Insert contribution graph entries
    const { data: insertedEntries, error: insertError } = await supabase
      .from('contribution_graph')
      .insert(graphEntries)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert contribution graph: ${insertError.message}`);
    }

    console.log(`[ContributionGraph] Created ${insertedEntries.length} graph entries for transaction ${transactionId}`);

    return {
      success: true,
      transaction_id: transactionId,
      entries: insertedEntries.length,
      total_weight: 1.0,
      normalization_factor: normalizationFactor,
      participants: insertedEntries
    };

  } catch (error) {
    console.error(`[ContributionGraph] Error building graph:`, error);
    return {
      success: false,
      transaction_id: transactionId,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Identify Participants
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Identify all nodes that participated in the transaction
 * 
 * @param {object} transaction - Transaction record
 * @param {object} options - Optional metadata (session, device, etc.)
 * @returns {array} - Array of participant objects
 */
async function identifyParticipants(transaction, options = {}) {
  const participants = [];

  // 1. OWNER (Transaction initiator)
  if (transaction.from_user_id) {
    const ownerNode = await fetchNodeForUser(transaction.from_user_id);
    if (ownerNode) {
      participants.push({
        node_id: ownerNode.id,
        user_id: transaction.from_user_id,
        type: 'owner',
        role: 'primary',
        time_spent: options.owner_time_spent || 30, // Default 30 seconds
        device_touches: options.owner_device_touches || 1,
        refresh_count: options.owner_refresh_count || 0,
        node_role: ownerNode.node_role || 'provider',
        authority_level: ownerNode.authority_level || 1,
        trust_score: ownerNode.trust_score || 0.0,
        device_id: options.device_id,
        device_type: options.device_type,
        session_id: options.session_id
      });
    }
  }

  // 2. SERVING NODE (Node processing the transaction)
  // This could be derived from metadata or node_logs
  if (options.serving_node_id) {
    const servingNode = await fetchNode(options.serving_node_id);
    if (servingNode) {
      participants.push({
        node_id: servingNode.id,
        user_id: servingNode.owner_id,
        type: 'serving',
        role: 'primary',
        time_spent: options.serving_time_spent || 15,
        device_touches: 1,
        refresh_count: 0,
        node_role: servingNode.node_role || 'provider',
        authority_level: servingNode.authority_level || 1,
        trust_score: servingNode.trust_score || 0.0
      });
    }
  }

  // 3. RELAY NODE (If transaction was routed)
  if (options.relay_node_id) {
    const relayNode = await fetchNode(options.relay_node_id);
    if (relayNode) {
      participants.push({
        node_id: relayNode.id,
        user_id: relayNode.owner_id,
        type: 'relay',
        role: 'secondary',
        time_spent: options.relay_time_spent || 5,
        device_touches: 1,
        refresh_count: 0,
        node_role: relayNode.node_role || 'relay',
        authority_level: relayNode.authority_level || 1,
        trust_score: relayNode.trust_score || 0.0
      });
    }
  }

  // 4. DEVICE OWNER (If different from transaction owner)
  if (options.device_owner_user_id && options.device_owner_user_id !== transaction.from_user_id) {
    const deviceNode = await fetchNodeForUser(options.device_owner_user_id);
    if (deviceNode) {
      participants.push({
        node_id: deviceNode.id,
        user_id: options.device_owner_user_id,
        type: 'device',
        role: 'tertiary',
        time_spent: options.device_time_spent || 10,
        device_touches: options.device_touch_count || 1,
        refresh_count: options.device_refresh_count || 0,
        node_role: deviceNode.node_role || 'consumer',
        authority_level: deviceNode.authority_level || 1,
        trust_score: deviceNode.trust_score || 0.0,
        device_id: options.device_id,
        device_type: options.device_type
      });
    }
  }

  // 5. CACHE PROVIDER (If data was cached)
  if (options.cache_node_id) {
    const cacheNode = await fetchNode(options.cache_node_id);
    if (cacheNode) {
      participants.push({
        node_id: cacheNode.id,
        user_id: cacheNode.owner_id,
        type: 'cache',
        role: 'tertiary',
        time_spent: 2,
        device_touches: 0,
        refresh_count: 0,
        node_role: cacheNode.node_role || 'provider',
        authority_level: cacheNode.authority_level || 1,
        trust_score: cacheNode.trust_score || 0.0
      });
    }
  }

  // 6. UI RENDERER (If UI was generated)
  if (options.ui_renderer_node_id) {
    const uiNode = await fetchNode(options.ui_renderer_node_id);
    if (uiNode) {
      participants.push({
        node_id: uiNode.id,
        user_id: uiNode.owner_id,
        type: 'ui_renderer',
        role: 'tertiary',
        time_spent: 3,
        device_touches: 0,
        refresh_count: 0,
        node_role: uiNode.node_role || 'provider',
        authority_level: uiNode.authority_level || 1,
        trust_score: uiNode.trust_score || 0.0
      });
    }
  }

  // 7. DATA SOURCE (If external data was fetched)
  if (options.data_source_node_id) {
    const dataNode = await fetchNode(options.data_source_node_id);
    if (dataNode) {
      participants.push({
        node_id: dataNode.id,
        user_id: dataNode.owner_id,
        type: 'data_source',
        role: 'tertiary',
        time_spent: 2,
        device_touches: 0,
        refresh_count: 0,
        node_role: dataNode.node_role || 'provider',
        authority_level: dataNode.authority_level || 1,
        trust_score: dataNode.trust_score || 0.0
      });
    }
  }

  return participants;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Calculate Normalized Weight
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate normalized weight using Node OS weighting formula
 * 
 * Formula:
 * weight = (time_spent * 0.3) + (role_weight * 0.3) + (device_touch * 0.2) + (refresh * 0.2)
 * 
 * @param {object} entry - Contribution graph entry
 * @returns {number} - Normalized weight (0.0 to 1.0)
 */
function calculateNormalizedWeight(entry) {
  // Normalize time_spent to 0-1 scale (max 60 seconds = 1.0)
  const timeScore = Math.min(entry.time_spent / 60, 1.0);

  // Role weight from base_weight
  const roleScore = entry.base_weight;

  // Device touch score (max 10 touches = 1.0)
  const deviceScore = Math.min(entry.device_touch_count / 10, 1.0);

  // Refresh activity score (max 5 refreshes = 1.0)
  const activityScore = Math.min(entry.refresh_activity / 5, 1.0);

  // Apply formula factors
  const weight = 
    (timeScore * FORMULA_FACTORS.time_weight) +
    (roleScore * FORMULA_FACTORS.role_weight) +
    (deviceScore * FORMULA_FACTORS.device_weight) +
    (activityScore * FORMULA_FACTORS.activity_weight);

  return parseFloat(weight.toFixed(4));
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Build Weight Formula String
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build human-readable formula string for audit trail
 * 
 * @param {object} entry - Contribution graph entry
 * @returns {string} - Formula string
 */
function buildWeightFormula(entry) {
  return `(time:${entry.time_spent}s * 0.3) + (role:${entry.base_weight} * 0.3) + ` +
         `(device:${entry.device_touch_count} * 0.2) + (activity:${entry.refresh_activity} * 0.2) = ${entry.normalized_weight}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Fetch Node Data
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch node by ID
 */
async function fetchNode(nodeId) {
  try {
    const { data, error } = await supabase
      .from('core_node')
      .select('id, owner_id, node_role, authority_level, trust_score')
      .eq('id', nodeId)
      .single();

    return error ? null : data;
  } catch (error) {
    console.error(`[ContributionGraph] Error fetching node ${nodeId}:`, error);
    return null;
  }
}

/**
 * Fetch node for user
 */
async function fetchNodeForUser(userId) {
  try {
    const { data, error } = await supabase
      .from('core_node')
      .select('id, owner_id, node_role, authority_level, trust_score')
      .eq('owner_id', userId)
      .limit(1)
      .single();

    return error ? null : data;
  } catch (error) {
    console.error(`[ContributionGraph] Error fetching node for user ${userId}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Get Contribution Graph
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch existing contribution graph for a transaction
 * 
 * @param {string} transactionId - Transaction UUID
 * @returns {object} - Graph entries and metadata
 */
async function getContributionGraph(transactionId) {
  try {
    const { data, error } = await supabase
      .from('contribution_graph')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('normalized_weight', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contribution graph: ${error.message}`);
    }

    const totalWeight = data.reduce((sum, entry) => sum + parseFloat(entry.normalized_weight), 0);

    return {
      success: true,
      transaction_id: transactionId,
      entries: data.length,
      total_weight: parseFloat(totalWeight.toFixed(4)),
      participants: data
    };

  } catch (error) {
    console.error(`[ContributionGraph] Error fetching graph:`, error);
    return {
      success: false,
      transaction_id: transactionId,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  buildContributionGraph,
  getContributionGraph,
  DEFAULT_WEIGHTS,
  FORMULA_FACTORS
};
