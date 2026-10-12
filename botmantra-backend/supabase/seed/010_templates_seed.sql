-- Default UI templates (idempotent)
-- Numbered seed for ordered execution

WITH n AS (
  SELECT id, owner_id FROM core_node WHERE node_code = 'default_root' LIMIT 1
)
INSERT INTO ui_template (
  node_id, template_code, template_name, template_type, template_category,
  template_structure, layout_config, component_config, style_config,
  ui_fields_json, model_fields_json, display_order, is_default, is_responsive,
  is_active, is_system, created_by
)
SELECT n.id,
       'dashboard_default_v1',
       'Default Dashboard',
       'dashboard',
       'system',
       '{"type":"dashboard","widgets":[{"type":"kpi","title":"Revenue","value":"$0"},{"type":"kpi","title":"Users","value":"0"}]}'::jsonb,
       '{"grid":{"columns":12,"rowHeight":120}}'::jsonb,
       '{}'::jsonb,
       '{"theme":"light","primary":"#4F46E5"}'::jsonb,
       '{}'::jsonb,
       '{}'::jsonb,
       0,
       true,
       true,
       true,
       true,
       n.owner_id
FROM n
WHERE NOT EXISTS (
  SELECT 1 FROM ui_template WHERE node_id = n.id AND template_code = 'dashboard_default_v1'
);

WITH n AS (
  SELECT id, owner_id FROM core_node WHERE node_code = 'default_root' LIMIT 1
)
INSERT INTO ui_template (
  node_id, template_code, template_name, template_type, template_category,
  template_structure, layout_config, component_config, style_config,
  ui_fields_json, model_fields_json, display_order, is_default, is_responsive,
  is_active, is_system, created_by
)
SELECT n.id,
       'form_basic_v1',
       'Basic Form',
       'form',
       'system',
       '{"type":"form","fields":[{"name":"name","type":"text"},{"name":"email","type":"email"}]}'::jsonb,
       '{"layout":"vertical"}'::jsonb,
       '{}'::jsonb,
       '{"theme":"light"}'::jsonb,
       '{}'::jsonb,
       '{}'::jsonb,
       1,
       false,
       true,
       true,
       true,
       n.owner_id
FROM n
WHERE NOT EXISTS (
  SELECT 1 FROM ui_template WHERE node_id = n.id AND template_code = 'form_basic_v1'
);
