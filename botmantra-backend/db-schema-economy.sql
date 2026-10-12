-- ═══════════════════════════════════════════════════════════════════════════════
-- NODE OS ECONOMY SYSTEM - Database Schema
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose: Wallet management, transactions, revenue sharing, karma integration
-- Features: Multi-wallet support, transaction history, revenue pool distribution

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. WALLETS TABLE - User Wallets & Balances
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_type VARCHAR(50) NOT NULL DEFAULT 'primary', -- primary, savings, business, etc.
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_received DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_sent DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  
  -- Freezing & Hold
  frozen_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  is_frozen BOOLEAN DEFAULT false,
  freeze_reason TEXT,
  
  -- Metadata
  wallet_address VARCHAR(255), -- For crypto wallets
  is_active BOOLEAN DEFAULT true,
  last_transaction_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT balance_non_negative CHECK (balance >= 0),
  CONSTRAINT frozen_balance_non_negative CHECK (frozen_balance >= 0),
  CONSTRAINT unique_user_wallet_type UNIQUE(user_id, wallet_type)
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_type ON wallets(wallet_type);
CREATE INDEX idx_wallets_active ON wallets(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TRANSACTIONS TABLE - Transaction History
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parties
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  to_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  from_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT,
  to_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT,
  
  -- Amount
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  original_amount DECIMAL(15, 2),
  original_currency VARCHAR(3),
  exchange_rate DECIMAL(10, 6),
  
  -- Transaction Details
  transaction_type VARCHAR(50) NOT NULL, -- transfer, withdrawal, deposit, refund, dividend, payment, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, reversed
  description TEXT,
  reference_id VARCHAR(255), -- For linking to orders, invoices, etc.
  
  -- Fees & Karma
  fee_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  fee_type VARCHAR(50), -- percentage, fixed
  karma_multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
  karma_earned INTEGER DEFAULT 0,
  
  -- Payment Gateway
  payment_method VARCHAR(50), -- bank_transfer, card, cryptocurrency, internal_transfer
  gateway_transaction_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. REVENUE SHARE POOL TABLE - Distribute Revenue Among Users
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS revenue_share_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  source_node_id UUID REFERENCES core_node(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Pool Details
  pool_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  pool_type VARCHAR(50) NOT NULL, -- equal_share, weighted, performance_based
  distribution_rule JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Distribution
  distributed_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  pending_distribution DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  last_distribution_at TIMESTAMP,
  distribution_frequency VARCHAR(50) NOT NULL DEFAULT 'manual', -- daily, weekly, monthly, manual
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT total_amount_positive CHECK (total_amount >= 0),
  CONSTRAINT distributed_not_exceeding_total CHECK (distributed_amount <= total_amount)
);

CREATE INDEX idx_revenue_share_pool_source_user ON revenue_share_pool(source_user_id);
CREATE INDEX idx_revenue_share_pool_source_node ON revenue_share_pool(source_node_id);
CREATE INDEX idx_revenue_share_pool_active ON revenue_share_pool(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. REVENUE SHARE RECIPIENTS TABLE - Who Gets What
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS revenue_share_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES revenue_share_pool(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Share Definition
  share_type VARCHAR(50) NOT NULL, -- percentage, fixed_amount, performance_based
  share_value DECIMAL(10, 4) NOT NULL, -- e.g., 25.50 for 25.5% or fixed amount
  share_weight INTEGER DEFAULT 1, -- For weighted distributions
  
  -- Tracking
  total_received DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  last_received_at TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT share_value_positive CHECK (share_value > 0),
  CONSTRAINT unique_pool_recipient UNIQUE(pool_id, recipient_user_id)
);

CREATE INDEX idx_recipients_pool ON revenue_share_recipients(pool_id);
CREATE INDEX idx_recipients_user ON revenue_share_recipients(recipient_user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. WALLET PERMISSIONS TABLE - Control Access
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Permissions
  can_view BOOLEAN DEFAULT false,
  can_transfer BOOLEAN DEFAULT false,
  can_withdraw BOOLEAN DEFAULT false,
  can_deposit BOOLEAN DEFAULT false,
  can_manage_permissions BOOLEAN DEFAULT false,
  
  -- Limits
  daily_transfer_limit DECIMAL(15, 2),
  monthly_transfer_limit DECIMAL(15, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_wallet_user_permission UNIQUE(wallet_id, user_id)
);

CREATE INDEX idx_wallet_permissions_wallet ON wallet_permissions(wallet_id);
CREATE INDEX idx_wallet_permissions_user ON wallet_permissions(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. WALLET BALANCE HISTORY TABLE - Track Changes Over Time
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  
  -- Balance Snapshot
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  change_amount DECIMAL(15, 2) NOT NULL,
  
  -- Reason
  change_reason VARCHAR(100) NOT NULL, -- transaction, refund, adjustment, etc.
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_balance_history_wallet ON wallet_balance_history(wallet_id);
CREATE INDEX idx_balance_history_created ON wallet_balance_history(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. WALLET SETTINGS TABLE - User Preferences
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Preferences
  preferred_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  auto_convert_currency BOOLEAN DEFAULT false,
  show_balance_in_profile BOOLEAN DEFAULT false,
  
  -- Notifications
  notify_transactions BOOLEAN DEFAULT true,
  notify_low_balance BOOLEAN DEFAULT true,
  low_balance_threshold DECIMAL(15, 2) DEFAULT 100.00,
  
  -- Security
  require_2fa_for_withdrawal BOOLEAN DEFAULT false,
  daily_withdrawal_limit DECIMAL(15, 2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_settings_user ON wallet_settings(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS - Useful Queries
-- ═══════════════════════════════════════════════════════════════════════════════

-- User Transaction Summary
CREATE OR REPLACE VIEW user_transaction_summary AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as total_transactions,
  SUM(CASE WHEN t.from_user_id = u.id AND t.status = 'completed' THEN t.amount ELSE 0 END) as total_sent,
  SUM(CASE WHEN t.to_user_id = u.id AND t.status = 'completed' THEN t.amount ELSE 0 END) as total_received,
  SUM(CASE WHEN t.from_user_id = u.id AND t.status = 'completed' THEN t.fee_amount ELSE 0 END) as total_fees_paid,
  SUM(CASE WHEN t.status = 'completed' THEN t.karma_earned ELSE 0 END) as karma_earned
FROM users u
LEFT JOIN transactions t ON u.id = t.from_user_id OR u.id = t.to_user_id
GROUP BY u.id, u.email;

-- Wallet Summary
CREATE OR REPLACE VIEW wallet_summary AS
SELECT
  w.id as wallet_id,
  w.user_id,
  u.email,
  w.wallet_type,
  w.balance,
  w.frozen_balance,
  (w.balance + w.frozen_balance) as total_value,
  w.total_earned,
  w.total_spent,
  w.last_transaction_at,
  COUNT(t.id) as transaction_count
FROM wallets w
JOIN users u ON w.user_id = u.id
LEFT JOIN transactions t ON (w.id = t.from_wallet_id OR w.id = t.to_wallet_id) AND t.status = 'completed'
GROUP BY w.id, w.user_id, u.email, w.wallet_type, w.balance, w.frozen_balance, w.total_earned, w.total_spent, w.last_transaction_at;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INITIAL DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create default wallet settings for existing users (run after schema creation)
-- INSERT INTO wallet_settings (user_id, preferred_currency)
-- SELECT id, 'USD' FROM users WHERE id NOT IN (SELECT user_id FROM wallet_settings);
