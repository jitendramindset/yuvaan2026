-- Migration: Implement missing trigger functions
-- This creates auto_attach_node_key and cache_node_update triggers
-- Run this in your Supabase SQL editor or database console

-- Function: auto_attach_node_key
-- Automatically attaches API keys to new nodes
CREATE OR REPLACE FUNCTION auto_attach_node_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Attach a default API key to new nodes
  INSERT INTO node_api_keys (
    nid,
    key_name,
    key_value,
    permissions,
    created_at,
    active
  ) VALUES (
    NEW.nid,
    'default_key',
    encode(gen_random_bytes(32), 'hex'),
    '{"read": true, "write": true, "execute": true}'::jsonb,
    NOW(),
    true
  );

  -- Log the key attachment
  INSERT INTO node_logs (
    nid,
    event_type,
    message,
    created_at
  ) VALUES (
    NEW.nid,
    'KEY_ATTACHED',
    'Default API key automatically attached to new node',
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Function: cache_node_update
-- Updates cache when node data changes
CREATE OR REPLACE FUNCTION cache_node_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update node cache
  INSERT INTO node_cache (
    nid,
    cache_key,
    cache_value,
    last_updated
  ) VALUES (
    COALESCE(NEW.nid, OLD.nid),
    'node_data',
    row_to_json(NEW)::text,
    NOW()
  )
  ON CONFLICT (nid, cache_key)
  DO UPDATE SET
    cache_value = EXCLUDED.cache_value,
    last_updated = EXCLUDED.last_updated;

  -- Invalidate related caches
  DELETE FROM node_cache
  WHERE nid = COALESCE(NEW.nid, OLD.nid)
    AND cache_key LIKE 'computed_%'
    AND last_updated < NOW() - INTERVAL '1 hour';

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the required tables if they don't exist
CREATE TABLE IF NOT EXISTS node_api_keys (
  id SERIAL PRIMARY KEY,
  nid TEXT NOT NULL REFERENCES nodes(nid),
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  UNIQUE(nid, key_name)
);

CREATE TABLE IF NOT EXISTS node_cache (
  id SERIAL PRIMARY KEY,
  nid TEXT NOT NULL REFERENCES nodes(nid),
  cache_key TEXT NOT NULL,
  cache_value TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nid, cache_key)
);

CREATE TABLE IF NOT EXISTS node_logs (
  id SERIAL PRIMARY KEY,
  nid TEXT REFERENCES nodes(nid),
  event_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_node_api_keys_nid ON node_api_keys(nid);
CREATE INDEX IF NOT EXISTS idx_node_cache_nid ON node_cache(nid);
CREATE INDEX IF NOT EXISTS idx_node_cache_key ON node_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_node_logs_nid ON node_logs(nid);
CREATE INDEX IF NOT EXISTS idx_node_logs_event_type ON node_logs(event_type);

-- Create the triggers
DROP TRIGGER IF EXISTS trigger_auto_attach_node_key ON nodes;
CREATE TRIGGER trigger_auto_attach_node_key
  AFTER INSERT ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION auto_attach_node_key();

DROP TRIGGER IF EXISTS trigger_cache_node_update ON nodes;
CREATE TRIGGER trigger_cache_node_update
  AFTER INSERT OR UPDATE OR DELETE ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION cache_node_update();

-- Test the triggers by checking if they exist
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_auto_attach_node_key', 'trigger_cache_node_update');