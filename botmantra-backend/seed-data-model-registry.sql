-- ═══════════════════════════════════════════════════════════════════════════════
-- DATA MODEL REGISTRY - SEED DATA FOR SAP MODULES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose: Populate data_model_registry with SAP module tables and fields
-- Modules: Profile, Company, SD, MM, FICO, Inventory, Client, Basic Tables
-- Run in Supabase SQL Editor
-- 
-- Table Schema Reference:
-- - id, business_id, module, table_name, column_name, data_type
-- - column_alt_name, is_nullable, is_primary_key, description
-- - is_ai_enabled, is_vector_enabled, is_system_table
-- - display_name, category, sync_priority, is_active
-- - template_code, is_visible, is_required, is_filterable
-- - display_order, ui_component, default_value, is_system
-- - is_sortable, ui_label, input_type, validation_rule, data_source_id
-- ═══════════════════════════════════════════════════════════════════════════════

-- Clear existing data (optional - comment out if you want to append)
-- DELETE FROM data_model_registry WHERE module IN ('CLIENT', 'PROFILE', 'COMPANY', 'SD', 'MM', 'FICO', 'INVENTORY', 'BASIC');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CLIENT MODULE - Client Master Data
-- ═══════════════════════════════════════════════════════════════════════════════

-- T001 - Company Code (Client Configuration)
INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code, validation_rule
) VALUES
('CLIENT', 'T001', 'BUKRS', 'VARCHAR(4)', 'Company Code', 'Company Code', 'text_input', 'text', 'identification', 'Unique 4-character company code', 1, false, true, true, true, true, true, true, false, 'company_master', '^[A-Z0-9]{4}$'),
('CLIENT', 'T001', 'BUTXT', 'VARCHAR(25)', 'Company Name', 'Company Name', 'text_input', 'text', 'basic_info', 'Full company name', 2, false, false, true, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'ORT01', 'VARCHAR(25)', 'City', 'City', 'text_input', 'text', 'address', 'City where company is located', 3, true, false, false, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'LAND1', 'VARCHAR(3)', 'Country Key', 'Country', 'dropdown', 'select', 'address', 'ISO country code', 4, false, false, true, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'WAERS', 'VARCHAR(5)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Company currency', 5, false, false, true, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'SPRAS', 'VARCHAR(1)', 'Language Key', 'Language', 'dropdown', 'select', 'settings', 'Default language', 6, false, false, true, true, false, false, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'KTOPL', 'VARCHAR(4)', 'Chart of Accounts', 'COA', 'text_input', 'text', 'financial', 'Operational chart of accounts', 7, true, false, false, true, false, false, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'PERIV', 'VARCHAR(2)', 'Fiscal Year Variant', 'FY Variant', 'text_input', 'text', 'financial', 'Fiscal year variant key', 8, true, false, false, true, false, false, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'KOKRS', 'VARCHAR(4)', 'Controlling Area', 'CO Area', 'text_input', 'text', 'controlling', 'Controlling area assignment', 9, true, false, false, true, false, false, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'CREATED_AT', 'TIMESTAMP', 'Created At', 'Created', 'datetime', 'datetime', 'system', 'Record creation timestamp', 99, true, false, false, false, false, true, true, true, 'company_master', NULL),
('CLIENT', 'T001', 'UPDATED_AT', 'TIMESTAMP', 'Updated At', 'Updated', 'datetime', 'datetime', 'system', 'Last update timestamp', 100, true, false, false, false, false, true, true, true, 'company_master', NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. PROFILE MODULE - User Profile Management
-- ═══════════════════════════════════════════════════════════════════════════════

-- USER_PROFILE - User Profile Master
INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('PROFILE', 'USER_PROFILE', 'USER_ID', 'UUID', 'User ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique user identifier', 1, false, true, true, false, false, false, true, true, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'USERNAME', 'VARCHAR(100)', 'Username', 'Username', 'text_input', 'text', 'basic_info', 'Unique username for login', 2, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'EMAIL', 'VARCHAR(255)', 'Email Address', 'Email', 'email_input', 'email', 'basic_info', 'Primary email address', 3, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'FIRST_NAME', 'VARCHAR(100)', 'First Name', 'First Name', 'text_input', 'text', 'basic_info', 'User first name', 4, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'LAST_NAME', 'VARCHAR(100)', 'Last Name', 'Last Name', 'text_input', 'text', 'basic_info', 'User last name', 5, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'PHONE', 'VARCHAR(20)', 'Phone Number', 'Phone', 'phone_input', 'tel', 'contact', 'Contact phone number', 6, true, false, false, true, false, false, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'AVATAR', 'TEXT', 'Profile Picture', 'Avatar', 'image_upload', 'file', 'media', 'Profile image URL or base64', 7, true, false, false, true, false, false, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'BIO', 'TEXT', 'Biography', 'Bio', 'textarea', 'textarea', 'additional', 'User biography or description', 8, true, false, false, true, false, false, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'COMPANY_ID', 'UUID', 'Company', 'Company', 'dropdown', 'select', 'organization', 'Associated company', 9, true, false, false, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'DEPARTMENT', 'VARCHAR(100)', 'Department', 'Department', 'text_input', 'text', 'organization', 'User department', 10, true, false, false, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'ROLE', 'VARCHAR(50)', 'User Role', 'Role', 'dropdown', 'select', 'permissions', 'System role (admin, user, viewer)', 11, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'STATUS', 'VARCHAR(20)', 'Active Status', 'Status', 'toggle', 'checkbox', 'status', 'Account active/inactive', 12, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'LAST_LOGIN', 'TIMESTAMP', 'Last Login', 'Last Login', 'datetime', 'datetime', 'tracking', 'Last login timestamp', 13, true, false, false, true, false, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'CREATED_AT', 'TIMESTAMP', 'Created At', 'Created', 'datetime', 'datetime', 'system', 'Account creation date', 98, true, false, false, false, false, true, true, true, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'UPDATED_AT', 'TIMESTAMP', 'Updated At', 'Updated', 'datetime', 'datetime', 'system', 'Last profile update', 99, true, false, false, false, false, true, true, true, 'user_profile');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. COMPANY MODULE - Company Master Data
-- ═══════════════════════════════════════════════════════════════════════════════

-- COMPANY - Company Master
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, is_searchable, help_text, validation_rules) VALUES
('COMPANY', 'COMPANY_ID', 'UUID', 'hidden', 'Company ID', 1, 'COMPANY', 'company_master', 'identification', true, false, false, 'Unique company identifier', '{}'),
('COMPANY', 'COMPANY_CODE', 'VARCHAR(10)', 'text_input', 'Company Code', 2, 'COMPANY', 'company_master', 'identification', false, false, true, 'Unique company code', '{"pattern": "^[A-Z0-9]{2,10}$"}'),
('COMPANY', 'COMPANY_NAME', 'VARCHAR(255)', 'text_input', 'Company Name', 3, 'COMPANY', 'company_master', 'basic_info', false, false, true, 'Official company name', '{"minLength": 3, "maxLength": 255}'),
('COMPANY', 'LEGAL_NAME', 'VARCHAR(255)', 'text_input', 'Legal Name', 4, 'COMPANY', 'company_master', 'basic_info', false, true, true, 'Legal registered name', '{}'),
('COMPANY', 'INDUSTRY', 'VARCHAR(100)', 'dropdown', 'Industry', 5, 'COMPANY', 'company_master', 'classification', false, true, true, 'Industry sector', '{}'),
('COMPANY', 'COMPANY_SIZE', 'VARCHAR(50)', 'dropdown', 'Company Size', 6, 'COMPANY', 'company_master', 'classification', false, true, false, 'Small/Medium/Large/Enterprise', '{}'),
('COMPANY', 'REGISTRATION_NO', 'VARCHAR(50)', 'text_input', 'Registration Number', 7, 'COMPANY', 'company_master', 'legal', false, true, true, 'Business registration number', '{}'),
('COMPANY', 'TAX_ID', 'VARCHAR(50)', 'text_input', 'Tax ID', 8, 'COMPANY', 'company_master', 'legal', false, true, false, 'Tax identification number', '{}'),
('COMPANY', 'WEBSITE', 'VARCHAR(255)', 'url_input', 'Website', 9, 'COMPANY', 'company_master', 'contact', false, true, false, 'Company website URL', '{"pattern": "^https?://"}'),
('COMPANY', 'EMAIL', 'VARCHAR(255)', 'email_input', 'Email', 10, 'COMPANY', 'company_master', 'contact', false, true, true, 'Primary company email', '{"type": "email"}'),
('COMPANY', 'PHONE', 'VARCHAR(20)', 'phone_input', 'Phone', 11, 'COMPANY', 'company_master', 'contact', false, true, false, 'Main phone number', '{}'),
('COMPANY', 'ADDRESS_LINE1', 'VARCHAR(255)', 'text_input', 'Address Line 1', 12, 'COMPANY', 'company_master', 'address', false, true, false, 'Street address', '{}'),
('COMPANY', 'ADDRESS_LINE2', 'VARCHAR(255)', 'text_input', 'Address Line 2', 13, 'COMPANY', 'company_master', 'address', false, true, false, 'Additional address info', '{}'),
('COMPANY', 'CITY', 'VARCHAR(100)', 'text_input', 'City', 14, 'COMPANY', 'company_master', 'address', false, true, true, 'City name', '{}'),
('COMPANY', 'STATE', 'VARCHAR(100)', 'text_input', 'State/Province', 15, 'COMPANY', 'company_master', 'address', false, true, false, 'State or province', '{}'),
('COMPANY', 'POSTAL_CODE', 'VARCHAR(20)', 'text_input', 'Postal Code', 16, 'COMPANY', 'company_master', 'address', false, true, false, 'ZIP/Postal code', '{}'),
('COMPANY', 'COUNTRY', 'VARCHAR(3)', 'dropdown', 'Country', 17, 'COMPANY', 'company_master', 'address', false, false, true, 'Country code (ISO 3166)', '{}'),
('COMPANY', 'CURRENCY', 'VARCHAR(3)', 'dropdown', 'Base Currency', 18, 'COMPANY', 'company_master', 'financial', false, false, false, 'Default currency (ISO 4217)', '{}'),
('COMPANY', 'FISCAL_YEAR_START', 'VARCHAR(5)', 'text_input', 'Fiscal Year Start', 19, 'COMPANY', 'company_master', 'financial', false, true, false, 'Format: MM-DD', '{"pattern": "^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"}'),
('COMPANY', 'LOGO_URL', 'TEXT', 'image_upload', 'Company Logo', 20, 'COMPANY', 'company_master', 'branding', false, true, false, 'Logo image URL', '{}'),
('COMPANY', 'STATUS', 'VARCHAR(20)', 'toggle', 'Active Status', 21, 'COMPANY', 'company_master', 'status', false, false, true, 'Active/Inactive', '{}'),
('COMPANY', 'CREATED_BY', 'UUID', 'hidden', 'Created By', 97, 'COMPANY', 'company_master', 'system', false, true, false, 'User who created record', '{}'),
('COMPANY', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'COMPANY', 'company_master', 'system', false, true, false, 'Record creation date', '{}'),
('COMPANY', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'COMPANY', 'company_master', 'system', false, true, false, 'Last update date', '{}');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SD MODULE (Sales & Distribution) - Customer Master
-- ═══════════════════════════════════════════════════════════════════════════════

