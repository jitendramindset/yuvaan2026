/**
 * 🧠 NODE CORE SYSTEM PROMPTS
 * Dynamic prompts based on:
 * - Node type/category
 * - Karma score
 * - Dharma alignment
 * - Living node state
 * - Historical logs
 */

const DEFAULT_PROMPTS = {
  'account': {
    base: 'You are an Account Manager assistant. Help users with account operations.',
    rules: [
      'Only access user\'s own account',
      'Enforce karma-based transaction limits',
      'Apply dharma principles to financial decisions',
      'Log all operations'
    ]
  },
  'transaction': {
    base: 'You are a Transaction Assistant. Handle financial transactions safely.',
    rules: [
      'Verify karma score before large transfers',
      'Check dharma compliance',
      'Validate recipient permissions',
      'Maintain transaction history'
    ]
  },
  'knowledge': {
    base: 'You are a Knowledge Manager. Share information ethically.',
    rules: [
      'Respect content permissions',
      'Apply karma multipliers to knowledge sharing',
      'Follow dharma principles',
      'Track learning outcomes'
    ]
  },
  'form': {
    base: 'You are a Form Assistant. Guide users through forms.',
    rules: [
      'Validate input based on rules',
      'Provide context-aware help',
      'Apply karma rewards for completion',
      'Save user progress'
    ]
  },
  'admin': {
    base: 'You are an Admin Assistant. Manage system operations.',
    rules: [
      'Require high karma (>80) for admin actions',
      'Log all admin operations',
      'Apply strict dharma verification',
      'Maintain audit trail'
    ]
  },
  'default': {
    base: 'You are a helpful assistant. Guide users through the system.',
    rules: [
      'Be respectful and helpful',
      'Follow security guidelines',
      'Respect user permissions',
      'Log interactions'
    ]
  }
};

/**
 * Generate dynamic system prompt based on node state
 */
async function generateSystemPrompt(nodeData, userKarma, userDharma, supabase) {
  try {
    // 1. Get base prompt from node type
    const nodeType = nodeData.type || 'default';
    const baseTemplate = DEFAULT_PROMPTS[nodeType] || DEFAULT_PROMPTS['default'];
    
    let prompt = baseTemplate.base;
    
    // 2. Apply karma-based modifications
    prompt = applyKarmaModifications(prompt, userKarma, nodeType);
    
    // 3. Apply dharma-based modifications
    prompt = applyDharmaModifications(prompt, userDharma, nodeType);
    
    // 4. Add rules
    prompt += '\n\nRULES:\n';
    prompt += baseTemplate.rules.map(r => `- ${r}`).join('\n');
    
    // 5. Add node-specific rules from node_policies table
    const policies = await getNodePolicies(nodeData.id, supabase);
    if (policies && policies.length > 0) {
      prompt += '\n\nNODE-SPECIFIC RULES:\n';
      prompt += policies.map(p => `- ${p.rule_text}`).join('\n');
    }
    
    // 6. Add karma/dharma state context
    prompt += `\n\nCURRENT USER STATE:\n`;
    prompt += `- Karma Score: ${userKarma}/100\n`;
    prompt += `- Dharma Alignment: ${userDharma}%\n`;
    prompt += `- Access Level: ${getAccessLevel(userKarma, userDharma)}\n`;
    
    // 7. Add historical context if available
    const recentHistory = await getRecentHistory(nodeData.id, supabase);
    if (recentHistory && recentHistory.length > 0) {
      prompt += `\n\nRECENT HISTORY:\n`;
      prompt += recentHistory.map(h => `- ${h.event_type}: ${h.description}`).join('\n');
    }
    
    return prompt;
    
  } catch (error) {
    console.error('System prompt generation error:', error);
    // Return safe default
    return DEFAULT_PROMPTS['default'].base;
  }
}

/**
 * Apply karma-based modifications to prompt
 */
function applyKarmaModifications(prompt, karma, nodeType) {
  if (karma < 20) {
    return prompt + '\n\n⚠️ WARNING: User has low karma. Apply strict verification for all actions.';
  } else if (karma > 80) {
    return prompt + '\n\n✅ User has high karma. Trust their actions and provide less friction.';
  } else if (karma > 50) {
    return prompt + '\n\n→ User has moderate karma. Apply standard verification procedures.';
  }
  
  return prompt;
}

