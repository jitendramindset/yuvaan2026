-- ═══════════════════════════════════════════════════════════════════════════════
-- NODE OS CONTRIBUTION GRAPH - Database Schema Extensions
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose: Track economic participation and contribution weighting
-- Part of: Week 2 Part 2 - Revenue Sharing Engine

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CONTRIBUTION GRAPH TABLE - Economic Participation Map
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contribution_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction Reference
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Node Participation
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contribution Details
  contribution_type VARCHAR(50) NOT NULL, -- owner, serving, relay, device, cache, ui_renderer, data_source
  contribution_role VARCHAR(50), -- primary, secondary, tertiary
  
  -- Weighting Factors
  base_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.0000, -- Base contribution weight (0.0 to 1.0)
  time_spent INTEGER NOT NULL DEFAULT 0, -- Seconds spent on transaction
  device_touch_count INTEGER NOT NULL DEFAULT 1, -- Number of device interactions
  refresh_activity INTEGER NOT NULL DEFAULT 0, -- Number of refreshes/re-engagements
  
  -- Calculated Weight
  normalized_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.0000, -- Final calculated weight after normalization
  weight_formula TEXT, -- Store formula used for audit
  
  -- Node Role Context
  node_role VARCHAR(50), -- From node_core: provider, consumer, relay, aggregator
  authority_level INTEGER DEFAULT 1, -- From node_core
  trust_score DECIMAL(5, 2) DEFAULT 0.00, -- From node_core at time of transaction
  
  -- Device Context
  device_id VARCHAR(255), -- Device fingerprint
  device_type VARCHAR(50), -- mobile, desktop, tablet, iot
  session_id VARCHAR(255), -- Session identifier
  
  -- Revenue Share
  payout_percentage DECIMAL(5, 4), -- Percentage of pool allocated (after normalization)
  payout_amount DECIMAL(15, 2), -- Actual amount earned
  payout_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_contribution_type CHECK (
    contribution_type IN ('owner', 'serving', 'relay', 'device', 'cache', 'ui_renderer', 'data_source', 'validator', 'aggregator')
  ),
  CONSTRAINT valid_payout_status CHECK (
    payout_status IN ('pending', 'processing', 'completed', 'failed', 'reversed')
  ),
  CONSTRAINT weight_range CHECK (base_weight >= 0 AND base_weight <= 1),
  CONSTRAINT normalized_weight_range CHECK (normalized_weight >= 0 AND normalized_weight <= 1)
);

CREATE INDEX idx_contribution_graph_transaction ON contribution_graph(transaction_id);
CREATE INDEX idx_contribution_graph_node ON contribution_graph(node_id);
CREATE INDEX idx_contribution_graph_user ON contribution_graph(user_id);
CREATE INDEX idx_contribution_graph_type ON contribution_graph(contribution_type);
CREATE INDEX idx_contribution_graph_status ON contribution_graph(payout_status);
CREATE INDEX idx_contribution_graph_created ON contribution_graph(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. REVENUE DISTRIBUTION LOG TABLE - Payout Execution Audit
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS revenue_distribution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction Reference
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Pool Information
  total_pool DECIMAL(15, 2) NOT NULL, -- Total fee pool to distribute
  distributable_amount DECIMAL(15, 2) NOT NULL, -- Amount after platform fees
  platform_fee DECIMAL(15, 2) DEFAULT 0.00, -- Platform cut (if any)
  
  -- Distribution Summary
  distributed_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- Amount actually distributed
  participant_count INTEGER NOT NULL DEFAULT 0, -- Number of nodes receiving payout
  
  -- Execution Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, partial
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Processing Details
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  processing_duration_ms INTEGER, -- Milliseconds to complete
  
  -- Contribution Graph Summary
  contribution_entries INTEGER, -- Number of contribution_graph records
  weight_normalization_factor DECIMAL(10, 6), -- Factor used to normalize weights to 1.0
  
  -- Karma Impact
  total_karma_awarded INTEGER DEFAULT 0, -- Total karma given to participants
  trust_boost_applied BOOLEAN DEFAULT false, -- Whether trust scores were updated
  
  -- Metadata
  distribution_algorithm VARCHAR(50) DEFAULT 'weighted', -- weighted, equal, tiered
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  executed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User/system who triggered
  executed_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_distribution_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'partial', 'reversed')
  ),
  CONSTRAINT distributed_not_exceeding_pool CHECK (distributed_amount <= total_pool)
);

