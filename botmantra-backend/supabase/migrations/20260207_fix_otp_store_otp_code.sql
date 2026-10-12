-- ═══════════════════════════════════════════════════════════════════════════════
-- OTP store otp_code column fix
-- Created: 2026-02-07
-- Purpose: Add missing otp_store.otp_code column expected by API
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS public.otp_store
  ADD COLUMN IF NOT EXISTS otp_code text;
