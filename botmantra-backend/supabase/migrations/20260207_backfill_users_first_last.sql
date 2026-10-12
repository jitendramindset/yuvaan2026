-- ═══════════════════════════════════════════════════════════════════════════════
-- Backfill users first/last name from full_name
-- Created: 2026-02-07
-- Purpose: Populate users.first_name/last_name for existing records
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.users
SET
  first_name = COALESCE(first_name, NULLIF(split_part(full_name, ' ', 1), '')),
  last_name = COALESCE(
    last_name,
    NULLIF(trim(regexp_replace(full_name, '^\S+\s*', '')), '')
  )
WHERE (first_name IS NULL OR last_name IS NULL)
  AND full_name IS NOT NULL;
