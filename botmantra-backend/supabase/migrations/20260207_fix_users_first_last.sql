-- ═══════════════════════════════════════════════════════════════════════════════
-- Users first/last name columns fix
-- Created: 2026-02-07
-- Purpose: Add users.first_name and users.last_name expected by onboarding
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;
