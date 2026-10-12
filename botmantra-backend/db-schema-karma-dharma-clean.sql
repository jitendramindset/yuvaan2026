-- Karma/Dharma System Database Schema
-- PostgreSQL/Supabase Compatible

-- 1. KARMA LOGS TABLE - Stores user's karma score history
-- Karma: 0-100 score affecting behavior strictness and trust

CREATE TABLE IF NOT EXISTS karma_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Karma tracking
  karma_score INT NOT NULL DEFAULT 50 CHECK (karma_score >= 0 AND karma_score <= 100),
  previous_score INT DEFAULT 50,
  change_reason TEXT,
  change_amount INT DEFAULT 0,
  
  -- Activity context
  activity_type VARCHAR(50),
  activity_description TEXT,
  node_id UUID REFERENCES node_core(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_timestamp UNIQUE (user_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_karma_logs_user_id ON karma_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_logs_created_at ON karma_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_karma_logs_user_created ON karma_logs(user_id, created_at DESC);

-- 2. DHARMA LOGS TABLE - Stores user's dharma alignment history
-- Dharma: 0-100% ethical alignment and moral development

CREATE TABLE IF NOT EXISTS dharma_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dharma alignment (ethical development)
  dharma_alignment INT NOT NULL DEFAULT 50 CHECK (dharma_alignment >= 0 AND dharma_alignment <= 100),
  previous_alignment INT DEFAULT 50,
  change_reason TEXT,
  change_amount INT DEFAULT 0,
  
  -- Activity context
  activity_type VARCHAR(50),
  activity_description TEXT,
  node_id UUID REFERENCES node_core(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dharma_logs_user_id ON dharma_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dharma_logs_created_at ON dharma_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dharma_logs_user_created ON dharma_logs(user_id, created_at DESC);

-- 3. NODE POLICIES TABLE - Rules and policies that affect system prompt generation and access

CREATE TABLE IF NOT EXISTS node_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES node_core(id) ON DELETE CASCADE,
  
  policy_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  rule_text TEXT NOT NULL,
  
  -- Conditions for policy application
  condition TEXT,
  min_karma_required INT DEFAULT NULL,
  min_dharma_required INT DEFAULT NULL,
  
  -- Prompt modifications when policy applies
  prompt_modifier TEXT,
  prompt_prefix TEXT,
  prompt_suffix TEXT,
  
  -- Enforcement settings
  enabled BOOLEAN DEFAULT TRUE,
  enforcement_strict BOOLEAN DEFAULT FALSE,
  
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_node_policies_node_id ON node_policies(node_id);
CREATE INDEX IF NOT EXISTS idx_node_policies_enabled ON node_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_node_policies_rule_type ON node_policies(rule_type);

-- 4. NODE LOGS TABLE - Historical logs of all node operations for context and audit

CREATE TABLE IF NOT EXISTS node_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES node_core(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event tracking
  event_type VARCHAR(50) NOT NULL,
  event_action VARCHAR(100),
  description TEXT,
  query_text TEXT,
  action_payload JSONB,
  
  -- Result status
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Context at time of event
  karma_score_at_time INT,
  dharma_alignment_at_time INT,
  access_level_at_time VARCHAR(50),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_node_logs_node_id ON node_logs(node_id);
CREATE INDEX IF NOT EXISTS idx_node_logs_user_id ON node_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_node_logs_created_at ON node_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_node_logs_event_type ON node_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_node_logs_node_user_created ON node_logs(node_id, user_id, created_at DESC);

-- 5. CHAT HISTORY TABLE - Conversation logs for context and analysis

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  
  -- Message information
  message_type VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  message_language VARCHAR(10) DEFAULT 'en',
  
  -- Context
  node_id UUID REFERENCES node_core(id) ON DELETE SET NULL,
  intent_type VARCHAR(50),
  
  -- Response information
  response_text TEXT,
  response_language VARCHAR(10) DEFAULT 'en',
  system_prompt_used TEXT,
  access_level_at_time VARCHAR(50),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session ON chat_history(user_id, session_id, created_at DESC);

-- 6. NODE PROMPT TEMPLATES TABLE - Optional custom prompts per node

CREATE TABLE IF NOT EXISTS node_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES node_core(id) ON DELETE CASCADE,
  
  template_name VARCHAR(255) NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  
  -- Base prompt template
  base_prompt TEXT NOT NULL,
  
  -- Karma-based modifications
  karma_low_prompt TEXT,
  karma_moderate_prompt TEXT,
  karma_high_prompt TEXT,
  karma_excellent_prompt TEXT,
  
  -- Dharma-based modifications
  dharma_low_guidance TEXT,
  dharma_moderate_guidance TEXT,
  dharma_high_guidance TEXT,
  dharma_full_guidance TEXT,
  
  enabled BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_node_prompt_templates_node_id ON node_prompt_templates(node_id);
CREATE INDEX IF NOT EXISTS idx_node_prompt_templates_enabled ON node_prompt_templates(enabled);

-- Verification Queries (run after executing schema)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT COUNT(*) FROM karma_logs;
-- SELECT COUNT(*) FROM dharma_logs;
-- SELECT COUNT(*) FROM node_policies;
-- SELECT COUNT(*) FROM node_logs;
-- SELECT COUNT(*) FROM chat_history;
