-- Add onboarding-related tables required by routes-onboarding-kernel

create table if not exists public.node_identity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  brand text,
  created_at timestamptz default now(),
  device_fingerprint text,
  ip_address text,
  user_agent text,
  is_first_login boolean default true
);
create index if not exists idx_node_identity_user_id on public.node_identity (user_id);

create table if not exists public.trust_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  brand text,
  trust_score int default 50,
  is_verified boolean default false,
  is_mfa_enabled boolean default false,
  is_enterprise boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_trust_state_user_id on public.trust_state (user_id);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.referral_logs (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid,
  referred_user_id uuid,
  code_id uuid,
  brand text,
  created_at timestamptz default now()
);
create index if not exists idx_referral_logs_referred_user on public.referral_logs (referred_user_id);

create table if not exists public.reward_wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  reward_type text,
  amount numeric,
  description text,
  brand text,
  created_at timestamptz default now()
);
create index if not exists idx_reward_wallet_user_id on public.reward_wallet (user_id);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  onboarding_preference text,
  company_name text,
  industry text,
  business_goal text,
  team_size int,
  updated_at timestamptz default now()
);
create index if not exists idx_user_profiles_user_id on public.user_profiles (user_id);

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  company_name text,
  industry text,
  business_stage text,
  updated_at timestamptz default now()
);
create index if not exists idx_business_profiles_user_id on public.business_profiles (user_id);

create table if not exists public.onboarding_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  brand text,
  intent text,
  user_message text,
  extracted_data jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_onboarding_conversations_user_id on public.onboarding_conversations (user_id);

create table if not exists public.ai_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  preferences jsonb,
  updated_at timestamptz default now()
);
create index if not exists idx_ai_preferences_user_id on public.ai_preferences (user_id);

create table if not exists public.karma_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  points int,
  description text,
  created_at timestamptz default now()
);
create index if not exists idx_karma_ledger_user_id on public.karma_ledger (user_id);

create table if not exists public.feature_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  feature text,
  is_unlocked boolean default false,
  unlocked_by text,
  unlocked_at timestamptz
);
create index if not exists idx_feature_access_user_id on public.feature_access (user_id);
