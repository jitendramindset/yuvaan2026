-- Add dashboards table for UI persistence

CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  widgets JSONB DEFAULT '[]'::jsonb,
  layout JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_business_id ON dashboards(business_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards(created_at DESC);