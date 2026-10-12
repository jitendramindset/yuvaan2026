-- ═══════════════════════════════════════════════════════════════════════════════
-- CORE NODE SYSTEM - Complete Database Schema
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose: Multi-tenant node-based system with relationships, permissions, and roles
-- Features: Profile creation, company setup, module management, template storage

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. USERS TABLE - User Authentication & Profile
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CORE_NODE TABLE - Main Node Structure (Business/Profile)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core_node (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_code VARCHAR(50) UNIQUE NOT NULL,
  node_type VARCHAR(100) NOT NULL, -- business, profile, team, project, customer, etc.
  node_category VARCHAR(50) NOT NULL, -- root, child, transaction, reference
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  
  -- Business/Profile Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon TEXT, -- SVG or image URL
  color VARCHAR(7), -- hex color
  
  -- Status & Metadata
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived, draft
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  
  -- Business Details (if business type)
  business_type VARCHAR(100),
  industry VARCHAR(100),
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Counters & Statistics
  total_users INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  
  -- Template & Layout
  default_layout_id UUID,
  default_template_id UUID,
  ui_template_json JSONB DEFAULT '{}'::jsonb,
  ui_fields_json JSONB DEFAULT '{}'::jsonb,
  model_fields_json JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Extended Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- store scraped data, settings, etc.
  
  CONSTRAINT valid_node_type CHECK (node_type IN ('business', 'profile', 'team', 'project', 'customer', 'product', 'service', 'appointment', 'invoice', 'post', 'other'))
);

CREATE INDEX idx_core_node_owner ON core_node(owner_id);
CREATE INDEX idx_core_node_parent ON core_node(parent_node_id);
CREATE INDEX idx_core_node_type ON core_node(node_type);
CREATE INDEX idx_core_node_status ON core_node(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. NODE_RELATIONSHIP TABLE - Relationships Between Nodes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  
  -- Relationship Type
  relationship_type VARCHAR(100) NOT NULL, -- parent_child, owner, member, linked, transaction, etc.
  relationship_label VARCHAR(255), -- custom label
  
  -- Link Details
  is_bidirectional BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(source_node_id, target_node_id, relationship_type),
  CONSTRAINT no_self_link CHECK (source_node_id != target_node_id)
);

CREATE INDEX idx_relationship_source ON node_relationship(source_node_id);
CREATE INDEX idx_relationship_target ON node_relationship(target_node_id);
CREATE INDEX idx_relationship_type ON node_relationship(relationship_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. NODE_PERMISSION TABLE - Role-Based Permissions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_permission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role & Permission
  role VARCHAR(50) NOT NULL, -- owner, admin, editor, viewer, guest
  permission_level INTEGER DEFAULT 1, -- 0=none, 1=view, 2=edit, 3=delete, 4=admin
  
  -- Specific Permissions
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_manage_permissions BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  
  -- Validity
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE(node_id, user_id)
);

CREATE INDEX idx_permission_node ON node_permission(node_id);
CREATE INDEX idx_permission_user ON node_permission(user_id);
CREATE INDEX idx_permission_role ON node_permission(role);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. NODE_FUNCTION TABLE - Functions & Operations on Nodes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_function (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  
  -- Function Definition
  function_code VARCHAR(100) NOT NULL,
  function_name VARCHAR(255) NOT NULL,
  function_type VARCHAR(50) NOT NULL, -- api, webhook, internal, custom
  function_description TEXT,
  
  -- Function Implementation
  handler_path VARCHAR(255), -- path to function handler
  handler_code TEXT, -- inline code
  endpoint_url VARCHAR(255), -- API endpoint
  http_method VARCHAR(10) DEFAULT 'POST', -- GET, POST, PUT, DELETE
  
  -- Configuration
  requires_authentication BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  rate_limit_per_minute INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_function_node ON node_function(node_id);
CREATE INDEX idx_function_code ON node_function(function_code);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. NODE_ROLE TABLE - Role Definition for Nodes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  
  -- Role Definition
  role_code VARCHAR(50) NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  role_description TEXT,
  
  -- Permissions
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_manage_roles BOOLEAN DEFAULT false,
  can_manage_permissions BOOLEAN DEFAULT false,
  
  -- Status
  is_custom BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(node_id, role_code)
);

