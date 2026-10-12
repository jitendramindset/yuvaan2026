-- ═══════════════════════════════════════════════════════════════════════════════
-- Add Missing Views (v_*) from schema export
-- Created: 2026-02-07
-- Purpose: Recreate v_* views present in the CSV export
-- ═══════════════════════════════════════════════════════════════════════════════

-- v_ai_tasks: Task queue view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_ai_tasks' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_ai_tasks';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_ai_tasks' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_ai_tasks';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_ai_tasks AS
SELECT
  q.id,
  q.nid_hash AS node_id,
  q.task_type,
  q.payload,
  q.status,
  q.created_at
FROM public.node_ai_task_queue q;

-- v_event_queue: Event queue view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_event_queue' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_event_queue';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_event_queue' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_event_queue';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_event_queue AS
SELECT
  q.event_id,
  q.nid_hash AS node_id,
  q.event_type,
  q.payload,
  q.created_at
FROM public.node_event_queue q;

-- v_labels: Aggregated labels (user > business > ui)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_labels' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_labels';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_labels' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_labels';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_labels AS
WITH labels AS (
  SELECT 1 AS priority, label_key, default_text AS label_value
  FROM public.ui_labels
  UNION ALL
  SELECT 2 AS priority, label_key, custom_text AS label_value
  FROM public.business_labels
  UNION ALL
  SELECT 3 AS priority, label_key, custom_text AS label_value
  FROM public.user_labels
),
label_dedup AS (
  SELECT DISTINCT ON (label_key) label_key, label_value
  FROM labels
  ORDER BY label_key, priority DESC
)
SELECT jsonb_object_agg(label_key, label_value) AS jsonb_object_agg
FROM label_dedup;

-- v_node_state: Node trust/karma view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_node_state' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_node_state';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_node_state' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_node_state';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_node_state AS
SELECT
  n.nid_hash AS node_id,
  n.trust_score,
  n.karma_score,
  n.node_state,
  n.reputation_level
FROM public.node_core n;

-- v_permissions: Permissions aggregate
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_permissions' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_permissions';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_permissions' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_permissions';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_permissions AS
SELECT jsonb_agg(p) AS jsonb_agg
FROM public.permissions p;

-- v_role_id: Role ids list
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_role_id' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_role_id';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_role_id' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_role_id';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_role_id AS
SELECT r.id AS role_id
FROM public.roles r;

-- v_templates: UI templates list
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_templates' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_templates';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_templates' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_templates';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_templates AS
SELECT t.template_code, t.template_name
FROM public.ui_templates t;

-- v_ui_schema: UI schema with role permissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_ui_schema' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_ui_schema';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_ui_schema' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_ui_schema';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_ui_schema AS
SELECT
  d.business_id,
  d.template_code,
  d.table_name,
  d.column_name,
  COALESCE(d.ui_label, d.display_name, d.column_name) AS label,
  d.input_type,
  d.ui_component,
  d.is_required,
  d.is_visible,
  d.is_filterable,
  d.is_sortable,
  d.display_order,
  d.default_value,
  d.validation_rule,
  crp.role_id,
  crp.can_view,
  crp.can_edit,
  crp.can_filter
FROM public.data_model_registry d
LEFT JOIN public.column_role_permissions crp
  ON crp.registry_id = d.id
  AND crp.business_id = d.business_id;

-- v_widgets: Widgets aggregate
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_widgets' AND relkind = 'r') THEN
    EXECUTE 'DROP TABLE public.v_widgets';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'v_widgets' AND relkind = 'm') THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.v_widgets';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.v_widgets AS
SELECT jsonb_agg(w) AS jsonb_agg
FROM (
  SELECT
    w.id,
    w.widget_type,
    w.title,
    w.config,
    w.position,
    w.template_id,
    w.business_id,
    w.created_at
  FROM public.dashboard_widgets w
  UNION ALL
  SELECT
    tw.id,
    tw.widget_type,
    tw.title,
    tw.config,
    tw.position,
    tw.template_id,
    NULL::uuid AS business_id,
    tw.created_at
  FROM public.ui_template_widgets tw
) w;