CREATE INDEX idx_revenue_distribution_transaction ON revenue_distribution_log(transaction_id);
CREATE INDEX idx_revenue_distribution_status ON revenue_distribution_log(status);
CREATE INDEX idx_revenue_distribution_executed ON revenue_distribution_log(executed_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. NODE EARNINGS SUMMARY TABLE - Aggregated Earnings Per Node
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_earnings_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Node Reference
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Earnings Aggregation
  total_earned DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  
  -- Breakdown by Contribution Type
  earnings_as_owner DECIMAL(15, 2) DEFAULT 0.00,
  earnings_as_serving DECIMAL(15, 2) DEFAULT 0.00,
  earnings_as_relay DECIMAL(15, 2) DEFAULT 0.00,
  earnings_as_device DECIMAL(15, 2) DEFAULT 0.00,
  earnings_as_cache DECIMAL(15, 2) DEFAULT 0.00,
  
  -- Time Periods
  last_7_days DECIMAL(15, 2) DEFAULT 0.00,
  last_30_days DECIMAL(15, 2) DEFAULT 0.00,
  last_90_days DECIMAL(15, 2) DEFAULT 0.00,
  
  -- Karma Impact
  total_karma_earned INTEGER DEFAULT 0,
  average_contribution_weight DECIMAL(5, 4),
  
  -- Rankings
  rank_by_earnings INTEGER, -- Position in earnings leaderboard
  rank_by_transactions INTEGER, -- Position in transaction count
  
  -- Metadata
  last_payout_at TIMESTAMP,
  highest_single_payout DECIMAL(15, 2),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_node_earnings UNIQUE(node_id)
);

CREATE INDEX idx_node_earnings_node ON node_earnings_summary(node_id);
CREATE INDEX idx_node_earnings_user ON node_earnings_summary(user_id);
CREATE INDEX idx_node_earnings_total ON node_earnings_summary(total_earned DESC);
CREATE INDEX idx_node_earnings_updated ON node_earnings_summary(updated_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CONTRIBUTION WEIGHTS TEMPLATE - Default Weights Configuration
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contribution_weights_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Info
  template_name VARCHAR(100) NOT NULL UNIQUE,
  template_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  
  -- Weight Configuration (JSON)
  weight_config JSONB NOT NULL, -- { "owner": 0.30, "serving": 0.30, "relay": 0.15, ... }
  
  -- Weighting Formula
  time_weight_factor DECIMAL(3, 2) DEFAULT 0.30, -- How much time_spent affects weight
  role_weight_factor DECIMAL(3, 2) DEFAULT 0.30, -- How much node_role affects weight
  device_weight_factor DECIMAL(3, 2) DEFAULT 0.20, -- How much device_touch affects weight
  activity_weight_factor DECIMAL(3, 2) DEFAULT 0.20, -- How much refresh_activity affects weight
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default template
INSERT INTO contribution_weights_template (template_name, weight_config, description) VALUES
('default_v1', 
 '{"owner": 0.30, "serving": 0.30, "relay": 0.15, "device": 0.15, "cache": 0.10, "ui_renderer": 0.05, "data_source": 0.05}'::jsonb,
 'Default contribution weighting template for Node OS v1')
ON CONFLICT (template_name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. VIEWS FOR ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════════

-- View: Top Earners
CREATE OR REPLACE VIEW top_earners AS
SELECT
  n.id as node_id,
  u.email,
  nes.total_earned,
  nes.total_transactions,
  nes.average_contribution_weight,
  nes.total_karma_earned,
  nes.last_payout_at
FROM node_earnings_summary nes
JOIN core_node n ON nes.node_id = n.id
JOIN users u ON nes.user_id = u.id
ORDER BY nes.total_earned DESC
LIMIT 100;

-- View: Recent Distributions
CREATE OR REPLACE VIEW recent_distributions AS
SELECT
  rdl.id,
  rdl.transaction_id,
  rdl.total_pool,
  rdl.distributed_amount,
  rdl.participant_count,
  rdl.status,
  rdl.executed_at,
  t.amount as transaction_amount,
  t.from_user_id,
  t.to_user_id
FROM revenue_distribution_log rdl
JOIN transactions t ON rdl.transaction_id = t.id
ORDER BY rdl.executed_at DESC
LIMIT 100;

-- View: Contribution Summary by Type
CREATE OR REPLACE VIEW contribution_type_summary AS
SELECT
  contribution_type,
  COUNT(*) as total_contributions,
  SUM(payout_amount) as total_payouts,
  AVG(normalized_weight) as avg_weight,
  COUNT(DISTINCT node_id) as unique_nodes
FROM contribution_graph
GROUP BY contribution_type
ORDER BY total_payouts DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. FUNCTIONS FOR AUTOMATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function: Update node earnings summary
CREATE OR REPLACE FUNCTION update_node_earnings_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert earnings summary
  INSERT INTO node_earnings_summary (node_id, user_id, total_earned, total_transactions)
  VALUES (NEW.node_id, NEW.user_id, NEW.payout_amount, 1)
  ON CONFLICT (node_id) DO UPDATE SET
    total_earned = node_earnings_summary.total_earned + NEW.payout_amount,
    total_transactions = node_earnings_summary.total_transactions + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update earnings summary
CREATE TRIGGER contribution_graph_update_earnings
AFTER UPDATE ON contribution_graph
FOR EACH ROW
WHEN (NEW.payout_status = 'completed' AND OLD.payout_status != 'completed')
EXECUTE FUNCTION update_node_earnings_summary();

-- ═══════════════════════════════════════════════════════════════════════════════
-- INITIAL DATA & VALIDATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Contribution Graph Schema Created Successfully';
  RAISE NOTICE 'Tables: contribution_graph, revenue_distribution_log, node_earnings_summary, contribution_weights_template';
  RAISE NOTICE 'Views: top_earners, recent_distributions, contribution_type_summary';
END $$;
