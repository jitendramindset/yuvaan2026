-- Run these queries in your Supabase SQL Editor to get column definitions
-- Copy each result set and share them so I can map the onboarding flow

-- 1. UI Templates table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ui_templates'
ORDER BY ordinal_position;

-- 2. UI Template Widgets table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ui_template_widgets'
ORDER BY ordinal_position;

-- 3. UI Widget Layouts table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ui_widget_layouts'
ORDER BY ordinal_position;

-- 4. UI Theme Settings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ui_theme_settings'
ORDER BY ordinal_position;

-- 5. UI Context Cache table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ui_context_cache'
ORDER BY ordinal_position;

-- 6. Data Model Registry table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'data_model_registry'
ORDER BY ordinal_position;

-- 7. Business Modules table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'business_modules'
ORDER BY ordinal_position;

-- 8. Business Functions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'business_functions'
ORDER BY ordinal_position;

-- 9. Node Permission table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'node_permission'
ORDER BY ordinal_position;
