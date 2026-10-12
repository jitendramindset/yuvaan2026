-- Core seed data (safe, idempotent)
-- Creates a default root node, roles, permissions, and a minimal UI template

-- 1) Default root node (requires at least one user)
WITH u AS (
  SELECT id FROM users ORDER BY created_at NULLS LAST LIMIT 1
)
INSERT INTO core_node (node_code, node_type, node_category, owner_id)
SELECT 'default_root', 'business', 'root', u.id
FROM u
WHERE NOT EXISTS (SELECT 1 FROM core_node WHERE node_code = 'default_root');

-- 2) Default roles for the root node
WITH n AS (
  SELECT id, owner_id FROM core_node WHERE node_code = 'default_root' LIMIT 1
)
INSERT INTO node_role (
  node_id, role_code, role_name, role_description,
  can_view, can_create, can_edit, can_delete, can_manage_roles, can_manage_permissions,
  is_custom, is_active
)
SELECT n.id, 'owner', 'Owner', 'Full access',
       true, true, true, true, true, true,
       false, true
FROM n
WHERE NOT EXISTS (
  SELECT 1 FROM node_role WHERE node_id = n.id AND role_code = 'owner'
);

-- 3) Default permissions for the owner (requires at least one user)
WITH n AS (
  SELECT id, owner_id FROM core_node WHERE node_code = 'default_root' LIMIT 1
)
INSERT INTO node_permission (
  node_id, user_id, role, permission_level,
  can_view, can_create, can_edit, can_delete,
  can_manage_roles, can_manage_permissions
)
SELECT n.id, n.owner_id, 'owner', 4,
       true, true, true, true,
       true, true
FROM n
WHERE NOT EXISTS (
  SELECT 1 FROM node_permission WHERE node_id = n.id AND user_id = n.owner_id
);

-- 4) Minimal UI template for bootstrap
WITH n AS (
  SELECT id, owner_id FROM core_node WHERE node_code = 'default_root' LIMIT 1
)
INSERT INTO ui_template (
  node_id, template_code, template_name, template_type, template_category,
  template_structure, layout_config, component_config, style_config,
  ui_fields_json, model_fields_json, is_default, is_system,
  created_by
)
SELECT n.id, 'default_dashboard', 'Default Dashboard', 'dashboard', 'system',
       '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
       '{}'::jsonb, '{}'::jsonb, true, true,
       n.owner_id
FROM n
WHERE NOT EXISTS (
  SELECT 1 FROM ui_template WHERE node_id = n.id AND template_code = 'default_dashboard'
);
