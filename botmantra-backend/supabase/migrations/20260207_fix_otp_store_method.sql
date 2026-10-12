-- ═══════════════════════════════════════════════════════════════════════════════
-- OTP store method column fix
-- Created: 2026-02-07
-- Purpose: Add missing otp_store.method column expected by API
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS public.otp_store
  ADD COLUMN IF NOT EXISTS method text;