-- KNA1 - Customer Master (General Data)
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, is_searchable, help_text) VALUES
('KNA1', 'KUNNR', 'VARCHAR(10)', 'text_input', 'Customer Number', 1, 'SD', 'customer_master', 'identification', true, false, true, 'Unique customer number'),
('KNA1', 'NAME1', 'VARCHAR(35)', 'text_input', 'Customer Name 1', 2, 'SD', 'customer_master', 'basic_info', false, false, true, 'Customer name line 1'),
('KNA1', 'NAME2', 'VARCHAR(35)', 'text_input', 'Customer Name 2', 3, 'SD', 'customer_master', 'basic_info', false, true, false, 'Customer name line 2'),
('KNA1', 'SORTL', 'VARCHAR(10)', 'text_input', 'Search Term', 4, 'SD', 'customer_master', 'search', false, true, true, 'Search term for customer'),
('KNA1', 'STRAS', 'VARCHAR(35)', 'text_input', 'Street Address', 5, 'SD', 'customer_master', 'address', false, true, false, 'Street and house number'),
('KNA1', 'ORT01', 'VARCHAR(35)', 'text_input', 'City', 6, 'SD', 'customer_master', 'address', false, true, true, 'City name'),
('KNA1', 'PSTLZ', 'VARCHAR(10)', 'text_input', 'Postal Code', 7, 'SD', 'customer_master', 'address', false, true, false, 'Postal/ZIP code'),
('KNA1', 'LAND1', 'VARCHAR(3)', 'dropdown', 'Country', 8, 'SD', 'customer_master', 'address', false, false, true, 'Country key'),
('KNA1', 'REGIO', 'VARCHAR(3)', 'text_input', 'Region', 9, 'SD', 'customer_master', 'address', false, true, false, 'Region/State'),
('KNA1', 'TELF1', 'VARCHAR(16)', 'phone_input', 'Telephone 1', 10, 'SD', 'customer_master', 'contact', false, true, false, 'First telephone number'),
('KNA1', 'TELF2', 'VARCHAR(16)', 'phone_input', 'Telephone 2', 11, 'SD', 'customer_master', 'contact', false, true, false, 'Second telephone number'),
('KNA1', 'SMTP_ADDR', 'VARCHAR(241)', 'email_input', 'Email', 12, 'SD', 'customer_master', 'contact', false, true, true, 'Email address'),
('KNA1', 'KTOKD', 'VARCHAR(4)', 'dropdown', 'Account Group', 13, 'SD', 'customer_master', 'classification', false, false, true, 'Customer account group'),
('KNA1', 'BRSCH', 'VARCHAR(4)', 'dropdown', 'Industry', 14, 'SD', 'customer_master', 'classification', false, true, true, 'Industry sector'),
('KNA1', 'STCEG', 'VARCHAR(20)', 'text_input', 'VAT Number', 15, 'SD', 'customer_master', 'tax', false, true, false, 'VAT registration number'),
('KNA1', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'SD', 'customer_master', 'system', false, true, false, 'Record creation date'),
('KNA1', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'SD', 'customer_master', 'system', false, true, false, 'Last update date');

