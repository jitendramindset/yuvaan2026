-- Verify All Required Tables Exist for Onboarding Flow
-- Run this in your Supabase SQL Editor to check if tables are created

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('users'),
    ('core_node'),
    ('onboarding_session'),
    ('node_selected_fields'),
    ('data_model_registry'),
    ('business_modules'),
    ('business_functions'),
    ('node_module_config'),
    ('ui_templates'),
    ('ui_template_widgets'),
    ('ui_widget_layouts'),
    ('ui_theme_settings'),
    ('node_permission')
) AS required_tables(table_name)
ORDER BY status, table_name;

-- Check core_node table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'core_node'
ORDER BY ordinal_position;

-- Check users table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
