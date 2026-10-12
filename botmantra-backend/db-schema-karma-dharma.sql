-- ═══════════════════════════════════════════════════════════════════════════════
-- DATABASE SCHEMA FOR KARMA/DHARMA SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════
-- This schema implements the dynamic system prompt generation based on:
-- 1. Node type and category
-- 2. User's karma score (0-100)
-- 3. User's dharma alignment (0-100%)
-- 4. Node policies and rules
-- 5. Historical logs and context
--
-- NO direct core_node updates - only rule-based ephemeral prompt generation
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. KARMA LOGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores user's karma score history
-- Karma: 0-100 score affecting behavior strictness and trust
-- 0-20: Low karma (strict verification, minimal trust)
-- 20-50: Moderate karma (standard verification)
-- 50-80: High karma (elevated trust, more features)
-- 80-100: Excellent karma (full trust, all features)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS karma_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Karma score and tracking
  karma_score INT NOT NULL DEFAULT 50 CHECK (karma_score >= 0 AND karma_score <= 100),
  previous_score INT DEFAULT 50,
  
  -- Reason for change
  change_reason TEXT,
  change_amount INT DEFAULT 0,
  
  -- Activity context
  activity_type VARCHAR(50), -- 'node_action', 'transaction', 'verification', 'policy_violation', 'positive_action'
  activity_description TEXT,
  node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT unique_user_timestamp UNIQUE (user_id, created_at)
);