-- VBAK - Sales Document Header
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, help_text) VALUES
('VBAK', 'VBELN', 'VARCHAR(10)', 'text_input', 'Sales Document', 1, 'SD', 'sales_order', 'identification', true, false, 'Sales document number'),
('VBAK', 'ERDAT', 'DATE', 'date_picker', 'Creation Date', 2, 'SD', 'sales_order', 'dates', false, false, 'Document creation date'),
('VBAK', 'AUART', 'VARCHAR(4)', 'dropdown', 'Order Type', 3, 'SD', 'sales_order', 'classification', false, false, 'Sales document type'),
('VBAK', 'VKORG', 'VARCHAR(4)', 'dropdown', 'Sales Organization', 4, 'SD', 'sales_order', 'organization', false, false, 'Sales organization'),
('VBAK', 'VTWEG', 'VARCHAR(2)', 'dropdown', 'Distribution Channel', 5, 'SD', 'sales_order', 'organization', false, false, 'Distribution channel'),
('VBAK', 'SPART', 'VARCHAR(2)', 'dropdown', 'Division', 6, 'SD', 'sales_order', 'organization', false, false, 'Division'),
('VBAK', 'KUNNR', 'VARCHAR(10)', 'text_input', 'Sold-to Party', 7, 'SD', 'sales_order', 'customer', false, false, 'Customer number'),
('VBAK', 'WAERK', 'VARCHAR(5)', 'dropdown', 'Currency', 8, 'SD', 'sales_order', 'financial', false, false, 'Document currency'),
('VBAK', 'VKBUR', 'VARCHAR(4)', 'dropdown', 'Sales Office', 9, 'SD', 'sales_order', 'organization', false, true, 'Sales office'),
('VBAK', 'VKGRP', 'VARCHAR(3)', 'dropdown', 'Sales Group', 10, 'SD', 'sales_order', 'organization', false, true, 'Sales group'),
('VBAK', 'NETWR', 'DECIMAL(15,2)', 'number_input', 'Net Value', 11, 'SD', 'sales_order', 'financial', false, true, 'Net order value'),
('VBAK', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'SD', 'sales_order', 'system', false, true, 'Record creation timestamp'),
('VBAK', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'SD', 'sales_order', 'system', false, true, 'Last update timestamp');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. MM MODULE (Materials Management) - Material Master
-- ═══════════════════════════════════════════════════════════════════════════════

