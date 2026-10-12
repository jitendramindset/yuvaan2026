---SEGMENT 1---
BEGIN;
CREATE EXTENSION IF NOT EXISTS vector;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'node_type_enum') THEN CREATE TYPE node_type_enum AS ENUM ('living'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_scope_enum') THEN CREATE TYPE permission_scope_enum AS ENUM ('READ'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_mode_enum') THEN CREATE TYPE privacy_mode_enum AS ENUM ('CORE_ONLY'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN CREATE TYPE task_status_enum AS ENUM ('PENDING'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_status_enum') THEN CREATE TYPE tx_status_enum AS ENUM ('PENDING'); END IF; END $$;
CREATE SEQUENCE IF NOT EXISTS public.admin_actions_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.auth_identity_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.device_registry_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.n8n_chat_histories_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_ai_input_input_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_ai_task_queue_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_audit_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_core_row_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_dharma_log_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_event_queue_event_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_failure_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_federation_queue_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_karma_log_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_permission_log_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_replication_queue_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.node_rule_master_rule_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.otp_store_id_seq;
CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id bigint NOT NULL DEFAULT nextval('admin_actions_log_id_seq'::regclass),
  admin_id uuid,
  action text,
  target text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.admin_node_runtime_prompt (
  nid_hash text,
  full_system_prompt text
);
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  admin_id uuid,
  can_edit_rules boolean,
  can_unlock_nodes boolean,
  can_override_karma boolean,
  can_manage_billing boolean
);
CREATE TABLE IF NOT EXISTS public.admin_session (
  session_id uuid NOT NULL,
  active boolean DEFAULT true,
  expires_at timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.admin_test_controls (
  control_id uuid NOT NULL DEFAULT gen_random_uuid(),
  control_name text,
  is_enabled boolean DEFAULT false,
  override_payload jsonb,
  updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  user_id uuid,
  action_type text,
  table_name text,
  before_data jsonb,
  after_data jsonb,
  executed_sql text,
  created_at timestamp with time zone DEFAULT now(),
  ip_address text,
  device_id text
);
CREATE TABLE IF NOT EXISTS public.ai_action_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action_type text,
  target_table text,
  input_payload jsonb,
  status text DEFAULT 'pending'::text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  executed_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.ai_action_whitelist (
  table_name text NOT NULL,
  allowed_actions text[]
);
CREATE TABLE IF NOT EXISTS public.ai_agent_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  rule_name text,
  trigger_type text,
  condition_json jsonb,
  action_json jsonb,
  is_active boolean DEFAULT true,
  last_run timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_agent_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  description text,
  system_prompt text,
  rag_enabled boolean DEFAULT true,
  tools jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_app_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  app_name text,
  description text,
  status text DEFAULT 'pending'::text,
  ai_response jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid,
  role text,
  content text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  user_id uuid,
  session_name text,
  created_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_dashboard_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  prompt text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_generated_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid,
  template_code text,
  config jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  source_type text NOT NULL,
  source_id text,
  content text NOT NULL,
  embedding vector,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  doc_id uuid,
  heading text,
  sub_heading text,
  chunk_index integer,
  user_id uuid NOT NULL
);
CREATE TABLE IF NOT EXISTS public.ai_model_router (
  user_id uuid NOT NULL,
  provider text,
  api_key text,
  fallback_provider text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_plugins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plugin_code text,
  plugin_name text,
  category text,
  description text,
  entry_point text,
  plugin_type text,
  config_schema jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  price numeric DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.ai_semantic_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  query text,
  query_embedding vector,
  answer text,
  similarity_threshold double precision DEFAULT 0.85,
  hit_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_session_memory (
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  context jsonb,
  last_action text,
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval)
);
CREATE TABLE IF NOT EXISTS public.ai_summary_cache (
---SEGMENT 2---
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  query_hash text NOT NULL,
  original_query text,
  context_hash text,
  summary text,
  usage_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_voice_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  user_id uuid,
  audio_url text,
  transcript text,
  detected_intent text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_websites (
  id text NOT NULL DEFAULT ('site_'::text || substr(md5((random())::text), 1, 16)),
  user_id uuid NOT NULL,
  business_id uuid,
  website_name text NOT NULL,
  website_type text NOT NULL,
  design_style text NOT NULL DEFAULT 'modern'::text,
  schema jsonb NOT NULL,
  rendered_html jsonb,
  page_count integer DEFAULT 1,
  is_published boolean DEFAULT false,
  deployed_url text,
  deployment_platform text,
  deployed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.api_keys (
  api_key_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  api_key_hash text,
  scope text,
  rate_limit integer DEFAULT 1000,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.api_rate_limit (
  ip text NOT NULL,
  nid_hash text NOT NULL,
  hit_count integer DEFAULT 1,
  window_start timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.api_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  route_code text NOT NULL,
  http_method text NOT NULL,
  template_code text NOT NULL,
  table_name text NOT NULL,
  allow_read boolean DEFAULT true,
  allow_create boolean DEFAULT false,
  allow_update boolean DEFAULT false,
  allow_delete boolean DEFAULT false,
  requires_auth boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.auth_identity (
  id bigint NOT NULL DEFAULT nextval('auth_identity_id_seq'::regclass),
  email_hash text NOT NULL,
  phone_hash text NOT NULL,
  password_hash text NOT NULL,
  otp_hash text,
  otp_expiry timestamp without time zone,
  verified_email boolean DEFAULT false,
  verified_phone boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_automation_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  industry text,
  category text,
  business_size text,
  description text,
  enabled_modules jsonb,
  enabled_functions jsonb,
  maturity_level text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_branding (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  app_name text,
  logo_url text,
  favicon_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  theme_mode text,
  font_family text,
  custom_css text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email_sender_name text,
  email_logo_url text,
  email_footer text
);
CREATE TABLE IF NOT EXISTS public.business_data_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  source_type text,
  connection_config jsonb,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  doc_title text,
  doc_content text,
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  file_path text,
  public_url text,
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  changed_by uuid,
  doc_kind text
);
CREATE TABLE IF NOT EXISTS public.business_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  domain text NOT NULL,
  verified boolean DEFAULT false,
  ssl_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_functions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  function_code text,
  function_name text,
  module text,
  description text,
  rules jsonb,
  required_permissions jsonb,
  input_schema jsonb,
  output_schema jsonb,
  is_system boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  business_id uuid
);
CREATE TABLE IF NOT EXISTS public.business_labels (
  business_id uuid NOT NULL,
  label_key text NOT NULL,
  custom_text text,
  language_code text
);
CREATE TABLE IF NOT EXISTS public.business_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  module_name text NOT NULL,
  table_name text NOT NULL,
  fields jsonb NOT NULL,
  relationships jsonb,
  created_at timestamp with time zone DEFAULT now(),
  prompt text,
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  changed_by uuid
);
CREATE TABLE IF NOT EXISTS public.business_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  module_code text NOT NULL,
  module_name text NOT NULL,
  module_type text,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_plugins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  plugin_id uuid,
  status text DEFAULT 'active'::text,
  installed_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  plan_id uuid,
  status text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  auto_renew boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
---SEGMENT 3---
  template_code text NOT NULL,
  is_default boolean DEFAULT false,
  is_enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  role_id uuid,
  is_owner boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  biz_name text NOT NULL,
  industry text,
  owner_id text NOT NULL,
  schema_name text,
  created_at timestamp with time zone DEFAULT now(),
  biz_slug text,
  tier_id uuid,
  email text,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  changed_by uuid,
  category text,
  business_size text,
  module_selection jsonb,
  acquisition_source text,
  gst_no text,
  biz_id text,
  default_template_code text DEFAULT 'BUSINESS_OVERVIEW'::text
);
CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  user_id uuid
);
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  company_name text,
  status text DEFAULT 'lead'::text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  website text
);
CREATE TABLE IF NOT EXISTS public.column_role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  role_id uuid NOT NULL,
  registry_id uuid NOT NULL,
  can_view boolean DEFAULT true,
  can_filter boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.dashboard_kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  kpi_code text NOT NULL,
  title text NOT NULL,
  template_code text NOT NULL,
  table_name text NOT NULL,
  metric_type text NOT NULL,
  metric_column text,
  group_by_column text,
  date_column text,
  filter_json jsonb DEFAULT '{}'::jsonb,
  chart_type text DEFAULT 'number'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  role_id uuid,
  layout_name text,
  grid_json jsonb,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  template_id uuid,
  widget_type text NOT NULL,
  title text NOT NULL,
  query_template text,
  config jsonb DEFAULT '{}'::jsonb,
  position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.data_model_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  module text,
  table_name text,
  column_name text,
  data_type text,
  column_alt_name jsonb,
  is_nullable boolean,
  is_primary_key boolean DEFAULT false,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  is_ai_enabled boolean DEFAULT true,
  is_vector_enabled boolean DEFAULT false,
  is_system_table boolean DEFAULT false,
  display_name text,
  category text,
  sync_priority integer DEFAULT 10,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  template_code text,
  is_visible boolean DEFAULT true,
  is_required boolean DEFAULT false,
  is_filterable boolean DEFAULT false,
  display_order integer DEFAULT 0,
  ui_component text DEFAULT 'text'::text,
  default_value jsonb,
  is_system boolean DEFAULT false,
  is_sortable boolean,
  ui_label text,
  input_type text,
  validation_rule text,
  data_source_id uuid
);
CREATE TABLE IF NOT EXISTS public.data_model_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  parent_table text NOT NULL,
  parent_column text NOT NULL,
  child_table text NOT NULL,
  child_column text NOT NULL,
  relation_type text DEFAULT 'ONE_TO_MANY'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.device_registry (
  id bigint NOT NULL DEFAULT nextval('device_registry_id_seq'::regclass),
  user_id uuid,
  fingerprint text,
  trust_score integer DEFAULT 50,
  last_seen timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  device_id text,
  refresh_token text,
  last_seen timestamp with time zone,
  is_active boolean DEFAULT true,
  ip_address text,
  user_agent text
);
CREATE TABLE IF NOT EXISTS public.dharma_rules (
  rule_id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_name text,
  source_type text,
  principle text,
  severity_level integer DEFAULT 1,
  karma_impact integer,
  trust_impact integer,
  is_global boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.domain_resolver (
  domain text,
  business_id uuid,
  app_name text
);
CREATE TABLE IF NOT EXISTS public.enterprise_org (
  org_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  org_name text,
  plan text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.function_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  industry text,
  module_code text,
  function_code text,
  description text,
  default_roles text[],
  default_permissions text[],
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.geography_columns (
  f_table_catalog name,
  f_table_schema name,
---SEGMENT 4---
  f_table_name name,
  f_geography_column name,
  coord_dimension integer,
  srid integer,
  type text
);
CREATE TABLE IF NOT EXISTS public.geometry_columns (
  f_table_catalog character varying,
  f_table_schema name,
  f_table_name name,
  f_geometry_column name,
  coord_dimension integer,
  srid integer,
  type character varying
);
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  source_type text,
  source_url text,
  status text DEFAULT 'pending'::text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.ingestion_raw_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid,
  owner_id uuid,
  content text,
  source_type text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  client_id uuid,
  amount numeric,
  status text DEFAULT 'pending'::text,
  due_date date,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.marketplace_installs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  marketplace_template_id uuid,
  user_id uuid,
  business_id uuid,
  installed_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.marketplace_public (
  id uuid,
  template_id uuid,
  owner_id uuid,
  title text,
  description text,
  category text,
  industry text,
  price numeric,
  is_free boolean,
  rating numeric,
  installs integer,
  status text,
  preview_images jsonb,
  tags text[],
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.marketplace_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid,
  owner_id uuid,
  title text NOT NULL,
  description text,
  category text,
  industry text,
  price numeric DEFAULT 0,
  is_free boolean DEFAULT false,
  rating numeric DEFAULT 0,
  installs integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  preview_images jsonb,
  tags text[],
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
  id integer NOT NULL DEFAULT nextval('n8n_chat_histories_id_seq'::regclass),
  session_id character varying NOT NULL,
  message jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS public.node_ai_brain (
  brain_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  model_type text DEFAULT 'RULE+VECTOR'::text,
  confidence_score integer DEFAULT 50,
  last_decision text,
  updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_ai_cache (
  cache_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  input_hash text,
  output_data bytea,
  model text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_ai_input (
  input_id bigint NOT NULL DEFAULT nextval('node_ai_input_input_id_seq'::regclass),
  nid_hash text,
  input_type text,
  payload jsonb,
  processed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_ai_key_vault (
  key_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  provider text,
  encrypted_api_key bytea,
  usage_scope text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_ai_task_queue (
  id bigint NOT NULL DEFAULT nextval('node_ai_task_queue_id_seq'::regclass),
  nid_hash text,
  task_type text,
  payload jsonb,
  status text DEFAULT 'PENDING'::text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_api_keys (
  key_id uuid NOT NULL DEFAULT gen_random_uuid(),
  api_key_hash text NOT NULL,
  owner text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_audit_log (
  id bigint NOT NULL DEFAULT nextval('node_audit_log_id_seq'::regclass),
  node_hash text,
  action_type text,
  purpose text,
  old_hash text,
  new_hash text,
  actor_hash text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_billing_rules (
  rule_id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_type text,
  base_rate numeric,
  karma_multiplier numeric DEFAULT 1,
  trust_discount numeric DEFAULT 0,
  active boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_category_master (
  category_code text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.node_core (
  row_id bigint NOT NULL DEFAULT nextval('node_core_row_id_seq'::regclass),
  owner_id uuid NOT NULL,
  nid_hash text NOT NULL,
  dna_blob bytea NOT NULL,
  field_map bytea NOT NULL,
  perm_blob bytea NOT NULL,
  rule_blob bytea NOT NULL,
  runtime_blob bytea NOT NULL,
  memory_blob bytea NOT NULL,
  ui_blob bytea NOT NULL,
  sys_blob bytea NOT NULL,
  vec_embedding vector,
  state_hash text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  parent_nid_hash text,
  node_depth integer DEFAULT 0,
  is_archived boolean DEFAULT false,
  archived_at timestamp without time zone,
  karma_score integer DEFAULT 0,
  trust_score integer DEFAULT 50,
  reputation_level text DEFAULT 'NEW'::text,
  node_state text DEFAULT 'ACTIVE'::text,
  valid_until timestamp without time zone,
  can_execute boolean DEFAULT true,
  can_update boolean DEFAULT true,
  external_access boolean DEFAULT true,
  health_score integer DEFAULT 100,
  last_check timestamp without time zone,
  sleep_after timestamp without time zone,
  wakeup_at timestamp without time zone,
  is_cold boolean DEFAULT false,
  wallet_id uuid,
  experience_level integer DEFAULT 0,
  exposure_mode text DEFAULT 'PRIVATE'::text,
  pin_hash text,
  pin_expiry timestamp without time zone,
  is_activated boolean DEFAULT false,
  device_fingerprint text,
  qr_token_hash text,
  qr_expiry timestamp without time zone,
---SEGMENT 5---
  recovery_qr_hash text,
  recovery_expiry timestamp without time zone,
  sync_version integer DEFAULT 1,
  last_sync_at timestamp without time zone,
  node_type node_type_enum DEFAULT 'living'::node_type_enum,
  node_system_prompt text,
  prompt_version integer DEFAULT 1,
  prompt_last_update timestamp without time zone,
  hot_cache boolean DEFAULT false,
  latitude double precision,
  longitude double precision,
  encryption_key_ref uuid,
  privacy_mode privacy_mode_enum NOT NULL DEFAULT 'CORE_ONLY'::privacy_mode_enum,
  permission_scope permission_scope_enum DEFAULT 'READ'::permission_scope_enum,
  task_status task_status_enum DEFAULT 'PENDING'::task_status_enum,
  status tx_status_enum DEFAULT 'PENDING'::tx_status_enum
);
CREATE TABLE IF NOT EXISTS public.node_devices (
  device_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  device_fingerprint text,
  device_name text,
  is_primary boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  trust_score integer DEFAULT 50,
  last_seen timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.node_dharma_log (
  log_id bigint NOT NULL DEFAULT nextval('node_dharma_log_log_id_seq'::regclass),
  nid_hash text,
  action_type text,
  matched_principle text,
  karma_applied integer,
  trust_applied integer,
  verdict text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_dharma_profile (
  nid_hash text NOT NULL,
  rule_id uuid NOT NULL,
  priority_weight integer DEFAULT 1,
  enabled boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_event_queue (
  event_id bigint NOT NULL DEFAULT nextval('node_event_queue_event_id_seq'::regclass),
  nid_hash text,
  event_type text,
  payload jsonb,
  processed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  status text DEFAULT 'PENDING'::text,
  prev_hash text,
  event_hash text,
  payload_enc bytea
);
CREATE TABLE IF NOT EXISTS public.node_execution_log (
  exec_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  action_name text,
  requester uuid,
  execution_type text,
  status text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_external_actions (
  action_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  action_name text,
  created_by uuid,
  allowed_roles text[],
  requires_approval boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_failure_log (
  id bigint NOT NULL DEFAULT nextval('node_failure_log_id_seq'::regclass),
  nid_hash text,
  error_msg text,
  occurred_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_federation (
  federation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  remote_server text,
  sync_token text,
  last_sync timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.node_federation_peers (
  peer_id uuid NOT NULL DEFAULT gen_random_uuid(),
  peer_url text,
  api_key_hash text,
  trust_score integer DEFAULT 50,
  active boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_federation_queue (
  id bigint NOT NULL DEFAULT nextval('node_federation_queue_id_seq'::regclass),
  nid_hash text,
  payload jsonb,
  status text DEFAULT 'PENDING'::text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_gateway_ips (
  ip text NOT NULL,
  description text,
  enabled boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_gateway_nonce (
  nonce text NOT NULL,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_group (
  group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  group_name text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_group_member (
  group_id uuid NOT NULL,
  member_owner_id uuid NOT NULL,
  role text,
  joined_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_handshake_log (
  handshake_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  owner_id uuid,
  action_type text,
  request_hash text,
  response_hash text,
  ai_provider text,
  execution_time_ms integer,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_hardware (
  hardware_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  serial_no text,
  hardware_type text,
  public_key text,
  is_active boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_internal_actions (
  action_code text NOT NULL,
  description text,
  auto_allowed boolean DEFAULT true,
  system_only boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_karma_log (
  log_id bigint NOT NULL DEFAULT nextval('node_karma_log_log_id_seq'::regclass),
  nid_hash text NOT NULL,
  actor_owner_id uuid,
  action_type text,
  karma_delta integer,
  trust_delta integer,
  reason text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_key_vault (
  vault_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  encrypted_key bytea,
  key_version integer DEFAULT 1,
  created_at timestamp without time zone DEFAULT now(),
  nid_hash text
);
CREATE TABLE IF NOT EXISTS public.node_load_state (
  nid_hash text NOT NULL,
  active_jobs integer DEFAULT 0,
  last_update timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_marketplace (
  template_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  template_name text,
  category text,
  encrypted_template bytea,
  price numeric DEFAULT 0,
  downloads integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_mobile_session (
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  device_id text,
  expires_at timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.node_offline_queue (
  queue_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  action_type text,
  payload jsonb,
  synced boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_perm_index (
  token_hash text NOT NULL,
  node_nid_hash text,
  requester_hash text,
  valid_until timestamp without time zone,
---SEGMENT 6---
  scope text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_permission (
  perm_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text NOT NULL,
  owner_id uuid NOT NULL,
  target_owner_id uuid,
  permission_type text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  valid_from timestamp without time zone DEFAULT now(),
  valid_until timestamp without time zone,
  is_revoked boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_permission_effective (
  nid_hash text,
  target_owner_id uuid,
  can_read boolean,
  can_write boolean,
  can_delete boolean
);
CREATE TABLE IF NOT EXISTS public.node_permission_log (
  log_id bigint NOT NULL DEFAULT nextval('node_permission_log_log_id_seq'::regclass),
  nid_hash text,
  owner_id uuid,
  action text,
  target_owner_id uuid,
  event_time timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_plugin_access (
  nid_hash text,
  plugin_id uuid,
  allowed boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_plugin_store (
  plugin_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  author text,
  api_endpoint text,
  verified boolean DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.node_prompt_registry (
  registry_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  prompt_type text,
  encrypted_prompt bytea,
  prompt_hash text,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_prompt_store (
  nid_hash text NOT NULL,
  encrypted_prompt bytea,
  prompt_hash text,
  version integer DEFAULT 1,
  updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_public_link (
  link_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text NOT NULL,
  token_hash text NOT NULL,
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  expires_at timestamp without time zone,
  is_disabled boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_rate_card (
  rate_id uuid NOT NULL DEFAULT gen_random_uuid(),
  experience_level integer,
  per_hour_rate numeric,
  currency text DEFAULT 'NODE'::text
);
CREATE TABLE IF NOT EXISTS public.node_region_registry (
  region text NOT NULL,
  api_endpoint text,
  active boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_replication_queue (
  id bigint NOT NULL DEFAULT nextval('node_replication_queue_id_seq'::regclass),
  nid_hash text,
  payload jsonb,
  target_region text,
  status text DEFAULT 'PENDING'::text
);
CREATE TABLE IF NOT EXISTS public.node_reputation (
  nid_hash text NOT NULL,
  ai_score integer DEFAULT 50,
  last_analysis timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.node_responsibility (
  nid_hash text NOT NULL,
  owner_id uuid NOT NULL,
  responsibility_type text,
  liability_percent integer
);
CREATE TABLE IF NOT EXISTS public.node_rule_master (
  rule_id integer NOT NULL DEFAULT nextval('node_rule_master_rule_id_seq'::regclass),
  rule_code text,
  rule_name text,
  rule_layer text,
  rule_group text,
  is_locked boolean DEFAULT false,
  update_frequency text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_runtime_session (
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text NOT NULL,
  device_fingerprint text,
  ip_address text,
  trust_snapshot integer,
  karma_snapshot integer,
  created_at timestamp without time zone DEFAULT now(),
  expires_at timestamp without time zone,
  active boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.node_task_queue (
  task_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  task_type text,
  payload jsonb,
  status text DEFAULT 'PENDING'::text,
  scheduled_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.node_time_billing (
  bill_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  owner_id uuid,
  minutes_used integer,
  rate_per_hour numeric,
  total_amount numeric,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_transaction (
  tx_id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_wallet uuid,
  to_wallet uuid,
  amount numeric,
  purpose text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_trust_state (
  nid_hash text NOT NULL,
  trust_score integer DEFAULT 50,
  karma_score integer DEFAULT 0,
  last_update timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_usage_billing (
  billing_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nid_hash text,
  task_id uuid,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  total_minutes integer,
  rate_per_hour numeric,
  total_cost numeric,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.node_wallet (
  wallet_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'NODE'::text,
  updated_at timestamp without time zone DEFAULT now(),
  nid_hash text
);
CREATE TABLE IF NOT EXISTS public.org_node_map (
  org_id uuid NOT NULL,
  nid_hash text NOT NULL,
  role text
);
CREATE TABLE IF NOT EXISTS public.otp_store (
  id bigint NOT NULL DEFAULT nextval('otp_store_id_seq'::regclass),
  mobile text,
  otp text,
  expires_at timestamp without time zone,
  verified boolean DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.owner (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mobile text NOT NULL,
  mobile_hash text NOT NULL,
  email text,
  email_hash text,
  password_hash text,
  otp_hash text,
  otp_expiry timestamp without time zone,
  is_verified boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.owner_key_vault (
  owner_id uuid NOT NULL,
  public_key text,
---SEGMENT 7---
  encrypted_private_key bytea,
  key_hash text,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.owner_wallet (
  wallet_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  public_key text NOT NULL,
  wallet_type text DEFAULT 'NODE'::text,
  is_custodial boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.password_reset_store (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reset_token text NOT NULL,
  otp_code text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid,
  amount numeric,
  method text,
  paid_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  code text NOT NULL,
  module text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  function text,
  description text
);
CREATE TABLE IF NOT EXISTS public.plan_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid,
  feature_key text,
  allowed boolean DEFAULT true,
  limit_value integer
);
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  price numeric NOT NULL,
  currency text DEFAULT 'INR'::text,
  billing_cycle text,
  max_users integer,
  max_businesses integer,
  max_templates integer,
  api_calls_limit integer,
  storage_limit_gb integer,
  ai_tokens_limit integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.plugin_permissions (
  plugin_id uuid NOT NULL,
  role_id uuid NOT NULL,
  can_execute boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_name text,
  client_name text,
  status text,
  start_date date,
  end_date date,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.query_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  cache_key text NOT NULL,
  response jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.query_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  template_code text NOT NULL,
  name text NOT NULL,
  base_table text NOT NULL,
  allowed_columns jsonb,
  allowed_filters jsonb,
  allowed_joins jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  is_system_default boolean DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL
);
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  role_name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  alert_type text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.security_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_code text,
  is_enabled boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  name text NOT NULL,
  billing_type text,
  base_price numeric,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.spatial_ref_sys (
  srid integer NOT NULL,
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying
);
CREATE TABLE IF NOT EXISTS public.sprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  sprint_name text,
  start_date date,
  end_date date,
  status text
);
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_code text,
  plan_name text,
  price_monthly numeric,
  price_yearly numeric,
  max_users integer,
  max_businesses integer,
  ai_queries_limit integer,
  storage_gb integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_fee numeric DEFAULT 0,
  monthly_price numeric DEFAULT 0,
  chat_limit integer NOT NULL,
  upload_limit_mb integer NOT NULL,
  module_limit integer NOT NULL,
  db_storage_limit_mb integer DEFAULT 10,
  is_custom boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  changed_by uuid
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  client_id uuid,
  service_id uuid,
  plan_name text,
  amount numeric,
  billing_cycle text,
  status text DEFAULT 'active'::text,
  started_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.system_mode (
  id integer NOT NULL DEFAULT 1,
  mode text DEFAULT 'TEST'::text,
  admin_lock boolean DEFAULT true,
  allow_prompt_edit boolean DEFAULT true,
  allow_rule_override boolean DEFAULT true,
  updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.system_permissions (
  code text NOT NULL,
  description text,
  module text,
  function text NOT NULL DEFAULT 'GENERAL'::text
);
CREATE TABLE IF NOT EXISTS public.system_prompt_templates (
  template_id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_name text,
  prompt_text text,
---SEGMENT 8---
  is_default boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.system_role_permissions (
  role_name text NOT NULL,
  permission_code text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.system_roles (
  role_name text NOT NULL,
  description text
);
CREATE TABLE IF NOT EXISTS public.table_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  source_table text NOT NULL,
  source_column text NOT NULL,
  target_table text NOT NULL,
  target_column text NOT NULL,
  relation_type text DEFAULT 'many_to_one'::text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  description text,
  project_id uuid,
  sprint_id uuid,
  assigned_to uuid,
  priority text,
  status text,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.template_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  marketplace_template_id uuid,
  user_id uuid,
  rating integer,
  review text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.template_table_map (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_code text NOT NULL,
  table_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.template_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid,
  version_no integer NOT NULL,
  is_active boolean DEFAULT false,
  change_log text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ui_context_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  context jsonb,
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ui_function_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  function_code text,
  ui_type text,
  ui_framework text,
  template jsonb,
  rules jsonb,
  allowed_roles jsonb,
  required_permissions jsonb,
  is_system boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  business_id uuid
);
CREATE TABLE IF NOT EXISTS public.ui_labels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label_key text,
  default_text text,
  description text,
  language_code text DEFAULT 'EN'::text
);
CREATE TABLE IF NOT EXISTS public.ui_template_theme_map (
  template_id uuid NOT NULL,
  theme_id uuid NOT NULL
);
CREATE TABLE IF NOT EXISTS public.ui_template_widgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid,
  widget_type text,
  title text,
  data_source_template text,
  config jsonb,
  position jsonb,
  created_at timestamp with time zone DEFAULT now(),
  version_no integer DEFAULT 1
);
CREATE TABLE IF NOT EXISTS public.ui_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_code text,
  template_name text,
  business_id uuid,
  is_system boolean DEFAULT false,
  is_default_business boolean DEFAULT false,
  is_default_user boolean DEFAULT false,
  base_template_code text,
  layout jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  template_type text
);
CREATE TABLE IF NOT EXISTS public.ui_theme_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scope text,
  owner_id uuid,
  primary_color text,
  secondary_color text,
  font_family text,
  dark_mode boolean DEFAULT false,
  custom_css text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ui_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  theme_name text,
  is_default boolean DEFAULT false,
  colors jsonb,
  fonts jsonb,
  spacing jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ui_user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  template_id uuid,
  custom_layout jsonb,
  created_at timestamp with time zone DEFAULT now(),
  is_default boolean DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.ui_widget_layouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  template_id uuid NOT NULL,
  widget_id uuid NOT NULL,
  grid_x integer NOT NULL,
  grid_y integer NOT NULL,
  grid_w integer NOT NULL,
  grid_h integer NOT NULL,
  is_hidden boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  version_no integer DEFAULT 1
);
CREATE TABLE IF NOT EXISTS public.usage_meter (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  feature_code text,
  usage_count integer DEFAULT 0,
  period_start timestamp with time zone DEFAULT date_trunc('month'::text, now()),
  period_end timestamp with time zone DEFAULT (date_trunc('month'::text, now()) + '1 mon'::interval)
);
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  metric_key text,
  used_value integer DEFAULT 0,
  period_start timestamp with time zone,
  period_end timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  consent_type text,
  accepted boolean,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_labels (
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  label_key text NOT NULL,
  custom_text text
);
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  default_template_code text,
  theme text DEFAULT 'light'::text,
  language text DEFAULT 'en'::text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  template_code text NOT NULL,
  is_default boolean DEFAULT false,
---SEGMENT 9---
  layout jsonb DEFAULT '{}'::jsonb,
  filters jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_theme_preferences (
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  theme_id uuid
);
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  telegram_id text,
  email text,
  full_name text,
  business_name text,
  industry text,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  business_id uuid,
  user_type text,
  mobile text,
  whatsapp text,
  password text,
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  changed_by uuid,
  role text,
  email_hash text,
  mobile_hash text,
  is_verified boolean DEFAULT false,
  last_login timestamp without time zone,
  bio_hash text,
  pass_hash text
);
CREATE TABLE IF NOT EXISTS public.vector_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid,
  business_id uuid NOT NULL,
  chunk_index integer,
  content text NOT NULL,
  embedding vector,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.vector_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  source_type text,
  source_name text,
  source_uri text,
  module text,
  access_roles text[],
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid,
  direction text,
  message_type text,
  content text,
  raw_payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  phone_number text,
  user_id uuid,
  started_at timestamp with time zone DEFAULT now(),
  last_seen timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.work_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  client_id uuid,
  service_id uuid,
  status text DEFAULT 'new'::text,
  start_date date,
  end_date date,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.admin_session ADD CONSTRAINT admin_session_pkey PRIMARY KEY (session_id);
ALTER TABLE public.admin_test_controls ADD CONSTRAINT admin_test_controls_pkey PRIMARY KEY (control_id);
ALTER TABLE public.ai_action_logs ADD CONSTRAINT ai_action_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_action_requests ADD CONSTRAINT ai_action_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_action_whitelist ADD CONSTRAINT ai_action_whitelist_pkey PRIMARY KEY (table_name);
ALTER TABLE public.ai_agent_rules ADD CONSTRAINT ai_agent_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_agent_templates ADD CONSTRAINT ai_agent_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_app_requests ADD CONSTRAINT ai_app_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_chat_messages ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_chat_sessions ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_dashboard_requests ADD CONSTRAINT ai_dashboard_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_generated_templates ADD CONSTRAINT ai_generated_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_knowledge_base ADD CONSTRAINT ai_knowledge_base_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_model_router ADD CONSTRAINT ai_model_router_pkey PRIMARY KEY (user_id);
ALTER TABLE public.ai_plugins ADD CONSTRAINT ai_plugins_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_semantic_cache ADD CONSTRAINT ai_semantic_cache_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_session_memory ADD CONSTRAINT ai_session_memory_pkey PRIMARY KEY (session_id);
ALTER TABLE public.ai_summary_cache ADD CONSTRAINT ai_summary_cache_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_voice_logs ADD CONSTRAINT ai_voice_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_websites ADD CONSTRAINT ai_websites_pkey PRIMARY KEY (id);
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_pkey PRIMARY KEY (api_key_id);
ALTER TABLE public.api_rate_limit ADD CONSTRAINT api_rate_limit_pkey PRIMARY KEY (ip, nid_hash);
ALTER TABLE public.api_routes ADD CONSTRAINT api_routes_pkey PRIMARY KEY (id);
ALTER TABLE public.auth_identity ADD CONSTRAINT auth_identity_pkey PRIMARY KEY (id);
ALTER TABLE public.business_automation_profiles ADD CONSTRAINT business_automation_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.business_branding ADD CONSTRAINT business_branding_pkey PRIMARY KEY (id);
ALTER TABLE public.business_data_sources ADD CONSTRAINT business_data_sources_pkey PRIMARY KEY (id);
ALTER TABLE public.business_documents ADD CONSTRAINT business_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.business_domains ADD CONSTRAINT business_domains_pkey PRIMARY KEY (id);
ALTER TABLE public.business_functions ADD CONSTRAINT business_functions_pkey PRIMARY KEY (id);
ALTER TABLE public.business_labels ADD CONSTRAINT business_labels_pkey PRIMARY KEY (business_id, label_key);
ALTER TABLE public.business_metadata ADD CONSTRAINT business_metadata_pkey PRIMARY KEY (id);
ALTER TABLE public.business_modules ADD CONSTRAINT business_modules_pkey PRIMARY KEY (id);
ALTER TABLE public.business_plugins ADD CONSTRAINT business_plugins_pkey PRIMARY KEY (id);
ALTER TABLE public.business_subscriptions ADD CONSTRAINT business_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.business_templates ADD CONSTRAINT business_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.business_users ADD CONSTRAINT business_users_pkey PRIMARY KEY (id);
ALTER TABLE public.businesses ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_history ADD CONSTRAINT chat_history_pkey PRIMARY KEY (id);
ALTER TABLE public.clients ADD CONSTRAINT clients_pkey PRIMARY KEY (id);
ALTER TABLE public.column_role_permissions ADD CONSTRAINT column_role_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.dashboard_kpis ADD CONSTRAINT dashboard_kpis_pkey PRIMARY KEY (id);
ALTER TABLE public.dashboard_layouts ADD CONSTRAINT dashboard_layouts_pkey PRIMARY KEY (id);
ALTER TABLE public.dashboard_widgets ADD CONSTRAINT dashboard_widgets_pkey PRIMARY KEY (id);
ALTER TABLE public.data_model_registry ADD CONSTRAINT data_model_registry_pkey PRIMARY KEY (id);
ALTER TABLE public.data_model_relations ADD CONSTRAINT data_model_relations_pkey PRIMARY KEY (id);
ALTER TABLE public.device_sessions ADD CONSTRAINT device_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.dharma_rules ADD CONSTRAINT dharma_rules_pkey PRIMARY KEY (rule_id);
ALTER TABLE public.enterprise_org ADD CONSTRAINT enterprise_org_pkey PRIMARY KEY (org_id);
ALTER TABLE public.function_templates ADD CONSTRAINT function_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.ingestion_jobs ADD CONSTRAINT ingestion_jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.ingestion_raw_data ADD CONSTRAINT ingestion_raw_data_pkey PRIMARY KEY (id);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.marketplace_installs ADD CONSTRAINT marketplace_installs_pkey PRIMARY KEY (id);
ALTER TABLE public.marketplace_templates ADD CONSTRAINT marketplace_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.n8n_chat_histories ADD CONSTRAINT n8n_chat_histories_pkey PRIMARY KEY (id);
ALTER TABLE public.node_ai_brain ADD CONSTRAINT node_ai_brain_pkey PRIMARY KEY (brain_id);
ALTER TABLE public.node_ai_cache ADD CONSTRAINT node_ai_cache_pkey PRIMARY KEY (cache_id);
ALTER TABLE public.node_ai_input ADD CONSTRAINT node_ai_input_pkey PRIMARY KEY (input_id);
ALTER TABLE public.node_ai_key_vault ADD CONSTRAINT node_ai_key_vault_pkey PRIMARY KEY (key_id);
ALTER TABLE public.node_ai_task_queue ADD CONSTRAINT node_ai_task_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.node_api_keys ADD CONSTRAINT node_api_keys_pkey PRIMARY KEY (key_id);
ALTER TABLE public.node_audit_log ADD CONSTRAINT node_audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.node_billing_rules ADD CONSTRAINT node_billing_rules_pkey PRIMARY KEY (rule_id);
ALTER TABLE public.node_category_master ADD CONSTRAINT node_category_master_pkey PRIMARY KEY (category_code);
ALTER TABLE public.node_core ADD CONSTRAINT node_core_pkey PRIMARY KEY (row_id);
ALTER TABLE public.node_devices ADD CONSTRAINT node_devices_pkey PRIMARY KEY (device_id);
ALTER TABLE public.node_dharma_log ADD CONSTRAINT node_dharma_log_pkey PRIMARY KEY (log_id);
ALTER TABLE public.node_dharma_profile ADD CONSTRAINT node_dharma_profile_pkey PRIMARY KEY (nid_hash, rule_id);
ALTER TABLE public.node_event_queue ADD CONSTRAINT node_event_queue_pkey PRIMARY KEY (event_id);
ALTER TABLE public.node_execution_log ADD CONSTRAINT node_execution_log_pkey PRIMARY KEY (exec_id);
ALTER TABLE public.node_external_actions ADD CONSTRAINT node_external_actions_pkey PRIMARY KEY (action_id);
ALTER TABLE public.node_failure_log ADD CONSTRAINT node_failure_log_pkey PRIMARY KEY (id);
ALTER TABLE public.node_federation ADD CONSTRAINT node_federation_pkey PRIMARY KEY (federation_id);
ALTER TABLE public.node_federation_peers ADD CONSTRAINT node_federation_peers_pkey PRIMARY KEY (peer_id);
ALTER TABLE public.node_federation_queue ADD CONSTRAINT node_federation_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.node_gateway_ips ADD CONSTRAINT node_gateway_ips_pkey PRIMARY KEY (ip);
ALTER TABLE public.node_gateway_nonce ADD CONSTRAINT node_gateway_nonce_pkey PRIMARY KEY (nonce);
ALTER TABLE public.node_group ADD CONSTRAINT node_group_pkey PRIMARY KEY (group_id);
ALTER TABLE public.node_group_member ADD CONSTRAINT node_group_member_pkey PRIMARY KEY (group_id, member_owner_id);
ALTER TABLE public.node_handshake_log ADD CONSTRAINT node_handshake_log_pkey PRIMARY KEY (handshake_id);
ALTER TABLE public.node_hardware ADD CONSTRAINT node_hardware_pkey PRIMARY KEY (hardware_id);
ALTER TABLE public.node_internal_actions ADD CONSTRAINT node_internal_actions_pkey PRIMARY KEY (action_code);
ALTER TABLE public.node_karma_log ADD CONSTRAINT node_karma_log_pkey PRIMARY KEY (log_id);
ALTER TABLE public.node_key_vault ADD CONSTRAINT node_key_vault_pkey PRIMARY KEY (vault_id);
ALTER TABLE public.node_load_state ADD CONSTRAINT node_load_state_pkey PRIMARY KEY (nid_hash);
ALTER TABLE public.node_marketplace ADD CONSTRAINT node_marketplace_pkey PRIMARY KEY (template_id);
ALTER TABLE public.node_mobile_session ADD CONSTRAINT node_mobile_session_pkey PRIMARY KEY (token);
ALTER TABLE public.node_offline_queue ADD CONSTRAINT node_offline_queue_pkey PRIMARY KEY (queue_id);
ALTER TABLE public.node_perm_index ADD CONSTRAINT node_perm_index_pkey PRIMARY KEY (token_hash);
ALTER TABLE public.node_permission ADD CONSTRAINT node_permission_pkey PRIMARY KEY (perm_id);
ALTER TABLE public.node_permission_log ADD CONSTRAINT node_permission_log_pkey PRIMARY KEY (log_id);
ALTER TABLE public.node_plugin_store ADD CONSTRAINT node_plugin_store_pkey PRIMARY KEY (plugin_id);
ALTER TABLE public.node_prompt_registry ADD CONSTRAINT node_prompt_registry_pkey PRIMARY KEY (registry_id);
ALTER TABLE public.node_prompt_store ADD CONSTRAINT node_prompt_store_pkey PRIMARY KEY (nid_hash);
ALTER TABLE public.node_public_link ADD CONSTRAINT node_public_link_pkey PRIMARY KEY (link_id);
ALTER TABLE public.node_rate_card ADD CONSTRAINT node_rate_card_pkey PRIMARY KEY (rate_id);
ALTER TABLE public.node_region_registry ADD CONSTRAINT node_region_registry_pkey PRIMARY KEY (region);
ALTER TABLE public.node_replication_queue ADD CONSTRAINT node_replication_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.node_reputation ADD CONSTRAINT node_reputation_pkey PRIMARY KEY (nid_hash);
ALTER TABLE public.node_responsibility ADD CONSTRAINT node_responsibility_pkey PRIMARY KEY (nid_hash, owner_id);
ALTER TABLE public.node_rule_master ADD CONSTRAINT node_rule_master_pkey PRIMARY KEY (rule_id);
ALTER TABLE public.node_runtime_session ADD CONSTRAINT node_runtime_session_pkey PRIMARY KEY (session_id);
ALTER TABLE public.node_task_queue ADD CONSTRAINT node_task_queue_pkey PRIMARY KEY (task_id);
ALTER TABLE public.node_time_billing ADD CONSTRAINT node_time_billing_pkey PRIMARY KEY (bill_id);
ALTER TABLE public.node_transaction ADD CONSTRAINT node_transaction_pkey PRIMARY KEY (tx_id);
ALTER TABLE public.node_trust_state ADD CONSTRAINT node_trust_state_pkey PRIMARY KEY (nid_hash);
ALTER TABLE public.node_usage_billing ADD CONSTRAINT node_usage_billing_pkey PRIMARY KEY (billing_id);
ALTER TABLE public.node_wallet ADD CONSTRAINT node_wallet_pkey PRIMARY KEY (wallet_id);
ALTER TABLE public.org_node_map ADD CONSTRAINT org_node_map_pkey PRIMARY KEY (org_id, nid_hash);
ALTER TABLE public.otp_store ADD CONSTRAINT otp_store_pkey PRIMARY KEY (id);
ALTER TABLE public.owner ADD CONSTRAINT owner_pkey PRIMARY KEY (id);
ALTER TABLE public.owner_key_vault ADD CONSTRAINT owner_key_vault_pkey PRIMARY KEY (owner_id);
ALTER TABLE public.owner_wallet ADD CONSTRAINT owner_wallet_pkey PRIMARY KEY (wallet_id);
ALTER TABLE public.password_reset_store ADD CONSTRAINT password_reset_store_pkey PRIMARY KEY (id);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.plan_features ADD CONSTRAINT plan_features_pkey PRIMARY KEY (id);
---SEGMENT 10---
ALTER TABLE public.plans ADD CONSTRAINT plans_pkey PRIMARY KEY (id);
ALTER TABLE public.plugin_permissions ADD CONSTRAINT plugin_permissions_pkey PRIMARY KEY (plugin_id, role_id);
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE public.query_cache ADD CONSTRAINT query_cache_pkey PRIMARY KEY (id);
ALTER TABLE public.query_templates ADD CONSTRAINT query_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);
ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE public.security_alerts ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (id);
ALTER TABLE public.security_policies ADD CONSTRAINT security_policies_pkey PRIMARY KEY (id);
ALTER TABLE public.services ADD CONSTRAINT services_pkey PRIMARY KEY (id);
ALTER TABLE public.spatial_ref_sys ADD CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid);
ALTER TABLE public.sprints ADD CONSTRAINT sprints_pkey PRIMARY KEY (id);
ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);
ALTER TABLE public.subscription_tiers ADD CONSTRAINT subscription_tiers_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.system_mode ADD CONSTRAINT system_mode_pkey PRIMARY KEY (id);
ALTER TABLE public.system_permissions ADD CONSTRAINT system_permissions_pkey PRIMARY KEY (code);
ALTER TABLE public.system_prompt_templates ADD CONSTRAINT system_prompt_templates_pkey PRIMARY KEY (template_id);
ALTER TABLE public.system_role_permissions ADD CONSTRAINT system_role_permissions_pkey PRIMARY KEY (role_name, permission_code);
ALTER TABLE public.system_roles ADD CONSTRAINT system_roles_pkey PRIMARY KEY (role_name);
ALTER TABLE public.table_relationships ADD CONSTRAINT table_relationships_pkey PRIMARY KEY (id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.template_reviews ADD CONSTRAINT template_reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.template_table_map ADD CONSTRAINT template_table_map_pkey PRIMARY KEY (id);
ALTER TABLE public.template_versions ADD CONSTRAINT template_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_context_cache ADD CONSTRAINT ui_context_cache_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_function_templates ADD CONSTRAINT ui_function_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_labels ADD CONSTRAINT ui_labels_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_template_theme_map ADD CONSTRAINT ui_template_theme_map_pkey PRIMARY KEY (template_id, theme_id);
ALTER TABLE public.ui_template_widgets ADD CONSTRAINT ui_template_widgets_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_templates ADD CONSTRAINT ui_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_theme_settings ADD CONSTRAINT ui_theme_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_themes ADD CONSTRAINT ui_themes_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_user_preferences ADD CONSTRAINT ui_user_preferences_pkey PRIMARY KEY (id);
ALTER TABLE public.ui_widget_layouts ADD CONSTRAINT ui_widget_layouts_pkey PRIMARY KEY (id);
ALTER TABLE public.usage_meter ADD CONSTRAINT usage_meter_pkey PRIMARY KEY (id);
ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);
ALTER TABLE public.user_consents ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);
ALTER TABLE public.user_labels ADD CONSTRAINT user_labels_pkey PRIMARY KEY (user_id, business_id, label_key);
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);
ALTER TABLE public.user_templates ADD CONSTRAINT user_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.user_theme_preferences ADD CONSTRAINT user_theme_preferences_pkey PRIMARY KEY (user_id, business_id);
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.vector_chunks ADD CONSTRAINT vector_chunks_pkey PRIMARY KEY (id);
ALTER TABLE public.vector_documents ADD CONSTRAINT vector_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_messages ADD CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_sessions ADD CONSTRAINT whatsapp_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_app_requests ADD CONSTRAINT ai_app_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.ai_app_requests ADD CONSTRAINT ai_app_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.ai_websites ADD CONSTRAINT ai_websites_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_automation_profiles ADD CONSTRAINT business_automation_profiles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_branding ADD CONSTRAINT business_branding_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_documents ADD CONSTRAINT business_documents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_domains ADD CONSTRAINT business_domains_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_functions ADD CONSTRAINT business_functions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_metadata ADD CONSTRAINT business_metadata_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_subscriptions ADD CONSTRAINT business_subscriptions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_subscriptions ADD CONSTRAINT business_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);
ALTER TABLE public.business_templates ADD CONSTRAINT business_templates_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_users ADD CONSTRAINT business_users_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.business_users ADD CONSTRAINT business_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public.businesses ADD CONSTRAINT businesses_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.subscription_tiers(id);
ALTER TABLE public.chat_history ADD CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.clients ADD CONSTRAINT clients_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.column_role_permissions ADD CONSTRAINT column_role_permissions_registry_id_fkey FOREIGN KEY (registry_id) REFERENCES public.data_model_registry(id);
ALTER TABLE public.dashboard_widgets ADD CONSTRAINT dashboard_widgets_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.dashboard_widgets ADD CONSTRAINT dashboard_widgets_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.ui_templates(id);
ALTER TABLE public.data_model_registry ADD CONSTRAINT data_model_registry_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE public.marketplace_installs ADD CONSTRAINT marketplace_installs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.marketplace_installs ADD CONSTRAINT marketplace_installs_marketplace_template_id_fkey FOREIGN KEY (marketplace_template_id) REFERENCES public.marketplace_templates(id);
ALTER TABLE public.marketplace_installs ADD CONSTRAINT marketplace_installs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.marketplace_templates ADD CONSTRAINT marketplace_templates_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);
ALTER TABLE public.marketplace_templates ADD CONSTRAINT marketplace_templates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.ui_templates(id);
ALTER TABLE public.node_core ADD CONSTRAINT fk_node_owner FOREIGN KEY (owner_id) REFERENCES public.owner(id);
ALTER TABLE public.node_wallet ADD CONSTRAINT fk_node_wallet_core FOREIGN KEY (nid_hash) REFERENCES public.node_core(nid_hash);
ALTER TABLE public.owner_wallet ADD CONSTRAINT owner_wallet_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);
ALTER TABLE public.permissions ADD CONSTRAINT fk_permissions_business FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.plan_features ADD CONSTRAINT plan_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public.roles ADD CONSTRAINT fk_roles_business FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.services ADD CONSTRAINT services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);
ALTER TABLE public.system_role_permissions ADD CONSTRAINT system_role_permissions_permission_code_fkey FOREIGN KEY (permission_code) REFERENCES public.system_permissions(code);
ALTER TABLE public.system_role_permissions ADD CONSTRAINT system_role_permissions_role_name_fkey FOREIGN KEY (role_name) REFERENCES public.system_roles(role_name);
ALTER TABLE public.template_reviews ADD CONSTRAINT template_reviews_marketplace_template_id_fkey FOREIGN KEY (marketplace_template_id) REFERENCES public.marketplace_templates(id);
ALTER TABLE public.template_reviews ADD CONSTRAINT template_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.template_versions ADD CONSTRAINT template_versions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.ui_templates(id);
ALTER TABLE public.ui_function_templates ADD CONSTRAINT ui_function_templates_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.ui_function_templates ADD CONSTRAINT ui_function_templates_function_code_fkey FOREIGN KEY (function_code) REFERENCES public.business_functions(function_code);
ALTER TABLE public.ui_template_theme_map ADD CONSTRAINT ui_template_theme_map_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.ui_templates(id);
ALTER TABLE public.ui_template_theme_map ADD CONSTRAINT ui_template_theme_map_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.ui_themes(id);
ALTER TABLE public.ui_template_widgets ADD CONSTRAINT ui_template_widgets_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.ui_templates(id);
ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.user_templates ADD CONSTRAINT user_templates_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.users ADD CONSTRAINT users_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.vector_chunks ADD CONSTRAINT vector_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.vector_documents(id);
ALTER TABLE public.vector_documents ADD CONSTRAINT vector_documents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);
COMMIT;