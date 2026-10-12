/**
 * SEED DATA FOR PRODUCTION BOOTSTRAP
 * Essential roles, permissions, templates, and system configuration
 * Generated: 2026-02-03
 * 
 * Execution order:
 * 1. roles & permissions (system foundation)
 * 2. business_templates & ui_templates (UI scaffolding)
 * 3. system configuration (system_mode, dharma_rules)
 * 
 * Status: IDEMPOTENT - Safe to re-run multiple times
 */

-- ============================================================================
-- PHASE 1: SYSTEM ROLES & PERMISSIONS
-- ============================================================================

-- Insert system roles
INSERT INTO roles (id, business_id, role_name, role_code, description, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, NULL, 'Admin', 'admin', 'Full system access', true),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, NULL, 'Editor', 'editor', 'Content & data modification', true),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, NULL, 'Viewer', 'viewer', 'Read-only access', true),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, NULL, 'Owner', 'owner', 'Business owner - full control', true)
ON CONFLICT (id) DO NOTHING;

-- Insert system permissions
INSERT INTO permissions (id, business_id, code, name, description, resource_type, action, is_active)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001'::uuid, NULL, 'READ_USERS', 'Read Users', 'View user profiles', 'users', 'read', true),
  ('650e8400-e29b-41d4-a716-446655440002'::uuid, NULL, 'WRITE_USERS', 'Write Users', 'Create/edit users', 'users', 'write', true),
  ('650e8400-e29b-41d4-a716-446655440003'::uuid, NULL, 'DELETE_USERS', 'Delete Users', 'Remove users', 'users', 'delete', true),
  ('650e8400-e29b-41d4-a716-446655440004'::uuid, NULL, 'READ_ROLES', 'Read Roles', 'View roles', 'roles', 'read', true),
  ('650e8400-e29b-41d4-a716-446655440005'::uuid, NULL, 'WRITE_ROLES', 'Write Roles', 'Create/edit roles', 'roles', 'write', true),
  ('650e8400-e29b-41d4-a716-446655440006'::uuid, NULL, 'READ_DATA', 'Read Data', 'Access data tables', 'data', 'read', true),
  ('650e8400-e29b-41d4-a716-446655440007'::uuid, NULL, 'WRITE_DATA', 'Write Data', 'Create/edit data', 'data', 'write', true),
  ('650e8400-e29b-41d4-a716-446655440008'::uuid, NULL, 'DELETE_DATA', 'Delete Data', 'Remove data', 'data', 'delete', true),
  ('650e8400-e29b-41d4-a716-446655440009'::uuid, NULL, 'READ_REPORTS', 'Read Reports', 'View analytics', 'reports', 'read', true),
  ('650e8400-e29b-41d4-a716-446655440010'::uuid, NULL, 'READ_SETTINGS', 'Read Settings', 'View settings', 'settings', 'read', true),
  ('650e8400-e29b-41d4-a716-446655440011'::uuid, NULL, 'WRITE_SETTINGS', 'Write Settings', 'Modify settings', 'settings', 'write', true),
  ('650e8400-e29b-41d4-a716-446655440012'::uuid, NULL, 'READ_TEMPLATES', 'Read Templates', 'View templates', 'templates', 'read', true),
  ('650e8400-e29b-41d4-a716-446655440013'::uuid, NULL, 'WRITE_TEMPLATES', 'Write Templates', 'Create/edit templates', 'templates', 'write', true),
  ('650e8400-e29b-41d4-a716-446655440014'::uuid, NULL, 'DELETE_TEMPLATES', 'Delete Templates', 'Remove templates', 'templates', 'delete', true)
ON CONFLICT (id) DO NOTHING;

-- Map permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
VALUES 
  -- Owner: full access
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440004'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440005'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440006'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440007'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440008'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440010'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440011'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440013'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440014'::uuid),
  
  -- Admin: most permissions except delete critical resources
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440004'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440006'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440007'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440010'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440011'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440013'::uuid),
  
  -- Editor: read/write data and templates
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440006'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440007'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440013'::uuid),
  
  -- Viewer: read-only access
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440006'::uuid),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440010'::uuid),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440012'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PHASE 2: UI TEMPLATES & LAYOUTS
-- ============================================================================

