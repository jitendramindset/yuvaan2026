-- ═══════════════════════════════════════════════════════════════════════════════
-- Auth columns fix
-- Created: 2026-02-07
-- Purpose: Add missing auth columns expected by API
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS auth_method text;

ALTER TABLE IF EXISTS public.otp_store
  ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
