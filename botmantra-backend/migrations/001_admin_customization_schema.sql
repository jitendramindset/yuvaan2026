/**
 * Database Migration - Admin Customization Schema
 * 
 * Creates tables for:
 * - UI customization settings
 * - Custom widgets
 * - Widget layouts
 * - Admin audit logs
 * - User roles
 */

-- User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- UI Customization Table
CREATE TABLE IF NOT EXISTS public.ui_customization (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  colors JSONB DEFAULT '{
    "primary": "#667eea",
    "secondary": "#764ba2",
    "accent": "#fbbf24",
    "background": "#0f0c29",
    "success": "#10b981",
    "warning": "#f59e0b",
    "danger": "#ef4444"
  }'::jsonb,
  layout JSONB DEFAULT '{}'::jsonb,
  active_layout_id UUID,
  custom_css TEXT,
  custom_js TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Custom Widgets Table
CREATE TABLE IF NOT EXISTS public.custom_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL CHECK (type IN ('chart', 'stats', 'table', 'form', 'custom')),
  description TEXT,
  icon VARCHAR(100),
  config JSONB DEFAULT '{}'::jsonb,
  default_size JSONB DEFAULT '{"width": 300, "height": 300}'::jsonb,
  "order" INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_widget_name UNIQUE(organization_id, name)
);

-- Widget Layouts Table
CREATE TABLE IF NOT EXISTS public.ui_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  widgets JSONB DEFAULT '[]'::jsonb,
  grid_config JSONB DEFAULT '{"columns": 3, "gap": 16}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_layout_name UNIQUE(organization_id, name)
);

-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL CHECK (action IN (
    'UPDATE_THEME_COLORS',
    'CREATE_WIDGET',
    'UPDATE_WIDGET',
    'DELETE_WIDGET',
    'SAVE_LAYOUT',
    'APPLY_LAYOUT',
    'REORDER_WIDGETS',
    'UPDATE_SETTINGS',
    'DELETE_LAYOUT'
  )),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_custom_widgets_org_id ON public.custom_widgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_widgets_created_by ON public.custom_widgets(created_by);
CREATE INDEX IF NOT EXISTS idx_ui_layouts_org_id ON public.ui_layouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_ui_layouts_created_by ON public.ui_layouts(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ui_customization_org_id ON public.ui_customization(organization_id);

-- Row Level Security Policies

-- User Roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Custom Widgets RLS
ALTER TABLE public.custom_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization widgets"
  ON public.custom_widgets FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Admins can modify widgets"
  ON public.custom_widgets FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can update widgets"
  ON public.custom_widgets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete widgets"
  ON public.custom_widgets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- UI Customization RLS
ALTER TABLE public.ui_customization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization customization"
  ON public.ui_customization FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Admins can update customization"
  ON public.ui_customization FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- UI Layouts RLS
ALTER TABLE public.ui_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization layouts"
  ON public.ui_layouts FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Admins can create layouts"
  ON public.ui_layouts FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can update layouts"
  ON public.ui_layouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete layouts"
  ON public.ui_layouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Admin Audit Logs RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can create audit logs"
  ON public.admin_audit_logs FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