-- Insert default UI templates
INSERT INTO ui_templates (id, business_id, name, template_code, template_type, description, schema_json, is_default, is_active)
VALUES 
  (
    '750e8400-e29b-41d4-a716-446655440001'::uuid,
    NULL,
    'Dashboard Default',
    'dashboard_default',
    'dashboard',
    'Default business dashboard layout',
    '{
      "title": "Business Dashboard",
      "sections": [
        {"type": "kpi", "layout": "grid", "cols": 4},
        {"type": "chart", "layout": "grid", "cols": 2},
        {"type": "table", "layout": "grid", "cols": 1}
      ],
      "refresh_interval": 30000
    }'::jsonb,
    true,
    true
  ),
  (
    '750e8400-e29b-41d4-a716-446655440002'::uuid,
    NULL,
    'Data Grid Default',
    'data_grid_default',
    'list',
    'Default data grid for tables',
    '{
      "pagination": true,
      "sorting": true,
      "filtering": true,
      "columns": [
        {"field": "id", "header": "ID", "width": 80},
        {"field": "created_at", "header": "Created", "width": 150},
        {"field": "status", "header": "Status", "width": 100}
      ],
      "rows_per_page": 20
    }'::jsonb,
    true,
    true
  ),
  (
    '750e8400-e29b-41d4-a716-446655440003'::uuid,
    NULL,
    'Form Default',
    'form_default',
    'form',
    'Default form layout',
    '{
      "layout": "vertical",
      "spacing": "medium",
      "validation": true,
      "submit_button": true,
      "cancel_button": true,
      "fields": []
    }'::jsonb,
    true,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Insert default widgets
