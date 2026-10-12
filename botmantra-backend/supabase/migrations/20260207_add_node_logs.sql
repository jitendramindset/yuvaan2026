-- Add node_logs table for node core audit and broadcast logging

CREATE TABLE IF NOT EXISTS node_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References (nullable for broadcast-only logs)
  node_id UUID NULL,
  user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Node core identifiers (used by broadcast API)
  nid_hash TEXT,

  -- Event tracking (used by Karma/Dharma + interaction classifier)
  event_type VARCHAR(50),
  event_action VARCHAR(100),
  description TEXT,
  query_text TEXT,
  action_payload JSONB,

  -- Broadcast logging (used by /api/nodes/broadcast)
  action TEXT,
  broadcast_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Result status
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Context at time of event
  karma_score_at_time INT,
  dharma_alignment_at_time INT,
  access_level_at_time VARCHAR(50),

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_node_logs_node_id ON node_logs(node_id);
CREATE INDEX IF NOT EXISTS idx_node_logs_user_id ON node_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_node_logs_created_at ON node_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_node_logs_event_type ON node_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_node_logs_nid_hash ON node_logs(nid_hash);
CREATE INDEX IF NOT EXISTS idx_node_logs_node_user_created ON node_logs(node_id, user_id, created_at DESC);