/**
 * Apply dharma-based modifications to prompt
 */
function applyDharmaModifications(prompt, dharma, nodeType) {
  if (dharma < 40) {
    return prompt + '\n\n⚠️ WARNING: User dharma alignment is low. Focus on ethical guidance.';
  } else if (dharma > 80) {
    return prompt + '\n\n✅ User is highly aligned with dharma. Provide advanced features.';
  } else if (dharma > 60) {
    return prompt + '\n\n→ User is moderately aligned with dharma. Standard guidance applies.';
  }
  
  return prompt;
}

/**
 * Get access level based on karma and dharma
 */
function getAccessLevel(karma, dharma) {
  const score = (karma * 0.6) + (dharma * 0.4); // Weighted score
  
  if (score >= 80) return 'FULL_ACCESS';
  if (score >= 60) return 'STANDARD_ACCESS';
  if (score >= 40) return 'LIMITED_ACCESS';
  if (score >= 20) return 'RESTRICTED_ACCESS';
  return 'MINIMAL_ACCESS';
}

/**
 * Get node-specific policies from database
 */
async function getNodePolicies(nodeId, supabase) {
  try {
    const { data } = await supabase
      .from('node_policies')
      .select('rule_text, condition, enabled')
      .eq('node_id', nodeId)
      .eq('enabled', true);
    
    return data || [];
  } catch (error) {
    console.error('Error fetching node policies:', error);
    return [];
  }
}

/**
 * Get recent operation history
 */
async function getRecentHistory(nodeId, supabase) {
  try {
    const { data } = await supabase
      .from('node_logs')
      .select('event_type, description, created_at')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    return data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

/**
 * Update system prompt based on karma/dharma changes
 * (NOT direct DB update - rule-based only)
 */
async function updatePromptOnStateChange(nodeData, userKarma, userDharma, supabase) {
  // This function generates a NEW prompt based on updated state
  // The prompt is ephemeral - not stored in DB
  // Database only stores the base node data and rules
  // Prompt generation happens on every request based on:
  // 1. Node type
  // 2. Current user karma (from karma_logs)
  // 3. Current user dharma (from dharma_logs)
  // 4. Node policies (from node_policies)
  // 5. Recent logs (from node_logs)
  
  const newPrompt = await generateSystemPrompt(nodeData, userKarma, userDharma, supabase);
  
  return {
    nodeId: nodeData.id,
    timestamp: new Date(),
    prompt: newPrompt,
    reasoning: {
      nodeType: nodeData.type,
      userKarma: userKarma,
      userDharma: userDharma,
      accessLevel: getAccessLevel(userKarma, userDharma)
    }
  };
}

/**
 * Get effective system prompt for a node interaction
 * This is called for every chat message to ensure up-to-date prompt
 */
async function getEffectiveSystemPrompt(nodeId, userId, supabase) {
  try {
    // 1. Get node data
    const { data: nodeData } = await supabase
      .from('node_core')
      .select('*')
      .eq('id', nodeId)
      .single();
    
    if (!nodeData) return DEFAULT_PROMPTS['default'].base;
    
    // 2. Get current user karma from latest karma entry
    const { data: karmaData } = await supabase
      .from('karma_logs')
      .select('karma_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const userKarma = karmaData?.[0]?.karma_score || 50;
    
    // 3. Get current user dharma from latest dharma entry
    const { data: dharmaData } = await supabase
      .from('dharma_logs')
      .select('dharma_alignment')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const userDharma = dharmaData?.[0]?.dharma_alignment || 50;
    
    // 4. Generate prompt based on current state
    const prompt = await generateSystemPrompt(nodeData, userKarma, userDharma, supabase);
    
    return prompt;
    
  } catch (error) {
    console.error('Error getting effective prompt:', error);
    return DEFAULT_PROMPTS['default'].base;
  }
}

module.exports = {
  DEFAULT_PROMPTS,
  generateSystemPrompt,
  updatePromptOnStateChange,
  getEffectiveSystemPrompt,
  getAccessLevel,
  getNodePolicies,
  getRecentHistory
};
