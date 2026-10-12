-- Migration: Fix node_event_ingest function encryption issue
-- This addresses the "Missing encryption key" error
-- Run this in your Supabase SQL editor or database console

-- Option 1: Add encryption key to database (if encryption is required)
-- INSERT INTO encryption_keys (key_name, key_value, created_at)
-- VALUES ('node_event_key', 'your-encryption-key-here', NOW())
-- ON CONFLICT (key_name) DO NOTHING;

-- Option 2: Modify the function to work without encryption
-- Check the current function definition first:
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'node_event_ingest';

-- Alternative: Create a simplified version without encryption
CREATE OR REPLACE FUNCTION node_event_ingest_fixed(
  p_nid text,
  p_action text,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert event without encryption (simplified version)
  INSERT INTO node_events (
    nid,
    action,
    payload,
    created_at,
    processed
  ) VALUES (
    p_nid,
    p_action,
    p_payload,
    NOW(),
    false
  );

  -- Log the event ingestion
  INSERT INTO node_logs (
    nid,
    event_type,
    message,
    created_at
  ) VALUES (
    p_nid,
    'EVENT_INGEST',
    'Event ingested: ' || p_action,
    NOW()
  );
END;
$$;

-- Option 3: If you want to keep encryption, ensure the key exists
-- This assumes you have an encryption_keys table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'encryption_keys') THEN
    CREATE TABLE encryption_keys (
      id SERIAL PRIMARY KEY,
      key_name TEXT UNIQUE NOT NULL,
      key_value TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      active BOOLEAN DEFAULT true
    );
  END IF;
END $$;

-- Insert a default encryption key if needed
INSERT INTO encryption_keys (key_name, key_value)
VALUES ('node_event_key', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key_name) DO NOTHING;