CREATE INDEX idx_role_node ON node_role(node_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. UI_TEMPLATE TABLE - Layout & Template Storage
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ui_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  
  -- Template Information
  template_code VARCHAR(100) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- layout, form, dashboard, report, workflow
  template_category VARCHAR(100), -- business, profile, transaction, etc.
  
  -- Template Content
  template_structure JSONB NOT NULL, -- React component structure
  layout_config JSONB, -- CSS grid, flexbox layout
  component_config JSONB, -- component settings
  style_config JSONB, -- theme, colors, fonts
  ui_fields_json JSONB DEFAULT '{}'::jsonb, -- UI field definitions snapshot
  model_fields_json JSONB DEFAULT '{}'::jsonb, -- Data model snapshot
  
  -- Display Settings
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_responsive BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE(node_id, template_code)
);

CREATE INDEX idx_template_node ON ui_template(node_id);
CREATE INDEX idx_template_type ON ui_template(template_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. DATA_MODEL_REGISTRY TABLE - Canonical Data Model
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS data_model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model identity
  module VARCHAR(100) NOT NULL, -- CORE, CUSTOMERS, PRODUCTS, ORDERS, etc.
  table_name VARCHAR(255),
  column_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  description TEXT,

  -- Data type & UI hints
  data_type VARCHAR(100),
  ui_component VARCHAR(100),
  category VARCHAR(100),

  -- Behavior flags
  is_required BOOLEAN DEFAULT false,
  is_searchable BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  is_sortable BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(module, column_name)
);

CREATE INDEX idx_data_model_module ON data_model_registry(module);
CREATE INDEX idx_data_model_table ON data_model_registry(table_name);
CREATE INDEX idx_data_model_active ON data_model_registry(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. NODE_SELECTED_FIELDS TABLE - Fields Selected for Node from data_model_registry
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_selected_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  data_model_id UUID NOT NULL REFERENCES data_model_registry(id) ON DELETE RESTRICT,
  
  -- Field Configuration for this Node
  display_order INTEGER,
  is_visible BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  is_sortable BOOLEAN DEFAULT false,
  
  -- Custom Overrides
  custom_label VARCHAR(255),
  custom_placeholder VARCHAR(255),
  custom_validation_rule TEXT,
  custom_default_value TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  added_at TIMESTAMP DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  UNIQUE(node_id, data_model_id)
);

CREATE INDEX idx_selected_fields_node ON node_selected_fields(node_id);
CREATE INDEX idx_selected_fields_model ON node_selected_fields(data_model_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. NODE_MODULE_CONFIG TABLE - Selected Modules for Node
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS node_module_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  
  -- Module Information
  module_name VARCHAR(100) NOT NULL, -- CORE, CUSTOMERS, PRODUCTS, ORDERS, etc.
  module_type VARCHAR(50), -- core, transaction, reference, analytics
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Settings
  module_settings JSONB DEFAULT '{}'::jsonb,
  field_mapping JSONB DEFAULT '{}'::jsonb, -- map module fields to custom names
  
  -- Status
  activated_at TIMESTAMP,
  deactivated_at TIMESTAMP,
  
  -- Audit
  configured_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  configured_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(node_id, module_name)
);