-- MARA - Material Master (General Data)
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, is_searchable, help_text) VALUES
('MARA', 'MATNR', 'VARCHAR(18)', 'text_input', 'Material Number', 1, 'MM', 'material_master', 'identification', true, false, true, 'Unique material number'),
('MARA', 'MAKTX', 'VARCHAR(40)', 'text_input', 'Material Description', 2, 'MM', 'material_master', 'basic_info', false, false, true, 'Short description'),
('MARA', 'MTART', 'VARCHAR(4)', 'dropdown', 'Material Type', 3, 'MM', 'material_master', 'classification', false, false, true, 'Type (ROH, HALB, FERT, etc.)'),
('MARA', 'MBRSH', 'VARCHAR(1)', 'dropdown', 'Industry Sector', 4, 'MM', 'material_master', 'classification', false, true, false, 'Industry sector'),
('MARA', 'MEINS', 'VARCHAR(3)', 'dropdown', 'Base Unit of Measure', 5, 'MM', 'material_master', 'units', false, false, false, 'Base UoM (EA, KG, etc.)'),
('MARA', 'MATKL', 'VARCHAR(9)', 'dropdown', 'Material Group', 6, 'MM', 'material_master', 'classification', false, true, true, 'Material group'),
('MARA', 'BISMT', 'VARCHAR(18)', 'text_input', 'Old Material Number', 7, 'MM', 'material_master', 'reference', false, true, true, 'Legacy material number'),
('MARA', 'BRGEW', 'DECIMAL(13,3)', 'number_input', 'Gross Weight', 8, 'MM', 'material_master', 'physical', false, true, false, 'Gross weight'),
('MARA', 'NTGEW', 'DECIMAL(13,3)', 'number_input', 'Net Weight', 9, 'MM', 'material_master', 'physical', false, true, false, 'Net weight'),
('MARA', 'GEWEI', 'VARCHAR(3)', 'dropdown', 'Weight Unit', 10, 'MM', 'material_master', 'physical', false, true, false, 'Unit of weight'),
('MARA', 'VOLUM', 'DECIMAL(13,3)', 'number_input', 'Volume', 11, 'MM', 'material_master', 'physical', false, true, false, 'Volume'),
('MARA', 'VOLEH', 'VARCHAR(3)', 'dropdown', 'Volume Unit', 12, 'MM', 'material_master', 'physical', false, true, false, 'Unit of volume'),
('MARA', 'SPART', 'VARCHAR(2)', 'dropdown', 'Division', 13, 'MM', 'material_master', 'organization', false, true, false, 'Division'),
('MARA', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'MM', 'material_master', 'system', false, true, false, 'Record creation date'),
('MARA', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'MM', 'material_master', 'system', false, true, false, 'Last update date');

