-- Default roles and permissions

INSERT INTO roles (role_code, role_name, role_description, is_system)
VALUES
  ('owner', 'Owner', 'Full access', true),
  ('admin', 'Admin', 'Administrative access', true),
  ('editor', 'Editor', 'Create and edit access', true),
  ('viewer', 'Viewer', 'Read-only access', true)
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO permissions (permission_code, permission_name, permission_description, resource_type, action, is_system)
VALUES
  ('ui.view', 'View UI', 'Can view UI screens', 'ui', 'view', true),
  ('ui.edit', 'Edit UI', 'Can edit UI layouts', 'ui', 'edit', true),
  ('data.read', 'Read Data', 'Can read data', 'data', 'read', true),
  ('data.write', 'Write Data', 'Can write data', 'data', 'write', true),
  ('data.delete', 'Delete Data', 'Can delete data', 'data', 'delete', true),
  ('admin.manage', 'Admin Manage', 'Can manage settings and roles', 'admin', 'manage', true)
ON CONFLICT (permission_code) DO NOTHING;

-- Map owner role to all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;
