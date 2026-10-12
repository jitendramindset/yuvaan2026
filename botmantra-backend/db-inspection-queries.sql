-- Database inspection queries (PostgreSQL)
-- Run these in your Supabase SQL Editor

-- 1) List all columns for all user tables
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY table_schema, table_name;

-- 2) List functions and source
SELECT proname, prosrc
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE nspname NOT IN ('pg_catalog','information_schema');

-- 3) List policies (RLS)
SELECT *
FROM pg_policies;