-- EKKO - Purchase Order Header
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, help_text) VALUES
('EKKO', 'EBELN', 'VARCHAR(10)', 'text_input', 'Purchase Order', 1, 'MM', 'purchase_order', 'identification', true, false, 'PO number'),
('EKKO', 'BUKRS', 'VARCHAR(4)', 'dropdown', 'Company Code', 2, 'MM', 'purchase_order', 'organization', false, false, 'Company code'),
('EKKO', 'BSTYP', 'VARCHAR(1)', 'dropdown', 'Document Category', 3, 'MM', 'purchase_order', 'classification', false, false, 'PO category'),
('EKKO', 'BSART', 'VARCHAR(4)', 'dropdown', 'Document Type', 4, 'MM', 'purchase_order', 'classification', false, false, 'PO type'),
('EKKO', 'AEDAT', 'DATE', 'date_picker', 'Creation Date', 5, 'MM', 'purchase_order', 'dates', false, false, 'Date created'),
('EKKO', 'LIFNR', 'VARCHAR(10)', 'text_input', 'Vendor', 6, 'MM', 'purchase_order', 'vendor', false, true, 'Vendor number'),
('EKKO', 'EKORG', 'VARCHAR(4)', 'dropdown', 'Purchasing Organization', 7, 'MM', 'purchase_order', 'organization', false, false, 'Purch. org'),
('EKKO', 'EKGRP', 'VARCHAR(3)', 'dropdown', 'Purchasing Group', 8, 'MM', 'purchase_order', 'organization', false, false, 'Purchasing group'),
('EKKO', 'WAERS', 'VARCHAR(5)', 'dropdown', 'Currency', 9, 'MM', 'purchase_order', 'financial', false, false, 'Document currency'),
('EKKO', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'MM', 'purchase_order', 'system', false, true, 'Record creation timestamp'),
('EKKO', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'MM', 'purchase_order', 'system', false, true, 'Last update timestamp');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. FICO MODULE (Finance & Controlling) - GL Accounts
-- ═══════════════════════════════════════════════════════════════════════════════

