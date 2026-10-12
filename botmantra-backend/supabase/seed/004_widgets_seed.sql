-- Default widgets as UI templates (idempotent)

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
       'widget_kpi_v1',
       'KPI Widget',
       'widget',
       'system',
       '{"type":"kpi","title":"KPI","value":"0","trend":0}'::jsonb,
       '{"w":4,"h":2}'::jsonb,
       '{}'::jsonb,
       '{"theme":"light"}'::jsonb,
       '{}'::jsonb,
       '{}'::jsonb,
       10,
       false,
       true,
       true,
       true,
       n.owner_id
FROM n
WHERE NOT EXISTS (
  SELECT 1 FROM ui_template WHERE node_id = n.id AND template_code = 'widget_kpi_v1'
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
       'widget_table_v1',
       'Table Widget',
       'widget',
       'system',
       '{"type":"table","columns":[{"field":"name","label":"Name"},{"field":"status","label":"Status"}]}'::jsonb,
       '{"w":8,"h":4}'::jsonb,
       '{}'::jsonb,
       '{"theme":"light"}'::jsonb,
       '{}'::jsonb,
       '{}'::jsonb,
       11,
       false,
       true,
       true,
       true,
       n.owner_id
FROM n
WHERE NOT EXISTS (
  SELECT 1 FROM ui_template WHERE node_id = n.id AND template_code = 'widget_table_v1'
);
