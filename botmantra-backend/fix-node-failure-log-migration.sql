-- Migration: Fix node_failure_log table for node_runtime_execute function
-- This fixes the "column created_at does not exist" error
-- Run this in your Supabase SQL editor or database console

-- Add the missing created_at column
ALTER TABLE node_failure_log
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_node_failure_log_created_at
ON node_failure_log(created_at);

-- Update any existing records to have a created_at timestamp
UPDATE node_failure_log
SET created_at = NOW()
WHERE created_at IS NULL;

-- Verify the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'node_failure_log'
AND column_name = 'created_at';