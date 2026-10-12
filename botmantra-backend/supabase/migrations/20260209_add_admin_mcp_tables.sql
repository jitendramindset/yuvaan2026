-- Admin MCP control tables

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  role text,
  brand_context text,
  is_super_admin boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_admin_profiles_user_id on public.admin_profiles (user_id);

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action text,
  payload jsonb,
  status text,
  created_at timestamptz default now()
);
create index if not exists idx_admin_action_logs_admin_id on public.admin_action_logs (admin_id);

create table if not exists public.admin_memory_vectors (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  content text,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_admin_memory_vectors_admin_id on public.admin_memory_vectors (admin_id);

create table if not exists public.ui_schemas (
  id uuid primary key default gen_random_uuid(),
  brand text,
  template_code text,
  layout jsonb,
  widgets jsonb,
  theme jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_ui_schemas_template_code on public.ui_schemas (template_code);