CREATE INDEX idx_karma_logs_user_id ON karma_logs(user_id);
CREATE INDEX idx_karma_logs_created_at ON karma_logs(created_at DESC);
CREATE INDEX idx_karma_logs_user_created ON karma_logs(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. DHARMA LOGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores user's dharma alignment history
-- Dharma: 0-100% ethical alignment and moral development
-- 0-40: Low dharma (needs ethical guidance, limited advanced features)
-- 40-60: Moderate dharma (standard ethical guidance)
-- 60-80: High dharma (moderately aligned, more advanced features)
-- 80-100: Full dharma (fully aligned, all advanced features)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dharma_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dharma alignment (ethical development)
  dharma_alignment INT NOT NULL DEFAULT 50 CHECK (dharma_alignment >= 0 AND dharma_alignment <= 100),
  previous_alignment INT DEFAULT 50,
  
  -- Alignment reason
  change_reason TEXT,
  change_amount INT DEFAULT 0,
  
  -- Activity context
  activity_type VARCHAR(50), -- 'ethical_action', 'guideline_violation', 'learning', 'practice'
  activity_description TEXT,
  node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dharma_logs_user_id ON dharma_logs(user_id);
CREATE INDEX idx_dharma_logs_created_at ON dharma_logs(created_at DESC);
CREATE INDEX idx_dharma_logs_user_created ON dharma_logs(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. NODE POLICIES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores rules and policies that affect system prompt generation and access
-- Policies modify system prompt based on conditions and node rules
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Node reference
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  
  -- Policy details
  policy_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'REQUIRE_FULL_ACCESS', 'VERIFY_IDENTITY', 'LOG_ACTIVITY', 'RESTRICT_TIME', 'DENY'
  rule_text TEXT NOT NULL,
  
  -- Conditions
  condition TEXT, -- JSON condition: {"field": "karma_score", "operator": "<", "value": 30}
  min_karma_required INT DEFAULT NULL,
  min_dharma_required INT DEFAULT NULL,
  
  -- Prompt modifications
  prompt_modifier TEXT, -- Text to add to system prompt when this policy applies
  prompt_prefix TEXT, -- Prefix to add to system prompt
  prompt_suffix TEXT, -- Suffix to add to system prompt
  
  -- Enforcement
  enabled BOOLEAN DEFAULT TRUE,
  enforcement_strict BOOLEAN DEFAULT FALSE, -- If true, completely block access; if false, modify prompt only
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_node_policies_node_id ON node_policies(node_id);
CREATE INDEX idx_node_policies_enabled ON node_policies(enabled);
CREATE INDEX idx_node_policies_rule_type ON node_policies(rule_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. NODE LOGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores historical logs of all node operations for context and audit
-- Used to include recent activity in system prompt generation
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Node and user reference
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event tracking
  event_type VARCHAR(50) NOT NULL, -- 'query', 'action', 'navigation', 'access_denied', 'policy_triggered', 'error'
  event_action VARCHAR(100), -- Specific action: 'read', 'write', 'execute', 'navigate'
  
  -- Event details
  description TEXT,
  query_text TEXT, -- If event_type is 'query', store the query
  action_payload JSONB, -- JSON payload of the action
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Context
  karma_score_at_time INT,
  dharma_alignment_at_time INT,
  access_level_at_time VARCHAR(50), -- FULL_ACCESS, STANDARD_ACCESS, LIMITED_ACCESS, RESTRICTED_ACCESS, MINIMAL_ACCESS
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_node_logs_node_id ON node_logs(node_id);
CREATE INDEX idx_node_logs_user_id ON node_logs(user_id);
CREATE INDEX idx_node_logs_created_at ON node_logs(created_at DESC);
CREATE INDEX idx_node_logs_event_type ON node_logs(event_type);
CREATE INDEX idx_node_logs_node_user_created ON node_logs(node_id, user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. CHAT HISTORY TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Stores conversation history for context and analysis
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Chat session
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  
  -- Message
  message_type VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  message_text TEXT NOT NULL,
  message_language VARCHAR(10) DEFAULT 'en',
  
  -- Context
  node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  intent_type VARCHAR(50), -- 'navigate', 'query', 'action', 'auth', 'general'
  
  -- Response
  response_text TEXT,
  response_language VARCHAR(10) DEFAULT 'en',
  
  -- System prompt used (for debugging)
  system_prompt_used TEXT,
  access_level_at_time VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX idx_chat_history_user_session ON chat_history(user_id, session_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. PROMPT TEMPLATES TABLE (Optional - for custom prompts per node)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Node reference
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  
  -- Template details
  template_name VARCHAR(255) NOT NULL,
  node_type VARCHAR(50) NOT NULL, -- 'account', 'transaction', 'knowledge', 'form', 'admin', 'default'
  
  -- Base prompt template
  base_prompt TEXT NOT NULL,
  
  -- Karma-based modifications
  karma_low_prompt TEXT, -- Applied when karma < 20
  karma_moderate_prompt TEXT, -- Applied when 20 <= karma < 50
  karma_high_prompt TEXT, -- Applied when 50 <= karma < 80
  karma_excellent_prompt TEXT, -- Applied when karma >= 80
  
  -- Dharma-based modifications
  dharma_low_guidance TEXT, -- Applied when dharma < 40
  dharma_moderate_guidance TEXT, -- Applied when 40 <= dharma < 60
  dharma_high_guidance TEXT, -- Applied when 60 <= dharma < 80
  dharma_full_guidance TEXT, -- Applied when dharma >= 80
  
  -- Metadata
  enabled BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_node_prompt_templates_node_id ON node_prompt_templates(node_id);
CREATE INDEX idx_node_prompt_templates_enabled ON node_prompt_templates(enabled);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SAMPLE DATA INSERTS (for testing)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sample karma log
-- INSERT INTO karma_logs (user_id, karma_score, change_reason, activity_type)
-- VALUES ('user-uuid-here', 65, 'Positive actions', 'positive_action');

-- Sample dharma log
-- INSERT INTO dharma_logs (user_id, dharma_alignment, change_reason, activity_type)
-- VALUES ('user-uuid-here', 72, 'Ethical practice', 'practice');

-- Sample node policy
-- INSERT INTO node_policies (node_id, policy_name, rule_type, rule_text, min_karma_required, enabled)
-- VALUES (
--   'node-uuid-here',
--   'High Karma Requirement',
--   'REQUIRE_FULL_ACCESS',
--   'User must have excellent karma (80+) to access admin operations',
--   80,
--   TRUE
-- );

-- ═══════════════════════════════════════════════════════════════════════════════
-- USEFUL QUERIES FOR TESTING
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get current karma for a user
-- SELECT karma_score FROM karma_logs WHERE user_id = 'user-uuid' ORDER BY created_at DESC LIMIT 1;

-- Get current dharma for a user
-- SELECT dharma_alignment FROM dharma_logs WHERE user_id = 'user-uuid' ORDER BY created_at DESC LIMIT 1;

-- Get node policies
-- SELECT * FROM node_policies WHERE node_id = 'node-uuid' AND enabled = TRUE;

-- Get recent node logs
-- SELECT * FROM node_logs WHERE node_id = 'node-uuid' ORDER BY created_at DESC LIMIT 5;

-- Get chat history for session
-- SELECT * FROM chat_history WHERE session_id = 'session-uuid' ORDER BY created_at ASC;