-- SKA1 - G/L Account Master (Chart of Accounts)
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, is_searchable, help_text) VALUES
('SKA1', 'KTOPL', 'VARCHAR(4)', 'text_input', 'Chart of Accounts', 1, 'FICO', 'gl_account', 'identification', true, false, true, 'Chart of accounts'),
('SKA1', 'SAKNR', 'VARCHAR(10)', 'text_input', 'G/L Account', 2, 'FICO', 'gl_account', 'identification', true, false, true, 'GL account number'),
('SKA1', 'TXT20', 'VARCHAR(20)', 'text_input', 'Short Text', 3, 'FICO', 'gl_account', 'description', false, true, true, 'Short description'),
('SKA1', 'TXT50', 'VARCHAR(50)', 'text_input', 'Long Text', 4, 'FICO', 'gl_account', 'description', false, true, true, 'Long description'),
('SKA1', 'KTOKS', 'VARCHAR(4)', 'dropdown', 'Account Group', 5, 'FICO', 'gl_account', 'classification', false, false, true, 'GL account group'),
('SKA1', 'XBILK', 'VARCHAR(1)', 'toggle', 'Balance Sheet Account', 6, 'FICO', 'gl_account', 'properties', false, true, false, 'Balance sheet indicator'),
('SKA1', 'GVTYP', 'VARCHAR(2)', 'dropdown', 'P&L Statement Account', 7, 'FICO', 'gl_account', 'properties', false, true, false, 'P&L account type'),
('SKA1', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'FICO', 'gl_account', 'system', false, true, false, 'Record creation date'),
('SKA1', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'FICO', 'gl_account', 'system', false, true, false, 'Last update date');

-- BSEG - Accounting Document Segment
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, help_text) VALUES
('BSEG', 'BUKRS', 'VARCHAR(4)', 'dropdown', 'Company Code', 1, 'FICO', 'accounting_doc', 'identification', true, false, 'Company code'),
('BSEG', 'BELNR', 'VARCHAR(10)', 'text_input', 'Document Number', 2, 'FICO', 'accounting_doc', 'identification', true, false, 'Accounting document number'),
('BSEG', 'GJAHR', 'VARCHAR(4)', 'number_input', 'Fiscal Year', 3, 'FICO', 'accounting_doc', 'identification', true, false, 'Fiscal year'),
('BSEG', 'BUZEI', 'VARCHAR(3)', 'number_input', 'Line Item', 4, 'FICO', 'accounting_doc', 'identification', true, false, 'Line item number'),
('BSEG', 'KOART', 'VARCHAR(1)', 'dropdown', 'Account Type', 5, 'FICO', 'accounting_doc', 'classification', false, false, 'S=GL, D=Customer, K=Vendor'),
('BSEG', 'HKONT', 'VARCHAR(10)', 'text_input', 'G/L Account', 6, 'FICO', 'accounting_doc', 'account', false, true, 'General ledger account'),
('BSEG', 'DMBTR', 'DECIMAL(23,2)', 'number_input', 'Amount in LC', 7, 'FICO', 'accounting_doc', 'amounts', false, true, 'Amount in local currency'),
('BSEG', 'WRBTR', 'DECIMAL(23,2)', 'number_input', 'Amount in DC', 8, 'FICO', 'accounting_doc', 'amounts', false, true, 'Amount in document currency'),
('BSEG', 'SHKZG', 'VARCHAR(1)', 'dropdown', 'Debit/Credit', 9, 'FICO', 'accounting_doc', 'posting', false, false, 'Debit/Credit indicator'),
('BSEG', 'SGTXT', 'VARCHAR(50)', 'text_input', 'Item Text', 10, 'FICO', 'accounting_doc', 'description', false, true, 'Line item text'),
('BSEG', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'FICO', 'accounting_doc', 'system', false, true, 'Record creation timestamp'),
('BSEG', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'FICO', 'accounting_doc', 'system', false, true, 'Last update timestamp');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. INVENTORY MODULE - Stock Management
-- ═══════════════════════════════════════════════════════════════════════════════

-- MARD - Storage Location Data
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, is_searchable, help_text) VALUES
('MARD', 'MATNR', 'VARCHAR(18)', 'text_input', 'Material Number', 1, 'INVENTORY', 'stock_data', 'identification', true, false, true, 'Material number'),
('MARD', 'WERKS', 'VARCHAR(4)', 'dropdown', 'Plant', 2, 'INVENTORY', 'stock_data', 'location', true, false, true, 'Plant'),
('MARD', 'LGORT', 'VARCHAR(4)', 'dropdown', 'Storage Location', 3, 'INVENTORY', 'stock_data', 'location', true, false, true, 'Storage location'),
('MARD', 'LABST', 'DECIMAL(13,3)', 'number_input', 'Unrestricted Stock', 4, 'INVENTORY', 'stock_data', 'quantities', false, true, false, 'Unrestricted-use stock'),
('MARD', 'INSME', 'DECIMAL(13,3)', 'number_input', 'Quality Inspection', 5, 'INVENTORY', 'stock_data', 'quantities', false, true, false, 'Stock in quality inspection'),
('MARD', 'SPEME', 'DECIMAL(13,3)', 'number_input', 'Blocked Stock', 6, 'INVENTORY', 'stock_data', 'quantities', false, true, false, 'Blocked stock'),
('MARD', 'EINME', 'VARCHAR(3)', 'dropdown', 'Unit of Entry', 7, 'INVENTORY', 'stock_data', 'units', false, true, false, 'Unit of measure'),
('MARD', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'INVENTORY', 'stock_data', 'system', false, true, false, 'Record creation date'),
('MARD', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'INVENTORY', 'stock_data', 'system', false, true, false, 'Last update date');

