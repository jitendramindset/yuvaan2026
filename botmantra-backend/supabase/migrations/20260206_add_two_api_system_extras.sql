-- ═══════════════════════════════════════════════════════════════════════════════
-- Two-API System Extras (Missing from Baseline)
-- Created: 2026-02-06
-- Purpose: Add remaining tables, functions, triggers, and views from db-schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- api_logs: Log all API requests and responses
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES public.users(id),
  request_data JSONB,
  response_data JSONB,
  status VARCHAR(50) DEFAULT 'success',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON public.api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON public.api_logs(timestamp DESC);

-- user_roles: Assign roles to users
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Auto-update updated_at timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_vector_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_vector_documents_updated_at
      BEFORE UPDATE ON public.vector_documents
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_ui_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_ui_templates_updated_at
      BEFORE UPDATE ON public.ui_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Views for permission and API usage
CREATE OR REPLACE VIEW public.user_permissions_view AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  r.role_name,
  p.code as permission_code,
  p.description as permission_name,
  p.module,
  p.function
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.id;

CREATE OR REPLACE VIEW public.api_usage_stats AS
SELECT 
  endpoint,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_rate,
  DATE_TRUNC('day', timestamp) as date
FROM public.api_logs
GROUP BY endpoint, DATE_TRUNC('day', timestamp)
ORDER BY date DESC, total_requests DESC;

COMMENT ON TABLE public.api_logs IS 'Logs all API requests for monitoring and debugging';
COMMENT ON TABLE public.user_roles IS 'Maps users to their assigned roles';
