-- Migration: Fix hash generation functions (generate_node_id, generate_node_hash)
-- This fixes the "function digest(text, unknown) does not exist" error
-- Run this in your Supabase SQL editor or database console

-- Enable the pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Alternative: If pgcrypto is not available, create custom hash functions
-- Uncomment the following if pgcrypto cannot be enabled:

-- CREATE OR REPLACE FUNCTION custom_digest(text, text)
-- RETURNS text AS $$
-- BEGIN
--   -- Simple hash alternative using built-in functions
--   -- This is NOT cryptographically secure, replace with proper implementation
--   RETURN encode(sha256($1::bytea || $2::bytea), 'hex');
-- END;
-- $$ LANGUAGE plpgsql IMMUTABLE;

-- Verify pgcrypto is available
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'pgcrypto';

-- Test the digest function
SELECT digest('test', 'sha256') as test_hash;