CREATE INDEX idx_module_config_node ON node_module_config(node_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. ONBOARDING_SESSION TABLE - Track User Onboarding Progress
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS onboarding_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session Progress
  current_step VARCHAR(50), -- signup, profile, company, modules, layout, confirmation
  total_steps INTEGER DEFAULT 6,
  completed_steps INTEGER DEFAULT 0,
  
  -- Session Data
  session_data JSONB DEFAULT '{}'::jsonb, -- store temporary data
  
  -- Status
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned
  progress_percentage INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  last_activity TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_user ON onboarding_session(user_id);
CREATE INDEX idx_onboarding_status ON onboarding_session(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. TRANSACTION_LOG TABLE - Transaction Data Storage
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES core_node(id) ON DELETE CASCADE,
  
  -- Transaction Information
  transaction_type VARCHAR(100) NOT NULL, -- order, invoice, appointment, post, etc.
  transaction_code VARCHAR(100) NOT NULL,
  
  -- Related Entities
  related_node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Transaction Data
  transaction_data JSONB NOT NULL, -- store all transaction fields
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending, completed, cancelled
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  UNIQUE(node_id, transaction_code)
);

CREATE INDEX idx_transaction_node ON transaction_log(node_id);
CREATE INDEX idx_transaction_type ON transaction_log(transaction_type);
CREATE INDEX idx_transaction_status ON transaction_log(status);
CREATE INDEX idx_transaction_created ON transaction_log(created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. WEBSITE_SCRAPE_DATA TABLE - Scraped Website Information
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS website_scrape_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  
  -- Source
  website_url VARCHAR(255) NOT NULL,
  
  -- Scraped Content
  page_title VARCHAR(500),
  page_description TEXT,
  company_name VARCHAR(255),
  company_phone VARCHAR(20),
  company_email VARCHAR(255),
  company_address TEXT,
  services TEXT, -- JSON array of services
  products TEXT, -- JSON array of products
  social_links JSONB, -- facebook, twitter, linkedin, instagram, etc.
  
  -- Raw Data
  raw_html TEXT,
  scraped_metadata JSONB,
  
  -- Status
  scrape_status VARCHAR(50), -- success, failed, pending
  error_message TEXT,
  
  -- Audit
  scraped_at TIMESTAMP DEFAULT NOW(),
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_scrape_node ON website_scrape_data(node_id);
CREATE INDEX idx_scrape_url ON website_scrape_data(website_url);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. SESSION TABLE - User Session Management
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_node_id UUID REFERENCES core_node(id) ON DELETE SET NULL,
  
  -- Session Info
  session_token VARCHAR(500) NOT NULL UNIQUE,
  refresh_token VARCHAR(500),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_activity TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_user ON session(user_id);
CREATE INDEX idx_session_token ON session(session_token);
CREATE INDEX idx_session_active_node ON session(active_node_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Create Indexes for Better Performance
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_verified ON users(is_verified) WHERE is_verified = true;
CREATE INDEX idx_core_node_owner_status ON core_node(owner_id, status);
CREATE INDEX idx_node_relationship_active ON node_relationship(is_active) WHERE is_active = true;
CREATE INDEX idx_permission_active ON node_permission(is_active) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Summary Message
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORE NODE SYSTEM SCHEMA CREATED SUCCESSFULLY';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TABLES CREATED:';
  RAISE NOTICE '  1. users - User authentication & profile';
  RAISE NOTICE '  2. core_node - Main node structure';
  RAISE NOTICE '  3. node_relationship - Node relationships & links';
  RAISE NOTICE '  4. node_permission - Role-based permissions';
  RAISE NOTICE '  5. node_function - Functions & operations';
  RAISE NOTICE '  6. node_role - Role definitions';
  RAISE NOTICE '  7. ui_template - Layout & template storage';
  RAISE NOTICE '  8. node_selected_fields - Field selection per node';
  RAISE NOTICE '  9. node_module_config - Module configuration';
  RAISE NOTICE '  10. onboarding_session - Track onboarding progress';
  RAISE NOTICE '  11. transaction_log - Transaction data storage';
  RAISE NOTICE '  12. website_scrape_data - Scraped website information';
  RAISE NOTICE '  13. session - User session management';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 KEY RELATIONSHIPS:';
  RAISE NOTICE '  • users → core_node (1:many owner relationship)';
  RAISE NOTICE '  • core_node → core_node (self-referencing parent-child)';
  RAISE NOTICE '  • core_node ↔ core_node (via node_relationship many:many)';
  RAISE NOTICE '  • core_node → node_permission ← users (access control)';
  RAISE NOTICE '  • core_node → ui_template (layout & display)';
  RAISE NOTICE '  • core_node → node_selected_fields ← data_model_registry';
  RAISE NOTICE '  • core_node → transaction_log (transaction storage)';
  RAISE NOTICE '';
  RAISE NOTICE '✨ FEATURES:';
  RAISE NOTICE '  ✓ Multi-tenant node-based architecture';
  RAISE NOTICE '  ✓ Flexible role-based access control';
  RAISE NOTICE '  ✓ Relationship management between nodes';
  RAISE NOTICE '  ✓ Transaction logging & tracking';
  RAISE NOTICE '  ✓ Template & layout management';
  RAISE NOTICE '  ✓ Field selection from data model registry';
  RAISE NOTICE '  ✓ Module configuration per node';
  RAISE NOTICE '  ✓ Onboarding session tracking';
  RAISE NOTICE '  ✓ Website data scraping';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