-- STOCK_MOVEMENT - Inventory Movements
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, help_text) VALUES
('STOCK_MOVEMENT', 'MOVEMENT_ID', 'UUID', 'hidden', 'Movement ID', 1, 'INVENTORY', 'stock_movement', 'identification', true, false, 'Unique movement ID'),
('STOCK_MOVEMENT', 'MATERIAL_ID', 'UUID', 'dropdown', 'Material', 2, 'INVENTORY', 'stock_movement', 'material', false, false, 'Material reference'),
('STOCK_MOVEMENT', 'MOVEMENT_TYPE', 'VARCHAR(3)', 'dropdown', 'Movement Type', 3, 'INVENTORY', 'stock_movement', 'classification', false, false, '101=GR, 601=GI, etc.'),
('STOCK_MOVEMENT', 'QUANTITY', 'DECIMAL(13,3)', 'number_input', 'Quantity', 4, 'INVENTORY', 'stock_movement', 'quantity', false, false, 'Movement quantity'),
('STOCK_MOVEMENT', 'UNIT', 'VARCHAR(3)', 'dropdown', 'Unit', 5, 'INVENTORY', 'stock_movement', 'quantity', false, false, 'Unit of measure'),
('STOCK_MOVEMENT', 'FROM_LOCATION', 'VARCHAR(10)', 'dropdown', 'From Location', 6, 'INVENTORY', 'stock_movement', 'location', false, true, 'Source location'),
('STOCK_MOVEMENT', 'TO_LOCATION', 'VARCHAR(10)', 'dropdown', 'To Location', 7, 'INVENTORY', 'stock_movement', 'location', false, true, 'Destination location'),
('STOCK_MOVEMENT', 'MOVEMENT_DATE', 'DATE', 'date_picker', 'Movement Date', 8, 'INVENTORY', 'stock_movement', 'dates', false, false, 'Date of movement'),
('STOCK_MOVEMENT', 'REFERENCE_DOC', 'VARCHAR(20)', 'text_input', 'Reference Document', 9, 'INVENTORY', 'stock_movement', 'reference', false, true, 'PO/SO/TO number'),
('STOCK_MOVEMENT', 'CREATED_BY', 'UUID', 'hidden', 'Created By', 97, 'INVENTORY', 'stock_movement', 'system', false, true, 'User who created'),
('STOCK_MOVEMENT', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'INVENTORY', 'stock_movement', 'system', false, true, 'Creation timestamp'),
('STOCK_MOVEMENT', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'INVENTORY', 'stock_movement', 'system', false, true, 'Update timestamp');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. BASIC TABLES - Common/Shared Data
-- ═══════════════════════════════════════════════════════════════════════════════

-- T005 - Countries
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, help_text) VALUES
('T005', 'LAND1', 'VARCHAR(3)', 'text_input', 'Country Key', 1, 'BASIC', 'countries', 'identification', true, false, 'ISO country code'),
('T005', 'LANDX', 'VARCHAR(15)', 'text_input', 'Country Name', 2, 'BASIC', 'countries', 'description', false, false, 'Country name (short)'),
('T005', 'NATIO', 'VARCHAR(15)', 'text_input', 'Nationality', 3, 'BASIC', 'countries', 'description', false, true, 'Nationality designation'),
('T005', 'LANDK', 'VARCHAR(1)', 'text_input', 'Vehicle Country Key', 4, 'BASIC', 'countries', 'additional', false, true, 'International vehicle code'),
('T005', 'INTCA', 'VARCHAR(3)', 'text_input', 'ISO Code', 5, 'BASIC', 'countries', 'identification', false, true, 'ISO 3166 alpha-3 code'),
('T005', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'BASIC', 'countries', 'system', false, true, 'Record creation date'),
('T005', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'BASIC', 'countries', 'system', false, true, 'Last update date');