INSERT INTO ui_widget_layouts (
  id, user_id, business_id, template_id, widget_id,
  x, y, w, h, hidden
)
VALUES 
  -- Dashboard widgets
  ('850e8400-e29b-41d4-a716-446655440001'::uuid, NULL, NULL, '750e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440001'::uuid, 0, 0, 1, 1, false),
  ('850e8400-e29b-41d4-a716-446655440002'::uuid, NULL, NULL, '750e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440002'::uuid, 1, 0, 1, 1, false),
  ('850e8400-e29b-41d4-a716-446655440003'::uuid, NULL, NULL, '750e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440003'::uuid, 2, 0, 1, 1, false),
  ('850e8400-e29b-41d4-a716-446655440004'::uuid, NULL, NULL, '750e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440004'::uuid, 3, 0, 1, 1, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 3: DASHBOARD CONFIGURATION
-- ============================================================================

-- Insert KPI templates
INSERT INTO dashboard_kpis (
  id, business_id, kpi_code, kpi_name, description,
  metric_type, calculation_method, format_type
)
VALUES 
  (
    '950e8400-e29b-41d4-a716-446655440001'::uuid,
    NULL,
    'revenue_total',
    'Total Revenue',
    'Sum of all revenue',
    'currency',
    'SUM(amount)',
    'currency'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440002'::uuid,
    NULL,
    'order_count',
    'Total Orders',
    'Count of all orders',
    'count',
    'COUNT(*)',
    'number'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440003'::uuid,
    NULL,
    'customer_count',
    'Active Customers',
    'Count of active customers',
    'count',
    'COUNT(DISTINCT customer_id)',
    'number'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440004'::uuid,
    NULL,
    'growth_rate',
    'Growth Rate',
    'Month-over-month growth',
    'percentage',
    'PERCENT_CHANGE()',
    'percentage'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 4: SYSTEM CONFIGURATION
-- ============================================================================

-- Insert system mode
INSERT INTO system_mode (id, mode_name, is_active, config)
VALUES 
  (
    '060e8400-e29b-41d4-a716-446655440001'::uuid,
    'production',
    true,
    '{
      "environment": "production",
      "debug_mode": false,
      "rate_limiting": true,
      "cache_enabled": true,
      "vector_search": true,
      "audit_logging": true
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Insert dharma (ethical AI) rules
INSERT INTO dharma_rules (
  rule_id, rule_code, rule_name, description,
  principle_category, severity_level, is_active
)
VALUES 
  (
    '160e8400-e29b-41d4-a716-446655440001'::uuid,
    'user_consent_required',
    'User Consent Required',
    'All data usage must have explicit user consent',
    'transparency',
    'critical',
    true
  ),
  (
    '160e8400-e29b-41d4-a716-446655440002'::uuid,
    'data_minimization',
    'Data Minimization',
    'Only collect data necessary for the task',
    'privacy',
    'high',
    true
  ),
  (
    '160e8400-e29b-41d4-a716-446655440003'::uuid,
    'no_discrimination',
    'No Discrimination',
    'AI decisions must not discriminate based on protected attributes',
    'fairness',
    'critical',
    true
  ),
  (
    '160e8400-e29b-41d4-a716-446655440004'::uuid,
    'explainability',
    'Explainability',
    'AI decisions must be explainable to users',
    'transparency',
    'high',
    true
  ),
  (
    '160e8400-e29b-41d4-a716-446655440005'::uuid,
    'human_oversight',
    'Human Oversight',
    'Critical decisions require human review',
    'accountability',
    'critical',
    true
  )
ON CONFLICT (rule_id) DO NOTHING;

-- ============================================================================
-- PHASE 5: SYSTEM ROLES (Global, not business-specific)
-- ============================================================================

-- Insert global system roles
INSERT INTO system_roles (role_name, description, created_at)
VALUES 
  ('superadmin', 'System-wide administrator with all permissions', NOW()),
  ('business_admin', 'Business administrator with business scope', NOW()),
  ('staff', 'Regular staff member with limited permissions', NOW()),
  ('customer', 'Customer with minimal permissions', NOW())
ON CONFLICT (role_name) DO NOTHING;

-- Insert system permissions
INSERT INTO system_permissions (code, name, description, created_at)
VALUES 
  ('manage_users', 'Manage users', 'Create, edit, delete users', NOW()),
  ('manage_roles', 'Manage roles', 'Create, edit roles and permissions', NOW()),
  ('manage_businesses', 'Manage businesses', 'Create, edit businesses', NOW()),
  ('manage_settings', 'Manage settings', 'Modify system settings', NOW()),
  ('view_audit_logs', 'View audit logs', 'Access audit trail', NOW()),
  ('manage_ai_models', 'Manage AI models', 'Configure AI/ML models', NOW()),
  ('manage_integrations', 'Manage integrations', 'Setup external integrations', NOW())
ON CONFLICT (code) DO NOTHING;

-- Map system permissions to system roles
INSERT INTO system_role_permissions (role_name, permission_code)
VALUES 
  ('superadmin', 'manage_users'),
  ('superadmin', 'manage_roles'),
  ('superadmin', 'manage_businesses'),
  ('superadmin', 'manage_settings'),
  ('superadmin', 'view_audit_logs'),
  ('superadmin', 'manage_ai_models'),
  ('superadmin', 'manage_integrations'),
  
  ('business_admin', 'manage_users'),
  ('business_admin', 'manage_roles'),
  ('business_admin', 'manage_settings'),
  ('business_admin', 'view_audit_logs'),
  
  ('staff', 'view_audit_logs'),
  
  ('customer', NULL)
ON CONFLICT (role_name, permission_code) DO NOTHING;

-- ============================================================================
-- PHASE 6: SUBSCRIPTION TIERS
-- ============================================================================

-- Insert subscription tiers
INSERT INTO subscription_tiers (id, name, description, price_monthly, features_json, limits_json, is_active)
VALUES 
  (
    '260e8400-e29b-41d4-a716-446655440001'::uuid,
    'Starter',
    'Perfect for small teams',
    29.99,
    '{"users": 5, "storage_gb": 10, "api_calls_monthly": 100000, "dashboards": 3, "templates": 5}'::jsonb,
    '{"max_users": 5, "max_storage_gb": 10, "max_api_calls_monthly": 100000}'::jsonb,
    true
  ),
  (
    '260e8400-e29b-41d4-a716-446655440002'::uuid,
    'Professional',
    'For growing businesses',
    99.99,
    '{"users": 50, "storage_gb": 100, "api_calls_monthly": 1000000, "dashboards": 20, "templates": 50}'::jsonb,
    '{"max_users": 50, "max_storage_gb": 100, "max_api_calls_monthly": 1000000}'::jsonb,
    true
  ),
  (
    '260e8400-e29b-41d4-a716-446655440003'::uuid,
    'Enterprise',
    'For large organizations',
    299.99,
    '{"users": 500, "storage_gb": 1000, "api_calls_monthly": 10000000, "dashboards": 200, "templates": 500}'::jsonb,
    '{"max_users": 500, "max_storage_gb": 1000, "max_api_calls_monthly": 10000000}'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 7: NODE RULE MASTER (Default rules)
-- ============================================================================

-- Insert default node rules
INSERT INTO node_rule_master (rule_id, rule_code, rule_name, description, rule_type, condition_json, action_json, is_active)
VALUES 
  (
    '360e8400-e29b-41d4-a716-446655440001'::uuid,
    'auto_approve_low_value',
    'Auto-approve low-value transactions',
    'Automatically approve transactions below threshold',
    'approval',
    '{"amount_less_than": 100}'::jsonb,
    '{"action": "approve", "notification": false}'::jsonb,
    true
  ),
  (
    '360e8400-e29b-41d4-a716-446655440002'::uuid,
    'require_review_high_value',
    'Require review for high-value',
    'Flag high-value transactions for review',
    'approval',
    '{"amount_greater_than": 10000}'::jsonb,
    '{"action": "require_review", "notification": true}'::jsonb,
    true
  ),
  (
    '360e8400-e29b-41d4-a716-446655440003'::uuid,
    'rate_limit_api',
    'API rate limiting',
    'Limit API requests per user',
    'rate_limit',
    '{"requests_per_minute": 60, "requests_per_hour": 3600}'::jsonb,
    '{"action": "throttle", "status_code": 429}'::jsonb,
    true
  )
ON CONFLICT (rule_id) DO NOTHING;

-- ============================================================================
-- PHASE 8: AI AGENT TEMPLATES
-- ============================================================================

-- Insert AI agent templates
INSERT INTO ai_agent_templates (id, name, description, template_code, system_prompt, model_config)
VALUES 
  (
    '460e8400-e29b-41d4-a716-446655440001'::uuid,
    'Customer Support Bot',
    'AI assistant for customer support',
    'support_agent',
    'You are a helpful customer support representative. Always be polite, professional, and try to resolve issues efficiently.',
    '{
      "model": "gpt-4",
      "temperature": 0.7,
      "max_tokens": 500,
      "top_p": 0.9
    }'::jsonb
  ),
  (
    '460e8400-e29b-41d4-a716-446655440002'::uuid,
    'Data Analysis Bot',
    'AI assistant for data analysis',
    'analytics_agent',
    'You are a data analyst. Help users understand their data with clear, concise explanations and recommendations.',
    '{
      "model": "gpt-4",
      "temperature": 0.5,
      "max_tokens": 1000,
      "top_p": 0.95
    }'::jsonb
  ),
  (
    '460e8400-e29b-41d4-a716-446655440003'::uuid,
    'Content Generator',
    'AI assistant for content creation',
    'content_agent',
    'You are a creative writer. Generate high-quality, engaging content based on user requirements.',
    '{
      "model": "gpt-4",
      "temperature": 0.9,
      "max_tokens": 2000,
      "top_p": 1.0
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify roles created
SELECT COUNT(*) as role_count FROM roles WHERE business_id IS NULL;

-- Verify permissions created
SELECT COUNT(*) as permission_count FROM permissions WHERE business_id IS NULL;

-- Verify templates created
SELECT COUNT(*) as template_count FROM ui_templates WHERE business_id IS NULL;

-- Verify KPIs created
SELECT COUNT(*) as kpi_count FROM dashboard_kpis WHERE business_id IS NULL;

-- Verify dharma rules created
SELECT COUNT(*) as rule_count FROM dharma_rules WHERE is_active = true;

-- Summary
SELECT 
  (SELECT COUNT(*) FROM roles WHERE business_id IS NULL) as system_roles,
  (SELECT COUNT(*) FROM permissions WHERE business_id IS NULL) as system_permissions,
  (SELECT COUNT(*) FROM ui_templates WHERE business_id IS NULL) as ui_templates,
  (SELECT COUNT(*) FROM dashboard_kpis WHERE business_id IS NULL) as dashboard_kpis,
  (SELECT COUNT(*) FROM dharma_rules) as dharma_rules,
  (SELECT COUNT(*) FROM subscription_tiers) as subscription_tiers,
  (SELECT COUNT(*) FROM ai_agent_templates) as ai_agents,
  (SELECT COUNT(*) FROM node_rule_master) as node_rules;
