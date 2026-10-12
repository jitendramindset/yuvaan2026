-- Migration: Fix node_health_check function UPDATE issue
-- This fixes the "UPDATE requires a WHERE clause" error
-- Run this in your Supabase SQL editor or database console

-- First, check the current function definition
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'node_health_check';

-- Create a corrected version of the function
CREATE OR REPLACE FUNCTION node_health_check()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  unhealthy_count INTEGER;
  total_nodes INTEGER;
BEGIN
  -- Count unhealthy nodes (example logic - adjust based on your health criteria)
  SELECT COUNT(*) INTO unhealthy_count
  FROM nodes
  WHERE last_seen < NOW() - INTERVAL '5 minutes'
     OR status != 'active';

  -- Count total nodes
  SELECT COUNT(*) INTO total_nodes FROM nodes;

  -- Update health status with proper WHERE clause
  UPDATE system_health
  SET
    healthy_nodes = total_nodes - unhealthy_count,
    unhealthy_nodes = unhealthy_count,
    total_nodes = total_nodes,
    last_check = NOW(),
    status = CASE
      WHEN unhealthy_count = 0 THEN 'healthy'
      WHEN unhealthy_count < total_nodes * 0.1 THEN 'warning'
      ELSE 'critical'
    END
  WHERE id = 1;  -- Assuming there's a single system health record

  -- If no record exists, insert one
  IF NOT FOUND THEN
    INSERT INTO system_health (
      id, healthy_nodes, unhealthy_nodes, total_nodes, last_check, status
    ) VALUES (
      1, total_nodes - unhealthy_count, unhealthy_count, total_nodes, NOW(),
      CASE
        WHEN unhealthy_count = 0 THEN 'healthy'
        WHEN unhealthy_count < total_nodes * 0.1 THEN 'warning'
        ELSE 'critical'
      END
    );
  END IF;

  -- Log the health check
  INSERT INTO system_logs (
    event_type,
    message,
    created_at
  ) VALUES (
    'HEALTH_CHECK',
    format('Health check completed: %s healthy, %s unhealthy out of %s total',
           total_nodes - unhealthy_count, unhealthy_count, total_nodes),
    NOW()
  );
END;
$$;

-- Ensure the system_health table exists
CREATE TABLE IF NOT EXISTS system_health (
  id INTEGER PRIMARY KEY DEFAULT 1,
  healthy_nodes INTEGER DEFAULT 0,
  unhealthy_nodes INTEGER DEFAULT 0,
  total_nodes INTEGER DEFAULT 0,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the system_logs table exists
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);