-- T001W - Plants/Warehouses
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, help_text) VALUES
('T001W', 'WERKS', 'VARCHAR(4)', 'text_input', 'Plant', 1, 'BASIC', 'plant_master', 'identification', true, false, 'Plant code'),
('T001W', 'NAME1', 'VARCHAR(30)', 'text_input', 'Plant Name', 2, 'BASIC', 'plant_master', 'basic_info', false, false, 'Plant name'),
('T001W', 'BWKEY', 'VARCHAR(4)', 'text_input', 'Valuation Area', 3, 'BASIC', 'plant_master', 'accounting', false, false, 'Valuation area'),
('T001W', 'LAND1', 'VARCHAR(3)', 'dropdown', 'Country', 4, 'BASIC', 'plant_master', 'location', false, false, 'Country key'),
('T001W', 'REGIO', 'VARCHAR(3)', 'text_input', 'Region', 5, 'BASIC', 'plant_master', 'location', false, true, 'Region/State'),
('T001W', 'STRAS', 'VARCHAR(30)', 'text_input', 'Street', 6, 'BASIC', 'plant_master', 'address', false, true, 'Street address'),
('T001W', 'ORT01', 'VARCHAR(25)', 'text_input', 'City', 7, 'BASIC', 'plant_master', 'address', false, true, 'City'),
('T001W', 'PSTLZ', 'VARCHAR(10)', 'text_input', 'Postal Code', 8, 'BASIC', 'plant_master', 'address', false, true, 'Postal code'),
('T001W', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'BASIC', 'plant_master', 'system', false, true, 'Record creation date'),
('T001W', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'BASIC', 'plant_master', 'system', false, true, 'Last update date');

-- TCURC - Currency Codes
INSERT INTO data_model_registry (table_name, column_name, data_type, widget_type, display_name, display_order, module_name, template_code, field_group, is_primary_key, is_nullable, help_text) VALUES
('TCURC', 'WAERS', 'VARCHAR(5)', 'text_input', 'Currency Key', 1, 'BASIC', 'currencies', 'identification', true, false, 'Currency code (ISO 4217)'),
('TCURC', 'LTEXT', 'VARCHAR(40)', 'text_input', 'Long Text', 2, 'BASIC', 'currencies', 'description', false, false, 'Currency name'),
('TCURC', 'KTEXT', 'VARCHAR(20)', 'text_input', 'Short Text', 3, 'BASIC', 'currencies', 'description', false, true, 'Currency short name'),
('TCURC', 'ISOCD', 'VARCHAR(3)', 'text_input', 'ISO Code', 4, 'BASIC', 'currencies', 'identification', false, true, 'ISO currency code'),
('TCURC', 'ALTWR', 'VARCHAR(3)', 'text_input', 'Alternative Code', 5, 'BASIC', 'currencies', 'additional', false, true, 'Alternative currency key'),
('TCURC', 'CREATED_AT', 'TIMESTAMP', 'datetime', 'Created At', 98, 'BASIC', 'currencies', 'system', false, true, 'Record creation date'),
('TCURC', 'UPDATED_AT', 'TIMESTAMP', 'datetime', 'Updated At', 99, 'BASIC', 'currencies', 'system', false, true, 'Last update date');

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETION SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  total_records INTEGER;
  by_module RECORD;
BEGIN
  -- Count total records
  SELECT COUNT(*) INTO total_records FROM data_model_registry;
  
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DATA MODEL REGISTRY SEED COMPLETE';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total Records Inserted: %', total_records;
  RAISE NOTICE '';
  RAISE NOTICE 'Records by Module:';
  
  -- Count by module
  FOR by_module IN 
    SELECT module_name, COUNT(*) as count 
    FROM data_model_registry 
    GROUP BY module_name 
    ORDER BY module_name
  LOOP
    RAISE NOTICE '  • % : % fields', by_module.module_name, by_module.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  • CLIENT: T001 (Company Code)';
  RAISE NOTICE '  • PROFILE: USER_PROFILE';
  RAISE NOTICE '  • COMPANY: COMPANY (Master Data)';
  RAISE NOTICE '  • SD: KNA1 (Customer), VBAK (Sales Order)';
  RAISE NOTICE '  • MM: MARA (Material), EKKO (Purchase Order)';
  RAISE NOTICE '  • FICO: SKA1 (GL Account), BSEG (Accounting Doc)';
  RAISE NOTICE '  • INVENTORY: MARD (Stock), STOCK_MOVEMENT';
  RAISE NOTICE '  • BASIC: T005 (Countries), T001W (Plants), TCURC (Currencies)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
